import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { Projects } from "../../../../server/projects/projects";
import { readBundle } from "../../../../server/projects/bundle";
import { parseCommand, type Command, type Mutation } from "../../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../../shared/document/model";
import { sourceEvidence } from "../../../support/editor-evidence";
import { arcFixture } from "../../../solver/fixtures";
import { nodeFixture, penEdit } from "./fixtures";

const projects = new Projects();
projects.create();
const checks: string[] = [];
const inputs: unknown[] = [];
const directory = "artifacts/pen-data";
await mkdir(directory, { recursive: true });

function current(): DesignDocument {
  const project = projects.snapshot().projects[0];
  assert.ok(project);
  return structuredClone(project.document);
}

function envelope(
  mutation: unknown,
  revision = current().revision,
  commandId: string = crypto.randomUUID(),
): Command {
  const input = { projectId: current().id, commandId, expectedRevision: revision, mutation };
  inputs.push(input);
  return parseCommand(input);
}

async function send(mutation: unknown): Promise<void> {
  await projects.execute(envelope(mutation));
}

async function refused(mutation: unknown, message: RegExp): Promise<void> {
  const before = JSON.stringify(projects.snapshot());
  await assert.rejects(() => send(mutation), message);
  assert.equal(
    JSON.stringify(projects.snapshot()),
    before,
    "A rejected command changed document/history/save state.",
  );
}

function frame(id: string, children: string[], parentId: string | null = null): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children,
    visible: true,
    locked: false,
    kind: "frame",
    mode: "inherit",
    clipContent: false,
    attributes: {},
    style: { width: "400px", height: "300px" },
  };
}

async function atomicHistory(): Promise<void> {
  const node = { ...nodeFixture(), parentId: "parent" };
  await send({
    kind: "insert",
    nodes: [frame("parent", [node.id, "peer"]), node, frame("peer", [], "parent")],
  });
  const before = current();
  const next = nodeFixture(arcFixture(-1));
  next.style.left = "70px";
  next.style.top = "80px";
  next.style.transform = "rotate(17deg)";
  const mutation: Mutation = {
    kind: "batch",
    mutations: [penEdit(next), { kind: "style", id: "peer", values: { width: "220px" } }],
  };
  const command = envelope(mutation);
  await projects.execute(command);
  const after = current();
  assert.equal(after.revision, before.revision + 1);
  assert.deepEqual(after.nodes[node.id], { ...next, parentId: "parent" });
  assert.equal(after.nodes.peer.style.width, "220px");
  projects.history(after.id, after.revision, "undo");
  assert.deepEqual(current().nodes, before.nodes);
  projects.history(after.id, current().revision, "redo");
  assert.deepEqual(current().nodes, after.nodes);
  await retry(command);
  checks.push(
    "complete geometry/public attributes/style/peer write is one revision and one exact Undo/Redo entry; idempotent retry",
  );
}

async function retry(command: Command): Promise<void> {
  const unchanged = JSON.stringify(projects.snapshot());
  await projects.execute(command);
  assert.equal(
    JSON.stringify(projects.snapshot()),
    unchanged,
    "Retry published duplicate history.",
  );
  await assert.rejects(
    () =>
      projects.execute({
        ...command,
        mutation: { kind: "rename", id: "pen-node", name: "different" },
      }),
    /identity/u,
  );
  assert.equal(JSON.stringify(projects.snapshot()), unchanged);
}

async function malformedAndStale(): Promise<void> {
  const edit = penEdit(nodeFixture());
  await refused({ ...edit, source: '<svg><path d="M 0 0 L 1 0"/></svg>' }, /does not match/u);
  await refused({ ...edit, attributes: { ...edit.attributes, viewBox: "0 0 1 1" } }, /viewBox/u);
  await refused({ ...edit, pen: { ...edit.pen, version: 2 } }, /version/u);
  await refused({ ...edit, solved: true }, /Unsupported pen edit field/u);
  for (const width of ["auto", "0px", "1e999px", "100%"])
    await refused({ ...edit, style: { ...edit.style, width } }, /Fixed/u);
  const before = JSON.stringify(projects.snapshot());
  const stale = envelope(edit, 0);
  await assert.rejects(() => projects.execute(stale), /changed/u);
  assert.equal(JSON.stringify(projects.snapshot()), before);
  const reused = envelope(edit, current().revision, stale.commandId);
  await projects.execute(reused);
  assert.equal(current().revision, JSON.parse(before).projects[0].document.revision + 1);
  const typed = { ...envelope(edit), mutation: { ...edit, source: "<svg/>" } };
  const prior = JSON.stringify(projects.snapshot());
  await assert.rejects(() => projects.execute(typed), /does not match/u);
  assert.equal(
    JSON.stringify(projects.snapshot()),
    prior,
    "Typed caller bypassed semantic validation.",
  );
  checks.push(
    "malformed, mismatched, untrusted solved flag, non-Fixed, stale and typed-bypass candidates preserve prior state",
  );
}

async function locks(): Promise<void> {
  const edit = penEdit(nodeFixture(arcFixture()));
  await send({ kind: "lock", id: "peer", locked: true });
  await refused(
    { kind: "batch", mutations: [edit, { kind: "style", id: "peer", values: { height: "90px" } }] },
    /Unlock/u,
  );
  await send({ kind: "lock", id: "peer", locked: false });
  await send({ kind: "lock", id: "parent", locked: true });
  await refused(edit, /Unlock/u);
  await send({ kind: "lock", id: "parent", locked: false });
  await send({ kind: "lock", id: "pen-node", locked: true });
  await refused(edit, /Unlock/u);
  await send({ kind: "lock", id: "pen-node", locked: false });
  await refused({ ...edit, id: "peer" }, /no editable pen record/u);
  checks.push(
    "own/inherited locks and actual dependent peer locks reject the entire command; arbitrary nodes cannot adopt a pen record",
  );
}

async function persistence(): Promise<void> {
  const temporary = await mkdtemp(join(directory, "bundle-"));
  await projects.saveAs(current().id, temporary, "Pen data");
  const saved = projects.snapshot().projects[0];
  assert.ok(saved?.path);
  const folder = saved.path;
  assert.deepEqual(await readBundle(saved.path), current());
  const reopened = new Projects();
  await projects.close(current().id, false);
  await reopened.load(saved.path);
  assert.deepEqual(reopened.snapshot().projects[0]?.document, saved.document);
  await reopened.close(saved.document.id, false);
  const path = join(saved.path, "document.json");
  const bytes = await readFile(path, "utf8");
  const malformed = JSON.parse(bytes);
  malformed.nodes["pen-node"].pen.version = 999;
  const invalidBytes = JSON.stringify(malformed);
  await writeFile(path, invalidBytes);
  const refusing = new Projects();
  refusing.create();
  const before = JSON.stringify(refusing.snapshot());
  await assert.rejects(() => refusing.load(folder), /Unsupported pen record version/u);
  assert.equal(await readFile(path, "utf8"), invalidBytes);
  assert.equal(JSON.stringify(refusing.snapshot()), before);
  await assert.rejects(() => access(join(folder, ".orc.lock")), /ENOENT/u);
  await writeFile(path, bytes);
  checks.push(
    "save/reopen retains every record ID and coupled field; unknown versions preserve bundle bytes, existing projects and writable-lock cleanup",
  );
}

let failed: string | null = null;
try {
  await atomicHistory();
  await malformedAndStale();
  await locks();
  await persistence();
  console.log(`PEN_COMMANDS_PASSED ${checks.length} groups`);
} catch (error) {
  failed = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await projects.shutdown();
  await writeFile(
    join(directory, "command-result.json"),
    JSON.stringify(
      {
        ...sourceEvidence(),
        command: "bun scripts/e2e/editor/pen/check-commands.ts",
        checks,
        inputs,
        failed,
      },
      null,
      2,
    ),
  );
}

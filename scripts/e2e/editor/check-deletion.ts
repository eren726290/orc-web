import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_DELETION_EVIDENCE ?? "verification";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "deletion-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
const inputs: unknown[] = [];
let failure: string | null = null;
try {
  await verifyMode("development");
  if (process.env.ORC_DELETION_MODES !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...sourceEvidence(), channel, browserVersion: browser.version(), command: `bun scripts/e2e/editor/check-deletion.ts ${channel}`, phase, modes: process.env.ORC_DELETION_MODES ?? "development+built", checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("subtree deletion passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    assert.equal((await command(page, { kind: "insert", nodes: fixture() })).status(), 200);
    await ordinarySelections(page, mode);
    await lockedDeletion(page, mode);
    await canvasDeletion(page, mode);
    await saveReopen(page, mode);
    assert.deepEqual(errors, [], "No uncaught browser errors");
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
    checks.push(`${mode}: graceful process shutdown`);
  }
}

function text(id: string, parentId: string | null): DesignNode {
  return {
    visible: true,
    locked: false,
    attributes: {},
    style: {},
    id,
    name: id,
    parentId,
    children: [],
    kind: "text",
    tag: "p",
    runs: [{ text: `Content ${id}`, style: { color: "#123456" } }],
  };
}

function fixture(): DesignNode[] {
  const base = { visible: true, locked: false, attributes: {}, style: {} };
  return [
    text("loose-before", null),
    {
      ...base,
      id: "frame",
      name: "Deletion frame",
      parentId: null,
      children: ["before", "container", "after"],
      kind: "frame",
      clipContent: false,
      mode: "inherit",
      style: {
        position: "absolute",
        left: "50px",
        top: "100px",
        width: "300px",
        height: "300px",
        background: "#e8edf4",
      },
    },
    text("before", "frame"),
    {
      ...base,
      id: "container",
      name: "Nested container",
      parentId: "frame",
      children: ["child"],
      kind: "element",
      tag: "section",
    },
    text("child", "container"),
    text("after", "frame"),
    text("loose-after", null),
  ];
}

async function ordinarySelections(page: Page, mode: string) {
  const subtree = ["container", "child"];
  const frame = ["frame", "before", "container", "child", "after"];
  for (const [ids, removed] of [
    [["container", "child"], subtree],
    [["child", "container"], subtree],
    [["container", "container", "child"], subtree],
    [["frame", "container"], frame],
    [["container", "frame"], frame],
    [["child"], ["child"]],
    [
      ["loose-before", "loose-after"],
      ["loose-before", "loose-after"],
    ],
    [["loose-before", "loose-before"], ["loose-before"]],
  ]) {
    const before = (await session(page)).projects[0].document;
    assert.equal((await command(page, { kind: "delete", ids })).status(), 200);
    const after = (await session(page)).projects[0].document;
    assertRemoval(before, after, removed);
    await history(page, "undo");
    assertContent((await session(page)).projects[0].document, before);
    await history(page, "redo");
    assertContent((await session(page)).projects[0].document, after);
    await history(page, "undo");
  }
  await rejected(page, ["container", "missing"], "Object no longer exists.");
  await rejected(page, ["missing", "container"], "Object no longer exists.");
  const before = await session(page);
  assert.equal((await command(page, { kind: "delete", ids: [] })).status(), 200);
  assert.deepEqual(await session(page), before, "Empty ordinary selection is a no-op");
  checks.push(
    `${mode}: ordinary overlaps in both orders, duplicate selection, missing targets, empty selection, exact Undo/Redo`,
  );
}

async function lockedDeletion(page: Page, mode: string) {
  assert.equal((await command(page, { kind: "lock", id: "child", locked: true })).status(), 200);
  await lockedCanvasDeletion(page, mode);
  for (const ids of [
    ["loose-before", "container"],
    ["container", "loose-before"],
    ["frame", "child"],
    ["child", "frame"],
    ["child"],
  ])
    await rejected(page, ids, "Unlock the object before deleting.");
  assert.equal((await command(page, { kind: "lock", id: "child", locked: false })).status(), 200);
  assert.equal((await command(page, { kind: "lock", id: "frame", locked: true })).status(), 200);
  await rejected(page, ["frame"], "Unlock the object before deleting.");
  await rejected(page, ["loose-before", "container"], "Unlock the object before deleting.");
  assert.equal((await command(page, { kind: "lock", id: "frame", locked: false })).status(), 200);
  checks.push(
    `${mode}: own descendant and inherited locks reject entire deletion with no revision/history/selection change`,
  );
}

async function lockedCanvasDeletion(page: Page, mode: string) {
  await page.reload();
  await page.getByRole("button", { name: "Untitled", exact: true }).click();
  await page.locator('.canvas-world [data-orc-id="frame"]').waitFor();
  await page.locator('.canvas-world [data-orc-id="frame"]').click({ position: { x: 280, y: 280 } });
  assert.equal(await page.locator(".layer-row.selected .layer-name").innerText(), "Deletion frame");
  const before = await session(page);
  await page.screenshot({ path: artifact(`${mode}-locked-before.png`), fullPage: true });
  const result = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/commands" &&
      response.request().method() === "POST",
  );
  await page.getByRole("application", { name: "Canvas" }).press("Delete");
  const response = await result;
  inputs.push({
    mode,
    trigger: "Canvas Delete",
    request: response.request().postDataJSON(),
    status: response.status(),
  });
  assert.equal(
    response.status(),
    400,
    "Canvas Delete must reject an unlocked frame with a locked descendant",
  );
  assert.deepEqual(
    await session(page),
    before,
    "Rejected Canvas Delete preserves document and history",
  );
  await page.getByRole("alert").filter({ hasText: "Unlock the object before deleting." }).waitFor();
  assert.equal(await page.locator(".layer-row.selected .layer-name").innerText(), "Deletion frame");
}

async function canvasDeletion(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  await page.reload();
  await page.getByRole("button", { name: "Untitled", exact: true }).click();
  await page.locator('.canvas-world [data-orc-id="frame"]').click({ position: { x: 280, y: 280 } });
  const result = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/commands" &&
      response.request().method() === "POST",
  );
  await page.getByRole("application", { name: "Canvas" }).press("Delete");
  assert.equal((await result).status(), 200);
  await page.locator('.canvas-world [data-orc-id="frame"]').waitFor({ state: "hidden" });
  const after = (await session(page)).projects[0].document;
  assertRemoval(before, after, ["frame", "before", "container", "child", "after"]);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page.locator('.canvas-world [data-orc-id="child"]').waitFor();
  assertContent((await session(page)).projects[0].document, before);
  await page.getByRole("application", { name: "Canvas" }).press("Control+Shift+z");
  await page.locator('.canvas-world [data-orc-id="frame"]').waitFor({ state: "hidden" });
  assertContent((await session(page)).projects[0].document, after);
  checks.push(
    `${mode}: Canvas Delete removes the whole frame in one revision and one executable Undo/Redo step`,
  );
}

function assertRemoval(before: DesignDocument, after: DesignDocument, removed: string[]) {
  const expected = structuredClone(before);
  expected.workspaceRootIds = expected.workspaceRootIds.filter((id) => !removed.includes(id));
  for (const id of removed) delete expected.nodes[id];
  for (const node of Object.values(expected.nodes))
    node.children = node.children.filter((id) => !removed.includes(id));
  assert.equal(after.revision, before.revision + 1, "One deletion revision");
  assertContent(after, expected);
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual(
    { ...actual, revision: 0 },
    { ...expected, revision: 0 },
    "Exact identities, parent/child order, content, styles, and settings",
  );
}

async function rejected(page: Page, ids: string[], error: string) {
  const before = await session(page);
  const response = await command(page, { kind: "delete", ids });
  assert.equal(response.status(), 400);
  assert.deepEqual(await response.json(), { error });
  assert.deepEqual(
    await session(page),
    before,
    "Whole request rejection preserves all applied state and history flags",
  );
}

async function history(page: Page, direction: "undo" | "redo") {
  const project = (await session(page)).projects[0];
  assert.equal(
    (
      await page.request.post("/api/history", {
        data: {
          projectId: project.document.id,
          expectedRevision: project.document.revision,
          direction,
        },
      })
    ).status(),
    200,
  );
}

async function command(page: Page, mutation: Mutation) {
  const project = (await session(page)).projects[0];
  const data = {
    projectId: project.document.id,
    commandId: crypto.randomUUID(),
    expectedRevision: project.document.revision,
    mutation,
  };
  const response = await page.request.post("/api/commands", { data });
  inputs.push({ request: data, status: response.status() });
  return response;
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

async function saveReopen(page: Page, mode: string) {
  const project = (await session(page)).projects[0];
  const response = await page.request.post("/api/projects/save", {
    data: { projectId: project.document.id, parent: join(process.cwd(), temporary), name: mode },
  });
  assert.equal(response.status(), 200);
  const saved = parseSession(await response.json()).projects[0];
  assert.ok(saved.path);
  assert.deepEqual(
    JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
    saved.document,
  );
  assert.equal(
    (
      await page.request.post("/api/projects/close", {
        data: { projectId: project.document.id, discard: false },
      })
    ).status(),
    200,
  );
  assert.equal(
    (await page.request.post("/api/projects/open", { data: { path: saved.path } })).status(),
    200,
  );
  const restored = (await session(page)).projects[0];
  assert.deepEqual(restored.document, saved.document);
  assert.equal(restored.canUndo, false);
  assert.equal(restored.canRedo, false);
  await page.reload();
  await page.getByRole("button", { name: mode, exact: true }).click();
  await page.locator('.canvas-world [data-orc-id="frame"]').waitFor({ state: "hidden" });
  await page.locator('.canvas-world [data-orc-id="loose-before"]').waitFor();
  await page.locator('.canvas-world [data-orc-id="loose-after"]').waitFor();
  checks.push(
    `${mode}: save/reopen preserves applied deletion and unrelated objects without restoring runtime history`,
  );
}

function artifact(suffix: string) {
  return join(artifacts, `deletion-${phase}-${suffix}`);
}

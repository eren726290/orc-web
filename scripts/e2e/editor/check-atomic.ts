import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import type { AtomicMutation, Mutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_ATOMIC_EVIDENCE ?? "verification";
const modes = process.env.ORC_ATOMIC_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "atomic-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
const inputs: unknown[] = [];
const evidence = sourceEvidence();
let failure: string | null = null;
try {
  if (modes !== "built") await verifyMode("development");
  if (modes !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), command: `bun scripts/e2e/editor/check-atomic.ts ${channel}`, phase, modes, checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("atomic ordinary commands passed\n");

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
    await accepted(page, { kind: "insert", nodes: fixture() });
    await invalidDestinations(page, mode);
    await styleBatch(page, mode);
    await batchForms(page, mode);
    await noOps(page, mode);
    await invalidBatches(page, mode);
    await reordering(page, mode);
    await invalidReorders(page, mode);
    await lockedReorders(page, mode);
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
    checks.push(`${mode}: owned app shut down gracefully`);
  }
}

function frame(id: string, parentId: string | null, children: string[], top: string): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children,
    visible: true,
    locked: false,
    attributes: {},
    kind: "frame",
    clipContent: false,
    mode: "inherit",
    style: {
      position: "absolute",
      left: "40px",
      top,
      width: "300px",
      height: "160px",
      display: "flex",
      gap: "10px",
      color: "#123456",
      background: "#e8edf4",
    },
  };
}

function text(id: string, parentId: string | null): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    kind: "text",
    tag: "p",
    runs: [{ text: id.toUpperCase(), style: {} }],
    style: { width: "40px", height: "24px", margin: "0", "flex-shrink": "0" },
  };
}

function fixture(): DesignNode[] {
  return [
    frame("alpha", null, ["a", "b", "container"], "40px"),
    {
      ...text("a", "alpha"),
      style: {
        width: "40px",
        height: "24px",
        margin: "0",
        position: "absolute",
        left: "80px",
        top: "20px",
        color: "#aa0000",
        "--obsolete": "1",
      },
    },
    text("b", "alpha"),
    {
      id: "container",
      name: "container",
      parentId: "alpha",
      children: ["leaf"],
      visible: true,
      locked: false,
      attributes: {},
      kind: "element",
      tag: "section",
      style: { display: "flex", "flex-direction": "column", width: "100px" },
    },
    text("leaf", "container"),
    frame("omega", null, ["c"], "260px"),
    text("c", "omega"),
    {
      ...text("loose", null),
      style: { position: "absolute", left: "400px", top: "40px", width: "80px", margin: "0" },
    },
  ];
}

function invalidParents(): DesignNode[] {
  const base = {
    name: "Invalid parent",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    style: {},
    attributes: {},
  };
  return [
    { ...base, id: "image-parent", kind: "image", attributes: { alt: "Image parent" } },
    {
      ...base,
      id: "svg-parent",
      kind: "svg",
      source: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" /></svg>',
    },
    { ...base, id: "input-parent", kind: "element", tag: "input" },
    { ...base, id: "br-parent", kind: "element", tag: "br" },
  ];
}

async function invalidDestinations(page: Page, mode: string) {
  await accepted(page, { kind: "insert", nodes: invalidParents() });
  for (const parentId of ["loose", ...invalidParents().map((node) => node.id)]) {
    const before = await session(page);
    const mutation: AtomicMutation = { kind: "reorder", id: "a", parentId, index: 0 };
    await rejectedDestination(page, mutation, mode);
    assert.deepEqual(await session(page), before);
    await rejected(page, {
      kind: "batch",
      mutations: [{ kind: "style", id: "a", values: { width: "199px" } }, mutation],
    });
    await rejected(page, { kind: "insert", nodes: [text("invalid-child", parentId)] });
    await rejected(page, {
      kind: "batch",
      mutations: [
        { kind: "style", id: "a", values: { width: "199px" } },
        { kind: "insert", nodes: [text("invalid-child", parentId)] },
      ],
    });
  }
  const image = invalidParents()[0];
  await rejected(page, {
    kind: "insert",
    nodes: [
      { ...image, id: "incoming-image", children: ["invalid-child"] },
      text("invalid-child", "incoming-image"),
    ],
  });
  await accepted(page, { kind: "delete", ids: invalidParents().map((node) => node.id) });
  checks.push(
    `${mode}: text/image/SVG/void parent capabilities reject reparent and insert, including a newly inserted parent and atomic rollback after earlier valid style`,
  );
}

async function rejectedDestination(
  page: Page,
  mutation: Extract<AtomicMutation, { kind: "reorder" }>,
  mode: string,
) {
  const response = await command(page, mutation);
  if (response.status() === 200) {
    await refresh(page);
    inputs.push({
      invalidDestination: mutation.parentId,
      renderedMovedObjects: await page.locator('.canvas-world [data-orc-id="a"]').count(),
    });
    await page.screenshot({ path: artifact(`${mode}-invalid-parent.png`) });
  }
  assert.equal(
    response.status(),
    400,
    `Destination ${mutation.parentId} cannot render ordinary children`,
  );
}

async function styleBatch(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  const edits: AtomicMutation[] = [
    { kind: "style", id: "alpha", values: { "flex-direction": "column", gap: "12px" } },
    {
      kind: "style",
      id: "a",
      values: { width: "80px" },
      unset: ["position", "left", "top", "color", "--obsolete"],
    },
    { kind: "style", id: "b", values: { width: "60px" } },
  ];
  await accepted(page, { kind: "batch", mutations: edits });
  const after = (await session(page)).projects[0].document;
  const expected = structuredClone(before);
  expected.nodes.alpha.style["flex-direction"] = "column";
  expected.nodes.alpha.style.gap = "12px";
  expected.nodes.a.style.width = "80px";
  for (const property of ["position", "left", "top", "color", "--obsolete"])
    delete expected.nodes.a.style[property];
  expected.nodes.b.style.width = "60px";
  assertContent(after, expected);
  assert.equal(after.revision, before.revision + 1);
  await refresh(page);
  await assertNativeStyle(page);
  await page.screenshot({ path: artifact(`${mode}-style-batch.png`) });
  await undoRedo(page, before, after);
  checks.push(
    `${mode}: multi-object style/unset changes one revision; native CSS removes positioning/custom property and inherits color; one UI Undo/Redo restores exact authored snapshots`,
  );
}

async function assertNativeStyle(page: Page) {
  const native = await page.locator('.canvas-world [data-orc-id="a"]').evaluate((element) => {
    if (!(element instanceof HTMLElement)) throw new Error("Expected rendered HTML.");
    const style = getComputedStyle(element);
    return {
      width: style.width,
      position: style.position,
      color: style.color,
      authored: element.style.cssText,
      obsolete: element.style.getPropertyValue("--obsolete"),
    };
  });
  assert.equal(native.width, "80px");
  assert.equal(native.position, "static");
  assert.equal(native.color, "rgb(18, 52, 86)");
  assert.equal(native.obsolete, "");
  assert.doesNotMatch(native.authored, /(?:position|left|top|color|--obsolete):/u);
  const a = await page.locator('.canvas-world [data-orc-id="a"]').boundingBox();
  const b = await page.locator('.canvas-world [data-orc-id="b"]').boundingBox();
  assert.ok(a && b);
  assert.equal(b.y - a.y, a.height + 12, "Native column layout follows authored gap");
}

async function batchForms(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  const added = text("added", "omega");
  const mutations: AtomicMutation[] = [
    { kind: "insert", nodes: [added] },
    { kind: "rename", id: "b", name: "Renamed B" },
    { kind: "text", id: "b", runs: [{ text: "Changed content", style: { "font-weight": "700" } }] },
    { kind: "lock", id: "c", locked: true },
    { kind: "delete", ids: ["leaf"] },
    { kind: "reorder", id: "added", parentId: "container", index: 0 },
  ];
  await accepted(page, { kind: "batch", mutations });
  const after = (await session(page)).projects[0].document;
  const expected = structuredClone(before);
  expected.nodes.added = { ...added, parentId: "container" };
  expected.nodes.b.name = "Renamed B";
  const b = expected.nodes.b;
  assert.equal(b.kind, "text");
  if (b.kind === "text") b.runs = [{ text: "Changed content", style: { "font-weight": "700" } }];
  expected.nodes.c.locked = true;
  delete expected.nodes.leaf;
  expected.nodes.container.children = ["added"];
  assertContent(after, expected);
  assert.equal(after.revision, before.revision + 1);
  await refresh(page);
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="b"]').innerText(),
    "Changed content",
  );
  await assertRendered(page, after);
  await undoRedo(page, before, after);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  checks.push(
    `${mode}: every non-source ordinary form and reorder executes together; insert/reparent/delete hierarchy and rich text restore in one UI history step`,
  );
}

async function noOps(page: Page, mode: string) {
  for (const mutation of [
    { kind: "batch", mutations: [] },
    { kind: "style", id: "a", values: {}, unset: ["already-absent"] },
    { kind: "reorder", id: "a", parentId: "alpha", index: 0 },
  ] satisfies Mutation[]) {
    const before = await session(page);
    await accepted(page, mutation);
    assert.deepEqual(await session(page), before, "No-op retains revision and both history stacks");
  }
  checks.push(
    `${mode}: empty batch, absent style removal, and unchanged sibling index are no-ops, including existing Redo`,
  );
}

async function invalidBatches(page: Page, mode: string) {
  const first = { kind: "style", id: "a", values: { width: "99px" } };
  for (const edit of [
    { kind: "style", id: "missing", values: { width: "88px" } },
    { kind: "text", id: "alpha", runs: [{ text: "Invalid", style: {} }] },
    { kind: "style", id: "b", values: { width: "88px" }, unset: ["width"] },
    { kind: "source", id: "b", source: "<p>Unsupported inside a batch</p>" },
    { kind: "batch", mutations: [] },
    { kind: "style", id: "b", unset: ["width"] },
    { kind: "style", id: "b", values: {}, unset: [4] },
    { kind: "reorder", id: "b", parentId: "alpha", index: -1 },
    { kind: "insert", nodes: [text("orphan", "missing")] },
  ])
    await rejected(page, { kind: "batch", mutations: [first, edit] });
  await accepted(page, { kind: "lock", id: "b", locked: true });
  await rejected(page, {
    kind: "batch",
    mutations: [first, { kind: "style", id: "b", values: { width: "88px" } }],
  });
  await accepted(page, { kind: "lock", id: "b", locked: false });
  await rejected(page, { kind: "batch", mutations: [first] }, 0);
  const before = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "source",
    id: "leaf",
    source: '<p layer-name="leaf" style="width: 50px; height: 24px; margin: 0;">Legacy source</p>',
  });
  assert.equal((await session(page)).projects[0].document.revision, before.revision + 1);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  checks.push(
    `${mode}: missing/invalid/locked/stale/conflicting/recursive/source batches reject completely; legacy standalone source remains accepted`,
  );
}

async function reordering(page: Page, mode: string) {
  const cases = [
    { kind: "reorder", id: "loose", parentId: null, index: 0 },
    { kind: "reorder", id: "a", parentId: "alpha", index: 2 },
    { kind: "reorder", id: "a", parentId: "alpha", index: 0 },
    { kind: "reorder", id: "b", parentId: "omega", index: 1 },
    { kind: "reorder", id: "b", parentId: null, index: 3 },
    { kind: "reorder", id: "b", parentId: "container", index: 1 },
    { kind: "reorder", id: "container", parentId: "omega", index: 0 },
  ] satisfies AtomicMutation[];
  for (const mutation of cases) {
    const before = (await session(page)).projects[0].document;
    const expected = expectedMove(before, mutation.id, mutation.parentId, mutation.index);
    await accepted(page, mutation);
    const after = (await session(page)).projects[0].document;
    assertContent(after, expected);
    assert.equal(after.revision, before.revision + 1);
    await refresh(page);
    await assertRendered(page, after);
    await assertFlexOrder(page, after);
    await undoRedo(page, before, after);
  }
  await pairedReparent(page);
  await page.screenshot({ path: artifact(`${mode}-reparent.png`) });
  checks.push(
    `${mode}: root/nested sibling moves both directions, append after removal, reparent nested/root/subtree, identity/style retention, native DOM/Flex order and one-step exact UI Undo/Redo`,
  );
}

function expectedMove(before: DesignDocument, id: string, parentId: string | null, index: number) {
  const expected = structuredClone(before);
  const oldParent = expected.nodes[id].parentId;
  if (oldParent === null)
    expected.workspaceRootIds = expected.workspaceRootIds.filter((root) => root !== id);
  else
    expected.nodes[oldParent].children = expected.nodes[oldParent].children.filter(
      (child) => child !== id,
    );
  const destination =
    parentId === null ? expected.workspaceRootIds : expected.nodes[parentId].children;
  destination.splice(index, 0, id);
  expected.nodes[id].parentId = parentId;
  return expected;
}

async function pairedReparent(page: Page) {
  const before = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "reorder", id: "loose", parentId: "omega", index: 2 },
      { kind: "style", id: "loose", values: { width: "70px" }, unset: ["position", "left", "top"] },
    ],
  });
  const after = (await session(page)).projects[0].document;
  const expected = expectedMove(before, "loose", "omega", 2);
  expected.nodes.loose.style.width = "70px";
  for (const property of ["position", "left", "top"]) delete expected.nodes.loose.style[property];
  assertContent(after, expected);
  assert.equal(after.revision, before.revision + 1);
  await refresh(page);
  await assertRendered(page, after);
  await assertFlexOrder(page, after);
  await undoRedo(page, before, after);
}

async function invalidReorders(page: Page, mode: string) {
  for (const mutation of [
    { kind: "reorder", id: "missing", parentId: null, index: 0 },
    { kind: "reorder", id: "a", parentId: "missing", index: 0 },
    { kind: "reorder", id: "omega", parentId: "omega", index: 0 },
    { kind: "reorder", id: "omega", parentId: "b", index: 0 },
    { kind: "reorder", id: "omega", parentId: "container", index: 0 },
    { kind: "reorder", id: "a", parentId: "alpha", index: 1 },
    { kind: "reorder", id: "a", parentId: null, index: 100 },
    { kind: "reorder", id: "a", parentId: "container", index: 0.5 },
    { kind: "reorder", id: "a", parentId: null, index: -1 },
    { kind: "reorder", id: "a", index: 0 },
  ]) {
    const response = await rejected(page, mutation);
    if (mutation.id === "omega" && mutation.parentId === "container")
      assert.deepEqual(await response.json(), {
        error: "An object cannot be moved into itself or its descendants.",
      });
    await rejected(page, {
      kind: "batch",
      mutations: [{ kind: "style", id: "a", values: { width: "199px" } }, mutation],
    });
  }
  checks.push(
    `${mode}: missing targets/parents, self/cycle, omitted parent, negative/fractional/out-of-range indices reject directly and after an earlier valid style edit`,
  );
}

async function lockedReorders(page: Page, mode: string) {
  for (const [locked, mutation] of [
    ["a", { kind: "reorder", id: "a", parentId: "omega", index: 0 }],
    ["alpha", { kind: "reorder", id: "a", parentId: "omega", index: 0 }],
    ["omega", { kind: "reorder", id: "a", parentId: "omega", index: 0 }],
    ["omega", { kind: "reorder", id: "a", parentId: "container", index: 0 }],
    ["omega", { kind: "reorder", id: "b", parentId: null, index: 0 }],
  ] satisfies [string, AtomicMutation][]) {
    await accepted(page, { kind: "lock", id: locked, locked: true });
    await rejected(page, mutation);
    await rejected(page, {
      kind: "batch",
      mutations: [{ kind: "rename", id: "loose", name: "Partial edit" }, mutation],
    });
    await accepted(page, { kind: "lock", id: locked, locked: false });
  }
  await rejected(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "a", values: { width: "199px" } },
      { kind: "lock", id: "omega", locked: true },
      { kind: "reorder", id: "a", parentId: "omega", index: 0 },
    ],
  });
  checks.push(
    `${mode}: target, old ancestor, destination and destination ancestor locks, including a lock applied earlier inside the same batch, reject the whole command`,
  );
}

async function assertRendered(page: Page, expected: DesignDocument) {
  await page.waitForFunction(
    (revision) =>
      document.querySelector(".canvas")?.getAttribute("data-orc-revision") === String(revision),
    expected.revision,
  );
  const rendered = await page.locator(".canvas-world").evaluate((world) => {
    const ids = (parent: Element) =>
      Array.from(parent.children).flatMap((child) =>
        child.hasAttribute("data-orc-id") ? [child.getAttribute("data-orc-id")] : [],
      );
    return {
      roots: ids(world),
      children: Object.fromEntries(
        Array.from(world.querySelectorAll("[data-orc-id]")).map((node) => [
          node.getAttribute("data-orc-id"),
          ids(node),
        ]),
      ),
    };
  });
  assert.deepEqual(rendered.roots, expected.workspaceRootIds);
  assert.deepEqual(
    rendered.children,
    Object.fromEntries(Object.values(expected.nodes).map((node) => [node.id, node.children])),
  );
}

async function assertFlexOrder(page: Page, expected: DesignDocument) {
  for (const parentId of ["alpha", "omega", "container"]) {
    const ids = expected.nodes[parentId].children;
    const boxes = await Promise.all(
      ids.map((id) => page.locator(`.canvas-world [data-orc-id="${id}"]`).boundingBox()),
    );
    const axis = expected.nodes[parentId].style["flex-direction"] === "column" ? "y" : "x";
    for (let index = 1; index < boxes.length; index++) {
      const previous = boxes[index - 1];
      const current = boxes[index];
      assert.ok(previous && current);
      assert.ok(
        current[axis] > previous[axis],
        `Native ${parentId} Flex order matches ${ids.join(", ")}`,
      );
    }
  }
}

async function undoRedo(page: Page, before: DesignDocument, after: DesignDocument) {
  await refresh(page);
  await history(page, "undo");
  const undone = (await session(page)).projects[0].document;
  assertContent(undone, before);
  assert.equal(undone.revision, after.revision + 1);
  await assertRendered(page, undone);
  await history(page, "redo");
  const redone = (await session(page)).projects[0].document;
  assertContent(redone, after);
  assert.equal(redone.revision, undone.revision + 1);
  await assertRendered(page, redone);
}

async function history(page: Page, direction: "undo" | "redo") {
  await refresh(page);
  const response = page.waitForResponse(
    (item) => new URL(item.url()).pathname === "/api/history" && item.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  const result = await response;
  inputs.push({
    trigger: `Canvas ${direction}`,
    request: result.request().postDataJSON(),
    status: result.status(),
  });
  assert.equal(result.status(), 200);
}

async function refresh(page: Page) {
  const current = (await session(page)).projects[0];
  await page.reload();
  await page.getByRole("button", { name: current.document.name, exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).waitFor();
  await page.locator('.canvas-world [data-orc-id="alpha"]').waitFor();
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual(
    { ...actual, revision: 0 },
    { ...expected, revision: 0 },
    "Exact authored hierarchy, identity, style, text and settings",
  );
}

async function command(page: Page, mutation: unknown, expectedRevision?: number) {
  const document = (await session(page)).projects[0].document;
  const data = {
    projectId: document.id,
    commandId: crypto.randomUUID(),
    expectedRevision: expectedRevision ?? document.revision,
    mutation,
  };
  const response = await page.request.post("/api/commands", { data });
  inputs.push({ request: data, status: response.status(), response: await response.json() });
  return response;
}

async function accepted(page: Page, mutation: Mutation) {
  const response = await command(page, mutation);
  assert.equal(response.status(), 200, JSON.stringify(await response.json()));
}

async function rejected(page: Page, mutation: unknown, revision?: number) {
  const before = await session(page);
  const response = await command(page, mutation, revision);
  assert.equal(response.status(), 400, JSON.stringify(mutation));
  assert.match((await response.json()).error, /.+/u);
  assert.deepEqual(
    await session(page),
    before,
    "Rejected whole command retains document, revision, history, active project and save status",
  );
  return response;
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

async function saveReopen(page: Page, mode: string) {
  const document = (await session(page)).projects[0].document;
  const data = { projectId: document.id, parent: join(process.cwd(), temporary), name: mode };
  const response = await page.request.post("/api/projects/save", { data });
  assert.equal(response.status(), 200);
  const saved = parseSession(await response.json()).projects[0];
  assert.ok(saved.path);
  assert.deepEqual(
    JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
    saved.document,
  );
  await persistedRejection(page, saved.path);
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "a", values: { width: "81px" } },
      { kind: "reorder", id: "c", parentId: "omega", index: 2 },
    ],
  });
  assert.equal(
    (await page.request.post("/api/projects/retry", { data: { projectId: document.id } })).status(),
    200,
  );
  const final = (await session(page)).projects[0];
  assert.equal(final.saveStatus.kind, "saved");
  assert.equal(final.document.revision, saved.document.revision + 1);
  assert.deepEqual(
    JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
    final.document,
  );
  await reopen(page, saved.path, final.document);
  checks.push(
    `${mode}: first Save, rejected batch disk-byte preservation, subsequent batch autosave, exact save/reopen, fresh runtime history and native hierarchy`,
  );
}

async function reopen(page: Page, path: string, expected: DesignDocument) {
  assert.equal(
    (
      await page.request.post("/api/projects/close", {
        data: { projectId: expected.id, discard: false },
      })
    ).status(),
    200,
  );
  assert.equal((await page.request.post("/api/projects/open", { data: { path } })).status(), 200);
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, expected);
  assert.equal(reopened.canUndo, false);
  assert.equal(reopened.canRedo, false);
  await refresh(page);
  await assertRendered(page, expected);
  await assertFlexOrder(page, expected);
}

async function persistedRejection(page: Page, path: string) {
  const bytes = await readFile(join(path, "document.json"), "utf8");
  await rejected(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "a", values: { width: "333px" } },
      { kind: "reorder", id: "omega", parentId: "b", index: 0 },
    ],
  });
  assert.equal(await readFile(join(path, "document.json"), "utf8"), bytes);
}

function artifact(suffix: string) {
  return join(artifacts, `atomic-${phase}-${suffix}`);
}

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import type { Mutation } from "../../../shared/commands/commands";
import { nodeSource } from "../../../shared/source/html-source";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_CLIPPING_EVIDENCE ?? "verification";
const modes = process.env.ORC_CLIPPING_MODES ?? "development+built";
const artifacts = "artifacts/editor";
const requirements = [
  "Only a selected ordinary frame exposes Clip content; one toggle changes only its saved flag and one revision.",
  "Native clipping hides overflow and Off exposes it subject to ancestor clipping; child rectangles, order, data and Layers access remain intact.",
  "One Undo/Redo restores exact authored state; unchanged clipping preserves both history stacks.",
  "Own/ancestor locks, missing/non-frame targets, invalid boolean and stale revision reject; mixed batches roll back earlier edits.",
  "Code source follows the flag; draft Cancel preserves applied state and draft, while Discard completes the requested toggle.",
  "Save/reopen retains clipping and native rendering; errors, inputs, source hashes, screenshots, traces and graceful shutdown remain recorded.",
];
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "clipping-fixtures-"));
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
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), command: `ORC_CLIPPING_EVIDENCE=${phase} ORC_CLIPPING_MODES=${modes} bun scripts/e2e/editor/check-clipping.ts ${channel}`, phase, modes, requirements, checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write(
  phase === "baseline"
    ? "absent frame clipping control recorded\n"
    : "frame clipping workflow passed\n",
);

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await accepted(page, { kind: "insert", nodes: fixture() });
    await refresh(page);
    await select(page, "outer");
    if (phase === "baseline") await baseline(page, mode);
    else await workflow(page, mode);
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
    inputs.push({ mode, browserErrors: errors, appOutput: app.output });
    checks.push(`${mode}: owned app shut down gracefully`);
  }
}

function frame(
  id: string,
  parentId: string | null,
  children: string[],
  left: string,
  top: string,
  width: string,
): DesignNode {
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
    style: { position: "absolute", left, top, width, height: "140px", background: "#dce9f7" },
  };
}

function text(id: string, parentId: string | null, left: string, top: string): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children: [],
    visible: true,
    locked: false,
    attributes: { title: `Retained ${id}` },
    kind: "text",
    tag: "p",
    runs: [{ text: `Overflow ${id}`, style: { "font-weight": "700" } }],
    style: {
      position: "absolute",
      left,
      top,
      width: "100px",
      height: "30px",
      margin: "0",
      background: "#f28068",
    },
  };
}

function fixture(): DesignNode[] {
  return [
    frame("outer", null, ["overflow", "nested", "inside"], "80px", "80px", "240px"),
    text("overflow", "outer", "210px", "12px"),
    frame("nested", "outer", ["nested-overflow"], "190px", "65px", "90px"),
    text("nested-overflow", "nested", "60px", "20px"),
    text("inside", "outer", "10px", "50px"),
    frame("independent", null, [], "460px", "80px", "140px"),
    text("loose", null, "460px", "290px"),
  ];
}

async function baseline(page: Page, mode: string) {
  assert.equal(await page.getByRole("checkbox", { name: "Clip content", exact: true }).count(), 0);
  assert.equal(await page.getByText("Clip content", { exact: true }).count(), 0);
  assert.equal(
    await page.getByRole("spinbutton", { name: "X", exact: true }).count(),
    1,
    "Selected frame Properties is present as a positive control",
  );
  inputs.push({
    mode,
    selected: await selection(page),
    document: (await session(page)).projects[0].document,
    clippingControlCount: 0,
  });
  checks.push(`${mode}: selected ordinary frame has Properties but Clip content is absent`);
}

async function workflow(page: Page, mode: string) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await assertSource(page, "outer");
  await nativeClipping(page, false, false);
  await toggling(page, mode);
  await clippedLayer(page, mode);
  await ancestorClipping(page, mode);
  await invalidRequests(page, mode);
  await lockedRequests(page, mode);
  await mixedBatch(page, mode);
  await draftProtection(page, mode);
  await saveReopen(page, mode);
}

async function toggling(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  const geometry = await rectangles(page);
  await toggle(page, true);
  const after = (await session(page)).projects[0].document;
  assertContent(after, clipped(before, "outer", true));
  assert.equal(after.revision, before.revision + 1);
  assert.deepEqual(await selection(page), ["outer"]);
  assert.deepEqual(await rectangles(page), geometry);
  await nativeClipping(page, true, false);
  await assertSource(page, "outer");
  await page.screenshot({ path: artifact(`${mode}-on.png`), fullPage: true });
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await nativeClipping(page, false, false);
  const noOp = await session(page);
  await accepted(page, { kind: "clip", id: "outer", clipContent: false });
  assert.deepEqual(await session(page), noOp, "Unchanged flag retains existing Redo and revision");
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  await toggle(page, false);
  assertContent((await session(page)).projects[0].document, before);
  await nativeClipping(page, false, false);
  assert.deepEqual(await rectangles(page), geometry);
  checks.push(
    `${mode}: selected frame toggles one saved flag/revision; exact UI Undo/Redo, no-op Redo preservation, source, native overflow and retained rectangles/order/data`,
  );
}

function clipped(document: DesignDocument, id: string, clipContent: boolean) {
  const expected = structuredClone(document);
  const node = expected.nodes[id];
  assert.ok(node.kind === "frame");
  node.clipContent = clipContent;
  return expected;
}

async function toggle(page: Page, checked: boolean) {
  const pending = page.waitForResponse(isCommand);
  assert.equal(
    await page.getByRole("checkbox", { name: "Clip content", exact: true }).isChecked(),
    !checked,
  );
  await page.getByRole("checkbox", { name: "Clip content", exact: true }).click();
  const response = await pending;
  const id = (await selection(page))[0];
  assert.equal(response.status(), 200, await response.text());
  assert.deepEqual(response.request().postDataJSON().mutation, {
    kind: "clip",
    id,
    clipContent: checked,
  });
  inputs.push({
    trigger: "Properties Clip content",
    request: response.request().postDataJSON(),
    status: response.status(),
  });
  await waitClipping(page, checked);
}

async function waitClipping(page: Page, checked: boolean) {
  const control = page.getByRole("checkbox", { name: "Clip content", exact: true });
  await control.and(page.locator(checked ? ":checked" : ":not(:checked)")).waitFor();
  assert.equal(await control.isChecked(), checked);
}

function isCommand(response: import("playwright").Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}

async function rectangles(page: Page) {
  return page.locator(".canvas-world").evaluate((world) =>
    Array.from(world.querySelectorAll("[data-orc-id]")).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        id: node.getAttribute("data-orc-id"),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        children: Array.from(node.children).flatMap((child) =>
          child.hasAttribute("data-orc-id") ? [child.getAttribute("data-orc-id")] : [],
        ),
      };
    }),
  );
}

async function nativeObservation(page: Page) {
  return page.locator(".canvas-world").evaluate((world) => {
    const frame = world.querySelector('[data-orc-id="outer"]');
    const nestedFrame = world.querySelector('[data-orc-id="nested"]');
    const overflow = world.querySelector('[data-orc-id="overflow"]');
    const nestedOverflow = world.querySelector('[data-orc-id="nested-overflow"]');
    if (!frame || !nestedFrame || !overflow || !nestedOverflow)
      throw new Error("Missing clipping fixture.");
    const hit = (element: Element, offset: number) => {
      const rect = element.getBoundingClientRect();
      return (
        document
          .elementFromPoint(rect.x + offset, rect.y + 10)
          ?.closest("[data-orc-id]")
          ?.getAttribute("data-orc-id") ?? null
      );
    };
    return {
      outer: getComputedStyle(frame).overflow,
      nested: getComputedStyle(nestedFrame).overflow,
      overflowHit: hit(overflow, 60),
      nestedHit: hit(nestedOverflow, 60),
      insideHit: hit(overflow, 10),
    };
  });
}

async function nativeClipping(page: Page, outer: boolean, nested: boolean) {
  const result = await nativeObservation(page);
  assert.equal(result.outer, outer ? "hidden" : "visible");
  assert.equal(result.nested, nested ? "hidden" : "visible");
  assert.equal(
    result.overflowHit === "overflow",
    !outer,
    "Overflow paints/hit-tests outside outer only when unclipped",
  );
  assert.equal(
    result.nestedHit === "nested-overflow",
    !outer && !nested,
    "Ancestor clipping still hides an unclipped nested child",
  );
  assert.equal(result.insideHit, "overflow", "Visible portion inside frame remains rendered");
  inputs.push({
    nativeClipping: { expectedOuter: outer, expectedNested: nested, ...result },
    rectangles: await rectangles(page),
  });
}

async function clippedLayer(page: Page, mode: string) {
  await toggle(page, true);
  await select(page, "overflow");
  assert.equal(
    await page.getByRole("checkbox", { name: "Clip content", exact: true }).count(),
    0,
    "Non-frame has no clipping control",
  );
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("spinbutton", { name: "X", exact: true }).fill("215");
  await page.getByRole("spinbutton", { name: "X", exact: true }).press("Enter");
  assert.equal((await pending).status(), 200);
  assert.equal((await session(page)).projects[0].document.nodes.overflow.style.left, "215px");
  assert.deepEqual(await selection(page), ["overflow"]);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await select(page, "outer");
  await toggle(page, false);
  await select(page, "loose");
  assert.equal(await page.getByRole("checkbox", { name: "Clip content", exact: true }).count(), 0);
  await select(page, "outer");
  checks.push(
    `${mode}: clipped child stays selectable and editable in Layers; non-frames omit Clip content`,
  );
}

async function ancestorClipping(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  const geometry = await rectangles(page);
  await toggle(page, true);
  await select(page, "nested");
  assert.equal(
    await page.getByRole("checkbox", { name: "Clip content", exact: true }).isChecked(),
    false,
  );
  await toggle(page, true);
  await nativeClipping(page, true, true);
  await toggle(page, false);
  await nativeClipping(page, true, false);
  await select(page, "outer");
  await toggle(page, false);
  await select(page, "nested");
  await toggle(page, true);
  await nativeClipping(page, false, true);
  await toggle(page, false);
  await nativeClipping(page, false, false);
  assertContent((await session(page)).projects[0].document, before);
  assert.deepEqual(await rectangles(page), geometry);
  await select(page, "outer");
  checks.push(
    `${mode}: nested On/Off respects own and ancestor clipping without changing child rectangles, order or authored data`,
  );
}

async function invalidRequests(page: Page, mode: string) {
  const invalid = [
    { kind: "clip", id: "missing", clipContent: true },
    { kind: "clip", id: "overflow", clipContent: true },
    { kind: "clip", id: "outer", clipContent: "true" },
    { kind: "clip", id: "outer" },
    { kind: "clip", id: 4, clipContent: true },
  ];
  for (const mutation of invalid) {
    await rejected(page, mutation);
    await rejected(page, {
      kind: "batch",
      mutations: [{ kind: "rename", id: "inside", name: "Partial edit" }, mutation],
    });
  }
  await rejected(page, { kind: "clip", id: "outer", clipContent: true }, 0);
  await rejected(page, {
    kind: "batch",
    mutations: [
      { kind: "clip", id: "outer", clipContent: true },
      { kind: "style", id: "missing", values: { width: "999px" } },
    ],
  });
  await rejected(page, {
    kind: "batch",
    mutations: [
      { kind: "clip", id: "outer", clipContent: true },
      { kind: "batch", mutations: [] },
    ],
  });
  checks.push(
    `${mode}: missing/non-frame targets, invalid types/missing boolean, stale revisions and recursive/failed mixed batches reject whole state and history`,
  );
}

async function lockedRequests(page: Page, mode: string) {
  for (const [locked, target] of [
    ["outer", "outer"],
    ["outer", "nested"],
    ["nested", "nested"],
  ]) {
    await accepted(page, { kind: "lock", id: locked, locked: true });
    await refresh(page);
    await select(page, target);
    assert.ok(await page.getByRole("checkbox", { name: "Clip content", exact: true }).isDisabled());
    await rejected(page, { kind: "clip", id: target, clipContent: true });
    await rejected(page, {
      kind: "batch",
      mutations: [
        { kind: "rename", id: "independent", name: "Partial lock edit" },
        { kind: "clip", id: target, clipContent: true },
      ],
    });
    await accepted(page, { kind: "lock", id: locked, locked: false });
  }
  await rejected(page, {
    kind: "batch",
    mutations: [
      { kind: "lock", id: "outer", locked: true },
      { kind: "clip", id: "nested", clipContent: true },
    ],
  });
  await refresh(page);
  await select(page, "outer");
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    `${mode}: own/ancestor locks disable Properties and reject direct/mixed commands, including a lock earlier inside the batch`,
  );
}

async function mixedBatch(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "clip", id: "outer", clipContent: true },
      { kind: "style", id: "inside", values: { color: "#123456" } },
    ],
  });
  const after = (await session(page)).projects[0].document;
  const expected = clipped(before, "outer", true);
  expected.nodes.inside.style.color = "#123456";
  assertContent(after, expected);
  assert.equal(after.revision, before.revision + 1);
  await page.getByRole("checkbox", { name: "Clip content", exact: true }).waitFor();
  await assertSource(page, "outer");
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  await nativeClipping(page, true, false);
  checks.push(
    `${mode}: valid clipping/style mixed batch changes one revision and restores exact state through one UI Undo/Redo`,
  );
}

async function draftProtection(page: Page, mode: string) {
  await assertSource(page, "outer");
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = (await source.innerText()).replace("Overflow inside", "Unapplied draft");
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  await page.getByRole("checkbox", { name: "Clip content", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.deepEqual(await session(page), before);
  assert.equal(await source.innerText(), draft);
  assert.deepEqual(await selection(page), ["outer"]);
  assert.equal(
    await page.getByRole("checkbox", { name: "Clip content", exact: true }).isChecked(),
    true,
  );
  await page.getByRole("checkbox", { name: "Clip content", exact: true }).click();
  const pending = page.waitForResponse(isCommand);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.equal((await pending).status(), 200);
  const after = (await session(page)).projects[0].document;
  assertContent(after, clipped(before.projects[0].document, "outer", false));
  assert.equal(after.revision, before.projects[0].document.revision + 1);
  await assertSource(page, "outer");
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before.projects[0].document);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  checks.push(
    `${mode}: draft Cancel preserves source/selection/applied state/history; Discard toggles exactly once and exact Undo/Redo retains applied data`,
  );
}

async function history(page: Page, direction: "undo" | "redo") {
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/history" && response.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  const response = await pending;
  assert.equal(response.status(), 200);
  inputs.push({
    trigger: `Canvas ${direction}`,
    request: response.request().postDataJSON(),
    status: response.status(),
  });
  assert.equal((await session(page)).projects[0].document.revision, before.revision + 1);
}

async function assertSource(page: Page, id: string) {
  const expected = nodeSource((await session(page)).projects[0].document, id);
  await page.waitForFunction(
    (value) =>
      document.querySelector('[role="textbox"][aria-label="Object source"]')?.textContent === value,
    expected,
  );
  assert.equal(
    await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
    expected,
  );
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual(
    { ...actual, revision: 0 },
    { ...expected, revision: 0 },
    "Exact authored node data, hierarchy, styles, settings and identity",
  );
}

async function rejected(page: Page, mutation: unknown, expectedRevision?: number) {
  const before = await session(page);
  const response = await command(page, mutation, expectedRevision);
  assert.equal(response.status(), 400, JSON.stringify(mutation));
  assert.match((await response.json()).error, /.+/u);
  assert.deepEqual(
    await session(page),
    before,
    "Rejected whole command retains document, revision, history and save state",
  );
}

async function saveReopen(page: Page, mode: string) {
  await toggle(page, true);
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Clipping ${mode}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), temporary));
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const saved = (await session(page)).projects[0];
  assert.ok(saved.path);
  assert.deepEqual(
    JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
    saved.document,
  );
  await persistedRejection(page, saved.path);
  await page.getByRole("button", { name: `Close ${saved.document.name}`, exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(saved.path);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await page.locator('.canvas-world [data-orc-id="outer"]').waitFor();
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo, false);
  assert.equal(reopened.canRedo, false);
  await select(page, "outer");
  assert.equal(
    await page.getByRole("checkbox", { name: "Clip content", exact: true }).isChecked(),
    true,
  );
  await nativeClipping(page, true, false);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await assertSource(page, "outer");
  inputs.push({ mode, savedDocument: saved.document, reopenedDocument: reopened.document });
  checks.push(
    `${mode}: UI Save/reopen retains clipping and all node data; rejected saved batch preserves disk bytes; native clipping and fresh history agree`,
  );
}

async function persistedRejection(page: Page, path: string) {
  const bytes = await readFile(join(path, "document.json"), "utf8");
  await rejected(page, {
    kind: "batch",
    mutations: [
      { kind: "clip", id: "outer", clipContent: false },
      { kind: "clip", id: "inside", clipContent: true },
    ],
  });
  assert.equal(await readFile(join(path, "document.json"), "utf8"), bytes);
}

async function select(page: Page, id: string) {
  const node = (await session(page)).projects[0].document.nodes[id];
  if (
    node.parentId &&
    (await page.getByRole("button", { name: `Expand ${node.parentId}`, exact: true }).count())
  )
    await page.getByRole("button", { name: `Expand ${node.parentId}`, exact: true }).click();
  await page
    .locator(".layer-name")
    .filter({ has: page.getByText(id, { exact: true }) })
    .click();
  assert.deepEqual(await selection(page), [id]);
}

async function selection(page: Page) {
  return page.locator(".layer-row.selected .layer-name > span:last-child").allTextContents();
}

async function refresh(page: Page) {
  const current = (await session(page)).projects[0];
  await page.reload();
  await page.getByRole("button", { name: current.document.name, exact: true }).click();
  await page.locator('.canvas-world [data-orc-id="outer"]').waitFor();
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

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function artifact(suffix: string) {
  return join(artifacts, `clipping-${phase}-${suffix}`);
}

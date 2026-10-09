import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Locator, type Page } from "playwright";
import { parseCommand, type Command, type Mutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_MOVEMENT_EVIDENCE ?? "verification";
const modes = process.env.ORC_MOVEMENT_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "movement-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
const inputs: unknown[] = [];
const evidence = sourceEvidence();
const requirements = [
  "Canvas arrows move compatible Free objects 1 unzoomed px; Shift moves 8 px, independently of zoom.",
  "Start/End/Both/Center retain authored relationships, parent, sizing and selection.",
  "Several compatible Free targets move atomically; own/ancestor locks and unsupported mixed layouts reject whole operation.",
  "One Row/Column child swaps one participating sibling; Absolute siblings have no flow slot; wrapped Row order stays authoritative.",
  "Flex Shift still reorders; cross-axis and edge keys preserve history.",
  "Text, Properties, Code, menus and Preview preserve local key behavior without document movement.",
  "Draft Cancel preserves draft/source/history; Discard allows movement; immediate Undo waits for acknowledgement.",
  "Exact Undo/Redo and save/reopen retain CSS, hierarchy and native geometry.",
];
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
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), command: `ORC_MOVEMENT_EVIDENCE=${phase} ORC_MOVEMENT_MODES=${modes} bun scripts/e2e/editor/check-movement.ts ${channel}`, phase, modes, requirements, checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("keyboard movement workflow passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  browserErrors(page, errors);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await accepted(page, { kind: "insert", nodes: fixture() });
    await refresh(page);
    await page.locator('.canvas-world [data-orc-id="loose"]').click();
    await initialMovement(page);
    await freeMovement(page, mode);
    await constraintMovement(page, mode);
    await flexMovement(page, mode);
    await rejectedMovement(page, mode);
    await focusProtection(page, mode);
    await draftProtection(page, mode);
    await pendingHistory(page, mode);
    await queuedHistory(page, mode);
    await saveReopen(page, mode);
    assert.deepEqual(errors, [], "No uncaught browser errors");
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    inputs.push({ mode, browserErrors: errors, appOutput: app.output });
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    checks.push(`${mode}: owned app shut down gracefully`);
  }
}

function text(id: string, parentId: string | null, style: DesignNode["style"] = {}): DesignNode {
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
    runs: [{ text: id, style: {} }],
    style: { width: "60px", height: "24px", margin: "0", "flex-shrink": "0", ...style },
  };
}

async function initialMovement(page: Page) {
  const before = (await session(page)).projects[0].document;
  const bounds = await geometry(page, "loose");
  const pending = page.waitForResponse(isCommand, { timeout: 2000 }).catch(() => null);
  await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
  const response = await pending;
  const after = (await session(page)).projects[0].document;
  if (response) await renderSettled(page);
  const moved = await geometry(page, "loose");
  inputs.push({ trigger: "Canvas ArrowRight", before, after, bounds, moved });
  assert.equal(after.nodes.loose.style.left, "41px", "Canvas Right must nudge loose object 1 px");
  assert.equal(after.revision, before.revision + 1);
  near(moved.x - bounds.x, 1);
  await undoRedo(page, before, after);
  checks.push("Canvas Right moved the loose object 1 px in one history command");
}

async function accepted(page: Page, mutation: Mutation) {
  const document = (await session(page)).projects[0].document;
  const data = {
    projectId: document.id,
    commandId: crypto.randomUUID(),
    expectedRevision: document.revision,
    mutation,
  };
  const response = await page.request.post("/api/commands", { data });
  inputs.push({ request: data, status: response.status(), response: await response.json() });
  assert.equal(response.status(), 200);
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

async function refresh(page: Page) {
  const current = (await session(page)).projects[0];
  await page.reload();
  await page.getByRole("button", { name: current.document.name, exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).waitFor();
}

function artifact(suffix: string) {
  return join(artifacts, `movement-${phase}-${suffix}`);
}

function frame(id: string, children: string[], style: DesignNode["style"]): DesignNode {
  return {
    id,
    name: id,
    parentId: null,
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
      top: "100px",
      width: "300px",
      height: "300px",
      background: "#e8edf4",
      ...style,
    },
  };
}

function fixture(): DesignNode[] {
  return [...freeFixture(), ...flexFixture()];
}

function freeFixture(): DesignNode[] {
  return [
    text("loose", null, { position: "absolute", left: "40px", top: "40px" }),
    text("static-root", null, { margin: "12px" }),
    frame("free", ["start", "end", "both", "center", "static", "transformed", "preview-input"], {}),
    text("start", "free", { position: "absolute", left: "10%", top: "calc(10% + 6px)" }),
    text("end", "free", { position: "absolute", right: "calc(10% + 5px)", bottom: "10%" }),
    text("both", "free", {
      position: "absolute",
      left: "10%",
      right: "calc(10% + 5px)",
      top: "110px",
      bottom: "120px",
      width: "auto",
      height: "auto",
    }),
    text("center", "free", {
      position: "absolute",
      left: "calc(50% + 7px)",
      top: "calc(50% - 6px)",
      transform: "translate(-50%, -50%)",
    }),
    nativeInput(),
    text("static", "free", { margin: "4px" }),
    text("transformed", "free", {
      position: "absolute",
      left: "170px",
      top: "240px",
      transform: "rotate(20deg)",
    }),
  ];
}

function flexFixture(): DesignNode[] {
  return [
    frame("row", ["ra", "absolute", "hidden", "none", "rb", "rc"], {
      top: "440px",
      display: "flex",
      gap: "8px",
      height: "60px",
    }),
    text("ra", "row"),
    text("absolute", "row", { position: "absolute", left: "220px", top: "30px" }),
    { ...text("hidden", "row"), visible: false },
    text("none", "row", { display: "none" }),
    text("rb", "row"),
    text("rc", "row"),
    frame("column", ["ca", "cb", "cc"], {
      left: "370px",
      top: "100px",
      display: "flex",
      "flex-direction": "column",
      gap: "8px",
      width: "100px",
      height: "140px",
    }),
    text("ca", "column"),
    text("cb", "column"),
    text("cc", "column"),
    frame("wrap", ["wa", "wb", "wc"], {
      left: "370px",
      top: "300px",
      display: "flex",
      "flex-wrap": "wrap",
      gap: "8px",
      width: "130px",
      height: "90px",
    }),
    text("wa", "wrap"),
    text("wb", "wrap"),
    text("wc", "wrap"),
  ];
}

async function select(page: Page, ids: string[]) {
  for (const id of ids) {
    const node = (await session(page)).projects[0].document.nodes[id];
    if (
      node.parentId &&
      (await page.getByRole("button", { name: `Expand ${node.parentId}`, exact: true }).count())
    )
      await page.getByRole("button", { name: `Expand ${node.parentId}`, exact: true }).click();
    await page
      .locator(".layer-name")
      .filter({ has: page.getByText(id, { exact: true }) })
      .click({ modifiers: id === ids[0] ? [] : ["Shift"] });
  }
  assert.deepEqual(await selection(page), ids);
  await page.getByRole("application", { name: "Canvas" }).focus();
}

async function selection(page: Page) {
  return page.locator(".layer-row.selected .layer-name > span:last-child").allTextContents();
}

function isCommand(response: import("playwright").Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}

async function key(page: Page, value: string) {
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("application", { name: "Canvas" }).press(value);
  const response = await pending;
  inputs.push({
    trigger: `Canvas ${value}`,
    request: response.request().postDataJSON(),
    status: response.status(),
    response: await response.json(),
  });
  assert.equal(response.status(), 200);
  await renderSettled(page);
  return (await session(page)).projects[0].document;
}

async function renderSettled(page: Page) {
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

async function geometry(page: Page, id: string) {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`).evaluate((element) => {
    const world = element.closest(".canvas-world");
    assertBrowser(world);
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const rect = element.getBoundingClientRect();
    const origin = world.getBoundingClientRect();
    return {
      x: (rect.x - origin.x) / scale,
      y: (rect.y - origin.y) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
      scale,
    };
    function assertBrowser(value: Element | null): asserts value is Element {
      if (!value) throw new Error("Missing canvas world.");
    }
  });
}

function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.03, `Expected ${expected}, got ${actual}`);
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual(
    { ...actual, revision: 0 },
    { ...expected, revision: 0 },
    "Exact authored styles, identity, hierarchy, content and settings",
  );
}

async function history(page: Page, direction: "undo" | "redo") {
  const pending = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/history" && response.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  const response = await pending;
  inputs.push({
    trigger: `Canvas ${direction}`,
    request: response.request().postDataJSON(),
    status: response.status(),
    response: await response.json(),
  });
  assert.equal(response.status(), 200);
  await renderSettled(page);
}

async function undoRedo(page: Page, before: DesignDocument, after: DesignDocument) {
  const selected = await selection(page);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  assert.deepEqual(await selection(page), selected);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  assert.deepEqual(await selection(page), selected);
}

async function freeMovement(page: Page, mode: string) {
  for (const id of ["loose", "static-root", "static", "absolute"]) {
    await select(page, [id]);
    for (const [value, x, y] of [
      ["ArrowLeft", -1, 0],
      ["ArrowDown", 0, 1],
      ["Shift+ArrowRight", 8, 0],
      ["Shift+ArrowUp", 0, -8],
    ] satisfies [string, number, number][]) {
      const before = (await session(page)).projects[0].document;
      const bounds = await geometry(page, id);
      const after = await key(page, value);
      const moved = await geometry(page, id);
      near(moved.x - bounds.x, x);
      near(moved.y - bounds.y, y);
      near(moved.width, bounds.width);
      near(moved.height, bounds.height);
      assert.equal(after.revision, before.revision + 1);
      assert.equal(after.nodes[id].parentId, before.nodes[id].parentId);
      if (id.startsWith("static")) assert.notEqual(after.nodes[id].style.position, "absolute");
      await undoRedo(page, before, after);
    }
  }
  await zoomMovement(page);
  await multiMovement(page);
  await overlappingMovement(page);
  checks.push(
    `${mode}: all arrows, Shift 8px, loose/static/Absolute native placement, zoom-independent units and several-Free one-step history`,
  );
}

async function zoomMovement(page: Page) {
  await select(page, ["loose"]);
  const before = await geometry(page, "loose");
  await page.getByRole("application", { name: "Canvas" }).hover();
  await page.mouse.wheel(0, 420);
  await renderSettled(page);
  const zoomed = await geometry(page, "loose");
  assert.notEqual(zoomed.scale, before.scale);
  near(zoomed.x, before.x);
  near(zoomed.y, before.y);
  const document = (await session(page)).projects[0].document;
  await key(page, "Shift+ArrowRight");
  const moved = await geometry(page, "loose");
  near(moved.x - zoomed.x, 8);
  assert.equal(
    (await session(page)).projects[0].document.nodes.loose.style.left,
    `${parseFloat(document.nodes.loose.style.left) + 8}px`,
  );
  await page.mouse.wheel(0, -420);
  await renderSettled(page);
}

async function multiMovement(page: Page) {
  await select(page, ["loose", "start", "end"]);
  const before = (await session(page)).projects[0].document;
  const boxes = await Promise.all(["loose", "start", "end"].map((id) => geometry(page, id)));
  const after = await key(page, "Shift+ArrowDown");
  assert.equal(
    after.revision,
    before.revision + 1,
    "Several compatible Free targets form one atomic revision",
  );
  for (const [index, id] of ["loose", "start", "end"].entries()) {
    const moved = await geometry(page, id);
    near(moved.y - boxes[index].y, 8);
    near(moved.x, boxes[index].x);
  }
  assert.deepEqual(await selection(page), ["loose", "start", "end"]);
  await undoRedo(page, before, after);
}

async function constraintMovement(page: Page, mode: string) {
  for (const id of ["start", "end", "both", "center"]) {
    await select(page, [id]);
    const before = (await session(page)).projects[0].document;
    const bounds = await geometry(page, id);
    await key(page, "Shift+ArrowRight");
    const after = await key(page, "ArrowUp");
    const moved = await geometry(page, id);
    near(moved.x - bounds.x, 8);
    near(moved.y - bounds.y, -1);
    near(moved.width, bounds.width);
    near(moved.height, bounds.height);
    assert.deepEqual(
      Object.keys(after.nodes[id].style).sort(),
      Object.keys(before.nodes[id].style).sort(),
    );
    assert.equal(after.nodes[id].style.transform, before.nodes[id].style.transform);
    for (const [property, value] of Object.entries(before.nodes[id].style))
      if (value.includes("%"))
        assert.ok(
          after.nodes[id].style[property].includes("%"),
          "Keep authored percentage relationship",
        );
    await responsiveConstraints(page, id, moved);
    await page.screenshot({ path: artifact(`${mode}-${id}-constraint.png`), fullPage: true });
  }
  checks.push(
    `${mode}: Start/End/Both/Center nudge preserves native size, authored percentages/calculations and responsive parent relationships`,
  );
}

async function responsiveConstraints(
  page: Page,
  id: string,
  before: Awaited<ReturnType<typeof geometry>>,
) {
  await accepted(page, { kind: "style", id: "free", values: { width: "400px", height: "400px" } });
  await refresh(page);
  const after = await geometry(page, id);
  near(after.x - before.x, id === "end" ? 90 : id === "center" ? 50 : 10);
  if (id === "both") near(after.width - before.width, 80);
  else near(after.width, before.width);
  near(after.y - before.y, id === "end" ? 90 : id === "center" ? 50 : id === "start" ? 10 : 0);
  await history(page, "undo");
}

async function flexMovement(page: Page, mode: string) {
  for (const [parentId, id, forward, backward, cross] of [
    ["row", "ra", "ArrowRight", "ArrowLeft", "ArrowDown"],
    ["column", "ca", "ArrowDown", "ArrowUp", "ArrowRight"],
    ["wrap", "wa", "ArrowRight", "ArrowLeft", "ArrowDown"],
  ]) {
    await select(page, [id]);
    const before = (await session(page)).projects[0].document;
    await unchangedKey(page, cross);
    await unchangedKey(page, backward);
    for (const value of [forward, `Shift+${forward}`]) {
      const prior = (await session(page)).projects[0].document;
      const flow = participating(prior, parentId);
      const index = flow.indexOf(id);
      [flow[index], flow[index + 1]] = [flow[index + 1], flow[index]];
      const after = await key(page, value);
      assert.deepEqual(participating(after, parentId), flow);
      assert.equal(after.revision, prior.revision + 1);
      for (const child of prior.nodes[parentId].children)
        assert.deepEqual(
          after.nodes[child],
          prior.nodes[child],
          "Reorder retains every child's authored positioning/sizing",
        );
      await nativeOrder(page, parentId, after);
      await undoRedo(page, prior, after);
    }
    await unchangedKey(page, forward);
    await key(page, backward);
    await key(page, `Shift+${backward}`);
    const restored = (await session(page)).projects[0].document;
    assert.deepEqual(participating(restored, parentId), participating(before, parentId));
    await nativeOrder(page, parentId, restored);
    await page.screenshot({ path: artifact(`${mode}-${parentId}-order.png`), fullPage: true });
  }
  checks.push(
    `${mode}: Row/Column/wrapped Row move exactly one participating slot, exclude Absolute siblings, Shift reorders, cross-axis/edges preserve history, native DOM and Layers order agree`,
  );
}

function participating(document: DesignDocument, parentId: string) {
  return document.nodes[parentId].children.filter(
    (id) =>
      document.nodes[id].visible &&
      document.nodes[id].style.display !== "none" &&
      document.nodes[id].style.position !== "absolute",
  );
}

async function nativeOrder(page: Page, parentId: string, document: DesignDocument) {
  const ids = await page
    .locator(`.canvas-world [data-orc-id="${parentId}"]`)
    .evaluate((element) =>
      Array.from(element.children).map((child) => child.getAttribute("data-orc-id")),
    );
  assert.deepEqual(
    ids,
    document.nodes[parentId].children.filter((id) => document.nodes[id].visible),
    "Native DOM uses saved visible sibling order",
  );
  const flow = participating(document, parentId);
  const boxes = await Promise.all(flow.map((id) => geometry(page, id)));
  for (let index = 1; index < flow.length; index++) {
    if (parentId === "column") assert.ok(boxes[index].y > boxes[index - 1].y);
    else assert.ok(boxes[index].y > boxes[index - 1].y || boxes[index].x > boxes[index - 1].x);
  }
  if (parentId === "wrap")
    assert.ok(boxes[2].y > boxes[0].y, "Native wrapping creates another row");
  if (await page.getByRole("button", { name: `Expand ${parentId}`, exact: true }).count())
    await page.getByRole("button", { name: `Expand ${parentId}`, exact: true }).click();
  const names = await page
    .locator(".layer-row")
    .filter({ has: page.getByRole("button", { name: `Collapse ${parentId}`, exact: true }) })
    .locator("..")
    .locator("ul .layer-name > span:last-child")
    .allTextContents();
  assert.deepEqual(
    names,
    document.nodes[parentId].children,
    "Layers uses the same authoritative order",
  );
}

async function unchangedKey(page: Page, value: string, visible = false) {
  for (const name of ["Dismiss error", "Dismiss"]) {
    const dismiss = page.getByRole("button", { name, exact: true });
    if (await dismiss.count()) await dismiss.click();
  }
  const before = await session(page);
  const selected = await selection(page);
  const boxes = await Promise.all(selected.map((id) => geometry(page, id)));
  await page.getByRole("application", { name: "Canvas" }).press(value);
  await page.waitForTimeout(180);
  assert.deepEqual(
    await session(page),
    before,
    "Unavailable key retains source, revision, both history stacks and save state",
  );
  assert.deepEqual(await selection(page), selected);
  assert.deepEqual(
    await Promise.all(selected.map((id) => geometry(page, id))),
    boxes,
    "Rejected movement retains live geometry",
  );
  if (visible) {
    const refusal = page.locator(".workspace-notice, [role=alert]");
    assert.ok(
      (await refusal.allTextContents()).some((text) => text.trim().length > 0),
      "Unsupported movement visibly explains refusal",
    );
  }
  inputs.push({
    trigger: `Canvas ${value}`,
    rejected: true,
    before,
    after: await session(page),
    selected,
  });
}

async function rejectedMovement(page: Page, mode: string) {
  for (const locked of ["start", "free"]) {
    await accepted(page, { kind: "lock", id: locked, locked: true });
    await refresh(page);
    await select(page, ["loose", "start"]);
    await unchangedKey(page, "Shift+ArrowRight", true);
    await select(page, ["start"]);
    await unchangedKey(page, "ArrowDown", true);
    await accepted(page, { kind: "lock", id: locked, locked: false });
    await refresh(page);
  }
  await select(page, ["loose", "ra"]);
  await unchangedKey(page, "ArrowRight", true);
  await select(page, ["ra", "rb"]);
  await unchangedKey(page, "ArrowRight", true);
  await ownTransformMovement(page);
  await rejectedRelationships(page);
  checks.push(
    `${mode}: own/ancestor locks, locked several-Free target, mixed Free/Flex, several-Flex and unsupported geometry reject visibly with unchanged source/selection/history`,
  );
}

async function rejectedRelationships(page: Page) {
  for (const [id, values] of [
    ["ra", { order: "2" }],
    ["row", { "flex-direction": "row-reverse" }],
    ["free", { transform: "scale(1.2)" }],
    ["start", { "inset-inline-start": "4px" }],
  ] satisfies [string, DesignNode["style"]][]) {
    await accepted(page, { kind: "style", id, values });
    await refresh(page);
    await select(page, [id === "row" || id === "ra" ? "ra" : "start"]);
    await unchangedKey(page, "ArrowRight", true);
    await history(page, "undo");
  }
}

async function focusProtection(page: Page, mode: string) {
  await select(page, ["loose"]);
  const before = (await session(page)).projects[0].document;
  const content = page.getByRole("textbox", { name: "Content", exact: true });
  await caretKeys(content);
  assertContent((await session(page)).projects[0].document, before);
  await textFocus(page);
  await codeFocus(page);
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await menuFocus(page);
  await select(page, ["free"]);
  const document = (await session(page)).projects[0].document;
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
  const input = page.locator('.preview-world [data-orc-id="preview-input"]');
  await input.press("ArrowUp");
  assert.equal(await input.inputValue(), "4", "Preview sends arrow to live native control");
  await page.getByRole("button", { name: "Exit Preview", exact: true }).press("ArrowDown");
  assertContent((await session(page)).projects[0].document, document);
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  assert.deepEqual(await selection(page), ["free"]);
  checks.push(
    `${mode}: Properties, inline Text, Code, focused dialogs and Preview arrows never move applied design`,
  );
}

async function textFocus(page: Page) {
  const before = (await session(page)).projects[0].document;
  await page.locator('.canvas-world [data-orc-id="loose"]').dblclick();
  const editor = page.getByRole("textbox", { name: "Edit canvas text", exact: true });
  await editor.waitFor();
  await caretKeys(editor);
  assertContent((await session(page)).projects[0].document, before);
  await editor.press("Escape");
  await editor.waitFor({ state: "hidden" });
}

async function codeFocus(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.waitFor();
  const before = await session(page);
  await source.press("Control+End");
  await source.press("ArrowLeft");
  await source.press("Shift+ArrowRight");
  assert.deepEqual(await session(page), before);
  await source.press("Control+End");
  await source.press("End");
  await source.press("Space");
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
}

async function menuFocus(page: Page) {
  await page.getByRole("button", { name: "New or open project", exact: true }).click();
  const before = await session(page);
  const open = page.getByRole("button", { name: "Open project", exact: true });
  await open.press("ArrowDown");
  await open.press("Shift+ArrowRight");
  assert.deepEqual(await session(page), before);
  await open.press("Escape");
  await page.getByRole("button", { name: "New or open project", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).focus();
}

async function draftProtection(page: Page, mode: string) {
  await select(page, ["start"]);
  await codeFocus(page);
  const draft = await page.getByRole("textbox", { name: "Object source", exact: true }).innerText();
  const before = await session(page);
  await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).press("ArrowRight");
  assert.deepEqual(await session(page), before);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.deepEqual(await selection(page), ["start"]);
  assert.equal(
    await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
    draft,
  );
  await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
  await dialog.waitFor();
  const pending = page.waitForResponse(isCommand);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.equal((await pending).status(), 200);
  await renderSettled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.projects[0].document.revision + 1);
  assert.equal(await page.getByText("Unapplied changes", { exact: true }).count(), 0);
  await undoRedo(page, before.projects[0].document, after);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    `${mode}: draft Cancel preserves source/selection/history, dialog arrows stay local, Discard completes nudge and exact one-step history`,
  );
}

async function pendingHistory(page: Page, mode: string) {
  await select(page, ["loose"]);
  const before = (await session(page)).projects[0].document;
  const { acknowledge, ready } = await holdCommand(page);
  try {
    await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
    await bounded(ready);
    const applied = (await session(page)).projects[0].document;
    assert.equal(applied.revision, before.revision + 1);
    assert.equal(
      applied.nodes.loose.style.left,
      `${parseFloat(before.nodes.loose.style.left) + 1}px`,
    );
    const undone = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/history",
    );
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    assertContent((await session(page)).projects[0].document, applied);
    acknowledge();
    assert.equal((await undone).status(), 200);
    await renderSettled(page);
    assertContent((await session(page)).projects[0].document, before);
    assert.deepEqual(await selection(page), ["loose"]);
  } finally {
    acknowledge();
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    `${mode}: immediate Canvas Undo while keyboard command response is pending waits and reverses that exact movement`,
  );
}

async function holdCommand(page: Page) {
  const commands: Command[] = [];
  let acknowledge = () => {};
  let received = () => {};
  const release = new Promise<void>((resolve) => {
    acknowledge = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route("**/api/commands", async (route) => {
    commands.push(parseCommand(route.request().postDataJSON()));
    const response = await route.fetch();
    inputs.push({
      trigger: "held keyboard command acknowledgement",
      request: route.request().postDataJSON(),
      status: response.status(),
      response: await response.json(),
    });
    received();
    await release;
    await route.fulfill({ response });
  });
  return { acknowledge, ready, commands };
}

async function bounded(pending: Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Keyboard command was not received.")), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function saveReopen(page: Page, mode: string) {
  const ids = fixture()
    .filter((node) => node.visible && node.style.display !== "none")
    .map((node) => node.id);
  const boxes = await Promise.all(ids.map((id) => geometry(page, id)));
  const saved = await saveAndOpen(page, mode);
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo, false);
  assert.equal(reopened.canRedo, false);
  await renderSettled(page);
  for (const [index, id] of ids.entries()) {
    const actual = await geometry(page, id);
    for (const property of ["x", "y", "width", "height"] satisfies (keyof typeof actual)[])
      near(actual[property], boxes[index][property]);
  }
  for (const id of ["row", "column", "wrap"]) await nativeOrder(page, id, reopened.document);
  inputs.push({
    trigger: "UI Save/Close/Open",
    path: saved.path,
    document: saved.document,
    reopened,
    boxes,
  });
  checks.push(
    `${mode}: UI Save/Close/Open preserves exact CSS, source identity, hierarchy and native geometry; reopened history starts empty`,
  );
}

async function saveAndOpen(page: Page, mode: string) {
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Movement ${mode}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), temporary));
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const saved = (await session(page)).projects[0];
  assert.ok(saved.path);
  const disk: unknown = JSON.parse(await readFile(join(saved.path, "document.json"), "utf8"));
  assert.deepEqual(disk, saved.document);
  await page.getByRole("button", { name: `Close ${saved.document.name}`, exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(saved.path);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  return saved;
}

async function overlappingMovement(page: Page) {
  await select(page, ["free", "start"]);
  const before = (await session(page)).projects[0].document;
  const parent = await geometry(page, "free");
  const child = await geometry(page, "start");
  const after = await key(page, "Shift+ArrowRight");
  near((await geometry(page, "free")).x - parent.x, 8);
  near((await geometry(page, "start")).x - child.x, 8);
  assert.deepEqual(
    after.nodes.start,
    before.nodes.start,
    "Selected descendant moves through its selected parent once",
  );
  assert.equal(after.revision, before.revision + 1);
  assert.deepEqual(await selection(page), ["free", "start"]);
  await undoRedo(page, before, after);
}

async function ownTransformMovement(page: Page) {
  await select(page, ["transformed"]);
  const before = (await session(page)).projects[0].document;
  const bounds = await geometry(page, "transformed");
  const after = await key(page, "ArrowRight");
  const moved = await geometry(page, "transformed");
  near(moved.x - bounds.x, 1);
  near(moved.y, bounds.y);
  assert.equal(after.nodes.transformed.style.transform, before.nodes.transformed.style.transform);
  await undoRedo(page, before, after);
}

function nativeInput(): DesignNode {
  return {
    id: "preview-input",
    name: "preview-input",
    parentId: "free",
    children: [],
    visible: true,
    locked: false,
    attributes: { type: "number", value: "3", "aria-label": "Preview number" },
    kind: "element",
    tag: "input",
    style: { position: "absolute", left: "10px", top: "260px", width: "60px", height: "24px" },
  };
}

async function caretKeys(editor: Locator) {
  await editor.press("Control+Home");
  await editor.press("ArrowRight");
  await editor.press("Shift+ArrowRight");
  const caret = await editor.evaluate((element) => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement))
      throw new Error("Expected native text editor.");
    return { start: element.selectionStart, end: element.selectionEnd };
  });
  assert.deepEqual(
    caret,
    { start: 1, end: 2 },
    "Native arrow caret and Shift selection remain available",
  );
  inputs.push({ trigger: "Local text arrows", caret });
}

function browserErrors(page: Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
}

async function queuedHistory(page: Page, mode: string) {
  await select(page, ["loose"]);
  const before = (await session(page)).projects[0].document;
  const { acknowledge, ready, commands } = await holdCommand(page);
  try {
    await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
    await bounded(ready);
    await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
    await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
    const undone = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/history",
    );
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    assert.equal((await session(page)).projects[0].document.revision, before.revision + 1);
    acknowledge();
    assert.equal((await undone).status(), 200);
    await renderSettled(page);
    const after = (await session(page)).projects[0].document;
    assert.equal(after.revision, before.revision + 4);
    const expected = structuredClone(before);
    expected.nodes.loose.style.left = `${parseFloat(before.nodes.loose.style.left) + 2}px`;
    assertContent(after, expected);
    assert.deepEqual(
      commands.map((command) => command.expectedRevision),
      [before.revision, before.revision + 1, before.revision + 2],
    );
    assert.equal(new Set(commands.map((command) => command.commandId)).size, 3);
    assert.deepEqual(await selection(page), ["loose"]);
    await history(page, "undo");
    await history(page, "undo");
    assertContent((await session(page)).projects[0].document, before);
    inputs.push({ trigger: "Three queued Right keys and immediate Undo", before, after, commands });
  } finally {
    acknowledge();
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    `${mode}: three queued arrows use fresh revisions once each; immediate Undo reverses the final movement after acknowledgement`,
  );
}

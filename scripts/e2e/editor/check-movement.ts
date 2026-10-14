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
  "Pointer previews use unscaled CSS positions; release commits once and Escape restores without history.",
  "Flex pointer slots show the receiving outline and insertion line in Row, Column and wrapped Row.",
  "Draft Discard after pointer release completes selection without resuming movement or creating history.",
  "Frame drops convert Free placement and constraints or join the marked Flex slot atomically.",
  "Flex position fields show native parent-relative coordinates read-only and offer guarded parent selection without edits or history, including locked objects.",
  "Owned main-axis Fill pointer drops share equal outer sizes in bounded nowrap destinations with supported Fixed/Fit siblings; retargeting preserves frozen ownership.",
  "Explicit pixel Fixed aspect-ratio participants remain supported beside main-axis Fill.",
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
    await prepareMovementFixture(page, app.url);
    await parentPositionFields(page);
    await parentPositionDraft(page);
    await parentPositionInspection(page, mode);
    await initialMovement(page);
    await freeMovement(page, mode);
    await constraintMovement(page, mode);
    await flexMovement(page, mode);
    await rejectedMovement(page, mode);
    await focusProtection(page, mode);
    await draftProtection(page, mode);
    await pendingHistory(page, mode);
    await queuedHistory(page, mode);
    await pointerReparenting(page);
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

async function parentPositionFields(page: Page) {
  for (const [id, parent] of [
    ["rb", "row"],
    ["cb", "column"],
    ["wb", "wrap"],
  ]) {
    await select(page, [id]);
    await renderSettled(page);
    const before = await session(page);
    await parentPositionValues(page, id);
    for (const label of ["X", "Y"]) {
      const field = page.getByLabel(label, { exact: true });
      assert.equal(await field.getAttribute("readonly"), "", "Flex position must be read-only");
      await field.press("Control+a");
      await field.press("9");
      await field.press("Tab");
    }
    await page.getByText(`Position controlled by ${parent}`, { exact: true }).waitFor();
    await page.getByRole("button", { name: "Select parent", exact: true }).click();
    assert.deepEqual(await selection(page), [parent]);
    assert.deepEqual(
      await session(page),
      before,
      "Inspecting controlled positions creates no edits or history",
    );
  }
  await select(page, ["loose"]);
  assert.equal(await page.getByLabel("X", { exact: true }).getAttribute("readonly"), null);
  await select(page, ["absolute"]);
  assert.equal(await page.getByLabel("X", { exact: true }).getAttribute("readonly"), null);
  await select(page, ["loose"]);
  checks.push(
    "Flex position fields are read-only, explain their parent and select it without editing; roots and Absolute children retain position controls",
  );
}

async function parentPositionValues(page: Page, id: string) {
  const position = await page.locator(`.canvas-world [data-orc-id="${id}"]`).evaluate((element) => {
    const parent = element.parentElement;
    const world = element.closest(".canvas-world");
    if (!parent || !world) throw new Error("Missing position reference");
    const box = element.getBoundingClientRect();
    const origin = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    return {
      X: (box.x - origin.x) / scale - parseFloat(style.borderLeftWidth) + parent.scrollLeft,
      Y: (box.y - origin.y) / scale - parseFloat(style.borderTopWidth) + parent.scrollTop,
    };
  });
  for (const [label, expected] of Object.entries(position)) {
    const actual = Number(await page.getByLabel(label, { exact: true }).inputValue());
    near(actual, expected);
  }
  inputs.push({ trigger: "Inspect parent-controlled position", id, position });
}

async function parentPositionDraft(page: Page) {
  await select(page, ["rb"]);
  await codeFocus(page);
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = await source.innerText();
  const before = await session(page);
  const parent = page.getByRole("button", { name: "Select parent", exact: true });
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await parent.click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await source.innerText(), draft);
  assert.deepEqual(await selection(page), ["rb"]);
  assert.deepEqual(await session(page), before);
  await parent.click();
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.deepEqual(await selection(page), ["row"]);
  assert.equal(await page.getByText("Unapplied changes", { exact: true }).count(), 0);
  assert.deepEqual(await session(page), before);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Select parent uses Code draft Cancel/Discard safeguards without document edits or history",
  );
}

async function parentPositionInspection(page: Page, mode: string) {
  for (const id of ["rb", "row"]) {
    await accepted(page, { kind: "lock", id, locked: true });
    await select(page, ["rb"]);
    await page.getByText("Position controlled by row", { exact: true }).waitFor();
    const before = await session(page);
    assert.equal(await page.getByLabel("Name", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("X", { exact: true }).getAttribute("readonly"), "");
    await parentPositionValues(page, "rb");
    await page.getByRole("button", { name: "Select parent", exact: true }).click();
    assert.deepEqual(await selection(page), ["row"]);
    assert.deepEqual(await session(page), before);
    await accepted(page, { kind: "lock", id, locked: false });
  }
  await parentPositionGeometry(page);
  await parentPositionSource(page);
  await select(page, ["loose"]);
  checks.push(
    `${mode}: parent-relative coordinates account for responsive layout, borders, padding and zoom; locked objects allow parent inspection; transformed positions preserve source`,
  );
}

async function parentPositionGeometry(page: Page) {
  const document = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "style",
    id: "row",
    values: {
      padding: "12px",
      border: "3px solid black",
      width: "40vw",
      "justify-content": "space-between",
    },
  });
  await select(page, ["rb"]);
  await renderSettled(page);
  await parentPositionValues(page, "rb");
  const before = await session(page);
  const x = await page.getByLabel("X", { exact: true }).inputValue();
  await page.setViewportSize({ width: 1280, height: 900 });
  await renderSettled(page);
  await parentPositionValues(page, "rb");
  assert.notEqual(await page.getByLabel("X", { exact: true }).inputValue(), x);
  await page.getByRole("application", { name: "Canvas" }).hover();
  await page.mouse.wheel(0, 240);
  await renderSettled(page);
  await parentPositionValues(page, "rb");
  await page.mouse.wheel(0, -240);
  await page.setViewportSize({ width: 1440, height: 900 });
  assert.deepEqual(await session(page), before);
  await accepted(page, {
    kind: "style",
    id: "row",
    values: document.nodes.row.style,
    unset: ["padding", "border", "justify-content"],
  });
}

async function parentPositionSource(page: Page) {
  for (const id of ["rb", "row"]) {
    await accepted(page, { kind: "style", id, values: { transform: "scale(1.1)" } });
    await select(page, ["rb"]);
    await renderSettled(page);
    const before = await session(page);
    assert.equal(await page.getByLabel("X", { exact: true }).inputValue(), "Edit source");
    assert.equal(await page.getByLabel("Y", { exact: true }).inputValue(), "Edit source");
    await page.getByRole("button", { name: "Select parent", exact: true }).click();
    assert.deepEqual(await selection(page), ["row"]);
    assert.deepEqual(await session(page), before);
    await accepted(page, { kind: "style", id, values: {}, unset: ["transform"] });
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

async function prepareMovementFixture(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await accepted(page, { kind: "insert", nodes: fixture() });
  await refresh(page);
  await page.locator('.canvas-world [data-orc-id="loose"]').click();
}

async function initialMovement(page: Page) {
  await pointerMovement(page);
  await unselectedPointer(page);
  await flexPointerSelection(page);
  await flexPointerMovement(page);
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
  assert.equal(response.status(), 200);
  const result = parseSession(await response.json());
  inputs.push({ request: data, status: response.status(), response: result });
  await page.waitForFunction(
    (revision) =>
      window.document.querySelector(".canvas")?.getAttribute("data-orc-revision") ===
      String(revision),
    result.projects[0].document.revision,
  );
  await renderSettled(page);
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

function reparentFixture(): DesignNode[] {
  return [
    frame("drop-free", [], {
      left: "700px",
      top: "100px",
      width: "300px",
      height: "250px",
      border: "6px solid #8c96a4",
      padding: "12px",
      "box-sizing": "border-box",
    }),
    { ...frame("drop-locked", [], { left: "700px", top: "440px", height: "70px" }), locked: true },
    text("reparent-margin", null, {
      position: "absolute",
      left: "260px",
      top: "40px",
      margin: "3px 7px",
    }),
    ...reparentWrapperFixture(),
    ...reparentFrameFixture(),
    ...reparentSizingFixture(),
    text("bounded-center", "free", { position: "absolute", left: "min(50%, 100px)", top: "200px" }),
  ];
}

function reparentWrapperFixture(): DesignNode[] {
  return [
    {
      id: "reparent-wrapper",
      name: "reparent-wrapper",
      parentId: "free",
      children: ["inside-wrapper"],
      visible: true,
      locked: false,
      attributes: {},
      kind: "element",
      tag: "div",
      style: { position: "absolute", left: "160px", top: "10px", width: "100px", height: "50px" },
    },
    text("inside-wrapper", "reparent-wrapper", { position: "absolute", left: "10px", top: "10px" }),
  ];
}

function reparentFrameFixture(): DesignNode[] {
  return [
    frame("movable-frame", ["frame-child"], {
      left: "40px",
      top: "650px",
      width: "200px",
      height: "70px",
    }),
    {
      ...frame("frame-child", ["nested-label"], {
        left: "16px",
        top: "12px",
        width: "80px",
        height: "40px",
      }),
      parentId: "movable-frame",
    },
    text("nested-label", "frame-child", { position: "absolute", left: "4px", top: "4px" }),
  ];
}

function reparentSizingFixture(): DesignNode[] {
  return [
    frame("fill-row", ["fill-a", "fill-b", "cross-fill", "cross-auto-margin"], {
      left: "700px",
      top: "570px",
      width: "300px",
      height: "60px",
      display: "flex",
      gap: "8px",
      "align-items": "center",
    }),
    text("fill-a", "fill-row", { width: "auto", flex: "1 1 0px" }),
    text("fill-b", "fill-row", { width: "auto", flex: "1 1 0px" }),
    text("cross-fill", "fill-row", { height: "auto", "align-self": "stretch" }),
    text("cross-auto-margin", "fill-row", {
      height: "auto",
      "align-self": "stretch",
      "margin-top": "auto",
    }),
    text("fit-text", null, {
      position: "absolute",
      left: "280px",
      top: "580px",
      width: "max-content",
      height: "auto",
    }),
  ];
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
    const document = (await session(page)).projects[0].document;
    const parents: string[] = [];
    let parent = document.nodes[id].parentId;
    while (parent) {
      parents.unshift(parent);
      parent = document.nodes[parent].parentId;
    }
    for (const parent of parents) {
      const expand = page.getByRole("button", { name: `Expand ${parent}`, exact: true });
      if (await expand.count()) await expand.click();
    }
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
  await flexPointerDrop(page, "row", "ra", "rc", ["absolute", "hidden", "none", "rb", "rc", "ra"]);
  await zoomPointer(page);
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
  await pointerDraftCancel(page, before, draft);
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
  await pointerDraftDiscard(page);
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

async function pointerMovement(page: Page) {
  const before = (await session(page)).projects[0].document;
  const element = page.locator('.canvas-world [data-orc-id="loose"]');
  const bounds = await element.boundingBox();
  assert.ok(bounds);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await cancelledPointer(page, element, before, bounds, x, y);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 24, y + 12, { steps: 4 });
  const response = page.waitForResponse(isCommand);
  await page.mouse.up();
  await response;
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes.loose.style.left, "64px");
  await undoRedo(page, before, after);
  await history(page, "undo");
  await renderSettled(page);
  checks.push("Pointer preview, Escape, release and one-step history verified");
}

async function cancelledPointer(
  page: Page,
  element: Locator,
  before: DesignDocument,
  bounds: { x: number; y: number },
  x: number,
  y: number,
) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y + 6, { steps: 4 });
  await page.mouse.move(x + 24, y + 12, { steps: 4 });
  assert.deepEqual(
    (await session(page)).projects[0].document,
    before,
    "Preview must not change applied document",
  );
  const preview = await element.boundingBox();
  assert.ok(preview);
  near(preview.x - bounds.x, 24);
  near(preview.y - bounds.y, 12);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual(
    (await session(page)).projects[0].document,
    before,
    "Escape must create no revision",
  );
  const restored = await element.boundingBox();
  assert.ok(restored);
  near(restored.x, bounds.x);
}

async function unselectedPointer(page: Page) {
  await page.getByRole("application", { name: "Canvas" }).press("Escape");
  assert.deepEqual(await selection(page), []);
  const before = (await session(page)).projects[0].document;
  const element = page.locator('.canvas-world [data-orc-id="loose"]');
  const bounds = await element.boundingBox();
  assert.ok(bounds);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y + 15, { steps: 8 });
  const response = page.waitForResponse(isCommand, { timeout: 2000 });
  await page.mouse.up();
  await response;
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes.loose.style.left, "70px");
  assert.deepEqual(await selection(page), ["loose"]);
  await undoRedo(page, before, after);
  await history(page, "undo");
  checks.push("Dragging an initially unselected target selects it and commits exactly one move");
}

async function zoomPointer(page: Page) {
  const before = (await session(page)).projects[0].document;
  const original = await geometry(page, "loose");
  const bounds = await page.locator('.canvas-world [data-orc-id="loose"]').boundingBox();
  assert.ok(bounds);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 20 * original.scale, y + 10 * original.scale, { steps: 8 });
  const pending = page.waitForResponse(isCommand);
  await page.mouse.up();
  assert.equal((await pending).status(), 200);
  await renderSettled(page);
  const moved = await geometry(page, "loose");
  near(moved.x - original.x, 20);
  near(moved.y - original.y, 10);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  await undoRedo(page, before, after);
  await history(page, "undo");
  checks.push("Zoomed pointer movement preserves unscaled CSS coordinates and one-step history");
}

async function pointerDraftCancel(
  page: Page,
  before: Awaited<ReturnType<typeof session>>,
  draft: string,
) {
  await page.locator('.canvas-world [data-orc-id="loose"]').click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.deepEqual(await selection(page), ["start"]);
  assert.equal(
    await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
    draft,
  );
  checks.push(
    "Pointer selection draft Cancel preserves selection, draft, applied document and history",
  );
}

async function pointerReparenting(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await accepted(page, { kind: "insert", nodes: reparentFixture() });
  await refresh(page);
  await pointerReparent(page, "inside-wrapper", "reparent-wrapper");
  for (const id of ["loose", "end", "both", "center", "reparent-margin", "ra"])
    await pointerReparent(page, id, "drop-free");
  await pointerReparent(page, "loose", "row");
  await pointerReparent(page, "ra", "column");
  await pointerReparent(page, "start", "wrap");
  await pointerReparent(page, "start", null);
  await pointerReparent(page, "movable-frame", "drop-free");
  await pointerReparent(page, "movable-frame", "column");
  await pointerReparent(page, "fit-text", "row");
  await pointerReparent(page, "cross-fill", "row");
  await pointerReparent(page, "cross-auto-margin", "row");
  await pointerReparent(page, "fill-a", "row");
  await mainFillReparenting(page);
  await zoomReparent(page);
  await rejectedPointerDrop(page, "loose", "drop-locked");
  await rejectedPointerDrop(page, "transformed", "drop-free");
  await rejectedPointerDrop(page, "fill-a", "column");
  await rejectedPointerDrop(page, "bounded-center", "drop-free");
  await pointerReparent(page, "loose", "drop-free");
  await history(page, "redo");
  checks.push("A completed pointer reparent remains applied for Save/Close/Open verification");
}

async function mainFillReparenting(page: Page) {
  const before = (await session(page)).projects[0].document;
  const ids = ["fill-a", "fill-b", "fill-row", "row", "wrap", "ra"];
  try {
    await accepted(page, {
      kind: "batch",
      mutations: [
        { kind: "style", id: "fill-a", values: { flex: "1 0 0px", "min-width": "0px" } },
        { kind: "style", id: "fill-b", values: { width: "60px", flex: "0 0 auto" } },
        { kind: "style", id: "wrap", values: { width: "300px", "flex-wrap": "nowrap" } },
      ],
    });
    await mainFillPointerDrop(page, "fill-a", "row", 96);
    await mainFillBoundedDrop(page);
    await mainFillSharedDrop(page);
    await mainFillRejectedDestinations(page);
    await mainFillRetarget(page, false);
    await mainFillRetarget(page, true);
    await mainFillRatioDrops(page);
  } finally {
    await restoreMainFillStyles(page, before, ids);
  }
  assertContent((await session(page)).projects[0].document, before);
  assert.equal(before.nodes["fill-a"].style.flex, "1 1 0px");
  checks.push(
    "Main-axis Fill pointer fixtures restore all six original styles exactly, including legacy flex 1 1 0px",
  );
}

async function restoreMainFillStyles(page: Page, before: DesignDocument, ids: string[]) {
  const current = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "batch",
    mutations: ids.map((id) => ({
      kind: "style",
      id,
      values: before.nodes[id].style,
      unset: Object.keys(current.nodes[id].style).filter(
        (property) => !Object.hasOwn(before.nodes[id].style, property),
      ),
    })),
  });
}

async function mainFillPointerDrop(page: Page, id: string, parentId: string, expected: number) {
  await select(page, [id]);
  const before = await session(page);
  const document = before.projects[0].document;
  const bounds = await geometry(page, id);
  const point = await reparentPoint(page, parentId);
  await reparentPreview(page, id, parentId, point, document);
  await mainFillNativeGeometry(page, id, parentId, expected);
  await cancelFlexPointer(page, document, id);
  assert.deepEqual(await session(page), before);
  assert.deepEqual(await geometry(page, id), bounds);
  await reparentPreview(page, id, parentId, point, document);
  const response = page.waitForResponse(isCommand, { timeout: 2000 });
  await page.mouse.up();
  assert.equal((await response).status(), 200);
  await renderSettled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, document.revision + 1);
  assert.equal(after.nodes[id].parentId, parentId);
  assert.equal(after.nodes[id].style["aspect-ratio"], document.nodes[id].style["aspect-ratio"]);
  for (const sibling of document.nodes[parentId].children)
    assert.deepEqual(after.nodes[sibling], document.nodes[sibling]);
  assert.deepEqual(await selection(page), [id]);
  await mainFillNativeGeometry(page, id, parentId, expected);
  await undoRedo(page, document, after);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, document);
  checks.push(
    `${id} into ${parentId}: main-axis Fill allocation ${expected}px, Escape, one command and exact Undo/Redo`,
  );
}

async function mainFillNativeGeometry(page: Page, id: string, parentId: string, expected: number) {
  const bounds = await geometry(page, "fill-a");
  near(bounds.width, expected);
  const native = await page.locator('.canvas-world [data-orc-id="fill-a"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return { grow: style.flexGrow, shrink: style.flexShrink, basis: style.flexBasis };
  });
  assert.deepEqual(native, { grow: "1", shrink: "0", basis: "0px" });
  const siblings = parentId === "row" ? ["ra", "rb", "rc"] : ["wa", "wb", "wc"];
  for (const sibling of siblings) near((await geometry(page, sibling)).width, 60);
  if (id === "fill-b") near((await geometry(page, id)).width, 60);
  inputs.push({
    trigger: "Native main-axis Fill pointer allocation",
    id,
    parentId,
    expected,
    bounds,
    native,
  });
}

async function mainFillBoundedDrop(page: Page) {
  await accepted(page, {
    kind: "style",
    id: "row",
    values: { width: "auto", "min-width": "300px", "max-width": "300px" },
  });
  await mainFillPointerDrop(page, "fill-a", "row", 96);
  await history(page, "undo");
  checks.push("Owned equal pixel min/max limits bound a valid main-axis Fill pointer destination");
}

async function mainFillRejectedDestinations(page: Page) {
  for (const [id, values] of [
    ["row", { width: "auto" }],
    ["row", { width: "var(--pointer-width)", "--pointer-width": "300px" }],
  ] satisfies [string, DesignNode["style"]][]) {
    await accepted(page, { kind: "style", id, values });
    const bounds = await geometry(page, "fill-a");
    const before = await session(page);
    const commands = observeMainFillCommands(page);
    try {
      await rejectedPointerDrop(page, "fill-a", "row");
    } finally {
      commands.stop();
    }
    assert.deepEqual(commands.requests, []);
    assert.deepEqual(await geometry(page, "fill-a"), bounds);
    assert.equal(await page.locator(".flex-drop-marker").count(), 0);
    assert.ok((await page.locator(".workspace-notice").innerText()).trim());
    inputs.push({
      trigger: "Unavailable main-axis Fill pointer destination",
      id,
      values,
      before,
      after: await session(page),
      requests: commands.requests,
    });
    await history(page, "undo");
  }
}

async function mainFillSharedDrop(page: Page) {
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "ra", values: { width: "auto", flex: "1 0 0px", "min-width": "0px" } },
      {
        kind: "style",
        id: "fill-a",
        values: { padding: "10px", border: "2px solid black", "box-sizing": "border-box" },
      },
    ],
  });
  await select(page, ["fill-a"]);
  const before = (await session(page)).projects[0].document;
  const point = await reparentPoint(page, "row");
  await reparentPreview(page, "fill-a", "row", point, before);
  for (const id of ["fill-a", "ra"]) near((await geometry(page, id)).width, 78);
  await cancelFlexPointer(page, before, "fill-a");
  await reparentPreview(page, "fill-a", "row", point, before);
  const pending = page.waitForResponse(isCommand, { timeout: 2000 });
  await page.mouse.up();
  const response = await pending;
  assert.equal(response.status(), 200);
  await renderSettled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes["fill-a"].parentId, "row");
  for (const id of ["fill-a", "ra"]) near((await geometry(page, id)).width, 78);
  inputs.push({
    trigger: "Second Fill joins a destination cohort with unequal decoration",
    before,
    after,
    command: parseCommand(response.request().postDataJSON()),
  });
  await undoRedo(page, before, after);
  await history(page, "undo");
  await history(page, "undo");
}

async function mainFillRetarget(page: Page, invalid: boolean) {
  if (invalid) await accepted(page, { kind: "style", id: "wrap", values: { width: "auto" } });
  await select(page, ["fill-a"]);
  const before = await session(page);
  const bounds = await geometry(page, "fill-a");
  const first = await reparentPoint(page, "row");
  const second = await reparentPoint(page, "wrap");
  const commands = observeMainFillCommands(page);
  let after = before;
  try {
    await reparentPreview(page, "fill-a", "row", first, before.projects[0].document);
    await mainFillNativeGeometry(page, "fill-a", "row", 96);
    if (invalid) {
      after = await mainFillInvalidRetarget(page, before, bounds, second);
      assert.deepEqual(commands.requests, []);
      await history(page, "undo");
    } else {
      after = await mainFillValidRetarget(page, before, first, second);
    }
  } finally {
    commands.stop();
  }
  inputs.push({
    trigger: "Main-axis Fill preview retarget",
    invalid,
    destinations: invalid
      ? ["row", "unbounded wrap"]
      : ["row", "wrap", "cached row", "cached wrap"],
    before,
    after,
    acceptedDrop: invalid ? null : after.projects[0].document,
    requests: commands.requests,
  });
  checks.push(
    `Main-axis Fill preview retargets from a valid Row to ${invalid ? "an unbounded rejected Row without changes" : "a second bounded Row and cached first destination"}`,
  );
}

async function mainFillInvalidRetarget(
  page: Page,
  before: Awaited<ReturnType<typeof session>>,
  bounds: Awaited<ReturnType<typeof geometry>>,
  point: Awaited<ReturnType<typeof reparentPoint>>,
) {
  await page.mouse.move(point.x, point.y, { steps: 10 });
  await page.mouse.up();
  await renderSettled(page);
  assert.deepEqual(await session(page), before);
  assert.deepEqual(await geometry(page, "fill-a"), bounds);
  assert.equal(await page.locator(".flex-drop-marker").count(), 0);
  assert.ok((await page.locator(".workspace-notice").innerText()).trim());
  await captureReparentPreview(page, before.projects[0].document, "fill-a", "invalid-retarget");
  return await session(page);
}

async function mainFillValidRetarget(
  page: Page,
  before: Awaited<ReturnType<typeof session>>,
  first: Awaited<ReturnType<typeof reparentPoint>>,
  second: Awaited<ReturnType<typeof reparentPoint>>,
) {
  for (const [parentId, point] of [
    ["wrap", second],
    ["row", first],
    ["wrap", second],
  ] satisfies [string, Awaited<ReturnType<typeof reparentPoint>>][]) {
    await page.mouse.move(point.x, point.y, { steps: 10 });
    await renderSettled(page);
    assert.equal(
      await page
        .locator('.canvas-world [data-orc-id="fill-a"]')
        .evaluate((element) => element.parentElement?.getAttribute("data-orc-id")),
      parentId,
    );
    assert.deepEqual(await session(page), before);
    await verifyFlexMarker(page, parentId, "fill-a");
    await mainFillNativeGeometry(page, "fill-a", parentId, 96);
  }
  const response = page.waitForResponse(isCommand, { timeout: 2000 });
  await page.mouse.up();
  assert.equal((await response).status(), 200);
  await renderSettled(page);
  const applied = await session(page);
  const after = applied.projects[0].document;
  assert.equal(after.revision, before.projects[0].document.revision + 1);
  assert.equal(after.nodes["fill-a"].parentId, "wrap");
  await mainFillNativeGeometry(page, "fill-a", "wrap", 96);
  await undoRedo(page, before.projects[0].document, after);
  await history(page, "undo");
  return applied;
}

function observeMainFillCommands(page: Page) {
  const requests: unknown[] = [];
  const capture = (request: import("playwright").Request) => {
    if (new URL(request.url()).pathname === "/api/commands" && request.method() === "POST")
      requests.push(request.postDataJSON());
  };
  page.on("request", capture);
  return { requests, stop: () => page.off("request", capture) };
}

async function mainFillRatioDrops(page: Page) {
  await accepted(page, { kind: "style", id: "ra", values: { "aspect-ratio": "2" } });
  await mainFillPointerDrop(page, "fill-a", "row", 96);
  await history(page, "undo");
  await accepted(page, { kind: "reorder", id: "fill-a", parentId: "row", index: 6 });
  await accepted(page, { kind: "style", id: "fill-b", values: { "aspect-ratio": "2" } });
  await mainFillPointerDrop(page, "fill-b", "row", 28);
  await history(page, "undo");
  await history(page, "undo");
  checks.push(
    "Explicit 60px Fixed ratio sibling and incoming participant remain supported beside one exact main-axis Fill",
  );
}

async function zoomReparent(page: Page) {
  await page.getByRole("application", { name: "Canvas" }).hover();
  await page.mouse.wheel(0, 420);
  await renderSettled(page);
  await pointerReparent(page, "reparent-margin", "drop-free");
  await page.getByRole("application", { name: "Canvas" }).hover();
  await page.mouse.wheel(0, -420);
  await renderSettled(page);
  checks.push("Zoomed reparenting preserves native coordinates and authored margins");
}

async function pointerReparent(page: Page, id: string, parentId: string | null) {
  await select(page, [id]);
  const before = (await session(page)).projects[0].document;
  const bounds = await geometry(page, id);
  const point = await reparentPoint(page, parentId);
  await reparentPreview(page, id, parentId, point, before);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual((await session(page)).projects[0].document, before);
  const restored = await geometry(page, id);
  near(restored.x, bounds.x);
  near(restored.y, bounds.y);
  await reparentPreview(page, id, parentId, point, before);
  const pending = page.waitForResponse(isCommand, { timeout: 2000 });
  await page.mouse.up();
  assert.equal((await pending).status(), 200);
  await renderSettled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes[id].parentId, parentId);
  assert.deepEqual(await selection(page), [id]);
  await reparentRelationship(page, id, parentId, before, after);
  await reparentSizingGeometry(page, id, bounds, before, after);
  await undoRedo(page, before, after);
  await history(page, "undo");
  checks.push(
    `Pointer reparent ${id} into ${parentId ?? "workspace"}: preview, Escape, one command and exact history`,
  );
}

async function reparentSizingGeometry(
  page: Page,
  id: string,
  bounds: Awaited<ReturnType<typeof geometry>>,
  before: DesignDocument,
  after: DesignDocument,
) {
  if (id === "movable-frame") await reparentFrameGeometry(page, before, after);
  if (id === "fit-text") await reparentFitGeometry(page, bounds);
  if (id === "fill-a") await reparentFillGeometry(page, before, after);
  if (id === "cross-fill") await reparentCrossFillGeometry(page, after);
  if (id === "cross-auto-margin") {
    near((await geometry(page, id)).height, bounds.height);
    await assertSizeOwner(page, "Height", "Fit");
    checks.push("Cross-axis automatic margins retain intrinsic sizing rather than becoming Fill");
  }
}

async function reparentFrameGeometry(page: Page, before: DesignDocument, after: DesignDocument) {
  assert.deepEqual(after.nodes["frame-child"], before.nodes["frame-child"]);
  assert.deepEqual(after.nodes["nested-label"], before.nodes["nested-label"]);
  const frame = await geometry(page, "movable-frame");
  near(frame.width, 200);
  near(frame.height, 70);
  const child = await geometry(page, "frame-child");
  near(child.x - frame.x, 16);
  near(child.y - frame.y, 12);
}

async function reparentFitGeometry(page: Page, before: Awaited<ReturnType<typeof geometry>>) {
  const after = await geometry(page, "fit-text");
  near(after.width, before.width);
  near(after.height, before.height);
  const node = (await session(page)).projects[0].document.nodes["fit-text"];
  assert.equal(node.style.width, "max-content");
  assert.equal(node.style.height, "max-content");
  await assertSizeOwner(page, "Width", "Fit");
  await assertSizeOwner(page, "Height", "Fit");
}

async function reparentPoint(page: Page, parentId: string | null) {
  if (parentId === null)
    return page.locator(".canvas-world").evaluate((world) => {
      const bounds = world.getBoundingClientRect();
      const scale = new DOMMatrix(getComputedStyle(world).transform).a;
      return { x: bounds.x + 220 * scale, y: bounds.y + 40 * scale, flow: false };
    });
  return page.locator(`.canvas-world [data-orc-id="${parentId}"]`).evaluate((parent) => {
    const bounds = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    const flow = ["flex", "inline-flex"].includes(style.display);
    return {
      x: bounds.x + bounds.width * (flow && style.flexDirection === "row" ? 0.85 : 0.5),
      y: bounds.y + bounds.height * (flow && style.flexDirection === "column" ? 0.9 : 0.5),
      flow,
    };
  });
}

async function reparentPreview(
  page: Page,
  id: string,
  parentId: string | null,
  point: Awaited<ReturnType<typeof reparentPoint>>,
  before: DesignDocument,
) {
  const element = page.locator(`.canvas-world [data-orc-id="${id}"]`);
  const grab = await reparentGrab(element);
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(
    point.x + (point.flow ? 0 : grab.offsetX),
    point.y + (point.flow ? 0 : grab.offsetY),
    { steps: 10 },
  );
  await renderSettled(page);
  const actualParent = await element.evaluate(
    (node) => node.parentElement?.getAttribute("data-orc-id") ?? null,
  );
  inputs.push({ trigger: `Pointer preview ${id} into ${parentId}`, actualParent, point, before });
  assert.equal(actualParent, parentId, "Live drop preview must project the receiving parent");
  assert.equal(
    await page.locator(".workspace-notice").count(),
    0,
    "A valid new gesture clears previous unavailable notices",
  );
  assert.deepEqual((await session(page)).projects[0].document, before);
  if (parentId !== null && before.nodes[parentId].kind === "frame")
    assert.equal(await page.locator(`[data-orc-drop-parent="${parentId}"]`).count(), 1);
  if (point.flow) assert.equal(await page.locator(`[data-orc-drop-object="${id}"]`).count(), 1);
  if (!point.flow) {
    const bounds = await element.boundingBox();
    assert.ok(bounds);
    near(bounds.x + bounds.width / 2, point.x);
    near(bounds.y + bounds.height / 2, point.y);
  }
  await captureReparentPreview(page, before, id, parentId);
}

async function captureReparentPreview(
  page: Page,
  before: DesignDocument,
  id: string,
  parentId: string | null,
) {
  const screenshot = artifact(`${before.id}-${parentId ?? "root"}-${id}-reparent-preview.png`);
  await page.screenshot({ path: screenshot });
  inputs.push({ trigger: "Receiving frame preview", screenshot });
}

async function reparentGrab(element: Locator) {
  return element.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const id = node.getAttribute("data-orc-id");
    for (const [fx, fy] of [
      [0.1, 0.1],
      [0.9, 0.1],
      [0.1, 0.9],
      [0.9, 0.9],
      [0.5, 0.5],
    ]) {
      const x = bounds.x + bounds.width * fx;
      const y = bounds.y + bounds.height * fy;
      if (
        document.elementFromPoint(x, y)?.closest("[data-orc-id]")?.getAttribute("data-orc-id") ===
        id
      )
        return {
          x,
          y,
          offsetX: x - bounds.x - bounds.width / 2,
          offsetY: y - bounds.y - bounds.height / 2,
        };
    }
    throw new Error(`No visible pointer grab point for ${id}`);
  });
}

async function reparentRelationship(
  page: Page,
  id: string,
  parentId: string | null,
  before: DesignDocument,
  after: DesignDocument,
) {
  assert.equal(after.nodes[id].style.margin, before.nodes[id].style.margin);
  if (parentId === "drop-free" && ["end", "both", "center"].includes(id)) {
    if (id === "both") await assertSizeOwner(page, "Width", "Constraints");
    const bounds = await geometry(page, id);
    await select(page, [parentId]);
    const width = page.getByRole("spinbutton", { name: "Width", exact: true });
    await width.fill("380");
    const pending = page.waitForResponse(isCommand);
    await width.press("Enter");
    assert.equal((await pending).status(), 200);
    await renderSettled(page);
    const resized = await geometry(page, id);
    near(resized.x - bounds.x, id === "end" ? 80 : id === "center" ? 40 : 0);
    near(resized.width - bounds.width, id === "both" ? 80 : 0);
    await history(page, "undo");
    await select(page, [id]);
    assertContent((await session(page)).projects[0].document, after);
  }
  if (["row", "column", "wrap"].includes(parentId ?? "")) {
    assert.equal(after.nodes[id].style.left, undefined);
    assert.equal(after.nodes[id].style.right, undefined);
    assert.equal(after.nodes[id].style.top, undefined);
    assert.equal(after.nodes[id].style.bottom, undefined);
    assert.notEqual(after.nodes[id].style.position, "absolute");
  }
}

async function reparentFillGeometry(page: Page, before: DesignDocument, after: DesignDocument) {
  assert.equal(after.nodes["fill-a"].style.flex, before.nodes["fill-a"].style.flex);
  assert.equal(after.nodes["fill-a"].style.width, "auto");
  await assertSizeOwner(page, "Width", "Fill");
  const bounds = await geometry(page, "fill-a");
  await select(page, ["row"]);
  const width = page.getByRole("spinbutton", { name: "Width", exact: true });
  await width.fill("380");
  const pending = page.waitForResponse(isCommand);
  await width.press("Enter");
  assert.equal((await pending).status(), 200);
  await renderSettled(page);
  near((await geometry(page, "fill-a")).width - bounds.width, 80);
  await history(page, "undo");
  await select(page, ["fill-a"]);
  assertContent((await session(page)).projects[0].document, after);
}

async function reparentCrossFillGeometry(page: Page, after: DesignDocument) {
  assert.equal(after.nodes["cross-fill"].style.height, "auto");
  assert.equal(after.nodes["cross-fill"].style["align-self"], "stretch");
  near((await geometry(page, "cross-fill")).height, 60);
  await assertSizeOwner(page, "Height", "Fill", "60");
  checks.push(
    "Explicit cross-axis stretch overrides parent alignment and retains Fill after reparenting",
  );
}

async function assertSizeOwner(page: Page, label: string, owner: string, value = owner) {
  if (owner === "Fit") {
    await page.waitForFunction((name) => {
      const choice = document.querySelector(`select[aria-label="${name} sizing"]`);
      return choice instanceof HTMLSelectElement && choice.value === "Fit";
    }, label);
    const choice = page.getByRole("combobox", { name: `${label} sizing`, exact: true });
    assert.equal(await choice.inputValue(), "Fit");
    const value = page.getByRole("spinbutton", { name: label, exact: true });
    assert.equal(await value.isEditable(), true);
    assert.ok(Number.isFinite(Number(await value.inputValue())));
    return;
  }
  const field = page.getByRole("textbox", { name: label, exact: true });
  assert.equal(await field.inputValue(), value);
  assert.equal(
    await page.getByRole("combobox", { name: `${label} sizing`, exact: true }).inputValue(),
    owner,
  );
  assert.equal(await field.getAttribute("readonly"), "");
}

async function rejectedPointerDrop(page: Page, id: string, parentId: string) {
  await select(page, [id]);
  const before = await session(page);
  const point = await reparentPoint(page, parentId);
  const grab = await reparentGrab(page.locator(`.canvas-world [data-orc-id="${id}"]`));
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(point.x, point.y, { steps: 10 });
  await page.mouse.up();
  await renderSettled(page);
  assert.deepEqual(
    await session(page),
    before,
    "Unavailable conversion must reject the whole drop",
  );
  assert.deepEqual(await selection(page), [id]);
  checks.push(
    `${id} into ${parentId}: unavailable pointer destination or conversion rejects without partial changes`,
  );
}

async function pointerDraftDiscard(page: Page) {
  await select(page, ["start"]);
  await codeFocus(page);
  const before = await session(page);
  const element = page.locator('.canvas-world [data-orc-id="loose"]');
  const bounds = await element.boundingBox();
  assert.ok(bounds);
  await element.click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await renderSettled(page);
  const selected = await selection(page);
  inputs.push({ trigger: "Pointer release then draft Discard", before, selected });
  assert.deepEqual(selected, ["loose"], "Discard must complete the requested canvas selection");
  assert.equal(await page.getByText("Unapplied changes", { exact: true }).count(), 0);
  await page.mouse.move(bounds.x + bounds.width + 40, bounds.y + bounds.height + 20, { steps: 4 });
  await page.mouse.up();
  await renderSettled(page);
  assert.deepEqual(await session(page), before, "Released pointer must not resume movement");
  assert.deepEqual(await selection(page), ["loose"]);
  const afterBounds = await element.boundingBox();
  assert.ok(afterBounds);
  near(afterBounds.x, bounds.x);
  near(afterBounds.y, bounds.y);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Draft Discard after pointer release completes selection without movement or history",
  );
}

async function flexPointerSelection(page: Page) {
  await page.locator('.canvas-world [data-orc-id="ra"]').hover();
  await page.mouse.down();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  assert.deepEqual(await selection(page), ["ra"]);
  const notices = await page.locator(".workspace-notice").allTextContents();
  inputs.push({ trigger: "Hold Flex child without dragging", notices });
  assert.deepEqual(notices, [], "Selecting a Flex child must not invoke movement validation");
  await page.mouse.up();
  await select(page, ["loose"]);
  checks.push("Clicking a Flex child selects without invoking drag validation");
}

async function flexPointerMovement(page: Page) {
  await flexPointerDrop(page, "row", "ra", "rc", ["absolute", "hidden", "none", "rb", "rc", "ra"]);
  await flexPointerDrop(page, "row", "rc", "ra", ["ra", "absolute", "hidden", "none", "rc", "rb"]);
  await flexPointerDrop(page, "column", "ca", "cc", ["cb", "cc", "ca"]);
  await flexPointerDrop(page, "wrap", "wa", "wc", ["wb", "wc", "wa"]);
  await noopFlexDrop(page);
  await select(page, ["loose"]);
}

async function flexPointerDrop(
  page: Page,
  parent: string,
  dragged: string,
  target: string,
  expected: string[],
) {
  const before = await previewFlexPointer(page, parent, dragged, target, expected);
  await cancelFlexPointer(page, before, dragged);
  await previewFlexPointer(page, parent, dragged, target, expected);
  const response = page.waitForResponse(isCommand, { timeout: 2000 });
  await page.mouse.up();
  assert.equal((await response).status(), 200);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.deepEqual(after.nodes[parent].children, expected);
  assert.deepEqual(
    after.nodes[dragged],
    before.nodes[dragged],
    "Flow drop preserves authored CSS, dimensions, identity and parent",
  );
  await undoRedo(page, before, after);
  await history(page, "undo");
  assert.equal(
    await page.locator(".flex-drop-marker").count(),
    0,
    "Release removes the editor insertion overlay",
  );
  checks.push(
    `${parent}: native Flex pointer slot preview and one-step reorder preserve authored CSS`,
  );
}

async function previewFlexPointer(
  page: Page,
  parent: string,
  dragged: string,
  target: string,
  expected: string[],
) {
  const before = (await session(page)).projects[0].document;
  const object = page.locator(`.canvas-world [data-orc-id="${dragged}"]`);
  const destination = page.locator(`.canvas-world [data-orc-id="${target}"]`);
  const start = await object.boundingBox();
  const end = await destination.boundingBox();
  assert.ok(start && end);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width * 0.8, end.y + end.height * 0.8, { steps: 10 });
  assert.deepEqual(
    (await session(page)).projects[0].document,
    before,
    "Flex preview must not publish applied state",
  );
  const preview = await page
    .locator(`.canvas-world [data-orc-id="${parent}"] > [data-orc-id]`)
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-orc-id")));
  assert.deepEqual(
    preview,
    expected.filter((id) => before.nodes[id].visible),
    "Live flow preview shows the intended sibling slot",
  );
  await verifyFlexMarker(page, parent, dragged);
  return before;
}

async function noopFlexDrop(page: Page) {
  const before = (await session(page)).projects[0].document;
  await previewFlexPointer(page, "row", "ra", "ra", before.nodes.row.children);
  await page.mouse.up();
  assert.deepEqual(
    (await session(page)).projects[0].document,
    before,
    "Dropping in the current Flex slot creates no revision or history",
  );
  checks.push("Returning to the current Flex slot creates no saved change");
}

async function verifyFlexMarker(page: Page, parent: string, dragged: string) {
  const outline = page.locator(`.flex-drop-outline[data-orc-drop-parent="${parent}"]`);
  const marker = page.locator(`.flex-drop-marker[data-orc-drop-object="${dragged}"]`);
  await outline.waitFor({ state: "visible", timeout: 1500 });
  await marker.waitFor({ state: "visible", timeout: 1500 });
  const frame = await page.locator(`.canvas-world [data-orc-id="${parent}"]`).boundingBox();
  const child = await page.locator(`.canvas-world [data-orc-id="${dragged}"]`).boundingBox();
  const receiving = await outline.boundingBox();
  const insertion = await marker.boundingBox();
  assert.ok(frame && child && receiving && insertion);
  for (const key of ["x", "y", "width", "height"] satisfies (keyof typeof frame)[])
    near(receiving[key], frame[key]);
  const row = await page
    .locator(`.canvas-world [data-orc-id="${parent}"]`)
    .evaluate((element) => getComputedStyle(element).flexDirection === "row");
  near(insertion.x, child.x - (row ? 3 : 0));
  near(insertion.y, child.y - (row ? 0 : 3));
  near(insertion.width, row ? 2 : child.width);
  near(insertion.height, row ? child.height : 2);
  assert.equal(await marker.evaluate((element) => getComputedStyle(element).pointerEvents), "none");
  const document = (await session(page)).projects[0].document;
  const path = artifact(`${document.id}-${parent}-${dragged}-pointer-slot.png`);
  await page.screenshot({ path, fullPage: true });
  inputs.push({
    trigger: "Flex drop cues",
    parent,
    dragged,
    frame,
    child,
    receiving,
    insertion,
    screenshot: path,
  });
}

async function cancelFlexPointer(page: Page, before: DesignDocument, dragged: string) {
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual(
    (await session(page)).projects[0].document,
    before,
    "Flex cancellation creates no revision or history",
  );
  assert.deepEqual(await selection(page), [dragged]);
  assert.equal(
    await page.locator(".flex-drop-marker").count(),
    0,
    "Escape removes the editor insertion overlay",
  );
}

import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page, type Request, type Response } from "playwright";
import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { nodeSource } from "../../../shared/source/html-source";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_LAYOUT_EVIDENCE ?? "verification";
const modes = process.env.ORC_LAYOUT_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "layout-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const evidence = sourceEvidence();
const checks: string[] = [];
const inputs: unknown[] = [];
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
    `${JSON.stringify(
      {
        ...evidence,
        after: sourceEvidence(),
        channel,
        browserVersion: browser.version(),
        phase,
        command: `ORC_LAYOUT_EVIDENCE=${phase} ORC_LAYOUT_MODES=${modes} bun scripts/e2e/editor/check-layout.ts ${channel}`,
        requirements: [
          "Free/Row/Column preserve IDs and order in one command and Undo.",
          "Flex to Free captures Fixed boxes; existing Absolute rules survive round trips.",
          "Locks, drafts and unsupported source prevent partial conversion.",
          "Native geometry, source, save/reopen, screenshots, traces and clean shutdown are recorded.",
        ],
        checks,
        inputs,
        failure,
      },
      null,
      2,
    )}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("frame layout workflow passed\n");

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
    if (message.text().includes("flushSync")) errors.push(message.text());
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await prepareFixture(page, app.url);
    assert.equal(
      await modeButton(page, "Free").count(),
      1,
      "Selected frame exposes Free, Row and Column",
    );
    await layoutWorkflow(page, mode);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(`${mode}: full layout workflow has no uncaught errors`);
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
    inputs.push({ mode, errors, appOutput: app.output });
  }
}

async function layoutWorkflow(page: Page, mode: string) {
  await ordinarySwitches(page);
  await automaticMargins(page);
  await zoomedSwitches(page);
  await absoluteRoundTrip(page);
  await complexFrames(page);
  await nestedAndWrapped(page);
  await select(page, "row");
  await unavailableSwitches(page);
  await draftSwitch(page);
  await saveReopen(page, mode);
  await repairSource(page);
}

async function prepareFixture(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await accepted(page, { kind: "insert", nodes: fixture() });
  await select(page, "free");
}

function frame(
  id: string,
  children: string[],
  left: number,
  style: DesignNode["style"] = {},
): DesignNode {
  return {
    id,
    name: id,
    parentId: null,
    children,
    kind: "frame",
    mode: "inherit",
    clipContent: false,
    visible: true,
    locked: false,
    attributes: {},
    style: {
      position: "absolute",
      left: `${left}px`,
      top: "80px",
      width: "250px",
      height: "210px",
      padding: "12px",
      border: "3px solid black",
      gap: "10px",
      "align-items": "flex-start",
      ...style,
    },
  };
}

function text(id: string, parentId: string, style: DesignNode["style"]): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children: [],
    visible: true,
    locked: false,
    kind: "text",
    tag: "p",
    attributes: { title: `Retain ${id}` },
    runs: [{ text: id, style: {} }],
    style: { width: "70px", height: "32px", margin: "0", background: "#ccd9ed", ...style },
  };
}

function fixture() {
  return [
    frame("free", ["a", "b"], 70),
    text("a", "free", { position: "absolute", left: "90px", top: "65px" }),
    text("b", "free", { position: "absolute", left: "10px", top: "25px", width: "90px" }),
    frame("row", ["c", "absolute", "d"], 380, { display: "flex", "flex-direction": "row" }),
    text("c", "row", { position: "relative", "flex-shrink": "0" }),
    text("absolute", "row", { position: "absolute", right: "7px", bottom: "9px", width: "45px" }),
    text("d", "row", { position: "relative", "flex-shrink": "0", width: "80px" }),
  ];
}

async function ordinarySwitches(page: Page) {
  const original = (await session(page)).projects[0].document;
  await switchMode(page, "Row");
  let boxes = await nativeBoxes(page, "free");
  assert.ok(
    boxes.a.x < boxes.b.x && boxes.a.y === boxes.b.y,
    "Row follows Layers order, not old geometry",
  );
  await switchMode(page, "Column");
  boxes = await nativeBoxes(page, "free");
  assert.ok(boxes.a.y < boxes.b.y && boxes.a.x === boxes.b.x);
  await switchMode(page, "Free");
  assertBoxes(await nativeBoxes(page, "free"), boxes);
  const free = (await session(page)).projects[0].document;
  for (const id of ["a", "b"]) {
    assert.equal(free.nodes[id].style.position, "absolute");
    assert.equal(free.nodes[id].style.right, "auto");
    assert.equal(free.nodes[id].style.bottom, "auto");
    assert.equal(parseFloat(free.nodes[id].style.width), boxes[id].width);
    assert.equal(parseFloat(free.nodes[id].style.height), boxes[id].height);
    assert.deepEqual(free.nodes[id].attributes, original.nodes[id].attributes);
  }
  await switchMode(page, "Row");
  assert.deepEqual((await session(page)).projects[0].document.nodes.free.children, ["a", "b"]);
  const before = await session(page);
  await modeButton(page, "Row").click();
  assert.deepEqual(
    await session(page),
    before,
    "Active mode preserves revision and both history stacks",
  );
  checks.push(
    "Free/Row/Column preserves identity/order, uses native Fixed Free boxes, and treats active mode as a no-op",
  );
}

async function switchMode(page: Page, mode: "Free" | "Row" | "Column") {
  const before = (await session(page)).projects[0].document;
  const responsePromise = page.waitForResponse(isCommand);
  await modeButton(page, mode).click();
  const response = await responsePromise;
  assert.equal(response.status(), 200, await response.text());
  const request = response.request().postDataJSON();
  assert.equal(request.mutation.kind, "batch");
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assertHierarchy(after, before);
  assert.equal(await modeButton(page, mode).getAttribute("aria-pressed"), "true");
  assert.equal(
    await modeButton(page, mode).evaluate((button) => button === document.activeElement),
    true,
    "Layout activation retains button focus",
  );
  const boxes = await nativeBoxes(page, request.mutation.mutations[0].id);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  assertBoxes(await nativeBoxes(page, request.mutation.mutations[0].id), boxes);
  inputs.push({ trigger: `Properties ${mode}`, request, before, after, boxes });
  checks.push(
    `${mode}: one batch/revision, exact one-step Undo/Redo, native geometry and unchanged hierarchy`,
  );
}

async function absoluteRoundTrip(page: Page) {
  await select(page, "row");
  const before = (await session(page)).projects[0].document;
  const boxes = await nativeBoxes(page, "row");
  await switchMode(page, "Free");
  assertBoxes(await nativeBoxes(page, "row"), boxes);
  await switchMode(page, "Column");
  const after = (await session(page)).projects[0].document;
  const absolute = after.nodes.absolute;
  for (const [key, value] of Object.entries(before.nodes.absolute.style))
    if (key !== "position") assert.equal(absolute.style[key], value, `Absolute retains ${key}`);
  const next = await nativeBoxes(page, "row");
  assert.deepEqual(next.absolute, boxes.absolute);
  assert.ok(next.c.y < next.d.y && next.c.x === next.d.x);
  assert.equal(next.absolute.position, "absolute");
  assert.equal(next.c.position, "relative");
  await switchMode(page, "Free");
  await switchMode(page, "Row");
  checks.push(
    "Existing Absolute children retain constraints/sizes and stay outside flow across repeated Free/Row/Column switches",
  );
}

async function automaticMargins(page: Page) {
  await select(page, "free");
  for (const [mode, values] of [
    ["Row", { "margin-left": "auto" }],
    ["Row", { "margin-left": "var(--space)", "--space": "auto" }],
    ["Column", { "margin-top": "auto" }],
    ["Column", { margin: "auto" }],
  ] as const) {
    if ((await modeButton(page, mode).getAttribute("aria-pressed")) !== "true")
      await switchMode(page, mode);
    await accepted(page, {
      kind: "style",
      id: "a",
      values: { margin: "0" },
      unset: ["margin-left", "margin-top", "--space"],
    });
    await accepted(page, { kind: "style", id: "a", values });
    const before = await nativeBoxes(page, "free");
    const authored = (await session(page)).projects[0].document.nodes.a.style;
    await switchMode(page, "Free");
    assertBoxes(await nativeBoxes(page, "free"), before);
    const after = (await session(page)).projects[0].document.nodes.a.style;
    for (const property of ["margin", "margin-left", "margin-top", "--space"])
      assert.equal(after[property], authored[property], `Retain authored ${property}`);
  }
  checks.push(
    "Automatic and variable-resolved margins preserve native boxes and authored CSS when leaving either Flex axis",
  );
}

async function zoomedSwitches(page: Page) {
  await select(page, "free");
  for (const delta of [420, -840]) {
    await switchMode(page, "Row");
    const previous = await canvasScale(page);
    await page.getByRole("application", { name: "Canvas" }).hover();
    await page.mouse.wheel(0, delta);
    await page.waitForFunction((value) => {
      const world = document.querySelector(".canvas-world")!;
      return new DOMMatrix(getComputedStyle(world).transform).a !== value;
    }, previous);
    await settled(page);
    const before = await nativeBoxes(page, "free");
    await switchMode(page, "Free");
    assertBoxes(await nativeBoxes(page, "free"), before);
    inputs.push({ trigger: "Canvas zoom", delta, scale: await canvasScale(page) });
  }
  await page.mouse.wheel(0, 420);
  await settled(page);
  checks.push("Zoomed-out and zoomed-in conversions preserve unzoomed geometry");
}

function canvasScale(page: Page) {
  return page
    .locator(".canvas-world")
    .evaluate((world) => new DOMMatrix(getComputedStyle(world).transform).a);
}

async function complexFrames(page: Page) {
  await accepted(page, { kind: "insert", nodes: extraFrames() });
  await select(page, "fit");
  const parent = page.locator('.canvas-world [data-orc-id="fit"]');
  const before = await parent.boundingBox();
  await switchMode(page, "Free");
  assert.deepEqual(
    await parent.boundingBox(),
    before,
    "Intrinsic frame freezes its box when its children leave flow",
  );
  await switchMode(page, "Row");
  await select(page, "variable-fit");
  await unavailable(page, "Free", /preserve|render|Code/u);
  await select(page, "empty");
  for (const mode of ["Row", "Column", "Free"] as const) await switchMode(page, mode);
  await select(page, "logical");
  await switchMode(page, "Row");
  const boxes = await nativeBoxes(page, "logical");
  for (const axis of ["x", "y"] as const)
    assert.ok(
      Math.abs(boxes["logical-child"][axis] - 15) < 0.1,
      "Removed logical offsets cannot shift the new flow box",
    );
  await switchMode(page, "Free");
  assertBoxes(await nativeBoxes(page, "logical"), boxes);
  checks.push(
    "Intrinsic frames preserve their boxes, empty frames switch, and logical priority offsets cannot fight new flow or Free placement",
  );
}

function extraFrames(): DesignNode[] {
  return [
    frame("fit", ["fit-child"], 70, {
      top: "360px",
      display: "flex",
      width: "fit-content",
      height: "max-content",
    }),
    text("fit-child", "fit", { position: "relative", "flex-shrink": "0" }),
    frame("variable-fit", ["variable-fit-child"], 700, {
      left: "auto",
      right: "50px",
      display: "flex",
      width: "var(--frame-size)",
      "--frame-size": "fit-content",
      height: "max-content",
    }),
    text("variable-fit-child", "variable-fit", { position: "relative", "flex-shrink": "0" }),
    frame("logical", ["logical-child"], 380, { top: "360px" }),
    text("logical-child", "logical", {
      position: "absolute",
      "inset-inline-start": "90px !important",
      "inset-block-start": "65px !important",
    }),
    frame("empty", [], 70, { top: "600px" }),
  ];
}

async function unavailableSwitches(page: Page) {
  await accepted(page, { kind: "lock", id: "c", locked: true });
  await unavailable(page, "Free", /Unlock/u);
  await accepted(page, { kind: "lock", id: "c", locked: false });
  await accepted(page, { kind: "style", id: "row", values: { transform: "scale(1.1)" } });
  await unavailable(page, "Free", /Code|source|transform/u);
  await accepted(page, { kind: "style", id: "row", values: {}, unset: ["transform"] });
  await accepted(page, {
    kind: "style",
    id: "c",
    values: { position: "var(--source-position)", "--source-position": "relative" },
  });
  await unavailable(page, "Free", /source|Code/u);
  await accepted(page, {
    kind: "style",
    id: "c",
    values: { position: "relative" },
    unset: ["--source-position"],
  });
  await accepted(page, { kind: "style", id: "c", values: { order: "1" } });
  await unavailable(page, "Column", /order|Code/u);
  await accepted(page, { kind: "style", id: "c", values: {}, unset: ["order"] });
  await accepted(page, { kind: "style", id: "c", values: { flex: "1 1 0px", width: "auto" } });
  await unavailable(page, "Column", /sizing|Code/u);
  await accepted(page, { kind: "style", id: "c", values: { width: "70px" }, unset: ["flex"] });
  await accepted(page, { kind: "lock", id: "row", locked: true });
  assert.equal(await modeButton(page, "Free").isDisabled(), true);
  await accepted(page, { kind: "lock", id: "row", locked: false });
  checks.push(
    "Locked children, own locks, transformed coordinates and unsupported axis sizing leave whole document/history unchanged",
  );
}

async function nestedAndWrapped(page: Page) {
  await accepted(page, { kind: "insert", nodes: flowFixtures() });
  await select(page, "nested-outer");
  const inside = await nativeBoxes(page, "nested-inner");
  await switchMode(page, "Column");
  assertBoxes(await nativeBoxes(page, "nested-inner"), inside);
  await switchMode(page, "Free");
  assertBoxes(await nativeBoxes(page, "nested-inner"), inside);
  const inner = (await session(page)).projects[0].document.nodes["nested-inner"];
  assert.equal(inner.style.display, "flex");
  assert.equal(inner.style["flex-direction"], "column");
  await select(page, "wrapped");
  const wrapped = await nativeBoxes(page, "wrapped");
  assert.ok(wrapped.w3.y > wrapped.w1.y, "Positive control has multiple native rows");
  await switchMode(page, "Free");
  assertBoxes(await nativeBoxes(page, "wrapped"), wrapped);
  await switchMode(page, "Row");
  assertBoxes(await nativeBoxes(page, "wrapped"), wrapped);
  checks.push(
    "Nested frames retain their own layout; wrapped rows keep every measured child box through Free and back to Row",
  );
}

function flowFixtures(): DesignNode[] {
  return [
    frame("nested-outer", ["nested-inner", "peer"], 70, { top: "900px", display: "flex" }),
    {
      ...frame("nested-inner", ["i1", "i2"], 0, {
        position: "relative",
        left: "auto",
        top: "auto",
        width: "100px",
        height: "130px",
        display: "flex",
        "flex-direction": "column",
      }),
      parentId: "nested-outer",
    },
    text("peer", "nested-outer", { position: "relative", "flex-shrink": "0" }),
    ...["i1", "i2"].map((id) =>
      text(id, "nested-inner", { position: "relative", "flex-shrink": "0" }),
    ),
    frame("wrapped", ["w1", "w2", "w3"], 380, {
      top: "600px",
      width: "190px",
      height: "auto",
      display: "flex",
      "flex-wrap": "wrap",
    }),
    ...["w1", "w2", "w3"].map((id) =>
      text(id, "wrapped", { position: "relative", "flex-shrink": "0" }),
    ),
  ];
}

async function unavailable(page: Page, mode: "Free" | "Row" | "Column", message: RegExp) {
  const before = await session(page);
  const id = await page.getByLabel("Name", { exact: true }).inputValue();
  const frame = page.locator(`.canvas-world [data-orc-id="${id}"]`);
  const bounds = await frame.boundingBox();
  const boxes = await nativeBoxes(page, id);
  const requests: string[] = [];
  const record = (request: Request) => {
    if (new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postData() ?? "");
  };
  page.on("request", record);
  try {
    await modeButton(page, mode).click();
    await page.locator(".layout-controls [role=alert]").waitFor({ timeout: 3000 });
    assert.match(await page.locator(".layout-controls [role=alert]").innerText(), message);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(await frame.boundingBox(), bounds);
    assertBoxes(await nativeBoxes(page, id), boxes);
    assert.deepEqual(requests, [], "Rejected previews send no mutation");
    assert.equal(
      await modeButton(page, mode).evaluate((button) => button === document.activeElement),
      true,
      "Rejected layout switches retain button focus",
    );
  } finally {
    page.off("request", record);
    inputs.push({ trigger: `Unavailable ${mode}`, id, requests, bounds, boxes });
  }
}

async function draftSwitch(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.waitFor();
  const draft = `${await source.innerText()}\n<!-- unapplied -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await modeButton(page, "Column").click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await source.innerText(), draft);
  assert.deepEqual(await session(page), before);
  await modeButton(page, "Column").click();
  const pending = page.waitForResponse(isCommand);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  const expected = nodeSource((await session(page)).projects[0].document, "row");
  await page.waitForFunction(
    (value) => document.querySelector('[aria-label="Object source"]')?.textContent === value,
    expected,
  );
  assert.equal(await source.innerText(), expected);
  checks.push(
    "Code draft Cancel preserves applied state and draft; Discard switches once and Code follows canonical CSS",
  );
}

async function saveReopen(page: Page, mode: string) {
  await switchMode(page, "Free");
  await sourceRoundTrip(page);
  const boxes = await nativeBoxes(page, "row");
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Layout ${mode}`);
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
  await page.getByRole("button", { name: `Close ${saved.document.name}`, exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(saved.path);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await select(page, "row");
  await settled(page);
  assert.deepEqual((await session(page)).projects[0].document, saved.document);
  assertBoxes(await nativeBoxes(page, "row"), boxes);
  await switchMode(page, "Row");
  assert.equal((await nativeBoxes(page, "row")).absolute.position, "absolute");
  checks.push(
    `${mode}: saved CSS and Absolute intent survive reopening and switching back to flow`,
  );
}

async function sourceRoundTrip(page: Page) {
  const before = await session(page);
  const source = nodeSource(before.projects[0].document, "row");
  await applySourceText(page, `${source}\n<!-- source round trip -->`);
  assert.deepEqual(
    await session(page),
    before,
    "Equivalent source retains exact data, revision and history",
  );
  await applySourceText(page, source.replaceAll("; ", ";\n"));
  assert.deepEqual(await session(page), before);
  await sourceOrder(page);
  checks.push(
    "Comment/CSS formatting Apply preserves exact IDs, rules, revision and history; CSS edge order remains meaningful",
  );
}

async function repairSource(page: Page) {
  const node = { ...frame("repair", [], 700), attributes: { class: "legacy-class" } };
  await accepted(page, { kind: "insert", nodes: [node] });
  await select(page, "repair");
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const before = (await session(page)).projects[0].document;
  const source = nodeSource(before, "repair");
  const repaired = source.replace(' class="legacy-class"', "");
  assert.notEqual(repaired, source);
  await applySourceText(page, repaired);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.nodes.repair.attributes.class, undefined);
  assert.equal(after.revision, before.revision + 1);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  const saved = await session(page);
  const invalid = nodeSource(after, "repair").replace("<div", '<div class="unsupported"');
  await applySourceText(page, invalid, 400);
  assert.deepEqual(await session(page), saved);
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  checks.push(
    "Code Apply repairs unsupported existing source without weakening incoming-source validation",
  );
}

async function applySourceText(page: Page, value: string, expectedStatus = 200) {
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.press("Control+a");
  await page.keyboard.insertText(value);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const response = await pending;
  const body = await response.text();
  inputs.push({ trigger: "Code Apply", source: value, status: response.status(), response: body });
  assert.equal(response.status(), expectedStatus, body);
  if (expectedStatus !== 200) return;
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  await settled(page);
}

async function sourceOrder(page: Page) {
  const before = (await session(page)).projects[0].document;
  const source = nodeSource(before, "row");
  const first = source.replace("left: 380px;", "left: 380px; inset-inline-start: 390px;");
  assert.notEqual(first, source);
  await applySourceText(page, first);
  const nativeLeft = () =>
    page
      .locator('.canvas-world [data-orc-id="row"]')
      .evaluate((node) => getComputedStyle(node).left);
  assert.equal(await nativeLeft(), "390px");
  const next = (await session(page)).projects[0].document;
  const reordered = nodeSource(next, "row")
    .replace("left: 380px;", "")
    .replace("inset-inline-start: 390px;", "inset-inline-start: 390px; left: 380px;");
  await applySourceText(page, reordered);
  assert.equal(
    await nativeLeft(),
    "380px",
    "Reordered physical/logical declarations must not be discarded as equivalent",
  );
  assert.equal((await session(page)).projects[0].document.revision, next.revision + 1);
  await history(page, "undo");
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
}

async function nativeBoxes(page: Page, id: string) {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`).evaluate((parent) => {
    const scale = new DOMMatrix(getComputedStyle(parent.closest(".canvas-world")!).transform).a;
    const origin = parent.getBoundingClientRect();
    return Object.fromEntries(
      Array.from(parent.children).map((child) => {
        const rect = child.getBoundingClientRect();
        return [
          child.getAttribute("data-orc-id")!,
          {
            x: (rect.x - origin.x) / scale,
            y: (rect.y - origin.y) / scale,
            width: rect.width / scale,
            height: rect.height / scale,
            position: getComputedStyle(child).position,
          },
        ];
      }),
    );
  });
}

function assertBoxes(actual: Awaited<ReturnType<typeof nativeBoxes>>, expected: typeof actual) {
  for (const id of Object.keys(expected))
    for (const key of ["x", "y", "width", "height"] as const)
      assert.ok(
        Math.abs(actual[id][key] - expected[id][key]) < 0.1,
        `${id} ${key}: ${actual[id][key]} != ${expected[id][key]}`,
      );
}

function assertHierarchy(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual(Object.keys(actual.nodes), Object.keys(expected.nodes));
  for (const id of Object.keys(expected.nodes)) {
    assert.equal(actual.nodes[id].parentId, expected.nodes[id].parentId);
    assert.deepEqual(actual.nodes[id].children, expected.nodes[id].children);
  }
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual({ ...actual, revision: 0 }, { ...expected, revision: 0 });
}

async function select(page: Page, id: string) {
  await page
    .locator(".layer-name")
    .filter({ has: page.getByText(id, { exact: true }) })
    .click();
  await page.getByLabel("Name", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), id);
}

function modeButton(page: Page, mode: string) {
  return page
    .getByRole("group", { name: "Frame layout", exact: true })
    .getByRole("button", { name: mode, exact: true });
}

function isCommand(response: Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
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
  assert.equal((await pending).status(), 200);
  await settled(page);
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
  await settled(page);
}

async function settled(page: Page) {
  const revision = (await session(page)).projects[0].document.revision;
  await page.waitForFunction(
    (value) =>
      document.querySelector(".canvas")?.getAttribute("data-orc-revision") === String(value),
    revision,
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function artifact(suffix: string) {
  return join(artifacts, `layout-${phase}-${suffix}`);
}

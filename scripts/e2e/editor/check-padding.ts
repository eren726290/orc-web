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
const phase = process.env.ORC_PADDING_EVIDENCE ?? "verification";
const modes = process.env.ORC_PADDING_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "padding-fixtures-"));
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
} catch (cause) {
  failure = cause instanceof Error ? (cause.stack ?? cause.message) : String(cause);
  throw cause;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), command: `ORC_PADDING_EVIDENCE=${phase} ORC_PADDING_MODES=${modes} bun scripts/e2e/editor/check-padding.ts ${channel}`, requirements: ["Paired and individual Padding preserve asymmetry on disclosure and commit through one atomic command.", "Numeric typing previews live, Escape cancels, invalid values retain the last valid preview, and unchanged values retain Redo.", "Native shorthand priority and source ownership survive edits, history, and saving without child or clipping changes.", "Own/ancestor locks and Code drafts prevent unintended changes; frame-only controls remain usable at minimum panel width."], checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("frame padding workflow passed\n");

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
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await accepted(page, { kind: "insert", nodes: fixture() });
    await select(page, "padding-frame");
    await workflow(page, mode);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(`${mode}: no uncaught browser errors`);
  } catch (cause) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw cause;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
    inputs.push({ mode, errors, appOutput: app.output });
  }
}

async function workflow(page: Page, mode: string) {
  await disclosure(page);
  await previewAndCancel(page);
  await edit(page, "Horizontal padding", "0.0000001", [10, 0.0000001, 30, 0.0000001]);
  assert.equal(
    await field(page, "Horizontal padding").getAttribute("readonly"),
    null,
    "Native exponent notation remains editable after committing and Undo/Redo",
  );
  await edit(page, "Horizontal padding", "24", [10, 24, 30, 24]);
  await openSides(page);
  await edit(page, "Left padding", "7.25", [10, 24, 30, 7.25]);
  await unchangedRedo(page);
  await edit(page, "Vertical padding", "32", [32, 24, 32, 7.25]);
  assert.ok(Math.abs((await native(page)).height - 102) < 0.1, "Fit height follows padding");
  assert.ok(Math.abs((await native(page)).childY - 35) < 0.1);
  await fixedClipping(page);
  await priorities(page);
  await sourceOwnership(page);
  await locks(page);
  await draftProtection(page);
  await frameOnly(page);
  await saveReopen(page, mode);
  await minimumPanel(page, mode);
}

function frame(id: string, style: DesignNode["style"] = {}): DesignNode {
  return {
    id,
    name: id,
    parentId: null,
    children: [],
    kind: "frame",
    mode: "inherit",
    clipContent: false,
    visible: true,
    locked: false,
    attributes: {},
    style: {
      position: "absolute",
      left: "80px",
      top: "80px",
      width: "250px",
      height: "auto",
      display: "flex",
      gap: "10px",
      border: "3px solid black",
      ...style,
    },
  };
}

function fixture(): DesignNode[] {
  const parent = frame("padding-frame", { padding: "10px 20px 30px 40px" });
  parent.children = ["card-one", "card-two"];
  return [
    parent,
    ...parent.children.map((id): DesignNode => ({
      id,
      name: id,
      parentId: parent.id,
      children: [],
      kind: "text",
      tag: "p",
      visible: true,
      locked: false,
      attributes: { title: id },
      runs: [{ text: id, style: {} }],
      style: {
        width: "70px",
        height: "32px",
        margin: "0",
        "flex-shrink": "0",
        background: "#dce7ef",
      },
    })),
    frame("empty", { left: "440px", height: "100px" }),
    frame("priority-frame", {
      left: "440px",
      top: "240px",
      height: "120px",
      "padding-left": "90px !important",
      padding: "10px 20px 30px 40px !important",
    }),
  ];
}

function field(page: Page, name: string) {
  return page.getByLabel(name, { exact: true });
}

async function openSides(page: Page) {
  const details = page.locator(".padding-controls details");
  if (!(await details.evaluate((element) => element.hasAttribute("open"))))
    await details.locator("summary").press("Enter");
}

async function disclosure(page: Page) {
  assert.equal(await field(page, "Horizontal padding").inputValue(), "");
  assert.equal(await field(page, "Vertical padding").getAttribute("placeholder"), "Mixed");
  await noEdit(page, async () => {
    await openSides(page);
    for (const [name, value] of [
      ["Top", "10"],
      ["Right", "20"],
      ["Bottom", "30"],
      ["Left", "40"],
    ])
      assert.equal(await field(page, `${name} padding`).inputValue(), value);
    await page.locator(".padding-controls summary").press("Space");
    await field(page, "Horizontal padding").focus();
    await field(page, "Horizontal padding").press("Tab");
  });
  checks.push(
    "Mixed paired values and keyboard disclosure preserve all sides, revision and history",
  );
}

async function previewAndCancel(page: Page) {
  const original = await native(page);
  await noEdit(page, async () => {
    await field(page, "Horizontal padding").fill("12.5");
    await padding(page, [10, 12.5, 30, 12.5]);
    await field(page, "Horizontal padding").press("Escape");
  });
  assert.deepEqual(await native(page), original);
  await noEdit(page, async () => {
    await field(page, "Horizontal padding").fill("15");
    await padding(page, [10, 15, 30, 15]);
    await field(page, "Horizontal padding").fill("-3");
    await page
      .getByRole("alert")
      .getByText("Enter a valid horizontal padding.", { exact: true })
      .waitFor();
    await padding(page, [10, 15, 30, 15]);
    await field(page, "Horizontal padding").press("Escape");
  });
  assert.deepEqual(await native(page), original);
  checks.push(
    "Decimal typing previews both sides live; Escape and invalid input preserve applied data",
  );
}

async function edit(page: Page, name: string, value: string, expected: number[]) {
  const before = (await session(page)).projects[0].document;
  await field(page, name).fill(value);
  await padding(page, expected);
  assertContent((await session(page)).projects[0].document, before);
  const pending = page.waitForResponse(isCommand);
  await field(page, name).press("Enter");
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  const request = response.request().postDataJSON();
  assert.equal(request.mutation.kind, "batch");
  assert.equal(request.mutation.mutations.length, 2);
  for (const change of request.mutation.mutations) assert.equal(change.id, "padding-frame");
  assertParentOnly(before, after);
  const boxes = await native(page);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  assert.deepEqual(await native(page), boxes);
  inputs.push({ trigger: name, value, request, before, after, native: boxes });
  checks.push(
    `${name}: live native values, one parent-only batch/revision and exact one-step history`,
  );
}

function assertParentOnly(before: DesignDocument, after: DesignDocument) {
  assert.equal(after.revision, before.revision + 1);
  const expected = structuredClone(after);
  expected.nodes["padding-frame"].style = before.nodes["padding-frame"].style;
  assertContent(expected, before);
}

async function unchangedRedo(page: Page) {
  await history(page, "undo");
  const before = await session(page);
  assert.equal(before.projects[0].canRedo, true);
  await noEdit(page, async () => {
    await field(page, "Horizontal padding").fill("24");
    await field(page, "Horizontal padding").press("Enter");
  });
  assert.deepEqual(await session(page), before);
  await history(page, "redo");
  checks.push("An unchanged explicit numeric edit preserves revision and the existing Redo stack");
}

async function fixedClipping(page: Page) {
  await accepted(page, { kind: "style", id: "padding-frame", values: { height: "62px" } });
  await accepted(page, { kind: "clip", id: "padding-frame", clipContent: true });
  await edit(page, "Vertical padding", "40", [40, 24, 40, 7.25]);
  const result = await native(page);
  assert.equal(
    result.height,
    86,
    "Native border-box padding and borders set the physical size floor",
  );
  assert.equal(result.overflow, "hidden");
  const document = (await session(page)).projects[0].document;
  assert.equal(document.nodes["padding-frame"].style.height, "62px");
  await accepted(page, { kind: "style", id: "padding-frame", values: { height: "auto" } });
  await accepted(page, { kind: "clip", id: "padding-frame", clipContent: false });
  checks.push(
    "Padding retains Fixed height intent and clipping while honoring the native decoration floor",
  );
}

async function priorities(page: Page) {
  await select(page, "priority-frame");
  await padding(page, [10, 20, 30, 40], "priority-frame");
  await field(page, "Horizontal padding").fill("12");
  const pending = page.waitForResponse(isCommand);
  await field(page, "Horizontal padding").press("Tab");
  assert.equal((await pending).status(), 200);
  await settled(page);
  await padding(page, [10, 12, 30, 12], "priority-frame");
  const style = (await session(page)).projects[0].document.nodes["priority-frame"].style;
  assert.equal(style.padding, "10px 20px 30px 40px !important");
  assert.equal(style["padding-left"], "12px !important");
  assert.equal(style["padding-right"], "12px !important");
  await history(page, "undo");
  await padding(page, [10, 20, 30, 40], "priority-frame");
  await history(page, "redo");
  await padding(page, [10, 12, 30, 12], "priority-frame");
  await select(page, "padding-frame");
  await mixedPriorities(page);
  checks.push(
    "Important shorthand and earlier longhand ordering survive paired edits, blur and history",
  );
}

async function mixedPriorities(page: Page) {
  await resetPadding(page, {
    padding: "10px 20px 30px 40px",
    "padding-top": "11px !important",
  });
  await edit(page, "Vertical padding", "18", [18, 20, 18, 40]);
  const style = (await session(page)).projects[0].document.nodes["padding-frame"].style;
  assert.equal(style["padding-top"], "18px !important");
  assert.equal(style["padding-bottom"], "18px");
  assert.equal(style.padding, "10px 20px 30px 40px");
  checks.push(
    "Paired edits retain each side's distinct important priority and unrelated shorthand",
  );
}

async function sourceOwnership(page: Page) {
  const cases: DesignNode["style"][] = [
    { padding: "var(--space)", "--space": "8px 16px" },
    { padding: "VAR(--space)", "--space": "8px 16px" },
    { padding: "env(orc-padding, 8px)" },
    { padding: "10%" },
    { padding: "calc(2px + 3px)" },
    { padding: "inherit" },
    { padding: "initial" },
    { padding: "unset" },
    { padding: "revert" },
    { padding: "revert-layer" },
    { padding: "10px", "padding-inline": "24px" },
    { padding: "10px", "padding-block-start": "var(--space)", "--space": "12px" },
    { padding: "10px", all: "initial" },
  ];
  for (const values of cases) {
    await resetPadding(page, values);
    await noEdit(page, async () => {
      assert.equal(await field(page, "Horizontal padding").getAttribute("readonly"), "");
      assert.equal(await field(page, "Vertical padding").getAttribute("readonly"), "");
      await openSides(page);
      for (const name of ["Top", "Right", "Bottom", "Left"])
        assert.equal(await field(page, `${name} padding`).getAttribute("readonly"), "");
    });
  }
  await partialSource(page);
  await pendingSourceSide(page);
  checks.push(
    "Variable, environment, percentage, calc, CSS-wide, logical and reset-owned padding require Code",
  );
}

async function pendingSourceSide(page: Page) {
  await resetPadding(page, {
    padding: "var(--space)",
    "--space": "8px 16px",
    "padding-right": "20px",
  });
  await openSides(page);
  assert.equal(await field(page, "Left padding").getAttribute("readonly"), "");
  assert.equal(await field(page, "Right padding").getAttribute("readonly"), null);
  await edit(page, "Right padding", "8", [8, 8, 8, 16]);
  assert.equal(
    (await session(page)).projects[0].document.nodes["padding-frame"].style.padding,
    "var(--space)",
  );
  await resetPadding(page, { padding: "20px" });
  checks.push("An explicit side overrides a variable shorthand without replacing its other values");
}

async function partialSource(page: Page) {
  await resetPadding(page, {
    padding: "10px 20px 30px 40px",
    "padding-left": "var(--space)",
    "--space": "9px",
  });
  assert.equal(await field(page, "Horizontal padding").getAttribute("readonly"), "");
  await openSides(page);
  assert.equal(await field(page, "Left padding").getAttribute("readonly"), "");
  await edit(page, "Right padding", "8", [10, 8, 30, 9]);
  assert.equal(
    (await session(page)).projects[0].document.nodes["padding-frame"].style["padding-left"],
    "var(--space)",
  );
  await resetPadding(page, { padding: "20px" });
  checks.push(
    "A source-owned side stays intact while an independently owned side remains editable",
  );
}

async function resetPadding(page: Page, values: DesignNode["style"]) {
  const style = (await session(page)).projects[0].document.nodes["padding-frame"].style;
  const unset = Object.keys(style).filter(
    (key) =>
      (key === "padding" || key.startsWith("padding-") || key === "all" || key === "--space") &&
      !Object.hasOwn(values, key),
  );
  await accepted(page, { kind: "style", id: "padding-frame", values, unset });
}

async function locks(page: Page) {
  await accepted(page, { kind: "lock", id: "card-one", locked: true });
  await edit(page, "Vertical padding", "22", [22, 20, 22, 20]);
  await accepted(page, { kind: "lock", id: "card-one", locked: false });
  const nested = frame("nested", { position: "absolute", width: "50px", height: "50px" });
  nested.parentId = "padding-frame";
  await accepted(page, { kind: "insert", nodes: [nested] });
  await accepted(page, { kind: "lock", id: "padding-frame", locked: true });
  assert.equal(await field(page, "Horizontal padding").isDisabled(), true);
  await select(page, "nested");
  assert.equal(await field(page, "Vertical padding").isDisabled(), true);
  const before = await session(page);
  const response = await command(page, { kind: "style", id: "nested", values: { padding: "1px" } });
  assert.equal(response.status(), 400);
  assert.deepEqual(await session(page), before);
  await accepted(page, { kind: "lock", id: "padding-frame", locked: false });
  await select(page, "padding-frame");
  checks.push(
    "Parent padding can reflow locked children; own and ancestor locks protect authored values",
  );
}

async function draftProtection(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.waitFor();
  const draft = `${await source.innerText()}\n<!-- padding draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  await field(page, "Vertical padding").fill("9");
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.equal(await source.innerText(), draft);
  await field(page, "Vertical padding").fill("9");
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await padding(page, [9, 20, 9, 20]);
  assert.deepEqual(await session(page), before, "Discard starts a preview without committing it");
  const pending = page.waitForResponse(isCommand);
  await field(page, "Vertical padding").press("Enter");
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.equal(
    (await session(page)).projects[0].document.revision,
    before.projects[0].document.revision + 1,
  );
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  const expected = nodeSource((await session(page)).projects[0].document, "padding-frame");
  await page.waitForFunction(
    (value) => document.querySelector('[aria-label="Object source"]')?.textContent === value,
    expected,
  );
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Draft Cancel retains source and applied data; Discard permits preview followed by one commit",
  );
}

async function frameOnly(page: Page) {
  await select(page, "card-one");
  assert.equal(await page.locator(".padding-controls").count(), 0);
  await select(page, "empty");
  assert.equal(await field(page, "Horizontal padding").inputValue(), "0");
  assert.equal(await field(page, "Vertical padding").inputValue(), "0");
  await select(page, "padding-frame");
  checks.push(
    "Frame-only Padding shows native zero defaults for an empty frame and stays hidden for Text",
  );
}

async function saveReopen(page: Page, mode: string) {
  const nativeBefore = await native(page);
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Padding ${mode}`);
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
  await select(page, "padding-frame");
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo, false);
  assert.equal(reopened.canRedo, false);
  assert.deepEqual(await native(page), nativeBefore);
  inputs.push({ mode, saved: saved.document, reopened: reopened.document, native: nativeBefore });
  checks.push(`${mode}: UI save/reopen retains exact CSS and native layout with fresh history`);
}

async function minimumPanel(page: Page, mode: string) {
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await openSides(page);
  await page.locator(".padding-controls summary").focus();
  const result = await page.locator(".padding-controls").evaluate((control) => {
    const panel = control.closest(".properties-panel");
    const summary = control.querySelector("summary");
    if (!panel || !summary) throw new Error("Missing Padding controls");
    const paired = [...control.querySelectorAll(":scope > .field-grid input")].map(
      (input) => input.getBoundingClientRect().top,
    );
    return {
      panelWidth: panel.getBoundingClientRect().width,
      panelOverflow: panel.scrollWidth > panel.clientWidth,
      summaryHeight: summary.getBoundingClientRect().height,
      focused: document.activeElement === summary,
      focusVisible: summary.matches(":focus-visible"),
      pairedCount: paired.length,
      pairedAlignment: Math.abs(paired[0] - paired[1]),
      clippedInputs: [...control.querySelectorAll("input")].some(
        (input) => input.getBoundingClientRect().right > panel.getBoundingClientRect().right,
      ),
    };
  });
  assert.equal(result.panelWidth, 240);
  assert.equal(result.panelOverflow, false);
  assert.equal(result.summaryHeight >= 44, true);
  assert.equal(result.focused && result.focusVisible, true);
  assert.equal(result.clippedInputs, false);
  assert.equal(result.pairedCount, 2);
  assert.ok(result.pairedAlignment < 0.1, "Paired inputs align even when one label wraps");
  await page.screenshot({ path: artifact(`${mode}-minimum.png`), fullPage: true });
  inputs.push({ mode, minimumPanel: result });
  checks.push(
    `${mode}: minimum Properties width retains visible keyboard focus and unclipped fields`,
  );
}

async function noEdit(page: Page, action: () => Promise<void>) {
  const before = await session(page);
  const requests: string[] = [];
  const record = (request: Request) => {
    if (new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postData() ?? "");
  };
  page.on("request", record);
  try {
    await action();
    await settled(page);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(requests, [], "No preview, disclosure or unchanged value sends a command");
  } finally {
    page.off("request", record);
    inputs.push({ trigger: "No edit", before, requests });
  }
}

async function padding(page: Page, expected: number[], id = "padding-frame") {
  await page.waitForFunction(
    ({ id, expected }) => {
      const element = document.querySelector(`.canvas-world [data-orc-id="${id}"]`);
      if (!element) return false;
      const style = getComputedStyle(element);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].every(
        (value, index) => Math.abs(parseFloat(value) - expected[index]) < 0.1,
      );
    },
    { id, expected },
  );
}

function native(page: Page) {
  return page.locator('.canvas-world [data-orc-id="padding-frame"]').evaluate((parent) => {
    const bounds = parent.getBoundingClientRect();
    const childElement = parent.querySelector('[data-orc-id="card-one"]');
    if (!childElement) throw new Error("Missing padding fixture child");
    const child = childElement.getBoundingClientRect();
    const style = getComputedStyle(parent);
    return {
      padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
      width: bounds.width,
      height: bounds.height,
      childX: child.x - bounds.x,
      childY: child.y - bounds.y,
      childWidth: child.width,
      childHeight: child.height,
      overflow: style.overflow,
    };
  });
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
  assert.equal(await field(page, "Name").inputValue(), id);
}

async function command(page: Page, mutation: Mutation) {
  const document = (await session(page)).projects[0].document;
  const request = {
    projectId: document.id,
    commandId: crypto.randomUUID(),
    expectedRevision: document.revision,
    mutation,
  };
  const response = await page.request.post("/api/commands", { data: request });
  inputs.push({ request, status: response.status(), response: await response.json() });
  return response;
}

async function accepted(page: Page, mutation: Mutation) {
  const response = await command(page, mutation);
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
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

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual({ ...actual, revision: 0 }, { ...expected, revision: 0 });
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function artifact(suffix: string) {
  return join(artifacts, `padding-${phase}-${suffix}`);
}

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
const phase = process.env.ORC_GAP_EVIDENCE ?? "verification";
const modes = process.env.ORC_GAP_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "gap-fixtures-"));
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
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), command: `ORC_GAP_EVIDENCE=${phase} ORC_GAP_MODES=${modes} bun scripts/e2e/editor/check-gap.ts ${channel}`, requirements: ["Typing, arrow adjustment, input scrubbing and native canvas handles edit one Gap value.", "Temporary previews create no revision, cancellation restores source and native layout, and completion is one Undo step.", "Source ownership, locks, Code drafts, native wrapping, zoom and save/reopen remain correct."], checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("frame gap workflow passed\n");

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
    await select(page, "gap-frame");
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
  await field(page, "Gap").waitFor({ timeout: 1500 });
  await previewAndCancel(page);
  await editGap(page, "0.0000001");
  assert.equal(await field(page, "Gap").getAttribute("readonly"), null);
  await editGap(page, "12.5");
  await inputArrows(page);
  await dragPaths(page);
  await zoomCancellation(page);
  await revisionCancellation(page);
  await flowAndZoom(page);
  await sourceOwnership(page);
  await locks(page);
  await draftProtection(page);
  await pendingHistory(page);
  await participation(page);
  await frameOnly(page);
  await saveReopen(page, mode);
  await minimumPanel(page, mode);
}

function field(page: Page, name: string) {
  return page.getByLabel(name, { exact: true });
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
  const parent = frame("gap-frame", { padding: "10px 20px 30px 40px" });
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
      "row-gap": "90px !important",
      gap: "10px !important",
    }),
  ];
}

async function previewAndCancel(page: Page) {
  const original = await native(page);
  await noEdit(page, async () => {
    await field(page, "Gap").fill("21.5");
    await gap(page, 21.5);
    await field(page, "Gap").press("Escape");
  });
  assert.deepEqual(await native(page), original);
  await noEdit(page, async () => {
    await field(page, "Gap").fill("18");
    await gap(page, 18);
    await field(page, "Gap").fill("-1");
    await page.getByRole("alert").getByText("Enter a valid gap.", { exact: true }).waitFor();
    await gap(page, 18);
    await field(page, "Gap").press("Escape");
  });
  checks.push(
    "Typing previews live without revision; Escape restores CSS and invalid input retains the last valid layout",
  );
}

async function editGap(page: Page, value: string, blur = "Enter") {
  await committed(page, async () => {
    await field(page, "Gap").fill(value);
    await gap(page, Number(value));
    await field(page, "Gap").press(blur);
  });
  await gap(page, Number(value));
}

async function committed(page: Page, action: () => Promise<void>) {
  const before = (await session(page)).projects[0].document;
  const [response] = await Promise.all([page.waitForResponse(isCommand), action()]);
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  const request = response.request().postDataJSON();
  assert.equal(request.mutation.kind, "batch");
  assert.equal(request.mutation.mutations.length, 2);
  for (const change of request.mutation.mutations) assert.equal(change.id, "gap-frame");
  assert.equal(after.revision, before.revision + 1);
  const expected = structuredClone(after);
  expected.nodes["gap-frame"].style = before.nodes["gap-frame"].style;
  assertContent(expected, before);
  const boxes = await native(page);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  assert.deepEqual(await native(page), boxes);
  inputs.push({ request, before, after, native: boxes });
  checks.push("Completed Gap edit is one parent-only batch/revision with exact one-step Undo/Redo");
}

async function inputArrows(page: Page) {
  await committed(page, async () => {
    await field(page, "Gap").focus();
    await field(page, "Gap").press("ArrowUp");
    await gap(page, 13.5);
    await field(page, "Gap").press("Shift+ArrowUp");
    await gap(page, 21.5);
    await field(page, "Gap").press("ArrowDown");
    await gap(page, 20.5);
    await field(page, "Gap").press("Enter");
  });
  await history(page, "undo");
  await noEdit(page, async () => {
    await field(page, "Gap").fill("12.5");
    await field(page, "Gap").press("Enter");
  });
  assert.equal((await session(page)).projects[0].canRedo, true);
  await history(page, "redo");
  checks.push("Input arrows preview 1/Shift 8, stay local, and unchanged values preserve Redo");
}

function handle(page: Page, axis = "x") {
  return page.locator(`.gap-handle[data-axis="${axis}"] input`).first();
}

async function startDrag(page: Page, target: ReturnType<typeof field>, dx: number, dy = 0) {
  const box = await target.boundingBox();
  assert.ok(box);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 5 });
  return point;
}

async function dragPaths(page: Page) {
  await committed(page, async () => {
    await startDrag(page, field(page, "Gap"), 15);
    await gap(page, 35.5);
    assert.equal((await session(page)).projects[0].document.nodes["gap-frame"].style.gap, "20.5px");
    await page.mouse.up();
  });
  await noEdit(page, async () => {
    await startDrag(page, field(page, "Gap"), 19);
    await gap(page, 54.5);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await gap(page, 35.5);
  });
  await noEdit(page, async () => {
    const start = await startDrag(page, field(page, "Gap"), 12);
    await gap(page, 47.5);
    await page.mouse.move(start.x, start.y);
    await page.mouse.up();
  });
  await committed(page, async () => {
    await startDrag(page, handle(page), 10);
    await gap(page, 45.5);
    await page.mouse.up();
  });
  await canvasCancellation(page);
  checks.push(
    "Input and canvas drags preview live, commit once, and Escape/return-to-start restore source",
  );
}

async function canvasCancellation(page: Page) {
  for (const cancel of ["Escape", "pointercancel", "blur"]) {
    await noEdit(page, async () => {
      await startDrag(page, handle(page), 10);
      await gap(page, 55.5);
      if (cancel === "Escape") await page.keyboard.press(cancel);
      else
        await page.evaluate(
          (name) =>
            window.dispatchEvent(
              name === "pointercancel" ? new PointerEvent(name) : new Event(name),
            ),
          cancel,
        );
      await page.mouse.up();
      await gap(page, 45.5);
    });
  }
  await committed(page, async () => {
    await handle(page).focus();
    await handle(page).press("Shift+ArrowUp");
    await gap(page, 53.5);
    assert.equal(await handle(page).evaluate((input) => document.activeElement === input), true);
    await handle(page).press("Enter");
  });
  checks.push(
    "Canvas cancellation restores the whole gesture; its native numeric control supports keyboard editing",
  );
}

async function zoomCancellation(page: Page) {
  const value = Number(await field(page, "Gap").inputValue());
  await noEdit(page, async () => {
    await startDrag(page, handle(page), 10);
    await gap(page, value + 10);
    await page.mouse.wheel(0, 160);
    await settled(page);
    await gap(page, value);
    await page.mouse.up();
  });
  const scale = (await native(page)).scale;
  const target = await handle(page).boundingBox();
  assert.ok(target);
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2);
  await page.mouse.wheel(0, Math.log(scale) / 0.0015);
  await settled(page);
  assert.ok(Math.abs((await native(page)).scale - 1) < 0.0001);
  checks.push("Changing canvas zoom cancels an active gap drag without committing preview values");
}

async function revisionCancellation(page: Page) {
  const before = (await session(page)).projects[0].document;
  const value = Number(await field(page, "Gap").inputValue());
  const requests: string[] = [];
  const record = (request: Request) => {
    if (new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postData() ?? "");
  };
  page.on("request", record);
  try {
    await startDrag(page, handle(page), 10);
    await gap(page, value + 10);
    await accepted(page, { kind: "rename", id: "empty", name: "empty revised" });
    await gap(page, value);
    await page.mouse.up();
    const after = (await session(page)).projects[0].document;
    assert.deepEqual(after.nodes["gap-frame"], before.nodes["gap-frame"]);
    assert.equal(after.revision, before.revision + 1);
    assert.deepEqual(requests, []);
    await accepted(page, { kind: "rename", id: "empty", name: "empty" });
  } finally {
    page.off("request", record);
  }
  checks.push(
    "A newer applied revision cancels the active drag instead of overwriting another change",
  );
}

async function flowAndZoom(page: Page) {
  await accepted(page, {
    kind: "style",
    id: "gap-frame",
    values: { "flex-direction": "column", padding: "10px" },
  });
  const height = (await native(page)).height;
  await committed(page, async () => {
    await startDrag(page, handle(page, "y"), 0, 10);
    await gap(page, 63.5);
    await page.mouse.up();
  });
  assert.equal((await native(page)).height - height, 10);
  const surface = page.getByRole("application", { name: "Canvas" });
  await surface.hover();
  await page.mouse.wheel(0, -180);
  await settled(page);
  const scale = (await native(page)).scale;
  assert.ok(scale > 1);
  await committed(page, async () => {
    await startDrag(page, handle(page, "y"), 0, Math.round(12 * scale));
    await gap(page, 75.5);
    await page.mouse.up();
  });
  await wrappedRows(page, scale);
  await wrappedGap(page, scale);
}

async function wrappedRows(page: Page, scale: number) {
  const document = (await session(page)).projects[0].document;
  const basis = document.nodes["card-two"];
  const cards = ["card-three", "card-four"].map((id) => ({
    ...structuredClone(basis),
    id,
    name: id,
  }));
  await accepted(page, { kind: "insert", nodes: cards });
  await accepted(page, {
    kind: "style",
    id: "gap-frame",
    values: { "flex-direction": "row", "flex-wrap": "wrap", gap: "10px" },
  });
  await accepted(page, { kind: "style", id: "card-one", values: { height: "60px" } });
  await handle(page, "y").waitFor({ timeout: 1500 });
  await rowHandlePlacement(page);
  await committed(page, async () => {
    await startDrag(page, handle(page), Math.round(90 * scale));
    await gap(page, 100);
    await settled(page);
    await gap(page, 100);
    await page.mouse.up();
  });
  await editGap(page, "10");
  await committed(page, async () => {
    await startDrag(page, handle(page, "y"), 0, Math.round(4 * scale));
    await gap(page, 14);
    await page.mouse.up();
  });
  await accepted(page, { kind: "delete", ids: cards.map((card) => card.id) });
  await accepted(page, { kind: "style", id: "card-one", values: { height: "32px" } });
  checks.push(
    "A wrapped Row with two unequal-height children per line exposes its real between-row gap",
  );
}

async function rowHandlePlacement(page: Page) {
  const separation = await handle(page, "y").evaluate((input) => {
    const parent = document.querySelector('.canvas-world [data-orc-id="gap-frame"]')!;
    const children = [...parent.querySelectorAll(":scope > [data-orc-id]")].map((child) =>
      child.getBoundingClientRect(),
    );
    const handle = input.getBoundingClientRect();
    return (
      (handle.y + handle.height / 2 - Math.max(children[0].bottom, children[1].bottom)) /
      new DOMMatrix(getComputedStyle(parent.closest(".canvas-world")!).transform).a
    );
  });
  assert.ok(Math.abs(separation - 5) < 0.01, "Wrapped row handle uses the tallest first-row child");
}

async function wrappedGap(page: Page, scale: number) {
  await accepted(page, {
    kind: "style",
    id: "gap-frame",
    values: {
      "flex-direction": "row",
      "flex-wrap": "wrap",
      width: "100px",
      height: "80px",
      gap: "10px",
    },
  });
  await accepted(page, { kind: "clip", id: "gap-frame", clipContent: true });
  const before = await native(page);
  await committed(page, async () => {
    await startDrag(page, handle(page, "y"), 0, Math.round(8 * scale));
    await gap(page, 18);
    await page.mouse.up();
  });
  const after = await native(page);
  assert.equal(after.height, before.height);
  assert.equal(after.overflow, "hidden");
  assert.ok(after.childY[1] > after.childY[0]);
  await accepted(page, {
    kind: "style",
    id: "gap-frame",
    values: { width: "250px", height: "auto", "flex-wrap": "nowrap", gap: "10px" },
  });
  await accepted(page, { kind: "clip", id: "gap-frame", clipContent: false });
  checks.push(
    "Column Fit grows with Gap; zoomed handles use design pixels; wrapped Row shares one Gap and preserves Fixed clipping",
  );
}

async function sourceOwnership(page: Page) {
  const cases: DesignNode["style"][] = [
    { gap: "var(--space)", "--space": "8px" },
    { gap: "VAR(--space)", "--space": "8px" },
    { gap: "env(orc-gap, 8px)" },
    { gap: "10%" },
    { gap: "calc(2px + 3px)" },
    ...["inherit", "initial", "unset", "revert", "revert-layer"].map((gap) => ({ gap })),
    { gap: "10px 20px" },
    { "row-gap": "10px", "column-gap": "10px !important" },
  ];
  for (const values of cases) {
    await resetGap(page, values);
    await noEdit(page, async () => {
      assert.equal(await field(page, "Gap").getAttribute("readonly"), "");
      assert.equal(await page.locator(".gap-handle").count(), 0);
    });
  }
  await resetGap(page, { gap: "10px", all: "initial" });
  await noEdit(page, async () => {
    assert.equal(await page.locator(".gap-controls, .gap-handle").count(), 0);
    await page.getByText("Layout controlled by source.", { exact: true }).waitFor();
  });
  await resetGap(page, { "row-gap": "10px !important", "column-gap": "10px !important" });
  await editGap(page, "14", "Tab");
  assert.equal(
    (await session(page)).projects[0].document.nodes["gap-frame"].style.gap,
    "14px !important",
  );
  await resetGap(page, {});
  assert.equal(await field(page, "Gap").inputValue(), "0");
  await resetGap(page, { gap: "normal" });
  assert.equal(await field(page, "Gap").inputValue(), "0");
  await editGap(page, "10");
  checks.push(
    "Unresolved, unequal axes and CSS-wide Gap stay in Code; equal fixed axes preserve priority in one authored Gap",
  );
}

async function resetGap(page: Page, values: DesignNode["style"]) {
  const style = (await session(page)).projects[0].document.nodes["gap-frame"].style;
  const unset = Object.keys(style).filter(
    (key) =>
      ["gap", "row-gap", "column-gap", "--space", "all"].includes(key) &&
      !Object.hasOwn(values, key),
  );
  await accepted(page, { kind: "style", id: "gap-frame", values, unset });
}

async function locks(page: Page) {
  await accepted(page, { kind: "lock", id: "card-one", locked: true });
  await editGap(page, "20");
  assert.equal((await session(page)).projects[0].document.nodes["card-one"].locked, true);
  await accepted(page, { kind: "lock", id: "gap-frame", locked: true });
  assert.equal(await field(page, "Gap").isDisabled(), true);
  assert.equal(await page.locator(".gap-handle").count(), 0);
  const before = await session(page);
  assert.equal(
    (await command(page, { kind: "style", id: "gap-frame", values: { gap: "1px" } })).status(),
    400,
  );
  assert.deepEqual(await session(page), before);
  await accepted(page, { kind: "lock", id: "gap-frame", locked: false });
  await ancestorLock(page);
  await accepted(page, { kind: "lock", id: "card-one", locked: false });
  checks.push(
    "Parent Gap can reflow a locked child without changing it; locked owners reject changes and hide handles",
  );
}

async function ancestorLock(page: Page) {
  const nested = frame("nested-gap", { width: "50px", height: "50px" });
  nested.parentId = "gap-frame";
  await accepted(page, { kind: "insert", nodes: [nested] });
  await accepted(page, { kind: "lock", id: "gap-frame", locked: true });
  await select(page, nested.id);
  assert.equal(await field(page, "Gap").isDisabled(), true);
  assert.equal(await page.locator(".gap-handle").count(), 0);
  const before = await session(page);
  assert.equal(
    (await command(page, { kind: "style", id: nested.id, values: { gap: "2px" } })).status(),
    400,
  );
  assert.deepEqual(await session(page), before);
  await accepted(page, { kind: "lock", id: "gap-frame", locked: false });
  await select(page, "gap-frame");
  await accepted(page, { kind: "delete", ids: [nested.id] });
  checks.push("An ancestor lock also protects nested Gap controls and server commands");
}

async function makeDraft(page: Page) {
  const code = page.getByRole("textbox", { name: "Object source", exact: true });
  await code.waitFor();
  const draft = `${await code.innerText()}\n<!-- gap draft -->`;
  await code.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  return draft;
}

async function draftProtection(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const draft = await makeDraft(page);
  const before = await session(page);
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await field(page, "Gap").fill("9");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.equal(
    await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
    draft,
  );
  await startDrag(page, field(page, "Gap"), 15);
  await page.mouse.up();
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await gap(page, 20);
  assert.deepEqual(await session(page), before, "A released pointer cannot resume after Discard");
  await makeDraft(page);
  await field(page, "Gap").fill("9");
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await gap(page, 9);
  const pending = page.waitForResponse(isCommand);
  await field(page, "Gap").press("Enter");
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.equal(
    (await session(page)).projects[0].document.revision,
    before.projects[0].document.revision + 1,
  );
  assert.equal(
    await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
    nodeSource((await session(page)).projects[0].document, "gap-frame"),
  );
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Draft Cancel preserves applied data; Discard enables typing; a released drag never resumes after the dialog",
  );
}

async function pendingHistory(page: Page) {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = () => {};
  const ready = new Promise<void>((resolve) => {
    received = resolve;
  });
  const requests: unknown[] = [];
  await page.route("**/api/commands", async (route) => {
    requests.push(route.request().postDataJSON());
    const response = await route.fetch();
    received();
    await held;
    await route.fulfill({ response });
  });
  const before = (await session(page)).projects[0].document;
  try {
    await startDrag(page, handle(page), 14);
    await page.mouse.up();
    await ready;
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    release();
    await page.waitForFunction(async (revision) => {
      const data = await (await fetch("/api/session")).json();
      return data.projects[0].document.revision >= revision + 2;
    }, before.revision);
    await settled(page);
    assertContent((await session(page)).projects[0].document, before);
    assert.equal(requests.length, 1);
    inputs.push({ trigger: "Pending drag acknowledgement and immediate Undo", before, requests });
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    "Immediate Undo waits for pending Gap drag acknowledgement; blur sends no duplicate command",
  );
}

async function participation(page: Page) {
  const cases: DesignNode["style"][] = [{ position: "absolute" }, { display: "none" }];
  for (const values of cases) {
    await accepted(page, { kind: "style", id: "card-two", values });
    assert.equal(await page.locator(".gap-handle").count(), 0);
    assert.equal(await field(page, "Gap").getAttribute("readonly"), null);
    await accepted(page, { kind: "style", id: "card-two", values: {}, unset: Object.keys(values) });
    await handle(page).waitFor();
  }
  await accepted(page, { kind: "style", id: "gap-frame", values: { display: "block" } });
  assert.equal(await page.locator(".gap-controls, .gap-handle").count(), 0);
  await accepted(page, { kind: "style", id: "gap-frame", values: { display: "flex" } });
  checks.push(
    "Absolute and hidden children create no flow gap handles; Free frames expose no Gap control",
  );
}

async function frameOnly(page: Page) {
  await select(page, "card-one");
  assert.equal(await page.locator(".gap-controls, .gap-handle").count(), 0);
  await select(page, "empty");
  assert.equal(await field(page, "Gap").inputValue(), "10");
  assert.equal(await page.locator(".gap-handle").count(), 0);
  const one = frame("single", { width: "50px", height: "30px" });
  one.parentId = "empty";
  await accepted(page, { kind: "insert", nodes: [one] });
  await select(page, "empty");
  assert.equal(await page.locator(".gap-handle").count(), 0);
  await select(page, "gap-frame");
  await resetGap(page, { gap: "0px" });
  await handle(page).waitFor({ timeout: 1500 });
  await noEdit(page, async () => {
    await field(page, "Gap").focus();
    await field(page, "Gap").press("Shift+ArrowDown");
    await field(page, "Gap").press("Enter");
    await startDrag(page, handle(page), -12);
    await settled(page);
    await page.mouse.up();
    await gap(page, 0);
  });
  await editGap(page, "10");
  checks.push(
    "Text has no Gap controls; zero/one participating child has no handle; zero Gap remains directly draggable",
  );
}

async function minimumPanel(page: Page, mode: string) {
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await field(page, "Gap").focus();
  const result = await page.locator(".gap-controls").evaluate((control) => {
    const panel = control.closest(".properties-panel");
    const input = control.querySelector("input");
    if (!panel || !input) throw new Error("Missing Gap controls");
    return {
      panelWidth: panel.getBoundingClientRect().width,
      overflow: panel.scrollWidth > panel.clientWidth,
      inputRight: input.getBoundingClientRect().right,
      panelRight: panel.getBoundingClientRect().right,
      focused: document.activeElement === input && input.matches(":focus-visible"),
    };
  });
  assert.equal(result.panelWidth, 240);
  assert.equal(result.overflow, false);
  assert.ok(result.inputRight <= result.panelRight);
  assert.equal(result.focused, true);
  const target = await handle(page).boundingBox();
  assert.ok(target && target.width >= 44 && target.height >= 44);
  const contrast = await handleContrast(page);
  inputs.push({ mode, handleContrast: contrast });
  assert.ok(contrast.ratio >= 4.5, `Gap number contrast ${contrast.ratio} must reach 4.5:1`);
  await page.screenshot({ path: artifact(`${mode}-minimum.png`), fullPage: true });
  inputs.push({ mode, minimumPanel: result, handle: target });
  checks.push(
    `${mode}: minimum Properties width has no overflow, visible keyboard focus and a 44px canvas handle`,
  );
}

function handleContrast(page: Page) {
  return handle(page).evaluate((input) => {
    const luminance = (color: string) => {
      const rgb = color
        .match(/\d+(?:\.\d+)?/gu)
        ?.slice(0, 3)
        .map(Number);
      if (!rgb || rgb.length !== 3) throw new Error(`Unsupported computed color ${color}`);
      const linear = rgb
        .map((channel) => channel / 255)
        .map((channel) =>
          channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
        );
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const foreground = getComputedStyle(input).color;
    const background = getComputedStyle(input.closest(".gap-handle")!, "::before").backgroundColor;
    const values = [luminance(foreground), luminance(background)];
    return {
      foreground,
      background,
      ratio: (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05),
    };
  });
}

async function gap(page: Page, expected: number) {
  await page.waitForFunction(
    (value) => {
      const element = document.querySelector('.canvas-world [data-orc-id="gap-frame"]');
      if (!element) return false;
      const style = getComputedStyle(element);
      return [style.rowGap, style.columnGap].every(
        (gap) => Math.abs(parseFloat(gap) - value) < 0.001,
      );
    },
    expected,
    { timeout: 5000 },
  );
}

function native(page: Page) {
  return page.locator('.canvas-world [data-orc-id="gap-frame"]').evaluate((parent) => {
    const bounds = parent.getBoundingClientRect();
    const scale = new DOMMatrix(getComputedStyle(parent.closest(".canvas-world")!).transform).a;
    const children = [...parent.querySelectorAll(":scope > [data-orc-id]")].map((child) =>
      child.getBoundingClientRect(),
    );
    const style = getComputedStyle(parent);
    return {
      scale,
      width: bounds.width / scale,
      height: bounds.height / scale,
      gap: [style.rowGap, style.columnGap],
      overflow: style.overflow,
      childX: children.map((box) => (box.x - bounds.x) / scale),
      childY: children.map((box) => (box.y - bounds.y) / scale),
    };
  });
}

async function saveReopen(page: Page, mode: string) {
  const nativeBefore = await native(page);
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Gap ${mode}`);
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
  await select(page, "gap-frame");
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo, false);
  assert.equal(reopened.canRedo, false);
  assertSameLayout(await native(page), nativeBefore);
  inputs.push({ mode, saved: saved.document, reopened: reopened.document, native: nativeBefore });
  checks.push(`${mode}: UI save/reopen retains exact CSS and native layout with fresh history`);
}

function assertSameLayout(
  actual: Awaited<ReturnType<typeof native>>,
  expected: Awaited<ReturnType<typeof native>>,
) {
  assert.deepEqual(actual.gap, expected.gap);
  assert.equal(actual.overflow, expected.overflow);
  const values = (layout: typeof actual) => [
    layout.width,
    layout.height,
    ...layout.childX,
    ...layout.childY,
  ];
  for (const [index, value] of values(actual).entries())
    assert.ok(
      Math.abs(value - values(expected)[index]) < 0.01,
      "Reopening retains unzoomed native layout",
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
  return join(artifacts, `gap-${phase}-${suffix}`);
}

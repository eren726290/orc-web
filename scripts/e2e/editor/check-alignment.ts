import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page, type Response } from "playwright";
import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_ALIGNMENT_EVIDENCE ?? "verification";
const modes = process.env.ORC_ALIGNMENT_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "alignment-fixtures-"));
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
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), command: `ORC_ALIGNMENT_EVIDENCE=${phase} ORC_ALIGNMENT_MODES=${modes} bun scripts/e2e/editor/check-alignment.ts ${channel}`, requirements: ["Nine physical packed positions exchange main and cross axes in Row/Column without changing siblings.", "Visible Packed/Space between choices retain Gap, including native wrapping, overflow and zero/one participants.", "Only parent CSS changes in one command, with exact history, source ownership, priority, locks, drafts and saving preserved."], checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("frame alignment workflow passed\n");

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
    await select(page, "alignment-frame");
    await page
      .getByRole("button", { name: "Align top left", exact: true })
      .waitFor({ timeout: 1500 });
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
  await positions(page, "Row");
  await positions(page, "Column");
  await distribution(page);
  await participation(page);
  await wrappedRows(page);
  await priorities(page);
  await sourceOwnership(page);
  await locks(page);
  await ancestorLock(page);
  await draftProtection(page);
  await staleDraft(page);
  await rejection(page);
  await pendingHistory(page);
  await focusAndNoop(page);
  await saveReopen(page, mode);
  await minimumPanel(page, mode);
}

function frameStyle(): DesignNode["style"] {
  return {
    position: "absolute",
    left: "80px",
    top: "80px",
    width: "260px",
    height: "220px",
    display: "flex",
    gap: "10px",
    padding: "10px",
    border: "2px solid black",
  };
}

function fixture(): DesignNode[] {
  const parent: DesignNode = {
    id: "alignment-frame",
    name: "alignment-frame",
    parentId: null,
    children: ["card-one", "card-two"],
    kind: "frame",
    mode: "inherit",
    clipContent: false,
    visible: true,
    locked: false,
    attributes: {},
    style: frameStyle(),
  };
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
        width: "50px",
        height: "30px",
        margin: "0",
        "flex-shrink": "0",
        background: "#dce7ef",
      },
    })),
  ];
}

async function positions(page: Page, direction: "Row" | "Column") {
  if (direction === "Column") await choice(page, "Column");
  for (const [y, vertical] of ["top", "middle", "bottom"].entries()) {
    for (const [x, horizontal] of ["left", "center", "right"].entries()) {
      const name = `Align ${vertical} ${horizontal}`;
      await choice(page, name);
      const boxes = await native(page);
      const expected =
        direction === "Row" ? [12 + x * 63, 12 + y * 83] : [12 + x * 93, 12 + y * 63];
      close(boxes.children[0].x, expected[0]);
      close(boxes.children[0].y, expected[1]);
      close(boxes.children[1].x, expected[0] + (direction === "Row" ? 60 : 0));
      close(boxes.children[1].y, expected[1] + (direction === "Column" ? 40 : 0));
      assert.equal(
        await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(await button(page, "Packed").getAttribute("aria-pressed"), "true");
      inputs.push({ direction, name, expected, native: boxes });
    }
  }
  checks.push(
    `${direction}: all nine physical packed positions, retained sibling order and exact history`,
  );
}

async function distribution(page: Page) {
  await choice(page, "Space between");
  let boxes = await native(page);
  close(boxes.children[0].y, 12);
  close(boxes.children[1].y, 178);
  assert.equal(boxes.gap, "10px");
  assert.equal(await page.getByLabel("Gap", { exact: true }).inputValue(), "10");
  await choice(page, "Packed");
  boxes = await native(page);
  close(boxes.children[0].y, 12);
  close(boxes.children[1].y, 52);
  await choice(page, "Row");
  await choice(page, "Space between");
  boxes = await native(page);
  close(boxes.children[0].x, 12);
  close(boxes.children[1].x, 198);
  await choice(page, "Align middle center");
  close((await native(page)).children[0].x, 75);
  assert.equal(await button(page, "Packed").getAttribute("aria-pressed"), "true");
  checks.push(
    "Named distribution exchanges axes, preserves Gap and choosing a packed point exits Space between",
  );
}

async function participation(page: Page) {
  await choice(page, "Space between");
  const exclusions: DesignNode["style"][] = [{ position: "absolute" }, { display: "none" }];
  for (const values of exclusions) {
    await accepted(page, { kind: "style", id: "card-two", values });
    close((await native(page)).children[0].x, 12);
    await accepted(page, { kind: "style", id: "card-two", values: {}, unset: Object.keys(values) });
  }
  await accepted(page, { kind: "style", id: "card-one", values: { display: "none" } });
  await accepted(page, { kind: "style", id: "card-two", values: { display: "none" } });
  assert.equal((await native(page)).justify, "space-between");
  assert.equal(await page.getByLabel("Gap", { exact: true }).inputValue(), "10");
  for (const id of ["card-one", "card-two"])
    await accepted(page, { kind: "style", id, values: {}, unset: ["display"] });
  await accepted(page, { kind: "style", id: "alignment-frame", values: { width: "100px" } });
  const boxes = await native(page);
  close(boxes.children[0].x, 12);
  close(boxes.children[1].x, 72);
  assert.equal(boxes.gap, "10px");
  assert.equal(boxes.width, 100);
  await resetStyle(page);
  checks.push(
    "Zero/one participants, hidden/Absolute exclusion and insufficient space use native start fallback without changing Gap",
  );
}

async function wrappedRows(page: Page) {
  const extras = fixture()
    .slice(1)
    .map((node, i) => ({ ...node, id: `wrap-${i}`, name: `wrap-${i}` }));
  await accepted(page, { kind: "insert", nodes: extras });
  await accepted(page, {
    kind: "style",
    id: "alignment-frame",
    values: { width: "140px", "flex-wrap": "wrap" },
  });
  await accepted(page, { kind: "style", id: "card-two", values: { height: "20px" } });
  await choice(page, "Align middle center");
  let boxes = await native(page);
  close(boxes.children[0].x, 15);
  close(boxes.children[0].y, 75);
  close(boxes.children[1].y, 80);
  close(boxes.children[2].y, 115);
  await choice(page, "Space between");
  boxes = await native(page);
  close(boxes.children[0].x, 12);
  close(boxes.children[1].x, 78);
  close(boxes.children[2].y, 115);
  assert.equal(boxes.gap, "10px");
  await accepted(page, { kind: "delete", ids: extras.map((node) => node.id) });
  await accepted(page, { kind: "style", id: "card-two", values: { height: "30px" } });
  await resetStyle(page);
  checks.push(
    "Wrapped rows pack their lines and unequal children physically; Space between distributes within each line",
  );
}

async function priorities(page: Page) {
  await resetStyle(page, {
    "justify-content": "flex-end !important",
    "align-items": "flex-end !important",
    "place-content": "center !important",
  });
  await choice(page, "Align top left");
  const style = (await session(page)).projects[0].document.nodes["alignment-frame"].style;
  assert.equal(style["place-content"], "center !important");
  assert.equal(style["justify-content"], "flex-start !important");
  assert.equal(style["align-items"], "flex-start !important");
  close((await native(page)).children[0].x, 12);
  await resolvedShorthand(page);
  await resetStyle(page);
  checks.push(
    "Important shorthand precedence survives explicit alignment, one parent batch and history",
  );
}

async function resolvedShorthand(page: Page) {
  await resetStyle(page, {
    "place-content": "var(--alignment)",
    "--alignment": "center",
    "justify-content": "flex-end",
    "align-content": "flex-end",
    "align-items": "flex-end",
  });
  await choice(page, "Align top left");
  const style = (await session(page)).projects[0].document.nodes["alignment-frame"].style;
  assert.equal(style["place-content"], "var(--alignment)");
  close((await native(page)).children[0].x, 12);
  checks.push(
    "Explicit resolved longhands remain editable without flattening the variable shorthand",
  );
}

async function sourceOwnership(page: Page) {
  const cases: DesignNode["style"][] = [
    { "justify-content": "var(--align)", "--align": "center" },
    { "align-items": "var(--align)", "--align": "center" },
    { "place-content": "var(--align)", "--align": "center" },
    { "place-items": "var(--align)", "--align": "center" },
    { "align-content": "var(--align)", "--align": "center" },
    { "justify-content": "env(orc-align, center)" },
    { "justify-content": "space-around" },
    { "justify-content": "inherit" },
    { "align-items": "initial" },
    { direction: "rtl" },
    { "writing-mode": "vertical-rl" },
  ];
  for (const values of cases) {
    await resetStyle(page, values);
    await noEdit(page, async () =>
      assert.equal(await button(page, "Align top left").isDisabled(), true),
    );
    assert.deepEqual((await session(page)).projects[0].document.nodes["alignment-frame"].style, {
      ...frameStyle(),
      ...values,
    });
  }
  await resetStyle(page, { "align-items": "var(--cross)", "--cross": "center" });
  await choice(page, "Space between");
  assert.equal(
    (await session(page)).projects[0].document.nodes["alignment-frame"].style["align-items"],
    "var(--cross)",
  );
  await resetStyle(page);
  checks.push(
    "Source expressions, CSS-wide values and unsupported physical directions stay intact; independent distribution remains editable",
  );
}

async function ancestorLock(page: Page) {
  const parent = fixture()[0];
  const ancestor = {
    ...parent,
    id: "ancestor",
    name: "ancestor",
    children: [],
    style: { ...frameStyle(), display: "block", left: "400px", width: "400px", height: "400px" },
  };
  await accepted(page, { kind: "insert", nodes: [ancestor] });
  await accepted(page, { kind: "reorder", id: "alignment-frame", parentId: "ancestor", index: 0 });
  await accepted(page, { kind: "lock", id: "ancestor", locked: true });
  assert.equal(await button(page, "Align top left").isDisabled(), true);
  assert.equal(await button(page, "Space between").isDisabled(), true);
  const before = await session(page);
  const document = before.projects[0].document;
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: document.id,
      commandId: crypto.randomUUID(),
      expectedRevision: document.revision,
      mutation: { kind: "style", id: "alignment-frame", values: { "justify-content": "center" } },
    },
  });
  assert.equal(response.status(), 400);
  assert.deepEqual(await session(page), before);
  await accepted(page, { kind: "lock", id: "ancestor", locked: false });
  await accepted(page, { kind: "reorder", id: "alignment-frame", parentId: null, index: 0 });
  await accepted(page, { kind: "delete", ids: ["ancestor"] });
  checks.push(
    "Ancestor locks disable alignment and distribution and reject an attempted backend edit atomically",
  );
}

async function rejection(page: Page) {
  const before = await session(page);
  const boxes = await native(page);
  await page.route("**/api/commands", (route) =>
    route.fulfill({ status: 409, json: { error: "Alignment rejection control" } }),
  );
  try {
    await button(page, "Align top left").click();
    await page.getByRole("alert").filter({ hasText: "Alignment rejection control" }).waitFor();
    await page.waitForFunction(
      () => !document.querySelector(".alignment-controls button")?.matches(":disabled"),
    );
    await settled(page);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(await native(page), boxes);
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    "A rejected alignment command restores preview and preserves the exact applied document and history",
  );
}

async function staleDraft(page: Page) {
  await button(page, "Code").click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = `${await source.innerText()}\n<!-- stale alignment draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  await button(page, "Align top left").click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await accepted(page, { kind: "style", id: "alignment-frame", values: { width: "300px" } });
  const boxes = await native(page);
  const before = await session(page);
  await noEdit(page, async () => {
    await dialog.getByRole("button", { name: "Discard", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "The layout changed. Try again." })
      .waitFor({ timeout: 1500 });
  });
  assert.deepEqual(await native(page), boxes);
  inputs.push({
    trigger: "Stale alignment after a draft dialog",
    before,
    after: await session(page),
  });
  await button(page, "Code").click();
  await resetStyle(page);
  checks.push(
    "A newer revision during draft preparation rejects the stale action, explains retry and preserves applied state without a command",
  );
}

async function locks(page: Page) {
  await accepted(page, { kind: "lock", id: "card-one", locked: true });
  await choice(page, "Align bottom right");
  await accepted(page, { kind: "lock", id: "card-one", locked: false });
  await accepted(page, { kind: "lock", id: "alignment-frame", locked: true });
  assert.equal(await button(page, "Align top left").isDisabled(), true);
  assert.equal(await button(page, "Space between").isDisabled(), true);
  await accepted(page, { kind: "lock", id: "alignment-frame", locked: false });
  await select(page, "card-one");
  assert.equal(await page.locator(".alignment-controls").count(), 0);
  await select(page, "alignment-frame");
  await resetStyle(page);
  checks.push(
    "Parent alignment reflows locked children without editing them; own locks disable controls and Text has no frame alignment",
  );
}

async function draftProtection(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = `${await source.innerText()}\n<!-- alignment draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  await button(page, "Align bottom right").click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.equal(await source.innerText(), draft);
  await button(page, "Align bottom right").click();
  const pending = page.waitForResponse(isCommand);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  assertParentOnly(before.projects[0].document, (await session(page)).projects[0].document);
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Draft Cancel preserves source and applied data; Discard permits exactly one alignment command",
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
    await button(page, "Align top left").click();
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
    assert.equal(await focusedLabel(page), "Canvas");
    inputs.push({ trigger: "Pending alignment and immediate Undo", requests });
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    "Immediate Undo waits for pending alignment acknowledgement without duplicate commands",
  );
}

async function focusAndNoop(page: Page) {
  await history(page, "redo");
  await choice(page, "Align middle center", "Enter");
  assert.equal(
    await button(page, "Align middle center").evaluate(
      (element) => element === document.activeElement,
    ),
    false,
    "History checks leave Canvas focused",
  );
  const pending = page.waitForResponse(isCommand);
  await button(page, "Align bottom right").press("Enter");
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.equal(
    await button(page, "Align bottom right").evaluate(
      (element) => element === document.activeElement,
    ),
    true,
  );
  await history(page, "undo");
  await noEdit(page, async () => {
    await button(page, "Align middle center").click();
  });
  assert.equal((await session(page)).projects[0].canRedo, true);
  await history(page, "redo");
  checks.push(
    "Keyboard activation restores the selected control focus; an unchanged point preserves Redo",
  );
}

async function minimumPanel(page: Page, mode: string) {
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await button(page, "Align top left").focus();
  const result = await page.locator(".alignment-controls").evaluate((control) => {
    const panel = control.closest(".properties-panel");
    if (!panel) throw new Error("Missing Properties panel");
    return {
      panelWidth: panel.getBoundingClientRect().width,
      overflow: panel.scrollWidth > panel.clientWidth,
      buttons: [...control.querySelectorAll("button")].map((element) => {
        const box = element.getBoundingClientRect();
        return {
          label: element.getAttribute("aria-label") || element.textContent,
          width: box.width,
          height: box.height,
        };
      }),
      focusVisible: document.activeElement?.matches(":focus-visible"),
    };
  });
  assert.equal(result.panelWidth, 240);
  assert.equal(result.overflow, false);
  assert.equal(result.buttons.length, 11);
  for (const target of result.buttons) assert.ok(target.width >= 44 && target.height >= 44);
  assert.equal(result.focusVisible, true);
  await page.screenshot({ path: artifact(`${mode}-minimum.png`), fullPage: true });
  inputs.push({ mode, minimumPanel: result });
  checks.push(
    `${mode}: nine labeled positions and named distribution remain usable with visible focus at minimum width`,
  );
}

async function saveReopen(page: Page, mode: string) {
  const boxes = await native(page);
  await button(page, "Not saved").click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Alignment ${mode}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), temporary));
  await button(page, "Save project").click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const saved = (await session(page)).projects[0];
  assert.ok(saved.path);
  assert.deepEqual(
    JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
    saved.document,
  );
  await button(page, `Close ${saved.document.name}`).click();
  await button(page, "Open project").click();
  await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(saved.path);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await select(page, "alignment-frame");
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo || reopened.canRedo, false);
  assert.deepEqual(await native(page), boxes);
  inputs.push({ mode, saved: saved.document, reopened: reopened.document, native: boxes });
  checks.push(
    `${mode}: UI save/reopen retains exact parent CSS, hierarchy and native positions with fresh history`,
  );
}

async function choice(page: Page, name: string, key?: string) {
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  if (key) await button(page, name).press(key);
  else await button(page, name).click();
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  const request = response.request().postDataJSON();
  assert.equal(request.mutation.kind, "batch");
  if (!["Row", "Column"].includes(name)) {
    for (const change of request.mutation.mutations) assert.equal(change.id, "alignment-frame");
    assertParentOnly(before, after);
  } else
    assert.deepEqual(
      after.nodes["alignment-frame"].children,
      before.nodes["alignment-frame"].children,
    );
  const boxes = await native(page);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  assert.deepEqual(await native(page), boxes);
  inputs.push({ trigger: name, request, before, after, native: boxes });
}

async function resetStyle(page: Page, values: DesignNode["style"] = {}) {
  const style = (await session(page)).projects[0].document.nodes["alignment-frame"].style;
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "alignment-frame", values: {}, unset: Object.keys(style) },
      { kind: "style", id: "alignment-frame", values: { ...frameStyle(), ...values } },
    ],
  });
}

function native(page: Page) {
  return page.locator('.canvas-world [data-orc-id="alignment-frame"]').evaluate((parent) => {
    const bounds = parent.getBoundingClientRect();
    const world = parent.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const style = getComputedStyle(parent);
    return {
      width: bounds.width / scale,
      height: bounds.height / scale,
      gap: style.gap,
      justify: style.justifyContent,
      align: style.alignItems,
      lines: style.alignContent,
      children: [...parent.children]
        .filter((child) => child.hasAttribute("data-orc-id"))
        .map((child) => {
          const box = child.getBoundingClientRect();
          return {
            id: child.getAttribute("data-orc-id"),
            x: (box.x - bounds.x) / scale,
            y: (box.y - bounds.y) / scale,
            width: box.width / scale,
            height: box.height / scale,
          };
        }),
    };
  });
}

async function noEdit(page: Page, action: () => Promise<void>) {
  const before = await session(page);
  const requests: string[] = [];
  const record = (request: import("playwright").Request) => {
    if (new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postData() ?? "");
  };
  page.on("request", record);
  try {
    await action();
    await settled(page);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(requests, []);
  } finally {
    page.off("request", record);
    inputs.push({ trigger: "No edit", requests });
  }
}

async function select(page: Page, id: string) {
  const node = (await session(page)).projects[0].document.nodes[id];
  if (node.parentId && (await button(page, `Expand ${node.parentId}`).count()))
    await button(page, `Expand ${node.parentId}`).click();
  await page
    .locator(".layer-name")
    .filter({ has: page.getByText(id, { exact: true }) })
    .click();
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), id);
}

async function accepted(page: Page, mutation: Mutation) {
  const document = (await session(page)).projects[0].document;
  const request = {
    projectId: document.id,
    commandId: crypto.randomUUID(),
    expectedRevision: document.revision,
    mutation,
  };
  const response = await page.request.post("/api/commands", { data: request });
  assert.equal(response.status(), 200, await response.text());
  inputs.push({ request, status: response.status(), response: await response.json() });
  await settled(page);
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

function assertParentOnly(before: DesignDocument, after: DesignDocument) {
  assert.equal(after.revision, before.revision + 1);
  const expected = structuredClone(after);
  expected.nodes["alignment-frame"].style = before.nodes["alignment-frame"].style;
  assertContent(expected, before);
  const alignment = ["justify-content", "align-items", "align-content"];
  const unrelated = (document: DesignDocument) =>
    Object.fromEntries(
      Object.entries(document.nodes["alignment-frame"].style).filter(
        ([property]) => !alignment.includes(property),
      ),
    );
  assert.deepEqual(
    unrelated(after),
    unrelated(before),
    "Alignment preserves every unrelated parent CSS declaration",
  );
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function focusedLabel(page: Page) {
  return page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
}

function isCommand(response: Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}

function button(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.1, `Expected ${expected}, got ${actual}`);
}

function artifact(suffix: string) {
  return join(artifacts, `alignment-${phase}-${suffix}`);
}

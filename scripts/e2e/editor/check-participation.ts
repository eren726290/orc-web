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
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_PARTICIPATION_EVIDENCE ?? "verification";
const modes = process.env.ORC_PARTICIPATION_MODES ?? "development+built";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "participation-fixtures-"));
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
  const after = sourceEvidence();
  assert.deepEqual(after.sourceHashes, evidence.sourceHashes);
  await writeFile(
    artifact("result.json"),
    JSON.stringify(
      {
        ...evidence,
        after,
        channel,
        browserVersion: browser.version(),
        modes,
        phase,
        command: `ORC_PARTICIPATION_EVIDENCE=${phase} ORC_PARTICIPATION_MODES=${modes} bun scripts/e2e/editor/check-participation.ts ${channel}`,
        checks,
        inputs,
        failure,
      },
      null,
      2,
    ),
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("absolute position workflow passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const { errors, consoleErrors } = observeErrors(page);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await newProject(page, app.url);
    assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), "middle");
    assert.equal(
      await control(page).count(),
      1,
      "Selected Flex child must expose Absolute Position.",
    );
    await workflow(page, mode);
    assert.deepEqual(errors, []);
    assert.equal(
      consoleErrors.length,
      1,
      "Only the deliberate command rejection reports a console error",
    );
    assert.match(consoleErrors[0].text, /status of 409/u);
    assert.equal(new URL(consoleErrors[0].url).pathname, "/api/commands");
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
  } catch (cause) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw cause;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    const exit = await app.stop();
    inputs.push({ mode, exit, errors, consoleErrors, appOutput: app.output });
    assert.equal(exit, 0);
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
    checks.push(`${mode}: owned application closed cleanly`);
  }
}

async function newProject(page: Page, url: string) {
  assert.equal((await page.goto(url))?.status(), 200);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await accepted(page, { kind: "insert", nodes: fixture() });
  await select(page, "middle");
}

function observeErrors(page: Page) {
  const errors: string[] = [];
  const consoleErrors: { text: string; url: string }[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push({ text: message.text(), url: message.location().url });
  });
  return { errors, consoleErrors };
}

function parentFixture(): DesignNode {
  return {
    id: "parent",
    name: "parent",
    parentId: null,
    children: ["first", "middle", "last"],
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
      display: "flex",
      gap: "10px",
      padding: "12px",
      border: "3px solid black",
      "box-sizing": "border-box",
      width: "300px",
      height: "140px",
      "align-items": "center",
    },
  };
}

function fixture(): DesignNode[] {
  const parent = parentFixture();
  return [
    parent,
    ...parent.children.map((id): DesignNode => ({
      ...parent,
      id,
      name: id,
      parentId: parent.id,
      children: [],
      attributes: { title: `Retained ${id}` },
      style: {
        width: "60px",
        height: id === "middle" ? "70px" : "30px",
        flex: "0 0 auto",
        background: "#dce7ef",
        "box-sizing": "border-box",
      },
    })),
  ];
}

async function workflow(page: Page, mode: string) {
  await toggling(page);
  await fitReflow(page);
  await decoratedPlacement(page);
  await fillCapture(page);
  await wrappingAndZoom(page);
  await ordinaryKinds(page);
  await importedConstraints(page);
  await layoutSwitches(page);
  await focusAndNoop(page);
  await minimumPanel(page, mode);
  await locks(page);
  await sourceOwnership(page);
  await draftProtection(page);
  await staleDraft(page);
  await rejection(page);
  await pendingHistory(page);
  await saveReopen(page, mode);
}

async function toggling(page: Page) {
  for (const direction of ["row", "column"]) {
    await reset(page, { "flex-direction": direction });
    const before = await native(page);
    await toggle(page, true);
    const after = await native(page);
    assertBoxes(after.children[1], before.children[1]);
    assert.ok(
      after.children[2][direction === "row" ? "x" : "y"] <
        before.children[2][direction === "row" ? "x" : "y"],
    );
    await page.getByRole("button", { name: "Code", exact: true }).click();
    assert.ok(
      (
        await page.getByRole("textbox", { name: "Object source", exact: true }).innerText()
      ).includes("var(--orc-absolute-position)"),
    );
    await page.getByRole("button", { name: "Code", exact: true }).click();
    await toggle(page, false);
    assertNative(await native(page), before);
  }
  checks.push(
    "Row and Column capture the child's local box, remove its slot, and return to the canonical sibling position with exact history and source",
  );
}

async function fitReflow(page: Page) {
  for (const direction of ["row", "column"]) {
    await reset(page, { "flex-direction": direction, width: "max-content", height: "max-content" });
    const before = await native(page);
    await toggle(page, true);
    const after = await native(page);
    assertBoxes(after.children[1], before.children[1]);
    assert.ok(after.width < before.width || after.height < before.height);
    if (direction === "row") {
      close(before.width - after.width, 70);
      close(before.height - after.height, 40);
    } else close(before.height - after.height, 80);
    await toggle(page, false);
    assertNative(await native(page), before);
  }
  checks.push(
    "Absolute children contribute neither a Flex slot nor Gap nor Fit width/height; native rejoining restores those contributions",
  );
}

async function decoratedPlacement(page: Page) {
  await reset(
    page,
    { width: "180px", height: "100px", overflow: "auto" },
    {
      margin: "2px 5px",
      padding: "3px",
      border: "2px solid black",
      "box-sizing": "content-box",
      position: "relative !important",
      left: "7px !important",
      top: "4px",
      transform: "translate(12px, 5px)",
    },
  );
  await page.locator('.canvas-world [data-orc-id="parent"]').evaluate((element) => {
    element.scrollLeft = 25;
  });
  const before = await native(page);
  await toggle(page, true);
  assertBoxes((await native(page)).children[1], before.children[1]);
  const style = (await session(page)).projects[0].document.nodes.middle.style;
  assert.ok(style.position.endsWith("!important"));
  assert.equal(style.transform, "translate(12px, 5px)");
  assert.equal(style.margin, "2px 5px");
  await toggle(page, false);
  checks.push(
    "Borders, padding, scrolling, content-box dimensions, margins, own translation and position priority preserve the captured parent-relative box",
  );
}

async function fillCapture(page: Page) {
  await reset(
    page,
    {},
    { width: "auto", height: "auto", flex: "1 1 0px", "align-self": "stretch" },
  );
  const before = await native(page);
  await toggle(page, true);
  assertBoxes((await native(page)).children[1], before.children[1]);
  await page.waitForFunction(
    () =>
      document.querySelector('input[aria-label="Width"]') instanceof HTMLInputElement &&
      document.querySelector<HTMLInputElement>('input[aria-label="Width"]')?.type === "number",
  );
  close(
    Number(await page.getByLabel("Width", { exact: true }).inputValue()),
    before.children[1].width,
  );
  await toggle(page, false);
  checks.push(
    "Leaving flow captures native main/cross Fill dimensions as Fixed without changing its siblings' authored sizing",
  );
}

async function wrappingAndZoom(page: Page) {
  await reset(page, { width: "175px", height: "max-content", "flex-wrap": "wrap" });
  const surface = page.getByRole("application", { name: "Canvas" });
  await surface.hover();
  await page.mouse.wheel(0, -140);
  await settled(page);
  const scale = await page
    .locator(".canvas-world")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  assert.ok(scale > 1);
  const before = await native(page);
  assert.ok(before.children[2].y > before.children[0].y);
  await toggle(page, true);
  const after = await native(page);
  assertBoxes(after.children[1], before.children[1]);
  close(after.children[0].y, after.children[2].y);
  assert.ok(after.height < before.height);
  await toggle(page, false);
  assertNative(await native(page), before);
  inputs.push({ trigger: "Wrapping and canvas zoom", scale, before, after });
  checks.push(
    "Zoomed wrapped Rows retain local coordinates while remaining participants reform native lines and Fit height",
  );
}

function ordinaryFixtures(): DesignNode[] {
  const base = {
    id: "middle",
    name: "middle",
    parentId: "parent",
    children: [],
    visible: true,
    locked: false,
    attributes: { title: "Retained middle" },
    style: { width: "60px", height: "30px", flex: "0 0 auto", "box-sizing": "border-box" },
  };
  return [
    { ...base, kind: "element", tag: "button" },
    { ...base, kind: "text", tag: "p", runs: [{ text: "Retained text", style: {} }] },
    {
      ...base,
      kind: "image",
      attributes: {
        ...base.attributes,
        alt: "Test image",
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='30'%3E%3Crect width='60' height='30' fill='blue'/%3E%3C/svg%3E",
      },
    },
    {
      ...base,
      kind: "svg",
      source:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect width="60" height="30" fill="blue"/></svg>',
    },
  ];
}

async function ordinaryKinds(page: Page) {
  await reset(page);
  for (const node of ordinaryFixtures()) {
    await replaceMiddle(page, node);
    const before = await native(page);
    await toggle(page, true);
    assertBoxes((await native(page)).children[1], before.children[1]);
    await toggle(page, false);
    assertNative(await native(page), before);
  }
  await replaceMiddle(page, fixture()[2]);
  checks.push(
    "Ordinary elements, rich Text, Images and SVG retain their identity/content/attributes while changing only placement CSS",
  );
}

async function importedConstraints(page: Page) {
  await reset(
    page,
    {},
    {
      position: "absolute",
      width: "auto",
      height: "auto",
      left: "20%",
      right: "25px",
      top: "10px",
      bottom: "20px",
    },
  );
  assert.equal(await control(page).isChecked(), true);
  const before = await native(page);
  await toggle(page, false);
  const style = (await session(page)).projects[0].document.nodes.middle.style;
  for (const property of ["left", "right", "top", "bottom"])
    assert.equal(style[property], undefined);
  close((await native(page)).children[1].width, before.children[1].width);
  close((await native(page)).children[1].height, before.children[1].height);
  checks.push(
    "Joining flow clears imported physical constraints and freezes their controlled dimensions without losing unrelated CSS",
  );
}

async function layoutSwitches(page: Page) {
  await reset(page);
  await toggle(page, true);
  const absolute = (await session(page)).projects[0].document.nodes.middle;
  for (const layout of ["Free", "Row"]) {
    await select(page, "parent");
    const response = page.waitForResponse(isCommand);
    await page.getByRole("button", { name: layout, exact: true }).click();
    assert.equal((await response).status(), 200);
    await settled(page);
    assert.deepEqual((await session(page)).projects[0].document.nodes.middle, absolute);
    await select(page, "middle");
    if (layout === "Free") assert.equal(await control(page).count(), 0);
    else assert.equal(await control(page).isChecked(), true);
  }
  await toggle(page, false);
  checks.push(
    "Explicit participation survives parent Free/Row switches without changing the child and still rejoins its original slot",
  );
}

async function minimumPanel(page: Page, mode: string) {
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await control(page).focus();
  const measured = await control(page).evaluate((input) => {
    const label = input.closest("label");
    const panel = input.closest(".properties-panel");
    if (!label || !panel) throw new Error("Missing participation controls");
    return {
      panelWidth: panel.getBoundingClientRect().width,
      overflow: panel.scrollWidth > panel.clientWidth,
      target: {
        width: label.getBoundingClientRect().width,
        height: label.getBoundingClientRect().height,
      },
      focusVisible: input.matches(":focus-visible"),
      outline: getComputedStyle(input).outline,
    };
  });
  assert.equal(measured.panelWidth, 240);
  assert.equal(measured.overflow, false);
  assert.ok(measured.target.width >= 44 && measured.target.height >= 44);
  assert.equal(measured.focusVisible, true);
  await page.screenshot({ path: artifact(`${mode}-minimum.png`), fullPage: true });
  inputs.push({ mode, minimumPanel: measured });
  checks.push(
    `${mode}: minimum-width Properties retains the labeled 44px target and visible keyboard focus without overflow`,
  );
}

async function replaceMiddle(page: Page, node: DesignNode) {
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "delete", ids: ["middle"] },
      { kind: "insert", nodes: [node] },
      { kind: "reorder", id: "middle", parentId: "parent", index: 1 },
    ],
  });
  await select(page, "middle");
}

async function focusAndNoop(page: Page) {
  await reset(page);
  const before = (await session(page)).projects[0].document;
  await control(page).focus();
  const response = page.waitForResponse(isCommand);
  await control(page).press("Space");
  assert.equal((await response).status(), 200);
  await settled(page);
  assertChildOnly(before, (await session(page)).projects[0].document);
  assert.equal(
    await control(page).evaluate(
      (input) => document.activeElement === input && input.matches(":focus-visible"),
    ),
    true,
  );
  await history(page, "undo");
  const state = await session(page);
  assert.equal(state.projects[0].canRedo, true);
  await noEdit(page, () => control(page).setChecked(false));
  assert.deepEqual(await session(page), state);
  checks.push(
    "Keyboard Space activates the visible checkbox and restores focus; an unchanged choice preserves Redo without a command",
  );
}

async function locks(page: Page) {
  await reset(page);
  for (const id of ["middle", "parent"]) {
    await accepted(page, { kind: "lock", id, locked: true });
    assert.equal(await control(page).isDisabled(), true);
    const before = await session(page);
    const document = before.projects[0].document;
    const response = await page.request.post("/api/commands", {
      data: {
        projectId: document.id,
        commandId: crypto.randomUUID(),
        expectedRevision: document.revision,
        mutation: {
          kind: "batch",
          mutations: [{ kind: "style", id: "middle", values: { position: "absolute" } }],
        },
      },
    });
    assert.equal(response.status(), 400);
    assert.deepEqual(await session(page), before);
    await accepted(page, { kind: "lock", id, locked: false });
  }
  await accepted(page, { kind: "lock", id: "last", locked: true });
  await toggle(page, true);
  await toggle(page, false);
  await accepted(page, { kind: "lock", id: "last", locked: false });
  checks.push(
    "Own and ancestor locks disable and reject edits atomically; a locked sibling can reflow without an authored edit",
  );
}

async function sourceOwnership(page: Page) {
  const cases: DesignNode["style"][] = [
    { position: "var(--place)", "--place": "relative" },
    { left: "var(--offset)", "--offset": "7px", position: "relative" },
    { position: "sticky" },
  ];
  for (const style of cases) {
    await reset(page, {}, style);
    assert.equal(await control(page).isDisabled(), true);
    await page.getByText("Position controlled by source. Edit in Code.", { exact: true }).waitFor();
  }
  await reset(page);
  await select(page, "parent");
  assert.equal(await control(page).count(), 0);
  await accepted(page, { kind: "style", id: "parent", values: { display: "block" } });
  await select(page, "middle");
  assert.equal(await control(page).count(), 0);
  await reset(page, {}, { transform: "rotate(20deg)" });
  await noEdit(page, async () => {
    await control(page).click();
    await page.getByRole("alert").filter({ hasText: "transformed" }).waitFor();
  });
  await reset(page, { transform: "scale(1.2)" });
  await noEdit(page, async () => {
    await control(page).click();
    await page.getByRole("alert").filter({ hasText: "transformed" }).waitFor();
  });
  await reset(page);
  checks.push(
    "Workspace/Free relationships hide participation; source position/offsets remain read-only and unsupported transforms reject without commands",
  );
}

async function draftProtection(page: Page) {
  await makeDraft(page, "participation draft");
  const before = await session(page);
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = await source.innerText();
  await control(page).click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await settled(page);
  assert.deepEqual(await session(page), before);
  assert.equal(await source.innerText(), draft);
  await control(page).click();
  const response = page.waitForResponse(isCommand);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.equal((await response).status(), 200);
  await settled(page);
  assertChildOnly(before.projects[0].document, (await session(page)).projects[0].document);
  assert.equal(await control(page).isChecked(), true);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Draft Cancel retains the draft and applied state; Discard allows one selected-child participation command",
  );
}

async function staleDraft(page: Page) {
  await reset(page);
  await makeDraft(page, "stale participation draft");
  await control(page).click();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await accepted(page, { kind: "style", id: "parent", values: { width: "350px" } });
  await noEdit(page, async () => {
    await dialog.getByRole("button", { name: "Discard", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "The layout changed. Try again." }).waitFor();
  });
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "A newer applied revision during draft preparation rejects the stale conversion and preserves the newer geometry/history",
  );
}

async function rejection(page: Page) {
  await reset(page);
  await page.route("**/api/commands", (route) =>
    route.fulfill({ status: 409, json: { error: "Participation rejection control" } }),
  );
  const before = await session(page);
  const boxes = await native(page);
  try {
    await control(page).click();
    await page.getByRole("alert").filter({ hasText: "Participation rejection control" }).waitFor();
    await settled(page);
    assert.deepEqual(await session(page), before);
    assertNative(await native(page), boxes);
    assert.equal(await control(page).isEnabled(), true);
    assert.equal(await control(page).isChecked(), false);
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
  await toggle(page, true);
  await toggle(page, false);
  checks.push(
    "Rejected commands restore preview, checkbox, geometry and the exact applied document/history",
  );
}

async function holdCommand(page: Page) {
  let release = () => {};
  let received = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
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
  return { release, ready, requests };
}

async function pendingHistory(page: Page) {
  await reset(page);
  const { release, ready, requests } = await holdCommand(page);
  const before = (await session(page)).projects[0].document;
  try {
    await control(page).click();
    await ready;
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    release();
    await page.waitForFunction(
      async (revision) =>
        (await (await fetch("/api/session")).json()).projects[0].document.revision >= revision + 2,
      before.revision,
    );
    await settled(page);
    assertContent((await session(page)).projects[0].document, before);
    assert.equal(requests.length, 1);
    assert.equal(
      await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
      "Canvas",
    );
    inputs.push({ trigger: "Pending participation and immediate Undo", requests });
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    "Immediate Undo waits for the pending acknowledgement and restores the complete prior state with one command",
  );
}

async function saveReopen(page: Page, mode: string) {
  await reset(page);
  await toggle(page, true);
  const boxes = await native(page);
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill(`Participation ${mode}`);
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
  await select(page, "middle");
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo || reopened.canRedo, false);
  assert.equal(await control(page).isChecked(), true);
  assertNative(await native(page), boxes);
  await toggle(page, false);
  inputs.push({ mode, saved: saved.document, reopened: reopened.document, native: boxes });
  checks.push(
    `${mode}: UI save/reopen retains participation, source CSS, identities/order and native layout with fresh history`,
  );
}

async function makeDraft(page: Page, comment: string) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = `${await source.innerText()}\n<!-- ${comment} -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
}

async function toggle(page: Page, absolute: boolean) {
  const before = (await session(page)).projects[0].document;
  assert.equal(await control(page).isChecked(), !absolute);
  const response = page.waitForResponse(isCommand);
  await control(page).click();
  const result = await response;
  assert.equal(result.status(), 200, await result.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assertChildOnly(before, after);
  assert.equal(await control(page).isChecked(), absolute);
  assert.equal(
    await control(page).isEnabled(),
    true,
    "Generated longhands remain editable after CSSOM synthesizes their inset shorthand",
  );
  const request = result.request().postDataJSON();
  assert.equal(request.mutation.kind, "batch");
  for (const change of request.mutation.mutations) assert.equal(change.id, "middle");
  const boxes = await native(page);
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
  assertNative(await native(page), boxes);
  inputs.push({ trigger: "Absolute Position", absolute, request, before, after, native: boxes });
}

async function reset(
  page: Page,
  parent: DesignNode["style"] = {},
  child: DesignNode["style"] = {},
) {
  const document = (await session(page)).projects[0].document;
  const nodes = fixture();
  await accepted(page, {
    kind: "batch",
    mutations: nodes.flatMap((node) => [
      { kind: "style", id: node.id, values: {}, unset: Object.keys(document.nodes[node.id].style) },
      {
        kind: "style",
        id: node.id,
        values: {
          ...node.style,
          ...(node.id === "parent" ? parent : node.id === "middle" ? child : {}),
        },
      },
    ]),
  });
  await select(page, "middle");
}

async function noEdit(page: Page, action: () => Promise<void>) {
  const before = await session(page);
  const boxes = await native(page);
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
    assertNative(await native(page), boxes);
    assert.deepEqual(requests, []);
  } finally {
    page.off("request", record);
    inputs.push({ trigger: "No edit", requests });
  }
}

function native(page: Page) {
  return page.locator('.canvas-world [data-orc-id="parent"]').evaluate((parent) => {
    const world = parent.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const origin = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    return {
      width: origin.width / scale,
      height: origin.height / scale,
      children: [...parent.children].map((child) => {
        const box = child.getBoundingClientRect();
        return {
          id: child.getAttribute("data-orc-id"),
          x: (box.x - origin.x) / scale - parseFloat(style.borderLeftWidth) + parent.scrollLeft,
          y: (box.y - origin.y) / scale - parseFloat(style.borderTopWidth) + parent.scrollTop,
          width: box.width / scale,
          height: box.height / scale,
        };
      }),
    };
  });
}

function assertBoxes(
  actual: ReturnType<Awaited<ReturnType<typeof native>>["children"]["at"]>,
  expected: typeof actual,
) {
  assert.ok(actual && expected);
  assert.equal(actual.id, expected.id);
  for (const property of ["x", "y", "width", "height"] as const)
    close(actual[property], expected[property]);
}

function assertNative(actual: Awaited<ReturnType<typeof native>>, expected: typeof actual) {
  close(actual.width, expected.width);
  close(actual.height, expected.height);
  assert.equal(actual.children.length, expected.children.length);
  actual.children.forEach((child, index) => assertBoxes(child, expected.children[index]));
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual({ ...actual, revision: 0 }, { ...expected, revision: 0 });
}

function assertChildOnly(before: DesignDocument, after: DesignDocument) {
  assert.equal(after.revision, before.revision + 1);
  const expected = structuredClone(after);
  expected.nodes.middle.style = before.nodes.middle.style;
  assertContent(expected, before);
  const allowed = [
    "position",
    "--orc-absolute-position",
    "left",
    "right",
    "top",
    "bottom",
    "inset",
    "inset-inline",
    "inset-block",
    "inset-inline-start",
    "inset-inline-end",
    "inset-block-start",
    "inset-block-end",
    "width",
    "height",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "align-self",
  ];
  const unrelated = (node: DesignNode) =>
    Object.fromEntries(
      Object.entries(node.style).filter(([property]) => !allowed.includes(property)),
    );
  assert.deepEqual(unrelated(after.nodes.middle), unrelated(before.nodes.middle));
}

async function history(page: Page, direction: "undo" | "redo") {
  const response = page.waitForResponse(
    (result) =>
      new URL(result.url()).pathname === "/api/history" && result.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  assert.equal((await response).status(), 200);
  await settled(page);
}

function isCommand(response: Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}

function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.1, `Expected ${expected}, got ${actual}`);
}

async function select(page: Page, id: string) {
  await settled(page);
  const node = (await session(page)).projects[0].document.nodes[id];
  if (node.parentId)
    await page.locator(".layer-name").getByText(node.parentId, { exact: true }).waitFor();
  if (
    node.parentId &&
    (await page.getByRole("button", { name: `Expand ${node.parentId}`, exact: true }).count())
  )
    await page.getByRole("button", { name: `Expand ${node.parentId}`, exact: true }).click();
  await page.locator(".layer-name").getByText(id, { exact: true }).click();
  await settled(page);
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

function control(page: Page) {
  return page.getByRole("checkbox", { name: "Absolute Position", exact: true });
}

function artifact(suffix: string) {
  return join(artifacts, `participation-${phase}-${suffix}`);
}

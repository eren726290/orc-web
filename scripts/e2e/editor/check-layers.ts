import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import type { DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { nodeSource } from "../../../shared/source/html-source";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const base = {
  parentId: null,
  children: [],
  visible: true,
  locked: false,
  attributes: {},
  style: {},
};
const text = {
  ...base,
  kind: "text",
  tag: "h2",
  name: "Heading",
  runs: [{ text: "Visible words", style: {} }],
} satisfies Omit<Extract<DesignNode, { kind: "text" }>, "id">;
const nodes: DesignNode[] = [
  {
    ...base,
    id: "frame",
    name: "Landing",
    kind: "frame",
    clipContent: true,
    mode: "inherit",
    children: ["group"],
    style: { position: "absolute", left: "40px", top: "60px", width: "400px", height: "260px" },
  },
  {
    ...base,
    id: "group",
    name: "Group",
    kind: "element",
    tag: "section",
    parentId: "frame",
    children: ["first", "second"],
  },
  { ...text, id: "first", parentId: "group", attributes: { id: "first-heading" } },
  { ...text, id: "second", parentId: "group", attributes: { id: "second-heading" } },
  {
    ...text,
    id: "loose",
    name: "Loose note",
    tag: "p",
    style: { position: "absolute", left: "480px", top: "80px" },
  },
  {
    ...base,
    id: "image",
    name: "Image",
    kind: "image",
    attributes: {
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='20' height='20' fill='red'/%3E%3C/svg%3E",
      alt: "Sample",
    },
    style: { position: "absolute", left: "480px", top: "150px" },
  },
  {
    ...base,
    id: "svg",
    name: "SVG",
    kind: "svg",
    source: '<svg viewBox="0 0 20 20"><rect width="20" height="20"/></svg>',
    style: { position: "absolute", left: "520px", top: "150px", width: "20px", height: "20px" },
  },
];

const overflowNodes: DesignNode[] = Array.from({ length: 30 }, (_, index) => ({
  ...base,
  id: `overflow-${index}`,
  name: `Extra layer ${index}`,
  kind: "element",
  tag: "div",
  visible: false,
}));

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_LAYERS_EVIDENCE ?? "verification";
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "layers-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
const inputs: string[] = [];
let failure: string | null = null;
try {
  await verifyMode("development");
  if (process.env.ORC_LAYERS_MODES !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeEvidence();
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("ordinary layer naming passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await insertExamples(page);
    await page.getByRole("button", { name: "Expand Landing", exact: true }).click();
    await page.getByRole("button", { name: "Expand Group", exact: true }).click();
    await renameWorkflow(page, mode);
    await sameSelectedReveal(page);
    await cancellationWorkflow(page);
    await lockWorkflow(page);
    await draftWorkflow(page);
    await saveReopen(page, mode);
    assert.deepEqual(errors, [], "No browser runtime errors");
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(
      `${mode}: duplicate identity, input focus, no-ops, locks, drafts, history, save/reopen`,
    );
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
  }
}

async function insertExamples(page: Page) {
  assert.equal(
    (await command(page, { kind: "insert", nodes: [...nodes, ...overflowNodes] })).status(),
    200,
  );
  await layer(page, "Landing").waitFor();
}

async function renameWorkflow(page: Page, mode: string) {
  const before = (await session(page)).projects[0].document;
  await layer(page, "Heading").nth(1).dblclick();
  const input = page.getByRole("textbox", { name: "Layer name", exact: true });
  await input.waitFor({ timeout: 3000 });
  assert.equal(await input.inputValue(), "Heading");
  assert.ok(await input.evaluate((element) => element === document.activeElement));
  await page.screenshot({ path: artifact(`${mode}-editing.png`), fullPage: true });
  await input.press("Control+a");
  await input.press("Delete");
  await input.press("ArrowLeft");
  await input.press("Control+z");
  assert.deepEqual(
    (await session(page)).projects[0].document,
    before,
    "Typing keys cannot edit canvas or document history",
  );
  await input.fill("Page title");
  inputs.push("second -> Page title, Enter");
  await input.press("Enter");
  await layer(page, "Page title").waitFor();
  const after = (await session(page)).projects[0].document;
  assert.deepEqual(after, {
    ...before,
    revision: before.revision + 1,
    nodes: { ...before.nodes, second: { ...before.nodes.second, name: "Page title" } },
  });
  await verifyRenamedTarget(page);
  await history(page, "Control+z", "Heading", 2);
  assert.deepEqual(
    (await session(page)).projects[0].document.nodes,
    before.nodes,
    "One Undo restores the one label edit",
  );
  await history(page, "Control+Shift+z", "Page title");
  await keyboardRename(page, "Page title", "Second title");
  await renameOtherKinds(page);
}

async function verifyRenamedTarget(page: Page) {
  assert.equal(await page.locator(".property-title strong").innerText(), "Page title");
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="second"]').innerText(),
    "Visible words",
  );
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="second"]').getAttribute("id"),
    "second-heading",
  );
  assert.ok(
    await layer(page, "Page title").evaluate((element) => element === document.activeElement),
    "Enter returns keyboard focus to the layer",
  );
}

async function keyboardRename(page: Page, oldName: string, name: string) {
  const button = page.getByRole("button", { name: `Rename ${oldName}`, exact: true });
  await layer(page, oldName).focus();
  await page.keyboard.press("Tab");
  assert.ok(
    await button.evaluate((element) => element === document.activeElement),
    "Rename follows the row name in keyboard focus order",
  );
  await page.keyboard.press("Enter");
  const input = page.getByRole("textbox", { name: "Layer name", exact: true });
  await input.waitFor();
  await input.fill(name);
  inputs.push(`${oldName} -> ${name}, blur`);
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await layer(page, name).waitFor();
}

async function renameOtherKinds(page: Page) {
  for (const [oldName, name] of [
    ["Landing", "Page frame"],
    ["Group", "Content group"],
    ["Image", "Product image"],
    ["SVG", "Brand mark"],
  ]) {
    await layer(page, oldName).dblclick();
    const input = page.getByRole("textbox", { name: "Layer name", exact: true });
    await input.fill(name);
    await input.press("Enter");
    await layer(page, name).waitFor();
  }
  await layer(page, "Second title").click();
  const before = await session(page);
  await page.getByRole("button", { name: "Collapse Content group", exact: true }).click();
  assert.equal(
    await page.locator(".property-title strong").innerText(),
    "Second title",
    "Collapsing keeps the selected descendant",
  );
  assert.deepEqual(await session(page), before, "Disclosure is view state");
  await page.getByRole("button", { name: "Expand Content group", exact: true }).click();
}

async function sameSelectedReveal(page: Page) {
  await layer(page, "Second title").click();
  const before = await session(page);
  for (const collapse of [true, false, true]) {
    if (collapse) {
      await page.getByRole("button", { name: "Collapse Content group", exact: true }).click();
      await layer(page, "Second title").waitFor({ state: "hidden" });
    }
    assert.equal(await page.locator(".property-title strong").innerText(), "Second title");
    await page.locator(".left-panel").hover();
    await page.mouse.wheel(0, 2000);
    await page.waitForFunction(() => (document.querySelector(".left-panel")?.scrollTop ?? 0) > 500);
    await page.locator('.canvas-world [data-orc-id="second"]').click();
    await layer(page, "Second title").waitFor({ timeout: 3000 });
    await page.waitForFunction(() => {
      const panel = document.querySelector(".left-panel")?.getBoundingClientRect();
      const row = document.querySelector(".layer-row.selected")?.getBoundingClientRect();
      return panel && row && row.top >= panel.top && row.bottom <= panel.bottom;
    });
    assert.equal(await page.locator(".layer-row.selected").count(), 1);
    assert.equal(
      await page.locator(".layer-row.selected .layer-name > span:last-child").innerText(),
      "Second title",
    );
    assert.deepEqual(await session(page), before, "Canvas reveal is view state");
    inputs.push(`Reselect second: ${collapse ? "collapsed" : "expanded"} ancestor, scrolled away`);
  }
  checks.push("Repeated canvas selection reveals collapsed or offscreen Layers rows without edits");
}

async function cancellationWorkflow(page: Page) {
  await layer(page, "Second title").click();
  const before = await session(page);
  for (const [value, key] of [
    ["Cancelled", "Escape"],
    ["", "Enter"],
    ["   ", "Tab"],
    ["Second title", "Enter"],
  ]) {
    await layer(page, "Second title").dblclick();
    const input = page.getByRole("textbox", { name: "Layer name", exact: true });
    await input.fill(value);
    inputs.push(`no-op ${JSON.stringify(value)} via ${key}`);
    await input.press(key);
    await input.waitFor({ state: "hidden" });
    assert.deepEqual(
      await session(page),
      before,
      "Cancellation and empty/unchanged names create no revision/history",
    );
    assert.equal(await page.getByRole("dialog").count(), 0);
  }
}

async function lockWorkflow(page: Page) {
  await page.getByRole("button", { name: "Lock Heading", exact: true }).click();
  await page.getByRole("button", { name: "Unlock Heading", exact: true }).waitFor();
  await lockedRename(page, "Heading");
  await page.getByRole("button", { name: "Lock Content group", exact: true }).click();
  await page.getByRole("button", { name: "Unlock Content group", exact: true }).waitFor();
  await lockedRename(page, "Second title");
  const inherited = page.getByRole("button", { name: "Rename Second title", exact: true });
  assert.match((await inherited.getAttribute("title")) ?? "", /parent|ancestor/iu);
  await page.getByRole("button", { name: "Unlock Content group", exact: true }).click();
  await page.getByRole("button", { name: "Lock Content group", exact: true }).waitFor();
  assert.ok(
    await page.getByRole("button", { name: "Rename Heading", exact: true }).isDisabled(),
    "Own child lock survives unlocking parent",
  );
  await page.getByRole("button", { name: "Unlock Heading", exact: true }).click();
  await page.getByRole("button", { name: "Lock Heading", exact: true }).waitFor();
}

async function lockedRename(page: Page, name: string) {
  const before = await session(page);
  await layer(page, name).dblclick();
  assert.equal(await page.getByRole("textbox", { name: "Layer name", exact: true }).count(), 0);
  assert.ok(await page.getByRole("button", { name: `Rename ${name}`, exact: true }).isDisabled());
  assert.deepEqual(await session(page), before);
  assert.equal(await page.locator(".property-title strong").innerText(), name);
}

async function draftWorkflow(page: Page) {
  await layer(page, "Second title").click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source" });
  await source.press("Control+a");
  const draft = nodeSource((await session(page)).projects[0].document, "second").replace(
    "Visible words",
    "Unapplied words",
  );
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  await layer(page, "Loose note").dblclick();
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await page.locator(".property-title strong").innerText(), "Second title");
  assert.equal(await source.innerText(), draft);
  assert.equal(await page.getByRole("textbox", { name: "Layer name", exact: true }).count(), 0);
  assert.deepEqual(await session(page), before);
  await layer(page, "Second title").dblclick();
  const input = page.getByRole("textbox", { name: "Layer name", exact: true });
  await input.fill("Draft cancelled name");
  await input.press("Enter");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await layer(page, "Second title").waitFor();
  assert.equal(await source.innerText(), draft);
  assert.deepEqual(await session(page), before);
  await layer(page, "Second title").dblclick();
  await input.fill("Final title");
  await input.press("Enter");
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await layer(page, "Final title").waitFor();
  assert.equal(
    await source.innerText(),
    nodeSource((await session(page)).projects[0].document, "second"),
  );
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  await draftSelectionDiscard(page);
}

async function draftSelectionDiscard(page: Page) {
  const source = page.getByRole("textbox", { name: "Object source" });
  await source.press("Control+a");
  await page.keyboard.insertText("<h2>Unapplied again</h2>");
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Rename Loose note", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Discard unapplied changes?" })
    .getByRole("button", { name: "Discard", exact: true })
    .click();
  const input = page.getByRole("textbox", { name: "Layer name", exact: true });
  await input.fill("Saved note");
  await input.press("Enter");
  await layer(page, "Saved note").waitFor();
  assert.equal(await page.locator(".property-title strong").innerText(), "Saved note");
}

async function saveReopen(page: Page, mode: string) {
  const project = (await session(page)).projects[0];
  const result = await page.request.post("/api/projects/save", {
    data: { projectId: project.document.id, parent: join(process.cwd(), temporary), name: mode },
  });
  assert.equal(result.status(), 200);
  const saved = parseSession(await result.json()).projects[0];
  assert.equal(
    (
      await page.request.post("/api/projects/close", {
        data: { projectId: project.document.id, discard: false },
      })
    ).status(),
    200,
  );
  await layer(page, "Page frame").waitFor({ state: "hidden" });
  assert.equal(
    (await page.request.post("/api/projects/open", { data: { path: saved.path } })).status(),
    200,
  );
  const restored = (await session(page)).projects[0].document;
  assert.deepEqual(restored, saved.document);
  await layer(page, "Page frame").waitFor();
  await page.getByRole("button", { name: "Expand Page frame", exact: true }).click();
  await page.getByRole("button", { name: "Expand Content group", exact: true }).click();
  await layer(page, "Final title").click();
  assert.equal(await page.locator(".property-title strong").innerText(), "Final title");
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="second"]').getAttribute("id"),
    "second-heading",
  );
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="second"]').innerText(),
    "Visible words",
  );
}

async function history(page: Page, key: string, name: string, count = 1) {
  await page.getByRole("application", { name: "Canvas" }).press(key);
  await page.waitForFunction(
    ({ name, count }) =>
      [...document.querySelectorAll(".layer-name span:last-child")].filter(
        (element) => element.textContent === name,
      ).length === count,
    { name, count },
  );
}

function layer(page: Page, name: string) {
  return page.locator("button.layer-name").filter({ has: page.getByText(name, { exact: true }) });
}

async function command(page: Page, mutation: unknown) {
  const project = (await session(page)).projects[0];
  return page.request.post("/api/commands", {
    data: {
      projectId: project.document.id,
      commandId: crypto.randomUUID(),
      expectedRevision: project.document.revision,
      mutation,
    },
  });
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function artifact(suffix: string) {
  return join(artifacts, `layers-${phase}-${suffix}`);
}

async function writeEvidence() {
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...sourceEvidence(), channel, browserVersion: browser.version(), command: `bun scripts/e2e/editor/check-layers.ts ${channel}`, phase, checks, inputs, failure }, null, 2)}\n`,
  );
}

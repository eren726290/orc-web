import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import type { DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const base = { visible: true, locked: false, attributes: {}, style: {} };
const phase = process.env.ORC_PREVIEW_EVIDENCE ?? "verification";
await mkdir("artifacts/editor", { recursive: true });
const browser = await chromium.launch();
const checks: string[] = [];
let failure: string | null = null;
try {
  await verifyMode("development");
  if (process.env.ORC_PREVIEW_MODES !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...sourceEvidence(), command: "bun scripts/e2e/editor/check-preview.ts", browserVersion: browser.version(), checks, fixture: fixture(), failure }, null, 2)}\n`,
  );
}
process.stdout.write("ordinary frame preview passed\n");

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
    await seed(page);
    await eligibility(page);
    await editControls(page);
    await nativePreview(page, mode);
    await nestedPreview(page);
    await draftPreview(page);
    await ancestorLayout(page);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`) });
    checks.push(
      `${mode}: frame eligibility, native controls and scroll, no editor commands, exact geometry, state reset, Edit restoration, nested frame context, unchanged document/history`,
    );
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`) });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
  }
}

function frame(
  id: string,
  parentId: string | null,
  children: string[],
  style: DesignNode["style"],
): DesignNode {
  return {
    ...base,
    id,
    parentId,
    children,
    name: id,
    kind: "frame",
    clipContent: false,
    mode: "inherit",
    style,
  };
}

function fixture(): DesignNode[] {
  return [
    {
      ...base,
      id: "form",
      name: "Preview form",
      parentId: "Preview frame",
      children: ["button", "link"],
      kind: "element",
      tag: "form",
    },
    ...frames(),
    ...buttonAndScroll(),
    ...controls(),
    ...extraControls(),
    ...floatLayout(),
    {
      ...base,
      id: "link",
      name: "Preview link",
      parentId: "form",
      children: [],
      kind: "text",
      tag: "a",
      attributes: { href: "/?preview-navigation=1" },
      runs: [{ text: "Native link", style: {} }],
    },
  ];
}

function frames(): DesignNode[] {
  return [
    frame("Preview frame", null, ["form", "scroll", "Nested frame"], {
      position: "absolute",
      left: "40px",
      top: "40px",
      width: "440px",
      height: "450px",
      padding: "20px",
      background: "#fcfcf9",
      display: "flex",
      "flex-direction": "column",
      gap: "12px",
    }),
    frame("Other frame", null, [], {
      position: "absolute",
      left: "520px",
      top: "40px",
      width: "200px",
      height: "220px",
      background: "#ccdddd",
    }),
    frame("Nested frame", "Preview frame", ["input", "check", "select", "textarea", "disabled"], {
      width: "50%",
      height: "120px",
      "flex-shrink": "0",
      background: "#efefe4",
      display: "flex",
      "flex-direction": "column",
    }),
  ];
}

function floatLayout(): DesignNode[] {
  return [
    frame("Float root", null, ["Clipping ancestor"], {
      position: "absolute",
      left: "800px",
      top: "40px",
      width: "320px",
      height: "auto",
    }),
    {
      ...nativeElement("Clipping ancestor", "div", {}, ["Float sibling", "Float frame"]),
      parentId: "Float root",
      style: { position: "relative", overflow: "hidden" },
    },
    {
      ...nativeElement("Float sibling", "div", {}),
      parentId: "Clipping ancestor",
      style: { float: "left", width: "40px", height: "300px" },
    },
    frame("Float frame", "Clipping ancestor", [], {
      position: "absolute",
      bottom: "0",
      width: "100px",
      height: "100px",
      background: "#ddddcc",
    }),
  ];
}

function nativeElement(
  id: string,
  tag: string,
  attributes: DesignNode["attributes"],
  children: string[] = [],
): DesignNode {
  return {
    ...base,
    id,
    name: id,
    tag,
    kind: "element",
    parentId: "Nested frame",
    children,
    attributes,
  };
}
function nativeOption(id: string, selected: boolean): DesignNode {
  return {
    ...base,
    id,
    name: id,
    tag: "option",
    kind: "text",
    parentId: "select",
    children: [],
    attributes: { value: id, ...(selected ? { selected: "" } : {}) },
    runs: [{ text: id, style: {} }],
  };
}

function extraControls(): DesignNode[] {
  return [
    nativeElement("select", "select", { "aria-label": "Preview choice" }, ["alpha", "beta"]),
    nativeOption("alpha", false),
    nativeOption("beta", true),
    {
      ...base,
      id: "textarea",
      name: "textarea",
      kind: "text",
      tag: "textarea",
      parentId: "Nested frame",
      children: [],
      attributes: { "aria-label": "Preview note" },
      runs: [{ text: "Saved note", style: {} }],
    },
    nativeElement("disabled", "input", {
      disabled: "",
      value: "Disabled default",
      "aria-label": "Preview disabled input",
    }),
  ];
}

function buttonAndScroll(): DesignNode[] {
  return [
    {
      ...base,
      id: "button",
      name: "Live button",
      parentId: "form",
      children: [],
      kind: "text",
      tag: "button",
      runs: [{ text: "Native button", style: {} }],
    },
    {
      ...base,
      id: "scroll",
      name: "Scrollable content",
      parentId: "Preview frame",
      children: ["tall"],
      kind: "element",
      tag: "div",
      style: { height: "100px", "flex-shrink": "0", overflow: "auto" },
    },
    {
      ...base,
      id: "tall",
      name: "Tall content",
      parentId: "scroll",
      children: [],
      kind: "text",
      tag: "p",
      runs: [{ text: "Scroll this live content", style: {} }],
      style: { height: "800px", margin: "0" },
    },
  ];
}

function controls(): DesignNode[] {
  return [
    {
      ...base,
      id: "input",
      name: "Saved input",
      parentId: "Nested frame",
      children: [],
      kind: "element",
      tag: "input",
      attributes: { value: "Saved default", "aria-label": "Preview input" },
    },
    {
      ...base,
      id: "check",
      name: "Saved checkbox",
      parentId: "Nested frame",
      children: [],
      kind: "element",
      tag: "input",
      attributes: { type: "checkbox", checked: "", "aria-label": "Preview checkbox" },
    },
  ];
}

async function seed(page: Page) {
  const project = (await session(page)).projects[0];
  assert.equal(
    (
      await page.request.post("/api/commands", {
        data: {
          projectId: project.document.id,
          commandId: crypto.randomUUID(),
          expectedRevision: project.document.revision,
          mutation: { kind: "insert", nodes: fixture() },
        },
      })
    ).status(),
    200,
  );
  await page.getByRole("button", { name: "Preview frame", exact: true }).waitFor();
}

async function eligibility(page: Page) {
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page
    .locator(".workspace-notice")
    .filter({ hasText: "Select one frame to preview" })
    .waitFor();
  await page.getByRole("button", { name: "Preview frame", exact: true }).click();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor({ timeout: 3000 });
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  await page
    .getByRole("button", { name: "Other frame", exact: true })
    .click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Exit Preview", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Preview frame", exact: true }).click();
}

async function nativePreview(page: Page, mode: string) {
  const canvas = page.getByRole("application", { name: "Canvas" });
  const expand = page.getByRole("button", { name: "Expand Preview frame" });
  if (await expand.count()) await expand.click();
  await canvas.getByRole("button", { name: "Native button" }).click();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Exit Preview", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Preview frame", exact: true }).click();
  const initial = await page.locator(".canvas-world").getAttribute("style");
  await canvas.hover({ position: { x: 600, y: 600 } });
  await page.mouse.wheel(0, -100);
  await page.waitForFunction(
    (style) => document.querySelector(".canvas-world")?.getAttribute("style") !== style,
    initial,
  );
  const edit = await geometry(page, ".canvas-world");
  const transform = await page.locator(".canvas-world").getAttribute("style");
  const before = await session(page);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const preview = page.getByRole("region", { name: "Frame Preview" });
  await preview.waitFor();
  assert.equal(await page.locator(".selection-outline").count(), 0);
  assert.equal(await page.locator('.preview-world [data-orc-id="Other frame"]').isVisible(), false);
  const rendered = await geometry(page, ".preview-world");
  assert.deepEqual(
    rendered,
    edit,
    "Preview retains native width/height, including nested percentage sizing",
  );
  await previewInteractions(page);
  await previewNavigation(page);
  await page.screenshot({ path: artifact(`${mode}-active.png`) });
  assert.deepEqual(await session(page), before);
  await previewRestore(page, transform);
  assert.deepEqual(await session(page), before);
}

async function editControls(page: Page) {
  const before = await session(page);
  const checkbox = page.getByRole("application", { name: "Canvas" }).getByRole("checkbox");
  await checkbox.click();
  assert.equal(
    await checkbox.isChecked(),
    true,
    "Edit selects a native control without activating it",
  );
  await page.getByRole("button", { name: "Preview frame", exact: true }).click();
  assert.deepEqual(await session(page), before);
}

async function previewInteractions(page: Page) {
  const preview = page.getByRole("region", { name: "Frame Preview" });
  await preview.getByRole("textbox", { name: "Preview input" }).fill("Temporary preview input");
  await preview.getByRole("checkbox", { name: "Preview checkbox" }).uncheck();
  assert.equal(
    await preview.getByRole("combobox", { name: "Preview choice" }).inputValue(),
    "beta",
  );
  await preview.getByRole("combobox", { name: "Preview choice" }).selectOption("alpha");
  await preview.getByRole("textbox", { name: "Preview note" }).fill("Temporary note");
  assert.equal(
    await preview.getByRole("textbox", { name: "Preview disabled input" }).isDisabled(),
    true,
  );
  const url = page.url();
  await preview.getByRole("button", { name: "Native button" }).click();
  await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor({ timeout: 3000 });
  assert.equal(page.url(), url, "A native form does not navigate away from the editor");
  await preview.getByRole("button", { name: "Native button" }).focus();
  await page.keyboard.press("Delete");
  await page.keyboard.press("Control+z");
  await page.keyboard.press("t");
  const scroll = preview.locator('[data-orc-id="scroll"]');
  await scroll.hover();
  await page.mouse.wheel(0, 250);
  await page.waitForFunction(
    () => (document.querySelector('.preview-world [data-orc-id="scroll"]')?.scrollTop ?? 0) > 0,
  );
  await page.mouse.wheel(0, 2000);
}

async function previewRestore(page: Page, transform: string | null) {
  const preview = page.getByRole("region", { name: "Frame Preview" });
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).waitFor();
  assert.equal(await page.locator(".canvas-world").getAttribute("style"), transform);
  assert.equal(await page.locator(".layer-row.selected .layer-name").innerText(), "Preview frame");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(
    await preview.getByRole("textbox", { name: "Preview input" }).inputValue(),
    "Saved default",
  );
  assert.equal(await preview.getByRole("checkbox", { name: "Preview checkbox" }).isChecked(), true);
  assert.equal(
    await preview.getByRole("combobox", { name: "Preview choice" }).inputValue(),
    "beta",
  );
  assert.equal(
    await preview.getByRole("textbox", { name: "Preview note" }).inputValue(),
    "Saved note",
  );
  assert.equal(
    await preview.locator('[data-orc-id="scroll"]').evaluate((element) => element.scrollTop),
    0,
  );
  await page.getByRole("button", { name: "Exit Preview", exact: true }).focus();
  await page.keyboard.press("Enter");
}

async function previewNavigation(page: Page) {
  const link = page.getByRole("region", { name: "Frame Preview" }).getByRole("link");
  const url = page.url();
  await link.click();
  await link.focus();
  await page.keyboard.press("Enter");
  await link.click({ button: "middle" });
  await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
  assert.equal(page.url(), url, "Native links retain the current Preview session");
  assert.equal(page.context().pages().length, 1, "Preview links do not open another tab");
}

async function nestedPreview(page: Page) {
  await page.getByRole("button", { name: "Nested frame", exact: true }).click();
  const before = await geometry(page, ".canvas-world");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(
    await page.locator('.preview-world [data-orc-id="Preview frame"]').isVisible(),
    false,
  );
  assert.equal(await page.locator('.preview-world [data-orc-id="button"]').isVisible(), false);
  assert.equal(await page.locator('.preview-world [data-orc-id="Nested frame"]').isVisible(), true);
  assert.deepEqual(await geometry(page, ".preview-world"), before);
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
}

async function draftPreview(page: Page) {
  await page.getByRole("button", { name: "Preview frame", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source" });
  const applied = await source.innerText();
  const draft = applied.replace("Saved default", "Unapplied default");
  assert.notEqual(draft, applied);
  await source.fill(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(
    await page.getByRole("textbox", { name: "Preview input" }).inputValue(),
    "Saved default",
  );
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  assert.equal(await source.innerText(), draft);
  assert.deepEqual(await session(page), before);
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
}

async function ancestorLayout(page: Page) {
  await page.getByRole("button", { name: "Expand Float root", exact: true }).click();
  await page.getByRole("button", { name: "Expand Clipping ancestor", exact: true }).click();
  await page.getByRole("button", { name: "Float frame", exact: true }).click();
  const before = await geometry(page, ".canvas-world");
  const sessionBefore = await session(page);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.deepEqual(await geometry(page, ".preview-world"), before);
  const placement = await page
    .locator('.preview-world [data-orc-id="Float frame"]')
    .evaluate((element) => {
      const frame = element.getBoundingClientRect();
      const viewport = document.querySelector(".preview-viewport")?.getBoundingClientRect();
      if (!viewport) throw new Error("Preview viewport is missing.");
      return { x: frame.left - viewport.left, y: frame.top - viewport.top };
    });
  assert.ok(Math.abs(placement.x - 24) < 0.01 && Math.abs(placement.y - 24) < 0.01);
  assert.deepEqual(await session(page), sessionBefore);
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
}

async function geometry(page: Page, root: string) {
  return page.locator(`${root} [data-orc-id]`).evaluateAll((elements) =>
    Object.fromEntries(
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return [
          element.getAttribute("data-orc-id"),
          { width: Math.round(box.width * 100) / 100, height: Math.round(box.height * 100) / 100 },
        ];
      }),
    ),
  );
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function artifact(suffix: string) {
  return `artifacts/editor/preview-${phase}-${suffix}`;
}

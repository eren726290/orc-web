import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { parseSession } from "../../../shared/session/session";
import { nodeSource } from "../../../shared/source/html-source";
import type { DesignNode } from "../../../shared/document/model";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const artifacts = "artifacts/editor";
const phase = process.env.ORC_RENDER_EVIDENCE ?? "verification";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "rendering-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
const inputs: string[] = [];
const appOutput: string[] = [];
let failure: string | null = null;
try {
  await verifyMode("development");
  if (process.env.ORC_RENDER_MODES !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeEvidence();
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("ordinary source fidelity passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await insertExamples(page);
    await svgWorkflow(page);
    await whitespaceWorkflow(page);
    await saveReopen(page, mode);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(`${mode}: SVG projection, invalid-render rejection, whitespace and save/reopen`);
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    const exit = await app.stop();
    appOutput.push(...app.output);
    assert.equal(exit, 0, app.output.join("\n"));
  }
}

async function insertExamples(page: Page) {
  const base = {
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    style: {},
  };
  const nodes: DesignNode[] = [
    boxControl(base),
    {
      ...base,
      id: "svg",
      name: "SVG example",
      kind: "svg",
      source: '<svg viewBox="0 0 100 80"></svg>',
    },
    {
      ...base,
      id: "text",
      name: "Text example",
      kind: "text",
      tag: "p",
      runs: [{ text: "Original", style: {} }],
    },
    { ...base, id: "container", name: "Container example", kind: "element", tag: "div" },
  ];
  assert.equal((await command(page, { kind: "insert", nodes })).status(), 200);
  const box = await page.locator('.canvas-world [data-orc-id="box-control"]').boundingBox();
  assert.ok(box);
  assert.equal(box.width, 190, "SVG paint isolation must preserve ordinary Fixed outer widths.");
  assert.equal(box.height, 62, "SVG paint isolation must preserve ordinary Fixed outer heights.");
}

function boxControl(
  base: Pick<DesignNode, "parentId" | "children" | "visible" | "locked" | "attributes">,
): DesignNode {
  return {
    ...base,
    id: "box-control",
    name: "Box control",
    kind: "frame",
    mode: "inherit",
    clipContent: false,
    style: {
      position: "absolute",
      left: "40px",
      top: "300px",
      width: "190px",
      height: "62px",
      padding: "12px",
      border: "3px solid black",
    },
  };
}

async function svgWorkflow(page: Page) {
  const source =
    '<svg layer-name="SVG example" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" style="position:absolute;left:40px;top:60px;width:100px;height:80px"><title>A &gt; B</title><rect width="100" height="80" fill="red"/></svg>';
  assert.equal((await apply(page, "svg", source)).status(), 200);
  assert.deepEqual(await svgGeometry(page), { x: 40, y: 60, width: 100, height: 80 });
  const field = page.getByRole("spinbutton", { name: "X", exact: true });
  await field.fill("120");
  await field.press("Enter");
  await page.waitForFunction(() =>
    document
      .querySelector('.canvas-world [data-orc-id="svg"]')
      ?.getAttribute("style")
      ?.includes("left: 120px"),
  );
  assert.deepEqual(await svgGeometry(page), { x: 120, y: 60, width: 100, height: 80 });
  const state = await session(page);
  const current = nodeSource(state.projects[0].document, "svg");
  assert.ok(current.includes("left: 120px;"), "Code must project canonical SVG movement");
  await page.waitForFunction(
    (source) => document.querySelector('[aria-label="Object source"]')?.textContent === source,
    current,
  );
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), current);
  await svgHistory(page, current);
  await rejectedSVG(page, '<svg><g><path d="M0 0 L10 10"></g></svg>');
  await rejectedSVG(page, '<svg width="100" height="80"><path d="nonsense"/></svg>');
  assert.equal(
    (await apply(page, "svg", current.replace('fill="red"', 'fill="blue"'))).status(),
    200,
  );
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="svg"] rect').getAttribute("fill"),
    "blue",
  );
}

async function svgHistory(page: Page, current: string) {
  await typeSource(page, current.replace('fill="red"', 'fill="green"'));
  const before = await session(page);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before, "Cancel protects SVG source and history");
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page.waitForFunction(() =>
    document
      .querySelector('.canvas-world [data-orc-id="svg"]')
      ?.getAttribute("style")
      ?.includes("left: 40px"),
  );
  assert.deepEqual(await svgGeometry(page), { x: 40, y: 60, width: 100, height: 80 });
  await page.getByRole("application", { name: "Canvas" }).press("Control+Shift+z");
  await page.waitForFunction(() =>
    document
      .querySelector('.canvas-world [data-orc-id="svg"]')
      ?.getAttribute("style")
      ?.includes("left: 120px"),
  );
  assert.deepEqual(await svgGeometry(page), { x: 120, y: 60, width: 100, height: 80 });
}

async function svgGeometry(page: Page) {
  return page.locator('.canvas-world [data-orc-id="svg"]').evaluate((element) => {
    const world = element.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const origin = world.getBoundingClientRect();
    const artwork = element instanceof SVGElement ? element : element.querySelector("svg");
    if (!artwork) throw new Error("Missing SVG artwork");
    const bounds = artwork.getBoundingClientRect();
    {
      const selection = element.getBoundingClientRect();
      if (
        selection.x !== bounds.x ||
        selection.y !== bounds.y ||
        selection.width !== bounds.width ||
        selection.height !== bounds.height
      )
        throw new Error("SVG selection bounds differ from artwork");
    }
    return {
      x: bounds.x - origin.x,
      y: bounds.y - origin.y,
      width: bounds.width,
      height: bounds.height,
    };
  });
}

async function rejectedSVG(page: Page, source: string) {
  const before = await session(page);
  assert.equal(
    (await apply(page, "svg", source)).status(),
    400,
    "Invalid SVG must reject before commit",
  );
  const after = await session(page);
  assert.deepEqual(after.projects[0].document, before.projects[0].document);
  assert.deepEqual(
    [after.projects[0].canUndo, after.projects[0].canRedo],
    [before.projects[0].canUndo, before.projects[0].canRedo],
  );
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), source);
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByRole("button", { name: "Dismiss error", exact: true }).click();
}

async function whitespaceWorkflow(page: Page) {
  const textCases = [
    "One<br>Two",
    "One\nTwo",
    "One <strong>bold</strong><br><em>italic</em> Two",
    "One<br><br>Two",
  ];
  for (const content of textCases) {
    const source = `<p layer-name="Text example" style="position:absolute;left:300px;top:60px;margin:0">${content}</p>`;
    await compareText(page, "text", source);
    await compareText(
      page,
      "text",
      `${nodeSource((await session(page)).projects[0].document, "text")}\n`,
    );
    const state = await session(page);
    assert.equal(
      state.projects[0].document.nodes.text.children.length,
      0,
      "Rich ranges remain one Text layer",
    );
  }
  for (const style of ["", "display:flex;gap:10px;", "white-space:pre-wrap;"]) {
    const source = `<div layer-name="Container example" style="position:absolute;left:300px;top:180px;${style}">\n  <span>One</span> <span>Two</span>\n</div>`;
    await compareText(page, "container", source);
    await compareText(
      page,
      "container",
      `${nodeSource((await session(page)).projects[0].document, "container")}\n`,
    );
  }
}

async function compareText(page: Page, id: string, source: string) {
  const reference = await page.context().newPage();
  try {
    await reference.setContent(source);
    const expected = await reference.locator("body").innerText();
    const applied = nodeSource((await session(page)).projects[0].document, id);
    if (source !== applied) assert.equal((await apply(page, id, source)).status(), 200);
    const actual = await page.locator(`.canvas-world [data-orc-id="${id}"]`).innerText();
    assert.equal(actual, expected, `Native text fidelity for ${source}`);
  } finally {
    await reference.close();
  }
}

async function saveReopen(page: Page, mode: string) {
  const project = (await session(page)).projects[0];
  const containerText = await page.locator('.canvas-world [data-orc-id="container"]').innerText();
  const sources = project.document.workspaceRootIds.map((id) => nodeSource(project.document, id));
  const response = await page.request.post("/api/projects/save", {
    data: { projectId: project.document.id, parent: join(process.cwd(), temporary), name: mode },
  });
  assert.equal(response.status(), 200);
  const saved = parseSession(await response.json()).projects[0];
  assert.equal(
    (
      await page.request.post("/api/projects/close", {
        data: { projectId: project.document.id, discard: false },
      })
    ).status(),
    200,
  );
  assert.equal(
    (await page.request.post("/api/projects/open", { data: { path: saved.path } })).status(),
    200,
  );
  const restored = (await session(page)).projects[0];
  assert.deepEqual(restored.document, saved.document);
  assert.deepEqual(
    restored.document.workspaceRootIds.map((id) => nodeSource(restored.document, id)),
    sources,
  );
  await page.locator('.canvas-world [data-orc-id="svg"]').waitFor();
  assert.deepEqual(await svgGeometry(page), { x: 120, y: 60, width: 100, height: 80 });
  assert.equal(await page.locator('.canvas-world [data-orc-id="text"]').innerText(), "One\n\nTwo");
  assert.equal(
    await page.locator('.canvas-world [data-orc-id="container"]').innerText(),
    containerText,
  );
}

async function apply(page: Page, id: string, source: string) {
  inputs.push(source);
  const name = (await session(page)).projects[0].document.nodes[id].name;
  await page
    .locator(".layer-name")
    .filter({ has: page.getByText(name, { exact: true }) })
    .click();
  if (!(await page.getByRole("textbox", { name: "Object source" }).count()))
    await page.getByRole("button", { name: "Code", exact: true }).click();
  await typeSource(page, source);
  const result = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/commands" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const response = await result;
  if (response.status() === 200)
    await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  else await page.locator(".code-error").waitFor();
  return response;
}

async function typeSource(page: Page, source: string) {
  await page.getByRole("textbox", { name: "Object source" }).press("Control+a");
  await page.keyboard.insertText(source);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
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
  return join(artifacts, `rendering-${phase}-${suffix}`);
}

async function writeEvidence() {
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...sourceEvidence(), channel, browserVersion: browser.version(), command: `bun scripts/e2e/rendering/check-rendering.ts ${channel}`, phase, checks, inputs, appOutput, failure }, null, 2)}\n`,
  );
}

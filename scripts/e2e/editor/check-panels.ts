import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Page, type Locator } from "playwright";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

await mkdir("artifacts/editor", { recursive: true });
const browser = await chromium.launch();
const checks: string[] = [];
try {
  for (const mode of ["development", "built"] as const) await verifyMode(mode);
  await writeFile(
    "artifacts/editor/panels.json",
    `${JSON.stringify({ ...sourceEvidence(), command: "bun run check:panels", browserVersion: browser.version(), checks }, null, 2)}\n`,
  );
  process.stdout.write("workspace panels passed\n");
} finally {
  await browser.close();
}

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true });
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await createGeometry(page);
    await resizePanels(page);
    await retainPanels(page);
    await page.screenshot({ path: `artifacts/editor/${mode}-panels.png` });
    checks.push(
      `${mode}: pointer resize, Escape cancellation, keyboard bounds, Code toggle, per-project sizes, percentage selection geometry without session polling, unchanged document/history`,
    );
  } catch (error) {
    await page.screenshot({ path: `artifacts/editor/${mode}-panels-failure.png` });
    throw error;
  } finally {
    await context.tracing.stop({ path: `artifacts/editor/${mode}-panels-trace.zip` });
    await context.close();
    assert.equal(await app.stop(), 0);
  }
}

async function resizePanels(page: Page) {
  const before = await session(page);
  const resume = await pauseSession(page);
  try {
    const layers = page.getByRole("separator", { name: "Resize Layers" });
    const properties = page.getByRole("separator", { name: "Resize Properties" });
    await layers.press("ArrowRight", { timeout: 5000 });
    await size(layers, 264);
    await selectionGeometry(page);
    await drag(page, layers, 80, 0);
    await size(layers, 344);
    await drag(page, layers, 45, 0, true);
    await size(layers, 344);
    await properties.press("ArrowLeft");
    await size(properties, 288);
    await drag(page, properties, -32, 0);
    await size(properties, 320);
    await bounds(layers, 216, 440);
    await bounds(properties, 240, 440, "ArrowLeft", "ArrowRight");
    await page.getByRole("button", { name: "Code", exact: true }).click();
    const code = page.getByRole("separator", { name: "Resize Code" });
    await code.press("ArrowUp");
    await size(code, 228);
    await drag(page, code, 0, -40);
    await size(code, 268);
    await selectionGeometry(page);
    await drag(page, code, 0, -30, true);
    await size(code, 268);
  } finally {
    await resume();
  }
  assert.deepEqual(await session(page), before);
}

async function pauseSession(page: Page) {
  let release = () => {};
  let observed = () => {};
  const paused = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    observed = resolve;
  });
  await page.route("**/api/session", async (route) => {
    const response = await route.fetch();
    observed();
    await paused;
    await route.fulfill({ response });
  });
  await requested;
  return async () => {
    release();
    await page.unrouteAll({ behavior: "wait" });
  };
}

async function createGeometry(page: Page) {
  const before = await session(page);
  const project = before.projects[0];
  assert.ok(project);
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: project.document.id,
      commandId: crypto.randomUUID(),
      expectedRevision: project.document.revision,
      mutation: {
        kind: "insert",
        nodes: [
          {
            id: crypto.randomUUID(),
            kind: "frame",
            name: "Panel geometry",
            parentId: null,
            children: [],
            visible: true,
            locked: false,
            style: {
              position: "absolute",
              left: "60px",
              top: "80px",
              width: "50%",
              height: "25%",
              "background-color": "#d7d7d0",
            },
            attributes: {},
            clipContent: false,
            mode: "inherit",
          },
        ],
      },
    },
  });
  assert.equal(response.status(), 200);
  await page.getByRole("button", { name: "Panel geometry", exact: true }).click();
  await selectionGeometry(page);
}

async function selectionGeometry(page: Page) {
  await page.waitForFunction(
    () => {
      const object = document.querySelector(".canvas-world [data-orc-id]")?.getBoundingClientRect();
      const outline = document.querySelector(".selection-outline")?.getBoundingClientRect();
      return (
        object &&
        outline &&
        Math.abs(object.width - outline.width) < 1 &&
        Math.abs(object.height - outline.height) < 1
      );
    },
    undefined,
    { timeout: 3000 },
  );
}

async function retainPanels(page: Page) {
  const before = await session(page);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  assert.equal(await page.getByRole("separator", { name: "Resize Code" }).count(), 0);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await size(page.getByRole("separator", { name: "Resize Code" }), 268);
  await page.getByRole("button", { name: "New or open project" }).click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await size(page.getByRole("separator", { name: "Resize Layers" }), 256);
  await size(page.getByRole("separator", { name: "Resize Properties" }), 280);
  assert.equal(await page.getByRole("separator", { name: "Resize Code" }).count(), 0);
  await page.getByRole("button", { name: "Untitled", exact: true }).first().click();
  await size(page.getByRole("separator", { name: "Resize Layers" }), 344);
  await size(page.getByRole("separator", { name: "Resize Properties" }), 320);
  await size(page.getByRole("separator", { name: "Resize Code" }), 268);
  assert.deepEqual((await session(page)).projects[0], before.projects[0]);
}

async function bounds(
  handle: Locator,
  minimum: number,
  maximum: number,
  grow = "ArrowRight",
  shrink = "ArrowLeft",
) {
  const start = Number(await handle.getAttribute("aria-valuenow"));
  await handle.press("Home");
  await handle.press(shrink);
  await size(handle, minimum);
  await handle.press("End");
  await size(handle, maximum);
  await handle.press(grow);
  await size(handle, maximum);
  await handle.press("Home");
  for (let value = minimum; value < start; value += 8) await handle.press(grow);
  await size(handle, start);
}

async function size(handle: Locator, expected: number) {
  await handle
    .and(handle.page().locator(`[aria-valuenow="${expected}"]`))
    .waitFor({ timeout: 5000 });
  assert.equal(Number(await handle.getAttribute("aria-valuenow")), expected);
}

async function drag(page: Page, handle: Locator, x: number, y: number, cancel = false) {
  const box = await handle.boundingBox();
  assert.ok(box);
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + x, start.y + y, { steps: 3 });
  if (cancel) await page.keyboard.press("Escape");
  await page.mouse.up();
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

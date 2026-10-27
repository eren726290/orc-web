import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import type { DesignNode } from "../../../shared/document/model";
import { nodeSource } from "../../../shared/source/html-source";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";
import { boundaryCommand, boundarySeed, boundarySession } from "./boundary-support";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium");
const phase = process.env.ORC_FRAME_LABEL_EVIDENCE ?? "verification";
await mkdir("artifacts/editor", { recursive: true });
const evidence = sourceEvidence();
const checks: string[] = [];
const measurements: unknown[] = [];
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
let failure: string | null = null;
try {
  await verifyMode("development");
  await verifyMode("built");
  assert.deepEqual(
    sourceEvidence().sourceHashes,
    evidence.sourceHashes,
    "Source stays frozen during verification",
  );
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    JSON.stringify(
      {
        ...evidence,
        after: sourceEvidence(),
        channel,
        browserVersion: browser.version(),
        executable: process.env.ORC_CHROME_EXECUTABLE ?? null,
        command: `ORC_FRAME_LABEL_EVIDENCE=${phase} bun run check:frame-labels ${channel}`,
        fixture: fixture(),
        checks,
        measurements,
        failure,
        limitations: [
          "Still view is blocked on production React/Motion integration",
          "Product image/PDF exporters are not implemented",
        ],
      },
      null,
      2,
    ),
  );
}
process.stdout.write("frame label workflow passed\n");

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
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await boundarySeed(page, fixture());
    await initialLabels(page);
    await renameHistory(page);
    await viewGeometry(page);
    await editGeometry(page);
    await previewAndProjects(page);
    await sourceBoundary(page, mode);
    await rootMembership(page);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(
      `${mode}: saved names/history, top-level eligibility, narrow names, pan/zoom/drag/resize/layout, Preview/project restoration, source isolation and no view mutations`,
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

function frame(id: string, name: string, left: string, width: string): DesignNode {
  return {
    id,
    name,
    kind: "frame",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    clipContent: true,
    mode: "inherit",
    style: {
      position: "absolute",
      left,
      top: "80px",
      width,
      height: "160px",
      background: "#fcfcf9",
    },
  };
}

function fixture(): DesignNode[] {
  return [
    { ...frame("frame-a", "Landing page", "40px", "280px"), children: ["nested"] },
    frame(
      "frame-b",
      "A very long readable frame name that must not cover another control",
      "420px",
      "72px",
    ),
    { ...frame("nested", "Nested container", "10px", "100px"), parentId: "frame-a" },
    { ...frame("hidden", "Hidden frame", "600px", "80px"), visible: false },
    {
      id: "loose",
      name: "Loose object",
      kind: "element",
      tag: "div",
      parentId: null,
      children: [],
      attributes: {},
      visible: true,
      locked: false,
      style: { position: "absolute", left: "550px", top: "80px", width: "60px", height: "60px" },
    },
  ];
}

async function initialLabels(page: Page) {
  await label(page, "frame-a").waitFor();
  assert.equal(await page.locator(".frame-label").count(), 2);
  assert.equal(await label(page, "frame-a").textContent(), "Landing page");
  assert.equal(await page.locator(".canvas-world .frame-label").count(), 0);
  assert.equal(await page.locator(".frame-label button, .frame-label input").count(), 0);
  assert.equal(await page.getByRole("button", { name: /Still view/ }).count(), 0);
  const state = await boundarySession(page);
  for (const id of ["frame-a", "frame-b"]) await aligned(page, id);
  const narrow = await label(page, "frame-b").evaluate((element) => ({
    scroll: element.scrollWidth,
    client: element.clientWidth,
    overflow: getComputedStyle(element).overflow,
    ellipsis: getComputedStyle(element).textOverflow,
    font: getComputedStyle(element).fontSize,
    pointer: getComputedStyle(element).pointerEvents,
  }));
  assert.ok(narrow.scroll > narrow.client);
  assert.equal(narrow.overflow, "clip");
  assert.equal(narrow.ellipsis, "ellipsis");
  assert.equal(narrow.font, "12px");
  assert.equal(narrow.pointer, "none");
  assert.deepEqual(await boundarySession(page), state);
  measurements.push({ narrow });
}

async function renameHistory(page: Page) {
  const before = (await boundarySession(page)).projects[0].document;
  await page.getByRole("button", { name: "Rename Landing page", exact: true }).focus();
  await page.keyboard.press("Enter");
  const input = page.getByRole("textbox", { name: "Layer name", exact: true });
  await input.fill("Checkout & basket");
  await input.press("Enter");
  await nameIs(page, "Checkout & basket");
  assert.equal((await boundarySession(page)).projects[0].document.revision, before.revision + 1);
  await page.getByRole("application", { name: "Canvas" }).focus();
  await page.keyboard.press("Control+z");
  await nameIs(page, "Landing page");
  assert.deepEqual((await boundarySession(page)).projects[0].document.nodes, before.nodes);
  await page.keyboard.press("Control+Shift+z");
  await nameIs(page, "Checkout & basket");
}

async function nameIs(page: Page, name: string) {
  await page.waitForFunction(
    (name) => document.querySelector('[data-frame-label="frame-a"]')?.textContent === name,
    name,
  );
  await page.getByRole("button", { name, exact: true }).waitFor();
}

async function aligned(page: Page, id: string) {
  await page.waitForFunction(
    (id) => {
      const frame = document.querySelector(`.canvas-world [data-orc-id="${id}"]`);
      const label = document.querySelector(`[data-frame-label="${id}"]`);
      if (!frame || !label) return false;
      const box = frame.getBoundingClientRect(),
        text = label.getBoundingClientRect();
      return (
        Math.abs(box.left - text.left) < 1 &&
        Math.abs(box.width - text.width) < 1 &&
        Math.abs(box.top - text.bottom - 6) < 1
      );
    },
    id,
    { timeout: 3000 },
  );
}

async function viewGeometry(page: Page) {
  const before = await boundarySession(page);
  const canvas = page.getByRole("application", { name: "Canvas" });
  await canvas.hover({ position: { x: 350, y: 350 } });
  await page.mouse.wheel(0, 450);
  for (const id of ["frame-a", "frame-b"]) await aligned(page, id);
  assert.equal(
    await label(page, "frame-a").evaluate((element) => getComputedStyle(element).fontSize),
    "12px",
  );
  await page.getByRole("button", { name: "Pan", exact: true }).click();
  const bounds = await canvas.boundingBox();
  assert.ok(bounds);
  await page.mouse.move(bounds.x + 360, bounds.y + 380);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 400, bounds.y + 410, { steps: 5 });
  await aligned(page, "frame-a");
  await page.mouse.up();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  assert.deepEqual(
    await boundarySession(page),
    before,
    "Pan and zoom do not mutate document/history/save status",
  );
  const point = await label(page, "frame-a").boundingBox();
  assert.ok(point);
  await page.mouse.dblclick(point.x + 10, point.y + 10);
  assert.equal(await page.getByRole("textbox", { name: "Layer name", exact: true }).count(), 0);
  assert.deepEqual(await boundarySession(page), before, "Label adds no rename or document gesture");
}

async function editGeometry(page: Page) {
  await page.getByRole("button", { name: "Checkout & basket", exact: true }).click();
  await field(page, "X", "95");
  await field(page, "Width", "230");
  await aligned(page, "frame-a");
  const frame = page.locator('.canvas-world [data-orc-id="frame-a"]');
  const start = await frame.boundingBox();
  assert.ok(start);
  await page.mouse.move(start.x + start.width - 20, start.y + 25);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width + 15, start.y + 45, { steps: 8 });
  await aligned(page, "frame-a");
  const moved = await frame.boundingBox();
  assert.ok(moved && moved.x - start.x > 20, "Pointer preview really moves the frame");
  const committed = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/commands") && response.request().method() === "POST",
  );
  await page.mouse.up();
  assert.equal((await committed).status(), 200);
  await aligned(page, "frame-a");
  await page
    .getByRole("group", { name: "Frame layout", exact: true })
    .getByRole("button", { name: "Row", exact: true })
    .click();
  await aligned(page, "frame-a");
  await boundaryCommand(page, {
    kind: "style",
    id: "frame-a",
    values: { width: "min(260px, 50%)" },
  });
  await page.waitForFunction(() =>
    document.querySelector('[data-orc-id="frame-a"]')?.getAttribute("style")?.includes("min("),
  );
  await page.setViewportSize({ width: 1300, height: 900 });
  await aligned(page, "frame-a");
}

async function field(page: Page, name: string, value: string) {
  const input = page.getByRole("spinbutton", { name, exact: true });
  await input.fill(value);
  await input.press("Enter");
}

async function previewAndProjects(page: Page) {
  const before = await boundarySession(page);
  const bounds = await label(page, "frame-a").boundingBox();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
  assert.equal(await page.locator(".frame-label").count(), 0);
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  await aligned(page, "frame-a");
  assert.deepEqual(await label(page, "frame-a").boundingBox(), bounds);
  assert.deepEqual(await boundarySession(page), before);
  await page.getByRole("button", { name: "New or open project" }).click();
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  assert.equal(await page.locator(".frame-label").count(), 0);
  await page.getByRole("button", { name: "Untitled", exact: true }).first().click();
  await aligned(page, "frame-a");
  assert.deepEqual(await label(page, "frame-a").boundingBox(), bounds);
  assert.deepEqual((await boundarySession(page)).projects[0], before.projects[0]);
}

async function sourceBoundary(page: Page, mode: string) {
  const before = await boundarySession(page);
  const source = nodeSource(before.projects[0].document, "frame-a");
  assert.ok(
    source.includes('layer-name="Checkout &amp; basket"'),
    "Saved source label metadata remains intact",
  );
  assert.ok(!source.includes("frame-label"));
  assert.ok(!source.includes("data-frame-label"));
  const output = await page.context().newPage();
  try {
    await output.setContent(source);
    assert.equal(await output.locator(".frame-label, [data-frame-label]").count(), 0);
    assert.equal(await output.getByText("Checkout & basket", { exact: true }).count(), 0);
    await output.screenshot({ path: artifact(`${mode}-standalone-source.png`) });
    await writeFile(artifact(`${mode}-source.txt`), source);
  } finally {
    await output.close();
  }
  assert.deepEqual(await boundarySession(page), before);
}

async function rootMembership(page: Page) {
  await boundaryCommand(page, { kind: "delete", ids: ["frame-b"] });
  await label(page, "frame-b").waitFor({ state: "detached" });
  await page.getByRole("application", { name: "Canvas" }).focus();
  await page.keyboard.press("Control+z");
  await aligned(page, "frame-b");
  await boundaryCommand(page, { kind: "reorder", id: "frame-b", parentId: "frame-a", index: 0 });
  await label(page, "frame-b").waitFor({ state: "detached" });
  await page.getByRole("application", { name: "Canvas" }).focus();
  await page.keyboard.press("Control+z");
  await aligned(page, "frame-b");
}

function label(page: Page, id: string) {
  return page.locator(`[data-frame-label="${id}"]`);
}

function artifact(suffix: string) {
  return `artifacts/editor/frame-labels-${phase}-${channel}-${suffix}`;
}

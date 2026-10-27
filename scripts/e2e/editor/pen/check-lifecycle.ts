import assert from "node:assert/strict";
import type { Page, Worker } from "playwright";
import { parseSession } from "../../../../shared/session/session";
import { frame } from "../intrinsic-sizing/fixtures";
import { accepted, commands, install, select, type Suite } from "../intrinsic-sizing/support";
import { runPenBrowserSuite } from "./browser-suite";
import { nodeFixture } from "./fixtures";
import { performanceFixture } from "./performance-fixture";
import { documentFor, handlePoint, screenMatrix, sameMapping, waitHandles } from "./support";

await runPenBrowserSuite("lifecycle", "PEN_LIFECYCLE_PASSED", async (suite) => {
  await cancellations(suite);
  await revisionChange(suite);
  await twoPaths(suite);
  await previewAndTabs(suite);
  await pendingWorker(suite);
});

async function cancellations(suite: Suite) {
  const page = suite.page;
  await install(suite, [nodeFixture()]);
  await selectPen(page);
  for (const cause of ["pointercancel", "capture", "blur", "focus", "tool", "zoom"] as const) {
    await page.getByRole("button", { name: "Select", exact: true }).click();
    const before = await documentFor(page);
    const observed = commands(page);
    await beginDrag(page);
    await cancelWith(page, cause);
    await page.mouse.up();
    assert.deepEqual(await documentFor(page), before);
    assert.deepEqual(observed.requests, []);
    observed.stop();
    assert.equal(await page.locator(".pen-hint").count(), 0);
    suite.checks.push(`${suite.mode}: ${cause} cancels local geometry without a release command`);
  }
}

async function beginDrag(page: Page) {
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
  await page.mouse.move(point.x + 10, point.y + 12, { steps: 4 });
}

async function cancelWith(page: Page, cause: string) {
  if (cause === "pointercancel")
    await page.locator(".canvas").dispatchEvent("pointercancel", { pointerId: 1 });
  else if (cause === "capture")
    await page.locator(".canvas").evaluate((element) => element.releasePointerCapture(1));
  else if (cause === "blur") await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  else if (cause === "focus") await page.getByLabel("Name", { exact: true }).focus();
  else if (cause === "tool") await page.keyboard.press("h");
  else await page.mouse.wheel(0, -80);
  await page.waitForFunction(() => !document.querySelector(".canvas")?.hasPointerCapture(1));
}

async function revisionChange(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  await selectPen(page);
  await beginDrag(page);
  await accepted(suite, { kind: "rename", id: "pen-node", name: "Renamed Pen" });
  const changed = await documentFor(page);
  await page.mouse.up();
  assert.deepEqual(await documentFor(page), changed);
  assert.deepEqual(changed.nodes["pen-node"], { ...before.nodes["pen-node"], name: "Renamed Pen" });
  suite.checks.push(`${suite.mode}: a new applied revision cancels a held drag completely`);
}

async function twoPaths(suite: Suite) {
  const page = suite.page;
  const a = nodeFixture();
  const b = { ...nodeFixture(), id: "second-pen", name: "Second Pen" };
  b.style = { ...b.style, left: "330px" };
  await install(suite, [a, b]);
  await selectPen(page);
  const point = await handlePoint(page, 1);
  await page.mouse.click(point.x, point.y);
  await page.locator(".layer-name").getByText("Second Pen", { exact: true }).click();
  assert.equal(await page.locator('.pen-anchor[aria-pressed="true"]').count(), 0);
  const before = await documentFor(page);
  const origin = await handlePoint(page, 3);
  await beginDrag(page);
  await page.mouse.up();
  await page.waitForFunction(
    (revision) =>
      document.querySelector(".canvas")?.getAttribute("data-orc-revision") === String(revision + 1),
    before.revision,
  );
  const after = await documentFor(page);
  assert.deepEqual(after.nodes[a.id], before.nodes[a.id]);
  assert.notDeepEqual(after.nodes[b.id], before.nodes[b.id]);
  suite.inputs.push({ trigger: "two paths with repeated local IDs", origin, before, after });
  suite.checks.push(
    `${suite.mode}: anchor selection and solver state stay local to the containing path`,
  );
}

async function previewAndTabs(suite: Suite) {
  const page = suite.page;
  const node = nodeFixture();
  node.parentId = "frame";
  await install(suite, framedPen(node));
  await selectPen(page);
  await page.getByRole("checkbox", { name: "Guides & labels", exact: true }).uncheck();
  const before = await documentFor(page);
  await select(page, "frame");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
  assert.equal(await page.locator(".pen-overlays").count(), 0);
  assert.equal(await page.locator('.preview-world [data-orc-id="pen-node"] path').count(), 1);
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  await selectPen(page);
  assert.equal(
    await page.getByRole("checkbox", { name: "Guides & labels", exact: true }).isChecked(),
    false,
  );
  const mapping = await screenMatrix(page, node.id);
  await switchProject(suite, before.id);
  await selectPen(page);
  await waitHandles(page, node.pen.anchors.length);
  assert.equal(
    await page.getByRole("checkbox", { name: "Guides & labels", exact: true }).isChecked(),
    false,
  );
  assert.deepEqual(await documentFor(page), before);
  sameMapping(mapping, await screenMatrix(page, node.id));
  suite.checks.push(
    `${suite.mode}: project switches cancel pending work; guide preference and native mapping restore after tabs and Preview`,
  );
}

function framedPen(node: ReturnType<typeof nodeFixture>) {
  return [
    frame("frame", null, [node.id], {
      position: "absolute",
      left: "50px",
      top: "40px",
      width: "500px",
      height: "450px",
    }),
    node,
  ];
}

async function switchProject(suite: Suite, id: string) {
  const page = suite.page;
  await beginDrag(page);
  const response = await page.request.post("/api/projects/new", { data: {} });
  assert.equal(response.status(), 200);
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await page.mouse.up();
  const session = parseSession(await (await page.request.get("/api/session")).json());
  assert.equal(session.projects.length, 2);
  assert.equal(Object.keys(session.projects[1].document.nodes).length, 0);
  assert.equal(
    (await page.request.post("/api/projects/activate", { data: { projectId: id } })).status(),
    200,
  );
  await page.locator('.canvas-world [data-orc-id="pen-node"]').waitFor();
}

async function selectPen(page: Page) {
  const expand = page.getByRole("button", { name: "Expand frame", exact: true });
  if (await expand.count()) await expand.click();
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
}

async function pendingWorker(suite: Suite) {
  const page = suite.page;
  await install(suite, [performanceFixture(402)]);
  await selectPen(page);
  for (const cause of ["return", "Escape", "Control+z", "release"] as const) {
    const before = await documentFor(page);
    const observed = commands(page);
    const shape = page.locator('.canvas-world [data-orc-id="pen-node"] path');
    const original = await shape.getAttribute("d");
    const { point, worker } = await beginPendingWorker(page);
    assert.equal(await shape.getAttribute("d"), original, "Expected a still-pending large solve.");
    if (cause === "return") {
      await page.mouse.move(point.x, point.y);
      await worker.evaluate(() => true);
      await twoFrames(page);
      assert.equal(
        await shape.getAttribute("d"),
        original,
        "An obsolete reply replaced the returned shape.",
      );
      assert.equal(await page.locator(".pen-hint").count(), 0);
    }
    suite.inputs.push({ pendingWorker: cause, ...(await closePendingWorker(page, worker, cause)) });
    assert.deepEqual(await documentFor(page), before);
    assert.deepEqual(observed.requests, []);
    assert.equal(await shape.getAttribute("d"), original);
    observed.stop();
    suite.checks.push(
      `${suite.mode}: ${cause} discards a pending 402-anchor Worker result without a command`,
    );
  }
}

async function closePendingWorker(page: Page, worker: Worker, cause: string) {
  const closed = worker.waitForEvent("close");
  const start = performance.now();
  if (cause === "Escape" || cause === "Control+z") await page.keyboard.press(cause);
  await page.mouse.up();
  await page.waitForFunction(() => !document.querySelector(".canvas")?.hasPointerCapture(1));
  const inputCancellationMs = performance.now() - start;
  await closed;
  await twoFrames(page);
  return { inputCancellationMs, workerClosedMs: performance.now() - start };
}

async function beginPendingWorker(page: Page) {
  const point = await handlePoint(page, 1);
  const created = page.waitForEvent("worker");
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
  const worker = await created;
  await worker.evaluate(() => true);
  await page.mouse.move(point.x + 40, point.y + 30);
  await twoFrames(page);
  await page.locator(".pen-hint").filter({ hasText: "Moving to pointer" }).waitFor();
  return { point, worker };
}

async function twoFrames(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

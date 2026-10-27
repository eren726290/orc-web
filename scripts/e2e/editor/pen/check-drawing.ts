import assert from "node:assert/strict";
import { runPenBrowserSuite } from "./browser-suite";
import { commands, exactHistory, install, type Suite } from "../intrinsic-sizing/support";
import {
  canvasPoint,
  documentFor,
  handlePoint,
  penFor,
  waitHandles,
  waitRevision,
} from "./support";

await runPenBrowserSuite("drawing", "PEN_DRAWING_PASSED", async (suite) => {
  await cappedClosure(suite);
  await exactArcClosure(suite);
  await freshBranch(suite);
});

async function points(suite: Suite, values: number[][]) {
  const page = suite.page;
  await install(suite, []);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const blank = await canvasPoint(page, 40, 40);
  await page.mouse.click(blank.x, blank.y);
  await page
    .getByRole("navigation", { name: "Canvas tools" })
    .getByRole("button", { name: "Pen", exact: true })
    .click();
  for (const [index, [x, y]] of values.entries()) {
    const point = await canvasPoint(page, x, y);
    await page.mouse.click(point.x, point.y);
    await waitHandles(page, index + 1);
  }
}

async function cappedClosure(suite: Suite) {
  const page = suite.page;
  await points(suite, [
    [200, 200],
    [300, 200],
    [300, 300],
  ]);
  const before = await documentFor(page);
  const observed = commands(page);
  await page.keyboard.press("a");
  const first = await handlePoint(page, 1);
  await page.mouse.move(first.x, first.y);
  await waitHandles(page, 4);
  const actual = await handlePoint(page, 4);
  const endpoint = await canvasPoint(page, 100, 300);
  assert.ok(Math.hypot(actual.x - endpoint.x, actual.y - endpoint.y) < 0.1);
  await page.mouse.click(first.x, first.y);
  await page
    .locator(".workspace-notice")
    .filter({ hasText: /cannot close.*half circle/u })
    .waitFor();
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  await page.keyboard.press("a");
  await page.mouse.click(first.x, first.y);
  const after = await waitRevision(page, before.revision + 1);
  assert.equal(observed.requests.length, 1);
  observed.stop();
  const node = await penFor(page);
  assert.equal(node.pen.closed, true);
  assert.equal(node.pen.anchors.length, 3);
  assert.equal(node.pen.segments.length, 3);
  await exactHistory(page, before, after);
  suite.checks.push(
    `${suite.mode}: capped arc shows its actual endpoint, incompatible closure refuses, and exact line closure commits once`,
  );
}

async function exactArcClosure(suite: Suite) {
  const page = suite.page;
  await points(suite, [
    [200, 500],
    [300, 300],
    [300, 400],
  ]);
  const before = await documentFor(page);
  const first = await handlePoint(page, 1);
  await page.keyboard.press("a");
  await page.mouse.click(first.x, first.y);
  const closed = await waitRevision(page, before.revision + 1);
  const node = await penFor(page);
  const arc = node.pen.segments.at(-1);
  assert.ok(arc?.kind === "arc");
  assert.deepEqual(arc.center, { x: node.pen.anchors[0].x, y: node.pen.anchors[2].y });
  assert.equal(arc.to, node.pen.anchors[0].id);
  assert.equal(node.pen.closed, true);
  await exactHistory(page, before, closed);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  const point = await handlePoint(page, 2);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press("Delete");
  const after = await waitRevision(page, closed.revision + 3);
  const changed = await penFor(page);
  assert.equal(changed.pen.anchors.length, 2);
  assert.ok(changed.pen.segments.some((segment) => segment.id === arc.id));
  await exactHistory(page, { ...closed, revision: after.revision - 1 }, after);
  suite.checks.push(
    `${suite.mode}: exact directed arc closure and closed-anchor deletion preserve the unaffected arc and complete history`,
  );
}

async function freshBranch(suite: Suite) {
  const page = suite.page;
  await points(suite, [
    [200, 200],
    [300, 220],
  ]);
  const before = await documentFor(page);
  await page.keyboard.press("Enter");
  await waitRevision(page, before.revision + 1);
  const original = await penFor(page);
  const discarded = await continuePath(suite, 60, 30);
  const beforeUndo = await documentFor(page);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await waitRevision(page, beforeUndo.revision + 1);
  const branch = await continuePath(suite, 70, 35);
  assert.equal(branch.id, original.id);
  assert.deepEqual(branch.pen.anchors.slice(0, 2), original.pen.anchors);
  assert.notEqual(branch.pen.anchors.at(-1)?.id, discarded.pen.anchors.at(-1)?.id);
  assert.notEqual(branch.pen.segments.at(-1)?.id, discarded.pen.segments.at(-1)?.id);
  suite.checks.push(
    `${suite.mode}: a new continuation after Undo retains the object and never reuses discarded path identities`,
  );
}

async function continuePath(suite: Suite, dx: number, dy: number) {
  const page = suite.page;
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await page
    .getByRole("navigation", { name: "Canvas tools" })
    .getByRole("button", { name: "Pen", exact: true })
    .click();
  const before = await documentFor(page);
  const end = await handlePoint(page, 2);
  await page.mouse.click(end.x, end.y);
  await page.mouse.click(end.x + dx, end.y + dy);
  await page.keyboard.press("Enter");
  await waitRevision(page, before.revision + 1);
  return penFor(page);
}

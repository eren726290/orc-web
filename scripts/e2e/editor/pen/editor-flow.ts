import assert from "node:assert/strict";
import type { Page } from "playwright";
import { penPathData } from "../../../../shared/pen/source";
import { assertRules } from "../../../solver/oracle";
import {
  canvasPoint,
  documentFor,
  handlePoint,
  penFor,
  waitHandles,
  waitRevision,
} from "./support";

export async function drawPath(page: Page) {
  const before = await documentFor(page);
  await page.getByRole("button", { name: "Pen", exact: true }).click();
  const points = await Promise.all(
    [
      [200, 180],
      [320, 180],
      [360, 220],
      [360, 300],
    ].map(([x, y]) => canvasPoint(page, x, y)),
  );
  await page.mouse.click(points[0].x, points[0].y);
  await waitHandles(page, 1);
  assert.deepEqual(await documentFor(page), before, "First anchor created applied state.");
  await page.mouse.click(points[1].x, points[1].y);
  await waitHandles(page, 2);
  await page.keyboard.press("a");
  await page.mouse.click(points[2].x, points[2].y);
  await waitHandles(page, 3);
  await page.mouse.click(points[3].x, points[3].y);
  await waitHandles(page, 4);
  assert.deepEqual(await documentFor(page), before, "Pointer steps published drawing commands.");
  await page.keyboard.press("Enter");
  await waitRevision(page, before.revision + 1);
  const node = await penFor(page);
  await assertCreatedPath(page);
  for (const [index, point] of points.entries()) {
    const handle = await handlePoint(page, index + 1);
    assert.ok(
      Math.hypot(handle.x - point.x, handle.y - point.y) < 0.1,
      "Creation reboxing moved a clicked anchor.",
    );
  }
  return node;
}

async function assertCreatedPath(page: Page) {
  const node = await penFor(page);
  assert.equal(node.pen.anchors.length, 4);
  assert.deepEqual(
    node.pen.segments.map((segment) => segment.kind),
    ["line", "arc", "line"],
  );
  assertRules(node.pen);
  const paint = await page.locator(`[data-orc-id="${node.id}"] path`).evaluate((element) => {
    const style = getComputedStyle(element);
    return { fill: style.fill, stroke: style.stroke, width: style.strokeWidth };
  });
  assert.deepEqual(
    paint,
    { fill: "none", stroke: "rgb(24, 24, 24)", width: "2px" },
    "Native paint must honor the canonical SVG presentation attributes.",
  );
  assert.equal(
    await page.locator(`[data-orc-id="${node.id}"] path`).getAttribute("d"),
    penPathData(node.pen),
  );
  const length = await page.locator(`[data-orc-id="${node.id}"] path`).evaluate((element) => {
    if (!(element instanceof SVGPathElement)) throw new Error("Expected a native SVG path.");
    return element.getTotalLength();
  });
  assert.ok(
    Math.abs(length - (200 + 20 * Math.PI)) < 0.05,
    "Independent native line/quarter-circle/line length differs.",
  );
}

export async function dragAndCancel(page: Page) {
  const before = await documentFor(page);
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 16, point.y + 18, { steps: 6 });
  assert.deepEqual(await documentFor(page), before, "Anchor move published before release.");
  await page.mouse.up();
  const after = await waitRevision(page, before.revision + 1);
  const moved = await penFor(page);
  assertRules(moved.pen);
  assert.notDeepEqual(after.nodes, before.nodes);
  await cancelDrag(page);
  assert.deepEqual(
    await documentFor(page),
    after,
    "Escape published or retained cancelled geometry.",
  );
  await page.keyboard.press("Control+z");
  assert.deepEqual((await waitRevision(page, after.revision + 1)).nodes, before.nodes);
  await page.keyboard.press("Control+Shift+z");
  assert.deepEqual((await waitRevision(page, after.revision + 2)).nodes, after.nodes);
  return moved;
}

async function cancelDrag(page: Page) {
  const point = await handlePoint(page, 1);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y + 20, { steps: 5 });
  await page.keyboard.press("Escape");
  await page.mouse.up();
}

export async function insufficientDraft(page: Page) {
  const before = await documentFor(page);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const point = await canvasPoint(page, 40, 40);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press("p");
  await page.mouse.click(point.x, point.y);
  await waitHandles(page, 1);
  await page.keyboard.press("Escape");
  await waitHandles(page, 0);
  assert.deepEqual(
    await documentFor(page),
    before,
    "Insufficient draft created an orphan or history.",
  );
}

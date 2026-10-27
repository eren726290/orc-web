import assert from "node:assert/strict";
import type { Page } from "playwright";
import { runPenBrowserSuite } from "./browser-suite";
import { nodeFixture, type PenNode } from "./fixtures";
import { documentFor, penFor, screenMatrix, sameMapping, waitRevision } from "./support";
import { commands, exactHistory, install, type Suite } from "../intrinsic-sizing/support";

await runPenBrowserSuite("transforms", "PEN_TRANSFORMS_PASSED", async (suite) => {
  const node = nodeFixture();
  Object.assign(node.style, {
    left: "160px",
    top: "130px",
    transform: "rotate(32deg)",
    "transform-origin": "25% 75%",
  });
  await install(suite, [node]);
  await suite.page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await resize(suite);
  await rotate(suite);
  await cancellation(suite);
  await fields(suite);
  await formReadouts(suite);
});

async function resize(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  const node = await penFor(page);
  const matrix = await screenMatrix(page, node.id);
  const input = await controlPoint(page, "Resize SVG proportionally");
  const observed = commands(page);
  await press(page, input);
  await page.mouse.move(input.x + 40, input.y + 35, { steps: 8 });
  assert.deepEqual(await documentFor(page), before);
  await page.mouse.up();
  const after = await waitRevision(page, before.revision + 1);
  observed.stop();
  assert.equal(observed.requests.length, 1);
  const changed = await penFor(page);
  const next = await screenMatrix(page, node.id);
  assertResize(node, changed, matrix, next);
  await exactHistory(page, before, after);
  suite.inputs.push({
    trigger: "rotated proportional pointer resize",
    before,
    after,
    matrix,
    next,
  });
  suite.checks.push(
    `${suite.mode}: pointer resize preserves proportion, local geometry, screen pivot and one-command history`,
  );
}

function assertResize(node: PenNode, changed: PenNode, matrix: number[], next: number[]) {
  assert.deepEqual(changed.pen, node.pen);
  const factor = Number.parseFloat(changed.style.width) / Number.parseFloat(node.style.width);
  assert.ok(factor > 1);
  assert.ok(
    Math.abs(
      Number.parseFloat(changed.style.height) / Number.parseFloat(node.style.height) - factor,
    ) < 1e-9,
  );
  const pivot = project(matrix, { x: -1, y: -1 });
  for (const point of [
    { x: -1, y: -1 },
    { x: 201, y: -1 },
    { x: 201, y: 201 },
  ]) {
    const original = project(matrix, point);
    closePoint(
      {
        x: pivot.x + (original.x - pivot.x) * factor,
        y: pivot.y + (original.y - pivot.y) * factor,
      },
      project(next, point),
    );
  }
}

async function rotate(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  const node = await penFor(page);
  const matrix = await screenMatrix(page, node.id);
  const input = await controlPoint(page, "Rotate SVG");
  const pivot = { x: -1 + 202 * 0.25, y: -1 + 202 * 0.75 };
  const center = project(matrix, pivot);
  const start = inversePoint(matrix, input);
  const angle = Math.PI / 6;
  const target = project(matrix, {
    x: pivot.x + (start.x - pivot.x) * Math.cos(angle) - (start.y - pivot.y) * Math.sin(angle),
    y: pivot.y + (start.x - pivot.x) * Math.sin(angle) + (start.y - pivot.y) * Math.cos(angle),
  });
  await press(page, input);
  await page.mouse.move(target.x, target.y, { steps: 8 });
  assert.deepEqual(await documentFor(page), before);
  await page.mouse.up();
  const after = await waitRevision(page, before.revision + 1);
  const changed = await penFor(page);
  assert.deepEqual(changed.pen, node.pen);
  assert.ok(Math.abs(Number(changed.style.transform.slice(7, -4)) - 62) < 0.1);
  closePoint(center, project(await screenMatrix(page, node.id), pivot));
  await exactHistory(page, before, after);
  suite.checks.push(
    `${suite.mode}: inverse-mapped pointer rotation retains the native percentage origin and path identities`,
  );
}

async function cancellation(suite: Suite) {
  const page = suite.page;
  for (const finish of ["Escape", "Control+z", "return"] as const) {
    const before = await documentFor(page);
    const node = await penFor(page);
    const matrix = await screenMatrix(page, node.id);
    const input = await controlPoint(page, "Resize SVG proportionally");
    await press(page, input);
    await page.mouse.move(input.x + 30, input.y + 30, { steps: 4 });
    if (finish === "return") await page.mouse.move(input.x, input.y);
    else await page.keyboard.press(finish);
    await page.mouse.up();
    assert.deepEqual(await documentFor(page), before);
    sameMapping(matrix, await screenMatrix(page, node.id));
  }
  suite.checks.push(
    `${suite.mode}: Escape, active Undo and exact return-to-start restore all transform fields without commands`,
  );
}

async function fields(suite: Suite) {
  const page = suite.page;
  let before = await documentFor(page);
  const original = await penFor(page);
  const rotation = page.getByRole("spinbutton", { name: "Rotation", exact: true });
  await rotation.fill("45");
  await rotation.press("Enter");
  await waitRevision(page, before.revision + 1);
  assert.equal((await penFor(page)).style.transform, "rotate(45deg)");
  before = await documentFor(page);
  const scale = page.getByRole("spinbutton", { name: "Scale (%)", exact: true });
  await scale.fill("125");
  await scale.press("Enter");
  const after = await waitRevision(page, before.revision + 1);
  assert.deepEqual((await penFor(page)).pen, original.pen);
  assert.equal((await penFor(page)).style.width, "252.5px");
  await exactHistory(page, before, after);
  before = await documentFor(page);
  await page.getByRole("button", { name: "Rotate SVG", exact: true }).press("ArrowRight");
  await waitRevision(page, before.revision + 1);
  assert.equal((await penFor(page)).style.transform, "rotate(46deg)");
  suite.checks.push(
    `${suite.mode}: typed scale/rotation and keyboard handle adjustments retain rules and exact history`,
  );
}

async function formReadouts(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  await page.getByRole("spinbutton", { name: "Rotation", exact: true }).focus();
  const title = await page.locator(".property-title").boundingBox();
  const panel = await page.locator(".properties-panel").boundingBox();
  assert.ok(title && panel);
  assert.ok(
    title.y >= panel.y && title.y + title.height <= panel.y + panel.height,
    "The selected-name header must stay visible while the long Pen form scrolls.",
  );
  for (const axis of ["Width", "Height"]) {
    assert.equal(
      await page.getByRole("combobox", { name: `${axis} sizing`, exact: true }).inputValue(),
      "Fixed",
    );
    const value = page.getByRole("textbox", { name: axis, exact: true });
    assert.equal(await value.inputValue(), "252.5");
    assert.equal(await value.getAttribute("readonly"), "");
  }
  assert.deepEqual(await documentFor(page), before);
  suite.checks.push(
    `${suite.mode}: rotated own-Pen sizes stay accurate and read-only, with a visible selected-name header`,
  );
}

async function controlPoint(page: Page, name: string) {
  const box = await page.getByRole("button", { name, exact: true }).boundingBox();
  assert.ok(box);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function press(page: Page, point: { x: number; y: number }) {
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
}

function project(matrix: number[], point: { x: number; y: number }) {
  return {
    x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
    y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
  };
}

function inversePoint(matrix: number[], point: { x: number; y: number }) {
  const determinant = matrix[0] * matrix[3] - matrix[1] * matrix[2];
  const x = point.x - matrix[4];
  const y = point.y - matrix[5];
  return {
    x: (matrix[3] * x - matrix[2] * y) / determinant,
    y: (-matrix[1] * x + matrix[0] * y) / determinant,
  };
}

function closePoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.1, "The native transform pivot moved.");
}

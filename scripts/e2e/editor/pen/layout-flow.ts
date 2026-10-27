import assert from "node:assert/strict";
import { frame, layout } from "../intrinsic-sizing/fixtures";
import { sharedFixture } from "../intrinsic-sizing/shared-column-fixtures";
import {
  choose,
  commands,
  exactHistory,
  install,
  native,
  select,
  type Suite,
} from "../intrinsic-sizing/support";
import {
  canvasPoint,
  documentFor,
  handlePoint,
  penFor,
  screenMatrix,
  sameMapping,
  waitHandles,
  waitRevision,
} from "./support";
import { nodeFixture } from "./fixtures";
import { arcFixture } from "../../../solver/fixtures";
import { nestedMapping } from "./nested-mapping";

export async function layoutFlow(suite: Suite) {
  for (const direction of ["Free", "row", "column", "wrap"] as const) {
    const root = frame("root", null, [], {
      ...layout,
      position: "absolute",
      left: "100px",
      top: "100px",
      width: "600px",
      height: "500px",
      padding: "12px",
      border: "3px solid black",
      ...(direction === "Free"
        ? { display: "block" }
        : {
            "flex-direction": direction === "column" ? "column" : "row",
            "flex-wrap": direction === "wrap" ? "wrap" : "nowrap",
          }),
    });
    await install(suite, [root]);
    await select(suite.page, "root");
    await drawInFrame(suite, direction === "Free" ? "free" : "flow");
    suite.checks.push(`${suite.mode}: native ${direction} insertion and edit`);
  }
  await intrinsic(suite);
  await rotated(suite);
  await nestedMapping(suite);
}

async function rotated(suite: Suite) {
  const node = nodeFixture(arcFixture());
  node.style.width = `${Number.parseFloat(node.style.width) * 1.6}px`;
  node.style.height = `${Number.parseFloat(node.style.height) * 1.6}px`;
  Object.assign(node.style, {
    left: "200px",
    top: "120px",
    transform: "rotate(32deg)",
    "transform-origin": "25% 75%",
  });
  await install(suite, [node]);
  await suite.page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  const before = await documentFor(suite.page);
  const matrix = await screenMatrix(suite.page, node.id);
  const point = await handlePoint(suite.page, 4);
  await suite.page.mouse.move(point.x, point.y);
  await suite.page.mouse.down();
  await suite.page.mouse.move(point.x + 25, point.y + 45, { steps: 8 });
  await suite.page.mouse.up();
  const after = await waitRevision(suite.page, before.revision + 1);
  sameMapping(matrix, await screenMatrix(suite.page, node.id));
  await exactHistory(suite.page, before, after);
  suite.inputs.push({ trigger: "rotated proportional reboxing", before, after });
  suite.checks.push(`${suite.mode}: proportional rotation with percentage transform origin`);
}

async function drawInFrame(suite: Suite, placement: "free" | "flow") {
  const page = suite.page;
  const before = await documentFor(page);
  const observed = commands(page);
  await page.getByRole("button", { name: "Pen", exact: true }).click();
  const click = await canvasPoint(page, 220, 220);
  await page.mouse.click(click.x, click.y);
  await waitHandles(page, 1);
  const first = await handlePoint(page, 1);
  if (placement === "free") assert.ok(Math.hypot(first.x - click.x, first.y - click.y) < 0.1);
  else await page.getByText(/Frame places this path/u).waitFor();
  await page.mouse.click(first.x + 80, first.y + 40);
  await waitHandles(page, 2);
  assert.deepEqual(await documentFor(page), before);
  await page.keyboard.press("Enter");
  const after = await waitRevision(page, before.revision + 1);
  observed.stop();
  assert.equal(observed.requests.length, 1);
  const node = await penFor(page);
  assert.equal(node.style.position, placement === "free" ? "absolute" : "static");
  if (placement === "flow") assert.ok(!Object.hasOwn(node.style, "left"));
  const afterFirst = await handlePoint(page, 1);
  assert.ok(Math.hypot(first.x - afterFirst.x, first.y - afterFirst.y) < 0.1);
  await exactHistory(page, before, after);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await editFlow(suite);
}

async function editFlow(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  const first = await handlePoint(page, 1);
  const point = await handlePoint(page, 2);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 20, point.y + 15, { steps: 4 });
  await page.mouse.up();
  const after = await waitRevision(page, before.revision + 1);
  const stationary = await handlePoint(page, 1);
  assert.ok(Math.hypot(first.x - stationary.x, first.y - stationary.y) < 0.1);
  await exactHistory(page, before, after);
  suite.inputs.push({ trigger: "native insertion/edit", before, after });
}

async function intrinsic(suite: Suite) {
  await install(suite, sharedFixture());
  await choose(suite, "leaf", "height", "Fill", ["root", "leaf"]);
  await choose(suite, "peer", "height", "Fill", ["root", "leaf", "peer"]);
  const before = await native(suite.page, "root");
  await select(suite.page, "leaf");
  await drawInFrame(suite, "flow");
  assert.ok((await native(suite.page, "root")).height > before.height);
  assert.equal(await suite.page.locator('[data-orc-flow="intrinsic-column-v1"]').count(), 1);
  suite.checks.push(`${suite.mode}: intrinsic shared Column responds to pen supply`);
}

import assert from "node:assert/strict";
import { frame } from "../intrinsic-sizing/fixtures";
import { commands, exactHistory, install, type Suite } from "../intrinsic-sizing/support";
import { readableGuides } from "./guide-bounds";
import { nodeFixture } from "./fixtures";
import { documentFor, handlePoint, sameMapping, screenMatrix, waitRevision } from "./support";

export async function nestedMapping(suite: Suite) {
  const page = suite.page;
  await install(suite, fixture());
  for (const name of ["outer", "scroll", "inner"]) {
    const expand = page.getByRole("button", { name: `Expand ${name}`, exact: true });
    if (await expand.count()) await expand.click();
  }
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  const scroll = page.locator('.canvas-world [data-orc-id="scroll"]');
  await scroll.evaluate((element) => {
    element.scrollTop = 100;
  });
  await aligned(suite);
  const transform = await page.locator(".canvas-world").getAttribute("style");
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.wheel(0, -100);
  await page.waitForFunction(
    (before) => document.querySelector(".canvas-world")?.getAttribute("style") !== before,
    transform,
  );
  await aligned(suite);
  const before = await documentFor(page);
  const matrix = await screenMatrix(page, "pen-node");
  const observed = commands(page);
  await start(suite);
  await page.mouse.up();
  const after = await waitRevision(page, before.revision + 1);
  assert.equal(observed.requests.length, 1);
  observed.stop();
  sameMapping(matrix, await screenMatrix(page, "pen-node"));
  await exactHistory(page, before, after);
  await aligned(suite);
  await cancelOnScroll(suite);
  suite.checks.push(
    `${suite.mode}: nested rotation, clipping, pan/zoom and native scrolling retain matrix-mapped handles, guides, reboxing and one-command history`,
  );
}

function fixture() {
  const pen = nodeFixture();
  pen.parentId = "inner";
  Object.assign(pen.style, {
    left: "100px",
    top: "160px",
    transform: "rotate(20deg)",
    "transform-origin": "25% 75%",
  });
  return [
    {
      ...frame("outer", null, ["scroll"], {
        position: "absolute",
        left: "90px",
        top: "80px",
        width: "550px",
        height: "370px",
        transform: "rotate(8deg)",
      }),
      clipContent: true,
    },
    scroller(),
    frame("inner", "scroll", [pen.id], { position: "relative", width: "500px", height: "900px" }),
    pen,
  ];
}

function scroller() {
  return {
    id: "scroll",
    name: "scroll",
    parentId: "outer",
    children: ["inner"],
    kind: "element" as const,
    tag: "div",
    visible: true,
    locked: false,
    attributes: {},
    style: { width: "530px", height: "350px", overflow: "auto" },
  };
}

async function start(suite: Suite) {
  const page = suite.page;
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
  await page.mouse.move(point.x + 7, point.y + 8, { steps: 4 });
}

async function cancelOnScroll(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  const observed = commands(page);
  await start(suite);
  await page.locator('.canvas-world [data-orc-id="scroll"]').evaluate((element) => {
    element.scrollTop += 20;
  });
  await page.waitForFunction(() => !document.querySelector(".canvas")?.hasPointerCapture(1));
  await page.mouse.up();
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
  await aligned(suite);
}

async function aligned(suite: Suite) {
  const node = (await documentFor(suite.page)).nodes["pen-node"];
  assert.ok(node.kind === "svg" && node.pen);
  const arc = node.pen.segments.find((segment) => segment.kind === "arc");
  assert.ok(arc?.kind === "arc");
  await suite.page.waitForFunction(
    ({ anchor, centerPoint }) => {
      const svg = document.querySelector('.canvas-world [data-orc-id="pen-node"]');
      const canvas = document.querySelector(".canvas");
      const handle = document.querySelector('.pen-anchor[aria-label="Anchor 1"]');
      if (!(svg instanceof SVGSVGElement) || !canvas || !handle) return false;
      const matrix = svg.getScreenCTM();
      if (!matrix) return false;
      const point = new DOMPoint(anchor.x, anchor.y).matrixTransform(matrix);
      const bounds = handle.getBoundingClientRect();
      const center = document.querySelector(".pen-center");
      const origin = canvas.getBoundingClientRect();
      const expected = new DOMPoint(centerPoint.x, centerPoint.y).matrixTransform(matrix);
      return (
        Math.hypot(bounds.x + bounds.width / 2 - point.x, bounds.y + bounds.height / 2 - point.y) <
          0.1 &&
        Boolean(center) &&
        Math.hypot(
          Number(center?.getAttribute("x")) + origin.x - expected.x,
          Number(center?.getAttribute("y")) + origin.y - expected.y,
        ) < 0.1
      );
    },
    { anchor: node.pen.anchors[0], centerPoint: arc.center },
  );
  await readableGuides(suite.page, "Nested transformed and scrolled guides");
  await suite.page.screenshot({ path: suite.artifact(`${suite.mode}-nested-guides.png`) });
}

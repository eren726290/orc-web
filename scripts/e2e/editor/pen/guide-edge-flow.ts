import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import type { Page } from "playwright";
import { guideCommand, guideDocument as documentFor } from "./guide-project";
import { commands } from "../intrinsic-sizing/support";
import { arcFixture } from "../../../solver/fixtures";
import { nodeFixture } from "./fixtures";
import { handlePoint } from "./support";
import { guideBounds, readableGuides } from "./guide-bounds";

export async function guideEdges(page: Page, mode: string) {
  const before = await documentFor(page);
  await guideCommand(page, { kind: "delete", ids: before.workspaceRootIds });
  const node = nodeFixture(arcFixture());
  await guideCommand(page, { kind: "insert", nodes: [node] });
  for (const scale of [0.5, 1, 2]) {
    await zoom(page, scale);
    for (const edge of ["top-left", "top-right", "bottom-right", "bottom-left"]) {
      await moveToEdge(page, edge);
      await inspectEdge(page, `${mode}-${scale}-${edge}`);
    }
  }
}

async function zoom(page: Page, target: number) {
  const current = await page
    .locator(".canvas-world")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  const box = await page.getByRole("application", { name: "Canvas" }).boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -Math.log(target / current) / 0.0015);
  await page.waitForFunction((target) => {
    const world = document.querySelector(".canvas-world");
    return world && Math.abs(new DOMMatrix(getComputedStyle(world).transform).a - target) < 0.0001;
  }, target);
}

async function moveToEdge(page: Page, edge: string) {
  const surface = await page.getByRole("application", { name: "Canvas" }).boundingBox();
  const box = await page.locator('[data-orc-id="pen-node"]').boundingBox();
  assert.ok(surface && box);
  const scale = await page
    .locator(".canvas-world")
    .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  const node = (await documentFor(page)).nodes["pen-node"];
  const x = edge.endsWith("right") ? surface.x + surface.width - box.width - 5 : surface.x + 5;
  const y = edge.startsWith("bottom") ? surface.y + surface.height - box.height - 5 : surface.y + 5;
  await guideCommand(page, {
    kind: "style",
    id: node.id,
    values: {
      left: `${Number.parseFloat(node.style.left) + (x - box.x) / scale}px`,
      top: `${Number.parseFloat(node.style.top) + (y - box.y) / scale}px`,
    },
  });
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
}

async function inspectEdge(page: Page, name: string) {
  const before = await documentFor(page);
  const observed = commands(page);
  const anchor = await handlePoint(page, 1);
  await page.mouse.click(anchor.x, anchor.y);
  await writeFile(
    `artifacts/pen-guide-readability/${name}-bounds.json`,
    JSON.stringify(await guideBounds(page), null, 2),
  );
  const scene = await readableGuides(page, name);
  assert.equal(
    scene.labels.length,
    4,
    "Keep three complete measurements and selected coordinates.",
  );
  const sizes = await page
    .locator(".pen-guides text:not(.pen-center)")
    .evaluateAll((elements) => elements.map((e) => getComputedStyle(e).fontSize));
  assert.deepEqual(sizes, ["11px", "11px", "11px", "11px"]);
  await page.screenshot({ path: `artifacts/pen-guide-readability/${name}.png` });
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
}

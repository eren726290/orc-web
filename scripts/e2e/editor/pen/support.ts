import assert from "node:assert/strict";
import type { Page } from "playwright";
import { parseSession } from "../../../../shared/session/session";
import type { PenNode } from "./fixtures";

export async function documentFor(page: Page) {
  const response = await page.request.get("/api/session");
  assert.equal(response.status(), 200);
  const document = parseSession(await response.json()).projects[0]?.document;
  assert.ok(document);
  return document;
}

export async function waitRevision(page: Page, revision: number) {
  await page.waitForFunction(
    (revision) =>
      window.document.querySelector(".canvas")?.getAttribute("data-orc-revision") ===
      String(revision),
    revision,
  );
  const document = await documentFor(page);
  assert.equal(document.revision, revision);
  return document;
}

export async function penFor(page: Page): Promise<PenNode> {
  const document = await documentFor(page);
  const nodes = Object.values(document.nodes).filter((node) => node.kind === "svg" && node.pen);
  assert.equal(nodes.length, 1);
  const node = nodes[0];
  assert.ok(node.kind === "svg" && node.pen);
  return { ...node, pen: node.pen };
}

export async function handlePoint(page: Page, index: number) {
  const box = await page
    .getByRole("button", { name: `Anchor ${index}`, exact: true })
    .boundingBox();
  assert.ok(box);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export async function waitHandles(page: Page, count: number) {
  await page.waitForFunction(
    (count) => document.querySelectorAll(".pen-anchor").length === count,
    count,
  );
}

export async function canvasPoint(page: Page, x: number, y: number) {
  const box = await page.getByRole("application", { name: "Canvas" }).boundingBox();
  assert.ok(box);
  return { x: box.x + x, y: box.y + y };
}

export async function screenMatrix(page: Page, id: string) {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`).evaluate((element) => {
    if (!(element instanceof SVGSVGElement)) throw new Error("Expected SVG.");
    const matrix = element.getScreenCTM();
    if (!matrix) throw new Error("Missing SVG mapping.");
    return [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f];
  });
}

export function sameMapping(before: number[], after: number[]) {
  for (const point of [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
    { x: -100, y: 100 },
  ]) {
    const project = (matrix: number[]) => ({
      x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
      y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
    });
    const a = project(before);
    const b = project(after);
    assert.ok(
      Math.hypot(a.x - b.x, a.y - b.y) < 0.1,
      "Reboxing changed the native local-to-screen mapping.",
    );
  }
}

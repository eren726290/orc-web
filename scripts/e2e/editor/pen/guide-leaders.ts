import assert from "node:assert/strict";
import type { Page } from "playwright";

export async function readableLeaders(page: Page, context: string) {
  const crossings = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll(".pen-guides text:not(.pen-center)"));
    const collisions: string[] = [];
    for (const leader of document.querySelectorAll(".pen-label-leader")) {
      if (!(leader instanceof SVGPathElement) || !leader.getAttribute("d")) continue;
      const matrix = leader.getScreenCTM();
      if (!matrix) throw new Error("Missing leader mapping.");
      const length = leader.getTotalLength();
      for (const label of labels.filter((label) => label !== leader.nextElementSibling)) {
        const box = label.getBoundingClientRect();
        const halo = Number.parseFloat(getComputedStyle(label).strokeWidth) / 2 + 1;
        for (let distance = 0; distance <= length; distance += 2) {
          const local = leader.getPointAtLength(distance);
          const point = new DOMPoint(local.x, local.y).matrixTransform(matrix);
          if (
            Math.min(
              point.x - box.left + halo,
              box.right + halo - point.x,
              point.y - box.top + halo,
              box.bottom + halo - point.y,
            ) > 0
          ) {
            collisions.push(
              `${leader.nextElementSibling?.textContent} crosses ${label.textContent}`,
            );
            break;
          }
        }
      }
    }
    return collisions;
  });
  assert.deepEqual(crossings, [], `${context}: a leader crosses another label`);
}

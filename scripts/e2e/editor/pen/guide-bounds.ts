import { readableLeaders } from "./guide-leaders";
import assert from "node:assert/strict";
import type { Page } from "playwright";

export async function guideBounds(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  return page.evaluate(() => {
    const bounds = (element: Element, margin: number) => {
      const r = element.getBoundingClientRect();
      return {
        left: r.left - margin,
        right: r.right + margin,
        top: r.top - margin,
        bottom: r.bottom + margin,
      };
    };
    const canvas = document.querySelector(".canvas");
    if (!canvas) throw new Error("Missing canvas.");
    return {
      canvas: bounds(canvas, 0),
      labels: Array.from(document.querySelectorAll(".pen-guides text:not(.pen-center)"), (e) => ({
        text: e.textContent ?? "",
        ...bounds(e, Number.parseFloat(getComputedStyle(e).strokeWidth) / 2 + 1),
      })),
      handles: Array.from(
        document.querySelectorAll(".pen-anchor,.pen-transform-handle,.pen-center"),
        (e) => bounds(e, 1),
      ),
    };
  });
}

type Box = { left: number; right: number; top: number; bottom: number };
const overlap = (a: Box, b: Box) =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.25 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.25;

export async function readableGuides(page: Page, context: string) {
  const scene = await guideBounds(page);
  assert.ok(scene.labels.length, `${context}: missing measurements`);
  for (const [index, label] of scene.labels.entries()) {
    for (const other of scene.labels.slice(index + 1))
      assert.ok(
        !overlap(label, other),
        `${context}: label collision: ${label.text} / ${other.text}`,
      );
    assert.ok(
      !scene.handles.some((handle) => overlap(label, handle)),
      `${context}: label covers a handle or center: ${label.text}`,
    );
    assert.ok(
      label.left >= scene.canvas.left &&
        label.right <= scene.canvas.right &&
        label.top >= scene.canvas.top &&
        label.bottom <= scene.canvas.bottom,
      `${context}: label outside canvas: ${label.text}`,
    );
  }
  await readableLeaders(page, context);
  return scene;
}

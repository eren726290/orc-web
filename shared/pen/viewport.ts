import { penBounds } from "./bounds";
import { penNumber } from "./geometry";
import type { PenGeometry } from "./model";

export type PenViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function penViewport(value: string): PenViewport {
  const numbers = value
    .trim()
    .split(/[\s,]+/u)
    .map(Number);
  if (numbers.length !== 4 || !numbers.every(Number.isFinite) || numbers[2] <= 0 || numbers[3] <= 0)
    throw new Error("The pen SVG needs a finite positive viewBox.");
  return {
    x: numbers[0],
    y: numbers[1],
    width: numbers[2],
    height: numbers[3],
  };
}

export function viewportSource(box: PenViewport): string {
  return [box.x, box.y, box.width, box.height].map(penNumber).join(" ");
}

export function validatePenViewport(
  path: PenGeometry,
  stroke: number,
  viewport: PenViewport,
): void {
  const bounds = penBounds(path, stroke);
  const tolerance = 1e-6;
  if (
    viewport.x > bounds.x + tolerance ||
    viewport.y > bounds.y + tolerance ||
    viewport.x + viewport.width < bounds.x + bounds.width - tolerance ||
    viewport.y + viewport.height < bounds.y + bounds.height - tolerance
  )
    throw new Error("The outer SVG viewBox does not contain its pen bounds.");
}

export function flowPenViewport(
  path: PenGeometry,
  stroke: number,
  previous: PenViewport = { x: 0, y: 0, width: 1, height: 1 },
): PenViewport {
  const bounds = penBounds(path, stroke);
  if (bounds.x < previous.x - 1e-6 || bounds.y < previous.y - 1e-6)
    throw new Error(
      "This shape would move the path's flow origin. Draw right and down, or choose Free layout.",
    );
  return {
    x: previous.x,
    y: previous.y,
    width: Math.max(1, bounds.x + bounds.width - previous.x),
    height: Math.max(1, bounds.y + bounds.height - previous.y),
  };
}

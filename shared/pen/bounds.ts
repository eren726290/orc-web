import { arcSweep, penNumber } from "./geometry";
import { penAnchor, type PenGeometry, type PenPoint, type PenSegment } from "./model";

function arcExtrema(path: PenGeometry, arc: Extract<PenSegment, { kind: "arc" }>): PenPoint[] {
  const from = penAnchor(path, arc.from);
  const radius = Math.hypot(from.x - arc.center.x, from.y - arc.center.y);
  const start = Math.atan2(from.y - arc.center.y, from.x - arc.center.x);
  const extent = arcSweep(path, arc);
  const result: PenPoint[] = [];
  const directions = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  for (const [index, [x, y]] of directions.entries()) {
    const angle = (index * Math.PI) / 2;
    const delta = arc.sweep === 1 ? angle - start : start - angle;
    const sweep = ((delta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (sweep <= extent + 64 * Number.EPSILON)
      result.push({
        x: arc.center.x + radius * x,
        y: arc.center.y + radius * y,
      });
  }
  return result;
}

export function penBounds(path: PenGeometry, strokeWidth: number) {
  const points = [
    ...path.anchors,
    ...path.segments.flatMap((segment) =>
      segment.kind === "arc" ? arcExtrema(path, segment) : [],
    ),
  ];
  const minimum = (axis: "x" | "y") =>
    points.reduce((value, p) => Math.min(value, p[axis]), Infinity);
  const maximum = (axis: "x" | "y") =>
    points.reduce((value, p) => Math.max(value, p[axis]), -Infinity);
  const x = minimum("x") - strokeWidth / 2;
  const y = minimum("y") - strokeWidth / 2;
  return {
    x,
    y,
    width: Math.max(1, maximum("x") - minimum("x") + strokeWidth),
    height: Math.max(1, maximum("y") - minimum("y") + strokeWidth),
  };
}

export function penViewBox(path: PenGeometry, strokeWidth: number): string {
  const box = penBounds(path, strokeWidth);
  return [box.x, box.y, box.width, box.height].map(penNumber).join(" ");
}

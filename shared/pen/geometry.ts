import {
  penAnchor,
  penMinimumLength,
  type PenGeometry,
  type PenPoint,
  type PenSegment,
} from "./model";

export function distance(a: PenPoint, b: PenPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function unitDirection(a: PenPoint, b: PenPoint): PenPoint {
  const length = distance(a, b);
  if (!(length > penMinimumLength)) throw new Error("A pen segment cannot have zero length.");
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}

export function arcSweep(path: PenGeometry, arc: Extract<PenSegment, { kind: "arc" }>): number {
  const from = penAnchor(path, arc.from);
  const to = penAnchor(path, arc.to);
  const start = Math.atan2(from.y - arc.center.y, from.x - arc.center.x);
  const end = Math.atan2(to.y - arc.center.y, to.x - arc.center.x);
  const direction = arc.sweep === 1 ? end - start : start - end;
  return ((direction % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

export function segmentDirection(path: PenGeometry, segment: PenSegment, end: boolean): PenPoint {
  const from = penAnchor(path, segment.from);
  const to = penAnchor(path, segment.to);
  if (segment.kind === "line") return unitDirection(from, to);
  const radial = unitDirection(segment.center, end ? to : from);
  return segment.sweep === 1 ? { x: -radial.y, y: radial.x } : { x: radial.y, y: -radial.x };
}

export function tangentArc(start: PenPoint, direction: PenPoint, target: PenPoint) {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const normal = { x: -direction.y, y: direction.x };
  const turn = dx * normal.x + dy * normal.y;
  if (Math.abs(turn) <= penMinimumLength * Math.max(1, Math.hypot(dx, dy))) return null;
  const signedRadius = (dx * dx + dy * dy) / (2 * turn);
  const center = {
    x: start.x + normal.x * signedRadius,
    y: start.y + normal.y * signedRadius,
  };
  const sweep: 0 | 1 = signedRadius > 0 ? 1 : 0;
  const capped = dx * direction.x + dy * direction.y < 0;
  const to = capped ? { x: 2 * center.x - start.x, y: 2 * center.y - start.y } : target;
  return { center, sweep, to, capped };
}

export function penNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Pen geometry needs finite numbers.");
  return Object.is(value, -0) ? "0" : String(value);
}

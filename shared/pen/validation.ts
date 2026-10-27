import { arcSweep, distance, segmentDirection } from "./geometry";
import {
  penAnchor,
  penLimits,
  penMinimumLength,
  penSegment,
  penTolerance,
  type PenGeometry,
  type PenPoint,
  type PenRule,
  type PenSegment,
} from "./model";

export function validatePenPoint(point: PenPoint): void {
  if (![point.x, point.y].every((n) => Number.isFinite(n) && Math.abs(n) < penLimits.coordinate)) {
    throw new Error("Pen coordinates must be finite and smaller than 1,000,000,000 units.");
  }
}

function validateIdentities(path: PenGeometry): void {
  const ids = new Set<string>();
  for (const entry of [...path.anchors, ...path.segments, ...path.rules]) {
    if (!entry.id || ids.has(entry.id))
      throw new Error("Pen identities must be nonempty and unique.");
    ids.add(entry.id);
  }
}

function validateTopology(path: PenGeometry): void {
  const count = path.anchors.length;
  if (count < 2 || path.segments.length !== count - (path.closed ? 0 : 1)) {
    throw new Error("A pen path must be one connected open or closed path.");
  }
  path.segments.forEach((segment, index) => {
    if (
      segment.from !== path.anchors[index]?.id ||
      segment.to !== path.anchors[(index + 1) % count]?.id
    ) {
      throw new Error("Pen segments must follow their anchors in path order.");
    }
  });
}

function validateArc(path: PenGeometry, arc: Extract<PenSegment, { kind: "arc" }>): void {
  validatePenPoint(arc.center);
  const radius = distance(arc.center, penAnchor(path, arc.from));
  const endRadius = distance(arc.center, penAnchor(path, arc.to));
  const scale = Math.max(Math.abs(arc.center.x), Math.abs(arc.center.y), radius, endRadius);
  if (!(radius > penMinimumLength) || radius >= penLimits.coordinate)
    throw new Error("A pen arc needs a valid positive radius.");
  if (Math.abs(radius - endRadius) > penTolerance + 64 * Number.EPSILON * scale) {
    throw new Error("The arc endpoints do not lie on the same circle.");
  }
  if (arcSweep(path, arc) > Math.PI + 64 * Number.EPSILON)
    throw new Error("A pen arc cannot exceed a half circle.");
}

function validateSegment(path: PenGeometry, segment: PenSegment): void {
  const from = penAnchor(path, segment.from);
  const to = penAnchor(path, segment.to);
  if (!(distance(from, to) > penMinimumLength))
    throw new Error("A pen segment cannot have zero length.");
  if (segment.kind === "arc") validateArc(path, segment);
}

function requireAdjacent(path: PenGeometry, first: PenSegment, second: PenSegment): void {
  if (first.id === second.id || first.to !== second.from) {
    throw new Error("Pen rules connect consecutive segments in drawing order.");
  }
}

function validateAxisRule(path: PenGeometry, rule: Extract<PenRule, { segment: string }>): void {
  const segment = penSegment(path, rule.segment);
  if (segment.kind !== "line") throw new Error("Horizontal and vertical rules need a line.");
  const direction = segmentDirection(path, segment, false);
  const residual = rule.kind === "horizontal" ? direction.y : direction.x;
  if (Math.abs(residual) > penTolerance) throw new Error(`Can't keep ${rule.kind}.`);
}

function validateJoinRule(path: PenGeometry, rule: Extract<PenRule, { first: string }>): void {
  const first = penSegment(path, rule.first);
  const second = penSegment(path, rule.second);
  requireAdjacent(path, first, second);
  const a = segmentDirection(path, first, true);
  const b = segmentDirection(path, second, false);
  const dot = a.x * b.x + a.y * b.y;
  if (rule.kind === "perpendicular") {
    if (first.kind !== "line" || second.kind !== "line")
      throw new Error("Perpendicular rules need two lines.");
    if (Math.abs(dot) > penTolerance) throw new Error("Can't keep perpendicular.");
  } else {
    if (first.kind === "line" && second.kind === "line")
      throw new Error("A tangent rule needs an arc.");
    if (dot < 1 - penTolerance) throw new Error("Can't keep tangent without reversing the path.");
  }
}

export function validatePenGeometry(path: PenGeometry, rules = true): void {
  validateIdentities(path);
  validateTopology(path);
  const points =
    path.anchors.length + path.segments.filter((segment) => segment.kind === "arc").length + 1;
  if (
    points > penLimits.points ||
    path.rules.length > penLimits.rules ||
    path.segments.length > penLimits.curves
  ) {
    throw new Error("The path exceeds the solver's existing safety limits.");
  }
  path.anchors.forEach(validatePenPoint);
  path.segments.forEach((segment) => validateSegment(path, segment));
  if (!rules) return;
  for (const rule of path.rules) {
    if ("segment" in rule) validateAxisRule(path, rule);
    else validateJoinRule(path, rule);
  }
}

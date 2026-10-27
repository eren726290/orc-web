import { distance, segmentDirection, tangentArc, unitDirection } from "./geometry";
import {
  penMinimumLength,
  type PenAnchor,
  type PenGeometry,
  type PenPoint,
  type PenRule,
} from "./model";

export type NextPenIds = { anchor: string; segment: string; rule: string };
type Options = {
  arc: boolean;
  shift: boolean;
  alt: boolean;
  close: boolean;
  ids: NextPenIds;
};
type Snap = { direction: PenPoint; rule: PenRule; priority: number };
const angleTolerance = (2.5 * Math.PI) / 180;

function snaps(path: PenGeometry, ids: NextPenIds): Snap[] {
  const previous = path.segments.at(-1);
  const base = { id: ids.rule, segment: ids.segment };
  const result: Snap[] = [
    ...[1, -1].map((sign) => ({
      direction: { x: sign, y: 0 },
      rule: { ...base, kind: "horizontal" as const },
      priority: 2,
    })),
    ...[1, -1].map((sign) => ({
      direction: { x: 0, y: sign },
      rule: { ...base, kind: "vertical" as const },
      priority: 2,
    })),
  ];
  if (!previous) return result;
  const incoming = segmentDirection(path, previous, true);
  const join = { id: ids.rule, first: previous.id, second: ids.segment };
  if (previous.kind === "arc")
    result.push({
      direction: incoming,
      rule: { ...join, kind: "tangent" },
      priority: 0,
    });
  else
    for (const sign of [1, -1])
      result.push({
        direction: { x: -incoming.y * sign, y: incoming.x * sign },
        rule: { ...join, kind: "perpendicular" },
        priority: 1,
      });
  return result;
}

function lineTarget(path: PenGeometry, start: PenPoint, target: PenPoint, options: Options) {
  const length = distance(start, target);
  let direction = unitDirection(start, target);
  if (options.shift && !options.close) {
    const angle = (Math.round(Math.atan2(direction.y, direction.x) / (Math.PI / 4)) * Math.PI) / 4;
    direction = { x: Math.cos(angle), y: Math.sin(angle) };
    target = {
      x: start.x + direction.x * length,
      y: start.y + direction.y * length,
    };
  }
  const candidates = options.alt
    ? []
    : snaps(path, options.ids).map((snap) => ({
        ...snap,
        angle: Math.acos(
          Math.min(
            1,
            Math.max(-1, direction.x * snap.direction.x + direction.y * snap.direction.y),
          ),
        ),
      }));
  candidates.sort((a, b) =>
    Math.abs(a.angle - b.angle) < 1e-12 ? a.priority - b.priority : a.angle - b.angle,
  );
  const chosen = candidates[0];
  if (!chosen || chosen.angle > (options.close ? 1e-8 : angleTolerance))
    return { target, rule: null };
  return {
    target: options.close
      ? target
      : {
          x: start.x + chosen.direction.x * length,
          y: start.y + chosen.direction.y * length,
        },
    rule: chosen.rule,
  };
}

export function appendPenSegment(path: PenGeometry, target: PenPoint, options: Options) {
  const start = path.anchors.at(-1);
  if (!start || path.closed || distance(start, target) <= penMinimumLength)
    throw new Error("Choose a different point for the next anchor.");
  const to = options.close ? path.anchors[0].id : options.ids.anchor;
  const { segment, rule, endpoint, capped } = placedSegment(path, start, to, target, options);
  return {
    path: {
      anchors: options.close ? path.anchors : [...path.anchors, { id: to, ...endpoint }],
      segments: [...path.segments, segment],
      rules: rule ? [...path.rules, rule] : path.rules,
      closed: options.close,
    },
    message: drawingMessage(capped, options.arc && segment.kind !== "arc"),
  };
}

function placedSegment(
  path: PenGeometry,
  start: PenAnchor,
  to: string,
  target: PenPoint,
  options: Options,
) {
  const arc = nextArc(path, target, options);
  const base = { id: options.ids.segment, from: start.id, to };
  if (arc)
    return {
      segment: { ...base, kind: "arc" as const, center: arc.center, sweep: arc.sweep },
      rule: tangentRule(path, options),
      endpoint: arc.to,
      capped: arc.capped,
    };
  const line = lineTarget(path, start, target, options);
  return {
    segment: { ...base, kind: "line" as const },
    rule: line.rule,
    endpoint: line.target,
    capped: false,
  };
}

function tangentRule(path: PenGeometry, options: Options): PenRule | null {
  const previous = path.segments.at(-1);
  return previous
    ? {
        id: options.ids.rule,
        kind: "tangent",
        first: previous.id,
        second: options.ids.segment,
      }
    : null;
}

function nextArc(path: PenGeometry, target: PenPoint, options: Options) {
  const previous = path.segments.at(-1);
  const start = path.anchors.at(-1);
  const arc =
    options.arc && previous && start
      ? tangentArc(start, segmentDirection(path, previous, true), target)
      : null;
  if (options.close && arc?.capped)
    throw new Error(
      "This arc cannot close at the first anchor within a half circle. Use a line or another anchor.",
    );
  return arc;
}

function drawingMessage(capped: boolean, fallback: boolean): string | null {
  if (capped) return "Arc capped at 180°. The square marks its actual endpoint.";
  return fallback ? "Straight line: no tangent arc at this point." : null;
}

import type { PenGeometry, PenPoint } from "./model";
import { validatePenGeometry, validatePenPoint } from "./validation";

type NumericCurve =
  | { kind: "line"; from: number; to: number }
  | { kind: "arc"; from: number; to: number; center: number; sweep: 0 | 1 };

type NumericRule =
  | { kind: "horizontal" | "vertical"; segment: number }
  | { kind: "perpendicular" | "tangent"; first: number; second: number };

export type NumericRequest = {
  points: [number, number][];
  curves: NumericCurve[];
  rules: NumericRule[];
  drag: { point: number; to: [number, number] } | null;
  full: boolean;
};

export type PenDrag = { id: string; to: PenPoint };

function indexOf(ids: Map<string, number>, id: string): number {
  const index = ids.get(id);
  if (index === undefined) throw new Error("The solver references an unknown pen identity.");
  return index;
}

export function solverInput(
  path: PenGeometry,
  drag: PenDrag | null,
  full: boolean,
): NumericRequest {
  validatePenGeometry(path);
  const points: [number, number][] = path.anchors.map((p) => [p.x, p.y]);
  const anchors = new Map(path.anchors.map((p, i) => [p.id, i]));
  const segments = new Map(path.segments.map((s, i) => [s.id, i]));
  const curves: NumericCurve[] = path.segments.map((segment) => {
    const from = indexOf(anchors, segment.from);
    const to = indexOf(anchors, segment.to);
    if (segment.kind === "line") return { kind: "line", from, to };
    const center = points.push([segment.center.x, segment.center.y]) - 1;
    return { kind: "arc", from, to, center, sweep: segment.sweep };
  });
  const rules: NumericRule[] = path.rules.map((rule) =>
    "segment" in rule
      ? { kind: rule.kind, segment: indexOf(segments, rule.segment) }
      : {
          kind: rule.kind,
          first: indexOf(segments, rule.first),
          second: indexOf(segments, rule.second),
        },
  );
  if (drag) validatePenPoint(drag.to);
  return {
    points,
    curves,
    rules,
    full,
    drag: drag ? { point: indexOf(anchors, drag.id), to: [drag.to.x, drag.to.y] } : null,
  };
}

export function solverGeometry(path: PenGeometry, points: PenPoint[]): PenGeometry {
  let centerIndex = path.anchors.length;
  const expected = centerIndex + path.segments.filter((s) => s.kind === "arc").length;
  if (points.length !== expected) throw new Error("The solver returned an incomplete pen path.");
  const anchors = path.anchors.map((anchor, index) => ({
    ...anchor,
    ...points[index],
  }));
  const segments = path.segments.map((segment) =>
    segment.kind === "line" ? { ...segment } : { ...segment, center: points[centerIndex++] },
  );
  const result = { ...path, anchors, segments };
  validatePenGeometry(result);
  return result;
}

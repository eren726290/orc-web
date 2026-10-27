import type { PenGeometry, PenSegment } from "../../shared/pen/model";

export function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function close(actual: number, expected: number, message: string, tolerance = 1e-5): void {
  check(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message}: ${actual} versus ${expected}`,
  );
}

export function throws(run: () => unknown, message: string): void {
  let refused = false;
  try {
    run();
  } catch {
    refused = true;
  }
  check(refused, message);
}

function direction(path: PenGeometry, segment: PenSegment, end: boolean): [number, number] {
  const a = path.anchors.find((p) => p.id === segment.from);
  const b = path.anchors.find((p) => p.id === segment.to);
  check(a && b, "Oracle anchor missing.");
  if (segment.kind === "line") {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    check(length > 1e-9, "Oracle found a collapsed line.");
    return [(b.x - a.x) / length, (b.y - a.y) / length];
  }
  const p = end ? b : a;
  const radius = Math.hypot(p.x - segment.center.x, p.y - segment.center.y);
  const orientation = segment.sweep === 1 ? 1 : -1;
  return [
    (orientation * (segment.center.y - p.y)) / radius,
    (orientation * (p.x - segment.center.x)) / radius,
  ];
}

export function assertRules(path: PenGeometry): void {
  for (const rule of path.rules) {
    if ("segment" in rule) {
      const segment = path.segments.find((s) => s.id === rule.segment);
      check(segment, "Oracle rule segment missing.");
      const d = direction(path, segment, false);
      close(rule.kind === "horizontal" ? d[1] : d[0], 0, rule.kind);
    } else {
      const first = path.segments.find((s) => s.id === rule.first);
      const second = path.segments.find((s) => s.id === rule.second);
      check(first && second, "Oracle join segment missing.");
      const a = direction(path, first, true);
      const b = direction(path, second, false);
      close(a[0] * b[0] + a[1] * b[1], rule.kind === "tangent" ? 1 : 0, rule.kind);
    }
  }
}

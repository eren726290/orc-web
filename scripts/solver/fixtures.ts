import type { PenGeometry, PenRule } from "../../shared/pen/model";

export function lineFixture(): PenGeometry {
  return {
    anchors: [
      { id: "a1", x: 10, y: 10 },
      { id: "a2", x: 80, y: 10 },
    ],
    segments: [{ id: "s1", kind: "line", from: "a1", to: "a2" }],
    rules: [{ id: "r1", kind: "horizontal", segment: "s1" }],
    closed: false,
  };
}

export function cornerFixture(): PenGeometry {
  return {
    anchors: [
      { id: "a1", x: 10, y: 10 },
      { id: "a2", x: 80, y: 10 },
      { id: "a3", x: 80, y: 60 },
    ],
    segments: [
      { id: "s1", kind: "line", from: "a1", to: "a2" },
      { id: "s2", kind: "line", from: "a2", to: "a3" },
    ],
    rules: [
      { id: "r1", kind: "horizontal", segment: "s1" },
      { id: "r2", kind: "vertical", segment: "s2" },
      { id: "r3", kind: "perpendicular", first: "s1", second: "s2" },
    ],
    closed: false,
  };
}

export function arcFixture(sign = 1): PenGeometry {
  return {
    anchors: [
      { id: "a1", x: -50, y: 0 },
      { id: "a2", x: 0, y: 0 },
      { id: "a3", x: 30, y: 30 * sign },
      { id: "a4", x: 30, y: 80 * sign },
    ],
    segments: [
      { id: "s1", kind: "line", from: "a1", to: "a2" },
      {
        id: "s2",
        kind: "arc",
        from: "a2",
        to: "a3",
        center: { x: 0, y: 30 * sign },
        sweep: sign === 1 ? 1 : 0,
      },
      { id: "s3", kind: "line", from: "a3", to: "a4" },
    ],
    rules: [
      { id: "r1", kind: "horizontal", segment: "s1" },
      { id: "r2", kind: "tangent", first: "s1", second: "s2" },
      { id: "r3", kind: "tangent", first: "s2", second: "s3" },
    ],
    closed: false,
  };
}

export function oppositeArcsFixture(): PenGeometry {
  return {
    anchors: [
      { id: "a1", x: -40, y: 0 },
      { id: "a2", x: 0, y: 0 },
      { id: "a3", x: 20, y: 20 },
      { id: "a4", x: 40, y: 40 },
      { id: "a5", x: 80, y: 40 },
    ],
    segments: [
      { id: "s1", kind: "line", from: "a1", to: "a2" },
      { id: "s2", kind: "arc", from: "a2", to: "a3", center: { x: 0, y: 20 }, sweep: 1 },
      { id: "s3", kind: "arc", from: "a3", to: "a4", center: { x: 40, y: 20 }, sweep: 0 },
      { id: "s4", kind: "line", from: "a4", to: "a5" },
    ],
    rules: [
      { id: "r1", kind: "tangent", first: "s1", second: "s2" },
      { id: "r2", kind: "tangent", first: "s2", second: "s3" },
      { id: "r3", kind: "tangent", first: "s3", second: "s4" },
    ],
    closed: false,
  };
}

export function badgeFixture(): PenGeometry {
  return {
    anchors: [
      { id: "a1", x: 0, y: 0 },
      { id: "a2", x: 100, y: 0 },
      { id: "a3", x: 100, y: 200 },
      { id: "a4", x: 0, y: 200 },
    ],
    segments: [
      { id: "s1", kind: "line", from: "a1", to: "a2" },
      { id: "s2", kind: "arc", from: "a2", to: "a3", center: { x: 100, y: 100 }, sweep: 1 },
      { id: "s3", kind: "line", from: "a3", to: "a4" },
      { id: "s4", kind: "line", from: "a4", to: "a1" },
    ],
    rules: [
      { id: "r1", kind: "horizontal", segment: "s1" },
      { id: "r2", kind: "horizontal", segment: "s3" },
      { id: "r3", kind: "vertical", segment: "s4" },
      { id: "r4", kind: "tangent", first: "s1", second: "s2" },
      { id: "r5", kind: "tangent", first: "s2", second: "s3" },
    ],
    closed: true,
  };
}

export function reverseFixture(path: PenGeometry): PenGeometry {
  const rules: PenRule[] = path.rules.map((rule) =>
    "segment" in rule ? { ...rule } : { ...rule, first: rule.second, second: rule.first },
  );
  return {
    ...path,
    anchors: [...path.anchors].reverse(),
    rules,
    segments: [...path.segments]
      .reverse()
      .map((segment) =>
        segment.kind === "line"
          ? { ...segment, from: segment.to, to: segment.from }
          : { ...segment, from: segment.to, to: segment.from, sweep: segment.sweep === 1 ? 0 : 1 },
      ),
  };
}

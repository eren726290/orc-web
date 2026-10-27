export type PenPoint = { x: number; y: number };

export type PenAnchor = PenPoint & { id: string };

export type PenSegment = { id: string; from: string; to: string } & (
  | { kind: "line" }
  | { kind: "arc"; center: PenPoint; sweep: 0 | 1 }
);

export type PenRule = { id: string } & (
  | { kind: "horizontal" | "vertical"; segment: string }
  | { kind: "perpendicular" | "tangent"; first: string; second: string }
);

export type PenGeometry = {
  anchors: PenAnchor[];
  segments: PenSegment[];
  rules: PenRule[];
  closed: boolean;
};

export type PenRecord = PenGeometry & { version: 1; geometryHash: string };

export const penLimits = {
  points: 20_000,
  curves: 20_000,
  rules: 40_000,
  coordinate: 1e9,
};
export const penTolerance = 1e-6;
export const penMinimumLength = 1e-9;

export function penAnchor(path: PenGeometry, id: string): PenAnchor {
  const anchor = path.anchors.find((entry) => entry.id === id);
  if (!anchor) throw new Error("The pen path references an unknown anchor.");
  return anchor;
}

export function penSegment(path: PenGeometry, id: string): PenSegment {
  const segment = path.segments.find((entry) => entry.id === id);
  if (!segment) throw new Error("The pen rule references an unknown segment.");
  return segment;
}

export function penIdentity(kind: "a" | "s" | "r"): string {
  return `${kind}${crypto.randomUUID()}`;
}

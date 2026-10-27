import { distance, penNumber } from "./geometry";
import { penAnchor, type PenGeometry, type PenRecord, type PenSegment } from "./model";
import { validatePenGeometry } from "./validation";

function segmentData(path: PenGeometry, segment: PenSegment): string {
  const to = penAnchor(path, segment.to);
  const end = `${penNumber(to.x)} ${penNumber(to.y)}`;
  if (segment.kind === "line") return `L ${end}`;
  const from = penAnchor(path, segment.from);
  const size = distance(segment.center, from);
  validateEncodedCircle(segment, from, to, size);
  const radius = penNumber(size);
  return `A ${radius} ${radius} 0 0 ${segment.sweep} ${end}`;
}

function validateEncodedCircle(
  arc: Extract<PenSegment, { kind: "arc" }>,
  from: { x: number; y: number },
  to: { x: number; y: number },
  radius: number,
): void {
  const chord = distance(from, to);
  const height = Math.sqrt(Math.max(0, radius * radius - (chord * chord) / 4));
  const side = arc.sweep === 1 ? 1 : -1;
  const center = {
    x: (from.x + to.x) / 2 - (side * (to.y - from.y) * height) / chord,
    y: (from.y + to.y) / 2 + (side * (to.x - from.x) * height) / chord,
  };
  const tolerance =
    1e-6 + 64 * Number.EPSILON * Math.max(radius, Math.abs(center.x), Math.abs(center.y));
  if (distance(center, arc.center) > tolerance)
    throw new Error("The encoded SVG arc cannot preserve its circle.");
}

export function penPathData(path: PenGeometry): string {
  validatePenGeometry(path);
  const first = path.anchors[0];
  const parts = [`M ${penNumber(first.x)} ${penNumber(first.y)}`];
  for (const segment of path.segments) parts.push(segmentData(path, segment));
  if (path.closed) parts.push("Z");
  return parts.join(" ");
}

export function penGeometryHash(data: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(data)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function penRecord(path: PenGeometry): PenRecord {
  return {
    ...path,
    version: 1,
    geometryHash: penGeometryHash(penPathData(path)),
  };
}

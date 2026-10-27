import { boolean, knownFields, object, string } from "../validation";
import {
  penLimits,
  type PenAnchor,
  type PenPoint,
  type PenRecord,
  type PenRule,
  type PenSegment,
} from "./model";
import { penGeometryHash, penPathData } from "./source";
import { validatePenPoint } from "./validation";

function point(value: unknown): PenPoint {
  const input = object(value);
  if (typeof input.x !== "number" || typeof input.y !== "number")
    throw new Error("Expected numeric pen coordinates.");
  const result = { x: input.x, y: input.y };
  validatePenPoint(result);
  return result;
}

function anchor(value: unknown): PenAnchor {
  const input = object(value);
  knownFields(input, ["id", "x", "y"], "pen anchor");
  return { id: string(input.id), ...point(input) };
}

function segment(value: unknown): PenSegment {
  const input = object(value);
  const base = {
    id: string(input.id),
    from: string(input.from),
    to: string(input.to),
  };
  if (input.kind === "line") {
    knownFields(input, ["id", "kind", "from", "to"], "pen line");
    return { ...base, kind: "line" };
  }
  if (input.kind !== "arc" || (input.sweep !== 0 && input.sweep !== 1))
    throw new Error("Unsupported pen segment or arc direction.");
  knownFields(input, ["id", "kind", "from", "to", "center", "sweep"], "pen arc");
  knownFields(object(input.center), ["x", "y"], "pen arc center");
  return {
    ...base,
    kind: "arc",
    center: point(input.center),
    sweep: input.sweep,
  };
}

function rule(value: unknown): PenRule {
  const input = object(value);
  const id = string(input.id);
  if (input.kind === "horizontal" || input.kind === "vertical") {
    knownFields(input, ["id", "kind", "segment"], "pen axis rule");
    return { id, kind: input.kind, segment: string(input.segment) };
  }
  if (input.kind !== "perpendicular" && input.kind !== "tangent")
    throw new Error("Unsupported pen rule.");
  knownFields(input, ["id", "kind", "first", "second"], "pen join rule");
  return {
    id,
    kind: input.kind,
    first: string(input.first),
    second: string(input.second),
  };
}

function entries<T>(value: unknown, maximum: number, parse: (value: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length > maximum)
    throw new Error("Invalid pen record collection.");
  return value.map(parse);
}

export function parsePenRecord(value: unknown): PenRecord {
  const input = object(value);
  if (input.version !== 1)
    throw new Error("Unsupported pen record version. This build cannot preserve that data.");
  knownFields(
    input,
    ["version", "geometryHash", "anchors", "segments", "rules", "closed"],
    "pen record",
  );
  const record: PenRecord = {
    version: 1,
    geometryHash: string(input.geometryHash),
    closed: boolean(input.closed),
    anchors: entries(input.anchors, penLimits.points, anchor),
    segments: entries(input.segments, penLimits.curves, segment),
    rules: entries(input.rules, penLimits.rules, rule),
  };
  if (record.geometryHash !== penGeometryHash(penPathData(record)))
    throw new Error("The pen record geometry hash does not match its path.");
  return record;
}

import type { Styles } from "../document/model";
import { penLimits, type PenRecord } from "./model";
import { penPathData } from "./source";
import { penViewport, validatePenViewport } from "./viewport";

export function penSVG(record: PenRecord): string {
  return `<svg><path d="${penPathData(record)}"/></svg>`;
}

export function penStroke(attributes: Record<string, string>): number {
  const width = attributes["stroke-width"] ?? "1";
  const number = Number(width);
  if (!width.trim() || !Number.isFinite(number) || number < 0 || number >= penLimits.coordinate)
    throw new Error("Use a finite nonnegative pen stroke width.");
  if (attributes["stroke-linecap"] !== "round" || attributes["stroke-linejoin"] !== "round")
    throw new Error("This pen record requires round stroke caps and joins.");
  return attributes.stroke === "none" ? 0 : number;
}

export function validatePenArtwork(node: {
  source: string;
  pen: PenRecord;
  attributes: Record<string, string>;
  style: Styles;
  children: string[];
}): void {
  if (node.children.length || node.source !== penSVG(node.pen))
    throw new Error("The SVG source does not match its pen record.");
  const unsupported = [
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "vector-effect",
    "marker",
    "marker-start",
    "marker-mid",
    "marker-end",
  ];
  if (
    unsupported.some((key) => Object.hasOwn(node.style, key)) ||
    unsupported.slice(3).some((key) => Object.hasOwn(node.attributes, key))
  )
    throw new Error(
      "This SVG styling cannot preserve editable pen bounds. Use ordinary SVG source.",
    );
  validatePenViewport(
    node.pen,
    penStroke(node.attributes),
    penViewport(node.attributes.viewBox ?? ""),
  );
}

export function validatePenDimensions(style: Styles): void {
  for (const axis of ["width", "height"]) {
    const value = style[axis] ?? "";
    if (
      !/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/iu.test(value) ||
      !(Number.parseFloat(value) > 0) ||
      !Number.isFinite(Number.parseFloat(value))
    )
      throw new Error("Choose Fixed width and height before editing this pen path.");
  }
}

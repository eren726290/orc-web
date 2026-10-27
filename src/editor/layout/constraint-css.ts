export type ConstraintMode = "start" | "end" | "both" | "center";
export type ConstraintAxis = "width" | "height";
export const constraintAxes = {
  width: {
    start: "left",
    end: "right",
    margin: "margin-left",
    endMargin: "margin-right",
    alignment: "justify-self",
  },
  height: {
    start: "top",
    end: "bottom",
    margin: "margin-top",
    endMargin: "margin-bottom",
    alignment: "align-self",
  },
} as const;
const pixel = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/iu;
export function constraintNumber(value: string) {
  return pixel.test(value) ? Number.parseFloat(value) : null;
}

export function constraintMode(
  style: CSSStyleDeclaration,
  axis: ConstraintAxis,
): ConstraintMode | null {
  const edges = constraintAxes[axis],
    start = style.getPropertyValue(edges.start),
    end = style.getPropertyValue(edges.end);
  const auto = (value: string) => !value || value === "auto";
  const alignment = style.getPropertyValue(edges.alignment);
  if (alignment === "unsafe center")
    return fixedCenter(start, end, style.getPropertyValue(axis)) ? "center" : null;
  if (auto(end)) return constraintNumber(start) !== null || auto(start) ? "start" : null;
  if (constraintNumber(end) === null) return null;
  if (auto(start)) return "end";
  if (constraintNumber(start) === null) return null;
  return ["", "auto", "stretch"].includes(style.getPropertyValue(axis)) ? "both" : "start";
}

export function constraintAlignments(style: CSSStyleDeclaration) {
  return Object.values(constraintAxes)
    .map((axis) => axis.alignment)
    .filter((key) => ["normal", "stretch", "unsafe center"].includes(style.getPropertyValue(key)));
}

function fixedCenter(start: string, end: string, size: string) {
  const first = constraintNumber(start),
    last = constraintNumber(end);
  return first !== null && last !== null && first + last === 0 && constraintNumber(size) !== null;
}

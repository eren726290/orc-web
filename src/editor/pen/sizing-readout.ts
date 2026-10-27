import type { DesignNode } from "../../../shared/document/model";
import type { readSizing, SizingAxis } from "../layout/sizing";
import { penScale } from "./transforms";

export function penSizingReadout(
  node: DesignNode,
  axis: SizingAxis,
): ReturnType<typeof readSizing> | null {
  if (node.kind !== "svg" || !node.pen) return null;
  try {
    penScale({ ...node, pen: node.pen });
  } catch {
    return null;
  }
  return {
    mode: "Fixed",
    editable: false,
    convertible: false,
    fit: false,
    fill: false,
    value: String(Number.parseFloat(node.style[axis])),
    message: "Use Scale (%) to resize this path proportionally.",
  };
}

import type { DesignNode } from "../../../shared/document/model";
import { objectParent, flowStyle } from "./layout-box";
import { parentRelativePosition } from "./coordinates";
import { readFlexSizing } from "./sizing";

export function readPositionOwner(
  element: HTMLElement | SVGElement,
  parent: DesignNode | undefined,
) {
  const parentElement = objectParent(element);
  if (!parent || !parentElement || parentElement.dataset.orcId !== parent.id) return null;
  const flow = readFlexSizing(element, getComputedStyle(element), flowStyle(parentElement));
  if (!flow.direction) return null;
  const position = parentRelativePosition(element);
  return {
    id: parent.id,
    name: parent.name,
    left: position?.left ?? "Edit source",
    top: position?.top ?? "Edit source",
  };
}

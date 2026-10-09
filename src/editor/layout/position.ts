import type { DesignNode } from "../../../shared/document/model";
import { parentRelativePosition } from "./coordinates";
import { readFlexSizing } from "./sizing";

export function readPositionOwner(
  element: HTMLElement | SVGElement,
  parent: DesignNode | undefined,
) {
  const parentElement = element.parentElement;
  if (!parent || !parentElement || parentElement.dataset.orcId !== parent.id) return null;
  const flow = readFlexSizing(
    element.style,
    getComputedStyle(element),
    getComputedStyle(parentElement),
  );
  if (!flow.direction) return null;
  const position = parentRelativePosition(element);
  return {
    id: parent.id,
    name: parent.name,
    left: position?.left ?? "Edit source",
    top: position?.top ?? "Edit source",
  };
}

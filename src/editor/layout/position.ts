import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { objectParent, flowStyle } from "./layout-box";
import { readConstraints } from "./constraints";
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

export function readConstraintPosition(
  document: DesignDocument,
  node: DesignNode,
  element: HTMLElement | SVGElement,
) {
  const constraints = readConstraints(document, node);
  const position = constraints && parentRelativePosition(element);
  if (!constraints || !position) return null;
  const derived = (mode: string | null) => mode === "end" || mode === "center";
  return {
    left: constraints.width.editable && derived(constraints.width.mode) ? position.left : null,
    top: constraints.height.editable && derived(constraints.height.mode) ? position.top : null,
  };
}

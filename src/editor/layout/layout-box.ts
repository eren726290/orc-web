import {
  columnFlowAttribute,
  columnFlowStyle,
  columnLayout,
  columnLayoutAttribute,
  columnMarker,
  columnVersion,
} from "../../../shared/source/intrinsic-column";

const flowCSS = Object.entries(columnFlowStyle)
  .map(([key, value]) => `${key}: ${value};`)
  .join(" ");

export function flowBox(element: Element): Element {
  if (!(element instanceof HTMLElement)) return element;
  if (!projectedOuter(element)) return element;
  const flow = element.firstElementChild;
  if (
    !(flow instanceof HTMLDivElement) ||
    flow.getAttribute(columnFlowAttribute) !== columnLayout ||
    Array.from(flow.attributes).some(
      (attribute) => ![columnFlowAttribute, "style"].includes(attribute.name),
    ) ||
    flow.style.cssText !== flowCSS
  )
    return element;
  return flow;
}

function projectedOuter(element: HTMLElement) {
  return (
    element.getAttribute(columnLayoutAttribute) === columnLayout &&
    element.style.getPropertyValue(columnMarker).trim() === columnVersion &&
    element.style.display === "grid" &&
    element.style.gridTemplateRows === "minmax(0px, 1fr)" &&
    element.style.gridTemplateColumns === "minmax(0px, 1fr)" &&
    element.children.length === 1
  );
}

export function objectParent(element: Element): HTMLElement | null {
  const parent = element.parentElement;
  const outer = parent?.parentElement;
  return parent && outer && flowBox(outer) === parent ? outer : parent;
}

export function flowStyle(element: Element) {
  return getComputedStyle(flowBox(element));
}

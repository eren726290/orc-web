import type { AtomicMutation, Mutation } from "../../../shared/commands/commands";
import {
  containsNode,
  isLocked,
  type DesignDocument,
  type DesignNode,
} from "../../../shared/document/model";

export function keyboardMovement(
  document: DesignDocument,
  selected: string[],
  delta: { x: number; y: number },
  surface: HTMLElement,
): Mutation | null {
  if (!selected.length) return null;
  for (const id of selected)
    if (isLocked(document, id)) throw new Error("Unlock the object or its parent before moving.");
  const roots = selected.filter(
    (id) => !selected.some((other) => other !== id && containsNode(document, other, id)),
  );
  const objects = roots.map((id) => renderedObject(document, id, surface));
  for (const object of objects) {
    if (!object.element.getClientRects().length)
      throw new Error("This object's rendered position is unavailable.");
    checkMovementCoordinates(object.element, surface);
  }
  const flows = objects.map((object) => flowDirection(document, object, surface));
  if (objects.length === 1 && flows[0])
    return reorderFlow(document, objects[0].node, flows[0], delta, surface);
  if (flows.some(Boolean))
    throw new Error("Select one Flex child to reorder, or compatible Free objects to move.");
  const mutations: AtomicMutation[] = objects.map((object) => ({
    kind: "style",
    id: object.node.id,
    values: movedStyle(object, delta),
  }));
  return { kind: "batch", mutations };
}

function renderedObject(document: DesignDocument, id: string, surface: HTMLElement) {
  const node = document.nodes[id];
  const element = surface.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
  if (!node || !(element instanceof HTMLElement || element instanceof SVGElement))
    throw new Error("This object's rendered position is unavailable.");
  return { node, element, computed: getComputedStyle(element) };
}

function checkMovementCoordinates(element: Element, surface: HTMLElement) {
  for (
    let parent = element.parentElement;
    parent && parent !== surface;
    parent = parent.parentElement
  ) {
    if (parent.classList.contains("canvas-world")) continue;
    const style = getComputedStyle(parent);
    if (
      ["transform", "translate", "rotate", "scale", "perspective"].some(
        (property) => style.getPropertyValue(property) !== "none",
      ) ||
      !["1", "normal"].includes(style.zoom)
    )
      throw new Error("Use Code to move objects inside a transformed parent.");
  }
}

function flowChildren(document: DesignDocument, parent: DesignNode, surface: HTMLElement) {
  return parent.children
    .filter((id) => document.nodes[id].visible)
    .map((id) => renderedObject(document, id, surface))
    .filter(
      ({ element, computed }) =>
        element.getClientRects().length && !["absolute", "fixed"].includes(computed.position),
    );
}

function flowDirection(
  document: DesignDocument,
  object: ReturnType<typeof renderedObject>,
  surface: HTMLElement,
): "row" | "column" | null {
  if (object.node.parentId === null || ["absolute", "fixed"].includes(object.computed.position))
    return null;
  const parent = renderedObject(document, object.node.parentId, surface);
  if (["grid", "inline-grid", "contents"].includes(parent.computed.display))
    throw new Error("Use Code to edit this object's source-controlled layout parent.");
  if (!["flex", "inline-flex"].includes(parent.computed.display)) return null;
  const direction = parent.computed.flexDirection;
  if (
    !["row", "column"].includes(direction) ||
    parent.computed.direction !== "ltr" ||
    parent.computed.writingMode !== "horizontal-tb"
  )
    throw new Error("Use Code to reorder this imported Flex direction.");
  if (flowChildren(document, parent.node, surface).some(({ computed }) => computed.order !== "0"))
    throw new Error("Use Code to edit this source-controlled Flex order.");
  return direction === "row" ? "row" : "column";
}

function reorderFlow(
  document: DesignDocument,
  node: DesignNode,
  direction: "row" | "column",
  delta: { x: number; y: number },
  surface: HTMLElement,
): AtomicMutation | null {
  const step = Math.sign(direction === "row" ? delta.x : delta.y);
  if (!step || node.parentId === null) return null;
  const siblings = document.nodes[node.parentId].children;
  const flow = flowChildren(document, document.nodes[node.parentId], surface).map(
    ({ node: child }) => child.id,
  );
  const neighbor = flow[flow.indexOf(node.id) + step];
  if (!neighbor) return null;
  return {
    kind: "reorder",
    id: node.id,
    parentId: node.parentId,
    index: siblings.indexOf(neighbor),
  };
}

function movedStyle(object: ReturnType<typeof renderedObject>, delta: { x: number; y: number }) {
  const { element, computed } = object;
  if (!["static", "relative", "absolute"].includes(computed.position))
    throw new Error("Use Code to edit this object's positioning.");
  if (
    ["inset-inline-start", "inset-inline-end", "inset-block-start", "inset-block-end"].some(
      (property) => element.style.getPropertyValue(property),
    )
  )
    throw new Error("Use Code to edit this source-controlled inset relationship.");
  if (computed.position === "static")
    return {
      position: withPriority(element.style, "position", "relative"),
      left: withPriority(element.style, "left", `${delta.x}px`),
      top: withPriority(element.style, "top", `${delta.y}px`),
      right: withPriority(element.style, "right", "auto"),
      bottom: withPriority(element.style, "bottom", "auto"),
    };
  return {
    ...movedAxis(object, "left", "right", delta.x),
    ...movedAxis(object, "top", "bottom", delta.y),
  };
}

function movedAxis(
  object: ReturnType<typeof renderedObject>,
  start: "left" | "top",
  end: "right" | "bottom",
  delta: number,
) {
  if (!delta) return {};
  const { element, computed } = object;
  const values: Record<string, string> = {};
  for (const property of [start, end]) {
    const change = property === start ? delta : -delta;
    const value = element.style.getPropertyValue(property);
    if (["", "auto"].includes(value)) continue;
    if (computed.getPropertyValue(property) === "auto")
      throw new Error("This position cannot be resolved. Review its value in Code.");
    values[property] = withPriority(element.style, property, shiftedValue(value, change));
  }
  if (!Object.keys(values).length) {
    const value = computed.position === "relative" ? "0px" : computed.getPropertyValue(start);
    if (["", "auto"].includes(value)) throw new Error("This object's position is unavailable.");
    values[start] = withPriority(element.style, start, shiftedValue(value, delta));
  }
  return values;
}

function shiftedValue(value: string, delta: number) {
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:px)?$/u.test(value))
    return `${Number.parseFloat(value) + delta}px`;
  return `calc(${value} ${delta < 0 ? "-" : "+"} ${Math.abs(delta)}px)`;
}

function withPriority(style: CSSStyleDeclaration, property: string, value: string) {
  return value + (style.getPropertyPriority(property) ? " !important" : "");
}

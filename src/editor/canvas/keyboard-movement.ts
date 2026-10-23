import { flowStyle } from "../layout/layout-box";
import { prepareFlexDrop } from "./pointer-layout";
import { hasCoordinateTransform } from "../layout/coordinates";
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
    values: movedStyle({ style: object.element.style, computed: object.computed }, delta),
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

export function checkMovementCoordinates(element: Element, surface: HTMLElement) {
  for (
    let parent = element.parentElement;
    parent && parent !== surface;
    parent = parent.parentElement
  ) {
    if (parent.classList.contains("canvas-world")) continue;
    if (hasCoordinateTransform(getComputedStyle(parent)))
      throw new Error("Use Code to move objects inside a transformed parent.");
  }
}

export function flowChildren(document: DesignDocument, parent: DesignNode, surface: HTMLElement) {
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
  parent.computed = flowStyle(parent.element);
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

type Position = { style: CSSStyleDeclaration; computed: CSSStyleDeclaration };

function movedStyle(object: Position, delta: { x: number; y: number }) {
  const { style, computed } = object;
  if (!["static", "relative", "absolute"].includes(computed.position))
    throw new Error("Use Code to edit this object's positioning.");
  if (
    ["inset-inline-start", "inset-inline-end", "inset-block-start", "inset-block-end"].some(
      (property) => style.getPropertyValue(property),
    )
  )
    throw new Error("Use Code to edit this source-controlled inset relationship.");
  if (computed.position === "static")
    return {
      position: withPriority(style, "position", "relative"),
      left: withPriority(style, "left", `${delta.x}px`),
      top: withPriority(style, "top", `${delta.y}px`),
      right: withPriority(style, "right", "auto"),
      bottom: withPriority(style, "bottom", "auto"),
    };
  return {
    ...movedAxis(object, "left", "right", delta.x),
    ...movedAxis(object, "top", "bottom", delta.y),
  };
}

function movedAxis(
  object: Position,
  start: "left" | "top",
  end: "right" | "bottom",
  delta: number,
) {
  if (!delta) return {};
  const { style, computed } = object;
  const values: Record<string, string> = {};
  for (const property of [start, end]) {
    const change = property === start ? delta : -delta;
    const value = style.getPropertyValue(property);
    if (["", "auto"].includes(value)) continue;
    if (computed.getPropertyValue(property) === "auto")
      throw new Error("This position cannot be resolved. Review its value in Code.");
    values[property] = withPriority(style, property, shiftedValue(value, change));
  }
  if (!Object.keys(values).length) {
    const value = computed.position === "relative" ? "0px" : computed.getPropertyValue(start);
    if (["", "auto"].includes(value)) throw new Error("This object's position is unavailable.");
    values[start] = withPriority(style, start, shiftedValue(value, delta));
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

export function preparePointerMovement(
  document: DesignDocument,
  selected: string[],
  surface: HTMLElement,
  scale: number,
) {
  keyboardMovement(document, selected, { x: 0, y: 0 }, surface);
  const roots = selected.filter(
    (id) => !selected.some((other) => other !== id && containsNode(document, other, id)),
  );
  const flow = preparePointerFlow(document, roots, surface, scale);
  if (flow) return flow;
  const positions = roots.map((id) => frozenPosition(renderedObject(document, id, surface)));
  return (delta: {
    x: number;
    y: number;
  }): { kind: "batch"; mutations: Extract<AtomicMutation, { kind: "style" }>[] } => ({
    kind: "batch",
    mutations: positions.map((position) => ({
      kind: "style",
      id: position.id,
      values: movedStyle(position, delta),
    })),
  });
}

function frozenPosition(object: ReturnType<typeof renderedObject>) {
  const style = window.document.createElement("div").style;
  style.cssText = object.element.style.cssText;
  const computed = window.document.createElement("div").style;
  for (const property of ["position", "left", "right", "top", "bottom"])
    computed.setProperty(property, object.computed.getPropertyValue(property));
  return { id: object.node.id, style, computed };
}

function preparePointerFlow(
  document: DesignDocument,
  roots: string[],
  surface: HTMLElement,
  scale: number,
) {
  if (roots.length !== 1) return null;
  const object = renderedObject(document, roots[0], surface);
  const direction = flowDirection(document, object, surface);
  const parentId = object.node.parentId;
  if (!direction || parentId === null) return null;
  const parent = renderedObject(document, parentId, surface);
  if (
    parent.computed.flexWrap === "wrap-reverse" ||
    (direction === "column" && parent.computed.flexWrap !== "nowrap")
  )
    throw new Error("Use Code to move objects in this wrapping direction.");
  const bounds = object.element.getBoundingClientRect();
  const drop = prepareFlexDrop({
    id: object.node.id,
    parentId,
    siblings: parent.node.children,
    direction,
    boxes: flowChildren(document, parent.node, surface).map(({ node, element }) => ({
      id: node.id,
      bounds: element.getBoundingClientRect(),
    })),
  });
  return (delta: { x: number; y: number }) =>
    drop({
      x: bounds.x + bounds.width / 2 + delta.x * scale,
      y: bounds.y + bounds.height / 2 + delta.y * scale,
    });
}

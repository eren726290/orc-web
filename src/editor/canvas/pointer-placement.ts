import { containsNode, isLocked, type DesignDocument } from "../../../shared/document/model";
import { flowChildren, preparePointerMovement } from "./keyboard-movement";
import { checkFrameCoordinates, frameReference, prepareFreePlacement } from "./pointer-coordinates";
import { prepareFlowPlacement } from "./flow-placement";
import { prepareFlexDrop, type PointerPreview } from "./pointer-layout";

type Point = { x: number; y: number };

export function preparePointerPlacement(
  document: DesignDocument,
  selected: string[],
  surface: HTMLElement,
  scale: number,
  origin: Point,
): (delta: Point) => PointerPreview {
  const movement = preparePointerMovement(document, selected, surface, scale);
  const roots = selected.filter(
    (id) => !selected.some((other) => other !== id && containsNode(document, other, id)),
  );
  if (roots.length !== 1) return movement;
  const node = document.nodes[roots[0]];
  const element = surface.querySelector(`[data-orc-id="${CSS.escape(node.id)}"]`);
  const world = surface.querySelector(".canvas-world");
  if (
    !(element instanceof HTMLElement || element instanceof SVGElement) ||
    !(world instanceof HTMLElement)
  )
    throw new Error("This object's rendered placement is unavailable.");
  const free = prepareFreePlacement(node, element, world, scale);
  const flow = prepareFlowPlacement(node, element);
  const plans = new Map<string | null, (delta: Point) => PointerPreview>();
  return (delta) => {
    const point = { x: origin.x + delta.x * scale, y: origin.y + delta.y * scale };
    const parentId = receivingFrame(document, node.id, surface, point);
    if (parentId === node.parentId) return movement(delta);
    let plan = plans.get(parentId);
    if (!plan) {
      plan = prepareDestination(document, node.id, parentId, surface, scale, origin, free, flow);
      plans.set(parentId, plan);
    }
    return plan(delta);
  };
}

function receivingFrame(document: DesignDocument, id: string, surface: HTMLElement, point: Point) {
  for (const element of window.document.elementsFromPoint(point.x, point.y)) {
    if (!surface.contains(element)) continue;
    const object = element.closest("[data-orc-id]");
    const hit = object?.getAttribute("data-orc-id");
    if (hit && containsNode(document, id, hit)) continue;
    const parentId = receivingAncestor(document, document.nodes[id].parentId, object);
    if (parentId) return parentId;
  }
  return null;
}

function receivingAncestor(
  document: DesignDocument,
  currentParent: string | null,
  object: Element | null,
) {
  while (object) {
    const id = object.getAttribute("data-orc-id");
    if (id && (id === currentParent || document.nodes[id]?.kind === "frame")) return id;
    object = object.parentElement?.closest("[data-orc-id]") ?? null;
  }
  return null;
}

function prepareDestination(
  document: DesignDocument,
  id: string,
  parentId: string | null,
  surface: HTMLElement,
  scale: number,
  origin: Point,
  free: ReturnType<typeof prepareFreePlacement>,
  flow: ReturnType<typeof prepareFlowPlacement>,
): (delta: Point) => PointerPreview {
  const parent = destinationFrame(document, id, parentId, surface);
  if (parent && ["flex", "inline-flex"].includes(getComputedStyle(parent).display)) {
    const drop = destinationFlow(document, id, parentId, parent, surface);
    const placement = flow(parent);
    return (delta) => ({
      kind: "batch",
      mutations: [
        drop({ x: origin.x + delta.x * scale, y: origin.y + delta.y * scale }),
        placement,
      ],
    });
  }
  if (parent && !["block", "flow-root"].includes(getComputedStyle(parent).display))
    throw new Error("Use Code to edit this frame's source-controlled layout.");
  const reference = parent ? frameReference(parent, surface, scale) : null;
  const siblings =
    parentId === null ? document.workspaceRootIds : document.nodes[parentId].children;
  return (delta) => ({
    kind: "batch",
    mutations: [{ kind: "reorder", id, parentId, index: siblings.length }, free(reference, delta)],
  });
}

function destinationFrame(
  document: DesignDocument,
  id: string,
  parentId: string | null,
  surface: HTMLElement,
) {
  if (parentId !== null && isLocked(document, parentId))
    throw new Error("Unlock the destination frame before moving.");
  if (parentId !== null && containsNode(document, id, parentId))
    throw new Error("An object cannot be moved into itself or its descendants.");
  const parent =
    parentId === null ? null : surface.querySelector(`[data-orc-id="${CSS.escape(parentId)}"]`);
  if (parentId !== null && !(parent instanceof HTMLElement))
    throw new Error("The receiving frame's rendered placement is unavailable.");
  return parent instanceof HTMLElement ? parent : null;
}

function destinationFlow(
  document: DesignDocument,
  id: string,
  parentId: string | null,
  parent: HTMLElement,
  surface: HTMLElement,
) {
  const style = checkFrameCoordinates(parent, surface);
  if (
    parentId === null ||
    !["row", "column"].includes(style.flexDirection) ||
    style.direction !== "ltr" ||
    style.writingMode !== "horizontal-tb" ||
    style.flexWrap === "wrap-reverse" ||
    (style.flexDirection === "column" && style.flexWrap !== "nowrap")
  )
    throw new Error("Use Code to edit this Flex direction or wrapping.");
  const siblings = document.nodes[parentId].children;
  const children = flowChildren(document, document.nodes[parentId], surface).filter(
    ({ node }) => node.id !== id,
  );
  if (children.some(({ computed }) => computed.order !== "0"))
    throw new Error("Use Code to edit this source-controlled Flex order.");
  const boxes = children.map(({ node, element }) => ({
    id: node.id,
    bounds: element.getBoundingClientRect(),
  }));
  return prepareFlexDrop({
    id,
    parentId,
    siblings,
    direction: style.flexDirection === "row" ? "row" : "column",
    boxes,
  });
}

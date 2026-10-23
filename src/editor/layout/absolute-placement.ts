import { objectParent, flowStyle } from "./layout-box";
import type { AtomicMutation, Mutation } from "../../../shared/commands/commands";
import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import { prepareFlowPlacement } from "./flow-placement";
import { frameReference, prepareFreePlacement } from "./free-placement";
import { readFrameLayout } from "./frame-layout";
import { frameLayoutValidation } from "./frame-layout-validation";
import { absolutePosition, insetProperties, isExplicitAbsolute } from "./participation";
import { prepareFillSharing } from "./fill-sharing";
import { withFillDependencies } from "./sizing";
import { previewDocument } from "../properties/property-preview";

export function readAbsolutePosition(document: DesignDocument, node: DesignNode) {
  const child = renderedFlexChild(document, node);
  if (!child) return null;
  const { parent, element } = child;
  const computed = getComputedStyle(element);
  const layout = readFrameLayout(parent);
  return {
    absolute: computed.position === "absolute",
    editable:
      (layout === "Row" || layout === "Column") &&
      ownedPlacement(element.style) &&
      ["static", "relative", "absolute"].includes(computed.position),
  };
}

function renderedFlexChild(document: DesignDocument, node: DesignNode) {
  const parent = node.parentId ? document.nodes[node.parentId] : null;
  if (parent?.kind !== "frame") return null;
  const element = window.document.querySelector(
    `.canvas-world [data-orc-id="${CSS.escape(node.id)}"]`,
  );
  const frame = element ? objectParent(element) : null;
  if (
    !(element instanceof HTMLElement || element instanceof SVGElement) ||
    frame?.dataset.orcId !== parent.id
  )
    return null;
  if (!["flex", "inline-flex"].includes(flowStyle(frame).display)) return null;
  return { parent, element };
}

export function prepareAbsolutePosition(document: DesignDocument, id: string, absolute: boolean) {
  const node = document.nodes[id];
  if (!node) throw new Error("The object no longer exists.");
  const element = renderedObject(document, id);
  const current = readAbsolutePosition(document, node);
  if (!current?.editable) throw new Error("Position controlled by source. Edit in Code.");
  if (isLocked(document, id)) throw new Error("Unlock the object before changing its position.");
  if (current.absolute === absolute) return null;
  const context = placementContext(element);
  const { parent, world, scale, reference } = context;
  const edit = absolute
    ? absoluteEdit(node, element, world, scale, reference)
    : prepareFlowPlacement(document, node, element)(parent);
  const mutation = placementBatch(edit);
  mutation.mutations.push(...prepareFillSharing(document)(mutation.mutations));
  return {
    mutation,
    validate: withFillDependencies(
      document,
      previewDocument(document, mutation),
      placementValidation(element, context, absolute),
    ),
  };
}

function placementContext(element: HTMLElement | SVGElement) {
  const parent = objectParent(element);
  const surface = element.closest(".canvas");
  const world = element.closest(".canvas-world");
  if (
    !(parent instanceof HTMLElement) ||
    !(surface instanceof HTMLElement) ||
    !(world instanceof HTMLElement)
  )
    throw new Error("The object's rendered placement is unavailable.");
  const scale = new DOMMatrix(getComputedStyle(world).transform).a;
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("The canvas scale is unavailable.");
  const reference = frameReference(parent, surface, scale);
  const direction = flowStyle(parent).flexDirection;
  if (!["row", "column"].includes(direction) || getComputedStyle(element).order !== "0")
    throw new Error("Use Code to change this source-controlled Flex order.");
  return { parent, surface, world, scale, reference, direction };
}

function placementValidation(
  element: HTMLElement | SVGElement,
  context: ReturnType<typeof placementContext>,
  absolute: boolean,
) {
  const { parent, surface, scale, reference, direction } = context;
  const bounds = localBox(element, reference, scale);
  const validate = frameLayoutValidation(parent, direction === "row" ? "Row" : "Column", scale);
  return () => {
    validate();
    if (getComputedStyle(element).position !== (absolute ? "absolute" : "relative"))
      throw new Error("Position controlled by source. Edit in Code.");
    if (absolute)
      preserveBox(bounds, localBox(element, frameReference(parent, surface, scale), scale));
  };
}

function renderedObject(document: DesignDocument, id: string) {
  const canvas = window.document.querySelector(".canvas");
  if (canvas?.getAttribute("data-orc-revision") !== String(document.revision))
    throw new Error("The layout changed. Try again.");
  const element = canvas.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`);
  if (
    !(element instanceof HTMLElement || element instanceof SVGElement) ||
    !element.getClientRects().length
  )
    throw new Error("The object's rendered placement is unavailable.");
  return element;
}

function ownedPlacement(style: CSSStyleDeclaration) {
  if (style.getPropertyValue("all")) return false;
  if (
    !isExplicitAbsolute(style) &&
    !["", "static", "relative", "absolute"].includes(style.position)
  )
    return false;
  return Array.from(style)
    .filter((property) => insetProperties.includes(property))
    .every(
      (property) =>
        !property.startsWith("inset-") &&
        style
          .getPropertyValue(property)
          .split(/\s+/u)
          .every(
            (value) =>
              value === "auto" || /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px|%)$/iu.test(value),
          ),
    );
}

function absoluteEdit(
  node: DesignNode,
  element: HTMLElement | SVGElement,
  world: HTMLElement,
  scale: number,
  reference: ReturnType<typeof frameReference>,
) {
  const edit = prepareFreePlacement(node, element, world, scale)(reference, { x: 0, y: 0 });
  edit.values.position =
    absolutePosition + (element.style.getPropertyPriority("position") ? " !important" : "");
  edit.values["--orc-absolute-position"] = "absolute";
  return edit;
}

function placementBatch(edit: Extract<AtomicMutation, { kind: "style" }>) {
  return {
    kind: "batch",
    mutations: [
      {
        kind: "style",
        id: edit.id,
        values: {},
        unset: [...new Set([...Object.keys(edit.values), ...(edit.unset ?? [])])],
      },
      { kind: "style", id: edit.id, values: edit.values },
    ],
  } satisfies Mutation;
}

function localBox(element: Element, reference: ReturnType<typeof frameReference>, scale: number) {
  const box = element.getBoundingClientRect();
  return {
    x: (box.x - reference.x) / scale,
    y: (box.y - reference.y) / scale,
    width: box.width / scale,
    height: box.height / scale,
  };
}

function preserveBox(before: ReturnType<typeof localBox>, after: ReturnType<typeof localBox>) {
  for (const property of ["x", "y", "width", "height"] as const)
    if (!Number.isFinite(after[property]) || Math.abs(before[property] - after[property]) > 0.1)
      throw new Error("Use Code to change this position; the current box cannot be preserved.");
}

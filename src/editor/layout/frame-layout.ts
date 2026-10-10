import type { AtomicMutation, Mutation } from "../../../shared/commands/commands";
import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import { frameReference, prepareFreePlacement } from "./free-placement";
import { prepareFlowPlacement } from "./flow-placement";
import { readSizingOwners } from "./sizing";
import { absolutePosition, isExplicitAbsolute } from "./participation";
import { frameLayoutValidation } from "./frame-layout-validation";

export type FrameLayout = "Free" | "Row" | "Column";
type StyleEdit = Extract<AtomicMutation, { kind: "style" }>;
const rowWrap = "--orc-row-wrap";
const rowWrapReference = "var(--orc-row-wrap)";

function authoredFrameStyle(node: DesignNode) {
  const style = window.document.createElement("div").style;
  style.cssText = Object.entries(node.style)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
  return style;
}

export function readFrameLayout(node: DesignNode): FrameLayout | null {
  const style = authoredFrameStyle(node);
  if (["", "block", "flow-root"].includes(style.display)) return "Free";
  if (!["flex", "inline-flex"].includes(style.display)) return null;
  if (Object.hasOwn(node.style, "flex-flow") && (!style.flexDirection || !style.flexWrap))
    return null;
  if (["", "row"].includes(style.flexDirection)) return "Row";
  return style.flexDirection === "column" ? "Column" : null;
}

export function readRowWrapping(node: DesignNode): boolean | null {
  const style = authoredFrameStyle(node);
  const value =
    style.flexWrap === rowWrapReference
      ? style.getPropertyValue(rowWrap).trim()
      : style.flexWrap || "nowrap";
  if (value === "wrap") return true;
  return value === "nowrap" ? false : null;
}

export function prepareRowWrapping(document: DesignDocument, id: string, wrapped: boolean) {
  const node = document.nodes[id];
  if (!node || node.kind !== "frame" || readFrameLayout(node) !== "Row")
    throw new Error("Select a Row frame to change wrapping.");
  if (isLocked(document, id)) throw new Error("Unlock the frame before changing wrapping.");
  const current = readRowWrapping(node);
  if (current === null) throw new Error("Wrapping controlled by source. Edit in Code.");
  if (current === wrapped) return null;
  const element = renderedFrame(document, id);
  const value = wrapped ? "wrap" : "nowrap";
  const validate = frameLayoutValidation(element, "Row", 1);
  return {
    mutation: {
      kind: "batch",
      mutations: [
        {
          kind: "style",
          id,
          values: {
            [rowWrap]: priority(element.style, rowWrap, value),
            "flex-wrap": priority(element.style, "flex-wrap", rowWrapReference),
          },
          unset: Object.hasOwn(node.style, "flex-flow") ? ["flex-flow"] : [],
        },
      ],
    } satisfies Mutation,
    validate: () => {
      validate();
      if (getComputedStyle(element).flexWrap !== value)
        throw new Error("Wrapping controlled by source. Edit in Code.");
    },
  };
}

export function prepareFrameLayout(document: DesignDocument, id: string, target: FrameLayout) {
  const node = document.nodes[id];
  if (!node || node.kind !== "frame") throw new Error("Select a frame to change its layout.");
  const current = readFrameLayout(node);
  if (current === target) return null;
  if (!current) throw new Error("Use Code to change this source-controlled layout.");
  if ([id, ...node.children].some((child) => isLocked(document, child)))
    throw new Error("Unlock the frame and its children before changing layout.");
  const conversion = frameConversion(document, id, current, target);
  const mutations: StyleEdit[] = [parentLayout(document, node, conversion.element, target)];
  for (const childId of node.children) {
    const child = document.nodes[childId];
    const childElement = renderedChild(conversion.element, childId);
    const change = childLayout(child, childElement, conversion);
    if (change) mutations.push(change);
  }
  return {
    mutation: { kind: "batch", mutations } satisfies Mutation,
    validate: frameLayoutValidation(conversion.element, target, conversion.scale),
  };
}

function renderedChild(parent: HTMLElement, id: string) {
  const element = parent.querySelector(`:scope > [data-orc-id="${CSS.escape(id)}"]`);
  if (
    !(element instanceof HTMLElement || element instanceof SVGElement) ||
    !element.getClientRects().length
  )
    throw new Error("Use Code to change layout with unavailable child measurements.");
  return element;
}

function frameConversion(
  document: DesignDocument,
  id: string,
  current: FrameLayout,
  target: FrameLayout,
): Conversion {
  const element = renderedFrame(document, id);
  const surface = element.closest(".canvas");
  const world = element.closest(".canvas-world");
  if (!(surface instanceof HTMLElement) || !(world instanceof HTMLElement))
    throw new Error("The frame's rendered layout is unavailable.");
  const style = getComputedStyle(element);
  if (current === "Free" && !["block", "flow-root"].includes(style.display))
    throw new Error("Use Code to change this source-controlled layout.");
  const native = ["flex", "inline-flex"].includes(style.display) ? style.flexDirection : "Free";
  if (native !== (current === "Free" ? current : current.toLowerCase()))
    throw new Error("Use Code to change this source-controlled layout.");
  const scale = new DOMMatrix(getComputedStyle(world).transform).a;
  const reference = frameReference(element, surface, scale);
  return { current, target, element, world, scale, reference };
}

function renderedFrame(document: DesignDocument, id: string) {
  const element = window.document.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`);
  if (
    !(element instanceof HTMLElement) ||
    element.closest(".canvas")?.getAttribute("data-orc-revision") !== String(document.revision)
  )
    throw new Error("Wait for the current layout before changing it.");
  return element;
}

function parentLayout(
  document: DesignDocument,
  node: DesignNode,
  element: HTMLElement,
  target: FrameLayout,
): StyleEdit {
  const style = getComputedStyle(element);
  if (style.direction !== "ltr" || style.writingMode !== "horizontal-tb")
    throw new Error("Use Code to change this source-controlled layout direction.");
  const values: DesignNode["style"] = {
    display: priority(element.style, "display", target === "Free" ? "block" : "flex"),
  };
  if (target !== "Free") {
    values["flex-direction"] = priority(element.style, "flex-direction", target.toLowerCase());
    Object.assign(values, wrappingStyles(element, target));
  } else {
    Object.assign(values, freeFrameDimensions(document, node, element));
  }
  return {
    kind: "style",
    id: node.id,
    values,
    unset: target !== "Free" && Object.hasOwn(node.style, "flex-flow") ? ["flex-flow"] : [],
  };
}

function wrappingStyles(element: HTMLElement, target: "Row" | "Column") {
  const style = element.style;
  const column = getComputedStyle(element).flexDirection === "column";
  const managed = style.flexWrap === rowWrapReference;
  const choice =
    column || managed
      ? style.getPropertyValue(rowWrap).trim() || "nowrap"
      : style.flexWrap || "nowrap";
  // CSS-wide keywords change meaning when moved into a custom property.
  if (!["wrap", "nowrap"].includes(choice) && !choice.startsWith("var("))
    throw new Error("Use Code to change this source-controlled wrapping.");
  return {
    [rowWrap]: priority(style, rowWrap, choice),
    "flex-wrap": priority(style, "flex-wrap", target === "Column" ? "nowrap" : rowWrapReference),
  };
}

function freeFrameDimensions(document: DesignDocument, node: DesignNode, element: HTMLElement) {
  const owners = readSizingOwners(
    node,
    element,
    node.parentId ? document.nodes[node.parentId] : undefined,
  );
  const values: DesignNode["style"] = {};
  for (const axis of ["width", "height"] as const)
    if (
      !owners[axis] &&
      ["", "auto", "fit-content", "max-content", "min-content"].includes(
        element.style.getPropertyValue(axis),
      )
    )
      values[axis] = priority(
        element.style,
        axis,
        getComputedStyle(element).getPropertyValue(axis),
      );
  return values;
}

type Conversion = {
  current: FrameLayout;
  target: FrameLayout;
  element: HTMLElement;
  world: HTMLElement;
  scale: number;
  reference: ReturnType<typeof frameReference>;
};

function childLayout(
  node: DesignNode,
  element: HTMLElement | SVGElement,
  conversion: Conversion,
): StyleEdit | null {
  const { current, target, world, scale, reference } = conversion;
  const position = checkChildPosition(element);
  const explicit = isExplicitAbsolute(element.style);
  if (explicit) return null;
  if (target !== "Free" && getComputedStyle(element).order !== "0")
    throw new Error("Use Code to change this source-controlled child order.");
  if (current !== "Free" && position === "absolute") {
    if (target !== "Free") return null;
    return {
      kind: "style",
      id: node.id,
      values: {
        position: priority(element.style, "position", absolutePosition),
        "--orc-absolute-position": "absolute",
      },
    };
  }
  if (target === "Free")
    return prepareFreePlacement(node, element, world, scale)(reference, { x: 0, y: 0 });
  return prepareFlowPlacement(node, element)(conversion.element, target.toLowerCase());
}

function checkChildPosition(element: HTMLElement | SVGElement) {
  const position = getComputedStyle(element).position;
  if (!["static", "relative", "absolute"].includes(position))
    throw new Error("Use Code to change this source-controlled child position.");
  if (!isExplicitAbsolute(element.style) && element.style.position.includes("var("))
    throw new Error("Use Code to change this source-controlled child position.");
  return position;
}

function priority(style: CSSStyleDeclaration, property: string, value: string) {
  return value + (style.getPropertyPriority(property) ? " !important" : "");
}

import type { DesignNode } from "../../../shared/document/model";

export function readFlexSizing(
  style: CSSStyleDeclaration,
  computed: CSSStyleDeclaration,
  parent: CSSStyleDeclaration | null,
) {
  const direction = activeDirection(computed, parent);
  return {
    direction,
    grow: computed.flexGrow,
    basis: computed.flexBasis,
    crossFill: filledCrossAxis(style, computed, parent, direction),
  };
}

function activeDirection(computed: CSSStyleDeclaration, parent: CSSStyleDeclaration | null) {
  if (
    !parent ||
    !["flex", "inline-flex"].includes(parent.display) ||
    ["absolute", "fixed"].includes(computed.position)
  )
    return null;
  return parent.flexDirection;
}

function filledCrossAxis(
  style: CSSStyleDeclaration,
  computed: CSSStyleDeclaration,
  parent: CSSStyleDeclaration | null,
  direction: string | null,
) {
  if (!parent || !direction) return false;
  const row = direction.startsWith("row");
  const cross = row ? "height" : "width";
  const margins = row ? ["margin-top", "margin-bottom"] : ["margin-left", "margin-right"];
  const alignment = computed.alignSelf === "auto" ? parent.alignItems : computed.alignSelf;
  return (
    ["", "auto"].includes(style.getPropertyValue(cross)) &&
    ["normal", "stretch"].includes(alignment) &&
    margins.every((margin) => style.getPropertyValue(margin) !== "auto")
  );
}

export function readSizingOwners(
  node: DesignNode,
  element: HTMLElement | SVGElement,
  parent: DesignNode | undefined,
) {
  const computed = getComputedStyle(element);
  const parentStyle =
    node.parentId !== null && element.parentElement
      ? getComputedStyle(element.parentElement)
      : null;
  const source = {
    style: element.style,
    flow: readFlexSizing(element.style, computed, parentStyle),
    constrained: parent?.kind === "frame" && computed.position === "absolute",
  };
  return { width: axisOwner(source, "width"), height: axisOwner(source, "height") };
}

function axisOwner(
  source: {
    style: CSSStyleDeclaration;
    flow: ReturnType<typeof readFlexSizing>;
    constrained: boolean;
  },
  axis: "width" | "height",
) {
  const { style, flow } = source;
  const main = flow.direction?.startsWith("row") ? "width" : "height";
  if (flow.direction && (axis === main ? flow.grow !== "0" : flow.crossFill)) return "Fill";
  if (!source.constrained || !["", "auto"].includes(style.getPropertyValue(axis))) return null;
  const edges = axis === "width" ? ["left", "right"] : ["top", "bottom"];
  return edges.every((edge) => !["", "auto"].includes(style.getPropertyValue(edge)))
    ? "Constraints"
    : null;
}

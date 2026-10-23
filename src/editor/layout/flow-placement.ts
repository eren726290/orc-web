import { flowStyle } from "./layout-box";
import type { AtomicMutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode, Styles } from "../../../shared/document/model";
import { prepareFlowSizing, readFlexSizing, readSizing } from "./sizing";
import { insetProperties } from "./participation";

type Axis = "width" | "height";
const axes: Axis[] = ["width", "height"];

export function prepareFlowPlacement(
  document: DesignDocument,
  node: DesignNode,
  element: HTMLElement | SVGElement,
) {
  const source = snapshotFlow(document, node, element);
  const checkSizing = prepareFlowSizing(document, node, element);
  return (
    parent: HTMLElement,
    direction = flowStyle(parent).flexDirection,
  ): Extract<AtomicMutation, { kind: "style" }> => {
    const converted = mainToCross(source, direction);
    const values: Styles = {
      position: priority(source.style, "position", "relative"),
      ...flowDimensions(source),
      ...flowSizing(source),
      ...converted,
    };
    const ownedFill = checkSizing(parent, direction, values);
    if (!converted) checkFlowDestination(source, parent, direction, ownedFill);
    if (source.crossFill) values["align-self"] = priority(source.style, "align-self", "stretch");
    const unset = [...insetProperties, "--orc-absolute-position"].filter((property) =>
      Object.hasOwn(node.style, property),
    );
    return { kind: "style", id: node.id, values, unset };
  };
}

function mainToCross(source: ReturnType<typeof snapshotFlow>, direction: string): Styles | null {
  if (!source.direction || source.direction === direction || !source.ownedMain || source.crossFill)
    return null;
  return Object.fromEntries(
    [
      ["flex-grow", "0"],
      ["flex-shrink", "0"],
      ["flex-basis", "auto"],
      ["align-self", "stretch"],
    ].map(([property, value]) => [property, priority(source.style, property, value)]),
  );
}

function checkFlowDestination(
  source: ReturnType<typeof snapshotFlow>,
  parent: HTMLElement,
  direction: string,
  ownedFill: boolean,
) {
  if (!source.direction) return;
  if (
    source.direction !== direction &&
    (source.grow !== "0" || source.crossFill || source.basis !== "auto")
  )
    throw new Error("Use Code to convert this source-controlled sizing between Flex axes.");
  const main: Axis = direction === "row" ? "width" : "height";
  if (
    !ownedFill &&
    source.grow !== "0" &&
    ["", "auto", "max-content", "min-content", "fit-content"].includes(
      parent.style.getPropertyValue(main),
    )
  )
    throw new Error(`Set the parent's ${main} first.`);
}

function flowSizing(source: ReturnType<typeof snapshotFlow>) {
  const values: Styles = {};
  if (source.direction && (source.grow !== "0" || source.basis !== "auto")) return values;
  for (const [property, value] of [
    ["flex-grow", "0"],
    ["flex-shrink", "0"],
    ["flex-basis", "auto"],
  ])
    values[property] = priority(source.style, property, value);
  return values;
}

function snapshotFlow(
  document: DesignDocument,
  node: DesignNode,
  element: HTMLElement | SVGElement,
) {
  const style = window.document.createElement("div").style;
  style.cssText = element.style.cssText;
  const computed = getComputedStyle(element);
  const parent =
    node.parentId !== null && element.parentElement
      ? getComputedStyle(element.parentElement)
      : null;
  const flow = readFlexSizing(element, computed, parent);
  const sizing = flow.direction
    ? readSizing(document, node, flow.direction === "row" ? "width" : "height")
    : null;
  return {
    style,
    ownedMain: sizing?.mode === "Fill" && sizing.convertible,
    position: computed.position,
    width: computed.width,
    height: computed.height,
    ...flow,
  };
}

function flowDimensions(source: ReturnType<typeof snapshotFlow>) {
  const values: Styles = {};
  for (const axis of axes) {
    const value = flowDimension(source, axis);
    if (value) values[axis] = priority(source.style, axis, value);
  }
  return values;
}

function flowDimension(source: ReturnType<typeof snapshotFlow>, axis: Axis) {
  const value = source.style.getPropertyValue(axis);
  const main = source.direction === "row" ? "width" : "height";
  const fill = source.direction && (axis === main ? source.grow !== "0" : source.crossFill);
  if (!["", "auto"].includes(value) || fill) return value;
  if (ownedByInsets(source, axis)) return source[axis];
  return axis === "width" ? "fit-content" : "max-content";
}

function ownedByInsets(source: ReturnType<typeof snapshotFlow>, axis: Axis) {
  if (source.position !== "absolute") return false;
  const edges = axis === "width" ? ["left", "right"] : ["top", "bottom"];
  return edges.every((edge) => !["", "auto"].includes(source.style.getPropertyValue(edge)));
}

function priority(style: CSSStyleDeclaration, property: string, value: string) {
  return value + (style.getPropertyPriority(property) ? " !important" : "");
}

import type { AtomicMutation } from "../../../shared/commands/commands";
import type { DesignNode, Styles } from "../../../shared/document/model";
import { readFlexSizing } from "../layout/sizing";

type Axis = "width" | "height";
const axes: Axis[] = ["width", "height"];

export function prepareFlowPlacement(node: DesignNode, element: HTMLElement | SVGElement) {
  const source = snapshotFlow(node, element);
  return (parent: HTMLElement): Extract<AtomicMutation, { kind: "style" }> => {
    checkFlowDestination(source, parent);
    const values: Styles = {
      position: priority(source.style, "position", "relative"),
      ...flowDimensions(source),
      ...flowSizing(source),
    };
    if (source.crossFill) values["align-self"] = priority(source.style, "align-self", "stretch");
    const unset = ["inset", "inset-inline", "inset-block", "left", "right", "top", "bottom"].filter(
      (property) => Object.hasOwn(node.style, property),
    );
    return { kind: "style", id: node.id, values, unset };
  };
}

function checkFlowDestination(source: ReturnType<typeof snapshotFlow>, parent: HTMLElement) {
  const direction = getComputedStyle(parent).flexDirection;
  if (
    source.direction &&
    source.direction !== direction &&
    (source.grow !== "0" || source.crossFill || source.basis !== "auto")
  )
    throw new Error("Use Code to convert this source-controlled sizing between Flex axes.");
  const main: Axis = direction === "row" ? "width" : "height";
  if (
    source.direction &&
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

function snapshotFlow(node: DesignNode, element: HTMLElement | SVGElement) {
  const style = window.document.createElement("div").style;
  style.cssText = element.style.cssText;
  const computed = getComputedStyle(element);
  const parent =
    node.parentId !== null && element.parentElement
      ? getComputedStyle(element.parentElement)
      : null;
  return {
    style,
    position: computed.position,
    width: computed.width,
    height: computed.height,
    ...readFlexSizing(style, computed, parent),
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

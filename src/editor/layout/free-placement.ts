import type { AtomicMutation } from "../../../shared/commands/commands";
import type { DesignNode } from "../../../shared/document/model";
import { checkMovementCoordinates } from "../canvas/keyboard-movement";
import { hasCoordinateTransform } from "./coordinates";
import { constraintMode as nativeConstraintMode, constraintAlignments } from "./constraint-css";
import { absolutePosition, insetProperties, isExplicitAbsolute } from "./participation";

type StyleEdit = Extract<AtomicMutation, { kind: "style" }>;
const margins = ["margin-left", "margin-right", "margin-top", "margin-bottom"];

export function frameReference(element: HTMLElement, surface: HTMLElement, scale: number) {
  const style = checkFrameCoordinates(element, surface);
  if (
    style.position === "static" ||
    style.direction !== "ltr" ||
    style.writingMode !== "horizontal-tb"
  )
    throw new Error("Use Code to edit this frame's source-controlled placement.");
  const bounds = element.getBoundingClientRect();
  const left = Number.parseFloat(style.borderLeftWidth);
  const top = Number.parseFloat(style.borderTopWidth);
  const right = Number.parseFloat(style.borderRightWidth);
  const bottom = Number.parseFloat(style.borderBottomWidth);
  const inlineGutter = Math.max(
    0,
    Math.round(element.offsetWidth - element.clientWidth - left - right),
  );
  const blockGutter = Math.max(
    0,
    Math.round(element.offsetHeight - element.clientHeight - top - bottom),
  );
  const startGutter = style.scrollbarGutter.includes("both-edges") ? inlineGutter / 2 : 0;
  return {
    x: bounds.x + (left + startGutter - element.scrollLeft) * scale,
    y: bounds.y + (top - element.scrollTop) * scale,
    width: bounds.width / scale - left - right - inlineGutter,
    height: bounds.height / scale - top - bottom - blockGutter,
  };
}

export function checkFrameCoordinates(element: HTMLElement, surface: HTMLElement) {
  checkMovementCoordinates(element, surface);
  const style = getComputedStyle(element);
  if (hasCoordinateTransform(style))
    throw new Error("Use Code to move objects into a transformed frame.");
  return style;
}

export function prepareFreePlacement(
  node: DesignNode,
  element: HTMLElement | SVGElement,
  world: HTMLElement,
  scale: number,
) {
  const source = freezePlacement(element, world, scale);
  const constrained = node.parentId !== null && source.computed.position === "absolute";
  return (
    reference: ReturnType<typeof frameReference> | null,
    delta: { x: number; y: number },
  ): StyleEdit => {
    const parent = reference ?? { x: source.world.x, y: source.world.y, width: 0, height: 0 };
    const shift = translation(source);
    const values = {
      ...(source.computed.position === "absolute" && (!constrained || reference === null)
        ? Object.fromEntries(
            constraintAlignments(source.style).map((key) => [
              key,
              priority(source.style, key, "auto"),
            ]),
          )
        : {}),
      position: priority(
        source.style,
        "position",
        isExplicitAbsolute(source.style) ? absolutePosition : "absolute",
      ),
      ...freeAxis(source, parent, delta.x, shift.x, "x", constrained && reference !== null),
      ...freeAxis(source, parent, delta.y, shift.y, "y", constrained && reference !== null),
    };
    return { kind: "style", id: node.id, values, unset: removedInsets(node, values) };
  };
}

function freezePlacement(element: HTMLElement | SVGElement, world: HTMLElement, scale: number) {
  const style = window.document.createElement("div").style;
  style.cssText = element.style.cssText;
  const native = getComputedStyle(element);
  const computed = window.document.createElement("div").style;
  for (const property of [
    "position",
    "width",
    "height",
    ...margins,
    "transform",
    "translate",
    "rotate",
    "scale",
  ])
    computed.setProperty(property, native.getPropertyValue(property));
  return {
    style,
    computed,
    autoMargins: new Set(
      margins.filter((property) => element.computedStyleMap().get(property)?.toString() === "auto"),
    ),
    bounds: element.getBoundingClientRect(),
    world: world.getBoundingClientRect(),
    scale,
  };
}

function freeAxis(
  source: ReturnType<typeof freezePlacement>,
  parent: ReturnType<typeof frameReference>,
  delta: number,
  shift: number,
  axis: "x" | "y",
  constrained: boolean,
) {
  const [start, end, length, marginStart, marginEnd] =
    axis === "x"
      ? ["left", "right", "width", "margin-left", "margin-right"]
      : ["top", "bottom", "height", "margin-top", "margin-bottom"];
  const { style, computed, bounds, scale } = source;
  const size = axis === "x" ? bounds.width / scale : bounds.height / scale;
  const available = axis === "x" ? parent.width : parent.height;
  const mode = constrained ? constraintMode(style, start, end, length) : "start";
  const margin = placementMargin(source, marginStart, mode);
  const p = (bounds[axis] + delta * scale - parent[axis]) / scale - shift - margin;
  const r = available - p - margin - size - Number.parseFloat(computed.getPropertyValue(marginEnd));
  const center =
    p + (size + margin + parseFloat(computed.getPropertyValue(marginEnd))) / 2 - available / 2;
  return freeAxisValues(style, computed, [start, end, length], { mode, p, r, center, available });
}

function placementMargin(
  source: ReturnType<typeof freezePlacement>,
  property: string,
  mode: string,
) {
  // Auto margins consume Flex space but resolve to zero with one absolute edge.
  if (mode === "start" && source.autoMargins.has(property)) return 0;
  return Number.parseFloat(source.computed.getPropertyValue(property));
}

function constraintMode(style: CSSStyleDeclaration, start: string, end: string, length: string) {
  if (nativeConstraintMode(style, length === "width" ? "width" : "height") === "center")
    return "native-center";
  const first = style.getPropertyValue(start);
  const last = style.getPropertyValue(end);
  if (
    [first, last, style.getPropertyValue(length)].some((value) =>
      /\b(?!calc\()[a-z-]+\(/iu.test(value),
    )
  )
    throw new Error("Use Code to reparent this source-controlled constraint.");
  if (!last || last === "auto") return /(?:^|\()\s*50%/u.test(first) ? "center" : "start";
  if (!first || first === "auto") return "end";
  return ["", "auto"].includes(style.getPropertyValue(length)) ? "both" : "start";
}

function translation(source: ReturnType<typeof freezePlacement>) {
  const { computed, bounds, scale } = source;
  const matrix = new DOMMatrix(computed.transform === "none" ? undefined : computed.transform);
  const translationOnly =
    matrix.is2D &&
    [matrix.a, matrix.b, matrix.c, matrix.d].every((value, index) => value === [1, 0, 0, 1][index]);
  if (
    !translationOnly ||
    !["none", "0deg"].includes(computed.rotate) ||
    !["none", "1", "1 1"].includes(computed.scale)
  )
    throw new Error("Use Code to reparent this transformed object's Free placement.");
  const parts = computed.translate === "none" ? [] : computed.translate.split(/\s+/u);
  if (parts.length > 2) throw new Error("Use Code to reparent this object's 3D translation.");
  return {
    x: matrix.e + translationValue(parts[0] ?? "0px", bounds.width / scale),
    y: matrix.f + translationValue(parts[1] ?? "0px", bounds.height / scale),
  };
}

function translationValue(value: string, size: number) {
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|%)?$/u.test(value))
    throw new Error("Use Code to reparent this source-controlled translation.");
  return Number.parseFloat(value) * (value.endsWith("%") ? size / 100 : 1);
}

function removedInsets(node: DesignNode, values: Record<string, string>) {
  return Object.keys(node.style).filter(
    (property) => insetProperties.includes(property) && !Object.hasOwn(values, property),
  );
}

function priority(style: CSSStyleDeclaration, property: string, value: string) {
  return value + (style.getPropertyPriority(property) ? " !important" : "");
}

function freeAxisValues(
  style: CSSStyleDeclaration,
  computed: CSSStyleDeclaration,
  edges: [string, string, string],
  offsets: { mode: string; p: number; r: number; center: number; available: number },
) {
  const [start, end, length] = edges;
  const { mode, p, r, center, available } = offsets;
  if (mode === "native-center")
    return {
      [start]: priority(style, start, `${center}px`),
      [end]: priority(style, end, `${-center}px`),
      [length]: priority(style, length, computed.getPropertyValue(length)),
    };
  return {
    [start]: priority(
      style,
      start,
      mode === "end" ? "auto" : mode === "center" ? `calc(50% + ${p - available / 2}px)` : `${p}px`,
    ),
    [end]: priority(style, end, mode === "end" || mode === "both" ? `${r}px` : "auto"),
    [length]: priority(
      style,
      length,
      mode === "both"
        ? style.getPropertyValue(length) === "stretch"
          ? "stretch"
          : "auto"
        : computed.getPropertyValue(length),
    ),
  };
}

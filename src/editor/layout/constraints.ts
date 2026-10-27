import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import type { AtomicMutation, Mutation } from "../../../shared/commands/commands";
import {
  constraintAxes,
  constraintMode,
  constraintNumber,
  type ConstraintAxis,
  type ConstraintMode,
} from "./constraint-css";
import { hasCoordinateTransform } from "./coordinates";
import { checkFrameCoordinates, frameReference } from "./free-placement";
import { objectParent, flowStyle } from "./layout-box";
import { readFrameLayout } from "./frame-layout";
import { previewDocument } from "../properties/property-preview";
import { withFillDependencies } from "./sizing";

export function readConstraints(document: DesignDocument, node: DesignNode) {
  const context = constraintContext(document, node);
  if (!context) return null;
  const { element } = context;
  const axes = { width: readAxis(context, "width"), height: readAxis(context, "height") };
  return { ...axes, element };
}

function constraintContext(document: DesignDocument, node: DesignNode) {
  const parent = node.parentId ? document.nodes[node.parentId] : null;
  if (parent?.kind !== "frame" || !readFrameLayout(parent)) return null;
  const rendered = constraintElements(node);
  return rendered ? { node, ...rendered } : null;
}

function constraintElements(node: DesignNode) {
  const element = window.document.querySelector(
    `.canvas-world [data-orc-id="${CSS.escape(node.id)}"]`,
  );
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return null;
  const frame = objectParent(element);
  const computed = getComputedStyle(element);
  if (!frame || frame.dataset.orcId !== node.parentId || computed.position !== "absolute")
    return null;
  if (!["block", "flow-root", "flex", "inline-flex"].includes(flowStyle(frame).display))
    return null;
  return { element, frame, computed };
}

type Context = NonNullable<ReturnType<typeof constraintContext>>;

function readAxis(context: Context, axis: ConstraintAxis) {
  const { element } = context;
  const mode = constraintMode(element.style, axis);
  const editable =
    [element, context.frame].every((box) => box.getClientRects().length > 0) &&
    commonOwned(context) &&
    axisOwned(context, axis) &&
    mode !== null;
  return {
    mode,
    editable,
    limited: editable && mode === "both" && limitedAxis(context, axis),
    message: editable ? null : "Constraints controlled by source. Edit in Code.",
  };
}

function commonOwned({ element, frame, computed }: Context) {
  const canvas = element.closest(".canvas");
  if (!(canvas instanceof HTMLElement)) return false;
  try {
    checkFrameCoordinates(frame, canvas);
  } catch {
    return false;
  }
  const style = element.style;
  return (
    !hasCoordinateTransform(computed) &&
    !style.getPropertyValue("all") &&
    ownedBoxSpacing(style) &&
    computed.writingMode === "horizontal-tb" &&
    computed.direction === "ltr" &&
    computed.aspectRatio === "auto" &&
    !Array.from(style).some(
      (key) => key.startsWith("inset-") || /^(?:min-|max-)?(?:inline|block)-size$/u.test(key),
    ) &&
    ["margin-left", "margin-right", "margin-top", "margin-bottom"].every(
      (key) =>
        element.computedStyleMap().get(key)?.toString() !== "auto" &&
        Number.isFinite(parseFloat(computed.getPropertyValue(key))),
    )
  );
}

function axisOwned({ element, node }: Context, axis: ConstraintAxis) {
  const style = element.style;
  const dimension = style.getPropertyValue(axis);
  const alignment = style.getPropertyValue(constraintAxes[axis].alignment);
  return (
    !Object.hasOwn(node.style, "place-self") &&
    (!element.matches("img, svg, input, textarea, select") ||
      constraintMode(style, axis) !== "both" ||
      dimension === "stretch") &&
    ["", "auto", "normal", "stretch", "unsafe center"].includes(alignment) &&
    !(constraintMode(style, axis) === "both" && alignment === "stretch") &&
    ownedConstraintSize(style, axis) &&
    ["min", "max"].every((bound) => {
      const value = style.getPropertyValue(`${bound}-${axis}`);
      return ["", "auto", "none"].includes(value) || constraintNumber(value) !== null;
    })
  );
}

function ownedConstraintSize(style: CSSStyleDeclaration, axis: ConstraintAxis) {
  const dimension = style.getPropertyValue(axis);
  return (
    constraintNumber(dimension) !== null ||
    ["", "auto"].includes(dimension) ||
    (dimension === "stretch" && constraintMode(style, axis) === "both")
  );
}

function limitedAxis({ element, frame, computed }: Context, axis: ConstraintAxis) {
  const world = element.closest(".canvas-world");
  const surface = element.closest(".canvas");
  if (!(world instanceof HTMLElement) || !(surface instanceof HTMLElement)) return false;
  try {
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const reference = frameReference(frame, surface, scale);
    const edges = constraintAxes[axis];
    const ideal =
      reference[axis] -
      parseFloat(computed.getPropertyValue(edges.start)) -
      parseFloat(element.style.getPropertyValue(edges.end)) -
      parseFloat(computed.getPropertyValue(edges.margin)) -
      parseFloat(computed.getPropertyValue(edges.endMargin));
    const box = element.getBoundingClientRect();
    return Math.abs(box[axis] / scale - ideal) > 0.1;
  } catch {
    return false;
  }
}

export function prepareConstraints(
  document: DesignDocument,
  id: string,
  axis: ConstraintAxis,
  mode: ConstraintMode,
  align = false,
) {
  const node = document.nodes[id];
  const context = node && constraintContext(document, node);
  if (!context || !readAxis(context, axis).editable)
    throw new Error("Constraints controlled by source. Edit in Code.");
  if (isLocked(document, id)) throw new Error("Unlock the object before changing constraints.");
  const measurement = measure(context, document.revision);
  if (
    constraintMode(context.element.style, axis) === mode &&
    (!align ||
      Math.abs(
        measurement[axis === "width" ? "x" : "y"] +
          measurement[axis] / 2 -
          measurement.reference[axis] / 2,
      ) < 0.01)
  )
    return null;
  const values = constraintValues(context, measurement, axis, mode, align);
  const edit: Extract<AtomicMutation, { kind: "style" }> = { kind: "style", id, values };
  const mutation = {
    kind: "batch",
    mutations: [{ ...edit, values: {}, unset: Object.keys(values) }, edit],
  } satisfies Mutation;
  return {
    mutation,
    validate: withFillDependencies(document, previewDocument(document, mutation), () =>
      validate(context, measurement, axis, align),
    ),
  };
}

function measure({ element, frame }: Context, revision: number) {
  const surface = element.closest(".canvas");
  const world = element.closest(".canvas-world");
  if (
    !(surface instanceof HTMLElement) ||
    !(world instanceof HTMLElement) ||
    surface.dataset.orcRevision !== String(revision)
  )
    throw new Error("The layout changed. Try again.");
  const scale = new DOMMatrix(getComputedStyle(world).transform).a;
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("The canvas scale is unavailable.");
  const reference = frameReference(frame, surface, scale);
  const box = element.getBoundingClientRect();
  return {
    revision,
    reference,
    x: (box.x - reference.x) / scale,
    y: (box.y - reference.y) / scale,
    width: box.width / scale,
    height: box.height / scale,
  };
}

function constraintValues(
  context: Context,
  measured: ReturnType<typeof measure>,
  axis: ConstraintAxis,
  mode: ConstraintMode,
  align: boolean,
) {
  const { element } = context;
  const values = axisPlacement(context, measured, axis, mode, align);
  for (const key of Object.keys(values))
    values[key] += element.style.getPropertyPriority(key) ? " !important" : "";
  return values;
}

function validate(
  context: Context,
  before: ReturnType<typeof measure>,
  axis: ConstraintAxis,
  align: boolean,
) {
  const after = measure(context, before.revision);
  for (const key of ["x", "y", "width", "height"] as const) {
    const target =
      align && key === (axis === "width" ? "x" : "y")
        ? after.reference[axis] / 2 - after[axis] / 2
        : before[key];
    if (!Number.isFinite(after[key]) || Math.abs(after[key] - target) > 0.1)
      throw new Error("The current box cannot be preserved. Edit these constraints in Code.");
  }
}

function axisPlacement(
  context: Context,
  measured: ReturnType<typeof measure>,
  axis: ConstraintAxis,
  mode: ConstraintMode,
  align: boolean,
): Record<string, string> {
  const { computed, node } = context;
  const edges = constraintAxes[axis];
  const size = measured[axis],
    available = measured.reference[axis];
  const start = measured[axis === "width" ? "x" : "y"];
  const margin = parseFloat(computed.getPropertyValue(edges.margin));
  const endMargin = parseFloat(computed.getPropertyValue(edges.endMargin));
  const values = {
    [axis]:
      mode === "both"
        ? node.kind === "frame"
          ? "auto"
          : "stretch"
        : computed.getPropertyValue(axis),
    [edges.start]: `${start - margin}px`,
    [edges.end]: "auto",
    [edges.alignment]: mode === "center" ? "unsafe center" : "normal",
  };
  if (mode === "end" || mode === "both")
    values[edges.end] = `${available - start - size - endMargin}px`;
  if (mode === "end") values[edges.start] = "auto";
  if (mode === "center") {
    // Native self-alignment centers the margin box.
    const offset = (align ? 0 : start + size / 2 - available / 2) - (margin - endMargin) / 2;
    values[edges.start] = `${offset}px`;
    values[edges.end] = `${-offset}px`;
  }
  return values;
}

function ownedBoxSpacing(style: CSSStyleDeclaration) {
  return Array.from(style)
    .filter((key) => key.startsWith("margin") || key.startsWith("padding"))
    .every((key) =>
      style
        .getPropertyValue(key)
        .split(/\s+/u)
        .every((value) => value === "0" || constraintNumber(value) !== null),
    );
}

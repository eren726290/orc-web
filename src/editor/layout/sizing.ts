import {
  isLocked,
  containsNode,
  type DesignDocument,
  type DesignNode,
  type Styles,
} from "../../../shared/document/model";
import { flowBox, objectParent } from "./layout-box";
import { columnProjectionEligible } from "../../../shared/source/intrinsic-column";
import { constraintMode } from "./constraint-css";
import { hasCoordinateTransform } from "./coordinates";
import type { Mutation } from "../../../shared/commands/commands";
import { captureFillDependencies } from "./fill-dependencies";
import { previewDocument } from "../properties/property-preview";
import {
  fillInputProperties,
  fillDecoration,
  ownedMainFillProjection,
  ownedSharedFill,
  prepareFillSharing,
} from "./fill-sharing";

export type SizingAxis = "width" | "height";
export type SizingMode = "Fixed" | "Fit" | "Fill";
type SizingReadout = {
  mode: SizingMode | "Constraints" | null;
  editable: boolean;
  convertible: boolean;
  fit: boolean;
  fill: boolean;
  value: string;
  message: string | null;
};

export function readFlexSizing(
  element: HTMLElement | SVGElement,
  computed: CSSStyleDeclaration,
  parent: CSSStyleDeclaration | null,
) {
  const direction = activeDirection(computed, parent);
  return {
    direction,
    grow: computed.flexGrow,
    shrink: computed.flexShrink,
    basis: computed.flexBasis,
    crossFill: filledCrossAxis(element, computed, parent, direction),
  };
}

export function readSizing(
  document: DesignDocument,
  node: DesignNode,
  axis: SizingAxis,
): SizingReadout {
  const element = sizingElement(node.id);
  if (!element)
    return {
      mode: null,
      editable: false,
      convertible: false,
      fit: false,
      fill: false,
      value: "Edit source",
      message: null,
    };
  return sizingReadout(sizingContext(document, node, element), axis);
}

function sizingElement(id: string) {
  const element = window.document.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`);
  return element instanceof HTMLElement || element instanceof SVGElement ? element : null;
}

function sizingContext(
  document: DesignDocument,
  node: DesignNode,
  element: HTMLElement | SVGElement,
) {
  const parent = node.parentId ? document.nodes[node.parentId] : undefined;
  const computed = getComputedStyle(element);
  const parentStyle =
    parent && element.parentElement ? getComputedStyle(element.parentElement) : null;
  const flow = readFlexSizing(element, computed, parentStyle);
  return {
    document,
    node,
    element,
    computed,
    flow,
    parent,
    style: element.style,
    owners: readSizingOwners(node, element, parent),
    main: flow.direction ? (flow.direction.startsWith("row") ? "width" : "height") : null,
  };
}

type SizingContext = ReturnType<typeof sizingContext>;
type SupplyChange = { id: string; kind: "sizing" | "placement" };

function sizingReadout(source: SizingContext, axis: SizingAxis): SizingReadout {
  const owner = competingDimension(source.style, axis) ? null : source.owners[axis];
  const convertible =
    ownedSizing(source, axis) &&
    (!owner || (owner === "Fill" && (crossAxis(source, axis) || ownedMainFill(source, axis))));
  const editable = !owner && convertible;
  const mode = owner ?? sizingMode(source, axis);
  const limitation = fillLimitation(source, axis);
  return {
    mode,
    editable,
    convertible,
    fit: convertible && contentSizing(source),
    fill: convertible && limitation === null,
    value: sizingValue(source, axis, mode, convertible),
    message: sizingMessage(source, axis, convertible, owner, limitation),
  };
}

function sizingValue(
  source: SizingContext,
  axis: SizingAxis,
  mode: SizingReadout["mode"],
  convertible: boolean,
) {
  if (!convertible) return mode ?? "Edit source";
  return String(
    pixelValue((mode === "Fixed" ? source.style : source.computed).getPropertyValue(axis)),
  );
}

function sizingMessage(
  source: SizingContext,
  axis: SizingAxis,
  convertible: boolean,
  owner: SizingReadout["mode"],
  limitation: string | null,
) {
  if (owner === "Fill" && limitation && !suppliedFillParent(source, axis)) return limitation;
  if (owner) return controlledSizingMessage(source, axis, owner);
  if (!convertible) return "Size controlled by source. Edit in Code.";
  if (overflowsParent(source, axis)) return "This object extends beyond its parent.";
  if (limitation) return limitation;
  return contentSizing(source) ? null : "Fit is unavailable for this content.";
}

function controlledSizingMessage(
  source: SizingContext,
  axis: SizingAxis,
  owner: NonNullable<SizingReadout["mode"]>,
) {
  return `${axis === "width" ? "Width" : "Height"} controlled by ${owner}.${owner === "Fill" ? wrappedCrossMessage(source, axis) : ""}${overflowsParent(source, axis) ? " This object extends beyond its parent." : ""}`;
}

function wrappedCrossMessage(source: SizingContext, axis: SizingAxis) {
  return axis === "height" &&
    source.flow.direction === "row" &&
    source.element.parentElement &&
    getComputedStyle(source.element.parentElement).flexWrap === "wrap"
    ? " Height fills its current row."
    : "";
}

function crossAxis(source: SizingContext, axis: SizingAxis) {
  return source.parent?.kind === "frame" && source.main !== null && source.main !== axis;
}

function fillLimitation(source: SizingContext, axis: SizingAxis) {
  const parent = source.element.parentElement;
  if (!source.main || !parent) return "Fill is unavailable for this layout.";
  if (source.main === axis) return mainFillLimitation(source, axis);
  if (!supportedFlowWrapping(parent, source.flow.direction ?? ""))
    return "Fill is unavailable for this layout.";
  if (
    source.computed.aspectRatio !== "auto" ||
    !ownedStretch(source) ||
    automaticCrossMargin(source.element, axis)
  )
    return "Use Code to change this sizing.";
  return availableFillParent(source, axis) ? null : `Set the parent's ${axis} first.`;
}

function supportedFlowWrapping(parent: Element, direction: string) {
  const wrapping = getComputedStyle(parent).flexWrap;
  return wrapping === "nowrap" || (direction === "row" && wrapping === "wrap");
}

function ownedMainFill(source: SizingContext, axis: SizingAxis) {
  return (
    source.main === axis &&
    ownedSizing(source, axis) &&
    source.computed.aspectRatio === "auto" &&
    source.style.getPropertyValue(axis) === "auto" &&
    ownedMainFillProjection(source.element, axis)
  );
}

function mainFillLimitation(source: SizingContext, axis: SizingAxis) {
  const layout = mainFillLayoutLimitation(source, axis);
  if (layout) return layout;
  if (source.computed.aspectRatio !== "auto" || automaticCrossMargin(source.element, axis))
    return "Use Code to change this sizing.";
  if (!availableFillParent(source, axis)) return `Set the parent's ${axis} first.`;
  if (
    axis === "height" &&
    !boundedParent(source, axis) &&
    otherGrowers(source).length &&
    !projectableColumn(parentSizingContext(source))
  )
    return "Use Code to change this source-controlled Column.";
  const parent = source.element.parentElement;
  if (!parent) return "Fill is unavailable for this layout.";
  return mainFillSiblingLimitation(source, axis, parent);
}

function mainFillSiblingLimitation(source: SizingContext, axis: SizingAxis, parent: HTMLElement) {
  for (const element of flowParticipants(parent)) {
    if (element === source.element) continue;
    if (!ownedMainSibling(source.document, element, axis)) return "Use Code to change this sizing.";
    if (
      getComputedStyle(element).flexGrow !== "0" &&
      [source.element, element].some((child) => fillDecoration(child, axis) === null)
    )
      return "Use Code to change this sizing.";
  }
  return null;
}

function mainFillLayoutLimitation(source: SizingContext, axis: SizingAxis) {
  const parent = source.element.parentElement;
  if (!parent || !supportedFlowWrapping(parent, source.flow.direction ?? ""))
    return "Fill is unavailable for this layout.";
  return getComputedStyle(parent).flexWrap === "wrap" &&
    fillDecoration(source.element, axis) === null
    ? "Use Code to change this sizing."
    : null;
}

function ownedMainSibling(
  document: DesignDocument,
  element: HTMLElement | SVGElement,
  axis: SizingAxis,
) {
  const node = document.nodes[element.dataset.orcId ?? ""];
  if (!node) return false;
  return (
    (sizingMode(sizingContext(document, node, element), axis) !== null ||
      ownedMainFill(sizingContext(document, node, element), axis)) &&
    !automaticCrossMargin(element, axis)
  );
}

export function prepareFlowSizing(
  document: DesignDocument,
  node: DesignNode,
  element: HTMLElement | SVGElement,
) {
  const context = sizingContext(document, node, element);
  const frozen = {
    width: sizingParticipant(context, "width"),
    height: sizingParticipant(context, "height"),
  };
  const source = flowSupply(context);
  return (parent: HTMLElement, direction: string, values: Styles) => {
    const axis = direction === "row" ? "width" : "height";
    const incoming = projectedParticipant(frozen[axis], axis, values);
    const siblings = flowParticipants(parent).filter((child) => child.dataset.orcId !== node.id);
    const records = siblings.map((child) => {
      const sibling = document.nodes[child.dataset.orcId ?? ""];
      return sibling ? sizingParticipant(sizingContext(document, sibling, child), axis) : null;
    });
    if (!incoming.exact && !records.some((record) => record?.exact)) return false;
    const parentNode = document.nodes[parent.dataset.orcId ?? ""];
    if (!parentNode || !supportedFlowWrapping(flowBox(parent), direction))
      throw new Error("Fill is unavailable for this layout.");
    const cohort = [incoming, ...records];
    prepareFlowExtent({
      source,
      target: sizingContext(document, parentNode, parent),
      axis,
      values,
      cohort,
    });
    if (cohort.some((record) => !record || !supportedParticipant(record)))
      throw new Error("Use Code to change this sizing.");
    return true;
  };
}

type FlowSizingCandidate = {
  source: ReturnType<typeof flowSupply>;
  target: SizingContext;
  axis: SizingAxis;
  values: Styles;
  cohort: (ReturnType<typeof sizingParticipant> | null)[];
};

function flowSupply(source: SizingContext) {
  const style = window.document.createElement("div").style;
  style.cssText = source.style.cssText;
  const supplied = (axis: SizingAxis) =>
    independentFixed(source, axis) ||
    intrinsicContribution(source, axis, { id: source.node.id, kind: "placement" });
  return { id: source.node.id, style, width: supplied("width"), height: supplied("height") };
}

function prepareFlowExtent({ source, target, axis, values, cohort }: FlowSizingCandidate) {
  if (boundedSizing(target, axis)) return;
  if (target.node.kind !== "frame" || !ownedSizing(target, axis))
    throw new Error("Use Code to change this sizing.");
  if (!intrinsicFlowSupply(source, target, axis, cohort))
    throw new Error(`Set the parent's ${axis} first.`);
  const incoming = cohort[0];
  if (axis !== "height" || !incoming?.exact) return;
  values["flex-shrink"] = sizingPriority(source.style, "flex-shrink", "1");
  values["flex-basis"] = sizingPriority(source.style, "flex-basis", "auto");
  incoming.shrink = "1";
  incoming.basis = "auto";
}

function intrinsicFlowSupply(
  source: FlowSizingCandidate["source"],
  target: SizingContext,
  axis: SizingAxis,
  cohort: FlowSizingCandidate["cohort"],
) {
  const change: SupplyChange = {
    id: cohort[0]?.exact ? source.id : target.node.id,
    kind: "placement",
  };
  if (target.computed.flexWrap !== "nowrap") return false;
  if (
    axis === "height" &&
    cohort.filter((record) => record?.exact).length > 1 &&
    !projectableColumn(target)
  )
    return false;
  return intrinsicSizing(target, axis, change) || source[axis];
}

function sizingParticipant(source: SizingContext, axis: SizingAxis) {
  return {
    owned: ownedSizing(source, axis),
    content: contentSizing(source),
    automatic: automaticCrossMargin(source.element, axis),
    exact: ownedMainFill(source, axis),
    value: source.style.getPropertyValue(axis),
    grow: source.flow.grow,
    shrink: source.flow.shrink,
    basis: source.flow.basis,
  };
}

function projectedParticipant(
  source: ReturnType<typeof sizingParticipant>,
  axis: SizingAxis,
  values: Styles,
) {
  const value = (key: string, fallback: string) =>
    (values[key] ?? fallback).replace(/\s*!important\s*$/iu, "");
  const result = {
    ...source,
    value: value(axis, source.value),
    grow: value("flex-grow", source.grow),
    shrink: value("flex-shrink", source.shrink),
    basis: value("flex-basis", source.basis),
  };
  result.exact =
    source.exact &&
    result.value === "auto" &&
    result.grow === "1" &&
    result.shrink === source.shrink &&
    result.basis === source.basis;
  return result;
}

function supportedParticipant(source: ReturnType<typeof sizingParticipant>) {
  if (!source.owned || source.automatic) return false;
  if (source.exact) return true;
  return (
    source.grow === "0" &&
    source.shrink === "0" &&
    source.basis === "auto" &&
    dimensionMode(source.value, source.content, true) !== null
  );
}

function flowParticipants(parent: Element) {
  return Array.from(flowBox(parent).children).filter((child): child is HTMLElement | SVGElement => {
    const style = getComputedStyle(child);
    return (
      (child instanceof HTMLElement || child instanceof SVGElement) &&
      style.display !== "none" &&
      !["absolute", "fixed"].includes(style.position)
    );
  });
}

function ownedStretch(source: SizingContext) {
  return (
    !Object.hasOwn(source.node.style, "place-self") &&
    [
      "",
      "auto",
      "normal",
      "stretch",
      "start",
      "end",
      "flex-start",
      "flex-end",
      "center",
      "baseline",
      "self-start",
      "self-end",
    ].includes(source.style.alignSelf)
  );
}

function boundedParent(source: SizingContext, axis: SizingAxis) {
  const parent = parentSizingContext(source);
  return parent !== null && boundedSizing(parent, axis);
}

function availableFillParent(source: SizingContext, axis: SizingAxis) {
  if (boundedParent(source, axis)) return true;
  return intrinsicSizing(parentSizingContext(source), axis, { id: source.node.id, kind: "sizing" });
}

function intrinsicSizing(parent: SizingContext | null, axis: SizingAxis, change: SupplyChange) {
  while (parent) {
    if (
      parent.node.kind !== "frame" ||
      !ownedSizing(parent, axis) ||
      !intrinsicWrapping(parent, axis)
    )
      return false;
    if (!intrinsicProjectionOwner(parent, axis)) return false;
    if (intrinsicContribution(parent, axis, change)) return true;
    if (!ownedFillRelationship(parent, axis)) return false;
    parent = parentSizingContext(parent);
  }
  return false;
}

function intrinsicWrapping(source: SizingContext, axis: SizingAxis) {
  return (
    source.computed.flexWrap === "nowrap" ||
    (axis === "height" &&
      source.computed.flexDirection === "row" &&
      source.computed.flexWrap === "wrap")
  );
}

function projectableColumn(source: SizingContext | null) {
  return Boolean(
    source &&
    source.node.kind === "frame" &&
    columnProjectionEligible(source.node.style) &&
    ["flex", "grid"].includes(source.style.display) &&
    source.computed.flexDirection === "column" &&
    source.computed.flexWrap === "nowrap",
  );
}

function otherGrowers(source: SizingContext) {
  const parent = source.element.parentElement;
  return parent
    ? flowParticipants(parent).filter(
        (element) => element !== source.element && getComputedStyle(element).flexGrow !== "0",
      )
    : [];
}

function boundedSizing(context: SizingContext, axis: SizingAxis) {
  let source: SizingContext | null = context;
  while (source) {
    if (source.node.kind !== "frame" || !ownedSizing(source, axis)) return false;
    if (sizingMode(source, axis) === "Fixed" && activePixel(source, axis)) return true;
    if (activeEqualLimits(source, axis)) return true;
    if (!ownedFillRelationship(source, axis) && !ownedConstraintRelationship(source, axis))
      return false;
    source = parentSizingContext(source);
  }
  return false;
}

function ownedConstraintRelationship(source: SizingContext, axis: SizingAxis) {
  return (
    source.owners[axis] === "Constraints" &&
    source.computed.position === "absolute" &&
    constraintMode(source.style, axis) === "both"
  );
}

function parentSizingContext(source: SizingContext) {
  const element = objectParent(source.element);
  return source.parent?.kind === "frame" && element
    ? sizingContext(source.document, source.parent, element)
    : null;
}

function ownedFillRelationship(source: SizingContext, axis: SizingAxis) {
  if (
    source.owners[axis] !== "Fill" ||
    source.computed.aspectRatio !== "auto" ||
    automaticCrossMargin(source.element, axis)
  )
    return false;
  if (source.main === axis)
    return ownedMainFill(source, axis) && mainFillLayoutLimitation(source, axis) === null;
  const parent = source.element.parentElement;
  return Boolean(
    parent &&
    crossAxis(source, axis) &&
    ownedStretch(source) &&
    supportedFlowWrapping(parent, source.flow.direction ?? ""),
  );
}

function suppliedFillParent(source: SizingContext, axis: SizingAxis) {
  const parent = parentSizingContext(source);
  return parent !== null && (boundedSizing(parent, axis) || intrinsicContribution(parent, axis));
}

function intrinsicContribution(
  source: SizingContext,
  axis: SizingAxis,
  change: SupplyChange | null = null,
): boolean {
  if (!ownedSizing(source, axis)) return false;
  if (source.node.id !== change?.id && independentFixed(source, axis)) return true;
  if (activeEqualLimits(source, axis)) return true;
  return intrinsicContent(source, axis, change);
}

function intrinsicContent(source: SizingContext, axis: SizingAxis, change: SupplyChange | null) {
  if (change && !intrinsicProjectionOwner(source, axis, change)) return false;
  if (positiveMinimum(source, axis)) return true;
  if (change && !intrinsicProjection(source, axis, change)) return false;
  if (!contentSizing(source)) return false;
  if (source.node.kind === "text") return source.node.runs.some((run) => run.text.length > 0);
  return intrinsicChildren(source, axis, change);
}

function intrinsicChildren(source: SizingContext, axis: SizingAxis, change: SupplyChange | null) {
  return flowParticipants(source.element).some((element) => {
    const node = source.document.nodes[element.dataset.orcId ?? ""];
    return (
      node?.parentId === source.node.id &&
      source.node.children.includes(node.id) &&
      intrinsicContribution(sizingContext(source.document, node, element), axis, change)
    );
  });
}

function independentFixed(source: SizingContext, axis: SizingAxis) {
  return sizingMode(source, axis) === "Fixed" && activePixel(source, axis);
}

function positiveMinimum(source: SizingContext, axis: SizingAxis) {
  const property = `min-${axis}`;
  const value = pixelValue(source.style.getPropertyValue(property));
  return value !== null && value > 0 && activePixel(source, property);
}

function intrinsicProjectionOwner(
  source: SizingContext,
  axis: SizingAxis,
  change: SupplyChange | null = null,
) {
  if (source.owners[axis] !== "Fill") return true;
  if (!ownedFillRelationship(source, axis)) return false;
  if (change?.kind === "placement" && change.id === source.node.id) return true;
  return (
    axis !== "height" ||
    source.main !== axis ||
    otherGrowers(source).length === 0 ||
    projectableColumn(parentSizingContext(source))
  );
}

function intrinsicProjection(source: SizingContext, axis: SizingAxis, change: SupplyChange) {
  if (source.owners[axis] !== "Fill" || axis !== "height" || source.main !== axis) return true;
  if (
    source.node.id === change.id ||
    (change.kind === "sizing" && containsNode(source.document, change.id, source.node.id))
  )
    return true;
  return (
    source.style.flexBasis === "auto" ||
    source.computed.minHeight === "auto" ||
    (ownedSharedFill(source.element, axis) && projectableColumn(parentSizingContext(source)))
  );
}

function inspectFillDependency(document: DesignDocument, id: string, axis: SizingAxis) {
  const node = document.nodes[id];
  const element = sizingElement(id);
  if (!node || !element) return null;
  const source = sizingContext(document, node, element);
  const mode = sizingMode(source, axis);
  return {
    fill: ownedSizing(source, axis) && ownedFillRelationship(source, axis),
    supplied: suppliedFillParent(source, axis),
    exit: mode === "Fixed" || mode === "Fit",
  };
}

export function prepareFillDependencies(document: DesignDocument) {
  return captureFillDependencies(document, inspectFillDependency);
}

export function withFillDependencies(
  document: DesignDocument,
  candidate: DesignDocument,
  validate: () => void,
) {
  const check = prepareFillDependencies(document);
  return () => {
    validate();
    check(candidate);
  };
}

function activeEqualLimits(source: SizingContext, axis: SizingAxis) {
  const minimum = pixelValue(source.style.getPropertyValue(`min-${axis}`));
  return (
    minimum !== null &&
    minimum === pixelValue(source.style.getPropertyValue(`max-${axis}`)) &&
    activePixel(source, `min-${axis}`) &&
    activePixel(source, `max-${axis}`)
  );
}

function activePixel(source: SizingContext, property: string) {
  const value = pixelValue(source.style.getPropertyValue(property));
  return (
    value !== null &&
    value === pixelValue(source.element.computedStyleMap().get(property)?.toString() ?? "")
  );
}

function overflowsParent(source: SizingContext, axis: SizingAxis) {
  const parent = objectParent(source.element);
  if (source.parent?.kind !== "frame" || !parent) return false;
  const world = source.element.closest(".canvas-world");
  if (!world) return false;
  const scale = new DOMMatrix(getComputedStyle(world).transform).a;
  const child = source.element.getBoundingClientRect();
  const bounds = parent.getBoundingClientRect();
  const style = getComputedStyle(parent);
  const [start, end] =
    axis === "width" ? (["left", "right"] as const) : (["top", "bottom"] as const);
  const minimum =
    bounds[start] + Number.parseFloat(style.getPropertyValue(`border-${start}-width`)) * scale;
  const maximum =
    bounds[end] - Number.parseFloat(style.getPropertyValue(`border-${end}-width`)) * scale;
  return child[start] < minimum - 0.1 || child[end] > maximum + 0.1;
}

function sizingMode(source: SizingContext, axis: SizingAxis): SizingMode | null {
  if (!ownedSizing(source, axis)) return null;
  if (!fixedFlexFactors(source, axis)) return null;
  return dimensionMode(
    source.style.getPropertyValue(axis),
    contentSizing(source),
    axis === "height" || source.main === axis,
  );
}

function dimensionMode(value: string, content: boolean, automatic: boolean): SizingMode | null {
  if (pixelValue(value) !== null) return "Fixed";
  if (!content) return null;
  if (["max-content", "fit-content"].includes(value)) return "Fit";
  return ["", "auto"].includes(value) && automatic ? "Fit" : null;
}

function fixedFlexFactors(source: SizingContext, axis: SizingAxis) {
  return (
    source.main !== axis ||
    (source.flow.grow === "0" && source.flow.shrink === "0" && source.flow.basis === "auto")
  );
}

function ownedSizing(source: SizingContext, axis: SizingAxis) {
  return (
    ownedSizingRelationship(source) &&
    ownedDimension(source, axis) &&
    (source.main !== axis ||
      ownedFlexFactors(source.style, source.computed) ||
      ownedSharedFill(source.element, axis))
  );
}

function ownedSizingRelationship(source: SizingContext) {
  const { element, computed, parent, flow } = source;
  if (!element.getClientRects().length || hasCoordinateTransform(computed)) return false;
  if (parent && objectParent(element)?.dataset.orcId !== parent.id) return false;
  if (flow.direction && !["row", "column"].includes(flow.direction)) return false;
  return (
    computed.writingMode === "horizontal-tb" &&
    computed.direction === "ltr" &&
    ["static", "relative", "absolute"].includes(computed.position) &&
    ownedDisplay(element, computed)
  );
}

function ownedDisplay(element: Element, computed: CSSStyleDeclaration) {
  return (
    ["block", "flex", "inline-flex", "flow-root", "inline-block"].includes(computed.display) ||
    flowBox(element) !== element
  );
}

function ownedDimension(source: SizingContext, axis: SizingAxis) {
  const { style, computed } = source;
  if (competingDimension(style, axis) || uncertainInsets(source, axis)) return false;
  const value = style.getPropertyValue(axis);
  if (computed.aspectRatio !== "auto" && pixelValue(value) === null) return false;
  if (pixelValue(value) === null && !["", "auto", "max-content", "fit-content"].includes(value))
    return false;
  if (!["min", "max"].every((bound) => ownedLimit(style.getPropertyValue(`${bound}-${axis}`))))
    return false;
  return pixelValue(computed.getPropertyValue(axis)) !== null;
}

function competingDimension(style: CSSStyleDeclaration, axis: SizingAxis) {
  const logical = axis === "width" ? "inline-size" : "block-size";
  return ["all", logical, `min-${logical}`, `max-${logical}`].some((key) =>
    style.getPropertyValue(key),
  );
}

function uncertainInsets(source: SizingContext, axis: SizingAxis) {
  if (
    source.computed.position !== "absolute" ||
    pixelValue(source.style.getPropertyValue(axis)) !== null
  )
    return false;
  const logical = axis === "width" ? "inset-inline" : "inset-block";
  return (
    Array.from(source.style).some((key) => key.startsWith(logical)) ||
    Boolean(source.style.inset && (!source.style.left || !source.style.top))
  );
}

function ownedLimit(value: string) {
  return ["", "auto", "none"].includes(value) || pixelValue(value) !== null;
}

function ownedFlexFactors(style: CSSStyleDeclaration, computed: CSSStyleDeclaration) {
  const numeric = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu;
  if (style.flex && (!style.flexGrow || !style.flexShrink || !style.flexBasis)) return false;
  const basis = style.flexBasis || computed.flexBasis;
  return (
    ["flex-grow", "flex-shrink"].every((key) => {
      const value = style.getPropertyValue(key) || computed.getPropertyValue(key);
      return numeric.test(value) && Number.isFinite(Number(value));
    }) &&
    (basis === "auto" || pixelValue(basis) !== null)
  );
}

function pixelValue(value: string) {
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/iu.test(value)) return null;
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : null;
}

function contentSizing(source: SizingContext) {
  if (source.computed.aspectRatio !== "auto") return false;
  if (source.node.kind === "text") return !["textarea", "option"].includes(source.node.tag);
  return (
    source.node.kind === "frame" &&
    (["flex", "inline-flex"].includes(source.style.display) ||
      flowBox(source.element) !== source.element) &&
    ["row", "column"].includes(source.computed.flexDirection)
  );
}

export function prepareSizing(
  document: DesignDocument,
  id: string,
  axis: SizingAxis,
  mode: SizingMode,
  value?: number,
) {
  const node = document.nodes[id];
  if (!node) throw new Error("The object no longer exists.");
  const element = checkedSizingElement(document, id);
  const source = sizingContext(document, node, element);
  const current = sizingReadout(source, axis);
  if (isLocked(document, id)) throw new Error("Unlock the object before changing its size.");
  checkSizingAction(current, mode, value);
  if (value === undefined && current.mode === mode) return null;
  if (mode === "Fit") checkFitDependency(source, axis);
  const values = sizingValues(source, axis, mode, value);
  if (
    mode === "Fixed" &&
    current.mode === "Fixed" &&
    value === pixelValue(source.style.getPropertyValue(axis))
  )
    return null;
  const mutation = preparedSizingBatch(source, axis, mode, values);
  return {
    mutation,
    validate: withFillDependencies(
      document,
      previewDocument(document, mutation),
      sizingValidation(source, axis, mode, value === undefined),
    ),
  };
}

function preparedSizingBatch(
  source: SizingContext,
  axis: SizingAxis,
  mode: SizingMode,
  values: Styles,
) {
  const mutation = sizingBatch(source.node.id, values);
  if (mode !== "Fill" && ownedSharedFill(source.element, axis))
    mutation.mutations[0].unset?.push(...fillInputProperties);
  if (
    axis === "height" &&
    !activeEqualLimits(source, axis) &&
    (mode === "Fit" || (mode === "Fill" && !boundedParent(source, axis)))
  )
    mutation.mutations.push(...intrinsicHeightChanges(source));
  mutation.mutations.push(...prepareFillSharing(source.document)(mutation.mutations));
  return mutation;
}

function checkSizingAction(current: SizingReadout, mode: SizingMode, value: number | undefined) {
  if (!current.convertible || (value !== undefined && !current.editable))
    throw new Error(current.message ?? "Size controlled by source. Edit in Code.");
  if (mode === "Fit" && !current.fit) throw new Error("Fit is unavailable for this content.");
  if (mode === "Fill" && !current.fill)
    throw new Error(current.message ?? "Fill is unavailable for this layout.");
}

function checkedSizingElement(document: DesignDocument, id: string) {
  const canvas = window.document.querySelector(".canvas");
  if (canvas?.getAttribute("data-orc-revision") !== String(document.revision))
    throw new Error("The layout changed. Try again.");
  const element = sizingElement(id);
  if (!element?.getClientRects().length)
    throw new Error("The object's rendered size is unavailable.");
  return element;
}

function sizingValues(
  source: SizingContext,
  axis: SizingAxis,
  mode: SizingMode,
  value: number | undefined,
) {
  if (mode === "Fill") return fillValues(source, axis);
  const dimension = value ?? pixelValue(source.computed.getPropertyValue(axis));
  if (mode === "Fixed" && (dimension === null || !Number.isFinite(dimension) || dimension < 0))
    throw new Error("Enter a valid size.");
  const values: Styles = {
    [axis]: sizingPriority(source.style, axis, mode === "Fit" ? "max-content" : `${dimension}px`),
  };
  if (source.main === axis)
    for (const [key, next] of [
      ["flex-grow", "0"],
      ["flex-shrink", "0"],
      ["flex-basis", "auto"],
    ])
      values[key] = sizingPriority(source.style, key, next);
  return values;
}

function fillValues(source: SizingContext, axis: SizingAxis) {
  const values: Styles = { [axis]: sizingPriority(source.style, axis, "auto") };
  const factors =
    source.main === axis
      ? [
          ["flex-grow", "1"],
          ["flex-shrink", axis === "height" && !boundedParent(source, axis) ? "1" : "0"],
          ["flex-basis", axis === "height" && !boundedParent(source, axis) ? "auto" : "0px"],
        ]
      : [["align-self", "stretch"]];
  for (const [key, value] of factors) values[key] = sizingPriority(source.style, key, value);
  return values;
}

function checkFitDependency(source: SizingContext, axis: SizingAxis) {
  if (source.node.kind !== "frame") return;
  const direction = source.computed.flexDirection;
  if (axis !== (direction === "row" ? "width" : "height")) return;
  if (ownedSizing(source, axis) && activeEqualLimits(source, axis)) return;
  const growing = checkedGrowingChildren(source, axis);
  if (!growing.length) return;
  if (!supportedIntrinsicCohort(source, axis, growing.length))
    throw new Error(`Set the parent's ${axis} first.`);
}

function supportedIntrinsicCohort(source: SizingContext, axis: SizingAxis, count: number) {
  if (axis === "height" && count > 1 && !projectableColumn(source)) return false;
  return intrinsicContribution(source, axis, { id: source.node.id, kind: "sizing" });
}

function checkedGrowingChildren(source: SizingContext, axis: SizingAxis) {
  const growing = flowParticipants(source.element).filter(
    (child) => getComputedStyle(child).flexGrow !== "0",
  );
  if (
    growing.some((element) => {
      const node = source.document.nodes[element.dataset.orcId ?? ""];
      return !node || !ownedMainFill(sizingContext(source.document, node, element), axis);
    })
  )
    throw new Error("Use Code to change this content-dependent sizing.");
  return growing;
}

function intrinsicHeightChanges(
  source: SizingContext,
): ReturnType<typeof sizingBatch>["mutations"] {
  return flowParticipants(source.element).flatMap((element) => {
    const node = source.document.nodes[element.dataset.orcId ?? ""];
    if (!node || node.parentId !== source.node.id || !source.node.children.includes(node.id))
      return [];
    const child = sizingContext(source.document, node, element);
    if (independentFixed(child, "height") || activeEqualLimits(child, "height")) return [];
    return [...intrinsicHeightChange(child), ...intrinsicHeightChanges(child)];
  });
}

function intrinsicHeightChange(source: SizingContext) {
  if (source.main !== "height" || source.owners.height !== "Fill") return [];
  if (!ownedMainFill(source, "height"))
    throw new Error("Use Code to change this content-dependent sizing.");
  if (retainedColumnProjection(source)) return [];
  if (source.style.flexBasis === "auto" && source.style.flexShrink === "1") return [];
  if (isLocked(source.document, source.node.id))
    throw new Error("Unlock the affected Fill objects before changing this layout.");
  const batch = sizingBatch(source.node.id, {
    "flex-shrink": sizingPriority(source.style, "flex-shrink", "1"),
    "flex-basis": sizingPriority(source.style, "flex-basis", "auto"),
  });
  if (ownedSharedFill(source.element, "height"))
    batch.mutations[0].unset?.push(...fillInputProperties);
  return batch.mutations;
}

function retainedColumnProjection(source: SizingContext) {
  const parent = objectParent(source.element);
  if (!otherGrowers(source).length) return parent && flowBox(parent) !== parent;
  if (!projectableColumn(parentSizingContext(source)))
    throw new Error("Use Code to change this source-controlled Column.");
  return true;
}

function sizingBatch(id: string, values: Styles) {
  return {
    kind: "batch",
    mutations: [
      { kind: "style", id, values: {}, unset: Object.keys(values) },
      { kind: "style", id, values },
    ],
  } satisfies Extract<Mutation, { kind: "batch" }>;
}

function sizingValidation(
  source: SizingContext,
  axis: SizingAxis,
  mode: SizingMode,
  capture: boolean,
) {
  const before = pixelValue(source.computed.getPropertyValue(axis));
  const siblings =
    mode === "Fill" && source.main === axis && source.element.parentElement
      ? flowParticipants(source.element.parentElement)
          .filter(
            (element) => element !== source.element && getComputedStyle(element).flexGrow === "0",
          )
          .map((element) => ({
            id: element.dataset.orcId!,
            size: getComputedStyle(element).getPropertyValue(axis),
          }))
      : [];
  return () => {
    const element = checkedSizingElement(source.document, source.node.id);
    const current = sizingReadout(sizingContext(source.document, source.node, element), axis);
    const native = getComputedStyle(element);
    if (current.mode !== mode) throw new Error("Size controlled by source. Edit in Code.");
    checkSizingAction(current, mode, undefined);
    for (const dimension of ["width", "height"])
      if (pixelValue(native.getPropertyValue(dimension)) === null)
        throw new Error("The proposed size is unavailable.");
    validateSiblingSizes(siblings, axis);
    if (
      capture &&
      mode === "Fixed" &&
      (before === null || Math.abs(Number.parseFloat(native.getPropertyValue(axis)) - before) > 0.1)
    )
      throw new Error("The size change cannot preserve the current box. Edit in Code.");
  };
}

function validateSiblingSizes(siblings: { id: string; size: string }[], axis: SizingAxis) {
  if (
    siblings.some(({ id, size }) => {
      const sibling = sizingElement(id);
      return !sibling || getComputedStyle(sibling).getPropertyValue(axis) !== size;
    })
  )
    throw new Error("The size change cannot preserve sibling sizes. Edit in Code.");
}

function sizingPriority(style: CSSStyleDeclaration, property: string, value: string) {
  return value + (style.getPropertyPriority(property) ? " !important" : "");
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
  element: HTMLElement | SVGElement,
  computed: CSSStyleDeclaration,
  parent: CSSStyleDeclaration | null,
  direction: string | null,
) {
  if (!parent || !direction) return false;
  const style = element.style;
  const row = direction.startsWith("row");
  const cross = row ? "height" : "width";
  const alignment = computed.alignSelf === "auto" ? parent.alignItems : computed.alignSelf;
  return (
    ["", "auto"].includes(style.getPropertyValue(cross)) &&
    ["normal", "stretch"].includes(alignment) &&
    !automaticCrossMargin(element, cross)
  );
}

function automaticCrossMargin(element: HTMLElement | SVGElement, axis: SizingAxis) {
  const margins =
    axis === "height" ? ["margin-top", "margin-bottom"] : ["margin-left", "margin-right"];
  return margins.some((margin) => element.computedStyleMap().get(margin)?.toString() === "auto");
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
    flow: readFlexSizing(element, computed, parentStyle),
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
): "Fill" | "Constraints" | null {
  const { style, flow } = source;
  const main = flow.direction?.startsWith("row") ? "width" : "height";
  if (flow.direction && (axis === main ? flow.grow !== "0" : flow.crossFill)) return "Fill";
  if (!source.constrained || !["", "auto", "stretch"].includes(style.getPropertyValue(axis)))
    return null;
  const edges = axis === "width" ? ["left", "right"] : ["top", "bottom"];
  return edges.every((edge) => !["", "auto"].includes(style.getPropertyValue(edge)))
    ? "Constraints"
    : null;
}

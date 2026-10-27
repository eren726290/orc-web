import type { AtomicMutation } from "../../../shared/commands/commands";
import {
  containsNode,
  isLocked,
  type DesignDocument,
  type DesignNode,
  type Styles,
} from "../../../shared/document/model";

import {
  columnMarker,
  columnVersion,
  columnProjectionEligible,
  hasColumnProjection,
} from "../../../shared/source/intrinsic-column";
import { flowBox, objectParent } from "./layout-box";

type Axis = "width" | "height";
type ElementBox = HTMLElement | SVGElement;
type StyleEdit = Extract<AtomicMutation, { kind: "style" }>;
const basisInput = "--orc-fill-basis";
const decorationInput = "--orc-fill-decoration";
export const fillInputProperties = [basisInput, decorationInput];
const shrink = `calc(var(${basisInput}) / (var(${basisInput}) - var(${decorationInput})))`;
const contentBasis = `calc(var(${basisInput}) - var(${decorationInput}))`;

function authored(styles: Styles) {
  const style = document.createElement("div").style;
  style.cssText = Object.entries(styles)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
  return style;
}

function pixels(value: string) {
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/iu.test(value)) return null;
  const result = Number.parseFloat(value);
  return Number.isFinite(result) ? result : null;
}

function single(style: CSSStyleDeclaration, axis: Axis) {
  return (
    style.getPropertyValue(axis) === "auto" &&
    style.flexGrow === "1" &&
    style.flexShrink === "0" &&
    pixels(style.flexBasis) === 0
  );
}

function autoSingle(style: CSSStyleDeclaration, axis: Axis) {
  return (
    axis === "height" &&
    style.height === "auto" &&
    style.flexGrow === "1" &&
    style.flexShrink === "1" &&
    style.flexBasis === "auto"
  );
}

function shared(style: CSSStyleDeclaration, axis: Axis) {
  return (
    style.getPropertyValue(axis) === "auto" &&
    style.flexGrow === "1" &&
    style.flexShrink === shrink &&
    [
      style.boxSizing === "border-box" ? `var(${basisInput})` : contentBasis,
      intrinsicBasis(style.boxSizing),
    ].includes(style.flexBasis)
  );
}

function intrinsicBasis(box: string) {
  return box === "border-box"
    ? `calc(0% + var(${basisInput}))`
    : `calc(0% + var(${basisInput}) - var(${decorationInput}))`;
}

function decoration(style: CSSStyleDeclaration, axis: Axis, element?: ElementBox): number | null {
  if (!ownedBox(style, element)) return null;
  const sides = axis === "width" ? ["left", "right"] : ["top", "bottom"];
  let total = 0;
  for (const side of sides) {
    const padding = ownedPixels(style, `padding-${side}`, element);
    const border = borderPixels(style, side, element);
    if (padding === null || border === null) return null;
    total += padding + border;
  }
  return total;
}

function ownedBox(style: CSSStyleDeclaration, element?: ElementBox) {
  if (
    Array.from(style).some((key) => /^(?:padding|border)-(?:inline|block)/u.test(key)) ||
    style.all
  )
    return false;
  if (!["", "border-box", "content-box"].includes(style.boxSizing)) return false;
  return !element || !style.boxSizing || getComputedStyle(element).boxSizing === style.boxSizing;
}

function ownedPixels(style: CSSStyleDeclaration, property: string, element?: ElementBox) {
  const value = pixels(style.getPropertyValue(property) || "0px");
  if (value === null) return null;
  if (element && pixels(getComputedStyle(element).getPropertyValue(property)) !== value)
    return null;
  return value;
}

function borderPixels(style: CSSStyleDeclaration, side: string, element?: ElementBox) {
  const property = `border-${side}-style`;
  const kind = style.getPropertyValue(property) || "none";
  if (
    ![
      "none",
      "hidden",
      "solid",
      "dashed",
      "dotted",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset",
    ].includes(kind)
  )
    return null;
  if (element && getComputedStyle(element).getPropertyValue(property) !== kind) return null;
  if (["none", "hidden"].includes(kind)) return 0;
  const value = ownedPixels(style, `border-${side}-width`, element);
  // Fractional border widths can snap differently at another device scale.
  return value !== null && Number.isInteger(value) ? value : null;
}

export function fillDecoration(element: ElementBox, axis: Axis) {
  return decoration(element.style, axis, element);
}

function sharedInputs(element: ElementBox, axis: Axis) {
  const style = element.style;
  if (!shared(style, axis)) return null;
  const basis = pixels(style.getPropertyValue(basisInput).trim());
  const amount = pixels(style.getPropertyValue(decorationInput).trim());
  if (
    basis === null ||
    amount === null ||
    basis <= amount ||
    fillDecoration(element, axis) !== amount
  )
    return null;
  return activeInputs(element, basis, amount) ? { basis, amount } : null;
}

function activeInputs(element: ElementBox, basis: number, amount: number) {
  const style = element.style;
  const active = getComputedStyle(element);
  const expected = style.boxSizing === "border-box" ? basis : basis - amount;
  const projected = objectParent(element);
  const intrinsic = style.flexBasis === intrinsicBasis(style.boxSizing);
  if (intrinsic && (!projected || flowBox(projected) === projected)) return false;
  const basisValue = intrinsic ? `calc(0% + ${expected}px)` : `${expected}px`;
  if (active.flexGrow !== "1" || active.flexBasis !== basisValue) return false;
  const factor = Number(active.flexShrink);
  const ratio = basis / (basis - amount);
  if (!Number.isFinite(factor) || Math.abs(factor - ratio) > 0.00001 * ratio) return false;
  return activeInputValues(style, active);
}

function activeInputValues(style: CSSStyleDeclaration, active: CSSStyleDeclaration) {
  return fillInputProperties.every(
    (key) =>
      pixels(active.getPropertyValue(key).trim()) === pixels(style.getPropertyValue(key).trim()),
  );
}

function growingSiblings(element: ElementBox) {
  return Array.from(element.parentElement?.children ?? []).filter((child): child is ElementBox => {
    if (!(child instanceof HTMLElement || child instanceof SVGElement)) return false;
    const style = getComputedStyle(child);
    return (
      style.display !== "none" &&
      !["absolute", "fixed"].includes(style.position) &&
      style.flexGrow !== "0"
    );
  });
}

export function ownedSharedFill(element: ElementBox, axis: Axis) {
  const input = sharedInputs(element, axis);
  if (!input) return false;
  const cohort = growingSiblings(element).map((child) => sharedInputs(child, axis));
  if (!cohort.length || cohort.some((peer) => !peer || peer.basis !== input.basis)) return false;
  return input.basis === Math.max(200, ...cohort.map((peer) => (peer?.amount ?? 0) + 100));
}

export function ownedMainFillProjection(element: ElementBox, axis: Axis) {
  if (ownedSharedFill(element, axis)) return true;
  if (ownedAutoSingle(element, axis)) return true;
  if (!single(element.style, axis)) return false;
  const active = getComputedStyle(element);
  return active.flexGrow === "1" && active.flexShrink === "0" && pixels(active.flexBasis) === 0;
}

function ownedAutoSingle(element: ElementBox, axis: Axis) {
  if (!autoSingle(element.style, axis) || !element.parentElement) return false;
  const parent = getComputedStyle(element.parentElement);
  const active = getComputedStyle(element);
  const cohort = growingSiblings(element);
  return (
    ["flex", "inline-flex"].includes(parent.display) &&
    parent.flexDirection === "column" &&
    parent.flexWrap === "nowrap" &&
    ["flex-grow", "flex-shrink", "flex-basis"].every(
      (key) => active.getPropertyValue(key) === element.style.getPropertyValue(key),
    ) &&
    element.computedStyleMap().get(axis)?.toString() === "auto" &&
    cohort.length === 1 &&
    cohort[0] === element
  );
}

function snapshot(document: DesignDocument) {
  return Object.values(document.nodes).map(snapshotRecord);
}

function snapshotRecord(node: DesignNode) {
  const found = window.document.querySelector(
    `.canvas-world [data-orc-id="${CSS.escape(node.id)}"]`,
  );
  const base = {
    id: node.id,
    parentId: node.parentId,
    styles: node.style,
    appliedStyles: node.style,
    removed: false,
    layoutDirection: "row",
    wrapping: "nowrap",
    items: "normal",
    automaticHeightMargin: false,
  };
  if (!(found instanceof HTMLElement || found instanceof SVGElement))
    return {
      ...base,
      position: "",
      box: "border-box",
      display: "none",
      direction: "",
      managed: false,
      shared: false,
      reserved: false,
    };
  return { ...base, ...nativeRecord(found) };
}

function nativeRecord(found: ElementBox) {
  const active = getComputedStyle(found);
  const layout = getComputedStyle(flowBox(found));
  const direction = found.parentElement ? getComputedStyle(found.parentElement).flexDirection : "";
  const axis = direction === "row" ? "width" : "height";
  const shared = ownedSharedFill(found, axis);
  const reserved = !shared && fillInputProperties.some((key) => found.style.getPropertyValue(key));
  return {
    position: active.position,
    box: active.boxSizing,
    display: layout.display,
    layoutDirection: layout.flexDirection,
    wrapping: layout.flexWrap,
    items: layout.alignItems,
    automaticHeightMargin: ["margin-top", "margin-bottom"].some(
      (key) => found.computedStyleMap().get(key)?.toString() === "auto",
    ),
    direction,
    managed: ownedMainFillProjection(found, axis),
    shared,
    reserved,
  };
}

type Record = ReturnType<typeof snapshot>[number];

function candidate(document: DesignDocument, records: Record[], edits: AtomicMutation[]) {
  const inserted = edits.flatMap((edit) => (edit.kind === "insert" ? edit.nodes : []));
  const additions = inserted
    .filter((node) => !records.some((record) => record.id === node.id))
    .map(snapshotRecord);
  return [...records, ...additions].map((record) => {
    const next = { ...record };
    for (const edit of edits) applyRecordEdit(document, next, edit);
    return next;
  });
}

function applyRecordEdit(document: DesignDocument, record: Record, edit: AtomicMutation): void {
  const next = record;
  if (edit.kind === "delete") {
    if (edit.ids.some((id) => containsNode(document, id, record.id))) next.removed = true;
    return;
  }
  if (edit.kind === "insert" || edit.id !== record.id) return;
  if (edit.kind === "reorder") next.parentId = edit.parentId;
  if (edit.kind === "pen") next.styles = edit.style;
  if (edit.kind === "style") {
    next.styles = { ...next.styles, ...edit.values };
    for (const property of edit.unset ?? []) delete next.styles[property];
  }
}

function affectedParents(records: Record[], next: Record[], edits: AtomicMutation[]) {
  const changed = new Set(
    edits.flatMap((edit) =>
      edit.kind === "delete"
        ? edit.ids
        : edit.kind === "insert"
          ? edit.nodes.map((node) => node.id)
          : [edit.id],
    ),
  );
  return new Set(
    [...records, ...next].flatMap((record) =>
      changed.has(record.id) || record.removed ? [record.parentId, record.id] : [],
    ),
  );
}

function exitChanges(records: Record[], next: Record[]): StyleEdit[] {
  return records.flatMap((record, index) => {
    const final = next[index];
    const axis = record.direction === "row" ? "width" : "height";
    if (!record.shared || final.removed || shared(authored(final.styles), axis)) return [];
    const unset = fillInputProperties.filter((key) => Object.hasOwn(final.styles, key));
    const style = authored(final.styles);
    const values = exitValues(style, axis);
    if (!unset.length && !Object.keys(values).length) return [];
    return [
      { kind: "style", id: record.id, values: {}, unset: [...unset, ...Object.keys(values)] },
      { kind: "style", id: record.id, values },
    ];
  });
}

function exitValues(style: CSSStyleDeclaration, axis: Axis) {
  const values: Styles = {};
  if (autoSingle(style, axis)) return values;
  for (const [key, value] of [
    ["flex-grow", "0"],
    ["flex-shrink", "0"],
    ["flex-basis", "auto"],
  ])
    if (style.getPropertyValue(key) !== value)
      values[key] = value + (style.getPropertyPriority(key) ? " !important" : "");
  return values;
}

function participating(record: Record) {
  const style = authored(record.styles);
  const position = style.position || record.position;
  return (
    !record.removed &&
    (style.display || record.display) !== "none" &&
    !["absolute", "fixed"].includes(position) &&
    !position.startsWith("var(")
  );
}

function cohort(records: Record[], parentId: string, axis: Axis) {
  return records.filter((record) => {
    if (record.parentId !== parentId || !participating(record)) return false;
    const style = authored(record.styles);
    return (
      single(style, axis) ||
      ((record.managed || record.styles !== record.appliedStyles) &&
        (shared(style, axis) || autoSingle(style, axis)))
    );
  });
}

function projection(
  record: Record,
  axis: Axis,
  basis: number,
  amount: number,
  intrinsic: boolean,
): StyleEdit[] {
  if (record.reserved) throw new Error("Fill inputs controlled by source. Edit in Code.");
  const style = authored(record.styles);
  const box = style.boxSizing || record.box;
  const desired: Styles = {
    [basisInput]: `${basis}px`,
    [decorationInput]: `${amount}px`,
    "flex-shrink": shrink,
    "flex-basis": intrinsic
      ? intrinsicBasis(box)
      : box === "border-box"
        ? `var(${basisInput})`
        : contentBasis,
  };
  if (!style.boxSizing) desired["box-sizing"] = box;
  const values: Styles = {};
  for (const [key, value] of Object.entries(desired))
    if (!sameProjectionValue(style, key, value))
      values[key] = value + (projectionPriority(record, style, key) ? " !important" : "");
  if (!Object.keys(values).length) return [];
  return [
    { kind: "style", id: record.id, values: {}, unset: Object.keys(values) },
    { kind: "style", id: record.id, values },
  ];
}

function projectionPriority(record: Record, style: CSSStyleDeclaration, property: string) {
  return (
    style.getPropertyPriority(property) ||
    (fillInputProperties.includes(property)
      ? authored(record.appliedStyles).getPropertyPriority(property)
      : "")
  );
}

function sameProjectionValue(style: CSSStyleDeclaration, property: string, value: string) {
  const current = style.getPropertyValue(property).trim();
  return fillInputProperties.includes(property)
    ? pixels(current) === pixels(value)
    : current === value;
}

function cohortAxis(parent: Record): Axis | null {
  const display = layoutValue(parent, "display", parent.display);
  const direction = layoutValue(parent, "flex-direction", parent.layoutDirection) || "row";
  if (!["flex", "inline-flex"].includes(display) || !["row", "column"].includes(direction))
    return null;
  return direction === "row" ? "width" : "height";
}

function wrappedRow(parent: Record) {
  const style = authored(parent.styles);
  const choice =
    style.flexWrap === "var(--orc-row-wrap)" ? style.getPropertyValue("--orc-row-wrap").trim() : "";
  const wrapping = ["wrap", "nowrap"].includes(choice)
    ? choice
    : layoutValue(parent, "flex-wrap", parent.wrapping);
  return cohortAxis(parent) === "width" && wrapping === "wrap";
}

function layoutValue(parent: Record, property: string, active: string) {
  const current = authored(parent.styles).getPropertyValue(property);
  const applied = authored(parent.appliedStyles).getPropertyValue(property);
  return current === applied ? active : current;
}

function cohortChanges(records: Record[], parentId: string): StyleEdit[] {
  const parent = records.find((record) => record.id === parentId);
  if (!parent || parent.removed) return [];
  const axis = cohortAxis(parent);
  if (!axis) return projectionExit(parent);
  const members = cohort(records, parentId, axis);
  const intrinsic =
    axis === "height" &&
    (hasColumnProjection(parent.styles) || intrinsicColumn(parent, members, records));
  const activation = columnActivation(parent, intrinsic);
  if (!members.length || unchangedSingle(parent, members, axis, intrinsic))
    return [...projectionExit(parent), ...activation];
  return [...projectionExit(parent), ...activation, ...cohortProjection(members, axis, intrinsic)];
}

function columnActivation(parent: Record, intrinsic: boolean): StyleEdit[] {
  return intrinsic && !hasColumnProjection(parent.styles)
    ? [{ kind: "style", id: parent.id, values: { [columnMarker]: columnVersion } }]
    : [];
}

function unchangedSingle(parent: Record, members: Record[], axis: Axis, intrinsic: boolean) {
  if (intrinsic || members.length !== 1 || wrappedRow(parent)) return false;
  const style = authored(members[0].styles);
  return single(style, axis) || autoSingle(style, axis);
}

function cohortProjection(members: Record[], axis: Axis, intrinsic: boolean) {
  const amounts = members.map((member) => decoration(authored(member.styles), axis));
  if (amounts.some((amount) => amount === null)) throw new Error("Use Code to change this sizing.");
  const basis = Math.max(200, ...amounts.map((amount) => (amount ?? 0) + 100));
  return members.flatMap((member, index) =>
    projection(member, axis, basis, amounts[index] ?? 0, intrinsic),
  );
}

function intrinsicColumn(parent: Record, members: Record[], records: Record[]) {
  if (members.length < 2 || boundedColumn(parent, records)) return false;
  const style = authored(parent.styles);
  if (!["", "auto", "max-content", "fit-content"].includes(style.height)) return false;
  if (style.minHeight && pixels(style.minHeight) === pixels(style.maxHeight)) return false;
  if (
    !columnProjectionEligible(parent.styles) ||
    style.display !== "flex" ||
    style.flexDirection !== "column" ||
    !["", "nowrap"].includes(style.flexWrap)
  )
    throw new Error("Use Code to change this source-controlled Column.");
  return true;
}

function boundedColumn(parent: Record, records: Record[]): boolean {
  const style = authored(parent.styles);
  if (pixels(style.height) !== null) return true;
  if (pixels(style.minHeight) !== null && pixels(style.minHeight) === pixels(style.maxHeight))
    return true;
  const ancestor = records.find((record) => record.id === parent.parentId);
  if (!ancestor || !participating(parent) || !["", "auto"].includes(style.height)) return false;
  const main = cohortAxis(ancestor);
  const filled =
    main === "height"
      ? managedCandidate(parent, "height")
      : main === "width" && stretchedCandidate(parent, ancestor);
  return Boolean(filled && boundedColumn(ancestor, records));
}

function managedCandidate(record: Record, axis: Axis) {
  const style = authored(record.styles);
  return (
    single(style, axis) ||
    ((record.managed || record.styles !== record.appliedStyles) &&
      (autoSingle(style, axis) || shared(style, axis)))
  );
}

function stretchedCandidate(child: Record, parent: Record) {
  const style = authored(child.styles);
  const alignment = ["", "auto"].includes(style.alignSelf)
    ? layoutValue(parent, "align-items", parent.items)
    : style.alignSelf;
  return ["normal", "stretch"].includes(alignment) && !automaticHeightMargin(child);
}

function automaticHeightMargin(record: Record) {
  const style = authored(record.styles);
  const previous = authored(record.appliedStyles);
  const margins = ["margin-top", "margin-bottom", "margin-block-start", "margin-block-end"];
  const changed = margins.filter(
    (key) => style.getPropertyValue(key) !== previous.getPropertyValue(key),
  );
  if (!changed.length) return record.automaticHeightMargin;
  return changed.some(
    (key) => !/^(?:0|-?(?:\d+(?:\.\d*)?|\.\d+)(?:px|%))?$/u.test(style.getPropertyValue(key)),
  );
}

function projectionExit(parent: Record): StyleEdit[] {
  if (!hasColumnProjection(parent.styles) || cohortAxis(parent) === "height") return [];
  return [{ kind: "style", id: parent.id, values: {}, unset: [columnMarker] }];
}

export function prepareFillSharing(document: DesignDocument) {
  if (
    window.document.querySelector(".canvas")?.getAttribute("data-orc-revision") !==
    String(document.revision)
  )
    throw new Error("The layout changed. Try again.");
  const records = snapshot(document);
  return (edits: AtomicMutation[]): StyleEdit[] => {
    const next = candidate(document, records, edits);
    const parents = affectedParents(records, next, edits);
    const exits = exitChanges(records, next);
    const final = candidate(document, next, exits);
    const changes = [
      ...exits,
      ...Array.from(parents).flatMap((id) => (id === null ? [] : cohortChanges(final, id))),
    ];
    if (changes.some((change) => isLocked(document, change.id)))
      throw new Error("Unlock the affected Fill objects before changing this layout.");
    return changes;
  };
}

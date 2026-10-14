import type { Mutation } from "../../../shared/commands/commands";
import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import { readFrameLayout } from "./frame-layout";

type Edge = "start" | "center" | "end";
export type AlignmentChoice =
  | { kind: "point"; x: Edge; y: Edge }
  | { kind: "distribution"; value: "Packed" | "Space between" };

export function readFrameAlignment(document: DesignDocument, node: DesignNode) {
  const layout = readFrameLayout(node);
  if (node.kind !== "frame" || (layout !== "Row" && layout !== "Column")) return null;
  const element = window.document.querySelector(
    `.canvas-world [data-orc-id="${CSS.escape(node.id)}"]`,
  );
  if (!(element instanceof HTMLElement)) return null;
  const native = getComputedStyle(element);
  const style = window.document.createElement("div").style;
  style.cssText = Object.entries(node.style)
    .map(([key, value]) => `${key}:${value};`)
    .join("");
  const physical = !style.all && physicalAlignment(document, element, native, layout);
  return { style, element, layout, ...readAlignmentValues(node, style, native, physical) };
}

function physicalAlignment(
  document: DesignDocument,
  element: HTMLElement,
  native: CSSStyleDeclaration,
  layout: "Row" | "Column",
) {
  return (
    element.closest(".canvas")?.getAttribute("data-orc-revision") === String(document.revision) &&
    native.direction === "ltr" &&
    native.writingMode === "horizontal-tb" &&
    native.flexDirection === layout.toLowerCase() &&
    ["nowrap", "wrap"].includes(native.flexWrap)
  );
}

function readAlignmentValues(
  node: DesignNode,
  style: CSSStyleDeclaration,
  native: CSSStyleDeclaration,
  physical: boolean,
) {
  const main = alignmentValue(node, style, "justify-content", "place-content");
  const cross = alignmentValue(node, style, "align-items", "place-items");
  const lines = alignmentValue(node, style, "align-content", "place-content");
  const distribution =
    main === "space-between"
      ? "Space between"
      : main !== null && ownedValue(main)
        ? "Packed"
        : null;
  const packedOwned =
    physical &&
    distribution !== null &&
    [cross, lines].every((value) => value !== null && ownedValue(value));
  return {
    packedOwned,
    distributionOwned: physical && distribution !== null,
    distribution,
    point: physical ? packedPoint(main, cross, lines, native) : null,
  };
}

function packedPoint(
  main: string | null,
  cross: string | null,
  lines: string | null,
  native: CSSStyleDeclaration,
) {
  const mainEdge = edge(main);
  const crossEdge = edge(cross);
  return mainEdge && crossEdge && (native.flexWrap === "nowrap" || edge(lines) === crossEdge)
    ? native.flexDirection === "row"
      ? { x: mainEdge, y: crossEdge }
      : { x: crossEdge, y: mainEdge }
    : null;
}

function alignmentValue(
  node: DesignNode,
  style: CSSStyleDeclaration,
  property: string,
  shorthand: string,
) {
  const value = style.getPropertyValue(property);
  if (!value && Object.hasOwn(node.style, shorthand)) return null;
  return value;
}

function ownedValue(value: string) {
  return ["", "normal", "stretch", "start", "flex-start", "center", "end", "flex-end"].includes(
    value,
  );
}

function edge(value: string | null): Edge | null {
  if (value === "start" || value === "flex-start") return "start";
  if (value === "end" || value === "flex-end") return "end";
  return value === "center" ? "center" : null;
}

export function prepareFrameAlignment(
  document: DesignDocument,
  id: string,
  choice: AlignmentChoice,
) {
  const node = document.nodes[id];
  const current = node && readFrameAlignment(document, node);
  if (!current || isLocked(document, id))
    throw new Error("Select an unlocked Row or Column frame.");
  if (
    current.element.closest(".canvas")?.getAttribute("data-orc-revision") !==
    String(document.revision)
  )
    throw new Error("The layout changed. Try again.");
  const owned = choice.kind === "point" ? current.packedOwned : current.distributionOwned;
  if (!owned) throw new Error("Alignment controlled by source. Edit in Code.");
  if (unchanged(current, choice)) return null;
  const values = alignmentStyles(current, choice);
  const mutation = {
    kind: "batch",
    mutations: [
      { kind: "style", id, values: {}, unset: Object.keys(values) },
      { kind: "style", id, values },
    ],
  } satisfies Extract<Mutation, { kind: "batch" }>;
  return {
    mutation,
    validate: () => {
      const native = getComputedStyle(current.element);
      for (const [property, value] of Object.entries(values))
        if (native.getPropertyValue(property) !== value.replace(" !important", ""))
          throw new Error("Alignment controlled by source. Edit in Code.");
    },
  };
}

function unchanged(
  current: NonNullable<ReturnType<typeof readFrameAlignment>>,
  choice: AlignmentChoice,
) {
  return choice.kind === "point"
    ? current.point?.x === choice.x && current.point.y === choice.y
    : current.distribution === choice.value;
}

function alignmentStyles(
  current: NonNullable<ReturnType<typeof readFrameAlignment>>,
  choice: AlignmentChoice,
) {
  const raw: DesignNode["style"] = {};
  if (choice.kind === "distribution") {
    raw["justify-content"] = choice.value === "Packed" ? "flex-start" : "space-between";
  } else {
    const main = current.layout === "Row" ? choice.x : choice.y;
    const cross = current.layout === "Row" ? choice.y : choice.x;
    raw["justify-content"] = main === "center" ? main : `flex-${main}`;
    raw["align-items"] = cross === "center" ? cross : `flex-${cross}`;
    raw["align-content"] = raw["align-items"];
  }
  return Object.fromEntries(
    Object.entries(raw).map(([property, value]) => [
      property,
      value + (current.style.getPropertyPriority(property) ? " !important" : ""),
    ]),
  );
}

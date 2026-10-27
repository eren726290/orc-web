import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument } from "../../../shared/document/model";
import { previewDocument, type PropertyPreview } from "../properties/property-preview";

type Reorder = Extract<Mutation, { kind: "reorder" }>;
type PointerEdit =
  | Exclude<NonNullable<PropertyPreview>, { kind: "batch" | "pen-preview" }>
  | Reorder;
export type PointerPreview = PointerEdit | { kind: "batch"; mutations: PointerEdit[] } | null;
type Box = { id: string; bounds: DOMRect };
type Flow = {
  id: string;
  parentId: string;
  siblings: string[];
  direction: "row" | "column";
  boxes: Box[];
};

export function pointerDocument(document: DesignDocument, preview: PointerPreview) {
  if (!preview) return document;
  let next = document;
  for (const edit of preview.kind === "batch" ? preview.mutations : [preview])
    next = edit.kind === "reorder" ? previewReorder(next, edit) : previewDocument(next, edit);
  return next;
}

function previewReorder(document: DesignDocument, change: Reorder) {
  const node = document.nodes[change.id];
  if (!node) return document;
  const nodes = { ...document.nodes, [node.id]: { ...node, parentId: change.parentId } };
  let roots = document.workspaceRootIds.filter((id) => id !== node.id);
  if (node.parentId !== null) {
    const parent = nodes[node.parentId];
    nodes[parent.id] = { ...parent, children: parent.children.filter((id) => id !== node.id) };
  }
  if (change.parentId === null) roots.splice(change.index, 0, node.id);
  else {
    const parent = nodes[change.parentId];
    const children = [...parent.children];
    children.splice(change.index, 0, node.id);
    nodes[parent.id] = { ...parent, children };
  }
  return { ...document, nodes, workspaceRootIds: roots };
}

export function prepareFlexDrop(flow: Flow) {
  const others = flow.boxes.filter((box) => box.id !== flow.id);
  const initial = flow.boxes.findIndex((box) => box.id === flow.id);
  const siblings = flow.siblings.filter((id) => id !== flow.id);
  return (point: { x: number; y: number }): Reorder => {
    const slot = others.length ? flowSlot(others, flow.direction, point) : 0;
    if (slot === initial)
      return {
        kind: "reorder",
        id: flow.id,
        parentId: flow.parentId,
        index: flow.siblings.indexOf(flow.id),
      };
    const before = others[slot];
    const index = before
      ? siblings.indexOf(before.id)
      : others.length
        ? siblings.indexOf(others[others.length - 1].id) + 1
        : siblings.length;
    return { kind: "reorder", id: flow.id, parentId: flow.parentId, index };
  };
}

function flowSlot(boxes: Box[], direction: "row" | "column", point: { x: number; y: number }) {
  if (direction === "column")
    return boxes.filter(({ bounds }) => point.y >= bounds.y + bounds.height / 2).length;
  const lines = flowLines(boxes);
  const line = lines.reduce((nearest, candidate) =>
    lineDistance(candidate, point.y) < lineDistance(nearest, point.y) ? candidate : nearest,
  );
  const previous = lines.slice(0, lines.indexOf(line)).flat().length;
  return previous + line.filter(({ bounds }) => point.x >= bounds.x + bounds.width / 2).length;
}

function flowLines(boxes: Box[]) {
  const lines: Box[][] = [];
  for (const box of boxes) {
    const line = lines[lines.length - 1];
    if (!line || box.bounds.top >= Math.min(...line.map(({ bounds }) => bounds.bottom)) - 0.01)
      lines.push([box]);
    else line.push(box);
  }
  return lines;
}

function lineDistance(line: Box[], y: number) {
  const top = Math.min(...line.map(({ bounds }) => bounds.top));
  const bottom = Math.max(...line.map(({ bounds }) => bounds.bottom));
  return Math.max(top - y, y - bottom, 0);
}

export function pointerCommit(document: DesignDocument, preview: PointerPreview) {
  if (preview?.kind !== "reorder") return preview;
  const node = document.nodes[preview.id];
  const siblings =
    preview.parentId === null
      ? document.workspaceRootIds
      : document.nodes[preview.parentId]?.children;
  if (node?.parentId === preview.parentId && siblings?.indexOf(preview.id) === preview.index)
    return null;
  return preview;
}

export function pointerDrop(preview: PointerPreview) {
  if (preview?.kind === "batch") return preview.mutations.find((edit) => edit.kind === "reorder");
  return preview?.kind === "reorder" ? preview : null;
}

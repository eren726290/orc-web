import type { AtomicMutation } from "../commands/commands";
import { validateDocument } from "../document/document";
import type { DesignDocument, DesignNode } from "../document/model";
import { validatePenDimensions } from "./artwork";

export type PenWrite = Extract<AtomicMutation, { kind: "insert" | "pen" | "style" }>;

export function penCandidate(document: DesignDocument, edits: PenWrite[]): DesignDocument {
  const candidate = structuredClone(document);
  for (const edit of edits) applyPenWrite(candidate, edit);
  validateDocument(candidate);
  return candidate;
}

function insert(document: DesignDocument, nodes: DesignNode[]): void {
  const incoming = new Set(nodes.map((node) => node.id));
  if (incoming.size !== nodes.length) throw new Error("Duplicate object identities.");
  for (const node of nodes) {
    if (document.nodes[node.id]) throw new Error("Object identity already exists.");
    document.nodes[node.id] = structuredClone(node);
  }
  for (const node of nodes) {
    if (node.parentId === null) document.workspaceRootIds.push(node.id);
    else if (!incoming.has(node.parentId)) {
      const parent = document.nodes[node.parentId];
      if (!parent || parent.kind !== "frame")
        throw new Error("Choose a frame for the pen destination.");
      parent.children.push(node.id);
    }
  }
}

function applyPenWrite(candidate: DesignDocument, edit: PenWrite): void {
  if (edit.kind === "insert") {
    insert(candidate, edit.nodes);
    return;
  }
  const node = candidate.nodes[edit.id];
  if (!node) throw new Error("The edited object no longer exists.");
  if (edit.kind === "style") {
    node.style = { ...node.style, ...edit.values };
    for (const key of edit.unset ?? []) delete node.style[key];
  } else {
    if (node.kind !== "svg" || !node.pen) throw new Error("This SVG has no editable pen record.");
    validatePenDimensions(edit.style);
    Object.assign(
      node,
      structuredClone({
        source: edit.source,
        pen: edit.pen,
        attributes: edit.attributes,
        style: edit.style,
      }),
    );
  }
}

import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument } from "../../../shared/document/model";

type NodePreview = Extract<Mutation, { kind: "style" | "text" | "rename" }>;
export type PropertyPreview = NodePreview | { kind: "batch"; mutations: NodePreview[] } | null;

export function previewDocument(
  document: DesignDocument,
  preview: PropertyPreview,
): DesignDocument {
  if (!preview) return document;
  const nodes = { ...document.nodes };
  for (const change of preview.kind === "batch" ? preview.mutations : [preview]) {
    const node = nodes[change.id];
    if (node) nodes[change.id] = previewNode(node, change);
  }
  return { ...document, nodes };
}

function previewNode(node: DesignDocument["nodes"][string], preview: NodePreview) {
  let next = node;
  if (preview.kind === "style") {
    const style = { ...node.style, ...preview.values };
    for (const property of preview.unset ?? []) delete style[property];
    next = { ...node, style };
  }
  if (preview.kind === "rename") next = { ...node, name: preview.name };
  if (preview.kind === "text" && node.kind === "text") next = { ...node, runs: preview.runs };
  return next;
}

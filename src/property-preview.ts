import type { Mutation } from "../shared/commands";
import type { DesignDocument } from "../shared/model";

export type PropertyPreview = Extract<Mutation, { kind: "style" | "text" | "rename" }> | null;

export function previewDocument(
  document: DesignDocument,
  preview: PropertyPreview,
): DesignDocument {
  if (!preview) return document;
  const node = document.nodes[preview.id];
  if (!node) return document;
  let next = node;
  if (preview.kind === "style") next = { ...node, style: { ...node.style, ...preview.values } };
  if (preview.kind === "rename") next = { ...node, name: preview.name };
  if (preview.kind === "text" && node.kind === "text") next = { ...node, runs: preview.runs };
  return { ...document, nodes: { ...document.nodes, [node.id]: next } };
}

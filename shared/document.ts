import type { DesignDocument, DesignNode } from "./model";
import {
  boolean,
  nonnegativeInteger,
  nullableString,
  object,
  string,
  stringMap,
  strings,
} from "./validation";

export function parseNode(value: unknown): DesignNode {
  const input = object(value);
  const base = {
    id: string(input.id),
    name: string(input.name),
    parentId: nullableString(input.parentId),
    children: strings(input.children),
    visible: boolean(input.visible),
    locked: boolean(input.locked),
    style: stringMap(input.style),
    attributes: stringMap(input.attributes),
  };
  switch (input.kind) {
    case "frame":
      return {
        ...base,
        kind: "frame",
        clipContent: boolean(input.clipContent),
        mode: parseMode(input.mode),
      };
    case "element":
      return { ...base, kind: "element", tag: string(input.tag) };
    case "text":
      return { ...base, kind: "text", tag: string(input.tag), runs: parseRuns(input.runs) };
    case "image":
      return { ...base, kind: "image" };
    case "svg":
      return { ...base, kind: "svg", source: string(input.source) };
    default:
      throw new Error("Unsupported object kind.");
  }
}

function parseMode(value: unknown): "inherit" | "light" | "dark" {
  if (value === "inherit" || value === "light" || value === "dark") return value;
  throw new Error("Unsupported frame mode.");
}

function parseRuns(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Expected text runs.");
  return value.map((entry: unknown) => {
    const run = object(entry);
    return { text: string(run.text), style: stringMap(run.style) };
  });
}

export function parseDocument(value: unknown): DesignDocument {
  const input = object(value);
  if (input.schemaVersion !== 1) throw new Error("Unsupported project format.");
  const document: DesignDocument = {
    schemaVersion: 1,
    id: string(input.id),
    name: string(input.name),
    revision: nonnegativeInteger(input.revision),
    workspaceRootIds: strings(input.workspaceRootIds),
    nodes: Object.fromEntries(
      Object.entries(object(input.nodes)).map(([id, node]) => [id, parseNode(node)]),
    ),
  };
  validateDocument(document);
  return document;
}

export function validateDocument(document: DesignDocument): void {
  const visited = new Set<string>();
  const visit = (id: string, parentId: string | null) => {
    const node = document.nodes[id];
    if (!node || node.id !== id || node.parentId !== parentId || visited.has(id)) {
      throw new Error("Invalid design hierarchy.");
    }
    visited.add(id);
    for (const child of node.children) visit(child, id);
  };
  for (const root of document.workspaceRootIds) visit(root, null);
  if (visited.size !== Object.keys(document.nodes).length)
    throw new Error("The design contains orphan objects.");
}

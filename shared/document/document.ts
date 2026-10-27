import type { DesignDocument, DesignNode } from "./model";
import { parsePenRecord } from "../pen/record";
import { validatePenArtwork } from "../pen/artwork";
import {
  boolean,
  knownFields,
  nonnegativeInteger,
  nullableString,
  object,
  string,
  stringMap,
  strings,
} from "../validation";

const nodeFields = [
  "id",
  "kind",
  "name",
  "parentId",
  "children",
  "visible",
  "locked",
  "style",
  "attributes",
];

export function parseNode(value: unknown): DesignNode {
  const input = object(value);
  knownFields(input, [...nodeFields, ...specificNodeFields(input.kind)], "object");
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
      return parseSVG(base, input);
    default:
      throw new Error("Unsupported object kind.");
  }
}

function specificNodeFields(kind: unknown): string[] {
  switch (kind) {
    case "frame":
      return ["clipContent", "mode"];
    case "element":
      return ["tag"];
    case "text":
      return ["tag", "runs"];
    case "image":
      return [];
    case "svg":
      return ["source", "pen"];
    default:
      throw new Error("Unsupported object kind.");
  }
}

function parseSVG(base: Omit<DesignNode, "kind">, input: Record<string, unknown>): DesignNode {
  const node = { ...base, kind: "svg" as const, source: string(input.source) };
  if (input.pen === undefined) return node;
  const result = { ...node, pen: parsePenRecord(input.pen) };
  validatePenArtwork(result);
  return result;
}

function parseMode(value: unknown): "inherit" | "light" | "dark" {
  if (value === "inherit" || value === "light" || value === "dark") return value;
  throw new Error("Unsupported frame mode.");
}

function parseRuns(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Expected text runs.");
  return value.map((entry: unknown) => {
    const run = object(entry);
    knownFields(run, ["text", "style"], "text run");
    return { text: string(run.text), style: stringMap(run.style) };
  });
}

export function parseDocument(value: unknown): DesignDocument {
  const input = object(value);
  if (input.schemaVersion !== 1) throw new Error("Unsupported project format.");
  knownFields(
    input,
    ["schemaVersion", "id", "name", "revision", "workspaceRootIds", "nodes"],
    "project",
  );
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
    if (node.kind === "svg" && node.pen) {
      parsePenRecord(node.pen);
      validatePenArtwork({ ...node, pen: node.pen });
    }
    for (const child of node.children) visit(child, id);
  };
  for (const root of document.workspaceRootIds) visit(root, null);
  if (visited.size !== Object.keys(document.nodes).length)
    throw new Error("The design contains orphan objects.");
}

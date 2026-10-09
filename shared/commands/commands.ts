import type { DesignNode, Styles, TextRun } from "../document/model";
import { parseNode } from "../document/document";
import {
  boolean,
  nonnegativeInteger,
  nullableString,
  object,
  string,
  stringMap,
  strings,
} from "../validation";

export type AtomicMutation =
  | { kind: "insert"; nodes: DesignNode[] }
  | { kind: "rename"; id: string; name: string }
  | { kind: "style"; id: string; values: Styles; unset?: string[] }
  | { kind: "text"; id: string; runs: TextRun[] }
  | { kind: "lock"; id: string; locked: boolean }
  | { kind: "clip"; id: string; clipContent: boolean }
  | { kind: "reorder"; id: string; parentId: string | null; index: number }
  | { kind: "delete"; ids: string[] };

export type Mutation =
  | AtomicMutation
  | { kind: "source"; id: string; source: string }
  | { kind: "batch"; mutations: AtomicMutation[] };

export type Command = {
  projectId: string;
  commandId: string;
  expectedRevision: number;
  mutation: Mutation;
};

export function parseCommand(value: unknown): Command {
  const input = object(value);
  return {
    projectId: string(input.projectId),
    commandId: string(input.commandId),
    expectedRevision: nonnegativeInteger(input.expectedRevision),
    mutation: parseMutation(input.mutation),
  };
}

function parseMutation(value: unknown): Mutation {
  const input = object(value);
  if (input.kind === "source")
    return { kind: "source", id: string(input.id), source: string(input.source) };
  if (input.kind === "batch") {
    if (!Array.isArray(input.mutations)) throw new Error("Expected edits to batch.");
    return { kind: "batch", mutations: input.mutations.map(parseAtomicMutation) };
  }
  return parseAtomicMutation(input);
}

function parseAtomicMutation(value: unknown): AtomicMutation {
  const input = object(value);
  switch (input.kind) {
    case "insert": {
      if (!Array.isArray(input.nodes)) throw new Error("Expected objects to insert.");
      return { kind: "insert", nodes: input.nodes.map(parseNode) };
    }
    case "rename":
      return { kind: "rename", id: string(input.id), name: string(input.name) };
    case "style":
      return parseStyleMutation(input);
    case "reorder":
      return {
        kind: "reorder",
        id: string(input.id),
        parentId: nullableString(input.parentId),
        index: nonnegativeInteger(input.index),
      };
    case "lock":
      return { kind: "lock", id: string(input.id), locked: boolean(input.locked) };
    case "clip":
      return { kind: "clip", id: string(input.id), clipContent: boolean(input.clipContent) };
    case "delete":
      return { kind: "delete", ids: strings(input.ids) };
    case "text":
      return parseTextMutation(input);
    default:
      throw new Error("Unsupported edit.");
  }
}

function parseStyleMutation(input: Record<string, unknown>): AtomicMutation {
  const values = stringMap(input.values);
  const unset = input.unset === undefined ? undefined : strings(input.unset);
  if (unset?.some((property) => Object.hasOwn(values, property)))
    throw new Error("A style property cannot be both assigned and removed.");
  return { kind: "style", id: string(input.id), values, ...(unset === undefined ? {} : { unset }) };
}

function parseTextMutation(input: Record<string, unknown>): AtomicMutation {
  if (!Array.isArray(input.runs)) throw new Error("Expected text runs.");
  const runs = input.runs.map((entry: unknown) => {
    const run = object(entry);
    return { text: string(run.text), style: stringMap(run.style) };
  });
  return { kind: "text", id: string(input.id), runs };
}

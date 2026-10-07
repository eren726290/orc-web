import type { DesignNode, Styles, TextRun } from "./model";
import { parseNode } from "./document";
import { boolean, nonnegativeInteger, object, string, stringMap, strings } from "./validation";

export type Mutation =
  | { kind: "insert"; nodes: DesignNode[] }
  | { kind: "rename"; id: string; name: string }
  | { kind: "style"; id: string; values: Styles }
  | { kind: "text"; id: string; runs: TextRun[] }
  | { kind: "lock"; id: string; locked: boolean }
  | { kind: "source"; id: string; source: string }
  | { kind: "delete"; ids: string[] };

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
  switch (input.kind) {
    case "insert": {
      if (!Array.isArray(input.nodes)) throw new Error("Expected objects to insert.");
      return { kind: "insert", nodes: input.nodes.map(parseNode) };
    }
    case "rename":
      return { kind: "rename", id: string(input.id), name: string(input.name) };
    case "source":
      return { kind: "source", id: string(input.id), source: string(input.source) };
    case "style":
      return { kind: "style", id: string(input.id), values: stringMap(input.values) };
    case "lock":
      return { kind: "lock", id: string(input.id), locked: boolean(input.locked) };
    case "delete":
      return { kind: "delete", ids: strings(input.ids) };
    case "text":
      return parseTextMutation(input);
    default:
      throw new Error("Unsupported edit.");
  }
}

function parseTextMutation(input: Record<string, unknown>): Mutation {
  if (!Array.isArray(input.runs)) throw new Error("Expected text runs.");
  const runs = input.runs.map((entry: unknown) => {
    const run = object(entry);
    return { text: string(run.text), style: stringMap(run.style) };
  });
  return { kind: "text", id: string(input.id), runs };
}

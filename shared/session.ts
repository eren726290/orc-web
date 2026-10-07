import { parseDocument } from "./document";
import type { ProjectSnapshot, SaveStatus, SessionSnapshot } from "./model";
import { boolean, nonnegativeInteger, nullableString, object, string, strings } from "./validation";

export function parseSession(value: unknown): SessionSnapshot {
  const input = object(value);
  if (!Array.isArray(input.projects)) throw new Error("Invalid project response.");
  return {
    activeProjectId: nullableString(input.activeProjectId),
    projects: input.projects.map(parseProject),
    recentPaths: strings(input.recentPaths),
  };
}

function parseProject(value: unknown): ProjectSnapshot {
  const input = object(value);
  return {
    document: parseDocument(input.document),
    path: nullableString(input.path),
    saveStatus: parseSaveStatus(input.saveStatus),
    canUndo: boolean(input.canUndo),
    canRedo: boolean(input.canRedo),
  };
}

function parseSaveStatus(value: unknown): SaveStatus {
  const input = object(value);
  switch (input.kind) {
    case "not-saved":
      return { kind: "not-saved" };
    case "saving":
      return { kind: "saving", revision: nonnegativeInteger(input.revision) };
    case "saved":
      return { kind: "saved", revision: nonnegativeInteger(input.revision) };
    case "failed":
      return { kind: "failed", message: string(input.message) };
    default:
      throw new Error("Invalid save status.");
  }
}

export type DirectoryListing = { path: string; parent: string; directories: string[] };

export function parseDirectory(value: unknown): DirectoryListing {
  const input = object(value);
  return {
    path: string(input.path),
    parent: string(input.parent),
    directories: strings(input.directories),
  };
}

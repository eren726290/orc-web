import { realpath } from "node:fs/promises";
import {
  emptyDocument,
  type DesignDocument,
  type ProjectSnapshot,
  type SaveStatus,
  type SessionSnapshot,
} from "../../shared/document/model";
import { validateDocument } from "../../shared/document/document";
import type { Command } from "../../shared/commands/commands";
import {
  acquireBundle,
  createBundle,
  readBundle,
  rollbackNewBundle,
  writeBundle,
  type WritableBundle,
} from "./bundle";
import { applyMutation } from "../commands/mutations";
import { applySource } from "../source/html";
import { nodeSource } from "../../shared/source/html-source";

type Project = {
  document: DesignDocument;
  bundle: WritableBundle | null;
  saveStatus: SaveStatus;
  undo: DesignDocument[];
  redo: DesignDocument[];
  pendingSave: Promise<void>;
  commands: Map<string, string>;
};

export class Projects {
  private open = new Map<string, Project>();
  private activeId: string | null = null;
  private recentPaths: string[] = [];

  snapshot(): SessionSnapshot {
    return {
      activeProjectId: this.activeId,
      projects: [...this.open.values()].map(snapshot),
      recentPaths: [...this.recentPaths],
    };
  }

  create(): void {
    const document = emptyDocument();
    this.open.set(document.id, project(document, null));
    this.activeId = document.id;
  }

  activate(id: string): void {
    this.require(id);
    this.activeId = id;
  }

  async load(folder: string): Promise<void> {
    const path = await realpath(folder);
    const existing = [...this.open.values()].find((item) => item.bundle?.path === path);
    if (existing) {
      this.activeId = existing.document.id;
      return;
    }
    const bundle = await acquireBundle(path);
    try {
      const document = await readBundle(bundle.path);
      if (this.open.has(document.id))
        throw new Error(
          "A copy of this project is already open. Close it before opening this folder.",
        );
      this.open.set(document.id, project(document, bundle));
      this.activeId = document.id;
      this.remember(bundle.path);
    } catch (error) {
      await bundle.release();
      throw error;
    }
  }

  async execute(command: Command): Promise<void> {
    const current = this.requireActive(command.projectId);
    const fingerprint = JSON.stringify(command);
    const prior = current.commands.get(command.commandId);
    if (prior) {
      if (prior !== fingerprint)
        throw new Error("Command identity was already used for another edit.");
      return;
    }
    this.checkRevision(current, command.expectedRevision);
    const candidate = structuredClone(current.document);
    if (command.mutation.kind === "source")
      await applySource(candidate, command.mutation.id, command.mutation.source);
    else applyMutation(candidate, command.mutation);
    validateDocument(candidate);
    if (JSON.stringify(candidate) !== JSON.stringify(current.document)) {
      current.undo.push(current.document);
      current.redo = [];
      candidate.revision++;
      current.document = candidate;
      this.scheduleSave(current);
    }
    current.commands.set(command.commandId, fingerprint);
  }

  history(id: string, revision: number, direction: "undo" | "redo"): void {
    const current = this.requireActive(id);
    this.checkRevision(current, revision);
    const source = direction === "undo" ? current.undo : current.redo;
    const destination = direction === "undo" ? current.redo : current.undo;
    const next = source.pop();
    if (!next) return;
    destination.push(current.document);
    current.document = {
      ...structuredClone(next),
      name: current.document.name,
      revision: current.document.revision + 1,
    };
    this.scheduleSave(current);
  }

  historyImpact(id: string, direction: "undo" | "redo", nodeId: string) {
    const current = this.requireActive(id);
    const next = (direction === "undo" ? current.undo : current.redo).at(-1);
    const before = current.document.nodes[nodeId] ? nodeSource(current.document, nodeId) : null;
    const after = next?.nodes[nodeId] ? nodeSource(next, nodeId) : null;
    return {
      revision: current.document.revision,
      overlaps: next !== undefined && before !== after,
    };
  }

  async saveAs(id: string, parent: string, name: string): Promise<void> {
    const current = this.require(id);
    const bundle = await createBundle(parent, name);
    await current.pendingSave;
    const previous = current.bundle;
    const candidate = { ...current.document, name: name.trim() };
    try {
      await writeBundle(bundle.path, candidate);
    } catch (error) {
      return rollbackNewBundle(bundle, error);
    }
    current.document = candidate;
    current.bundle = bundle;
    current.saveStatus = { kind: "saved", revision: candidate.revision };
    await previous?.release();
    this.remember(bundle.path);
  }

  async retry(id: string): Promise<void> {
    const current = this.require(id);
    this.scheduleSave(current);
    await current.pendingSave;
    if (current.saveStatus.kind === "failed") throw new Error(current.saveStatus.message);
  }

  async close(id: string, discard: boolean): Promise<void> {
    const current = this.require(id);
    await current.pendingSave;
    const unsaved = current.saveStatus.kind !== "saved";
    if (!discard && unsaved && current.document.revision > 0)
      throw new Error("Save this project or choose Discard before closing.");
    await current.bundle?.release();
    this.open.delete(id);
    if (this.activeId === id) this.activeId = [...this.open.keys()].at(-1) ?? null;
  }

  async shutdown(): Promise<void> {
    await Promise.all([...this.open.values()].map((current) => current.pendingSave));
    if ([...this.open.values()].some((current) => current.saveStatus.kind === "failed")) {
      throw new Error("Save failed. Keep ORC-web open and use Retry or Save as.");
    }
    await Promise.all([...this.open.values()].map((current) => current.bundle?.release()));
  }

  private scheduleSave(current: Project): void {
    const bundle = current.bundle;
    if (!bundle) {
      current.saveStatus = { kind: "not-saved" };
      return;
    }
    const candidate = structuredClone(current.document);
    current.saveStatus = { kind: "saving", revision: candidate.revision };
    current.pendingSave = current.pendingSave.then(async () => {
      try {
        await writeBundle(bundle.path, candidate);
        if (current.document.revision === candidate.revision)
          current.saveStatus = { kind: "saved", revision: candidate.revision };
      } catch (error) {
        current.saveStatus = { kind: "failed", message: message(error) };
      }
    });
  }

  private require(id: string): Project {
    const current = this.open.get(id);
    if (!current) throw new Error("Project is no longer open.");
    return current;
  }

  private requireActive(id: string): Project {
    if (id !== this.activeId)
      throw new Error("The addressed project is not active. Refresh before editing.");
    return this.require(id);
  }

  private checkRevision(current: Project, revision: number): void {
    if (current.document.revision !== revision)
      throw new Error("The design changed. Refresh and try again.");
  }

  private remember(path: string): void {
    this.recentPaths = [path, ...this.recentPaths.filter((item) => item !== path)];
  }
}

function project(document: DesignDocument, bundle: WritableBundle | null): Project {
  return {
    document,
    bundle,
    saveStatus: bundle ? { kind: "saved", revision: document.revision } : { kind: "not-saved" },
    undo: [],
    redo: [],
    pendingSave: Promise.resolve(),
    commands: new Map(),
  };
}

function snapshot(current: Project): ProjectSnapshot {
  return {
    document: current.document,
    path: current.bundle?.path ?? null,
    saveStatus: current.saveStatus,
    canUndo: current.undo.length > 0,
    canRedo: current.redo.length > 0,
  };
}

export function message(error: unknown): string {
  return error instanceof Error ? error.message : "The operation could not finish.";
}

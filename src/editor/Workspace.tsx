import { lazy, Suspense, useEffect, useState } from "react";
import type { Mutation } from "../../shared/commands/commands";
import {
  containsNode,
  type DesignDocument,
  type ProjectSnapshot,
} from "../../shared/document/model";
import { mutationInput } from "../session/useSession";
import { projectView, useViewState, type ViewState } from "./view-state";
import { Toolbar } from "./Toolbar";
import { Layers } from "./layers/Layers";
import { Properties } from "./properties/Properties";
import { Canvas } from "./canvas/Canvas";
import { DiscardDraft, useDraftGuard } from "./code/draft-guard";
import { request } from "../session/api";
import { boolean, nonnegativeInteger, object } from "../../shared/validation";
import { previewDocument, type PropertyPreview } from "./properties/property-preview";
import { sessionClient } from "../session/session-client";
import { nodeSource } from "../../shared/source/html-source";
import { PanelResize } from "./PanelResize";
import { Preview, previewView, type PreviewView } from "./preview/Preview";
import { keyboardMovement } from "./canvas/keyboard-movement";

type Props = {
  project: ProjectSnapshot;
  act: (path: string, input: unknown) => Promise<boolean>;
  disabled: boolean;
  error: string | null;
};
type Controller = ReturnType<typeof useWorkspace>;
const CodeWindow = lazy(() =>
  import("./code/CodeWindow").then((module) => ({ default: module.CodeWindow })),
);
let keyboardQueue = Promise.resolve();

export function Workspace(props: Props) {
  const controller = useWorkspace(props);
  return (
    <main
      className="workspace"
      style={{
        gridTemplateColumns: `minmax(216px, ${controller.view.panels.layers}px) 6px 72px minmax(160px, 1fr) 6px minmax(240px, ${controller.view.panels.properties}px)`,
      }}
    >
      <WorkspaceLeft controller={controller} />
      <PanelResize panel="layers" view={controller.view} change={controller.setView} />
      <Toolbar
        view={controller.view}
        tool={(tool) => controller.setView({ tool })}
        code={() => void controller.toggleCode()}
        preview={controller.startPreview}
        previewing={controller.previewFrame !== null}
      />
      <WorkspaceCanvas controller={controller} />
      <WorkspaceProperties controller={controller} />
      {controller.guard.pending && <DiscardDraft decide={controller.guard.decide} />}
    </main>
  );
}

function WorkspaceProperties({ controller: c }: { controller: Controller }) {
  return (
    <>
      <PanelResize panel="properties" view={c.view} change={c.setView} />
      <Properties
        document={c.project.document}
        selected={c.view.selected}
        mutate={c.mutate}
        disabled={c.disabled}
        prepare={c.prepareProperties}
        preview={c.setPreview}
        select={(id) => c.select(id, false)}
      />
    </>
  );
}

function useWorkspace(props: Props) {
  const { view, setView } = useViewState(props.project.document.id);
  useSelectedAncestors(props.project.document, view, setView);
  const guard = useDraftGuard();
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<PropertyPreview>(null);
  const frames = useFramePreview(props.project.document, view, setNotice, setPreview);
  const select = async (id: string | null, extend: boolean) => {
    if (!extend && id && view.selected.length === 1 && view.selected[0] === id) {
      setView(selectionChange(props.project.document, view, id, false));
      return true;
    }
    if (!(await guard.request(props.project.document.id))) return false;
    setPreview(null);
    setView(selectionChange(props.project.document, view, id, extend));
    return true;
  };
  const mutate = (mutation: Mutation) => applyWorkspaceMutation(props, guard, setView, mutation);
  const controls = codeControls(props, setView, guard);
  const prepareProperties = () =>
    projectView(props.project.document.id).draft ? guard.request(props.project.document.id) : true;
  return {
    ...props,
    disabled: props.disabled || frames.previewFrame !== null,
    view,
    setView,
    select,
    mutate,
    notice,
    setNotice,
    guard,
    preview,
    ...frames,
    setPreview,
    prepareProperties,
    ...controls,
  };
}

function useFramePreview(
  document: DesignDocument,
  view: ViewState,
  notice: (message: string | null) => void,
  reset: (preview: PropertyPreview) => void,
) {
  const [previewFrame, setPreviewFrame] = useState<PreviewView | null>(null);
  const startPreview = () => {
    if (view.selected.length !== 1 || document.nodes[view.selected[0]]?.kind !== "frame") {
      notice("Select one frame to preview");
      return;
    }
    reset(null);
    notice(null);
    setPreviewFrame(previewView(view.selected[0], view.pan));
  };
  return { previewFrame, startPreview, exitPreview: () => setPreviewFrame(null) };
}

async function applyWorkspaceMutation(
  props: Props,
  guard: ReturnType<typeof useDraftGuard>,
  setView: (patch: Partial<ViewState>) => void,
  mutation: Mutation,
) {
  const projectId = props.project.document.id;
  const draft = projectView(projectId).draft;
  if (
    draft &&
    overlapsDraft(props.project.document, mutation, draft.nodeId) &&
    !(await guard.request(projectId))
  )
    return false;
  const result = await props.act(
    "/api/commands",
    mutationInput(projectId, props.project.document.revision, mutation),
  );
  if (result && mutation.kind === "insert")
    setView({
      selected: mutation.nodes.filter((node) => node.parentId === null).map((node) => node.id),
    });
  return result;
}

function overlapsDraft(document: DesignDocument, mutation: Mutation, ownerId: string): boolean {
  if (mutation.kind === "batch")
    return mutation.mutations.some((edit) => overlapsDraft(document, edit, ownerId));
  if (mutation.kind === "lock") return false;
  if (mutation.kind === "insert") return true;
  const ids = mutation.kind === "delete" ? mutation.ids : [mutation.id];
  if (mutation.kind === "reorder" && mutation.parentId !== null) ids.push(mutation.parentId);
  return ids.some(
    (id) => containsNode(document, ownerId, id) || containsNode(document, id, ownerId),
  );
}

function codeControls(
  props: Props,
  setView: (patch: Partial<ViewState>) => void,
  guard: ReturnType<typeof useDraftGuard>,
) {
  const id = props.project.document.id;
  const toggleCode = async () => {
    const current = projectView(id);
    if (current.codeOpen && !(await guard.request(id))) return;
    setView({ codeOpen: !current.codeOpen });
  };
  const applySource = async () => {
    const draft = projectView(id).draft;
    if (!draft) return;
    const document = props.project.document;
    if (!document.nodes[draft.nodeId] || nodeSource(document, draft.nodeId) !== draft.baseSource) {
      sessionClient.setError(
        "This object's applied source changed. Review or discard the draft before applying.",
      );
      return;
    }
    if (
      await props.act(
        "/api/commands",
        mutationInput(id, document.revision, {
          kind: "source",
          id: draft.nodeId,
          source: draft.source,
        }),
      )
    )
      setView({ draft: null });
  };
  return { toggleCode, applySource };
}

function selectionChange(
  document: DesignDocument,
  view: ViewState,
  id: string | null,
  extend: boolean,
): Partial<ViewState> {
  let selected = id === null ? [] : [id];
  if (id && extend)
    selected = view.selected.includes(id)
      ? view.selected.filter((value) => value !== id)
      : [...view.selected, id];
  const expanded = new Set([...view.expanded, ...selectedAncestors(document, id)]);
  return { selected, expanded: [...expanded] };
}

function selectedAncestors(document: DesignDocument, id: string | null) {
  const parents: string[] = [];
  let parent = id ? document.nodes[id]?.parentId : null;
  while (parent) {
    parents.push(parent);
    parent = document.nodes[parent]?.parentId;
  }
  return parents;
}

function useSelectedAncestors(
  document: DesignDocument,
  view: ViewState,
  setView: (patch: Partial<ViewState>) => void,
) {
  const projectId = document.id;
  const parents = view.selected.flatMap((id) => selectedAncestors(document, id)).join("\0");
  useEffect(() => {
    const expanded = projectView(projectId).expanded;
    const required = parents ? parents.split("\0") : [];
    if (required.some((id) => !expanded.includes(id)))
      setView({ expanded: [...new Set([...expanded, ...required])] });
  }, [parents, projectId, setView]);
}

function WorkspaceLeft({ controller: c }: { controller: Controller }) {
  const expand = (id: string) =>
    c.setView({
      expanded: c.view.expanded.includes(id)
        ? c.view.expanded.filter((value) => value !== id)
        : [...c.view.expanded, id],
    });
  return (
    <aside className="left-panel" inert={c.previewFrame !== null}>
      <div className="left-tabs">
        <button
          aria-pressed={c.view.leftTab === "layers"}
          onClick={() => c.setView({ leftTab: "layers" })}
        >
          Layers
        </button>
        <button
          aria-pressed={c.view.leftTab === "tokens"}
          onClick={() => c.setView({ leftTab: "tokens" })}
        >
          Tokens
        </button>
      </div>
      {c.view.leftTab === "layers" ? (
        <Layers
          document={c.project.document}
          view={c.view}
          select={c.select}
          expand={expand}
          mutate={c.mutate}
          add={() => c.setNotice("Component import is being built.")}
        />
      ) : (
        <p className="panel-empty">No tokens yet</p>
      )}
    </aside>
  );
}

function WorkspaceCanvas({ controller: c }: { controller: Controller }) {
  if (c.previewFrame)
    return (
      <section className="canvas-area">
        <Preview document={c.project.document} view={c.previewFrame} exit={c.exitPreview} />
      </section>
    );
  return (
    <section className="canvas-area">
      <Canvas
        document={previewDocument(c.project.document, c.preview)}
        appliedDocument={c.project.document}
        view={c.view}
        setView={c.setView}
        select={c.select}
        mutate={c.mutate}
        disabled={c.disabled}
        beforeEdit={() => c.guard.request(c.project.document.id)}
        notice={c.setNotice}
        preview={c.setPreview}
        keyDown={(event) => workspaceKey(event, c)}
      />
      {c.view.codeOpen && <WorkspaceCode controller={c} />}
      {c.notice && <WorkspaceNotice notice={c.notice} dismiss={() => c.setNotice(null)} />}
    </section>
  );
}

function WorkspaceCode({ controller: c }: { controller: Controller }) {
  return (
    <section className="code-pane" style={{ flexBasis: c.view.panels.code + 6 }}>
      <PanelResize panel="code" view={c.view} change={c.setView} />
      <Suspense
        fallback={
          <section className="code-window">
            <p className="panel-empty">Opening Code…</p>
          </section>
        }
      >
        <CodeWindow
          document={c.project.document}
          view={c.view}
          change={c.setView}
          apply={c.applySource}
          disabled={c.disabled}
          error={c.error}
        />
      </Suspense>
    </section>
  );
}

function WorkspaceNotice({ notice, dismiss }: { notice: string; dismiss: () => void }) {
  return (
    <output className="workspace-notice">
      {notice}
      <button onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </output>
  );
}

function workspaceKey(event: React.KeyboardEvent, c: Controller) {
  if (
    event.target instanceof Element &&
    event.target.closest(
      "input, textarea, select, button, a, [contenteditable], [role=menu], [role=menuitem]",
    )
  )
    return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    queueKeyboard(() => workspaceHistory(c, event.shiftKey ? "redo" : "undo"));
    return;
  }
  if (movementKey(event, c)) return;
  if (c.disabled) return;
  objectKey(event, c);
}

function movementKey(event: React.KeyboardEvent, c: Controller) {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  const directions: Record<string, { x: number; y: number }> = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
  };
  const direction = directions[event.key];
  if (!direction) return false;
  event.preventDefault();
  const surface = event.currentTarget;
  if (!(surface instanceof HTMLElement)) return true;
  const selected = [...c.view.selected];
  const step = event.shiftKey ? 8 : 1;
  const delta = { x: direction.x * step, y: direction.y * step };
  queueKeyboard(() => workspaceMovement(c, surface, selected, delta));
  return true;
}

function queueKeyboard(work: () => Promise<void>) {
  keyboardQueue = keyboardQueue
    .then(work)
    .catch((error: unknown) =>
      sessionClient.setError(
        error instanceof Error ? error.message : "The keyboard action failed.",
      ),
    );
}

async function workspaceMovement(
  c: Controller,
  surface: HTMLElement,
  selected: string[],
  delta: { x: number; y: number },
) {
  const id = c.project.document.id;
  c.setPreview(null);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const project = await renderedProject(id, surface);
  if (!project) return;
  if (surface.ownerDocument.activeElement !== surface) return;
  const view = projectView(id);
  if (
    view.selected.length !== selected.length ||
    !selected.every((value, index) => view.selected[index] === value)
  )
    return;
  const mutation = keyboardMovement(project.document, selected, delta, surface);
  if (mutation) await applyWorkspaceMutation({ ...c, project }, c.guard, c.setView, mutation);
}

async function renderedProject(id: string, surface: HTMLElement) {
  while (surface.isConnected) {
    const state = await sessionClient.whenIdle();
    if (!state.connected || state.session.activeProjectId !== id) return null;
    const project = state.session.projects.find((item) => item.document.id === id);
    if (!project) return null;
    if (surface.dataset.orcRevision === String(project.document.revision)) return project;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return null;
}

async function workspaceHistory(c: Controller, direction: "undo" | "redo") {
  const id = c.project.document.id;
  const state = await sessionClient.whenIdle();
  if (!state.connected || state.session.activeProjectId !== id) return;
  const project = state.session.projects.find((item) => item.document.id === id);
  if (!project) return;
  c.setPreview(null);
  const draft = projectView(id).draft;
  let revision = project.document.revision;
  if (draft) {
    const params = new URLSearchParams({ projectId: id, nodeId: draft.nodeId, direction });
    const impact = object(await request(`/api/history-impact?${params}`));
    revision = nonnegativeInteger(impact.revision);
    if (boolean(impact.overlaps) && !(await c.guard.request(id))) return;
  }
  await c.act("/api/history", { projectId: id, expectedRevision: revision, direction });
}

function objectKey(event: React.KeyboardEvent, c: Controller) {
  if (event.key === "Delete" && c.view.selected.length)
    void c.mutate({ kind: "delete", ids: c.view.selected });
  else if (event.key === "Escape") {
    event.preventDefault();
    const node = c.view.selected.length === 1 ? c.project.document.nodes[c.view.selected[0]] : null;
    void c.select(node?.parentId ?? null, false);
  } else if (event.key.toLowerCase() === "t") c.setView({ tool: "text" });
  else if (event.key.toLowerCase() === "v") c.setView({ tool: "select" });
  else if (event.key.toLowerCase() === "h") c.setView({ tool: "pan" });
}

import { lazy, Suspense, useState } from "react";
import type { Mutation } from "../shared/commands";
import { containsNode, type DesignDocument, type ProjectSnapshot } from "../shared/model";
import { mutationInput } from "./useSession";
import { projectView, useViewState, type ViewState } from "./view-state";
import { Toolbar } from "./Toolbar";
import { Layers } from "./Layers";
import { Properties } from "./Properties";
import { Canvas } from "./Canvas";
import { DiscardDraft, useDraftGuard, useDraftUnload } from "./draft-guard";
import { request } from "./api";
import { boolean, nonnegativeInteger, object } from "../shared/validation";
import { previewDocument, type PropertyPreview } from "./property-preview";

type Props = {
  project: ProjectSnapshot;
  act: (path: string, input: unknown) => Promise<boolean>;
  disabled: boolean;
  error: string | null;
};
type Controller = ReturnType<typeof useWorkspace>;
const CodeWindow = lazy(() =>
  import("./CodeWindow").then((module) => ({ default: module.CodeWindow })),
);

export function Workspace(props: Props) {
  const controller = useWorkspace(props);
  return (
    <main className="workspace">
      <WorkspaceLeft controller={controller} />
      <Toolbar
        view={controller.view}
        tool={(tool) => controller.setView({ tool })}
        code={() => void controller.toggleCode()}
        preview={() => controller.setNotice("Select one frame to preview")}
      />
      <WorkspaceCanvas controller={controller} />
      <Properties
        document={props.project.document}
        selected={controller.view.selected}
        mutate={controller.mutate}
        disabled={props.disabled}
        prepare={controller.prepareProperties}
        preview={controller.setPreview}
      />
      {controller.guard.pending && <DiscardDraft decide={controller.guard.decide} />}
    </main>
  );
}

function useWorkspace(props: Props) {
  const { view, setView } = useViewState(props.project.document.id);
  const guard = useDraftGuard();
  useDraftUnload(props.project.document.id);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<PropertyPreview>(null);
  const select = async (id: string | null, extend: boolean) => {
    if (!extend && id && view.selected.length === 1 && view.selected[0] === id) return true;
    if (!(await guard.request(props.project.document.id))) return false;
    setView(selectionChange(props.project.document, view, id, extend));
    return true;
  };
  const mutate = (mutation: Mutation) => applyWorkspaceMutation(props, guard, setView, mutation);
  const controls = codeControls(props, setView, guard);
  const prepareProperties = () =>
    projectView(props.project.document.id).draft ? guard.request(props.project.document.id) : true;
  return {
    ...props,
    view,
    setView,
    select,
    mutate,
    notice,
    setNotice,
    guard,
    preview,
    setPreview,
    prepareProperties,
    ...controls,
  };
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
  if (mutation.kind === "lock") return false;
  if (mutation.kind === "insert") return true;
  const ids = mutation.kind === "delete" ? mutation.ids : [mutation.id];
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
    if (
      await props.act(
        "/api/commands",
        mutationInput(id, draft.baseRevision, {
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
  const expanded = new Set(view.expanded);
  let parent = id ? document.nodes[id]?.parentId : null;
  while (parent) {
    expanded.add(parent);
    parent = document.nodes[parent]?.parentId;
  }
  return { selected, expanded: [...expanded] };
}

function WorkspaceLeft({ controller: c }: { controller: Controller }) {
  const expand = (id: string) =>
    c.setView({
      expanded: c.view.expanded.includes(id)
        ? c.view.expanded.filter((value) => value !== id)
        : [...c.view.expanded, id],
    });
  return (
    <aside className="left-panel">
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
  return (
    <section className="canvas-area">
      <Canvas
        document={previewDocument(c.project.document, c.preview)}
        view={c.view}
        setView={c.setView}
        select={c.select}
        mutate={c.mutate}
        disabled={c.disabled}
        beforeEdit={() => c.guard.request(c.project.document.id)}
        keyDown={(event) => workspaceKey(event, c)}
      />
      {c.view.codeOpen && (
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
      )}
      {c.notice && <WorkspaceNotice notice={c.notice} dismiss={() => c.setNotice(null)} />}
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
  if (c.disabled) return;
  if (
    event.target instanceof HTMLElement &&
    event.target.closest("input, textarea, [contenteditable]")
  )
    return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    void workspaceHistory(c, event.shiftKey ? "redo" : "undo");
    return;
  }
  objectKey(event, c);
}

async function workspaceHistory(c: Controller, direction: "undo" | "redo") {
  const id = c.project.document.id;
  const draft = projectView(id).draft;
  let revision = c.project.document.revision;
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
    const node = c.view.selected.length === 1 ? c.project.document.nodes[c.view.selected[0]] : null;
    c.setView({ selected: node?.parentId ? [node.parentId] : [] });
  } else if (event.key.toLowerCase() === "t") c.setView({ tool: "text" });
  else if (event.key.toLowerCase() === "v") c.setView({ tool: "select" });
  else if (event.key.toLowerCase() === "h") c.setView({ tool: "pan" });
}

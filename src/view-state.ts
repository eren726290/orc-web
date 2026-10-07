import { useCallback, useSyncExternalStore } from "react";

export type ViewState = {
  selected: string[];
  expanded: string[];
  tool: "select" | "pan" | "text";
  leftTab: "layers" | "tokens";
  codeOpen: boolean;
  draft: { nodeId: string; source: string; baseRevision: number } | null;
  pan: { x: number; y: number; scale: number };
};

const views = new Map<string, ViewState>();
const listeners = new Set<() => void>();

export function useViewState(projectId: string) {
  const snapshot = useCallback(() => projectView(projectId), [projectId]);
  const view = useSyncExternalStore(subscribe, snapshot);
  const setView = useCallback(
    (patch: Partial<ViewState>) => setProjectView(projectId, patch),
    [projectId],
  );
  return { view, setView };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function projectView(projectId: string): ViewState {
  let view = views.get(projectId);
  if (!view) {
    view = {
      selected: [],
      expanded: [],
      tool: "select",
      leftTab: "layers",
      codeOpen: false,
      draft: null,
      pan: { x: 100, y: 100, scale: 1 },
    };
    views.set(projectId, view);
  }
  return view;
}

export function setProjectView(projectId: string, patch: Partial<ViewState>) {
  views.set(projectId, { ...projectView(projectId), ...patch });
  listeners.forEach((notify) => notify());
}

export function forgetClosedViews(projectIds: string[]) {
  for (const id of views.keys()) if (!projectIds.includes(id)) views.delete(id);
}

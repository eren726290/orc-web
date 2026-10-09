import type { SessionSnapshot } from "../../shared/document/model";
import { sessionRequest } from "./api";
import { forgetClosedViews } from "../editor/view-state";

type State = { session: SessionSnapshot; error: string | null; connected: boolean; busy: boolean };
let state: State = {
  session: { activeProjectId: null, projects: [], recentPaths: [] },
  error: null,
  connected: false,
  busy: false,
};
let sequence = 0;
const listeners = new Set<() => void>();

function publish(patch: Partial<State>) {
  if (patch.session)
    forgetClosedViews(patch.session.projects.map((project) => project.document.id));
  state = { ...state, ...patch };
  listeners.forEach((notify) => notify());
}

async function refresh() {
  const version = ++sequence;
  try {
    const session = await sessionRequest("/api/session");
    if (version === sequence) publish({ session, connected: true });
  } catch {
    if (version === sequence) publish({ connected: false });
  }
}

async function act(path: string, input: unknown): Promise<boolean> {
  if (state.busy) return false;
  publish({ busy: true, error: null });
  const version = ++sequence;
  try {
    const session = await sessionRequest(path, input);
    if (version === sequence) publish({ session, connected: true });
    return true;
  } catch (error) {
    publish({ error: error instanceof Error ? error.message : "The action could not finish." });
    await refresh();
    return false;
  } finally {
    publish({ busy: false });
  }
}

function whenIdle(): Promise<State> {
  if (!state.busy) return Promise.resolve(state);
  return new Promise((resolve) => {
    const notify = () => {
      if (state.busy) return;
      listeners.delete(notify);
      resolve(state);
    };
    listeners.add(notify);
  });
}

export const sessionClient = {
  snapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  refresh,
  act,
  whenIdle,
  setError: (error: string | null) => publish({ error }),
};

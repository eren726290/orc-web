import { useEffect, useSyncExternalStore } from "react";
import type { Mutation } from "../shared/commands";
import { sessionClient } from "./session-client";

export function useSession() {
  const state = useSyncExternalStore(sessionClient.subscribe, sessionClient.snapshot);
  useEffect(() => {
    void sessionClient.refresh();
    const timer = setInterval(() => {
      if (!sessionClient.snapshot().busy) void sessionClient.refresh();
    }, 800);
    return () => clearInterval(timer);
  }, []);
  return { ...state, act: sessionClient.act, setError: sessionClient.setError };
}

export function mutationInput(projectId: string, revision: number, mutation: Mutation) {
  return { projectId, expectedRevision: revision, commandId: crypto.randomUUID(), mutation };
}

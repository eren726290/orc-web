import { useEffect, useState } from "react";
import { hasDrafts, projectView, setProjectView } from "../view-state";
import { useModal } from "../../app/useModal";

export function useDraftGuard() {
  const [pending, setPending] = useState<{ resolve: (discard: boolean) => void } | null>(null);
  useEffect(() => () => pending?.resolve(false), [pending]);
  const request = async (projectId: string): Promise<boolean> => {
    if (!projectView(projectId).draft) return true;
    if (pending) return false;
    const discard = await new Promise<boolean>((resolve) => setPending({ resolve }));
    if (discard) setProjectView(projectId, { draft: null });
    return discard;
  };
  const decide = (discard: boolean) => {
    pending?.resolve(discard);
    setPending(null);
  };
  return { request, pending: pending !== null, decide };
}

export function DiscardDraft({ decide }: { decide: (discard: boolean) => void }) {
  const dialog = useModal();
  return (
    <dialog
      ref={dialog}
      className="close-project"
      onCancel={() => decide(false)}
      aria-labelledby="discard-title"
    >
      <h2 id="discard-title">Discard unapplied changes?</h2>
      <p>Your code has not been applied to the design.</p>
      <div className="dialog-actions">
        <button onClick={() => decide(false)}>Cancel</button>
        <button className="primary" onClick={() => decide(true)}>
          Discard
        </button>
      </div>
    </dialog>
  );
}

export function useDraftUnload() {
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (hasDrafts()) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);
}

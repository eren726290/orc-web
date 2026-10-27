import { object, string } from "../../../shared/validation";
import { parsePenRecord } from "../../../shared/pen/record";
import { penRecord } from "../../../shared/pen/source";
import type { PenGeometry } from "../../../shared/pen/model";
import type { PenDrag } from "../../../shared/pen/solver-input";

type State = {
  pending: ((result: unknown) => void) | null;
  ready: ((error: string | null) => void) | null;
  closed: boolean;
};

export function createPenWorker(module: WebAssembly.Module) {
  const worker = new Worker(new URL("./solver-worker.ts", import.meta.url), { type: "module" });
  const state: State = { pending: null, ready: null, closed: false };
  const ready = new Promise<string | null>((resolve) => {
    state.ready = resolve;
  });
  const fail = (message: string) => {
    state.closed = true;
    state.ready?.(message);
    state.ready = null;
    state.pending?.({ kind: "refused", message, numericWorkMs: 0 });
    state.pending = null;
    worker.terminate();
  };
  worker.onmessage = (event: MessageEvent<unknown>) => receive(state, event.data);
  worker.onerror = (event) => {
    event.preventDefault();
    fail(event.message || "The Pen worker could not load. Try a new gesture.");
  };
  worker.onmessageerror = () =>
    fail("The Pen worker could not exchange geometry. Try a new gesture.");
  worker.postMessage({ module });
  return {
    solve(path: PenGeometry, drag: PenDrag): Promise<unknown> {
      const record = penRecord(path);
      return ready.then((error) => {
        if (error || state.closed)
          return {
            kind: "refused",
            message: error ?? "This Pen gesture is closed.",
            numericWorkMs: 0,
          };
        return request(worker, state, record, drag);
      });
    },
    dispose: () => fail("This Pen gesture is closed."),
  };
}

function receive(state: State, value: unknown) {
  if (state.ready) {
    const input = object(value);
    state.ready(input.kind === "ready" ? null : string(input.message));
    state.ready = null;
  } else {
    const resolve = state.pending;
    state.pending = null;
    resolve?.(value);
  }
}

function request(
  worker: Worker,
  state: State,
  path: ReturnType<typeof penRecord>,
  drag: PenDrag,
): Promise<unknown> {
  if (state.pending) throw new Error("The Pen worker is already solving.");
  return new Promise((resolve) => {
    state.pending = resolve;
    try {
      worker.postMessage({ path, anchor: drag.id, to: drag.to });
    } catch (error) {
      state.pending = null;
      resolve({
        kind: "refused",
        message: error instanceof Error ? error.message : "The Pen request failed.",
        numericWorkMs: 0,
      });
    }
  });
}

export function readPenWorkerResult(value: unknown) {
  const input = object(value);
  if (
    typeof input.numericWorkMs !== "number" ||
    !Number.isFinite(input.numericWorkMs) ||
    input.numericWorkMs < 0
  )
    throw new Error("The Pen worker returned invalid timing data.");
  if (input.kind === "refused")
    return {
      kind: "refused" as const,
      message: string(input.message),
      numericWorkMs: input.numericWorkMs,
    };
  if (input.kind !== "accepted") throw new Error("The Pen worker returned an invalid result.");
  return {
    kind: "accepted" as const,
    path: parsePenRecord(input.path),
    numericWorkMs: input.numericWorkMs,
  };
}

import { object, string } from "../../../shared/validation";
import { createPenSolver } from "../../../shared/pen/solver";
import { parsePenRecord } from "../../../shared/pen/record";
import { penRecord } from "../../../shared/pen/source";
import { validatePenPoint } from "../../../shared/pen/validation";

let solver: ReturnType<typeof createPenSolver> | null = null;

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  try {
    const input = object(event.data);
    if (input.module instanceof WebAssembly.Module) {
      solver = createPenSolver(input.module);
      self.postMessage({ kind: "ready" });
    } else self.postMessage(solve(input));
  } catch (error) {
    self.postMessage({
      kind: "refused",
      message: error instanceof Error ? error.message : "The Pen worker failed.",
      numericWorkMs: 0,
    });
  }
});

function solve(input: Record<string, unknown>) {
  if (!solver) throw new Error("The Pen worker has not loaded.");
  const path = parsePenRecord(input.path);
  const target = object(input.to);
  if (typeof target.x !== "number" || typeof target.y !== "number")
    throw new Error("Invalid Pen target.");
  const to = { x: target.x, y: target.y };
  validatePenPoint(to);
  const start = performance.now();
  const result = solver.solve(path, { id: string(input.anchor), to });
  const numericWorkMs = performance.now() - start;
  return result.kind === "accepted"
    ? { kind: "accepted", path: penRecord(result.path), numericWorkMs }
    : { kind: "refused", message: result.message, numericWorkMs };
}

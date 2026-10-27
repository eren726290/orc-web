import type { PenGeometry } from "./model";
import { solverGeometry, solverInput, type NumericRequest, type PenDrag } from "./solver-input";
import { solverResponse, type NumericResult, type PenSolverReport } from "./solver-response";
import { penPathData } from "./source";
import { distance } from "./geometry";
import { penAnchor, penTolerance } from "./model";

export type PenSolveResult =
  | { kind: "accepted"; path: PenGeometry; report: PenSolverReport }
  | { kind: "refused"; path: PenGeometry; message: string };

function call(exports: WebAssembly.Exports, name: string, ...args: number[]): number {
  const fn = exports[name];
  if (typeof fn !== "function") throw new Error(`The pen solver is missing ${name}.`);
  const value: unknown = fn(...args);
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("The pen solver returned an invalid buffer.");
  }
  return value;
}

export function solveNumeric(
  instance: WebAssembly.Instance,
  request: NumericRequest,
): NumericResult {
  const exports = instance.exports;
  const memory = exports.memory;
  if (!(memory instanceof WebAssembly.Memory))
    throw new Error("The pen solver has no memory export.");
  const input = new TextEncoder().encode(JSON.stringify(request));
  const pointer = call(exports, "input_resize", input.length);
  if (!pointer) throw new Error("The pen request exceeds the solver exchange limit.");
  new Uint8Array(memory.buffer, pointer, input.length).set(input);
  const length = call(exports, "solve_request");
  const output = call(exports, "output_ptr");
  const data = new TextDecoder().decode(new Uint8Array(memory.buffer, output, length));
  const value: unknown = JSON.parse(data);
  return solverResponse(value);
}

export function createPenSolver(module: WebAssembly.Module) {
  let instance: WebAssembly.Instance | null = new WebAssembly.Instance(module, {});
  return {
    solve(path: PenGeometry, drag: PenDrag | null = null, full = false): PenSolveResult {
      try {
        if (!instance) throw new Error("This pen editing session is closed.");
        const result = solveNumeric(instance, solverInput(path, drag, full));
        if (!result.ok)
          throw new Error(
            "The pen rules cannot keep this move. The last valid shape is unchanged.",
          );
        const candidate = solverGeometry(path, result.points);
        if (drag && distance(penAnchor(candidate, drag.id), drag.to) > penTolerance) {
          throw new Error("The pen solver could not hold the requested anchor.");
        }
        penPathData(candidate);
        return { kind: "accepted", path: candidate, report: result };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The pen solver could not complete this move.";
        return { kind: "refused", path, message };
      }
    },
    dispose() {
      instance = null;
    },
  };
}

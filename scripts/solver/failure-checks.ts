import type { NumericRequest } from "../../shared/pen/solver-input";
import { solverInput } from "../../shared/pen/solver-input";
import { createPenSolver, solveNumeric } from "../../shared/pen/solver";
import { arcFixture, lineFixture } from "./fixtures";
import { check, throws } from "./oracle";

const memory = [...new TextEncoder().encode("memory")];
const input = [...new TextEncoder().encode("input_resize")];
// A real memory export and an input_resize function that executes unreachable.
const trapped = new WebAssembly.Module(
  new Uint8Array([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    1,
    6,
    1,
    96,
    1,
    127,
    1,
    127,
    3,
    2,
    1,
    0,
    5,
    3,
    1,
    0,
    1,
    7,
    25,
    2,
    6,
    ...memory,
    2,
    0,
    12,
    ...input,
    0,
    0,
    10,
    5,
    1,
    3,
    0,
    0,
    11,
  ]),
);

export function wasmFailureChecks(): void {
  const missing = new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
  const path = lineFixture();
  for (const module of [missing, trapped]) {
    const solver = createPenSolver(module);
    const before = JSON.stringify(path);
    const result = solver.solve(path);
    check(
      result.kind === "refused" && result.path === path,
      "WASM failure did not retain the prior path.",
    );
    check(JSON.stringify(path) === before, "WASM failure partially changed the path.");
    solver.dispose();
  }
}

export function numericBoundaryChecks(module: WebAssembly.Module): void {
  for (const index of [2, 0xffffffff, Number.MAX_SAFE_INTEGER]) {
    const request: NumericRequest = solverInput(lineFixture(), null, false);
    request.curves = [{ kind: "line", from: index, to: 1 }];
    throws(
      () => solveNumeric(new WebAssembly.Instance(module, {}), request),
      "Invalid numeric point reference accepted.",
    );
  }
  const solver = createPenSolver(module);
  const path = arcFixture();
  for (const to of [
    { x: 30, y: -200 },
    { x: -200, y: -200 },
    { x: 500, y: 500 },
  ]) {
    const before = JSON.stringify(path);
    const result = solver.solve(path, { id: "a3", to });
    check(JSON.stringify(path) === before, "A large move changed its input record.");
    if (result.kind === "refused")
      check(result.path === path, "A refused large move lost its complete prior state.");
  }
  solver.dispose();
}

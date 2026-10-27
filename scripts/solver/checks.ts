import { tangentArc } from "../../shared/pen/geometry";
import type { PenGeometry } from "../../shared/pen/model";
import { createPenSolver, solveNumeric, type PenSolveResult } from "../../shared/pen/solver";
import { solverGeometry, solverInput } from "../../shared/pen/solver-input";
import { penPathData, penRecord } from "../../shared/pen/source";
import { validatePenGeometry, validatePenPoint } from "../../shared/pen/validation";
import {
  arcFixture,
  badgeFixture,
  cornerFixture,
  lineFixture,
  oppositeArcsFixture,
  reverseFixture,
} from "./fixtures";
import { assertRules, check, close, throws } from "./oracle";
import { numericBoundaryChecks, wasmFailureChecks } from "./failure-checks";

function accepted(result: PenSolveResult): Extract<PenSolveResult, { kind: "accepted" }> {
  if (result.kind !== "accepted") throw new Error(result.message);
  assertRules(result.path);
  return result;
}

function mirrorChecks(module: WebAssembly.Module): void {
  for (const sign of [1, -1]) {
    const solver = createPenSolver(module);
    const path = arcFixture(sign);
    const before = JSON.stringify(path);
    const solved = accepted(solver.solve(path, { id: "a3", to: { x: 35, y: 35 * sign } }));
    close(solved.path.anchors[2].x, 35, "Held arc anchor x");
    close(solved.path.anchors[2].y, 35 * sign, "Held arc anchor y");
    check(JSON.stringify(path) === before, "Solve mutated the previous accepted record.");
    check(
      penPathData(solved.path).includes(`0 0 ${sign === 1 ? 1 : 0}`),
      "Wrong SVG sweep direction.",
    );
    accepted(solver.solve(reverseFixture(path)));
    solver.dispose();
  }
}

function freedomChecks(module: WebAssembly.Module): void {
  const solver = createPenSolver(module);
  const path = lineFixture();
  const solved = accepted(solver.solve(path, { id: "a1", to: { x: 20, y: 30 } }));
  close(solved.path.anchors[0].x, 20, "First anchor was silently fixed to origin");
  close(solved.path.anchors[0].y, 30, "First anchor was silently fixed to origin");
  check(solved.report.dof === null, "StatusOnly DOF must remain unknown.");
  const full = accepted(solver.solve(path, null, true));
  check(
    full.report.dof !== null && full.report.dof > 0,
    "Full analysis must report actual freedom.",
  );
  accepted(solver.solve(cornerFixture(), { id: "a3", to: { x: 95, y: 85 } }));
  solver.dispose();
}

function reconstructionChecks(module: WebAssembly.Module): void {
  const solver = createPenSolver(module);
  const path = arcFixture();
  const record = penRecord(path);
  const restored: PenGeometry = JSON.parse(JSON.stringify(record));
  check(
    penPathData(accepted(solver.solve(restored)).path) === penPathData(path),
    "Reload changed directed geometry.",
  );
  const detached = { ...path, rules: path.rules.filter((r) => r.id !== "r2") };
  check(
    penPathData(accepted(solver.solve(detached)).path) === penPathData(path),
    "Rule removal changed an existing arc.",
  );
  const shortened = {
    ...detached,
    anchors: detached.anchors.slice(1),
    segments: detached.segments.slice(1),
    rules: detached.rules.filter((r) => r.id === "r3"),
  };
  accepted(solver.solve(shortened));
  check(shortened.segments[0].kind === "arc", "Deleting the incoming line erased the arc.");
  solver.dispose();
}

function degenerationControl(module: WebAssembly.Module): void {
  const original = lineFixture();
  const before = JSON.stringify(original);
  const request = solverInput(original, null, false);
  request.rules.push({ kind: "vertical", segment: 0 });
  const raw = solveNumeric(new WebAssembly.Instance(module, {}), request);
  check(raw.ok, "The degenerate unguarded control did not report success.");
  check(
    Math.hypot(raw.points[1].x - raw.points[0].x, raw.points[1].y - raw.points[0].y) < 1e-6,
    "Control did not collapse.",
  );
  throws(
    () => solverGeometry(original, raw.points),
    "Production guard accepted collapsed solver success.",
  );
  check(JSON.stringify(original) === before, "Rejected solve changed the original geometry.");
}

function reversalControl(module: WebAssembly.Module): void {
  const original = arcFixture();
  const request = solverInput(original, null, false);
  request.points[3] = [30, 0];
  const raw = solveNumeric(new WebAssembly.Instance(module, {}), request);
  check(raw.ok, "The unsigned-tangency control did not solve.");
  throws(
    () => solverGeometry(original, raw.points),
    "Production guard accepted reversed tangent traversal.",
  );
  check(original.anchors[3].y === 80, "Reversal rejection mutated the prior path.");
}

function refusalChecks(module: WebAssembly.Module): void {
  const solver = createPenSolver(module);
  const path = arcFixture();
  const before = JSON.stringify(path);
  const result = solver.solve(path, { id: "missing", to: { x: 10, y: 10 } });
  check(
    result.kind === "refused" && result.path === path,
    "Unknown anchor did not retain prior state.",
  );
  const bad = solver.solve(path, { id: "a3", to: { x: Infinity, y: 0 } });
  check(bad.kind === "refused" && bad.path === path, "Non-finite target was accepted.");
  check(JSON.stringify(path) === before, "A refused operation changed the full previous path.");
  accepted(solver.solve(path));
  solver.dispose();
  check(solver.solve(path).kind === "refused", "Disposed solver kept accepting edits.");
}

function isolationChecks(module: WebAssembly.Module): void {
  const a = createPenSolver(module);
  const b = createPenSolver(module);
  const first = accepted(a.solve(lineFixture(), { id: "a1", to: { x: 45, y: 15 } }));
  const snapshot = JSON.stringify(first);
  accepted(b.solve(arcFixture(-1), { id: "a3", to: { x: 35, y: -35 } }));
  check(JSON.stringify(first) === snapshot, "Another path changed a previous result.");
  a.dispose();
  accepted(b.solve(lineFixture()));
  b.dispose();
}

function precisionChecks(): void {
  const path = lineFixture();
  path.anchors = [
    { id: "a1", x: -0, y: 0 },
    { id: "a2", x: 0.0004, y: 0 },
  ];
  const data = penPathData(path);
  check(
    data === "M 0 0 L 0.0004 0",
    "Round-trip output lost tiny geometry or negative-zero normalization.",
  );
  check(
    Number(path.anchors[1].x.toFixed(3)) === 0,
    "Three-decimal collapse control was not exercised.",
  );
  for (const x of [NaN, Infinity, -Infinity, 1e9, -1e9])
    throws(() => validatePenPoint({ x, y: 0 }), "Invalid coordinate accepted.");
  const arc = { ...arcFixture(), rules: [] };
  arc.anchors[2] = { ...arc.anchors[2], x: -30, y: 30 };
  throws(() => validatePenGeometry(arc), "Major arc was accepted.");
  const cap = tangentArc({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 });
  check(
    cap?.capped && cap.to.x === 0 && cap.to.y === 2,
    "Half-circle projection used the pointer endpoint.",
  );
  check(
    tangentArc({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 10, y: 0 }) === null,
    "Collinear arc did not use line fallback.",
  );
}

export function solverChecks(module: WebAssembly.Module) {
  const groups: string[] = [];
  const run = (name: string, execute: () => void) => {
    execute();
    groups.push(name);
  };
  run("horizontal, vertical, perpendicular and free first anchor", () => freedomChecks(module));
  run("left/right arcs and reversed traversal", () => mirrorChecks(module));
  run("opposite-turn arcs", () => {
    accepted(createPenSolver(module).solve(oppositeArcsFixture()));
  });
  run("exact closed path", () => {
    accepted(createPenSolver(module).solve(badgeFixture()));
  });
  run("rule removal, incoming deletion and reconstruction", () => reconstructionChecks(module));
  run("unguarded collapsed success rejected by guard", () => degenerationControl(module));
  run("unguarded reversed tangent success rejected by guard", () => reversalControl(module));
  run("refusal, full rollback and recovery", () => refusalChecks(module));
  run("per-path instance and result isolation", () => isolationChecks(module));
  run("numeric encoding, range, major arcs and capped endpoint", precisionChecks);
  run("encoded semicircle preserves the saved center", () => {
    const path = badgeFixture();
    const arc = path.segments[1];
    check(arc.kind === "arc", "Missing semicircle control.");
    arc.center.y += 1e-8;
    validatePenGeometry(path);
    throws(() => penPathData(path), "Encoded center mismatch was accepted.");
  });
  run("missing WASM exports and actual trap rollback", wasmFailureChecks);
  run("numeric reference boundaries and large jump rollback", () => numericBoundaryChecks(module));
  return { groups, passed: groups.length };
}

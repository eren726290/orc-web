import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { appendPenSegment } from "../../../../shared/pen/drawing";
import { deletePenAnchor } from "../../../../shared/pen/deletion";
import { penRecord, penPathData } from "../../../../shared/pen/source";
import type { PenGeometry, PenPoint } from "../../../../shared/pen/model";
import { arcFixture, badgeFixture, lineFixture } from "../../../solver/fixtures";
import { assertRules } from "../../../solver/oracle";
import { sourceEvidence } from "../../../support/editor-evidence";
import { createPenSolver, solveNumeric } from "../../../../shared/pen/solver";
import { solverGeometry, solverInput } from "../../../../shared/pen/solver-input";
import { continuePenMotion, penMotion } from "../../../../shared/pen/continuation";

const checks: string[] = [];
const module = await WebAssembly.compile(
  new Uint8Array(readFileSync("shared/pen/pen-solver.wasm")),
);
const defaults = {
  arc: false,
  shift: false,
  alt: false,
  close: false,
  ids: { anchor: "next-a", segment: "next-s", rule: "next-r" },
};
function append(path: PenGeometry, target: PenPoint, options: Partial<typeof defaults> = {}) {
  return appendPenSegment(path, target, { ...defaults, ...options });
}

function snaps() {
  const start: PenGeometry = {
    anchors: [{ id: "a1", x: 0, y: 0 }],
    segments: [],
    rules: [],
    closed: false,
  };
  const target = (degrees: number) => ({
    x: 100 * Math.cos((degrees * Math.PI) / 180),
    y: 100 * Math.sin((degrees * Math.PI) / 180),
  });
  const firstArc = append(start, target(32), { arc: true });
  assert.equal(firstArc.path.segments[0].kind, "line");
  assert.match(firstArc.message ?? "", /Straight line.*no tangent/u);
  assert.equal(append(start, target(2)).path.rules[0]?.kind, "horizontal");
  assert.equal(append(start, target(3)).path.rules.length, 0);
  const unsnapped = append(start, target(2), { alt: true }).path;
  assert.equal(unsnapped.rules.length, 0);
  assert.deepEqual(unsnapped.anchors[1], { id: "next-a", ...target(2) });
  const diagonal = append(start, target(32), { shift: true }).path.anchors[1];
  assert.ok(Math.abs(diagonal.x - Math.SQRT1_2 * 100) < 1e-10);
  assert.ok(Math.abs(diagonal.y - diagonal.x) < 1e-10);
  assert.equal(append(start, target(10), { shift: true }).path.rules[0]?.kind, "horizontal");
  const perpendicular = append(lineFixture(), { x: 80, y: 90 }).path;
  assert.equal(perpendicular.rules.at(-1)?.kind, "perpendicular");
  const arc = arcFixture();
  arc.anchors.pop();
  arc.segments.pop();
  arc.rules.pop();
  const tangent = append(arc, { x: 30, y: 100 }).path;
  assert.equal(tangent.rules.at(-1)?.kind, "tangent");
  checks.push("2.5-degree angular boundary, Alt, Shift, perpendicular/HV and tangent/HV ties");
}

function arcsAndClosure() {
  for (const sign of [1, -1]) {
    const arc = append(lineFixture(), { x: 110, y: 10 + 30 * sign }, { arc: true, alt: true }).path;
    assertRules(arc);
    const segment = arc.segments.at(-1);
    assert.ok(segment?.kind === "arc");
    assert.equal(segment.sweep, sign === 1 ? 1 : 0);
  }
  const fallback = append(lineFixture(), { x: 110, y: 10 }, { arc: true });
  assert.equal(fallback.path.segments.at(-1)?.kind, "line");
  assert.match(fallback.message ?? "", /Straight line/u);
  const capped = append(lineFixture(), { x: -20, y: 60 }, { arc: true });
  assert.deepEqual(capped.path.anchors.at(-1), { id: "next-a", x: 80, y: 260 });
  assert.match(capped.message ?? "", /180/u);
  penPathData(capped.path);
  const path = badgeFixture();
  path.closed = false;
  path.segments.pop();
  path.rules = [];
  const closed = append(path, path.anchors[0], { close: true, arc: true }).path;
  assert.equal(closed.anchors.length, path.anchors.length);
  assert.equal(closed.segments.length, path.segments.length + 1);
  assert.equal(closed.closed, true);
  penRecord(closed);
  path.anchors[0] = { id: "a1", x: 50, y: 50 };
  assert.throws(() => append(path, path.anchors[0], { close: true, arc: true }), /cannot close/u);
  checks.push(
    "both directed arcs, fundamental tangency under Alt, collinear fallback, capped endpoint and exact closure/refusal",
  );
}

function deletion() {
  for (const path of [arcFixture(), badgeFixture()]) {
    for (const anchor of path.anchors) {
      const changed = deletePenAnchor(path, anchor.id);
      assert.ok(changed);
      assert.equal(changed.anchors.length, path.anchors.length - 1);
      assert.equal(changed.closed, path.closed);
      penRecord(changed);
      assertRules(changed);
    }
  }
  const removedIncoming = deletePenAnchor(arcFixture(), "a1");
  assert.ok(removedIncoming);
  assert.equal(removedIncoming.segments[0].kind, "arc");
  assert.deepEqual(removedIncoming.segments[0], arcFixture().segments[1]);
  assert.equal(deletePenAnchor(lineFixture(), "a1"), null);
  checks.push(
    "all open/closed anchor positions, straight replacement, retained arc without incoming segment, and whole-node boundary",
  );
}

function continuation() {
  const path = arcFixture();
  const drag = { id: "a3", to: { x: 100, y: 100 } };
  const raw = solveNumeric(new WebAssembly.Instance(module, {}), solverInput(path, drag, false));
  assert.equal(raw.ok, true, "The natural coarse-move control must report success.");
  assert.throws(() => solverGeometry(path, raw.points), /reversing/u);
  const solver = createPenSolver(module);
  const refused = solver.solve(path, drag);
  assert.equal(refused.kind, "refused");
  assert.equal(refused.path, path);
  const motion = penMotion(path, drag.id);
  motion.target = drag.to;
  motion.pending = true;
  let calls = 0;
  const counted = {
    solve: (...args: Parameters<typeof solver.solve>) => {
      calls++;
      return solver.solve(...args);
    },
    dispose: solver.dispose,
  };
  for (let frame = 0; frame < 80 && motion.pending; frame++) {
    const before = calls;
    continuePenMotion(motion, counted, assertRules, () => 0);
    assert.ok(calls - before <= 4, "A frame exceeded its attempted-solve cap.");
  }
  assert.equal(motion.pending, false);
  assert.deepEqual(motion.path.anchors[2], { id: "a3", ...drag.to });
  assert.deepEqual(
    path,
    arcFixture(),
    "The guarded operation must not mutate its complete starting state.",
  );
  solver.dispose();
  checks.push(
    "natural coarse reversal reports raw success, guarded refusal rolls back, adaptive continuation reaches the valid target within four calls per frame",
  );
}

mkdirSync("artifacts/pen-interactions", { recursive: true });
let failed: string | null = null;
try {
  snaps();
  arcsAndClosure();
  deletion();
  continuation();
  console.log("PEN_INTERACTIONS_PASSED");
} catch (error) {
  failed = String(error);
  throw error;
} finally {
  writeFileSync(
    "artifacts/pen-interactions/result.json",
    JSON.stringify(
      {
        ...sourceEvidence(),
        command: "bun scripts/e2e/editor/pen/check-interactions.ts",
        checks,
        failed,
      },
      null,
      2,
    ),
  );
}

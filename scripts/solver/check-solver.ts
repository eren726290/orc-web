import { mkdirSync, writeFileSync } from "node:fs";
import { sourceEvidence } from "../support/editor-evidence";
import { checkBuild } from "./check-build";
import { solverChecks } from "./checks";

mkdirSync("artifacts/pen-solver", { recursive: true });
const evidence = { ...sourceEvidence(), command: "bun scripts/solver/check-solver.ts" };
try {
  const build = await checkBuild();
  const result = solverChecks(build.module);
  const { module: _module, ...identity } = build;
  writeFileSync(
    "artifacts/pen-solver/bun-result.json",
    JSON.stringify({ ...evidence, ...identity, result }, null, 2),
  );
  console.log(`PEN_SOLVER_BUN_PASSED ${result.passed} groups`);
} catch (error) {
  const message = error instanceof Error ? error.stack : String(error);
  writeFileSync(
    "artifacts/pen-solver/bun-result.json",
    JSON.stringify({ ...evidence, failed: message }, null, 2),
  );
  throw error;
}

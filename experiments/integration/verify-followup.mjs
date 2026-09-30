import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) =>
  JSON.parse(readFileSync(new URL("evidence/followup/" + file, import.meta.url), "utf8"));
const comparison = read("typescript/equivalent-comparison.json");
assert(comparison.equivalentExpandedSettings && comparison.dependencyDeclarationChecking);
assert.deepEqual(
  comparison.commands.map((row) => [row.version, row.exit]),
  [
    ["Version 6.0.3", 2],
    ["Version 7.0.2", 1],
  ],
);
assert(read("typescript/final-commands.json").every((row) => row.exit === 0));
assert(read("typescript/installed-after.json").runtimeUnchanged);
assert.equal(read("typescript/frozen-install-command.json").exit, 0);
assert.equal(read("identical-baseline/command.json").exit, 1);
assert.match(
  read("identical-baseline/report.json").failure,
  /Selection invalidated before editing/,
);
const counts = { mapping: 30, continuity: 14, "base-ui": 9, integration: 4 };
const regressions = read("regression-commands.json");
assert.equal(regressions.length, 5);
for (const row of regressions) {
  assert.equal(row.exit, 0);
  if (row.name === "identical") assert.equal(row.result, "PASS");
  else {
    assert.equal(row.results.length, counts[row.name]);
    assert(row.results.every((check) => check.result === "PASS"));
  }
}
assert.equal(read("identical/report.json").result, "PASS");
console.log(
  "FOLLOWUP EVIDENCE VERIFIED: same-tree compiler comparison, checked declaration correction, initially identical selections, and affected regressions.",
);

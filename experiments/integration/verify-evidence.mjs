import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const folder = path.join(root, "experiments/integration/evidence");
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const ancestry = read(path.join(root, "experiments/integration/ancestry.json"));
for (const commit of Object.values(ancestry.prHeads))
  execFileSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], { cwd: root });
const original = path.join(root, "experiments/original-source-proof");
assert.equal(
  readFileSync(path.join(original, "proof.ts"), "utf8"),
  readFileSync(path.join(original, "evidence/mobile-original/proof.ts"), "utf8").replace(
    "chromium.launch({ headless: true })",
    'chromium.launch({ channel: "chrome", headless: true })',
  ),
);
assert.deepEqual(
  readFileSync(path.join(original, "fixture.tsx")),
  readFileSync(path.join(original, "evidence/mobile-original/fixture.tsx")),
);
const fresh = path.join(folder, "fresh-reproduction");
const provenance = read(path.join(fresh, "provenance.json"));
assert(Object.values(provenance.results).every((exit) => exit === 0));
const counts = { original: 12, mapping: 30, continuity: 14, "base-ui": 9 };
for (const item of read(path.join(fresh, "existing/summary.json"))) {
  assert.equal(item.exit, 0);
  assert.equal(item.results.length, counts[item.name]);
  assert(item.results.every((result) => result.result === "PASS"));
}
const yellow = read(path.join(fresh, "integration/report.json"));
assert.equal(yellow.results.length, 4);
assert(yellow.results.every((result) => result.result === "PASS"));
const baseline = read(path.join(folder, "baseline/report.json"));
assert.equal(baseline.results.filter((result) => result.result === "FAIL").length, 4);
assert.equal(
  readFileSync(path.join(folder, "typecheck/full-declarations-exit.txt"), "utf8").trim(),
  "1",
);
const resolved = read(path.join(fresh, "resolution.json"));
assert.equal(new Set(resolved.react.map((row) => row.react)).size, 1);
assert(
  resolved.installed.every((row) =>
    row.packagePath.startsWith("/tmp/orc-web-pr5-reproduction-20260930/"),
  ),
);
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n");
assert(
  tracked.every(
    (file) =>
      !file
        .split("/")
        .some((part) => ["node_modules", "runs", "generated", ".cache"].includes(part)),
  ),
);
console.log(
  "EVIDENCE VERIFIED: inherited ancestry, original integrity, fresh install, 12/30/14/9 existing checks, four new workflows, and explicit declaration limitation.",
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { object } from "../../shared/validation";
import { requiredInputHashes, sha256, solverPin } from "./build-inputs";
import { checkBuild } from "./check-build";

await checkBuild();
const build = object(JSON.parse(readFileSync("solver/pen/build.json", "utf8")));
assert.deepEqual(build.upstreamHashes, requiredInputHashes("solver/upstream"));
const native = object(
  JSON.parse(readFileSync("artifacts/pen-solver/native-baseline.json", "utf8")),
);
const log = readFileSync("artifacts/pen-solver/native-baseline.log", "utf8");
assert.equal(native.exitCode, 0);
assert.equal(native.logSha256, sha256(log));
assert.match(log, /test result: ok\. 216 passed; 0 failed; 3 ignored;/);
assert.equal(typeof native.compiler, "string");
assert.ok(String(native.compiler).startsWith(solverPin.compiler));
const wrapper = object(
  JSON.parse(readFileSync("artifacts/pen-solver/native-wrapper.json", "utf8")),
);
const wrapperLog = readFileSync("artifacts/pen-solver/native-wrapper.log", "utf8");
assert.equal(wrapper.exitCode, 0);
assert.equal(wrapper.logSha256, sha256(wrapperLog));
assert.deepEqual(wrapper.adapterHashes, build.adapterHashes);
assert.match(wrapperLog, /test result: ok\. 2 passed; 0 failed; 0 ignored;/);
console.log("PEN_SOLVER_PROVENANCE_VERIFIED");

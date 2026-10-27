import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { object } from "../../shared/validation";
import { fileHashes, sha256, solverPin } from "./build-inputs";
import { checkLicenses } from "./check-licenses";

export async function checkBuild() {
  const build = object(JSON.parse(readFileSync("solver/pen/build.json", "utf8")));
  const bytes = readFileSync("shared/pen/pen-solver.wasm");
  assert.equal(build.commit, solverPin.commit);
  assert.equal(build.archiveSha256, solverPin.archiveSha256);
  assert.equal(build.sha256, sha256(bytes));
  assert.equal(build.bytes, bytes.length);
  assert.equal(build.lockSha256, sha256(readFileSync("solver/pen/Cargo.lock")));
  assert.equal(build.manifestSha256, sha256(readFileSync("solver/pen/Cargo.toml")));
  assert.deepEqual(build.adapterHashes, fileHashes("solver/pen/src"));
  const module = await WebAssembly.compile(bytes);
  assert.deepEqual(WebAssembly.Module.imports(module), []);
  assert.equal(typeof build.compiler, "string");
  assert.ok(String(build.compiler).startsWith(solverPin.compiler));
  checkLicenses();
  return { module, bytes: bytes.length, sha256: build.sha256, compiler: build.compiler };
}

if (import.meta.main) {
  const result = await checkBuild();
  console.log(`PEN_SOLVER_BUILD_VERIFIED ${result.bytes} bytes ${result.sha256}`);
}

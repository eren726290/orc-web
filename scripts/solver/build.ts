import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileHashes, prepareUpstream, sha256, solverPin } from "./build-inputs";

const compiler = execFileSync("rustc", ["-Vv"], { encoding: "utf8" });
assert.equal(compiler.split("\n")[0], solverPin.compiler, "Use the pinned Rust 1.95.0 compiler.");
const upstreamHashes = await prepareUpstream();
const args = [
  "build",
  "--locked",
  "--manifest-path",
  "solver/pen/Cargo.toml",
  "--release",
  "--target",
  "wasm32-unknown-unknown",
];
execFileSync("cargo", args, {
  stdio: "inherit",
  env: { ...process.env, CARGO_TARGET_DIR: resolve("solver/target") },
});
const binary = "shared/pen/pen-solver.wasm";
copyFileSync("solver/target/wasm32-unknown-unknown/release/orc_pen_solver.wasm", binary);
const bytes = readFileSync(binary);
const module = await WebAssembly.compile(bytes);
const imports = WebAssembly.Module.imports(module);
assert.equal(imports.length, 0, "The editing solver must not require host imports.");
const record = {
  ...solverPin,
  compiler,
  command: ["cargo", ...args],
  release: { optLevel: 3, lto: true, codegenUnits: 1, debug: false, panic: "abort" },
  binary,
  bytes: bytes.length,
  sha256: sha256(bytes),
  imports,
  lockSha256: sha256(readFileSync("solver/pen/Cargo.lock")),
  manifestSha256: sha256(readFileSync("solver/pen/Cargo.toml")),
  adapterHashes: fileHashes("solver/pen/src"),
  upstreamHashes,
};
writeFileSync("solver/pen/build.json", `${JSON.stringify(record, null, 2)}\n`);
console.log(`PEN_SOLVER_BUILT ${bytes.length} bytes ${record.sha256}`);

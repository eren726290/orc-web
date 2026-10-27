import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

export const solverPin = {
  commit: "cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4",
  archiveSha256: "9c0a5c8e070941f0efb8380163c9415193b2e6fb43d1b7aee30c6a3a8c102e7d",
  compiler: "rustc 1.95.0 (59807616e 2026-04-14)",
};

export function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function fileHashes(directory: string): Record<string, string> {
  return Object.fromEntries(
    readdirSync(directory, { recursive: true, encoding: "utf8" })
      .filter((name) => statSync(join(directory, name)).isFile())
      .map((name) => [name, sha256(readFileSync(join(directory, name)))]),
  );
}

export function requiredInputHashes(directory: string): Record<string, string> {
  const inputs = [
    "Cargo.toml",
    "Cargo.lock",
    "crates/geom/Cargo.toml",
    "crates/sketch/Cargo.toml",
    "assets/fonts/liberation-sans/LiberationSans-Regular.ttf",
  ];
  const roots = ["crates/geom/src", "crates/sketch/src"];
  const result = Object.fromEntries(
    inputs.map((name) => [name, sha256(readFileSync(join(directory, name)))]),
  );
  for (const root of roots) {
    for (const [name, hash] of Object.entries(fileHashes(join(directory, root))))
      result[`${root}/${name}`] = hash;
  }
  return result;
}

export async function prepareUpstream(): Promise<Record<string, string>> {
  const evidence = resolve("artifacts/pen-solver");
  mkdirSync(evidence, { recursive: true });
  const archive = join(evidence, "solidcraft.tar.gz");
  if (!existsSync(archive)) {
    const url = `https://api.github.com/repos/tangency-labs/solidcraft/tarball/${solverPin.commit}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Cannot download the pinned solver: HTTP ${response.status}.`);
    writeFileSync(archive, new Uint8Array(await response.arrayBuffer()));
  }
  assert.equal(
    sha256(readFileSync(archive)),
    solverPin.archiveSha256,
    "Pinned source archive changed.",
  );
  const reference = mkdtempSync(join(evidence, "upstream-reference-"));
  execFileSync("tar", ["-xzf", archive, "--strip-components=1", "-C", reference]);
  const hashes = requiredInputHashes(reference);
  const upstream = resolve("solver/upstream");
  if (!existsSync(upstream)) {
    mkdirSync(upstream, { recursive: true });
    execFileSync("tar", ["-xzf", archive, "--strip-components=1", "-C", upstream]);
  }
  assert.deepEqual(
    requiredInputHashes(upstream),
    hashes,
    "Pinned solver build inputs were modified.",
  );
  return hashes;
}

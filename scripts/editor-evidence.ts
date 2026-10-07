import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function sourceEvidence() {
  const files = execFileSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "src",
      "server",
      "shared",
      "scripts",
      "package.json",
      "bun.lock",
      "tsconfig.json",
      "tsconfig.server.json",
    ],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n");
  return {
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    sourceHashes: Object.fromEntries(
      files.map((path) => [path, createHash("sha256").update(readFileSync(path)).digest("hex")]),
    ),
    diffSha256: createHash("sha256")
      .update(execFileSync("git", ["diff", "HEAD"]))
      .digest("hex"),
    checkedAt: new Date().toISOString(),
    platform: process.platform,
    bun: process.versions.bun,
  };
}

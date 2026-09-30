import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url));
const run = path.join(
  root,
  "experiments/integration/runs",
  "existing-" + new Date().toISOString().replace(/[:.]/g, "-"),
);
mkdirSync(run, { recursive: true });
const results = [];
for (const [name, folder, script] of [
  ["original", "experiments/original-source-proof", "proof.ts"],
  ["mapping", "experiments/automatic-source-mapping", "proof.ts"],
  ["continuity", "experiments/automatic-source-mapping", "continuity/proof.ts"],
  ["base-ui", "experiments/base-ui-only-this", "proof.ts"],
]) {
  const out = path.join(run, name);
  mkdirSync(out);
  const cwd = name === "original" ? out : path.join(root, folder);
  const command = ["bun", path.join(root, folder, script)];
  const env = { ...process.env };
  delete env.NODE_PATH;
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = result.stdout + result.stderr;
  writeFileSync(path.join(out, "console.log"), output);
  writeFileSync(path.join(out, "exit-code.txt"), String(result.status) + "\n");
  const match = [...output.matchAll(/^RUN (.+)$/gm)].at(-1);
  if (match)
    cpSync(match[1], path.join(out, "artifacts"), {
      recursive: true,
      filter: (source) => !source.split(path.sep).includes("generated"),
    });
  const reportFile = path.join(out, "artifacts/report.json");
  let report;
  try {
    report = JSON.parse(readFileSync(reportFile, "utf8"));
  } catch {}
  results.push({
    name,
    cwd,
    command,
    exit: result.status,
    error: result.error?.message,
    results: report?.results,
  });
  console.log(name + ": exit " + result.status);
  console.log(output);
}
writeFileSync(path.join(run, "summary.json"), JSON.stringify(results, null, 2) + "\n");
console.log("INTEGRATION RUN " + run);
if (results.some((result) => result.exit !== 0)) process.exitCode = 1;

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import manifest from "../../package.json";
import provenance from "../../tools/anti-slop/provenance.json";

// Failure controls are specified independently of the rule implementations.
const controls = [
  {
    rule: "anti-slop/no-chained-type-assertions",
    valid: "export const value = 1 as const;",
    invalid: "export const value = 1 as unknown as string;",
  },
  {
    rule: "anti-slop/no-reduce-accumulator-copy",
    valid:
      "export const values = [1, 2].reduce((acc: number[], value) => { acc.push(value); return acc; }, []);",
    invalid:
      "export const values = [1, 2].reduce((acc: number[], value) => acc.concat([value]), []);",
  },
  {
    rule: "anti-slop/require-safety-comment-for-type-assertion",
    valid:
      "// SAFETY: the literal is a string and its length is checked by construction.\nexport const value = 'ready' as string;",
    invalid: "export const value = 'ready' as string;",
  },
  {
    rule: "oxc/no-accumulating-spread",
    valid:
      "export const values = [1, 2].reduce((acc: number[], value) => { acc.push(value); return acc; }, []);",
    invalid: "export const values = [1, 2].reduce((acc: number[], value) => [...acc, value], []);",
  },
  {
    rule: "eslint/max-lines-per-function",
    valid: ["export function example() {", ...Array(38).fill("  Math.random();"), "}"].join("\n"),
    invalid: ["export function example() {", ...Array(39).fill("  Math.random();"), "}"].join("\n"),
  },
];

const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
for (const [name, version] of Object.entries(dependencies)) {
  const installed = JSON.parse(readFileSync(resolve("node_modules", name, "package.json"), "utf8"));
  assert.equal(installed.version, version, `${name} must match its exact pin`);
}
assert.equal(dependencies["@oxlint/plugins"], dependencies.oxlint);

for (const file of provenance.files) {
  const content = readFileSync(resolve("tools/anti-slop", file.localPath));
  assert.equal(createHash("sha256").update(content).digest("hex"), file.sha256, file.localPath);
}

const fixtureDirectory = mkdtempSync(resolve(tmpdir(), "orc-lint-"));
try {
  for (const control of controls) {
    for (const [kind, source] of Object.entries({
      valid: control.valid,
      invalid: control.invalid,
    })) {
      const fixture = resolve(fixtureDirectory, `${kind}.ts`);
      writeFileSync(fixture, source);
      const result = spawnSync(
        process.execPath,
        ["run", "lint", "--config", resolve("oxlint.config.ts"), "--format", "json", fixture],
        { encoding: "utf8" },
      );
      assert.ifError(result.error);
      assert.equal(
        result.status,
        kind === "valid" ? 0 : 1,
        `${control.rule}: ${result.stdout}\n${result.stderr}`,
      );
      if (kind === "invalid") {
        const [plugin, rule] = control.rule.split("/");
        assert.ok(result.stdout.includes(`${plugin}(${rule})`), result.stdout);
      }
    }
  }
} finally {
  rmSync(fixtureDirectory, { recursive: true, force: true });
}

mkdirSync("artifacts/scaffold", { recursive: true });
writeFileSync(
  "artifacts/scaffold/tooling.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      dependencies,
      upstream: provenance.revision,
      verifiedRules: controls.map((control) => control.rule),
    },
    null,
    2,
  ) + "\n",
);
console.log("Tooling verification passed");

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const inventory = JSON.parse(
  readFileSync(path.join(root, "dependency-setup/inventory.json"), "utf8"),
);
const require = createRequire(path.join(root, "package.json"));
const installed = [];
for (const [name, version] of Object.entries({
  ...manifest.dependencies,
  ...manifest.devDependencies,
  ...manifest.overrides,
})) {
  const packagePath = realpathSync(path.join(root, "node_modules", name, "package.json"));
  assert(packagePath.startsWith(root + path.sep), `${name} escapes this checkout`);
  const actual = JSON.parse(readFileSync(packagePath, "utf8")).version;
  assert.equal(actual, version, `${name} version mismatch`);
  installed.push({ name, version: actual, packagePath });
}
const resolutions = [];
const cssImports = new Set();
for (const [name, occurrences] of Object.entries(inventory.imports)) {
  assert(
    name in manifest.dependencies || name in manifest.devDependencies,
    `Undeclared import: ${name}`,
  );
  for (const occurrence of occurrences) {
    const from = path.join(root, occurrence.file);
    if (occurrence.file.endsWith(".css")) {
      cssImports.add(occurrence.specifier);
      continue;
    }
    const resolved = realpathSync(createRequire(from).resolve(occurrence.specifier));
    assert(
      resolved.startsWith(path.join(root, "node_modules") + path.sep),
      `${occurrence.specifier} resolves outside root installation`,
    );
    resolutions.push({ ...occurrence, resolved });
  }
}
// These are resolution contexts, not a claim that earlier proof source is installed here.
const contexts = [
  "package.json",
  "experiments/automatic-source-mapping/runtime.tsx",
  "experiments/automatic-source-mapping/runs/check/generated/1/mount.tsx",
  "experiments/base-ui-only-this/src/components/ui/dialog.tsx",
  "experiments/base-ui-only-this/runs/check/generated/1/mount.tsx",
  "experiments/original-source-proof/artifacts/component-1.tsx",
];
const react = contexts.map((from) => {
  const local = createRequire(path.join(root, from));
  return {
    from,
    react: realpathSync(local.resolve("react")),
    jsxRuntime: realpathSync(local.resolve("react/jsx-runtime")),
    reactDom: realpathSync(local.resolve("react-dom/client")),
  };
});
for (const field of ["react", "jsxRuntime", "reactDom"])
  assert.equal(new Set(react.map((row) => row[field])).size, 1, `Multiple ${field} installations`);
assert.equal(
  realpathSync(createRequire(require.resolve("react-dom/client")).resolve("react")),
  react[0].react,
);
const { compile } = await import("@tailwindcss/node");
const cssDependencies = [];
const compiler = await compile(
  [...cssImports].map((name) => `@import ${JSON.stringify(name)};`).join("\n"),
  {
    base: root,
    onDependency(file) {
      cssDependencies.push(realpathSync(file));
    },
  },
);
assert(compiler.build(["text-xl", "animate-in"]).length > 0);
for (const file of cssDependencies)
  assert(file.startsWith(root + path.sep), `CSS dependency escapes checkout: ${file}`);
const report = {
  cssDependencies,
  installed,
  resolutions,
  react,
  scope:
    "Dependency declaration, exact versions and Node module resolution; no browser proof or source typecheck.",
  result: "PASS",
};
writeFileSync(
  path.join(root, "dependency-setup/resolution.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `PASS: ${installed.length} exact declared/override packages, ${resolutions.length} PR import contexts, one React/JSX runtime/React DOM installation across ${contexts.length} contexts.`,
);

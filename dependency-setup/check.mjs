import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, realpathSync, writeFileSync, readdirSync } from "node:fs";
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
// Source and generated-build contexts all resolve through the single root installation.
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
const { parse } = await import("@babel/parser");
const actualImports = [];
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["evidence", "runs", "node_modules"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      inspect(file);
      continue;
    }
    if (!/\.(?:mjs|tsx?)$/.test(file)) continue;
    const ast = parse(readFileSync(file, "utf8"), {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
    for (const node of ast.program.body) {
      if (node.type !== "ImportDeclaration") continue;
      const specifier = node.source.value;
      if (specifier.startsWith("node:") || specifier.startsWith(".") || specifier.startsWith("@/"))
        continue;
      const name = specifier.startsWith("@")
        ? specifier.split("/").slice(0, 2).join("/")
        : specifier.split("/")[0];
      assert(
        name in manifest.dependencies || name in manifest.devDependencies,
        `Undeclared current import ${specifier}`,
      );
      const resolved = realpathSync(createRequire(file).resolve(specifier));
      assert(resolved.startsWith(path.join(root, "node_modules") + path.sep));
      actualImports.push({ file: path.relative(root, file), specifier, resolved });
    }
  }
}
inspect(path.join(root, "experiments"));
inspect(path.join(root, "dependency-setup"));
const compilers = [
  "original-source-proof",
  "automatic-source-mapping",
  "base-ui-only-this",
  "integration",
].map((name) => ({
  experiment: name,
  package: realpathSync(
    createRequire(path.join(root, "experiments", name, "proof.ts")).resolve(
      "typescript/package.json",
    ),
  ),
  executable: realpathSync(path.join(root, "node_modules/.bin/tsc")),
}));
assert.equal(new Set(compilers.map((row) => row.package)).size, 1);
for (const row of compilers) assert(row.executable.startsWith(root + path.sep));
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
  actualImports,
  compilers,
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

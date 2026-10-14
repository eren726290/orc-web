import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { arch, platform, release, version } from "node:os";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { object, string, strings } from "../../shared/validation";
import { sourceEvidence } from "../support/editor-evidence";

const root = process.cwd();
const ts7Version = "7.0.2";
const installation = resolve("artifacts/scaffold/ts7", `compiler-${ts7Version}`);
const output = resolve(
  "artifacts/scaffold/ts7/runs",
  new Date().toISOString().replace(/[:.]/gu, "-"),
);
mkdirSync(output, { recursive: true });
const before = sourceEvidence();
const workingTree = git("status", "--porcelain=v1", "--untracked-files=all");
writeFileSync(resolve(output, "working-tree.patch"), git("diff", "HEAD"));
const untrackedFiles = git("ls-files", "--others", "--exclude-standard", "-z")
  .split("\0")
  .filter(Boolean);
for (const path of untrackedFiles) {
  const destination = resolve(output, "untracked", path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(root, path), destination);
}
const node = execFileSync("node", ["-p", "process.execPath"], { encoding: "utf8" }).trim();
let install: ReturnType<typeof installCompiler> | null = null;
let compilers: ReturnType<typeof compiler>[] = [];
let native: ReturnType<typeof nativeCompiler> | null = null;
let dependencies: ReturnType<typeof installedDependencies> = {};
let checks: ReturnType<typeof checkConfiguration>[] = [];
let scopes: ReturnType<typeof compareScope>[] = [];
let failure: string | null = null;
try {
  dependencies = installedDependencies();
  install = installCompiler();
  const required = string(object(json("package.json").devDependencies).typescript);
  assert.match(required, /^6\.\d+\.\d+$/u, "The required compiler must remain exact-pinned TS6.");
  compilers = [
    compiler("TS6", resolve("node_modules/typescript"), required),
    compiler("TS7", resolve(installation, "node_modules/typescript"), ts7Version),
  ];
  native = nativeCompiler(compilers[1]);
  checks = compilers.flatMap((entry) =>
    ["tsconfig.json", "tsconfig.server.json"].map((configuration) =>
      checkConfiguration(entry, configuration),
    ),
  );
  scopes = ["tsconfig.json", "tsconfig.server.json"].map(compareScope);
  assert.deepEqual(
    installedDependencies(),
    dependencies,
    "Installed project dependencies changed.",
  );
  assert.deepEqual(sourceEvidence().sourceHashes, before.sourceHashes, "Project source changed.");
  for (const scope of scopes)
    assert.deepEqual(
      hashes(Object.keys(scope.inputHashes)),
      scope.inputHashes,
      "Checked inputs changed.",
    );
} catch (cause) {
  failure = cause instanceof Error ? (cause.stack ?? cause.message) : String(cause);
}
const after = sourceEvidence();
const passed =
  failure === null && checks.length === 4 && checks.every((entry) => entry.check.exit === 0);
writeFileSync(
  resolve(output, "result.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      command: "bun run check:ts7",
      branch: git("branch", "--show-current").trim(),
      before,
      after,
      workingTree,
      untrackedFiles: hashes(untrackedFiles),
      patch: relative(root, resolve(output, "working-tree.patch")),
      operatingSystem: {
        platform: platform(),
        arch: arch(),
        release: release(),
        version: version(),
        distribution: platform() === "linux" ? readFileSync("/etc/os-release", "utf8") : null,
      },
      node: execute([node, "--version"]),
      install,
      compilers,
      native,
      dependencies,
      checks,
      scopes,
      failure,
      passed,
    },
    null,
    2,
  ) + "\n",
);
for (const entry of checks) {
  console.log(`${entry.compiler} ${entry.configuration}: exit ${entry.check.exit}`);
  process.stdout.write(entry.check.stdout);
  process.stderr.write(entry.check.stderr);
}
if (failure) process.stderr.write(`${failure}\n`);
console.log(`Evidence: ${relative(root, resolve(output, "result.json"))}`);
console.log(passed ? "TS7 compatibility checkpoint passed" : "TS7 compatibility checkpoint failed");
process.exitCode = passed ? 0 : 1;

function git(...args: string[]) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function json(path: string) {
  return object(JSON.parse(readFileSync(path, "utf8")));
}

function hash(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function hashes(paths: string[]) {
  return Object.fromEntries(paths.sort().map((path) => [path, hash(resolve(root, path))]));
}

function execute(argv: string[]) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(argv[0], argv.slice(1), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    argv,
    cwd: root,
    startedAt,
    finishedAt: new Date().toISOString(),
    exit: result.status ?? 1,
    signal: result.signal,
    error: result.error?.message ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function installCompiler() {
  mkdirSync(installation, { recursive: true });
  const manifest = {
    name: "orc-web-ts7-checkpoint",
    private: true,
    dependencies: { typescript: ts7Version },
  };
  writeFileSync(resolve(installation, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  const frozen = existsSync(resolve(installation, "bun.lock")) ? ["--frozen-lockfile"] : [];
  const result = execute([process.execPath, "install", "--cwd", installation, ...frozen]);
  assert.equal(result.exit, 0, `${result.stdout}\n${result.stderr}`);
  return { ...result, lockSha256: hash(resolve(installation, "bun.lock")) };
}

function packageIdentity(path: string) {
  const value = json(path);
  return {
    name: string(value.name),
    version: string(value.version),
    packageJson: path,
    sha256: hash(path),
  };
}

function compiler(label: string, directory: string, expected: string) {
  const path = resolve(directory, "package.json");
  const identity = packageIdentity(path);
  const manifest = json(path);
  assert.equal(identity.name, "typescript");
  assert.equal(identity.version, expected);
  const repository = string(object(manifest.repository).url);
  assert.match(repository, /^(?:git\+)?https:\/\/github\.com\/microsoft\/TypeScript(?:\.git)?$/u);
  const launcher = resolve(directory, string(object(manifest.bin).tsc));
  const result = execute([node, launcher, "--version"]);
  assert.equal(result.exit, 0, result.stderr);
  assert.equal(result.stdout.trim(), `Version ${expected}`);
  return {
    label,
    ...identity,
    repository,
    launcher,
    launcherSha256: hash(launcher),
    versionCheck: result,
  };
}

function nativeCompiler(entry: ReturnType<typeof compiler>) {
  const name = `@typescript/typescript-${process.platform}-${process.arch}`;
  assert.equal(object(json(entry.packageJson).optionalDependencies)[name], ts7Version);
  const path = createRequire(entry.launcher).resolve(`${name}/package.json`);
  assert.ok(
    path.startsWith(installation + sep),
    "The native package must come from the isolated installation.",
  );
  const identity = packageIdentity(path);
  assert.equal(identity.name, name);
  assert.equal(identity.version, ts7Version);
  const executable = resolve(
    dirname(path),
    "lib",
    process.platform === "win32" ? "tsc.exe" : "tsc",
  );
  const header = readFileSync(executable).subarray(0, 4).toString("hex");
  if (process.platform === "linux") assert.equal(header, "7f454c46");
  if (process.platform === "win32") assert.ok(header.startsWith("4d5a"));
  const result = execute([executable, "--version"]);
  assert.equal(result.exit, 0, result.stderr);
  assert.equal(result.stdout.trim(), `Version ${ts7Version}`);
  return {
    ...identity,
    executable,
    executableSha256: hash(executable),
    header,
    versionCheck: result,
  };
}

function installedDependencies() {
  const manifest = json("package.json");
  const entries = { ...object(manifest.dependencies), ...object(manifest.devDependencies) };
  return Object.fromEntries(
    Object.entries(entries).map(([name, expected]) => {
      const installed = packageIdentity(resolve("node_modules", name, "package.json"));
      assert.equal(installed.name, name);
      assert.equal(installed.version, expected, `Install the locked project dependency ${name}.`);
      return [name, installed];
    }),
  );
}

function checkConfiguration(entry: ReturnType<typeof compiler>, configuration: string) {
  const args = [node, entry.launcher, "--project", configuration];
  return {
    compiler: entry.label,
    configuration,
    check: execute([...args, "--noEmit", "--pretty", "false"]),
    expanded: execute([...args, "--showConfig"]),
    files: execute([...args, "--listFilesOnly"]),
  };
}

function expandedScope(entry: ReturnType<typeof checkConfiguration>) {
  assert.ok(native);
  assert.equal(entry.expanded.exit, 0, entry.expanded.stdout + entry.expanded.stderr);
  assert.equal(entry.files.exit, 0, entry.files.stdout + entry.files.stderr);
  const expanded = object(JSON.parse(entry.expanded.stdout));
  const options = object(expanded.compilerOptions);
  assert.equal(options.strict, true);
  assert.equal(options.skipLibCheck, false);
  assert.equal(options.noEmit, true);
  const paths = entry.files.stdout
    .trim()
    .split(/\r?\n/u)
    .map((path) => resolve(path));
  const libraries = [resolve("node_modules/typescript/lib"), dirname(native.executable)];
  const project = paths.filter(
    (path) => !(libraries.includes(dirname(path)) && /^lib\..*\.d\.ts$/u.test(basename(path))),
  );
  return {
    options,
    roots: strings(expanded.files)
      .map((path) => resolve(path))
      .sort(),
    inputHashes: hashes(project.map((path) => relative(root, path))),
    compilerLibraryFiles: paths.filter((path) => !project.includes(path)),
  };
}

function compareScope(configuration: string) {
  const entries = checks.filter((entry) => entry.configuration === configuration);
  assert.equal(entries.length, 2);
  const [required, candidate] = entries.map(expandedScope);
  assert.deepEqual(
    candidate.options,
    required.options,
    `${configuration}: expanded compiler settings differ.`,
  );
  assert.deepEqual(candidate.roots, required.roots, `${configuration}: root file scope differs.`);
  assert.deepEqual(
    candidate.inputHashes,
    required.inputHashes,
    `${configuration}: checked project/dependency inputs differ.`,
  );
  return {
    configuration,
    ...required,
    candidateCompilerLibraryFiles: candidate.compilerLibraryFiles,
    loadedDependencies: loadedDependencies(Object.keys(required.inputHashes)),
  };
}

function loadedDependencies(paths: string[]) {
  const packages = new Set<string>();
  for (const path of paths) {
    let directory = dirname(resolve(root, path));
    while (directory.startsWith(resolve("node_modules") + sep)) {
      const manifest = resolve(directory, "package.json");
      if (
        existsSync(manifest) &&
        typeof json(manifest).name === "string" &&
        typeof json(manifest).version === "string"
      ) {
        packages.add(manifest);
        break;
      }
      directory = dirname(directory);
    }
  }
  return Array.from(packages).sort().map(packageIdentity);
}

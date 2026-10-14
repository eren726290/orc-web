# Tooling checks

Installed package pins, vendored lint rules, and real linter enforcement checks belong here.

## TypeScript compatibility checkpoint

`check-ts7.ts` implements the separate checkpoint accepted in [the TypeScript policy](../../doc_v1/architecture/typescript-tooling.md).
TypeScript 6 remains the exact-pinned required compiler used by `check:types` and the normal build.
The optional checkpoint compares it with isolated `typescript@7.0.2` against `tsconfig.json` and `tsconfig.server.json` in the current checkout.

Use the project's Bun and Node.js prerequisites from [the root README](../../README.md#development).
From the repository root, install the existing locked project dependencies and run:

```sh
bun install --frozen-lockfile
bun run check:ts7
```

The first checkpoint run creates an exact-pinned private compiler installation in ignored `artifacts/scaffold/ts7/compiler-7.0.2/` and installs it with Bun.
Later runs use that installation's frozen lockfile.
The root dependency manifest, project lockfile and required TS6 installation are not replaced by this installation.
To rerun against current code and dependencies, use `bun run check:ts7` again.
The script's reviewed `ts7Version` constant owns the compatibility pin; changing it is an explicit tooling update.

Both compiler launchers are invoked by their explicit paths through Node.js.
The checkpoint verifies the actual package name, exact version, official repository, launcher hash and CLI version.
It also resolves the isolated platform package, verifies its name/version, checks its native executable header on Linux/Windows, hashes that executable and runs its own version command.
On Fedora x64, the native package is `@typescript/typescript-linux-x64@7.0.2`.

Each compiler runs the unchanged configurations with `--noEmit --pretty false`, followed by `--showConfig` and `--listFilesOnly` for recorded scope verification.
Expanded compiler settings, root files and hashes of checked project/dependency inputs must match between compilers.
Strict checking and dependency declaration checking remain enabled.
Each compiler's own standard-library files are recorded separately because their paths and contents belong to different compiler installations.
All configured files and imported declarations still participate in the actual checks.
The checkpoint does not import compiler APIs, transform application code or add suppressions.

Every run prints the path to a timestamped `artifacts/scaffold/ts7/runs/<timestamp>/result.json`.
The report records the tested commit/branch, source hashes before/after, working-tree status, tracked patch, copies and hashes of untracked files, OS, Bun/Node versions, actual compiler identities, installed direct and loaded dependency versions, configurations, checked files, exact command arguments, exit codes and complete stdout/stderr diagnostics.
Artifacts and isolated installations remain ignored by Git.
An installation/identity/scope failure or any compiler error makes this optional command exit nonzero; all four type checks are recorded when setup succeeds.
TS6 and TS7 can use different nonzero diagnostic exit codes, so success requires zero rather than a particular shared failure code.

Run this checkpoint after relevant dependency/type-tooling upgrades, at implementation milestones and before proposing migration.
It is separate from the required TS6 build and need not run on every local edit.
If it exposes application, dependency or broad configuration changes, report the diagnostics and proposed fix for the user's agreement before making those changes.
The [verification record](../../SCAFFOLD_VERIFICATION.md#reusable-ts7-checkpoint-2026-10-15) distinguishes current application results from the historical scaffold check.

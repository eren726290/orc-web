# TypeScript tooling and migration

## Status

Accepted V1 development policy.
TypeScript 6 is the required type checker for ORC-web V1.
TypeScript 7 has a separate compatibility checkpoint for a future migration.
The scaffold provides an exact-pinned TypeScript 6 `check:types` command.
An isolated TypeScript 7 checkpoint passed against its current source and configuration; [scaffold verification](../../SCAFFOLD_VERIFICATION.md) records the executable and result.
The commands below describe the continuing implementation contract.

## Responsibilities

TypeScript checks the editor and local-server source for type errors.
Babel and Recast parse and change supported JSX/TSX for visual editing.
Bun builds imported component candidates, and Vite is the recommended editor build tool.
The source-editing engine must not depend on TypeScript compiler APIs to discover or rewrite editable Layers.

This separation lets a future compiler migration focus on tooling, configuration, and dependency compatibility.
It does not require replacing the document model or source-binding engine.
See [System architecture](system-architecture.md) and [React source bindings](react-source-bindings.md).

## Required and compatibility checks

| Planned command | Compiler | Role |
| --- | --- | --- |
| `check:types` | Exact-pinned TypeScript 6 | Required V1 check; type errors fail the normal verification path. |
| `check:ts7` | Exact-pinned TypeScript 7 | Compatibility checkpoint; failures are reported but do not block a TS6-based V1 release. |

Both checks use the same project source, dependency tree, and shared TypeScript configuration.
They use equivalent explicit settings for file scope, strictness, target, module resolution, libraries, and ambient types.
They check without emitting application JavaScript.
Keep dependency declaration checking enabled when comparing full checks.
Do not hide incompatibilities by checking fewer files or suppressing errors in the TS7 checkpoint.

Resolve deprecated configuration options as they appear rather than maintaining separate TS6 and TS7 project configurations.
Pin and record the exact patch version used for each compiler when implementing or updating the checks.
The tested TS6 6.0.3 and TS7 7.0.2 versions are historical evidence, not automatic selections of the newest releases.

Run the TS7 checkpoint with a separate pinned compiler installation that does not replace the project's TS6 installation.
Invoke its executable explicitly so two compiler binaries cannot silently change which checker runs.
The checkpoint does not require a second permanent application dependency or a custom compiler wrapper.

## When to run the checkpoint

Run it after relevant type-tooling or dependency upgrades, at implementation milestones, and before proposing migration.
It can run on the PC or in a separate automated job.
V1 does not require running both compilers on every local edit.

Record compiler versions, configuration, checked files, dependency versions, operating system, exit code, and exact diagnostics.
Use the same source revision and installed project dependencies for a comparison.
A failing checkpoint remains a reported compatibility issue even when the required TS6 check passes.
Fix concrete causes or record the remaining migration blocker.

## Migration conditions

Promote TS7 when it passes the complete configured application type check and the development tools work on Fedora and Windows.
Check any dependency that imports TypeScript's programmatic API before changing its compiler dependency.
ORC-web's own source-editing path does not require a new TypeScript API, so API availability alone is not a migration condition for that path.

Make the switch as one focused tooling change:

1. Change the required compiler pin and `check:types` implementation to the verified TS7 version.
2. Run the required type check, normal build, and affected editor workflows on the supported platforms.
3. Once that migration is verified, retire the TS6 comparison and the now-redundant TS7 checkpoint.

If migration checks fail, keep the TS6 baseline and record the cause in the checkpoint report.
Do not broaden a compiler migration into unrelated editor or document changes.

## Existing evidence and package repair

PR5 used TS7 as its CLI checker and temporarily compared TS6 against the same configured experiment.
Both initially reported the same seven missing declaration imports from `@tailwindcss/node@4.3.3`.
A declaration-only Bun package patch made both full checks pass without disabling library checking or changing runtime files.
Choosing TS6 for V1 does not remove that repair when the same affected dependency version is used.
Reevaluate the patch when updating the dependency.

These results cover the configured integration experiment, not a complete application or Windows certification.
The original PR5 commands remain historical reproduction instructions and are not renamed by this policy.
[React source-editing validation](react-source-editing-validation.md#typescript-and-dependency-checking) records the exact evidence and scope.

## References

- [TypeScript 6 transition guidance](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
- [TypeScript 7 release and API transition](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

The TS7 release announcement describes an available native CLI and the separate programmatic API transition.
Compiler speedups depend on the project and machine; they do not establish faster ORC-web canvas rendering.

# ORC-web

ORC-web V1 is a local browser editor under development.
This checkout includes an in-progress Bun backend and React editor with recorded workflow checks.
Build and verify the Bun backend, editor workflows, saving, and exports first.
Implement MCP afterward on top of the working ORC-web V1 services.
See [implementation status](IMPLEMENTATION_STATUS.md) and the [V1 specification](doc_v1/README.md).

## Code organization

| Folder | Responsibilities |
| --- | --- |
| [src/](src/README.md) | Application shell, project interface, browser session, and editor features grouped under `editor/`. |
| [server/](server/README.md) | HTTP routes, projects and storage, commands, source preparation, background rendering, and backend types. |
| [shared/](shared/README.md) | Canonical document, commands, sessions, source serialization, and common validation. |
| [scripts/](scripts/README.md) | Workflow checks grouped by domain, runtime checks, tooling checks, and shared verification helpers. |
| [solver/](solver/README.md) | Pinned editing-time pen solver adapter and rebuild inputs. |

Keep new files with the feature or domain that owns them.
Keep styles and feature-specific helpers beside that feature.
Read each folder's README before changing it.
`src/main.tsx`, `server/start.ts`, and `scripts/dev.ts` remain the browser, backend, and development entry points.

## Development

Use Bun 1.4.2 and Node.js 22.23.2 or a compatible newer Node release for the verified toolchain.
Install the locked dependencies with `bun install --frozen-lockfile`.
Run `bun run dev` and open the printed localhost URL.
The command starts the Bun backend and Vite together and prints the editor URL.
Use `bun run build` followed by `bun run start` to serve the compiled editor from Bun.

## Pen branch checkpoint

The approved [Pen tool](doc_v1/interface/pen-tool.md) is implemented in this branch with focused development/built Chrome checks.
A disposable browser Worker keeps input responsive during the unchanged numerical solve.
The [performance record](backlog/pen-integration.md#measured-solver-blocker) retains the large-path preview latency and release policy.
Run `bun run check:pen`, `bun run check:pen-data` and `bun run check:pen-solver` for the corresponding scopes.
Run `bun run check:pen-performance` separately to retain timing observations; its token does not certify acceptable latency.
See [implementation records](plans/README.md) for the staged evidence, current-source verification and integration boundaries.

## Checks

```sh
bun run check:types
bun run lint
bun run check:tooling
bun run check:format
bun run build
bun run check:browser
bun run check:codebase
bun run check:health
bun run check:editor
bun run check:history
bun run check:bundle
bun run check:panels
bun run check:lifecycle
bun run check:saving
bun run check:rendering
bun run check:layers
bun run check:deletion
bun run check:preview
bun run check:boundaries
bun run check:atomic
bun run check:movement
bun run check:clipping
bun run check:layout
bun run check:padding
bun run check:gap
bun run check:alignment
bun run check:participation
bun run check:sizing
```

`check:browser` requires installed Google Chrome and verifies development and production-preview mounting.
Run `bun run check:ts7` for the optional isolated TS7 compatibility checkpoint, which compares both configured scopes with the required TS6 compiler and records reproducible evidence.
See [tooling instructions](scripts/tooling/README.md#typescript-compatibility-checkpoint) for installation, results and migration limits.
Set `ORC_CHROME_EXECUTABLE` to the full Chrome executable path if it is installed outside Playwright's standard Chrome location.
`check:browser:chromium` is an explicit fallback smoke check with Playwright Chromium and does not certify Chrome support.
Browser and tooling results go to ignored `artifacts/scaffold/`.
Editor checks record screenshots, traces, source hashes, and results under ignored `artifacts/editor/`.
They currently use Playwright Chromium by default; `bun run check:editor chrome` explicitly checks installed Google Chrome.
The lifecycle process check uses Linux `/proc` and does not certify Windows cleanup.
The saving fault check uses POSIX file-size limits and permissions and does not certify Windows failures.
Fallow findings require review before any removal; a finding is not automatic deletion authority.
Run `check:codebase` and `check:health` after substantial changes and before release.
`check:health` enforces the cyclomatic complexity limit in `.fallowrc.json`.
`lint` enforces its function-size limit through Oxlint's native rule, including blank lines, comments, and immediately invoked functions.
`bun run format` formats scaffold source and configuration without rewriting project documentation or vendored upstream rules.
See [scaffold verification](SCAFFOLD_VERIFICATION.md) for tested versions, results, and limitations.

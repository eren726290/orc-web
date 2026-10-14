# V1 scaffold verification

Date: 2026-10-08.
Scope: verify the existing Bun/React/Vite/Tailwind foundation and configure the agreed development checks.
The Bun backend, editor workflows, project storage, and MCP services remain the next implementation checkpoint.

## Acceptance criteria

- Direct dependencies resolve to the exact manifest pins, and a frozen-lockfile install succeeds.
- TypeScript 6 checks application source and development tooling with library checking enabled.
- The configured lint rules accept legitimate code and reject known violations.
- Fallow runs with built-in framework detection, and every reported finding receives a source-based explanation.
- Formatting and the production build pass.
- The development page and production preview mount React and load Tailwind styles without browser errors.
- Browser checks leave a JSON result and screenshots, recording the source revision and browser used.
- Report supported Chrome and Windows verification separately from a Chromium smoke check.

## Verification results

Source base: `f3b0340`, with the scaffold changes in the working tree on `master`.
No commit or push was performed for this checkpoint.
The browser evidence includes SHA-256 hashes of the actual scaffold source and configuration, including new files.

Verified environment: Fedora Linux 44 KDE, Bun 1.4.2, Node.js 22.23.2, TypeScript 6.0.3, Oxlint and `@oxlint/plugins` 1.87.0, Oxfmt 0.72.0, and Fallow 3.32.0.
All 29 direct dependencies match their exact manifest pins.
All declared direct-package Node engine ranges accept the verified Node.js 22.23.2 runtime.
The external scaffold checklist passed seven gates, including a fresh rerun of its six command checks.
The repository's existing `GATES.md` was not read or modified.

| Check | Result |
| --- | --- |
| `bun install --frozen-lockfile` | Passed without changing the lockfile. |
| `bun run check:types` | Passed with full library checking for frontend, scripts, configuration, and vendored rules. |
| `bun run lint` | Passed. |
| `bun run check:tooling` | Passed exact-pin checks, upstream file hashes, and eight CLI controls covering valid and invalid examples for four rules. |
| `bun run check:format` | Passed. |
| `bun run build` | Passed. |
| `bun run check:browser:chromium` | Passed development and production-preview mounting in headless Chromium 153.0.8010.12. |
| `bun run check:browser` | Blocked because installed Google Chrome is absent at the supplied and standard paths. |
| Codex @Browser inspection | React content, title, zero body margin, system font, Tailwind border-box reset, and no captured warnings or errors confirmed. |
| `bun run check:codebase` | Passed with 13 visible unused-dependency warnings and no error findings. |
| `fallow health --format json --quiet --explain` | Passed with no functions above configured complexity thresholds. |
| `fallow dupes --format json --quiet --explain` | No clone groups detected at the tool's default thresholds. |
| Isolated TypeScript 7.0.2 | Passed using `/tmp/orc-ts7-l6toshtb/node_modules/typescript/bin/tsc` against the same project configuration and dependencies. |

## Changes and findings

Installed exact development pins for `@oxlint/plugins` 1.87.0, Fallow 3.32.0, and `@types/node` 22.20.5.
Kept the existing application dependency pins and TypeScript 6 baseline.
Registered three selected anti-slop rules from upstream revision `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`, with license and source hashes under `tools/anti-slop/`.
Enabled native `oxc/no-accumulating-spread` alongside the custom accumulator rule and retained native Oxc and Unicorn plugins.
Fallow detected the Vite, TypeScript, Tailwind, Bun, Oxlint, Oxfmt, and Vitest conventions automatically.
Detection of a Vitest convention is not an added Vitest dependency or test framework.

The 13 unused dependencies are Babel parser, Base UI, the six CodeMirror modules, MCP server, AST types, Lucide, Motion, and Recast.
Their planned responsibilities are recorded in [the package inventory](packge_list.md), and the corresponding features are not implemented yet.
They remain installed and visible as warnings instead of being deleted or hidden by dependency-specific suppressions.
Reference assets under `design/` and `Desgin/`, and unmodified vendored rule/helper files, are excluded from Fallow application cleanup analysis.
The scan reports no unused application files or exports, unresolved imports, unlisted dependencies, or circular dependencies.
Architecture boundary and policy detectors have no configured rules; their zero counts do not establish architecture verification.

A browser smoke check reproduced a missing favicon request, and `index.html` now declares an empty data favicon so the page loads without that error.
Bun and Vite ambient declarations conflicted when loaded together, so frontend/tooling checking uses explicit Node and Vite types.
The future Bun backend needs its own ambient type scope, as tracked in [development tooling](backlog/development-tooling.md#bun-backend-type-scope).
Library checking remains enabled.

## Evidence and remaining limits

The repeatable browser command writes `artifacts/scaffold/chromium-browser.json` plus development and production-preview PNG screenshots.
The tooling command writes `artifacts/scaffold/tooling.json`.
Fallow JSON results are stored in `artifacts/scaffold/fallow-dead-code.json`, `fallow-health.json`, and `fallow-dupes.json`.
Generated artifacts are ignored by Git.

The previous session recorded `/usr/bin/google-chrome-stable`, `/opt/google/chrome/`, and Chrome 154.0.8037.57.
Current filesystem checks find neither that launcher nor `/opt/google/chrome/chrome`.
`rpm -q google-chrome-stable` reports that the package is not installed, and Playwright's Chrome-channel launch fails at the standard executable path.
The previous session's Chrome result therefore does not verify the current environment.
No system browser was installed or substituted for this check.
`bun run check:browser` uses Chrome by default and accepts `ORC_CHROME_EXECUTABLE` for a nonstandard installation path.
Chromium and Codex @Browser checks establish this frontend scaffold only.
Windows, the Bun backend, one-command combined startup, editor workflows, saving, exports, and MCP behavior remain unverified implementation work.
Shadcn/lint configuration awaits the editor tokens and component contracts in the dedicated [tooling checkpoint](backlog/development-tooling.md#shadcn-lint).

## Reusable TS7 checkpoint, 2026-10-15

This tooling checkpoint checks the expanded application at commit `032e4dfbace4c6cfa6511fddf8fc4db2ce380c73` on `master`, with the tooling/documentation changes recorded as uncommitted inputs in its report.
The original 2026-10-08 TS7 row above is historical scaffold evidence and does not verify later editor code.
That older row did not retain sufficient package identity metadata for an independent compiler-identity audit.
The reusable command now verifies the actual installed package and native binary.

Run `bun install --frozen-lockfile` followed by `bun run check:ts7` as described in the [tooling guide](scripts/tooling/README.md#typescript-compatibility-checkpoint).
The checkpoint automatically installs exact-pinned `typescript@7.0.2` in its separate ignored directory while the root required compiler remains `typescript@6.0.3`.
Both CLI launchers and the TS7 native platform executable independently report the expected versions.
The verified native package is `@typescript/typescript-linux-x64@7.0.2`, with an ELF executable and recorded package/launcher/binary hashes.
The [official package metadata](https://registry.npmjs.org/typescript/7.0.2) identifies the exact distribution being checked.
The installed launcher delegates to the verified native platform executable; both version commands and executable hashes are retained.

The current comparison passed on Fedora Linux 44 KDE x64 with Bun 1.4.2 and Node.js 22.23.2.
TS6 and TS7 each exited zero for both `tsconfig.json` and `tsconfig.server.json`, with empty diagnostic stdout/stderr.
Expanded options and configured root files match, including strict checking and `skipLibCheck: false`.
The frontend/tooling scope contains 90 root files and 397 checked project/dependency inputs; the backend scope contains 15 root files and 265 checked project/dependency inputs.
Each scope additionally checks 59 standard-library declaration files from its respective compiler installation.
The normal TS6 `check:types`, build, lint, formatting, tooling and Fallow checks pass separately.
The project dependency pins, lockfile and both TypeScript configurations remain unchanged.

The [checkpoint audit](artifacts/scaffold/ts7/verification.json) links the exact positive report, required-tooling results and [declaration failure control](artifacts/scaffold/ts7/declaration-control.json).
The reports retain commit/dirty state, OS, compiler/package identities, exact commands, exits, full diagnostics, file hashes and dependency versions.
The deliberate declaration controls fail in both configured scopes under both compilers, proving that declaration errors are surfaced.
TS6 returns 2, TS7 returns 1 and the optional checkpoint returns 1 for those controlled errors; fixture cleanup restores the original source.

No compile incompatibility was found in the current Fedora application comparison.
Migration still requires Windows verification, development-tool and affected editor checks with TS7 as the proposed required compiler, and review of dependencies that use TypeScript's programmatic API.
This compatibility checkpoint does not authorize or perform that migration.
Resume V1 application work at the wrapped Row cross-axis Height Fill boundary, first verifying its native line-sizing and parent-bound behavior against the accepted Flex contract before implementing the control.

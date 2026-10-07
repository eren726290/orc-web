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

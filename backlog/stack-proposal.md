# ORC-web implementation stack

Status: records accepted foundation choices, implementation recommendations, and validation work still required.
The accepted editor behavior is indexed in the [ORC-web V1 specification](../doc_v1/README.md).
Implementation and platform verification happen on the Fedora and Windows PC.

## Foundation choices

| Area | Choice | Status |
| --- | --- | --- |
| Local runtime and development package manager | Bun | Accepted. |
| Editor interface | React + TypeScript | Recommended foundation. |
| Required V1 type checking | TypeScript 6 CLI | Accepted; exact patch pin is recorded when implementation begins. |
| Future compiler migration | Separate pinned TypeScript 7 compatibility checkpoint | Accepted; reports compatibility without blocking the TS6 baseline. |
| Frontend development and build | Vite with the React integration | Recommended foundation. |
| Interface primitives | Base UI and selected Base UI-flavored shadcn/ui components | Accepted. |
| Editor and supported-component styling | Tailwind CSS | Accepted. |
| Icon library | Lucide | Recommended single icon library. |
| Linting and formatting | Oxlint and Oxfmt | Recommended. |
| Code window | CodeMirror 6 | Recommended. |
| Source parsing and structured edits | `@babel/parser`, Recast, and directly imported `ast-types` helpers | Validated direction for the supported Fedora source-editing subset. |
| Browser workflow checks | Bun test runner and Playwright driving supported Google Chrome | Recommended. |
| Local candidate validation and visual capture | Playwright controlling installed headless Google Chrome | Accepted runtime direction; production service still requires verification. |
| MCP transport | Streamable HTTP over plain localhost HTTP in the Bun backend | Accepted; see the connection contract. |
| MCP server SDK | `@modelcontextprotocol/server` 2.3.0, observed on 2026-10-03 | Recommended SDK direction; exact application pin and compatibility still require implementation verification. |

Bun runs the local ORC-web server and manages development packages.
An imported command or executable that explicitly requires Node must use Node for that command.
React and Vite are the lean recommended browser application foundation.
ORC-web does not need Next.js, Electron, Electron Builder, or an additional application framework.
The accepted [local rendering service](../doc_v1/architecture/system-architecture.md#local-rendering-service) makes Playwright a runtime dependency as well as a browser-testing tool.
It shares rendering code with the visible editor and uses fresh browser contexts in one reusable local Chrome process.
The accepted [runtime modes](../doc_v1/architecture/system-architecture.md#startup-and-runtime-modes) use one `bun run dev` command for Bun plus Vite during development and Bun serving the Vite-built frontend in the built application.
The [normal terminal shutdown](../doc_v1/architecture/system-architecture.md#normal-terminal-shutdown) requires explicit save completion and managed browser/process cleanup.

## Source-editing direction and evidence

The source-binding contract is accepted in [React source bindings](../doc_v1/architecture/react-source-bindings.md).
Use `@babel/parser` for JavaScript, TypeScript, JSX, and TSX parsing and Recast for structured source edits while retaining unchanged source where possible.
Declare `ast-types` directly when implementation imports its node checks and builders instead of relying on an undeclared transitive dependency.

The original twelve-check mobile proof used explicit bindings and passed again in installed Fedora Chrome.
Later PC experiments established automatic ownership for supported JSX, literal props, local imports and aliases, and keyed sample records.
They verified command-owned selection continuity, a real Base UI-flavored shadcn dialog, bounded cross-file Only this, temporary Show content, and two initially identical authored usages.
PR5 combined the experiments into one exact installation and reran the existing and affected suites.
[React source-editing validation](../doc_v1/architecture/react-source-editing-validation.md) records reviewed commits, outcomes, reproduction commands, and remaining limits.

Continue with these tools for the actual editor's supported source-editing path.
This does not certify arbitrary React recognition, arbitrary source-rewrite reconciliation, complete module copying, the whole application, or Windows.
Unsupported values use Edit source while supported controls and sibling layers remain available.
The complete editor workflow must validate these contracts through its real command engine and `.orc` storage.

## TypeScript and reproducible dependencies

TypeScript 6 is the required V1 type-checking CLI.
The separate TS7 checkpoint uses the same source, dependency tree, and shared configuration without replacing the TS6 installation.
Its failures are recorded but do not block a TS6-based release.
The [TypeScript tooling policy](../doc_v1/architecture/typescript-tooling.md) defines planned commands, checkpoint timing, and migration conditions.
Babel and Recast own source parsing and mutation; Bun builds component candidates.
Keep the source-editing engine independent of TypeScript compiler APIs.
PR5 used TS7 for its historical experiment check and temporarily compared TS6; those results do not determine the V1 baseline.
The PC comparison found the same seven missing Tailwind declaration imports with TS6 and TS7, so a compiler downgrade did not fix that failure.
PR5's reproducible Bun patch repairs only the two declaration files in `@tailwindcss/node@4.3.3`, with no runtime changes or disabled library checking.
Full checking passed for the configured integration project after that patch.
Reevaluate the patch when changing that pinned dependency; it is not an upstream fix or a permanent requirement for every future Tailwind release.

The validation record lists the exact tested versions, including React 19.3.0, Babel parser 7.29.9, Recast 0.24.0, Tailwind 4.3.3, TS7 7.0.2, Oxlint 1.86.0, and Oxfmt 0.71.0.
These are experiment pins, not a floating latest-version recommendation.
ORC-web application dependencies need one application manifest and lockfile with local resolution.
Imported projects carry their own exact dependency records under the [workspace bundle contract](../doc_v1/architecture/orc-workspace-bundle.md#managed-dependencies), with rebuildable local installations and compiled output.
Supported component rendering resolves the editor's React instance; project preparation must not introduce a conflicting second React renderer.
Do not rely on another experiment folder's compiler or dependency tree.

## Packages to add only when their work begins

| Package | Intended job | Status |
| --- | --- | --- |
| `react-zoom-pan-pinch` | Canvas viewport pan and zoom | Evaluate with a workspace interaction prototype. |
| `typebox` | Document and command schemas | Evaluate when canonical schemas are implemented. |
| `dompurify` | HTML and SVG import boundary | Evaluate against the actual import path. |
| `clsx` and `tailwind-merge` | Class composition for selected components | Add only if the selected components use them. |
| `class-variance-authority`, `cn`, and `tw-animate-css` | Helpers and styles used by the tested shadcn source | Include only when selected generated source actually requires them; do not also add unused alternative helpers. |
| `motion` | Source-authored live component animation | Add when Motion component support is implemented. |

Do not inherit Zustand, Mutative, Vitest, Electron, Electron Builder, Electron-specific build setup, a second TypeScript compiler, or packages from the original ORC merely because the desktop application used them.
The agreed TS7 compatibility checkpoint is an explicit development task and can use an isolated compiler installation.
Fallow is already installed as a CLI for codebase analysis and does not need to become a project dependency for documentation work.
shadcn supplies selected Base UI-flavored source when acquiring components; it is not a browser runtime requirement.
The tested global CLI is acquisition provenance, and the combined proof reruns committed component source without requiring that global installation.
Choose and record the CLI version when generating new source rather than installing it merely to rerun existing components.

## MCP decisions and remaining work

The MCP stack was intentionally settled last, after reviewing editor, project, import, source-binding, and export requirements; that discussion is now underway.
The [local HTTP connection workflow](../doc_v1/mcp/mcp-server.md) and [`get_context` / `get_source` responsibilities](../doc_v1/mcp/read-tools.md) are accepted.
The [SDK research](../doc_v1/mcp/sdk-and-protocol-research.md) recommends the stable TypeScript server SDK through Bun's existing backend and records the `2026-07-28` protocol findings.
No exact MCP package pin in this document is an accepted or verified ORC-web application installation.
The client SDK and Inspector are verification tools when needed, not automatic application runtime dependencies.
The remaining schemas, client compatibility checks, and tool inventory still need review and implementation proof.

## References

- [Bun](https://bun.sh/docs/), [React](https://react.dev/), and [Vite](https://vite.dev/guide/).
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter).
- [Base UI](https://base-ui.com/react/overview/about), [Number Field](https://base-ui.com/react/components/number-field), and [Combobox](https://base-ui.com/react/components/combobox).
- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) and [shadcn/ui library choices](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default).
- [CodeMirror](https://codemirror.net/).
- [Babel parser](https://babeljs.io/docs/babel-parser) and [Recast](https://github.com/benjamn/recast#usage).
- [Playwright](https://playwright.dev/).

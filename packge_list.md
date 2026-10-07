# ORC-web V1 package list

Registry snapshot: 2026-10-06.
This checkout contains documentation and reviewed experiment records; it has no application `package.json`, `bun.lock`, or installed application dependency inventory.
The tables list the V1 package direction and observed npm releases, not resolved application pins.
Exact application versions will be selected and verified during implementation, then recorded here from the application manifest and lockfile.
Use the [stack decisions](backlog/stack-proposal.md), [TypeScript policy](doc_v1/architecture/typescript-tooling.md), and [implementation status](IMPLEMENTATION_STATUS.md) alongside this inventory.

## 1. Runtime and application foundation

| Item | V1 role | Version policy |
| --- | --- | --- |
| Bun | Local application runtime, development package manager, and component bundling. | Record the exact verified runtime version when scaffolding begins. |
| Google Chrome | Visible editor and background rendering/capture through Playwright. | Record the tested browser version and platform with each verification checkpoint. |
| Node | Execute imported tools that explicitly require Node. | Match the supported tool's requirements; it does not replace Bun as the application runtime. |

## 2. Planned production dependencies

These packages have defined application responsibilities in the stack record.
Add each when its subsystem is implemented.
The registry release column reports what npm returned on the snapshot date; it does not select that version automatically.

| Package | Registry release | Application purpose and selection notes |
| --- | --- | --- |
| [react](https://registry.npmjs.org/react/latest) | 19.3.0 | Editor UI and live React components; match React DOM and preserve one compatible renderer. |
| [react-dom](https://registry.npmjs.org/react-dom/latest) | 19.3.0 | Browser mounting and rendering. |
| [@base-ui/react](https://registry.npmjs.org/@base-ui%2Freact/latest) | 1.8.0 | Interface primitives used by selected Base UI-flavored shadcn source. |
| [lucide-react](https://registry.npmjs.org/lucide-react/latest) | 1.52.0 | Recommended single application icon library. |
| [@babel/parser](https://registry.npmjs.org/@babel%2Fparser/latest) | 8.0.6 | Parse JavaScript, TypeScript, JSX, and TSX; the reviewed experiment used 7.29.9, so adopting version 8 requires checking parser/Recast compatibility. |
| [recast](https://registry.npmjs.org/recast/latest) | 0.24.0 | Structured source edits and preservation of unchanged source where possible. |
| [ast-types](https://registry.npmjs.org/ast-types/latest) | 0.16.3 | AST checks/builders when directly imported by the editing service; declare it directly in that case. |
| [playwright](https://registry.npmjs.org/playwright/latest) | 1.63.0 | Runtime Chrome candidate validation and screenshot/PDF capture; also usable in browser checks. |
| [@modelcontextprotocol/server](https://registry.npmjs.org/@modelcontextprotocol%2Fserver/latest) | 2.3.1 | MCP adapter through the existing Bun backend; earlier SDK research examined 2.3.0. |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/latest) | 4.3.3 | Tailwind v4 styling and compiler inputs; required at runtime when Bun prepares imported Tailwind designs. |

The Tailwind backend loader/integration is still an implementation choice.
If it directly uses the tested [@tailwindcss/node](https://registry.npmjs.org/@tailwindcss%2Fnode/latest) loader, declare that package as a runtime dependency too; its observed release is 4.3.3.
The reviewed PR5 installation required a declaration-only patch for `@tailwindcss/node@4.3.3`; preserve or reevaluate that repair when selecting the application compiler dependencies.
See the [recorded diagnosis](doc_v1/architecture/react-source-editing-validation.md#typescript-and-dependency-checking).

## 3. Code window dependencies

CodeMirror 6 is the recommended editor.
The following is a proposed direct module set for the agreed Code scopes; final direct dependencies follow the modules actually imported by the implementation.

| Package | Registry release | Purpose |
| --- | --- | --- |
| [@codemirror/state](https://registry.npmjs.org/@codemirror%2Fstate/latest) | 6.7.6 | Code editor state and transactions. |
| [@codemirror/view](https://registry.npmjs.org/@codemirror%2Fview/latest) | 6.43.13 | Browser editor view. |
| [@codemirror/commands](https://registry.npmjs.org/@codemirror%2Fcommands/latest) | 6.11.1 | Editor commands and typing history. |
| [@codemirror/lang-javascript](https://registry.npmjs.org/@codemirror%2Flang-javascript/latest) | 6.2.5 | JavaScript/TypeScript and JSX/TSX language support. |
| [@codemirror/lang-css](https://registry.npmjs.org/@codemirror%2Flang-css/latest) | 6.3.1 | CSS language support. |
| [@codemirror/lang-html](https://registry.npmjs.org/@codemirror%2Flang-html/latest) | 6.4.12 | HTML language support. |

These are application browser dependencies when the Code window is implemented.
Additional editor extensions need a concrete feature or direct import before entering the inventory.

## 4. Planned development dependencies

| Package | Registry release | Purpose and selection notes |
| --- | --- | --- |
| [typescript](https://registry.npmjs.org/typescript) | 6.0.3, latest stable 6.x observed | Required V1 type checking; the registry's overall latest is 7.0.2, while the accepted V1 baseline remains TS6. |
| [vite](https://registry.npmjs.org/vite/latest) | 8.3.3 | Frontend development server and production build. |
| [@vitejs/plugin-react](https://registry.npmjs.org/@vitejs%2Fplugin-react/latest) | 6.1.2 | React integration for Vite. |
| [@tailwindcss/vite](https://registry.npmjs.org/@tailwindcss%2Fvite/latest) | 4.3.3 | Tailwind integration for the editor frontend build. |
| [oxlint](https://registry.npmjs.org/oxlint/latest) | 1.87.0 | TypeScript/React linting. |
| [oxfmt](https://registry.npmjs.org/oxfmt/latest) | 0.72.0 | Source formatting. |
| [@types/bun](https://registry.npmjs.org/@types%2Fbun/latest) | 1.4.2 | Bun runtime type declarations. |
| [@types/react](https://registry.npmjs.org/@types%2Freact/latest) | 19.3.0 | React type declarations. |
| [@types/react-dom](https://registry.npmjs.org/@types%2Freact-dom/latest) | 19.3.0 | React DOM type declarations. |

Use Bun's test runner for application logic and Playwright for browser workflows.
During interactive development in the Codex desktop app, the agent can use its built-in [@Browser](https://learn.chatgpt.com/docs/browser) for focused local UI checks and DOM/style inspection.
Codex provides @Browser; it is not an ORC-web package dependency.
The [@playwright/test](https://registry.npmjs.org/@playwright%2Ftest/latest) runner, observed at 1.63.0, is optional if the implemented browser suite uses it; it is not an automatic additional dependency.
Declare `@types/node` directly if the selected Node tooling/type setup requires it, and choose a version matching that setup rather than automatically taking the newest Node type major.
Run the agreed TS7 compatibility checkpoint through a separate exact-pinned compiler installation, following the [migration policy](doc_v1/architecture/typescript-tooling.md#required-and-compatibility-checks).

## 5. Conditional packages

This section distinguishes accepted V1 feature support, undecided implementation packages, and helpers required by selected source.
Add packages when their implemented responsibilities require them.

### Accepted V1 Motion support

Motion is an accepted part of V1's React design stack under the [Motion contract](doc_v1/interface/motion.md).
It is a planned package for that support; V1's animation support is already agreed.
Declare it in application dependencies when ORC's implementation imports it, and retain it in a design's exact dependency records when that design imports it.

| Package | Registry release | Purpose and installation timing |
| --- | --- | --- |
| [motion](https://registry.npmjs.org/motion/latest) | 14.0.0 | Accepted source-authored React animation support; add when implementing Motion support or preparing a design that requires it. The reviewed experiment used 13.4.4. |

### Implementation candidates

These specific package choices still need evaluation under the [stack record](backlog/stack-proposal.md#packages-to-add-only-when-their-work-begins).
The underlying V1 responsibilities, such as canvas pan/zoom, schema validation, and HTML/SVG import handling, remain required by their feature contracts.

| Package | Registry release | Add when |
| --- | --- | --- |
| [react-zoom-pan-pinch](https://registry.npmjs.org/react-zoom-pan-pinch/latest) | 4.2.0 | A workspace prototype establishes it as the chosen pan/zoom implementation. |
| [typebox](https://registry.npmjs.org/typebox/latest) | 1.3.36 | Selected as the document/command schema authority. |
| [dompurify](https://registry.npmjs.org/dompurify/latest) | 3.4.16 | The actual HTML/SVG import boundary requires it. |

### Helpers required by selected source

Install these only when selected editor components or imported design source actually require them.
Their presence in the inventory does not require every component or design to use them.

| Package | Registry release | Add when |
| --- | --- | --- |
| [clsx](https://registry.npmjs.org/clsx/latest) | 2.1.1 | Selected interface source imports it. |
| [tailwind-merge](https://registry.npmjs.org/tailwind-merge/latest) | 3.7.0 | Selected interface source requires Tailwind class conflict resolution. |
| [class-variance-authority](https://registry.npmjs.org/class-variance-authority/latest) | 0.7.1 | Selected generated components use its variant API. |
| [cn](https://registry.npmjs.org/cn/latest) | 0.4.0 | Selected source actually imports this package; a local `cn` helper does not itself require installing it. |
| [tw-animate-css](https://registry.npmjs.org/tw-animate-css/latest) | 1.4.0 | Selected component styles require it. |

For imported designs, record required packages in that design's exact dependency records under the [workspace bundle contract](doc_v1/architecture/orc-workspace-bundle.md#managed-dependencies).
Libraries such as `@paper-design/shaders-react` and `shaders` belong to the designs that use them; these shader compatibility discussions do not add them to ORC-web's application dependency baseline.

## 6. Acquisition and verification tools

| Tool | Registry release, when checked | Role |
| --- | --- | --- |
| [shadcn](https://registry.npmjs.org/shadcn/latest) | 4.21.3 | Acquire selected Base UI-flavored component source; record the CLI version used for generation. |
| Fallow CLI | Not checked in this snapshot | Existing codebase analysis tool; the stack record does not require a new application dependency. |
| [@modelcontextprotocol/client](https://registry.npmjs.org/@modelcontextprotocol%2Fclient/latest) | 2.3.1 | Optional MCP integration verification client. |
| [@modelcontextprotocol/inspector](https://registry.npmjs.org/@modelcontextprotocol%2Finspector/latest) | 2.9.0 | Optional MCP inspection tool. |

Registry observations do not establish that these tools are installed on this machine or the PC.
Research/browser utilities used by agents are separate from the application's dependency manifest.

## 7. Configuration and verification status

Application package classification, exact pins, scripts, and lockfile are not created in this checkout yet.
The planned required checker is TS6; Oxlint/Oxfmt, Vite/React, Tailwind, and Bun configuration will be recorded from the actual application setup.
The [PR1–5 validation record](doc_v1/architecture/react-source-editing-validation.md) contains the tested experiment versions and results.
Its passing checks do not establish that every registry release listed here works together.

When the application is scaffolded, replace proposed selections with actual direct dependency pins and record the installed Bun/Node/Chrome versions where relevant.
Update this file from the manifest and lockfile when dependencies change, linking affected verification results through [implementation status](IMPLEMENTATION_STATUS.md).
Keep required application packages, conditional design packages, development tools, and globally installed utilities distinguishable.

## 8. Packages not inherited from Electron ORC

The accepted stack does not automatically carry over Electron, Electron Builder, Electron-specific esbuild setup, Zustand, Mutative, Vitest, or a permanent second TypeScript compiler dependency.
It also does not introduce Next.js or another application framework alongside the recommended React/Vite foundation.
Future additions require a concrete application responsibility and an updated inventory.

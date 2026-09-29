# ORC-web implementation stack

Status: records accepted foundation choices, implementation recommendations, and validation work still required.
The accepted editor behavior is indexed in the [ORC-web V1 specification](../doc_v1/README.md).
Implementation and platform verification happen on the Fedora and Windows PC.

## Foundation choices

| Area | Choice | Status |
| --- | --- | --- |
| Local runtime and development package manager | Bun | Accepted. |
| Editor interface | React + TypeScript | Recommended foundation. |
| Frontend development and build | Vite with the React integration | Recommended foundation. |
| Interface primitives | Base UI and selected Base UI-flavored shadcn/ui components | Accepted. |
| Editor and supported-component styling | Tailwind CSS | Accepted. |
| Icon library | Lucide | Recommended single icon library. |
| Linting and formatting | Oxlint and Oxfmt | Recommended. |
| Code window | CodeMirror 6 | Recommended. |
| Browser workflow checks | Bun test runner and Playwright driving supported Google Chrome | Recommended. |

Bun runs the local ORC-web server and manages development packages.
An imported command or executable that explicitly requires Node must use Node for that command.
React and Vite are the lean recommended browser application foundation.
ORC-web does not need Next.js, Electron, Electron Builder, or an additional application framework.

## Source-editing candidate

The source-binding contract is accepted in [React source bindings](../doc_v1/architecture/react-source-bindings.md).
The current source-editing candidates are `@babel/parser` for JavaScript, TypeScript, JSX, and TSX parsing and Recast for structured source edits while retaining unchanged source where possible.

An isolated proof passed all twelve defined checks on Debian ARM64 using Bun 1.3.14 and Playwright Chromium 153.0.8010.12.
It covered per-instance text, shared Tailwind typography, Only this, Undo, local collection data, rejected candidate crashes, and save or reopen.
The proof used explicitly authored source bindings.
It did not prove automatic recognition of arbitrary React applications, cross-file resolution, computed expressions, Fedora Chrome, or Windows Chrome.
The exact result and Fedora verification task are in [React source-editing validation](../doc_v1/architecture/react-source-editing-validation.md).

The proof supports the candidates.
It does not select those packages for production until the Fedora Chrome check passes and implementation validates the real binding resolver.

## Packages to add only when their work begins

| Package | Intended job | Status |
| --- | --- | --- |
| `react-zoom-pan-pinch` | Canvas viewport pan and zoom | Evaluate with a workspace interaction prototype. |
| `typebox` | Document and command schemas | Evaluate when canonical schemas are implemented. |
| `dompurify` | HTML and SVG import boundary | Evaluate against the actual import path. |
| `clsx` and `tailwind-merge` | Class composition for selected components | Add only if the selected components use them. |
| `motion` | Source-authored live component animation | Add when Motion component support is implemented. |

Do not inherit Zustand, Mutative, Vitest, Electron, Electron Builder, Electron-specific build setup, a second TypeScript compiler, or packages from the original ORC merely because the desktop application used them.
Fallow is already installed as a CLI for codebase analysis and does not need to become a project dependency for documentation work.

## Deliberately deferred

MCP protocol, server, SDK, transports, and tool dependencies are intentionally settled last.
The editor, project, import, source-binding, and export requirements determine that design.
No MCP package choice in this document is an accepted ORC-web decision.

## References

- [Bun](https://bun.sh/docs/), [React](https://react.dev/), and [Vite](https://vite.dev/guide/).
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter).
- [Base UI](https://base-ui.com/react/overview/about), [Number Field](https://base-ui.com/react/components/number-field), and [Combobox](https://base-ui.com/react/components/combobox).
- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) and [shadcn/ui library choices](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default).
- [CodeMirror](https://codemirror.net/).
- [Babel parser](https://babeljs.io/docs/babel-parser) and [Recast](https://github.com/benjamn/recast#usage).
- [Playwright](https://playwright.dev/).

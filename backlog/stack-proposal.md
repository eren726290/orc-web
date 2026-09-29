# ORC-web stack proposal

Status: options for discussion, not an agreed implementation stack.
The accepted editor behavior is indexed in the [ORC-web V1 specification](../doc_v1/README.md).
Implementation and platform verification will happen on the PC.

## Candidates

| Area | Candidate | Status |
| --- | --- | --- |
| Editor interface | React + TypeScript | Proposal; not explicitly selected for ORC-web. |
| Development and build | Vite | Proposal. |
| Local server and package manager | Bun | Leading candidate; Node.js LTS remains an option until imports and CLI workflows are checked. |
| Linting and formatting | Oxlint + Oxfmt | Matches the user's current ORC tooling preference; ORC-web adoption and exact versions are not confirmed. |
| Interface primitives | Base UI + Tailwind CSS, with selected Base UI-flavored shadcn/ui components | Accepted V1 component-recognition direction; Radix import paths are excluded from editable-component support. |
| Code window | CodeMirror 6 | Proposal. |
| MCP implementation | `@modelcontextprotocol/server` stable v2 | Recommended SDK line; exact package version and local transports remain undecided. |
| Checks | TypeScript check, Vitest, and Playwright | Proposal; verification must cover Fedora 44 KDE Plasma and Windows 11. |

Vite remains a proposed frontend build tool even if Bun serves as the local runtime.
Using Bun for ORC-web development does not determine which package-manager behavior ORC-web offers to its users.
The current recommendation is a local Streamable HTTP MCP endpoint, with stdio only where an agent client requires it.
The latest official MCP TypeScript SDK documentation describes stable v2 and lists Node.js, Bun, and Deno support.
Resolve and verify the latest stable package patch when implementation begins.

## References

- [React](https://react.dev/) and [Vite](https://vite.dev/guide/).
- [Bun installation](https://bun.sh/docs/installation), [Node.js compatibility](https://bun.sh/docs/runtime/nodejs-compat), and [bunx runtime selection](https://bun.sh/docs/pm/bunx#shebangs).
- [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter).
- [Base UI](https://base-ui.com/react/overview/about), [Number Field](https://base-ui.com/react/components/number-field), and [Combobox](https://base-ui.com/react/components/combobox).
- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) and [shadcn/ui library choices](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default).
- [CodeMirror](https://codemirror.net/).
- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) and the [MCP transport overview](https://modelcontextprotocol.io/specification/latest/basic/transports).
- [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/).

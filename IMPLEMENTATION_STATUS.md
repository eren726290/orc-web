# ORC-web implementation status

Last updated: 2026-10-07.
Current stage: the initial Bun, React, Vite, and Tailwind application scaffold is installed and builds; editor implementation has not started.
This overview describes this checkout and links to reviewed evidence from the PC experiments.

## Current state

| Area | Implementation status | Evidence or contract |
| --- | --- | --- |
| Application foundation and startup | Implemented initial scaffold with a Bun lockfile, React/Vite/Tailwind entry point, and development, type-check, lint, format, and build scripts. | [`package.json`](package.json), [`bun.lock`](bun.lock), [stack choices](backlog/stack-proposal.md). |
| Editor workspace, Layers, Properties, Tokens, and Code | Not started as a complete application. | [Specification index](doc_v1/README.md#product-map). |
| Shared commands, application Undo/Redo, and project saving | Not started as production services. | [Command engine](doc_v1/architecture/command-engine-and-history.md), [workspace bundle](doc_v1/architecture/orc-workspace-bundle.md). |
| Ordinary HTML/CSS authoring | Not started as an application workflow. | [insert_html](doc_v1/mcp/tools/insert_html.md). |
| React source editing and component preparation | Production integration not started; bounded experiments passed in Fedora Chrome. | [Reviewed source-editing evidence](doc_v1/architecture/react-source-editing-validation.md#evidence-by-pr). |
| MCP server and tools | Not started; 28 tool responsibilities and core JSON contracts are documented. | [MCP status](doc_v1/mcp/mcp-server.md#status), [tool index](doc_v1/mcp/tools/README.md). |
| Background Chrome validation, screenshots, and exports | Production services not started. | [Local rendering service](doc_v1/architecture/system-architecture.md#local-rendering-service), [export contract](doc_v1/import-export/export.md). |
| Complete application on Fedora and Windows | No complete application verification result yet. | [Browser support and verification](doc_v1/architecture/browser-support.md). |

## Verified experiments

The reviewed PR1–5 reports establish bounded source ownership, selection continuity, a real Base UI-flavored shadcn composition, supported Only this copying, rejection controls, and saved-source reproduction on Fedora Google Chrome.
The latest reviewed PR5 commit is `7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc`.
The [validation record](doc_v1/architecture/react-source-editing-validation.md) links immutable reports, tested versions, commands, corrected failures, and remaining limits.
These results apply to those experiments; full editor integration and Windows checks have no recorded passing result.

## Current open work

Application implementation is the immediate work; the initial scaffold's type check, lint, and production build do not verify editor workflows or runtime services.
The scaffold records exact direct dependency pins and startup configuration under the [stack record](backlog/stack-proposal.md).
Detailed tool value grammars, resource-transfer fields, and SDK integration are tracked in the [MCP implementation backlog](backlog/mcp/command-contracts.md).
Resolve those details when implementing the corresponding services.
Record a blocker here when an actual failure prevents the next checkpoint, with a link to its diagnosis.

## Next checkpoint

1. Implement the Bun backend and the agreed editor panel layout on the established React/Vite foundation.
2. Complete the first editing workflow with ordinary HTML/CSS content and one React component: nested selection, Properties edits, reflected source, application Undo/Redo, and save/reopen.
3. Expose working shared services through their agreed MCP tools and verify actual calls.

## Maintaining this overview

Use **Not started**, **In progress**, **Implemented**, or **Verified** for application features.
Implemented means application code exists; Verified means the stated workflow passed recorded checks at an identified commit and platform.
Keep experimental results explicitly scoped to their experiment.
Update rows when a meaningful checkpoint changes and link the supporting report, tested commit, platform, commands, results, and limitations.
Keep detailed logs in their reports and deferred features in their dedicated backlog files.
[GATES.md](GATES.md) tracks documentation coverage and static checks; its checked documentation gates do not certify application behavior.

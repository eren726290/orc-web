# System architecture

## Status

Proposed architecture based on accepted editor behavior.
The edit/save separation, local Chrome rendering service, and portable dependency-record responsibilities below are accepted V1 decisions; their production implementation is not yet verified.
The development/built-application split and normal terminal shutdown below are also accepted; launch scripts and platform behavior remain to be implemented.
Bun is accepted as the local application runtime and development package manager.
React with TypeScript and Vite is the recommended browser foundation; the [stack record](../../backlog/stack-proposal.md) distinguishes accepted and recommended packages.
TypeScript 6 is the required V1 checker, with a separate TypeScript 7 migration checkpoint defined in [TypeScript tooling](typescript-tooling.md).
The [local MCP transport and connection workflow](../mcp/mcp-server.md) and [context/source read responsibilities](../mcp/read-tools.md) are accepted.
Exact production schemas, service interfaces, SDK pins, and the remaining MCP tool inventory remain implementation decisions.

## Goal

ORC-web is a browser editor with a local project server.
The browser provides the visible editor.
The local server provides project files, canonical document commands, autosave, exports, component import work, and MCP access.

## Process model

```text
Browser editor ──HTTP or WebSocket──▶ local ORC-web server
                                        │
                                        ├── command engine
                                        ├── document and Undo history
                                        ├── .orc workspace bundle
                                        ├── component import and export services
                                        ├── local Chrome rendering service
                                        └── MCP server endpoint
                                                ▲
                                                │
                                           agent client
```

The local server owns authoritative applied state and Undo history for each open project session and serializes completed commands.
One project is active at a time, selected through the browser's [horizontal project tabs](../interface/workspace-and-canvas.md#project-tabs-and-dashboard).
Inactive open projects retain their state and history, and their pending saves continue against their own bundles under the [project-session contract](orc-workspace-bundle.md#starting-and-opening-projects).
Completed edits update that active project and Undo history before disk autosave finishes, following [Command engine and history](command-engine-and-history.md#command-lifecycle).
The [workspace bundle](orc-workspace-bundle.md#managed-dependencies) separates portable component dependency records from rebuildable installations and output.
The browser owns temporary view state such as zoom, open panels, hover, and drag previews, retaining applicable view state separately for each open project.
The browser does not save a second authoritative copy of the document.
MCP calls and human edits reach the same command engine.
MCP operates on the active project; project switching does not retarget an already addressed command to another project's state.
Agents connect through Streamable HTTP at the Bun backend's plain localhost `/mcp` endpoint.
The browser opens the normal editor address; `/mcp` is the agent endpoint, not the editor page.
The [MCP server contract](../mcp/mcp-server.md#browser-agent-and-server-lifetime) defines continued access between tasks and when the editor tab, agent, or backend closes.

## Startup and runtime modes

During development, `bun run dev` starts the Bun application backend and Vite frontend development server together.
The person opens one localhost address served by Vite, which forwards application backend requests to Bun.
Two server processes run underneath that single browser entry point.
Vite owns frontend development and refresh; Bun owns project state, commands, package preparation, saving, and the local rendering service.
Both processes use the same application contracts as the built version.

For the built application, Vite produces the editor's frontend files and Bun serves those files together with the application backend.
The normal built-app session does not require the Vite development server.
The launch script prints the local URL to open in Chrome.
Exact ports, built-app command names, and cross-platform process orchestration remain implementation details.
These are planned runtime commands; this documentation checkout does not provide application scripts yet.

The development and production separation follows [Vite backend integration](https://vite.dev/guide/backend-integration) and its [development proxy support](https://vite.dev/config/server-options#server-proxy).
Bun supplies the local HTTP server and file responses through its [HTTP server APIs](https://bun.sh/docs/runtime/http/server).

## Normal terminal shutdown

The person finishes editing, saves each Untitled project if needed, confirms the open projects' applied changes are written through contextual save feedback, and stops the local server from the terminal with Ctrl+C.
V1 keeps this terminal workflow without a separate Stop ORC-web control in the editor.

ORC-web must implement the shutdown handler explicitly.
It stops accepting new work, finishes pending saves for all open projects, closes the managed Chrome browser, stops the development Vite process when present, and releases the open writable project sessions before exiting.
Bun's graceful HTTP server stop waits for active requests; ORC-web must also await its own save work and perform browser/process cleanup.
A failed write does not count as a completed save and must leave unsaved applied work available through the existing [save recovery](orc-workspace-bundle.md#autosave) flow.
Shutdown does not apply or persist unfinished Code drafts.

Verify one-command development startup, built-app startup, the single browser address, normal shutdown, pending-save completion, failed-save recovery, and managed process cleanup on Fedora and Windows.
Documentation research does not establish that these application paths already work.

## Rendering and source ownership

Ordinary frames, HTML/CSS elements, text, images, and SVG use the canonical design model and browser rendering.
Supported React components keep authored source and instance inputs authoritative, with source bindings exposing editable contents to Layers and Properties.
Tailwind compiles supported authored classes into CSS; Motion behavior stays in React source.
Investigating React mapping does not replace the ordinary HTML/CSS and SVG editing workflow.

The source-editing service parses and changes supported owners with Babel and Recast, then prepares candidate source and styles for validation before commit.
That service does not depend on TypeScript compiler APIs; type checking is a separate development responsibility.
It uses the existing shared command engine rather than maintaining another editable DOM or style document.
[React source bindings](react-source-bindings.md) defines ownership and identity rules, and [React source-editing validation](react-source-editing-validation.md) records the Fedora findings.
Those experiments support implementation of this architecture; they are not the completed local project service or editor.

## Authority boundaries

| Owner | Responsibilities |
| --- | --- |
| Browser editor | Canvas rendering, Layers, Properties, Tokens, Code window, selection, viewport, Edit mode, Preview mode, and temporary gesture feedback. |
| Command engine | Validation, completed mutations, revisions, Undo, Redo, invariant checking, and changed-document publication. |
| Local project service | Open project sessions, active-project switching, saving `.orc` bundles, managed assets, imported component records, package inspection, package execution, and exports. |
| Local rendering service | Initial candidate rendering and visual export capture in background Chrome, using the shared renderer and prepared styles. |
| MCP adapter | MCP protocol handling and translation into documented command inputs. |
| Imported component | Live rendering inside the workspace through its declared component contract. |

## Direct component rendering

Imported React components render directly in the editor page.
V1 does not use iframe or worker sandboxing around imported React components.
Selected-frame Preview uses the same localhost, browser tab, and live rendering path as Edit, under the [canvas Preview contract](../interface/workspace-and-canvas.md#selected-frame-workflow).
The browser owns its temporary session state; Preview does not introduce another project service or editable source authority.
This keeps component behavior and browser rendering straightforward, but imported code is part of the local project trust boundary.
The importer must reject a component when its required runtime capability is unsupported.

## Browser measurements

The browser is the source of actual DOM and CSS layout measurements.
The server owns committed document values and requests browser measurement only when a command needs it.
Visual exports use the local rendering service below.
The server must not invent browser-computed layout from the saved model alone.

## Local rendering service

Bun prepares candidate source and required styles, then the server uses Playwright to run installed Google Chrome headlessly.
The service renders candidate code before the command engine accepts it and captures image/PDF output from an explicit committed revision.
It uses the same rendering code, supported inputs, style preparation, and design boundaries as the visible editor.
HTML/CSS, SVG, supported React, Tailwind, and Motion retain their existing rendering contracts.
The service does not keep a second editable project or make its temporary render state canonical.

The server reuses one background Chrome process and gives each candidate check or capture a fresh non-persistent browser context.
It closes that context after the operation and closes the managed browser when the local server stops.
Validation and visual exports can run while the editor tab is closed, provided the local server has an active project and the required renderer is available.
Missing Chrome, failed preparation, a browser failure, or a candidate that cannot complete its required initial render returns a recoverable failure.
Candidate failure leaves the active project, revision, and Undo history unchanged; a failed export leaves its destination unchanged.

The check establishes the supported initial render, not correctness of every later interaction.
Later component errors follow the [runtime repair contract](../interface/code-window.md#runtime-component-errors).
Temporary canvas dragging and scrubbing continue in the visible browser; background work validates completed source candidates and performs visual captures.
Code exports read applied source and dependency records without requiring a visual capture.
Live Edit and Preview components continue to render directly in the editor page under the existing unsandboxed policy.

Playwright is an application runtime dependency for this service as well as a browser-testing tool.
Exact package pins, render-completion detection, operation deadlines, and unavailable-renderer recovery remain implementation details.
Verify the service on Fedora and Windows, including closed-tab operation, rejected candidates, shared styles, process cleanup, and capture without document mutation.
The existing source-editing experiments do not establish this complete service.
See [Playwright browser channels](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge) and [browser contexts](https://playwright.dev/docs/api/class-browsercontext) for the underlying browser controls.

## Local-only operation

V1 runs on the local machine through localhost.
It does not require a cloud account, remote database, or hosted project service.
Remote collaboration and public network hosting are outside the V1 specification.

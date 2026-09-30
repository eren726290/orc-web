# System architecture

## Status

Proposed architecture based on accepted editor behavior.
Bun is accepted as the local application runtime and development package manager.
React with TypeScript and Vite is the recommended browser foundation; the [stack record](../../backlog/stack-proposal.md) distinguishes accepted and recommended packages.
TypeScript 6 is the required V1 checker, with a separate TypeScript 7 migration checkpoint defined in [TypeScript tooling](typescript-tooling.md).
Exact production schemas, service interfaces, and the complete MCP stack remain implementation decisions.

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
                                        └── MCP server endpoint
                                                ▲
                                                │
                                           agent client
```

The local server owns one authoritative active project and serializes its completed commands.
The browser owns temporary view state such as zoom, open panels, hover, and drag previews.
The browser does not save a second authoritative copy of the document.
MCP calls and human edits reach the same command engine.

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
| Local project service | Opening and saving `.orc` bundles, managed assets, imported component records, package inspection, package execution, and exports. |
| MCP adapter | MCP protocol handling and translation into documented command inputs. |
| Imported component | Live rendering inside the workspace through its declared component contract. |

## Direct component rendering

Imported React components render directly in the editor page.
V1 does not use iframe or worker sandboxing around imported React components.
This keeps component behavior and browser rendering straightforward, but imported code is part of the local project trust boundary.
The importer must reject a component when its required runtime capability is unsupported.

## Browser measurements

The browser is the source of actual DOM and CSS layout measurements.
The server owns committed document values and requests browser measurement only when a command needs it.
Export rendering also uses a browser-capable renderer.
The server must not invent browser-computed layout from the saved model alone.

## Local-only operation

V1 runs on the local machine through localhost.
It does not require a cloud account, remote database, or hosted project service.
Remote collaboration and public network hosting are outside the V1 specification.

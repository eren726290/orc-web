# MCP server

## Status

Provisional MCP server reference retained for the final MCP discussion.
The historical proposals below are superseded where the [active MCP server contract](../../doc_v1/mcp/mcp-server.md) now records accepted localhost HTTP, connection lifetime, and agent/designer turns.
The [read-tool contract](../../doc_v1/mcp/read-tools.md) owns accepted context/source responsibilities; SDK recommendations are in the [research record](../../doc_v1/mcp/sdk-and-protocol-research.md).
Exact package pins, protocol adoption, schemas, and the complete tool inventory remain unsettled.
The accepted agent workflow continues to use fresh applied-state reads and the shared application command engine.
Authoritative application responsibilities remain in [System architecture](../../doc_v1/architecture/system-architecture.md) and [Command engine and history](../../doc_v1/architecture/command-engine-and-history.md).

## Purpose

ORC-web exposes its active local project to AI agents through Model Context Protocol.
Agents can inspect a project, create or change design state, validate results, and export output through documented tools.
Agent changes use the same canonical commands and Undo history as human changes.

## SDK and protocol target

The earlier draft proposed the stable v2 line of the official TypeScript MCP server SDK through `@modelcontextprotocol/server`.
Reevaluate that proposal during the final MCP discussion before choosing and pinning an SDK, package, or protocol target.

The earlier transport proposal was Streamable HTTP on the local ORC-web server.
Stdio may be added when an agent host needs to launch a local adapter process.
The selected transport does not change tool names, inputs, results, or document semantics.

## Local relationship

```text
Agent host → MCP client → ORC-web MCP endpoint → command engine → open project
Browser editor ────────────────────────────────────────────────┘
```

The MCP endpoint does not maintain a second document model.
It translates MCP input into the same documented commands used by the browser editor.
The command engine validates and serializes completed mutations, commits the active project and revision, records Undo, and publishes updates to the browser.
Disk autosave follows the [shared command lifecycle](../../doc_v1/architecture/command-engine-and-history.md#command-lifecycle); a successful mutation does not mean its disk write has finished.

## Public tool boundary

The earlier draft lists 39 candidate public tools in [Tool catalog](tool-catalog.md).
Its 15 inspection tools, 23 create or mutation tools, and one export tool are reference candidates rather than a finalized V1 inventory.
Browser-only interaction helpers may exist internally, but they are not automatically exposed to agents.

Tools use stable document, node, token, asset, component, and source-backed editor-layer IDs.
They do not accept arbitrary raw patches to the document.
Every agent mutation provides an expected revision and receives the committed revision or a revision conflict.

## Browser-dependent operations

The server owns applied design state, including completed edits awaiting disk save.
Operations that need actual browser layout or an image require an available browser renderer.
Candidate source checks and visual exports use the [local rendering service](../../doc_v1/architecture/system-architecture.md#local-rendering-service), which can operate while the editor tab is closed.
The server reports that dependency clearly instead of guessing computed styles, text measurements, or pixels.

## Scope outside V1

Remote MCP hosting, cloud project access, multi-user collaboration, and public network access are outside V1.

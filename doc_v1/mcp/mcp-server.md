# MCP server

## Status

Accepted MCP-first product direction with proposed local server details.

## Purpose

ORC-web exposes its active local project to AI agents through Model Context Protocol.
Agents can inspect a project, create or change design state, validate results, and export output through documented tools.
Agent changes use the same canonical commands and Undo history as human changes.

## SDK and protocol target

ORC-web targets the stable v2 line of the official TypeScript MCP server SDK.
At implementation time, resolve and pin the current stable `@modelcontextprotocol/server` release rather than copying a version from this document.
The server must support the current MCP specification implemented by that SDK.

The initial recommended transport is Streamable HTTP on the local ORC-web server.
Stdio may be added when an agent host needs to launch a local adapter process.
The selected transport does not change tool names, inputs, results, or document semantics.

## Local relationship

```text
Agent host → MCP client → ORC-web MCP endpoint → command engine → open project
Browser editor ────────────────────────────────────────────────┘
```

The MCP endpoint does not maintain a second document model.
It translates MCP input into the same documented commands used by the browser editor.
The command engine serializes completed mutations, validates them, saves the result, increments the revision, and publishes updates to the browser.

## Public tool boundary

V1 exposes exactly 39 public tools listed in [Tool catalog](tool-catalog.md).
The catalog has 15 inspection tools, 23 create or mutation tools, and one export tool.
Browser-only interaction helpers may exist internally, but they are not automatically exposed to agents.

Tools use stable document, node, token, asset, component, and source-backed editor-layer IDs.
They do not accept arbitrary raw patches to the document.
Every agent mutation provides an expected revision and receives the committed revision or a revision conflict.

## Browser-dependent operations

The server owns saved design state.
Operations that need actual browser layout or an image require an available browser renderer.
The server reports that dependency clearly instead of guessing computed styles, text measurements, or pixels.

## Scope outside V1

Remote MCP hosting, cloud project access, multi-user collaboration, and public network access are outside V1.

# Local MCP server

## Status

Accepted V1 transport, connection workflow, and shared-project behavior, recorded on 2026-10-03.
ORC-web uses Streamable HTTP over plain localhost HTTP through its existing Bun backend.
The [read-tool responsibilities](read-tools.md) are also accepted.
The [individual tool contracts](tools/README.md) record accepted reads, frame creation, ordinary HTML insertion/replacement, component inspection/import/update, and supported visual-value editing responsibilities.
The [SDK and protocol research](sdk-and-protocol-research.md) records implementation recommendations and their evidence separately.
Core JSON exchanges are recorded for all 28 tools, with a [shared application-error format](tool-errors.md).
Detailed value/geometry/error mappings, package pins, ports, and platform verification remain open.
This is a specification, not a working or tested MCP implementation.

## Purpose and application authority

MCP lets an agent read and edit the same active project that a person uses in ORC-web.

```text
Agent -> localhost /mcp -> shared command engine -> active project
Browser editor ----------> shared command engine -> same active project
```

The Bun backend owns the active project, revisions, and Undo history.
The browser can keep several separate project tabs open, but MCP operates on the currently active project under the [project-session contract](../architecture/orc-workspace-bundle.md#starting-and-opening-projects).
Selecting another project tab changes that active project for subsequent tool calls.
The agent reads fresh `get_context` / `get_source` after a project switch before making further edits.
Commands retain their explicit target project; a request addressed to an inactive or closed project is rejected rather than redirected into the current project.
Dashboard keeps the open tabs and most recently active backend project available; closing the last project tab leaves no active project.
Project creation, opening, and tab switching remain browser actions, with public MCP project-management tools outside V1.
The MCP adapter translates tool inputs into the existing application commands.
It does not keep a separate design document, source copy, or Undo history.
Completed agent edits follow the same validation, source ownership, initial-render checks, and atomic commit rules as human edits.
Known operation failures use the [shared tool-error contract](tool-errors.md), preserving the distinction between rejected edits and later save failures.
Command success and disk-save success remain separate under the [command lifecycle](../architecture/command-engine-and-history.md#command-lifecycle).
Fresh reads can include completed edits that are still awaiting autosave.

## Local HTTP endpoint

The agent's proposed endpoint shape is `http://127.0.0.1:<backend-port>/mcp`.
`<backend-port>` is a placeholder; the port and how it is supplied to client configuration remain implementation details.
This is local HTTP, not an HTTPS hosting requirement.
The MCP specification calls the transport Streamable HTTP; that transport can use HTTP or HTTPS.

The browser editor opens at the normal editor address printed by the launcher.
`/mcp` is the agent endpoint, not the editor page.
During development, Vite serves the browser entry point and Bun serves the backend; the agent must be configured with a reachable Bun MCP endpoint.
The built application uses Bun for both the built frontend and backend, as defined in [startup modes](../architecture/system-architecture.md#startup-and-runtime-modes).

The HTTP endpoint belongs to the already running application backend.
It does not require an agent-launched MCP subprocess.
The [transport research](sdk-and-protocol-research.md#http-and-stdio) records why this fits ORC-web's terminal-managed lifetime and how stdio differs.

## Connection workflow

1. Configure the agent's MCP client once with ORC-web's localhost MCP URL.
2. Start ORC-web normally from the terminal.
3. Open or create a project in the browser editor.
4. Start or connect the agent using that client's existing MCP controls.
5. The agent reads current applied state, then submits the edits requested by the person.
6. The person and agent continue taking turns for as long as they need.

Connection configuration belongs to the agent client and local runtime configuration, outside the portable `.orc` design document.
Finishing an agent task does not deliberately disconnect the client or stop ORC-web.
HTTP requests are individual exchanges; this user workflow does not require one permanently open HTTP socket.
Actual client connection and reconnection behavior must be verified before documenting client-specific setup commands as working ORC instructions.

## Agent and designer iteration

An agent-built foundation is the beginning of the workflow, not the end of the agent's role.
The usual sequence is:

1. Ask the agent to build the foundation and wait for it to finish.
2. Review the result and ask the agent for changes when needed.
3. Wait for those changes to finish, then review again.
4. Make human changes through the canvas, Layers, Properties, Tokens, or Code Apply.
5. Ask the agent for another change or a second design variant.
6. The agent reads fresh applied state through `get_context` / `get_source` before its next edits.

The person's usual practice is to wait while the agent works rather than intervene in that task.
This is a description of taking turns, not a new editor lock, approval dialog, or simultaneous-editing system.
Existing command validation and revisions still apply under the shared [command engine](../architecture/command-engine-and-history.md).
There is no separate agent-to-human feedback loop for learning human changes.
The next fresh read supplies those changes.

## Browser, agent, and server lifetime

| Action | Result |
| --- | --- |
| Agent completes a task while both programs remain running | Its configured access remains available for the next request. |
| Person closes the agent | That client's connection ends; the ORC-web backend and browser editor can keep running. |
| Person switches an ORC project tab | The selected project becomes active for subsequent MCP calls; other open projects retain their own state and history. |
| Person closes an ORC project tab | Resolve that project's draft/save safeguards and release only its session; another remaining tab becomes active if the closed tab was active. |
| Person closes the last ORC project tab | Dashboard remains available, with no active project for MCP until one is opened or created. |
| Person closes only the Chrome browser tab containing the editor | The Bun backend keeps open project sessions and the active project available; an agent can continue using supported server operations. |
| Person reopens the editor while the backend is still running | The browser reconnects to the open server project sessions and current applied active project. |
| Person stops ORC-web from the terminal | The backend becomes unavailable to the agent and browser after normal application shutdown. |

ORC project tabs and the Chrome browser tab have different lifetimes.
Closing either follows the applicable existing Code draft safeguards; it does not apply unfinished code.
Stopping ORC-web uses the accepted [normal terminal shutdown](../architecture/system-architecture.md#normal-terminal-shutdown): finish work, save open projects, then Ctrl+C.
The shutdown handler completes pending saves and releases the managed application resources.
Source reads and edits use server-owned applied state.
Candidate rendering and image/PDF capture with the tab closed still require the available [local rendering service](../architecture/system-architecture.md#local-rendering-service).
Browser-only view state is not made canonical or required for `get_context` / `get_source`.
Context reads report the active project's full save status even when its routine Saved badge is not displayed in the editor.

## Remaining MCP work

Implement and verify the accepted 28 operations against V1's editing, import, and export contracts; detailed value/geometry rules remain open.
Each agreed tool gets a dedicated file under [tools/](tools/README.md); creation responsibilities now live in [create_frame](tools/create_frame.md) and [insert_html](tools/insert_html.md).
Live React creation uses [inspect_component_import](tools/inspect_component_import.md), then [import_component](tools/import_component.md) to prepare and place the complete supported composition in one Import call.
That composition can include agent-authored JSX/TSX, Tailwind v4, Base UI-flavored shadcn, Motion, SVG, and related files together.
Later changes use [update_component_props](tools/update_component_props.md) for one instance's exposed inputs or [update_component_source](tools/update_component_source.md) for implementation files and explicit source scope.
Supported semantic values use [update_styles](tools/update_styles.md), [set_text](tools/set_text.md), [move_nodes](tools/move_nodes.md), or [resize_node](tools/resize_node.md) through the same canonical or validated React ownership rules.
Ordinary subtree replacement uses [replace_node_html](tools/replace_node_html.md), retaining a compatible root and structural location while assigning fresh descendant IDs.
These tools adapt the existing component preparation and command services; their accepted responsibilities do not establish a working server.
The [editing-tool backlog](../../backlog/mcp/command-contracts.md#editing-tool-implementation-decisions) records unresolved value/range/geometry schemas, replacement compatibility, and real-editor proof.
Structural changes use [reorder_nodes](tools/reorder_nodes.md), editor labels use [rename_nodes](tools/rename_nodes.md), and supported removals use [delete_nodes](tools/delete_nodes.md).
[duplicate_nodes](tools/duplicate_nodes.md) reuses same-project Copy/Paste with fresh copied identities and existing shared definitions/resources.
[get_context](tools/get_context.md) provides the compact overview; [get_node](tools/get_node.md) supplies authored object details and [get_tree](tools/get_tree.md) supplies bounded hierarchy.
[list_design_tokens](tools/list_design_tokens.md) reads registry definitions; [update_design_tokens](tools/update_design_tokens.md) manages supported definitions.
[get_computed_styles](tools/get_computed_styles.md) requests actual browser results separately from authored values.
[import_asset](tools/import_asset.md) registers reusable supported resources without placement; [update_node_settings](tools/update_node_settings.md) changes locks or eligible frame token modes.
Saved visibility mutations remain [V1.1](../../backlog/layer-visibility-v11.md), and the [remaining release decisions](../../backlog/mcp/tool-release-scope.md) keep project management, fresh validation, font listing, and conditional-style management outside MCP V1.
[get_screenshot](tools/get_screenshot.md) returns an object-to-frame or bounded workspace image through the shared renderer at an identified applied revision.
Screenshot reads can inspect applied edits before autosave and do not invoke the file-export save/publish workflow.
[export](tools/export.md) exposes the existing exporter for complete supported code, images, and PDF with explicit scope/options, required saving, and destination publication.
[update_attributes](tools/update_attributes.md) changes supported image sources, alternative text, and links through their actual owners, preparing required assets before the atomic edit.
The public MCP [undo/redo tools are scheduled for V1.1](../../backlog/mcp/undo-redo-v11.md); successful V1 MCP mutations still enter the application's shared history.
The [39-tool catalog](../../backlog/mcp/tool-catalog.md) and [command-contract draft](../../backlog/mcp/command-contracts.md) remain provisional references.
The [research and verification record](sdk-and-protocol-research.md#implementation-verification-still-required) identifies the client, protocol, schema, and Fedora/Windows checks still needed.
Remote hosting, cloud project access, public network access, and multi-user collaboration remain outside V1.

## Related contracts

- [System architecture](../architecture/system-architecture.md) owns application processes and project authority.
- [Command engine and history](../architecture/command-engine-and-history.md) owns validation, commits, revisions, and Undo.
- [Workspace bundle](../architecture/orc-workspace-bundle.md) owns applied-state saving and project recovery.
- [React source bindings](../architecture/react-source-bindings.md#agent-workflow) owns durable source targets and fresh agent reads.
- [Code window](../interface/code-window.md) owns unapplied human drafts and source Apply.

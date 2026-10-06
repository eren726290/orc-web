# MCP context and source reads

## Status

Accepted V1 responsibilities for `get_context` and `get_source`, recorded on 2026-10-03.
The focused read split agreed on 2026-10-05 also includes `get_node`, `get_tree`, `list_design_tokens`, `get_computed_styles`, and the separate `get_component_source`.
These read tools support the accepted [connection and iteration workflow](mcp-server.md).
Each read has its own detailed contract linked below.
This overview owns the shared read rules and keeps existing incoming links usable.
Core JSON inputs/results for `get_context`, `get_tree`, `get_node`, `get_source`, `get_component_source`, `list_design_tokens`, and `get_computed_styles`, including token filters and explicit browser measurements, were accepted on 2026-10-05.
Core screenshot scope/state and PNG metadata schemas are also accepted in the dedicated contract.
Other remaining wire fields, detailed value grammars, response limits, and source-location representation remain implementation decisions.
The [historical catalog](../../backlog/mcp/tool-catalog.md) retains candidate rows; current responsibilities and release decisions belong to the dedicated contracts and [release scope](../../backlog/mcp/tool-release-scope.md).
No ORC-web MCP implementation has been tested yet.

## Shared read behavior

All these tools read the server's current applied project.
They include its identity and applied revision so the agent can relate the response to its next command.
The content and reported revision must describe the same applied state.
An edit awaiting autosave is already applied and is visible to the next read.
The last disk save is not a substitute for the active project's current revision.

These reads do not mutate the design, increment its revision, or create an Undo entry.
They exclude unapplied Code-window typing and temporary canvas or Preview interactions.
The human's private Code draft does not become agent source simply because the Code window is open.
The [Code contract](../interface/code-window.md) and [source-binding contract](../architecture/react-source-bindings.md#unapplied-code-and-applied-source) retain those boundaries.

## JSON schemas and examples

Each dedicated contract records its input schema, successful output schema, and JSON argument/result examples.
The [MCP tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) defines JSON Schema inputs, optional output schemas, and structured results; the default schema dialect is JSON Schema 2020-12.
The seven focused read contracts define output schemas so successful `structuredContent` has a checkable shape.
Their examples show tool arguments and successful structured content, not the SDK's JSON-RPC request/response wrappers.
The SDK owns protocol wrapping; the [shared error contract](tool-errors.md) records application failure payloads and text delivery with `isError: true`.
Detailed error-code taxonomy and diagnostic/source mapping remain implementation decisions.

Use one runtime schema authority for validation, types, and MCP registration, following the [schema integration recommendation](sdk-and-protocol-research.md#bun-integration-and-relevant-apis).
These Markdown schemas describe the accepted wire contract and do not require a second independently maintained runtime schema set.
Read results are projections of existing project services, not replacements for the saved canonical model or source bindings.
Service defaults apply when arguments are omitted; validation must not silently coerce supplied values or insert guessed target IDs.

The seven core exchanges preserve stable IDs and the represented applied revision.
A successful read can report `save_failed`; reading applied state and writing it to disk are separate outcomes.
Detailed style/token/owner encoding, bounded-response continuation, and actual SDK/editor verification remain in the [read implementation decisions](../../backlog/mcp/command-contracts.md#read-schema-implementation-decisions).
These are core shapes, not complete semantic validation of owners, values, references, browser state, or geometry.
The separate [screenshot contract](tools/get_screenshot.md#agreed-json-exchange) records target/region capture, temporary named-state inputs, and PNG delivery with structured metadata.
It returns native MCP image content alongside metadata rather than packaging a saved export.

## get_context

The dedicated [get_context contract](tools/get_context.md) owns compact project/root overview, save status, available selection, capabilities, and known diagnostics.
Project-information and selection reads fit here; the tool does not also return full object details, nested hierarchy, tokens, or browser measurements.

## Focused object, hierarchy, token, and measurement reads

- [get_node](tools/get_node.md) reads one object's authored values, sizing rules, saved settings, and reliable edit ownership.
- [get_tree](tools/get_tree.md) reads ordered children or a bounded nested hierarchy; shallow requests also cover direct-child reads.
- [list_design_tokens](tools/list_design_tokens.md) reads registered definitions, existing values/units, and supported reference information.
- [get_computed_styles](tools/get_computed_styles.md) reads requested actual browser CSS results and bounds at the represented applied revision.

Authored values remain distinct from computed results.
These tools reuse the project, binding, token, and rendering services rather than creating separate saved authorities.

## get_source

The dedicated [get_source contract](tools/get_source.md) owns object code, React instance usage, and relevant nested-layer excerpts with reliable owner references.
It takes `nodeId` without a component-source scope selector.

## get_component_source

The dedicated [get_component_source contract](tools/get_component_source.md) reads a definition's actual entry or explicitly requested supporting files by `componentId`.
It identifies applied entry/export identity and preserves authored code while keeping instance inputs and shared implementation distinct.
Both source reads reuse the same source service and remain inspection operations rather than complete exports.

## Fresh reads through repeated iteration

1. The agent reads context and any required source, then performs its requested work.
2. The person waits for that work to finish and reviews the design.
3. The person can request another agent edit or make completed visual or Code Apply changes.
4. Before working again, the agent reads the current applied state rather than relying on its earlier response.
5. Its next mutation uses the shared command engine and existing revision rules.

This applies to the initial foundation, later refinement, and creating another design variant.
There is no separate feedback-loop mechanism and no new requirement to edit simultaneously.
The server supplies fresh state even when the last completed changes came from the human interface.

## Diagnostics and unavailable information

Current component diagnostics identify the affected component, the known error, and whether it concerns candidate application or a later runtime interaction.
Read the current applied source alongside the diagnostic without exposing the human's unapplied draft.
An unavailable browser view, source owner, or measurement must be identified rather than fabricated.
Closing the editor tab does not by itself prevent server-owned context and source reads.
Operations requiring actual rendering retain the [renderer availability contract](../architecture/system-architecture.md#local-rendering-service).
Application failures follow the [shared error schema](tool-errors.md#error-payload-schema); detailed service-code mappings and runtime delivery remain open.

## Implementation verification still required

Verify all focused read tools against the actual project, command, binding, token, and rendering services.
Check that human edits and successful agent edits become visible at the matching applied revision before disk autosave finishes.
Check instance/shared source scopes, stable target IDs, current diagnostics, and exclusion of drafts and temporary Preview state.
Check that reads preserve the design revision and Undo history; server-owned reads work with the editor tab closed, while measurements follow renderer availability.
Check focused scopes, bounded trees/reference counts, authored versus computed values, units, render state, and unavailable information without automatic full-project reads.
These are required implementation checks, not claims that the MCP tools already pass.

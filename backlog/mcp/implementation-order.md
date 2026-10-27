# MCP implementation order

Accepted on 2026-10-08.
Build and verify the ORC-web V1 application before implementing its MCP server and tools.
The prerequisite covers the agreed editor workflows, shared commands, application Undo/Redo, save/reopen, imports, rendering, and exports.
Record E2E results for the application workflows before starting MCP integration.

After that checkpoint, expose the working application services through the accepted MCP contracts and verify actual client calls.
MCP uses the same state, commands, validation, storage, and rendering services as the application.
Keep the installed SDK and documented MCP contracts as preparation for this later V1 checkpoint.
This ordering does not move MCP outside V1 or add application features.

See [implementation status](../../IMPLEMENTATION_STATUS.md#next-checkpoint) for the current application work and [the MCP server contract](../../doc_v1/mcp/mcp-server.md) for the accepted integration behavior.

## Pen tools at the MCP milestone

The owner confirmed on 2026-10-27 that Pen MCP work belongs with the MCP milestone, after the human Pen tool is integrated and verified in the application.
Expose supported Pen reads, creation and editing through the same Pen record, independent validation, shared command/history path and SVG source projection used by the human tool.
The working names `get_pen_path`, `create_pen_path` and `edit_pen_path` in the [temporary Pen handoff](../../plans/pen-agent-handoff.md#deferred-scope) remain proposals until their public contracts are agreed.
Before implementation, settle the input/output schemas, supported geometry and placement, solver execution context, revision checks and failure results.
Verify actual MCP client calls, subsequent human editing, atomic rejection of invalid geometry, locks and stale revisions, application Undo/Redo, save/reopen and clean SVG output.
Keep broader geometry features under their separate Pen scope decisions.
This records implementation timing; the application-first prerequisite above still governs when MCP work starts.

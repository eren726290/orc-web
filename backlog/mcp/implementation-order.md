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

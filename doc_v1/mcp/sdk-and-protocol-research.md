# MCP SDK and protocol research

## Status and evidence

Research verified on 2026-10-03 against the official specification, Anthropic announcement, tagged TypeScript SDK documentation and source, npm package metadata, Context7, and Firecrawl Alexandria.
The accepted [local HTTP and agent workflow](mcp-server.md) is recorded separately from these implementation recommendations.
This research does not establish a tested ORC-web MCP server or finalize every dependency, schema, or tool.

## Release baseline

| Item | Stable release observed | Proposed role |
| --- | --- | --- |
| MCP protocol | `2026-07-28` | Recommended protocol target. |
| `@modelcontextprotocol/server` | `2.3.0` | Recommended application server SDK. |
| `@modelcontextprotocol/client` | `2.3.0` | Client-side verification when needed; not required merely to serve MCP. |
| `@modelcontextprotocol/inspector` | `2.9.0` | Development inspection and protocol verification when needed. |

MCP protocol versions use dates; SDK 2.x is a package-version line.
The June announcement concerned beta SDKs and a release candidate.
The protocol released on July 28, and SDK 2.3.0 released on October 2.
These are dated research findings; record exact implementation pins and a lockfile when adopting packages rather than treating this table as a floating latest-version policy.

Sources are the [June beta announcement](https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/), [Anthropic release announcement](https://claude.com/blog/bringing-mcp-2026-07-28-to-claude), and [SDK 2.3.0 release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0).
Package metadata was checked for the [server](https://registry.npmjs.org/@modelcontextprotocol/server), [client](https://registry.npmjs.org/@modelcontextprotocol/client), and [Inspector](https://registry.npmjs.org/@modelcontextprotocol/inspector).

## Protocol requests and application state

The `2026-07-28` protocol replaces transport sessions and the earlier initialization exchange with independent requests carrying version and capability metadata.
Modern discovery uses `server/discover`.
The SDK owns this protocol handling; application handlers should not recreate it manually.

Independent protocol requests do not remove ORC-web's active project, document revision, save status, or Undo history.
The [protocol release explanation](https://blog.modelcontextprotocol.io/posts/2026-07-28/) explicitly permits application state.
Those services remain owned by the Bun backend.

SDK 2.3.0 requires a fresh MCP server wrapper per HTTP request.
The wrapper registers operations that use the existing application services.
It must not create a new project service or Undo history per request.
The [tagged HTTP guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/serving/http.md) explains the factory and shared services; the [release notes](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0) enforce the request model.

## Bun integration and relevant APIs

`createMcpHandler` supplies a web-standard `fetch` handler that can be mounted in Bun's existing backend.
This route does not need Express, Fastify, Hono, or a Node HTTP adapter.
The integration is documented in the [tagged Bun-compatible guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/serving/web-standard.md).

| API | ORC-web responsibility |
| --- | --- |
| `McpServer` | Build the MCP wrapper around the existing application services. |
| `createMcpHandler` | Handle Streamable HTTP requests in Bun. |
| `registerTool` | Register each agreed operation, description, schema, and handler. |
| `fromJsonSchema` | Adapt the existing JSON Schema authority and validation to SDK tool schemas. |
| `ctx.mcpReq.signal` | Propagate cancellation into preparation that can still be stopped. |
| `ctx.mcpReq.notify` | Report request-related progress where useful. |

Keep one schema authority for application commands and their MCP inputs.
`fromJsonSchema` is an adapter, not a reason to maintain separately authored MCP schemas; its validator must follow the application's chosen schema and validation policy.
See the [schema-library guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/advanced/schema-libraries.md) and [tool registration guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/servers/tools.md).

## HTTP and stdio

Both Streamable HTTP and stdio remain supported by the current protocol and SDK.
Streamable HTTP can run at a plain `http://127.0.0.1:<port>/mcp` endpoint on the local machine.
HTTPS adds TLS encryption; HTTP transport does not itself require public hosting or a cloud service.

Stdio normally means the agent client launches an MCP subprocess and exchanges JSON-RPC through its stdin/stdout.
The specification defines client-controlled shutdown by closing input, waiting for exit, and terminating the child if necessary.
The released SDK provides `serveStdio`, reserves stdout for protocol messages, and closes the connection on stdin end-of-file.
Normal process logs use stderr.

ORC-web already has a terminal-started backend whose lifetime continues between agent tasks.
Local HTTP connects the agent directly to that backend.
Using stdio with this same lifetime would require an agent-launched adapter forwarding to the running backend, or a change to agent-owned application startup.
That is the reason for the accepted HTTP choice.
Stdio remains a valid current transport.

Sources are the [current stdio specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio), [Streamable HTTP specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), and [tagged stdio guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/serving/stdio.md).

Bind the local endpoint to loopback and use the SDK's documented Host/Origin validation helpers when mounting its bare fetch handler.
Those checks belong to endpoint implementation; they add no human/agent editing coordination system.
The tagged [web-standard runtime guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/serving/web-standard.md) explains the helpers and the plain handler's responsibilities.

## Client compatibility

Keep compatibility with older MCP clients initially through the same endpoint.
The SDK's default HTTP handler can serve modern and legacy requests from one factory.
The client SDK's negotiation default and the protocol actually chosen by a host are separate from the installed package version.
See the [tagged protocol-version guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/protocol-versions.md).

Claude Code's protocol choice depends on its version and settings, as described in its [MCP client documentation](https://code.claude.com/docs/en/mcp).
Codex documents Streamable HTTP support, but the inspected [official MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) did not establish its exact negotiated protocol version.
A successful connection alone is not proof that a client used `2026-07-28`.
The Inspector must also be configured to exercise the intended protocol rather than relying on its default legacy mode; see its [protocol-era guide](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/protocol-eras).

## Errors, cancellation, and optional features

Recommended tool handling returns recoverable operation failures with `isError: true` and useful details.
The accepted [shared error payload](tool-errors.md) records stable codes, messages, next actions, and reliably known project/target/source context.
Revision conflicts, unsupported edits, unavailable rendering, and candidate failures should identify what failed and the available next action.
Protocol-level errors remain distinct from application tool failures under the [SDK error guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/servers/errors.md).

Propagate `ctx.mcpReq.signal` to work that can be cancelled before commit.
An abandoned request does not silently undo a command already committed by the shared engine.
Request progress through `ctx.mcpReq.notify` is not a design synchronization or agent feedback loop.
See the [cancellation and progress guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v2.3.0/docs/servers/logging-progress-cancellation.md).

MCP Apps, Tasks, and enterprise authorization capabilities are optional ecosystem features.
Their availability is not an agreement to add them to ORC-web V1.
The [protocol announcement](https://claude.com/blog/bringing-mcp-2026-07-28-to-claude) separates optional extensions from the core protocol.

## Implementation verification still required

- Choose exact SDK pins and verify Bun and the accepted TypeScript 6 toolchain against the actual application dependency tree.
- Verify SDK registration of the 28 core tool exchanges and shared error payload, finishing detailed value/error mappings against the application command contracts.
- Verify the localhost route and actual client setup in development and built-app modes, including startup, disconnect, reconnect, and terminal shutdown.
- Record the protocol actually used by each tested client and exercise both modern and supported older-client requests.
- Verify fresh `get_context` / `get_source` reads, matching revisions, shared Undo, source ownership, and exclusion of private drafts.
- Verify cancellable preparation, candidate rejection, and preservation of an already committed edit when a client disconnects.
- Exercise the actual workflow on Fedora and Windows, including editor-tab closure with the backend still running.

These are implementation checks still needed, not results established by documentation research or the earlier React source-editing experiments.

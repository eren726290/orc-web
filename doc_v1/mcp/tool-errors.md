# MCP tool errors

## Status and purpose

Shared application tool-error contract accepted on 2026-10-06.
This format applies to the existing [28 tool contracts](tools/README.md); it adds no MCP tool.
Core JSON payload and delivery are accepted; detailed code taxonomy, source mapping, SDK integration, and runtime verification remain open.

## Error payload schema

```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "minLength": 1
    },
    "message": {
      "type": "string",
      "minLength": 1
    },
    "nextAction": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "appliedRevision": {
      "type": "integer",
      "minimum": 0
    },
    "targetId": {
      "type": "string",
      "minLength": 1
    },
    "sourceLocation": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "minLength": 1
        },
        "line": {
          "type": "integer",
          "minimum": 1
        },
        "column": {
          "type": "integer",
          "minimum": 1
        }
      },
      "required": [
        "path"
      ],
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "required": [
              "column"
            ]
          },
          "then": {
            "required": [
              "line"
            ]
          }
        }
      ]
    }
  },
  "required": [
    "code",
    "message",
    "nextAction"
  ],
  "additionalProperties": false
}
```

Require a stable `code`, understandable `message`, and actionable `nextAction`.
`REVISION_CONFLICT` identifies a request whose expected revision does not match the relevant applied state.
Other stable application codes must be mapped from existing service failures rather than independently invented by each tool; their complete taxonomy remains implementation work.
Use the same code for the same failure condition across applicable tools.

Include `projectId` and `appliedRevision` only when reliably known.
The revision reports actual applied state at failure, not a new mutation or confirmation of disk saving.
With no active project or unavailable state, omit those fields instead of inventing IDs or revision zero.
Include an affected stable object/component/token/asset identity as `targetId` when reliably identified.
`sourceLocation` identifies a known source file and optional positive one-based line/column.
Do not manufacture locations from Layer labels, runtime DOM indices, or an unmapped compiled stack.
Column requires line; coordinate/source-map conversion and candidate-versus-applied source attribution require implementation verification.
Source diagnostics must not expose the person's private unapplied Code draft.

## Example and MCP delivery

A revision-conflict payload:

```json
{
  "code": "REVISION_CONFLICT",
  "message": "The project changed after your last read.",
  "projectId": "project_1",
  "appliedRevision": 33,
  "nextAction": "Read fresh context and relevant source, then submit an updated request."
}
```

Return application operation failures with MCP `isError: true`.
Serialize this payload once as JSON in a `content` text block.
Omit success `structuredContent` and successful image/output blocks from that failure result.
The error payload is not required to match a tool's successful output schema.
The [SDK documentation](https://ts.sdk.modelcontextprotocol.io/v2/llms-full.txt) documents text error content and skipping output-schema validation for `isError` results.
Use the existing SDK's error path rather than adding an error alternative to every successful tool schema.
Protocol-level malformed requests, unknown tool routing, and SDK envelope errors retain the SDK's protocol handling; this application contract does not redefine JSON-RPC errors.
Thrown SDK errors may become plain-text failures; the adapter must deliberately map known application failures to this agreed payload.

## State and recovery rules

Rejected candidate edits leave the applied design, revision, and application history unchanged.
Failed imports must not commit partial objects/source/resource records; separately prepared package caches retain their existing contracts.
An error message must explain the known failing condition and a useful next step, such as refreshing context, correcting source, unlocking the controlling object, selecting a supported operation, or saving the project first.
No automatic agent feedback loop or new human approval workflow is introduced.

A later autosave failure does not reclassify a successfully committed edit as a rejected command.
Preserve that edit and its Undo entry; fresh `get_context` reports the current save status under the [command lifecycle](../architecture/command-engine-and-history.md#command-lifecycle).
Required saving or file publication can still fail an `export` operation before it publishes successful output.
Later component interaction failures are current diagnostics read through context/source, not retroactive rejection of an earlier successful source edit.
A transport interruption alone cannot establish that an operation failed before commit; completion/retry handling remains separate from a reported application rejection.

## Implementation verification still required

- Map service failures across reads, mutations, preparation, renderer access, and export to stable useful payloads.
- Verify known and unavailable project/revision/target/source fields, source coordinate mapping, and private-draft exclusion.
- Verify actual `isError` delivery through the chosen SDK and clients without success-schema validation or substitute success content.
- Check revision conflicts, locked targets, unsupported edits, rejected candidates, and whole-call failure without committed design residue.
- Verify later autosave failure preserves committed edits, export failure preserves existing output, and runtime diagnostics preserve applied source/history.

These are implementation requirements, not passed MCP/editor tests.
Remaining work is tracked in the [shared-error implementation decisions](../../backlog/mcp/command-contracts.md#shared-error-implementation-decisions).

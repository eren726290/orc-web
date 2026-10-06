# rename_nodes

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`rename_nodes` changes saved editor display names on explicitly identified ordinary objects or supported React layers.
It follows [Layers naming](../../interface/layers-panel.md#renaming-a-layer).
Core JSON request/result fields, per-target label entries, changed-target results, and no-change behavior were accepted on 2026-10-05.
Detailed name limits/normalization, durable React label storage, and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Request and naming boundary

Identify the active project, command identity, expected applied revision, stable object targets, and intended display names.
Use [get_context](get_context.md) for root/selection targets or [get_tree](get_tree.md) for nested targets, distinguishing objects by their IDs even when names match.
Duplicate display names are allowed; stable IDs identify the objects.
The request does not target a current label or select every object whose name matches it.

A successful rename changes the saved Layer label and matching Properties header.
Keep the object's ID, visible text, HTML tag/ID, React function/import/export names, styles, and hierarchy.
Renaming a component instance or nested row does not rename its source definition or create an independent component.
React labels use durable metadata associated with the supported source-backed identity, not the current DOM index.

An empty or spaces-only name retains that target's previous name, as in the human workflow.
An entirely unchanged/no-op request creates no revision or Undo entry.
If a supported batch contains actual changes, commit those accepted changes together; any invalid target or rejected name rejects the whole call.
Other name limits and validation details remain in the [rename implementation decisions](../../../backlog/mcp/command-contracts.md#rename-schema-implementation-decisions).

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One request supplies explicit label assignments for one object or a supported batch.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "renames": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "nodeId": {"type": "string", "minLength": 1},
          "name": {"type": "string"}
        },
        "required": ["nodeId", "name"], "additionalProperties": false
      }
    }
  },
  "required": ["commandId", "projectId", "expectedRevision", "renames"],
  "additionalProperties": false
}
```

Each entry identifies one stable target and its intended saved editor label.
Reject repeated `nodeId` values, including entries with different names for the same object.
Different objects may receive identical names.
Empty and whitespace-only strings are valid requests to retain that target's previous label; they do not clear its name.
An assignment equal to the saved label is also unchanged.
Validate every target, revision, applicable lock, name, and label owner before ignoring unchanged entries or committing changed entries.
An invalid target cannot be bypassed by submitting an empty or unchanged name.
One invalid entry rejects the entire call.

React labels use saved editor metadata for the addressed supported layer identity.
No shared-source scope field or component copying is required to rename that row.
The command does not rename source definitions or application identifiers.
Storage and normalization details still need implementation verification; the string schema alone does not establish accepted name length or durable metadata ownership.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "nodeIds": {
      "type": "array", "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    }
  },
  "required": ["commandId", "projectId", "appliedRevision", "nodeIds"],
  "additionalProperties": false
}
```

Return only targets whose saved labels actually changed, in request order, with matching command/project identities and applied revision.
If some entries are unchanged, omit their IDs while committing the remaining accepted changes together as one command and one Undo entry.
If all entries are unchanged, return `nodeIds: []` with the unchanged applied revision and create no design mutation or Undo entry.
The service determines changes against the current applied labels; the output schema alone cannot prove that relationship.
Command success does not confirm disk saving.

### Request and response examples

Rename two existing objects:

```json
{
  "commandId": "cmd_rename_1",
  "projectId": "project_1",
  "expectedRevision": 24,
  "renames": [
    {"nodeId": "heading_1", "name": "Main heading"},
    {"nodeId": "photo_1", "name": "Product image"}
  ]
}
```

Successful structured result, assuming both labels changed:

```json
{
  "commandId": "cmd_rename_1",
  "projectId": "project_1",
  "appliedRevision": 25,
  "nodeIds": ["heading_1", "photo_1"]
}
```

A subsequent whitespace-only assignment keeps the existing label:

```json
{
  "commandId": "cmd_rename_2",
  "projectId": "project_1",
  "expectedRevision": 25,
  "renames": [{"nodeId": "heading_1", "name": "   "}]
}
```

Successful no-change result:

```json
{
  "commandId": "cmd_rename_2",
  "projectId": "project_1",
  "appliedRevision": 25,
  "nodeIds": []
}
```

These examples describe the agreed exchange, not executed MCP/editor behavior.

## Validation and commit

Validate stable targets, expected revision, applicable locks, accepted name values, and durable label ownership before mutation.
Commit actual accepted metadata changes together as one command, one revision, and one Undo step.
An entirely unchanged validated request follows the no-change response above.
Return changed target IDs and matching command/project/revision fields through the compact agreed result.
Stale or locked targets, unsupported label ownership, and rejected values leave labels and history unchanged.
Renaming updates editor metadata rather than rewriting unrelated application source.

## History, saving, and verification

Canvas selection, Layers, Properties, and MCP context continue to identify the same objects after rename.
Application Undo restores prior labels; Redo reapplies the completed rename.
Save/reopen retains labels and IDs under normal applied-state saving.
Command success and disk-save success remain distinct under the [command lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).
MCP [Undo/Redo exposure is scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md).

Verify one of two identically named objects, a supported React row, unchanged visible content/source identifiers, and save/reopen.
Check empty/whitespace/no-op names, invalid batch targets, applicable locks, stale revisions, application Undo/Redo, and compact responses.
Check duplicate target rejection, repeated labels across different objects, mixed changed/unchanged results, and invalid targets with empty names.
Static schema checks do not prove label storage, change detection, lock enforcement, selection continuity, history, or persistence.
Run through the actual MCP endpoint and Chrome editor on Fedora and Windows before declaring support.
These checks are implementation requirements, not passed MCP tests.

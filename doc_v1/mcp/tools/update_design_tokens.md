# update_design_tokens

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`update_design_tokens` creates, edits, renames, or deletes supported definitions in the project's explicit token registry.
Token reads use the dedicated [list_design_tokens](list_design_tokens.md) contract.
Object-level binding and unlinking use [update_styles](update_styles.md) or another accepted compatible input owner.
Core single-operation JSON schemas and examples are accepted below.
Supported value grammar, reference accounting, CSS projection, and production implementation remain open.
The tool has not been verified through a running ORC-web MCP server.

## Request and V1 scope

Identify the active project, command identity, expected applied revision, intended definition operation, and required values.
Existing definitions are addressed by stable token ID rather than their readable name, resolved value, or CSS variable text.
Creation supplies an accepted category, readable name, and supported default value with its applicable unit.
V1 mutation categories are Color, Spacing, and Corner radius defaults under [Tokens and modes](../../interface/tokens-and-modes.md#release-scope).
Preserve existing Typography values, Dark overrides, and required imported theme inputs.
Their broader value editing or panel registration retains its existing V1.1 schedule.
Authored theme variables do not become registry definitions automatically.

## Definition operations

| Operation | Behavior |
| --- | --- |
| Create | Allocate a fresh stable token ID and generated CSS identity for a valid definition; creation alone does not bind objects. |
| Edit default value | Update the same definition and every supported linked use resolving to that default, preserving existing Dark overrides. |
| Rename | Change the readable label while retaining ID, CSS variable, values, and references. |
| Delete | Remove an unused definition; reject deletion while a supported reference remains. |

Token category and receiving property type must remain compatible; a shared unit does not make Spacing and Corner radius interchangeable.
Preserve supported units rather than silently converting rem to px.
Color alpha remains part of the token value rather than rewriting object-level Opacity.
Do not migrate matching literal values into bindings or change unrelated definitions.
One call performs one definition operation; the core contract accepts no action batch.

## Agreed JSON exchange

Core request/result fields and one-operation scope accepted on 2026-10-06.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
The schema checks the operation's fields; the shared token service validates accepted names, category-specific values/units, target capabilities, references, and required CSS/source preparation.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "operation": {"type": "string", "enum": ["create", "edit_default", "rename", "delete"]},
    "category": {"type": "string", "enum": ["color", "spacing", "corner_radius"]},
    "tokenId": {"type": "string", "minLength": 1},
    "name": {"type": "string", "minLength": 1},
    "value": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "expectedRevision", "operation"],
  "additionalProperties": false,
  "oneOf": [
    {
      "properties": {"operation": {"const": "create"}, "tokenId": false},
      "required": ["category", "name", "value"]
    },
    {
      "properties": {"operation": {"const": "edit_default"}, "category": false, "name": false},
      "required": ["tokenId", "value"]
    },
    {
      "properties": {"operation": {"const": "rename"}, "category": false, "value": false},
      "required": ["tokenId", "name"]
    },
    {
      "properties": {"operation": {"const": "delete"}, "category": false, "name": false, "value": false},
      "required": ["tokenId"]
    }
  ]
}
```

| Operation | Required operation fields | Meaning |
| --- | --- | --- |
| `create` | `category`, `name`, `value` | Create one unused supported definition with a fresh identity. |
| `edit_default` | `tokenId`, `value` | Change the existing definition's default, retaining its category and Dark override. |
| `rename` | `tokenId`, `name` | Change its readable name, retaining its ID, CSS identity, values, and references. |
| `delete` | `tokenId` | Remove one definition only after authoritative supported-reference validation. |

Values use supported CSS strings, such as `"#7c3aed"`, `"24px"`, or `"0.5rem"`.
This core string representation does not accept arbitrary CSS expressions or aliases; detailed color/length grammar remains an [implementation decision](../../../backlog/mcp/command-contracts.md#token-schema-implementation-decisions).
Lengths carry their units, and color alpha remains inside the color value.
`edit_default` derives the category from the existing definition and rejects deferred Typography value edits.
Rename/delete respect the definition's currently supported actions; their availability is not inferred from its displayed value.
No `mode`, object-binding, shared-copy scope, or caller-selected CSS identifier is accepted by this request.
Creating and linking remain separate MCP commands; preserve the existing atomic human Create token from Properties workflow.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "tokenId": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "appliedRevision", "tokenId"],
  "additionalProperties": false
}
```

Return the created or addressed definition's stable ID, including the removed ID after deletion.
The result does not enumerate every linked object affected by a shared default change.
Read definitions and their supported reference information through `list_design_tokens`.
`appliedRevision` identifies the applied result, not confirmation of a completed disk save.
Unchanged-value/name behavior remains implementation work rather than assuming every successful request changes history.

### Request and response examples

Create a spacing definition without connecting any objects:

```json
{
  "commandId": "cmd_token_1",
  "projectId": "project_1",
  "expectedRevision": 29,
  "operation": "create",
  "category": "spacing",
  "name": "Section gap",
  "value": "24px"
}
```

Successful structured result:

```json
{
  "commandId": "cmd_token_1",
  "projectId": "project_1",
  "appliedRevision": 30,
  "tokenId": "token_section_gap"
}
```

These schemas/examples describe accepted JSON shapes, not executed MCP/editor behavior.

## Shared effects and ownership

A definition edit intentionally affects its linked ordinary and supported React uses, including references shared across frames.
An independent component can still reference the same shared token.
Changing only one object's chosen reference belongs to the object/input operation and does not edit the definition.
Create-then-link MCP calls are separate completed commands unless an accepted atomic operation explicitly supports both.
The existing human Create token from Properties workflow retains its atomic creation-and-application command.

Update the authoritative registry and its supported CSS/source projection through existing services.
Do not maintain another independently editable copy of the token in generated CSS.
Reference validation checks the project's supported references, including hidden objects and recognized source; displayed counts alone are insufficient.
Name validation, CSS naming/scope, and shared-source reference accounting retain the existing [implementation decisions](../../interface/tokens-and-modes.md#open-implementation-decisions).
Detailed indirect shared-update locks retain their [later V1.x scope](../../../backlog/shared-update-locks-v1x.md).

## Validation, history, and verification

Validate the expected revision, target identity, operation, supported category/value/unit, applicable rules, reference compatibility, and required source/style preparation before commit.
Validate the complete candidate and required rendering; commit the definition and coupled projection together as one command, one revision, and one application Undo step.
Return the operated definition's `tokenId` and applied revision through the compact result above.
Unsupported values/actions, stale targets, invalid references, in-use deletion, or failed preparation/rendering leave the design and history unchanged.
Any rejected operation leaves the whole call unapplied, including coupled CSS/source changes.

Tokens, Properties, Code, rendering, and fresh MCP reads use the same applied values.
Application Undo/Redo restores definitions, values, identities, and supported connections through retained history.
Save/reopen preserves those inputs under the [command/save lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).
Public MCP Undo/Redo remains [scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md).

Verify creation without automatic literal binding, explicit object linking, shared default changes across ordinary/React frames, stable renaming, and unused deletion.
Check type/unit compatibility, preserved Dark overrides, hidden/source references, in-use deletion refusal, stale/invalid whole-call failure, and application Undo/Redo.
Read `list_design_tokens` after edits before autosave completes, then confirm saved identities, values, and references after reopen.
Use the actual MCP endpoint and Chrome editor on Fedora and Windows before declaring support.
These are implementation requirements, not passed application tests.

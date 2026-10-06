# update_node_settings

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-05.
`update_node_settings` changes an object's own lock setting or an eligible frame's saved design mode.
These are defined saved settings, not an arbitrary node patch.
Core single-setting JSON fields, compact results, and no-change behavior are accepted below.
Durable metadata, inherited-state enforcement, and production SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Request and supported settings

Identify the active project, command identity, expected applied revision, stable target, and requested setting change.
Use [get_node](get_node.md) for current own/inherited settings and supported target capabilities.

| Setting | V1 behavior |
| --- | --- |
| Lock/unlock | Change the targeted canonical object's or supported source-backed Layer's own editor lock. |
| Frame design mode | Choose Light, Dark, or Inherit for an eligible frame through the existing token-mode representation. |

Geometry, styles, content attributes, display names, and token values retain their own editing tools.
Saved Layer hide/show and MCP visibility-setting mutations are [scheduled for V1.1](../../../backlog/layer-visibility-v11.md).
A V1 request cannot add a visibility mutation by sending another generic setting key.
The tool does not change selection, Layers expansion, Preview state, or the ORC editor's interface theme.

## Lock/unlock

Follow [Layers locking](../../interface/layers-panel.md#locking), including ancestor protection and durable source-backed editor metadata.
Changing an own lock does not erase individually locked descendants.
Unlocking a child does not remove a locked ancestor's protection; the controlling ancestor must be explicitly unlocked before ordinary edits are allowed.
The explicit Unlock action can remove the targeted lock, while other edit commands cannot silently bypass it.
The core request changes one setting; combined unlock-and-design-mode requests are rejected.
Unlock explicitly, then submit the mode change against the resulting applied revision.
Locks do not freeze Motion or prevent supported Preview interactions.
Detailed handling of indirect shared-token/component updates retains its [later V1.x scope](../../../backlog/shared-update-locks-v1x.md).

## Light, Dark, and Inherit in plain terms

A frame remains an ordinary container at its chosen size.
Its optional design mode selects existing token values under [mode inheritance](../../interface/tokens-and-modes.md#mode-inheritance).

| Choice | Token values used |
| --- | --- |
| Light | The token's existing default/Light value. |
| Dark | Its existing Dark override, or the default when no override exists. |
| Inherit | Follow the immediate parent frame's effective mode, or the workspace mode for a root frame. |

For example, a Background token can have a white default and a dark-gray override.
Choosing Light or Dark changes which existing value that frame resolves; Inherit follows the surrounding mode.
No choice creates tokens, invents a Dark palette, links separate frames as breakpoints, or changes frame structure.
Literal colors and source styles retain their authored meaning rather than being automatically recolored.
When the agent is asked to make a dark design, it can author dark colors directly; this optional setting is useful when a design already provides mode-aware token values.
The ORC application theme remains independent of the design mode.
Editing token Dark overrides retains its V1.1 schedule and does not enter this tool's V1 scope.

## Agreed JSON exchange

Core JSON fields and one-setting scope accepted on 2026-10-06.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
One call addresses one stable node and changes either its own lock or an eligible frame's saved mode.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "settings": {
      "type": "object",
      "properties": {
        "locked": {"type": "boolean"},
        "designMode": {"type": "string", "enum": ["light", "dark", "inherit"]}
      },
      "minProperties": 1,
      "maxProperties": 1,
      "additionalProperties": false
    }
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeId", "settings"],
  "additionalProperties": false
}
```

`locked` sets the target's own editor lock, not its computed effective protection.
`false` explicitly removes only that target's own lock; a locked ancestor still protects the child.
Descendants retain their individually saved locks.
The shared service validates durable metadata ownership for supported React Layers; this does not change shared component source or make a component independent.

`designMode` sets an eligible frame's saved Light, Dark, or Inherit choice through the existing mode service.
A non-frame target is rejected rather than receiving a new mode field.
Mode changes require an unlocked frame under the applicable ancestor rules; explicit Unlock remains available through its own request.
Changing mode preserves token definitions, literal colors, frame structure, and the editor's interface theme.
No visibility, selection, Preview, style, or arbitrary saved-node key is accepted.
Human and MCP hide/show remain V1.1.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "appliedRevision", "nodeId"],
  "additionalProperties": false
}
```

Return the addressed stable ID and matching command/project/applied-revision fields.
An actual change commits one command, one revision, and one application Undo entry.
An already-matching own setting returns the unchanged revision and creates no Undo entry.
Compare the saved own setting, not only its effective inherited result; changing explicit Light to Inherit can change saved intent even when both currently resolve to Light.
Validate the project revision, target, setting eligibility, ownership, and applicable lock rules before treating a request as unchanged.
Command success does not confirm disk saving.
Read own/effective settings through `get_node`; detailed mode encoding remains with that read contract's implementation decisions.

### Request and response examples

Lock a supported object:

```json
{
  "commandId": "cmd_settings_1",
  "projectId": "project_1",
  "expectedRevision": 30,
  "nodeId": "button_1",
  "settings": {"locked": true}
}
```

Successful structured result, assuming the own lock changed:

```json
{
  "commandId": "cmd_settings_1",
  "projectId": "project_1",
  "appliedRevision": 31,
  "nodeId": "button_1"
}
```

Choose Dark for an eligible unlocked frame:

```json
{
  "commandId": "cmd_settings_2",
  "projectId": "project_1",
  "expectedRevision": 31,
  "nodeId": "frame_1",
  "settings": {"designMode": "dark"}
}
```

Successful structured result, assuming the saved choice changed:

```json
{
  "commandId": "cmd_settings_2",
  "projectId": "project_1",
  "appliedRevision": 32,
  "nodeId": "frame_1"
}
```

These schemas/examples describe agreed JSON shapes, not executed MCP/editor behavior.

## Validation, result, history, and saving

Validate target eligibility, expected revision, supported setting/value, applicable locks, and durable metadata/mode ownership.
Prepare coupled records and validate the complete candidate and required rendering before commit.
A successful completed change uses one command, one applied revision, and one application Undo step.
An unchanged validated request follows the no-change result above.
Return the affected stable ID and matching applied revision in a compact result.
Unsupported keys/targets/values, stale state, unavailable required ownership, or failed validation leave the design and history unchanged.
One invalid setting rejects the whole accepted request rather than applying other settings first.

Layers, Properties, rendering, applied source/export where relevant, and fresh MCP reads use the same saved result.
Application Undo/Redo restores the prior/accepted own settings without flattening descendants' individual settings.
Normal save/reopen preserves the result, with command success distinct from disk-save success.
Public MCP Undo/Redo remains [scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md).

## Implementation verification still required

- Lock/unlock ordinary objects, frames, and supported React Layers; check own versus inherited protection and preserved child locks.
- Verify ordinary edit tools enforce locks, explicit Unlock changes only its target, and Preview interactions remain available.
- Choose Light/Dark/Inherit on root and nested frames with existing overrides and missing overrides; check fallback, direct colors, independent frames, and unchanged editor theme.
- Reject non-frame mode changes, visibility keys, stale/invalid settings, unsupported metadata, and invalid combinations atomically.
- Check identical own settings without new history, explicit-versus-inherited mode intent, and invalid targets/revisions even when the submitted value appears unchanged.
- Verify fresh object/source reads, application Undo/Redo, save/reopen, and unchanged token definitions and private Code drafts on Fedora and Windows.

These are required implementation checks, not passed application tests.

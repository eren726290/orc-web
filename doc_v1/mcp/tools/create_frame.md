# create_frame

## Status and purpose

Accepted V1 responsibilities, recorded on 2026-10-04.
`create_frame` creates one bounded design area with a chosen name, position, and size.
Core JSON request/result fields and examples are accepted below.
Presets, unspecified layout defaults, detailed placement conversion, and production SDK/error integration remain implementation decisions.
The running ORC-web tool has not been tested.

An agent can start a landing page or dashboard by creating its frame, then adding ordinary content with [insert_html](insert_html.md) or using the supported [component import](../../import-export/component-import.md) workflow.
The frame remains part of the freeform infinite workspace.
Creating a desktop-sized frame does not automatically create or link phone and tablet variants.

## Request responsibilities

| Input | Meaning |
| --- | --- |
| Active project and command identity | Use the existing command engine's project and command requirements. |
| Expected applied revision | Validate the operation against the intended project state. |
| Destination | Workspace root or a valid containing frame under the existing hierarchy and layout rules. |
| Name | Readable saved Layers label, separate from the generated object ID. |
| Position | Workspace coordinates for a root, or the supported placement relative to its containing frame. |
| Width and height | Chosen valid dimensions in unzoomed document units. |

Any size supported by the frame and layout contracts is eligible; named desktop/mobile sizes may be convenience presets rather than required device categories.
Do not constrain frames to a fixed set of device sizes.
The exact preset inventory and additional layout/placement encoding remain open; core name, position, size, and parent fields are recorded below.

A nested frame's placement follows its parent's rules.
In Flex flow, the parent determines the participating frame's placement; supplied coordinates must not silently take it out of flow.
Free or explicit Absolute Position placement uses the applicable local coordinates and [Constraints](../../interface/constraints.md).
Unsupported or conflicting placement requests require an explanation before commit.
Root frames have no parent-edge constraints because the workspace has no finite edges.

## Agreed JSON exchange

Core creation fields and examples accepted on 2026-10-05.
JSON Schema and SDK wrapping follow the same [schema authority rules](../read-tools.md#json-schemas-and-examples); command semantics remain in the [command engine](../../architecture/command-engine-and-history.md#command-requirements).
Detailed placement conversions, initial layout defaults, limits, and SDK/error integration remain implementation decisions.

### Input schema

`commandId` identifies this request, `projectId` identifies the intended active project, and `expectedRevision` identifies the applied state it should change.
The wire name `projectId` does not introduce another persisted authority or silently rename the canonical document's identity field.
The historical `documentId` envelope remains provisional; this dedicated contract owns the accepted JSON fields for this tool.

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "name": {"type": "string", "minLength": 1},
    "parentId": {"type": "string", "minLength": 1},
    "position": {"type": "object", "properties": {"x": {"type": "number"}, "y": {"type": "number"}}, "required": ["x", "y"], "additionalProperties": false},
    "size": {
      "type": "object",
      "properties": {"width": {"type": "number", "exclusiveMinimum": 0}, "height": {"type": "number", "exclusiveMinimum": 0}},
      "required": ["width", "height"],
      "additionalProperties": false
    }
  },
  "required": ["commandId", "projectId", "expectedRevision", "name", "size"],
  "additionalProperties": false,
  "allOf": [{"if": {"not": {"required": ["parentId"]}}, "then": {"required": ["position"]}}]
}
```

Omit `parentId` for workspace-root creation and supply a valid containing-frame ID for nesting.
A root request requires an explicit workspace position; negative and fractional coordinates remain valid unzoomed document pixels.
Nested Free placement uses the containing frame's supported local coordinates.
In Flex flow, omit coordinates and let the parent place the participating frame; semantic validation rejects coordinates that would silently take it out of flow.
The schema alone cannot validate the parent's layout or lock state.
Explicit Absolute Position creation encoding and its coupled conversion remain implementation decisions under the existing placement contract.

Width and height are positive document-pixel dimensions, including supported custom fractional values.
Validate actual supported size limits and parent relationships; do not constrain requests to a fixed device-size list.
No position, preset, or layout default may be guessed merely to make an invalid request succeed.
The readable name is a Layer label, not the generated frame identity; detailed name validation remains open.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "frameId": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "appliedRevision", "frameId"],
  "additionalProperties": false
}
```

A successful result identifies the committed frame and matching applied revision.
One fresh successful creation increments the revision once and records one application Undo step.
Command success does not promise that disk autosave has finished.
Failures use useful tool errors and leave the project, revision, and history unchanged.
Exact SDK/error and command retry/idempotency integration remains implementation work under the shared command service.

### Request and response examples

Arguments for a workspace frame:

```json
{
  "commandId": "cmd_create_frame_1",
  "projectId": "project_1",
  "expectedRevision": 12,
  "name": "Landing page",
  "position": {"x": 0, "y": 0},
  "size": {"width": 1440, "height": 900}
}
```

Successful structured result:

```json
{"commandId": "cmd_create_frame_1", "projectId": "project_1", "appliedRevision": 13, "frameId": "frame_1"}
```

Arguments for a participating nested frame in a known Flex parent:

```json
{
  "commandId": "cmd_create_frame_2",
  "projectId": "project_1",
  "expectedRevision": 13,
  "parentId": "frame_1",
  "name": "Section",
  "size": {"width": 400, "height": 240}
}
```

The nested example requires that the parent actually supports Flex-flow placement and is editable.
The returned `frameId` can become the destination for [insert_html](insert_html.md) or supported component placement.

## Creation and result

Validate the active project, expected revision, destination, applicable ancestor locks, placement, and size before creating the frame.
Build one candidate frame with a fresh stable ID and insert it into the appropriate ordered root or child list.
Validate the complete candidate under the [command lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle) before committing.

One successful creation increases the applied revision once and creates one Undo entry.
Return the created frame ID and matching applied project revision so the agent can address the new frame immediately.
The core successful result fields are recorded above; detailed SDK/tool errors remain open.
Autosave follows the existing project flow; success does not mean the revision has already reached disk.
Untitled projects can create frames before a save location exists.

An invalid destination, stale revision, locked parent, unsupported placement, invalid size, or required rendering failure leaves the applied project and history unchanged.
Do not create a partial frame or redirect a failed request to another destination.
Report the known reason and requested target where available.

## Designer workflow and saved identity

The frame appears in the existing Layers hierarchy with its readable name and container presentation.
The person can select it on the canvas or through Layers and use its applicable Properties controls.
Supported resizing and later content edits follow the same frame, sizing, and layout contracts as other design objects.
This tool does not introduce a human Draw frame control into V1.
The existing [human content entry points](../../interface/workspace-and-canvas.md#human-content-entry-points) keep manual frame creation deferred.

Each top-level frame is an independent design area.
Nested frames stay within their parent's design hierarchy.
Frames may intentionally use shared tokens or components without becoming automatic responsive variants.

Undo removes the created frame; Redo restores its saved identity and placement within the retained runtime history.
Save/reopen retains the frame's ID, name, parent relationship, order, and supported geometry.
Reopening does not promise restoration of the prior session's Undo stack.

## Implementation verification still required

- Create a root frame with a custom size and position; verify appearance, Layers, Properties, returned ID, and applied revision.
- Create an eligible nested frame and verify Free/Flex placement, ordered parent membership, and applicable constraints.
- Insert content using the returned frame ID and verify an unrelated frame remains unchanged.
- Verify one-command Undo/Redo restores the correct identity, then save/reopen and verify the saved geometry and hierarchy.
- Reject a stale revision, locked parent, invalid destination, or unsupported sizing/placement without partial creation or an Undo entry.

These are required implementation checks, not claims that the MCP tool already passes.

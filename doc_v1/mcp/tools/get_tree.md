# get_tree

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-05.
`get_tree` reads a requested portion of the saved editable hierarchy.
It takes over nested hierarchy reads previously placed in `get_context`; a shallow request also covers the historical `get_children` candidate.
Core JSON scope/depth encoding and result fields were accepted on 2026-10-05 and are recorded below.
Limits, continuation behavior, and production SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Scope and result

Request workspace roots or the hierarchy below a supported frame, container, or component target.
Known targets use stable canonical or accepted source-binding IDs.
The person does not need to select each target in the browser first.
`get_context` supplies a compact project/root overview; this tool supplies the requested nested structure.

Return the project identity, applied revision, represented scope/depth, stable IDs, readable labels, kinds, parents, and ordered children.
Identify bounded or incomplete results so the agent can request the remaining scope.
Do not imply that a truncated response is the entire hierarchy.
Use [get_node](get_node.md) for detailed authored values and ownership, and [get_source](get_source.md) for applied code.

The hierarchy follows canonical nodes and accepted component bindings under the [Layers contract](../../interface/layers-panel.md#one-hierarchy).
Display labels, text, source offsets, and DOM positions do not replace editing identities.
Two rows named Heading remain distinct targets, including initially identical React usages.
Package internals and arbitrary runtime DOM descendants do not automatically become editable targets.

Structural order stays distinct from computed visual layout.
Flex wrapping does not create saved line groups; an absolutely positioned child retains its actual parent.
Formatting ranges and parser whitespace do not become artificial rows.
Authored-hidden, clipped, and locked objects remain in the saved hierarchy where their targets are supported.
Reading them does not change their visibility, locks, or browser selection.

## Agreed JSON exchange

Core request and successful-result fields accepted on 2026-10-05.
Use JSON Schema and the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
Maximum depth, node/response limits, and continuation for a large bounded branch remain implementation decisions.

### Input schema

`rootId` identifies a supported frame, container, or component target in the active project.
Omitting it requests the workspace-root scope.
`depth` defaults to 1; the service applies this default when the argument is omitted.
A JSON Schema default documents the service's behavior and is not a request to mutate the caller's arguments during validation.

```json
{
  "type": "object",
  "properties": {
    "rootId": {"type": "string", "minLength": 1, "description": "Optional stable frame, container, or supported component root ID."},
    "depth": {
      "type": "integer",
      "minimum": 1,
      "default": 1,
      "description": "Levels below the requested root, or below the conceptual workspace root when rootId is omitted."
    }
  },
  "additionalProperties": false
}
```

With a supplied `rootId`, include that root at depth zero and its direct children at depth one.
Depth two additionally includes grandchildren, following saved child order.
Without `rootId`, the conceptual workspace is depth zero; depth one returns frames and loose workspace roots, and depth two also returns their direct children.
The conceptual workspace is not an invented canonical node or an extra Layers row.

### Output schema

Return the requested or defaulted depth and `rootId: null` for workspace scope.
Each flat node record retains its saved parent and ordered child IDs.
The requested subtree root can have a parent outside the returned scope; preserve that real parent ID.

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "rootId": {"type": ["string", "null"], "minLength": 1},
    "depth": {"type": "integer", "minimum": 1},
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "minLength": 1},
          "name": {"type": "string"},
          "kind": {"type": "string", "enum": ["frame", "element", "text", "image", "svg", "component"]},
          "parentId": {"type": ["string", "null"], "minLength": 1},
          "childIds": {"type": "array", "items": {"type": "string", "minLength": 1}, "uniqueItems": true}
        },
        "required": ["id", "name", "kind", "parentId", "childIds"],
        "additionalProperties": false
      }
    },
    "complete": {"type": "boolean"}
  },
  "required": ["projectId", "appliedRevision", "rootId", "depth", "nodes", "complete"],
  "additionalProperties": false
}
```

`nodes` includes supported editable rows at the requested depth, starting with a supplied root and following saved hierarchy order.
`childIds` can refer to deeper children outside the requested depth; those references do not require returning their full rows.
An empty `childIds` list means the object has no supported editable children and must not be used merely to disguise a depth cutoff.
If a resource limit prevents returning the requested rows or complete child lists, report `complete: false` and do not present the response as complete.
The continuation mechanism remains open; verify it before claiming reliable traversal of large branches.

`complete: true` means the requested scope and depth were fully returned.
It does not mean the entire project or every deeper descendant was returned.
A frame with no children still returns its own record when explicitly requested.
An empty workspace returns `rootId: null`, `nodes: []`, and `complete: true`.

### Request and response examples

Arguments for a frame and its direct children:

```json
{"rootId": "frame_1", "depth": 1}
```

Example successful structured result:

```json
{
  "projectId": "project_1",
  "appliedRevision": 12,
  "rootId": "frame_1",
  "depth": 1,
  "nodes": [
    {"id": "frame_1", "name": "Original", "kind": "frame", "parentId": null, "childIds": ["heading_1", "image_1"]},
    {"id": "heading_1", "name": "Heading", "kind": "text", "parentId": "frame_1", "childIds": []},
    {"id": "image_1", "name": "Photo", "kind": "image", "parentId": "frame_1", "childIds": []}
  ],
  "complete": true
}
```

Arguments for workspace roots at the default depth:

```json
{}
```

Missing/unsupported targets and invalid depth values return useful tool errors.
Reading does not change browser selection, Layers expansion, the project revision, or history.

## Use after creation and copying

After insertion, import, replacement, or duplication returns root IDs, request the relevant descendants here.
This avoids making every mutation return its entire source and all descendants.
For example, read a created Hero root to locate Heading, Photo, and Badge, then use their stable IDs for supported inspection or editing.
Replacement descendants may have new identities; restored Undo/Redo objects retain the identities belonging to the restored design.
Never reuse a stale descendant handle merely because a label matches.

## Consistency and unavailable information

Follow the [shared read rules](../read-tools.md#shared-read-behavior), including matching applied revisions, draft exclusion, and before-autosave reads.
Saved hierarchy reads do not require actual DOM measurement or an open editor tab.
Missing targets, unsupported component boundaries, and unavailable or bounded information must be identified rather than guessed.
No read increments the revision, changes expansion/selection, or records an Undo entry.

## Implementation verification still required

- Read loose roots, independent and nested frames, ordinary HTML/CSS, SVG, supported slots/collections, and React bindings with correct parents and order.
- Request only roots/direct children, then a deeper bounded subtree; check completeness reporting and no accidental full-project expansion.
- Locate identically named siblings and initially identical component usages by distinct IDs.
- Read after insertion, reparenting, copying, replacement, application Undo/Redo, and save/reopen; check continuing, replaced, and restored identities.
- Verify formatting ranges, portals, generated wrappers, and Flex line layout do not manufacture editable rows.
- Verify missing/unsupported targets, closed-tab reads, draft exclusion, and unchanged project/view/history state.

These are required implementation checks, not passed application tests.

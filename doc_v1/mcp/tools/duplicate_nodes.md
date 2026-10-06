# duplicate_nodes

## Status and purpose

Accepted V1 responsibility, documented on 2026-10-04.
`duplicate_nodes` creates another copy of supported applied objects inside the same active project.
It reuses the [same-project Copy/Paste behavior](../../interface/workspace-and-canvas.md#copy-and-paste-inside-the-same-project) and its existing command, layout, asset, and source-binding services.
Core JSON request/result fields, explicit destinations/positions, submitted copy order, and overlap rejection were accepted on 2026-10-05.
Detailed geometry/reference conversion, source-backed destination scope, Absolute Position transition encoding, and SDK/error integration remain implementation decisions.
This is an accepted contract, not a verified ORC-web MCP implementation.

The dedicated human Duplicate action remains [deferred beyond V1](../../../backlog/properties-panel-v1x.md#deferred-controls).
This MCP operation exposes the existing copying behavior without adding that menu action or requiring access to the system clipboard.

## Request and destination

Identify the active project, command identity, expected applied revision, stable source targets, and destination.
Use [get_context](get_context.md) for the overview and [get_node](get_node.md) to inspect requested objects and supported copy capabilities.
Names, HTML IDs, and arbitrary runtime DOM elements do not identify copy targets.

The destination is an eligible frame, container, supported source-backed parent, or the workspace root.
Specify the requested sibling position and placement where the destination requires them.
Free and workspace placement uses unzoomed document units; Flex placement follows the destination's flow or an explicitly supported Absolute Position choice.
Preserve supported relative placement within each copied subtree and validate sizing and constraints against the destination.
Require explicit Free/workspace positions rather than guessing a copy offset.
Reject duplicate IDs and overlapping ancestor/descendant targets; copying a container already includes its owned subtree.
Copying does not move or replace the originals.
Cross-project copying remains outside this contract.

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One request creates one copied root for each supported requested source target at one explicit destination.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeIds": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    },
    "parentId": {"type": ["string", "null"], "minLength": 1},
    "index": {"type": "integer", "minimum": 0},
    "positions": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "nodeId": {"type": "string", "minLength": 1},
          "x": {"type": "number"}, "y": {"type": "number"}
        },
        "required": ["nodeId", "x", "y"], "additionalProperties": false
      }
    }
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeIds", "parentId"],
  "additionalProperties": false,
  "allOf": [
    {
      "if": {"properties": {"parentId": {"const": null}}, "required": ["parentId"]},
      "then": {"required": ["positions"]}
    }
  ]
}
```

`nodeIds` identifies the originals to copy; `parentId` identifies the destination container, with `null` explicitly meaning workspace root.
For Free/workspace placement, require exactly one `positions` entry per requested source ID.
An entry's `nodeId` identifies the original whose new copy receives that position; the new ID does not exist yet.
Use numeric unzoomed document pixels in the destination parent's positioning space, or workspace coordinates for a root.
Signed and fractional coordinates are permitted subject to actual geometry validation.
Reject duplicate position IDs, missing entries, and entries outside `nodeIds`.

Ordinary copies into Flex join its flow and do not accept pixel positions.
Coordinates do not enable Absolute Position; explicit transition encoding remains in the [copy implementation decisions](../../../backlog/mcp/command-contracts.md#copy-schema-implementation-decisions).
Optional `index` is a zero-based insertion point against the existing destination list before adding any copies.
Original objects remain in that list; unlike [reordering](reorder_nodes.md#agreed-json-exchange), copying does not remove them before interpreting the index.
Omitting `index` appends; reject an index beyond the existing list's length.
Insert copied roots together in submitted `nodeIds` order and retain relative child placement within each copied subtree.

The service validates source/target ownership, destination eligibility, overlap, required references, sizing, and geometry against the applied revision.
Nested React copying requires a reliable composition, slot, or local data owner.
Duplication does not make shared component definitions independent.
Copying into shared authored composition still needs an explicit supported edit scope; its destination-scope encoding remains implementation work and must not be inferred from source IDs.
An ambiguous source-backed copy rejects the complete call rather than silently modifying every instance.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "createdRootIds": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    },
    "createdNodeCount": {"type": "integer", "minimum": 1}
  },
  "required": ["commandId", "projectId", "appliedRevision", "createdRootIds", "createdNodeCount"],
  "additionalProperties": false
}
```

Return one new root ID per requested source target, in corresponding request order, with matching command/project identities and applied revision.
Created roots include copies inserted inside a parent, not only workspace roots.
Use the same [created-object counting rule as insert_html](insert_html.md#output-schema): count newly created canonical objects, including roots and descendants, excluding reused resources and separately recorded binding metadata.
The service checks correspondence, fresh identities, and the actual count; the schema alone cannot establish those relationships.
Command success does not confirm disk saving.

### Request and response example

Copy a frame beside its original at workspace root:

```json
{
  "commandId": "cmd_duplicate_1",
  "projectId": "project_1",
  "expectedRevision": 26,
  "nodeIds": ["frame_1"],
  "parentId": null,
  "positions": [{"nodeId": "frame_1", "x": 1600, "y": 0}]
}
```

Successful structured result, assuming the copied frame contains seven canonical descendants:

```json
{
  "commandId": "cmd_duplicate_1",
  "projectId": "project_1",
  "appliedRevision": 27,
  "createdRootIds": ["frame_2"],
  "createdNodeCount": 8
}
```

These examples describe the agreed exchange, not executed MCP/editor behavior.

## What is copied and what stays shared

| Content | Copy behavior |
| --- | --- |
| Ordinary object or frame | Copy its owned subtree, saved content, semantic roles, styles, sizing, layout, clipping, editor metadata, and child order. |
| Object identities | Allocate fresh IDs for copied canonical objects and supported source-backed Layers; remap references between copied objects to their new IDs. |
| React instance | Copy applied instance inputs, supplied content, and supported instance-owned values; reuse the existing shared component definition. |
| Dependencies and managed assets | Reuse required project records and assets rather than installing packages or duplicating files for each instance. |
| Token references | Retain links to the existing definitions; copying a use does not create an independent token. |

Two initially identical instances must still have distinct editing identities.
Map instance-owned bindings to the new usage or copied inputs under [React identity rules](../../architecture/react-source-bindings.md#identity-through-edits).
A nested React layer can be copied only when its authored composition, supported slot, or local data owner provides a reliable copy operation.
Reject unsupported ownership instead of copying temporary rendered DOM.

A copied top-level frame is another independent design area, not a linked breakpoint or responsive variant.
Changing its locally owned content or layout leaves the original unchanged.
Shared React implementation and token definitions still affect their linked uses.
An implementation edit retains the existing [Only this / All copies scope](../../architecture/react-source-bindings.md#choose-edit-scope); duplication itself does not perform Only this or broaden its safe copying limits.
Choosing another token or unlinking a locally owned value changes that copy's property, while editing the token definition remains shared.

Read the latest applied design rather than unapplied Code typing, temporary dragging, Preview inputs, scroll positions, or open interaction state.
Copying retains the existing [unapplied-Code boundary](../../architecture/react-source-bindings.md#unapplied-code-and-applied-source).
The MCP request does not apply or discard the human's private draft.

## Validation, result, and failure

Validate the revision, targets, destination, applicable locks, references, source ownership, and required sizing/constraint conversion.
Prepare affected authored composition and bindings, then validate the complete candidate and any required rendering before commit.
Commit all copied objects, inputs, reference mappings, source changes, and bindings together as one command, one revision, and one application Undo step.
Return the new root IDs, created-object count, and applied revision in a compact result.
Use a focused [get_tree](get_tree.md) read for descendants rather than returning all source and every copied Layer automatically.
The compact agreed result returns `createdRootIds`, `createdNodeCount`, and matching command/project/revision fields.

An unsupported copy boundary, stale target, invalid destination, or failed candidate leaves the applied design and history unchanged.
Identify the known target or ownership failure so the agent can inspect or revise the request.
Do not leave some requested copies applied after another copy fails validation.

## History and saving

Layers, Canvas, Properties, applied Code, and fresh MCP reads expose the new objects through the same saved authority.
Application Undo removes the accepted copies and restores any affected composition while preserving the originals.
Redo restores the accepted copies with their identities and bindings.
Normal autosave and save/reopen preserve the copied design and its required references under the [command/save lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).
Command success remains distinct from disk-save success.
Public MCP Undo/Redo remains [scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md).

## Implementation verification still required

- Copy an ordinary subtree and a complete frame containing Flex, positioned content, images, SVG, and token references; verify new identities, internal reference remapping, hierarchy, placement, and unchanged originals.
- Copy a real React instance and distinguish two initially identical usages; edit an instance-owned value on the copy and verify only that instance changes.
- Verify shared-source and shared-token edits retain their scope, while supported Only this editing preserves the original instance.
- Reject stale targets, locked destinations, unsupported React copying, and a mixed request containing an invalid target without partial copies or draft application.
- Verify new targets through `get_tree`, `get_node`, and `get_source`, then exercise application Undo/Redo and save/reopen through the actual MCP endpoint and Chrome editor on Fedora and Windows.
- Check source-to-created-root correspondence, count accuracy, exact position coverage, submitted order, existing-list insertion indices, duplicate/ancestor rejection, and ambiguous shared-destination refusal.

These are required implementation checks, not passed application tests.
Static schema checks do not prove reference remapping, geometry conversion, source ownership, fresh binding identities, rendering, or persistence.

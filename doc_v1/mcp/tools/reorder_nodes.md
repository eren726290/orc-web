# reorder_nodes

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`reorder_nodes` changes sibling order or moves supported objects into another parent or the workspace root.
It uses the existing hierarchy, layout, source-binding, and command rules.
Core JSON request/result fields, explicit destinations, post-removal indices, and submitted target order were accepted on 2026-10-05.
Detailed geometry conversion, Absolute Position transition encoding, source-owner alias handling, and SDK/error integration remain implementation decisions.
This is an accepted contract, not a verified ORC-web MCP implementation.

## Request and ownership

Identify the active project, command identity, expected applied revision, stable object targets, destination, and requested sibling position.
A move into a Free parent or workspace also identifies the intended placement in unzoomed document units.
The schema must distinguish a same-parent reorder from a change of parent and make placement coordinates unambiguous.
Use [get_tree](get_tree.md) for hierarchy/IDs and [get_node](get_node.md) for supported structural capabilities before editing.
Names, HTML IDs, and arbitrary runtime DOM elements are not structural targets.

Ordinary objects change their canonical parent and ordered child/root lists.
Supported React content changes its actual authored composition, editable slot, or local collection order through a reliable binding.
Shared source changes require explicit All copies or supported Only this scope under [React source bindings](../../architecture/react-source-bindings.md#choose-edit-scope).
Retain the existing independent-copy limits; a structural tool does not make arbitrary React children movable.

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One request inserts its targets together at one explicit destination.

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
    },
    "scope": {"type": "string", "enum": ["all_copies", "only_this"]}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeIds", "parentId"],
  "additionalProperties": false
}
```

`parentId` is required: a stable container ID identifies the destination, and `null` explicitly identifies workspace root.
Remove all requested targets from their current structural lists before interpreting `index` against the remaining destination list.
Index zero inserts before its first remaining child; its length inserts after its last child.
Omitting `index` appends.
Reject an index beyond that remaining list's length rather than clamping it.
Insert the targets together in submitted `nodeIds` order, including when they originate from different eligible parents.
Unselected siblings retain their relative order.
Reject duplicate targets and ancestor/descendant pairs; moving a selected container already includes its owned subtree.

A same-parent reorder preserves each target's existing placement and sizing rules, including an existing Absolute Position choice.
It does not require or accept new positions for those targets; use [move_nodes](move_nodes.md) for their position changes.
When changing a target's parent to Free or workspace root, require exactly one corresponding `positions` entry.
Each entry uses numeric unzoomed document pixels in the destination parent's positioning space, or workspace coordinates for a root.
Signed and fractional coordinates are permitted subject to actual geometry validation.
Reject duplicate position IDs, entries outside `nodeIds`, missing required positions, and positions for targets whose placement is retained or determined by Flex flow.
The service checks these conditions against the applied hierarchy; the JSON schema alone cannot determine the destination layout.

An ordinary move into a new Flex parent joins flow and requires no pixel position.
Coordinates alone never enable Absolute Position.
The explicit transition encoding for reparenting into Absolute Position remains in the [reorder implementation decisions](../../../backlog/mcp/command-contracts.md#reorder-schema-implementation-decisions).
Do not interpret an unknown field or a positions entry as that explicit choice.

Shared React composition changes require explicit `scope: "all_copies"` or `scope: "only_this"`.
Canonical and instance-owned structures retain their actual owners.
Only this must resolve and independently copy the actual supported local owner under the existing copying limits before the complete structural change commits.
The service validates source and destination compatibility, including slots, local collection identities, and shared owners; target IDs alone do not prove movability.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "nodeIds": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    }
  },
  "required": ["commandId", "projectId", "appliedRevision", "nodeIds"],
  "additionalProperties": false
}
```

Return the continuing requested target IDs in request order, matching command/project identities, and the committed applied revision.
Read [get_tree](get_tree.md), [get_node](get_node.md), or applicable source to inspect the resulting structure and placement.
Command success does not confirm disk saving.

### Request and response example

Place an existing navigation child first among its siblings:

```json
{
  "commandId": "cmd_reorder_1",
  "projectId": "project_1",
  "expectedRevision": 23,
  "nodeIds": ["signup_button_1"],
  "parentId": "navigation_1",
  "index": 0
}
```

Successful structured result:

```json
{
  "commandId": "cmd_reorder_1",
  "projectId": "project_1",
  "appliedRevision": 24,
  "nodeIds": ["signup_button_1"]
}
```

The example assumes the button already belongs to navigation and has a supported structural owner.
These examples describe the agreed exchange, not executed MCP/editor behavior.

## Destination behavior

| Destination | Behavior |
| --- | --- |
| Current parent | Change the requested sibling order while retaining object identities and parent relationships. |
| New Flex parent | Insert at the requested structural position and follow that parent's supported layout rules. |
| New Free parent | Use the requested placement and convert sizing/constraint relationships against the new parent. |
| Workspace root | Use the requested workspace position and remove active parent-edge constraints. |

An ordinary move into Flex joins flow and clears conflicting free-placement relationships in the same command.
Absolute Position remains an explicit supported placement choice rather than being inferred from a pixel location.
The [Flex insertion rules](../../interface/flex-layout.md#insertion-and-reordering) and [constraint conversion rules](../../interface/constraints.md#reparenting-and-switching-layout) own these transitions.
Required coordinate measurements must match the applied revision; unsupported conversion or unresolved sizing dependencies reject the move.

Continuing objects retain their IDs, content, children, styles, and supported component inputs.
Changing parents can naturally reflow content under the destination layout.
Do not create replacement objects merely to change their structural location.
Moving a container keeps its owned subtree together.
Multiple targets use submitted order and post-removal indices, rejecting overlapping ancestor/descendant requests under the agreed exchange above.
[move_nodes](move_nodes.md) remains the position operation under the current parent.
This tool does not add human Layers dragging, which retains its [V1.1 schedule](../../../backlog/layers-drag-drop-v11.md).

## Validation, result, and failure

Validate targets, expected revision, applicable source/destination locks, hierarchy cycles, destination eligibility, slots, required references, sizing, and source scope.
Prepare affected source/styles and validate the complete candidate and required rendering before commit.
Commit parent/order, placement, constraints, source, and binding changes together as one command, one revision, and one Undo step.
Return the continuing requested `nodeIds`, command/project identities, and applied revision through the compact agreed result.
Invalid destinations or unsupported ownership leave the design, history, and all requested targets unchanged.
Explain the known target, controlling parent, slot, or conversion failure without guessing a source location.

## History, saving, and verification

Layers, Canvas, Properties, applied Code, and fresh MCP reads use the same hierarchy.
Selection of a continuing supported layer follows its identity rather than its old tree index.
Application Undo restores original parent/order, placement, constraints, source, and bindings; Redo restores the accepted move.
Save/reopen preserves identities and hierarchy under the [shared command/save lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).
The MCP Undo/Redo tools are [scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md); application history remains part of every successful mutation.

Verify same-parent reorder, movement between Free/Flex parents, workspace-root placement, and a supported React slot or local collection.
Check IDs, unrelated content, selection, source output, converted relationships, stale/locked targets, cycles, unsupported bindings, and whole-call rejection.
Check post-removal indices, append, submitted batch order, mixed source parents, per-target position coverage, and same-parent Absolute Position preservation.
Static schema checks do not establish actual geometry conversion, source ownership, candidate rendering, history, or persistence.
Exercise application Undo/Redo and save/reopen through the actual MCP endpoint and Chrome editor on Fedora and Windows.
These are required implementation checks, not passed application tests.

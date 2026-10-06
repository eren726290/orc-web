# move_nodes

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`move_nodes` changes supported saved positions of existing objects under their current parent and placement rules.
It applies to loose workspace objects, Free-positioned children, Absolute Position children, and supported React position bindings.
Core JSON request/result fields, displacement versus per-target positions, and explicit shared-source scope were accepted on 2026-10-05.
Detailed coordinate/constraint conversion, shared-owner resolution, limits, and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Request and coordinate meaning

The request identifies the active project, command identity, expected applied revision, explicit stable targets, and intended movement.
Positions and displacements use unzoomed document units expressed as CSS pixels; signed and fractional numeric values are allowed.
Loose root positions belong to the workspace; child placement belongs to the immediate containing frame under the existing reference convention.
Root X/Y values use workspace coordinates; child X/Y values use the immediate parent's supported positioning coordinates.
Displacement follows those same axes, independently for each target.
Do not interpret browser-screen, pan, or zoom coordinates as saved positions.
Border, padding, and transformed-parent reference conversions still require implementation verification under the existing Constraints convention.
Pan and zoom change the editor view and are not document movements through this tool.

Several compatible Free-positioned objects can receive the same displacement together, following the existing [movement contract](../../interface/workspace-and-canvas.md#keyboard-movement).
Validate all targets and coupled relationships before applying that batch.
The agreed JSON distinguishes `nodeIds` with one shared `delta` from explicit per-target `positions`.
Reject duplicate IDs and ancestor/descendant pairs before mutation; this overlapping target behavior prevents double movement.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
Choose one of two mutually exclusive request forms: `nodeIds` with `delta`, or `positions`.
Both use explicit stable targets under their current parents and placement rules.

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
    "delta": {
      "type": "object",
      "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
      "required": ["x", "y"], "additionalProperties": false
    },
    "positions": {
      "type": "array", "minItems": 1, "uniqueItems": true,
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
  "required": ["commandId", "projectId", "expectedRevision"],
  "additionalProperties": false,
  "oneOf": [
    {"required": ["nodeIds", "delta"], "not": {"required": ["positions"]}},
    {
      "required": ["positions"],
      "not": {"anyOf": [{"required": ["nodeIds"]}, {"required": ["delta"]}]}
    }
  ]
}
```

`nodeIds` plus `delta` applies one displacement to every compatible requested target.
`positions` supplies a destination X/Y for each requested target in that target's workspace or immediate-parent positioning space.
Both coordinates are required; a zero delta on an axis leaves that axis unmoved.
Coordinates are numeric document pixels, not CSS dimension strings or screen measurements.
These forms can request one object or a compatible batch.
Target order is the submitted `nodeIds` order or the `positions` entry order; it does not change sibling order.

The schema rejects mixed forms, empty target arrays, duplicate identical entries, and unknown envelope/coordinate fields.
The service must also reject repeated `positions` node IDs with different coordinates and ancestor/descendant pairs.
Resolve each target's effective source/input owner under the requested scope and its coordinate conversion before preparing writes.
Several selected instances resolving to one shared owner must not apply the same displacement repeatedly to that owner.
If requested destinations conflict at the shared owner, reject the complete call.
Detailed alias resolution and geometry comparison remain in the [movement implementation decisions](../../../backlog/mcp/command-contracts.md#movement-schema-implementation-decisions).

Require explicit `scope: "all_copies"` or `scope: "only_this"` for requested shared React position changes.
Canonical or instance-owned geometry retains its actual owner; a scope flag cannot change that ownership.
Only this must resolve each targeted instance and make the actual supported local source owner independent under the existing copying limits.
Copying, redirection, movement, required source/styles, constraints, and bindings validate and commit together.
The schema cannot infer source scope, parent layout, or safe copying from target IDs.

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

Return the continuing requested target IDs in request order, with matching command/project identities and the committed revision.
A shared-source edit can affect other instances without returning every affected descendant or all source files.
Use authored-value/source reads or requested measurements to inspect the result; command success does not confirm disk saving.

### Request and response examples

Move two compatible objects sixteen document pixels to the right:

```json
{
  "commandId": "cmd_move_1",
  "projectId": "project_1",
  "expectedRevision": 21,
  "nodeIds": ["button_1", "badge_1"],
  "delta": {"x": 16, "y": 0}
}
```

Successful structured result:

```json
{
  "commandId": "cmd_move_1",
  "projectId": "project_1",
  "appliedRevision": 22,
  "nodeIds": ["button_1", "badge_1"]
}
```

Alternatively, set one explicit position from revision 21:

```json
{
  "commandId": "cmd_move_2",
  "projectId": "project_1",
  "expectedRevision": 21,
  "positions": [{"nodeId": "button_1", "x": 24, "y": 32}]
}
```

Successful structured result for that alternative:

```json
{
  "commandId": "cmd_move_2",
  "projectId": "project_1",
  "appliedRevision": 22,
  "nodeIds": ["button_1"]
}
```

The alternatives are not consecutive commands; both begin from the illustrated revision 21.
They assume canonical or instance-owned eligible positions; shared React source additionally requires explicit scope.
These examples describe the accepted exchange, not executed MCP/editor behavior.

## Parent and layout ownership

Moving through this position operation preserves the current parent and structural sibling order.
It does not silently reparent an object or enable Absolute Position.
Changing an ordinary container's position moves its rendered contents with it without rewriting every child's local coordinates.

Participating Flex children have parent-controlled positions.
A pixel-position request for such a child must explain that ownership rather than assigning conflicting offsets.
Sibling reordering and moving between parents use [reorder_nodes](reorder_nodes.md) and the existing structural command rules.
Human canvas drops can explicitly reorder or reparent under [Flex insertion](../../interface/flex-layout.md#insertion-and-reordering) and [Constraints conversion](../../interface/constraints.md#reparenting-and-switching-layout).
This position tool does not remove that existing human workflow.

Free-positioned and Absolute Position children retain their constraint choices while their saved relationships are updated for the requested move.
Moving a Right-constrained object changes its right offset; moving a centered object changes its center offset.
Coupled offsets, including both-edge relationships, must be updated together under [Constraints](../../interface/constraints.md#saving-commands-and-mcp).
Do not leave CSS position values and canonical constraint relationships disagreeing.
Loose roots retain no parent-edge constraints.
Reference geometry for borders, padding, transforms, and clamped sizing remains governed by the open measurement details in the Constraints contract.

## Supported React targets

A component root moves through its supported outer design geometry.
A nested React layer can move only when its accepted binding owns the relevant Free or Absolute Position values.
An arbitrary runtime DOM element or intermediate animated position is not a durable movement target.
Resolve the actual source/input owner and explicit shared or supported Only this scope under [React source bindings](../../architecture/react-source-bindings.md#choose-edit-scope).
An unbound position receives an explanation and source-editing path instead of a temporary DOM transform.
Preserve unrelated Motion behavior, classes, and component inputs while changing the supported underlying position.

## Validation, response, and failure

Validate target identities, expected revision, applicable locks, movement ownership, coordinate conversion, constraints, and structural invariants.
Required browser measurements must match the intended applied revision.
Prepare source and styles where needed and perform required candidate-render validation before commit.
Commit the complete movement and coupled source/constraint changes as one command, one new revision, and one Undo step.
Return the continuing requested `nodeIds`, command/project identities, and matching `appliedRevision` in the compact agreed result.

Stale/locked targets, unsupported Flex pixel movement, uncertain bindings, unsafe independent copying, invalid geometry, or failed required measurements/rendering reject the entire call.
Preserve the prior geometry, source, revision, and history rather than moving only the targets that happened to validate.
Identify the controlling parent or known target/error where possible.

## History, saving, and verification

The move preserves continuing target identities and uses the same applied values in Canvas, Layers, Properties, Code, and MCP reads.
Undo restores the prior positions and coupled relationships; Redo restores the accepted move through retained session history.
Normal save/reopen retains authored positions and constraints rather than zoomed measurements or drag-preview state.
Command success and disk-save success follow the [shared lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).

Verify loose roots, Free children, Absolute Position children, multiple compatible targets, and eligible React position bindings.
Check both request forms, signed/fractional coordinates, Right/Bottom and Center offsets, coupled both-edge relationships, unchanged parents/order, and movement under different workspace zoom values.
Check duplicate and ancestor/descendant targets, repeated shared owners, conflicting shared destinations, explicit scope, independent-copy boundaries, and whole-batch rejection.
Static schema checks do not establish coordinate conversion, ownership, source/constraint fidelity, required measurements, or actual history/persistence.
Check that Flex pixel requests fail without reparenting or changing participation, and that pan/zoom do not alter saved positions.
Verify locked/stale targets, unavailable measurements, whole-call rejection, Undo/Redo, and save/reopen through the actual MCP endpoint and Chrome editor on Fedora and Windows.
These are acceptance requirements, not passed application tests.

# resize_node

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`resize_node` changes supported dimensions or explicit sizing modes on one existing object or frame.
It respects the value's owner on each axis and uses the same Fixed/Fit/Fill and constraint rules as the editor.
Core JSON request/result fields, per-axis dimension/mode encoding, and explicit shared-source scope were accepted on 2026-10-05.
Size-limit handling, coupled-axis/transformed geometry, and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Request and targets

The request identifies the active project, command identity, expected applied revision, stable target, and requested axis changes.
Dimensions use unzoomed document units under the authoritative layout representation.
Each axis can have a different owner or sizing mode.
Use [get_node](get_node.md) to inspect supported sizing and [get_source](get_source.md) when the source owner needs review.
The requested result must be expressible through that object or binding's accepted sizing contract.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One request resizes one stable object or supported source-backed layer.
It can change either axis or both axes together.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "width": {
      "type": "object",
      "properties": {
        "mode": {"type": "string", "enum": ["fixed", "fit", "fill"]},
        "value": {"type": "string", "minLength": 1}
      },
      "additionalProperties": false,
      "allOf": [
        {"anyOf": [{"required": ["mode"]}, {"required": ["value"]}]},
        {"if": {"properties": {"mode": {"const": "fixed"}}, "required": ["mode"]}, "then": {"required": ["value"]}},
        {"if": {"properties": {"mode": {"enum": ["fit", "fill"]}}, "required": ["mode"]}, "then": {"not": {"required": ["value"]}}}
      ]
    },
    "height": {
      "type": "object",
      "properties": {
        "mode": {"type": "string", "enum": ["fixed", "fit", "fill"]},
        "value": {"type": "string", "minLength": 1}
      },
      "additionalProperties": false,
      "allOf": [
        {"anyOf": [{"required": ["mode"]}, {"required": ["value"]}]},
        {"if": {"properties": {"mode": {"const": "fixed"}}, "required": ["mode"]}, "then": {"required": ["value"]}},
        {"if": {"properties": {"mode": {"enum": ["fit", "fill"]}}, "required": ["mode"]}, "then": {"not": {"required": ["value"]}}}
      ]
    },
    "scope": {"type": "string", "enum": ["all_copies", "only_this"]}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeId"],
  "additionalProperties": false,
  "anyOf": [{"required": ["width"]}, {"required": ["height"]}]
}
```

`{ "value": "480px" }` changes an axis that is already Fixed.
`{ "mode": "fixed", "value": "480px" }` explicitly converts that axis to Fixed and assigns its supported dimension.
`{ "mode": "fit" }` follows content, and `{ "mode": "fill" }` follows available parent space.
Fit and Fill reject a fixed `value`.
Fixed requires a `value`.
An axis object with neither field is invalid.

Values retain supported CSS dimension units, such as `480px` or `30rem`.
The service validates applicable units, positive or zero dimensions, declared limits, and actual sizing ownership.
The generic string schema does not make every CSS expression, negative value, or unit valid.

A value-only request never converts Fit, Fill, or a constraint-controlled axis to Fixed.
Both-edge constraints retain their parent-and-margin control, so Fixed is unavailable on that axis until a separate supported constraint change makes it writable.
The service rejects unresolved Fill dependencies and unsupported mode changes without modifying the other requested axis.
Detailed size limits, aspect ratio, transformed geometry, and browser measurement rules remain in the [resize implementation decisions](../../../backlog/mcp/command-contracts.md#resize-schema-implementation-decisions).

Require explicit `scope: "all_copies"` or `scope: "only_this"` when the requested dimensions belong to shared React source.
Canonical and instance-owned values retain their actual owners; a scope flag cannot change that ownership.
Only this resolves the targeted instance and makes the actual supported local source owner independent before the complete resize commits.
The service validates the existing [copying limits](../../architecture/react-source-bindings.md#choose-edit-scope), required styles, bindings, and candidate render.

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

Return the continuing object ID with matching command/project identities and the committed revision.
Read `get_node`, `get_source`, or requested measurements to inspect the applied sizing intent and rendered result.
Command success does not confirm disk saving.

### Request and response example

Change an already Fixed width and explicitly make height Fit:

```json
{
  "commandId": "cmd_resize_1",
  "projectId": "project_1",
  "expectedRevision": 22,
  "nodeId": "hero_1",
  "width": {"value": "480px"},
  "height": {"mode": "fit"}
}
```

Successful structured result:

```json
{
  "commandId": "cmd_resize_1",
  "projectId": "project_1",
  "appliedRevision": 23,
  "nodeId": "hero_1"
}
```

The example assumes its current width is Fixed and its height can use Fit.
It does not imply that a Fit, Fill, or constraint-controlled width accepts a value-only update.
These examples describe the accepted exchange, not executed MCP/editor behavior.

## Sizing modes and controlled axes

| Existing axis rule | Accepted behavior |
| --- | --- |
| Fixed | Change the supported authored dimension while respecting applicable size limits. |
| Fit | Content determines the dimension; an explicit supported switch to Fixed is required for a requested manual dimension. |
| Fill | The parent's available space determines the dimension; change that parent or explicitly request a supported sizing-mode change. |
| Both-edge constraints | The parent and saved margins control the dimension; change the parent or margins rather than assigning a conflicting size. |

A requested dimension does not silently convert Fit, Fill, or a constraint-controlled axis to Fixed.
When a supported conversion is explicitly requested, the mode and associated dimension/relationships must validate and commit together.
The final input schema must distinguish that request from a dimension-only edit.
Unsupported conversions explain the controlling owner without leaving a partial change.

Valid Fit/Fill combinations remain supported.
Reject an unresolved same-axis dependency rather than inventing available parent space or changing another sizing mode.
The [Flex sizing contract](../../interface/flex-layout.md#fixed-fit-and-fill) owns equal sharing, wrapped-row behavior, size limits, and unavailable Fill choices.
The [Constraints contract](../../interface/constraints.md#sizing-conflicts-and-small-parents) owns both-edge sizing, minimum-size priority, and retention of intended margins.

## Object behavior and supported React ownership

Resizing a frame updates its live content through existing layout and responsive rules; it does not create another linked device design.
Parent resizing can reflow Flex children or change constrained children's rendered geometry while preserving their saved intent.
Changing width of Fixed-width, Fit-height text permits wrapping and height growth without reducing its font size.
Clipping stays an independent saved setting and is not changed merely because content overflows.

SVG resizing follows its supported whole-artwork and proportional-size rules in [SVG editing](../../interface/svg-editing.md#select-and-transform).
This tool does not add path-point editing.
Images retain their existing fitting behavior while the supported box changes.
Exact coupled-axis/aspect-ratio behavior for transformed or constrained objects remains an implementation decision rather than a universal resize promise.

A React component root uses its supported outer sizing owner.
A nested layer can resize only when its source binding owns the requested dimensions or sizing inputs.
Source-owned shared values require explicit All copies or supported Only this scope; instance-owned inputs remain local.
Update the owning source/input and prepare required styles, including supported Tailwind changes, instead of persisting only a runtime DOM size.
Do not save an intermediate Motion animation size as the underlying design dimension.
The [source-binding contract](../../architecture/react-source-bindings.md) owns identity and independent-copy validation.

## Validation, response, and failure

Validate target identity, expected revision, applicable locks, axis ownership, requested modes/dimensions, declared limits, dependencies, and required bindings.
Measurements needed by a supported sizing conversion must match the applied revision and accepted reference geometry.
Build the complete candidate, prepare affected source/styles, and validate invariants and required rendering before commit.
Commit all accepted axis and coupled relationship changes as one command, one new revision, and one Undo step.
Return the continuing `nodeId`, command/project identities, and matching `appliedRevision` in the compact agreed result.

Invalid geometry, stale/locked targets, controlled dimensions without an explicit supported change, unresolved sizing dependencies, uncertain source ownership, unsafe Only this copying, and failed required measurements/rendering reject the whole call.
If one requested axis fails, the other axis must not remain changed.
Report the known axis, owner, limit, or failure without fabricating a measurement or source location.

## History, saving, and verification

Canvas, Layers, Properties, applied source, and MCP reads reflect the same successful resize.
Undo restores prior sizing modes, dimensions, and coupled relationships; Redo restores the completed result through retained history.
Save/reopen preserves authored sizing intent and durable bindings rather than only the latest measured rectangle.
Command success and disk-save success follow the [shared lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).
Human resize-handle availability remains defined by [Manual resizing](../../interface/workspace-and-canvas.md#manual-resizing).

Verify independent axes, Fixed dimension changes, explicit supported Fit/Fill conversion, unchanged modes for rejected dimension-only edits, and parent-controlled sizing.
Check live frame reflow, text wrapping, image fitting, proportional SVG sizing, and eligible React/Tailwind bindings without altering animation behavior.
Check both-edge margins and size limits, unresolved Fill dependencies, stale/locked targets, whole-call axis rejection, Undo/Redo, and save/reopen.
Check both request axes, value-only Fixed edits, explicit Fixed/Fit/Fill conversion, invalid values/modes, size limits, and coupled SVG requirements.
Check shared-source scope and Only this copying without a partial change.
Static JSON checks cannot prove owner resolution, CSS/source updates, layout reflow, constraint conversion, candidate rendering, or persistence.
Run these through the actual MCP endpoint and Chrome editor on Fedora and Windows.
These checks are required implementation proof, not passed application tests.

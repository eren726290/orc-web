# update_styles

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`update_styles` requests a supported appearance or layout change on an existing ordinary object or source-backed React layer.
Examples include background color, border values, corner radius, opacity, shadow, Flex gap, padding, and supported alignment or layout settings.
The requested value must have a reliable canonical, source, or input owner.
Core JSON request/result fields, explicit assignment/removal/unlink actions, and shared-source scope were accepted on 2026-10-05.
Detailed property/value grammar, semantic layout-conversion fields, and SDK/error integration remain implementation decisions.
This is an accepted tool contract, not a verified ORC-web MCP implementation.

## Request and targets

The request identifies the active project, command identity, expected applied revision, and one explicit stable `nodeId`.
It supplies supported properties and their semantic values, including units where applicable.
Several related property changes can form one request; all values and their owners must validate together.
One call edits one ordinary object or accepted source-backed layer.
This MCP capability does not introduce bulk Properties editing into the human V1 interface.

Use [get_tree](get_tree.md) to locate nested targets, [get_node](get_node.md) for editable capabilities, and [get_source](get_source.md) when their source or scope needs inspection.
Layer names, CSS selectors, HTML IDs, and arbitrary runtime DOM nodes are not editing targets.
Do not accept arbitrary document patches or unrestricted CSS text through a supported-value operation.
Source edits without a reliable semantic mapping remain available through the existing Code/component-source workflow.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
The same core request works for ordinary canonical objects and supported React source/input bindings.
The schema validates the envelope and basic value shapes; the shared service validates applicable property names, units, value types, token compatibility, ownership, and scope.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "styles": {
      "type": "object",
      "minProperties": 1,
      "propertyNames": {"minLength": 1},
      "additionalProperties": {
        "anyOf": [
          {"type": "string", "minLength": 1},
          {"type": "number"},
          {
            "type": "object",
            "properties": {"tokenId": {"type": "string", "minLength": 1}},
            "required": ["tokenId"],
            "additionalProperties": false
          }
        ]
      }
    },
    "unsetStyles": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    },
    "unlinkStyles": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    },
    "scope": {"type": "string", "enum": ["all_copies", "only_this"]}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeId"],
  "additionalProperties": false,
  "anyOf": [
    {"required": ["styles"]},
    {"required": ["unsetStyles"]},
    {"required": ["unlinkStyles"]}
  ]
}
```

Supply `styles`, `unsetStyles`, `unlinkStyles`, or a combination for different properties.
At least one nonempty action is required; empty supplied maps or lists are invalid even when another action is present.
Omitted properties retain their current authored values.

| Action | Meaning |
| --- | --- |
| `styles` with a direct value | Assign the supported value to its real owner, replacing that property's token reference if present. |
| `styles` with `{ "tokenId": "token_background" }` | Link the property to an existing compatible registered token without changing its definition. |
| `unsetStyles` | Remove a supported authored override and allow its applicable inherited/default behavior; this can change appearance. |
| `unlinkStyles` | Replace an existing token reference with its reliably resolved current direct value, preserving the target's current appearance. |

Lengths include units, such as `24px` or `1rem`; Opacity uses a number between zero and one.
The schema's generic number alternative does not allow every numeric value on every property.
Use supported camelCase property names, such as `backgroundColor`, `borderRadius`, `padding`, `gap`, and `boxShadow`.
Individual padding sides and corner radii can be assigned through their supported names and owners.
A combined padding or radius assignment deliberately updates its applicable sides or corners; omitted independent values are not silently reset by unrelated edits.
The complete supported-property grammar and shorthand/longhand overlap checks remain implementation work.

Reject a property requested in more than one action, unknown or unsupported properties, incompatible tokens, and values without a reliable writable owner.
`null` does not mean clearing or unlinking and is not a supported value in this core schema.
Clearing must remove only the supported override rather than deleting unrelated source, variants, or layout state.
Unlinking requires a known token reference and a reliably resolved value at the matching revision and applicable target design mode.
If resolution or source writing cannot be validated, keep the reference and fail the complete request.
Unlinking retains the current resolved value, not a promise that the resulting literal will follow future token or mode changes.
Detailed inherited/default removal and shared-source mode-resolution rules remain in the [style implementation decisions](../../../backlog/mcp/command-contracts.md#style-schema-implementation-decisions).

Require explicit `scope: "all_copies"` or `scope: "only_this"` when a requested value changes shared React source.
For canonical or instance-owned values, retain that actual owner; a scope flag cannot turn a local value into a shared edit.
Only this resolves the targeted layer to its instance and makes the actual supported local source owner independent before applying the related changes atomically.
Unsupported copying fails before mutation under the existing [scope limits](../../architecture/react-source-bindings.md#choose-edit-scope).
The service must enforce scope against actual ownership; the JSON schema cannot infer it from a stable ID.

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

Return the continuing target ID and the committed revision.
A shared edit can affect other instances without returning every descendant or a full source dump.
Use `get_node`, `get_tree`, and source reads to inspect the applied ownership and result, including a supported independent definition.
Command success does not report a completed disk save.

### Request and response examples

Assign an existing background token and direct radius, padding, and gap values on an ordinary Hero container:

```json
{
  "commandId": "cmd_styles_1",
  "projectId": "project_1",
  "expectedRevision": 18,
  "nodeId": "hero_1",
  "styles": {
    "backgroundColor": {"tokenId": "token_background"},
    "borderRadius": "12px",
    "padding": "24px",
    "gap": "16px"
  }
}
```

Successful structured result:

```json
{
  "commandId": "cmd_styles_1",
  "projectId": "project_1",
  "appliedRevision": 19,
  "nodeId": "hero_1"
}
```

The example assumes the container owns these supported values and the existing token is compatible.
For a supported shared React owner, add the explicit scope choice to the request.

Remove an existing supported shadow override and unlink the background token while retaining its resolved appearance:

```json
{
  "commandId": "cmd_styles_2",
  "projectId": "project_1",
  "expectedRevision": 19,
  "nodeId": "hero_1",
  "unsetStyles": ["boxShadow"],
  "unlinkStyles": ["backgroundColor"]
}
```

Successful structured result:

```json
{
  "commandId": "cmd_styles_2",
  "projectId": "project_1",
  "appliedRevision": 20,
  "nodeId": "hero_1"
}
```

These examples describe the accepted exchange, not executed MCP/editor behavior.

## Where the value is saved

| Value owner | Applied change |
| --- | --- |
| Ordinary canonical object | Update the authoritative saved style or layout value used by rendering and generated code. |
| Supported React source binding | Update the owning source expression or supported static style value. |
| Exposed instance input | Update that instance's accepted input; [update_component_props](update_component_props.md) is also the direct prop operation. |
| Supported local data or slot binding | Change only the value that the accepted binding owns. |
| Shared component implementation | Use explicit All copies or the supported Only this operation. |
| Computed or otherwise unbound value | Explain that the value needs source editing instead of guessing a replacement. |

The [source-binding contract](../../architecture/react-source-bindings.md#edit-ownership) owns these scopes.
Only this must make the actual local source owner independent and apply the requested edit in the same command.
Its existing copying limits remain in force; an outer copy cannot leave the edited child styling shared accidentally.
The choice is explicit in the agent request rather than inferred from whichever object the person selected.

Supported Tailwind edits change the owning complete static class value, prepare the candidate, and rebuild required CSS before commit.
Preserve unrelated responsive, hover, focus, dark-mode, and other variant classes under the [Tailwind contract](../../import-export/tailwind-components.md#visual-editing-of-static-classes).
Do not replace an unsupported computed class expression with a guessed utility or unrelated inline style.
The object remains live React when its source is edited; runtime DOM styling is not another saved authority.

## Layout and related values

Edit the container that owns Gap, Padding, alignment, distribution, or its child layout.
Those values do not become child-owned styles merely because a child is selected.
Supported Free/Row/Column switches, row wrapping, and Absolute Position changes must use the existing atomic conversion rules in [Flex layout](../../interface/flex-layout.md).
They can require measured child positions, sizing changes, or constraint conversion as part of the same semantic command.
The exact public field mapping remains open; raw CSS assignments must not bypass those conversions.

Position changes follow [move_nodes](move_nodes.md), and dimension changes follow [resize_node](resize_node.md).
The core `styles` map does not expose raw position or dimension assignments that bypass those operations.
Free/Row/Column switches, wrapping, alignment/distribution, and Absolute Position retain their accepted responsibilities; their precise semantic JSON fields still need agreement.
Do not accept a raw `display`, `position`, or equivalent CSS assignment as a substitute for the required conversion.
Maintain one authoritative layout representation rather than separately editable CSS and structured fields.
Changing layout can naturally reflow content without rewriting unrelated authored values.
Grid, Column wrapping, separate row/column gap controls, and Stretch are not added by this tool.

A token-bound style must preserve explicit reference semantics under [Tokens and modes](../../interface/tokens-and-modes.md).
Changing a local reference is different from editing the shared token definition.
Literal values do not automatically link to tokens merely because their resolved values match.
The agreed `styles`, `unsetStyles`, and `unlinkStyles` fields distinguish token binding, direct-value assignment, and unlink/clear actions.
These object-reference operations do not edit shared token definitions.
Required imported theme inputs remain preserved without adding their deferred Tokens-panel registration.

## Validation, response, and failure

Resolve each target's current owner and validate the expected revision, applicable locks, allowed values, token compatibility, layout relationships, and required resources.
Prepare candidate source/styles where needed, validate required bindings and invariants, and use the shared rendering path for required candidate checks.
Commit the complete accepted change as one command, one new revision, and one Undo step.
Return the continuing `nodeId`, command/project identities, and matching `appliedRevision` in the compact agreed result.

One invalid target or value rejects the entire call.
Stale revisions, locked owners, unsupported source expressions, failed copying, incompatible tokens, unavailable required measurements/resources, and failed validation or rendering leave the applied design and history unchanged.
Report the known target, property, owner, and reason without inventing a source location.
Preserve unrelated source, styles, behavior, objects, and frame boundaries.

Layers, Properties, Code, and subsequent MCP reads use the same applied result.
Undo restores the previous values and any supported independent-copy change; Redo restores the completed edit through retained history.
Normal autosave stores the authoritative values, source, bindings, and required records.
Command success is distinct from disk-save success under the [command lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle).
The available human controls retain the existing [Properties release scope](../../interface/properties-panel.md#release-scope).
Supported source preservation does not require inventing a missing Properties control.

## Required verification

Verify ordinary background/radius edits and a container Gap/Padding edit, including asymmetric sides and one-call restoration through Undo.
Verify a supported React static style and Tailwind utility edit with unrelated variants preserved and fresh applied source visible through `get_source`.
Check exposed instance ownership, All copies, and the accepted Only this boundary with unrelated copies preserved.
Check token references, direct-value replacement, clear versus unlink behavior, scope validation, layout conversion, stale/locked targets, whole-request rejection, Undo/Redo, and save/reopen.
Check asymmetric sides/corners, shorthand conflicts, invalid units/Opacity, null or empty actions, unresolved shared-mode values, and independent copying without committing a partial change.
Static JSON checks validate only the documented shapes and examples; they do not prove ownership, CSS fidelity, token resolution, or command behavior.
Use the actual ORC-web MCP endpoint and Chrome editor on Fedora and Windows before declaring the tool supported.
These are implementation requirements, not passed application tests.

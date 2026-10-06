# set_text

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`set_text` changes supported text content on one existing Text object or reliably bound React text value.
It preserves the continuing object's identity, semantic role, and applicable styling while changing its content.
Core JSON request/result fields, plain-string content, and explicit shared-source scope were accepted on 2026-10-05.
Detailed rich-text payloads, affected-range policies, value limits, and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Request and editing boundary

The request identifies the active project, command identity, expected applied revision, stable text target, and replacement content.
Use [get_tree](get_tree.md) to locate nested text, [get_node](get_node.md) for supported target details, and [get_source](get_source.md) to inspect its owner where needed.
Readable Layer names, current displayed strings, and HTML IDs are not target identities.
Two initially identical headings remain separate targets.

Content is a supported text value, not a source-file replacement or executable markup payload.
Quoted text, Unicode, meaningful spaces, paragraphs, and line breaks must survive the supported representation.
Use the appropriate source serialization so supplied characters remain text rather than changing JSX structure.
Use [replace_node_html](replace_node_html.md) for an ordinary HTML subtree replacement and [update_component_source](update_component_source.md) for implementation changes.
Changing text does not rename its Layer, reparent the object, or create a new component definition unless an explicit supported Only this edit requires that definition.
Empty content must not silently become an object-deletion command.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One call replaces the text value owned by one stable Text object or accepted React text binding.
The same envelope applies to canonical text, a supported JSX literal, an instance input, a supplied slot, or one identified local collection record.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "text": {"type": "string"},
    "scope": {"type": "string", "enum": ["all_copies", "only_this"]}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeId", "text"],
  "additionalProperties": false
}
```

`text` is required and contains plain text, including an empty string where the target's contract permits it.
Preserve quoted characters, Unicode, meaningful leading/interior/trailing spaces, and line breaks without trimming or guessing new content.
Serialize supplied `<`, `>`, quotes, braces, and similar characters as text in the owning HTML/JSX representation; they do not become executable markup or new children.
This field does not accept rich-text objects, source-file text, or an HTML subtree payload.
The schema validates the shape; the service checks supported ownership, actual input constraints, formatting preservation, and candidate rendering.

`text: ""` clears the owned content while retaining the continuing object, Layer identity, and semantic role.
It does not delete the object, remove a required prop, or rename the Layer.
An accepted component input can reject empty content if its contract requires a nonempty value.
The human rule for discarding a newly created unfinished empty Text object does not turn this existing-target mutation into deletion.

Require explicit `scope: "all_copies"` or `scope: "only_this"` when the value changes shared React source.
Instance-owned and local collection values retain their actual scope; a scope flag cannot change their owner.
Only this copies the necessary supported local owner path and applies the text change together, subject to the existing [copying limits](../../architecture/react-source-bindings.md#choose-edit-scope).
The service must validate scope and ownership because the schema cannot infer them from an ID.
Computed or external text without a reliable editable owner requires source editing.

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

Return the continuing target ID and committed revision with the matching command/project identities.
Use `get_node` or source reads to inspect applied text and ownership, including an independent definition created by a supported Only this edit.
Command success does not establish completed disk saving.

### Request and response example

Replace the content of a supported existing heading:

```json
{
  "commandId": "cmd_text_1",
  "projectId": "project_1",
  "expectedRevision": 20,
  "nodeId": "heading_1",
  "text": "Build something useful"
}
```

Successful structured result:

```json
{
  "commandId": "cmd_text_1",
  "projectId": "project_1",
  "appliedRevision": 21,
  "nodeId": "heading_1"
}
```

The example assumes canonical or instance-owned content; shared React source additionally requires explicit scope.
An empty-content request uses the same envelope with `text: ""`.
These examples describe the accepted exchange, not executed MCP/editor behavior.

## Content ownership

Ordinary Text content changes in the canonical model.
A supported React text binding can instead identify a JSX literal, instance prop, supplied slot, or local collection record.
The command changes that actual owner under [React source bindings](../../architecture/react-source-bindings.md#edit-ownership).
An instance-owned label changes only its instance; a local collection value changes only its identified record.
[update_component_props](update_component_props.md) remains the direct tool for an exposed text-valued prop.
Both operations must reach the same durable owner when they support the same value.

Shared JSX text requires explicit All copies or supported Only this scope.
Only this copies the necessary accepted local definition path and changes the value together as one command.
Preserve the existing copying limits instead of treating every React expression as safely independent.
Computed or external content without a reliable editable owner receives an explanation and the source-editing path.
It must not be replaced only in the browser DOM while its saved source remains unchanged.

## Text styling, semantics, and reflow

Keep the continuing Text object and its applicable typography, sizing, overflow, and semantic role.
A supported heading remains a heading in rendering and export.
The changed content reflows under its existing Fixed/Fit/Fill and parent layout rules.
Do not shrink the font or change a sizing mode merely to make the new words fit.
Preserve full content under the supported overflow behavior.

Rich formatting remains within the Text object rather than creating Layers rows for each formatted range.
The [text representation](../../architecture/canonical-document-model.md#nodes) and [inline-formatting contract](../../interface/text-editing.md#inline-formatting) own that preservation requirement.
The core payload replaces a plain text value; the richer replacement payload and policy for ranges affected by changed text remain open and must be settled before accepting those inputs.
Preserve existing formatting when a reliable binding identifies the exact owned text segment and its surrounding formatting can remain intact.
If whole-value replacement would lose formatting or require uncertain range remapping, reject it and offer the existing Code/source-editing path.
Do not guess new bold/color ranges from matching words or silently flatten them.
Remaining representation and range decisions are in the [text implementation backlog](../../../backlog/mcp/command-contracts.md#text-schema-implementation-decisions).
Do not claim arbitrary formatting-range preservation from a plain string alone or silently flatten an accepted formatted value.
V1.1 typography/Overflow panel controls retain their [existing schedule](../../../backlog/properties-panel-v1x.md#v11-properties-controls); basic text content and declared text-valued component inputs remain V1.

## Validation and commit

Resolve the target and owner from the current applied revision, then validate locks, supported content, required component inputs, bindings, and document invariants.
Prepare changed source and required styles where applicable and validate the candidate through the shared rendering path.
Commit content, its owned source/input, and required binding updates together as one command, one new revision, and one Undo step.
Return the continuing `nodeId`, command/project identities, and matching `appliedRevision` in the compact agreed result.

Invalid targets, stale revisions, locked owners, unsupported content or formatting representation, uncertain ownership, unsafe Only this copying, and failed validation/rendering leave the applied design and history unchanged.
Report the known target and cause without inventing a code location.
The operation does not read or silently apply a person's private Code draft.

## History, saving, and verification

Layers, Properties, applied Code, and `get_source` reflect the same successful text change.
Undo restores previous content and supported formatting/source ownership; Redo restores the completed change through retained history.
Save/reopen preserves the text, identity, semantics, applicable styles, and durable bindings under normal applied-state saving.
Command success and disk-save success retain the [shared distinction](../../architecture/command-engine-and-history.md#command-lifecycle).

Verify ordinary text, quoted/Unicode/multiline content, and a supported semantic heading without losing identity or styling.
Verify two initially identical React usages, instance-owned and shared text, a local collection item, and unsupported computed ownership.
Check unchanged Layer names, existing layout reflow, supported formatting preservation, empty-content handling, stale/locked targets, Undo/Redo, and save/reopen.
Check text-like markup characters stay literal, significant spaces and line breaks survive, required-input empty values fail, and uncertain formatting replacement leaves the previous rich content intact.
Static JSON checks cannot prove text serialization, source ownership, safe copying, formatting fidelity, or actual history/persistence.
Run these through the actual MCP endpoint and Chrome editor on Fedora and Windows.
These are required checks, not passed MCP implementation tests.

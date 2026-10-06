# get_node

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-05.
`get_node` reads one supported object's current authored values, sizing rules, saved settings, and edit ownership.
It takes over the object-detail responsibility previously placed in `get_context`.
Core JSON inputs/results and examples were accepted on 2026-10-05 and are recorded below.
Detailed value/owner grammars, field limits, and production SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Target and returned details

Identify the active project and a stable canonical object or accepted source-binding ID.
Use [get_context](get_context.md) for project overview and available selection, or [get_tree](get_tree.md) to locate nested targets.
Readable names, HTML IDs, selectors, and runtime DOM positions are not editing identities.
Return the project identity and applied revision with the requested object details.

| Detail | Required meaning |
| --- | --- |
| Identity and structural location | Stable ID, readable label, kind, parent, and applicable component/binding identity. |
| Content and attributes | Current supported text, image/asset references, alternative text, links, and other applicable authored attributes. |
| Styles and layout | Supported authored appearance, spacing, positioning, Flex settings, and compatible token references with their units. |
| Sizing rules | Per-axis Fixed/Fit/Fill, supported explicit dimensions and limits, aspect-ratio relationships, and parent-controlled sizing or constraints. |
| Component inputs and ownership | Supported applied instance inputs and whether a value belongs to the canonical object, instance input, shared source, or token definition. |
| Saved settings | Applicable own lock and frame mode, their effective inherited state, and the controlling parent where known; preserve existing saved visibility information without adding a V1 visibility mutation. |
| Editing capabilities | Available operations and reliable value owners, including applicable locks and supported Only this limits. |

Only applicable, reliably known fields belong in the response.
A computed source expression is not a saved literal simply because the browser displays its result.
Identify its known owner or unresolved value and use [get_source](get_source.md) instead of inventing a directly editable value.
Authored class strings and supported source values remain distinguishable from their resolved CSS effect.
Reading an object does not add a Properties control or broaden React recognition.

## Agreed JSON exchange

Core request and successful-result fields accepted on 2026-10-05.
Use JSON Schema and the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
The schema defines the agreed response shape; detailed style, token, input, layout, mode, and source-owner grammars remain implementation decisions.
Open object-valued sections preserve supported authored information while those grammars are settled.
They do not accept arbitrary document patches or establish that every supplied value is editable.

### Input schema

Require one stable `nodeId` in the active project.
Do not infer it from browser selection, a Layer label, or matching displayed content.

```json
{
  "type": "object",
  "properties": {"nodeId": {"type": "string", "minLength": 1, "description": "Required stable canonical object or supported source-binding ID."}},
  "required": ["nodeId"],
  "additionalProperties": false
}
```

### Output schema

Return one node at the matching applied revision.
Identity, location, ownership summary, and editing-operation information are required.
Other sections appear when applicable and reliably known.
The output kinds follow the existing [canonical node kinds](../../architecture/canonical-document-model.md#nodes); this schema does not change their saved representation.

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "node": {
      "type": "object",
      "properties": {
        "id": {"type": "string", "minLength": 1},
        "name": {"type": "string"},
        "kind": {"type": "string", "enum": ["frame", "element", "text", "image", "svg", "component"]},
        "parentId": {"type": ["string", "null"], "minLength": 1},
        "componentId": {"type": "string", "minLength": 1},
        "bindingId": {"type": "string", "minLength": 1},
        "text": {"type": "string"},
        "attributes": {"type": "object"},
        "styles": {"type": "object"},
        "layout": {"type": "object"},
        "constraints": {"type": "object"},
        "sizing": {
          "type": "object",
          "properties": {
            "width": {
              "type": "object",
              "properties": {"mode": {"type": "string", "enum": ["fixed", "fit", "fill"]}, "value": {"type": "string"}},
              "required": ["mode"],
              "additionalProperties": true
            },
            "height": {
              "type": "object",
              "properties": {"mode": {"type": "string", "enum": ["fixed", "fit", "fill"]}, "value": {"type": "string"}},
              "required": ["mode"],
              "additionalProperties": true
            }
          },
          "additionalProperties": true
        },
        "lock": {
          "type": "object",
          "properties": {"own": {"type": "boolean"}, "effective": {"type": "boolean"}, "ancestorId": {"type": "string", "minLength": 1}},
          "required": ["own", "effective"],
          "additionalProperties": false,
          "allOf": [{"if": {"properties": {"own": {"const": true}}, "required": ["own"]}, "then": {"properties": {"effective": {"const": true}}}}]
        },
        "mode": {"type": "object"},
        "inputs": {"type": "object"},
        "owner": {"type": "string", "enum": ["canonical", "instance_input", "shared_source", "local_data", "token", "mixed", "unresolved"]},
        "valueOwners": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {"owner": {"type": "string", "enum": ["canonical", "instance_input", "shared_source", "local_data", "token", "unresolved"]}},
            "required": ["owner"],
            "additionalProperties": true
          }
        },
        "unavailable": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {"field": {"type": "string", "minLength": 1}, "reason": {"type": "string", "minLength": 1}},
            "required": ["field", "reason"],
            "additionalProperties": false
          }
        },
        "editableOperations": {"type": "array", "items": {"type": "string", "minLength": 1}, "uniqueItems": true}
      },
      "required": ["id", "name", "kind", "parentId", "owner", "editableOperations"],
      "additionalProperties": false,
      "allOf": [
        {
          "if": {"properties": {"owner": {"const": "mixed"}}, "required": ["owner"]},
          "then": {"required": ["valueOwners"], "properties": {"valueOwners": {"minProperties": 1}}}
        }
      ]
    }
  },
  "required": ["projectId", "appliedRevision", "node"],
  "additionalProperties": false
}
```

The ordinary-node example uses `owner: "canonical"` because its returned design values belong to that canonical object.
For source-backed content, identify the actual instance-input, shared-source, local-data, or token owner for each relevant value.
`owner: "mixed"` requires `valueOwners` to distinguish those owners; a single node-wide label must not imply that all its values share one edit scope.
A descriptor's `owner` identifies the category; exact field-path syntax and source/input/token location details remain open and must be reliable before edits use them.
An unresolved owner or expression stays explicit, with source inspection offered where available.

`unavailable` lists a requested/applicable field and its known reason when no reliable authored value or owner can be returned.
Omit the invented literal or owner rather than copying a browser-computed result into the authored-values section.
Missing an inapplicable section, such as Image attributes on a heading, is not an unavailable-value error.

Sizing uses Fixed/Fit/Fill per axis.
A supported direct size can be represented as a CSS dimension string, such as `400px`; Fit and Fill preserve their mode without substituting measured pixel dimensions.
Known limits, constraints, references, and aspect-ratio relationships must retain their supported meaning; their detailed nested encoding remains open.
Token bindings likewise retain explicit references rather than becoming resolved color/size strings.

`lock.own` describes the targeted object's lock and `lock.effective` includes ancestor protection.
Include the controlling `ancestorId` when known and applicable.
Frame mode inspection retains own versus effective Light/Dark/Inherit behavior; the nested mode encoding remains open.
`editableOperations` lists currently supported operations under reliable ownership and applicable locks.
A listed operation can still have per-value restrictions; those restrictions must remain inspectable through supported ownership/capability details before mutation.
This response does not add deferred human Properties controls or saved hide/show mutations to V1.

### Request and response examples

Arguments:

```json
{"nodeId": "heading_1"}
```

Example successful structured result for ordinary text:

```json
{
  "projectId": "project_1",
  "appliedRevision": 12,
  "node": {
    "id": "heading_1",
    "name": "Heading",
    "kind": "text",
    "parentId": "frame_1",
    "text": "Build something great",
    "styles": {"color": "#171717", "fontSize": "48px"},
    "sizing": {"width": {"mode": "fixed", "value": "400px"}, "height": {"mode": "fit"}},
    "lock": {"own": false, "effective": false},
    "owner": "canonical",
    "editableOperations": ["set_text", "update_styles", "resize_node"]
  }
}
```

Missing or unsupported targets return useful tool errors without selecting a similarly named object.
Locked, clipped, or authored-hidden supported targets remain readable; inspection does not unlock or reveal them.
A computed/source-owned value can require `get_source` while other supported values remain available here.

## Separate reads

Use `get_tree` for ordered children and a nested hierarchy rather than recursively expanding an object-detail response.
Use [list_design_tokens](list_design_tokens.md) for registry definitions and [get_computed_styles](get_computed_styles.md) for actual browser measurements.
An authored Fill width remains Fill in this response even when its rendered width is 320 px.
A token binding remains a reference to its definition rather than being replaced by a resolved literal.
This read does not require browser rendering merely to report known saved values.

## Consistency and failures

Follow the [shared read rules](../read-tools.md#shared-read-behavior): content and revision agree, applied edits awaiting autosave remain visible, and private drafts and temporary interactions remain excluded.
Missing or unsupported targets return the known condition without selecting a similarly named object or fabricating values.
Locked, clipped, or authored-hidden objects remain inspectable when their stable target is supported.
Reading does not unlock, reveal, mutate, increment the revision, or create an Undo entry.
Server-owned details remain available with the editor tab closed while the active project backend is running.

## Implementation verification still required

- Inspect ordinary HTML/CSS, text, image, SVG, frame, and supported React targets; check identities, location, authored fields, settings, and capabilities.
- Distinguish two initially identical React usages and instance/shared/local-data ownership without inferring identity from their values.
- Read after completed edits before autosave, including token references, sizing modes, limits, constraints, and inherited locks/modes.
- Verify computed expressions and unavailable owners remain explicit, while measured results stay in the measurement tool.
- Check missing targets, private draft exclusion, closed-tab reads, and unchanged project/view/history state.

These are required implementation checks, not passed application tests.

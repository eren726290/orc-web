# get_source

## Status and purpose

Accepted V1 responsibilities, first recorded on 2026-10-03 and organized into this dedicated contract on 2026-10-04.
`get_source` returns current applied code for an object, a React instance usage, or a supported nested layer.
On 2026-10-05, actual shared implementation files moved to the separate [get_component_source](get_component_source.md) tool.
Core JSON inputs/results and examples are accepted below; detailed owner/location grammars, response limits, and SDK/error integration remain implementation decisions.
The running ORC-web tool has not been tested.

## Requested source scope

The agent identifies the target by stable `nodeId`.
Ordinary objects return generated HTML/CSS/SVG; React roots return their usage and inputs; supported nested layers return relevant code and reliable owner references.
Use `get_component_source` with the actual component owner to request its entry or supporting files.
Use [get_context](get_context.md) for root/selection targets or [get_tree](get_tree.md) for nested targets before requesting their source.
The same ownership distinctions used by the [Code window](../../interface/code-window.md#source-display-and-scope) apply here.
The public MCP split does not change the human Code window's initial nested-layer source view.
An instance's inputs and its shared component implementation must remain distinguishable.
Reading an instance must not make shared implementation look instance-owned.

## Returned source and owner

| Information | Required meaning |
| --- | --- |
| Target, project identity, and applied revision | Identify the requested scope and the applied state represented by the response. |
| Relevant applied source | Return the supported HTML/CSS or React/JSX/TSX code for that scope. |
| Source location or canonical owner | Identify where the returned representation comes from. |
| Instance and shared scope | Distinguish instance inputs from shared implementation when relevant. |
| Available diagnostic | Include a current known diagnostic for the requested scope when one exists. |

For ordinary HTML/CSS design objects, generated source represents the canonical design model.
This includes ordinary objects created by [insert_html](insert_html.md); subsequent Properties edits appear in their generated applied source.
Generated source preserves supported design meaning without promising the submitted fragment's original formatting.

For supported React components, authored component source and instance inputs remain authoritative.
Applied Tailwind classes remain in authored source; Motion behavior remains in the React component source.
The read does not create another independently editable source or style document.

When code comes from an authored file, identify that file and a reliable location when available.
When source is generated from a canonical object, identify that object instead of inventing an authored file or line number.
If no reliable authored location exists, say so.
Locations explain the code; durable commands still use stable IDs and validated [source bindings](../../architecture/react-source-bindings.md).

## Agreed JSON exchange

The separate object-source and component-file reads were accepted on 2026-10-05.
Core JSON fields follow the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
Detailed owner/location descriptors, diagnostic rows, response limits, and SDK/error integration remain implementation decisions.

### Input schema

Require one stable `nodeId` in the active project.
The tool does not infer the target from browser selection and has no component-source scope selector.

```json
{"type": "object", "properties": {"nodeId": {"type": "string", "minLength": 1}}, "required": ["nodeId"], "additionalProperties": false}
```

### Output schema

Return the requested object's applicable applied code and the actual owner of each returned source item.
`sources` can include relevant markup and CSS without returning the entire project.
`scope: "selection"` means the explicitly requested object scope, not whichever object a browser currently has selected.
It cannot switch this tool into a shared-file read.

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "scope": {"const": "selection"},
    "sources": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "language": {"type": "string", "minLength": 1},
          "code": {"type": "string"},
          "owner": {
            "type": "object",
            "properties": {
              "kind": {"type": "string", "enum": ["canonical", "instance_input", "shared_source", "local_data", "token", "unresolved"]},
              "nodeId": {"type": "string", "minLength": 1},
              "componentId": {"type": "string", "minLength": 1},
              "bindingId": {"type": "string", "minLength": 1},
              "path": {"type": "string", "minLength": 1},
              "location": {"type": "object"}
            },
            "required": ["kind"],
            "additionalProperties": true,
            "allOf": [{"if": {"properties": {"kind": {"const": "canonical"}}, "required": ["kind"]}, "then": {"required": ["nodeId"]}}]
          }
        },
        "required": ["language", "code", "owner"],
        "additionalProperties": false
      }
    },
    "complete": {"type": "boolean"},
    "diagnostics": {"type": "array", "items": {"type": "object"}}
  },
  "required": ["projectId", "appliedRevision", "nodeId", "scope", "sources", "complete", "diagnostics"],
  "additionalProperties": false
}
```

`owner.kind` distinguishes canonical, instance-input, shared-source, local-data, token, and unresolved ownership.
Canonical-generated source identifies its `nodeId`; it must not invent a file or location.
Authored excerpts include their actual component/file identity and reliable location when known.
An unresolved value must remain explicit; do not substitute a browser-computed literal or fabricate an editable owner.
The exact nested descriptor and location grammar remains open.
A shared owner reference explains an excerpt; use [get_component_source](get_component_source.md) to read the actual file before an implementation update.

`complete` describes whether the requested object-source representation was fully returned.
It does not certify a runnable export or inclusion of every imported file, package, asset, or theme.
A bounded result reports false and its known limitation rather than masquerading as complete source.
Response limits and reliable continuation remain open implementation work.

### Request and response examples

Arguments:

```json
{"nodeId": "heading_1"}
```

Successful structured result for an ordinary heading:

```json
{
  "projectId": "project_1",
  "appliedRevision": 12,
  "nodeId": "heading_1",
  "scope": "selection",
  "sources": [
    {
      "language": "html",
      "code": "<h1 style=\"color:#171717;font-size:48px\">Build something great</h1>",
      "owner": {"kind": "canonical", "nodeId": "heading_1"}
    }
  ],
  "complete": true,
  "diagnostics": []
}
```

For a React root, return its applied usage and inputs with instance ownership.
For a supported nested layer, return its relevant code and real owner reference; do not quietly return the whole shared implementation.
The source service resolves these boundaries from existing bindings, not from matching labels or runtime DOM positions.
Missing/unsupported targets or wholly unavailable source return useful tool errors without substituting a similarly named object.

## Applied state and diagnostics

The source and reported revision must describe the same applied state, including successful changes still awaiting autosave.
These reads do not mutate the design, increment its revision, or create an Undo entry.
They exclude unapplied Code-window typing and temporary canvas or Preview interactions.
Opening a human draft does not expose it through MCP.
The [shared read rules](../read-tools.md#shared-read-behavior) own these requirements for all focused read tools.

Read current applied source alongside an available diagnostic.
Identify the affected component and whether the diagnostic concerns candidate application or a later runtime interaction.
Do not return a rejected candidate as though it were the current applied source.
The existing [Code repair contract](../../interface/code-window.md#runtime-component-errors) determines how a component can be inspected and repaired.
Unavailable owners, files, locations, or requested source must be identified rather than fabricated.
Closing the editor tab does not prevent server-owned source reads while the backend retains the active project.

## Inspection and export

`get_source` is an inspection operation, not a promise that an excerpt contains every dependency, style, theme input, asset, and alias needed to run elsewhere.
Complete output uses [export](export.md) under the [application export contract](../../import-export/export.md).
An ordinary object's generated source and an authored shared React file can have different output boundaries even when both are visible in Code.
Keep that boundary explicit in the response so the agent can choose the correct owner for its next command.

Before another edit, the agent reads fresh source where needed under the [repeated-iteration workflow](../read-tools.md#fresh-reads-through-repeated-iteration).
No feedback loop or separate editable agent copy is introduced.

## Implementation verification still required

- Insert ordinary content, complete a supported Properties edit, and verify generated source represents the matching applied revision.
- Read an instance or supported nested layer through this tool and its actual implementation through `get_component_source`; verify targets, scopes, and owners remain distinct.
- Verify authored Tailwind classes and Motion source survive reads without conversion into a second source authority.
- Verify authored locations are reliable and canonical-generated source identifies its object without a fabricated file or line.
- Verify a failed candidate leaves applied source unchanged while an available diagnostic remains identifiable.
- Read after a successful edit before autosave finishes, with an unapplied human draft open, and with the editor tab closed.
- Verify reads preserve document revision and Undo history and do not claim a complete runnable export.

These are required implementation checks, not claims that the MCP tool already passes.

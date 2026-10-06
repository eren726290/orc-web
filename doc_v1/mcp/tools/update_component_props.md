# update_component_props

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`update_component_props` changes supported exposed inputs on one existing component instance.
Examples include a label, variant, size choice, disabled state, or animation duration when that component's accepted contract exposes the input.
It uses the same value ownership, validation, command engine, and Undo path as the corresponding Properties control.
Core JSON request/result schemas and examples are accepted below.
Detailed value/resource encoding and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Target and payload

The request identifies the active project, command identity, expected applied revision, and stable component instance target.
It supplies the exposed input changes allowed by that instance's current accepted contract.
The agent locates nested instances through [get_tree](get_tree.md), reads their capabilities through [get_node](get_node.md), and can inspect applied usage through [get_source](get_source.md).
Layer names, HTML IDs, runtime DOM nodes, and a component definition shared by several instances are not substitutes for that instance identity.

Only supported inputs can be changed.
Validate their declared types, choices, asset/token rules, and required-input constraints under the [component contract](../../import-export/component-import.md#component-contract).
Do not invent a missing property or accept arbitrary source fragments as a prop value.
Optional-input removal or default restoration uses `unsetProps` only where the accepted contract defines its meaning.

## Agreed JSON exchange

Core request/result schemas and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
`projectId` identifies the intended active project and `nodeId` identifies one stable component instance.
Property value grammars, supported resource/token representations, limits, and SDK/error integration remain implementation decisions.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "expectedRevision": {
      "type": "integer",
      "minimum": 0
    },
    "nodeId": {
      "type": "string",
      "minLength": 1
    },
    "props": {
      "type": "object",
      "minProperties": 1
    },
    "unsetProps": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "required": [
    "commandId",
    "projectId",
    "expectedRevision",
    "nodeId"
  ],
  "additionalProperties": false,
  "anyOf": [
    {
      "required": [
        "props"
      ]
    },
    {
      "required": [
        "unsetProps"
      ]
    }
  ]
}
```

Supply `props`, `unsetProps`, or both for different properties; at least one requested change is required.
Each supplied value replaces that property's value without an implicit deep merge.
Omitted properties retain their current instance values.
`unsetProps` removes a supported optional override and uses its accepted default or optional behavior.
Reject removal of a required input without a valid default.
`null` is a value only where the input contract permits it; it does not mean removal.
Reject a property appearing in both fields and any unknown or unsupported property.
The shared service checks actual types, choices, resources, ownership, and required/default semantics; the generic JSON object does not prove those facts.
All requested changes validate and commit together rather than applying each property separately.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "appliedRevision": {
      "type": "integer",
      "minimum": 0
    },
    "nodeId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "commandId",
    "projectId",
    "appliedRevision",
    "nodeId"
  ],
  "additionalProperties": false
}
```

The result echoes the accepted command/project identities and returns the continuing instance ID and committed applied revision.
It does not confirm that autosave has completed.

### Request and result example

```json
{
  "commandId": "cmd_update_props_1",
  "projectId": "project_1",
  "expectedRevision": 16,
  "nodeId": "hero_instance_1",
  "props": {
    "title": "Start building today"
  }
}
```

```json
{
  "commandId": "cmd_update_props_1",
  "projectId": "project_1",
  "appliedRevision": 17,
  "nodeId": "hero_instance_1"
}
```

The Hero must expose a supported instance-owned `title` input.
Other instances retain their inputs and the shared implementation remains governed by its actual source owner.
For an optional override with a valid default, a request can instead supply `unsetProps: ["size"]` and omit `props`.
This example does not establish that every imported component has a `title` or `size` input.

## Ownership and visible result

Changing a prop supplied to one component usage changes that instance's input or its owned invocation source.
It does not rewrite a shared default or a literal inside the shared implementation.
Other instances retain their instance values.
The shared [edit-ownership rules](../../architecture/react-source-bindings.md#edit-ownership) identify where the input is saved.

For example, when one Hero receives its heading through an exposed `title` prop, updating that Hero's title changes its heading without changing another Hero's title.
An exposed Motion duration follows the same rule; an unexposed transition expression requires [update_component_source](update_component_source.md).
A shared static Tailwind class is a source-owned style value, not an instance prop merely because the agent wants a local edit.
Use the existing supported style/source operation and explicit Only this scope where applicable.

Slots, collection records, and nested style values retain their own accepted binding owners and operation boundaries.
This tool does not become a generic subtree replacement or arbitrary document-patch operation.
Temporary Preview typing, open state, and animation progress are not saved instance inputs unless an explicit supported input is being changed.

## Validation and commit

1. Resolve the current instance and accepted input contract from the matching applied project revision.
2. Validate requested inputs, applicable locks, required resources, and the binding ownership of each changed value.
3. Build candidate instance/source values, prepare required styles or assets, and revalidate affected bindings.
4. Check the candidate render through the shared rendering path with its supported inputs.
5. Commit all requested changes together as one command, one new revision, and one Undo step.
6. Return the updated instance identity and matching applied revision in a compact result.

The [command lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle) owns atomicity and autosave.
A request changing several inputs is atomic; one invalid input must not leave the others applied.
Unknown props, unsupported values, stale revisions, missing/locked targets, invalid required resources, failed required bindings, or a failed candidate render leave the applied design and history unchanged.
Identify the known input, instance, resource, or render failure without fabricating a source location.

## Layers, source, history, and saving

Layers, Properties, Code, and MCP reads reflect the same successful applied change.
Preserve verified continuing identities and revalidate any structure affected by conditional props rather than reusing uncertain handles.
The [identity rules](../../architecture/react-source-bindings.md#identity-through-edits) own selection continuity and known deletion behavior.
Human Code drafts remain excluded from MCP reads and mutations; no draft is silently applied by this tool.

Undo restores the previous owned input values; Redo restores the completed change under retained history.
Source, instance inputs, required resources, and bindings follow normal applied-state saving.
Command success does not establish a completed disk save, and reopening restores the last successfully saved design rather than the old Undo stack.

## Required verification

Use two instances with initially identical supported inputs, select the second through its stable identity, and update only its label or other exposed value.
Verify that the first remains unchanged, applied source and Properties agree, and verified selection stays on the correct instance.
Check multi-input rejection, required defaults/types/choices, locks, stale revisions, conditional structure, Undo/Redo, and save/reopen.
Test an exposed animation input without treating intermediate animation state as saved design data.
The [combined composition proof](import_component.md#required-composition-proof) verifies this tool with the actual imported design; these checks are not yet passed MCP implementation tests.

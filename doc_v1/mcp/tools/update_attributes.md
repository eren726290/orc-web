# update_attributes

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`update_attributes` changes supported content attributes on an existing ordinary object or reliably bound React layer.
Examples include an image source, alternative text, and a link destination.
Asset preparation needed by the edit uses the existing project asset service within the same operation.
Core JSON request/result fields, assignment/removal, local/managed/external image descriptions, and shared-source scope were accepted on 2026-10-05.
Detailed attribute/type grammar, resource format/URL rules, transferred-content encoding, staging/retention, and SDK/error integration remain implementation decisions.
The running ORC-web MCP tool has not been verified.

## Request and boundaries

The request identifies the active project, command identity, expected applied revision, stable target, and supported attribute changes.
Use [get_tree](get_tree.md) to locate nested targets, [get_node](get_node.md) for their detailed capabilities, and [get_source](get_source.md) to inspect the owner when needed.
HTML IDs, labels, CSS selectors, and runtime DOM references are not editing targets.
An application's HTML `id` retains its authored meaning separately from ORC's generated editing identity.

Validate the requested names and values against the accepted HTML/component contract.
Do not use this tool for arbitrary document patches, executable handlers, unrestricted source fragments, or raw style/class rewrites.
Styles and Fit/Fill use [update_styles](update_styles.md); text content uses [set_text](set_text.md); editor labels use [rename_nodes](rename_nodes.md).
Supported removal must have an explicit meaning; removing a required image source is not automatically a valid attribute edit.
Several supported related changes form one request under the agreed JSON below, and one invalid change rejects the whole request.

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One call edits one stable target through supported attribute assignments, removals, or both.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "attributes": {
      "type": "object", "minProperties": 1,
      "propertyNames": {"minLength": 1},
      "properties": {
        "src": {
          "oneOf": [
            {
              "type": "object",
              "properties": {"kind": {"const": "local"}, "path": {"type": "string", "minLength": 1}},
              "required": ["kind", "path"], "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {"kind": {"const": "managed"}, "assetId": {"type": "string", "minLength": 1}},
              "required": ["kind", "assetId"], "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {"kind": {"const": "external"}, "url": {"type": "string", "minLength": 1}},
              "required": ["kind", "url"], "additionalProperties": false
            }
          ]
        }
      },
      "additionalProperties": {"type": ["string", "number", "boolean"]}
    },
    "unsetAttributes": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    },
    "scope": {"type": "string", "enum": ["all_copies", "only_this"]}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeId"],
  "additionalProperties": false,
  "anyOf": [{"required": ["attributes"]}, {"required": ["unsetAttributes"]}]
}
```

`attributes` assigns supported values; `unsetAttributes` removes supported optional attributes.
Reject a name appearing in both fields.
The service validates actual supported names and per-attribute types against the target's capabilities; the generic scalar alternatives do not permit every attribute or every number/boolean.
Attribute names use the supported canonical/source mapping rather than accepting an unrestricted browser property write.
Executable handlers, style/class rewrites, and arbitrary source fragments remain outside this operation.
`null` is not removal; use `unsetAttributes` explicitly.
Empty `alt` is a valid value and retains its meaning when rendered or exported.
Removing a required image source fails rather than leaving an invalid object.

Use `{ "kind": "local", "path": "..." }` to prepare a supported file accessible on the computer running ORC, including before an Untitled project's first Save.
Retain the managed file and assign its durable reference rather than persisting the local path as the only image source.
Use `{ "kind": "managed", "assetId": "..." }` to reuse a valid asset already registered in the active project.
Use `{ "kind": "external", "url": "..." }` for an explicitly external image dependency, retaining its external status.
The core `src` input requires one of these explicit descriptions rather than a bare path or URL string.
The service validates actual paths, resource types, asset membership, and supported URL schemes; a nonempty string alone does not establish validity.
The descriptor is input to asset preparation, not an object-valued HTML `src` attribute.
Rendering and source/export projection resolve the resulting managed or external reference through the existing asset service.
Transferred file content and detailed supported formats remain in the [attribute implementation decisions](../../../backlog/mcp/command-contracts.md#attribute-schema-implementation-decisions).

Prior [import_asset](import_asset.md) registration is optional; supplied local image preparation and all requested attribute changes succeed or fail together.
The target's identity, parent, sibling order, authored position, sizing rules, image fitting, and image position remain under the existing replacement contract.
Content-dependent sizing may respond to the new asset without silently replacing explicit dimensions.
Shared React attribute changes require explicit `scope: "all_copies"` or `scope: "only_this"`.
Scope does not change an instance/local-data owner or make an unsupported computed value writable.
Only this copies the actual supported local owner and applies the edit together under existing copying limits.

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

Return the continuing target ID with matching command/project identities and the committed applied revision.
Use [get_node](get_node.md) or [get_source](get_source.md) to inspect the applied attributes and actual resource/source owner.
Command success does not confirm disk saving.

### Request and response example

Replace an image and its alternative text together:

```json
{
  "commandId": "cmd_attributes_1",
  "projectId": "project_1",
  "expectedRevision": 27,
  "nodeId": "photo_1",
  "attributes": {
    "src": {"kind": "local", "path": "/home/eren/Pictures/product.webp"},
    "alt": "Our latest product"
  }
}
```

Successful structured result:

```json
{
  "commandId": "cmd_attributes_1",
  "projectId": "project_1",
  "appliedRevision": 28,
  "nodeId": "photo_1"
}
```

The example assumes the local file exists and the selected image has eligible canonical or instance-owned attributes.
Shared source additionally requires explicit scope.
These examples describe the agreed exchange, not executed MCP/editor behavior.

## Where the value is saved

| Value owner | Applied change |
| --- | --- |
| Ordinary canonical object | Update the supported authoritative attribute/resource reference used by rendering and generated code. |
| Reliable React literal or source binding | Update the actual owning source value and revalidate its binding. |
| Exposed instance input | Use the accepted input owner; [update_component_props](update_component_props.md) already provides the direct prop operation. |
| Supported local collection or slot | Change only the attribute value owned by that accepted binding. |
| Shared component implementation | Require explicit All copies or the supported Only this operation. |
| Computed expression or external data without an editable owner | Explain that source editing or a supported input is required. |

The [edit-ownership rules](../../architecture/react-source-bindings.md#edit-ownership) and existing Only this copying limits still apply.
Copying an outer component alone must not leave the edited child attribute shared accidentally.
An image-source change must persist in canonical data, the accepted input/data value, or authored source rather than only the browser DOM.
Related source and resource changes are validated and committed together.

## Image replacement and managed resources

Follow the existing [Image properties workflow](../../interface/properties-panel.md#image-properties).
Prepare a supplied local image as a managed project asset and validate it before assigning the new reference.
An existing managed reference can be reused when valid for the project and attribute.
External URLs retain their explicit dependency status under the [workspace bundle](../../architecture/orc-workspace-bundle.md#managed-dependencies); exact accepted schemes, resource formats, and transferred-content encoding remain open.

Retain the continuing Layer/object identity, parent, sibling order, box sizing rules, authored position, fitting settings, and existing image position.
Content-dependent sizing can still respond to the new image under its existing rules; explicit dimensions are not silently rewritten.
Changing alternative text alone must not replace the image or alter its placement.
Fit/Fill and background-image styling remain owned by their supported style operations, with asset preparation reused where needed.

If asset preparation, source validation, or required rendering fails, keep the previous image and all requested attributes unchanged.
Do not commit dangling asset records or discard files needed by another applied reference, the last valid save, or retained application history.
Exact staging and resource-retention mechanics belong to the shared project service.
Untitled projects follow the same applied-command rules before their first save.
This tool does not add manual new-image/SVG insertion or accelerate the deferred Properties controls.

## Commit, result, and history

Validate target ownership, applicable locks, expected revision, attribute values, required resources, bindings, and the candidate through the existing [command engine](../../architecture/command-engine-and-history.md#command-lifecycle).
Commit the complete edit and its required managed records as one command, one new revision, and one application Undo step.
Return the continuing `nodeId` and matching command/project/revision fields through the compact agreed result.
Missing/locked targets, unsupported attributes/owners, invalid resources, stale revisions, failed copying, or failed candidate validation leave the applied design and history unchanged.
Report the known target, attribute, resource, and reason without inventing a source location.

Layers, Properties, Code, and fresh MCP reads use the same applied result.
Application Undo restores the previous attributes, resource references, and any supported independent-copy change; Redo restores the completed edit.
Normal autosave stores the applied values, source/bindings, and required managed resources.
Command success remains distinct from disk-save success, and private human Code drafts are not applied by this tool.
Public MCP Undo/Redo remains [scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md).

## Required verification

Replace an ordinary image with a local managed image and verify retained identity, placement, sizing rules, Fit/Fill, and image position.
Change alternative text and a supported link destination, then inspect the matching applied source.
Exercise a reliable React attribute, an exposed asset input, local item ownership, explicit All copies, and supported Only this without changing unrelated instances.
Check invalid/missing assets, unsupported computed values, invalid attribute removal, locks, stale targets, and whole-request failure without orphan records.
Verify application Undo/Redo, selection continuity, save/reopen, and resource retention after replacement/failure.
Check local/managed/external descriptions, required source removal, set/unset overlap, empty alternative text, and preserved fitting/box rules under image changes.
Static schema checks do not establish attribute grammar, asset preparation, source ownership, rendering, history, or persistence.
Use the actual MCP endpoint and Chrome editor on Fedora and Windows.
These are required implementation checks, not passed MCP attribute-editing tests.

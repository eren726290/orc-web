# update_component_source

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`update_component_source` applies implementation changes to an existing live component and its required supporting source files.
It can change JSX/TSX, related CSS or Tailwind inputs, and source-authored Motion or SVG without a person pressing Code Apply afterward.
The same source-editing, rendering, command, and history services serve Code Apply and MCP updates.
Core JSON managed-file request/result schemas and examples are accepted below.
Dependency/asset/entry-change encoding, managed paths, and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Request responsibilities

The request identifies the active project, command identity, expected applied revision, and stable component/source owner.
It supplies the changed implementation and related files needed for one coherent update.
The agent reads fresh [get_context](get_context.md) and [get_component_source](get_component_source.md) for the actual files before editing; [get_source](get_source.md) identifies object code and relevant owners when needed.
It targets applied source rather than a human's unapplied draft.

Related changes can be submitted together, such as a JSX class edit and the CSS that defines its new value.
The complete candidate must contain valid imports, required files, assets, style inputs, and dependency records.
Required entry/export changes and new dependencies must be expressed and validated through the supported component service; their payload forms remain open.
Managed text-file additions, changes, and removals use the agreed JSON exchange below.
This is a scoped component-source operation, not an arbitrary filesystem patch or a route around supported runtime requirements.

## Agreed JSON exchange

Core managed-file request/result schemas and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
`componentId` identifies the existing managed component/source owner that the agent has read.
Dependency changes, binary assets, entry/export changes, path normalization, limits, and SDK/error integration remain implementation decisions.
Their encoding must agree with the accepted Import service rather than creating another source authority.

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
    "componentId": {
      "type": "string",
      "minLength": 1
    },
    "scope": {
      "enum": [
        "all_copies",
        "only_this"
      ]
    },
    "nodeId": {
      "type": "string",
      "minLength": 1
    },
    "files": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "minLength": 1
          },
          "code": {
            "type": "string"
          }
        },
        "required": [
          "path",
          "code"
        ],
        "additionalProperties": false
      }
    },
    "removeFiles": {
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
    "componentId",
    "scope"
  ],
  "additionalProperties": false,
  "anyOf": [
    {
      "required": [
        "files"
      ]
    },
    {
      "required": [
        "removeFiles"
      ]
    }
  ],
  "allOf": [
    {
      "if": {
        "properties": {
          "scope": {
            "const": "only_this"
          }
        },
        "required": [
          "scope"
        ]
      },
      "then": {
        "required": [
          "nodeId"
        ]
      },
      "else": {
        "not": {
          "required": [
            "nodeId"
          ]
        }
      }
    }
  ]
}
```

`files` contains complete new text for each added or changed managed source file.
Files omitted from both lists remain unchanged; this request is not a replacement of the entire managed bundle.
`removeFiles` explicitly lists existing managed source files to delete.
At least one file addition/change/removal must be requested.
Reject duplicate paths in `files`, equivalent normalized paths, or a path appearing in both lists.
Paths address the managed source owner rather than arbitrary host files.
An empty `code` string can represent an intentionally empty supporting file; the complete candidate must still satisfy required imports, entry, bindings, and rendering.
The shared service validates path ownership, file existence for removal, and the complete resulting source before committing anything.

`scope: "all_copies"` updates the shared definition and omits `nodeId`.
`scope: "only_this"` requires the selected instance's `nodeId`, verifies its relationship to the source owner, and copies the necessary supported local owner path before applying the edit.
The existing copying and shared CSS/theme boundaries below still apply.
The request's paths refer to the source owner before copying; resolving them into an independent result must use the validated owner path rather than guessing from a Layer name.
Detailed managed-path/copy mappings remain implementation decisions.

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
    "componentId": {
      "type": "string",
      "minLength": 1
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
    "componentId"
  ],
  "additionalProperties": false
}
```

For `all_copies`, return the updated shared `componentId`.
For `only_this`, return the effective independent `componentId` and the continuing instance's `nodeId`.
The service must enforce that conditional result requirement because the compact output schema does not include the request's scope.
Both results echo the accepted command/project identities and identify the committed applied revision.
Read affected hierarchy and source through existing tools instead of returning every file and descendant automatically.
Command success remains distinct from a completed disk save.

### Shared-update example

```json
{
  "commandId": "cmd_update_source_1",
  "projectId": "project_1",
  "expectedRevision": 17,
  "componentId": "component_hero_1",
  "scope": "all_copies",
  "files": [
    {
      "path": "Hero.tsx",
      "code": "export function Hero({ title }: { title: string }) { return <h1 className=\"text-5xl font-semibold\">{title}</h1>; }"
    }
  ]
}
```

```json
{
  "commandId": "cmd_update_source_1",
  "projectId": "project_1",
  "appliedRevision": 18,
  "componentId": "component_hero_1"
}
```

This example assumes the component already has the supported prepared Tailwind setup.
The agent reads its actual current implementation before supplying this intentional file replacement.
The title remains an instance input while the classes become shared implementation styling.
Changes to related CSS or local supporting files can be included in the same `files` array and must validate atomically.

### Independent-update example

```json
{
  "commandId": "cmd_update_source_only_1",
  "projectId": "project_1",
  "expectedRevision": 17,
  "componentId": "component_hero_1",
  "scope": "only_this",
  "files": [
    {
      "path": "Hero.tsx",
      "code": "export function Hero({ title }: { title: string }) { return <h1 className=\"text-5xl font-semibold\">{title}</h1>; }"
    }
  ],
  "nodeId": "hero_instance_1"
}
```

```json
{
  "commandId": "cmd_update_source_only_1",
  "projectId": "project_1",
  "appliedRevision": 18,
  "componentId": "component_hero_independent_1",
  "nodeId": "hero_instance_1"
}
```

This is an alternative request at revision 17, not a command following the shared-update result at revision 18.
The independent ID is illustrative; ORC generates the actual definition identity.
Copying, redirecting the instance, rebuilding styles, validating bindings/rendering, and applying changed files succeed together as one command.
Unsupported copying, invalid existing inputs, or a failing related file leaves the previous design intact.

## Shared and independent scope

The request must identify the source scope it intends to change.
A shared implementation update affects every instance using that definition and is one Undo step.
An instance-owned input uses [update_component_props](update_component_props.md) rather than changing a shared implementation default.

For a supported local implementation edit, an explicit Only this choice identifies the instance and makes the necessary source owner independent before applying the change.
The independent definition, redirected instance/bindings, and requested value change commit together.
All copies keeps the shared owner and applies the update to its affected instances.
The explicit `scope` and applicable `nodeId` fields encode that choice; the tool must not infer a local edit merely from a selected layer.

Only this must copy the actual local definition path that owns the requested value.
Copying the outer component alone is insufficient when styling remains owned by a shared local child.
Preserve imports and exports, avoid binding-name collisions, and keep package primitives, shared theme tokens, and utilities shared unless their scope is explicitly changed through an accepted operation.
The accepted boundary is direct local named imports through top-level function components with a simple JSX return.
Captured module values, shadowed imports, and unsupported copying shapes fail before mutation with an explanation.
Arbitrary closure or module-graph copying is not a V1 promise.
See the owning [Only this contract](../../architecture/react-source-bindings.md#choose-edit-scope).

Shared CSS or theme inputs retain their actual scope.
Do not describe their update as instance-only if other references still use the edited owner.
Do not make an independent editable CSS/style tree to avoid resolving source ownership.

Use the [shared source and resource preparation rules](../../import-export/component-import.md#shared-source-and-resource-preparation) for package manifests/lockfiles, managed assets, stylesheet entries, Tailwind source detection, and explicit entry/export changes.
Extended resource and dependency encodings remain open; the core JSON above is unchanged.

## Candidate preparation and atomic commit

1. Resolve the intended applied source owner, scope, affected instances, expected revision, and applicable lock requirements.
2. Parse the complete candidate and resolve its supported imports and entry/export.
3. Prepare required dependencies, assets, plain CSS, Tailwind v4 source classes, and retained theme inputs under the shared component preparation rules.
4. Derive or revalidate source bindings and check existing instance props, slots, and local collection values against the candidate.
5. Validate the candidate's required initial rendering with the affected supported inputs through the shared local rendering service.
6. Commit the complete source update, changed managed records, validated bindings, instance values, and any supported independent copy together as one command, one new revision, and one Undo step.
7. Return the changed component/source owner identity, affected instance identities where appropriate, and matching applied revision in a compact result.

The core success result is recorded above; SDK/error integration remains open.
The [command engine](../../architecture/command-engine-and-history.md#command-lifecycle) owns commit authority; preparation is not a partial applied change.
An update spanning JSX and CSS either applies together or leaves both previous versions intact.
New package requirements follow the same accepted execution/runtime support policy as [Component import](../../import-export/component-import.md#direct-runtime-policy).
Prepared packages and build output remain rebuildable local data, separate from the mutation's portable design records.

## Existing inputs and binding continuity

Reject an update that removes or invalidates a required property, slot, or collection value already used by an affected instance.
Do not silently drop those values, replace them with invented defaults, or leave the component partially remapped.
Preserve a supported unbound optional value as source-editable when that does not invalidate required bindings or instance inputs.
Eligibility remains per value; this operation does not promise automatic visual editing for arbitrary new JSX or computed expressions.

Revalidate stable layer identities against the new source before old editing handles are reused.
Preserve identities only where continuity is verified; never retarget an old handle to a similar-looking element.
Formatting, reorder, replacement, and deletion follow the [existing identity and selection contract](../../architecture/react-source-bindings.md#identity-through-edits).
An uncertain selection is cleared with the existing explanation instead of being used to edit the wrong source owner.
The source remains authoritative for the component implementation; Layers reflects its accepted bindings.

## Technology and interaction preservation

Required Tailwind styles are rebuilt before commit, while authored classes and theme inputs remain saved source.
Supported semantic visual edits preserve unrelated responsive, hover, focus, and dark classes under the [Tailwind contract](../../import-export/tailwind-components.md#visual-editing-of-static-classes).
Intentional implementation edits can change those classes; a style-editing tool must not rewrite them incidentally.

Base UI-flavored shadcn wrappers retain their source, required imports, composition, and supported declared inputs.
An unfamiliar shape requires an accepted declaration or source-only boundary; V1 does not gain Radix recognition through this tool.
Motion behavior remains authored React source, and inline SVG remains vector source rather than a raster replacement.
Unrelated code and behavior are preserved unless explicitly included in the intended update.
Initial-render validation does not prove every later event, animation, or application workflow.
Preview interactions and animation progress remain temporary, and stable capture follows the existing [Motion rules](../../interface/motion.md#image-and-pdf-capture).

## Failures and repair

Parse errors, unresolved required imports or styles, unsupported runtime requirements, invalid existing inputs, required binding failures, unsafe independent copying, and failed initial rendering leave the applied design, revision, and Undo history unchanged.
No partial source-file update, component copy, or instance redirection is committed.
Identify the known file, component, package, input, or error location when reliable so the agent can repair and resubmit.
A stale revision follows the existing fresh-read/revision-conflict behavior without adding a feedback loop or editing lock.

Later runtime component errors remain diagnostics on the applied component and do not automatically reverse a successful source update.
The person can select the component and open Code, or ask the agent to read its current diagnostic and applied source through the existing read tools.
Repair is another validated source update under the [runtime repair contract](../../interface/code-window.md#runtime-component-errors).
The MCP tool neither reads nor applies private Code-window typing.

## History, saving, and export

Undo restores the previous source, related managed records, bindings, and affected instance references/values as one completed command.
Undo of Only this also reverses its independent copy and instance redirection; Redo restores that completed result through retained history.
Packages do not need to be uninstalled to reverse a design change.

Successful updates enter normal autosave with their consistent source, required style/theme inputs, assets, bindings, and exact dependency records.
Command success and disk-save success remain separate, and a save failure retains the applied work for the existing recovery flow.
Reopening uses the last valid saved bundle, not an absolute origin path or a mutable latest package tag.
React export carries the required source and styling/dependency inputs; image/PDF export captures the explicit stable design state.

## Required verification

Verify shared updates across two instances, instance-owned inputs remaining unchanged, and atomic related JSX/CSS changes.
Exercise the accepted nested-owner Only this pattern, including preservation of unrelated copies and rejection of unsupported copying before mutation.
Check existing prop/slot/collection validation, reliable identity continuity or explicit reselection, style rebuilds, Motion/SVG preservation, stale/locked targets, Undo/Redo, and save/reopen.
Submit a failing file or render candidate and verify that all prior applied source, bindings, references, revision, history, and the last valid saved project remain intact.
The [required composition proof](import_component.md#required-composition-proof) must cover this actual MCP update path.
Earlier Babel/Recast and Fedora source-mapping experiments are supporting evidence, not a passed ORC-web MCP/editor test.

# import_asset

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-05.
`import_asset` registers one chosen supported image, SVG, or font file as a reusable managed project resource.
It reuses the existing project asset service and does not place or replace a canvas object.
Core local-file JSON, typed resource results, identical-registration reuse, and no-change behavior were accepted on 2026-10-06.
Supported formats, extended transfers/font declarations, exact metadata extraction, conflict rules, and SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Request and preparation

Identify the active project, command identity, expected applied revision, chosen file, and any required supported resource metadata.
A supplied local file or transferred content must be resolvable through the accepted asset-transfer contract; exact payload forms remain open.
Inspect and validate the file's supported type and required content before registering it.
Return a useful file/type/metadata error when preparation fails instead of committing a dangling reference.
This is not arbitrary filesystem mutation, package installation, or automatic computer-wide font discovery.

| Resource | Required preparation |
| --- | --- |
| Image | Retain the supported file and metadata needed for rendering and managed references. |
| SVG | Validate and retain supported vector source as a resource; registration alone creates no editable path Layers. |
| Font | Retain the supported font file and family/weight/style metadata needed to resolve an authored font reference. |

Use reliable metadata or explicit validated declarations instead of guessing a font family from its filename.
Preserve the existing [font inclusion rules](../../interface/font-management.md#choose-and-import) for portable project and export assets.
Do not silently replace an existing font family or resource when names conflict; detailed conflict checks and registration-equivalence rules remain open.
Managed content must not depend solely on an absolute path on the original computer.

Component authoring and updates reuse these managed files under the [shared source and resource preparation rules](../../import-export/component-import.md#shared-source-and-resource-preparation).
Registration alone does not identify a component stylesheet entry or guarantee that Tailwind scans its source.

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
The core request registers one supported local file; extended transferred-content and explicit font-declaration inputs remain in the [asset implementation decisions](../../../backlog/mcp/command-contracts.md#asset-schema-implementation-decisions).

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "source": {
      "type": "object",
      "properties": {
        "kind": {"const": "local"},
        "path": {"type": "string", "minLength": 1}
      },
      "required": ["kind", "path"], "additionalProperties": false
    }
  },
  "required": ["commandId", "projectId", "expectedRevision", "source"],
  "additionalProperties": false
}
```

`source` uses the same local-file description as [image replacement](update_attributes.md#agreed-json-exchange).
The path identifies a file accessible on the computer running ORC.
The service validates the actual content and resource type, not just the filename extension or a nonempty path.
Retain required file bytes in managed project assets and return a durable asset identity; the original absolute path is not the only saved copy.
Missing/corrupt files, unsupported content, unreliable required metadata, and conflicting font registrations reject the request without changing applied records or history.
Font registration preserves the existing inclusion rules and requires reliable family/weight/style metadata; the core request does not guess missing declarations.

An identical file with identical registration metadata reuses its existing managed asset ID.
If registration changes no records, return the existing applied revision and create no Undo entry.
Validate project/revision and required content/metadata before returning reuse; filenames alone do not establish identical registrations.
Different content is not permission to overwrite an existing resource or font registration.
Exact equivalence, conflict handling, and unused-resource retention remain implementation decisions.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "assetId": {"type": "string", "minLength": 1},
    "assetType": {"type": "string", "enum": ["image", "svg", "font"]},
    "metadata": {
      "type": "object",
      "properties": {
        "mimeType": {"type": "string", "minLength": 1},
        "width": {"type": "number", "exclusiveMinimum": 0},
        "height": {"type": "number", "exclusiveMinimum": 0},
        "family": {"type": "string", "minLength": 1},
        "weight": {"type": ["number", "string"], "minimum": 1, "maximum": 1000, "minLength": 1},
        "style": {"type": "string", "minLength": 1}
      },
      "required": ["mimeType"], "additionalProperties": false
    }
  },
  "required": ["commandId", "projectId", "appliedRevision", "assetId", "assetType", "metadata"],
  "additionalProperties": false,
  "allOf": [
    {
      "if": {"properties": {"assetType": {"const": "image"}}, "required": ["assetType"]},
      "then": {"properties": {"metadata": {"required": ["width", "height"]}}}
    },
    {
      "if": {"properties": {"assetType": {"const": "font"}}, "required": ["assetType"]},
      "then": {"properties": {"metadata": {"required": ["family", "weight", "style"]}}}
    }
  ]
}
```

Return matching command/project identities, the applied revision, stable `assetId`, actual `assetType`, and applicable validated metadata.
Image dimensions describe resource metadata, not a placed object's canvas dimensions.
SVG dimensions are returned only when reliably available; registration alone creates no vector Layers.
Font weight/style values require the supported descriptor grammar; generic scalar fields do not make arbitrary strings valid.
The service validates resource-type/MIME agreement and applicable metadata; the schema alone cannot prove actual file contents or font loading.
The returned ID can be reused as `{ "kind": "managed", "assetId": "..." }` in image replacement where the resource type is compatible.
Registration places no object and assigns no image or font to an existing object.
Command success does not confirm disk saving.

### Request and response example

Register a local image:

```json
{
  "commandId": "cmd_asset_1",
  "projectId": "project_1",
  "expectedRevision": 28,
  "source": {"kind": "local", "path": "/home/eren/Pictures/product.webp"}
}
```

Successful new-registration result, assuming a supported 1600 by 900 image:

```json
{
  "commandId": "cmd_asset_1",
  "projectId": "project_1",
  "appliedRevision": 29,
  "assetId": "asset_product_1",
  "assetType": "image",
  "metadata": {"mimeType": "image/webp", "width": 1600, "height": 900}
}
```

A later request with a new command ID and current revision can reuse that registration when content and metadata are identical.
Its response retains the existing asset ID and unchanged revision if no records change.
These examples describe the agreed exchange, not executed MCP/editor behavior.

## Using the registered resource

Return the managed asset ID/reference, relevant supported metadata, and applied revision in a compact result.
The agent can reuse it in accepted HTML/component authoring or image replacement under the corresponding tool's resource rules.
[update_attributes](update_attributes.md) retains supported image-source changes; `insert_html` and component import retain their own placement responsibilities.
Importing a resource and placing it in two separate calls creates separate completed commands.
Component/HTML import and image replacement still prepare their required assets atomically when supplied directly; this standalone call is not a mandatory preliminary step.

A font registration must make the chosen supported font usable by authored family/style references in ordinary HTML/CSS and React rendering, including the required font-to-CSS projection.
It must not require constructing a dummy React component merely to register a font for ordinary text.
Registration does not assign a new font family to objects, although existing matching references can begin using the newly available font and reflow normally.
It does not rewrite font size to preserve old wrapping.
The human font picker/import/replacement and Replace SVG controls retain their [V1.1 schedule](../../../backlog/properties-panel-v1x.md#v11-properties-controls).
Standalone `list_fonts` remains [outside MCP V1](../../../backlog/mcp/tool-release-scope.md#standalone-font-listing).

## Commit, failure, and history

Prepare the file and required metadata, validate the complete candidate and any required rendering, then commit the asset/font registration and coupled records together through the [command engine](../../architecture/command-engine-and-history.md#command-lifecycle).
One new or changed registration is one command, one applied revision, and one application Undo step.
An entirely unchanged identical registration follows the no-change result above.
Failed preparation, invalid metadata, stale revision, unsupported format, or required-render failure leaves applied records and history unchanged.
Required temporary files must not overwrite prior applied resources during preparation.

Undo restores the prior registration state; Redo restores the accepted resource identities and metadata.
Retain content needed by applied references, the last valid save, or retained application history rather than immediately deleting bytes when a registration is undone.
Exact unused-resource retention and registration-equivalence checks remain implementation decisions.
Normal save/autosave records required managed files and metadata under the [workspace bundle](../../architecture/orc-workspace-bundle.md#managed-dependencies).
Untitled projects can register resources before first Save; command success does not mean disk-save success.
Complete export carries required registered resources under the existing exporter.

## Implementation verification still required

- Register an image, SVG, and supported font, then reuse their returned references through the actual authoring/editing tools.
- Register a font for ordinary HTML/CSS and React text; verify font loading, metadata, wrapping, and source/export references without dummy component creation.
- Verify family/resource name conflicts, unsupported/corrupt files, missing transfers, stale requests, and whole-call failure without committed residue.
- Verify reuse does not duplicate placements or package installs and preserves font inclusion and human-control release boundaries.
- Check metadata/type agreement, identical content with identical metadata, changed content at the same path, filename-only matches, unchanged revision/history on reuse, and stale reuse requests.
- Exercise application Undo/Redo, retained-resource references, Untitled first Save, portability, save/reopen, and complete export on Fedora and Windows.

These are required implementation checks, not passed application tests.
Static schema checks do not prove content detection, metadata extraction, identical-registration reuse, font loading, resource retention, or persistence.

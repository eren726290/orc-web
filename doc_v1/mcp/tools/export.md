# export

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`export` writes complete supported output for an explicitly requested design scope.
One public tool handles the supported formats through the existing application exporter.
Core target/format/destination schemas, capture options, and compact result fields are accepted below.
Detailed naming, format settings, multi-file publication, and production implementation remain open.
The running ORC-web MCP tool has not been verified.

## Request and output scope

The agent supplies stable object/frame targets or another supported bounded export scope, the format, a local destination, and applicable options.
Use [get_context](get_context.md) for root/selection targets, [get_tree](get_tree.md) for nested targets, and [get_node](get_node.md) for detailed export capabilities.
The request identifies the applied revision it intends to export; resolve one coherent revision for the complete output.
Unapplied Code drafts and temporary Preview interactions are excluded.
Core targets follow submitted order; extended bounded scopes, detailed geometry, and error integration remain open.

One object or frame produces one output.
Several compatible targets produce separate outputs by default where the format supports them, with combination only where supported.
PDF combines the selected targets into one document with one target per page.
These are the existing [application export rules](../../import-export/export.md#human-flow), not a new multi-selection editing feature.

## Agreed JSON exchange

Core target/format/destination schemas and examples accepted on 2026-10-06.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
This is file output from one applied revision, not a design mutation.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type":"string","minLength":1},
    "expectedRevision": {"type":"integer","minimum":0},
    "nodeIds": {"type":"array","minItems":1,"items":{"type":"string","minLength":1},"uniqueItems":true},
    "format": {"type":"string","enum":["react","html","png","jpeg","webp","avif","pdf"]},
    "destination": {
      "type": "object",
      "properties": {"kind":{"type":"string","enum":["file","directory"]},"path":{"type":"string","minLength":1}},
      "required": ["kind","path"],
      "additionalProperties": false
    },
    "options": {
      "type": "object",
      "properties": {
        "styling": {"type":"string","enum":["css","tailwind"]},
        "combine": {"type":"boolean"},
        "background": {"type":"string","minLength":1},
        "mode": {"type":"string","enum":["light","dark"]},
        "states": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "properties": {"nodeId":{"type":"string","minLength":1},"state":{"type":"string","minLength":1}},
            "required": ["nodeId","state"],
            "additionalProperties": false
          },
          "uniqueItems": true
        }
      },
      "additionalProperties": false
    }
  },
  "required": ["projectId","expectedRevision","nodeIds","format","destination"],
  "additionalProperties": false,
  "allOf": [
    {
      "if": {"properties":{"format":{"const":"react"}},"required":["format"]},
      "then": {"required":["options"],"properties":{"options":{"required":["styling"]}}}
    },
    {
      "if": {"properties":{"format":{"enum":["react","html"]}},"required":["format"]},
      "then": {
        "properties": {
          "destination": {"properties":{"kind":{"const":"directory"}}},
          "options": {"properties":{"combine":false,"background":false,"mode":false,"states":false}}
        }
      }
    },
    {"if":{"properties":{"format":{"const":"html"}},"required":["format"]},"then":{"properties":{"options":{"properties":{"styling":false}}}}},
    {
      "if": {"properties":{"format":{"enum":["png","jpeg","webp","avif","pdf"]}},"required":["format"]},
      "then": {"properties":{"options":{"properties":{"styling":false}}}}
    },
    {
      "if": {"properties":{"format":{"const":"jpeg"}},"required":["format"]},
      "then": {"required":["options"],"properties":{"options":{"required":["background"]}}}
    },
    {
      "if": {"properties":{"format":{"const":"pdf"}},"required":["format"]},
      "then": {"properties":{"destination":{"properties":{"kind":{"const":"file"}}},"options":{"properties":{"combine":false}}}}
    },
    {
      "if": {"properties":{"format":{"enum":["png","jpeg","webp","avif"]}},"required":["format"]},
      "then": {
        "if": {
          "properties": {"nodeIds":{"minItems":2}},
          "required": ["nodeIds"],
          "not": {"required":["options"],"properties":{"options":{"required":["combine"],"properties":{"combine":{"const":true}}}}}
        },
        "then": {"properties":{"destination":{"properties":{"kind":{"const":"directory"}}}}},
        "else": {"properties":{"destination":{"properties":{"kind":{"const":"file"}}}}}
      }
    }
  ]
}
```

Require the active `projectId`, `expectedRevision`, ordered nonempty `nodeIds`, supported `format`, and explicit `destination`.
Reject missing or duplicate targets and ancestor/descendant overlaps before producing output.
Preserve submitted order for separate outputs and PDF pages.
A stale revision, incompatible scope, or unsupported format receives a useful failure rather than exporting a different revision or substituting a flattened design.
Arbitrary workspace-region export encoding remains implementation work; the core schema uses stable object/frame targets while `get_screenshot` already accepts inspection regions.

| Format | Destination and options |
| --- | --- |
| `react` | Directory; require `options.styling` as `css` or `tailwind`. |
| `html` | Directory containing supported static HTML, required CSS, and resources. |
| `png`, `jpeg`, `webp`, `avif` | File for one target or a supported combined capture; directory for several separate target images. |
| `pdf` | File; one submitted target per page, always combined into one document. |

`destination.path` identifies a location on the computer running ORC, not the agent's other computer.
The shared exporter validates paths, destination membership, complete naming, and required publication before writing.
Code bundles include required source/styles/assets/token or theme inputs/dependency information; `outputs` is not permission to omit necessary files.

For raster images, omitted `options.combine` means false.
When several targets are combined, validate the shared capture scope and preserve their relative layout; unsupported combinations fail.
PDF follows its mandatory page rule without a `combine` field.
Code formats do not accept raster combination or capture-state options.
The core schema rejects format-inapplicable option keys rather than silently ignoring them.

Raster/PDF `options.mode` can request a temporary Light or Dark capture mode; omission retains the targets' saved effective modes, including different modes across frames.
`options.states` reuses the screenshot tool's supported named-state descriptors.
Validate target membership, repeated state IDs, supported names, and reliable stable-state ownership through the shared capture service.
Resolve a supported stable default when a state is omitted, or request an explicit supported state when required.
Capture overrides do not change saved frame modes, component inputs, source, or the person's Preview state.
JPEG requires `options.background`, validated as a supported opaque color; the string schema alone does not establish opacity or accepted color grammar.
Background compositing, other raster settings, size limits, density, PDF sizing, and publication details remain in the [export implementation decisions](../../../backlog/mcp/command-contracts.md#export-implementation-decisions).

### Output schema

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type":"string","minLength":1},
    "appliedRevision": {"type":"integer","minimum":0},
    "nodeIds": {"type":"array","minItems":1,"items":{"type":"string","minLength":1},"uniqueItems":true},
    "format": {"type":"string","enum":["react","html","png","jpeg","webp","avif","pdf"]},
    "outputs": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {"kind":{"type":"string","enum":["file","directory"]},"path":{"type":"string","minLength":1}},
        "required": ["kind","path"],
        "additionalProperties": false
      },
      "uniqueItems": true
    },
    "warnings": {"type":"array","items":{"type":"string","minLength":1}}
  },
  "required": ["projectId","appliedRevision","nodeIds","format","outputs","warnings"],
  "additionalProperties": false
}
```

Return matching project identity, the exported applied revision, submitted target order, format, completed output paths, and known warnings.
`outputs` lists completed top-level files or bundle directories rather than every file inside a code bundle.
Report known supported limitations such as fallback fonts in `warnings`; unsupported or failed exports remain errors, not successful warning-only substitutes.
The service verifies output kinds, destination relationships, ordering, and complete required contents; the shape alone cannot prove publication or portable output.
Export does not change the applied revision or create a document Undo entry.

### Request and response examples

Export a complete React/Tailwind bundle:

```json
{
  "projectId": "project_1",
  "expectedRevision": 32,
  "nodeIds": ["frame_1"],
  "format": "react",
  "destination": {"kind":"directory","path":"/home/eren/Exports/landing-page"},
  "options": {"styling":"tailwind"}
}
```

Successful structured result after required saving and complete publication:

```json
{
  "projectId": "project_1",
  "appliedRevision": 32,
  "nodeIds": ["frame_1"],
  "format": "react",
  "outputs": [{"kind":"directory","path":"/home/eren/Exports/landing-page"}],
  "warnings": []
}
```

Export two frames into one PDF, preserving their submitted page order:

```json
{
  "projectId": "project_1",
  "expectedRevision": 32,
  "nodeIds": ["frame_1","frame_2"],
  "format": "pdf",
  "destination": {"kind":"file","path":"/home/eren/Exports/design-variants.pdf"}
}
```

Successful structured result:

```json
{
  "projectId": "project_1",
  "appliedRevision": 32,
  "nodeIds": ["frame_1","frame_2"],
  "format": "pdf",
  "outputs": [{"kind":"file","path":"/home/eren/Exports/design-variants.pdf"}],
  "warnings": []
}
```

These schemas/examples describe accepted exchanges, not executed MCP/editor behavior.

## Formats and required contents

| Format | Required output |
| --- | --- |
| React | Required component source, CSS or Tailwind styling, managed assets, token/theme inputs, and dependency information. |
| HTML/CSS | Faithful supported static output with its required styles and resources. |
| PNG, JPEG, WebP, or AVIF | A rendered image using the applicable capture options; JPEG requires an explicit background. |
| PDF | A paged capture under the existing selected-item rules. |

For React, identify CSS or Tailwind as the requested styling option.
Canonical ordinary styles and tokens can generate readable Tailwind utilities, with supporting CSS where a utility cannot preserve the appearance.
Authored React/Tailwind source follows the [source-preserving contract](../../import-export/tailwind-components.md), including required theme/toolchain information.
Base UI/shadcn, Motion, and SVG remain part of the exported component's required source and resources rather than separate export tools.

Static HTML/CSS export must explain when the requested live component cannot be represented faithfully.
Do not report a source excerpt or a flattened substitute as a complete supported code export.
Include the resources needed by the selected scope under the shared exporter rules.
Project-font inclusion and installed-font fallback follow the [existing font export rules](../../import-export/export.md#fonts); this does not add deferred font controls.
Required saved token modes, existing Typography values, Dark overrides, and imported theme inputs remain preserved.

## Image and PDF state

Specify the supported design mode and named component state needed for the requested capture.
Use the shared stable Motion appearance with time progression disabled, excluding editor panels, selection outlines, handles, and constraint indicators.
An explicitly requested open dialog or menu does not change its saved default or the person's editor view.
The [shared capture contract](../../import-export/export.md#workspace-image-output) owns rendering and bounds.
The [local rendering service](../../architecture/system-architecture.md#local-rendering-service) can capture with the editor tab closed when the active project and renderer are available.
Code formats use the code exporter and do not require image capture merely to produce source.

## Saving, publication, and result

Reuse the existing exporter and [reliability rules](../../import-export/export.md#reliability).
Finish required pending saving before publishing success, then write complete temporary output before replacing the destination.
A failed required save, unsupported scope/format, missing required resource, failed rendering, or cancellation must not publish a successful substitute output.
Failure or cancellation preserves the applied design and an existing destination.
An Untitled project must complete its first Save through the browser before MCP file export.
Return a useful Save project first condition without choosing a project name/location or publishing export output.
The [first-save workflow](../../architecture/orc-workspace-bundle.md) remains separate from the requested export destination.
For a saved project, finish required pending saving for the coherent exported revision before publication.
Directory publication, file naming, and several-file failure recovery must be verified before implementation claims.

Return the completed output paths, format/scope, exported revision, and applicable known output limitations such as font fallback.
Use the compact result schema above; return success only after all required outputs are complete.
Export does not edit the design, increment its revision, or create a document Undo entry.
Any required saving still follows the normal project persistence rules.

[get_source](get_source.md) inspects applied source, while [get_screenshot](get_screenshot.md) returns an inspection image without invoking file publication.
Exporting code does not itself integrate it into an application or open a pull request; the [application integration workflow](../../import-export/export.md#agent-led-application-integration) has its own checkpoints.

## Required verification

Export an ordinary object/frame and a supported mixed React/Tailwind/Base UI/Motion/SVG composition through the actual MCP endpoint.
Verify generated CSS/Tailwind, authored source preservation, required tokens/themes/assets/dependencies, static-format refusal, and font fallback reporting.
Check each supported raster format and PDF, stable named states, design modes, inherited styling, overlay exclusion, and multiple-target file/page handling.
Verify revision consistency with a private Code draft open and image/PDF capture with the editor tab closed.
Exercise required save failure, invalid/unavailable destinations, resource/render failures, cancellation, and unchanged prior destination/design/history.
Record actual output and Chrome evidence on Fedora and Windows, including the finalized directory and multi-file publication behavior.
These are required implementation checks, not passed MCP export tests.

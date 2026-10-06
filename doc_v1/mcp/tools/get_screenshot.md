# get_screenshot

## Status and purpose

Accepted V1 visual inspection responsibility, recorded on 2026-10-04.
`get_screenshot` returns a rendered image of a requested supported object, frame, or bounded workspace scope.
The same tool covers a Get started button, its containing Hero section, and a whole landing-page frame.
It reuses the existing local rendering/capture service across HTML/CSS, SVG, supported React, Tailwind, and Motion.
Core scope/state JSON and PNG metadata schemas are accepted below.
Resolution limits, detailed crop/render-state rules, and production SDK integration remain implementation decisions.
The running ORC-web MCP tool has not been verified.

## Requested scope and returned image

Use [get_context](get_context.md) for root/selection targets or [get_tree](get_tree.md) for nested targets before capture.
Request one supported object/frame or an explicitly bounded workspace scope; an infinite workspace is not an unbounded image request.
Ordinary IDs and reliably identified source-backed layers can be capture targets when the renderer can locate their supported bounds.
Arbitrary runtime DOM selectors are not stable capture identities.
Capture a container with its included children rather than only its empty outer rectangle.

Return the rendered image, scope/target identity, and the applied revision represented by that capture.
Preserve the target's resolved styles, inherited context, text, assets, SVG, and supported design mode.
Capturing a button must not lose styling merely because its ancestors are outside the crop.
Exact treatment of overflowing content, clipped bounds, transforms, background, and image dimensions must be defined under the shared renderer's accepted rules.
Do not present a cropped or unavailable result as a complete requested capture.

## Agreed JSON exchange

Core target/region JSON, PNG metadata, and supported named-state inputs accepted on 2026-10-06.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
The tool returns one inspection image, not a saved export file.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "nodeId": {"type":"string","minLength":1},
    "region": {
      "type": "object",
      "properties": {"x":{"type":"number"},"y":{"type":"number"},"width":{"type":"number","exclusiveMinimum":0},"height":{"type":"number","exclusiveMinimum":0}},
      "required": ["x","y","width","height"],
      "additionalProperties": false
    },
    "expectedRevision": {"type":"integer","minimum":0},
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
  "additionalProperties": false,
  "oneOf": [{"required":["nodeId"],"not":{"required":["region"]}},{"required":["region"],"not":{"required":["nodeId"]}}]
}
```

Supply exactly one `nodeId` or `region`.
`nodeId` addresses a supported object, container, or frame by stable editor identity.
`region` is a finite rectangle in unzoomed workspace CSS pixels; signed and fractional coordinates are allowed, with positive width and height.
A region may cover several frames or designs and includes the requested area rather than only the user's selected objects.
An empty request, both scopes together, arbitrary DOM selectors, and an unbounded workspace request are rejected.

Optional `expectedRevision` pins the applied revision; otherwise report the current applied revision actually captured.
Preparation must preserve the represented revision rather than relabeling stale rendering as current.
Optional `states` supplies supported named component states, for example `[{"nodeId":"dialog_1","state":"open"}]`.
Address the relevant supported component instance inside the capture scope; reject repeated target IDs, conflicting states, unknown names, or unavailable state ownership.
Array `uniqueItems` rejects exact duplicates; duplicate IDs with different names require service validation.
These are temporary capture inputs, not component-property or source mutations.
Resolve omitted state choices to a supported defined stable default under the existing Motion/capture service.
Require an explicit supported state or return a useful error when a stable default cannot be produced; never borrow the person's transient Preview state.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type":"string","minLength":1},
    "appliedRevision": {"type":"integer","minimum":0},
    "nodeId": {"type":"string","minLength":1},
    "region": {
      "type": "object",
      "properties": {"x":{"type":"number"},"y":{"type":"number"},"width":{"type":"number","exclusiveMinimum":0},"height":{"type":"number","exclusiveMinimum":0}},
      "required": ["x","y","width","height"],
      "additionalProperties": false
    },
    "image": {
      "type": "object",
      "properties": {"mimeType":{"const":"image/png"},"width":{"type":"integer","minimum":1},"height":{"type":"integer","minimum":1}},
      "required": ["mimeType","width","height"],
      "additionalProperties": false
    },
    "renderState": {
      "type": "object",
      "properties": {
        "animation": {"const":"still"},
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
      "required": ["animation"],
      "additionalProperties": false
    }
  },
  "required": ["projectId","appliedRevision","image","renderState"],
  "additionalProperties": false,
  "oneOf": [{"required":["nodeId"],"not":{"required":["region"]}},{"required":["region"],"not":{"required":["nodeId"]}}]
}
```

Return matching `projectId`/`appliedRevision` and exactly the requested `nodeId` or `region`.
`image` contains metadata for the actual PNG: MIME type and positive integer pixel dimensions.
The PNG bytes accompany this metadata as an MCP image content block with `type: "image"`, base64 `data`, and `mimeType: "image/png"`.
`structuredContent` holds this metadata under the output schema; do not repeat image bytes in JSON or substitute a file path for the image.
The [SDK documentation](https://ts.sdk.modelcontextprotocol.io/v2/llms-full.txt) describes image content blocks and structured results.
SDK protocol wrapping remains separate from these application metadata examples.

`renderState.animation` identifies the defined still appearance.
Include `renderState.states` when supported named component states are resolved, reporting the actual names used, including stable defaults where applicable.
Omit that array for captures without applicable component states.
Saved effective design modes remain part of the represented applied design, including different modes in a multi-frame region.
Capture does not change frame modes or recolor literal styles.

PNG is the core inspection format; scale/density, actual target crop boxes, backgrounds, and supported image-size limits remain [implementation decisions](../../../backlog/mcp/command-contracts.md#screenshot-implementation-decisions).
Enforce chosen limits before returning a successful image; reject excessive captures instead of silently reducing resolution, cropping requested content, or returning a partial substitute.
Pixel dimensions are actual output dimensions and must not be confused with CSS width/height or workspace zoom.
Validate supported target bounds, transforms, overflow, and clipping through the shared renderer before claiming complete target coverage.
A requested region is intentionally a crop; its requested boundaries must not be silently narrowed.

### Request and response examples

Inspect a supported button at a known revision:

```json
{
  "nodeId": "button_1",
  "expectedRevision": 32
}
```

Successful structured metadata, accompanied by the actual PNG image content block:

```json
{
  "projectId": "project_1",
  "appliedRevision": 32,
  "nodeId": "button_1",
  "image": {
    "mimeType": "image/png",
    "width": 160,
    "height": 48
  },
  "renderState": {
    "animation": "still"
  }
}
```

Inspect a workspace area containing several designs:

```json
{
  "region": {
    "x": 0,
    "y": 0,
    "width": 3200,
    "height": 1000
  },
  "expectedRevision": 32
}
```

Successful structured metadata, assuming the capture is within configured limits and uses one image pixel per CSS pixel:

```json
{
  "projectId": "project_1",
  "appliedRevision": 32,
  "region": {
    "x": 0,
    "y": 0,
    "width": 3200,
    "height": 1000
  },
  "image": {
    "mimeType": "image/png",
    "width": 3200,
    "height": 1000
  },
  "renderState": {
    "animation": "still"
  }
}
```

These schemas/examples describe accepted shapes, not executed MCP/editor behavior.

## Applied state and capture choices

Capture current applied state, including successful commands that are awaiting autosave.
Unapplied Code typing is excluded.
Identify the matching revision; when an expected revision is supplied, satisfy that request or report a conflict/unavailable capture rather than label another revision as requested.
Capture does not require saving a new project merely to inspect its appearance.
The separate file-export save/publish contract still applies to exported artifacts.

Exclude editor panels, selection outlines, resize handles, constraint indicators, and other editor overlays.
Use a defined stable still appearance for Motion instead of an arbitrary in-progress animation frame.
An explicitly requested supported component state may reveal a dialog or menu without changing the saved default or the person's current browser view.
The [capture contract](../../import-export/export.md#workspace-image-output) and [Motion contract](../../interface/motion.md) own stable appearance and supported states.
If the requested state cannot be produced reliably, explain the limitation rather than fabricate the image.

## Shared rendering and read behavior

Use the [local rendering service](../../architecture/system-architecture.md#local-rendering-service) with the requested revision's prepared source, styles, inputs, and resources.
The service uses the same design boundaries and rendering code as the visible editor.
The backend can capture with the editor tab closed when the active project and required renderer are available.
Temporary rendering state is discarded after capture.

This read changes no design values, selection, browser Preview state, document revision, or Undo history.
It returns an image for inspection through MCP; complete file output belongs to the export workflow.
The agent requests images when visual review is useful, with no automatic screenshot feedback loop.
Unavailable targets/bounds, unresolved assets, missing Chrome, failed preparation, or failed capture return a useful failure without a successful substitute image.
Response-size limits and bounded capture must be chosen before promising arbitrarily large images.

## Required verification

Capture a button, a nested section, a full frame, and a bounded workspace with multiple designs through the actual MCP endpoint.
Verify correct image/target/revision, inherited styling, meaningful bounds, text/images/SVG, and supported React/Tailwind/Motion rendering.
Check stable animation appearance, an explicitly supported open dialog/menu, design modes, clipping, transformed bounds, and editor-overlay exclusion.
Capture after an applied edit before autosave, with a private Code draft open, in an Untitled project, and with the browser editor tab closed.
Verify unchanged document/history/view state, stale/unavailable targets, missing renderer/resources, and explicit handling of bounded output.
Record Chrome evidence on Fedora and Windows.
These are required implementation checks, not passed screenshot tests.

# get_computed_styles

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-05.
`get_computed_styles` reads explicitly requested browser-resolved styles and rendered bounds for supported targets.
It takes over measurements previously placed in `get_context`.
Core JSON property/bounds selection and result fields are accepted below.
Detailed supported property grammar, geometry mapping, stable render-state handling, limits, and SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Request and actual rendering

Identify the active project, stable target, requested CSS properties or bounds, and any supported revision/render-state requirements.
Use [get_node](get_node.md) for authored values and sizing rules rather than requiring browser rendering for those reads.
This tool obtains actual layout through the existing [browser measurement](../../architecture/system-architecture.md#browser-measurements) and [local rendering service](../../architecture/system-architecture.md#local-rendering-service).
It does not invent computed layout from canonical values or create another renderer.

Measurements must use the represented applied revision, prepared styles, supported inputs, frame size, and saved mode.
Return the project identity, applied revision, render state used, requested results, units, and coordinate reference.
Distinguish document geometry from viewport bounds affected by zoom and define transformed/clipped reference boxes before claiming those combinations.
Exclude editor overlays and temporary drag feedback or private Preview inputs from applied-design measurements.
Ordinary reads remain available through the other tools when measurement requires an unavailable renderer.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
Supported property grammar, transformed/clipped geometry mapping, detailed render-state handling, limits, and production SDK/error integration remain implementation decisions.

### Input schema

Require a stable `nodeId` and an explicit request for properties, bounds, or both.
Omitted `includeBounds` means false; the service applies that default rather than mutating the caller's arguments.
`properties` requests only the named supported CSS properties, such as `display`, `width`, and `gap`.
Do not automatically return every browser property.

```json
{
  "type": "object",
  "properties": {
    "nodeId": {"type": "string", "minLength": 1},
    "properties": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}, "uniqueItems": true},
    "includeBounds": {"type": "boolean", "default": false},
    "expectedRevision": {"type": "integer", "minimum": 0}
  },
  "required": ["nodeId"],
  "additionalProperties": false,
  "anyOf": [{"required": ["properties"]}, {"required": ["includeBounds"], "properties": {"includeBounds": {"const": true}}}]
}
```

Optional `expectedRevision` pins the applied revision to be measured.
Without it, identify the actual current applied revision represented by the measurement.
Revision changes during preparation must be handled under the shared revision rules; do not label old rendering as new state.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "styles": {"type": "object", "additionalProperties": {"type": "string"}},
    "bounds": {
      "type": "object",
      "properties": {
        "x": {"type": "number"},
        "y": {"type": "number"},
        "width": {"type": "number", "minimum": 0},
        "height": {"type": "number", "minimum": 0},
        "unit": {"const": "px"},
        "coordinateSpace": {"const": "workspace"},
        "box": {"const": "border_box"}
      },
      "required": ["x", "y", "width", "height", "unit", "coordinateSpace", "box"],
      "additionalProperties": false
    },
    "renderState": {
      "type": "object",
      "properties": {
        "frameId": {"type": "string", "minLength": 1},
        "frameSize": {
          "type": "object",
          "properties": {"width": {"type": "number", "minimum": 0}, "height": {"type": "number", "minimum": 0}},
          "required": ["width", "height"],
          "additionalProperties": false
        },
        "viewportSize": {
          "type": "object",
          "properties": {"width": {"type": "number", "exclusiveMinimum": 0}, "height": {"type": "number", "exclusiveMinimum": 0}},
          "required": ["width", "height"],
          "additionalProperties": false
        },
        "mode": {"type": "string", "enum": ["light", "dark"]},
        "animation": {"const": "still"}
      },
      "required": ["viewportSize", "mode", "animation"],
      "additionalProperties": false,
      "allOf": [{"if": {"required": ["frameId"]}, "then": {"required": ["frameSize"]}}, {"if": {"required": ["frameSize"]}, "then": {"required": ["frameId"]}}]
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
    "complete": {"type": "boolean"}
  },
  "required": ["projectId", "appliedRevision", "nodeId", "styles", "renderState", "unavailable", "complete"],
  "additionalProperties": false,
  "allOf": [
    {"if": {"properties": {"complete": {"const": true}}, "required": ["complete"]}, "then": {"properties": {"unavailable": {"maxItems": 0}}}},
    {"if": {"properties": {"unavailable": {"minItems": 1}}, "required": ["unavailable"]}, "then": {"properties": {"complete": {"const": false}}}}
  ]
}
```

Return browser-resolved strings only for requested, available properties.
A CSS dimension includes its unit, such as `960px`; the measured string does not replace an authored Fill rule or token reference.
For bounds-only reads, `styles` is an empty object.
Omit `bounds` when not requested or unavailable; do not invent a visible rectangle for a non-rendered object.

Bounds use the declared border box in unzoomed workspace CSS pixels.
CSS width and border-box width retain their own meanings and must not be assumed to match when box sizing, padding, or borders differ.
Transformed and clipped targets require verified reference-box and coordinate mapping before these bounds can be claimed.
If the requested mapping is unsupported, report bounds as unavailable rather than silently returning a different box.
The reference-box encoding is a wire projection, not a new saved geometry authority.

`renderState` identifies the actual effective Light/Dark mode, browser viewport, applicable containing-frame dimensions, and supported stable animation appearance used.
For a loose target without a containing frame, omit both frame fields rather than inventing a frame.
A narrow frame is not automatically a narrow browser viewport; preserve their actual dimensions under the [workspace rendering rules](../../interface/workspace-and-canvas.md#implementation-requirements-and-research).
Use applied inputs and saved modes, excluding private Preview changes.
A stable animation state follows the [Motion contract](../../interface/motion.md#editing-while-motion-is-visible); an unsupported custom loop must not be described as frozen.
Do not change the person's view to obtain this temporary rendering state.

`unavailable` identifies each requested missing property or bounds and its known reason.
Missing requested information requires `complete: false`; complete results have an empty unavailable list.
A limited result can also be incomplete without claiming unavailable browser values; explain the known limit rather than masquerading as complete.
If the renderer, target, or requested stable state is wholly unavailable, return a useful tool error.
Detailed partial/limit descriptors and deadlines remain open; never substitute authored values for missing browser results.

### Request and response examples

Arguments:

```json
{"nodeId": "hero_1", "properties": ["display", "width", "gap"], "includeBounds": true}
```

Successful structured result:

```json
{
  "projectId": "project_1",
  "appliedRevision": 12,
  "nodeId": "hero_1",
  "styles": {"display": "flex", "width": "960px", "gap": "24px"},
  "bounds": {"x": 120, "y": 80, "width": 960, "height": 360, "unit": "px", "coordinateSpace": "workspace", "box": "border_box"},
  "renderState": {
    "frameId": "frame_1",
    "frameSize": {"width": 1440, "height": 900},
    "viewportSize": {"width": 1600, "height": 1000},
    "mode": "light",
    "animation": "still"
  },
  "unavailable": [],
  "complete": true
}
```

Arguments for bounds only at a known revision:

```json
{"nodeId": "hero_1", "includeBounds": true, "expectedRevision": 12}
```

Reading preserves design values, frame modes, selection, scroll, viewport, Preview state, revision, and history.

## Authored and resolved values

Separate measured or computed results from authored values.
An authored Fill width remains Fill in `get_node` even when this tool measures 320 px.
A token reference remains a reference even when the resolved CSS color is reported here.
Computed CSS does not become a new saved style owner or prove that a visual edit is supported.
Use [get_source](get_source.md) to inspect the actual source owner where needed.

Locked or authored-hidden targets can be inspected only to the extent the renderer can supply meaningful requested values.
For example, a non-rendered object's bounds may be unavailable; do not substitute invented visible geometry.
Reading does not unlock or reveal objects, alter frame modes, scroll the person's frame, or change their selection.

## Consistency and failure

Follow the [shared read rules](../read-tools.md#shared-read-behavior).
A result from another revision must not be presented as a measurement of the current revision.
An applied edit awaiting autosave belongs to the render inputs rather than the older saved file.
Missing Chrome/renderer access, failed preparation, missing targets, unsupported requests, or unavailable properties must produce an explicit recoverable condition.
Do not silently substitute authored values for computed results or present an incomplete result as complete.
Detailed partial/limit descriptors and tool-error encoding remain open; the core unavailable/completeness fields are recorded above.
Reads do not increment the revision, change saved design/view state, or create an Undo entry.
Closed-tab measurement follows the existing background-renderer availability contract, not a requirement to keep the human's browser open.

## Implementation verification still required

- Measure ordinary HTML/CSS, SVG, supported React, Tailwind, and Motion content through the shared renderer at an identified revision.
- Check Fixed/Fit/Fill, constraints, Flex wrapping, zoom, transforms, clipping, inherited styles, and saved frame modes against actual browser results.
- Distinguish authored tokens/classes/sizing from resolved CSS and include units, coordinate references, and represented render state.
- Verify before-autosave inputs, revision changes during preparation, missing/hidden targets, and unavailable renderer/property results.
- Verify stable render-state handling, closed-tab operation, and unchanged project, selection, viewport, scroll, Preview state, and history.

These are required implementation checks, not passed application tests.

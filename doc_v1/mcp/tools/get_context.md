# get_context

## Status and purpose

Accepted V1 responsibilities, first recorded on 2026-10-03 and organized into this dedicated contract on 2026-10-04.
`get_context` gives an agent a focused overview of the current applied project before choosing what to inspect or change.
Responsibilities were narrowed on 2026-10-05 when object, hierarchy, token, and measurement reads received dedicated tools.
Core JSON inputs/results and examples were accepted on 2026-10-05 and are recorded below.
Overview limits, diagnostic details, and production SDK/error integration remain implementation decisions.
The running ORC-web tool has not been tested.

## Requested scope

The agent reads a compact overview of the active project and, when requested, a relevant frame or component summary.
Use stable object or supported source-binding identities when requesting a known target.
The tool helps locate frames and loose root objects without requiring the person to select each one in the browser first.
For example, refining a dashboard needs its frame and relevant content, not every source file in the project.
Detailed values, nested hierarchy, token definitions, and browser measurements use the focused tools below.
This overview does not require a browser render.

Any available browser selection is contextual information.
It is not the authority for a source owner or a substitute for explicit stable targets.
An unavailable selection or browser view must be identified rather than invented.
Server-owned project context remains available with the editor tab closed while the backend has an active project.

## Returned context

| Information | Required meaning |
| --- | --- |
| Project identity and applied revision | Identify the active project and the applied state represented by this response. |
| Project save status | Identify whether a save location exists and report Not saved, Saving, Saved, or Save failed under the existing project lifecycle; include the last successfully written revision when available. |
| Workspace overview | Identify frames and loose root objects in saved order for the requested overview. |
| Available selection | Identify current selected stable targets when browser selection is available, keeping it distinct from saved design state. |
| Stable editing targets | Supply generated canonical IDs or accepted source-binding IDs usable by later commands. |
| Supported editing capabilities | Summarize available project operations and known scope restrictions; detailed per-object capabilities belong in `get_node`. |
| Relevant diagnostics | Supply current known component diagnostics, including their affected scope and whether they concern candidate application or later runtime interaction. |

Names help the agent read the design, while IDs distinguish editing targets.
Two rows named Heading remain two objects.
Overview identities follow canonical nodes and accepted component bindings, as defined by [Layers panel](../../interface/layers-panel.md#one-hierarchy).
Arbitrary runtime DOM descendants do not automatically become editable targets.
An object's capabilities must reflect reliable value ownership and applicable lock rules.
Visible browser content alone is insufficient evidence that a requested mutation is supported.

Keep the response focused on the requested work.
Exact overview limits remain open; identify bounded summaries rather than implying a complete nested tree.
This tool covers the historical project-information and selection candidates without separate `get_document_info` or `get_selection` tools.
Known diagnostics are reads, not a fresh whole-project validation scan.
Use [get_source](get_source.md) for the applied code needed to understand or change a supported owner.

## Focused read tools

| Need | Tool |
| --- | --- |
| One object's authored values, sizing rules, saved settings, and edit ownership | [get_node](get_node.md). |
| Ordered children or a nested editable hierarchy | [get_tree](get_tree.md), including shallow direct-child reads. |
| Registered token definitions and supported reference information | [list_design_tokens](list_design_tokens.md). |
| Requested browser-resolved CSS and rendered bounds | [get_computed_styles](get_computed_styles.md). |
| Applied code and its source owner | [get_source](get_source.md). |

Each tool shares the same active project and applied-read rules.
Separate public responsibilities do not create separate backend project state.
Do not add all these results to every overview response.

## Agreed JSON exchange

Core request and successful-result fields accepted on 2026-10-05.
Tool schemas are written as JSON Schema, with JSON argument and structured-result examples below.
The [shared JSON rules](../read-tools.md#json-schemas-and-examples) define SDK wrapping, schema authority, and the distinction between these read results and saved document fields.
Response limits, diagnostic-row encoding, and remaining semantic validation details still need implementation decisions.

### Input schema

An empty object requests the current active project's compact overview.
Optional `targetId` requests a compact summary of an eligible frame or component in that same project.
It does not select that target or request its nested hierarchy.

```json
{
  "type": "object",
  "properties": {"targetId": {"type": "string", "minLength": 1, "description": "Optional stable frame or component ID for a compact summary."}},
  "additionalProperties": false
}
```

### Output schema

This schema describes successful `structuredContent`.
The `project` object supplies project identity and name; the other two reads use `projectId` when only the identity is needed.
`appliedRevision` identifies the represented design state.
`save.writtenRevision` is null before a successful disk save and may lag behind `appliedRevision`.
`save.hasSaveLocation` records whether a save location exists without requiring a filesystem path in every overview.
The status strings map to Not saved, Saving, Saved, and Save failed in the interface.

```json
{
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {"id": {"type": "string", "minLength": 1}, "name": {"type": "string"}},
      "required": ["id", "name"],
      "additionalProperties": false
    },
    "appliedRevision": {"type": "integer", "minimum": 0},
    "save": {
      "type": "object",
      "properties": {
        "status": {"type": "string", "enum": ["not_saved", "saving", "saved", "save_failed"]},
        "writtenRevision": {"type": ["integer", "null"], "minimum": 0},
        "hasSaveLocation": {"type": "boolean"}
      },
      "required": ["status", "writtenRevision", "hasSaveLocation"],
      "additionalProperties": false
    },
    "roots": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "minLength": 1},
          "name": {"type": "string"},
          "kind": {"type": "string", "enum": ["frame", "element", "text", "image", "svg", "component"]}
        },
        "required": ["id", "name", "kind"],
        "additionalProperties": false
      }
    },
    "rootsComplete": {"type": "boolean"},
    "selection": {
      "type": "object",
      "properties": {"available": {"type": "boolean"}, "nodeIds": {"type": "array", "items": {"type": "string", "minLength": 1}, "uniqueItems": true}},
      "required": ["available", "nodeIds"],
      "additionalProperties": false,
      "allOf": [{"if": {"properties": {"available": {"const": false}}, "required": ["available"]}, "then": {"properties": {"nodeIds": {"maxItems": 0}}}}]
    },
    "capabilities": {"type": "array", "items": {"type": "string", "minLength": 1}, "uniqueItems": true},
    "diagnostics": {"type": "array", "items": {"type": "object"}},
    "target": {
      "type": "object",
      "properties": {
        "id": {"type": "string", "minLength": 1},
        "name": {"type": "string"},
        "kind": {"type": "string", "enum": ["frame", "element", "text", "image", "svg", "component"]}
      },
      "required": ["id", "name", "kind"],
      "additionalProperties": false
    }
  },
  "required": ["project", "appliedRevision", "save", "roots", "rootsComplete", "selection", "capabilities", "diagnostics"],
  "additionalProperties": false
}
```

Return workspace roots in saved order.
`rootsComplete` means every workspace root was returned; a bounded list must report false.
An optional `target` supplies the requested target's identity summary without relabeling a nested component as a workspace root.
Scope capabilities and known diagnostics to the requested work where applicable.
Capability names describe supported project operations; detailed value restrictions remain in `get_node`.
Diagnostic rows must preserve known affected scope, error details, and candidate-application versus runtime meaning; their detailed row schema remains open.

When browser selection is unavailable, return `selection.available: false` and an empty `nodeIds` list.
That distinguishes unavailable selection from an available browser with nothing selected.
Server-owned context remains readable in either case.
Do not infer that there is no active project merely because its editor tab is closed.

### Request and response examples

Default arguments:

```json
{}
```

Example successful structured result:

```json
{
  "project": {"id": "project_1", "name": "Landing page"},
  "appliedRevision": 12,
  "save": {"status": "saved", "writtenRevision": 12, "hasSaveLocation": true},
  "roots": [{"id": "frame_1", "name": "Original", "kind": "frame"}, {"id": "frame_2", "name": "Variant", "kind": "frame"}],
  "rootsComplete": true,
  "selection": {"available": true, "nodeIds": ["frame_1"]},
  "capabilities": ["create_frame", "insert_html", "import_component"],
  "diagnostics": []
}
```

Optional focused arguments:

```json
{"targetId": "frame_1"}
```

For the focused request, include `target` for Original and retain the matching active-project identity/revision.
If no project is open, return a tool error with the message "No project is open. Open or create a project."
A failed disk save is reported in `save.status`; it does not by itself turn a successful context read into a tool error.
A missing or unsupported `targetId` reports the known target error without substituting another object.

## Applied-state consistency

The response content and reported revision must describe the same applied state.
An edit awaiting autosave is already applied and belongs in the next read.
Reading the last disk save must not replace the backend's newer applied revision.
Save status is session information, distinct from the design revision; a failed save does not hide the newer applied values.
Saved may be reported only when the current applied revision has completed its disk write under the [autosave contract](../../architecture/orc-workspace-bundle.md#autosave).
These reads do not mutate the design, increment its revision, or create an Undo entry.

Exclude unapplied Code-window typing and temporary drag, Preview input, open-state, or animation progress from the saved design context.
View information may be described as available session context, but it must not be reported as a saved object value.
The [shared read rules](../read-tools.md#shared-read-behavior) own this boundary for all focused reads.
When project or browser context is unavailable, report that condition rather than guessing.

## Use after insertion and human edits

After [insert_html](insert_html.md) succeeds, the agent has the created root IDs, applied revision, and created-object count.
Request the relevant descendant scope through `get_tree`, then use `get_node` for Heading or Photo details when needed.
This avoids making every insertion return its entire source and descendant list.

When the designer later changes the layout or applies Code, the agent reads fresh context before working again.
This applies throughout foundation creation, refinement, and design variants.
There is no separate feedback-loop mechanism or requirement that the human and agent edit simultaneously.
The [iteration workflow](../mcp-server.md#agent-and-designer-iteration) normally lets each finish their work before the other continues.

## Implementation verification still required

- Read an active project with independent frames, loose roots, and supported React content; verify compact overview, root ordering, stable targets, selection availability, capabilities, and known diagnostics.
- Read after completed human and agent edits before autosave finishes; verify content and revision agree.
- Verify Not saved, Saving, Saved, and Save failed against applied/written revisions, including an older completed save.
- Verify private Code drafts and temporary Preview/gesture values remain excluded and diagnostics do not imply a fresh whole-project scan.
- Read with the editor tab closed while the backend remains available; identify unavailable browser selection without requiring a render.
- Use returned root/selection IDs with the focused read tools without silently embedding their full results or changing design/view/history state.

These are required implementation checks, not claims that the MCP tool already passes.

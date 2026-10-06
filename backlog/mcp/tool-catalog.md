# MCP tool catalog

## Status

Provisional tool inventory retained for the final MCP discussion.
The entries below are reference candidates, not a finalized V1 tool count or release promise.
The [active read-tool contract](../../doc_v1/mcp/read-tools.md) owns the shared applied-state rules for all six focused reads; their rows below remain historical summaries rather than exact schemas.
The dedicated [get_context](../../doc_v1/mcp/tools/get_context.md), [get_source](../../doc_v1/mcp/tools/get_source.md), [create_frame](../../doc_v1/mcp/tools/create_frame.md), and [insert_html](../../doc_v1/mcp/tools/insert_html.md) contracts now take precedence over their historical rows.
In particular, `insert_html` accepts a supported HTML fragment with inline CSS; its compact result does not automatically return every descendant.
The dedicated [inspect_component_import](../../doc_v1/mcp/tools/inspect_component_import.md), [import_component](../../doc_v1/mcp/tools/import_component.md), [update_component_props](../../doc_v1/mcp/tools/update_component_props.md), and [update_component_source](../../doc_v1/mcp/tools/update_component_source.md) contracts also take precedence over their historical rows.
They extend the accepted source descriptions to agent-authored multi-file compositions and keep inspection, one-call preparation/placement, instance inputs, and explicit source-update scope distinct.
The dedicated [update_styles](../../doc_v1/mcp/tools/update_styles.md), [set_text](../../doc_v1/mcp/tools/set_text.md), [move_nodes](../../doc_v1/mcp/tools/move_nodes.md), [resize_node](../../doc_v1/mcp/tools/resize_node.md), and [replace_node_html](../../doc_v1/mcp/tools/replace_node_html.md) contracts also take precedence over their historical rows.
Those visual tools reach ordinary or reliably bound React values; movement preserves the current parent, resizing requires explicit supported mode changes, and ordinary replacement retains only a compatible root identity while creating fresh descendants.
The dedicated [reorder_nodes](../../doc_v1/mcp/tools/reorder_nodes.md), [rename_nodes](../../doc_v1/mcp/tools/rename_nodes.md), and [delete_nodes](../../doc_v1/mcp/tools/delete_nodes.md) contracts take precedence over their historical rows.
The historical `undo` and `redo` rows are [scheduled for V1.1](undo-redo-v11.md), while application history and Undo/Redo remain V1.
The [tool release scope](tool-release-scope.md) keeps project listing/create/open/rename and standalone fresh whole-project validation outside MCP V1, with a later release unassigned.
Dedicated [update_design_tokens](../../doc_v1/mcp/tools/update_design_tokens.md) and [get_screenshot](../../doc_v1/mcp/tools/get_screenshot.md) contracts take precedence over their historical rows.
Dedicated [get_node](../../doc_v1/mcp/tools/get_node.md), [get_tree](../../doc_v1/mcp/tools/get_tree.md), [list_design_tokens](../../doc_v1/mcp/tools/list_design_tokens.md), and [get_computed_styles](../../doc_v1/mcp/tools/get_computed_styles.md) contracts now own object details, hierarchy, registry reads, and browser results.
The historical `get_document_info` and `get_selection` responsibilities fit in `get_context`; `get_children` is a shallow `get_tree` request.
Dedicated [import_asset](../../doc_v1/mcp/tools/import_asset.md) and [update_node_settings](../../doc_v1/mcp/tools/update_node_settings.md) contracts own reusable resource registration and own locks/eligible frame modes.
Saved Layer hide/show and MCP visibility mutations remain [V1.1](../layer-visibility-v11.md).
Standalone font listing and conditional-style management also remain outside MCP V1 under the release scope above.
Dedicated [export](../../doc_v1/mcp/tools/export.md) and [update_attributes](../../doc_v1/mcp/tools/update_attributes.md) contracts take precedence over their historical rows, reusing the exporter and asset/source services rather than creating separate tools per format or attribute.
The dedicated [duplicate_nodes](../../doc_v1/mcp/tools/duplicate_nodes.md) contract takes precedence over its historical row and reuses accepted same-project Copy/Paste behavior.
Names and useful broad responsibilities were reused from this catalog; the current behavior follows ORC-web's accepted application architecture and subsequent discussion rather than promoting these summaries into exact schemas.
Detailed shared behavior is in [Command contracts](command-contracts.md).

This reference lists 39 candidate public MCP tools.
The current [27-tool inventory](../../doc_v1/mcp/tools/README.md), focused consolidations, and explicit release decisions take precedence over these unchanged rows.
No second public tool may duplicate an operation already represented here.

An agent reads applied state with `get_context` or `get_source` before making its next change.
Agents do not depend on a separate feedback loop after a human visual edit.
Source-backed layer edits use the existing node, component-property, style, text, and source tools through the shared command engine.

## Inspection tools

| Tool | Purpose |
| --- | --- |
| `get_context` | Read the active document, revision, selection, workspace summary, available capabilities, and current component diagnostics. |
| `list_documents` | List open and recent local ORC-web documents. |
| `get_document_info` | Read document metadata, revision, persistence state, and object counts. |
| `get_selection` | Read the browser editor’s current selected canonical objects. |
| `get_node` | Read one complete normalized node. |
| `get_children` | Read one ordered direct child list or workspace-root list. |
| `get_tree` | Read a bounded hierarchy below one root or from the workspace root. |
| `get_computed_styles` | Read authored and browser-computed styles for one measurable object. |
| `list_fonts` | List human-approved local font metadata available to the current editor session. |
| `list_design_tokens` | List document token definitions and reference counts. |
| `list_style_conditions` | List responsive or conditional style definitions when supported. |
| `get_screenshot` | Return an image of one object, frame, or workspace scope. |
| `get_source` | Return applied HTML or React source for one exportable scope, with any current diagnostic for that scope. |
| `inspect_component_import` | Inspect a local, npm, npx-based, or shadcn component candidate without changing the document. |
| `validate_document` | Return structural, component, asset, token, render, and export diagnostics. |

## Create and mutation tools

| Tool | Purpose |
| --- | --- |
| `create_document` | Create one new local ORC-web project. |
| `open_document` | Open one existing local ORC-web project. |
| `rename_document` | Rename the document and its workspace folder. |
| `create_frame` | Create one bounded frame at workspace root or inside a valid frame. |
| `insert_html` | Insert HTML or CSS as ordinary editable design objects. |
| `replace_node_html` | Replace one ordinary object subtree while keeping its root identity when valid. |
| `import_component` | Add one previously inspected component candidate. |
| `update_styles` | Set or clear validated styles on explicit objects. |
| `update_design_tokens` | Create, change, or delete document tokens. |
| `update_style_conditions` | Create, change, or delete supported responsive style conditions. |
| `set_text` | Replace one text object’s canonical content. |
| `update_attributes` | Set or clear allowed authored attributes on ordinary objects. |
| `update_component_props` | Change declared properties on one component instance. |
| `update_component_source` | Apply one shared component implementation update. |
| `move_nodes` | Move one or more objects under their layout rules. |
| `resize_node` | Resize one supported object or frame. |
| `reorder_nodes` | Reorder or reparent objects, including roots and valid component slots. |
| `duplicate_nodes` | Deep-copy one or more object subtrees with fresh IDs. |
| `rename_nodes` | Change display names without changing stable IDs. |
| `delete_nodes` | Remove one or more complete object subtrees. |
| `import_asset` | Copy and register one local asset or font. |
| `undo` | Reverse one retained completed command. |
| `redo` | Reapply one reversed command. |

## Export tool

| Tool | Purpose |
| --- | --- |
| `export` | Export React, HTML or CSS, images, workspace images, or PDF from committed design state. |

## Web-specific rules

`create_frame` replaces an artboard-only creation rule because ORC-web allows loose objects at workspace root.
`get_children` and `get_tree` can start from the workspace root.
`reorder_nodes` can move an object into or out of a frame when the destination layout permits it.
Supported component layers are addressed through generated editor IDs that resolve to declared properties or validated source bindings.
They are never addressed through arbitrary runtime DOM IDs.

Current component diagnostics identify the affected component, error summary, whether it occurred during candidate Apply or later runtime interaction, and the committed revision when one exists.
`get_context` returns current diagnostics for the active project.
`get_source` returns the diagnostic for its requested scope when one exists.
Neither read returns unapplied Code window text from the current editing session.

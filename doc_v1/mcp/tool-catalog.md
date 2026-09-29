# MCP tool catalog

## Status

Accepted V1 public tool inventory.
Detailed shared behavior is in [Command contracts](command-contracts.md).

ORC-web exposes exactly 39 public MCP tools.
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

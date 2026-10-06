# MCP tools

## Status and organization

Each agreed MCP tool has its own detailed contract in this folder.
The twenty-eight tools below have accepted V1 responsibilities.
Core JSON schemas and examples are accepted for the seven [focused reads](../read-tools.md), [create_frame](create_frame.md#agreed-json-exchange), [insert_html](insert_html.md#agreed-json-exchange), and [replace_node_html](replace_node_html.md#agreed-json-exchange).
The basic inline [inspection](inspect_component_import.md#agreed-json-exchange)/[import](import_component.md#agreed-json-exchange) exchanges and [instance-property](update_component_props.md#agreed-json-exchange)/[source-file](update_component_source.md#agreed-json-exchange) updates also have core JSON contracts.
[Style updates](update_styles.md#agreed-json-exchange) record assignments, removal, unlinking, and explicit shared-source scope.
[Text updates](set_text.md#agreed-json-exchange) record plain-string replacement, explicit shared-source scope, and continuing target IDs.
[Movement](move_nodes.md#agreed-json-exchange) records shared displacement or per-target positions under the current parent, with compact target/revision results.
[Resizing](resize_node.md#agreed-json-exchange) records per-axis Fixed/Fit/Fill changes under existing sizing ownership, with compact target/revision results.
[Reordering](reorder_nodes.md#agreed-json-exchange) records explicit destinations, post-removal insertion indices, submitted target order, and required Free/workspace positions.
[Renaming](rename_nodes.md#agreed-json-exchange) records per-target editor labels, changed-target results, and unchanged revision/history for no-change requests.
[Deletion](delete_nodes.md#agreed-json-exchange) records explicit targets, overlap rejection, shared-source scope, and compact deleted-root results.
[Copying](duplicate_nodes.md#agreed-json-exchange) records explicit destinations, per-source copy positions, existing-list insertion indices, and fresh-root results.
[Attribute updates](update_attributes.md#agreed-json-exchange) record assignments/removal, local/managed/external image descriptions, and shared-source scope.
[Asset registration](import_asset.md#agreed-json-exchange) records local-file input, typed metadata results, identical-registration reuse, and no-change revision/history.
[Token definitions](update_design_tokens.md#agreed-json-exchange) record one create/default-edit/rename/delete operation, supported value strings, and compact stable-token results.
[Node settings](update_node_settings.md#agreed-json-exchange) record one own-lock or frame-mode assignment, preserved inherited protection, and unchanged revision/history for matching saved settings.
[Screenshots](get_screenshot.md#agreed-json-exchange) record object or bounded-region capture, temporary component states, and PNG image content with revision-matched metadata.
[Export](export.md#agreed-json-exchange) records ordered targets, formats, file/directory destinations, applicable options, complete output results, and browser first Save for Untitled projects.
These contracts follow the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
Operation failures follow the [shared tool-error schema](../tool-errors.md#error-payload-schema), delivered as text JSON with `isError: true` without changing these success schemas.
Detailed value/geometry/placement grammars, other wire schemas, and production implementation remain open.
None has been verified through a running ORC-web MCP server.

| Tool | Contract | Responsibility |
| --- | --- | --- |
| `get_context` | [get_context](get_context.md) | Read compact project/root overview, save status, available selection, capabilities, and known diagnostics. |
| `get_source` | [get_source](get_source.md) | Read object code, React instance usage, and relevant nested-layer excerpts with owner references. |
| `get_component_source` | [get_component_source](get_component_source.md) | Read a managed definition's actual entry or explicitly requested supporting source files. |
| `get_node` | [get_node](get_node.md) | Read one object's authored values, sizing rules, saved settings, capabilities, and reliable owner. |
| `get_tree` | [get_tree](get_tree.md) | Read ordered direct children or a bounded editable hierarchy with stable identities. |
| `list_design_tokens` | [list_design_tokens](list_design_tokens.md) | Read explicit registry definitions, existing values/units, and supported reference information. |
| `get_computed_styles` | [get_computed_styles](get_computed_styles.md) | Read requested actual browser CSS results and rendered bounds at an identified applied revision. |
| `create_frame` | [create_frame](create_frame.md) | Create a bounded design frame with a chosen name, position, and size. |
| `insert_html` | [insert_html](insert_html.md) | Create ordinary editable HTML/CSS layouts with text, images, SVG, and existing token references. |
| `inspect_component_import` | [inspect_component_import](inspect_component_import.md) | Inspect agent-authored or referenced component source and its requirements without package execution or applied mutation. |
| `import_component` | [import_component](import_component.md) | Prepare an inspected multi-file React composition and place one live instance, including its required styling, behavior, and assets. |
| `update_component_props` | [update_component_props](update_component_props.md) | Change supported exposed inputs on one component instance. |
| `update_component_source` | [update_component_source](update_component_source.md) | Apply related implementation files atomically under the explicit shared or supported independent scope. |
| `update_styles` | [update_styles](update_styles.md) | Change supported appearance or layout values through their canonical or validated source/input owner. |
| `set_text` | [set_text](set_text.md) | Change supported text content while preserving the continuing target and its semantic role. |
| `move_nodes` | [move_nodes](move_nodes.md) | Change supported positions under the current parent without implicit reparenting or Absolute Position conversion. |
| `resize_node` | [resize_node](resize_node.md) | Change supported dimensions or explicitly requested sizing modes while respecting per-axis ownership. |
| `replace_node_html` | [replace_node_html](replace_node_html.md) | Replace an ordinary subtree atomically, retaining its compatible root identity and structural location. |
| `reorder_nodes` | [reorder_nodes](reorder_nodes.md) | Change supported sibling order or parent while preserving IDs and converting placement relationships atomically. |
| `rename_nodes` | [rename_nodes](rename_nodes.md) | Change saved editor labels without changing visible content, source identifiers, or object identities. |
| `delete_nodes` | [delete_nodes](delete_nodes.md) | Remove supported owned subtrees or bound source/data content as one validated command. |
| `duplicate_nodes` | [duplicate_nodes](duplicate_nodes.md) | Copy supported applied objects within the same project, creating fresh identities while retaining shared definitions and resources. |
| `update_design_tokens` | [update_design_tokens](update_design_tokens.md) | Create, edit defaults, rename, or delete unused supported token definitions. |
| `get_screenshot` | [get_screenshot](get_screenshot.md) | Inspect a rendered object, section, frame, or bounded workspace image at an identified applied revision. |
| `export` | [export](export.md) | Write complete supported code, image, or PDF output through the existing exporter. |
| `update_attributes` | [update_attributes](update_attributes.md) | Change supported content attributes, including image replacement with required asset preparation. |
| `import_asset` | [import_asset](import_asset.md) | Register one chosen supported image, SVG, or font as a reusable managed resource without placement. |
| `update_node_settings` | [update_node_settings](update_node_settings.md) | Change own lock/unlock or an eligible frame's saved Light/Dark/Inherit choice. |

## Authoring paths

Agents can create designs from scratch through either of these paths:

| New design source | MCP authoring workflow |
| --- | --- |
| Ordinary HTML with inline CSS | [insert_html](insert_html.md) |
| React JSX/TSX with required supporting files | [inspect_component_import](inspect_component_import.md) → [import_component](import_component.md) |

The inspection/import pair serves the React authoring role corresponding to `insert_html` for ordinary HTML/CSS.
An agent can submit newly written React source directly; an existing component, package, or repository is not required.
Inspection checks the candidate without changing the design; Import prepares, validates, and commits its live instance.

Use `insert_html` for ordinary canonical HTML/CSS layouts.
Use `inspect_component_import` followed by `import_component` for live React content from agent-authored JSX/TSX, local source, npm, supported npx workflows, or shadcn registry items.
One Import call prepares and places the chosen composition after inspection, including Tailwind v4, Base UI-flavored shadcn, Motion, SVG, and supporting files when required.
There is no separate authoring tool for each technology in that composition.
Later instance inputs use `update_component_props`; implementation and related style files use `update_component_source`.
Use `update_styles`, `set_text`, `move_nodes`, and `resize_node` for their supported semantic values on ordinary objects or eligible React bindings.
They update the actual saved owner through the same command engine; they do not replace the component inspection/import/prop/source tools.
Shared source values require explicit All copies or supported Only this scope.
Use `replace_node_html` for an ordinary subtree replacement, reusing the HTML importer and preserving compatible root identity, parent, and sibling position.
Replacement descendants receive fresh IDs; an incompatible root or unsafe required reference rejects the whole replacement.
Ordinary objects and live React instances can coexist in one frame without introducing another saved design authority.
Use `reorder_nodes` for structural order/parent changes, `rename_nodes` for editor labels, and `delete_nodes` for supported removal.
These operations preserve source ownership, applicable locks, and one application Undo entry per successful mutation.
Use `duplicate_nodes` for same-project copies through the existing Copy/Paste service; shared React definitions and token references remain shared.
Use `get_context` for the project overview, `get_tree` for hierarchy, and `get_node` for authored values, sizing rules, settings, and ownership.
Use `get_computed_styles` for requested revision-matched browser results, keeping those separate from authored values.
Use `get_source` by `nodeId` for object code and ownership; use `get_component_source` by `componentId` for actual entry or requested supporting files before an implementation update.
Use `list_design_tokens` for registry reads, `update_design_tokens` for definitions, and `update_styles` for compatible object binding/unlinking.
Use `import_asset` to register a reusable supported image, SVG, or font; authoring and image-replacement tools still prepare required assets directly.
Use `update_node_settings` for locks and eligible frame modes, selecting existing token values without creating a palette.
Use `get_screenshot` when visual inspection is useful, reusing the existing capture service without an automatic feedback loop.
Use `export` for complete file output with the selected scope, format, destination, and applicable options; source/image inspection does not publish an export.
Use `update_attributes` for supported image sources, alternative text, and link destinations through the actual owner, preparing required assets before assignment.
Exposed component inputs retain `update_component_props`, and image fitting remains a supported style edit.

## MCP history release scope

The public MCP `undo` and `redo` tools are [scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md).
Application Undo/Redo remains V1, including recovery of successful MCP design changes through the same shared history.
No V1 next-Undo/Redo context summary is required by the deferred tool proposal.

## Shared contracts and historical candidates

[Shared read rules](../read-tools.md) define applied-state consistency, draft exclusion, and repeated agent/designer iteration.
The [local server](../mcp-server.md) defines connection and project authority.
The [SDK research](../sdk-and-protocol-research.md) records dated implementation recommendations.
Every mutation uses the existing [command engine](../../architecture/command-engine-and-history.md).

The [archived catalog](../../../backlog/mcp/tool-catalog.md) retains 39 historical candidate rows, including summaries of tools whose responsibilities are now accepted here.
It does not finalize the V1 count or supersede the individual contracts here.
Add another dedicated contract when that tool's behavior is agreed.
Project information and available selection remain in `get_context`; direct children are a shallow `get_tree` request.
Public project management, fresh whole-project validation, standalone font listing, and conditional-style management remain [outside MCP V1](../../../backlog/mcp/tool-release-scope.md).
Saved Layer hide/show and MCP visibility mutations are [scheduled for V1.1](../../../backlog/layer-visibility-v11.md).
Focused public tools reuse existing services without concentrating unrelated reads into one response.
Shared rules should stay in their owning documents rather than being independently redefined for each tool.

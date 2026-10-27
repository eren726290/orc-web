# ORC-web V1 specification

## Purpose

ORC-web is a local browser-based design editor for web-native interfaces.
People run a local server and open ORC-web in their browser through localhost.
It is a separate browser-based alternative to the original ORC desktop application.
It does not inherit the original ORC architecture or document schema by default.

V1 targets Fedora Linux and Windows.
macOS is outside the V1 target.
The current Debian mobile setup is used for documentation only.
Implementation and platform verification happen on a Fedora 44 KDE Plasma and Windows 11 dual-boot PC.

## Reading this specification

This directory is self-contained for ORC-web.
An agent or contributor should start here and follow the linked documents for the area they are changing.
The original ORC documentation may provide historical context, but ORC-web decisions live here.
When this specification does not decide a topic, record it in [`../backlog/`](../backlog/README.md) rather than borrowing a desktop rule implicitly.
The separate [implementation status](../IMPLEMENTATION_STATUS.md) records current development progress, verified evidence, and the next checkpoint.
The [V1 package list](../packge_list.md) records package responsibilities, observed releases, conditional dependencies, and application pin status.

## Product map

| Area | Document | What it owns |
| --- | --- | --- |
| Architecture | [System architecture](architecture/system-architecture.md) | Local processes, authority, data flow, and the shared Chrome rendering service. |
| TypeScript tooling | [TypeScript tooling and migration](architecture/typescript-tooling.md) | Required TS6 checking, a separate TS7 compatibility checkpoint, and migration conditions. |
| Browser support | [Browser support](architecture/browser-support.md) | Chrome support policy, local-server boundaries, clipboard, shortcuts, and verification. |
| Document data | [Canonical document model](architecture/canonical-document-model.md) | The saved design structure and invariants. |
| Projects and saving | [Workspace bundle](architecture/orc-workspace-bundle.md) | Untitled projects, `.orc` folders, edit/save separation, portable dependencies, autosave, and recovery. |
| Editing commands | [Command engine and history](architecture/command-engine-and-history.md) | Revisions, validation, Undo, and shared UI or agent edits. |
| Canvas | [Workspace and canvas](interface/workspace-and-canvas.md) | Infinite workspace, frames, layouts, and Edit or Preview. |
| Flex layout | [Flex layout](interface/flex-layout.md) | Accepted V1 wrapping defaults and initial sizing, Free/Row/Column switching, row wrapping, insertion, spacing, alignment, per-row Fill sharing, sizing dependencies, and Absolute Position; exact wrapper placement and implementation details stay open. |
| Constraints | [Constraints](interface/constraints.md) | Accepted V1 edge pins, Center, fixed margins, position-preserving changes, reparenting, small-parent behavior, and canvas indicators; ORC-web measurement details remain open. |
| Layers | [Layers panel](interface/layers-panel.md) | Paper-style rows, hierarchy, connected selection, names, locks, expansion, and the preserved V1.1 hide/show plan. |
| Properties | [Properties](interface/properties-panel.md) | Selection-based Layout and Constraints inventory, Component controls, tokens beside values, live editing, Appearance, Export, and the linked V1.1 control schedule. |
| Text | [Text editing](interface/text-editing.md) | Creation, inline editing, typography, rich formatting, sizing, and clipboard behavior. |
| Fonts | [Font management](interface/font-management.md) | Project fonts, installed fonts, missing-font replacement, and portable output. |
| SVG | [SVG editing](interface/svg-editing.md) | Vector selection, supported styling, replacement, source editing, and V1 limits. |
| Pen | [Pen tool](interface/pen-tool.md) | Approved own-path drawing, directed arcs, anchor editing, saved records and bounded SVG prerequisites. |
| React components | [Editable React components](interface/react-components.md) | Source-backed layers, visual edit ownership, shared instances, hidden content, and collections. |
| Motion | [Motion](interface/motion.md) | Live source-authored animation, optional Still view in Edit, accessible motion, and still capture. |
| Code | [Code window](interface/code-window.md) | Source scopes, two-way design/code updates, protected drafts, Apply/Discard, copying, and recovery. |
| Tokens panel | [Tokens panel](interface/tokens-panel.md) | Grouped registry, creation, live editing, names, safe deletion, and view state. |
| Design tokens | [Tokens and modes](interface/tokens-and-modes.md) | Definition identity, explicit references, units, CSS representation, and Light/Dark resolution. |
| Imports | [Component import](import-export/component-import.md) | npm, npx, local, and shadcn source selection, preparation, preview readiness, placement, and recovery. |
| Tailwind components | [Tailwind components](import-export/tailwind-components.md) | Supported source import, browser compilation, visual class edits, and faithful React export. |
| Exports | [Export](import-export/export.md) | React with CSS or Tailwind, HTML, images, and PDF. |
| Source mapping | [React source bindings](architecture/react-source-bindings.md) | Stable editor IDs that resolve visual component layers to authored React source. |
| Source validation | [React source-editing validation](architecture/react-source-editing-validation.md) | Reviewed PR1–5 results, Fedora Chrome evidence, measured corrections, and remaining implementation limits. |
| MCP connection | [Local MCP server](mcp/mcp-server.md) | Accepted localhost HTTP transport, shared project, connection lifetime, and agent/designer turns. |
| MCP shared reads | [Context and source reads](mcp/read-tools.md) | Shared applied-state consistency, draft exclusion, and fresh agent/designer reads. |
| MCP tools | [Individual tool contracts](mcp/tools/README.md) | One dedicated file for each agreed tool; the remaining catalog is provisional. |
| MCP context | [get_context](mcp/tools/get_context.md) | Compact project/root overview, save status, available selection, capabilities, and known diagnostics. |
| MCP source | [get_source](mcp/tools/get_source.md) | Applied object code, React instance usage, and relevant nested excerpts with reliable owners. |
| MCP component source read | [get_component_source](mcp/tools/get_component_source.md) | Actual applied entry and explicitly requested supporting files for one managed definition. |
| MCP object details | [get_node](mcp/tools/get_node.md) | Read one object's authored values, sizing rules, saved settings, capabilities, and reliable owner. |
| MCP hierarchy read | [get_tree](mcp/tools/get_tree.md) | Read ordered direct children or a bounded editable hierarchy with stable identities. |
| MCP token reads | [list_design_tokens](mcp/tools/list_design_tokens.md) | Read explicit registry definitions, existing values/units, and supported reference information. |
| MCP measurements | [get_computed_styles](mcp/tools/get_computed_styles.md) | Read requested actual browser CSS results and rendered bounds at an identified applied revision. |
| MCP frames | [create_frame](mcp/tools/create_frame.md) | Named bounded frames, valid placement/size, stable IDs, and one-command creation. |
| MCP HTML insertion | [insert_html](mcp/tools/insert_html.md) | Editable ordinary layouts, detailed Layers mapping, inline CSS, assets, existing tokens, atomic insertion, and required editor proof. |
| MCP component inspection | [inspect_component_import](mcp/tools/inspect_component_import.md) | Read-only source, entry, dependency, styling, input, and editable-capability inspection. |
| MCP component import | [import_component](mcp/tools/import_component.md) | Agent-authored or referenced React compositions, combined rendering inputs, atomic preparation/placement, and required editor proof. |
| MCP instance inputs | [update_component_props](mcp/tools/update_component_props.md) | Supported input changes on one component instance through the shared command engine. |
| MCP component source update | [update_component_source](mcp/tools/update_component_source.md) | Related implementation files, explicit shared/Only this scope, binding validation, and atomic source updates. |
| MCP visual styles | [update_styles](mcp/tools/update_styles.md) | Supported appearance/layout values, real value ownership, atomic conversion, and explicit source scope. |
| MCP text content | [set_text](mcp/tools/set_text.md) | Ordinary or bound React text changes, continuing identity, semantic role, and content preservation. |
| MCP movement | [move_nodes](mcp/tools/move_nodes.md) | Saved positions, current-parent ownership, constraint offsets, and no implicit reparenting. |
| MCP sizing | [resize_node](mcp/tools/resize_node.md) | Per-axis dimensions, explicit sizing-mode changes, parent-controlled values, and coupled relationships. |
| MCP HTML replacement | [replace_node_html](mcp/tools/replace_node_html.md) | One ordinary replacement root, retained compatible identity/location, fresh descendant IDs, and atomic validation. |
| MCP hierarchy | [reorder_nodes](mcp/tools/reorder_nodes.md) | Sibling order, supported parent changes, retained identities, and atomic layout/source conversion. |
| MCP Layer labels | [rename_nodes](mcp/tools/rename_nodes.md) | Saved editor labels, stable IDs, unchanged visible content/source identifiers, and no-op names. |
| MCP deletion | [delete_nodes](mcp/tools/delete_nodes.md) | Owned subtrees or supported React source/data removal, required-reference validation, and application-history restoration. |
| MCP copying | [duplicate_nodes](mcp/tools/duplicate_nodes.md) | Same-project Copy/Paste behavior, fresh copied identities, shared definitions/resources, validated placement, and one-command history. |
| MCP token definitions | [update_design_tokens](mcp/tools/update_design_tokens.md) | Supported default-value definitions, explicit shared references, stable naming, and unused deletion. |
| MCP visual inspection | [get_screenshot](mcp/tools/get_screenshot.md) | Rendered button-to-frame or bounded workspace captures, identified revisions, stable states, and read-only image responses. |
| MCP export | [export](mcp/tools/export.md) | Complete supported code, image, or PDF output, explicit scope/options, required saving, and destination publication. |
| MCP content attributes | [update_attributes](mcp/tools/update_attributes.md) | Supported image sources, alternative text, and links through real owners, with atomic managed-asset preparation. |
| MCP managed assets | [import_asset](mcp/tools/import_asset.md) | Reusable image, SVG, and font registration, required metadata/loading, portability, and application history. |
| MCP saved settings | [update_node_settings](mcp/tools/update_node_settings.md) | Own locks and eligible frame token modes; saved visibility mutations stay V1.1. |
| MCP SDK research | [SDK and protocol research](mcp/sdk-and-protocol-research.md) | Dated stable releases, recommended Bun integration, compatibility, APIs, and remaining implementation checks. |

The [Properties V1.1 schedule](../backlog/properties-panel-v1x.md#v11-properties-controls) defers the listed Text typography/Overflow, font import/unavailable-font/replacement, and Replace SVG controls.
The linked Text, Fonts, and SVG documents preserve the researched plans; the schedule determines when those specific Properties controls ship.
V1 token creation and value editors cover Color, Spacing, and Corner radius defaults.
The dedicated [Typography](../backlog/typography-tokens-v11.md), [Light/Dark](../backlog/token-modes-v11.md), and [imported-token](../backlog/imported-token-management-v11.md) backlogs schedule their human editing or panel-integration work for V1.1 while preserving existing values and required rendering inputs.

## Status vocabulary

Accepted means the behavior is agreed for its stated release, normally V1 unless an explicit scope decision says otherwise.
Proposed means the document gives a direction that still needs agreement or implementation validation.
Open means the decision belongs in the backlog.

## Implementation evidence

The [source-editing validation record](architecture/react-source-editing-validation.md) confirms bounded ownership discovery, selection continuity, real Base UI composition, and local copying in Fedora Chrome.
These are implementation experiments, not a completed editor or Windows certification.
The product still includes ordinary HTML/CSS and SVG editing alongside source-backed React, Tailwind, and Motion.
The [stack record](../backlog/stack-proposal.md) identifies the package direction and remaining decisions.
The [TypeScript tooling policy](architecture/typescript-tooling.md) selects TS6 for V1 while retaining PR5's TS7 results as evidence for a future migration.
The local MCP transport, connection workflow, context/source reads, frame creation, ordinary HTML insertion/replacement, component inspection/import/update, and supported visual-value editing responsibilities are accepted.
Core JSON schemas and examples for the seven [focused reads](mcp/read-tools.md#json-schemas-and-examples), [create_frame](mcp/tools/create_frame.md#agreed-json-exchange), [insert_html](mcp/tools/insert_html.md#agreed-json-exchange), and [replace_node_html](mcp/tools/replace_node_html.md#agreed-json-exchange) are accepted.
Each dedicated tool contract retains its own detailed schema and examples.
SDK recommendations, remaining schema details, and the tool inventory are recorded separately from implementation proof.

## Design and application integration

The user-supplied Elyx and Lunagraph discussion reinforces locally owned files, reusable source, a freeform canvas, and meaningful human iteration on agent-built foundations.
A single canonical design can reference component source in separate files inside its portable `.orc` project.
Rendering with HTML or React alone does not establish fidelity to an application's styles, data, dependencies, and behavior.
The proposed connection to an existing application uses two explicitly requested agent workflows: application design into ORC, then verified integration of the refined design into the application.
The [application integration plan](../backlog/application-integration-skills.md) records the discussion's conclusion, both repository skills, checkpoints, and the requirement to discuss failures before fixing them.
These workflow instructions are authored; their end-to-end execution still depends on working import/export operations and application verification.
Their release is unassigned, and they do not expand the existing V1 editing or source-recognition boundary.

## MCP decisions and reference drafts

The [local server](mcp/mcp-server.md) and [read-tool contract](mcp/read-tools.md) record the accepted connection and repeated-iteration workflow.
The [tools folder](mcp/tools/README.md) provides a dedicated contract for each of the twenty-eight tools agreed so far, without fixing the final inventory count.
`insert_html` includes its refined Layers hierarchy, semantic preservation, compact result, and the mixed-layout acceptance proof still required in the actual editor.
The component path uses read-only inspection followed by one `import_component` call to prepare and place JSX/TSX with required CSS or Tailwind v4, Base UI-flavored shadcn, Motion, SVG, and supporting files.
Its separate prop/source update contracts preserve existing ownership and supported Only this limits; the combined composition proof remains required.
Style, text, movement, and resize operations reach the actual canonical or supported React value owner without implicit layout conversion or a second saved DOM tree.
Ordinary HTML replacement retains a compatible root's identity and structural location while giving new descendants fresh IDs.
Their exact value/range/geometry and replacement-compatibility rules, plus real-editor verification, remain [implementation work](../backlog/mcp/command-contracts.md#editing-tool-implementation-decisions).
Hierarchy, display-label, and deletion tools use the same identity, layout/source ownership, and validation services.
`duplicate_nodes` reuses same-project Copy/Paste while preserving fresh identities and the existing sharing boundaries.
`get_context` supplies the overview; `get_node` supplies authored object details and `get_tree` supplies bounded hierarchy.
`get_computed_styles` supplies revision-matched browser results distinct from authored values.
`list_design_tokens` inspects registry definitions; `update_design_tokens` manages supported definitions while object references use their existing edit owners.
`import_asset` registers reusable supported image, SVG, and font resources without placement, including required font loading for ordinary HTML/CSS and React.
`update_node_settings` changes own locks or an eligible frame's optional Light/Dark/Inherit choice among existing token values.
Saved Layer hide/show and MCP visibility mutations are [scheduled for V1.1](../backlog/layer-visibility-v11.md).
Public project management, fresh whole-project validation, standalone font listing, and conditional-style management remain [outside MCP V1](../backlog/mcp/tool-release-scope.md).
`get_screenshot` inspects rendered objects through the shared capture service without editing the design or requiring a file export.
`export` writes complete supported output through the existing exporter, retaining required resources, stable capture, and save/publication rules.
`update_attributes` handles supported content attributes and prepares replacement images before assignment, retaining identity, fitting, source scope, and application history.
Public MCP Undo/Redo is [scheduled for V1.1](../backlog/mcp/undo-redo-v11.md); application Undo/Redo and history recording for V1 MCP mutations remain supported.
The agent and designer normally take turns, with fresh applied-state reads before the agent resumes work.
The [SDK research](mcp/sdk-and-protocol-research.md) preserves the stable-release findings and implementation recommendations without declaring a tested server.
The previous server, tool catalog, and command-contract drafts remain historical reference material in the [MCP backlog](../backlog/README.md#mcp-reference-drafts).
They do not finalize package pins, schemas, or a 39-tool V1 inventory.

# ORC-web documentation coverage audit

This temporary audit compares the original ORC V1 documentation with the current ORC-web specification.
It records browser-relevant gaps without assuming that Electron architecture, artboard-only structure, or desktop constraints must be copied.
The original audit below is historical; [second ittraton](#second-ittraton) records current corrections and takes precedence over its older gap labels and suggested document destinations.

## Already covered

| Feature area | Existing ORC-web source | Coverage |
| --- | --- | --- |
| Infinite workspace and loose root objects | `doc_v1/interface/workspace-and-canvas.md` | Accepted. |
| Frames, Free, Row, and Column | `doc_v1/interface/workspace-and-canvas.md` and `doc_v1/interface/flex-layout.md` | Accepted with open implementation details. |
| Flex layout and Constraints | `doc_v1/interface/flex-layout.md` and `doc_v1/interface/constraints.md` | Accepted behavior with identified open rules. |
| Layers, Properties, mixed selection, and component boundaries | `doc_v1/interface/properties-panel.md` | Accepted product behavior. |
| Tokens with Light and Dark values | `doc_v1/interface/tokens-and-modes.md` | Accepted product behavior. |
| Code drafts, Apply, and shared component source | `doc_v1/interface/code-window.md` | Accepted product behavior. |
| Text creation, inline editing, typography, rich formatting, overflow, and paste | `doc_v1/interface/text-editing.md` | Accepted product behavior; the canonical rich-text field remains an open model decision. |
| Component import from npm, npx, local source, and shadcn registries | `doc_v1/import-export/component-import.md` | Accepted human flow with open support policy. |
| React, HTML or CSS, raster, and PDF export | `doc_v1/import-export/export.md` | Accepted output set with open renderer details. |
| One document model, commands, revisions, Undo, and browser measurement authority | `doc_v1/architecture/*.md` | Covered at proposal or accepted-behavior level. |
| Local MCP direction and 39 public tools | `backlog/mcp/*.md` | Provisional reference drafts; the MCP stack and inventory are reviewed last. |
| Portable project bundle and autosave | `doc_v1/architecture/orc-workspace-bundle.md` | Proposed format. |

## Browser-relevant documentation gaps

| Feature | Status | Original source | ORC-web destination | Detail that needs a self-contained decision |
| --- | --- | --- | --- | --- |
| Product vision, audience, and V1 non-goals | Missing | `product/vision-and-success-criteria.md`, `product/v1-scope-and-non-goals.md` | `doc_v1/product/vision-and-v1-scope.md` | State who ORC-web serves, its one complete V1 workflow, and exclusions such as collaboration, cloud hosting, Grid, and unsupported import runtimes. |
| Terminology | Missing | `product/terminology.md` | `doc_v1/product/terminology.md` | Define workspace, frame, loose object, component, slot, design mode, Edit, Preview, draft, and export. |
| Editor chrome, Add flow, contextual states, and accessibility | Incomplete | `interface/editor-layout-and-ux.md`, `interface/layers-and-inspector.md` | `doc_v1/interface/editor-layout-and-ux.md` | Specify top bar, tool rail, Layers and Tokens tabs, Add destinations, empty states, focus, keyboard access, and feedback. |
| Canvas navigation and direct manipulation | Incomplete | `interface/canvas-interactions.md` | `doc_v1/interface/canvas-interactions.md` | Specify pan, zoom, fit, selection, multi-select, move, resize, insertion feedback, locked objects, and the exact Edit versus Preview interaction boundary. |
| Properties field rules and style contexts | Incomplete | `interface/layers-and-inspector.md` | `doc_v1/interface/properties-panel.md` and `doc_v1/interface/text-editing.md` | Text creation, inline editing, typography, overflow, rich formatting, and paste are now specified; section order, image controls, field commit rules, responsive style contexts, lock behavior, and inline errors remain incomplete. |
| Component manifest, slots, shared-source updates, and export readiness | Incomplete | `import-export/code-component-manifest.md` | `doc_v1/import-export/component-manifest.md` | Define the manifest shape, declared control types, slot limits, source update validation, and static-export readiness. |
| HTML, CSS, and Tailwind interchange | Missing | `import-export/html-css-tailwind.md` | `doc_v1/import-export/html-css-tailwind.md` | Define supported markup and CSS, identity preservation, CSS or token handling, asset import, allowed attributes, and known round-trip limits. |
| React import support policy | Incomplete | `import-export/react-and-shadcn.md`, `quality/security-and-sandboxing.md` | Expand `doc_v1/import-export/component-import.md` | Define the supported runtime subset, package-resolution model, lifecycle scripts, native addons, environment variables, network requirements, preview failures, and direct rendering trust boundary. |
| Image and PDF export contracts | Incomplete | `import-export/image-export.md`, `import-export/pdf-export.md` | Expand `doc_v1/import-export/export.md` or split `image-export.md` and `pdf-export.md` | Define dimensions, raster background behavior, selection ordering, PDF page sizing, text behavior, failure handling, and file publication. |
| Storage, assets, draft durability, locks, rename, and recovery | Incomplete | `architecture/orc-workspace-bundle.md`, `architecture/persistence-and-assets.md` | Expand `doc_v1/architecture/orc-workspace-bundle.md` | Define schema versioning, asset IDs, save failure behavior, locks, project rename, recovery, and platform file paths. |
| Data indexes and document invariants | Incomplete | `architecture/flat-node-map.md`, `architecture/canonical-document-model.md` | Expand `doc_v1/architecture/canonical-document-model.md` | Decide the canonical node indexing model, parent reconstruction, node ordering, component slots, token references, and layout fields. |
| Browser renderer and measurement protocol | Missing | `architecture/canvas-renderer.md`, `architecture/process-and-ipc-model.md` | `doc_v1/architecture/browser-renderer.md` | Define render layers, overlays, live component mounting, measurement requests, revision matching, and export renderer availability. |
| MCP operation contracts and agent workflows | Incomplete | `mcp/command-contracts.md`, `mcp/agent-workflows.md`, `mcp/tool-schema-guidelines.md` | Revisit `backlog/mcp/command-contracts.md` during the final MCP discussion | Define each tool input and result, error codes, idempotency, browser-measurement failures, and safe agent workflows. |
| MCP host and transport lifecycle | Incomplete | `mcp/mcp-foundation.md`, `mcp/stdio-transport.md` | Revisit `backlog/mcp/mcp-server.md` during the final MCP discussion | Decide Streamable HTTP details, session and endpoint lifecycle, authentication boundary for localhost, and whether a stdio adapter is needed. |
| Browser stack and UI component policy | Missing | `quality/development-environment.md`, `interface/shadcn-component-policy.md`, `decisions/ADR-009-application-chrome-ui-stack.md` | `doc_v1/decisions/` after stack choice | Record Bun or another runtime, React tooling, Base UI versus Radix decision, Tailwind policy, Oxlint, Oxfmt, and supported browsers. |
| Schema migration and compatibility | Missing | `quality/schema-versioning-and-migrations.md`, `quality/compatibility-and-migrations.md` | `doc_v1/quality/schema-versioning-and-migrations.md` | Define loading older bundles, failed migration safety, format reader identity, and MCP compatibility. |
| Quality, performance, accessibility, and release proof | Missing | `quality/testing-and-acceptance.md`, `quality/performance-budgets.md` | `doc_v1/quality/testing-and-acceptance.md` | Define browser test matrix for Fedora and Windows, acceptance scenarios, performance targets, and release evidence. |
| Original Electron-specific ADRs | Out of scope | `decisions/ADR-001` through `ADR-009` | No direct copy. | Recreate only browser decisions that are explicitly selected for ORC-web. |

## Small details previously missed

The original Layers and Inspector contract already placed Flex layout and Constraints under Properties.
ORC-web now has dedicated documents for both and defines which selection types receive their controls.
The section order, visual grouping, field-level interaction, and unavailable states still need more detail.
The three documents cross-link so a reader can move between the panel rules and each layout contract.

The original canvas contract also contains the practical details that make properties usable: moving versus reparenting, direct resize rejection for parent-controlled objects, selection feedback, and keyboard focus.
Those belong in a dedicated ORC-web canvas-interactions document, not as fragments scattered across Flex and Constraints.

The original component contract distinguishes outer component geometry from declared component properties and editable slots.
ORC-web has the high-level boundary but no self-contained manifest or slot contract yet.

The original import specification distinguishes inspection from import and records exact dependencies for reopening.
ORC-web covers the high-level flow, but not the package and runtime rules needed to make an import result reproducible.

## Next documentation work

1. Write product scope and terminology so later documents use stable words and a clear V1 boundary.
2. Write editor layout and canvas interactions, then expand Layers and Properties to define section order, image controls, tokens, locks, and errors.
3. Write component manifest and strengthen component import with package support and preview-failure rules.
4. Write HTML, CSS, and Tailwind interchange, then split export into code, image, and PDF contracts if one document becomes unclear.
5. Complete the persistence, renderer, MCP, schema migration, and quality contracts after the user-facing rules are stable.

## second ittraton

Reviewed on 2026-10-01 against the current ORC-web specification and the original ORC canvas and Properties contracts.
This ledger tracks adopting useful ORC behavior while choosing ORC-web's own architecture and scope.
An adopted feature needs a self-contained ORC-web contract; original process boundaries, schema, libraries, and UI restrictions are not inherited automatically.
The [gates](../GATES.md#second-ittraton) verify documentation coverage, not a working application.

### Existing coverage to reuse

These findings correct the historical audit without adding duplicate feature gates.

| Historical finding | Current disposition | Existing gates and ORC-web authority |
| --- | --- | --- |
| Editor chrome, Add, field rules, Appearance, and token controls were incomplete. | The agreed workflows and dedicated Layers contract are now documented. | W1–W7 and I5; [Workspace](../doc_v1/interface/workspace-and-canvas.md), [Layers](../doc_v1/interface/layers-panel.md), [Properties](../doc_v1/interface/properties-panel.md), and [Tokens](../doc_v1/interface/tokens-and-modes.md). |
| React editing was described mainly through outer geometry, declared properties, and slots. | Supported nested source-backed layers are adopted; arbitrary DOM recognition is excluded. | R1–R4 and S2–S4; [source ownership](../doc_v1/architecture/system-architecture.md#rendering-and-source-ownership). |
| Mixed Properties editing appeared accepted, and broader Add actions were suggested. | Bulk Properties, Duplicate, manual frames, and new image/SVG insertion are deferred; existing frames, replacement, Copy/Paste, and Only this remain. | F2 and W2/W6/W7; [dedicated backlog](../backlog/properties-panel-v1x.md). |
| Stack and browser policy were missing. | Browser and stack choices are recorded with accepted versus recommended status. | B1–B3 and S1/S5/S6; [stack record](../backlog/stack-proposal.md). |
| Bundle format was proposed and draft durability was a gap. | The portable `.orc` folder and applied-only saving are accepted; unapplied code is session-only. | R6–R8; [bundle](../doc_v1/architecture/orc-workspace-bundle.md). |
| MCP hosting, transport, and agent reads awaited the final discussion. | Local HTTP, connection lifetime, repeated agent/designer turns, reads, frame creation, ordinary HTML insertion/replacement, component inspection/import/update, and supported visual-value responsibilities are accepted; SDK adoption, exact schemas, and remaining tools stay open. | MC1–MC4, MT1–MT4, CT1–CT6, and ET1–ET7; [MCP server](../doc_v1/mcp/mcp-server.md), [reads](../doc_v1/mcp/read-tools.md), [individual tools](../doc_v1/mcp/tools/README.md), and [SDK research](../doc_v1/mcp/sdk-and-protocol-research.md). |

### Adopted details missing explicit gates

| Feature | Original ORC reference | Current ORC-web contract | Added check |
| --- | --- | --- | --- |
| Selection-aware Properties presentation | [Paper Properties](../../orc/luna/paper_screenshot/paper-properties-panel-reference.md#panel-organization-and-interaction-observations), lines 145–157, and [Lunagraph component controls](../../orc/luna/luna_screenshot/lunagraph-properties-panel-reference.md#editable-content-inside-a-component), lines 95–101. | [Properties inventory](../doc_v1/interface/properties-panel.md#layout-control-inventory) preserves one panel and separates applicable layout, component, and token controls; the referenced observations do not prove every ORC-web edit or Undo path. | W9 checks the recorded controls and release timing; W4–W7 retain their existing field, token, and deferral checks. |
| Layers presentation and human controls | [Paper layer-tree reference](../../orc/luna/paper_screenshot/paper-layer-tree-reference.md#visible-design-panel-presentation), lines 79–91, and [Lunagraph layer-tree reference](../../orc/luna/lunagraph-layer-tree-reference.md). | [Layers panel](../doc_v1/interface/layers-panel.md) adopts readable names, icons, hierarchy, and connected selection; rename, lock, and expansion are V1 while saved hide/show follows the V1.1 plan; these are accepted ORC-web rules rather than claims that every interaction was tested in Paper. | I5 checks the dedicated contract and its links while retaining ORC-web's own node and source model. |
| Image fitting, position, and replacement | [Image controls](../../orc/doc_v1/interface/layers-and-inspector.md#text-image-and-component-options), beginning at line 178. | [Image properties](../doc_v1/interface/properties-panel.md#image-properties) preserves the box, fitting, and existing positioning, validates before assignment, and supports Undo; visual positioning and manual insertion are deferred. | I2 checks these details, beyond W4's general panel organization. |
| Tool behavior and live interaction | [Canvas modes](../../orc/doc_v1/interface/canvas-interactions.md#canvas-modes), beginning at line 3. | [Canvas tools](../doc_v1/interface/workspace-and-canvas.md#canvas-tools) keeps Pan as a view change and Select as design manipulation; [Edit/Preview](../doc_v1/interface/workspace-and-canvas.md#edit-and-preview) routes live interaction. | I3 checks mode semantics, beyond W3's selection clearing and zoom. |
| Flex and Constraints behavior | [Flex](../../orc/doc_v1/interface/layers-and-inspector.md#flex-layout), line 133, and [Constraints](../../orc/doc_v1/interface/layers-and-inspector.md#constraints), line 154. | [Flex](../doc_v1/interface/flex-layout.md) and [Constraints](../doc_v1/interface/constraints.md) define participation, sizing, wrapping, edge pins, Center, and canvas constraint indicators with remaining ORC-web proposals labeled. | I4 checks behavior and open limits, beyond G11's cross-links. |
| Token registry and editing | [Paper Theme panel](../../orc/luna/paper_screenshot/paper-theme-panel-reference.md#panel-structure) and [original Tokens panel](../../orc/doc_v1/interface/tokens-panel.md). | [Tokens panel](../doc_v1/interface/tokens-panel.md) owns the human workflow; [Tokens and modes](../doc_v1/interface/tokens-and-modes.md) owns definitions, explicit references, units, and release scope. | T1–T6 check this focused 2026-10-02 update; Paper's observations do not prove editing or propagation. |
| Code display, editing, and copying | Two user-supplied Lunagraph Code research reports, observed 2026-09-16; their evidence limits are recorded in [Code research basis](../doc_v1/interface/code-window.md#research-basis). | [Code window](../doc_v1/interface/code-window.md) owns source scopes, highlighting, explicit Apply, draft protection, and clipboard boundaries. | CW1–CW4 check the refined contract; the observations do not establish safe shared-source mutation or external repository synchronization. |

### Agreed refinements

- W9 checks the explicit Properties inventory for selection-based Layout, Flex and Constraints options, applicable Component controls, hidden content, source editing, and tokens beside values.
- The listed Text typography/Overflow, font import/unavailable-font/replacement, and Replace SVG controls are scheduled for V1.1 in the [dedicated backlog](../backlog/properties-panel-v1x.md#v11-properties-controls); their existing research documents remain intact.
- I5 records the dedicated Layers panel contract: Paper-style rows, separate display names, rename completion and cancellation, the preserved V1.1 visibility/inheritance plan, V1 locks and inspection, and expansion with selection preserved.
- Architecture documents retain hierarchy, saved data, and engine validation; human Layers rules have one linked interface authority.
- I2 now checks the V1 image-position control deferral, preserved positioning, and Center fallback recorded in the dedicated backlog.
- I3 now checks Escape cancellation of an active move or resize before parent selection, with selection preserved and no history entry for cancellation.
- I3 checks sizing-aware resize handles, explicit Fixed conversion, 1 px free nudges and 8 px Shift nudges, constrained-offset updates, and focus-aware one-item Flex reordering.
- Resize rules are connected to Properties, Text, SVG proportional sizing, Flex, and Constraints; held-key command grouping and several-item Flex keyboard reordering remain open.
- I4 now checks an explicit Row/Column choice, 8 px starting gap, 0 padding, and selection of the new Flex frame.
- I4 checks initial Fit wrapper sizing with a Fixed fallback only on an axis where a Fill child needs independently available space.
- W4 checks Clip content and editable clipped children, plus combined and individual corner-radius fields with value-preserving expansion and Undo.
- I4 checks paired padding Mixed values, unchanged expansion, and atomic paired-side edits with restoration of asymmetric values.
- I4 checks Free/Row/Column switching, retained placement when leaving Flex, preserved Absolute Position children, and one-step Undo.
- I4 checks Wrap to next line for Rows, one item/row Gap, per-row Fixed/Fill behavior, Fit-height growth, and Fixed-height clipping.
- I4 checks dropped Free placement, Flex insertion, converted constraint relationships, loose-root placement, and one-step reparent Undo.
- I4 checks minimum-size priority, preserved left/top margins, and recovery of saved both-edge margins when the parent grows.
- I4 also checks an unavailable Fill choice for unresolved same-axis dependencies and equal sharing of available space subject to size limits.
- I4 checks position-preserving constraint changes and selected-object dotted edge lines and Center markers, including independent axes, view updates, and export exclusion.
- T1–T6 record the dedicated Tokens panel, centered and header Create token controls separate from Layers + Add, grouped lists, Search, live default-value edits, rename, safe deletion, explicit linking, and atomic creation from Properties.
- Color, Spacing, and Corner radius default-value editors remain V1; individual Typography editors, Light/Dark value controls, and imported-token recognition/panel exposure are scheduled for V1.1 in three dedicated backlogs.
- Existing Typography values, Dark overrides, and imported styling remain supported rendering and save/export inputs; units and source ownership are preserved rather than creating a duplicate editable CSS tree.
- CW1–CW4 refine existing Code behavior: applied design/source synchronization, value-owner navigation, visible instance/shared scope, same-source draft protection before visual preview, Apply/Discard states, and distinct applied-selection versus visible-source copying.
- CW5–CW7 refine selection after structural Apply, reuse the draft safeguard for document Undo/Redo, and require reliable authored-source locations before highlighting an Apply error.
- IM1–IM3 refine the existing import flow: usable entries and supplied compositions, supported initial inputs, faithful preview readiness, destination layout, draft protection, and one-command placement with separate package preparation.
- MT1–MT4 record dedicated `get_context`, `get_source`, `create_frame`, and `insert_html` contracts, preserving common read rules and the archived inventory.
- `insert_html` adopts semantic and whitespace preservation, meaningful Layers hierarchy without artificial wrappers, supported rendering independent of available panel controls, editor labels separate from HTML IDs, and compact results with scoped descendant reads.
- Mixed-layout insertion, selection, later Properties edits, source reads, Undo/Redo, and save/reopen remain required real-editor proof rather than passed documentation checks.
- CT1–CT6 record dedicated component inspection, import, instance-prop update, and source-update contracts, accepting agent-authored multi-file compositions through the existing component service.
- Read-only inspection precedes one Import call that prepares and places React JSX/TSX with required CSS or Tailwind v4, Base UI-flavored shadcn, Motion, SVG, and supporting assets; no separate authoring tool is added for each technology.
- Component edits preserve per-value source bindings, instance/shared ownership, explicit Only this limits, and atomic related-file updates without adding a second design authority or agent feedback loop.
- Core inline [inspection](../doc_v1/mcp/tools/inspect_component_import.md#agreed-json-exchange) and [Import](../doc_v1/mcp/tools/import_component.md#agreed-json-exchange) JSON are accepted, including explicit Free coordinates and Flex child order.
- Core [property updates](../doc_v1/mcp/tools/update_component_props.md#agreed-json-exchange) and [source updates](../doc_v1/mcp/tools/update_component_source.md#agreed-json-exchange) now encode set/unset inputs, changed/removed files, and explicit All copies/Only this scope.
- Remaining update value/resource/path/copy mappings and real-editor checks are in the [component-update backlog](../backlog/mcp/command-contracts.md#component-update-schema-implementation-decisions).
- [Shared resource preparation](../doc_v1/import-export/component-import.md#shared-source-and-resource-preparation) now records normal manifests/lockfiles, managed assets, explicit stylesheet loading and required Tailwind source detection, and validated entry/export changes through the existing service.
- Core React JSON stays unchanged; extended transfer fields and actual resource/style/portability verification remain open.
- The combined component MCP/editor proof remains unverified; extended source transfer, inspection reports/fingerprints, and package/runtime support remain in the [component-import backlog](../backlog/mcp/command-contracts.md#component-import-schema-implementation-decisions).
- ET1–ET7 record dedicated `update_styles`, `set_text`, `move_nodes`, `resize_node`, and `replace_node_html` contracts through existing canonical/source owners and command validation.
- Movement preserves the current parent and constraints; resizing respects per-axis ownership and requires explicit supported mode conversion without removing existing human drop or keyboard-reorder workflows.
- Ordinary replacement reuses the insertion importer, retaining a compatible root ID and parent/order while allocating fresh descendant IDs; unsafe required references or unsupported payloads reject the whole call.
- Core [style JSON](../doc_v1/mcp/tools/update_styles.md#agreed-json-exchange) now records one target, direct values/existing token references, explicit removal/unlinking, and shared-source scope.
- Detailed style grammar, mode-aware unlinking, ownership checks, and semantic layout fields remain in the [style implementation backlog](../backlog/mcp/command-contracts.md#style-schema-implementation-decisions).
- Core [text JSON](../doc_v1/mcp/tools/set_text.md#agreed-json-exchange) records plain-string content, empty-value identity retention, explicit shared-source scope, and compact results.
- Rich representation/range replacement, serialization, and actual text MCP/editor proof remain in the [text implementation backlog](../backlog/mcp/command-contracts.md#text-schema-implementation-decisions).
- Core [movement JSON](../doc_v1/mcp/tools/move_nodes.md#agreed-json-exchange) records shared delta or explicit per-target positions, current-parent coordinates, source scope, and duplicate/ancestor overlap rejection.
- Coordinate/constraint conversion, shared-owner aliases/conflicts, and actual movement MCP/editor proof remain in the [movement implementation backlog](../backlog/mcp/command-contracts.md#movement-schema-implementation-decisions).
- Core [resize JSON](../doc_v1/mcp/tools/resize_node.md#agreed-json-exchange) records per-axis Fixed/Fit/Fill changes, explicit Fixed conversion, source scope, and compact results.
- Limits, coupled SVG/transformed geometry, sizing ownership, and actual resize MCP/editor proof remain in the [resize implementation backlog](../backlog/mcp/command-contracts.md#resize-schema-implementation-decisions).
- Root compatibility/metadata precedence and other actual MCP/editor proof remain in the focused [editing-tool backlog](../backlog/mcp/command-contracts.md#editing-tool-implementation-decisions).
- Dedicated [reorder_nodes](../doc_v1/mcp/tools/reorder_nodes.md), [rename_nodes](../doc_v1/mcp/tools/rename_nodes.md), and [delete_nodes](../doc_v1/mcp/tools/delete_nodes.md) contracts adopt structural order/parent changes, editor naming, and supported removal through existing identity/source/layout rules.
- Core [reorder JSON](../doc_v1/mcp/tools/reorder_nodes.md#agreed-json-exchange) records explicit destinations, post-removal indices, submitted batch order, and required Free/workspace positions.
- Geometry, explicit Absolute Position transition encoding, shared-owner handling, and actual MCP/editor proof remain in the [reorder implementation backlog](../backlog/mcp/command-contracts.md#reorder-schema-implementation-decisions).
- Core [rename JSON](../doc_v1/mcp/tools/rename_nodes.md#agreed-json-exchange) records per-target labels, changed-only results, and unchanged revision/history for no-change requests.
- Name validation, durable source-layer label metadata, and actual MCP/editor proof remain in the [rename implementation backlog](../backlog/mcp/command-contracts.md#rename-schema-implementation-decisions).
- Core [delete JSON](../doc_v1/mcp/tools/delete_nodes.md#agreed-json-exchange) records explicit targets, overlap rejection, shared-source scope, and compact deleted-root results.
- Reference reconciliation, subtree locks, shared-owner handling, managed-resource retention, and actual MCP/editor proof remain in the [delete implementation backlog](../backlog/mcp/command-contracts.md#delete-schema-implementation-decisions).
- Public MCP [Undo/Redo is deferred to V1.1](../backlog/mcp/undo-redo-v11.md); application history and Undo/Redo remain V1, including recovery of successful agent edits.
- Token reads use [list_design_tokens](../doc_v1/mcp/tools/list_design_tokens.md); [update_design_tokens](../doc_v1/mcp/tools/update_design_tokens.md) manages supported definition mutations, with existing object-binding and release boundaries retained.
- Core [token JSON](../doc_v1/mcp/tools/update_design_tokens.md#agreed-json-exchange) records one definition operation, default-only value editing, stable-token results, and authoritative in-use deletion checks.
- One [get_screenshot](../doc_v1/mcp/tools/get_screenshot.md) contract covers button-to-frame and bounded workspace inspection across existing render families, reusing revision-matched stable capture without mutating design/view state or introducing a feedback loop.
- Core [screenshot JSON](../doc_v1/mcp/tools/get_screenshot.md#agreed-json-exchange) accepts exactly one stable target or finite workspace rectangle, optional temporary named states, and PNG metadata alongside native image content; unsupported or excessive captures must fail without a substitute image.
- One MCP [export](../doc_v1/mcp/tools/export.md) contract reuses complete code/image/PDF output, explicit scope/state/options, required saving, and destination publication from the existing exporter.
- Core [export JSON](../doc_v1/mcp/tools/export.md#agreed-json-exchange) records ordered stable targets, supported formats, applicable options, file/directory destinations, completed outputs/warnings, and browser first Save for Untitled projects.
- [update_attributes](../doc_v1/mcp/tools/update_attributes.md) reuses real content owners and managed-image preparation for supported sources, alternative text, and links, preserving continuing identity, placement/fitting, and atomic history.
- [duplicate_nodes](../doc_v1/mcp/tools/duplicate_nodes.md) reuses same-project Copy/Paste, creating fresh identities while retaining shared component definitions, assets, and token references.
- Core [copy JSON](../doc_v1/mcp/tools/duplicate_nodes.md#agreed-json-exchange) records explicit destinations/positions, submitted order, existing-list indices, and fresh-root/count results.
- Geometry, shared destination-scope encoding, reference remapping, and actual copy MCP/editor proof remain in the [copy implementation backlog](../backlog/mcp/command-contracts.md#copy-schema-implementation-decisions).
- Core [attribute JSON](../doc_v1/mcp/tools/update_attributes.md#agreed-json-exchange) records assignments/removal, local/managed/external image descriptions, and shared-source scope.
- Detailed attribute/resource grammar, staging/retention, ownership, and actual attribute MCP/editor proof remain in the [attribute implementation backlog](../backlog/mcp/command-contracts.md#attribute-schema-implementation-decisions).
- [get_context](../doc_v1/mcp/tools/get_context.md) now supplies the overview; dedicated [get_node](../doc_v1/mcp/tools/get_node.md), [get_tree](../doc_v1/mcp/tools/get_tree.md), and [get_computed_styles](../doc_v1/mcp/tools/get_computed_styles.md) own authored details, hierarchy, and revision-matched browser results.
- [Font agent access](../doc_v1/interface/font-management.md#agent-access) now includes accepted [import_asset](../doc_v1/mcp/tools/import_asset.md) registration and ordinary HTML/CSS or React font loading; standalone `list_fonts` remains outside V1.
- Core [asset JSON](../doc_v1/mcp/tools/import_asset.md#agreed-json-exchange) records local-file registration, typed metadata, and identical-registration reuse with unchanged revision/history when no records change.
- Formats/transfers, font declarations/loading, registration equivalence, conflicts, and actual MCP/editor proof remain in the [asset implementation backlog](../backlog/mcp/command-contracts.md#asset-schema-implementation-decisions).
- [update_node_settings](../doc_v1/mcp/tools/update_node_settings.md) covers own locks and eligible frame token modes; human and MCP hide/show are [V1.1](../backlog/layer-visibility-v11.md).
- Core [settings JSON](../doc_v1/mcp/tools/update_node_settings.md#agreed-json-exchange) accepts exactly one own-lock or frame-mode key, rejects combined unlock/mode edits and visibility, and preserves own-versus-effective no-change semantics.
- The active inventory has 28 dedicated contracts; [later release decisions](../backlog/mcp/tool-release-scope.md) retain browser project management, per-command validation, and source-based conditional styling without promoting their standalone candidates.
- The [shared tool-error contract](../doc_v1/mcp/tool-errors.md) records required code/message/next-action JSON and known identity/source context, delivered with `isError: true`; failed preparation, later autosave, and runtime diagnostics retain their existing state distinctions.
- Core JSON schemas and examples for the seven [focused reads](../doc_v1/mcp/read-tools.md#json-schemas-and-examples) and [create_frame](../doc_v1/mcp/tools/create_frame.md#agreed-json-exchange) are accepted, including explicit registry filters/count completeness, requested browser properties/bounds/render state, and command/project/revision creation fields.
- Core [insert_html](../doc_v1/mcp/tools/insert_html.md#agreed-json-exchange) and [replace_node_html](../doc_v1/mcp/tools/replace_node_html.md#agreed-json-exchange) JSON schemas/examples are accepted, covering parent/index versus workspace placement, compact creation counts, and continuing replacement-root identity.
- Detailed [read](../backlog/mcp/command-contracts.md#read-schema-implementation-decisions), [frame-creation](../backlog/mcp/command-contracts.md#frame-creation-schema-implementation-decisions), and [HTML](../backlog/mcp/command-contracts.md#html-schema-implementation-decisions) validation, other schemas, and actual MCP/editor verification remain open.

Stretch is excluded from V1 by user decision, with no backlog entry.

These refine the adopted features without accepting the remaining proposals.

### Remaining scope

Column wrapping, independent row/column gaps, multi-line alignment, exact wrapper placement, constraint reference geometry, and browser/source conversion details remain open in the linked contracts and [backlog](../backlog/README.md#open-topics).
Token schema, CSS naming/scope, source mapping, reference accounting, and paired-field binding details remain implementation questions in that backlog.
Original Grid controls, temporary-pan shortcuts, fit controls, and measured-edit implementation rules are not newly accepted by this audit.
The original suggested document names are possible destinations, not requirements to reproduce ORC's directory structure.
Local MCP transport and read responsibilities are accepted following the final-stack discussion, which is now underway.
The earlier folder stays in the [MCP backlog](../backlog/README.md#mcp-reference-drafts); historical catalog coverage does not finalize SDK pins, schemas, or the remaining tools.
MC1–MC4 check the new active MCP documents and their links, not a running server or additional simultaneous-editing features.
Application implementation and platform verification remain separate from these documentation checks.

# ORC-web backlog

This directory tracks ideas and decisions that still need discussion.
Backlog entries are not product requirements until they are accepted and recorded in [`../doc_v1/`](../doc_v1/README.md).

## Correction records

- The [Properties background shorthand correction](properties-background-shorthand.md) records its reproduction, native CSS projection, and completed development/built Chromium regression.
- The [renderer boundary record](renderer-boundaries.md) tracks ordinary input, SVG styles and overlay corrections, the explicit SVG stylesheet limits, and detailed React event, portal/modal, Tailwind, export and animation-performance handoffs with reproduction recipes, acceptance checks and unresolved decisions.

## Open topics

- Complete the remaining [Constraints ownership and integration boundaries](constraints-boundaries.md), including Fit/transform/aspect-ratio combinations, production component bindings, MCP operations, product exports and platform checks.

- Complete the accepted [top-level frame controls](frame-controls.md) after production React/Motion stable-state integration is available.
  The independent frame-name overlay does not establish Still view support; loose animated objects retain an explicit unresolved scope question.

- Resolve the [measured Pen solver blocker and integration boundaries](pen-integration.md) before claiming the approved Pen extension complete.

- Complete the accepted V1 [canvas pointer gestures](canvas-pointer-gestures.md), including general sizing ownership, several-object reparenting, and sizing-owned handles.

- Review the [SVG source parser's initial bundle cost](source-parser-bundle-size.md) before release while preserving the verified source and rendering behavior.
- Resolve [orphaned project-lock recovery](project-lock-recovery.md) after removing the reproduced automatic-reclamation race.
- Resolve the measured [native layout projection limits](native-layout-projection.md) before claiming general Flex Fill and constraint support.
  The [intrinsic Column wrapper proposal](intrinsic-column-wrapper-proposal.md) records the approved native projection, its source/history/export consequences and the verified ordinary intrinsic checkpoint.

- Validate the recommended React, Vite, and browser-check foundation with the real ORC-web implementation before treating it as final.
- Implement the real editor workflow using the Babel/Recast direction established by [PR1–5 source-editing validation](../doc_v1/architecture/react-source-editing-validation.md); completed Fedora fixture checks are not pending handoff work.
- Define production binding identity and reconciliation after Code Apply, including harmless formatting and source movement, while preserving command-owned selection and refusing uncertain targets.
  The [Code Apply identity record](code-apply-identity.md) separates the corrected equivalent-source churn from remaining meaningful-edit and ambiguous-replacement work.
- Implement Properties/Layers, supported Only this boundaries, and hidden-content controls with the existing source-ownership contract rather than expanding recognition to every React pattern first.
- Verify same-page imported styles, frame-local portals, and editing around live components in the actual workspace; the isolated dialog proof does not settle those boundaries.
- Implement and verify [selected-frame Preview](../doc_v1/interface/workspace-and-canvas.md#selected-frame-workflow), including session reset, saved-default restoration, reachable Exit Preview with modal content, zoom-corrected Motion dragging, and the supported mapping of viewport-based responsive styles.
- Integrate component source and binding storage with the portable `.orc` bundle; experiment selection/reveal JSON is not canonical design state.
- Implement the accepted [edit/save separation](../doc_v1/architecture/command-engine-and-history.md#command-lifecycle), including revision-aware Saved status, same-session reconnection after save failure, and consistent multi-file save recovery on Fedora and Windows.
- Implement and verify the accepted [local rendering service](../doc_v1/architecture/system-architecture.md#local-rendering-service), including candidate checks and visual exports with the editor tab closed, matching render inputs, browser cleanup, and recoverable failures.
- Implement and verify the accepted [startup modes](../doc_v1/architecture/system-architecture.md#startup-and-runtime-modes) and [normal terminal shutdown](../doc_v1/architecture/system-architecture.md#normal-terminal-shutdown) on Fedora and Windows, including one-command development launch, built-app serving, pending-save completion, failed-save recovery, and process cleanup.
- Integrate the accepted [portable dependency records](../doc_v1/architecture/orc-workspace-bundle.md#managed-dependencies), including fresh-computer preparation, exact versions, unavailable-package handling, and rebuildable installation/cache locations.
- Verify the finished editor in visible Chrome on Fedora and Windows, including focus, clipboard, fonts, and workspace gestures.
- Reevaluate PR5's declaration-only Tailwind patch when selecting or changing the application's pinned compiler dependency.
- Implement the accepted [TS6 baseline and TS7 checkpoint](../doc_v1/architecture/typescript-tooling.md), record exact compiler pins, and track any blockers before promoting TS7.
- Implement the accepted [local MCP connection workflow](../doc_v1/mcp/mcp-server.md) and [context/source reads](../doc_v1/mcp/read-tools.md); finalize SDK pins and schemas and perform the [client and platform checks](../doc_v1/mcp/sdk-and-protocol-research.md#implementation-verification-still-required).
- Implement the accepted core JSON exchanges for [create_frame](../doc_v1/mcp/tools/create_frame.md#agreed-json-exchange) and [insert_html](../doc_v1/mcp/tools/insert_html.md#agreed-json-exchange); finish frame placement and the [HTML implementation decisions](mcp/command-contracts.md#html-schema-implementation-decisions), then run the actual [mixed-layout editor proof](../doc_v1/mcp/tools/insert_html.md#mixed-layout-example-and-required-editor-proof) before claiming support.
- Implement and verify [component inspection](../doc_v1/mcp/tools/inspect_component_import.md), [one-call component import after inspection](../doc_v1/mcp/tools/import_component.md), [instance-prop updates](../doc_v1/mcp/tools/update_component_props.md), and [atomic source-file updates](../doc_v1/mcp/tools/update_component_source.md); finalize source/asset transfer, inspection fingerprints, scope/result schemas, and supported package requirements, then run the [combined React/Tailwind/Base UI/Motion/SVG editor proof](../doc_v1/mcp/tools/import_component.md#required-composition-proof) on Fedora and Windows.
- Implement and verify [update_styles](../doc_v1/mcp/tools/update_styles.md), [set_text](../doc_v1/mcp/tools/set_text.md), [move_nodes](../doc_v1/mcp/tools/move_nodes.md), [resize_node](../doc_v1/mcp/tools/resize_node.md), and [replace_node_html](../doc_v1/mcp/tools/replace_node_html.md); settle their focused [value, text-range, geometry, and replacement decisions](mcp/command-contracts.md#editing-tool-implementation-decisions) before claiming support, then run the required MCP/editor checks on Fedora and Windows.
- Implement and verify [reorder_nodes](../doc_v1/mcp/tools/reorder_nodes.md), [rename_nodes](../doc_v1/mcp/tools/rename_nodes.md), and [delete_nodes](../doc_v1/mcp/tools/delete_nodes.md), including structural/source ownership, ordering and placement schemas, durable labels, no-op names, deletion references, and exact application-history restoration.
- Implement and verify [list_design_tokens](../doc_v1/mcp/tools/list_design_tokens.md) and [update_design_tokens](../doc_v1/mcp/tools/update_design_tokens.md), including the accepted registry filter/result JSON, supported values/units, shared-source reference accounting, CSS projection, and in-use deletion refusal.
- Implement [get_computed_styles](../doc_v1/mcp/tools/get_computed_styles.md#agreed-json-exchange) explicit property/bounds requests and unavailable results; verify actual revision-matched rendering, workspace border boxes, viewport/frame dimensions, and supported stable states before claiming measurement support.
- Implement and verify [get_screenshot](../doc_v1/mcp/tools/get_screenshot.md), including object-to-frame targets, inherited styling, crop/clipping bounds, stable named states, image limits, matching revisions, closed-tab rendering, and unchanged project/view/history state.
- Implement and verify [export](../doc_v1/mcp/tools/export.md), finalizing scope/options, Untitled save prerequisites, destination naming, and complete directory/multi-file publication under the [export implementation decisions](mcp/command-contracts.md#export-implementation-decisions).
- Implement and verify [update_attributes](../doc_v1/mcp/tools/update_attributes.md), including supported attributes/removal, image transfer and asset retention, real ordinary/React owners, identity/fitting preservation, whole-request failure, application history, and save/reopen.
- Implement and verify [duplicate_nodes](../doc_v1/mcp/tools/duplicate_nodes.md), reusing same-project Copy/Paste with fresh IDs and bindings, shared resource references, validated destination/placement, whole-call rejection, and application Undo/Redo plus save/reopen.
- Finalize [get_node details](../doc_v1/mcp/tools/get_node.md) and [get_computed_styles measurements](../doc_v1/mcp/tools/get_computed_styles.md), including field limits, source-owned expressions, geometry/reference boxes, render state, revision agreement, unavailable measurements, and current versus written save revisions.
- Implement the accepted core JSON exchanges for [get_context](../doc_v1/mcp/tools/get_context.md), [get_tree](../doc_v1/mcp/tools/get_tree.md), and [get_node](../doc_v1/mcp/tools/get_node.md); settle their [remaining read-schema decisions](mcp/command-contracts.md#read-schema-implementation-decisions), including bounded responses, typed owners/values, and SDK integration, then verify actual reads.
- Verify `get_tree` default depth one, stable ordered hierarchy, explicit completeness, closed-tab reads, and no fabricated runtime rows.
- Implement and verify [import_asset](../doc_v1/mcp/tools/import_asset.md), including file/metadata/transfer formats, name conflicts, reusable resources, ordinary HTML/CSS and React font loading, history retention, and portability.
- Implement and verify [update_node_settings](../doc_v1/mcp/tools/update_node_settings.md), including own/inherited locks, eligible frame mode resolution, invalid-setting rejection, history, and save/reopen; visibility mutations remain V1.1.
- Implement and verify separate [object-source](../doc_v1/mcp/tools/get_source.md) and [component-file](../doc_v1/mcp/tools/get_component_source.md) reads, including default entry versus explicit files, actual owners, reliable locations, bounded completeness, missing-file errors, and applied-state/draft exclusion.
- Finalize wire schemas and production verification for the [28 accepted MCP responsibilities](../doc_v1/mcp/tools/README.md); historical rows and [later release decisions](mcp/tool-release-scope.md) do not expand V1.
- Define any desktop conversion path for the accepted ORC-web `.orc` folder format.
- Define component manifests, support for npx based import workflows, and behavior for packages that need unsupported runtime features.
- Record the exact current stable Chrome version used for each Fedora and Windows V1 verification run, and choose a minimum version only if implementation requires one.
- Review the accepted behavior and remaining proposals in the detailed [Flex layout](../doc_v1/interface/flex-layout.md) and [Constraints](../doc_v1/interface/constraints.md) documents derived from the user-supplied Paper transcripts.
- Define exact wrapper-placement defaults, Wrap in Flex eligibility, and detailed browser mapping for the accepted initial sizing, layout-mode switches, and Fit/Fill rules; verify keyboard shortcuts on Fedora KDE and Windows.
- Verify wrapped-Row line formation for Fill children, width bounds, and mixed min/max sizes; settle Column wrapping, separate row/column gaps, and detailed multi-line alignment before adding their controls.
- Define the canonical layout schema and browser/CSS mapping, including constraint reference boxes, size limits, aspect ratios, transformed objects, and atomic MCP operations.
- Define the canonical rich-text data shape and range indexing, choose the redistributable default font, and settle accepted font file formats and family-name conflict behavior.
- Implement and verify the accepted [Layers panel](../doc_v1/interface/layers-panel.md), including durable source-backed labels and locks and ancestor-state indicators; dedicated visibility controls follow the [V1.1 plan](layer-visibility-v11.md).
- Settle the Layers contract's remaining keyboard/focus behavior, inherited-state indicators, feedback for other rejected names, and any session preference storage without changing its accepted opening, rename, lock, or expansion defaults; retain the separate future visibility workflow.
- Implement and verify the accepted [Edit/Preview wheel routing](../doc_v1/interface/workspace-and-canvas.md#workspace-zoom), including nested scrolling, separate frame scroll positions, and workspace protection at scroll boundaries.
- Verify held-arrow command grouping and decide keyboard reordering for several selected Flex children; the accepted single-item reorder and Free-position nudge rules remain unchanged.
- Define the [token implementation decisions](../doc_v1/interface/tokens-and-modes.md#open-implementation-decisions): schema and value grammar, CSS naming/scope and source authority, reference counts, paired-field bindings, names and focus, and indirect shared-update locks.

## Deferred beyond the first V1 workflow

The dedicated [MCP Undo/Redo backlog](mcp/undo-redo-v11.md) schedules the two public MCP history tools for V1.1.
Application Undo/Redo remains V1, and successful MCP design mutations still record ordinary shared-history entries.

The [MCP tool release scope](mcp/tool-release-scope.md) keeps public project listing/create/open/rename and fresh whole-project validation outside MCP V1, with a later release unassigned.
Standalone font listing and conditional-style management also stay outside MCP V1 with no assigned later release.
Browser project workflows, per-command validation, required font rendering, supported source edits, and reads of known diagnostics remain supported.

The dedicated [Layer visibility backlog](layer-visibility-v11.md) schedules saved human hide/show and MCP visibility mutations for V1.1 while retaining authored visibility and persisted data.

The dedicated [multi-frame Preview backlog](multi-frame-preview-v1x.md) schedules side-by-side comparison of selected frames for later V1.x.
V1 previews one selected frame; the exact comparison release is not assigned.

The dedicated [shared-update lock backlog](shared-update-locks-v1x.md) schedules detailed handling of indirect token/component updates for later V1.x, outside V1.1.

The dedicated [Layers dragging backlog](layers-drag-drop-v11.md) schedules row reordering and moving between parents for V1.1.
V1 retains the existing canvas movement and Flex keyboard reordering workflows.

The dedicated [Properties V1.x backlog](properties-panel-v1x.md) records deferred visual controls, including image positioning, token features, panel preferences, broader React recognition, bulk edits, and Duplicate.
Its [V1.1 control schedule](properties-panel-v1x.md#v11-properties-controls) records the listed Text typography/Overflow, font import/unavailable-font/replacement, and Replace SVG controls while preserving their original research documents.

The dedicated [Light and Dark token editing backlog](token-modes-v11.md) schedules the Tokens panel's mode-value editing controls for V1.1 while retaining default-value editing and preservation of existing mode values in V1.
The [total token count display](token-count-v11.md) is scheduled for V1.1; V1 keeps Search directly below Layers/Tokens and preserves individual token reference counts.

The dedicated [Typography token backlog](typography-tokens-v11.md) schedules creation and individual value editors for V1.1 while preserving existing typography tokens and their supported rendering and export in V1.

The dedicated [imported-token backlog](imported-token-management-v11.md) schedules recognition and panel exposure of imported component/theme tokens for V1.1; V1 retains the styles and theme inputs required by supported imports.

- Revisit manual frame creation after V1; existing and imported frames remain supported in V1.
- Add manual insertion of new image and SVG files in V1.x; V1 retains image replacement and supported SVG styling, while Replace SVG is scheduled for V1.1 above.
- Revisit custom panel docking and rearrangement after the fixed workspace layout with resizable panels is established.

- Reconsider Grid layout after Free, Row, and Column work well.
- Add marquee selection and bulk Properties editing after the basic several-object actions are proven in V1.
- Add alignment guides and snapping for object edges, centers, equal spacing, matching sizes, and frame padding after V1.
- Add SVG path, anchor-point, and Bézier-handle editing after the V1 SVG selection and styling workflow is proven.
- Define support for dynamic Tailwind expressions, custom plugins, arbitrary package CSS, and imported projects outside the V1 [Tailwind component workflow](../doc_v1/import-export/tailwind-components.md).

## Application integration skills

The [application integration plan](application-integration-skills.md) records the X discussion's conclusion and two agent workflows: existing application to ORC and refined ORC design to application.
The repository contains [orc-design-import](../skills/orc-design-import/SKILL.md) and [orc-repo-sync](../skills/orc-repo-sync/SKILL.md) instructions with evidence checkpoints and user discussion before failure repair.
Execution against a real application, supported ORC operation interfaces, and release assignment remain open.

## MCP reference drafts

The earlier MCP folder is preserved here as provisional reference material.
The new [local MCP server](../doc_v1/mcp/mcp-server.md) and [read-tool contract](../doc_v1/mcp/read-tools.md) now own the accepted transport, connection lifetime, and repeated-iteration workflow.
The [individual tools folder](../doc_v1/mcp/tools/README.md) owns the twenty-eight agreed tools in separate files, including focused overview/object/tree/token/measurement/source reads, asset registration, locks/frame modes, same-project copying, complete export, and content attributes.
The [SDK research](../doc_v1/mcp/sdk-and-protocol-research.md) records stable-release recommendations separately from accepted product behavior.
These older drafts do not finalize exact SDK pins, protocol adoption, schemas, or a 39-tool V1 inventory.
Focused consolidations and [release decisions](mcp/tool-release-scope.md) now account for the historical candidates; the active tool contracts own current responsibilities.

- [MCP server draft](mcp/mcp-server.md).
- [Candidate tool catalog](mcp/tool-catalog.md).
- [MCP command-contract draft](mcp/command-contracts.md).

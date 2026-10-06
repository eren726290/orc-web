# Command contracts

## Status

Provisional MCP command-contract reference retained for the final MCP discussion.
This draft preserves earlier schema recommendations for browser actions and the 39 candidate MCP tools.
The [active MCP server contract](../../doc_v1/mcp/mcp-server.md) and [read-tool contract](../../doc_v1/mcp/read-tools.md) own the newly accepted connection and read behavior.
The [individual tool contracts](../../doc_v1/mcp/tools/README.md) own accepted reads, frame/HTML creation and replacement, component inspection/import/prop/source behavior, and supported visual-value edits.
The historical envelopes below do not override those contracts or finalize their schemas.
The accepted application editing rules remain in [Command engine and history](../../doc_v1/architecture/command-engine-and-history.md); this reference does not finalize MCP schemas or tools.

## Common mutation input

Every document mutation provides a unique `commandId`, `documentId`, and integer `expectedRevision`.
The operation then provides explicit stable target IDs and an operation-specific payload.
`create_document` and `open_document` have no existing document target and use `expectedRevision: null`.

The implementation must use one schema source to derive browser routes, MCP inputs, TypeScript types, generated tool descriptions, and tests.
Tools must not accept arbitrary document patches.

## Shared mutation behavior

The engine validates the complete request before it changes the document.
It rejects missing targets, duplicate targets, invalid values, locked targets, parent-child cycles, invalid component properties, incompatible token use, and revision conflicts.
Batch commands are atomic.
One failed target causes the full request to fail without a partial document change.

A successful mutation returns `ok`, `commandId`, `documentId`, the committed `revision`, `affectedNodeIds`, and operation-specific output.
Success commits the server's active project and history; it does not confirm a completed disk save.
Disk saving follows the shared [command lifecycle](../../doc_v1/architecture/command-engine-and-history.md#command-lifecycle) and project save-status contract.
The historical failure envelope is superseded for active MCP tools by the [shared error contract](../../doc_v1/mcp/tool-errors.md).
That contract requires code/message/next action, includes reliably known context, and uses text JSON with `isError: true` rather than success-shaped content.

Candidate Apply failures return a recoverable error without committing a new revision.
Later runtime component errors are diagnostics attached to the current local editor session, not failed document mutations.
Read tools expose those diagnostics with the applied source or project context so an agent can inspect the current problem through its normal fresh read.

Reusing a completed `commandId` with identical input returns the first result.
Reusing it with different input fails.

## Stable IDs and targets

Commands target generated document IDs.
A source-backed component layer uses its generated editor ID, which resolves through a validated source binding.
Commands never target a Layer label, an HTML `id` attribute, CSS selector text, browser source range, or an arbitrary imported component runtime DOM node.
The workspace root is a documented virtual target for tools that list or place root objects.

## Command classes

| Class | Examples | Expected behavior |
| --- | --- | --- |
| Read | `get_node`, `get_tree`, `list_design_tokens` | Does not change revision or persistence. |
| Edit | `move_nodes`, `set_text`, `update_component_props` | Validates, commits the active project, increments revision, records Undo, and schedules autosave where a save location exists. |
| Import | `insert_html`, `import_component`, `import_asset` | Inspects or validates first, then commits all managed state together. |
| Lifecycle | `create_document`, `open_document`, `rename_document` | Changes the open project state and project bundle when successful. |
| Export | `export` | Reads one committed revision and writes outside the canonical design state. |

## Revision and renderer rules

The command engine owns the committed revision.
The browser may render a temporary drag preview, but it sends one final measured command to commit the gesture.
Computed-style, screenshot, and export commands that rely on browser rendering must identify the revision they measured or rendered.
When no matching renderer is available, they return a stable renderer-unavailable result.

## Undo and Redo contract

Every successful editable command creates one Undo entry unless its command-specific contract says otherwise.
Undo and Redo each change revision because they create new committed document states.
Undo restores the documented inverse of the original command.
Redo restores the original forward result if the history branch remains valid.
This is application history behavior; public MCP `undo` and `redo` exposure is [scheduled for V1.1](undo-redo-v11.md).
Successful V1 MCP design mutations still create their normal application-history entries.

## Import contract

`inspect_component_import` performs no document mutation.
`import_component` requires a current inspected candidate fingerprint and rechecks source before committing.
The import either stores a complete usable component record and managed files or stores nothing.
An import failure never leaves a partial component node in the document.
The dedicated [component inspection](../../doc_v1/mcp/tools/inspect_component_import.md) and [import](../../doc_v1/mcp/tools/import_component.md) contracts own agent-authored source bundles and one-call preparation/placement after inspection.
The [prop update](../../doc_v1/mcp/tools/update_component_props.md) and [source update](../../doc_v1/mcp/tools/update_component_source.md) contracts own instance inputs, atomic related files, and explicit shared or supported independent source scope.
The historical shared-source summary in the catalog does not restrict the accepted Only this operation or permit unsupported copying.

## Destructive commands

`delete_nodes` removes complete selected subtrees.
`update_design_tokens` rejects deletion of a token that still has a design reference.
`update_component_source` rejects a source or manifest update that makes existing instance properties or slots invalid.
All destructive command results name the affected stable IDs.

## Shared-error implementation decisions

The [shared error schema](../../doc_v1/mcp/tool-errors.md#error-payload-schema) records required stable code/message/next-action fields, optional reliable context, and native SDK tool-error delivery.

- Finish the stable code taxonomy and mappings from existing service failures, retaining SDK protocol errors separately.
- Verify target/source attribution, one-based line/column conversion, and omission of unavailable context without exposing private drafts.
- Integrate the adapter's JSON text payload with `isError: true`; test actual client delivery and success-schema bypass with the selected SDK.
- Verify rejected candidates leave applied design/history unchanged, later autosave preserves successful edits, and export publication failures preserve prior output.

Use actual MCP calls and existing editor workflows on Fedora and Windows; static payload checks do not establish SDK behavior, recovery, source mapping, or state preservation.

## Editing-tool implementation decisions

The following work completes accepted tool responsibilities; it does not add new human controls or broaden React recognition.
Use one canonical/source ownership and command service for accepted editing tools rather than implementing separate MCP-only edits.

- [update_styles](../../doc_v1/mcp/tools/update_styles.md#agreed-json-exchange): core single-target assignment/removal/unlink JSON is accepted; finish property/value grammar, ownership/scope validation, and atomic semantic layout fields under the [style implementation decisions](#style-schema-implementation-decisions).
- [set_text](../../doc_v1/mcp/tools/set_text.md#agreed-json-exchange): core plain-string JSON and scope are accepted; finish formatting-range policy, supported rich representation, serialization, and runtime checks under the [text implementation decisions](#text-schema-implementation-decisions).
- [move_nodes](../../doc_v1/mcp/tools/move_nodes.md#agreed-json-exchange): displacement/per-target JSON and target-overlap rejection are accepted; finish coordinate, shared-owner, constraint, and measurement behavior under the [movement implementation decisions](#movement-schema-implementation-decisions).
- [resize_node](../../doc_v1/mcp/tools/resize_node.md#agreed-json-exchange): per-axis Fixed/Fit/Fill JSON and explicit conversion are accepted; finish limits, coupled geometry, ownership, and measurement behavior under the [resize implementation decisions](#resize-schema-implementation-decisions).
- [replace_node_html](../../doc_v1/mcp/tools/replace_node_html.md): define compatible root kinds/semantics, existing versus submitted metadata/placement precedence, affected reference checks, and managed-record reconciliation.
- [reorder_nodes](../../doc_v1/mcp/tools/reorder_nodes.md#agreed-json-exchange): core destination/index/batch JSON and per-target Free/workspace positions are accepted; finish geometry, explicit Absolute Position transition encoding, shared-owner handling, and runtime checks under the [reorder implementation decisions](#reorder-schema-implementation-decisions).
- [rename_nodes](../../doc_v1/mcp/tools/rename_nodes.md#agreed-json-exchange): per-target JSON, changed-only target results, and no-change revision/history behavior are accepted; finish durable source-layer label metadata, name validation, and runtime checks under the [rename implementation decisions](#rename-schema-implementation-decisions).
- [delete_nodes](../../doc_v1/mcp/tools/delete_nodes.md#agreed-json-exchange): core target/scope JSON, overlap rejection, and deleted-root results are accepted; finish references, shared owners, managed-record retention, and runtime checks under the [delete implementation decisions](#delete-schema-implementation-decisions).
- [update_design_tokens](../../doc_v1/mcp/tools/update_design_tokens.md#agreed-json-exchange): single-operation JSON and compact token results are accepted; finish category-specific values/units, CSS projection, and authoritative reference checks under the [token implementation decisions](#token-schema-implementation-decisions).
- [duplicate_nodes](../../doc_v1/mcp/tools/duplicate_nodes.md#agreed-json-exchange): explicit destination/position JSON, submitted order, existing-list indices, and fresh-root/count results are accepted; finish geometry, source-backed destination scope, reference mapping, and runtime checks under the [copy implementation decisions](#copy-schema-implementation-decisions).
- [update_attributes](../../doc_v1/mcp/tools/update_attributes.md#agreed-json-exchange): assignment/removal JSON, local/managed/external image descriptions, and source scope are accepted; finish supported types, resource preparation/retention, and runtime checks under the [attribute implementation decisions](#attribute-schema-implementation-decisions).

Reuse the shared HTML importer for replacement and insertion, including the agreed supported grammar, assets, existing tokens, and whole-payload failure behavior.
Keep wire result/error envelopes compact and source locations reliable.
Prove actual MCP calls, supported ordinary and React ownership, subsequent Properties/Code/source reads, locks/stale targets, atomic failures, Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Replacement proof must also cover retained root identity/location, fresh descendant identities, invalidated old handles, and refusal of incompatible roots or required references that cannot survive.
These are open implementation checks, not results from the earlier React fixtures or documentation gates.

## Style-schema implementation decisions

[update_styles](../../doc_v1/mcp/tools/update_styles.md#agreed-json-exchange) records accepted single-target JSON, direct values or existing token references, explicit `unsetStyles`/`unlinkStyles`, and shared-source scope.

- Finish applicable camelCase property names, supported units/value grammar, individual sides/corners, shorthand/longhand conflict checks, and type/category compatibility through the shared ownership service.
- Define removal against actual inherited/default/source behavior without resetting unrelated variants or layout values.
- Resolve unlinking at the expected revision and applicable target mode; settle shared-source uses across different modes and refuse unresolved or ambiguous values rather than inventing a literal.
- Enforce explicit All copies/Only this scope for actual shared owners, validate continuing target identities and nested independent-copy limits, and retain local/input ownership for locally owned values.
- Agree semantic fields for Free/Row/Column, wrapping, alignment/distribution, Absolute Position, and their coupled measurement/sizing/constraint conversions; raw CSS must not bypass them.
- Define limits, unchanged/no-op results, useful errors, and SDK registration from the existing schema authority.

Verify ordinary and React/Tailwind styles, compatible token references, direct assignment, clearing, unlinking, asymmetric sides/corners, and shared versus independent ownership through the actual MCP endpoint.
Check invalid values, locks/stale revisions, required measurement/resource failures, whole-request rejection, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static schema/example checks do not prove CSS/source fidelity, token resolution, safe copying, or running editor behavior.
This is remaining V1 implementation work, not a deferred new feature.

## Text-schema implementation decisions

[set_text](../../doc_v1/mcp/tools/set_text.md#agreed-json-exchange) records accepted plain-string replacement, empty-content identity retention, explicit shared-source scope, and compact results.

- Finish supported rich-text storage/payloads and range indexing through the existing Text representation; a plain string cannot establish arbitrary formatting-range preservation.
- Define reliable segment replacement and preservation of surrounding formatting ranges; reject whole-value replacements that would lose formatting or require uncertain remapping, with Code/source editing available.
- Verify exact text serialization for quotes, Unicode, markup-like characters, meaningful spaces, paragraphs, and line breaks without creating executable markup or unintended JSX children.
- Enforce actual input constraints for empty values, stable instance/record ownership, All copies/Only this scope, required bindings, and the accepted nested-copy limits.
- Define value/payload limits, unchanged/no-op results, useful errors, and production SDK registration using the shared command/schema authority.

Verify ordinary headings and text, two initially identical React usages, instance-owned and shared text, supplied slots, and local collection records through the actual MCP endpoint.
Check unchanged Layer labels/semantic roles/sizing, natural reflow, exact formatting restoration, ambiguous rich-text rejection, locks/stale revisions, whole-call failures, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove serialization, source ownership, rich-text fidelity, safe copying, or running editor behavior.
This completes accepted V1 text-content editing without promoting deferred typography/Overflow panel controls.

## Movement-schema implementation decisions

[move_nodes](../../doc_v1/mcp/tools/move_nodes.md#agreed-json-exchange) records mutually exclusive shared-displacement or per-target-position requests, signed/fractional document coordinates, explicit shared-source scope, and compact results.
Duplicate IDs and overlapping ancestor/descendant targets are rejected before mutation.

- Finish workspace versus immediate-parent geometry under the existing Constraints reference convention, including borders, padding, transforms, clamped sizes, and source/CSS conversion.
- Resolve target aliases to actual position owners under the requested scope before writes; do not apply a shared displacement repeatedly to one owner, and reject conflicting destinations for that owner.
- Validate applicable constraint offsets and coupled both-edge relationships without changing the requested parent, sibling order, or placement mode.
- Enforce shared/instance ownership and supported independent-copy boundaries for every requested target before one atomic commit.
- Define measurement availability/revision checks, limits, unchanged/no-op results, useful errors, and production SDK registration through the shared service.

Verify both request forms for roots, Free children, Absolute Position children, compatible batches, and eligible React bindings through the actual MCP endpoint.
Check negative/fractional values, different canvas zoom levels, current-parent coordinates, shared aliases/conflicts, Right/Bottom/Center/both-edge constraints, and unchanged unrelated Motion/style/content.
Reject unsupported Flex pixel movement, duplicate or overlapping ancestor/descendant targets, locks/stale revisions, unsafe copying, and unavailable required geometry/measurements without partial movement.
Exercise subsequent reads, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove coordinate mapping, source/constraint fidelity, alias handling, or running editor behavior.

## Resize-schema implementation decisions

[resize_node](../../doc_v1/mcp/tools/resize_node.md#agreed-json-exchange) records one target, per-axis Fixed/Fit/Fill requests, explicit Fixed conversion, shared-source scope, and compact results.

- Finish supported dimension grammar, unit/zero/minimum/maximum validation, no-op results, and errors through the shared sizing authority.
- Resolve per-axis canonical/source/input ownership and parent-controlled or constraint-controlled axes before writing; never use a value-only request to change Fit, Fill, or both-edge control.
- Define Fill availability, same-axis dependency checks, Fit measurement, and coupled parent reflow under the existing Flex layout rules.
- Define proportional SVG requirements, locked aspect-ratio conflicts, transformed geometry, and source/CSS mapping without deriving saved dimensions from zoomed screen bounds.
- Validate shared-source scope, supported Only this copying, required Tailwind styles/bindings, candidate rendering, and measurement/revision matching before one atomic commit.
- Register the schema with the production SDK through the existing command/schema authority.

Verify each axis independently and together for ordinary objects, frames, text, images, SVG, and eligible React bindings through the actual MCP endpoint.
Check Fixed values, explicit Fit/Fill conversion, both-edge control, Fill dependency failures, limits, frame reflow, text wrapping, image fitting, proportional SVG behavior, Motion preservation, locks/stale revisions, and whole-call failure.
Exercise subsequent reads, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove sizing ownership, browser layout, source fidelity, candidate rendering, or running editor behavior.

## Reorder-schema implementation decisions

[reorder_nodes](../../doc_v1/mcp/tools/reorder_nodes.md#agreed-json-exchange) records explicit parent IDs or workspace root, post-removal indices, submitted target order, per-target required positions, source scope, and compact results.

- Finish destination-coordinate conversion, borders/padding/transforms, required revision-matched measurements, and coupled sizing/constraint changes through the existing layout service.
- Define the explicit input encoding for moving into Absolute Position in a new Flex parent; preserve existing participation on same-parent reorders and never infer Absolute Position from coordinates.
- Resolve shared source aliases and validate compatible slots/collections, supported Only this copying, stable identities, required imports/styles, and candidate rendering before one commit.
- Finish input limits, unchanged/no-op results, errors, and production SDK registration through the shared command/schema authority.

Verify post-removal indices including beginning/end/append, out-of-range rejection, submitted batch order, mixed source parents, and duplicate/ancestor-overlap rejection through the actual MCP endpoint.
Check Free/Flex/workspace transitions, exact position coverage, preserved same-parent placement, cycles, locks/stale revisions, unsupported bindings, source scope, and whole-call failure.
Exercise selection continuity, subsequent hierarchy/source reads, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove structural/source ownership, geometry conversion, browser rendering, or persistence.

## Rename-schema implementation decisions

[rename_nodes](../../doc_v1/mcp/tools/rename_nodes.md#agreed-json-exchange) records explicit per-target labels, duplicate-target rejection, changed-only results, and unchanged revision/history when no labels change.

- Finish name length, supported characters, whitespace classification, and normalization through the same naming authority as the human Layers workflow.
- Define durable per-layer React label metadata without depending on DOM positions, renaming source identifiers, or invoking component copying.
- Validate every target and applicable lock before change detection; verify exact changed-target order, mixed batches, unchanged results, useful errors, and SDK registration through the existing command service.

Verify ordinary objects and supported React layers, identical labels on different IDs, duplicate targets, empty/whitespace/equal names, mixed changed/unchanged entries, stale revisions, and invalid or locked targets even when their requested names are unchanged.
Check unchanged visible text, source identifiers, styles, hierarchy, and selection; exercise application Undo/Redo and save/reopen through the actual MCP endpoint and Chrome editor on Fedora and Windows.
Static JSON checks do not prove durable metadata, change detection, lock enforcement, or persistence.

## Delete-schema implementation decisions

[delete_nodes](../../doc_v1/mcp/tools/delete_nodes.md#agreed-json-exchange) records explicit targets, duplicate/ancestor-overlap rejection, shared-source scope, and requested deleted-root results.

- Finish required reference/input/slot reconciliation, subtree lock checks, and shared-source owner alias handling through the existing deletion service.
- Validate supported Only this copying, affected source/bindings, candidate rendering, and stable removal identities without changing unrelated instances or definitions.
- Retain reusable shared records and resources required by surviving content or retained Undo; define managed-record reconciliation without premature asset deletion.
- Finish input limits, useful errors, and production SDK registration through the shared command/schema authority.

Verify loose objects, nested containers, whole frames, one of two component instances, and supported JSX/slot/local-data deletion through the actual MCP endpoint.
Check missing/duplicate/overlapping targets, locked descendants, stale revisions, required-slot refusal, explicit scope, safe copying, shared-owner aliases, deleted-root ordering, and whole-request rejection.
Exercise selection fallback, unavailable removed handles, source reads, exact-ID restoration through application Undo/Redo, shared-resource retention, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove reference reconciliation, subtree locks, source ownership, rendering, history, or persistence.

## Copy-schema implementation decisions

[duplicate_nodes](../../doc_v1/mcp/tools/duplicate_nodes.md#agreed-json-exchange) records explicit destinations, per-source Free/workspace positions, submitted copy order, existing-list indices, and fresh-root/count results.

- Finish destination geometry, sizing/constraint conversion, revision-matched measurements, and explicit Absolute Position transition encoding through the existing Copy/Paste service.
- Define explicit scope encoding for copies that change shared source-backed destination composition; reject ambiguous ownership rather than silently changing every instance or making definitions independent.
- Validate fresh canonical/layer identities, internal-reference remapping, original-to-copy correspondence, accurate canonical object counts, compatible slots/local data, and retained shared dependencies/resources.
- Finish limits, useful errors, and SDK registration through the shared command/schema authority.

Verify ordinary subtrees, complete frames, and initially identical React instances; check submitted order, indices with originals retained, exact position coverage, duplicate/ancestor rejection, destination locks, stale revisions, and whole-call failure.
Inspect copied content through hierarchy/source reads, edit an instance-owned value without changing the original, and verify retained shared token/implementation behavior.
Exercise application Undo/Redo with restored copied IDs, source/binding fidelity, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove copying, reference mapping, source scope, geometry, rendering, or persistence.

## Attribute-schema implementation decisions

[update_attributes](../../doc_v1/mcp/tools/update_attributes.md#agreed-json-exchange) records explicit assignments/removal, local/managed/external image descriptions, source scope, and continuing target/revision results.

- Finish supported attribute names/types, canonical/React projection, required versus optional removal, and unchanged/no-op results through the existing attribute authority.
- Define accepted image formats, local path resolution, URL schemes, transferred-content encoding, managed-asset membership, and source/export URL projection through the shared resource service.
- Validate owner/scope and supported Only this copying, coupled source/asset staging, required rendering, and retention of resources needed by other references, the last valid save, or retained Undo.
- Finish limits, useful attribute/resource errors, and production SDK registration without accepting raw handlers or style/source rewrites.

Verify local/managed/external image replacement, empty alternative text, link values, optional removal, set/unset overlap, invalid required removal, and preserved identity/placement/fitting.
Check corrupt/missing assets, stale/locked targets, unsupported computed values, shared/local owners, failed copying, and whole-request failure without committed residue.
Inspect actual source, exercise application Undo/Redo including prior image references, and verify Untitled first Save, portability, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not establish attribute eligibility, resource preparation, source ownership, rendering, or persistence.

## Asset-schema implementation decisions

[import_asset](../../doc_v1/mcp/tools/import_asset.md#agreed-json-exchange) records local-file registration, stable asset IDs, typed metadata, and identical-registration reuse without a new revision or Undo entry when nothing changes.

- Finish supported image/SVG/font formats, local-path resolution, extended transferred-content and explicit font-declaration inputs, reliable metadata extraction, and resource-type/MIME agreement.
- Define identical-content/metadata equivalence, supported font descriptor grammar, inclusion handling, and conflict rules without silently replacing an existing resource or family.
- Wire managed registration and required font CSS loading into ordinary HTML/CSS and React rendering; registration must not require a dummy component or assign a new family to objects.
- Preserve resources needed by applied references, the last valid save, or retained Undo; finish errors, limits, and production SDK registration through the shared service.

Verify image/SVG/font registration, reuse through actual authoring/image-replacement tools, and typed metadata results through the MCP endpoint.
Check identical reuse, changed content at the same path, filename-only matches, font conflicts, corrupt/missing files, stale requests, no-change revision/history, and whole-call failure without dangling records.
Exercise new-registration application Undo/Redo, font loading/reflow, Untitled first Save, save/reopen, and complete portable export in Chrome on Fedora and Windows.
Static JSON checks do not prove content detection, metadata, equivalence, managed retention, rendering, or persistence.

## Settings-schema implementation decisions

[update_node_settings](../../doc_v1/mcp/tools/update_node_settings.md#agreed-json-exchange) records one own-lock or eligible frame-mode assignment and compact target/revision results.

- Finish durable source-backed lock metadata, canonical setting storage, and own/effective mode read encoding through existing services.
- Enforce ancestor protection, targeted explicit Unlock, preserved descendant own locks, and frame-mode eligibility without combined unlock/design edits.
- Detect unchanged saved settings after target/revision/eligibility validation; distinguish own intent from an equal current inherited result.
- Finish mode resolution, required candidate rendering, errors, limits, and production SDK registration; human and MCP visibility remain V1.1.

Verify ordinary/React lock metadata, locked ancestors and children, explicit Unlock, and continued Preview interactions through the actual MCP endpoint.
Check root/nested frame Light/Dark/Inherit, default fallback, unchanged literal colors/token definitions/editor theme, invalid combinations, stale targets, no-change results, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove metadata durability, lock enforcement, mode resolution, rendering, history, or persistence.

## Token-schema implementation decisions

[update_design_tokens](../../doc_v1/mcp/tools/update_design_tokens.md#agreed-json-exchange) records one create/default-edit/rename/delete operation and stable-token results.

- Finish accepted color/alpha and length/unit grammars, category-specific ranges, name validation, and unchanged-value/name results through the existing token authority.
- Preserve category, CSS identity, existing Typography values, and Dark overrides; default editing must not create mode overrides or automatically link matching literals.
- Finish generated CSS naming/collisions and registry-to-CSS/source projection without another editable authority.
- Validate authoritative supported references and required preparation before deletion or shared updates; partial displayed counts cannot establish that deletion is safe.
- Finish useful errors, limits, and production SDK registration from the shared schema authority.

Verify all four operations, linked ordinary/React uses, compatible object linking, units, stable renames, hidden/source references, preserved Dark overrides, and in-use deletion refusal through the actual MCP endpoint.
Check stale/invalid requests, failed preparation without partial projection, application Undo/Redo, and save/reopen in Chrome on Fedora and Windows.
Static JSON checks do not prove value grammar, reference accounting, CSS/source fidelity, rendering, history, or persistence.

## Read-schema implementation decisions

The seven [focused read contracts](../../doc_v1/mcp/read-tools.md#json-schemas-and-examples) record accepted core JSON schemas and examples.
This includes [registry filters/results](../../doc_v1/mcp/tools/list_design_tokens.md#agreed-json-exchange) and [explicit browser measurements](../../doc_v1/mcp/tools/get_computed_styles.md#agreed-json-exchange).
This remaining work completes those V1 contracts rather than adding new tools or a future release.

- Context: define response limits, scoped capability restrictions, and typed diagnostic details while preserving explicit selection availability and applied versus written revisions.
- Tree: define maximum depth, node/byte limits, and continuation for incomplete branches and child lists; preserve real parents, saved order, and explicit completeness at the requested depth.
- Node: define supported style/attribute/token, sizing/constraint, frame-mode, and input grammars, with reliable per-value owners, source locations, unavailable fields, and operation restrictions.
- Source reads: define reliable per-item owner/location descriptors, managed-file path normalization and supported formats, diagnostic details, and bounded text/file continuation; validate object excerpts versus actual files without guessing a shared owner.
- Tokens: settle category/subtype value grammars, supported linked-use descriptors, authoritative shared-source counts, and bounded registry/reference continuation without promoting imported theme variables.
- Measurements: settle supported CSS property selection, transformed/clipped workspace border-box mapping, actual frame/viewport conditions, stable animation handling, and typed partial/limit descriptors; browser results must not be replaced by authored values.
- Runtime: derive SDK registration and validation from the shared schema authority; settle application tool errors and verify the actual registered schemas with the chosen SDK.

Verify matching revisions, default depth one, stale targets, initially identical usages, source ownership, before-autosave and closed-tab reads, draft exclusion, and unchanged selection/design/history through the actual MCP endpoint.
Schema/example checks alone do not prove service behavior or complete JSON Schema dialect support in the production SDK.

## Frame-creation schema implementation decisions

[create_frame](../../doc_v1/mcp/tools/create_frame.md#agreed-json-exchange) records the accepted command/project/revision fields, name, position, size, optional parent, and compact committed result.
Finish initial layout defaults, explicit Absolute Position encoding/conversion, supported size/name limits, parent-flow validation, and SDK/error/retry integration through the existing command service.
Validate root versus nested coordinate spaces, applicable ancestor locks, stale revisions, exact one-command history, and save/reopen without creating partial frames or guessing a destination.
The core JSON schema does not prove the parent layout, rendering, or command service behavior.

## HTML-schema implementation decisions

[insert_html](../../doc_v1/mcp/tools/insert_html.md#agreed-json-exchange) and [replace_node_html](../../doc_v1/mcp/tools/replace_node_html.md#agreed-json-exchange) record accepted core request/result JSON and consecutive insertion/replacement examples.
Their schemas validate shapes, while the shared HTML importer and command service must enforce the meaningful-root and ownership rules.

- Define supported tags/attributes/inline CSS, canonical semantics and rich-text ranges, meaningful whitespace, token fallbacks, and layout mappings without a second saved styling authority.
- Settle managed/local/external resource addressing and preparation, retained files, and whole-payload failure without committed residue.
- Verify container indices against the current child list, ordered multiple-root insertion, one positioned workspace root, and workspace position versus authored root-CSS conversion/precedence.
- Define replacement root compatibility, existing versus submitted metadata/placement precedence, required-reference reconciliation, and retained root versus fresh descendant identities.
- Define payload/size limits, useful diagnostics and reliable fragment locations, and SDK/error/retry integration through the shared schema and command authority.

Verify matching command/project/revision results, actual created-object counts, subsequent Layers/Properties/source reads, locks/stale targets, whole-call rejection, application Undo/Redo, and save/reopen through the actual MCP endpoint in Chrome on Fedora and Windows.
JSON/example checks cannot establish parser fidelity, rendering, structural compatibility, or command history.
This completes accepted V1 responsibilities without adding another tool or promoting deferred human controls.

## Component-import schema implementation decisions

[Inspection](../../doc_v1/mcp/tools/inspect_component_import.md#agreed-json-exchange) and [Import](../../doc_v1/mcp/tools/import_component.md#agreed-json-exchange) record accepted core inline-source examples, Import success fields, and workspace/Free/Flex placement.
The accepted [shared preparation rules](../../doc_v1/import-export/component-import.md#shared-source-and-resource-preparation) use normal manifests/lockfiles, managed assets, stylesheet entries, required Tailwind source inputs, and explicit component entry/export changes.
Finish their exact dependency/version, theme, asset, declaration, initial-input, and local/npm/npx/registry transfer fields without dropping existing candidate responsibilities.
Wire stylesheet loading and required-source registration into the chosen preparation/compiler service; verify that an existing but unloaded stylesheet or undetected required class does not pass as a faithful render.
Define fingerprint coverage and encoding, managed path normalization and uniqueness, entry/export validation, inspection report capabilities and diagnostics, payload limits, and SDK/error integration through the shared schema authority.
Validate required props/defaults and previously inspected input freshness, destination layout and indices, preparation/render/binding failures, and atomic source/resource/instance commit through the actual import service.
Verify one complete mixed React composition, subsequent reads and Properties edits, Preview interaction, application Undo/Redo, and save/reopen through the actual MCP endpoint in Chrome on Fedora and Windows.
The minimal inline schemas and documentation checks do not establish those runtime results.

## Component-update schema implementation decisions

[Property updates](../../doc_v1/mcp/tools/update_component_props.md#agreed-json-exchange) and [source updates](../../doc_v1/mcp/tools/update_component_source.md#agreed-json-exchange) record accepted core schemas for instance values, explicit override removal, managed text files/removals, and shared or supported independent scope.
Finish supported property/resource/token encoding, required/default validation, overlapping set/unset detection, and command no-op/error handling through the existing input and schema authority.
Define managed-path normalization and ownership, duplicate/change/removal conflict checks, supported new-file formats, and independent-copy path/result mappings.
Settle dependency, binary-asset, and entry/export changes using the same representations as Import under the shared preparation rules; the core file schema does not encode those extended operations.
Verify that changed requirements, source, asset references, and generated styles apply atomically and that recorded versions/styles/assets reproduce on a fresh computer; build-tool support alone does not prove that ORC service behavior.
Verify request/result identities and revisions, the mandatory instance ID in Only this results, existing input/slot/collection compatibility, affected bindings, prepared styles, and complete candidate rendering before atomic commit.
Exercise two initially identical instances, nested-owner copying limits, multi-property/file rejection, draft exclusion, locks/stale revisions, application Undo/Redo, and save/reopen through the actual MCP endpoint and Chrome editor.
Documentation JSON checks cannot establish source ownership, safe copying, runtime behavior, or persistence.

## Screenshot implementation decisions

[get_screenshot](../../doc_v1/mcp/tools/get_screenshot.md#agreed-json-exchange) records stable-target or bounded-region inputs, optional supported named states, and revision-matched PNG metadata alongside native MCP image content.

- Finish target-to-rendered-bounds mapping, crop/overflow/clipping/transforms, backgrounds, scale/density, and pixel/response limits without silent reduction or partial substitute images.
- Resolve and report supported default/requested named component states; validate target membership, duplicate state IDs, reliable ownership, and stable custom animation appearances without using private Preview inputs.
- Verify actual PNG encoding/dimensions, native image delivery, metadata/image/revision agreement, and SDK/error integration from the shared schema authority.
Reuse the local capture service without a separate renderer or saved project authority.
Verify inherited styles, all supported rendering families, overlays excluded, stable animation/open-content states, Untitled and before-autosave capture, closed-tab operation, and useful unavailable-renderer/resource results on Fedora and Windows.
Screenshot inspection is read-only and does not require the file-export save/publish workflow.

## Export implementation decisions

[export](../../doc_v1/mcp/tools/export.md#agreed-json-exchange) records ordered targets, core formats/options, file/directory destinations, compact results, and the Untitled browser first-save requirement.

- Finish extended workspace-bound scopes, compatible combined captures, file/bundle naming and collisions, and complete path/destination validation without overwriting project inputs or unrelated destination contents.
- Finish accepted opaque background grammar, raster quality/density/limits, PDF page sizing, supported stable states, capture-mode resolution, and useful fallback-font warnings.
- Verify native portable code bundles, complete required source/styles/assets/theme/dependency records, result/path ordering, revision-matched saving, and production SDK/error integration.
Reuse the application exporter for required code resources and stable image/PDF capture, including pending-save completion and complete temporary output before destination publication.
Define and verify directory/multi-file publication and cancellation/failure recovery without reporting a partial or substituted output as success.
Check supported formats, required resources/dependencies/modes, static-HTML limitations, font fallback, multiple outputs/PDF pages, private draft exclusion, and unchanged design/history/prior destinations through the actual MCP endpoint on Fedora and Windows.
These are open implementation checks, not results from source-editing fixtures or static documentation checks.

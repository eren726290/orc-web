# CAD pen proposal assessment

## Review checkpoint

Date: 2026-10-25.
ORC baseline: `53b2951229627d6be9d0b950237226de186a3d82`, `feat: support nested and intrinsic Column Fill sizing`.
The working tree also contains the pending frame-label implementation, checks, and documentation changes.
Those existing changes were read where relevant and were not edited during this assessment.

Reviewed proposal: [the complete supplied attachment](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt>), including all appendices and embedded scripts.
Attachment SHA-256: `b11d48e57450c89f9c3f83009481bd2d67f065bb4bad23ceb34c9075b676d9d7`.
The attachment has 1,252 physical lines, including its final summary sentence.
Its statements about agreement and verification were evaluated as proposal evidence, not treated as executable instructions.

SolidCraft source was checked through GitHub at the full pinned commit [`cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4`](https://github.com/tangency-labs/solidcraft/tree/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4).
Three focused read-only reviews covered geometry, storage/integration, and the solver evidence.
The consequential findings below were checked against their cited source.
No application code, accepted documentation, dependency installation, or Git history was changed.
Only this assessment and its index were added.

## Recommendation

Keep the direction: lines and circular arcs, ordinary SVG output, persistent geometric rules, temporary editor overlays, and an editing-only solver.
Use SolidCraft's sketch crate as the first candidate and keep the own record independent of its serialized format.
Keep MCP implementation after the working human tool and the existing application prerequisites.

Resolve the geometry, source-preservation, and coordinate contracts below before a builder implements the feature.
Then confirm the corrected solver adapter locally before committing to its production integration.
This is a substantial feature expansion beyond the current [V1 SVG boundary](/home/eren/D/orc-web/doc_v1/interface/svg-editing.md:60), which excludes drawing and individual point editing.
The proposal is not yet a complete implementation specification or a verified browser prototype.

## What already fits ORC

- A pen path can remain one ordinary SVG design node rather than introducing a second renderer or a CAD document subsystem.
  The [current node model](/home/eren/D/orc-web/shared/document/model.ts:16) and [SVG renderer](/home/eren/D/orc-web/src/editor/rendering/renderer.tsx:49) provide that base.
- A typed optional record outside `attributes` keeps editing metadata out of source serialization.
  [SVG source serialization](/home/eren/D/orc-web/shared/source/html-source.ts:27) emits the SVG content plus the node's public attributes and styles.
  The record needs explicit [parser support](/home/eren/D/orc-web/shared/document/document.ts:25).
- Existing commands clone the document, validate, publish one revision, and retain whole-document history.
  Source, pen record, attributes, and layout changes can therefore share [one atomic transaction](/home/eren/D/orc-web/server/projects/projects.ts:80).
  Whole-document [saving and reopening](/home/eren/D/orc-web/server/projects/bundle.ts:62) can carry the new record once its parser is implemented.
- Existing pointer gestures and [overlay invalidation](/home/eren/D/orc-web/src/editor/canvas/README.md:6) are useful patterns for preview, cancellation, and guide updates.
  They do not already implement path geometry editing.
- Own path IDs, source mismatch detection, normal SVG exports, and deferred MCP tools preserve the intended application boundaries.
  Rich Quiver-style output remains later work; this first tool does not provide its gradients, Bézier editing, holes, or production agent workflow.

## React and export effects

An ordinary SVG pen node does not need production React component integration to render in today's canvas.
The solver runs while editing; exported artwork should require only the generated SVG.
The own record belongs to the ORC project, so exporting plain SVG and importing it again intentionally loses pen rules under the proposed own-path-only boundary.
Existing project history and duplication should preserve the record.

This does not establish point editing inside arbitrary imported JSX or place new paths inside a managed React component's source.
Those operations need the future component ownership and source-editing contracts.
Production React integration and complete product exports are still pending in the [implementation overview](/home/eren/D/orc-web/IMPLEMENTATION_STATUS.md:22).
Keep these boundaries explicit in the builder handoff.

## Findings to resolve before implementation

These are proposal and integration findings, not newly reproduced bugs in the current application.
Effort estimates describe the bounded correction or prototype, not the entire pen feature.
All findings have high confidence from the cited source or explicit geometric counterexample.

| ID | Finding | Impact | Effort | Risk of correction |
| --- | --- | --- | --- | --- |
| P1 | Store complete arc geometry and traversal direction. | Reopening or removing a rule could change the artwork. | M | Medium: establishes the own record and converter contract. |
| P2 | Specify source reconciliation and eligibility separately from the `d` hash. | A recolor could discard rules, or transformed source could retain incorrect handles. | M | Medium: touches source replacement and identity. |
| P3 | Define transform-preserving bounds updates and pointer conversion. | Editing could move or rescale a resized or rotated path. | M | High: coordinates, placement, sizing, and layout interact. |
| P4 | Make the half-circle limit consistent with exact endpoints and closure. | Closing an arc could create an unintended straight edge. | S | Low: settle the behavior before implementation. |
| P5 | Validate the encoded SVG as well as full-precision geometry. | Rounding could collapse a valid segment or change an arc. | S | Medium: affects persistence and geometric tolerances. |
| P6 | Correct and reproduce the solver confirmation. | Current timings and success reports do not prove the proposed drag behavior. | M | Low for an isolated confirmation; integration depends on its result. |
| P7 | Include every coupled write and layout check in the atomic command. | Source, bounds, record, and dependent layout could disagree. | M | Medium: shared command and preview paths change. |
| P8 | Define keyboard precedence and persistent ID allocation. | Anchor operations could trigger object actions or reuse deleted identities. | M | Medium: gesture and history boundaries change. |

### P1 — Complete arc geometry

The [proposed record](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:165>) lists only each arc's endpoints and leaves its center undecided.
Recomputing a center from an incoming tangent works only while that relationship exists.
The later agent workflow permits removing a rule, and deleting an endpoint can leave an arc at the beginning of an open path.
Two endpoints alone do not determine its circle.

Recommendation: retain the solved center and a directed traversal, or an equivalent complete circular-arc representation.
Tangency is a removable relationship between geometries; it must not be the only place the arc's geometry exists.
Arc centers can remain internal and noninteractive.
The [upstream arc representation](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/model.rs#L65) also includes a center.

The spike's [SVG writer](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:745>) always emits sweep flag `1` for its fixture.
That does not cover both directions of a connected path.
Require mirrored left/right arcs and reversed traversal in the converter checks.
SVG explicitly gives sweep direction a separate [arc parameter](https://www.w3.org/TR/SVG/implnote.html#ArcOutOfRangeParameters).

### P2 — Source preservation and compatibility

Keeping color and stroke width outside the [geometry hash](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:178>) is sensible.
It is not sufficient to preserve the record through the current Code workflow.
[Applying changed source](/home/eren/D/orc-web/server/source/html.ts:59) imports a replacement node, and the [SVG importer](/home/eren/D/orc-web/src/editor/code/html-import.ts:176) constructs an ordinary SVG node without pen metadata.
An equivalent unchanged Apply is a separate early return.

Add deliberate reconciliation for a compatible edit of the same selected SVG root.
Retain the record only when the supported generated path structure, geometry, and coordinate interpretation still match.
An unchanged `d` can coexist with a new path transform, wrapper transform, or additional visible path, so hash equality alone cannot establish editing eligibility.
Keep a geometry hash separate from validation of the supported structure and mapping.
Legitimate node movement or proportional sizing must remain compatible.
Define whether harmless formatting changes are normalized or intentionally detach the record.

Do not promise that applying a changed ancestor's source preserves descendant pen identities.
The [source module](/home/eren/D/orc-web/server/source/README.md:6) explicitly leaves meaningful structural identity reconciliation unfinished.
Record that boundary and provide the agreed detachment notice rather than silently retaining incorrect metadata.

### P3 — Coordinates, bounds, and stroke

The proposal promises both [local coordinates and appearance-preserving reboxing](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:192>).
Existing overlay observation supplies invalidation, and [selection measurement](/home/eren/D/orc-web/src/editor/canvas/Canvas.tsx:317) supplies an axis-aligned screen rectangle.
Neither supplies an inverse SVG coordinate transform.
The existing [parent-coordinate helper](/home/eren/D/orc-web/src/editor/layout/coordinates.ts:11) rejects transformed chains, and [Free placement conversion](/home/eren/D/orc-web/src/editor/layout/free-placement.ts:146) rejects rotation and scale beyond translation.

Example: a 100-unit-wide SVG displayed at 200 pixels has scale 2.
If a point edit expands its local bounds to 110 units, simply writing a width of 110 pixels would change the display scale.
Changing bounds also changes a percentage-based rotation origin unless placement compensates.
Normal Flex placement cannot always accept that compensation.

Freeze the applied mapping at gesture start, use a verified inverse SVG matrix for pointer coordinates, and preserve the mapping for unchanged anchors during bounds updates.
The browser provides [`getScreenCTM()`](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM); its use still needs checking through ORC pan/zoom, viewBox, and supported transforms.
Reject unsupported placement conversions with an explanation rather than silently changing layout mode.
Compute bounds from line and arc extrema plus the supported stroke caps and joins, not just anchor minima and maxima or an unexplained padding constant.
Document whether H/V rules and displayed measurements use local path axes after rotation.

### P4 — Half-circle limit and exact closure

The [drawing rules](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:98>) cap backward arcs at a half circle while also allowing an exact closing arc to the first anchor.
These promises need a boundary rule.
From `(0,0)` with incoming direction `(1,0)`, the circle tangent in that direction through `(-1,1)` has center `(0,1)` and requires a 270-degree forward sweep.
A 180-degree cap on that circle ends at `(0,2)`, not `(-1,1)`.
Adding `Z` from the capped endpoint would create an extra straight segment.

Recommendation: show any projected endpoint explicitly for ordinary drawing, and refuse an incompatible closing arc rather than falsely reporting exact closure.
The owner should approve this clarification if it changes the intended cap behavior.
Require exact first-anchor closure and a single intended closing segment in the checks.

### P5 — Precision and degeneracy

The [three-decimal output policy](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:186>) can turn `(0,0)` to `(0.0004,0)` into a zero-length line.
A sufficiently small positive radius can similarly serialize as zero.
Full-precision validity therefore does not imply that the saved and rendered path is valid.

Choose an explicit minimum representable geometry or deterministic precision that retains supported small geometry.
Validate the final emitted path and its agreement with the own record before publishing it.
Use the same tolerances and encoding on the browser and server.
Reproducible output does not require silently collapsing geometry to a fixed three-decimal grid.

### P6 — Solver evidence and reproducibility

The selected package and APIs exist at the pinned source.
The [crate manifest](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/Cargo.toml#L1) identifies `solidcraft-sketch` and its limited dependency set.
This is a reasonable candidate to confirm, not evidence that the entire SolidCraft application must be embedded.

The [spike drag wrapper](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:810>) moves a point and calls `solve_with` with `reference: None`.
Upstream documents a [pre-move reference](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/solver.rs#L1284) for retaining construction orientation during a drag.
Its own [drag implementation](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/engine/src/cmd/sketch_drag.rs#L137) passes the complete last solved positions and restores a failed or wrapping step.
Repeat confirmation with the intended adapter semantics before treating the reported shape changes as inevitable solver behavior.

Additional corrections:

- The [build recipe](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:592>) comments a commit after `git clone` but never checks it out.
  Pin the full SHA, wrapper, compatible exact toolchain, dependency lock, and optimization tool version, and record the final binary hash.
- The [reported results](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:467>) are Node sandbox measurements, not browser interaction evidence.
  The wrapper is stateful, and the fixture covers one family of line/arc chains.
  Add asserted geometry checks, both turn directions, Perpendicular, closure, rule removal, deletion, record reload, and rejection recovery.
- A printed radius of `0.0` after one-decimal rounding does not prove an exactly zero radius.
  Preserve raw values and assert the chosen geometric threshold.
- [`StatusOnly`](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/solver.rs#L1269) deliberately reports zero degrees of freedom and no determined flags.
  Do not interpret that zero as proof that a path is fully constrained.
- A frame work budget is not a wall-clock deadline for the numerical solve.
  Capping steps per animation frame cannot interrupt one slow synchronous solve.
  Measure complete pointer frames, including conversion, SVG preview, overlays, and layout validation, on the target PC.
- The upstream [model limits](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/model.rs#L6) cap total points at 20,000 and constraints at 40,000.
  Arc centers count as solver points.
  Distinguish those existing safety limits from an optional lower product limit; do not advertise unlimited paths.

Do not automatically start a replacement TypeScript constraint solver after an unsuccessful spike.
Report the specific failure and compare the smallest remedies first.
A general constraint solver remains a substantial correctness responsibility even with only lines and arcs.

### P7 — Atomic writes and native dependency checks

The proposed edit cannot stop at source plus record.
The [public SVG source](/home/eren/D/orc-web/shared/source/html-source.ts:30) takes outer attributes from the node, while generated inner content comes from its source.
Bounds changes must update source, record, viewBox attributes, Fixed dimensions, supported placement, and any required dependent layout changes in one validated command.
Do not temporarily publish disagreement between these values.

[Calling `prepareWorkspaceMutation`](/home/eren/D/orc-web/src/editor/Workspace.tsx:153) alone does not validate a new pen mutation: today it handles text and delete explicitly and returns other kinds unchanged.
Likewise, the [current property preview](/home/eren/D/orc-web/src/editor/properties/property-preview.ts:4) does not accept SVG source or arbitrary attributes.
Extend the actual candidate/preview handling deliberately and validate the live candidate before accepting a drag step.
Server validation must check record/source agreement and geometry; [hierarchy validation](/home/eren/D/orc-web/shared/document/document.ts:112) does not do that automatically.

Future MCP layout checks still need a design, but a [working background rendering service](/home/eren/D/orc-web/server/rendering/rendering.ts:21) already exists and is used by source preparation.
Do not plan its creation from scratch or assume that its existence already implements pen candidate validation.

### P8 — Keyboard ownership and IDs

Anchor selection being separate from object selection does not prevent a key event from reaching [workspace Delete, Escape, movement, or history](/home/eren/D/orc-web/src/editor/Workspace.tsx:383).
Define precedence for idle Pen, a new path draft, selected anchors, and an active anchor drag.
Consume refused anchor deletion as well as successful deletion so it cannot fall through to deleting the whole selected object.
Specify draft Undo, tool/project changes, focus loss, Preview entry, and revision-change cancellation.
Preserve normal text, Properties, and Code keyboard access.

The record promises [IDs that are never reused](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:173>) but does not specify allocation state.
Deleting `a3` and allocating from the remaining maximum or array length can reuse `a3`.
Choose persistent allocation state or fresh identities, and define the guarantee across deletion, Undo, a new history branch, saving, and reopening.
Copying path-local IDs unchanged into a new node remains consistent with uniqueness within a path.

## Smaller factual and scope corrections

- Preview is implemented for ordinary content in [Preview.tsx](/home/eren/D/orc-web/src/editor/preview/Preview.tsx:28).
  The pen should be an Edit-only interaction; production imported React integration is still separate.
- Supported SVG recoloring and rotation are accepted contracts, not proof that all required Properties controls and gestures currently exist.
  [The status overview](/home/eren/D/orc-web/IMPLEMENTATION_STATUS.md:18) still lists resize and rotation handles as pending, and [current appearance fields](/home/eren/D/orc-web/src/editor/properties/Properties.tsx:194) do not implement SVG artwork recoloring and stroke width.
  Those are prerequisites to the complete promised workflow, not controls a builder can assume already work.
- The [MCP tool index](/home/eren/D/orc-web/doc_v1/mcp/tools/README.md:5) records 28 accepted tools; it does not establish a protocol ceiling of 28.
  Adding pen tools requires an agreed inventory change and documentation updates, not overcoming a technical hard limit.
- The [proposed future `edit_pen_path`](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:281>) includes switching line/arc segments and adding/removing rules, while the human section leaves those gestures undefined and parks a constraints panel.
  Settle that parity claim before the MCP handoff; do not silently add new human UI.
- A second development instance uses `ORC_DEV_PORT`; [scripts/dev.ts](/home/eren/D/orc-web/scripts/dev.ts:62) sets the frontend port and forces a dynamic backend port.
  Changing only `ORC_PORT` is not the development-worktree recipe.
- `crates/cad` does not exist in the [reviewed SolidCraft tree](https://github.com/tangency-labs/solidcraft/tree/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates).
  The proposal appears to mix that reference with another researched repository.
- The proposal calls unchanged `schemaVersion` both open and agreed.
  Settle its wording at adoption, explicitly document refusal by earlier builds, and version the pen record independently.
  An unchanged project schema number does not make strict earlier parsers compatible.
- The [D-shape example](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt:1227>) does not, from the stated rules alone, guarantee radius 120 after moving one anchor.
  The other anchors are free to move under the solver's minimum-movement behavior.
  State the held geometry or weaken that exact numeric expectation until measured.

## Recommended sequence after discussion

This is an ordering recommendation, not an executor handoff or implementation authorization.

1. Clarify the own record, directed arcs, source eligibility, half-circle closure, bounds mapping, precision, and keyboard lifecycle.
2. Run an isolated, pinned solver confirmation on the target PC with asserted geometry and the correct pre-move reference.
   Record browser and Bun behavior, exact build inputs, binary hash, raw measurements, rejected cases, and complete-frame timing.
3. Establish parser support, record/source validation, the atomic edit, preview, save/reopen, and history before broad UI work.
   A narrow vertical workflow should prove those boundaries together.
4. Complete lines, rules, tangent arcs, point dragging, deletion, guides, and the required existing SVG transform/style prerequisites.
5. Run focused real Chrome development/built E2E checks and affected layout, source, history, Preview, and persistence regressions.
   Check vector source now; claim image/PDF export verification only when the actual supported exporters can run.
6. Decide V1 inclusion from the verified state without delaying unrelated V1 completion indefinitely.
   Add MCP tools only after the existing application-first prerequisite is satisfied.

## Required evidence before calling the feature complete

- Correct left/right arcs, exact closure, rule removal, anchor deletion, finite values, nondegenerate encoded geometry, and reload from the own record.
- Stable geometry after move, proportional sizing, rotation, pan/zoom, parent layout changes, and later bounds edits.
- Clear snapping and rule failure feedback, keyboard ownership, editable anchors, cancellation, and no orphan draft objects.
- One command per completed drawing or drag, whole-command failure, locks/drafts/revision protection, exact Undo/Redo, and save/reopen.
- Compatible recolor and stroke-width edits retain rules; incompatible geometry or source changes detach with the promised explanation.
- Guides stay outside source, Preview interactions, canonical objects, and actual supported exports.
- Browser/Bun results identify the exact solver binary and source checkpoint.
  Node sandbox logs alone do not meet these requirements.

## Considered and not treated as defects

- The optional typed metadata field is a justified requirement for editable geometric relationships.
- Reusing whole-document history is appropriate; a second history system is unnecessary.
- Path-local IDs can be copied unchanged when the containing SVG receives a fresh node identity.
- Keeping the solver out of exported designs is consistent with SVG being the rendering authority.
- The different WASM filenames in the scripts are explicitly explained in Appendix C; they are not an unexplained binary mismatch.
- Main-thread solving is a candidate to measure first, not proof that a Worker is already necessary.
- Limited geometry, no Bézier handles, no holes, and deferred MCP are stated scope choices rather than missing promised first-version features.

## Verification limits

This assessment checked files, current command/data flow, pinned upstream source, and geometric counterexamples.
It did not build or execute the supplied wrapper, install Rust or dependencies, instantiate WASM, rerun browser/E2E checks, or audit the entire upstream solver and dependency license graph.
The reported sandbox timings remain attributed historical evidence.
No new runtime verification or claim that the pen is implemented is made.

Review completion checks: `git diff --check` passed, HEAD stayed at the recorded baseline, and SHA-256 comparison confirmed all 15 pre-existing modified or untracked files remained unchanged.
At completion of the initial assessment, the only added files were this assessment and `plans/README.md`.

## Follow-up confirmation

The owner subsequently authorized proposed contract clarification and a focused local WASM rebuild and execution in Bun and Chrome.
See the [clarifications](pen-contract-clarifications.md), [local confirmation](pen-wasm-confirmation.md), and [Figcraft reference](figcraft-reference.md).
The initial assessment's runtime limits above describe its earlier checkpoint, not the later confirmation.
The later experiment also found a directed-tangency requirement: unsigned tangency can allow a continuation to reverse even when the solver reports success.
The confirmation adds a guard and an independent negative control for that case.
Production integration and accepted documentation remain unchanged.

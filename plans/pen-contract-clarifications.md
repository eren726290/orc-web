# Pen contracts for local confirmation

## Status and boundary

These are proposed clarifications for the supplied CAD pen proposal.
The user authorized clarification and an isolated local WASM confirmation on 2026-10-25.
They do not change accepted V1 documentation, implement the production pen, or authorize application integration.
The temporary confirmation workspace is `/tmp/orc-pen-confirmation-hlZWca/`.
Its Rust source, tests, generated assets, and evidence stay outside ORC-web.

## 1. Own record and arcs

One pen node contains one connected open or closed path.
The own record has an independently versioned format, stable anchor and segment identities, full-precision coordinates, rules, and a hash of canonical generated path data.
Each arc stores its center and directed traversal as well as its start and end anchor identities.
Centers are internal geometry, not selectable anchors.
Tangency is a removable relationship and is not the only information defining an arc.
An arc remains the same arc when a tangent rule is removed, until a later edit changes its geometry.
The converter maps clockwise logical traversal to SolidCraft's counter-clockwise storage and preserves the logical direction on return.
The solver's fixed origin is not silently substituted for the user's first anchor.
All path anchors remain free except for a dragged anchor held during its solve.

IDs are opaque persistent identities, not array positions.
Fresh identities must not be derived from the current number of surviving entities.
Use fresh unique tokens for newly created entities, including after Undo followed by a new edit.
Undo restores the same identities for restored entities.
Duplicating a path may retain its internal IDs because its containing node receives a new identity.

The project's schema-version wording must be settled separately at adoption.
The strict parser must accept and validate the optional record deliberately.
Unknown record versions refuse with an explanation.
Earlier application builds that reject the new field are not compatible merely because the project schema number is unchanged.

## 2. Arc creation, limits, and closure

A creates the next tangent arc using the previous logical segment's ending direction.
The first segment of a new drawing is a line because it has no incoming direction.
Deleting an incoming segment may leave an existing arc first; its stored center and direction preserve it.
Ordinary line mode resumes after placement.
Collinear targets use the documented line fallback.
Zero-length segments, non-finite geometry, invalid circles, and sweeps beyond 180 degrees cannot be committed.

For human drawing, a half-circle cap must display its actual projected endpoint before the click commits it.
It must not pretend that this endpoint is still the pointer or a snapped first anchor.
Closing succeeds only when the arc actually reaches the first anchor within the numeric tolerance.
An incompatible closing arc is refused, with the last valid draft retained.
Do not append an unintended straight edge through `Z` to conceal a missed endpoint.
For future coordinate-exact agent calls, an endpoint requiring more than 180 degrees is rejected rather than projected.

This explicitly distinguishes ordinary cap preview from exact closure.
The owner should approve that behavior before production adoption if the original cap statement intended something different.

## 3. Numeric representation

Display measurements with one decimal as proposed.
Keep geometry as finite double-precision values.
For the confirmation, serialize SVG numbers with their deterministic round-trip representation and normalize negative zero.
Do not force three-decimal rounding when it would change supported geometry.
The same numeric record generates the same command order and path text.
Validate both the numeric geometry and its final SVG encoding.

The confirmation uses a small explicit geometric tolerance and reports raw residuals and radii.
It does not interpret a displayed `0.0` as proof of an exactly zero radius.
The production tolerance and maximum coordinate range must be chosen against supported scale and solver accuracy before integration.
The change from mandatory three-decimal output is a proposed correction to prevent numeric collapse.

## 4. Rules and solving

Human snapping may project a draft endpoint before adding a rule.
Future agent automatic rules only detect relationships already satisfied by submitted coordinates; they never silently move those coordinates.
H/V rules use the path's local axes so rotating the outer SVG preserves the record and its rule meanings.
Measurements in the record and overlay describe those local coordinates unless explicitly labeled otherwise.
The starting angular tolerance is 2.5 degrees and is independent of zoom.
Any distance-based picking or closing tolerance is measured in screen pixels and converted through the actual SVG mapping.

A drag starts from the last complete accepted state.
Pass all pre-move solver positions as `reference`, hold the dragged anchor, solve, then validate the resulting geometry.
Restore the complete prior state after either solver failure or a failed ORC geometry guard.
Successful solver status alone does not permit a collapsed line, invalid arc, or over-limit sweep.
At a connected tangent join, logical incoming and outgoing directions must agree.
Unsigned geometric tangency alone permits a cusp or reversed continuation and is insufficient.
Reject and fully roll back such a reversal, and verify this guard against an unguarded positive control.
Local testing found that ten coarse steps can reverse the outgoing line in a simple open line/arc/line path.
A 320-step continuation retained its direction on that tested move; this is evidence for the fixture, not a production step-size recommendation.
Small steps are a continuation strategy, not a guarantee of a wall-clock deadline.
Cap attempted steps per frame, keep only the last accepted result, and carry outstanding motion forward.
Use `StatusOnly` for drag checks and full analysis on release when real degrees of freedom or determined entities are needed.
Never interpret the placeholder zero degrees of freedom from `StatusOnly` as a fully constrained path.

The local confirmation checks geometry and reference handling before timing.
It reports solver-call cost separately from browser conversion, SVG projection, and frame cost.
It does not infer full ORC interaction performance from a standalone fixture.
Existing upstream total-point, constraint, and connected-component limits remain explicit constraints of the candidate solver.
The confirmation does not silently introduce a lower product limit or replace the solver.

## 5. Source compatibility and atomic publication

The own record is project editing data outside public SVG attributes.
SVG remains the renderer and export input.
A commit validates agreement between the record and the generated path before publication.
The geometry hash covers canonical generated `d`, while a separate compatibility check validates the supported structure and coordinate mapping.
The generated inner structure has one supported path and no unrecognized geometry transform or extra artwork.

Compatible fill, stroke, and stroke-width changes retain the record.
Unchanged Code Apply retains it.
A formatting-only rewrite retains it only after comparison of parsed supported geometry and structure, not by guessing from a changed string.
An incompatible path edit, transform, additional path, or replacement detaches the record with the agreed notice and leaves ordinary SVG.
Applying changed ancestor source cannot promise descendant pen identity until the ordinary structural identity reconciliation exists.
Plain SVG export intentionally omits the record; importing that SVG again yields ordinary artwork.

The edit publishes source, own record, viewBox attributes, dimensions, supported placement, and required dependent layout writes as one command.
One completed drawing or anchor drag produces one Undo entry.
Failure publishes none of those changes.
The preview must update the same SVG node temporarily and restore every changed value on cancellation.
Explicitly extend the preview and command preparation paths; merely calling the current helper does not validate a new mutation kind.
Validate the live candidate's Fill dependencies before accepting a preview step and before commit.
Server validation includes own-record structure, references, geometry, and source agreement in addition to document hierarchy.

## 6. Pointer mapping and bounds

Use the inverse of the rendered SVG's screen matrix for pointer coordinates.
Freeze the starting mapping for the gesture and cancel if its project revision or relevant placement assumptions change.
Compute path bounds including arc extrema and the supported stroke caps and joins.
Preserve the mapping of unchanged anchors through proportional sizing and rotation when the bounds change.
Do not replace display pixels with unscaled local units.

Free placement requires compensating translation and rotation-origin changes when reboxing.
Parent-controlled Flex placement also needs an explicit candidate check.
Native layout reflow is distinct from accidental geometry movement or rescaling.
If the accepted promise requires unchanged screen coordinates that the parent layout cannot preserve, refuse the candidate with an explanation rather than silently converting layout mode.
The exact permitted Flex behavior needs an integration proof before adopting the production contract.
The focused solver confirmation does not claim that proof.

## 7. Interaction ownership

The pen is an Edit-mode tool.
The states are idle Pen, new path draft, selected anchors, and active anchor drag.
Pen key handling takes precedence over object movement, object deletion, and object Escape while its state owns the event.
Refused anchor deletion consumes the event as well as successful deletion.
Normal text, Properties, and Code inputs retain their keyboard behavior.

Escape cancels an active anchor drag.
In a new path draft, Escape uses the proposed finish-or-cancel rule based on anchor count.
Undo during an uncommitted interaction cancels that interaction before affecting saved history.
Project changes, incompatible document revisions, and Preview entry cancel local drafts or previews safely.
Tool changes must settle or cancel the draft explicitly rather than creating an orphan node.
Guides and labels remain temporary editor overlays; their project view preference does not mutate the document, revision, history, or source.

## 8. Remaining adoption decisions

These clarifications do not add a constraints panel, arbitrary imported-SVG editing, Béziers, new React source editing, or MCP implementation.
The proposed future MCP operations that remove rules or convert line/arc segments exceed the currently described human gestures.
Resolve that parity claim before the MCP handoff without silently expanding human UI scope.

Before a production handoff, settle the half-circle closing behavior, round-trip numeric output, schema compatibility wording, fresh ID format, supported stroke padding, and transformed Flex placement.
The local confirmation can establish solver feasibility even while those application-specific adoption decisions remain open.

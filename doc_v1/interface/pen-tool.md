# Pen tool

## Status

The owner approved this bounded human Pen extension on 2026-10-25.
The [decision record](../../plans/pen-progress.md#adoption-decisions-presented-to-the-owner) records the approved corrections to geometry, saved format, placement and SVG prerequisites.
This contract extends the earlier SVG V1 boundary only for paths created by this tool.
The [performance record](../../backlog/pen-integration.md#measured-solver-blocker) records the measured Worker correction and remaining large-path preview latency.
Current-source acceptance belongs to the [integration ledger](../../plans/pen-final-GATES.md).

## Drawing and editing

P and the Pen toolbar button select Pen without resetting Guides & labels.
Text fields and Code keep their normal typing keys.
A new draft freezes one selected eligible frame, or uses the workspace when nothing is selected.
Ambiguous, locked and unsupported destinations explain the refusal before creating a path.
The selected frame remains the destination when the pointer crosses another frame.
New paths append to that destination's canonical child order.
Free placement follows the verified native coordinate origin.
Supported Row and Column placement uses the frame's actual end slot and displays "Frame places this path".
Native layout that moves the frozen editing origin refuses the candidate.

The first anchor and subsequent draft segments remain local until completion.
A switches only the next segment between a line and a tangent circular arc.
A first segment or collinear target without a valid tangent arc falls back to a line with an explanation.
Arcs support both directions and sweeps through 180 degrees.
A capped preview shows the actual projected endpoint.
Clicking the first anchor closes exactly; an arc that cannot reach it within the half-circle rule refuses.
Enter or Escape finishes the placed draft; an insufficient draft creates no object or history entry.
Pen-clicking the last anchor of an open path continues that containing SVG with its identity intact.

Line snapping chooses the closest eligible angle within 2.5 degrees.
Equal-angle priority is tangent, perpendicular, then horizontal or vertical.
Shift constrains ordinary placement to 45-degree steps.
Alt suspends inferred snapping while retaining the fundamental tangent construction of an arc.

Select exposes essential anchor handles on own Pen SVGs.
An anchor drag holds that anchor and permits the remaining rules to move other points.
Each candidate must pass independent geometry, SVG and native layout checks.
A refused candidate retains the complete last valid preview.
Release commits that accepted preview once and discards outstanding motion with an explanation when the target was not reached.
Exact return to the start creates no command.
Escape or document Undo during a held drag cancels that local interaction.
Lost capture, pointer cancellation, blur, changed selection/tool/project/revision/zoom and Preview entry cancel pending interaction without a later release commit.

Deleting a selected anchor reconnects its remaining neighbors with a new straight segment where needed.
Unchanged segments retain their identities and complete arc data.
Rules referencing changed segments are removed.
Deleting below two anchors uses ordinary whole-node deletion and its lock/dependency guards.
New identities do not reuse discarded anchors, segments or rules after an Undo branch.

## Artwork and transforms

Own Pen SVGs expose Fill for closed paths, Stroke, Stroke width, proportional Scale and Rotation through existing Properties fields.
Supported paint changes retain geometry, identities and rules; stroke changes also update valid bounds and placement.
Supported proportional resize and rotation handles use the actual SVG mapping and retain the required native pivot.
Resize requires proportional Fixed dimensions and never silently changes a sizing mode.
Supported own-Pen Width and Height show accurate read-only Fixed values; Scale changes both together, including after rotation.
Unsupported source-owned transforms, origins, dimensions or parent placement remain available through Code with an explanation.
<!-- codex-pc 2026-10-27: Main integration retains the bounded placement safeguards for absolute Pen paths with native Center self-alignment.
Reboxing-dependent edits refuse before changing saved geometry, source, constraints or history and explain that the user must choose Left/Top placement explicitly first.
A real stroke-width regression otherwise shifted the path by 2.5 pixels and invalidated its saved Center relationship.
Fill does not require reboxing.
This guard does not introduce direct Pen reboxing support for every ordinary constraint mode; the remaining integration boundary is recorded in `backlog/pen-integration.md`. -->

The [transform contract](../../plans/pen-transform-contract.md) records the exact gesture and cancellation behavior.
These controls do not complete general imported multicolor SVG editing or general canvas transforms.

Guides & labels controls only auxiliary construction lines, centers, measurements and rule labels.
Essential editing handles remain visible when guides are off.
The preference belongs to project-local browser view state and survives tabs and Preview restoration without revision, history or save changes.
All handles, guides and labels remain outside rendered design artwork.

## Source, history and saving

The SVG node stores ordinary renderable source and public outer attributes together with an optional versioned pen record.
The record contains one connected open or closed path, stable local anchor/segment/rule IDs and complete directed circular arcs.
The current supported record version is 1.
Unknown versions, malformed topology, duplicate identities, invalid references, nonfinite/range violations and source/record disagreement refuse instead of dropping metadata.
Numeric SVG output retains double-precision round-trip values and normalizes negative zero.
Coordinates must remain strictly inside magnitude 1e9; geometric tolerance is 1e-6 and collapsed segments at or below 1e-9 refuse.
Upstream exchange limits remain safety guards, not a smaller product path cap.

A completed operation submits one validated shared command containing source, record, outer attributes, dimensions, placement and any actual dependent CSS writes.
Undo/Redo restores all these fields together; save/reopen preserves directed geometry and identities.
Browser solving does not replace independent server validation.

Equivalent selected-root source Apply creates no history entry.
Formatting-only or supported paint edits retain the record after parsed geometry and mapping checks.
Geometry, inner transforms, additional artwork and incompatible mapping detach metadata with an explanation and retain ordinary SVG artwork.
Meaningful ancestor source replacement retains its existing fresh-descendant identity boundary and explains loss of descendant Pen editing data.
Plain SVG contains no own record, overlay or solver dependency; importing ordinary SVG does not invent a Pen record.
Image/PDF export and clipboard duplication retain their separate unfinished product dependencies.

## Deferred scope

Arbitrary imported SVG adoption, Bézier/G2 editing, holes, multiple contours, presets, booleans, typed segment/radius dimensions, external-object snapping and public MCP Pen operations remain outside this extension.
The measured main-thread blocker justified a dedicated Worker under the owner's existing implementation authority.
A different numerical solver, weaker guards or a smaller product path cap remains a separate adoption decision.

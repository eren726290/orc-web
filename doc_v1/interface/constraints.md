# Constraints

## Status and scope

Accepted V1 behavior: Constraints determine how a free-positioned child or an Absolute Position child responds when its frame resizes.
The human interface provides horizontal and vertical constraints through labeled controls and an interactive diagram.
Supported choices include start edge, end edge, both edges, and Center on either axis.
V1 does not offer proportional Stretch as a constraint mode.
Center alignment updates the relevant constraint to Center.
New free-positioned children default to Left and Top.
The supported edge and Center choices adopt the behavior shown in the user-supplied "Constraints in Paper" transcript.
Position-preserving mode changes, reparenting behavior, size-limit priority, and the canvas indicators below are accepted ORC-web decisions.

Exact coordinate conversion, browser/CSS mapping, platform shortcuts, and transformed-object behavior remain ORC-web proposals below.

This document owns how a freely positioned child responds to a parent-frame resize.
[Layers and Properties](properties-panel.md) defines when the person sees these controls for a selected object.
[Flex layout](flex-layout.md) owns the arrangement and sizing of children that participate in Flex flow.

## Source and limits

The user supplied the Paper Design transcript as text, without a video URL.
No independent viewing or verification is claimed.
The timestamp references below point to that supplied text.
The transcript describes its demonstrated cases but does not settle ORC-web's border, padding, minimum-size, transformed-object, or multi-selection rules.
Rules beyond the demonstrated Paper behavior are labeled as accepted ORC-web decisions or remaining proposals.

## Where Constraints apply

Constraints apply to a child of a Free frame and to an Absolute Position child of a Flex frame.
A participating Flex child instead follows its parent's Flex layout and its own sizing settings.
An infinite workspace has no finite edges, so loose workspace objects do not receive parent-edge constraints.

An imported component can have constraints on its outer design object.
A source-backed component layer can have Constraints only when its binding owns free or absolute positioning in the relevant parent.
ORC-web does not infer Constraints from arbitrary runtime DOM.
A nested frame may be constrained within its parent while using Flex for its own children.
The relevant parent is the immediate containing frame, not the nearest artboard-like ancestor or the browser viewport.

The transcript establishes applicability at 00:02–00:24.

## Human controls

For eligible objects, show a Constraints section with a horizontal dropdown, a vertical dropdown, and an interactive edge-and-center diagram.
Both dropdowns and the diagram edit the same values and stay synchronized.
Provide text labels and keyboard access so the diagram is not the only usable control.

| Horizontal | Vertical equivalent | Resize behavior |
| --- | --- | --- |
| Left | Top | Keep the distance to the starting edge and keep the size. |
| Right | Bottom | Keep the distance to the ending edge and keep the size. |
| Left & Right | Top & Bottom | Keep both edge distances and change the size. |
| Center | Center | Keep the offset from the parent's center and keep the size. |

Use clear labels and help text such as "Left & Right: fixed edge distances."
Both-edge constraints preserve the margins while allowing the object's dimension to change.

## Canvas constraint indicators

For one selected eligible object in Edit mode, show indicators connecting that object to its immediate parent frame's active constraint references.
They communicate the anchoring rule used when the parent resizes.
They have no numeric distance labels.
Loose root objects and participating Flex children do not receive these indicators because they have no eligible parent-edge constraints.

| Active constraint | Canvas indicator |
| --- | --- |
| Left | Dotted line from the object's left-edge midpoint toward the parent's left edge. |
| Right | Dotted line from the object's right-edge midpoint toward the parent's right edge. |
| Top | Dotted line from the object's top-edge midpoint toward the parent's top edge. |
| Bottom | Dotted line from the object's bottom-edge midpoint toward the parent's bottom edge. |
| Both edges | Dotted lines toward both corresponding parent edges on that axis. |
| Center | Dotted connector along the relevant axis toward the parent's centerline, ending at a small center marker. |

If already centered, show the marker alone.
Horizontal and vertical indicators are independent.
For example, Right + Bottom shows one horizontal line toward the right edge and one vertical line toward the bottom edge.
The connector to a center reference does not move an off-center object or change its stored center offset.

The indicators update when the selected object, parent geometry, constraint values, pan, or zoom changes.
Selecting an object reveals its existing constraints without changing them.
Changes to constraint values still happen through Properties.
The indicators are informational overlays rather than additional canvas editing handles.
They disappear when selection is cleared or the editor enters Preview.
Selection or indicator updates create no document revision or Undo entry.
The lines and markers are derived from the current constraint state and are excluded from saved design content and every export format.

These visuals follow the user's description of constraint lines, with ORC-web's agreed Center marker treatment.
They do not claim an independently verified reproduction of Figma's presentation.
Alignment guides and snapping remain deferred under the [existing backlog](../../backlog/README.md#deferred-beyond-the-first-v1-workflow).

## Initial placement and mode changes

The initial constraints are Left and Top, matching the behavior described at 00:32–01:00.
Enabling Absolute Position should measure the current box and derive offsets that retain its placement at that moment.
The remaining Flex children can still reflow when the object leaves flow.

Changing a constraint preserves the currently measured box at the current parent size.
It changes how the next parent resize affects the object rather than immediately moving the object to an edge or the exact center.
For example, choosing Center captures the current offset from center.
The separate Align center action sets that offset to zero.
The mode change completes as one command and one Undo step.

## Geometry convention

Let `P` be the parent's available reference length on one axis, `p` the child's start offset, and `s` the child's outer size on that axis.
Let `P2` be the reference length after the parent is resized.
The proposed reference box starts at the parent's inner border edge and includes its padding area.
Offsets are measured in unzoomed document units.
The browser mapping of that reference box must be verified before implementation is considered complete.

The worked examples use frames with no border, padding, transforms, or min/max limits so their numbers are unambiguous.
Canvas zoom never changes stored offsets or sizes.

## Axis rules

| Mode | Stored relationship | New start offset | New size |
| --- | --- | --- | --- |
| Start edge | Original start `p` and size `s`. | `p` | `s` |
| End edge | End distance `r = P - p - s` and size `s`. | `P2 - r - s` | `s` |
| Both edges | Start `p` and end distance `r`. | `p` | `P2 - p - r` |
| Center | Center offset `d = p + s / 2 - P / 2` and size `s`. | `P2 / 2 + d - s / 2` | `s` |

Apply the same rules independently to width and height.
The table describes the ordinary unconstrained case; size limits take priority as described below.
Child content follows its own layout rules within the resulting box.

## Worked example: close button

This follows the transcript at 00:24–01:19.
Start with a card 300 units wide and a button 24 units wide, placed 16 units from its right edge and 16 units from its top edge.
The button's left position is `300 - 16 - 24 = 260`.
With Right and Top constraints, increasing the card width to 420 moves the button's left position to `420 - 16 - 24 = 380`.
The button remains 24 units wide and retains both 16-unit edge distances.

Because the button is Absolute Position, it does not create a Flex gap or push the card's normal content aside.

## Worked example: centered modal

This follows the transcript at 01:20–02:06.
A 400-unit-wide modal centered in a 1000-unit-wide frame starts at 300.
With Center and zero center offset, widening the frame to 1200 moves the modal start to 400 while its width remains 400.

The Align center action updates the selected axis's position and constraint together.
Aligning horizontally changes only the horizontal axis.
Aligning vertically changes only the vertical axis.
The transcript describes automatic Center constraints after canvas alignment at 01:44–02:06.
Whether snapping alone also changes a constraint remains an interaction detail to specify.

## Worked example: fixed margins

Start with a 1000-unit-wide frame and an object at left position 200 with width 600.
Its right distance is also 200.
Resize the frame to 1200.

Left & Right keeps both margins at 200, so the object's width becomes `1200 - 200 - 200 = 800`.
The stored edge distances must retain that intention through save, reopen, Undo, code generation, and export.

## Sizing conflicts and small parents

Both-edge constraints determine the size of their axis.
Properties shows that size as constraint-controlled rather than offering a conflicting Fixed, Fit, or Fill mode on the same axis.
The canvas does not offer manual resizing on a both-edge-controlled axis; adjust the parent or the relevant margins.
Keyboard movement preserves the selected constraint choices and updates their saved offsets through the [movement contract](workspace-and-canvas.md#keyboard-movement).
Start, End, and Center modes preserve the measured size in this initial proposal.
Combining those modes with intrinsic Fit sizing remains an open extension that needs a defined measurement rule.

When the parent becomes smaller than the requested edge distances, never produce a negative width or height.
Clamp the computed size to a nonnegative dimension within the applicable minimum and maximum limits.
Start mode preserves the starting edge, End mode preserves the ending edge, and Center mode preserves the center relationship after clamping.
For Both edges, the minimum size takes priority when both margins and that size cannot be satisfied together.
Left & Right preserves the left margin and allows the actual right margin to decrease.
Top & Bottom preserves the top margin and allows the actual bottom margin to decrease.
The exact maximum-size conflict policy remains open.
Keep the saved constraint distances throughout resizing; the temporary actual margin does not replace the intended margin.
Enlarging the parent restores the intended margins once the size limits permit them.
Show that a limit prevents the ideal relationship, and honor the parent's explicit clipping setting.
Clipping affects visibility and does not alter the saved constraints or sizing rules.

For example, a 300-unit-wide parent with 20-unit side margins gives its child a width of 260.
With a minimum child width of 200, reducing the parent to 220 keeps the left margin at 20 and the child width at 200, leaving an actual right margin of zero.
Returning the parent to 300 restores both 20-unit margins and the 260-unit width.

Independent width and height constraints can conflict with a locked aspect ratio.
The controlling-axis rule remains open and must be resolved before promising that combination.
Rotated or transformed objects also need an explicit conversion policy; do not derive saved constraints from zoomed screen bounding boxes.

## Reparenting and switching layout

Reparenting changes the reference frame.
Dropping into a Free frame keeps the object at the dropped workspace position, converted into the destination frame's coordinates.
Preserve its existing constraint choices and derive new edge distances or center offsets from that dropped box against the new parent.
If the object previously participated in Flex or had no parent-edge constraints, use the normal Left and Top defaults for its new free placement.
Do not reuse an old frame's edge distances or center offsets without conversion.

An ordinary drop into a Flex frame joins its flow at the visible insertion marker.
The parent's gap and alignment determine its final placement, as described in [Flex insertion](flex-layout.md#insertion-and-reordering).
Joining flow clears conflicting free-placement constraints in the same command.
Absolute Position remains an explicit separate choice rather than an automatic result of dragging within Flex.

Moving an object to workspace root keeps its dropped workspace position and leaves it with no active parent-edge constraints.
A completed move changes the parent, placement, sizing rules, and constraint conversion together as one command and one Undo step.
Undo restores the previous parent, placement mode, size rules, and constraints.
Destination validation still rejects locked parents, cycles, incompatible slots, or unsupported source-backed structural edits without a partial move.
Exact coordinate conversion for borders, padding, transforms, and source/CSS bindings remains an implementation detail to verify.
MCP [reorder_nodes](../mcp/tools/reorder_nodes.md) applies those coupled parent/placement conversions atomically under the same measurement and ownership limits.

## Saving, commands, and MCP

Save constraint mode and the numeric relationships required to reproduce it.
The model must preserve the selected edge or Center relationship without relying on a display label.
The final schema must choose one authoritative representation and derive any CSS or panel projection from it.
It must not maintain independently editable CSS values and constraint metadata that can disagree.

Changing a mode, aligning and updating a constraint, or reparenting with conversion each creates one atomic command and one Undo entry.
Measurements must match the expected document revision.
If another human or agent edit changes the reference frame before commit, remeasure or return a conflict without a partial change.

The existing MCP tool inventory is not renamed or expanded by this proposal.
The mapping from semantic constraint operations to public command inputs remains open.
Agents need the same validated behavior as the human panel, including clear unsupported-state and measurement errors.
MCP [move_nodes](../mcp/tools/move_nodes.md) updates the relevant offsets while retaining constraint choices and the current parent.
MCP [resize_node](../mcp/tools/resize_node.md) respects parent/margin-owned axes instead of assigning a conflicting Fixed dimension.
Their dedicated contracts retain the unresolved reference geometry, coupled-axis, and public-input mapping decisions.

## Code and export

Code and React or HTML/CSS exports should retain the relationship to the parent frame.
Exporting only the current measured pixel rectangle would lose responsive behavior.
The mapping must preserve fixed distances or center offsets according to the selected mode.
It must account for parent borders and padding and preserve unrelated authored transforms.
Exact CSS generation rules remain an implementation contract to specify and verify.
Image and PDF exports capture the resulting layout at the selected frame size.

## Acceptance scenarios for later implementation

- Keep an absolute close button at Top and Right while its Flex parent resizes.
- Align a modal to both centers and verify alignment and constraints change in one Undo step.
- Choose Center for an off-center object and verify its initial position is retained.
- Reproduce the fixed-margin example while retaining both margins.
- Resize the immediate parent of a nested frame without constraining it to a distant ancestor.
- Move an object between frames and verify its constraints use the new reference frame.
- Show the appropriate edge lines or Center marker for one selected eligible object, independently on each axis.
- Pan, zoom, and resize the parent without detaching indicators from their references.
- Hide indicators in Preview and exclude them from exported design content without changing constraints.
- Shrink a both-edge-constrained child to its minimum size, preserve the left or top margin, then enlarge the parent and recover the saved margins.
- Move between Free frames, Flex flow, and workspace root; verify dropped placement or insertion, converted constraints, and exact restoration through Undo.
- Show size-limit conflicts without negative dimensions or silent clipping changes.
- Verify loose root objects and participating Flex children do not receive edge-pin controls.
- Save, reopen, and export a constrained object without changing its resize behavior.

These scenarios describe future verification and have not been executed as application tests.

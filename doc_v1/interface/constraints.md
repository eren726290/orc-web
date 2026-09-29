# Constraints

## Status and scope

Accepted V1 behavior: Constraints determine how a free-positioned child or an Absolute Position child responds when its frame resizes.
The human interface provides horizontal and vertical constraints through labeled controls and an interactive diagram.
Supported choices include start edge, end edge, both edges, Center, and proportional Stretch on either axis.
Center alignment updates the relevant constraint to Center.
New free-positioned children default to Left and Top.
These product decisions follow the behavior shown in the user-supplied "Constraints in Paper" transcript.

Sizing-conflict rules, coordinate conversion details, platform shortcuts, and transformed-object behavior remain ORC-web proposals below.

This document owns how a freely positioned child responds to a parent-frame resize.
[Layers and Properties](layers-and-properties.md) defines when the person sees these controls for a selected object.
[Flex layout](flex-layout.md) owns the arrangement and sizing of children that participate in Flex flow.

## Source and limits

The user supplied the Paper Design transcript as text, without a video URL.
No independent viewing or verification is claimed.
The timestamp references below point to that supplied text.
The transcript describes its demonstrated cases but does not settle ORC-web's border, padding, minimum-size, transformed-object, or multi-selection rules.
Rules beyond the demonstrated Paper behavior are marked as ORC-web proposals.

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
| Stretch | Stretch | Preserve proportional position and size relative to the parent. |

Use clear labels and help text to distinguish "Left & Right: fixed edge distances" from "Stretch: proportional position and size."
These are different modes even though both can change an object's size.
The transcript explicitly distinguishes them at 02:07–03:04.

## Initial placement and mode changes

The initial constraints are Left and Top, matching the behavior described at 00:32–01:00.
Enabling Absolute Position should measure the current box and derive offsets that retain its placement at that moment.
The remaining Flex children can still reflow when the object leaves flow.

Changing a constraint should preserve the currently measured box at the current parent size.
It changes how the next parent resize affects the object rather than immediately moving the object to an edge or the exact center.
For example, choosing Center captures the current offset from center.
The separate Align center action sets that offset to zero.

## Geometry convention

Let `P` be the parent's available reference length on one axis, `p` the child's start offset, and `s` the child's outer size on that axis.
Let `P2` be the reference length after the parent is resized.
The proposed reference box starts at the parent's inner border edge and includes its padding area.
Offsets are measured in unzoomed document units.
The browser mapping of that reference box must be verified before implementation is considered complete.

The worked examples use frames with no border, padding, transforms, or min/max limits so their numbers are unambiguous.
Canvas zoom never changes stored offsets, sizes, or ratios.

## Axis rules

| Mode | Stored relationship | New start offset | New size |
| --- | --- | --- | --- |
| Start edge | Original start `p` and size `s`. | `p` | `s` |
| End edge | End distance `r = P - p - s` and size `s`. | `P2 - r - s` | `s` |
| Both edges | Start `p` and end distance `r`. | `p` | `P2 - p - r` |
| Center | Center offset `d = p + s / 2 - P / 2` and size `s`. | `P2 / 2 + d - s / 2` | `s` |
| Stretch | Start ratio `a = p / P` and size ratio `b = s / P`. | `a * P2` | `b * P2` |

Apply the same rules independently to width and height.
The table describes the ordinary unconstrained case; size limits take priority as described below.
Stretch affects the object's box and position on the selected axis.
It does not by itself scale font sizes, stroke widths, corner radii, or every descendant with a visual transform.
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

## Worked example: fixed margins versus Stretch

Start with a 1000-unit-wide frame and an object at left position 200 with width 600.
Its right distance is also 200.
Resize the frame to 1200.

| Mode | Left distance | Width | Right distance |
| --- | --- | --- | --- |
| Left & Right | 200 | 800 | 200 |
| Stretch | 240 | 720 | 240 |

Left & Right preserves the two fixed distances.
Stretch preserves the 20% start, 60% width, and 20% end proportions.
The stored values must retain those different intentions through save, reopen, Undo, code generation, and export.

## Sizing conflicts and small parents

Both-edge and Stretch constraints determine the size of their axis.
The proposed Properties panel shows that size as constraint-controlled rather than offering a conflicting Fixed, Fit, or Fill mode on the same axis.
Start, End, and Center modes preserve the measured size in this initial proposal.
Combining those modes with intrinsic Fit sizing remains an open extension that needs a defined measurement rule.

When the parent becomes smaller than the requested edge distances, never produce a negative width or height.
Proposed size limits clamp the computed size to zero or the applicable minimum and maximum.
Start mode preserves the starting edge, End mode preserves the ending edge, and Center mode preserves the center relationship after clamping.
For Both edges, the proposed priority is the starting edge when both distances cannot be satisfied.
For Stretch, preserve the start ratio and clamp the resulting size.
Show that a limit prevents the ideal relationship, and honor the parent's explicit clipping setting.

A zero-sized parent cannot provide a valid ratio when first converting to Stretch.
Reject that conversion with a clear message instead of storing an infinite or undefined ratio.
If a previously valid Stretch relationship is later resized to zero, retain its stored ratios so growing the parent again can restore its proportional layout.

Independent width and height constraints can conflict with a locked aspect ratio.
The controlling-axis rule remains open and must be resolved before promising that combination.
Rotated or transformed objects also need an explicit conversion policy; do not derive saved constraints from zoomed screen bounding boxes.

## Reparenting and switching layout

Reparenting changes the reference frame.
The proposal remeasures the destination coordinates and derives the selected constraint relationships against that frame while preserving visible placement where possible.
Do not reuse an old frame's edge distances or ratios without conversion.
If the destination uses Flex, show whether the object will participate in flow or retain Absolute Position.
Dropping an object into Flex flow clears conflicting free-placement constraints in the same command.
Moving it to workspace root leaves it with workspace coordinates and no active parent-edge constraints.
Undo restores the previous parent, placement mode, size rules, and constraints.

## Saving, commands, and MCP

Save constraint mode and the numeric relationships required to reproduce it.
The model must distinguish Both edges from Stretch without relying on a display label.
The final schema must choose one authoritative representation and derive any CSS or panel projection from it.
It must not maintain independently editable CSS values and constraint metadata that can disagree.

Changing a mode, aligning and updating a constraint, or reparenting with conversion each creates one atomic command and one Undo entry.
Measurements must match the expected document revision.
If another human or agent edit changes the reference frame before commit, remeasure or return a conflict without a partial change.

The existing MCP tool inventory is not renamed or expanded by this proposal.
The mapping from semantic constraint operations to public command inputs remains open.
Agents need the same validated behavior as the human panel, including clear unsupported-state and measurement errors.

## Code and export

Code and React or HTML/CSS exports should retain the relationship to the parent frame.
Exporting only the current measured pixel rectangle would lose responsive behavior.
The mapping must preserve fixed distances, center offsets, or ratios according to the selected mode.
It must account for parent borders and padding and preserve unrelated authored transforms.
Exact CSS generation rules remain an implementation contract to specify and verify.
Image and PDF exports capture the resulting layout at the selected frame size.

## Acceptance scenarios for later implementation

- Keep an absolute close button at Top and Right while its Flex parent resizes.
- Align a modal to both centers and verify alignment and constraints change in one Undo step.
- Choose Center for an off-center object and verify its initial position is retained.
- Reproduce the fixed-margin and Stretch example with different resulting widths.
- Resize the immediate parent of a nested frame without constraining it to a distant ancestor.
- Move an object between frames and verify its constraints use the new reference frame.
- Reject initial Stretch conversion for a zero-sized reference axis.
- Show size-limit conflicts without negative dimensions or silent clipping changes.
- Verify loose root objects and participating Flex children do not receive edge-pin controls.
- Save, reopen, and export a constrained object without changing its resize behavior.

These scenarios describe future verification and have not been executed as application tests.

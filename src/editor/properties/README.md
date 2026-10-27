# Properties

Properties controls, editable fields, and temporary property previews belong here.
The selected name/type header stays outside the scrolling property-content area so it remains visible during long forms and numeric edits.
Sizing-owner labels and parent-controlled positions are derived from the applied native canvas after document, selection, or native box size changes.
Controlled positions are read-only, and Select parent uses the workspace's existing Code draft safeguard.
Frame layout controls submit one measured Free/Row/Column conversion through the shared atomic command path.
They render a temporary property preview and verify native boxes before submitting the command.
The Row-only Wrap to next line checkbox uses the same preview, draft safeguard, and atomic command path.
It includes required dependent Fill CSS changes in the same preview and command when the child projection needs conversion.
Layout actions restore their button or checkbox focus after a pending command when the same owner is still selected and focus has fallen to the page body.
Their styles stay beside the control in layout-controls.css.
Frame Padding starts with paired fields and a native Individual sides disclosure.
Mixed opposite values remain unchanged until an explicit edit, and unsupported CSS stays available in Code.
The control and its styles live in frame-padding-controls.tsx and padding-controls.css.

Ordinary Row/Column Gap uses one authored CSS value through typing, local arrows, value dragging, and canvas handles.
frame-gap-controls.tsx shares the same numeric field between Properties and the canvas.
number-drag.ts owns pointer preparation, live preview, cancellation, and one-command completion.
Adjustable fields retain their DOM input and synchronize from the latest applied value after acknowledgement.
Their styles remain in gap-controls.css; canvas handle geometry and styles belong to ../canvas/.
frame-alignment-controls.tsx provides nine physical packed positions and named Packed/Space between choices, using the shared layout focus restoration, draft safeguard, preview and command path.
Its styles live in alignment-controls.css.
absolute-position-control.tsx exposes ordinary Flex child participation through the same draft, preview, focus and command path.
sizing-control.tsx provides per-axis Fixed/Fit, supported cross-axis Fill, and bounded main-axis Fill sharing in nowrap Rows/Columns and wrapped Rows through the shared property field, preview, draft safeguard, and atomic command path.
Numeric editing and mode conversion have separate permissions, so Fill stays read-only until an explicit supported switch to Fixed.
Unavailable Fill explains the layout, source ownership, or missing parent bound.
An active numeric sizing edit can capture Fixed even when its number equals the former derived readout; focusing and leaving an unchanged field creates no command.
Its styles live in sizing-controls.css.

Padding prepares and previews any coupled Fill coefficient changes in the same atomic batch as the authored padding edit.
Preparation errors restore the applied preview and appear beside the field.
Workspace validates Content previews and commits against existing Fill dependencies.
Clearing the sole intrinsic text supplier restores the applied preview and explains the missing parent bound through the existing application error message.
Nonempty edits and independently supplied parents retain the normal text preview and command behavior.

corner-radius-controls.tsx provides the combined Corner radius field and a keyboard-accessible disclosure for individual corners.
corner-radius.ts reads native shorthand/longhand ownership and prepares ordinary style batches that preserve per-corner priority and declaration order.
Mixed values remain unchanged until an explicit combined edit; independent supported corners stay editable beside source-owned corners.
The controls reuse PropertyField for live preview, cancellation, numeric adjustments, one-command completion, draft safeguards and history.
Their styles remain beside the feature in corner-radius-controls.css.

`constraint-controls.tsx` provides ordinary parent-edge dropdowns, the synchronized keyboard-accessible diagram and separate Align center actions.
Choices preserve the current box, while alignment deliberately sets that axis's center offset to zero.
They reuse the existing draft safeguard, temporary preview, native validation, pending focus, atomic mutation and history path.
Sizing-owned Both axes remain read-only in the existing sizing controls.
Native overlay invalidation refreshes limit feedback without a document mutation.
The feature's editor styles live in constraint-controls.css.
End/Center position readouts use measured document units and share native geometry invalidation with the canvas overlays.
Their read-only input remains mounted as values change, preserving keyboard focus during native movement.
The ownership subscription runs only for the active editor and resolves the current rendered object after structural changes or returning from Preview.
Unavailable rendered boxes disable measured constraint conversion instead of publishing offsets from an empty rectangle.

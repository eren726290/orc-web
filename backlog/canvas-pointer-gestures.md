# Canvas pointer gestures

The accepted V1 requirements remain in [workspace and canvas](../doc_v1/interface/workspace-and-canvas.md#canvas-tools).
Implementation is in progress, not deferred to another release.

## Current implementation slice

Select dragging starts from a selected or initially unselected ordinary Free object.
A new target completes the selection and Code draft safeguard before movement becomes ready.
Free movement uses frozen authored CSS and native computed positions.
A single ordinary Flex child uses frozen native child bounds to preview a drop slot within its current Row, Column, or wrapped Row parent.
Both preview without changing the applied revision and submit one shared command on release.
Flex previews change temporary sibling order only; they preserve authored CSS and do not create a second saved hierarchy.
The receiving frame has a temporary outline and the exact insertion slot has a line, both excluded from the design tree.
Escape, pointer cancellation, lost capture, document changes, selection changes, tool changes, and zoom changes cancel the gesture.
The movement workflow verifies native preview geometry, repeated pointer updates, Escape cancellation without history, one-command release with exact Undo/Redo, initially unselected targets, zoom-correct CSS offsets, Code draft Cancel, Discard after mouse release, and Flex selection without movement warnings.
Discard completes the requested selection after release without resuming movement or adding a revision or history entry.
Flex checks also verify forward and backward placement, wrapped-line placement, zoom, Escape, unchanged child CSS, non-flow sibling preservation, and no-op drops in the original slot.
Full development/built Chromium verification is recorded in [the implementation status](../IMPLEMENTATION_STATUS.md#ordinary-free-pointer-movement-checkpoint).

Single-object and nested-frame drops now convert ordinary Free frame/root placement or join a receiving Row, Column, or wrapped Row slot.
The native dropped box, authored margins, supported End/Both/Center relationships, tested Fixed frame dimensions, Fit text, and existing same-axis Fill sizing are preserved.
Free and Flex receiving previews, Escape, locked destination rejection, exact history, selected-ancestor reveal, and saved/reopened reparenting passed the [92-check development/built run](../artifacts/editor/movement-reparent-verification-result.json).
The run also retains negative controls for unsupported transformed placement, cross-axis Fill conversion, and nonlinear constraint expressions without partial edits.
The [reparenting checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-pointer-reparenting-checkpoint) records reproduced defects, fixes, source hashes, and verification limits.
The subsequent [sizing correction](../IMPLEMENTATION_STATUS.md#sizing-ownership-correction-and-stopping-checkpoint) fixes Fill/Constraints labels and explicit cross-axis stretch while preserving intrinsic automatic-margin sizing.
Its [100-check result](../artifacts/editor/movement-sizing-ownership-result.json) verifies those corrections in development and built Chromium with unchanged executable source hashes.

Ordinary participating Flex children now show read-only parent-relative X/Y values, a parent ownership explanation, and guarded Select parent inspection.
This remains available under own or ancestor locks and does not change the applied document or history.
The [position checkpoint](../IMPLEMENTATION_STATUS.md#parent-controlled-position-checkpoint) records responsive native coordinates, draft safeguards, transformed-source boundaries, and development/built verification in Chromium and managed Chrome for Testing.

## Remaining V1 work

- Complete several-object reparenting and sizing conversion between Flex axes through the accepted per-axis ownership model.
- Implement general Fixed/Fit/Fill controls; the corrected labels and preservation of existing same-axis Fill do not establish general Fill support.
- Complete per-axis ownership for authored Flex basis, logical axes, source expressions, aspect ratios, and bindings before enabling corresponding manual resize handles.
- Extend layout ownership and supported coordinate inspection to React source bindings and the remaining source-controlled layouts alongside the general layout and constraint controls.
- Implement sizing-owned resize handles and SVG rotation/proportional resizing.
- Resolve existing transformed-parent, reverse/RTL flow, and source-controlled layout limitations without replacing authored CSS with independent saved geometry.
- Preserve or explicitly map source-controlled nonlinear constraints and transformed Free conversions; current unavailable conversions direct the person to Code.
- Extend pointer-specific verification to queued field acknowledgements, several-object movement, pointer release outside the canvas, and saving/reopening gesture results across supported platforms.

No MCP implementation depends on this incomplete slice.

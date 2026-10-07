# Multi-frame Preview comparison for later V1.x

## Status

Accepted deferred workflow for a later V1.x release.
Outside V1; the exact release is not assigned.
V1 retains the [single selected-frame Preview workflow](../doc_v1/interface/workspace-and-canvas.md#selected-frame-workflow).

## Purpose

Compare an original design and a variant while trying their supported interactions.
The comparison uses existing frames rather than creating linked variants, responsive breakpoints, or another saved design.

## Human workflow

1. Select both frames.
2. Click **Preview** in the vertical toolbar.
3. See the selected frames side by side in the existing browser page and canvas area.
4. Try each frame's supported buttons, inputs, menus, scrolling, and animations independently.
5. Click **Exit Preview** to return to the previous workspace view and selection.

The same comparison approach may show several selected frames; the practical count and arrangement remain implementation decisions.

## Behavior and boundaries

Show only the selected frames and their nested content, using the same localhost and live rendering path as ordinary Preview.
Preserve each frame's saved dimensions, layout, clipping, source, and instance inputs.
Side-by-side display must not resize the saved design to make the comparison fit.
Keep each frame's supported Preview input, open-state, scroll, and overlay behavior separate, with Exit Preview reachable.
Use the existing [frame boundaries](../doc_v1/interface/workspace-and-canvas.md#top-level-frame-boundaries), shared component definitions, and token references without creating a new variant relationship.
The comparison does not copy component definitions, unlink tokens, or change the designs merely because they are shown together.

Apply the [temporary-state and reset rules](../doc_v1/interface/workspace-and-canvas.md#temporary-state-and-returning-to-edit) to each Preview session.
Interactions create no saved design changes, document revisions, or Undo entries.
Exit restores the previous selection, pan, zoom, and supported Edit viewing choices.

## Implementation questions and verification

Choose the display arrangement and scaling for different frame sizes without changing authored dimensions or confusing viewport-based responsive styles with frame sizing.
Verify an original and a copied variant with supported HTML/CSS content, live components, independent scrolling, modal overlays, and Motion interactions under zoom.
Confirm interacting with one frame does not change the other frame's supported Preview state or either saved design.
Verify session reset and restoration of the previous workspace selection and view in Chrome on Fedora and Windows.
The existing single-frame implementation requirements still apply; this backlog is not evidence that comparison Preview has been implemented or tested.

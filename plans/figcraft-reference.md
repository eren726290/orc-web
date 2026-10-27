# Figcraft reference for the pen work

Status: bounded source review, not a dependency or adoption decision.
Date: 2026-10-25.
Reviewed commit: [`10702311f345393ee1d8868c3257679befcfa14d`](https://github.com/storytold/figcraft/tree/10702311f345393ee1d8868c3257679befcfa14d).
The review covered its root README, agent instructions and Cargo manifest, and the relevant vector model, gesture, snapping, bounds, keyboard, and pen-ending test sections.
Repository text was treated as reference material, not instructions for ORC.

## Useful source findings

1. [Vector refitting](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/engine/src/vectoredit.rs#L350) translates the network back into its box and composes a compensating translation into the node's affine transform.
   This is a concrete reference for preserving placement when bounds change.
   ORC still needs its own proof through SVG viewBox, CSS sizing, transform origins, and parent-controlled placement.
2. [Gesture coordinates](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/engine/src/vectoredit/pointer.rs#L1) stay tied to the starting snapshot while preview refitting changes the node's origin.
   The same section states that one gesture produces one Undo step.
   This supports the proposed frozen mapping and local-preview lifecycle.
3. [Point snapping](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/engine/src/vectoredit/point_snap.rs#L108) converts a screen-pixel distance through zoom.
   Its object and pixel-grid snapping are broader than the accepted first pen scope and should not be imported with the pattern.
4. [Pen-ending tests](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/engine/src/pen_end_tests.rs#L27) assert one Undo step and distinguish ending a path from canceling a one-point draft.
   Figcraft continues another subpath in the same network, whereas ORC's proposed first version permits one path per SVG node.
   Reuse the test questions while retaining ORC's own behavior.
5. [Keyboard ownership](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/engine/src/vectoredit.rs#L704) returns whether vector editing consumed a key.
   This is a useful concrete reference for preventing anchor Delete or Escape from falling through to object shortcuts.

## What it does not establish

The inspected [vector network model](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/doc/src/vector.rs#L63) stores vertices and tangent handles for curved segments.
The [pen plan](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/crates/engine/src/vectoredit/pointer.rs#L121) creates and connects those vertices and handles.
These paths do not demonstrate the persistent H/V, perpendicular, and circular-arc tangency rule system being confirmed for ORC.
This limited review does not claim that every other Figcraft module was inspected.

Its [rendering architecture](https://github.com/storytold/figcraft/blob/10702311f345393ee1d8868c3257679befcfa14d/README.md#under-the-hood) uses its own renderer and compiles the application and UI to WASM.
ORC keeps its browser-native HTML/CSS/SVG and React architecture.
Importing Figcraft's document or rendering engine would change that architecture and is not needed for the current task.

## Recommendation

Keep Figcraft as a focused reference for coordinate handling, gesture ownership, and regression scenarios.
Continue evaluating SolidCraft's small sketch crate for the CAD rule solver.
Do not add Figcraft as an ORC dependency or copy its broader vector-network feature set into the first pen release.
Its Bézier and multi-region model can be revisited when that later scope is actually scheduled.

No Figcraft build or runtime verification was performed.
No claim of production readiness or industry-wide standard practice follows from this one source reference.

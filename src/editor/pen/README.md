# Pen interaction

This feature owns the human Pen draft, anchor editing, solver loading, native candidate checks, artwork/transform controls, essential handles and auxiliary guides.
Portable geometry, strict records and saved source agreement belong to [shared/pen/](../../../shared/pen/README.md).
The accepted behavior is in [Pen tool](../../../doc_v1/interface/pen-tool.md).
All completed edits use the existing workspace command/history/save path.
Drafts and candidate previews remain local and never publish a command per pointer step.

`usePen.ts`, `keyboard.ts`, `draw.ts`, `drag.ts` and `delete.ts` own input, local lifecycle and complete edit preparation.
`coordinates.ts`, `node.ts` and `reboxing.ts` use actual SVG matrices and compensate supported Free placement when bounds or transform origins change.
Flow creation uses the selected frame's actual final slot; later candidates must retain that mapping or refuse.
Native constraints, source-owned dimensions and unsupported transformed destinations do not silently become Free or Fixed.

`preview.ts` captures applied Fill dependencies, mounts the complete proposed document through the normal renderer, prepares shared Fill writes against that membership, then validates the final native candidate.
It retains the complete last accepted candidate after refusal.
The preview's project/revision tag prevents replay over a newer acknowledgement.
Cancellation releases pointer capture and clears the whole preview.

`PenArtworkControls.tsx`, `transforms.ts`, `transform-gesture.ts` and `usePenTransform.ts` own the bounded paint, proportional scale and ordinary rotation workflow.
`sizing-readout.ts` keeps supported own-Pen Fixed dimensions accurate and read-only under rotation and directs resizing through proportional Scale.
`source.ts` and `apply-source.ts` retain compatible selected-root records after parsed geometry/mapping checks and rebox supported stroke changes.
Meaningful ancestor replacement keeps the existing fresh-descendant identity boundary.
`PenOverlay.tsx`, `PenGuides.tsx`, `PenTransformHandles.tsx` and `pen.css` draw editor-only controls using semantic tokens.
Offscreen display culling never removes saved geometry or its guards.
Guides are project view state and do not hide essential handles.

`loader.ts` verifies the exact bundled WASM size/hash, compiles once, and permits retry after load failure.
The local loading phase owns Escape/Undo and blocks object-editing keys; cancellation invalidates a late first click while retaining a successfully verified immutable module for the next gesture.
`worker-client.ts` gives each anchor gesture one disposable dedicated Worker; `solver-worker.ts` instantiates the identical verified module there.
Only one solve is in flight, and new pointer events replace the pending target.
The exact gesture and motion object must still be current before a reply can mount a complete native-validated preview.
Return-to-start invalidates the old motion; cancellation and release terminate the Worker and discard its replies.
No mutable solver state is shared across projects or paths.
The [performance record](../../../backlog/pen-integration.md#measured-solver-blocker) separates responsive input from slower numerical preview updates.

`guide-label-layout.ts` measures visible annotation text and controls in one layout pass before painting.
`guide-label-placement.ts` tries deterministic nearby screen-space positions, then a farther column or row, with a six-pixel canvas inset and room for the existing text halo, mapped measurement targets and visible controls.
Selected-anchor coordinates have first placement priority; other labels retain path order.
Moved labels receive a leader to their original mapped target when their gap exceeds 26 pixels.
`guide-label-leader.ts` tries a direct leader, nearby side elbows and the outer label row/column edges to avoid crossing other label boxes.
The layout writes only overlay SVG transforms and leaders, batches reads before writes, and reuses existing overlay invalidation without a permanent animation loop.
It never moves anchors or arc centers, changes measurement text or hides a measurement to resolve crowding.
If no candidate is clear in an extremely dense scene, every label stays present at the candidate with the least occupied area.

Absolute paths with native Center self-alignment retain their constraint relationship and reject reboxing-dependent anchor, stroke or scale edits.
Choose Left/Top placement before those edits; changing Fill does not require reboxing.

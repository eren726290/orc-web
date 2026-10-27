# Top-level frame controls

## Accepted scope and current delivery

The user accepted the frame-name strip and clarified the placement and frame-specific behavior of the existing V1 Still view requirement on 2026-10-24.
The contracts live in [Workspace](../doc_v1/interface/workspace-and-canvas.md#top-level-frame-label-and-still-view-control) and [Motion](../doc_v1/interface/motion.md#frame-specific-still-view).
This record hands off the blocked runtime work; it does not defer the accepted Still view requirement out of V1.

The independent name overlay reads the canonical frame name used by Layers.
It sits outside `.canvas-world` and uses the existing geometry observer to follow rendered top-level frame bounds in screen coordinates.
It keeps text at an editor-readable size across zoom and truncates long names within the frame width.
It adds no focus stop, rename action, pointer gesture, design object, or source markup.
The full saved name remains available through the existing Layers row and rename field.
Nested and saved-hidden frames do not receive a label.
The [implementation status](../IMPLEMENTATION_STATUS.md#top-level-frame-label-and-still-view-checkpoint) records actual verification results.

## Still view production dependency

The current `shared/document/model.ts` union supports frame, element, text, image, and SVG nodes, without a production component record or component node.
`src/editor/rendering/renderer.tsx` renders those ordinary nodes; it does not load imported JSX/TSX, Motion providers, or declared component stable states.
`src/editor/view-state.ts` already provides per-project browser-session view state, but has no frame Still view map.
`src/editor/preview/Preview.tsx` reuses the ordinary renderer with an interaction scope, and does not yet implement the React animation boundary.
Installing `motion` and React packages is not evidence of production component integration.

Therefore this delivery contains no snowflake toggle, placeholder pressed state, or unused stored setting.
Pausing native CSS/Web Animations at their current time would not implement the accepted stable-state behavior.
A blanket zero-duration or reduced-motion override also does not establish the supported editing state of arbitrary React components.
The blocker is production frame-scoped component rendering with an explicit stable-state resolver, supported animation control, and a way to report unsupported descendants.
Do not pull the entire React integration milestone into this frame-label commit.

## Handoff after the runtime dependency is available

Read the root instructions and contextual READMEs, inspect the current renderer, then confirm which supported content can resolve a stable editing appearance.
Keep the existing canonical document, source ownership, project view-state store, Preview path, and shared capture contract.
If a necessary change would alter an accepted architecture, explain it and obtain agreement before adoption.

1. Define how supported component contracts supply the stable editing appearance and how the runtime reports unsupported animation ownership.
   An entrance animation must show its content, and a moving component must use its intended editing position while retaining supported visual editing.
   Prove the boundary with nested components and nested frames before exposing a successful toggle.
2. Extend the existing project view state with a map keyed by stable top-level frame identity and an off default.
   Keep it independent of selection, node names, canonical styles, commands, revisions, Undo history, and autosave.
   Preserve it while switching project tabs and returning from Preview.
   A new frame identity starts off; renaming the same identity retains the setting.
   Settle deletion/Undo cleanup deliberately without transferring a setting by name or index.
3. Add one small snowflake icon button from the installed `lucide-react` package above each top-level frame's top-right edge.
   Use the frame's readable name in its tooltip and accessible name, expose `aria-pressed`, support keyboard activation, and show a clear active state.
   Reserve the button's target width before truncating the label.
   For extremely narrow frames, keep the button usable and truncate the name rather than shrinking its text or overlapping it.
   Keep the existing label free of separate rename or drag gestures.
4. Route the frame's Edit preference throughout its supported descendants without changing saved component source or fabricating measured saved geometry.
   Do not report universal freezing of arbitrary React code or custom animation loops.
   Explain an unavailable stable state through the existing feedback path and keep source editing reachable.
   Document how the UI distinguishes a requested setting from verified stabilization when any descendant is unsupported.
5. Preview must run normal animations and supported interactions irrespective of the Edit preference.
   Exit Preview restores the prior per-frame Edit choices and workspace view.
   Keep Exit Preview accessible through supported portal/modal behavior using the existing [boundary handoff](renderer-boundaries.md#2-base-ui-portals-modal-focus-and-scrolling).
6. Keep frame chrome outside the rendered design, clipping, generated source, and capture inputs.
   Export continues to resolve its explicit named state independently of Edit Still view.
   Product image/PDF export remains a separate unfinished dependency; record that limitation until its real entry points can be checked.

## Required regression evidence

Extend the real editor workflows rather than claiming success from a stored boolean or isolated library experiment.
Retain the tested commit plus uncommitted source hashes, actual executable/version, operating system, commands, inputs, exits, diagnostics, screenshots, and traces.

- Verify the label matches Layers after keyboard rename and exact one-step Undo/Redo without displaying the internal ID.
- Verify two top-level frames retain separate names and settings across selection, rename, tab switches, and Preview.
- Verify alignment during pan, zoom, pointer movement, Properties resizing, source-responsive layout, clipping, and supported parent/layout changes.
- Verify long names and narrow frames cannot cover the icon or shrink its accessible target.
- Reach each Still view button through keyboard focus and activate it with Enter and Space.
  Verify target-specific naming, tooltip, pressed state, visible active state, and focus restoration.
- Exercise supported nested entrance/movement animations, supported continued editing, normal Preview playback, and restored Edit stable states.
- Include an unsupported stable-state fixture and verify honest feedback without silent partial-success claims or source mutation.
- Compare source, document revision, Undo/Redo availability, and save status before and after toggling and view navigation.
  Record command requests to prove that view changes submit no document mutation.
- Verify generated source excludes editor chrome while preserving existing saved name metadata.
  Once supported image/PDF exports exist, run their actual output paths and inspect the exported result for chrome leakage and independent capture-state selection.

`bun run check:frame-labels` covers the independently delivered ordinary label workflow in development and built modes.
Pass `chrome` and `ORC_CHROME_EXECUTABLE` to use a specific installed executable, and set `ORC_FRAME_LABEL_EVIDENCE` to retain a named run.
It records standalone generated HTML separately from product export certification.
The exact passing results and remaining platform limits belong in the implementation status, not in an assumption that every accepted requirement is complete.

## Loose animated objects

The canonical workspace allows animated objects outside frames.
The user has not chosen a Still view scope for those objects.
Do not add a workspace-wide toggle, another toolbar, automatic frame assignment, or implicit reparenting.
Keep their existing animation/editing behavior until this specific scope question is discussed.

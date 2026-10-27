# Editor workflow checks

`bun run check:corner-radius` verifies combined and individual ordinary corner radii in development and built modes.
The focused [corner-radius checks](corner-radius/README.md) cover Mixed values, keyboard disclosure, numeric preview/cancellation/adjustment, source ownership and priority, locks/drafts, rejection, pending Undo, generated source and save/reopen.
Use `ORC_RADIUS_EVIDENCE` to name retained source-bound results, screenshots and traces; `ORC_RADIUS_MODES=development|built` selects one app mode.
Pass `chrome` with `ORC_CHROME_EXECUTABLE` to check a specific executable.

`bun run check:frame-labels` verifies top-level saved-name overlays in development and built modes.
It covers Layers keyboard rename and Undo/Redo, top-level/nested/hidden eligibility, narrow names, pan/zoom, pointer movement, Properties sizing, layout changes, tab/Preview restoration and standalone source isolation.
Use `ORC_FRAME_LABEL_EVIDENCE` for named retained screenshots, traces and source-bound results, and pass `chrome` with `ORC_CHROME_EXECUTABLE` for a specific executable.
It does not certify the blocked Still view runtime or unfinished product image/PDF exporters.

Portable pen data, atomic geometry commands and the subsequent human pen workflows belong to [pen/](pen/README.md).

Editor, Properties, Code, history, panels, Layers, deletion, Preview, atomic commands, movement, clipping, layout switching, frame Padding, and Gap checks belong here.
check-alignment.ts verifies physical packed alignment and named distribution through native layout, history, source ownership, safeguards, and saving.
check-participation.ts verifies the ordinary Absolute Position control, parent-relative boxes, native reflow, history and saving.
check-sizing.ts covers ordinary per-axis Fixed/Fit, bounded nowrap cross-axis Fill and wrapped Row Height Fill, and single-grow, multiple-child and per-row wrapped main-axis Fill sharing with native sizing, ownership, safeguards, history, and saving.
Fill remains numerically read-only and uses operation-specific axis/alignment or axis/Flex-factor assertions.
Valid intrinsic stretch, independent Fixed aspect-ratio participants, and explicit Fixed/Fit exits remain positive controls.
check-movement.ts also verifies exact main-axis Fill drops, equal-limit bounds, rejected destinations, cached preview retargeting, native allocation, cancellation, and history.

The sizing checks include unequal decoration, native limits and automatic minima, padding preview/cancellation, locked dependent peers, deletion rebasing, exact history, source round-trip and shared Fill persistence.
They also cover stale source inputs, equivalent exponent notation beside a locked peer, a third Fill child, Absolute Position and Free conversion on both axes.
Run `ORC_SIZING_SCENARIO=sharing bun run check:sizing` for the focused sharing workflow; the default command retains all sizing regressions.
The movement checks include a second Fill joining an existing destination cohort with one previewed command.
Run `ORC_SIZING_SCENARIO=wrapped bun run check:sizing` for the focused wrapped workflow in both application modes.
It covers per-line allocation, incomplete rows, later spacing/size/participation/deletion edits, locks and drafts, pointer preview/cancellation/adoption, source responsiveness and save/reopen.
Source-variable parent display/direction/wrapping and nested wrapping retain equal outer sharing, exact history and source round-trips.
The default sizing workflow also retains these ordinary wrapped editor regressions.
Run `ORC_SIZING_SCENARIO=nested bun run check:sizing` for independently bounded nested Fill chains on both physical axes.
The nested workflow covers all Row/Column ancestor combinations, equal limits, native minima/maxima, both box models, Fixed zero, empty packed rows, source ownership, locks at every ancestor, drafts, stale preparation, rejection and pending Undo.
The focused checkpoint also checks standalone responsive source and UI save/reopen; the default sizing command retains its common workflow.
`ORC_SIZING_SCENARIO=nested-dependency` isolates the unresolved root-Fit regression.
`bun run check:nested-placement` checks real cross-axis pointer previews, cancellation, intrinsic-content and Fixed-zero positive controls, unresolved refusal, atomic commands and history.
It also checks sole-contributor deletion, Absolute participation, reparenting and inherited Fill alignment, with second-contributor and explicit sizing-exit positive controls on both axes.
It also checks sole-text contribution through Properties preview and canvas completion, refusal recovery, exact history, second contributors, independent bounds, explicit sizing exits and Fixed zero.
Use `ORC_NESTED_PLACEMENT_SCENARIO=placement|guards|text` to select a group, and `ORC_NESTED_PLACEMENT_MODES=development|built` to select one application mode.
Pass `chrome` and `ORC_CHROME_EXECUTABLE` to use a specific Chrome executable.
Project reopening waits for the completed dialog transition before reading the new session.

Run `bun run check:intrinsic-sizing` for the focused intrinsic Fill workflow in development and built modes.
Its fixtures and assertions live in [intrinsic-sizing/](intrinsic-sizing/README.md).
`ORC_INTRINSIC_SCENARIO=core|projection|guards|wrapped|placement|persistence|shared-column` selects a group, and `ORC_INTRINSIC_MODES=development|built` selects one application mode.
Use `ORC_INTRINSIC_EVIDENCE` to name the retained evidence and pass `chrome` with `ORC_CHROME_EXECUTABLE` for a specific browser executable.
Wrapped Row Height Fill includes native empty-row reflow, last-supplier guards, responsive source and save/reopen.
The shared-column scenario checks the approved native projection, its source inverse, structural exits, content response, limits, ancestor supply and atomic interaction/persistence safeguards.
Recorded results determine which checkpoint has completed verification.

Run `ORC_SIZING_SCENARIO=wrapped-cross bun run check:sizing` for wrapped Row Height Fill in both application modes.
It checks native per-line stretch, packed/stretched parent alignment, content and box-model changes, width and padding reflow, wrapping toggles, limits, participation, source ownership, locks, drafts, stale preparation, rejected commands, pending Undo and save/reopen.
Its standalone source check verifies responsive authored CSS with an explicit CSS-hidden fixture child; saved visibility serialization remains a separate [export boundary](../../../backlog/renderer-boundaries.md#4-complete-exports-and-animation-performance).

`check-boundaries.ts` covers ordinary Edit focus/editing isolation, temporary Preview content editing, SVG stylesheet containment, and selection geometry during transitions, transforms, sibling layout and scrolling.
It also checks history, source preservation, save/reopen, and measurement cleanup after deselection and Preview.
Run `bun run check:boundaries` for development and built Chromium, or pass `chrome` with `ORC_CHROME_EXECUTABLE` for a specific Chrome installation.
`ORC_BOUNDARY_SCENARIO=input|svg|geometry` selects a focused workflow and `ORC_BOUNDARY_MODES=development` limits it to the development app.
`ORC_BOUNDARY_EVIDENCE` names the retained screenshots, traces and source-bound result under `artifacts/editor/`.

Run `bun run check:constraints` for ordinary parent-edge Constraints in development and built application modes.
The fixtures and requirement-derived assertions live in [constraints/](constraints/README.md).
`ORC_CONSTRAINT_MODES=development|built` selects one app mode and `ORC_CONSTRAINT_EVIDENCE` names retained evidence.
Pass `chrome` and `ORC_CHROME_EXECUTABLE` for an explicit executable.
The checks cover both axes, the diagram, Align center, native resize, limits, images/SVGs, ownership, locks, drafts, rollback, pending Undo, native motion, scrollbar gutters, pan/zoom, pointer reparenting, history, source isolation and save/reopen.

The boundary geometry check lets pending overlay updates settle before counting idle measurements across twelve frames.
It retains a zero-read assertion for settled deselection and Preview; a visible frame label's one-time update is distinguished from continued polling.

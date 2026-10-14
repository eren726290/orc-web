# Editor workflow checks

Editor, Properties, Code, history, panels, Layers, deletion, Preview, atomic commands, movement, clipping, layout switching, frame Padding, and Gap checks belong here.
check-alignment.ts verifies physical packed alignment and named distribution through native layout, history, source ownership, safeguards, and saving.
check-participation.ts verifies the ordinary Absolute Position control, parent-relative boxes, native reflow, history and saving.
check-sizing.ts covers ordinary per-axis Fixed/Fit, bounded nowrap cross-axis Fill, and single-grow, multiple-child and per-row wrapped main-axis Fill sharing with native sizing, ownership, safeguards, history, and saving.
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
Project reopening waits for the completed dialog transition before reading the new session.

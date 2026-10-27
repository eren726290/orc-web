# Pen guide label readability checkpoint

Prepared on 2026-10-27 for the owner's assigned `001-pen-guide-label-readability.md` task.
The presentation fix is implemented and every required correctness command passes.
The task ledger has five met gates and one archival handoff: the old standalone tooling summary was overwritten before backup.
No feature or correctness check remains failing.

## Result

Measurements, rule markers and selected-anchor coordinates keep their original text and 11-pixel editor size.
The overlay measures actual SVG text boxes, reserves the text halo, visible controls and mapped measurement targets, then tries nearby positions in a fixed order.
Labels stay six pixels inside the canvas.
Selected-anchor coordinates have placement priority, followed by path segment order.
Displaced labels receive a leader when the gap exceeds 26 pixels.
Leader placement tries a direct segment, side elbows and outer label rows or columns to avoid crossing other label boxes.
The layout batches DOM reads before SVG writes and runs through existing overlay invalidation without an animation loop or another React render.

Anchor positions, arc centers, geometry, source records, solver behavior, history and saved format are unchanged.
All measurements remain present in the representative cases.
Guide visibility, essential handles, project preference restoration and exclusion from design artwork retain passing evidence.
The finite-viewport fallback retains every label at its least-overlapping candidate rather than hiding information.
Arbitrarily dense drawings are not guaranteed to have collision-free labels.

## Changed files

| File | Change |
| --- | --- |
| `src/editor/pen/PenGuides.tsx` | Preserve existing content and geometry while attaching the measured label layout. |
| `src/editor/pen/guide-label-layout.ts` | Read rendered text/control bounds, reserve targets and batch overlay-only writes. |
| `src/editor/pen/guide-label-placement.ts` | Deterministic nearby positions, canvas bounds and least-overlap fallback. |
| `src/editor/pen/guide-label-leader.ts` | Bounded leader candidates and label-intersection checks. |
| `src/editor/pen/pen.css` | Semantic-token leader stroke only. |
| `src/editor/pen/README.md` | Explain ownership, placement policy and dense-scene limit. |
| `scripts/e2e/editor/pen/check-editor.ts` | Run the P and edge readability workflows in both modes. |
| `scripts/e2e/editor/pen/nested-mapping.ts` | Reuse the rendered readability checks after transforms, zoom, native scrolling and cancellation. |
| `scripts/e2e/editor/pen/guide-readability.ts` | Copy the P project, recreate its unfinished bowl through actual Pen clicks, check selection and repeated pointer stability. |
| `scripts/e2e/editor/pen/guide-edge-flow.ts` | Check all four corners at 50%, 100% and 200% zoom with full text and no annotation commands. |
| `scripts/e2e/editor/pen/guide-bounds.ts` | Compare actual text, halo, handle and canvas bounds. |
| `scripts/e2e/editor/pen/guide-leaders.ts` | Sample actual leader paths and reject crossings through other labels. |
| `scripts/e2e/editor/pen/guide-project.ts` | Target the active fixture project while the original workflow project remains open. |
| `scripts/e2e/editor/pen/guide-p-fixture.json` | Retain a verbatim copy of the saved P document so ignored demo files are not a test dependency. |
| `scripts/e2e/editor/pen/README.md` | Record fixture provenance, assertions and evidence paths. |

`PenOverlay.tsx` did not change.
No dependency, solver, model, command, history, source parser or shared editor interaction file changed for this task.
Progress, backlog and this task's ledger/report are the additional documentation updates.

## Reproduction and regression

The pre-fix development run reproduced the actual unfinished bowl using the retained project's geometry and actual Pen clicks.
It failed at `P bowl draft: label collision: L 2.2 · 26.6° / R 151.7 · 25.9° T`.
The retained project is the later black-filled P, so the copied background artwork differs from the earlier outline-only screenshot, while the crowded draft geometry and measurement strings reproduce the defect.
The original demo project was never opened for writing.

The assertion expands rendered text bounds by half the actual halo stroke plus one pixel of clearance.
It keeps a 0.25-pixel intersection tolerance before and after the fix.
It also rejects label overlap with actual visible anchor, center and transform-control bounds and checks canvas containment.
The leader regression samples actual SVG paths every two pixels, independently of the placement helper.
The same visible-result assertions pass after the fix in both modes.
The checks retain all expected labels and confirm the original font size rather than shrinking or omitting text.

Additional edge failures during implementation exposed a coordinate label covering a resize handle, leaders crossing neighboring labels and a label covering another measurement's attachment point.
The bounded placement, target reservation and leader corrections address those observed cases.
A repeated unchanged draft pointer scene produces identical label bounds.

## Final source and commands

The branch remains `pen-tool` at commit `53b2951229627d6be9d0b950237226de186a3d82` with the existing uncommitted implementation preserved.
The final checkpoint contains 260 watched source, check, source-folder README and configuration files.
Its source-hash-map digest is `15083efcafb11e4d1fe326f326aff90b4dde4c2d4bca86c9361fc3289bb666e9`.
The digest is SHA-256 of the compact, key-sorted JSON encoding of `source-checkpoint.json`'s `sourceHashes` map.
Every one of the eight browser result records matches that same source map, including each runner's after-map where available.
The separate numerical interaction record also passed within the full Pen command.

The browser was Google Chrome for Testing `155.0.8059.12` at `/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome`.
This is the managed supported Chrome executable, not an installed-stable Chrome claim.

All of the following exited zero on the final source checkpoint.

```sh
export ORC_CHROME_EXECUTABLE=/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome
bun run check:types
bun run lint
bun run check:format
bun run check:tooling
bun run check:health
bun run check:codebase
bun run build
bun run check:pen
bun run check:pen-performance
git diff --check
```

Static/tooling checks preceded the frozen browser suite.
The full Pen command ran editor, layout, source, transforms, lifecycle, numerical interaction, refusal and drawing workflows.
Performance ran afterward without another owned browser check competing with it.
No thresholds were weakened or errors suppressed.
Fallow reported no new unused-code findings in the guide files.
Its advisory estimated-coverage CRAP findings remain warnings; the required complexity and function-size limits pass unchanged.

The browser coverage includes the P draft, stem coordinates, 24 corner/zoom cases, nested rotation/scrolling, stable pointer scenes, guides off/on, project/Preview restoration, cancellation, locks, history and clean standalone SVG.
Representative screenshots were inspected after the final run.
The old 8/8 branch report remains tied to its historical source and is not a recertification of every combined main-application workflow.

## Performance observations

These are observed medians in milliseconds, compared with the retained pre-task performance record, rather than a controlled statistical benchmark.

| Mode | Anchors | Preview before | Preview after | Full cycle before | Full cycle after |
| --- | --- | --- | --- | --- | --- |
| Development | 20 | 6.2 | 8.0 | 7.5 | 9.9 |
| Development | 402 | 66.9 | 71.6 | 364.8 | 372.8 |
| Built | 20 | 3.6 | 4.4 | 5.2 | 5.8 |
| Built | 402 | 25.8 | 29.4 | 326.3 | 333.4 |

The built 402-anchor Worker solve measured 293.9 ms median.
Its full cycle measured 333.4 ms median and 356.3 ms p95.
Pointer-to-second-frame latency measured 16.6 ms median and 30.0 ms p95.
The existing large-path numerical delay remains a limitation.
This presentation task does not optimize or replace the solver.

## Evidence and preservation

All task evidence is under `artifacts/pen-guide-readability/`.

- `before.log` and `before/` retain the original failing assertion, source identity, screenshot and trace.
- `development-bowl.png`, `built-bowl.png`, stem screenshots and the 24 edge screenshots/bounds retain current visible results.
- `source-checkpoint.json`, `static-commands.json`, `pen-commands.json` and `performance-commands.json` record the final source and command exits.
- `final/` retains copies of the final Pen screenshots, traces and results, plus the current passing tooling summary.
- `historical/` retains the prior Pen workflow directories and integration manifest.
- `historical-hashes.json` and `final-hashes.json` fingerprint those retained copies.
- `performance-comparison.json` retains full before/after timing summaries.
- `scope-review.json` records the unchanged main checkout and preserved unrelated work.

The historical numerical interaction summary was initially missed in the directory archive.
Its deterministic record was recovered from the archived original source identity and manifest timestamp, then required to match the original manifest's exact SHA-256 before being written.
`historical/interaction-recovery.json` explains that verified byte-for-byte recovery.

One archival requirement remains unsatisfied.
The old `artifacts/scaffold/tooling.json` summary was overwritten before backup, and its original timestamp/bytes were not recovered.
The new passing summary is retained under `final/scaffold/tooling.json`.
No historical Pen screenshot, trace or integration manifest is missing.
Recover the old standalone tooling summary from an external backup if complete byte-for-byte archival closure is required.
The ledger explicitly abandons the preservation gate for that reason instead of certifying complete preservation.

One earlier exploratory development run reloaded between gestures.
Its trace records a second top-level page load and new Vite connection; the specific trigger was not established.
The preserved trace is under `priority-reload/`.
A frozen rerun and both subsequent full Pen runs passed without weakening the interaction checks or changing navigation/Vite behavior on an unproven theory.

The main checkout's nonignored file inventory and hashes match their starting values.
Unrelated files in the Pen worktree also match the starting dirty baseline.
Root `GATES.md` remained unread and was never targeted for writing.
No commit, merge, rebase, push or PR was performed.
No further feature or integration work was started.

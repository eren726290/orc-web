# Make Pen guides and labels readable

Prepared on 2026-10-27 for the owner's existing pen-agent session.
Status: handoff prepared; implementation has not started through this handoff.
Priority: P2.
Expected effort: medium.
Primary risk: changing annotation placement can obscure handles, misidentify a segment or add browser-thread work during dragging.

## Assignment and checkout

Improve the readability of existing Pen measurements, rule labels and selected-anchor coordinates while preserving the accepted Guides & labels behavior.
Implement this focused task in `/home/eren/D/orc-web-pen` on its existing `pen-tool` branch when the owner assigns this handoff.
Treat `/home/eren/D/orc-web` and this temporary handoff directory as read-only references.
Preserve both checkouts' existing uncommitted work.
Do not merge, rebase, commit, push or open a PR as part of this task.
Keep root `GATES.md` unread and unchanged; use a feature-specific ledger in the pen worktree if needed.
Return the completion report in your own session so the owner can share it with the main agent.

Both worktrees were at `53b2951229627d6be9d0b950237226de186a3d82` when this handoff was prepared.
That commit alone does not identify the implementation because Pen changes are uncommitted.
The existing branch evidence is described in [the final report](/home/eren/D/orc-web-pen/plans/pen-final-report.md) and [its manifest](/home/eren/D/orc-web-pen/artifacts/pen-integration/final-manifest.json).
The recorded combined source fingerprint is `d93e8a210e24eb8a804b6bebaf0c32cc153eb53c84516985f25d98d8d237d961`.

## Observed problem and reproduction inputs

The owner supplied screenshots of a P drawn through the real Pen UI.
The bowl draft crowds the short lower-segment measurement against a neighboring arc measurement, with several nearby arc-center marks.
Some labels are also close to visible anchor handles and artwork.
The handoff author inspected the retained screenshots and current source; no new live browser reproduction was run while preparing this document.
Establish a repeatable browser failure before changing application code.

Use these retained inputs:

- [Bowl draft](/home/eren/D/orc-web-pen/artifacts/pen-demo/bowl-draft.png) shows the crowded short segment, adjacent arc labels and center marks.
- [Selected stem](/home/eren/D/orc-web-pen/artifacts/pen-demo/p-construction.png) shows construction circles, measurements, rule markers and transform handles.
- [Saved P project](</home/eren/D/orc-web-pen/artifacts/pen-demo/Video reference P.orc/document.json>) supplies the finished design geometry.

Open a temporary copy of the saved project rather than overwriting the retained demo.
Reproduce the unfinished bowl separately because the saved finished project does not preserve a local drawing draft.
If an input is missing, use the descriptions and existing Pen fixtures to reconstruct the relevant label arrangement and report the missing input.
Do not claim exact reference reproduction without observing it.

## Current implementation and source map

Read the pen checkout's `AGENTS.md`, root README and relevant contextual READMEs before editing.
Read [the Pen contract](/home/eren/D/orc-web-pen/doc_v1/interface/pen-tool.md:63), [the Pen module README](/home/eren/D/orc-web-pen/src/editor/pen/README.md) and [the check README](/home/eren/D/orc-web-pen/scripts/e2e/editor/pen/README.md).
Consult [the design-reference instructions](/home/eren/D/orc-web/design/README.md) for visual guidance and reuse the editor's existing semantic tokens.

| File in the pen worktree | Responsibility |
| --- | --- |
| `src/editor/pen/PenGuides.tsx` | Construction circles/lines, length/radius/angle labels, rule markers, selected-anchor coordinates and visible-segment culling. |
| `src/editor/pen/pen.css` | Annotation text, halos, guide strokes, anchors and transform-handle appearance. |
| `src/editor/pen/PenOverlay.tsx` | Native SVG-to-canvas mapping and separate auxiliary guides, essential anchors and transform controls. |
| `scripts/e2e/editor/pen/interaction-flow.ts` | Existing guide-toggle assertions, including unchanged document and retained handles. |
| `scripts/e2e/editor/pen/check-editor.ts` | Real drawing/editing workflow invoking those guide checks in development and built modes. |
| `scripts/e2e/editor/pen/nested-mapping.ts` | Independent guide/anchor alignment checks under nested transforms, scroll and zoom. |
| `scripts/e2e/editor/pen/check-lifecycle.ts` | Guide preference restoration through tabs and Preview. |

`Measurement` currently maps each segment's chord midpoint into canvas coordinates, then applies the same offset to every label:

```tsx
<text x={middle.x + 10} y={middle.y - 10}>
  {measurement} {marker}
</text>
```

Selected-anchor coordinates similarly use a fixed `+12`, `+24` screen offset.
The source has visible-segment culling but no label-placement collision handling.
Measurement text sits outside the SVG geometry transform so its orientation and text size remain suitable for editor reading.
Guide circles and actual center marks use the native geometry and must remain correctly located.

The reviewed source hashes are:

| File | SHA-256 |
| --- | --- |
| `src/editor/pen/PenGuides.tsx` | `27fe171729187fa92bd6b88b82c462579f8d67ee0a3cde01063b808a68fc688e` |
| `src/editor/pen/PenOverlay.tsx` | `1fad5b923544bfeb795ab47b4afed072e9cd6f72af7bd9b2060c68a474c1ad48` |
| `src/editor/pen/pen.css` | `656842cba0e092c5678b2d9307b9a664b47910f0ecb01b790f62982cc0f2d8d0` |

Compare these files and the live worktree state before implementing; reconcile intervening work rather than applying this plan blindly.

## Behavior to preserve

- Guides & labels switches only auxiliary construction guides, measurements, coordinates and rule labels.
- Turning it off keeps essential anchor and transform handles available under their existing eligibility rules.
- The preference remains project-local browser view state and survives tabs and Preview restoration without document, history, source or save changes.
- Annotations stay outside design artwork, remain absent from Preview and generated SVG, and do not intercept pointer input intended for the canvas or handles.
- Lengths, radii, angles, coordinates and rule markers retain their current meanings and numeric formatting.
- Pan, zoom, scroll and supported transforms keep each annotation associated with its actual segment or anchor.
- Drawing, dragging, cancellation, one-command completion, locks and pending Worker replies keep their existing behavior.

## Scope and implementation direction

Work primarily in `PenGuides.tsx`, its adjacent styles and focused helpers/tests within the existing Pen feature folders.
Change `PenOverlay.tsx` only if annotation placement needs existing geometry or handle information passed through it.
Keep any helper in the owning feature folder, follow existing TypeScript/React conventions, and retain the 10/40 complexity and function-size limits.
Use the current overlay invalidation rather than introducing a permanent animation loop.
Start with a small, deterministic placement policy using the visible annotations and available canvas space.
Prefer a few sensible label positions before introducing more machinery.
Keep the label-to-segment association clear; a small leader is an option if a necessary displacement makes that association ambiguous.
Actual anchors and arc centers stay at their true mapped locations; moving them is not a label-placement fix.
Construction circles may cross artwork or one another by design.
This task does not require construction geometry itself to avoid intersections.

Keep the supported measurement content and readable editor text sizes.
Do not obtain passing screenshots by shrinking text, removing measurements, disabling guides or silently hiding labels in the representative cases.
If genuinely dense drawings cannot retain every annotation legibly, report the concrete case and propose a clear visibility policy before changing which information the user sees.
Do not promise zero overlap for arbitrarily dense paths in a finite viewport.

This assignment does not include new geometric rules, new shape features, a Zoah feature audit, region fills, path spans, Mirror, vector animation, MCP, a solver replacement, numerical optimization or main-branch integration.
Source/model/solver/history changes, new dependencies and broad editor restyling require a demonstrated blocker and discussion with the owner before proceeding.

## Execution and acceptance checks

### 1. Capture the failure before the fix

Inspect current status and archive the existing result files, screenshots and traces that the selected check commands would overwrite.
Keep prior evidence and its manifests intact as historical records.
Reproduce the P crowding through the actual editor and retain the screenshot, inputs, source identity and trace.
Extend the existing guide workflow, or add a focused helper called by it, with a regression that fails on the observed readability defect before the application change.
Use rendered text and visible control bounds rather than an assertion about the placement algorithm's internal output.
Include the text halo when deciding whether two labels visually collide.
State the small spacing tolerance used by the check and retain it through the fix.

Verification: `bun scripts/e2e/editor/pen/check-editor.ts chrome` must retain a failure attributable to the new readability assertion before the fix.
If the screenshot concern cannot be reproduced, report what was observed instead of inventing a failing case.

### 2. Apply and inspect the smallest complete presentation fix

Keep geometry and document data unchanged while improving the text placement and any necessary presentation styles.
Inspect these cases in a real browser:

| Case | Required result |
| --- | --- |
| P bowl draft with the short segment and adjacent arcs | Complete measurements can be read separately and associated with the right segments. |
| Selected stem and a selected anchor | Coordinates, measurements and rule markers remain readable beside the essential handles. |
| A compact line/arc fixture near each canvas edge | An on-screen target's required label is kept readable in available space without covering editor panels. |
| The same fixtures at 50%, 100% and 200% canvas zoom | Text stays upright and readable at editor size, and placement follows the geometry. |
| Existing supported nested rotation and scrolling case | Geometry alignment remains correct and label placement updates after the native layout changes. |
| Guides toggled off and on; tabs and Preview round trip | Essential handles remain available, the preference restores, and document/history/source stay unchanged. |
| Repeated nearby pointer updates and unchanged pointer position | Labels do not alternate positions or flicker while the underlying scene is unchanged. |

Use representative before/after screenshots plus DOM geometry assertions for the reproduced collisions.
Wait for the actual applied layout and annotation update before measuring; keep the assertions tied to visible results.
Verification: the new readability assertion and existing guide checks pass in development and built modes, with manual screenshot review.
Update any source-folder README before the final verification so its contents are included in the recorded source checkpoint.

### 3. Run the final checks against one source checkpoint

Run these from `/home/eren/D/orc-web-pen`, using the existing pinned browser or another explicitly recorded supported Chrome executable:

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

All correctness/static commands must exit zero without suppressing errors or weakening thresholds.
The full Pen command already includes the editor, mapping, source and lifecycle checks; avoid duplicating those complete runs after the final source freeze.
Record the actual browser version and executable rather than calling a managed browser installed stable Chrome.
Run the performance observations separately from competing owned browser work and compare browser-thread preview work with the retained baseline.
The existing approximately 326 ms median large-path numerical/preview latency remains a reported limitation; this presentation task does not solve it.
If additional shared interaction code changes, identify and run its affected existing regressions.
Freeze source and watched documentation during browser verification, then write status/report updates after the owned browser processes finish.

### 4. Close the focused checkpoint

Retain current-source before/after screenshots, the failing and passing regression records, commands, exit codes, browser/mode identities and relevant traces under an ignored task-specific artifact directory.
Verify that label-only interactions produce no document mutation or command and leave generated SVG free of annotation content.
Review the final diff against the starting dirty worktree so unrelated Pen work is preserved and the main checkout remains unchanged.
Update the pen worktree's progress/verification records with what changed and what was checked.
Any source or source-folder README change after the final source capture requires updating the relevant verification evidence before reporting completion.
The main agent maintains this handoff's index; do not edit the main checkout to mark the task complete.

Report the chosen placement policy, changed files, reproduced failure, passing evidence, performance observations and remaining limitations.
Qualify the old 8/8 report as belonging to its recorded source; a new targeted checkpoint does not automatically recertify every historical main-application regression.
Finish this readability task and stop before starting another feature or integration task.

## Completion criteria

- The retained P failure is reproducible before the fix and passes the same observable assertion afterward.
- The representative draft, selection, zoom, edge and transform cases are readable without losing their measurement content or essential handles.
- Toggle, view-state restoration, cancellation, document/history isolation and clean SVG behavior retain passing evidence.
- Required static/build and Pen workflow checks pass on the final identified source, with performance observations reported separately.
- Current screenshots have been inspected, deferred limits are stated, historical evidence is preserved and unrelated dirty work is intact.

The next integration review must recheck the combined application separately.
Annotation placement and bounds checks will need review whenever future Pen features add new label content or change the native coordinate mapping.

# Pen integration boundaries

The branch implements the approved bounded human Pen extension from the main handoff under `/home/eren/D/orc-web/plans/`.
Current-source verification and existing product dependencies belong to [the integration ledger](../plans/pen-final-GATES.md) and [acceptance map](../plans/pen-acceptance.md).

## Verified branch behavior

Development and built Chrome checks cover human drawing, guarded anchor edits, complete native previews, continuation, deletion, history and save/reopen.
They also cover supported Free/Row/Column/wrapped/intrinsic placement, nested rotation/scroll/zoom mapping, source reconciliation and standalone SVG, paint fields, proportional resize/rotation and cancellation.
Lifecycle and refusal checks cover loader failure, actual traps, invalid buffers, failed Worker startup, locks, unsupported destinations/sizing, source drafts, project switching and guide preference restoration.
Data/command checks separately reject actual coupled writes to locked peers; native reflow of an unchanged locked peer remains allowed.
Current own records use round caps/joins, finite coordinates strictly within magnitude 1e9 and round-trip numeric output.
Other caps/joins and source-owned stroke forms refuse while editing metadata is attached; ordinary SVG remains the opt-out route.

## Measured solver blocker

The original main-thread implementation could not preempt one synchronous pinned SolidCraft solve.
Its retained production 402-anchor checkpoint measured 328.1 ms median, 340.3 ms p95 and 350.4 ms worst complete work callback.
That fixture has 602 serialized geometry points plus one separate upstream origin, for 603 upstream points total.
The smaller fixture has 20 anchors, 29 geometry points and 30 upstream points.
The original result remains in `artifacts/pen-performance/before-optimization/result.json`.
Later synchronous observations recorded in the progress notes improved production work to about 299 ms median but still blocked input.
Their old result file was replaced by subsequent Worker observations; the original retained baseline and CPU profiles remain independently inspectable.

Chrome CPU profiles attribute about 6.96 seconds of self samples in the production large-path probe to SolidCraft's dense `linalg::solve`, substantially more than any JavaScript function.
Development profiling shows the same numerical cost plus React development overhead.
The profiles are `artifacts/pen-performance/built-402.cpuprofile` and `development-402.cpuprofile`.
Overlay cleanup alone could not resolve that measured blocker.
The implementation paused and reported the cause before presenting the smallest remedy and its tradeoff.
The owner's full implementation authority covers this correction, as recorded in [the Worker plan](../plans/pen-worker-plan.md).

Each anchor gesture now owns one dedicated Worker and solver instance using the same verified compiled WASM module.
Only one numerical request is in flight; new pointer events replace the pending target.
Returned geometry still passes independent parsing/guards and complete native candidate validation on the browser thread.
Exact gesture/motion identity prevents stale previews after return-to-start or lifecycle changes.
Cancellation and release discard pending replies and terminate that gesture's Worker.
Release commits only the last complete native-validated preview and explains an unreached target.
Actual pending large-path return, Escape, Undo and release are covered in both application modes.
The browser Worker-close event can arrive later than input cancellation and is measured separately.

Current timing observations live in `artifacts/pen-performance/result.json` with exact source hashes.
They separate request work, native/overlay work, Worker numerical work, complete preview latency and continuous pointer-to-second-frame latency.
The measurement token proves retained observations and cancellation integrity, not an unspecified performance threshold.
Moving the numerical work frees browser input but does not make the dense solve faster.
Large paths can still take hundreds of milliseconds per preview step and may not reach a distant pointer before release.
An upstream numerical improvement requires a pinned comparison and a separate adoption decision if this latency needs to improve.
No alternate solver, weakened guard or smaller product path cap is introduced.
The [final branch report](../plans/pen-final-report.md) records the current measurements and exact source/runtime identities after all final gates passed.

## Separate existing product boundaries

The baseline lacks complete product image/PDF exporters, clipboard duplication and general SVG transform gestures.
This branch supplies only the authorized own-Pen artwork and proportional transform prerequisites.
Meaningful ancestor Source Apply keeps the existing fresh-descendant identity boundary.
Selected-root source compatibility does not repair general component reconciliation.
The public Pen format must be settled before release; older builds safely reject projects containing these records.
Windows and public MCP Pen workflows remain unverified.

## Deliberately deferred feature scope

Arbitrary imported SVG adoption, Bézier/G2 editing, holes/multiple contours, presets, booleans, typed dimensions, external-object snapping and agent concurrency remain deferred.
The existing canvas dot background is baseline UI; this task adds no new drawing grid.
The geometry is implemented directly without an additional tangent-construction library.

## Guide label readability follow-up, 2026-10-27

The focused [readability checkpoint](../plans/pen-guide-label-report.md) adds measured label placement and leader routing without changing geometry, values, guide visibility or the numerical solver.
All representative P, selection, corner, zoom and nested-transform cases pass in development and built Chrome.
A finite viewport still cannot guarantee separate labels for arbitrarily dense drawings.
The current fallback retains every measurement at its least-overlapping candidate.
Any future dense-scene visibility policy requires the owner's agreement before measurements are filtered.
One possible discussion option is selected-segment measurements and immediate neighbors with an explicit Show all control; it is not implemented or approved.

The built 402-anchor stress observation now measures 29.4 ms median browser preview work and 333.4 ms median full solve-to-preview time.
The numerical performance limitation remains separate from this presentation fix.

The old standalone `artifacts/scaffold/tooling.json` summary was overwritten before archival and requires an external backup to recover its original bytes.
Current checks pass, the new summary is retained, and historical Pen screenshots/traces/manifests remain available under `artifacts/pen-guide-readability/historical/`.
This evidence-preservation exception remains an explicit task handoff rather than a completed preservation claim.
The separate exploratory page reload retained in `artifacts/pen-guide-readability/priority-reload/` has no established trigger; frozen reruns pass, and no speculative navigation or Vite correction was made.

## Native Center constraints after main integration

Main's ordinary Center controls use native self-alignment and opposing pixel insets, without an individual transform.
The existing Pen reboxing model assumes compatible Left/Top placement.
A real integration probe showed that increasing stroke width from 2 to 12 under Center shifted the centerline by 2.5 pixels and broke the saved Center relationship.
The shared guard now refuses absolute Center reboxing before publishing an edit, preserving geometry, source and history and directing the user to choose Left/Top explicitly.
This applies to reboxing-dependent anchor changes, continuation, deletion, stroke changes and transform preparation.
Fill remains independent of reboxing.
Supporting those operations directly under native Center would require a deliberate coordinate policy and matching regressions across those callers; it is not claimed by this integration.
The current evidence and failing-before probe are linked from `plans/pen-main-integration.md`.

## Combined main integration observation, 2026-10-27

The [main integration report](../plans/pen-main-integration.md) records the completed combined-source workflow and preservation checks.
The separately run built 402-anchor fixture measures 28.5 ms median browser preview work, 331.2 ms median solve-to-preview time and 365.5 ms worst complete preview time.
These replace neither historical measurements nor the unresolved large-path latency limitation.
The 507.11 kB initial application chunk triggers the existing build warning; the normal build passes and the existing bundle-cost follow-up remains open.
The missing historical tooling summary remains unrecovered after integration.

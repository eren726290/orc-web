# Pen branch verification checkpoint

The approved bounded Pen implementation is ready for review in `/home/eren/D/orc-web-pen` on branch `pen-tool`.
It remains uncommitted on base `53b2951229627d6be9d0b950237226de186a3d82`.
The main checkout was read only throughout this task.
This checkpoint does not claim completion of the whole V1 product, product exporters or integration with main's concurrent changes.

## Implemented scope

Human drawing supports straight segments, directed tangent arcs, angular snapping, exact closure, continuation and anchor deletion.
Guarded anchor editing preserves the approved H/V, perpendicular and tangent rules, local cancellation, one-command history and save/reopen identities.
Native SVG matrices and complete candidate validation govern supported Free/Row/Column/wrapped/intrinsic placement, reboxing, nested transforms, scrolling and zoom.
Source compatibility retains records for supported formatting and paint edits, while incompatible replacements detach with an explanation.
Own-Pen Fill, Stroke, Stroke width, proportional Scale and Rotation work through Properties and the bounded canvas transform controls.
The final form checks include accurate read-only Fixed dimensions and a selected-name header that remains visible while scrolling.

SolidCraft `cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4` is the adopted external numerical implementation.
Tangent construction is elementary geometry written directly in [geometry.ts](/home/eren/D/orc-web-pen/shared/pen/geometry.ts:36).
No Weave package, imported code or vendored code was adopted.
JavaScript dependencies, development dependencies and `bun.lock` are unchanged.

The changed responsibilities are the portable `shared/pen/` model and validation, the pinned `solver/pen/` adapter, the feature-owned `src/editor/pen/` controls and Worker, their focused checks, and the existing command/source/Canvas/Properties integration points.
The [integration review](pen-integration-review.md) identifies the nine shared-file overlaps and indirect native-ownership dependencies.

## Current-source evidence

The [final ledger](pen-final-GATES.md) records six successful runnable gates and two completed manual reviews.
The retained [audit manifest](/home/eren/D/orc-web-pen/artifacts/pen-integration/final-manifest.json) compares 32 final result files with the current 251-file application/check source set, including each available before/after snapshot.
Every comparison matches.
It also records 17 additional configuration, Rust, license and build-input files and all eight built files.
The combined 268-file source fingerprint is `d93e8a210e24eb8a804b6bebaf0c32cc153eb53c84516985f25d98d8d237d961`.
Its definition is SHA-256 of the sorted, whitespace-free JSON map of relative file paths to SHA-256 hashes.
The source excludes this final prose and other plan/backlog/status documents, which can change without invalidating application evidence.
The retained [audit script](/home/eren/D/orc-web-pen/artifacts/pen-integration/final-audit.py) reproduces the comparisons from this worktree without editing product source.

The bundled WASM is 683,058 bytes with SHA-256 `38e22d058eb04b6e57b69bee4152b474aa90053b2b7e6e9b587d7a32e96a766a` and zero host imports.
The [build record](/home/eren/D/orc-web-pen/solver/pen/build.json) identifies Rust 1.95.0, its official `wasm32-unknown-unknown` target, the locked Cargo graph, release flags and exact upstream/adapter inputs.
Two independent builds produced the same bytes.
Native upstream checks passed 216 tests with three ignored; the adapter's two native checks passed.
Actual application WASM responses in both modes match that same binary, as do the built assets.

Verification ran on Fedora 44 with Bun 1.4.2, Node 22.23.2, TypeScript 6.0.3, isolated TypeScript 7.0.2 and Playwright 1.63.0.
The Pen browser suites used Chrome for Testing 155.0.8059.12 at `/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome` in development and built modes.
The unchanged legacy history runner uses only the built app and default Playwright Chromium, retaining a trace rather than a result manifest.
The legacy panel runner uses default Playwright Chromium in both modes and records version 153.0.8010.12.
A separate retained [default-browser preflight](/home/eren/D/orc-web-pen/artifacts/pen-integration/default-browser-preflight.json) confirms that runtime; it is not a repeat of either suite.
This is no claim of verification against installed stable Google Chrome.

The final checks ran sequentially through this command, with exit zero and the expected success token for every runnable gate:

```sh
ORC_CHROME_EXECUTABLE=/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome \
node /home/eren/.agents/skills/unlazy/scripts/gate-check.mjs \
  --approve --cwd /home/eren/D/orc-web-pen --timeout 3600 plans/pen-final-GATES.md
```

The ledger retains each exact command and its output fingerprint.
P6A covers both strict compiler scopes, lint, format, build, tooling, TS7 comparison and complete Fallow checks.
P6B covers strict records, real command/bundle failures, the Bun/browser numerical adapter and binary/license provenance.
P6C covers the complete Pen suite, P6D covers 18 affected existing command families, P6E records performance separately and P6H covers existing panel workflows.
The [acceptance map](pen-acceptance.md) accounts for all 40 guide rows, with 39 covered and X2 explicitly dependent on the missing product exporters.
Screenshots, traces, inputs, commands, browser identities and failure controls remain under the corresponding ignored `artifacts/pen-*` and `artifacts/editor/` folders.
The manifest hashes the final result files and the legacy history trace so historical red artifacts cannot be mistaken for final results.

Fallow reports zero effective errors, unused source files, unused exports, unresolved imports and dependency cycles.
Seven pre-existing planned dependency warnings remain reviewed and retained.
Its 391 health advisories use static coverage estimates rather than measured E2E coverage.
The existing complexity and function-size limits remain 10 and 40; no guard was removed or threshold weakened to pass.
Configured architecture-boundary enforcement and full accessibility certification are not claimed.

## Performance and pending motion

The measured synchronous numerical blocker led to the smallest correction described in the [Worker plan](pen-worker-plan.md).
Each gesture owns a disposable Worker using the unchanged verified module, with one request in flight and newer pointer targets coalesced.
Returned geometry still passes independent guards and complete native preview validation.
Cancellation, return-to-start and lifecycle changes invalidate pending replies.
Release performs no numerical solve and commits only the last complete native-validated preview, with feedback if the latest target was not reached.

Final production observations are milliseconds, shown as median / p95 / worst:

| Anchors | Request on browser thread | Native preview on browser thread | Worker solve | Solve through native preview | Pointer to second frame |
| --- | --- | --- | --- | --- | --- |
| 20 | 0.2 / 0.3 / 0.5 | 3.6 / 6.4 / 7.7 | 0.8 / 1.9 / 10.9 | 5.2 / 11.2 / 19.1 | 16.5 / 16.7 / 19.4 |
| 402 | 3.1 / 6.7 / 6.7 | 25.8 / 35.3 / 35.3 | 289.1 / 295.4 / 295.4 | 326.3 / 351.7 / 351.7 | 16.6 / 20.5 / 51.8 |

The full [performance result](/home/eren/D/orc-web-pen/artifacts/pen-performance/result.json) retains raw observations, sample counts and development measurements.
The large fixture has 602 geometry points plus the separate solver origin, for 603 upstream points.
Development large-path preview work remains heavier, with 66.9 ms median browser-thread preview work and 364.8 ms median complete preview latency.
Pointer-to-second-frame development latency has a 68.5 ms p95 and 94.6 ms worst observation.
The Worker improves input handling; large-path geometry still lags and can remain short of the pointer on release.
No unspecified latency threshold or universal interactive path capacity is certified.

The final lifecycle checks cancel genuine pending 402-anchor Worker calls in both modes for return-to-start, Escape, Undo and release, preserving the complete applied document and command count.
Production input cancellation for Escape/Undo/release measured 4.6 to 5.7 ms, while the later Worker-close event took 278.3 to 296.2 ms.
Return-to-start measured 26.9 ms and ignored the old reply after it had actually been processed.
Those close events do not prove immediate interruption inside the numerical solver.
The original synchronous baseline and numerical CPU profiles remain linked from [the performance backlog](../backlog/pen-integration.md#measured-solver-blocker).

## Remaining boundaries and handoff

The public Pen format needs a release decision; current unreleased schema-1 projects use Pen record version 1, and older builds safely reject those records.
Product image/PDF exports, clipboard duplication, arbitrary imported-SVG adoption, general SVG transforms, Windows and future public MCP behavior remain separate unfinished work.
The three supplied videos were reviewed at five frames per second; audio was not reviewed.
An earlier existing rendering check observed a development reload whose triggering event was not retained.
Unchanged reruns and the complete final regression run pass; the root cause of that isolated reload remains unknown, with server output now retained for recurrence.

The refreshed main overlap snapshot is [main-overlap-final.json](/home/eren/D/orc-web-pen/artifacts/pen-integration/main-overlap-final.json).
The combined checkout has not been built or tested.
No merge, commit, push or PR was performed.
The next bounded integration task is manual composition of the shared UI and native-ownership changes, followed by both Pen and main's Constraints/corner-radius/frame-label checks, under a separate integration instruction.

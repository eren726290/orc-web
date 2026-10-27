# Pen implementation progress

Started on 2026-10-25.
Status: P0/P1 and the P2 portable-data/command slice pass; complete editor/native-layout acceptance is in progress.
The measured main-thread blocker has a dedicated Worker correction using the unchanged pinned solver.
Final current-source integration checks are in progress; large-path preview latency remains an explicit limitation.

## Checkout and authority

The working directory is `/home/eren/D/orc-web-pen`, on the existing `pen-tool` branch.
Initial HEAD was `53b2951229627d6be9d0b950237226de186a3d82`.
The initial working tree was clean, and the committed difference from the handoff baseline was empty.
No existing pen implementation needed preservation at that checkpoint.
The main checkout at `/home/eren/D/orc-web` is read-only, including its existing uncommitted frame-label work.
The owner explicitly permits reading any file there.
Do not merge, rebase, push, open a PR, or modify the main checkout under this task.
Do not read or change either checkout's root `GATES.md`.

Both `pen-agent-handoff.md` and `pen-agent-implementation.md` in the main checkout's `plans/` directory were read completely.
The three supplied videos were previously reviewed at five frames per second.
The linked original proposal, corrective follow-up, and all five handoff research records were read completely.

## Adoption decisions presented to the owner

These recommendations were presented as three grouped questions on 2026-10-25.
The owner explicitly approved all three groups on 2026-10-25.
The geometry, format, placement, essential-handle, continuation, and bounded SVG-prerequisite recommendations below are authorized for this branch.

| Topic | Recommendation | Dependent work |
| --- | --- | --- |
| Arc cap and closure | Show the actual projected endpoint for capped previews and refuse a closing arc that cannot reach the first anchor exactly. | Arc placement and closure UI. |
| Numeric output | Use deterministic round-trip numbers, normalize negative zero, and validate the encoded SVG. | Portable pen geometry and SVG encoding. |
| Format compatibility | Independently version the pen record within the current unreleased project schema and explain older-build refusal. | Canonical parser, project storage, and accepted format documentation. |
| Placement | Freeze one selected eligible frame, use the workspace with no selection, and refuse ambiguous or locked destinations. | Drawing destination and native layout publication. |
| Transformed and flow layout | Prove supported mappings and preserve native flow, with explanatory refusals for unsupported cases. | Reboxing, transformed edits, Row/Column insertion, and Fill checks. |
| Essential handles and continuation | Keep editing handles when auxiliary guides are hidden; click the last anchor with Pen to extend an open path. | Guides toggle and continuation gestures. |
| SVG prerequisites | Add only the artwork and transform controls necessary for the promised human pen workflow. | Fill/stroke controls and proportional resize/rotation gestures. |

The handoff requires this checkpoint before changing accepted contracts.
The checkpoint is resolved; implementation can proceed after the relevant source and acceptance checks are prepared.

## Scope and first implementation slice

Follow P0 through P6 in the linked implementation guide.
The first implementation slice is a pinned, guarded solver adapter, followed by one complete atomic create/edit/cancel/history/save workflow.
Human pen functionality comes before MCP.
Do not introduce an alternate solver, renderer, history system, background grid, path-length product cap, or deferred geometry features.

Before adding application code, map every affected mutation consumer, candidate projection, source reconciliation path, save parser, and native Fill check.
The strict SVG parser currently accepts only `source` in addition to common node fields.
The existing project parser requires schema version 1 and rejects unknown fields.
SVG styling and resize/rotation gestures are not completed production prerequisites at the baseline.

## Initial checks

`bun install --frozen-lockfile` succeeded with Bun 1.4.2 and installed 113 locked packages in this worktree.
The lockfile was not changed.
Node reports v22.23.2.
Initial lint and formatting checks passed.
The initial type check also passed with exit code 0.

The retained diagnostic toolchain initially had only the native `x86_64-unknown-linux-gnu` target installed.
An independent build environment now contains Rust 1.95.0 and its verified official WASM target without any standard-library patches.
The retained diagnostic environment remains unchanged.
The independent Cargo cache was verified against the pinned checksums and used offline; its historical localhost source key is not product configuration.

## P1 verified adapter candidate

The normal upstream native suite passed 216 tests, with zero failures and three ignored tests.
The wrapper's two native tests passed, covering contradictory fixed geometry rollback and invalid references/nonfinite inputs.
The rebuilt binary is 683058 bytes, has no host imports, and has SHA-256 `38e22d058eb04b6e57b69bee4152b474aa90053b2b7e6e9b587d7a32e96a766a`.
A second build produced the same binary hash.
The compiler, exact source inputs, lockfile, flags, dependency licenses and notices are retained under `solver/pen/`.
The official target archive is retained in the independent build cache with SHA-256 `5587b89ff69623d09e476439d44a24453b4e4ea3d5e0b53a5c0a935151ff3fd1`.

Thirteen numerical check groups pass in Bun and real Chrome 155.0.8059.12.
Chrome also passes five native SVG checks with independent analytic lengths and midpoints.
The checks prove both arc directions, opposite-turn arcs, exact closure, mutable first anchors, rule removal, incoming-line deletion, reconstruction, DOF status, per-path isolation, range checks, tiny SVG geometry, collapse/reversal rejection, missing exports, actual traps, and full immutable rollback.
The encoded-circle check additionally refuses near-semicircular data whose SVG would reconstruct a different center.
Raw native logs, runtime identities, source evidence, numerical results, screenshot and browser trace are retained under ignored `artifacts/pen-solver/`.
This fixture does not prove actual ORC application asset loading or user workflows.

Types, lint and formatting passed through the P1 ledger.
Fallow's built-in detection found the expected Vite/TypeScript/Bun setup.
Focused geometry and check analysis found no functions over the configured cyclomatic or unit-size limits.
It reported twelve estimated CRAP warnings because no runtime coverage file was supplied; these are not claims of missing behavioral checks.
No findings were automatically removed or suppressed.

## P2/P3 checkpoint, 2026-10-26

Sixteen record check groups and four real project command groups pass.
They cover strict versions/references/geometry, public bounds and source agreement, one revision/history entry, stale/idempotent/locked command refusal, and saved bundle preservation.
The actual baseline parser was retained under ignored artifacts and verified to reject the new pen field while accepting ordinary SVGs.
The new server-importing command check remains covered by the strict server TypeScript configuration rather than mixing Bun and Vite ambient declarations.

The first UI-driven root path workflow passed in both development and built Chrome.
It created a line/arc/line path, verified native stroke and analytic length, dragged an anchor, cancelled a drag, performed exact Undo/Redo, rejected an insufficient draft, and saved/closed/reopened through the real dialogs.
Both application modes loaded the intended 683058-byte WASM with the recorded SHA-256.
The broader failure/continuation/layout matrix is still in progress, so this does not mark P3 or the pen complete.

The workflow reproduced two integration defects before correction.
Chrome's native SVGMatrix lacked is2D, requiring an explicit DOMMatrix conversion before inversion.
The ordinary canvas all-property reset overrode root SVG presentation attributes; SVG roots now reset only preflight display/alignment and preserve native paint attributes.
The new native paint assertion failed before that correction and passed afterward.
Existing rendering fidelity and SVG-boundary workflows passed in both application modes after the reset correction.
Retained evidence is under `artifacts/pen-editor/`, with the initial failure trace and screenshot under its `debug/before-fix/` directory.

## Native placement and interaction checkpoint, 2026-10-26

The later editor runner additionally passes actual load-failure retry, exact return-to-start, immediate pending Undo, open-path continuation, interior/endpoint deletion, protected anchor deletion, lower-anchor-count whole-node deletion and guide visibility in development and built modes.
The native layout runner passes root/Free, Row, Column, wrapped Row and intrinsic shared Column insertion and editing in both modes.
It also exercises proportional sizing with rotation and percentage transform-origin compensation.
These results do not yet cover the full source/paint/transform-control acceptance or lifecycle matrix.

The new numerical interaction check reproduces a natural coarse held-anchor move whose raw solver status succeeds but reverses a tangent.
The guarded adapter retains the original path, while adaptive continuation reaches the same requested target without reversing it.
At that earlier synchronous checkpoint, continuation attempted at most four solves per callback and stopped further attempts after its eight-millisecond work allowance.
A synchronous solve itself cannot be preempted.
That earlier release performed bounded final synchronous work; the current Worker release performs no numerical solve and commits only the accepted preview, discards outstanding motion and explains an unreached target.

The first complete pointer measurements exposed a serious performance issue.
The production 402-anchor/602-solver-point fixture measured a 328.1 ms median, 340.3 ms p95 and 350.4 ms worst work callback.
The 20-anchor development fixture measured a 15.0 ms median and 23.3 ms p95.
The measurement runner's success token means observations were captured; it does not certify these values as acceptable performance.
The original observations are retained under `artifacts/pen-performance/before-optimization/result.json`.
Dependent drag completion is paused while the cost is diagnosed.
The three hypotheses are repeated geometry/hash validation, numerical solver work, and native/React overlay work.
Chrome CPU profiles are being captured before selecting a remedy.

## Acceptance and evidence

Use the start ledger for P0 and add focused runnable gates as each implementation slice begins.
Retain exact source, compiler, browser, commands, inputs, outputs, and failure controls for P1.
Use the implementation guide's D/G/E/S/L/U/R/X matrix for later production acceptance.
Numerical adapter tests are justified because exact residuals, directed arc traversal, encoded precision, and degenerate-success controls cannot reliably be asserted through pixels alone.
Normal drawing, editing, history, source, and saving workflows require real E2E evidence.

## Resumed verification checkpoint

The full Pen browser suite, data checks and numerical interaction checks passed before the final drawing/refusal expansion.
Later independent checks pass source formatting/paint/stroke reboxing, meaningful ancestor detachment and plain standalone SVG geometry.
Pointer resize/rotation, typed and keyboard transforms pass with native pivot assertions and exact cancellation/history.
The transform failure showed that the ordinary sizing reader intentionally refuses transformed objects; the bounded Pen transform checks retain explicit Fixed dimensions, ownership and full native candidate validation.
A native CSS size can snap to a 1/64-pixel layout value, so transform geometry assertions compare projected corners under the declared 0.1-screen-pixel tolerance rather than an unjustified matrix coefficient tolerance.

Lifecycle checks pass pointer cancellation, lost capture, synthetic window blur, focus changes, tool/zoom changes, new revisions, project changes, guide preference and Preview restoration.
Cancellation now releases capture explicitly, following the reproduced held-capture failure.
New nested mapping checks pass rotated ancestors, clipping, native scroll, zoom, aligned guides/handles, reboxing and one-command history.
Refusal checks pass ambiguous/locked/transformed destinations, native flow origin shifts, source-owned sizing, Code draft cancellation, real WASM traps, invalid buffers and fresh-gesture retry.
Source-owned sizing now refuses at drag start so release cannot replace the prerequisite explanation with a generic stopped-motion notice.
The valid locked Fill peer positive control retains its exact CSS while native allocation responds to Pen scale.
Actual coupled writes to locked peers remain covered by the real command/bundle check.

The failed locked-peer fixture used basis 100 while the supported shared projection requires the computed common basis of at least 200.
That fixture no longer described owned Fill and was corrected; no product behavior was changed to satisfy it.
A separate refusal-run interruption came from running the TS7 snapshot writer beside Vite, which observed copied HTML in artifacts and reloaded the page.
Tooling snapshots and development browser checks now run sequentially.
Retained red artifacts remain under their feature evidence folders.

Fallow's full graph now has no effective complexity errors after separating existing input, preview, parsing and mutation responsibilities.
Its CRAP advisories use static coverage estimates and do not measure the retained E2E workflows.
The existing seven planned dependency warnings remain reviewed and retained.
TS6, TS7, tooling, formatting and builds passed earlier checkpoints; final source-bound verification is recorded by the integration ledger.
The TS7 result is `artifacts/scaffold/ts7/runs/2026-10-26T03-29-14-660Z/result.json`.

## Worker correction and source clarification

The measured numerical cost justified moving the unchanged verified WASM solve into a disposable dedicated Worker per anchor gesture.
The existing full implementation authority covers this correction; the remedy and retained preview latency were presented before implementation.
The previous separate-approval interpretation was overly restrictive.
Only one request is in flight, newer pointer targets coalesce, and exact gesture/motion identity prevents stale replies from publishing previews.
Native candidate validation and one-command release remain on the existing boundary.
Actual Worker startup failure, WASM traps, invalid buffers and retry pass in both app modes.
Genuine pending 402-anchor return-to-start, Escape, Undo and release also pass without changed applied state or a command.
Input cancellation and the later browser Worker-close event are recorded separately.

SolidCraft is the pinned external numerical code adopted by this implementation.
The tangent circle uses direct elementary geometry in `shared/pen/geometry.ts`; no additional tangent library or dependency is needed.
The owner clarified that Weave should not appear as an adopted source; no Weave package, imported source or vendored code was added.

## Final form review

The own-Pen transform suite reproduced a hidden selected-name header during form scrolling and misleading Source sizing labels after rotation.
The branch reuses main's existing fixed-header/scrolling-content layout and adds a feature-owned accurate read-only Fixed size readout directing proportional changes through Scale.
Both regressions pass in development and built modes; their red traces/screenshots remain under `artifacts/pen-transforms/before-form-header-fix/` and `before-size-readout-fix/`.
An existing rendering run had an unexpected development reload before selecting a layer.
The trace proves reconnection, but its triggering file/event was not retained.
Unchanged reruns and the next full rendering check pass; a controlled documentation-write probe does not reproduce it.
The rendering runner now retains dev-server output for diagnosis if it recurs.
No product navigation or Vite behavior was changed on an unproven theory.

## Initial-load cancellation correction

A real held WASM response reproduced a late local anchor after Escape while the first click was still loading.
The explicit local loading phase now participates in cancellation and owns its Escape/Undo/Delete/arrow keys.
It ends before the Code-draft safeguard opens so the safeguard's focus does not cancel its own approved action.
Stale load continuations cannot create geometry or replace a newer notice.
The verified immutable module remains reusable by the next deliberate gesture.
The actual asset/cancel/retry workflow passes in development and built Chrome, with the original red trace under `artifacts/pen-editor/before-loading-cancel-fix/`.
The blocked-Delete red check remains under `before-loading-key-guard/`; held route cleanup now waits for its own handler to finish.

## HTML reset regression correction

The full layout check exposed a real CSS specificity regression from the SVG paint exclusion.
The more specific HTML reset overrode the later border-box default, expanding a 190-by-62 Fixed frame with padding/borders to a 220-by-92 outer box.
A focused real rendering control failed at 220 versus 190 before the fix.
The SVG filter now uses zero specificity, retaining native SVG paint and the original HTML reset/box-sizing order.
The focused native rendering workflow and full Free/Row/Column/wrapping layout regression pass in development and built Chrome after this correction.
The red evidence is under `artifacts/editor/layout-before-reset-specificity-fix/` and `rendering-before-specificity-fix-*`.

## Final branch checkpoint

The six runnable final gates passed sequentially on the frozen runtime/check source.
The final audit matches all 32 result files against the current 251-file common source set and records 17 additional configuration, Rust, license and build inputs.
The combined source fingerprint is `d93e8a210e24eb8a804b6bebaf0c32cc153eb53c84516985f25d98d8d237d961`.
The acceptance map covers 39 guide rows and records the missing product exporters for X2.
Final performance retains production 402-anchor preview latency of 326.3 ms median and 351.7 ms p95, with pointer-to-second-frame latency of 16.6 ms median and 20.5 ms p95.
The result remains a measured bounded implementation rather than a claim that large-path geometry tracks every input frame.
The [final report](pen-final-report.md) records source/binary/runtime identities, commands, final observations and remaining dependencies.
The refreshed read-only main snapshot retains nine shared-file overlaps and notes its updated active property-ownership subscription.
The next bounded task is manual integration and combined-checkout verification under a separate instruction.
The main checkout remains untouched; this task performed no merge, commit, push or PR.

## Guide label readability checkpoint, 2026-10-27

The owner's `001-pen-guide-label-readability.md` assignment is implemented as an overlay-only presentation change.
Actual rendered text, halos, controls and measurement targets inform deterministic placement and bounded leader routing.
The P draft regression fails before the fix and passes afterward, together with selected coordinates, all four corners at 50/100/200 percent zoom, nested transforms/scrolling and stable pointer scenes.
All required static/build commands, the full Pen suite and the separate performance run pass on the frozen 260-file source checkpoint.
The hash-map digest is `15083efcafb11e4d1fe326f326aff90b4dde4c2d4bca86c9361fc3289bb666e9`.
Built 402-anchor preview work measures 29.4 ms median versus the retained 25.8 ms baseline, with the existing full-cycle delay still present at 333.4 ms median.
The [readability report](pen-guide-label-report.md) records changed files, commands, screenshots, scope review, performance and limitations.
The [task ledger](pen-guide-label-GATES.md) records five met gates and one archival handoff because the old standalone tooling summary was overwritten before backup.
Historical Pen screenshots, traces and manifests are preserved, including verified recovery of the exact old numerical interaction summary.
The main checkout and unrelated dirty work remain unchanged.
The historical 8/8 report retains its original source identity; this task does not certify combined main-application integration.

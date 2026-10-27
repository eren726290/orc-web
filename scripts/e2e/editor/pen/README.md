# Pen verification

Run `bun run check:pen` for human editor, layout, source, transform, lifecycle, numerical interaction and refusal checks.
Each browser runner covers development and built app modes, records the real executable/version, freezes source hashes and retains failure manifests as well as screenshots and traces.
Set `ORC_CHROME_EXECUTABLE` for a different installed or managed Chrome executable.
The current default is the managed Chrome 155 path recorded in `browser-suite.ts`.
`check-editor.ts` additionally records actual application WASM requests, exact bytes/hash and real dialog save/reopen.
Its held real-download regression proves Escape prevents a late draft and Delete stays inside the loading interaction, followed by successful reuse of the verified module.

| Entry point             | Observable coverage                                                                                                               | Evidence directory          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `check-drawing.ts`      | Actual capped/exact closure, closed deletion and fresh identities after a new Undo branch.                                        | `artifacts/pen-drawing/`    |
| `check-editor.ts`       | UI-created line/arc path, drag/cancel, pending Undo, continuation, deletion, guides, load recovery and save/reopen.               | `artifacts/pen-editor/`     |
| `check-layout.ts`       | Native Free/Row/Column/wrapped/intrinsic placement, rotated reboxing, nested scrolling/clipping/zoom and aligned handles/guides.  | `artifacts/pen-layout/`     |
| `check-source.ts`       | Compatible Apply and paint, numeric formatting, stroke bounds, visible detachment, ancestor identity boundary and standalone SVG. | `artifacts/pen-source/`     |
| `check-transforms.ts`   | Real pointer resize/rotation, native pivots, cancellation, typed/keyboard controls and exact history.                             | `artifacts/pen-transforms/` |
| `check-lifecycle.ts`    | Cancellation, revision/project changes, repeated local IDs across paths, guide preference and Preview restoration.                | `artifacts/pen-lifecycle/`  |
| `check-refusals.ts`     | Destination/layout/sizing/draft refusals, actual WASM trap/invalid buffer with retry, and unchanged locked Fill peer reflow.      | `artifacts/pen-refusals/`   |
| `check-interactions.ts` | Numerical snap/cap/closure/deletion controls and a naturally reversing coarse solve followed by guarded continuation.             | Console assertions.         |

Run `bun run check:pen-data` for portable record and real command/bundle checks.
`check-record.ts` tests the trust boundary because exact topology, identity collisions and SVG/numeric agreement cannot reliably be established through pixels.
`check-commands.ts` compares complete documents/history and original bundle bytes after valid, malformed, stale, idempotent, own/ancestor-locked and coupled-peer-locked commands.
That server-importing entry point is typechecked by the strict server configuration because Bun and Vite ambient declarations conflict.
Both compiler scopes remain required; neither weakens dependency declaration checking.
Data evidence belongs to `artifacts/pen-data/`.

Run `bun run check:pen-performance` separately, without competing browser or tooling runs.
It records separate request-conversion work, complete native/overlay preview work, Worker numerical work, full solve-to-preview latency and pointer-to-second-frame median, p95 and worst at 20 and 402 anchors.
Pointer inputs continue during solving and preview publication until at least 24 inputs and 12 complete solve cycles have been observed, with a bounded 240-input ceiling.
Serialized geometry point counts exclude the fixed upstream origin; `upstreamPoints` includes it.
`ORC_PEN_PROFILE=1` additionally captures the main-page CDP CPU profile; it does not profile the dedicated Worker.
The success token proves observations and cancellation integrity, not an acceptable latency threshold.
The [performance record](../../../../backlog/pen-integration.md#measured-solver-blocker) retains the numerical latency and historical synchronous blocker.
Lifecycle tests additionally discard genuine pending 402-anchor results after exact return, Escape, Undo and release; input cancellation and the later browser Worker-close event have distinct timing fields.

Do not run the TS7 snapshot writer alongside a development browser check.
Vite observes its copied HTML artifacts and can reload the active page; the retained refusal-check interruption was a tooling collision, not a product geometry failure.
Run tooling snapshots first, then browser workflows against frozen source.
Numerical/build provenance checks belong to [scripts/solver/](../../../solver/README.md).

## Guide readability regression

`check-editor.ts` includes `guide-readability.ts`, `guide-edge-flow.ts` and the rendered-bounds assertions in `guide-bounds.ts`.
`guide-p-fixture.json` is a verbatim copy of the retained Video reference P document used by the 2026-10-27 readability handoff.
Each mode opens a disposable copy, draws the unfinished bowl through actual Pen clicks, and checks its short line against the neighboring arcs.
The copied fixture keeps this regression runnable when ignored demo artifacts are absent.
`guide-project.ts` targets the active project explicitly because the original workflow project remains open in another tab.
Checks include the complete stem with selected coordinates, stable repeated draft pointer updates, all four canvas corners at 50%, 100% and 200% zoom, unchanged applied geometry and zero annotation commands.
The collision oracle expands text bounds by half the actual halo stroke plus one pixel of clearance and uses a 0.25-pixel intersection tolerance.
It also checks visible anchor, center and transform-control bounds, canvas containment and the unchanged 11-pixel measurement text size.
`guide-leaders.ts` samples the actual rendered leader paths every two pixels and rejects crossings through another label and its halo.
`nested-mapping.ts` reuses that oracle after native nested rotation, zoom, scrolling, editing and cancellation.
Current screenshots and bounds belong to `artifacts/pen-guide-readability/`; historical evidence is archived there before existing runners are reused.

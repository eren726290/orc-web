# Pen integration into master

Started on 2026-10-27 at the owner's request.
Status: integrated and verified on local master; no push is included.

## Preserved checkpoints

Main checkpoint `d3e9938a7620c2333ca8583b8671b8b47bc2b888` preserves frame labels, corner-radius controls, native parent-edge Constraints and research/handoff records.
Pen checkpoint `0e168a80b8d189e2525949eb3f3e9f9d9d47eb4f` preserves the bounded Pen implementation, reproducible adapter inputs, readable labels and historical branch records.
Both descend from `53b2951229627d6be9d0b950237226de186a3d82`.
The separate `orc-web-pen` checkout remains on `pen-tool`.

## Composition and risk

Canvas retains ordinary frame labels, constraint indicators, Gap/drop/selection overlays alongside Pen input, handles and guides.
Properties retains the fixed name header, scrolling body, ordinary corner controls and active native ownership subscription alongside Pen options, artwork controls and proportional size readouts.
Canonical Pen data, solver/build inputs, source compatibility and command/history validation remain the Pen branch implementation.
Main's native Center constraints add no transform, superseding the older integration note's percentage-translation description.
Focused combined checks exercise End, Both and Center constraints without silently flattening incompatible Pen anchor edits.
No new feature, dependency, architecture or public MCP API is added by this integration.

## Verification

Current commands, logs, source identities and audit results belong under `artifacts/pen-integration-main/`.
The feature ledger is `.unlazy/pen-integration/GATES.md`.
Historical main and Pen evidence retains its original source identity and does not certify this combined checkpoint.
The prior Pen guide task's missing historical tooling summary remains explicitly unrecovered in `pen-guide-label-report.md`.

The combined source is frozen and all executable checks below passed.
No push is part of this task.

The first full Pen run exposed a fresh-checkout verification bug: the readability fixture called `mkdtemp` before creating its ignored evidence directory.
The retained failure is `artifacts/pen-integration-main/first-pass/pen-00-check-pen.log`.
The smallest correction creates that directory recursively before the temporary project; no application behavior changes.
Verification restarts on the corrected source rather than treating the interrupted main checks as product failures.

A focused current-source browser probe found a real native Center integration defect.
Changing own-Pen stroke width from 2 to 12 shifted the original path by 2.5 pixels on each axis and broke the zero-sum Center inset relationship.
The unchanged historical Pen guard checked individual transforms but could not recognize main's newer native Center projection.
The shared reboxing guard now rejects absolute Center self-alignment before anchor, stroke or scale reboxing can publish a candidate.
The existing native Center controls and saved declarations remain intact; the message directs the user to choose Left/Top explicitly.
This retains the accepted bounded placement safeguards instead of introducing a new Center-specific Pen solver or silently converting constraints.
The failing probe, source identity, screenshot and trace are retained under `artifacts/pen-integration-main/before-center-guard/`.
The combined layout suite now checks both incompatible anchor edits and stroke-width edits for End, Both and Center constraints.

## Combined verification completed, 2026-10-27

All 37 recorded top-level command invocations completed with exit code 0.
The 23 main regression commands include full sizing, intrinsic sizing, nested placement, deletion, pending history, panel behavior and bundle preservation.
The full Pen command covers eight workflow suites in development and built modes, including the combined native-constraint refusals and guide-label cases.
Numerical/data checks cover strict records, commands/history, Bun and browser WASM behavior, and binary/license provenance.

| Scope | Commands and outcome |
| --- | --- |
| Static | `bun run check:types`, `bun run lint`, `bun run check:format`, `bun run check:tooling`, `bun run check:health`, `bun run check:codebase`, `bun run build`, `bun run check:ts7`, and `git diff --check`: all exit 0. |
| Portable data and solver | `bun run check:pen-data`, `bun run check:pen-provenance`, `bun run check:pen-solver`: all exit 0. |
| Human Pen workflows | `bun run check:pen`: exit 0; editor, layout, source, transforms, lifecycle, refusals, drawing and interaction checks passed. |
| Main editor regressions | `bun run check:constraints chrome`, `bun run check:corner-radius chrome`, `bun run check:frame-labels chrome`, `bun run check:editor chrome`, `bun run check:layers chrome`, `bun run check:preview chrome`, `bun run check:boundaries chrome`, `bun run check:rendering chrome`, `bun run check:atomic chrome`, `bun run check:movement chrome`, `bun run check:clipping chrome`, `bun run check:layout chrome`, `bun run check:padding chrome`, `bun run check:gap chrome`, `bun run check:alignment chrome`, `bun run check:participation chrome`, `bun run check:sizing chrome`, `bun run check:intrinsic-sizing chrome`, `bun run check:nested-placement chrome`, `bun run check:deletion chrome`, `bun run check:history`, `bun run check:panels`, `bun run check:bundle`: all exit 0. |
| Independent timing observations | `bun run check:pen-performance`: exit 0; both fixture sizes and application modes retain timing and cancellation observations. |

The platform is Fedora 44 x64 Linux, with Bun 1.4.2 and Node 22.23.2.
Explicit executable-path runs use managed Chrome for Testing 155.0.8059.12 at `/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome`.
Some legacy checks retain their default Chromium 153.0.8010.12; the individual records identify the actual browser, and the `chrome` argument alone is not evidence of an installed stable Chrome package.
The TS7 checkpoint independently verifies actual `typescript@6.0.3` and isolated `typescript@7.0.2` package/compiler identities and passes both `tsconfig.json` and `tsconfig.server.json` with each compiler.
TS6 remains required for the ordinary checks and build.
The exact TS7 run is `artifacts/scaffold/ts7/runs/2026-10-27T11-05-20-039Z/result.json`.

The tested Git base is main checkpoint `d3e9938a7620c2333ca8583b8671b8b47bc2b888` plus the staged Pen merge and the two focused corrections described above.
`artifacts/pen-integration-main/verification-source.patch` records that pre-commit composition.
All browser and solver evidence remains bound to the same 289 source/check/configuration hashes in `source-checkpoint.json`.
The recorded source-map digest is `010927b3e46cf2960cd2d256b2e8560ec180336cfb5f52c2ef29625d01bc49ce`.
`verified-manifest.json` verifies 34 source-bound result files and the eight built files.
Each `*-commands.json` records the exact invocation, exit code, elapsed time and log location.
The resumed regression run reuses only completed passing commands whose source hashes still match; the interrupted sizing run was rerun and passed in both modes.
No application or check source changed during this final verification.
Only the completion documentation and ignored audit records were updated afterward.

The final scope audit verifies 486 checkpoint files, the untouched Pen checkout, both original package-script sets and preserved historical main evidence.
The full staged whitespace check reports whitespace in the verbatim third-party `solver/pen/RUST-LIBRARY-COPYRIGHT.html` inventory.
That inventory remains byte-identical to the Pen checkpoint for provenance; `git diff --cached --check -- . ':!solver/pen/RUST-LIBRARY-COPYRIGHT.html'` passes for the authored changes.
The normal build passes with an approximately 507.11 kB main-chunk warning, retained under the existing bundle-cost follow-up.
Fallow reports seven unused-dependency advisories and 426 static-estimated CRAP advisories, with no enforced health violations, unused source files/exports or unresolved imports.
Those estimated-coverage advisories do not measure the actual browser suites.

The bundled 683,058-byte WASM remains the existing SolidCraft build with SHA-256 `38e22d058eb04b6e57b69bee4152b474aa90053b2b7e6e9b587d7a32e96a766a`.
Its upstream pin remains `cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4`.
This integration reruns Bun/browser WASM and provenance checks; it does not claim a fresh Rust build or native Cargo-suite run.

## Remaining limits and next work

The new built 402-anchor observation measures 28.5 ms median browser preview work and 331.2 ms median solve-to-preview latency, with 365.5 ms worst observed complete latency.
The Worker keeps cancellation/input separate from the numerical solve but does not remove the large-path latency limitation.
These observations are measurements, not a universal performance guarantee.
Extremely dense guide labels can still overlap.
Native Center and other incompatible placements retain explicit Pen reboxing refusals until the user chooses compatible Left/Top placement.

The missing historical tooling summary remains unrecovered, as recorded in the guide-label report and backlog.
Windows, installed stable Chrome, complete product image/PDF exports, clipboard duplication, public Pen MCP and production React/component integration are not certified by these checks.
No new solver, renderer, dependency or saved project schema version is introduced here.
The separate Pen worktree remains available at `/home/eren/D/orc-web-pen` on its preserved checkpoint.
The next ordinary V1 task remains Fixed-axis canvas resize handles, respecting ordinary sizing ownership and Pen's proportional transform controls.
That task has not been started.

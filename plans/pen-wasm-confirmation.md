# Local pen WASM confirmation

## Outcome

The focused local rebuild and execution passed.
The pinned sketch crate built with Rust 1.95.0, and the same rebuilt WASM bytes ran in Bun and real headless Chrome for Testing.
All 18 confirmation groups passed in each runtime and each browser fixture mode.
The upstream native baseline passed 216 tests, with 3 existing ignored measurement tests.

This confirms a usable solver candidate for further integration work.
It does not implement the pen or certify the complete ORC editor workflow.
The experiment found an additional directed-tangency guard requirement and remaining continuation/performance work before production integration.

## Scope and proposed contracts

The [contract clarifications](pen-contract-clarifications.md) cover complete arcs, directed joins, source compatibility, atomic publication, precision, coordinates, and keyboard ownership.
They explicitly identify decisions that still need production adoption, including exact closing behavior, the numeric output policy, schema wording, and transformed Flex placement.
They do not change `doc_v1` or introduce new application behavior.

The user required all ORC changes to stay under temporary `plans/`.
Rust, Zig, the upstream source, the wrapper, the standalone browser fixture, and all generated evidence are outside ORC in `/tmp/orc-pen-confirmation-hlZWca/`.
The repository guard confirmed unchanged HEAD and all 355 inventoried tracked or nonignored files outside `plans/`, excluding the intentionally unread root `GATES.md`.

Isolated numerical checks were necessary because the production pen does not exist and these checks assert exact geometric relationships, rejection controls, and solver behavior.
Chrome additionally used actual HTTP-loaded WASM and native SVG APIs rather than trusting generated path strings alone.

## Reproducible identities

| Item | Actual identity |
| --- | --- |
| ORC commit | `53b2951229627d6be9d0b950237226de186a3d82` |
| ORC uncommitted state | Existing frame-label implementation, test, and documentation changes were retained unchanged; only temporary planning files were added or updated. |
| Solver source | SolidCraft `cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4`, package `solidcraft-sketch` 0.15.0 |
| Compiler | Rust `1.95.0`, commit `59807616e1fa2540724bfbac14d7976d7e4a3860`, LLVM 22.1.2 |
| WASM target | `wasm32-unknown-unknown` with the installed standard target |
| Host build support | Isolated Zig 0.15.2 C linker wrapper; no system C toolchain was installed. |
| Runtime | Bun 1.4.2, Linux x86_64 |
| Browser | Google Chrome for Testing 154.0.8037.57, headless |
| OS | Fedora Linux 44 KDE, kernel `7.2.5-200.fc44.x86_64` |
| CPU | Intel Core i5-14600K, 20 logical CPUs reported |
| Final WASM SHA-256 | `a573da6a3744e772e64180dd7f4f038c2458405bb2a699c1e5c57e097e4abe79` |
| Final WASM size | 677,586 bytes; 247,759 bytes with Bun's gzip encoder |
| WASM imports | None |

[Build verification](/tmp/orc-pen-confirmation-hlZWca/build-verification.json) compares 66 upstream sketch/geometry/workspace files with the pinned GitHub archive.
They remain unchanged.
The isolated Cargo lock differs only by the new confirmation-wrapper package entry; no upstream dependency versions changed.
The source archive SHA-256 is `9c0a5c8e070941f0efb8380163c9415193b2e6fb43d1b7aee30c6a3a8c102e7d`.
The wrapper is a successor to the proposal's throwaway wrapper, using JSON exchange, the complete pre-move reference, complete rollback, and geometry guards.
It is not a production parser or public API.
Its binary size and timings are not directly comparable to Claude's different wrapper and sandbox build.

## Commands and exit codes

All commands below run from `/tmp/orc-pen-confirmation-hlZWca/` unless stated otherwise.
The [build script](/tmp/orc-pen-confirmation-hlZWca/build.sh) and [final rebuild script](/tmp/orc-pen-confirmation-hlZWca/rebuild.sh) contain the complete environment and commands.

| Command or stage | Exit | Recorded result |
| --- | --- | --- |
| `RUSTUP_HOME=... CARGO_HOME=... ./rustup-init -y --no-modify-path --profile minimal --default-toolchain 1.95.0 --target wasm32-unknown-unknown` | 0 | Rust and the WASM standard target installed under the temporary directory. |
| `cargo test -p solidcraft-sketch` in the pinned isolated workspace | 0 | 216 passed, 0 failed, 3 ignored; 0 doc tests. |
| `cargo build --locked -p pen-confirmation --release --target wasm32-unknown-unknown` | 0 | Final guarded WASM rebuilt using the recorded release flags. |
| `python3 verify-build.py` | 0 | Source identity, unchanged dependency pins, native result, and final binary checked. |
| `bun check.mjs bun` | 0 | 18 groups passed, 0 failed; small-path timing criterion passed. |
| `bun check.mjs chrome` | 0 | 18 groups passed in each of the direct-module and bundled fixtures; native SVG checks passed. |
| `python3 repo-guard.py check` | 0 | ORC files outside the permitted temporary planning area remained unchanged. |

Release build flags were `CARGO_PROFILE_RELEASE_DEBUG=false`, `CARGO_PROFILE_RELEASE_LTO=true`, `CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1`, and `CARGO_PROFILE_RELEASE_OPT_LEVEL=3`.
This used the normal Rust target rather than `RUSTC_BOOTSTRAP`, `-Z build-std`, or `--ignore-rust-version`.
No `wasm-opt` step was needed for this confirmation.

The 3 ignored upstream tests are measurement experiments: `rounds_and_tangents_without_the_seed`, `linkage_family_counter`, and `gap_counter`.
They were left ignored in that initial confirmation, not reported as passing.
All three were subsequently run and reviewed in the [native diagnostic follow-up](pen-diagnostic-results.md).

## What the checks established

- Horizontal, vertical, and perpendicular rules survive the tested anchor drags.
- Both directions of tangent arcs serialize with the appropriate SVG sweep flag and retain their geometry through record serialization and reconstruction.
- Consecutive opposite-turn arcs and a closed semicircle path retain the tested relationships.
- Removing a tangent rule and removing an incoming line do not erase an independently represented arc center.
- Known conflicting fixed geometry is rejected without changing the prior shape.
- A collapsed-line solve can report success when guards are bypassed; the guarded path rejects it and restores the entire shape.
- Major arcs, unknown points, and out-of-range coordinates are refused without replacing the previous valid state.
- Round-trip numeric output preserves the tested 0.0004-unit line, while the three-decimal control collapses it.
- Deliberately corrupted geometry is detected by the independent JavaScript oracle.
- Full analysis reports real remaining freedom, while `StatusOnly` returns its documented placeholder zero and empty determined arrays.
- A reversed tangent continuation is reproduced with guards bypassed, detected independently, refused by the guarded adapter, and rolled back completely.

Chrome loaded the identical binary with `application/wasm` through `WebAssembly.instantiateStreaming`.
It checked five generated SVG examples with `getTotalLength` and analytic length expectations, and checked arc midpoints with `getPointAtLength` to catch the wrong circle side or direction.
The two modes were a standalone unbundled module fixture and a Bun-bundled fixture, not ORC's Vite development and application production builds.
The [HTTP record](/tmp/orc-pen-confirmation-hlZWca/browser-http-requests.json) includes both WASM loads.

## Additional finding: directed tangency

The first independent checks tested geometric tangency without requiring the logical traversal directions to agree.
Visual inspection exposed a reversed continuation at the outgoing line.
The stricter assertion failed in both mirrored line/arc/line cases.

The upstream [shared-point tangency residual](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/solver.rs#L654) enforces perpendicularity to a circle radius, which allows either line direction.
That is insufficient to preserve a smooth directed path on its own.
The confirmation's guard now checks the logical tangent directions at connected joins and restores the complete prior state after a reversal.
The final negative-control case reproduces this on coarse step 3: the unguarded solver says `solved`, while the guarded call refuses and leaves the prior shape unchanged.

A 320-step continuation completed the tested move while retaining direction in both mirrored fixtures.
Its measured total time is in each case's `dragElapsedMs` and is not a production step-size recommendation.
Coarser continuation can still encounter a refusal even where a finer route succeeds.
Production integration needs an adaptive continuation and frame-work policy, including how remaining motion is carried forward.
Do not remove the guard to get apparent pointer responsiveness.

The D-shape example also confirms the earlier review warning.
With only the dragged anchor held, its measured final radius was about 123.111, rather than the proposal's assumed 120.
The other anchors are free to move, so the stated rules do not determine that exact radius.

## Timing results

Values below are median / p95 milliseconds from the final gate run.
Each timed call includes JSON transfer, the synchronous WASM solve, and the adapter guards.
Independent JavaScript geometry validation is outside that timed interval.
There are 30 measured samples after 5 warm-ups, except 602 points with 15 measured samples after 5 warm-ups.
Arc centers and the fixed origin count as solver points, so 29 points represent 20 path anchors.

| Solver points | Bun | Chrome direct modules | Chrome bundled |
| --- | --- | --- | --- |
| 29 | 0.146 / 0.152 | 0.1 / 0.2 | 0.1 / 0.2 |
| 92 | 0.552 / 0.574 | 0.5 / 0.6 | 0.5 / 0.6 |
| 182 | 1.559 / 1.807 | 1.6 / 1.6 | 1.6 / 1.7 |
| 302 | 3.701 / 3.831 | 3.8 / 3.9 | 3.7 / 3.9 |
| 602 | 17.365 / 18.463 | 17.5 / 22.0 | 17.3 / 18.3 |

The proposed 29-point criterion of median at most 8 ms and p95 at most 12 ms passed in all three runs.
The 602-point fixture exceeds a 16.7 ms frame budget before adding ORC's own work.
This is a measured performance limitation, not an imposed product path limit.
Step-count caps do not interrupt one slow synchronous solve.

The browser also measured 30 minimal SVG update frames with tiny incremental anchor motion.
Median work was about 0.5 ms and p95 about 0.6 ms in each fixture mode.
That included the request, independent validation, setting SVG path data, and `getBBox`.
It excluded ORC Properties, source reconciliation, Fill dependency checks, and compositor paint.
Those measurements do not certify full editor animation performance or the cost of hundreds of continuation steps.

## Evidence and rerunning

- [Bun results](/tmp/orc-pen-confirmation-hlZWca/bun-result.json)
- [Chrome direct-module results](/tmp/orc-pen-confirmation-hlZWca/chrome-dev-result.json)
- [Chrome bundled results](/tmp/orc-pen-confirmation-hlZWca/chrome-built-result.json)
- [Chrome direct-module screenshot](/tmp/orc-pen-confirmation-hlZWca/chrome-dev.png)
- [Chrome bundled screenshot](/tmp/orc-pen-confirmation-hlZWca/chrome-built.png)
- [Native baseline log](/tmp/orc-pen-confirmation-hlZWca/native-tests.log)
- [Final WASM build log](/tmp/orc-pen-confirmation-hlZWca/wasm-build.log)
- [Source, fixture, binary, and result hashes](/tmp/orc-pen-confirmation-hlZWca/evidence-manifest.json)
- [Confirmation gate ledger](pen-confirmation-GATES.md)

To rerun while the temporary workspace exists:

```sh
cd /tmp/orc-pen-confirmation-hlZWca
sh rebuild.sh
python3 verify-build.py
bun check.mjs bun
bun check.mjs chrome
python3 repo-guard.py check
```

A rerun changes timing files and result hashes, so refresh the evidence manifest and report before relying on new numbers.
The browser script starts and closes its own named agent-browser session and stops its own HTTP server.
Temporary files can be removed by system cleanup; retain the needed experiment outside ORC before a later builder handoff.

## Remaining integration work

The production pen, strict own-record parser, source reconciliation, atomic commands, complete history/save workflows, and native layout dependency checks are not implemented by this confirmation.
Transformed reboxing and Flex placement still need an application-specific proof.
Adaptive dragging and large-path scheduling remain engineering work; the main-thread approach is suitable for further bounded testing, not a universal frame-rate guarantee.
Actual ORC development/built asset loading and full workflow regressions must run when integration exists.
Windows, Firefox, Safari, mobile devices, and installed stable Chrome were not checked.
The complete dependency-license graph was not audited.
The 3 upstream measurements were not audited during this initial confirmation; their subsequent results are in the [native diagnostic follow-up](pen-diagnostic-results.md).

Figcraft was also reviewed as a [bounded source reference](figcraft-reference.md).
It supplies useful coordinate and gesture patterns but does not replace the browser-native ORC renderer or confirm the required CAD rule solver.

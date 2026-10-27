# SolidCraft ignored diagnostic results

## Outcome

All three requested ignored diagnostics were explicitly run on 2026-10-25 and exited zero.
Each execution ran one named test, with one passed, zero failed, and zero ignored.
Their measurement counters contain failures in deliberately weakened solver modes and a remaining limitation in the direct full solver.
A successful Rust test summary does not mean that every measured geometry solved.

The enabled arc-helper control also passed all 6,600 measured edits with zero failed solves and zero lost-side checks.
No ORC application code, accepted documentation, upstream source, or dependency versions changed.
Only temporary records under `plans/` were changed inside ORC.

## Reproducible identities

| Item | Actual identity |
| --- | --- |
| ORC main HEAD | `53b2951229627d6be9d0b950237226de186a3d82` |
| Pen worktree HEAD | `53b2951229627d6be9d0b950237226de186a3d82`, branch `pen-tool` |
| Upstream | SolidCraft `cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4`, `solidcraft-sketch` 0.15.0 |
| Archive SHA-256 | `9c0a5c8e070941f0efb8380163c9415193b2e6fb43d1b7aee30c6a3a8c102e7d` |
| Source verification | All 1,913 archive files match the extracted source, including the original Cargo lockfile. |
| Dependencies | All 14 downloaded registry archives match their original lockfile checksums. |
| Rust compiler | `rustc 1.95.0 (59807616e 2026-04-14)`, full commit `59807616e1fa2540724bfbac14d7976d7e4a3860`, LLVM 22.1.2 |
| Cargo | `cargo 1.95.0 (f2d3ce0bd 2026-03-21)` |
| Native linker | Isolated Zig 0.15.2 C linker wrapper |
| OS | Fedora Linux 44 KDE, x86_64, kernel `7.2.5-200.fc44.x86_64` |
| Hardware | Intel Core i5-14600K, 20 logical CPUs |
| Test profile | Upstream default test profile, optimized with debug information, two build jobs |

Both ORC worktrees retained their original existing files and HEAD.
The main worktree already contained frame-label implementation and documentation changes before this task.
The before-state inventory and uncommitted status are retained in [scope-before.json](/home/eren/.cache/orc-pen-diagnostics/20261025/scope-before.json) and [environment.json](/home/eren/.cache/orc-pen-diagnostics/20261025/environment.json).
The final guard compares 355 main-worktree files and 351 pen-worktree files outside temporary `plans/`, excluding the intentionally unread root `GATES.md`.

## Commands and exit codes

The isolated workspace is `/home/eren/.cache/orc-pen-diagnostics/20261025/solidcraft`.
The private toolchains and complete environment are in [env.sh](/home/eren/.cache/orc-pen-diagnostics/20261025/env.sh).
All diagnostic and control executions set `CARGO_NET_OFFLINE=true`.
Every command retains the original Cargo lockfile through `--locked`.

```sh
cd /home/eren/.cache/orc-pen-diagnostics/20261025
source ./env.sh
export CARGO_NET_OFFLINE=true
cd solidcraft
cargo test --locked -p solidcraft-sketch construct_rounds_tests::rounds_and_tangents_without_the_seed -- --ignored --exact --nocapture
cargo test --locked -p solidcraft-sketch continuation_tests::linkage_family_counter -- --ignored --exact --nocapture
cargo test --locked -p solidcraft-sketch decompose::tests::gap_counter -- --ignored --exact --nocapture
cargo test --locked -p solidcraft-sketch construct_rounds_tests::rounds_and_tangents_keep_their_sides_on_dimension_edits -- --exact --nocapture
```

| Execution | Started UTC | Exit | Elapsed seconds |
| --- | --- | --- | --- |
| `construct_rounds_tests::rounds_and_tangents_without_the_seed` | 2026-10-25T04:24:55.479788+00:00 | 0 | 0.368 |
| `continuation_tests::linkage_family_counter` | 2026-10-25T04:24:55.848485+00:00 | 0 | 11.458 |
| `decompose::tests::gap_counter` | 2026-10-25T04:25:07.306582+00:00 | 0 | 20.282 |
| Enabled arc-helper control | After the three diagnostics | 0 | 0.237 |

Elapsed values include Cargo startup, rather than measuring solver performance in isolation.
The initial online listing and compile command was `cargo test --locked -p solidcraft-sketch -- --list --ignored`, which exited zero and listed exactly the three requested names.
Its [listing and build log](/home/eren/.cache/orc-pen-diagnostics/20261025/listing.log) reports the original test profile and complete build output.

## 1. Arc and tangency comparison

With the constructive helper deliberately disabled, 6,600 edits produced 30 failed solves and 183 lost-side or direction checks.
The same generated families with the helper enabled produced zero failures and zero lost-side checks.
These deliberately disabled-helper failures establish why the helper is needed.
They are not failures of the enabled control.

The [upstream comparison and control](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/construct_rounds_tests.rs#L455) define 11 families, three scaling ranges, and 200 edits per row.
The comparison records counts without asserting that its disabled mode solves every case.

| Family | Edit scale | Cases | Failed with helper off | Lost a side with helper off |
| --- | --- | --- | --- | --- |
| filleted rectangle | 0.8–1.25× | 200 | 0 | 0 |
| filleted rectangle | 0.5–2× | 200 | 0 | 0 |
| filleted rectangle | 0.3–3× | 200 | 1 | 2 |
| slot (centre distance) | 0.8–1.25× | 200 | 0 | 0 |
| slot (centre distance) | 0.5–2× | 200 | 0 | 0 |
| slot (centre distance) | 0.3–3× | 200 | 5 | 0 |
| slot (overall length) | 0.8–1.25× | 200 | 3 | 0 |
| slot (overall length) | 0.5–2× | 200 | 7 | 0 |
| slot (overall length) | 0.3–3× | 200 | 14 | 0 |
| tangent chain | 0.8–1.25× | 200 | 0 | 0 |
| tangent chain | 0.5–2× | 200 | 0 | 2 |
| tangent chain | 0.3–3× | 200 | 0 | 10 |
| axis-aligned chain | 0.8–1.25× | 200 | 0 | 36 |
| axis-aligned chain | 0.5–2× | 200 | 0 | 35 |
| axis-aligned chain | 0.3–3× | 200 | 0 | 42 |
| bolt circle | 0.8–1.25× | 200 | 0 | 0 |
| bolt circle | 0.5–2× | 200 | 0 | 0 |
| bolt circle | 0.3–3× | 200 | 0 | 0 |
| mirrored point | 0.8–1.25× | 200 | 0 | 0 |
| mirrored point | 0.5–2× | 200 | 0 | 0 |
| mirrored point | 0.3–3× | 200 | 0 | 0 |
| collinear lines | 0.8–1.25× | 200 | 0 | 0 |
| collinear lines | 0.5–2× | 200 | 0 | 0 |
| collinear lines | 0.3–3× | 200 | 0 | 0 |
| distance from a line | 0.8–1.25× | 200 | 0 | 0 |
| distance from a line | 0.5–2× | 200 | 0 | 15 |
| distance from a line | 0.3–3× | 200 | 0 | 41 |
| equal lines | 0.8–1.25× | 200 | 0 | 0 |
| equal lines | 0.5–2× | 200 | 0 | 0 |
| equal lines | 0.3–3× | 200 | 0 | 0 |
| points on an arc | 0.8–1.25× | 200 | 0 | 0 |
| points on an arc | 0.5–2× | 200 | 0 | 0 |
| points on an arc | 0.3–3× | 200 | 0 | 0 |

Every corresponding helper-enabled row had zero in both outcome columns.

## 2. Expanded linkage continuation counter

The two families contain 1,000 edits in total.
Continuation accepted 638 edits while keeping the checked triangle orientations.
The other 362 outcomes were classified by the upstream harness, with zero unexplained cases.
The categories are 218 infeasible target dimensions, 43 targets allowing only a mirrored solution, and 101 cases where the followed solution branch ends along the straight dimension path.
These categories are the upstream harness classifications, rather than a guarantee about every possible nonlinear path.

| Family | One-jump failed | One-jump folded | Continuation refused | Continuation failed | Accepted | Infeasible | Only mirrored | Branch ends | Unexplained |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0.8–1.25× lines false | 87 | 0 | 0 | 63 | 437 | 0 | 4 | 59 | 0 |
| 0.5–2.5× lines true | 295 | 29 | 21 | 278 | 201 | 218 | 39 | 42 | 0 |

The [upstream counter](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/continuation_tests.rs#L196) asserts orientation preservation for accepted edits and requires the unexplained list to remain empty.
A reported folded result still needs a caller to refuse publication.
A failed solve preserves the prior point layout in the tested path.
Production integration must retain its own acceptance checks and atomic rollback.

## 3. Decomposition gap counter

The counter measured 5,500 cases across 11 families and compared three solver modes, for 16,500 direct solver calls.
The full helper configuration solved all 5,000 bracket and fan cases with zero recorded mirroring.
In the 500 triconnected linkage cases it recorded 73 failed direct solves, zero recorded mirroring, and numerical iterations in all 500 cases.
The numerical-only comparison failed 78 of those same 500 cases, so the full helper improved five outcomes and introduced zero additional solve-status failures.

The 73 direct-solve failures remain a real measured limitation of this solver entry point.
This counter does not classify their feasibility or retry them with dimension continuation.
They cannot be equated with the independently generated failures classified by the previous diagnostic.
Do not call every one of these cases impossible or claim that continuation resolved these exact 73 cases.

| Family | Cases | Not propagatable | Numerical only failed / mirrored | Propagation failed / mirrored / gap | Full failed / mirrored / gap / iterations | Full status worse / better |
| --- | --- | --- | --- | --- | --- | --- |
| bracket Fixed | 500 | 500 | 5 / 86 | 5 / 86 / 86 | 0 / 0 / 0 / 0 | 0 / 5 |
| bracket Horizontal | 500 | 500 | 3 / 106 | 3 / 102 / 102 | 0 / 0 / 0 / 0 | 0 / 3 |
| bracket Offsets | 500 | 500 | 2 / 90 | 2 / 89 / 89 | 0 / 0 / 0 / 0 | 0 / 2 |
| bracket Hinge | 500 | 500 | 0 / 147 | 0 / 147 / 147 | 0 / 0 / 0 / 0 | 0 / 0 |
| fan 6-gon 0.5–2.5× | 500 | 0 | 0 / 21 | 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 |
| floating fan 6-gon 0.5–2.5× | 500 | 500 | 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 |
| fan 8-gon 0.5–2.5× | 500 | 0 | 0 / 142 | 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 |
| floating fan 8-gon 0.5–2.5× | 500 | 500 | 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 |
| fan 12-gon 0.5–2.5× | 500 | 0 | 0 / 410 | 0 / 0 / 0 | 0 / 0 / 0 / 0 | 0 / 0 |
| floating fan 12-gon 0.5–2.5× | 500 | 500 | 0 / 60 | 0 / 60 / 60 | 0 / 0 / 0 / 0 | 0 / 0 |
| triconnected linkage 0.8–1.25× | 500 | 500 | 78 / 0 | 73 / 0 / 0 | 73 / 0 / 0 / 500 | 0 / 5 |

Here `gap` means mirrored cases that point-by-point propagation could not place.
It does not refer to spacing between pen anchors or to ORC layout Gap controls.
The [upstream implementation](https://github.com/tangency-labs/solidcraft/blob/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4/crates/sketch/src/decompose_tests.rs#L1004) prints these counters without requiring every solve to succeed.
Its worse/better columns compare solve success only, rather than comparing every orientation check.

## Environment setup and retained evidence

The old `/tmp/orc-pen-confirmation-hlZWca/` workspace no longer exists.
This run rebuilt the private native environment outside both ORC worktrees.
Initial registry fetch attempts stalled or timed out before tests ran.
The large `web-sys` metadata entry delayed completion of the first workspace-resolution batch.
A temporary localhost registry relay fetched the same official index and crate bytes using curl, and the missing metadata was fetched in bounded ranges.
The successful build used the original dependency versions and checksum verification.
The relay was stopped after the offline diagnostic and control runs.
The [relay configuration and implementation](/home/eren/.cache/orc-pen-diagnostics/20261025/relay.py) and initial setup logs remain in the isolated directory for inspection.
This transport workaround is not installed in either ORC worktree.

| Evidence | SHA-256 |
| --- | --- |
| [rounds_and_tangents_without_the_seed.log](/home/eren/.cache/orc-pen-diagnostics/20261025/rounds_and_tangents_without_the_seed.log) | `b915b54d7c7e4221eb892bb74138caf30f7105860e5e6536fc4e7f0e91f92aeb` |
| [linkage_family_counter.log](/home/eren/.cache/orc-pen-diagnostics/20261025/linkage_family_counter.log) | `03161f863a192dd5adb09aa5b502ffba1c1f01c52c5845b9dd71ab8b41c8f5ba` |
| [gap_counter.log](/home/eren/.cache/orc-pen-diagnostics/20261025/gap_counter.log) | `caaf2453c06498dbcb39d7cf8c8bbb431881704fd386f60a1dbbd374c79d2fc2` |
| [Enabled arc control](/home/eren/.cache/orc-pen-diagnostics/20261025/rounds-seed-on-control.log) | `9ca955fbfc7bd9346794899a8faf6c30c45e3108a9d3dfdd1f5afefd3546ae68` |

The [results manifest](/home/eren/.cache/orc-pen-diagnostics/20261025/results.json) records exact test names, commands, start times, runtimes, exit codes, and log hashes.
The [parsed measurements](/home/eren/.cache/orc-pen-diagnostics/20261025/analysis.json) contain every printed row and computed totals.
The [identity verification](/home/eren/.cache/orc-pen-diagnostics/20261025/identity-verification.log) checks the original source and dependency archives.
The [diagnostic ledger](pen-diagnostics-GATES.md) records completion checks.

To rerun using the retained local toolchains, source, and caches, use `python3 /home/eren/.cache/orc-pen-diagnostics/20261025/run.py`.
That runner invokes only the three requested ignored diagnostics and runs them offline.
Rerun the separate enabled-control command above if a new comparison with that control is needed.
New runs replace result logs and timings, so refresh their hashes and this report before relying on new evidence.

## Remaining limits

No upstream defect was patched by this task.
The direct solver is not universally successful on complex linked geometry, as the 73 failed solves demonstrate.
Keep the previously identified directed-join guards, safe refusal, complete rollback, and continuation policy when evaluating production adoption.
The exact causes and feasibility of those 73 direct-solve failures require a separate focused investigation if relevant to the intended pen topology.
The full normal 216-test baseline was not rerun here.
Its earlier passing result remains historical, while the enabled arc control and three ignored diagnostics are fresh results.
WASM, Bun, Chrome, complete ORC pen workflows, other operating systems, and the complete dependency-license graph were not checked in this follow-up.

The final diagnostic ledger has 4 met gates, 0 unmet, and 0 abandoned.
Three gates verify recorded artifacts and file identity automatically, and one records the manual source and measurement review.

# Selection continuity findings

## Current status

Baseline Chrome verification is complete.
The continuity addition passes all fourteen workflows in installed Google Chrome, exit 0.
The unchanged mapping proof passes all thirty checks, exit 0, including twenty-two browser checks and eight AST boundary controls.
Earlier Chrome and GitHub setup failures were resolved after Codex restarted with host access.
Their diagnostics remain preserved separately from the successful final output.
[PR 3](https://github.com/eren726290/orc-web/pull/3) is open against `master`.

The work depends on unmerged PR 2 commit `2663a28aff8325e67e15a399ca321a365e1d9e18`.
The new branch is `codex/selection-continuity`, targeting the existing default branch `master`.
PR 1 and PR 2 were not edited, merged, or closed.
The baseline was committed separately as `5ab9c14` before the proposed correction.
Use `git diff 2663a28aff8325e67e15a399ca321a365e1d9e18..codex/selection-continuity` to see only PR 3 work.
A PR against master will also display inherited PR 2 changes until that dependency merges.

## Baseline reproduction

The baseline reused PR 2's exact resolver, instrumentation, fixtures, renderer, and dependencies.
Only a new test was added to hold one actual Chrome click token across commands.
The test never reacquires the heading or replaces that stored token.
It runs each workflow in a fresh context, so each independently tested workflow gets exactly one initial click.

1. Click the ordinary literal heading once and retain its generated token.
2. Edit its text using the existing `resolve` and `edit` functions, compile, and render the candidate.
3. Resolve text and typography with the original token in the new analysis.
4. The owner is now unsupported because the old element identity is absent.

The equivalent instance-text workflow loses its usage identity after the title prop changes.
The style-only workflow loses its element identity after the class string changes.
The baseline reports six failures across both source variations and exits 1.
Both local collection workflows pass text edit → record reorder → another edit with the original token and original record key.
There was no reproduced silent edit of a different element.
The resolver refused stale mappings safely.

The baseline's before/after screenshots were inspected.
The edited text appears only in the intended heading, siblings remain unchanged, and the seedling emoji renders correctly.
The failure concerns subsequent source ownership resolution, not an ORC visual selection outline or Properties panel.

## Cause and bounded correction

`resolver.ts` hashes the complete semantic JSX subtree, which includes editable text, classes, and usage prop values.
Those identities change when their owning syntax changes.
`proof.ts` in PR 2 normally clicks again after those edits and stores a replacement token.
It has no persistent selection transport, and its history has no Redo operation.
This is missing workflow functionality in an architecture experiment, not evidence of a bug in an implemented ORC editor.

The existing identity function, `edit`, `resolve`, instrumentation, fixtures, and renderer remain behaviorally unchanged.
The new `editRetainingSelection` function keeps references to the selected host and component usage nodes during its own supported value-edit command.
After mutation, it prints/parses those exact nodes through the existing parser and recomputes their existing identities.
It does not match display text, infer an array position, or search for a similar replacement node.
The session keeps one logical handle while the command layer updates its internal generated token.
The test never replaces that handle or supplies a replacement selection after the initial click.
The candidate must have exactly one rendered node with that generated node/usage/record tuple before selection remains active.
Uncertain tuples clear selection explicitly.

The session adds source/selection snapshots to Undo and implements Redo by restoring those snapshots through the same candidate renderer.
Deletion clears selection, Undo restores the prior element and prior selection, and Redo clears it again.
A new edit clears the Redo stack.
These are the experiment's chosen behaviors, verified in Chrome for both source variations.
Arbitrary direct source edits get no command-owned lineage and keep only a still-unambiguous token.

## Outcomes

| Category | Measured result |
| --- | --- |
| Passed with existing implementation | Two Chrome collection workflows retain the correct record key through editing and reorder |
| Reproduced failure, corrected and verified | Six baseline workflows lose raw-token resolution after literal, instance-prop, or class changes; command-owned transport retains the intended instance in the final Chrome runs |
| Supplementary AST verification | Six successive-edit scenarios each apply text, size, and weight edits; two true structural-collision checks reject uncertainty; eight inherited boundary controls pass |
| Missing functionality added | Persistent logical handle, command-owned token transport, selection snapshots, Redo, deletion/ambiguity invalidation, selection restoration on Undo |
| Still unsupported or unresolved | Persistent identity through arbitrary semantic source rewrites or identical replacements with different author intent; unsupported React syntax remains refused |

The AST checks exit 0 and are explicitly not browser evidence.
The final Chrome suite passes fourteen workflows across the two fixtures, including all required cases and an additional command-created usage collision.
It compares source-owner values with the selected rendered text/classes, expected computed font size/weight, saved source, selection, and history.
Undo and Redo are exercised after every supported command in the literal, reused-instance, and collection workflows.
All selection acquisition is confined to a single initial browser lookup/click per workflow.
Later checks inspect only the retained engine-owned metadata and complete heading snapshots.

| Final workflow | Basic | Renamed/restructured variation | Verified behavior |
| --- | --- | --- | --- |
| Literal heading | PASS | PASS | One click; text, size, weight; intended source owner; unrelated headings unchanged |
| Reused component | PASS | PASS | Instance-only text then shared size/weight; same instance remains selected; unrelated components unchanged |
| Keyed collection | PASS | PASS | Edit, reverse array, edit again; same string/numeric key; other record unchanged |
| Delete | PASS | PASS | Selection clears; further edit refused; Undo restores element and selection; Redo clears again |
| Ambiguous source replacement | PASS | PASS | Duplicate structural identity invalidates explicitly; Undo restores the prior mapping |
| Command-created ambiguity | PASS | PASS | Editing two usages into identical structure clears selection; Undo restores the particular usage |
| Rejected candidates | PASS | PASS | Malformed TSX and runtime crash preserve source, rendering, saved state, history, revision, and selection; next edit still works |

The literal, instance, and collection workflows Undo and Redo every operation and compare exact sources, selection, rendered values, and persisted state.
The deletion and ambiguous-replacement workflows also verify that a new edit after Undo clears Redo.
All fourteen final after screenshots were visually inspected, alongside the four baseline literal/instance screenshots.
Fonts show the expected size and weight, and the seedling emoji and literal special characters render correctly.
Collection screenshots show the reordered record with its second edit and the unchanged other record.
Deletion and ambiguity screenshots show the final restored state; intermediate invalidations are recorded in the operation evidence.

The first extra collision-control attempt failed because the two props used different syntax representations.
The control now uses expression-wrapped literal props on both usages to create actually identical structural identities.
The refusal assertion is unchanged, and the original diagnostic is preserved in `evidence/development-failure`.

## Environment and commands

| Requirement | Actual baseline and final environment |
| --- | --- |
| OS/session | Fedora 44 KDE Wayland, Linux x64 |
| Chrome channel | Installed Google Chrome stable 154.0.8037.57 |
| Bun / Node / npm | 1.4.2 / 22.23.2 / 10.9.8 |
| Babel parser / Recast / ast-types | 7.29.9 / 0.24.0 / 0.16.3 |
| React / React DOM | 19.3.0 / 19.3.0 |
| Tailwind / Playwright | 4.3.3 / 1.63.0 |

No dependency was added or upgraded; the inherited npm lockfile is unchanged.
Initial baseline installation used `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund` and installed 16 packages.
After permissions changed, the working copy moved to `/tmp/orc-web-pr3-selection` and reused the same Fedora installation through a local untracked dependency link.
It did not copy mobile dependencies or browser libraries.
The browser launch is always `channel: "chrome"`; there is no Chromium fallback.

Run these commands from `experiments/automatic-source-mapping`:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund
bun continuity/baseline.ts
bun continuity/logic-check.ts
bun continuity/proof.ts
bun run proof
```

The baseline is expected to fail its continuity assertions against the unchanged raw-token API.
The final Chrome suite and existing mapping suite both pass after restoring host browser access.
The successful run directories are `runs/continuity-final-2026-09-29T21-59-45-435Z` and `runs/2026-09-29T21-59-57-895Z`.
Their selected evidence is committed under `evidence/fedora-chrome` and `evidence/mapping-regression`; generated bundles and installed dependencies are excluded.
Oxlint, Oxfmt, and whitespace checks passed for the source.
Exact recorded commands and exit codes are in [commands.sh](evidence/commands.sh).

## Evidence and remaining limits

- [Baseline report](evidence/baseline/report.json), [selection/source-owner records](evidence/baseline/records.json), [complete failure output](evidence/baseline/console.log), and [candidate diagnostics](evidence/baseline/browser-diagnostics.json).
- [Literal before](evidence/baseline/basic-literal/before.png) and [after](evidence/baseline/basic-literal/after-first-edit.png).
- [Instance before](evidence/baseline/basic-instance/before.png) and [after](evidence/baseline/basic-instance/after-first-edit.png).
- [AST results and before/after ownership records](evidence/logic/report.json), [output](evidence/logic/console.log), and [exit code](evidence/logic/exit-code.txt).
- [Final Fedora Chrome report](evidence/fedora-chrome/report.json), [complete operation/source-owner records](evidence/fedora-chrome/records.json), [browser diagnostics](evidence/fedora-chrome/browser-diagnostics.json), [console](evidence/fedora-chrome/console.log), and [exit 0](evidence/fedora-chrome/exit-code.txt).
- [Final literal screenshot](evidence/fedora-chrome/basic-literal/after.png), [instance screenshot](evidence/fedora-chrome/basic-instance/after.png), and [keyed collection screenshot](evidence/fedora-chrome/basic-collection/after.png).
- [Variation literal screenshot](evidence/fedora-chrome/variation-literal/after.png), [instance screenshot](evidence/fedora-chrome/variation-instance/after.png), and [keyed collection screenshot](evidence/fedora-chrome/variation-collection/after.png).
- Each final workflow directory also contains its before/after screenshots, final uninstrumented sources, and saved state.
- [Existing mapping regression report](evidence/mapping-regression/report.json), [owner records](evidence/mapping-regression/owners.json), [browser diagnostics](evidence/mapping-regression/browser-diagnostics.json), [console](evidence/mapping-regression/console.log), and [exit 0](evidence/mapping-regression/exit-code.txt).
- Historical [Chrome setup failure](evidence/final-setup-failure/setup-failure.json), [complete output](evidence/final-setup-failure/console.log), and [exit 1](evidence/final-setup-failure/exit-code.txt).
- Historical [mapping regression launch failure](evidence/final-setup-failure/mapping-console.log) and [exit 1](evidence/final-setup-failure/mapping-exit-code.txt).
- Historical [branch publication failure](evidence/final-setup-failure/publish.log) and [exit 128](evidence/final-setup-failure/publish-exit-code.txt).

The historical post-correction attempts exited 1 before assertions because Chrome reported `setsockopt: Operation not permitted` and terminated with SIGTRAP.
The initial publication attempt exited 128 because GitHub DNS was unavailable in that session.
These were setup failures, resolved after the restart; no source change was needed for the successful retry.
The six original raw-token failures were experiment workflow failures caused by missing transport, corrected and verified in the bounded command path.
The first collision-control failure was a proof setup error, corrected by constructing actually identical syntax while retaining the refusal assertion.
No dependency compatibility failure was observed.

Persistent identity across arbitrary semantic source rewrites, identical semantic replacement with changed author intent, arbitrary React syntax, Base UI imports, independent component copying, and the complete editor remain outside this task.
No claim is made about an ORC Properties panel, Windows, or arbitrary React compatibility.
Supported syntax remains the [PR 2 bounded subset](../README.md); this addition carries selection only through supported value edits, keyed reorder, and explicit history snapshots.
The inherited regression verifies save/reopen mappings, but this task does not establish durable selection recovery across process restarts.
The evidence supports continuing this bounded approach for ordinary command-owned edits.
It does not justify a general identity redesign or establish continuity through arbitrary external source replacements.

# PR 5 integrated verification

## Result

The combined Fedora Google Chrome environment passes the original 12 assertions, 30 mapping checks, 14 continuity workflows, and 9 real Base UI/shadcn workflows.
The four additional bounded integration workflows pass after the corrections described below.
No previous assertion was removed or weakened.
The real Tailwind positioning, normal interaction, visible-text comparison, and prior mapping/continuity regressions remain green.
This is architecture-experiment evidence, not ORC-web application implementation or Windows certification.

The focused PR 5 follow-up resolves the full TypeScript declaration check and adds selection for two separate JSX usages that are identical from the beginning.
Full TS 7 checking now passes with dependency declaration checking enabled.
A committed declaration-only patch repairs the published Tailwind Node package without changing package versions or runtime code.
The new Chrome workflow and affected regressions pass.
[Focused follow-up](#focused-follow-up-full-types-and-initially-identical-usages) separates these results from the original PR 5 evidence below.

## Starting point and integration

GitHub's verified default branch is `master`.
The fresh checkout starts at `8b2158b3c84ad5fec59aa0e39ce5c8e3cda76cf1`.
The PR 5 branch is `codex/integrated-proof-pr5`, created from the fresh checkout's original branch.
[ancestry.json](ancestry.json) records the exact heads:

| PR | Inspected head |
| --- | --- |
| PR 1 | `35f53965d746c7e1f6bcccf455505af95931df66` |
| PR 2 | `2663a28aff8325e67e15a399ca321a365e1d9e18` |
| PR 3 | `c230345902e8b33d4d772916ce010a72fe8704d6` |
| PR 4 | `c1e0d54d215c75bf226e30510deab03b2dbb5521` |

PR 4 already contains PRs 3 and 2, confirmed by Git ancestry checks.
PR 4 was merged locally once; PR 1 was merged separately.
The only PR 1 conflicts were its root manifest, Bun lockfile, and ignore file, reconciled to the combined installation.
These local integration commits do not merge or alter any GitHub PR.
PR 5 includes the earlier unmerged changes in its diff against master.
Product specifications and MCP were not modified.

## Original proof provenance

PR 1's executable proof lived outside Git.
The preserved `original-pasted` and `chrome-working` directories existed on this PC and supplied the actual files.
They were copied without `node_modules`, caches, browser binaries, or generated bundles into [original-source-proof](../original-source-proof/README.md).
Its provenance record contains original paths and SHA-256 hashes.
The fixture is byte-identical to the supplied original.
The executable runner differs from the preserved mobile runner only by its Chrome-channel launch adjustment.
Its twelve assertions are unchanged.
Historical mobile and Fedora evidence remain separate from new PR 5 evidence.
The inherited console/report wording still mentions Chromium/Debian in some assertion names and limitations; new runs use the Chrome channel and record the actual browser version.

## Dependencies and runtime

One root manifest and `bun.lock` install packages for the application setup and every experiment.
Experiment manifests retain names and runner scripts; active nested dependency lists and npm lockfiles were removed.
The old manifests and locks are preserved under [historical-dependencies](evidence/historical-dependencies/).
No dependency symlinks into another experiment or checkout are used.
No undeclared global package is required.
The globally installed shadcn 4.19.0 was inspected under Node 24.19.0 for provenance only.
The project shadcn 4.21.0 dependency from PR 1 was removed because rerunning committed component source does not need a CLI.
The CLI-generated dialog/button source is unchanged.

| Requirement | Integrated version |
| --- | --- |
| OS / architecture / session | Fedora 44 KDE Plasma Desktop Edition / x64 / Wayland |
| Google Chrome stable | 154.0.8037.57, installed `/usr/bin/google-chrome-stable`, Playwright Chrome channel |
| Bun / Node / npm | 1.4.2 / 22.23.2 / 10.9.8 |
| React / React DOM | 19.3.0 / 19.3.0, one checkout-local installation |
| Babel parser / Recast / ast-types | 7.29.9 / 0.24.0 / 0.16.3 |
| Tailwind / Tailwind Node compiler | 4.3.3 / 4.3.3 |
| Base UI / Lucide | 1.8.0 / 1.48.0 |
| class-variance-authority / cn / tw-animate-css | 0.7.1 / 0.4.0 / 1.4.0 |
| Motion / framer-motion / motion-dom / motion-utils | 13.4.4 / 13.4.4 / 13.4.4 / 13.3.0 |
| Playwright / Playwright Test | 1.63.0 / 1.63.0 |
| TypeScript / Oxlint / Oxfmt | 7.0.2 / 1.86.0 / 0.71.0 |
| Bun / Node / React / React DOM types | 1.4.2 / 26.6.3 / 19.3.0 / 19.3.0 |
| Vite / React plugin / Tailwind Vite plugin | 8.3.1 / 6.1.1 / 4.3.3 |
| CodeMirror / JavaScript language | 6.0.2 / 6.2.5 |

The complete exact versions and per-import paths are in [resolution.json](../../dependency-setup/resolution.json).
The checker covers historical PR imports, actual integrated source imports, compiler resolution for all four experiment directories, React/JSX-runtime/React-DOM identity, and real stylesheet import compilation.
The fixture, instrumentation, and generated-entry resolution contexts point into this checkout's root `node_modules`.
The actual combined Chrome runs exercise those resolutions.
TypeScript and its typings resolve locally; no previous folder's compiler is invoked.
TypeScript 7.0.2 is used only through its `tsc` CLI for static checking.
Source discovery and editing use Babel and Recast, and Bun builds the browser candidates.
The installed TypeScript package labels its compiler API exports `unstable`; this experiment imports none of them and establishes no TypeScript 7 compiler API compatibility.
[Compiler scope](evidence/typecheck/compiler-scope.json) records that distinction.

PR 1's application declared Motion 13.4.6, while its original proof used 13.4.4.
The integrated manifest chooses the original proof version and pins its three relevant transitive Motion dependencies through overrides.
That version choice affects PR 1's Motion source/interaction check and future application Motion usage, not PRs 2–4's fixtures, which do not import Motion.
It does not recreate every mobile transitive dependency or make Bun 1.4.2 equivalent to mobile Bun 1.3.14.
The earlier direct versions for PRs 2–4 are retained.
The root application tree has Lightning CSS 1.33.0, but `@tailwindcss/node` resolves its nested exact Lightning CSS 1.32.0, matching PR 4's historical compiler.
Root hoisting alone must not be mistaken for that compiler's effective version.
The differences are explicit in [dependency-version-differences.json](evidence/dependency-version-differences.json).

## Measured yellow baselines and corrections

The first probe had an experiment setup error: it clicked the package-owned heading rather than its authored span.
That output is preserved under [baseline-first-setup](evidence/baseline-first-setup/).
The corrected probe used one actual span click and reproduced the real visibility and selection limits.
The meaningful pre-correction output and owner/source records are under [baseline](evidence/baseline/report.json).
A short development failure from an out-of-scope source-digest variable is preserved separately under [development-source-digest](evidence/development-source-digest/).
It was corrected before final verification and is not an architecture finding.

| Area | Baseline | Correction and final bounded result |
| --- | --- | --- |
| Revealed dialog iteration | Source text applies, but the fresh candidate remounts closed and the selected rendered content disappears without the old activation callback | Session-owned Show content metadata controls the recognized Base UI Dialog Root in generated instrumentation; text, size, and weight edits keep the dialog visible without candidate clicks |
| Identical usages | Both source variations safely invalidate selection after a value edit makes two usages structurally identical | Opt-in command-owned metadata retains the exact selected AST lineage, and subsequent edits change only that usage, including after reopen while usages are still identical |
| Combined Only this | Copy, subsequent independent text edit, and Undo/Redo work; constructing a fresh session from saved source does not restore selection | The session accepts its saved selection and metadata; copy plus edit remains one Undo step, the next edit is another step, Undo/Redo and reopen retain the independent/shared relationship |

### Revealed content boundary

`showContent()` and `hideContent()` belong to the experiment session, not its browser test callback.
Generated instrumentation recognizes the named Dialog import from `@base-ui/react/dialog` and its Root member, including the local import alias.
It overrides only the revealed usage's open state in the generated render.
Authored source, saved open defaults, component props, and Preview/export source are unchanged.
The view action changes neither source revision nor Undo count.
The revealed target follows supported command lineage and Only this's explicit redirected root usage.
A candidate must contain exactly one supported dialog and the exact selected rendered binding before Show content publishes.

The test opens once normally to discover and select supported content, then enables the view override.
No candidate activation callback is used in the new final workflow.
Visibility and selected owner survive text → size → weight, save/reopen, and Hide/Show.
The final selected heading is 24px, weight 500, with the edited text and Unicode rendered correctly.
After Hide, the normal dialog starts closed, opens through its real trigger, closes through Escape, and returns focus.

Fresh contexts still remount the React tree.
Only the explicit reveal target and generated selection metadata are restored; arbitrary hook state, focus, scroll, and animation progress are not preserved.
Save/reopen restores source, revision, selection, and reveal metadata; the session's Undo/Redo stacks start empty.
Show content forces the tested dialog open until the editor hides that revealed content.
A Properties/Layers UI for revealing a never-opened region is not implemented or tested.
Other hidden regions, menus, popovers, controlled-component protocols, multiple dialogs under one usage, and full Base UI recognition remain unproven.

### Identical-usage boundary

The command starts with a unique discovered selection and retains references to the exact host and usage AST nodes while making a supported value mutation.
In `commandIdentity: true` sessions, those nodes receive distinct generated IDs carried in metadata outside authored TSX.
The metadata binds exact AST addresses to the exact printed source digest.
Those addresses are transported by the command's known mutation; they are not guessed matches against an arbitrary replacement or a collection index.
The selected usage remains distinct when its authored props become identical to a peer's.
The renamed fixture selects the second instance, exercising both sides of a duplicate pair.
A following text edit changes one usage and leaves its peer unchanged.
Undo/Redo and saved metadata reopen preserve that distinction.

The existing raw-hash behavior and conservative collision refusal remain tested by the unchanged PR 3 workflow.
The new capability is explicit opt-in experiment behavior, not a general identity redesign.
Direct source edits discard command metadata and cannot reuse an uncertain command selection.
The external structural-duplication check invalidates and refuses a subsequent edit without changing the saved state again.
At the original PR 5 checkpoint, already-identical usages without prior command lineage remained unsupported.
The focused follow-up below supports separate authored JSX usages through generated initial snapshot bindings in `commandIdentity: true` sessions.
Formatting or arbitrary source Apply after command IDs may require reselection because this experiment does not reconcile those IDs across external edits.

### Only this boundary

The real PR 4 copy operation and PR 3 command session are reused.
The discovered boundary is the selected AccountDialog and its cross-file Detail style owner; CLI Dialog/Button source, packages, and tokens stay shared.
The selected instance becomes independent with weight 500 while the original Detail definition remains bold and unchanged.
A subsequent supported text command edits only the independent Detail definition through the retained handle.
Undo reverses the text edit first and then the single copy/edit command, restoring original references and selection.
Redo restores both states exactly.
Reopen retains the selected independent note, while normal opening of the team dialog still shows its original note.
The existing captured-binding refusal, collision-safe names, parse/build/synchronous-render rejection, and ordinary interaction checks remain in PR 4's passing suite.
No arbitrary closures, computed classes, or complete module-graph copying were added.

## Original static checking and declaration failure

The old TS config's removed `baseUrl` and non-relative alias paths reproduce the earlier TS5102/TS5090 blocker.
The integrated config uses relative alias paths and explicit installed Bun/Node/React types.
Explicit checked-node assertions and narrow guards make the scoped source check pass without disabling strict mode or using unsafe casts.
The original browser assertions remain intact.

At the original PR 5 checkpoint, `bun run check:source-types` passed for integration/PR 4 source and their imported implementation with `--skipLibCheck`.
At that checkpoint, `bun run check:types` exited 1 on seven missing internal declaration imports in the installed Tailwind Node package.
Both the original config failure and final declaration diagnostics are preserved under [typecheck](evidence/typecheck/).
This is a dependency declaration compatibility issue, not an observed stylesheet or Chrome runtime failure.
The consequence at that checkpoint was that a full strict declaration check could not certify the dependency tree.
The follow-up repairs those declarations using the exact Tailwind dependency's published return type, with no version change.
Source checking does not cover the untyped preserved PR 1 runner or every inherited test/fixture as a standalone TypeScript project.
Local Oxlint, Oxfmt, and diff whitespace checks pass for the modified implementation, integration runners, and evidence verifier.
[Static review commands and exit codes](evidence/static-review/results.json) record their exact scope.

## Reproduction and evidence

From a fresh clone of this branch, with installed Bun, Node, and Google Chrome:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
bun run proofs:existing
bun run proofs:integration
bun run check:source-types
```

`bun run check:types` now passes after the committed package patch; the original exit-1 diagnostic remains in historical evidence.
The existing-proof runner records exact commands, working directories, exit codes, console output, and each proof's reports and artifacts.
It runs PR 1 once, PR 2 once, PR 3 once, and PR 4 once per invocation.
The initial combined environment was verified once before corrections; shared-code changes justified a broader regression invocation afterward.
No passing proof was rewritten into a replacement test suite.
The new runner contains only the visibility, two duplicate-usage variations, and combined-copy scenarios justified by the remaining questions.

[Initial integration](evidence/integrated-before-corrections/summary.json) distinguishes preserved green behavior from new work.
[Regression integration](evidence/integrated-after-corrections/summary.json) records the shared correction checks.
[Final new workflows](evidence/final/report.json) contain before/after selections, source owners, source snapshots, revealed targets, command bindings, history counts, and full diagnostics.
The final revealed/copy screenshots were visually inspected for typography, Unicode, real modal placement, and absence of extra parentheses.
All new artifacts are distinguishable from PRs 1–4's historical evidence.
No generated JavaScript bundle, cache, browser binary, or `node_modules` is committed.

A separate clone at `/tmp/orc-web-pr5-reproduction-20260930` installed dependencies from committed source `dd1acd7` using `bun install --frozen-lockfile` with `NODE_PATH` unset.
No previous dependency directory was copied, and the clone used no shared-object Git alternates.
Installation, dependency checks, all four existing proofs, the four new workflows, and scoped source checking each exited 0.
[Fresh reproduction provenance](evidence/fresh-reproduction/provenance.json), [dependency paths](evidence/fresh-reproduction/resolution.json), [existing-proof summary](evidence/fresh-reproduction/existing/summary.json), and [new workflow report](evidence/fresh-reproduction/integration/report.json) preserve those measurements.
That reproduction applies to the original PR 5 checkpoint.
The focused follow-up below records the subsequent mapping and declaration corrections separately.

## Focused follow-up: full types and initially identical usages

This update starts from PR 5 commit `354fa5366957db94185a37c7e46094e00c449e7a` in the existing `/home/eren/D/orc-web-fresh-20260930` checkout.
The requested `orc-web-fresh-20600930` directory does not exist.
The existing `codex/integrated-proof-pr5` branch was clean before this work.
No checkout, branch, or PR was created for the update.

### Full TypeScript check diagnosis

The original full check reproduced all seven TS2307 imports from `@tailwindcss/node/dist/index.d.ts`, exit 1.
The package metadata directs type resolution to that file, but its published tarball contains none of the referenced `ast`, `candidate`, `compile`, `intellisense`, `theme`, `utilities`, or `variants` modules.
The installed declaration bytes match the registry tarball, whose SHA-512 integrity matches the committed lockfile.
This rules out a local missing-file installation as the cause.
The 4.3.2 tarball also contains the same unresolved imports; it was inspected without installing it in the project.

TypeScript 6.0.3 was downloaded and extracted under a temporary `/tmp/orc-pr5-ts6-diagnosis-*` directory using `npm pack`, without installing a second compiler in the project.
TS 6 and TS 7.0.2 checked the same project source and dependency tree with identical expanded compiler settings and explicit `--skipLibCheck false`.
[Comparison commands and settings](evidence/followup/typescript/equivalent-comparison.json) record both compiler paths, versions, commands, exit codes, and the unchanged manifest/lock hashes during comparison.
Both reported exactly the same seven TS2307 diagnostics.
TS 6 exited 2; TS 7 exited 1.
A downgrade would therefore retain the declaration failure.

| Check | Before correction | After correction |
| --- | --- | --- |
| TS 7.0.2 full CLI check | 7 TS2307 errors, exit 1 | PASS, exit 0 |
| Temporary TS 6.0.3 full CLI check | Same 7 TS2307 errors, exit 2 | PASS, exit 0 |
| TS 7 scoped source check | PASS with library declarations skipped | PASS, exit 0 |
| Frozen installation | Original package has broken declarations | Patch reapplied, exit 0 |

The fix is [a Bun package patch](../../patches/@tailwindcss%252Fnode@4.3.3.patch) for `dist/index.d.ts` and `dist/index.d.mts` only.
Their dangling imports served a locally repeated `DesignSystem` declaration.
The Node loader delegates to its exact `tailwindcss@4.3.3` dependency's public loader, which already publishes that complete type.
The patch derives `DesignSystem` as `Awaited<ReturnType<typeof tailwindcss.__unstable__loadDesignSystem>>`.
It introduces no fabricated member declarations, `any` replacement, ambient stubs, diagnostic suppression, or disabled library checking.
All package versions, including TS 7.0.2, remain unchanged.
No permanent TS 6 dependency was added.
Manifest and lockfile changes register only the patch.

`bun install --frozen-lockfile --force` reapplied the patch in this same checkout.
An exhaustive comparison against the integrity-verified published tarball found changes only in the two declaration files, with every runtime file unchanged.
[Installed package comparison](evidence/followup/typescript/installed-after.json), [declaration rationale](evidence/followup/typescript/declaration-correction.json), and [final commands](evidence/followup/typescript/final-commands.json) preserve the evidence.
This remains TS CLI checking; no TypeScript programmatic compiler APIs are used.

### Initially identical instance selection

[The focused runnable check](identical-instances.ts) authors two separate `<Notice title="Same heading" />` usages and a heading whose text comes from that prop.
There are no distinguishing props, authored editor IDs, source tables, or resolver-specific text matches.
One actual Chrome click selects the second heading.
Before correction, the actual editing command failed with `Selection invalidated before editing`, exit 1.
The cause was that structural hashing gave both usage nodes the same generated ID, and the resolver correctly refused an ambiguous owner.
[Baseline command failure](evidence/followup/identical-baseline/console.log) and [owner records](evidence/followup/identical-baseline/report.json) preserve that result.
The first owner-assertion probe is retained separately in `identical-baseline-owner`.

The correction adds generated bindings for colliding local JSX usages at initial session creation in the existing `commandIdentity: true` mode.
The existing metadata format binds each exact AST address to the complete source digest.
The existing instrumentation then carries distinct usage IDs into the rendered instances before the click.
Supported commands transport the selected AST lineage using PR 5's existing mechanism.
Authored TSX is untouched by instrumentation.
These are addresses within the analyzed source snapshot, not matching heuristics against a later replacement or displayed text.

The final workflow verifies that only the second prop and heading change, the first stays unchanged, and the stored selection identifies only the second rendered instance.
A second text command uses the same logical handle without another click.
Undo/Redo compare exact source, saved source, rendering, and selection.
Reopen preserves the selected instance and accepts another correct edit, both before any edit while the usages are identical and after Undo restores the identical pair.
Reopening the edited design also preserves the relationship.
A byte-changing external source replacement discards command bindings and invalidates the uncertain selection; a following edit refuses without changing the saved file.
[Final ownership/source records](evidence/followup/identical/report.json), [before source](evidence/followup/identical/before.tsx), [after source](evidence/followup/identical/after.tsx), and [edited saved state](evidence/followup/identical/edited-saved.json) preserve the supported edits.
[Before screenshot](evidence/followup/identical/before.png) and [after screenshot](evidence/followup/identical/after.png) record the rendered result.
The final `saved.json` belongs to the subsequent external-replacement refusal control; it is distinct from the edited saved state.
The screenshots were inspected for heading content, typography, and the seedling glyph.

### Follow-up verification and reproduction

All browser checks use Fedora 44 x64 KDE Wayland and installed Google Chrome 154.0.8037.57 through Playwright 1.63.0's Chrome channel.
Bun remains 1.4.2 and Node remains 22.23.2.
The checkout's single local React 19.3.0 installation serves the fixture and instrumentation.
No previous experiment's dependencies or compiler installation are reused.

| Affected suite | Result | Exit |
| --- | --- | --- |
| PR 2 mapping and boundary controls | 30 PASS | 0 |
| PR 3 continuity and conservative collision controls | 14 PASS | 0 |
| PR 4 real dialog editing, copying, and recovery | 9 PASS | 0 |
| Existing PR 5 integration workflows | 4 PASS | 0 |
| New initially identical workflow | PASS | 0 |

[Regression commands and exits](evidence/followup/regression-commands.json) and the adjacent reports/console files preserve the runs.
PR 1's unrelated original runner was not rerun in this follow-up.
Its source and original assertions are unchanged; the patch changes no Tailwind runtime file or version.
All inherited assertions remain intact.

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
bun run check:types
bun run check:source-types
bun experiments/integration/identical-instances.ts
(cd experiments/automatic-source-mapping && bun proof.ts && bun continuity/proof.ts)
(cd experiments/base-ui-only-this && bun proof.ts)
bun run proofs:integration
```

To repeat the temporary compiler comparison without changing project dependencies:

```bash
ts6_scratch=$(mktemp -d /tmp/orc-pr5-ts6-XXXXXX)
npm pack typescript@6.0.3 --pack-destination "$ts6_scratch" --ignore-scripts
tar -xzf "$ts6_scratch/typescript-6.0.3.tgz" -C "$ts6_scratch"
node "$ts6_scratch/package/bin/tsc" --noEmit --incremental false --pretty false --skipLibCheck false -p experiments/integration/tsconfig.json
./node_modules/.bin/tsc --noEmit --incremental false --pretty false --skipLibCheck false -p experiments/integration/tsconfig.json
```

Both comparison commands now exit 0 with the committed patch.
The initial failure diagnostics and pre-patch identical-source comparison remain historical evidence.

### Remaining limits

The declaration repair is a local reproducible patch, not an upstream Tailwind release.
The full check covers the configured integration/PR 4 project and imported implementation, not every inherited fixture or the untyped original PR 1 runner.
Initial identical selection is established for two separate authored JSX usages with literal props in `commandIdentity: true` sessions.
Repeating a single JSX usage through runtime loops, identical host nodes, initial identical-instance copying, and arbitrary React syntax are not established by this check.
Raw legacy analysis keeps its conservative collision refusal.
External semantic source rewrites still discard uncertain selection; there is no general reconciliation framework.
The previously reported view-state, closure, module-graph, async failure, Windows, and complete-editor limits remain.

## Publication

[PR 5](https://github.com/eren726290/orc-web/pull/5) is open against `master`.
PRs 1–4 remain open at their inspected heads.
[Publication evidence](evidence/publication.json) records the checked state.

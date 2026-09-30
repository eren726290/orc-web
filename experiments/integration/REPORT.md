# PR 5 integrated verification

## Result

The combined Fedora Google Chrome environment passes the original 12 assertions, 30 mapping checks, 14 continuity workflows, and 9 real Base UI/shadcn workflows.
The four additional bounded integration workflows pass after the corrections described below.
No previous assertion was removed or weakened.
The real Tailwind positioning, normal interaction, visible-text comparison, and prior mapping/continuity regressions remain green.
This is architecture-experiment evidence, not ORC-web application implementation or Windows certification.

Full third-party TypeScript declaration checking remains unresolved.
The pinned `@tailwindcss/node@4.3.3` package references seven declaration files missing from its installed distribution.
The runtime compiler and browser checks pass; source checking with dependency declarations skipped also passes.
Full typechecking is explicitly not counted as green.

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
Already-identical usages imported without prior command lineage remain unsupported.
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

## Static checking and unresolved declarations

The old TS config's removed `baseUrl` and non-relative alias paths reproduce the earlier TS5102/TS5090 blocker.
The integrated config uses relative alias paths and explicit installed Bun/Node/React types.
Explicit checked-node assertions and narrow guards make the scoped source check pass without disabling strict mode or using unsafe casts.
The original browser assertions remain intact.

`bun run check:source-types` passes for integration/PR 4 source and their imported implementation with `--skipLibCheck`.
`bun run check:types` exits 1 on seven missing internal declaration imports in the installed Tailwind Node package.
Both the original config failure and final declaration diagnostics are preserved under [typecheck](evidence/typecheck/).
This is a dependency declaration compatibility issue, not an observed stylesheet or Chrome runtime failure.
The consequence is that a full strict declaration check cannot currently certify this pinned dependency tree.
An upstream declaration fix or a separately verified compatible version is the next step; PR 5 does not upgrade packages to conceal it.
Source checking does not cover the untyped preserved PR 1 runner or every inherited test/fixture as a standalone TypeScript project.

## Reproduction and evidence

From a fresh clone of this branch, with installed Bun, Node, and Google Chrome:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
bun run proofs:existing
bun run proofs:integration
bun run check:source-types
```

The full declaration diagnostic is reproduced separately with `bun run check:types`, expected exit 1.
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

Fresh committed-source installation and publication evidence are recorded when those final steps complete.

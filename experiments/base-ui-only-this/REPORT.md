# Real Base UI editing and safe Only this results

The bounded example passes on Fedora 44 with installed Google Chrome 154.0.8037.57.
All 9 new browser workflows pass, including a successful cross-file independent copy and atomic rejection controls.
All 30 inherited mapping checks and 14 continuity checks also pass after the instrumentation correction.
Every final execution exits with code 0.
This establishes the tested local composition and copying subset, not arbitrary React compatibility or ORC-web implementation correctness.

## Starting point and scope

Starting commit: `c230345902e8b33d4d772916ce010a72fe8704d6` from unmerged PR 3.
Branch: `codex/base-ui-only-this`, targeting existing default branch `master`.
[PR 4](https://github.com/eren726290/orc-web/pull/4) is open against master.
The new implementation and evidence commit is `7ff439138d8d0ab58bf3846fad9fd7f82a3c150e`; a separate publication-record commit only completes the report and gates.
The [parent-to-implementation comparison](https://github.com/eren726290/orc-web/compare/c230345902e8b33d4d772916ce010a72fe8704d6...7ff439138d8d0ab58bf3846fad9fd7f82a3c150e) isolates PR 4's new work.
PR 3 includes PR 2's automatic mapping experiment.
The new work lives under this directory plus small additions to the inherited renderer, instrumentation, and command session.
Application dependencies, product specifications, MCP, and PR 1/2/3 branches were not changed.
The copy follows the single-command contract in [react-components.md](../../doc_v1/interface/react-components.md#L81) and [react-source-bindings.md](../../doc_v1/architecture/react-source-bindings.md#L83).
The exact contract appears at lines 81–84 and 83–86 respectively in the starting checkout.

## Source provenance and installations

The real component registry is [base-nova/dialog.json](https://ui.shadcn.com/r/styles/base-nova/dialog.json), with the registry's `button` dependency.
Registry responses are preserved in [dialog-registry.json](evidence/provenance/dialog-registry.json) and [button-registry.json](evidence/provenance/button-registry.json).
The installed global CLI was shadcn 4.19.0 under the Node 24.19.0 installation.
Its engine requirement is Node `>=20.18.1`; the invoked runtime satisfies it.
The proof does not install shadcn as a dependency.
Configured style `base-nova` resolves to base `base`, as recorded in [cli-info-after.json](evidence/provenance/cli-info-after.json).
An initial redundant `base` config key was rejected by this CLI schema; the accepted configuration derives base from the style.

The CLI generated `src/components/ui/dialog.tsx` and `src/components/ui/button.tsx`.
Their actual imports are `@base-ui/react/dialog` and `@base-ui/react/button`, with no Radix replacement.
The CLI transformed registry aliases, icon placeholders to Lucide, and client/font markers for the configured project.
These CLI-produced files were retained without manual rewriting or formatting.
[Generated source hashes](evidence/provenance/generated-source-hashes.json) match the original CLI output retained in the first PR 4 checkout.
[CLI output](evidence/provenance/cli-add.log) records the two generated files and exit code 0.

The registry declared `cn` but omitted some imports needed by its output.
The generated files and stylesheet were inspected before adding the missing proof dependencies.
`@base-ui/react`, `lucide-react`, `class-variance-authority`, and `cn` serve the imported component; they are not source-editor dependencies.
`@tailwindcss/node` resolves the real Tailwind stylesheet imports, and `tw-animate-css` supplies the component's animation utilities.
The neutral CSS tokens are authored fixture inputs, not claimed to be a CLI-generated theme.
All dependencies stay inside the proof installation.
No application packages were upgraded and no browser was downloaded.

| Tool/package | Exact version | Location/scope and purpose |
| --- | --- | --- |
| Fedora / architecture / desktop | 44 / x64 / KDE Wayland | PC host |
| Google Chrome stable | 154.0.8037.57 | `/usr/bin/google-chrome-stable`, launched through Playwright Chrome channel |
| Bun | 1.4.2 | `/home/eren/.bun/bin/bun`, proof execution and browser bundling |
| Node / npm | 22.23.2 / 10.9.8 | Default Node 22 installation, locked dependency installation |
| shadcn / CLI Node | 4.19.0 / 24.19.0 | Global Node 24 installation, source acquisition only |
| `@babel/parser` / `ast-types` / `recast` | 7.29.9 / 0.16.3 / 0.24.0 | Isolated inherited analysis dependencies |
| `react` / `react-dom` | 19.3.0 / 19.3.0 | Isolated fixture and shared instrumentation runtime |
| `playwright` | 1.63.0 | Isolated browser driver |
| `tailwindcss` | 4.3.3 | Inherited version retained |
| `@base-ui/react` | 1.8.0 | Added for real dialog and button |
| `@tailwindcss/node` | 4.3.3 | Added for full stylesheet import compilation |
| `class-variance-authority` | 0.7.1 | Added for real generated button variants |
| `cn` | 0.4.0 | CLI dependency, pinned exactly afterward |
| `lucide-react` | 1.48.0 | Added for generated close icon |
| `tw-animate-css` | 1.4.0 | Added for normal dialog animation classes |
| Oxlint / Oxfmt | 1.86.0 / 0.71.0 | Existing original-checkout tools used for static checks |

[Environment and exact direct versions](evidence/fedora-chrome/report.json) and [the full dependency tree](evidence/provenance/dependency-tree.json) record what actually resolved.
A separate clean `npm ci` installed 46 packages from the lockfile, exited 0, and passed the complete new proof.
See [clean installation output](evidence/provenance/clean-npm-ci.log) and [recorded commands](COMMANDS.md).

## Baseline and reproduced failures

The first baseline reused the inherited renderer with its synthetic typography-only Tailwind theme.
Opening, Escape, and focus return passed.
Both content clicks timed out because Base UI's modal inert blocker intercepted pointer events, and the popup's computed position was `static` instead of `fixed`.
That baseline has 1 PASS and 3 FAIL results with exit code 1.
Only this was absent from the inherited command experiment; absence was recorded as missing functionality.
The baseline report, source, diagnostics, screenshot, console, and exit code are preserved under [evidence/baseline](evidence/baseline/report.json).
The setup correction compiles the real stylesheet and extracts static utility strings including the generated `cn` and `cva` inputs.
It does not replace the dialog, remove its blocker, force clicks, or weaken the layout assertion.

Visual inspection then exposed a separate instrumentation defect.
The first corrected-styles run passed the initial 9 workflows, whose popup and interaction checks did not compare all visible text.
It displayed `()` next to every trigger.
A stricter real-browser raw/instrumented body-text comparison reproduced that defect before changing the wrapper, with exit code 1.
The exact text difference, screenshots, diagnostics, report, and console are under [evidence/parentheses-reproduction](evidence/parentheses-reproduction/control-dom.json).
Recast retained the original return-expression parentheses when a returned local component was moved inside the generated Scope's JSX children.
Those parentheses became literal JSX text.
The minimal correction wraps that child in a JSX expression container, preserving parentheses as expression syntax.
The same stricter assertion now passes, and all inherited checks were rerun after this change.
This is a reproduced instrumentation failure corrected and verified, not a component compatibility assumption.

## What existing discovery found

The fixture composes the real generated Dialog, Trigger, Content, Header, Title, Description, Footer, Close, and Button.
Two `AccountDialog` usages have different literal title/trigger props, and each includes cross-file `Detail` as the local alias `Note`.
The third dialog is a negative copying control.
No authored editor IDs, selector manifests, or fixture ownership tables are used by analysis or copying.
Browser tests use visible text only for initial content clicks and normal trigger interaction.

Clicking the authored title `span` inside the real DialogTitle discovers the selected outer usage's literal `title` prop in `src/App.tsx` with scope `This instance`.
The title's static typography belongs to the shared `AccountDialog` implementation in `src/AccountDialog.tsx`.
Clicking the nested note discovers `Detail`'s static class owner in `src/Detail.tsx`.
Its runtime usage chain includes a generated local DialogPortal scope.
The copy operation derives local definition edges from authored imports and JSX usages, so that portal context is not mistaken for an owned style dependency.

Generated shadcn source remains local source, but its `cn`/spread-based Header classes are outside the resolver's static ownership subset and return `Edit source` with a reason.
The actual package-rendered close button has no authored host owner.
The experiment does not infer editable values inside Base UI package internals.
Supported edits here apply to authored literal content and static local child styling within the real composition.
It does not establish automatic recognition of all Base UI APIs or arbitrary generated shadcn internals.

## Successful copying boundary

The selected note's style is owned by cross-file `Detail`.
The smallest tested boundary copies both the selected outer `AccountDialog` definition and its `Detail` dependency into their current local modules.
It adds named imports for the independent exports and redirects only the selected outer usage and that copied dependency edge.
Original functions remain byte-for-byte identical when printed; existing props, other usages, and their bindings survive.
Both modules and the caller contain deliberate conflicting names, so allocation uses `AccountDialogIndependent2` and `DetailIndependent2` rather than colliding with existing bindings.
The implementation scans existing identifiers instead of assuming a free name.

```text
Selected personal usage -> AccountDialogIndependent2 -> DetailIndependent2, font-medium
Other team usage       -> AccountDialog             -> Detail, font-bold
Both                   -> original CLI Dialog/Button, Base UI, utility packages, shared CSS tokens
```

Copying only the outer definition would retain its `Note -> Detail` import and leave the requested nested style shared.
The test checks that original edge, the newly discovered copied edge, original definition preservation, exact redirected usage counts, and actual rendered weights `500` versus `700`.
Only those two definitions become independent.
The real Dialog, Button, packages, and theme are not copied or vendored.
The input with collision controls is [copy-before.json](evidence/fedora-chrome/copy-before.json); the actual resulting source is [after.json](evidence/fedora-chrome/after.json).
The source-edit and copy operation produce one history entry.

Supported copying requires direct named exported top-level function declarations, one direct JSX return, plain destructured parameters or no parameters, and direct named import edges along one unambiguous local definition path.
Static literals, direct parameter/import references, and nested JSX render props are accepted within that conservative subset.
Executable bodies, computed expressions, spreads, namespace component bindings, parameter-shadowed component imports, and captured module values are refused.
The style change must own one unambiguous literal class token and one cloned host lineage.
The successful tested path is cross-file; arbitrary same-file graphs and cyclic module graphs are not established.

## Final results

| Workflow | Result and observed evidence |
| --- | --- |
| Raw and instrumented real component | PASS, identical complete visible text and popup styles; both instances open, close through Done and Close, Escape, and return focus to their trigger |
| Discovered instance text | PASS, only personal title changes, literal quotes/braces/HTML-like text/emoji survive, shared implementation is unchanged |
| Shared typography | PASS, implementation scope reported, both title spans become 24px |
| Unsupported internals | PASS, package button has no authored owner; computed/spread Header classes return Edit source; refused edit preserves state; safe title styling remains usable |
| Cross-file Only this | PASS, two discovered definitions copied, collisions avoided, props/imports and originals preserved, weights become personal 500 and team 700 |
| Undo and Redo | PASS, one Undo restores exact source, references, shared appearance and selection; Redo restores copied source, selection and selected weight |
| Save/reopen and interaction | PASS, fresh Chrome context rebuilds mappings and identical edited/shared rendering; open/close/Escape/focus return still work |
| Parse/build/synchronous render rejection | PASS, each rejected candidate preserves applied source, visible dialog, selected properties, selection, saved file, revision, Undo and Redo counts |
| Unsafe required binding | PASS, captured `suffix` is refused before application with an explanatory error; applied source, rendering, save, history and selection are unchanged |

The positive copying workflow also verifies a parameter-shadowed component import is refused.
The exact operation records and selected source owners are in [ownership-records.json](evidence/fedora-chrome/ownership-records.json).
[Final report](evidence/fedora-chrome/report.json), [console](evidence/fedora-chrome/console.log), [exit code](evidence/fedora-chrome/exit-code.txt), and [candidate diagnostics](evidence/fedora-chrome/browser-diagnostics.json) preserve the execution.
The expected rejected candidates include a malformed parse, missing module, and synchronous root render crash.
Their failures are diagnostics for passing recovery controls, not silently ignored failures.
[Mapping regression output](evidence/regression/mapping-console.log) has 30 PASS and 0 FAIL results; [continuity output](evidence/regression/continuity-console.log) has 14 PASS and 0 FAIL results.
The inherited proof still tests its original unsupported Only this path; the new bounded operation is exercised by this separate proof.

Before, after, and reopened screenshots were visually inspected, including the note's seedling emoji and the change from bold to medium.
Final images show the centered real dialog, readable typography, unchanged close control and footer, and no extra parentheses.
Screenshots await actual CSS animation completion; an earlier intermediate screenshot caught mid-transition opacity and is not used as final visual evidence.

## Required changes and limits

Existing symbol/prop/class discovery, selection lineage, candidate rejection, and Undo/Redo state logic were reused.
Required additions were the real stylesheet input, raw instrumentation control, runtime location option, a browser activation callback, the parentheses correction, bounded copying, and atomic application of the copied source plus its validated selection.
The architecture assessment using the installed `improve` skill is [the copy-boundary plan](../../plans/pr4-copy-boundary.md).
The installed `shadcn` skill guided registry selection, Base UI verification, and CLI acquisition; `codebase-design` guided the scoped command interface.

Fresh candidate contexts remount dialogs closed.
The browser test activates the current trigger before validating a candidate's selected content, without reselecting content or replacing the retained selection from the test.
Preservation of live component open state through source edits is not established.
The full CSS compiler uses static string extraction suitable for this fixture, not dynamic utility evaluation or arbitrary project stylesheet configuration.
The experiment does not support arbitrary closures, re-exports, namespace import edges, deep module graphs, arbitrary computed classes, Base UI package-internal ownership, or complete shadcn schema recognition.
The copied boundary is not a production component record or the complete editor command engine.
The tests reject observed parse/build/synchronous render failures; they do not cover later asynchronous failures, arbitrary side effects, or untrusted code isolation.
This does not prove the ORC Properties panel, arbitrary React recognition, animation correctness, Windows support, or complete ORC-web correctness.

The evidence supports continuing with bounded local source ownership and explicit copying boundaries.
The two observed problems were the experiment's stylesheet setup and an instrumentation printing defect, with concrete corrections and regression evidence.
They do not justify a general architecture refactor or rolling back specifications.
A next experiment should test preserving live component state across candidate replacement before promising continuous editing of open interactive components.

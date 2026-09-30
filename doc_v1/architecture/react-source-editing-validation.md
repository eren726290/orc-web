# React source-editing validation

## Status

The bounded source-editing workflow is confirmed on Fedora Google Chrome through PRs 1–5.
The latest reviewed PR5 commit is `7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc`.
Babel plus Recast remains the implementation direction for supported source edits.
The complete ORC-web editor and Windows Chrome support remain unverified.

This document records the experiments and their limits so implementation can use the findings without repeating completed investigations.
The reviewed PRs remain open as references.
Their reports and code were reviewed from GitHub; this documentation update did not rerun the PC browser tests.

## Question evaluated

Can a visual edit resolve its authored React source owner, update source, render the candidate, preserve the applied design on failure, retain selection, Undo/Redo, and reproduce the result after reopen?

The experiments used `@babel/parser` for JSX/TSX parsing and Recast for structured source edits.
Tailwind generated CSS from supported static utility strings and required stylesheet inputs.
Bun built and served browser candidates, and Playwright drove the browser.
The saved source produced the edited appearance; temporary DOM replacement was not the durable result.

## Original fixture and passed checks

The mobile fixture contained two uses of one `Hero` component and a local `products` array.
Each Hero rendered a Motion section, a Tailwind heading, and independent React button state.
The headings used declared `instanceId` bindings and the products used declared record IDs.
This initial proof exercised the editing path with explicit bindings before automatic discovery was evaluated.

| Check | Result |
| --- | --- |
| Parse and print untouched TSX | Source remained byte-for-byte identical. |
| Initial React and Tailwind render | Both headings rendered at 36 px. |
| Edit one Hero title | Only that instance changed; quotes, braces, HTML-like text, and Unicode stayed literal. |
| Edit shared heading size | Both instances became 48 px; unrelated hover and responsive utilities survived. |
| Only this | The first Hero became independent with medium weight; the second stayed bold. |
| Undo Only this | Restored shared source, references, and rendering. |
| Edit one collection item | Changed only that product record. |
| Undo collection edit | Restored exact source and rendering. |
| Candidate runtime crash | Preserved applied source, visible design, history, and saved file. |
| Malformed TypeScript or JSX | Parser rejected the candidate. |
| Source preservation and interaction | Comment and Motion declaration survived; React button state still worked. |
| Save and reopen | Fresh context reproduced text, typography, and product data. |

The mobile run used Debian ARM64, Bun 1.3.14, and Playwright Chromium 153.0.8010.12 headless shell.
It used Babel parser 7.29.9, Recast 0.24.0, React and React DOM 19.3.0, Tailwind 4.3.3, Motion 13.4.4, and Playwright 1.63.0.
PR1 repeated these twelve assertions with installed Google Chrome on Fedora.
PR5 preserved the original fixture and runner with the Chrome-channel launch adjustment and reran them in the combined installation.

## Evidence by PR

Each link identifies the reviewed commit rather than a moving branch.
Counts describe each suite's own checks or workflows and must not be added together as independent coverage.

| Evidence | Reviewed commit | Result and scope |
| --- | --- | --- |
| [PR1 report](https://github.com/eren726290/orc-web/blob/35f53965d746c7e1f6bcccf455505af95931df66/backlog/fedora-chrome-source-editing-verification.md) | `35f53965d746c7e1f6bcccf455505af95931df66` | Original twelve assertions pass in installed Fedora Chrome using explicit bindings. |
| [PR2 report](https://github.com/eren726290/orc-web/blob/2663a28aff8325e67e15a399ca321a365e1d9e18/experiments/automatic-source-mapping/REPORT.md) | `2663a28aff8325e67e15a399ca321a365e1d9e18` | Thirty checks pass, including twenty-two browser checks and eight resolver controls, for automatic ownership discovery in two source variations. |
| [PR3 report](https://github.com/eren726290/orc-web/blob/c230345902e8b33d4d772916ce010a72fe8704d6/experiments/automatic-source-mapping/continuity/REPORT.md) | `c230345902e8b33d4d772916ce010a72fe8704d6` | Fourteen browser workflows pass after correcting selection loss through supported value edits; mapping regressions pass. |
| [PR4 report](https://github.com/eren726290/orc-web/blob/c1e0d54d215c75bf226e30510deab03b2dbb5521/experiments/base-ui-only-this/REPORT.md) | `c1e0d54d215c75bf226e30510deab03b2dbb5521` | Nine workflows pass for a real Base UI-flavored shadcn dialog, cross-file Only this copying, rejection controls, and interaction; mapping and continuity regressions pass. |
| [PR5 report](https://github.com/eren726290/orc-web/blob/7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc/experiments/integration/REPORT.md) | `7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc` | One dependency installation passes inherited suites, four additional integration workflows, and the follow-up workflow for two initially identical authored usages. |

The PC environment was Fedora 44 KDE Plasma on Wayland, Linux x64, installed Chrome 154.0.8037.57, Bun 1.4.2, and Playwright 1.63.0.
PR5 used Node 22.23.2, React and React DOM 19.3.0, Babel parser 7.29.9, Recast 0.24.0, and `ast-types` 0.16.3.
It used Tailwind CSS and `@tailwindcss/node` 4.3.3, Base UI 1.8.0, and Motion 13.4.4.
These are measured experiment versions, not a claim that they are the newest releases or the final application dependency list.
The [root manifest](https://github.com/eren726290/orc-web/blob/7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc/package.json) and [dependency report](https://github.com/eren726290/orc-web/blob/7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc/dependency-setup/resolution.json) record the exact installation.

## Automatic ownership and selection

PR2 derived owners from authored JSX, supported literal props, local named imports and aliases, and local keyed sample records without authored editor IDs or fixture ownership tables.
Unsupported calculated values, spread overrides, shadowed bindings, and ambiguous owners received an explicit refusal.
A refused text edit did not prevent supported styling on the same element.

PR3 reproduced a continuity failure in the experiment.
The original generated identity included editable text, classes, and props, so those edits changed the identity and invalidated retained selection.
The command layer now carries selected AST nodes through its own supported mutation and updates the internal token behind one logical selection handle.
Successive edits, collection reorder, deletion, Undo/Redo, rejected candidates, and conservative ambiguity handling passed.

PR5 added opt-in command metadata outside authored TSX, binding exact AST addresses to the exact source snapshot digest.
Its follow-up distinguished two separate `<Notice title="Same heading" />` usages before any edit.
One real Chrome click selected the second heading; successive edits changed only its prop while selection remained correct through Undo/Redo and saved-state reopen.
The [focused test](https://github.com/eren726290/orc-web/blob/7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc/experiments/integration/identical-instances.ts) records those assertions.

This evidence covers command-owned lineage and the tested source snapshots.
Arbitrary external source replacement discards uncertain metadata and selection, and the next edit refuses instead of targeting a guessed instance.
The production requirement to retain identity through harmless formatting and source movement remains in [React source bindings](react-source-bindings.md).
General reconciliation after Code Apply, identical host elements, and repeated runtime usages is still an implementation task.

## Real component, copying, and hidden content

PR4 used CLI-generated Base UI-flavored shadcn Dialog and Button source with real stylesheet inputs and theme values.
Supported authored spans and local components remained editable inside that composition.
Computed or spread-based wrapper classes and package-owned internals did not receive guessed controls.
This proves a real composition works with the supported resolver; it does not prove recognition of every Base UI API or shadcn wrapper.

Only this copied the selected `AccountDialog` and its cross-file `Detail` style owner, then redirected only the selected usage.
Dialog/Button definitions, packages, and tokens stayed shared.
The test preserved original definitions, avoided name collisions, and rejected captured module values and a shadowed import.
Copy plus requested style change formed one Undo step; a later independent text edit formed another.
PR5 verified their Undo/Redo and reopen behavior together.
Arbitrary closures, cyclic or complete module graphs, and copying initially identical usages are not established.

PR5's session-owned Show content override kept the tested dialog visible across supported edits without a browser callback reopening each candidate.
The override affected generated rendering only and left saved open defaults and exported source unchanged.
Hide restored normal closed state, trigger opening, Escape, and focus return.
The experiment first opened the dialog normally to discover its content; a Properties interface revealing never-opened content is not implemented.
Other popup types, multiple dialogs per usage, and frame-local overlay placement remain unverified.

Each candidate used a fresh browser context and remounted React.
The experiment restored selected/revealed metadata, but not arbitrary hook state, focus, scroll, or animation progress.
Its saved JSON includes selection and reveal metadata for testing reopen.
That file is not the production `.orc` format; selection stays outside the [canonical document](canonical-document-model.md).

## Actual failures corrected

| Reproduced problem | Correction and verified result |
| --- | --- |
| Synthetic typography-only CSS omitted the real dialog's required positioning. | Compile the actual stylesheet, imports, theme inputs, and supported static strings; dialog layout and interaction pass. |
| Instrumentation printed visible `()` around component returns. | Wrap the returned child in a JSX expression container; raw and instrumented visible text match, and regressions pass. |
| Supported edits invalidated the selected source token. | Retain command-owned AST lineage; successive edits and Undo/Redo preserve the intended owner. |
| Fresh candidates remounted a revealed dialog closed. | Restore explicit Show content view metadata in generated rendering; edit without repeated trigger callbacks. |
| Identical authored usages collided at initial discovery. | Generate distinct snapshot bindings in command-identity mode; select and edit the second usage independently. |
| Full type checking reported seven missing Tailwind declaration imports. | Apply the declaration-only package patch described below; full checks pass with library declaration checking enabled. |

These failures arose in experiment setup, instrumentation, identity handling, and published dependency declarations.
They require concrete implementation corrections rather than replacing the agreed editor architecture.

## TypeScript and dependency checking

PR5 consolidated the experiments into one exact root manifest and Bun lockfile.
Dependency checks and browser runs resolved packages inside that checkout, including one React installation.
A separate fresh clone reproduced the original PR5 combined runs without copied dependency folders or previous compilers.
The follow-up verified frozen installation with its committed package patch and reran affected suites in the existing checkout.

TypeScript 7.0.2 ran only as the type-checking CLI.
Babel and Recast parsed and edited source, and Bun built candidates; no TypeScript 7 programmatic compiler APIs were imported.
Temporary TypeScript 6.0.3 checked the same dependency tree with equivalent settings and reproduced the same seven TS2307 errors.
Downgrading the compiler did not resolve the missing declarations.

The published `@tailwindcss/node@4.3.3` tarball lacked seven modules referenced by its declarations.
The reproducible Bun patch changes only `dist/index.d.ts` and `dist/index.d.mts` and derives `DesignSystem` from the exact Tailwind dependency's loader return type.
No runtime file or package version changed, and no placeholder types, `any`, or diagnostic suppression replaced the missing declarations.
Full TS7 and temporary TS6 checks then passed with library checking enabled.
The patch remains local to this pinned package version and must be reevaluated when that dependency changes.
The [diagnosis and patch rationale](https://github.com/eren726290/orc-web/blob/7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc/experiments/integration/REPORT.md#full-typescript-check-diagnosis) and [final command results](https://github.com/eren726290/orc-web/blob/7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc/experiments/integration/evidence/followup/typescript/final-commands.json) preserve the evidence.

The full check covers the configured integration and PR4 project and imported implementation.
It does not type-check every inherited fixture or the untyped original proof runner as separate projects.
The follow-up reran thirty mapping checks, fourteen continuity workflows, nine real-component workflows, four integration workflows, and the new identical-instance workflow.
It did not rerun the original twelve assertions because that runner and dependency runtime files were unchanged.

The subsequently accepted [TypeScript tooling policy](typescript-tooling.md) makes TS6 the required V1 checker and TS7 a separate migration checkpoint.
PR5's TS7 results and temporary TS6 comparison remain historical evidence.
The V1 policy does not change these recorded runs or remove the Tailwind repair for the affected package version.

## What the browser runs establish

```text
Select a supported rendered layer
→ resolve its authored source owner
→ parse and change source
→ compile Tailwind and build React
→ render and validate the candidate
→ commit source and bindings as one command
→ verify Undo/Redo and saved-state reopen
```

PC runs used installed Chrome with `channel: "chrome"` and `headless: true`.
They exercised real browser rendering, computed styles, clicks, keyboard interaction, and synchronous candidate failures.
Headless operation is an ordinary automation method, but these fixtures are not the completed editor interface.
[Browser support](browser-support.md) defines the visible-browser and platform verification still required.

## Remaining limits

- Automatic editable-layer discovery for arbitrary React programs, computed classes, external data, and unsupported ownership patterns.
- Complete Base UI/shadcn recognition and package-internal edit ownership.
- General source-identity reconciliation after Code Apply and formatting or source movement in command-metadata mode.
- Arbitrary Only this closures, module graphs, and initially identical-instance copying.
- Preserving arbitrary React hook state, focus, scroll, and animation progress across candidate replacement.
- Frame-local CSS isolation and portal placement alongside the actual editor controls.
- Later asynchronous errors, arbitrary component side effects, and Motion timing or animation correctness.
- The real Properties/Layers interface, command engine, portable `.orc` persistence, export implementation, and MCP adapter.
- Visible complete-editor verification on Fedora and Windows Chrome.

The original Debian screenshot had missing emoji glyphs although source and DOM preserved Unicode.
Fedora screenshots rendered the tested glyph correctly; that is not a general portable-font guarantee.

## Implementation decision

Continue with Babel/Recast ownership discovery, command-owned identity, supported local copying, and explicit Edit source fallbacks.
Keep source and instance inputs authoritative and pass Canvas, Code Apply, and future MCP mutations through one command engine.
Unsupported values lose only the controls that cannot resolve a reliable owner; supported siblings and values remain editable.
Use ordinary props, static class strings, local imports, and keyed sample data when authoring foundations intended for visual iteration.

Build and verify the actual editor workflow next using [React source bindings](react-source-bindings.md), [Editable React components](../interface/react-components.md), and the [command engine](command-engine-and-history.md).
The tests support this implementation direction; they do not require adopting another editor's application architecture.
MCP server and tool design remains the final stack discussion.

## Reproduction reference

The runnable experiments and lockfile live in PR5 at the reviewed commit, not on this documentation-only branch.
These are PR5's original script names; `check:types` at that commit invokes TS7, while future V1 application scripts follow the TS6 policy.
In a separate PC checkout of that commit with Bun, Node, and Google Chrome installed, use:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
bun run check:types
bun run check:source-types
bun run proofs:existing
bun run proofs:integration
bun experiments/integration/identical-instances.ts
```

These commands are a reproduction reference, not a request to repeat passing suites before continuing documentation work.
Rerun affected checks when their source, dependency versions, or unresolved behavior changes.

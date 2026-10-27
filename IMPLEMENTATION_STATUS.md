# ORC-web implementation status

Last updated in the Pen branch: 2026-10-26.
Current stage: ordinary intrinsic Fit/Fill, including shared intrinsic Columns through the approved native wrapper, is verified on Fedora in both pinned browser versions and application modes.
The [current checkpoint](#ordinary-intrinsic-column-wrapper-checkpoint) records evidence and remaining integration limits.
Ordinary Absolute Position participation, per-axis Fixed/Fit, bounded cross-axis Fill and the earlier single-grow main-axis Fill remain verified checkpoints.
General Fill, complete sizing and Constraints, and the remaining V1 application are still unfinished.
This overview describes this checkout and links to reviewed evidence from the PC experiments.

## Pen branch checkpoint

The approved [Pen extension](doc_v1/interface/pen-tool.md) has portable version-1 records, a pinned guarded WASM adapter, human drawing/editing/history/save, compatible source/paint edits and bounded proportional transforms.
Focused development and built Chrome checks cover native flow, transformed/nested mapping, lifecycle, refused candidates and standalone SVG.
The [measured synchronous solver blocker](backlog/pen-integration.md#measured-solver-blocker) led to a dedicated Worker using the unchanged verified WASM.
Input remains responsive while a large-path numerical preview can still take hundreds of milliseconds.
The current-source integration ledger remains the completion authority.
The [final branch report](plans/pen-final-report.md) records the passed checks, matched source identities, measured latency and remaining product/integration boundaries.
The [progress record](plans/pen-progress.md) and runnable ledgers retain staged evidence and reproduced failure controls.
General SVG tooling, product exporters, clipboard duplication, Windows and future MCP Pen operations remain separate unfinished work.
The ordinary layout checkpoints below describe the base; they do not certify the new Pen extension or the main checkout's concurrent constraints/frame-controls changes.

## Current state

| Area | Implementation status | Evidence or contract |
| --- | --- | --- |
| Application foundation and startup | Implemented combined Bun/Vite development launch and built-app serving; Linux startup failure cleanup, normal shutdown, and failed-save shutdown recovery pass focused process checks. | [Launcher](scripts/dev.ts), [backend](server/start.ts), [lifecycle check](scripts/runtime/check-lifecycle.ts). |
| Development tooling | Selected anti-slop rules and Fallow CLI configured; required TypeScript 6, lint controls, formatting and build pass on Fedora; reusable isolated TS7 comparison passes both configured application scopes. | [Scaffold verification](SCAFFOLD_VERIFICATION.md), [TS7 checkpoint](SCAFFOLD_VERIFICATION.md#reusable-ts7-checkpoint-2026-10-15), [remaining editor tooling](backlog/development-tooling.md). |
| Editor workspace, Layers, Properties, and Code | In progress; Dashboard/tabs, selection, basic Properties previews, text editing, Code Apply/Discard, draft safeguards, panel resizing, in-place Layer naming, and atomic subtree deletion pass focused development/built checks. | [Editor workflow](scripts/e2e/editor/check-editor.ts), [panel check](scripts/e2e/editor/check-panels.ts), [naming check](scripts/e2e/editor/check-layers.ts), [deletion check](scripts/e2e/editor/check-deletion.ts). |
| Tokens, layout, constraints, and canvas transforms | In progress; ordinary movement, single Flex reordering/reparenting, read-only parent-controlled positions, Free/Row/Column switches, Row wrapping, frame Padding, Gap gestures, alignment/distribution, Absolute Position participation, Fixed/Fit sizing, bounded cross-axis Fill, and bounded nowrap multiple-child main-axis Fill sharing, ordinary per-row wrapped Fill and intrinsic Fill including shared Columns pass focused development/built checks; general Fill and constraint controls, group reparenting, resize/rotation handles, and Tokens remain pending. | [Movement check](scripts/e2e/editor/check-movement.ts), [position checkpoint](#parent-controlled-position-checkpoint), [layout checkpoint](#ordinary-frame-layout-checkpoint), [wrapping checkpoint](#ordinary-row-wrapping-checkpoint), [Padding checkpoint](#ordinary-frame-padding-checkpoint), [Gap checkpoint](#ordinary-frame-gap-checkpoint), [alignment checkpoint](#ordinary-frame-alignment-and-distribution-checkpoint), [participation checkpoint](#ordinary-absolute-position-checkpoint), [sizing checkpoint](#ordinary-fixedfit-sizing-checkpoint), [cross-axis Fill checkpoint](#bounded-cross-axis-fill), [single-grow main-axis Fill checkpoint](#bounded-single-grow-main-axis-fill), [shared Fill checkpoint](#ordinary-nowrap-fill-sharing-checkpoint--2026-10-14), [wrapped Fill checkpoint](#ordinary-wrapped-row-fill-checkpoint), [atomic check](scripts/e2e/editor/check-atomic.ts), [layout projection limits](backlog/native-layout-projection.md), [accepted workspace](doc_v1/interface/workspace-and-canvas.md). |
| Selected-frame Preview | In progress; ordinary frames retain their native sizing and saved defaults, isolate temporary form inputs and scrolling, restore Edit selection/pan/zoom, and preserve Code drafts and document/history in focused development/built Chromium checks. React components, portals, Motion, and supported-platform verification remain pending. | [Preview](src/editor/preview/Preview.tsx), [native workflow check](scripts/e2e/editor/check-preview.ts), [accepted Preview](doc_v1/interface/workspace-and-canvas.md#selected-frame-workflow). |
| Shared commands, application Undo/Redo, and project saving | In progress; authoritative sessions, revision checks, command history, save/reopen, independent projects, existing-save recovery, failed first Save/Save as recovery, and exclusive locks pass focused checks on Linux. | [Services](server/projects/projects.ts), [pending-response history check](scripts/e2e/editor/check-history.ts), [saving regression check](scripts/e2e/projects/check-saving.ts), [saving contract](doc_v1/architecture/orc-workspace-bundle.md). |
| Ordinary HTML/CSS/SVG authoring | In progress; reproduced SVG geometry/source disagreement, lost explicit line breaks and inline separators, and invalid SVG render acceptance are corrected and pass focused development/built checks; complete V1 source support remains pending. | [Source service](server/source/html.ts), [importer](src/editor/code/html-import.ts), [rendering regression check](scripts/e2e/rendering/check-rendering.ts), [Code workflow check](scripts/e2e/editor/editor-source.ts). |
| React source editing and component preparation | Production integration not started; bounded experiments passed in Fedora Chrome. | [Reviewed source-editing evidence](doc_v1/architecture/react-source-editing-validation.md#evidence-by-pr). |
| MCP server and tools | Not started; 28 tool responsibilities and core JSON contracts are documented. | [MCP status](doc_v1/mcp/mcp-server.md#status), [tool index](doc_v1/mcp/tools/README.md). |
| Background Chrome validation, screenshots, and exports | Initial reusable browser service prepares ordinary HTML; complete render-input validation and product exports remain pending. | [Rendering service](server/rendering/rendering.ts), [export contract](doc_v1/import-export/export.md). |
| Complete application on Fedora and Windows | No complete application verification result yet. | [Browser support and verification](doc_v1/architecture/browser-support.md). |

## Verified experiments

The reviewed PR1–5 reports establish bounded source ownership, selection continuity, a real Base UI-flavored shadcn composition, supported Only this copying, rejection controls, and saved-source reproduction on Fedora Google Chrome.
The latest reviewed PR5 commit is `7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc`.
The [validation record](doc_v1/architecture/react-source-editing-validation.md) links immutable reports, tested versions, commands, corrected failures, and remaining limits.
These results apply to those experiments; full editor integration and Windows checks have no recorded passing result.

## Current open work

Application implementation is the immediate work; passing a foundation slice does not complete V1.
The scaffold records exact direct dependency pins and startup configuration under the [stack record](backlog/stack-proposal.md).
The current `dev` command starts Bun and Vite together.
Shadcn/lint awaits editor tokens and component contracts.
The Chrome paths supplied from the previous session are absent in this environment, and the Fedora RPM inventory reports no installed `google-chrome-stable` package.
Managed Chrome for Testing is now available for explicit executable-path checks, including the [alignment workflow](#ordinary-frame-alignment-and-distribution-checkpoint).
The default installed-stable-Chrome scaffold check and Windows verification remain pending; Chromium and earlier Codex @Browser smoke checks passed.
Detailed tool value grammars, resource-transfer fields, and SDK integration are tracked in the [MCP implementation backlog](backlog/mcp/command-contracts.md).
Resolve those details when implementing the corresponding services.
Record a blocker here when an actual failure prevents the next checkpoint, with a link to its diagnosis.

### Current verification records

The foundation, panel, bundle-preservation, and lifecycle checks run real application processes rather than restating implementation functions.
Ignored `artifacts/editor/foundation.json` and `panels.json` record the tested commit, working-source hashes, command, platform, browser version, and outcomes.
Screenshots and Playwright traces are saved beside those records.
Editor checks use Playwright Chromium, with managed Chrome for Testing also verified for the latest layout, wrapping, Padding, Gap, and alignment workflows.
Earlier in-app Browser inspection remains scoped to its recorded checks; these results do not certify an installed stable Chrome package or Windows behavior.
Earlier foundation evidence records `e0f5b46`; later evidence uses source hashes to identify the tested editor and folder-organization changes included in this checkpoint.
The strict saved-data check rejects unsupported fields without changing original bundle bytes or the active document.
Full asset, token, component, layout, and binding schema integration is still required; that rejection guard is not full resource support.
`bun run check:saving` and `bun run check:rendering` retain the completed subagent regression checks.
Ignored `artifacts/editor/bundle-saving-verification-result.json` and `rendering-verification-result.json` record their inputs, source hashes, screenshots, traces, and outcomes.
Saving fault controls use POSIX permissions and file-size limits; equivalent Windows failures remain unverified.

### Known implementation follow-ups

Failed first Save and Save as now remove only their operation-owned empty destination so retrying the same name succeeds.
Unexpected destination contents remain preserved.
Existing locks are refused without automatic stale-lock deletion; [safe lock recovery](backlog/project-lock-recovery.md) tracks the remaining orphan-lock limitation.
The original save, lock, and rendering failures remain recorded in ignored `artifacts/editor/bundle-save-probe-result.json`, `bundle-lock-probe-result.json`, and `render-probe/result.json`.
The SVG extractor now imports the already installed HTML grammar directly; initial JavaScript falls from about 708 kB to 349 kB before gzip, and the existing Code window chunk loads editor support when needed.
The current build has no chunk-size warning; [the dependency-boundary record](backlog/source-parser-bundle-size.md) retains the equivalence checks and remaining supported-browser timing work.
The panel regression now verifies aligned percentage-sized selection outlines without session polling.
Its request teardown waits for pending handlers and exits successfully in development and built modes.
Ordinary Layer naming and subtree deletion passed independent parent verification.
Atomic ordinary batches, CSS removal, and reorder/reparent passed independent development and built Chromium verification, including whole-command rollback, exact Undo/Redo, and save/reopen.
The review reproduced and corrected disappearing children after reparenting into Text, Image, SVG, or void HTML elements; the same parent-capability check now protects insertion.
`bun run check:atomic` records 232 inputs and 20 check groups in ignored `artifacts/editor/atomic-verification-result.json` with frozen source hashes.
A separately rerun native CSS probe passed 346 assertions across 76 fixtures while retaining the counterexamples recorded in [layout projection limits](backlog/native-layout-projection.md).
General Fill, RTL conflict handling, imported-margin constraints, and author transform ownership remain open; no Canvas geometry controls were implemented by that research leaf.
Native Preview corrected a reproduced input-renderer crash, native form/link navigation away from the editor, and collapsed clipping-ancestor layout that moved a selected nested frame offscreen.
An independent browser review passed ten targeted cases across development and built Chromium after the fixes; full React/Motion and supported-platform verification remain pending.
The broader editor check now waits for active intercepted requests during teardown without waiting for a request that never arrived.
Ignored `artifacts/editor/layers-verification-result.json`, `deletion-verification-result.json`, and `preview-verification-result.json` record the tested source, commands, browser, screenshots, traces, and results.
Ignored `artifacts/parser-review/parser-probe.json` records 40 parser fixtures, exact extraction observations, installed versions, source hashes, and measured production bundle graphs.
Main V1 implementation continues with layout and canvas controls, resources, and React integration.

### Paused after subagent review

The user requested a stop after reviewing completed subagent work on 2026-10-08.
The atomic-command and native-layout research leaves finished, passed independent parent checks, and released their ownership leases.
The final integration checks passed: `bun run build`, `lint`, `check:format`, `check:atomic`, `check:editor`, `check:deletion`, and `check:rendering`.
The build includes both TypeScript checks.
Fallow dead-code and health scans exited successfully with zero effective errors; seven planned unused dependencies and 78 static-estimated CRAP warnings remain.
These static coverage estimates do not measure the recorded E2E coverage.
Ignored `artifacts/editor/stopping-codebase.json` and `stopping-health.json` retain those results.
The completed checks use Chromium on Linux; installed Chrome and Windows remain unverified.
No Canvas geometry feature was started, and resumed changes remain uncommitted on master.
Resume from the layout projection limits above before claiming general layout support.

### Resumed keyboard and clipping work

The persistent V1 build resumed on 2026-10-09.
The missing ArrowRight movement was reproduced in the real editor before implementation.
Ordinary Free and Absolute objects now nudge by 1 px or Shift+8 px in unzoomed units, preserving supported authored percentage, calculated, Start/End/Both/Center relationships.
Compatible selected objects move atomically, with overlapping selected descendants displaced once through their selected parent.
One participating Row/Column child reorders by authoritative sibling order, including wrapped Rows and excluding hidden or Absolute siblings from flow slots.
Text, Properties, Code, focused dialogs, and Preview retain their own keys.
Queued movement waits for the acknowledged native revision, and immediate Undo follows those completed commands.
The final parent run passed 22 check groups and 292 recorded actions across development and built Chromium with unchanged before/after source hashes and no browser errors in `artifacts/editor/movement-verification-result.json`.
Four earlier worker runs are retained in `artifacts/editor/movement-summary.json`; the initial failure is retained in `movement-initial-failure-result.json` beside them.
Fallow found three new functions above the configured limits during implementation; routing and offset handling were simplified without suppression, and `artifacts/editor/keyboard-health-final.json` reports zero effective errors.
Its remaining CRAP warnings use static coverage estimates and do not measure the recorded browser tests.

Movement through transformed or CSS-zoomed ancestors, logical-inset ownership, Grid or transparent layout parents, and source-controlled reverse/RTL Flex ordering currently require Code.
Own transforms are retained in the verified native case; general transformed conversion, held-key grouping, several-Flex reorder policy, pointer gestures, and React bindings remain open V1 implementation work.
The dedicated layout backlog now records independently verified bounded Fill and RTL Both correction candidates while retaining percentage-padding, changing-decoration, wrapping-basis, and imported-owner limits.
The ordinary frame Clip content control passed independent development and built Chromium verification through its existing saved flag and a shared atomic command.
The final parent run records 18 checks, 120 inputs, 42 rejected-request controls, 20 native clipping observations, unchanged source hashes, and no browser errors in `artifacts/editor/clipping-final-result.json`.
It covers retained child geometry/hierarchy and Layer access, ancestor clipping, locks, drafts, exact history, and save/reopen; imported React portals and supported-platform verification remain pending.
Reviewing its screenshot exposed a false transparent Fill value for a colored CSS background shorthand; [the Properties correction](backlog/properties-background-shorthand.md) records its reproduction and passing regression.
Properties now reads the effective authored color through the native CSS declaration parser and preserves background images and priority through preview, cancellation, commit, and exact Undo.
Ordinary node rendering uses one native style projection to preserve shorthand order and avoid reproduced React style-update warnings.
The final editor check passes in development and built Chromium with no browser errors in `artifacts/editor/appearance-verification-result.json`.
The final rendering, Preview, atomic, movement, clipping, history, and panel regressions pass alongside types/build, lint, formatting, and Fallow with zero effective errors.
Fallow retains 90 static-estimated CRAP advisories and seven reviewed planned dependencies; these estimates do not measure E2E coverage.
The atomic workflow's native hierarchy assertion now waits for the matching applied revision, correcting a retained stale-DOM timing failure without changing product history behavior.
The broader V1 application remains incomplete, and no commit, push, PR, MCP implementation, or supported-platform certification occurred in this resumed slice.

### Stopped after the latest subagent review

The user requested review, correction, and a good stopping point on 2026-10-09.
All three returned agents were independently reviewed, their checks rerun, and their ownership leases released.
No child agent remains running.

| Reviewed work | Parent result | Evidence |
| --- | --- | --- |
| Keyboard movement | 22 check groups and 292 recorded actions passed in development and built modes. | `artifacts/editor/movement-verification-result.json`. |
| Ordinary frame clipping | 18 check groups, 120 inputs, 42 rejection controls, and 20 native observations passed in development and built modes. | `artifacts/editor/clipping-final-result.json`. |
| Native layout research | 7,544 assertions across 1,288 fixture states passed; bounded CSS proposals and negative controls remain research, without editor integration. | [.unlazy research report](.unlazy/v1-resume/reports/layout-correction.md); `artifacts/editor/layout-correction-2026-10-08T19-57-37-968Z/measurements.json`. |

The review corrected the false Fill value and duplicate React/native background style updates, with the [original failures and regression](backlog/properties-background-shorthand.md) retained.
It also corrected test synchronization around clipping acknowledgements and atomic Redo's rendered revision.
The final editor, rendering, Preview, atomic, movement, clipping, pending-history, and panel checks passed, as did types/build, lint, formatting, and Fallow's configured gates.
No unresolved failure remains in those final checks.
The Fallow script-review guide surfaced no structural decisions; its empty judgment validation was current and rejected no anchors, which does not independently certify behavior.
The stopping review record is `artifacts/editor/subagents-stop-review.json`.
At that checkpoint the recorded executable source hashes matched the checkout; only `scripts/README.md` had changed after the browser runs.
The runs used Playwright Chromium 153.0.8010.12 on Linux.
Installed Chrome, Windows, general Fill controls, and React component integration remain unverified or unfinished as recorded above.
Fallow's 90 static-estimated CRAP advisories and seven planned unused dependencies remain visible, with complexity and size thresholds unchanged.
Changes remain uncommitted on master, and full V1 completion remains open.
Implementation is paused here at the user's request.

### Feature and domain folder organization

The user requested organization of `scripts/`, `server/`, `shared/`, and `src/` on 2026-10-09.
62 existing files moved into feature and domain folders, preserving the current uncommitted implementation.
27 new local READMEs and the [root folder map](README.md#code-organization) describe ownership and where new files belong.
The browser, backend, and development entry points remain `src/main.tsx`, `server/start.ts`, and `scripts/dev.ts`.
Imports, lazy imports, CSS references, package script targets, browser importer builds, Fallow configuration, test subprocesses, and current documentation references use the new paths.
Package command names, dependencies, saved document contracts, and application behavior are unchanged.

Independent Organization runtime review and Organization domain review verified connected paths and folder responsibilities.
The domain review's stale tooling README reference was corrected.
Moving tracked files without staging reproduced an evidence-helper failure because Git still listed their deleted original paths.
The evidence helper now hashes existing checkout files, including new untracked destinations, without staging or discarding changes.
`artifacts/organization/evidence-before-fix.log` retains the failure.

The structure audit passed all 62 moves, 64 expected TypeScript syntax trees, all three unchanged CSS files, current local links, and two negative controls.
It permits only path edits plus the reviewed current-file filter in the evidence helper.
All six static/tooling commands and fourteen existing runtime/workflow commands passed after the moves.
Build includes both TypeScript checks; browser workflows used Playwright Chromium on Linux.
Fallow reports zero effective errors, the existing 90 static-estimated CRAP advisories, and seven planned unused dependencies.
Cyclomatic complexity 10 and function size 40 remain configured and pass.
The scoped organization ledger has four met gates, zero unmet gates, and zero abandonments.
`artifacts/organization/result.json`, `structure-result.json`, `static-result.json`, and `workflows-result.json` retain the migration map, source hashes, exact commands, logs, and outcomes.
Older evidence may refer to the source paths used at that run; current workflow evidence identifies the reorganized checkout.
Both review agents are finished.
The changes were uncommitted during verification and are included in this master checkpoint.
This checkpoint completes folder organization; full V1 and supported Chrome/Windows verification remain unfinished.

## Ordinary Free pointer movement checkpoint

The current uncommitted working tree adds Select dragging for selected and initially unselected ordinary Free objects through the existing CSS movement and shared command services.
Frozen starting CSS prevents repeated preview updates from accumulating offsets.
Escape restores the original rendering without changing applied document revision, and release submits one command with exact Undo/Redo.
Pointer capture starts at the drag threshold so ordinary double-click text editing continues to work.
Changes to revision, selection, tool, zoom, or busy state cancel active movement.
Zoomed dragging preserves unscaled CSS coordinates, and cancelling the Code draft safeguard preserves selection, draft, document, and history.
Movement validation runs after the drag threshold so holding a Flex child for selection creates no movement warning.
The initial absent unselected drag and premature Flex warning were reproduced through the running editor before their corrections.
Window pointer release/cancellation and blur also clear pending gestures so a released pointer cannot resume after a delayed safeguard.

`bun run check:movement` passed all 46 recorded checkpoints in development and built modes using Playwright Chromium 153.0.8010.12 on Linux.
Its [result](artifacts/editor/movement-verification-result.json) records identical before/after source hashes, source commit `cfa5f82`, uncommitted source hashes, inputs, traces, and screenshots.
`bun run check:editor` and `bun run check:panels` also passed both modes.
TypeScript, build, lint, formatting, Fallow health, and Fallow dead-code checks passed.
The health report retains existing estimated-coverage advisories; no complexity suppression or threshold change was introduced.

This does not complete the accepted gesture contract.
Frame reparenting and destination drop slots, resize/rotation handles, broader gesture edge cases, and supported-platform verification remain tracked in [canvas pointer gestures](backlog/canvas-pointer-gestures.md).
MCP remains unimplemented until the application is complete.

## Current-parent Flex pointer placement checkpoint

A single ordinary Flex child now previews a drop slot within its current Row, Column, or wrapped Row parent.
Temporary receiving-frame outlines and insertion lines show that slot without becoming saved design nodes.
The planner uses frozen native browser bounds and the current canvas scale, while the preview projects temporary child order through the canonical-node renderer.
Release submits the existing reorder command; no new protocol, dependency, saved geometry, or independently editable Layers hierarchy was added.
Authored child CSS, sizing, identity, parent, and non-flow sibling order are preserved.
Dropping in the current flow slot creates no revision or Undo entry.
Escape restores the original order and retains selection without changing applied state.

The [movement workflow](scripts/e2e/editor/check-movement.ts) verifies forward/backward placement, Row, Column, wrapped Row, zoom, native live preview, cancellation, exact one-step Undo/Redo, and original-slot no-op behavior.
Its [46-checkpoint result](artifacts/editor/movement-verification-result.json) passed development and built modes with identical before/after source hashes using Chromium 153.0.8010.12 on Linux.
The absent Flex preview was reproduced and retained in [baseline evidence](artifacts/editor/movement-flex-pointer-baseline-result.json).
Build, TypeScript, lint, formatting, Fallow health, Fallow dead-code, and the development/built ordinary editor workflows passed.
Fallow reports no unused files/exports or cycles, and retains the seven planned-dependency warnings.
`bun run check:preview` also passed development and built modes after the pointer changes.
Three scoped Flex checkpoint gates passed; this certifies the stated slice rather than full V1.
Cross-frame placement, source-controlled layout boundaries, resizing, and supported Chrome/Windows checks remain open in [the gesture record](backlog/canvas-pointer-gestures.md).
The work remains uncommitted on master.

## Pointer selection after draft Discard

The real editor reproduced a selection failure when the pointer was released before choosing Discard in the Code draft dialog.
The draft was discarded but the requested new selection was lost.
The [baseline result](artifacts/editor/movement-pointer-draft-baseline-result.json) retains that exact failure and its trace.
Pointer startup now uses the existing guarded workspace selection for a new target before checking whether the drag is still active.
Discard completes selection after release, while the released gesture stays cancelled.
The retained E2E check verifies the new selection, removed draft, unchanged native position, and unchanged applied document and history after further pointer movement.
Existing Cancel safeguards continue to pass.

The movement check passed 46 checkpoints across development and built Chromium, and the editor and Preview workflows also passed both modes.
Their recorded executable source hashes were checked against the current worktree.
Build, TypeScript, lint, formatting, and Fallow checks passed with complexity 10 and function size 40 unchanged.
Fallow reports zero enforced errors, 99 static-estimated coverage advisories, and the seven planned unused dependencies.
Three scoped safeguard gates passed with zero unmet gates or abandonments.
The change remains uncommitted on master; full V1 and installed Chrome/Windows verification remain unfinished.

## Ordinary pointer reparenting checkpoint

Single ordinary objects and nested frames now preview their receiving Free/Flex frame or workspace root through the canonical renderer.
Release changes parent, sibling order, placement, and applicable constraint conversion together through one existing atomic command.
Free conversion preserves the dropped native box, authored margins, and supported End/Both/Center relationships against the destination's inner border edge.
Flex conversion preserves tested Fixed frame dimensions, Fit text dimensions, and existing same-axis Fill behavior without freezing Fill into Fixed.
The checks resize receiving parents to verify the preserved constraint and Fill relationships rather than checking CSS strings alone.
Selected ancestors are revealed after reparenting and history changes without creating document history.

Real editor checks reproduced and corrected accidental flattening out of ordinary HTML wrappers, hidden selected rows, stale unavailable notices, Fixed frame shrinkage, and nonlinear constraints misclassified as Center.
The original failures remain in `artifacts/editor/movement-reparent-wrapper-baseline-result.json`, `movement-reparent-notice-baseline-result.json`, `movement-reparent-fixed-size-baseline-result.json`, and `movement-reparent-sizing-fixed-result.json`.
The [final movement result](artifacts/editor/movement-reparent-verification-result.json) passed 92 checks and 616 recorded inputs across development and built modes using Chromium 153.0.8010.12 on Linux at source commit `cfa5f82` plus recorded uncommitted hashes.
Before/after movement hashes match, and movement, editor, Preview, and atomic result hashes were checked against the checkout at this checkpoint.
Screenshots of Free frame and Flex Fill previews were visually reviewed.
Build, TypeScript, lint, formatting, health, and dead-code checks passed, and all three scoped reparenting gates passed.
Health retains 118 static-estimated CRAP advisories and no enforced errors; dead-code analysis retains seven planned unused dependencies and no unused files/exports or cycles.
Cyclomatic complexity 10, cognitive complexity 15, and function size 40 remain unchanged.

Screenshot review also exposed Properties displaying a Fill width as Fit; the following checkpoint records its correction.
Cross-axis Fill conversion, general Fill controls, source-controlled constraint expressions, broader transforms, and several-object reparenting remain open V1 work in [the gesture record](backlog/canvas-pointer-gestures.md).
No commit, push, MCP implementation, installed Chrome verification, or Windows verification occurred in this checkpoint.

## Sizing ownership correction and stopping checkpoint

The real editor reproduced Fill and both-edge-controlled dimensions incorrectly displayed as Fit.
It also reproduced an explicit cross-axis stretch becoming intrinsic `max-content` after reparenting when the original parent had different alignment.
The failures remain in `artifacts/editor/movement-sizing-owner-baseline-result.json`, `movement-cross-stretch-baseline-result.json`, and `movement-cross-fill-placement-baseline-result.json`.

Properties and pointer placement now share native Flex sizing recognition under [layout ownership](src/editor/layout/README.md).
Properties reads the committed native canvas after document or selection changes and labels supported Fill and both-edge-controlled dimensions accurately while keeping them read-only.
Explicit child stretch overrides the parent's alignment, while cross-axis automatic margins retain intrinsic sizing.
The correction adds no saved geometry or second sizing authority.
General sizing-mode controls and broader ownership mappings remain unfinished V1 work.

The [final movement result](artifacts/editor/movement-sizing-ownership-result.json) passed 100 checks and 644 recorded inputs across development and built Chromium 153.0.8010.12 on Linux.
It verifies Fill/Constraints/Fit labels, read-only controlled fields, retained native dimensions, explicit stretch, automatic margins, reparenting, exact history, and save/reopen.
Before/after movement hashes match, and the final movement, editor, Preview, and atomic result hashes match the executable checkout.
Fill and intrinsic automatic-margin screenshots were visually reviewed.
All three scoped sizing gates passed after correcting formatting, a synchronous effect warning, and two functions above complexity 10 without suppressions or threshold changes.
Build, TypeScript, lint, formatting, health, and dead-code checks passed.
Health reports zero enforced errors and 123 static-estimated CRAP advisories; dead-code analysis retains seven planned unused dependencies and no unused files/exports or cycles.

The user requested a good stopping point after fixing current issues, with no subagents started.
No new subagents were started, and the agent inventory confirms no child agent is running.
Implementation was paused here with changes uncommitted on master.
That checkpoint was subsequently committed and pushed as `9793376`, followed by the parent-position regression checkpoint `2f837c2`.
Full V1, general layout/constraint controls, MCP, installed Chrome verification, and Windows verification remain unfinished.
The [gesture record](backlog/canvas-pointer-gestures.md) retains the remaining ownership and gesture work.

## Parent-controlled position checkpoint

The real browser reproduced editable X/Y fields for participating Flex children at commit `2f837c2`.
The retained baseline is [the failed development result](artifacts/editor/movement-parent-position-baseline-current-result.json).
Properties now shows native parent-relative coordinates read-only for ordinary Row, Column, and wrapped Row children.
It explains which parent controls position and offers Select parent through the existing Code draft safeguard.
Own and ancestor locks preserve this inspection action while design-editing fields remain disabled.
Native box observation updates the readout after responsive layout changes, with borders, padding, and canvas zoom accounted for.
Unsupported transformed coordinates show Edit source without replacing authored CSS or creating history.
Loose roots and Absolute children retain their existing position controls.
Native sizing-owner recognition remains shared with pointer placement, and coordinate-transform detection is shared rather than duplicated.

The test fixture now waits for its applied revision to reach the canvas before inspecting a backend mutation.
The broader pending-history test also exposed its assumption that Properties contains one fieldset.
It now checks the actual Content field's disabled state while the command acknowledgement is pending.
The original failing trace and screenshot are retained as `artifacts/editor/parent-position-regression-before-fix-trace.zip` and `parent-position-regression-before-fix.png`.

The [Chromium result](artifacts/editor/movement-parent-position-result.json) and [Chrome for Testing result](artifacts/editor/movement-parent-position-chrome-testing-result.json) each passed 106 checks with 680 recorded inputs across development and built modes.
Their browser versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
The checks cover read-only positions, native coordinates, parent selection, draft Cancel/Discard, locks, responsive layout, transformed-source boundaries, existing movement/reparenting, exact Undo/Redo, and save/reopen.
Interactive screenshots were visually reviewed, and [the independent inspection](artifacts/editor/parent-position-independent-inspection.json) verifies the displayed coordinates against native `offsetLeft` and `offsetTop`.
The Chrome for Testing run used this explicit command:

```sh
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_MOVEMENT_EVIDENCE=parent-position-chrome-testing bun run check:movement chrome
```

All four scoped gates passed after re-execution, with zero unmet or abandoned gates.
Build, TypeScript, lint, formatting, health, editor, Preview, atomic, panel, and pending-history checks passed.
The two movement results and the editor, Preview, atomic, and panel results have executable source hashes matching the current checkout.
Before/after movement and atomic source hashes also match.
[Health](artifacts/editor/parent-position-health.json) reports zero enforced errors and 126 static-estimated CRAP advisories; these estimates do not measure the E2E coverage.
[Dead-code analysis](artifacts/editor/parent-position-codebase.json) retains seven planned unused dependencies, with no unused files/exports, unresolved imports, or cycles.
No subagent was started, and the owned interactive browser and development app shut down successfully.
This checkpoint completes the parent-controlled position corrections; full V1 implementation continues.
The supplied installed stable Chrome path remains absent, and Windows verification remains pending.
The [gesture record](backlog/canvas-pointer-gestures.md#remaining-v1-work) retains broader layout ownership, source-binding, and gesture work.

## Ordinary frame layout checkpoint

The ordinary Free/Row/Column control is now implemented through one measured atomic batch.
Development and built Chromium checks cover native Fixed Free placement, retained Absolute participation, nested/wrapped frames, locks/drafts, exact history, and save/reopen.
Equivalent ordinary Code Apply retains canonical objects and history, with a real CSS declaration-order change retained as a negative control.
The earlier development/built layout runs each passed 60 checks with 74 recorded inputs before the review corrections below.
The existing movement, editor, Preview, atomic, panel, and history regression gate also passed.
The previous formatting failure is corrected.
The [automatic-margin conversion](backlog/native-layout-projection.md#automatic-margin-correction) and [Code Apply repair failure](backlog/code-apply-identity.md#reproduced-and-corrected) now have focused corrections and retained E2E regressions.
The layout control also validates its native candidate before committing and restores its preview without sending a command when geometry cannot be preserved.
Keyboard activation and rejected previews now retain the layout button's focus.
The final [Chromium result](artifacts/editor/layout-verification-result.json) and [Chrome for Testing result](artifacts/editor/layout-chrome-testing-result.json) each passed 88 checks with 142 recorded inputs across development and built modes.
These runs cover automatic margins, zoomed geometry, native candidate rejection, source repair, source equivalence, locks/drafts, exact history, saving, and retained button focus.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
Both layout results and the movement, editor, Preview, atomic, and panel results match all 119 current source hashes in [the final source audit](artifacts/editor/layout-final-source-audit.json).
Recorded before/after hashes match in each result that captures both snapshots.
The final scoped runnable checks passed build, TypeScript, lint, formatting, health, both browser layout workflows, and the movement, editor, Preview, atomic, panel, and pending-history regressions.
Interactive Row, Free, and minimum-width Properties screenshots were visually reviewed against the supplied design references.
The final Tab/Space keyboard walk retained visible focus through Row and Column, with 44 px buttons and no clipped button content.
The scoped layout-control accessibility scan reported nine passes, zero violations, and zero incomplete checks; it does not certify the full application or screen-reader behavior.
[Health](artifacts/editor/layout-health.json) reports zero enforced errors and 138 static-estimated CRAP advisories, which do not measure E2E coverage.
[Dead-code analysis](artifacts/editor/layout-codebase.json) retains seven planned unused dependencies, with no unused files/exports, unresolved imports, or cycles.
Verification ran against base commit `3182ff8a70402f7bcafcaf2e57c79c7acfa86155` plus the recorded working-source hashes.
The subsequent status update changes documentation only.
All five scoped gates are met, with zero unmet or abandoned gates.
The owned interactive browser and development app shut down successfully, and no subagent was started.
Work stops at this checkpoint at the user's request; full V1 remains in progress.
Repeat the focused workflow with `bun run check:layout` after building.
The Chrome for Testing command is:

```sh
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_LAYOUT_EVIDENCE=chrome-testing bun run check:layout chrome
```

This verifies the ordinary layout-control path; arbitrary backend style batches still lack whole-document native candidate validation.
The supplied installed stable Chrome path remains absent, and Windows verification remains pending.
At that stopping checkpoint, general Fill and constraint controls, Row wrapping controls/persistence across Column, React source bindings, and [meaningful Code Apply identity reconciliation](backlog/code-apply-identity.md) remained required V1 work.

## Ordinary Row wrapping checkpoint

Properties now exposes Wrap to next line for an ordinary Row frame.
One parent-only atomic command changes wrapping while preserving canonical child order, child styles and locks, Absolute participation, and clipping.
The frame's authored CSS retains its Row choice through Column, Free, and save/reopen without saved row membership or copied geometry.
The control uses the existing draft safeguard and native candidate preview, with keyboard focus retained after completion.
The [projection record](backlog/native-layout-projection.md#row-wrapping-implementation) documents the mapping and reproduced failures.

The original Row-to-Column-to-Row path lost wrapping.
Review also reproduced incorrect ownership for unresolved flex-flow shorthands and unsafe conversion of CSS-wide wrapping keywords.
Their failing E2E records remain under ignored artifacts/editor/ beside the corrected runs.
Unresolved shorthand direction or wrapping now requires Code, including uppercase VAR(...), env(...), and single-longhand overrides.
These are implementation corrections within the accepted contract; no faulty doc_v1 architecture was established.

The final [Chromium result](artifacts/editor/layout-wrapping-result.json) and [Chrome for Testing result](artifacts/editor/layout-wrapping-chrome-result.json) each passed 168 checks with 280 recorded inputs across development and built modes.
Coverage includes native line formation, width edits, item/row gap, Fixed card widths, existing 90 px Fill bases and per-line min/max sharing, Fit height, Fixed-height clipping, locks, drafts, history, source ownership, empty Rows, and reopening a Column with its retained Row choice.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
The final build, TypeScript, lint, formatting, health, movement, editor, Preview, atomic, clipping, panel, and pending-history commands passed.
All eight audited workflow results match the 119 source files captured at this wrapping checkpoint in [the final source audit](artifacts/editor/wrapping-final-source-audit.json).
Before/after source hashes match wherever the workflow records both snapshots.
Verification uses base commit 4a6e71aec282186b9d4a923bec6e49e995aa6328 plus those working-source hashes; this checkpoint remains uncommitted.
The subsequent status and backlog edits change documentation only.

The [minimum-width screenshot](artifacts/editor/wrapping-interactive-minimum.png) and [one-row screenshot](artifacts/editor/wrapping-interactive-off.png) were visually reviewed.
At a 240 px Properties width, the checkbox has a 44 px clickable label, no horizontal panel overflow, and visible focus after Space activation.
The scoped control accessibility scan reports 12 passes, zero violations, and zero incomplete checks; full-application and screen-reader verification remain pending.
[Health](artifacts/editor/wrapping-health.json) reports zero enforced errors and 141 static-estimated CRAP advisories, which do not measure E2E coverage.
[Dead-code analysis](artifacts/editor/wrapping-codebase.json) retains seven planned unused dependencies and reports no unused files/exports, unresolved imports, or cycles.
The owned review browser and development app shut down successfully, and no subagent was started.

Repeat the focused workflow after building:

```sh
ORC_LAYOUT_EVIDENCE=wrapping bun run check:layout
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_LAYOUT_EVIDENCE=wrapping-chrome bun run check:layout chrome
```

General Fixed/Fit/Fill controls and wrapped Fill projection, constraints, Tokens, React source bindings, complete exports, and backend preparation for future agent layout commands remain required V1 work.
Installed stable Chrome and Windows remain unverified.

## Ordinary frame Padding checkpoint

Properties now exposes paired Horizontal and Vertical padding for ordinary frames, with an Individual sides disclosure for Top, Right, Bottom, and Left.
Mixed opposite values remain unchanged until a deliberate assignment, and expanding the controls changes no document state or history.
Numeric typing previews native reflow; Escape cancels, invalid input retains the last valid preview, and Enter or blur commits one parent-only batch and one Undo step.
Undo restores asymmetry, source declarations, and priorities exactly.
The control reuses the existing Properties field, draft safeguard, preview, and mutation paths without a new dependency or saved layout model.
The [projection record](backlog/native-layout-projection.md#ordinary-frame-padding) describes ownership, priority ordering, native decoration floors, and the reproduced issues.

Review reproduced paired-input misalignment at minimum panel width and valid small pixel edits becoming read-only after native exponent serialization.
Both failures were retained before their corrections and are covered by the final workflow.
A test fixture also retained a logical padding declaration between source-ownership cases; its reset now removes the previous fixture's padding declarations.
One broader verification run was interrupted by a development page reload immediately after a live Markdown edit.
Its [diagnosis](artifacts/editor/padding-document-reload-diagnosis.json), movement failure, screenshot, and trace remain preserved.
The complete affected command group passed again with all repository files frozen.
These are implementation and verification corrections; no faulty doc_v1 architecture was established.

The final [Chromium result](artifacts/editor/padding-verification-result.json) and [Chrome for Testing result](artifacts/editor/padding-chrome-result.json) each passed 48 checks with 116 inputs across development and built modes.
They cover asymmetric and decimal values, exponent notation, disclosure, live preview, Escape, invalid input, unchanged edits retaining Redo, shorthand priorities, source ownership, own/ancestor locks, child-lock preservation, Code drafts, Fit growth, Fixed-height clipping, exact history, and UI save/reopen.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
Both browser layout regressions also passed 168 checks with 280 inputs each.
Movement passed 106 checks with 680 inputs; clipping passed 18 checks with 120 inputs.
The editor, panel, and pending-history commands passed alongside build, TypeScript, lint, formatting, tooling, and health checks.
All eight audited workflow results and the interactive review match the 123 captured source files in [the final source audit](artifacts/editor/padding-final-source-audit.json).
Before/after hashes match wherever the workflow records both snapshots.
Verification uses base commit 4a6e71aec282186b9d4a923bec6e49e995aa6328 plus those working-source hashes; these changes remain uncommitted on master.
The subsequent status and backlog updates change documentation only.

The [paired controls](artifacts/editor/padding-final-manual-paired.png) and [expanded controls](artifacts/editor/padding-final-manual-expanded.png) were visually reviewed at a 240 px Properties width.
Paired inputs align, fields fit without horizontal overflow, and the native disclosure has a 44 px target and visible keyboard focus.
Direct Chrome typing also retained an editable numeric field after the small-value correction, and Undo restored the original asymmetric shorthand.
Each scoped accessibility scan reports 13 passes, zero violations, and zero incomplete checks; full-application and screen-reader verification remain pending.
[Health](artifacts/editor/padding-health.json) reports zero enforced errors and 145 static-estimated CRAP advisories, which do not measure E2E coverage.
[Dead-code analysis](artifacts/editor/padding-dead-code.json) retains seven planned unused dependencies and reports no unused files/exports, unresolved imports, or cycles.
All five scoped Padding gates are met, with no unmet or abandoned gates.
The owned interactive browser and app shut down successfully, and no subagent was started.

Repeat the focused workflow after building:

```sh
bun run check:padding
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_PADDING_EVIDENCE=chrome bun run check:padding chrome
```

At the Padding checkpoint, Gap gestures, alignment/distribution, Fixed/Fit/Fill controls, constraints, Tokens, React source bindings, complete exports, and backend preparation remained required V1 work.
Source-controlled padding remains available through Code until its supported visual owner exists.
Installed stable Chrome and Windows remain unverified.

## Ordinary frame Gap checkpoint

Ordinary Row and Column frames now expose one Gap value through typing, input arrows, input dragging, and canvas handles.
Properties and canvas handles share the same native numeric field, draft safeguard, temporary preview, and atomic command path.
Arrow keys adjust by 1, or 8 with Shift, with visible help beside the field.
A completed edit changes only the parent and creates one Undo step.
Escape, pointer cancellation, window blur, zoom changes, and a newer applied revision cancel an active drag.
Releasing the pointer while a Code draft dialog is open prevents that drag from resuming after Discard.

Review reproduced a stale field value being submitted after drag acknowledgement, which made Undo require two steps.
The numeric field now synchronizes from the latest applied value, including drag cleanup.
Native wrapped-row review also reproduced missing between-row handles and a drag being interrupted when reflow removed its original gap.
Temporary row bounds locate between-row handles, and the active input stays mounted until its pointer release finishes.
Zero-gap boundaries remain directly draggable.
The [projection record](backlog/native-layout-projection.md#ordinary-frame-gap) links the retained failures and describes ownership limits.
These fixes correct implementation behavior; no faulty doc_v1 architectural contract was established.

The final [Chromium result](artifacts/editor/gap-verification-result.json) and [Chrome for Testing result](artifacts/editor/gap-chrome-result.json) each passed 68 checks with 182 recorded inputs across development and built modes.
They cover all four editing paths, live preview, decimals and exponent notation, unchanged values, minimum zero, exact history, pending Undo, locks, Code drafts, source ownership, zoom, wrapped reflow, Fixed clipping, and UI save/reopen.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
Padding passed 48 checks with 116 inputs, layout passed 168 with 280, clipping passed 18 with 120, and movement passed 106 with 680.
Editor, panels, pending history, build, TypeScript, lint, formatting, tooling, health, and dead-code commands also passed.
All eight workflow results and the manual review match the 131 captured source files in [the final source audit](artifacts/editor/gap-final-source-audit.json).
Before/after hashes match wherever the workflow records both snapshots.
Verification identifies base commit 4a6e71aec282186b9d4a923bec6e49e995aa6328 plus those working-source hashes.
The Gap changes were subsequently committed on master as ad39ddbf3e49ef8536d2a3b31e5d0e1454f75a2c.

The [minimum panel](artifacts/editor/gap-final-manual-panel.png) and [focused handles](artifacts/editor/gap-final-manual-handles.png) were visually reviewed in managed Chrome for Testing.
The 240 px Properties panel has no horizontal overflow, and native handle inputs have 44 px targets and visible keyboard focus.
Manual typing and arrow previews created no revision, Enter committed once, and Undo restored the previous shared gap.
A browser regression reproduced insufficient number contrast at 4.19:1 before the text changed to the existing editor ink token.
The corrected number measures 17.28:1 on its normal background and at least 12.28:1 across the reviewed default, hover, and pressed states.
The scoped axe scan reports ten passes, zero violations, and one incomplete contrast rule covering three pseudo-element backgrounds.
The computed-color review resolves those three contrast checks; it does not establish full-application or screen-reader accessibility.
[Health](artifacts/editor/gap-health.json) reports zero enforced errors and 164 static-estimated CRAP advisories, which do not measure E2E coverage.
Cyclomatic complexity remains limited to 10, cognitive complexity to 15, and functions to 40 lines.
[Dead-code analysis](artifacts/editor/gap-dead-code.json) retains seven planned unused dependencies and reports no unused files/exports, unresolved imports, or cycles.
All five scoped Gap gates are met, with no unmet or abandoned gates.
The owned browser and application stopped, their port closed, and no subagent was started.

Repeat the focused workflow after building:

```sh
bun run check:gap
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_GAP_EVIDENCE=chrome bun run check:gap chrome
```

At the Gap checkpoint, alignment/distribution, general Fixed/Fit/Fill controls, constraints, Tokens, React source bindings, complete exports, and backend preparation remained required V1 work.
Source-owned Gap expressions and unequal axes retain their authored CSS and remain available through Code.
Installed stable Chrome, Windows, and screen readers remain unverified.

## Ordinary frame alignment and distribution checkpoint

Properties now provides nine physical packed positions and visible Packed and Space between choices for ordinary Row and Column frames.
The axes exchange with direction, while canonical sibling order and every child remain unchanged by an alignment edit.
One parent-only atomic batch updates the authored alignment declarations and preserves Gap, padding, unrelated CSS, shorthand precedence, and property priority.
Wrapped Rows pack their line group and align children within each line through native Flex CSS.
Space between retains Gap as the minimum and uses native start fallback for zero or one participant or insufficient free space.
The controls reuse the existing Code draft safeguard, temporary preview, applied-revision check, shared command/history path, and focus restoration.
Unresolved expressions, CSS-wide values, RTL, vertical writing modes, and reverse layouts retain source ownership and require Code.
Distribution remains independently editable when only cross-axis alignment belongs to source.

Review reproduced misleading source-ownership feedback when an external edit arrived while the draft-discard dialog was open.
The [failing regression](artifacts/editor/alignment-stale-message-baseline-result.json) retains that failure before the fix.
Preparation now rejects the older revision with "The layout changed. Try again." without sending a command or changing the current document, geometry, or history.
These changes correct implementation behavior; no faulty doc_v1 architectural contract was established.

The final [Chromium result](artifacts/editor/alignment-final-2-result.json) and [Chrome for Testing result](artifacts/editor/alignment-chrome-2-result.json) each passed 36 check groups with 228 recorded inputs across development and built modes.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
The checks cover all nine positions in both directions, named distribution, wrapped unequal-height children, overflow, hidden/Absolute exclusion, source ownership and priority, locks, drafts, stale preparation, rejected commands, pending Undo, focus, no-op Redo preservation, and UI save/reopen.
Gap passed 68 checks with 182 inputs, Padding passed 48 with 116, layout passed 168 with 280, movement passed 106 with 680, and clipping passed 18 with 120.
Editor, panels, pending history, build, TypeScript, lint, formatting, and tooling also passed.
[The source audit](artifacts/editor/alignment-final-source-audit.json) matches all 135 tested source files across nine workflow results and the independent browser review.
It independently checks 120 recorded parent-only alignment edits and confirms 15 owned application ports are closed.
The [archived foundation](artifacts/editor/alignment-final-archive/foundation.json), [panel](artifacts/editor/alignment-final-archive/panels.json), and [pending-history trace](artifacts/editor/alignment-final-archive/history-trace.zip) retain this checkpoint when later runs replace the default evidence files.
Verification identifies base commit ad39ddbf3e49ef8536d2a3b31e5d0e1454f75a2c plus the recorded working-source hashes.
Alignment changes and the separate requested AGENTS.md cleanup remain uncommitted on master.

The [minimum-width screenshot](artifacts/editor/alignment-manual-packed.png) and [distribution screenshot](artifacts/editor/alignment-manual-between.png) were visually reviewed against the supplied design references.
The 240 px Properties panel has no horizontal overflow, all eleven controls have targets of at least 44 px, and keyboard activation retains visible focus.
The scoped axe 4.12.1 scan reports nine passes, zero violations, and zero incomplete checks; it does not certify full-application or screen-reader accessibility.
[Health](artifacts/editor/alignment-health.json) reports zero enforced errors and 174 static-estimated CRAP advisories, which do not measure E2E coverage.
Cyclomatic complexity remains limited to 10, cognitive complexity to 15, and functions to 40 lines.
[Dead-code analysis](artifacts/editor/alignment-dead-code.json) retains seven planned unused dependencies, with no unused files/exports, unresolved imports, or cycles.
All five scoped alignment gates are met, with no unmet or abandoned gates.
The owned browser and application processes shut down, and no subagent was started.

Repeat the focused workflow after building:

```sh
bun run check:alignment
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_ALIGNMENT_EVIDENCE=chrome-2 bun run check:alignment chrome
```

General Fixed/Fit/Fill controls, constraints, Tokens, React source bindings, assets, complete exports, and backend layout preparation remain required V1 work.
The accepted account-menu and sidebar examples remain integration checks for the upcoming sizing work.
Installed stable Chrome, Windows, and screen readers remain unverified.

## Stopped after alignment and sizing preflight

Development is paused at the user's request on 2026-10-11.
No subagents, commit, or push were started during this checkpoint.
The alignment implementation and the separate requested AGENTS.md cleanup remain uncommitted on master.

The running sizing verifier failed because it retained a Width input that React replaced when native ownership measurement changed the readout from a number to Fill.
The [failed result](artifacts/editor/sizing-preflight-final-result.json), built-mode screenshot and trace, and [exact failed verifier](artifacts/editor/sizing-preflight-stale-handle.ts) retain that failure.
The verifier now resolves the current input on every poll.
An earlier verifier correction also waits for the acknowledged revision rather than assuming that a no-op command increments it.
These corrections changed the ignored research verifier, not application behavior.

The corrected [preflight result](artifacts/editor/sizing-preflight-verified-result.json) passes 19 rendering cases in each of development and built modes on Chromium 153.0.8010.12.
Both modes report zero browser errors and clean application shutdown.
The [preflight audit](artifacts/editor/sizing-preflight-final-audit.json) matches all 135 source files before and after the run, confirms both owned ports closed, and checks retention of the missing-control and stale-input failures.
The alignment source audit also still matches its nine workflow results and independent browser review; no application source changed after that checkpoint.

The preflight retains unequal-decoration and stale-factor counterexamples and verifies bounded native CSS candidates through the current renderer.
It does not implement Fixed/Fit/Fill controls or establish general Fill support.
The [sizing research record](backlog/native-layout-projection.md#ordinary-sizing-preflight-and-stopping-point) contains measured results, ownership limits, and the next implementation checks.
General sizing and constraints, Tokens, React integration, complete exports, and the other open V1 requirements remain unfinished.
Installed stable Chrome, Windows, and screen readers remain unverified.

## Ordinary Absolute Position checkpoint

Development resumed under the active V1 goal on 2026-10-11, and the user subsequently authorized subagents for review and verification.
The ordinary Flex child control uses the existing Free/flow conversions, explicit position CSS projection, draft safeguards, preview, and atomic history.
Turning it on captures the selected child's parent-relative box and removes its flow slot, Gap, and Fit contribution.
Turning it off clears active absolute offsets and returns the same child to its canonical sibling position.
Only the selected child's placement CSS changes; native parent and sibling reflow remains derived.
Source-owned expressions and unsupported coordinate relationships remain explicit Code boundaries.
The Constraints editor remains unfinished; this checkpoint verifies participation and existing position/size readouts.

The [missing-control baseline](artifacts/editor/participation-missing-control-baseline-result.json) records the absent workflow before implementation.
An initial browser run reproduced the control becoming unavailable after enabling Absolute Position.
The [failed workflow](artifacts/editor/participation-development-first-result.json) and [CSSOM diagnosis](artifacts/editor/participation-ownership-diagnosis.json) show that the reader rejected an inset shorthand synthesized from its own four longhands.
The reader now checks actual declarations and retains unresolved source expressions.

The [rejection baseline](artifacts/editor/participation-rejection-baseline-result.json) reproduced a checked checkbox and incorrect help text after a rejected command had already restored native flow.
A delayed ownership read captured temporary preview DOM during the backend's canonical refresh.
The control now cancels ownership reads while an action is pending and remeasures after completion or rollback.
The identical [focused probe](artifacts/editor/participation-rejection-probe.ts) passes [after the fix](artifacts/editor/participation-rejection-corrected-result.json), and the permanent workflow also retries on/off successfully after rejection.
An independent Chrome trace review separately corrected the verifier's synchronous checkbox assumption; it now clicks, waits for acknowledgement and rendering, and checks the resulting state.
The first combined regression run exceeded its 120-second runner budget; the complete sequential rerun passed with a 1200-second budget.
The failing verifier, traces, and interrupted investigation remain retained under artifacts/editor/.
These were implementation and verification corrections; no faulty doc_v1 architectural contract was established or changed.

The final [Chromium result](artifacts/editor/participation-verification-result.json) and [Chrome for Testing result](artifacts/editor/participation-chrome-result.json) each pass 36 check groups with 154 recorded inputs across development and built modes.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
Coverage includes Row/Column and wrapped reflow, parent padding/borders/scrolling, canvas zoom, ordinary element/Text/Image/SVG children, imported physical constraints, parent layout switches, locks, drafts, stale revisions, rollback/retry, pending Undo, and UI save/reopen.
Layout passes 168 checks with 280 inputs, movement 106 with 680, Gap 68 with 182, Padding 48 with 116, and alignment 36 with 228.
Pending property history, build, TypeScript, lint, formatting, tooling, health, and dead-code commands also pass.
The [final audit](artifacts/editor/participation-final-audit.json) matches all 138 current source files across seven workflow results, the corrected focused probe, and the independent manual review.
It independently checks 124 selected-child-only participation commands, hashes 15 final traces, and confirms 17 owned application ports are closed with no scoped application/browser processes remaining.
The [archived pending-history trace](artifacts/editor/participation-history-trace.zip) preserves this run when later checks replace the default file.
Verification identifies base commit ad39ddbf3e49ef8536d2a3b31e5d0e1454f75a2c plus the recorded working-source hashes.
The implementation and separate requested AGENTS.md cleanup remain uncommitted on master.

The [independent manual review](artifacts/editor/participation-manual-review.json) verifies keyboard off/on, retained visible focus, native reflow, and the 240 px Properties panel against those same source files.
The [flow](artifacts/editor/participation-manual-flow.png) and [absolute](artifacts/editor/participation-manual-absolute.png) screenshots were visually reviewed.
The checkbox label measures 207 by 44 px, and the panel has no horizontal overflow.
Both scoped axe 4.12.1 scans report 17 passes, zero violations, and zero incomplete checks.
This does not certify full-application or screen-reader accessibility.
Health reports zero enforced errors and 181 static-estimated CRAP advisories, which do not measure E2E coverage.
Cyclomatic complexity remains limited to 10, cognitive complexity to 15, and functions to 40 lines.
Dead-code analysis retains seven planned unused dependencies, with no unused files/exports, unresolved imports, or cycles.
All five scoped participation gates are met, with no unmet or abandoned gates.

Repeat the focused workflow after building:

```sh
bun run check:participation
ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_PARTICIPATION_EVIDENCE=chrome bun run check:participation chrome
```

General Fixed/Fit/Fill controls, Constraints, Tokens, React integration, supported exports, backend layout preparation, and complete V1 verification remain open.
Installed stable Chrome, Windows, and screen readers remain unverified.

## Ordinary Fixed/Fit sizing checkpoint

The ordinary Width and Height controls now offer Fixed and supported Fit conversions through the existing preview and atomic command path.
This checkpoint covers ordinary Flex frames and Text, plus owned literal Fixed dimensions on other ordinary nodes.
Fixed main-axis conversion normalizes understood grow/shrink/basis values to `0`, `0`, and `auto`.
Capturing Fixed uses the native used CSS dimension with its existing box sizing, preserving fractional sizes under canvas zoom.
Fit follows supported participating content, wrapping, Gap, Padding, and size limits while excluding Absolute and hidden children.
Clipping remains unchanged, and an object extending beyond its parent receives visible feedback.
Existing Fill and Constraints remain read-only ownership states; arbitrary sizing expressions, logical/reset ownership, unsupported content, and unbounded dependencies remain explicit boundaries.
Free frames containing absolute children do not gain a content-enclosing Fit algorithm.

The [numeric failure control](artifacts/editor/sizing-factor-numeric-diagnosis.json) reproduced an explicit edit back to the displayed number cancelling a required Source-to-Fixed conversion.
The shared field compared numeric equality without considering sizing intent.
Sizing now requests completion for that semantic change, while unchanged focus/blur and ordinary Fixed edits retain their no-op behavior.
The identical real 9-to-90 interaction fails before and passes after the correction, and the permanent workflow retains it.
The [target-size failure control](artifacts/editor/sizing-target-diagnosis.json) reproduced 36 px numeric inputs beneath 44 px selectors because a later global input rule won the cascade.
The sizing input selector now has the necessary panel scope, and both the focused before/after control and permanent workflow verify all four targets at 44 px.

The retained verifier corrections cover subpixel tolerance, native disabled-option attributes, a fixture that incorrectly combined assignment/removal of the same property, and an intentionally unmeasurable hidden child during layout conversion.
These corrections preserve the expected product behavior and the existing unavailable-state checks.
The [reload failure archive](artifacts/editor/sizing-reload-baseline/manifest.json) separately records three interrupted development checks caused by concurrent research writes to an ignored HTML file watched by Vite.
All source hashes remained unchanged; the complete rerun passed with repository source, HTML, CSS, and Markdown writes frozen.
No faulty accepted architecture was established, and doc_v1 was not changed.

The final [Chromium result](artifacts/editor/sizing-verification-result.json) and [Chrome for Testing result](artifacts/editor/sizing-chrome-result.json) each pass 38 check groups with 272 inputs across development and built modes.
The tested versions are Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Linux.
Coverage includes fixed overflow, fractional capture, text wrapping, wrapped Fit content, nested account/sidebar layouts, source priority and ownership, valid and invalid dependencies, numeric preview/cancellation, locks/drafts, stale revisions, rejection/retry, pending Undo, placement conversions, and UI save/reopen.
Layout passes 168 checks with 280 inputs, participation 36 with 154, movement 106 with 680, Padding 48 with 116, Gap 68 with 182, and alignment 36 with 228.
Pending history, ordinary editor/source workflows, panel resizing, build, TypeScript, lint, formatting, and tooling also pass.

The [final audit](artifacts/editor/sizing-final-audit.json) matches all 141 source files, eight before/after workflow results, and two results that record source evidence at completion only.
It independently binds 172 sizing commands to successful browser-trace requests and response documents, checks 21 final traces, and confirms 35 discovered application ports closed with no scoped processes remaining.
History is supported by its gate result and archived trace; its verifier does not emit a separate source/result JSON.
Verification identifies base commit `ad39ddbf3e49ef8536d2a3b31e5d0e1454f75a2c` plus the recorded working-source hashes.
The [independent manual review](artifacts/editor/sizing-manual-review.json) verifies a 240 px panel, four 44 px sizing controls, retained mode-selector focus, stable numeric input identity, shared preview locking, Escape rollback, one-command Enter, and clipped overflow feedback.
The Fit and overflow screenshots were visually reviewed.
Both scoped axe 4.12.1 scans report 18 passes, zero violations, and zero incomplete checks; this is not full-application or screen-reader certification.
The final manual app exits cleanly with its browser and port closed; earlier interrupted and stdin-limited attempts remain accurately archived.
Health has zero enforced errors and 202 static-estimated CRAP advisories, which do not measure E2E coverage.
The complexity limits remain 10 cyclomatic, 15 cognitive, and 40 lines per function.
Dead-code analysis retains seven planned unused dependencies, with no unused files/exports, unresolved imports, or cycles.

Repeat after building with `bun run check:sizing`.
For managed Chrome, use `ORC_CHROME_EXECUTABLE=/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome ORC_SIZING_EVIDENCE=chrome bun run check:sizing chrome`.
General Fill, full Constraints, Tokens, React integration, assets, complete exports, and complete V1 verification remain required work.
Installed stable Chrome, Windows, and screen readers remain unverified.
Changes remain uncommitted on master, and the full V1 goal remains active.

### Effective automatic margins

The [failing baseline](artifacts/editor/cross-margin-baseline/result.json) reproduced variable-resolved cross-axis `auto` margins being mislabeled Fill and wrongly blocking Row/Column conversion, while literal `auto` behaved correctly.
The shared sizing reader now uses native computed margin ownership through the existing CSS Typed OM pattern, with all four callers updated and authored margin expressions retained.
The identical focused probe passes 46 observations per browser across development and built modes on [Chrome for Testing](artifacts/editor/cross-margin-final-chrome/result.json) and [Chromium](artifacts/editor/cross-margin-final-chromium/result.json).
It covers numeric, literal-auto, and variable-auto margins in both directions, command-free inspection, pointer reparenting, exact history, and valid direction conversion.

The permanent sizing regression was observed failing before the product fix.
The final [Chromium sizing result](artifacts/editor/sizing-cross-margin-result.json) and [Chrome sizing result](artifacts/editor/sizing-cross-margin-chrome-result.json) each pass 40 check groups with 344 inputs; [movement](artifacts/editor/movement-cross-margin-result.json) passes 106 with 680, and [layout](artifacts/editor/layout-cross-margin-result.json) passes 168 with 280.
A separate [Movement verifier timing failure](artifacts/editor/cross-margin-movement-timing-baseline/manifest.json) read a position field before its scheduled ownership measurement; waiting for the visible parent-ownership message retains every original assertion without changing application behavior.
Build, TypeScript, lint, formatting, tooling, health, and dead-code checks pass with the existing complexity limits and reviewed advisories unchanged.

The independently reviewed and rerun [audit](artifacts/editor/cross-margin-final-audit.json) verifies all 141 source files, 16 traces, 172 accepted sizing commands, 40 accepted focused placement/direction commands, and 16 closed application ports with no scoped processes left running.
It separately classifies formatter-only verifier changes, the semantic test wait, and the one README sentence, retaining each original failure rather than treating it as a runtime success.
The exact verified source inventory is retained in [the source archive](artifacts/editor/cross-margin-verified-source.json).
No accepted architecture changed; at that checkpoint, new Fill conversion was the next bounded V1 sizing step.

### Bounded cross-axis Fill

Ordinary nowrap Rows now offer Height Fill, and ordinary nowrap Columns offer Width Fill, when the immediate parent has an independently owned active physical Fixed bound or equal physical min/max bounds.
The selected axis becomes `auto` with explicit `align-self: stretch` in one atomic command, preserving each declaration's priority.
The other axis, Flex factors, margins, decoration, size limits, clipping, node identity and hierarchy remain authored.
Fill's numeric field remains read-only, while supported explicit Fixed/Fit exits use a separate conversion permission.
Existing valid intrinsic stretch relationships remain readable and can retain supported exits without being treated as proof that a new Fill conversion is available.
Wrapped/main-axis conversions, source-owned or logical sizing, effective automatic cross margins, transformations, aspect-ratio dependencies and unbounded parents remain explicit boundaries.

The [missing-control baseline](artifacts/editor/sizing-cross-fill-baseline-result.json) fails before implementation.
The [overflow baseline](artifacts/editor/sizing-cross-fill-overflow-baseline-result.json) reproduces the missing limit warning; the sizing message now retains overflow feedback for Fill owners.
The [resume archive](artifacts/editor/cross-fill-resume-baseline/manifest.json) preserves the three complexity findings, asynchronous clipping-checkbox verifier failure, and obsolete textual cross-Fill movement assertion.
The checkbox verifier now waits for command acknowledgement and applied rendering before checking its state.
Movement now checks the Fill mode, used numeric dimension and read-only permission independently, retaining the textual main-axis ownership check.
These verifier corrections change no application checkbox or movement behavior.

The final [Chromium](artifacts/editor/sizing-cross-fill-result.json) and [Chrome for Testing](artifacts/editor/sizing-cross-fill-chrome-result.json) results each pass 50 check groups, 1,072 inputs and 134 accepted sizing commands across development and built modes.
They cover both axes, parent resizing, content-box/border-box decoration floors, min/max conflicts, overflow/clipping, source ownership and priority, read-only gestures, explicit exits, drafts, rejection, pending history, and source/save/reopen behavior.
Layout passes 168 checks with 280 inputs, participation 36 with 154, and movement 106 with 680; pending property history also passes.
Build, TypeScript, lint, formatting, tooling and Fallow enforcement pass with the 10 cyclomatic, 15 cognitive and 40-line limits unchanged.
Health retains 207 static-estimated CRAP advisories, and dead-code analysis retains seven planned unused dependencies; neither report contains enforced errors.

The [final audit](artifacts/editor/cross-fill-final-audit.json) verifies all 141 source files, five complete before/after workflow results, 268 accepted sizing commands bound to actual trace requests/replies, ten workflow traces, and final history/native evidence.
All eleven application ports discovered by that audit are closed, with no scoped application or browser processes remaining.
The [source archive](artifacts/editor/cross-fill-verified-source.json) retains the exact verified source and tracked patch before these status/backlog-only updates.
The [manual review](artifacts/editor/cross-fill-final-manual-review.json) separately verifies a 240 px Properties panel, four targets of at least 44 px, visible keyboard focus, command-free read-only arrows/Enter, Fixed capture, Fit content sizing, retained priority, and visible overflow feedback.
Its sizing-only axe scan has 11 passes, zero violations and zero incomplete checks; the two screenshots were visually reviewed, and its application and browser closed cleanly.
The independent native cross-axis probe records 100 states and 296 child comparisons with no failures.
Native and history traces have narrower source evidence than the workflow traces, as stated in the audit; no full-application accessibility or screen-reader certification is claimed.

The next bounded main-axis candidate has independent [native evidence](artifacts/editor/main-fill-native/report.md) and a [plan](artifacts/editor/main-fill-native/plan.md).
The parent rerun confirms 1,020 positive observations while retaining automatic-minimum overflow, source-ownership exclusions and the unequal-decoration multiple-grow counterexample.
That experiment establishes no ORC main-axis control, application transition, general equal sharing or wrapped Fill support.
No accepted architecture changed, and doc_v1 required no correction.
Main-axis and wrapped Fill, full Constraints, Tokens, React integration, assets, exports and complete V1 verification remain required work.
Installed stable Chrome, Windows and screen readers remain unverified.
Development continues on master without a commit or push for this checkpoint.

### Bounded single-grow main-axis Fill

Ordinary nowrap Rows now offer Width Fill, and ordinary nowrap Columns offer Height Fill, with an independently owned active parent bound, one growing child, and supported nonshrinking Fixed/Fit siblings.
The bound can be a literal physical Fixed size or active equal physical min/max sizes.
One selected-node-only CSS batch writes the axis as `auto`, `flex-grow: 1`, `flex-shrink: 0`, and `flex-basis: 0px`, preserving each declaration's priority.
The other axis, alignment, margins, decoration, limits, clipping, identity and hierarchy remain authored.
Automatic content minima remain intact even when they cause overflow; entering Fill does not silently insert a zero minimum.
Numeric Fill remains read-only, and supported explicit Fixed/Fit exits remain available.
Shared flow-placement guards validate parent sizing, direction, wrapping, participation and reparenting against the supported cohort before a command is submitted.

The [missing-feature baseline](artifacts/editor/sizing-main-fill-baseline-result.json) fails before main-axis Fill is implemented.
The [pointer ratio baseline](artifacts/editor/movement-main-fill-ratio-baseline-result.json) separately reproduces refusal of an independently Fixed participant merely because it has an aspect ratio.
The shared sizing participant reader now retains independent pixel-owned dimensions with aspect ratios while refusing ratio-dependent Fit/Fill ownership.
It also reads active native Flex factors when validating a cohort.
The retained movement regression exercises Fixed ratio siblings and incoming participants, exact Fill allocation, cancellation, cached preview retargeting, rejected destinations, and exact history.
The [interrupted runner archive](artifacts/editor/main-fill-runner-timeout/manifest.json) preserves a separate 1,800-second combined-browser timeout after Chromium completed and Chrome reached built mode.
The unchanged browser check was rerun with a 3,600-second runner limit; the original passed static and regression gates remain source-bound to their original transcript.
The ratio failure's [source snapshot](artifacts/editor/main-fill-ratio-baseline-source/) preserves the exact failing implementation.

The final [Chromium](artifacts/editor/sizing-main-fill-result.json) and [Chrome for Testing](artifacts/editor/sizing-main-fill-chrome-result.json) sizing results each pass 62 check groups, 1,994 inputs and 206 accepted sizing commands across development and built modes.
They retain both-axis allocation, real Fixed/Fit siblings, equal bounds, explicit limits, decoration floors, automatic-minimum overflow, clipping, source ownership, read-only gestures, safeguards, history and nested save/reopen resizing.
Layout passes 168 checks with 280 inputs, participation 36 with 154, and movement 130 with 832; pending property history also passes.
Build, TypeScript, lint, formatting, tooling and Fallow enforcement pass with the 10 cyclomatic, 15 cognitive and 40-line limits unchanged.
Health retains 217 static-estimated CRAP advisories, and dead-code analysis retains seven planned unused dependencies; neither report contains enforced errors.

The independently rerun [final audit](artifacts/editor/main-fill-final-audit.json) binds 412 accepted sizing commands to actual trace requests and successful response documents, verifies both modes of all five affected workflows and the exact 141-file source checkpoint, and checks final history and native evidence.
It also independently verifies the retained negative pointer sessions and binds valid cached retarget commands to their responses.
Accepted participation conversions and positive ratio pointer cases rely on the current verifier's assertions and source-bound traces; those cases do not emit separate full command/document records.
The final history check is bound by the frozen source inventory, exact successful G4 command, clean runtime trace and timestamp; its trace does not embed the history verifier source.
The [native audit](artifacts/editor/main-fill-final-audit.json) preserves the original research and independent parent rerun, with 1,020 positive observations, four expected automatic-minimum counterexamples, six ownership exclusions and one multiple-grow unequal-decoration counterexample in each.
All 14 application ports discovered by the automated audit are closed with no scoped application or browser processes remaining.

The separate [manual review](artifacts/editor/main-fill-manual-review.json) verifies Row Width Fill, command-free read-only arrows/Enter, explicit Fixed/Fit exits, preserved siblings, a 240 px panel, four targets of at least 44 px and visible overflow feedback in managed Chrome for Testing 154.0.8037.57.
It binds six successful commands to HAR responses and confirms clean application/browser shutdown.
Its sizing-only axe scan has 11 passes, zero violations and zero incomplete checks, and both screenshots were visually reviewed.
Manual Column review, full-application accessibility and screen-reader behavior remain unverified.

The [source archive](artifacts/editor/main-fill-verified-source.json) retains the exact verified source and tracked patch before checkpoint documentation updates.
The [documentation proof](artifacts/editor/main-fill-post-documentation.json) records six Markdown-only updates afterward, including four module READMEs in the verified inventory; all application code, verification code, configuration, AGENTS.md and doc_v1 remain unchanged.
No accepted architecture changed and no doc_v1 correction was required.
General multiple-child equal outer sharing with unequal decoration, wrapped Fill, full Constraints, Tokens, React integration, assets, complete exports and complete V1 verification remain required work.
Installed stable Chrome and Windows remain unverified.
No commit or push was made for this checkpoint.

## Layers reselection regression — 2026-10-13

The [failing baseline](artifacts/editor/layers-reveal-baseline-20261013-result.json) reproduces a selected object's row remaining hidden after collapsing its ancestor, scrolling Layers away, and clicking that object on the canvas.
The pointer movement handler skipped the existing selection/reveal path for an already selected object; [the fix](src/editor/canvas/pointer-movement.ts) restores that path for a single selected target while retaining the movement guard and group selection.
The expanded [Layers regression](scripts/e2e/editor/check-layers.ts) passes collapsed, expanded-but-offscreen, and repeated reselection in development and built applications under Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57, with unchanged canonical session state.
The full movement workflow and focused group-drag/draft-cancellation checks pass in development and built Chromium; TypeScript, lint, formatting, build, and Fallow's error gates pass, with the existing Fallow advisory findings retained.
The [verification report](artifacts/editor/layers-reveal-fix-20261013-report.json) records commands, source hashes, before/after evidence, and limitations for this uncommitted checkout.
The accepted Layers contract required no architectural change or doc_v1 correction.
The complete browser suite was not rerun after this fix; installed stable Chrome and Windows remain unverified.

## Fill sharing implementation checkpoint — 2026-10-13

Development resumed from the verified single-grow main-axis Fill and Layers reselection checkpoints.
The current task is ordinary multiple-child main-axis Fill sharing, including unequal decoration, native size limits, responsive parent changes and subsequent editing actions.
Research must establish the live CSS ownership before application controls are expanded; a static shrink ratio or a passing single-grow case does not satisfy this task.
Completion requires both-axis editor workflows, atomic history/save-reopen, source and priority preservation, cohort membership safeguards, affected regressions, and recorded source-bound evidence.
The accepted wrapped Fill requirement remains unfinished V1 work after the nowrap ownership proof.
The current execution plan and acceptance ledger are under ignored `.unlazy/v1-fill-sharing/`.
No compiler migration or MCP implementation is part of this checkpoint.

The resumed ownership review is complete, and an independent native rerun passed 2,126 measured states with zero unexpected results.
The [native report](artifacts/editor/fill-sharing-native/README.md) scopes that proof to CSS arithmetic and source serialization, rather than application completion.
Initial application integration now prepares coupled child-local CSS inputs for sizing, padding, placement, participation, layout switching and deletion.
The first expanded Row workflow passed locked-peer rejection, deletion rebasing and source round-trip, but the complete affected browser regressions and persistence checks are still pending.
The initial broad rerun exposed an explicit Fit-exit regression, which was corrected before the next verification run.
Do not treat this intermediate checkpoint as verified multiple-child Fill or completed V1.

## Immediate pause — 2026-10-13

The user requested an immediate stop while final focused Fill verification was running.
Both research agents finished, and the parent independently verified the native 2,126-state matrix.
The expanded broad Chromium development run passed Row/Column sharing, limits, padding, locking, deletion, source, history and prior sizing regressions before reaching the persistence failure.
The current implementation fixes the default border-box ownership assumption and checks equivalent source before root-type compatibility so unchanged Text source remains a no-op.
Build, TypeScript, lint, formatting and Fallow complexity checks passed after those fixes.
The final focused Chromium 153.0.8010.12 and managed Chrome 154.0.8037.57 development/built checks finished successfully while stopping, with unchanged checked source hashes.
Resume by reviewing the retained focused-check results, then run affected movement, padding, participation and layout regressions before marking this Fill checkpoint fully verified.
The full browser suite, wrapped Fill, installed stable Chrome and Windows remain unverified.
Changes remain uncommitted; no push was performed.

## Ordinary nowrap Fill sharing checkpoint — 2026-10-14

The bounded multiple-child main-axis Fill checkpoint is verified in development and built applications on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57.
This checkpoint supersedes the intermediate implementation and pause records dated 2026-10-13 above.
Ordinary nowrap Rows and Columns share equal outer border-box space across supported Fill children with unequal owned pixel padding/borders, both box models, native minima/maxima, Fixed/Fit siblings and preserved overflow.
The shared layout helper maintains child-local CSS inputs and exact native expressions during sizing, padding, pointer reparenting, participation, layout conversion and deletion.
It writes only necessary dependent changes through one atomic command; native layout remains authoritative without saved measured sizing or a separate dependency model.
Source-controlled expressions and uncertain relationships remain available through Code.

The resumed regression reproduced an equivalent `2e2px` basis being rewritten as `200px` on a locked sibling, unnecessarily blocking another child's padding edit.
The fix compares owned numeric inputs by value while preserving their existing source text.
The retained failing baseline and passing regression are linked in the [final audit](artifacts/editor/fill-sharing-finish-audit.json).
The expanded sizing workflow checks stale source ownership, the locked equivalent input, three Fill children, Absolute Position, Free conversion, padding preview/cancellation, rebasing after deletion, exact history and source/save-reopen persistence on both axes.
Movement checks retain shared-Fill destination adoption, native allocation, cached retargeting, cancellation and history.

The [final audit](artifacts/editor/fill-sharing-finish-audit.json) records both browsers and application modes for sizing, movement, layout, padding and participation, their exact commands, traces and unchanged source hashes.
The [documentation-only follow-up](artifacts/editor/fill-sharing-finish-documentation.json) records five Markdown updates afterward; application code, verification code, configuration, AGENTS.md and doc_v1 remain unchanged.
TypeScript, lint, formatting, build, tooling and Fallow dead-code/health commands pass at that source checkpoint with the configured 10 cyclomatic and 40-line limits unchanged.
Fallow retains 237 static-estimated CRAP advisories and seven planned unused dependencies; these advisory findings are not runtime coverage measurements.
The [independent native matrix](artifacts/editor/fill-sharing-native/README.md) remains separate historical CSS research evidence: 2,126 measured states and zero unexpected results.
It does not establish application or export completion by itself.

Wrapped Fill, broader intrinsic dependencies, full Constraints, Tokens, React integration, assets, complete exports and full V1 verification remain unfinished.
Fractional borders, arbitrary imported/logical ownership and dimensions near native engine limits remain outside this bounded proof.
Installed stable Chrome, Windows, full-application accessibility and screen readers remain unverified.
No accepted architecture changed, no doc_v1 correction was required, and no compiler migration occurred.
Both research agents finished; development is paused at this checkpoint with changes uncommitted and no push performed.

## Ordinary wrapped Row Fill checkpoint

Ordinary owned Rows now support entering main-axis Fill before or after enabling Wrap to next line.
The shared child-local CSS projection supplies one canonical outer basis across the frame's Fill children, including a sole Fill child when wrapping is enabled.
The browser forms rows from native hypothetical outer sizes and allocates Fill independently on each row while preserving Fixed/Fit siblings, decoration, margins, automatic minima and declared limits.
The source-derived basis remains `B = max(200, max(current owned decoration) + 100)` CSS px.
It determines native line formation without a saved card count, per-row child order, measured sizing or Grid model.
The [Flexbox algorithm](https://www.w3.org/TR/css-flexbox-1/#algo-line-break) supplied the independently checked line-collection rule.

Wrapping prepares parent and required dependent child CSS together before native preview and one atomic command.
Later Padding, Gap, resize, Fill exits, deletion, participation and supported reparenting use the same ownership and cohort preparation.
Existing nowrap single-grow behavior remains supported.
Unchanged parent display, direction and wrapping declarations use the captured native layout, so source variables do not bypass cohort preparation.
Explicit proposed layout changes still take precedence and authored parent expressions remain intact.
The control stays unavailable for unsupported parent bounds or source relationships and preserves native overflow instead of removing minima or clipping.

The [source-layout regression baseline](artifacts/editor/wrapped-source-layout-baseline.json) records accepted Fill widths of 187px and 153px under variable-based display.
The retained editor regression fails before the fix for variable-based display.
After the fix it passes for variable-based display, direction, wrapping and nested wrapping, including exact history and source round-trips.
The [missing-feature baseline](artifacts/editor/sizing-wrapped-feature-baseline-result.json) records the original refusal of Fill in a wrapped Row.
The [final audit](artifacts/editor/wrapped-fill-final-audit.json) binds the focused and full sizing checks plus movement, layout, padding and participation regressions to the final source archive.
It checks both application modes on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57, recorded command/response documents, traces and clean shutdown.
The native 224-state matrix independently predicts row membership, per-line shares and Fit height across unequal decoration, both box models, native limits, mixed siblings, automatic minima, margins and CSSOM serialization.
Native research remains separate from editor and complete export certification.

The expanded editor workflow covers incomplete final rows, responsive resize, mixed Fixed/Fit siblings, Padding preview/Escape, locks, native limits, Fixed-height clipping, participation, dominant-member deletion and rebasing, source drafts, single-grow wrapping, real pointer preview/cancellation/adoption, exact history and UI save/reopen.
Ordinary standalone serialized HTML reflows at another parent width without a coefficient rewrite.
An initial test initialization error, a pointer fixture path across an unrelated Column, an obsolete no-wrapping assertion and an immediate session read before Open project completed remain retained as verifier corrections.
The accepted unsupported-destination guard was preserved.
TypeScript, lint, formatting, build, tooling and Fallow commands pass with the 10 cyclomatic and 40-line limits unchanged.
Fallow retains 238 static-estimated CRAP advisories and seven planned unused dependencies.
The [documentation-only proof](artifacts/editor/wrapped-fill-final-documentation.json) records the checkpoint updates without changing application or verification code.

Wrapped cross-axis Fill, broader source/intrinsic ownership, full Constraints, Tokens, React integration, assets, complete exports and full V1 verification remain unfinished.
Installed stable Chrome, Windows, full-application accessibility and screen readers remain unverified.
No accepted architectural contract changed, no doc_v1 correction was required, and TypeScript remains at 6.0.3.
No subagent was started, no commit or push was made, and development is paused at this checkpoint as requested.

## Native renderer boundary corrections, 2026-10-15

Verified the three ordinary-renderer defects from the [boundary investigation](artifacts/editor/review-react-boundaries/REPORT.md) against `e18b86d50b560de31665789f50a024a880fe1180` plus the recorded uncommitted correction files.
The [correction report](artifacts/editor/renderer-bugs/REPORT.md), [current-source audit](artifacts/editor/renderer-bugs/audit.json), and [remaining boundary work](backlog/renderer-boundaries.md) distinguish these fixes from future React integration.

Edit now removes design-owned Tab stops and autofocus and disables authored native content editing.
Preview restores the authored focus/editing behavior and resets temporary text on exit and re-entry.
Canvas text editing, Properties and Code input remain usable through their existing command and draft paths.
Native design textareas can be selected on the canvas without entering their temporary native input mode.

SVG selector rules are projected inside a native CSS scope for the owning vector, including local media, supports, container and scope groups.
Code and saved source retain authored selectors rather than storing runtime scope markup.
Global stylesheet definitions and external stylesheet imports are unsupported by this preparation path and reject before source commit.
Legacy or directly inserted SVG source cannot publish global definitions into the editor through projection, although effects depending on those definitions are unavailable until supported preparation is implemented.
The regression verifies artwork fill/stroke, unrelated design/editor appearance, rejection without history changes, Undo/Redo, source preservation and saving/reopening.
Complete exports remain unfinished and are not certified by these source checks.

Selection outlines, Gap handles and drop indicators share active geometry invalidation for native scrolling, design mutations, required layout relationships, load events and CSS transition/animation lifecycle events.
Frame refresh continues only while native animations are running or pending.
Deselection and Preview remove active geometry measurement without writing measured values into canonical CSS or history.
Existing transformed-layout safeguards remain intact.
The new native regression checks position and transform transitions with session polling held, sibling-driven layout, scrolling, zoom and cleanup.
The broader Gap check exposed stale geometry ownership after switching to an empty frame; the final fix keys measured Gap points to their owning node, and the retained regression now passes.

`bun run check:boundaries` passes in development and built mode on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57 on Fedora 44.
The existing Preview, rendering, Gap and movement workflows pass in both application modes on Chromium.
The audit binds all retained passing results to the same current 150-file source inventory and preserves an archive and patch.
TypeScript, lint, formatting, build, tooling and Fallow checks pass with the 10 cyclomatic and 40-line limits unchanged.
Fallow reports seven planned unused dependencies and 247 static-estimated CRAP advisories, with no error-severity health findings.
The reusable compatibility checkpoint also passes both configurations with the actual `typescript` 6.0.3 and isolated native `typescript` 7.0.2 packages, preserving strict checking and dependency declaration checks.
TS6 remains required by the normal build.

No accepted architecture was replaced, no doc_v1 correction was required, and no React integration, compiler migration, new feature, subagent, commit or push was started by this task.
Windows, installed stable Chrome, the full browser suite, screen readers, complete exports, arbitrary SVG stylesheet definitions and animation performance remain unverified or unsupported as described in the boundary record.
Development is paused at this verified correction checkpoint.

## Wrapped Row Height Fill checkpoint, 2026-10-16

The interrupted checkpoint resumed and its required verification is complete.
Ordinary owned Height Fill is verified for wrapped Rows with independently authored parent height bounds.
The existing native auto-height and explicit stretch projection fills the child's current row while preserving parent alignment, size limits, margins, priorities and the other axis.
No measured row sizes or new layout model are saved.
The native oracle passed 432 distinct states across alignment, decoration, both box models, limits, reflow and HTML serialization.

The focused editor workflow passed in development and built modes on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57.
It covers per-line stretch, content/box-model changes, width and padding reflow, wrapping toggles, participation, source ownership, limits, locks, drafts, stale preparation, rejection, pending Undo, exact history and save/reopen.
The [final current-source audit](artifacts/editor/wrapped-cross-audit.json) matches all seven passing browser reports and their before/after inventories to the same 150 current source files.
It retains the exact source archive, uncommitted patch, native probe hash, compiler record and reproduced build asset hashes against commit `950e8a28d785d7783b471e689e3538bc75a7be31` plus the uncommitted changes.
TypeScript, lint, tooling, formatting, build, Fallow and the unchanged TS6/isolated TS7 comparison passed before the browser matrix.
Fallow retains seven planned unused dependencies and 250 static-estimated CRAP advisories, with no error-severity health findings or unused source files/exports.

The full sizing, movement, layout, padding and participation regressions pass in development and built modes on Chromium 153.0.8010.12.
Full sizing records 98 summary checks and 2,878 inputs; these counts are recorded observations, not independent test-case counts.
The actual browser commands, timestamps, versions, inputs, clean process shutdowns, screenshots and traces are linked from the audit.
Focused Chrome verification uses managed Chrome for Testing 154.0.8037.57 at `/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome`.

The earlier verification failures were caused by review HTML writes and a backlog Markdown update triggering development-page reloads.
The [Markdown watcher reproduction](artifacts/editor/wrapped-cross-reload-diagnosis.json) confirms the same Tailwind full-reload message after rewriting identical file contents.
The [retained failed regression](artifacts/editor/wrapped-cross-regression-reload-failure/diagnosis.json) records the matching timestamps and correction.
Repository source, documentation and research files were kept unchanged during the clean browser rerun.
No application workaround, longer timeout or relaxed assertion was needed for these reload failures.

All four review/research agents finished and their reports were reviewed; no additional agent or feature was started while closing this checkpoint.
The independent alignment and clipping assertion gaps and native evidence provenance gap were corrected before the final passing runs.
The nested Fill research passed 170 native cases and was independently replayed, but remains research rather than completed editor support.
Development is paused at the user's requested stopping point with no owned application checks or subagents running.
Changes remain uncommitted on master.

The standalone source check also reproduced a hidden-child serialization boundary, now detailed with paired evidence in the [export record](backlog/renderer-boundaries.md#4-complete-exports-and-animation-performance).
The sizing fixture uses explicit CSS hiding and does not certify saved visibility serialization or complete exports.
Broader intrinsic bounds, arbitrary source/logical ownership, installed stable Chrome, Windows and complete V1 verification remain unfinished.

## Nested Fill implementation, 2026-10-16

Ordinary same-axis Fill now traces through owned participating ancestors to an active Fixed size or equal minimum/maximum limits.
The shared candidate check preserves supported relationships through sizing, layout, wrapping, alignment, participation, pointer placement and deletion.
It rejects unresolved dependencies and silent inherited-Fill loss while retaining explicit Fixed/Fit exits and proven real-content intrinsic layouts.
No saved dependency graph, measured-size fallback, compiler migration or architectural contract change was introduced.

The expanded focused development workflow passes all 16 axis/direction combinations, resizing, equal limits, both box models, native limits, Fixed zero, empty packed/stretched rows, source ownership, ancestor locks, drafts, stale preparation, rejection, pending Undo, source round-trip and UI save/reopen.
The pre-guard editor reproduction retains eight unauthorized-change failures across both axes for sole-contributor deletion, Absolute participation, reparenting and inherited-alignment loss.
TypeScript, lint, formatting and the required complexity limits pass after integration.
The first complete matrix passed focused development/built Chromium and managed Chrome, full sizing and affected Chromium regressions, static checks and the TS6/isolated TS7 comparison on one 152-path source inventory.
Independent review then found an unguarded text contributor path.
The retained development regression reproduced all four width/height Properties/canvas failures while eighteen independently supported controls passed.
Workspace now checks text before Properties preview and through the shared Properties/canvas commit path.
The corrected placement/dependency/text workflow and focused nested sizing passed in development and built modes on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57.
The text workflow verifies refusal feedback, unchanged source/history/native boxes, Escape cancellation, successful retry, independently supplied positive controls and exact Undo/Redo.
TypeScript, lint, tooling, formatting, build, Fallow and the TS6 6.0.3/isolated native TS7 7.0.2 comparison passed on the same 152-path source inventory.
Movement and layout regressions also passed in development and built Chromium.
The user requested an immediate stop during the full sizing and padding reruns.
Those two results record externally interrupted browser closure, not a passing result or a diagnosed product regression.
The requested verification resumed on unchanged application and test code and completed on 2026-10-17.
Full sizing, padding, alignment, deletion, participation and the foundation workflow passed in development and built Chromium 153.0.8010.12.
The full sizing run recorded 122 workflow summaries and 3,660 inputs with no failure.
The [final current-source audit](artifacts/editor/nested-text-audit.json) passed, binding eleven browser reports, the separate foundation record, four built assets, both compiler scopes and the unchanged 152-path source inventory.
Focused nested sizing and placement also retain passing development/built Chrome for Testing 154.0.8037.57 results on that same source.
Deletion and foundation capture final source only; the frozen build inventory supplies external context, not a missing start snapshot.
All eight scoped gates are met; the earlier interrupted runs remain historical interruption evidence.
Both subagents finished and their reports were reviewed; all owned checks and application processes are stopped.
The [verification log](artifacts/editor/nested-text-gates.log) and scoped runtime checkpoint retain commands and results.
Installed stable Chrome and Windows remain unverified; broader intrinsic-parent Fill entry and main-axis parent Fit conversion remain separate unfinished V1 work.
Changes remain uncommitted on master.

## Intrinsic Fit/Fill interrupted checkpoint, 2026-10-17

Development is paused at the user's explicit stop request during implementation.
Native research and the pre-change editor reproduction are complete; their evidence is historical and does not verify the newly edited application.
Changes to `src/editor/layout/sizing.ts` and `src/editor/layout/fill-sharing.ts` and the new `scripts/e2e/editor/check-intrinsic-sizing.ts` workflow remain in progress.
The projection implementation agent returned isolated module results, but parent review and integrated verification remain unfinished.
Intrinsic fill ownership review stopped with a usage-limit error while preparing focused E2E files; its latest work is incomplete and unverified.
The current agent registry contains no active subagents, and no matching owned application or verification process was found at the stop checkpoint.
An intermediate TS6 check passed before the last sizing edits; focused sizing lint and formatting passed after those edits.
No current-source browser verification, complete static matrix, build, TS7 comparison or affected regression run has been completed for this implementation.
The previous nested Fill results remain valid only for their recorded earlier source inventory.
General shared intrinsic Column sizing and the intrinsic empty wrapped-row policy remain unresolved.
Resume by reviewing the unfinished focused test files and projection implementation, completing integration, then checking the exact current source before making completion claims.
The ignored working checkpoint is `.unlazy/intrinsic-fill/runtime.json`; its root implementation and final verification gates remain unmet.
Changes remain uncommitted on master; nothing was pushed.

## Intrinsic Fit/Fill resumed work, 2026-10-17

The user resumed development and Intrinsic fill ownership review completed its focused E2E files.
The shared sizing proof, sole Column projection and focused workflow are implemented but the complete intrinsic checkpoint remains in progress.
Development core sizing, projection and persistence groups passed before the latest wrapped-row extension.
The safeguards group reproduced an Escape cancellation bug: a Fit numeric preview restored its old number but committed Fixed sizing through the blur handler.
PropertyField now skips the cancellation-induced blur commit while retaining explicit equal-value capture.
That regression passed before a separate test-coordinate error was corrected; the remaining safeguards run is still pending.
The native wrapped-row probe passed both pinned browsers, including empty-row zero height, independent contents, source changes and supplier removal.
The corresponding editor assertion reproduced the incorrectly disabled Fill option before the supply proof was extended.
Integrated wrapped-row verification, the final static/compiler/build matrix, affected regressions and the final source audit remain pending.
General shared intrinsic Column sizing still has no verified equal-sharing, content-responsive CSS projection and remains required unresolved work.
The prior pause record and passing checks remain historical evidence for their recorded source inventories.
Changes remain uncommitted on master; nothing was pushed.

## Intrinsic Fit/Fill stop checkpoint, 2026-10-17

Development is paused at the user's explicit stop request.
Intrinsic fill ownership review completed both its focused E2E work and its independent read-only integration review.
No subagent remains active.
The complete intrinsic workflow passed all five scenario groups in development and built Chromium 153.0.8010.12 on the same 161-path source inventory.
Its [record](artifacts/editor/intrinsic-matrix-v1-chromium-all-result.json) contains ten group summaries, 804 input records, both application shutdowns, screenshots and traces.
Gap and padding regressions also passed in both Chromium application modes.
Eight static/tooling checks passed before the latest existing sizing-test expectation edits; lint and Fallow health passed again after those edits.
The final same-source static/compiler comparison, managed Chrome application matrix, remaining affected regressions and final audit are pending.
The second full sizing development run was externally interrupted for this stop and is not a passing result or a diagnosed product failure.
Its first run exposed outdated assertions that refused independently supplied intrinsic Fill; those assertions now separate valid availability from genuinely contributor-free circular refusal.

The final reviewer identified an additional placement path and the parent reproduced its refusal through a real canvas drag.
Moving a shared Height Fill child with an independent Fixed descendant into an otherwise empty Fit-height Column reports Set the parent's height first and preserves source/history without submitting a command.
The destination needs the supported sole-child projection, but the current proof inspects the old source cohort.
The [detailed resume record](backlog/native-layout-projection.md#intrinsic-fitfill-integration-and-placement-resume) identifies the exact fixture, evidence and proposed correction.
This placement issue remains unfixed; no production change was made for it before stopping.
General shared intrinsic Column sizing also remains unresolved.
Resume with that placement correction and its direct/cached-preview/history regressions, then complete the current intrinsic verification and evidence audit.
The ignored runtime checkpoint is `.unlazy/intrinsic-fill/runtime.json`.
All owned application/browser checks have stopped.
Changes remain uncommitted on master; nothing was pushed.

## Intrinsic Fit/Fill resumed, 2026-10-18

The user resumed the interrupted intrinsic task.
The permanent placement regression reproduced the shared-child refusal before the production fix.
The sizing proof now captures incoming independent supply and declaration priorities before temporary previews and evaluates the selected placement object without its old source cohort.
It retains exact authored ownership, destination cohort validation and multiple-grower intrinsic Column refusal.
The focused placement workflow passes development Chromium, including empty and Fixed-sibling destinations, cached previews, Escape cancellation, one atomic command, exact Undo/Redo, responsive standalone source and save/reopen.
TypeScript and lint pass this version.
A focused assertion now covers shared-peer deletion followed by parent Fit; its integrated run is pending.
Both-browser/mode verification, remaining affected regressions and the final same-source compiler/build audit are running next.
These passing checks do not complete general shared intrinsic Column sizing, which remains required unresolved work.
No accepted contract, doc_v1 file, dependency or compiler selection was changed.
Changes remain uncommitted on master; nothing was pushed.

## Intrinsic Fit/Fill verification checkpoint, 2026-10-18

The implemented intrinsic cases and the shared-source placement correction now pass the completed verification matrix.
The six-group intrinsic workflow passed development and built modes in Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57, with 12 group summaries and 888 input records per browser.
This includes shared-survivor deletion followed by parent Fit, cancellation, source ownership, locks, drafts, atomic history, responsive source and save/reopen.
The full sizing workflow passed separately in development and built Chromium, with 61 summaries and 1,857 inputs per mode.
Gap, padding, alignment, participation, deletion, layout, nested placement, movement, atomic commands, renderer boundaries, the foundation workflow and history also passed their recorded affected regressions.
All eight static/tooling checks passed, including the required TS6 6.0.3 and isolated native TS7 7.0.2 checks against both configurations with no compiler diagnostics.
TS6 remains the required compiler and the normal build compiler.
Fallow reports seven reviewed unused-dependency warnings and 287 estimated-coverage health warnings; there are no cyclomatic-complexity or function-size violations against the 10/40 limits.

The [final evidence audit](artifacts/editor/intrinsic-current-audit.json) passed against commit `950e8a28d785d7783b471e689e3538bc75a7be31` plus the recorded uncommitted work on Linux.
It binds 15 workflow reports, command records, compiler identities, the current 162-path source inventory, root configuration hashes and four built files.
The only historical source-inventory difference is the corrected movement test, which the other recorded workflows do not import.
Those workflows retain identical application code, their own runners and runtime helpers, dependency/compiler configuration and built files.
The permanent movement rerun and final static checks use the current movement test.
The earlier interrupted sizing run remains interruption evidence, not a diagnosed product failure.

Astra completed its focused Flex review, and the parent independently replayed its native matrix and exact horizontal-text counterexample in both pinned browsers.
The vertical-writing candidate shares space for independent Fixed descendants but can retain stale parent and child heights after a valid horizontal text edit.
It is not an accepted application mapping, and the complete general shared intrinsic Column requirement remains unmet.
The [detailed open-case record](backlog/native-layout-projection.md#shared-intrinsic-column-decision-after-astra) preserves the reproduction, evidence and three possible next steps.
After explanations of those choices and the capability a V1 limitation would omit, the user authorized the isolated Grid experiment.
The two bounded native research agents completed their independent source-response and allocation-limit reviews, as recorded below.
This authorizes research only; no V1 support reduction, application adoption or architecture change has been approved.
Three of the four intrinsic task gates are met; the implementation gate remains unmet for this required combination.
All subagents from the completed intrinsic verification finished and all owned application checks stopped before the new isolated research began.
Installed stable Chrome, Windows and complete V1 coverage remain unverified.
Changes remain uncommitted on master; nothing was pushed.

## Isolated Grid research checkpoint, 2026-10-18

Both Grid research agents finished, including the same limits reviewer resumed after quota recovery.
The parent independently replayed both deliveries and accepted all eight research and integration gates, with no abandonment.
The native review captured 173 paired live/fresh states per browser.
The limits review captured 460 fixtures and 4,500 states per browser; all 9,000 observations matched the agent's final delivery during the full parent replay.
The paired binaries remain 153.0.8010.12 and 154.0.8037.57.

Ordinary horizontal Grid handles the measured uncapped equal sharing and live text edits.
Its item maxima can leave unused row space instead of redistributing it.
The explicit capped-track repair fails before its maximum should bind: content 20px/30px with maximum 70px produces a 108px parent and 70px/30px children, while the remaining 100px requires 50px/50px.
The parent also investigated percentage-based tracks motivated by the official sizing specification.
That lead passes narrow two-child cap cases and a minimum-size control but fails with an ordinary Fit sibling: a 96px parent minus a 30px sibling and 16px of gaps leaves 50px, yet its children receive 40px/10px rather than 25px/25px.
No complete tested native mapping is established, and a finite failed search is not an impossibility proof.

The [integrated research report](.unlazy/intrinsic-fill/grid-research/RESULT.md) preserves both reports, exact commands, independent replays, the percentage lead and the recommendation.
The targeted [Onlook review](.unlazy/intrinsic-fill/grid-research/onlook-review.md) is pinned to `423e2e924366419e418ee049093872d535eea41a`.
Its reviewed sizing helper maps Fill to `100%`, so that code path does not establish ORC's constrained equal-sharing behavior.
Its authored/computed style distinction and source-target actions remain useful later integration references.
The Onlook application was not installed or run.

Application source, tests, dependencies, accepted contracts and doc_v1 were not changed during this isolated research.
The current-source audit still passes for 162 paths and four built files, preserving the verified application checkpoint.
Both child leases are released, all research waves are terminal, and no owned browser checks or subagents remain running.
The general shared intrinsic Column implementation gate remains unmet; Grid adoption and V1 support reduction are not approved.
Changes remain uncommitted on master; nothing was pushed.

## Percentage follow-up and native wrapper proposal, 2026-10-18

The user authorized reviewing changing Fit siblings and simultaneous min/max limits, then producing a complete native prototype or a concrete smallest-change proposal before adoption.
The [native wrapper proposal](backlog/intrinsic-column-wrapper-proposal.md) records the result, mechanism, exact source/history/export consequences, affected paths, and remaining verification.
The extended same-hierarchy percentage formula measures 333 states per browser and still fails 183 mixed-Fit states in each.
Its separate two-child limit controls pass, so this is a remaining-budget failure rather than evidence that simultaneous bounds alone cannot work.

A new structural candidate uses one outer Grid cell with an inner Flex Column and percentage-aware shared basis.
It passes 745 positive native cases and two correctly rejected negative controls per browser, including changing Fit content, two/three Fill children, simultaneous child and parent limits, decoration, both child box models, live text edits and source parsing.
The two pinned binaries are Chrome for Testing 153.0.8010.12 and 154.0.8037.57 on Fedora 44.
The actual current serializer/importer check also confirms that a renderer-only adoption would add a real wrapper Layer during Code Apply and change direct-child selectors.
This is a concrete architecture proposal with bounded native evidence, not completed application support.

The proposal preserves canonical object identity and order through a versioned generated wrapper, keeps native Flex allocation and responsive CSS exports, and requires exact source recognition plus updated physical/canonical-parent resolution.
History, draft safeguards, nesting, placement, source round trips and complete exports still require integrated verification after agreement.
No application code, repository test, dependency or doc_v1 content changed during this follow-up; the exact inventory and hashes of all 219 protected files match its starting checkpoint.
The research scripts, command exits, source hashes, raw geometry and specification excerpts are in `.unlazy/intrinsic-fill/percentage-followup/`.
No commit or push was requested or performed.

## Ordinary intrinsic Column wrapper checkpoint

Verified on 2026-10-20 against `950e8a28d785d7783b471e689e3538bc75a7be31` plus the uncommitted intrinsic-sizing implementation.
The [approved proposal](backlog/intrinsic-column-wrapper-proposal.md#adoption-authorization-2026-10-19) is now implemented for ordinary frames and supported ordinary divs.
Canonical frames remain Flex Columns with unchanged IDs, parent IDs and child order.
The shared serializer and renderer emit the same versioned single-cell Grid outer box and generated inner Flex flow.
An exact source inverse restores the canonical hierarchy; unknown or altered marked structures refuse, and explicit source opt-out retains the real authored wrapper.
No measured layout dimensions, hidden mirror, dependency graph or new package is saved.

The real editor checks cover two/three Fill children, multiple changing Fit siblings, independently supplied nested content, simultaneous parent/child limits, overflowing minima, capped unused space, unequal decoration/margins and both box models.
They cover activation and parent Fit conversion, stable opted-in Fit/Fixed changes, preview/cancellation, locks, Code drafts, no-op source Apply, exact one-command Undo/Redo, parsed responsive HTML and UI save/reopen.
Opted-in interaction checks cover keyboard/pointer order, pointer cancellation and reparenting, Gap fields/handles, parent/child padding, alignment/distribution, Absolute participation, deletion and Free/Row exits.
Circular supply, unowned source and last-supplier refusals remain negative controls.

Integration review found and corrected false boundedness from non-stretching ancestors or automatic cross margins, overly permissive generated-box recognition, stale projection inputs during atomic exit/reentry, and refusal of an owned main Fill to cross Fill conversion.
The final generic direction regression removes its unrelated hidden fixture child so it reaches the intended conversion and source-owned refusal checks.
No application code changed during the final verification run.

| Verification | Completed result |
| --- | --- |
| Full intrinsic workflow | All seven scenarios passed in development and built modes in both pinned browser versions. |
| Full sizing workflow | Development and built Chromium passed, each with 61 check summaries and 1,867 recorded inputs. |
| Affected regressions | Gap, padding, alignment, participation, layout, deletion, movement, nested placement, editor, history, Preview, atomic commands, renderer boundaries and Layers passed. |
| Static checks | Types, lint, format, tooling controls, Fallow dead code, Fallow health and isolated compiler comparison passed. |
| Compiler identity | Required `typescript@6.0.3` and isolated `typescript@7.0.2` with `@typescript/typescript-linux-x64@7.0.2` passed both unchanged configurations with strict checking and dependency declarations checked. |
| Final build | The normal TS6 build passed and all four output hashes match the runtime-tested build. |

The source-bound [aggregate audit](artifacts/editor/intrinsic-column-current-audit.json) records exact commands, exits, commit, working-tree state, 174 runtime source paths, compiler evidence and four built hashes.
The permanent entry point is `bun run check:intrinsic-sizing`; select `ORC_INTRINSIC_SCENARIO=shared-column` for the new workflow.
Full runtime checks used one frozen source snapshot.
Afterward only the obsolete description in `scripts/README.md` changed within that inventory; the audit records its exact before/after replacement and verifies every code, test, dependency and configuration hash is unchanged.
Root status and backlog notes were then updated, and the final build was compared with the tested output.
One nested-placement process ended with SIGTERM before producing a result; its independent rerun passed both modes, and the interrupted attempt is retained separately without being counted as a product failure.
Raw tool timestamps reflect the host clock; this checkpoint date follows the client date.

The environment is Fedora 44, Linux `7.2.5-200.fc44.x86_64`, Bun 1.4.2 and the pinned project dependencies.
The tested executables identify themselves as Chrome for Testing 153.0.8010.12 and 154.0.8037.57; the audit checks their actual binary hashes.
Installed stable Chrome, Windows, arbitrary imported React source rewriting, complete product exporters and broad animation performance are not certified.
First wrapper insertion is an explicit structural Edit conversion and can remount descendants; later opted-in sizing changes retain ancestry, and Preview starts from the applied structure.
Generated copied HTML includes the real extra layout div, so arbitrary direct-child selectors require the separately tracked source integration work.
These results close this ordinary intrinsic task, not all sizing, Constraints, React integration, exports or V1.
No commit or push was requested or performed.

## Next checkpoint

The focused [TS7 compatibility checkpoint](SCAFFOLD_VERIFICATION.md#reusable-ts7-checkpoint-2026-10-15) is implemented and verified against the expanded application on Fedora.
Required checking and the normal build remain on TS6; migration and Windows certification remain separate unfinished work.
The wrapped Row cross-axis Height Fill checkpoint is verified and closed at the requested pause.
The ordinary nested Fill checkpoint, including the [destination and dependency regressions](backlog/native-layout-projection.md#nested-fill-and-destination-dependency-review), is verified and closed at the requested pause.
The approved native intrinsic Column wrapper is implemented and verified at the [current checkpoint](#ordinary-intrinsic-column-wrapper-checkpoint).
The original content-responsive shared Height Fill blocker is resolved for the accepted ordinary workflow, including mixed Fixed/Fit siblings and individual limits.
The internal generated box adds no canonical object or Layer and introduces no measured-size runtime.
Complete this task at this checkpoint; select the next ordinary geometry/layout/Constraints/Tokens requirement from doc_v1 before starting another implementation.
Imported React source rewriting, component events/portals, full exporters and supported-platform certification remain separate work.

1. Complete the ordinary editor's geometry, layout, constraints, and Tokens workflows.
2. Integrate supported React source editing, component imports, portable assets/dependencies, complete exports, and Preview component behavior.
3. Verify accepted workflows on the supported browsers/platforms with repeatable evidence and explicit remaining limitations.

Build the MCP server and tools only after the ORC-web V1 application is working and its workflows have recorded E2E verification.
MCP then exposes the existing application services, followed by verification through actual client calls.
The [implementation order](backlog/mcp/implementation-order.md) records this prerequisite.

## Maintaining this overview

Use **Not started**, **In progress**, **Implemented**, or **Verified** for application features.
Implemented means application code exists; Verified means the stated workflow passed recorded checks at an identified commit and platform.
Keep experimental results explicitly scoped to their experiment.
Update rows when a meaningful checkpoint changes and link the supporting report, tested commit, platform, commands, results, and limitations.
Keep detailed logs in their reports and deferred features in their dedicated backlog files.
[GATES.md](GATES.md) tracks documentation coverage and static checks; its checked documentation gates do not certify application behavior.

# ORC-web implementation status

Last updated: 2026-10-09.
Current stage: active V1 implementation after the pointer, sizing, and parent-controlled position corrections.
This overview describes this checkout and links to reviewed evidence from the PC experiments.

## Current state

| Area | Implementation status | Evidence or contract |
| --- | --- | --- |
| Application foundation and startup | Implemented combined Bun/Vite development launch and built-app serving; Linux startup failure cleanup, normal shutdown, and failed-save shutdown recovery pass focused process checks. | [Launcher](scripts/dev.ts), [backend](server/start.ts), [lifecycle check](scripts/runtime/check-lifecycle.ts). |
| Development tooling | Selected anti-slop rules and Fallow CLI configured; TypeScript 6, lint controls, formatting, build, and Chromium frontend mounting pass on Fedora. | [Scaffold verification](SCAFFOLD_VERIFICATION.md), [remaining editor tooling](backlog/development-tooling.md). |
| Editor workspace, Layers, Properties, and Code | In progress; Dashboard/tabs, selection, basic Properties previews, text editing, Code Apply/Discard, draft safeguards, panel resizing, in-place Layer naming, and atomic subtree deletion pass focused development/built checks. | [Editor workflow](scripts/e2e/editor/check-editor.ts), [panel check](scripts/e2e/editor/check-panels.ts), [naming check](scripts/e2e/editor/check-layers.ts), [deletion check](scripts/e2e/editor/check-deletion.ts). |
| Tokens, layout, constraints, and canvas transforms | In progress; ordinary movement, single Flex reordering/reparenting, and read-only parent-controlled position inspection pass focused development/built checks. Layout/constraint controls, general sizing ownership, group reparenting, resize/rotation handles, and Tokens remain pending. | [Movement check](scripts/e2e/editor/check-movement.ts), [position checkpoint](#parent-controlled-position-checkpoint), [atomic check](scripts/e2e/editor/check-atomic.ts), [layout projection limits](backlog/native-layout-projection.md), [accepted workspace](doc_v1/interface/workspace-and-canvas.md). |
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
The supported Chrome scaffold check is blocked until Chrome is available; Chromium and Codex @Browser smoke checks passed.
Detailed tool value grammars, resource-transfer fields, and SDK integration are tracked in the [MCP implementation backlog](backlog/mcp/command-contracts.md).
Resolve those details when implementing the corresponding services.
Record a blocker here when an actual failure prevents the next checkpoint, with a link to its diagnosis.

### Current verification records

The foundation, panel, bundle-preservation, and lifecycle checks run real application processes rather than restating implementation functions.
Ignored `artifacts/editor/foundation.json` and `panels.json` record the tested commit, working-source hashes, command, platform, browser version, and outcomes.
Screenshots and Playwright traces are saved beside those records.
The current editor runs use Playwright Chromium and in-app Browser inspection on Fedora; they do not certify installed Google Chrome or Windows behavior.
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

## Next checkpoint

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

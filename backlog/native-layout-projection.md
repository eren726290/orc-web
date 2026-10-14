# Native layout projection limits

Status: open V1 implementation work, recorded 2026-10-08.
These are counterexamples to proposed CSS mappings before the editor controls exist, not failures in a completed layout feature.
Accepted behavior remains governed by [Flex](../doc_v1/interface/flex-layout.md) and [Constraints](../doc_v1/interface/constraints.md).
Saved CSS remains the only authored layout authority under the [canonical document contract](/home/eren/D/orc-web/doc_v1/architecture/canonical-document-model.md:101).

## Measured limits

- Equal outer Fill sizes need a verified projection for unequal padding and borders.
  In a 300px Row with a 10px gap, `flex:1 1 0px` produces 170px and 120px instead of equal border boxes when only one child has 20px padding and 5px borders.
  A common 100px basis works with positive free space but gives 80px and 60px when the parent shrinks to 150px.
  Disabling shrink introduces an extra 100px floor and changes wrapped line formation, so that candidate cannot define general Fill behavior.
- RTL Both constraints need to preserve the accepted physical left edge under size conflicts.
  Native absolute positioning preserves the right edge in RTL overconstraint.
  Physical self alignment plus `width:stretch` fixes the measured positive-space cases but places a zero-width child at x=0 instead of its saved left inset 20 when the parent reference is 20px and both insets are 20px.
  Preserve imported content direction while resolving this case.
- Imported margins and content-box sizing need verified End and Center conversions.
  Measured Start conversion can preserve their native rectangle without removing margins or changing box sizing, but this does not prove every constraint mode.
- Author transforms and `translate` need explicit ownership before visual conversion.
  Replacing an author's `translate:12px 7px` with centering translation loses those offsets.
  Preserve unsupported expressions and show the unavailable control or Edit source boundary rather than guessing from a transformed screen rectangle.

General wrapped Fill basis, maximum-size conflict priority, and transformed conversion already have open decisions in the specification.
Resolve them with native measurements and actual editor history/save/export checks before claiming general support.
No extra wrapper, saved geometry model, imported-style reset, or new control policy has been accepted by this record.

## Bounded correction research

Native research on 2026-10-09 verified equal outer Fill for fixed owned decoration with a common border-box basis `B` greater than every child's decoration `D` and shrink factor `B / (B - D)`.
For content-box children, the corresponding inner basis is `B - D`; existing padding, borders, box sizing, margins, and size limits remain authored.
The native min/max redistribution and physical decoration floor matched an independent equal-share oracle in the tested matrix.
This is a candidate projection, not implemented general Fill support.
The required wrapping basis remains open because different bases change row membership before sharing.

An owned length variable can feed both padding and typed CSS arithmetic for the shrink factor without a saved measurement.
Percentage padding does not use the same percentage reference inside that numeric shrink expression and remains a concrete failure.
A numeric shrink factor also becomes stale when decoration changes, and a tiny basis below decoration does not establish equal outer sizes.
Retain those failures when implementing the accepted controls; do not reset imported styling to make a limited fixture pass.

RTL Both passed a native candidate using sole CSS inset variables, an explicit nonnegative dimension, and an automatic opposite physical inset.
It preserved physical left/top, child direction, minimum/decoration floors, zero and crossed reference sizes, and later reexpansion.
Variable naming and recognition, collision handling, and movement/source/export ownership still require application integration.
Content-box subtraction becomes stale when decoration changes and therefore does not establish general imported constraint conversion.

The parent rerun passed 7,544 assertions across 1,288 retained states in `artifacts/editor/layout-correction-2026-10-08T19-57-37-968Z/measurements.json`.
The reviewed [report](/home/eren/D/orc-web/.unlazy/v1-resume/reports/layout-correction.md) and [probe](/home/eren/D/orc-web/.unlazy/v1-resume/reports/layout-correction-probe.ts) retain successful candidates and original negative controls.
This evidence uses Chromium on Linux and does not prove editor history, saving, exports, installed Chrome, or Windows.

## Ordinary layout switching

The ordinary Free/Row/Column control uses CSS as the single authored layout authority.
Normal Free children, including imported literal `position:absolute` children of a Free frame, join Row/Column in canonical sibling order.
Children already outside Flex flow retain their offsets, constraints, sizing, and native absolute positioning when the parent changes layout.
When first leaving Flex, their position declaration becomes `position:var(--orc-absolute-position)` with their own `--orc-absolute-position:absolute` declaration.
That active CSS value preserves explicit Absolute participation through later Free-to-Flex switches without a separate saved layout flag or inherited parent variable.
The namespace belongs to ORC's position projection; arbitrary source-controlled position expressions remain unavailable for visual conversion.
Ordinary Free placement remains literal `position:absolute`.
Reparenting into Flex explicitly rejoins flow and removes the owned position variable; Free reparenting preserves an existing explicit Absolute position value.

Flex-to-Free captures participating children's native parent-relative Left/Top placement and Fixed width/height in one batch.
It preserves margins, borders, padding, box sizing, clipping, IDs, hierarchy, and unrelated styling.
An intrinsically sized frame captures its current size on axes that will lose their in-flow content, preserving its box as its children leave flow.
Axes owned by its own parent remain parent-controlled.
This does not establish general Free Fit sizing or general Fixed/Fit/Fill controls.

Both placement paths remove active logical and physical offsets when joining flow.
The retained logical-offset counterexample placed a child at x=105 instead of x=15 because `inset-inline-start:90px !important` survived conversion.
The shared removal now covers physical edges, inset shorthands, and individual logical edges.
Transformed parents, unmeasurable children, source-controlled order/position, and unsupported Flex-axis sizing reject before any batch is sent.
General Fill conversion, source-bound React layouts, and the measured projection limits above remain V1 work.
Ordinary Row wrapping and its persistence are verified in the [wrapping record](#row-wrapping-implementation).
The [Code Apply identity record](code-apply-identity.md) records the equivalent-source correction found during layout round-trip verification and the remaining identity work.

### Automatic-margin correction

Interactive verification reproduced a 30 px horizontal jump when changing a Row to Free with a child authored as `margin-left:auto`.
The child's screen x coordinate changed from 649 to 619 because its used Flex margin was 30 px, while the absolute-positioned margin resolved to 0 px.
The shared Free placement calculation previously subtracted the old used margin when saving Left.
The original observation remains in ignored `artifacts/editor/layout-auto-margin-baseline.json`.
The calculation now snapshots computed auto margins with native CSS Typed OM and treats them as zero for Start-edge absolute placement.
It retains the authored declarations and the existing End, Both, and Center calculation paths.
The [CSS Typed OM specification](https://www.w3.org/TR/css-typed-om-1/#computed-stylepropertymapreadonly-objects) and [Chrome API guide](https://developer.chrome.com/docs/css-ui/cssom) describe the computed-value API used to distinguish `auto` from its used Flex pixels.
The retained E2E regression covers Row and Column, direct and variable-resolved auto margins, and exact history.
The original interactive card keeps all six native boxes unchanged after the correction in ignored `artifacts/editor/layout-auto-margin-corrected.json`.

### Candidate rendering validation

The layout switch now renders its candidate through the existing temporary property-preview path before sending a command.
It checks the actual parent layout and finite native boxes, and a Flex-to-Free switch verifies the whole frame subtree against its previous unzoomed boxes.
The synchronous DOM flush is limited to this explicit conversion, so another browser input cannot interleave with the candidate check.
[React's flushSync reference](https://react.dev/reference/react-dom/flushSync) describes this browser-measurement integration and its performance caveats.
Temporary measurements and preview styles never become a second saved layout model.
Failed validation removes the preview and sends no mutation, preserving native geometry, canonical data, revision, and both history stacks.

The original negative control uses a right-anchored frame whose width resolves from a CSS variable to Fit.
Its previous unvalidated switch shrank the frame and moved its child; the retained regression now requires rejection with unchanged source and geometry.
This correction applies to the ordinary layout-control path.
The backend has not gained whole-document rendering validation for arbitrary raw style batches.
Shared server-side preparation for future agent layout operations remains required before exposing those operations through MCP.

### Layout-control keyboard focus

The real keyboard workflow and retained E2E regression reproduced layout activation dropping focus to the page body while the pending command disabled its button.
The control now remembers its trigger and restores focus after rendering re-enables it.
It restores only for the same selected owner, a connected enabled button, and body focus, so it does not take focus from another active control.
Both completed switches and rejected native previews retain focus in the regression.
The original observation remains in ignored `artifacts/editor/layout-focus-baseline.json`, with corrected native focus and its visible ring in `layout-focus-corrected.json` and `layout-interactive-keyboard-focus.png`.

### Row wrapping implementation

The ordinary Row control now includes Wrap to next line and passes recorded development and built verification.
The original Row-to-Column-to-Row regression lost wrapping and moved the third child from x=15 back to x=175.
Its retained failure is `artifacts/editor/layout-wrapping-column-baseline-result.json`.
Each frame now owns an active `--orc-row-wrap` CSS declaration, and Row uses `flex-wrap:var(--orc-row-wrap)`.
Column uses `nowrap` while retaining the frame's own Row choice, and Free retains that choice for a later return to flow.
No line memberships, copied child orders, or measured geometry are saved.
The [Flexbox line specification](https://www.w3.org/TR/css-flexbox-1/#flex-lines) defines independent line layout, and the [CSS variable specification](https://www.w3.org/TR/css-variables-1/#using-variables) defines the active authored projection.

The wrapping mutation changes the parent only and retains child styles, ordering, locks, constraints, and the clipping setting.
The existing property-preview path verifies the native candidate before one atomic command.
The control preserves keyboard focus and protects Code drafts through the same path as layout switches.
External wrapping expressions remain available in Code and retain their references across supported mode switches.

Review reproduced a whole variable `flex-flow` being misread as an ordinary Row because native CSSOM exposes empty pending-substitution longhands.
A follow-up reproduction also covered uppercase `VAR(...)`, `env(...)`, and a shorthand with one explicitly overridden longhand.
The corrected ownership read requires Code whenever an authored `flex-flow` leaves its native direction or wrapping field unresolved.
Review also reproduced a visual mode change accepting CSS-wide wrapping keywords, whose meaning would change if moved into a custom property.
These keywords and reverse wrapping now reject conversions that would move their wrapping declaration into ORC's owned custom property, without sending a command.
The retained negative controls are `layout-wrapping-source-flow-baseline-result.json`, `layout-wrapping-functions-baseline-result.json`, and `layout-wrapping-keyword-baseline-result.json` under ignored `artifacts/editor/`.
These are implementation corrections; no incorrect V1 architectural contract has been established.

The E2E checks exercise native 90 px Fill bases, 3/2 line formation, per-line sharing, min/max limits, and mixed Fixed/Fill children.
This does not yet establish the general editor's Fixed/Fit/Fill controls or a complete source-bound React projection.
Those accepted V1 requirements remain open alongside complete exports and server-side layout preparation.
The final [Chromium result](../artifacts/editor/layout-wrapping-result.json) and [Chrome for Testing result](../artifacts/editor/layout-wrapping-chrome-result.json) each passed 168 checks with 280 inputs.
The [source audit](../artifacts/editor/wrapping-final-source-audit.json) matches all 119 captured source files across eight workflow results.
The [implementation checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-row-wrapping-checkpoint) records commands, platform, visual review, and remaining limits.

## Ordinary frame padding

Frame Padding starts with Horizontal and Vertical fields and a native Individual sides disclosure.
Opposite sides with different fixed values display Mixed until an explicit assignment.
Expanding reveals Top, Right, Bottom, and Left without changing the document or history.
Paired and individual edits reuse the existing Properties draft safeguard, temporary preview, and atomic command path.
Each completed edit changes only the parent style and creates one Undo step.
Undo restores the original asymmetry and CSS declarations.

The ownership reader uses authored CSSOM declarations rather than copying computed pixel values into the document.
Absent padding starts at zero.
Physical fixed pixel values remain editable, including native exponent notation.
Logical padding, all resets, CSS-wide keywords, percentages, calculations, and unresolved source expressions require Code instead of guessed physical ownership.
An explicit physical longhand that independently overrides an unresolved shorthand remains editable on its own.
Untouched shorthand, expression references, side values, and declaration priorities remain authored.
Edited longhands are removed and appended in the same atomic batch so a later important shorthand cannot continue overriding them.

The minimum-width screenshot exposed misaligned paired inputs when Horizontal padding wrapped onto two lines.
The retained failing check is artifacts/editor/padding-alignment-baseline-result.json.
Aligning the shared field grid at its end corrects the inputs without a new layout wrapper.
Native CSSOM also serializes small pixel values as exponent notation, which initially turned an accepted numeric edit into a read-only Edit source field.
The real-editor observation and failing regression remain in artifacts/editor/padding-number-browser-baseline.json and padding-number-baseline-result.json.
The reader now recognizes that notation, and the focused corrected workflow also checks exact Undo/Redo.
Neither correction establishes a faulty doc_v1 architectural contract.

Padding reflows native children and grows an applicable Fit height without changing child styles or the clipping setting.
A Fixed height retains its authored value while the native decoration floor still applies.
For example, an authored 62 px border-box height with 40 px top/bottom padding and 3 px borders renders at 86 px.
The [Padding checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-frame-padding-checkpoint) records the final browser, source, and regression evidence.
At the Padding checkpoint, Gap gestures, alignment/distribution, sizing and constraints, Tokens, React source bindings, exports, and backend layout preparation remained required V1 work.

## Ordinary frame Gap

Properties and canvas handles edit one authored fixed-pixel Gap value for ordinary Row and Column frames.
Typing, local arrows, input dragging, and canvas dragging share the same numeric field and command path.
Every completed adjustment is one parent-only atomic batch and one Undo step.
Temporary native measurements locate participating-item gaps and wrapped-row gaps without saving row membership or geometry.
Absolute and hidden children create no handles; fewer than two participating children keep the numeric control available.
Handle coordinates are unavailable for unsupported transforms, direction, writing mode, reverse layout, or custom child order.

The ownership reader recognizes equal authored row and column gap values with compatible declaration priorities.
Absent or normal Flex gaps begin at zero, and native exponent notation remains editable.
Unequal axes, source expressions, CSS-wide values, incompatible priorities, and all resets retain their source rather than receiving guessed numeric ownership.
A deliberate numeric edit normalizes supported equal axes to one gap declaration while preserving its priority.
Locks, Code drafts, source references, canonical child order, child styles, and clipping remain intact.

The original drag cleanup restored a stale field number after command acknowledgement.
Blur then submitted that number as a second command, so one Undo did not restore the pre-drag value.
The retained failure is [gap-development-first-result.json](../artifacts/editor/gap-development-first-result.json), with its trace and screenshot beside it.
The field now resets from the latest applied value, and the regression asserts one command during pending acknowledgement and immediate Undo.

Native row review reproduced missing handles between wrapped lines with multiple unequal-height children.
The retained geometry failure is [gap-wrapped-rows-baseline-result.json](../artifacts/editor/gap-wrapped-rows-baseline-result.json).
A retained two-animation-frame drag also reproduced its active input disappearing during reflow.
The [reflow failure](../artifacts/editor/gap-wrapping-gesture-frame-baseline-result.json) and [diagnosis](../artifacts/editor/gap-reflow-diagnosis-result.json) preserve that investigation.
Temporary row unions now locate real line gaps, and an active input remains mounted through completion of its pointerup handler.
These corrections do not introduce saved rows or a second layout authority.

Manual review and its [browser regression](../artifacts/editor/gap-contrast-baseline-result.json) reproduced number contrast of 4.19:1.
Using the existing editor ink token raises normal contrast to 17.28:1 and retains at least 12.28:1 in reviewed pressed and hover states.
Axe cannot determine the handle pseudo-element backgrounds, so the source audit also records real browser colors and manual contrast calculations.
The [Gap checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-frame-gap-checkpoint) records the final browser, regression, visual, cleanup, and source evidence.
Alignment/distribution, general sizing and constraints, Tokens, React source bindings, exports, and backend layout preparation remain required V1 work.
Installed stable Chrome and Windows remain unverified.
These are implementation corrections; no incorrect doc_v1 architectural contract was established.

## Ordinary frame alignment and distribution

Nine-point packed alignment and named Packed/Space between controls now project directly to the ordinary frame's authored CSS.
Row maps physical horizontal choices to justify-content and vertical choices to align-items; Column exchanges those responsibilities.
Packed changes also set align-content so wrapped Row lines pack as a group while unequal-height children align within their line.
Space between changes only justify-content and preserves Gap, child styles, canonical hierarchy, and every unrelated parent declaration.
Native overflow and zero/one-participant fallback were measured in development and built modes on Chromium and managed Chrome for Testing.
The controls preserve declaration priority and explicit longhands overriding shorthands without flattening source expressions.
Unresolved source expressions, CSS-wide alignment values, unsupported distribution values, reverse direction, RTL, and vertical writing modes remain available through Code.
Cross-axis source ownership does not prevent an independently owned distribution change.

A real draft-dialog workflow reproduced incorrect source-ownership feedback after an external revision change.
The retained [manual observation](../artifacts/editor/alignment-stale-result.json) and [failing E2E regression](../artifacts/editor/alignment-stale-message-baseline-result.json) record the diagnosis before correction.
The shared alignment preparation now checks the applied revision first and reports "The layout changed. Try again." without sending an edit.
The passing regression preserves the exact newer applied state, geometry, and history.
No faulty doc_v1 architectural contract was established.

The [alignment checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-frame-alignment-and-distribution-checkpoint) records browser, history, saving, regression, minimum-width, accessibility, and cleanup evidence.
Its [source audit](../artifacts/editor/alignment-final-source-audit.json) matches 135 source files and nine workflow results and independently verifies 120 parent-only alignment edits.
General sizing, constraints, Tokens, React bindings, exports, and backend layout preparation remain required V1 work.
The accepted account-menu and sidebar examples must still be verified with actual nested Fixed/Fit/Fill sizing and resizing when sizing controls are implemented.
The fixed-card alignment fixture does not establish those composed workflows.
Installed stable Chrome, Windows, and screen readers remain unverified.

## Ordinary sizing preflight and stopping point

Development paused at the user's request on 2026-10-11 after completing alignment and the running sizing preflight.
No sizing controls or new authored layout projection were implemented.
The [missing-control baseline](../artifacts/editor/sizing-missing-controls-baseline-result.json) fails when a Width sizing selector is required; the existing read-only Fill label is not that control.

The [corrected preflight](../artifacts/editor/sizing-preflight-verified-result.json) exercises the current renderer through real application commands in development and built modes.
Each mode passes 19 rendering cases on Chromium 153.0.8010.12.
The [audit](../artifacts/editor/sizing-preflight-final-audit.json) matches 135 unchanged source files and verifies both owned application ports closed with zero browser errors.
Commands, inputs, native boxes, screenshots, traces, tested commit, working-source hashes, and the verifier fingerprint are retained beside that result.
Repeat with `ORC_SIZING_EVIDENCE=preflight-verified bun artifacts/editor/sizing-preflight.ts` after building.

- A 300 px Row with a 10 px Gap and unequal decoration still renders 170/120 px with zero Flex bases.
- A common 100 px basis with normalized shrink factors renders 245/245, 145/145, and 70/70 px at parent widths 500, 300, and 150 px.
  At widths 100 and 60 px, the decorated child's physical floor produces 50/40 and 50/0 px.
- Changing decoration without changing its numeric shrink factor reproduces 77.5/62.5 px at parent width 150 px.
- One active length variable feeding both padding and the shrink expression preserves 70/70 px for padding values 20, 30, and 5 px.
  Substituting percentage padding reproduces 72.3125/67.6875 px because the references differ.
- A shared active parent basis variable with values 80, 100, 160, and 250 px reflows both children without further child edits.
  Parent widths 300 and 150 px produce 145/145 and 70/70 px respectively in this bounded fixture.

The preflight itself first assumed a revision increment for a no-op command and then retained a keyed Width input replaced during ownership measurement.
The failed results remain in sizing-preflight-result.json, sizing-preflight-corrected-result.json, and sizing-preflight-final-result.json under artifacts/editor/.
The last failed verifier is retained as sizing-preflight-stale-handle.ts with its recorded fingerprint.
Waiting for the actual acknowledged revision and resolving the live input correct those verifier failures without changing application code.

Resume by implementing the accepted Fixed/Fit/Fill controls through the existing property preview and atomic command path.
Decoration-dependent factors must stay correct through supported padding/border changes, using an active authored input or atomic dependent updates rather than a second saved measurement model.
Preserve literal imported styles, arbitrary source expressions, declaration priority, locks, history, saving, and exports; unsupported ownership must remain explicit.
These probes select no wrapped-Fill preferred basis and establish no general percentage-decoration mapping.
Fixed shrink behavior, Fit with Absolute children, bounded-parent dependencies, wrapped line formation, size limits, nested account-menu/sidebar examples, direction switches, history, save/reopen, and exports still need actual implementation checks.
No faulty doc_v1 architectural contract was established and no documentation contract was changed.

## Ordinary Absolute Position

The ordinary Row/Column child control now uses the existing measured Free/flow placement helpers and active position CSS variable.
Turning on captures the parent's coordinate reference, removes the child's flow contribution, and preserves its identity, parent, sibling slot, unrelated CSS, and content.
Turning off removes active absolute offsets and rejoins the same sibling position through one selected-child-only atomic batch.
The parent and siblings reflow natively, including Fit changes and wrapped line formation.
The Constraints editor is still required V1 work; participation does not establish its complete UI or conversion support.

The [first failing workflow](../artifacts/editor/participation-development-first-result.json) and [diagnosis](../artifacts/editor/participation-ownership-diagnosis.json) reproduced the reader rejecting its own CSSOM-synthesized inset shorthand.
Reading actual declarations fixes that ownership error without flattening source expressions.
The [focused rejection baseline](../artifacts/editor/participation-rejection-baseline-result.json) also reproduced a stale checked control after native preview rollback.
Canonical refresh could schedule ownership measurement while the temporary preview was still rendered.
Pending actions now cancel those reads, and completion always schedules a fresh canonical read.
The same [probe](../artifacts/editor/participation-rejection-probe.ts) passes [after correction](../artifacts/editor/participation-rejection-corrected-result.json); the permanent workflow checks rollback and successful retry.
The Chrome verifier's separate synchronous checkbox assumption now waits for command acknowledgement and rendering.
The combined regression runner's initial timeout and the deliberately interrupted investigation remain recorded; the final complete sequential run passes.
No accepted architectural contract changed, and no doc_v1 correction was required by these failures.

Both final participation workflows pass 36 check groups and 154 inputs in development and built modes on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57.
Layout, movement, Gap, Padding, alignment, pending history, and the required static/build checks also pass.
The [source and command audit](../artifacts/editor/participation-final-audit.json) matches 138 current source files and independently checks 124 selected-child-only commands across seven workflow results.
It retains the failing and passing rejection controls, hashes 15 final traces, and confirms 17 owned ports closed with no scoped processes remaining.
The [manual review](../artifacts/editor/participation-manual-review.json) verifies keyboard focus, both placement states, 44 px targets, no overflow at 240 px panel width, and zero violations/incomplete checks in both scoped axe scans.
Source-owned position/inset expressions, unsupported transforms, reverse/RTL source placement, and unmeasurable relationships remain Code boundaries.
General sizing, full Constraints, React bindings, complete exports, backend preparation, and supported-platform verification remain open V1 work.

The next sizing checkpoint should add explicit per-axis Fixed/Fit choices for proven ordinary Flex and Text relationships through the existing preview and atomic command path.
Do not infer Fit from every auto dimension, flatten arbitrary source expressions, or treat a computed pixel size as proof of an independently bounded parent.
Fixed main-axis dimensions must disable understood Flex grow/shrink and use an auto basis while preserving the other axis.
Keep existing Fill and Constraints ownership readouts intact until their conversions pass the retained dependency, decoration, and wrapping counterexamples above.
Free frames containing absolute children do not establish content-enclosing Fit through a simple intrinsic CSS declaration.
Verify nested account-menu/sidebar layouts, direction conversions, source preservation, rollback, history, and saving before claiming that sizing checkpoint complete.

## Ordinary Fixed/Fit controls

The bounded ordinary Fixed/Fit checkpoint now passes development and built workflows on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57.
Each browser records 38 check groups and 272 inputs in the [Chromium](../artifacts/editor/sizing-verification-result.json) and [Chrome](../artifacts/editor/sizing-chrome-result.json) results.
The [implementation record](../IMPLEMENTATION_STATUS.md#ordinary-fixedfit-sizing-checkpoint) describes its supported relationships and exact corrections.
Fixed captures used CSS dimensions rather than transformed rectangles and disables understood main-axis Flex growth/shrinkage.
Supported Fit follows participating content, gaps, padding, wrapping, and limits, without changing clipping or including Absolute/hidden children.
The selected node's axis and understood main-axis factors change together through one style batch and Undo step.
Literal source values, priority, unrelated dimensions, hierarchy, and content remain intact.
Existing Fill and Constraints readouts, arbitrary source expressions, unsupported content, and undefined dependencies remain explicit boundaries.

The retained [numeric semantic conversion](../artifacts/editor/sizing-factor-numeric-diagnosis.json) and [target cascade](../artifacts/editor/sizing-target-diagnosis.json) controls demonstrate failures before and passing identical interactions after their fixes.
The [external reload archive](../artifacts/editor/sizing-reload-baseline/manifest.json) preserves interrupted verification caused by ignored research HTML triggering Vite.
Run runtime checks with repository source, HTML, CSS, and Markdown writes frozen, including research artifacts.
Use in-memory browser content or files outside the repository for concurrent native research.
The [final audit](../artifacts/editor/sizing-final-audit.json) verifies 141 source hashes, 172 trace-bound sizing commands, final traces, cleanup, and the retained negative controls.
The [manual review](../artifacts/editor/sizing-manual-review.json) verifies minimum panel width, target sizes, keyboard and numeric behavior, clipped overflow, and scoped accessibility.
No accepted architectural contract changed.

General Fill remains V1 work, including equal outer shares with unequal decoration, current inputs after decoration/source changes, and verified per-row line formation.
The [new native research](../artifacts/editor/fill-research/result.json) records 550 successful bounded states and five expected counterexamples in managed Chrome for Testing.
Its explicit owned inputs do not establish general editor ownership, history, saving, exports, cross-axis conversion, or wrapped Fill support.
The [bounded cross-axis Fill checkpoint](#bounded-cross-axis-fill) now implements ordinary cross-axis stretch, independently defined parent bounds, and explicit conversion back to Fixed/Fit.
Preserve valid intrinsic Fit/Fill combinations and guard later parent sizing, direction, wrapping, participation, and reparenting changes.
The [effective automatic-margin correction](#effective-cross-axis-automatic-margins) now preserves variable-resolved ownership; a broad cross-Fill readout still does not prove conversion capability.
Free-frame content-enclosing Fit, full Constraints, React bindings, backend preparation, exports, and supported-platform verification also remain unfinished.

### Effective cross-axis automatic margins

The shared reader previously compared authored margin strings to literal `auto`, mislabeling variable-resolved automatic margins as Fill and causing false direction-conversion rejection.
Native computed automatic margins now suppress cross-axis Fill recognition without flattening the authored expressions or changing intrinsic sizes.
The [implementation checkpoint](../IMPLEMENTATION_STATUS.md#effective-automatic-margins) links the failing baseline, retained permanent regression, both-browser focused checks, and final sizing/movement/layout results.
The separate [Movement readiness correction](../artifacts/editor/cross-margin-movement-timing-baseline/manifest.json) waits for the scheduled ownership readout before asserting it; its original failure and all assertions remain retained.
This correction establishes ownership accuracy for the tested margins; new Fill availability additionally requires independent parent bounds, source ownership, and verified native candidate behavior.

### Bounded cross-axis Fill

The [application checkpoint](../IMPLEMENTATION_STATUS.md#bounded-cross-axis-fill) verifies explicit Height Fill in ordinary nowrap Rows and Width Fill in ordinary nowrap Columns with independently owned active parent bounds.
Numeric Fill remains read-only; mode conversion has its own permission, preserving supported Fixed/Fit exits and existing valid intrinsic stretch.
The selected node's physical axis and explicit stretch change atomically without modifying its other axis, Flex factors, limits, margins, decoration, clipping or hierarchy.
Both browsers pass development and built sizing workflows, and layout, participation, movement and pending history regressions pass.
The [audit](../artifacts/editor/cross-fill-final-audit.json), [manual review](../artifacts/editor/cross-fill-final-manual-review.json), and [source archive](../artifacts/editor/cross-fill-verified-source.json) retain the exact scope and evidence.
The missing-control and overflow failures, fixture isolation correction, clipping acknowledgement wait, complexity findings and obsolete readout assertion remain archived rather than being reported as runtime successes.
No architectural correction to doc_v1 was required.

The next [main-axis plan](../artifacts/editor/main-fill-native/plan.md) starts with one growing child, independently bounded nowrap parents, and owned nonshrinking Fixed/Fit siblings.
Its [native parent rerun](../artifacts/editor/main-fill-native/result.json) records 1,020 positive observations, four expected automatic-minimum counterexamples to an incomplete oracle, six source-ownership exclusions and one expected multiple-grow unequal-decoration counterexample.
Automatic content minima are valid preserved overflow; entering Fill must not silently insert zero minima to force a smaller box.
That candidate still needs actual control, preview, command, history, saving and later-action verification.
Parent Fit, direction/wrapping, participation, reparenting, sibling membership and Code changes must preserve supported relationships or clearly refuse unsupported conversions.
General equal outer sharing with unequal decoration and wrapped line formation remain required V1 work beyond that first main-axis slice.

### Bounded single-grow main-axis Fill

The [application checkpoint](../IMPLEMENTATION_STATUS.md#bounded-single-grow-main-axis-fill) now verifies Width Fill in ordinary nowrap Rows and Height Fill in ordinary nowrap Columns with independently owned active bounds and supported nonshrinking Fixed/Fit siblings.
The selected axis and exact native auto/1/0/0px projection change atomically while limits, decoration, margins, clipping, the other axis and hierarchy remain authored.
Automatic content minima remain valid preserved overflow, with no silent zero-minimum insertion.
Shared placement guards require a supported one-grow cohort before later parent sizing, direction/wrapping, participation or reparenting actions submit changes.
Independent pixel-owned Fixed participants remain supported with aspect ratios; ratio-dependent Fit/Fill relationships remain source boundaries.

Both browsers pass development and built sizing workflows, and layout, participation, movement and pending history pass.
The [final audit](../artifacts/editor/main-fill-final-audit.json), [manual Row review](../artifacts/editor/main-fill-manual-review.json), [verified source archive](../artifacts/editor/main-fill-verified-source.json) and [Markdown-only follow-up proof](../artifacts/editor/main-fill-post-documentation.json) retain their exact scope and limitations.
The [pointer ratio failure](../artifacts/editor/movement-main-fill-ratio-baseline-result.json) and [combined-browser runner timeout](../artifacts/editor/main-fill-runner-timeout/manifest.json) remain recorded separately from passing results.
No incorrect doc_v1 architectural contract was established and no documentation contract changed.

General multiple-child equal outer sharing with unequal decoration, live inputs after supported source/decoration changes, and wrapped line formation remain required V1 work.
The retained native unequal-decoration counterexample still rules out treating a zero Flex basis alone as general equal outer sharing.
Source expressions, logical/reset sizing, effective main-axis automatic margins, unsupported transforms, unbounded parents and uncertain content dependencies remain explicit Code boundaries.
Implement full Constraints, Tokens, React source bindings, complete exports and backend layout preparation before V1 completion.
Installed stable Chrome, Windows, full-application accessibility and screen readers remain unverified.

### Bounded nowrap multiple-child Fill sharing

The [2026-10-14 application checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-nowrap-fill-sharing-checkpoint--2026-10-14) now verifies supported equal outer sharing with unequal owned pixel decoration on both main axes.
Child-local numeric CSS inputs and exact variable expressions retain native resizing and min/max allocation across both box models.
The shared preparation freezes applied ownership and updates final cohorts atomically for supported sizing, padding, reparenting, participation, Free conversion and deletion.
Locked peers block only actual dependent writes; equivalent numeric declarations such as `2e2px` retain their source text.
The [failing baseline and final audit](../artifacts/editor/fill-sharing-finish-audit.json) record that no-op lock regression and the retained passing editor check.
The expanded workflow includes three Fill children, source ownership, native padding previews, cancellation, survivor rebasing, history and save/reopen.

Sizing, movement, layout, padding and participation pass in development and built modes on Chromium 153.0.8010.12 and managed Chrome for Testing 154.0.8037.57.
The final audit binds those results to an archived source checkpoint, actual recorded command responses and clean application shutdown.
All seven static/build/tooling checks pass with existing Fallow advisories retained.
The native 2,126-state matrix remains independent historical CSS research, rather than certification of the full application or exports.

Wrapped Fill still requires a verified line-formation basis and per-row allocation policy before its controls can claim general support.
Broader intrinsic dependency chains, arbitrary imported/logical ownership and fractional-border snapping remain unresolved boundaries.
Native dimensions near engine limits have not been established by this ordinary-value proof; investigate their used-value and candidate-validation behavior before extending that claim.
Do not flatten authored expressions, change automatic minima or save measured dimensions to hide these limits.
Full Constraints, Tokens, React source integration, assets, complete exports, installed stable Chrome and Windows verification remain V1 work.
No accepted doc_v1 contract changed and no compiler migration occurred.

### Ordinary wrapped Row Fill

The [wrapped Fill checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-wrapped-row-fill-checkpoint) now verifies ordinary owned per-row main-axis sharing in development and built Chromium and managed Chrome.
Its child-local common outer basis supplies native line formation, including a sole Fill child, while the browser independently allocates each row under existing minima and maxima.
The [final source/command audit](../artifacts/editor/wrapped-fill-final-audit.json) retains focused and complete sizing checks plus movement, layout, padding and participation regressions.
The native 224-state matrix independently predicts row membership and allocation with unequal padding/borders, both box models, mixed Fixed/Fit siblings, automatic minima, margins and serialization.
The actual editor proof covers source-variable display/direction/wrapping without rewriting parent expressions, incomplete rows, resize, Gap/Padding reflow, preview cancellation, locks, source drafts, size limits, clipping, deletion rebasing, participation, single-grow wrapping, pointer adoption, exact history and save/reopen.
Standalone serialized ordinary HTML also reflows at a different width without freezing measured child sizes.

The explicit ordinary basis remains `B = max(200, max(current owned decoration) + 100)` CSS px across the frame's Fill children.
Native hypothetical outer sizes determine line membership; no per-row registry, saved card count or Grid control was added.
A future change to this line basis must retain the source, mutation and responsive evidence rather than treating different row membership as an incidental refactor.
Wrapped cross-axis Fill, broader intrinsic dependencies, arbitrary imported/logical ownership, fractional borders and values near native engine limits remain outside this main-axis proof.
Full Constraints, Tokens, React source integration, assets, complete exports, installed stable Chrome and Windows verification remain V1 work.
No accepted architecture or doc_v1 contract changed.

## Current keyboard ownership boundaries

The ordinary keyboard workflow now preserves supported native offsets and own transforms, with real geometry, history, and save/reopen checks in `scripts/e2e/editor/check-movement.ts`.
Transformed or CSS-zoomed ancestors, logical insets, Grid or `display:contents` parents, and reverse/RTL source-controlled Flex order currently require Code until their coordinate and structural ownership is implemented reliably.
Held-key grouping, several selected Flex children, pointer gestures, and React source-binding movement remain full V1 implementation work rather than a completed geometry feature.

## Evidence and next checks

The independent research report is [.unlazy/v1-resume/reports/layout-mapping.md](/home/eren/D/orc-web/.unlazy/v1-resume/reports/layout-mapping.md).
Its ignored probe is [.unlazy/v1-resume/reports/layout-probe.ts](/home/eren/D/orc-web/.unlazy/v1-resume/reports/layout-probe.ts).
The parent rerun passed 346 measured assertions across 76 retained fixture states in `artifacts/editor/layout-mapping-2026-10-08T15-58-02-538Z/measurements.json`.
The suite asserts both bounded successful mappings and the counterexamples above.
It uses Playwright Chromium 153.0.8010.12 on Linux and does not certify editor workflows, installed Google Chrome, or Windows.
Retain these negative controls when replacing a proposed mapping, then verify the accepted behavior through the application before marking this work resolved.

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

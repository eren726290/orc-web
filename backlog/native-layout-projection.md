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
General Fill conversion, Row wrapping controls and persistence across Column, source-bound React layouts, and the measured projection limits above remain V1 work.
The [Code Apply identity record](code-apply-identity.md) records the equivalent-source correction found during layout round-trip verification and the remaining identity work.

### Unfixed automatic-margin conversion

Interactive verification reproduced a 30 px horizontal jump when changing a Row to Free with a child authored as `margin-left:auto`.
The child's screen x coordinate changed from 649 to 619 because its used Flex margin was 30 px, while the absolute-positioned margin resolved to 0 px.
The shared Free placement calculation currently subtracts the old used margin when saving Left.
The original observation remains in ignored `artifacts/editor/layout-auto-margin-baseline.json`.
Correct the shared conversion while preserving authored margins, and retain E2E checks for automatic margins, including variable-resolved values, before declaring layout switching verified.
This issue remains unfixed in the current checkpoint.

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

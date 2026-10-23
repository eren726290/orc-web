# Intrinsic sizing workflow

This folder owns the focused ordinary intrinsic Fit/Fill E2E fixtures, browser actions and requirements assertions.
The entry point is `../check-intrinsic-sizing.ts`.
The accepted requirements are `doc_v1/interface/flex-layout.md:217`, `doc_v1/interface/flex-layout.md:234`, `doc_v1/interface/properties-panel.md:205` and `doc_v1/interface/text-editing.md:37`.
The retained pre-change editor baseline is `.unlazy/intrinsic-fill/editor-baseline/result.json`.

`fixtures.ts` defines independent descendant, sibling and text supply without using the selected object's current Fixed size as future supply.
`support.ts` reuses the existing session/command helpers and owns native observations, atomic edit/history assertions and scenario evidence.
`core.ts` checks new Fill entry, parent Fit conversion, circular refusal and source ownership on both physical axes.
`projection.ts` checks sole Column content response, minima, decoration, nested dependent conversions, locks and bounded second-Fill joins.
`guards.ts` checks preview/cancellation, Code drafts, stale preparation, command rejection, pending Undo and text/contributor removal.
`persistence.ts` checks source round-trip, standalone responsive source and UI save/reopen.
`shared-column*.ts` checks native shared Column entry and parent Fit conversion with two/three Fill children, changing Fit siblings, simultaneous limits, decoration, margins, both box models and nested independent supply.
Its independent allocation oracle checks actual parent budget against constrained equal outer shares, overflowing minima, unused capped space and physical gaps.
The workflow also covers locks, numeric preview cancellation, Preview, selected-object Code draft cancel/discard, exact command history, stable mounted children through opted-in Fit/Fixed changes, equivalent generated Apply identity, script-free standalone HTML and save/reopen.
The historical failing-before shared Column runner result is retained under `artifacts/editor/intrinsic-column-before-chromium-shared-column-*`; new assertions require a frozen-source verification before being treated as passing.
`shared-column-ancestor.ts` distinguishes a nested Column's own intrinsic budget from actual Fixed-Row cross-axis stretch supply, including physical/logical automatic margins and a variable-resolved auto margin.
`shared-column-interactions.ts`, `shared-column-properties.ts` and `shared-column-membership.ts` exercise the opted-in wrapper through keyboard/pointer order and reparenting, visible insertion markers, explicit Free/Row exits, Gap Properties/handles, parent/child padding, alignment/distribution, Absolute participation and deletion safeguards.
`placement.ts` checks shared-source to sole-intrinsic and independently supplied shared-intrinsic pointer placement, cached previews, cancellation, exact history, standalone source, saving and true circular refusal.
`wrapped.ts` checks Fit-height wrapped Row entry, row-local empty/occupied reflow, last-supplier safeguards, responsive standalone source and save/reopen.

Run `bun scripts/e2e/editor/check-intrinsic-sizing.ts` after the application source and build are frozen.
Set `ORC_INTRINSIC_SCENARIO=core|projection|guards|wrapped|placement|persistence|shared-column` to select a scenario, or use the default `all`.
Set `ORC_INTRINSIC_MODES=development|built` to select one application mode, or use the default `development+built`.
Pass `chrome` with `ORC_CHROME_EXECUTABLE` to identify another Chrome executable.
`ORC_INTRINSIC_EVIDENCE` names the screenshots, traces, inputs and source-bound JSON record under `artifacts/editor/`.
The shared-column workflow is the regression target for the approved internal native wrapper projection.
Authored assertions alone do not establish runtime support; use the recorded source-bound results to determine verified coverage.
Wrapped Height Fill follows its native row's extent, which can be zero for an empty row even when another row supplies independent content.
They preserve existing bounded zero-row and Fixed-zero behavior through the separate existing sizing regressions.

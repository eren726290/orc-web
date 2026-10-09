# Source parser bundle size

Status: initial dependency boundary corrected; supported-browser load timing remains V1 verification work.

The ordinary SVG correction originally imported the installed HTML grammar through CodeMirror, bringing editor support into the initial JavaScript bundle.
The focused review compared the existing extractor against a direct import of the same installed `@lezer/html` 1.3.13 grammar.
All 40 fixtures matched for underlying HTML nodes/ranges, SVG root ranges, extracted content, and exact errors.
Mixed JavaScript/CSS trees differ, so importer validation and the Code window retain CodeMirror's language support.

The shared extractor now imports the grammar directly in [`shared/source/svg-source.ts`](../shared/source/svg-source.ts).
[`package.json`](../package.json) and [`bun.lock`](../bun.lock) declare the exact direct pin; resolved package versions remain unchanged.
The 2026-10-08 production build reports 349.44 kB initial JavaScript and 383.47 kB deferred Code window JavaScript, with no chunk-size warning.
Before the change, initial JavaScript was about 708 kB.
The total JavaScript needed after opening Code is nearly unchanged.
Ignored `artifacts/parser-review/parser-probe.json` records installed versions, the corpus, source hashes, browser-entry measurements, and both actual Vite dependency graphs.
The development/built rendering and editor workflows passed after the dependency change.

Measure initial loading and parsing on supported browsers before release.
Preserve safe root parsing, SVG geometry, Code projection, history, and save/reopen regression checks.
Do not increase the warning threshold as a substitute for reviewing the cost.

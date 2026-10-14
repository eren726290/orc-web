# Application checks

Run checks from the repository root with the scripts in `package.json`.

| Folder                                    | Owns                                              |
| ----------------------------------------- | ------------------------------------------------- |
| [e2e/editor/](e2e/editor/README.md)       | Editor feature and history workflows.             |
| [e2e/projects/](e2e/projects/README.md)   | Saving, bundle preservation, locks, and recovery. |
| [e2e/rendering/](e2e/rendering/README.md) | Native source/rendering regressions.              |
| [runtime/](runtime/README.md)             | Browser mounting and startup/shutdown checks.     |
| [support/](support/README.md)             | Owned application processes and source evidence.  |
| [tooling/](tooling/README.md)             | Dependency pins and lint enforcement.             |

`dev.ts` remains the development entry point.
Package command names remain the stable way to run checks.

`tooling/check-tooling.ts` verifies exact installed pins, vendored source hashes, and positive and negative controls through the real Oxlint CLI.
The isolated linter controls cover plugin loading and enforcement that browser workflows cannot exercise.
`runtime/check-browser.ts` opens the development page and production preview, checks React mounting and styles, and captures repeatable evidence.
Build first with `bun run build`.
The default browser check requires installed Google Chrome.
The explicit Chromium check is a scaffold smoke check and does not certify the supported Chrome target.
Generated evidence goes to ignored `artifacts/scaffold/`.

`dev.ts` starts and owns the Bun backend and Vite frontend together.
`e2e/editor/check-editor.ts` verifies the ordinary text, Properties, Code, history, independent project, save/reopen, and recovery workflows in development and built modes.
`e2e/editor/check-history.ts` isolates immediate Undo while a real field-edit response is pending.
`e2e/projects/check-bundle.ts` verifies that unsupported saved data is visibly rejected without changing the session, disk bytes, or writable locks.
`e2e/editor/check-panels.ts` verifies pointer and keyboard resizing, cancellation, Code visibility, and independent project sizes without document history changes.
`runtime/check-lifecycle.ts` verifies startup failure cleanup, normal shutdown, and failed-save recovery using Linux process and HTTP observations.
Its `/proc` process inspection explicitly rejects other platforms instead of claiming Windows verification.
`e2e/projects/check-saving.ts` verifies failed first Save and Save as recovery, preservation of existing files, and exclusive writable locks in development and built modes.
Its metadata and permission fault controls require POSIX and do not certify equivalent Windows failures.
`e2e/rendering/check-rendering.ts` verifies SVG geometry and source agreement, rejection of concrete SVG render errors, meaningful HTML whitespace, and save/reopen in development and built modes.
`e2e/editor/check-layers.ts` verifies in-place naming, locks, drafts, history, save/reopen, and selected-row reveal and scrolling.
`e2e/editor/check-deletion.ts` verifies atomic subtree lock protection, overlapping selections, exact hierarchy history, and save/reopen.
`e2e/editor/check-preview.ts` verifies ordinary selected-frame eligibility, native control defaults and reset, form submission without navigation, nested percentage sizing, Edit pan/zoom restoration, and preservation of document/history and Code drafts.
`e2e/editor/check-atomic.ts` verifies ordinary batches, explicit CSS removal, sibling order and reparenting, destination capabilities, whole-command rejection, exact Undo/Redo, and save/reopen in development and built modes.
`e2e/editor/check-movement.ts` verifies native 1/8 px Free movement, responsive offsets, atomic selections, single Flex reordering, focus and draft protection, queued acknowledgement/history, and save/reopen in development and built modes.
`e2e/editor/check-clipping.ts` verifies the ordinary frame Clip content control, native clipping, retained child geometry and Layer access, locks and drafts, atomic command rejection, history, and save/reopen.
`e2e/editor/check-layout.ts` verifies ordinary Free/Row/Column switches, Row wrapping, measured Fixed Free placement, explicit Absolute participation, native geometry, locks/drafts, exact history, and save/reopen.
Wrapping checks cover bounded native line formation, item/row gap, Fixed and existing CSS Fill sizing, Fit height, Fixed-height clipping, source ownership, and remembered Row choices across Column/Free and reopening.
`e2e/editor/check-padding.ts` verifies paired and single-side frame padding, Mixed values, disclosure without edits, native reflow, live preview and cancellation, native exponent notation, CSS ownership and priority, locks/drafts, history, and save/reopen.
`e2e/editor/editor-properties.ts` also checks background shorthand precedence, image and priority preservation during color preview/commit/history, and unresolved shorthand ownership through the real editor.
Editor evidence lives in ignored `artifacts/editor/` and identifies the tested source and browser where applicable.

`e2e/editor/check-gap.ts` verifies typing, 1/Shift-8 input arrows, value scrubbing, native canvas handles, live cancellation, applied-revision/zoom cancellation, wrapping through row changes, CSS ownership, locks/drafts, pending Undo, and save/reopen.
`e2e/editor/check-alignment.ts` verifies the nine physical packed positions in Row/Column, named distribution, wrapped rows, zero/one participants and overflow, source priority and ownership, locks/drafts, exact history, focus, and save/reopen.
`e2e/editor/check-participation.ts` verifies ordinary Flex participation changes through the visible Absolute Position control.
`e2e/editor/check-sizing.ts` checks ordinary Fixed/Fit, bounded nowrap cross-axis Fill, and single-grow, multiple-child and per-row wrapped main-axis Fill sharing, including source ownership, native reflow, command history, and saving.
Fill checks cover separate numeric/conversion permissions, parent bounds, effective automatic margins, decoration floors and size limits, overflow feedback, draft/rejection/history safeguards, and native response after save/reopen.

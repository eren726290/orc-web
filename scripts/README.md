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
`e2e/editor/editor-properties.ts` also checks background shorthand precedence, image and priority preservation during color preview/commit/history, and unresolved shorthand ownership through the real editor.
Editor evidence lives in ignored `artifacts/editor/` and identifies the tested source and browser where applicable.

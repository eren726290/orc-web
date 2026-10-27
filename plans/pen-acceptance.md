# Pen acceptance map

This maps the implementation guide's 40 acceptance rows to repeatable checks.
Final current-source evidence belongs to [the integration ledger](pen-final-GATES.md).
A test location below is a verification claim only when its corresponding current-source gate passes.
Browser workflows run in development and built Chrome unless a row explicitly describes numerical or command-boundary checks.
The final 2026-10-26 run covers 39 rows and records X2 as an existing product dependency.
The [final report](pen-final-report.md) identifies the exact source/runtime evidence, source comparisons and remaining limits.

| Row | Check and independently observed behavior |
| --- | --- |
| D1 | `check-editor.ts` and `check-refusals.ts` exercise toolbar/P selection, retained guide state and normal Code typing. |
| D2 | `editor-flow.ts` checks the first local anchor and insufficient Escape without document/history change. |
| D3 | `editor-flow.ts`, `layout-flow.ts` and `nested-mapping.ts` check native clicked positions, frozen parent/flow slot, one revision and exact history. |
| D4 | `editor-flow.ts` checks one-segment arc mode reset; `check-interactions.ts` checks both directions, first-segment/collinear fallback and fundamental tangency under Alt. |
| D5 | `check-interactions.ts` checks angular bounds, closest candidates, tie order and Shift/Alt; the geometry uses angles rather than screen distances. |
| D6 | `check-drawing.ts` checks the actual capped preview, refused incompatible closing arc, exact line/arc closure and command count. |
| D7 | `interaction-flow.ts` and `check-drawing.ts` check continuation with the same containing node and one-command history. |
| G1 | `editor-flow.ts`, `layout-flow.ts` and `scripts/solver/oracle.ts` independently check persisted rule residuals after real drags. |
| G2 | `scripts/solver/checks.ts` exercises mutable first anchors and held-point/ripple behavior without fixing user points to the internal origin. |
| G3 | `check-interactions.ts` retains raw successful reversed output, guarded rejection and exact rollback; numerical solver checks cover collapsed-success controls. |
| G4 | `check-interactions.ts` checks coarse continuation/reversal; `check-lifecycle.ts` checks pending large-path return/release; numerical checks cover near-degenerate encoded arcs. |
| G5 | `check-lifecycle.ts` covers pointercancel, capture loss, blur/focus, tool, zoom, revision, project and Preview changes; pending Worker cases retain the whole applied document. |
| G6 | `editor-flow.ts` and `failure-flow.ts` check one command, exact return, cancellation and immediate Undo while the released command is held. |
| E1 | `interaction-flow.ts`, `check-drawing.ts` and numerical deletion controls cover open endpoints/interiors, closed deletion, affected rules and retained arcs. |
| E2 | `interaction-flow.ts` checks protected deletion, consumed Delete and ordinary below-two-anchor whole-node deletion. |
| E3 | Numerical adapter/data checks reconstruct arcs after rule removal and removal of the incoming segment, without adding a human rule-removal control. |
| E4 | Editor history/save/reopen and `check-drawing.ts` retain IDs and prove a new Undo branch allocates fresh IDs. |
| S1 | `check-record.ts` and `check-commands.ts` accept ordinary SVG and strict optional record version 1. |
| S2 | Record checks reject malformed versions/IDs/topology/numbers/source; real command and bundle checks retain session, history and original bundle bytes. |
| S3 | `check-source.ts` checks equivalent/no-op and formatting-only source Apply with retained metadata. |
| S4 | `check-source.ts` checks paint/stroke bounds, native positions and explicit detachment for geometry, inner transforms, extra artwork and incompatible/missing viewBox. |
| S5 | `check-source.ts` checks meaningful ancestor replacement, fresh descendant identities, ordinary resulting SVG, notice and exact Undo. |
| S6 | `check-source.ts` checks standalone source without metadata/overlays and ordinary whole-object reimport. |
| S7 | `check-editor.ts` saves, closes and reopens through real dialogs and compares the complete document. |
| L1 | `layout-flow.ts`, `nested-mapping.ts` and transform checks use actual SVG matrices under scale, rotation, origin changes, scrolling and zoom. |
| L2 | Layout/transform/source checks independently compare native projected positions and declared 0.1-screen-pixel tolerance after reboxing. |
| L3 | `layout-flow.ts` covers Free, Row, Column, wrapping and intrinsic shared Column ancestry with exact command history. |
| L4 | Native layout and refusal checks cover intrinsic Fill supply, complete dependency preparation and explanatory refusal when flow shifts the frozen origin. |
| L5 | Real command checks refuse own/ancestor locks and actual coupled writes to locked peers; native reflow without peer CSS writes is a positive control. |
| L6 | `check-refusals.ts` covers locked/ambiguous/transformed destinations and source-owned dimensions without mode conversion; existing native ownership guards remain authoritative. |
| U1 | `interaction-flow.ts` and `check-lifecycle.ts` retain view-only guides across project tabs and Preview without document changes. |
| U2 | `nested-mapping.ts` independently compares guide/anchor positions after nested rotation, clipping, scroll and zoom; lifecycle checks cancel stale interactions. |
| U3 | `check-refusals.ts`, `failure-flow.ts` and lifecycle checks retain typing, consume owned keys and cancel local gestures without extra document history. |
| U4 | Source and transform suites exercise actual Fill/Stroke/Stroke width/Scale/Rotation fields and pointer controls with retained rules and exact history, accurate read-only Fixed size readouts and the visible scrolling-form header. |
| R1 | `check-editor.ts` verifies actual app WASM responses against the pinned bytes/hash; Bun/browser adapter and provenance checks verify imports/toolchain/build inputs. |
| R2 | Editor/refusal checks cover held real-load cancellation without a late draft, blocked loading Delete, asset retry, actual WASM trap/invalid buffer in the Worker, failed Worker startup and fresh-gesture retry without document changes. |
| R3 | `check-lifecycle.ts` covers repeated local IDs across paths and project changes; a gesture owns a disposable Worker/instance and cancellation terminates it. |
| R4 | `check-performance.ts` records request work, complete native/overlay work, Worker solving, complete preview latency and continuous pointer-to-second-frame observations at 20/402 anchors. |
| X1 | `check-source.ts` opens a standalone SVG without solver/metadata and independently checks native analytic length. |
| X2 | Dependency: baseline product image/PDF exporters do not exist, so no product-export completion is claimed. |

Clipboard duplication is also an existing product dependency.
Portable cloning preserves records, but this task does not invent a new clipboard workflow.
The public released format remains to be settled before release; older builds safely reject projects containing own Pen records.
Windows and public MCP behavior remain unverified and outside this human Pen extension.

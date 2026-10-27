# Review and planning records

This directory holds assessments and proposed work for discussion before implementation.
An assessment does not authorize its recommendations or change the accepted V1 contracts.

| Record | Status | Scope |
| --- | --- | --- |
| [Pen guide-label readability](001-pen-guide-label-readability.md) | Implemented and reviewed in the Pen checkout; see [report](pen-guide-label-report.md) | Focused readability fix, retained P reproduction inputs, preserved guide/handle behavior, browser acceptance cases and source-bound verification. |
| [Pen agent handoff](pen-agent-handoff.md) | Prepared for the owner's independent pen-agent session | Start here for scope, behavior, corrected contracts, evidence, worktree boundaries, and open adoption decisions. |
| [Pen implementation and verification guide](pen-agent-implementation.md) | Staged plan; application implementation not started by this handoff | Source map, milestones, prerequisite handling, acceptance matrix, checks, and completion conditions. |
| [CAD pen proposal assessment](cad-pen-review.md) | Reviewed; see the prepared handoff for next work | Proposal correctness, current ORC integration, pinned solver source, and required verification. |
| [Proposed contract clarifications](pen-contract-clarifications.md) | Clarified for discussion and isolated confirmation | Geometry, source compatibility, commands, numeric handling, coordinates, and input ownership. |
| [Local WASM confirmation](pen-wasm-confirmation.md) | See recorded outcomes and limitations | Native baseline, Bun and Chrome fixture checks, raw evidence, and remaining integration work. |
| [Ignored solver diagnostics](pen-diagnostic-results.md) | Three diagnostics executed and measurements reviewed | Disabled-helper comparisons, expanded continuation coverage, and remaining direct-solver limits. |
| [Figcraft reference](figcraft-reference.md) | Bounded source review | Relevant coordinate and gesture patterns without changing ORC's renderer or scope. |

All records in this directory are temporary, as requested by the owner.
The [confirmation gates](pen-confirmation-GATES.md) track this isolated task and do not certify the production pen feature.
The [handoff checks](pen-handoff-GATES.md) track the documentation deliverable separately from production implementation or runtime verification.

# Pen implementation records before main integration

The following records describe the separate Pen branch checkpoint before integration.
Historical source identities and outcomes remain tied to their recorded checkouts.

| Record | Purpose |
| --- | --- |
| [Progress](pen-progress.md) | Checkout, decisions, scope, evidence, and the next bounded task. |
| [Start gates](pen-start-GATES.md) | Observable checks for the initial checkout and adoption checkpoint. |
| [Solver gates](pen-solver-GATES.md) | Numerical adapter, pinned build, and isolated Chrome acceptance. |
| [Data gates](pen-data-GATES.md) | Strict portable record and atomic command/history/save acceptance. |
| [Editor gates](pen-editor-GATES.md) | First real drawing/editing workflow, native preview and application asset loading. |

The root `GATES.md` is outside this task and remains unread and unchanged.

The [mapping ledger](pen-mapping-GATES.md), [interaction ledger](pen-interaction-GATES.md) and [transform contract](pen-transform-contract.md) record subsequent work.
The [Worker correction](pen-worker-plan.md) records the measured remedy and scope.
The [acceptance map](pen-acceptance.md) maps every implementation-guide row to checks or explicit existing product dependencies.
The [final integration ledger](pen-final-GATES.md) owns current-source verification.

The [integration review](pen-integration-review.md) records shared-file overlaps with concurrent main-checkout work and the required combined-checkout verification.
The [final branch report](pen-final-report.md) records the checked source identity, completed checks, performance observations and remaining product/integration boundaries.

The [main integration record](pen-main-integration.md) records the completed combined-source verification separately from the historical Pen checkpoint.

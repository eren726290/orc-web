# Review and planning records

This directory holds assessments and proposed work for discussion before implementation.
An assessment does not authorize its recommendations or change the accepted V1 contracts.

| Record | Status | Scope |
| --- | --- | --- |
| [Pen guide-label readability](001-pen-guide-label-readability.md) | Prepared for the owner's existing pen-agent session; not dispatched | Focused readability fix, retained P reproduction inputs, preserved guide/handle behavior, browser acceptance cases and source-bound verification. |
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

# ORC-web V1 implementation plan

Status: in progress.
The accepted contracts in `doc_v1` determine scope.
Work stays on `master`; MCP follows the verified application.

## Checkpoints

| Checkpoint | Required outcomes | State |
| --- | --- | --- |
| Application foundation | Combined Bun/Vite development startup, built-app serving, graceful shutdown, authoritative project sessions, command validation, revisions, history, save/reopen and recovery. | In progress |
| Ordinary editor | Dashboard/project tabs, resizable panels, canvas tools and gestures, Layers, selection, locks, Properties, rich text, Code drafts and Apply, ordinary HTML/CSS/SVG and image editing. | Pending |
| Layout and tokens | Free/Row/Column, sizing, wrapping, constraints, clipping, supported token categories and references. | Pending |
| React editing | Source preparation, reliable bindings, nested selection, instance inputs, shared/Only this edits, source drafts, hidden content, supported collections. | Pending |
| Imports and live rendering | Supported local/npm/npx/shadcn imports, exact dependency records, Tailwind, Base UI and Motion composition, portable assets, frame Preview and runtime recovery. | Pending |
| Output | Applied-source export, HTML and React/CSS/Tailwind, background browser validation, screenshots, image/PDF exports, atomic publication. | Pending |
| Application verification | Repeatable E2E artifacts, failure controls, tool checks, supported-platform results with explicit limitations. | Pending |
| MCP | Shared application-service adapter and actual-client verification of the accepted V1 tools after application verification. | Pending |

## First acceptance slice

Verify New/Open, independent project histories, nested ordinary selection and edits, source reflection, Undo/Redo, save/reopen, rejected/stale/locked commands, failed-save recovery, and normal process cleanup.
Browser evidence records the tested revision, source fingerprint, inputs, commands, platform, and exact browser version.
Partial checkpoints are not a claim that V1 is complete.

# ORC-web documentation coverage audit

This temporary audit compares the original ORC V1 documentation with the current ORC-web specification.
It records browser-relevant gaps without assuming that Electron architecture, artboard-only structure, or desktop constraints must be copied.

## Already covered

| Feature area | Existing ORC-web source | Coverage |
| --- | --- | --- |
| Infinite workspace and loose root objects | `doc_v1/interface/workspace-and-canvas.md` | Accepted. |
| Frames, Free, Row, and Column | `doc_v1/interface/workspace-and-canvas.md` and `doc_v1/interface/flex-layout.md` | Accepted with open implementation details. |
| Flex layout and Constraints | `doc_v1/interface/flex-layout.md` and `doc_v1/interface/constraints.md` | Accepted behavior with identified open rules. |
| Layers, Properties, mixed selection, and component boundaries | `doc_v1/interface/layers-and-properties.md` | Accepted product behavior. |
| Tokens with Light and Dark values | `doc_v1/interface/tokens-and-modes.md` | Accepted product behavior. |
| Code drafts, Apply, and shared component source | `doc_v1/interface/code-window.md` | Accepted product behavior. |
| Text creation, inline editing, typography, rich formatting, overflow, and paste | `doc_v1/interface/text-editing.md` | Accepted product behavior; the canonical rich-text field remains an open model decision. |
| Component import from npm, npx, local source, and shadcn registries | `doc_v1/import-export/component-import.md` | Accepted human flow with open support policy. |
| React, HTML or CSS, raster, and PDF export | `doc_v1/import-export/export.md` | Accepted output set with open renderer details. |
| One document model, commands, revisions, Undo, and browser measurement authority | `doc_v1/architecture/*.md` | Covered at proposal or accepted-behavior level. |
| Local MCP direction and 39 public tools | `doc_v1/mcp/*.md` | Covered at catalog and shared-contract level. |
| Portable project bundle and autosave | `doc_v1/architecture/orc-workspace-bundle.md` | Proposed format. |

## Browser-relevant documentation gaps

| Feature | Status | Original source | ORC-web destination | Detail that needs a self-contained decision |
| --- | --- | --- | --- | --- |
| Product vision, audience, and V1 non-goals | Missing | `product/vision-and-success-criteria.md`, `product/v1-scope-and-non-goals.md` | `doc_v1/product/vision-and-v1-scope.md` | State who ORC-web serves, its one complete V1 workflow, and exclusions such as collaboration, cloud hosting, Grid, and unsupported import runtimes. |
| Terminology | Missing | `product/terminology.md` | `doc_v1/product/terminology.md` | Define workspace, frame, loose object, component, slot, design mode, Edit, Preview, draft, and export. |
| Editor chrome, Add flow, contextual states, and accessibility | Incomplete | `interface/editor-layout-and-ux.md`, `interface/layers-and-inspector.md` | `doc_v1/interface/editor-layout-and-ux.md` | Specify top bar, tool rail, Layers and Tokens tabs, Add destinations, empty states, focus, keyboard access, and feedback. |
| Canvas navigation and direct manipulation | Incomplete | `interface/canvas-interactions.md` | `doc_v1/interface/canvas-interactions.md` | Specify pan, zoom, fit, selection, multi-select, move, resize, insertion feedback, locked objects, and the exact Edit versus Preview interaction boundary. |
| Properties field rules and style contexts | Incomplete | `interface/layers-and-inspector.md` | `doc_v1/interface/layers-and-properties.md` and `doc_v1/interface/text-editing.md` | Text creation, inline editing, typography, overflow, rich formatting, and paste are now specified; section order, image controls, field commit rules, responsive style contexts, lock behavior, and inline errors remain incomplete. |
| Component manifest, slots, shared-source updates, and export readiness | Incomplete | `import-export/code-component-manifest.md` | `doc_v1/import-export/component-manifest.md` | Define the manifest shape, declared control types, slot limits, source update validation, and static-export readiness. |
| HTML, CSS, and Tailwind interchange | Missing | `import-export/html-css-tailwind.md` | `doc_v1/import-export/html-css-tailwind.md` | Define supported markup and CSS, identity preservation, CSS or token handling, asset import, allowed attributes, and known round-trip limits. |
| React import support policy | Incomplete | `import-export/react-and-shadcn.md`, `quality/security-and-sandboxing.md` | Expand `doc_v1/import-export/component-import.md` | Define the supported runtime subset, package-resolution model, lifecycle scripts, native addons, environment variables, network requirements, preview failures, and direct rendering trust boundary. |
| Image and PDF export contracts | Incomplete | `import-export/image-export.md`, `import-export/pdf-export.md` | Expand `doc_v1/import-export/export.md` or split `image-export.md` and `pdf-export.md` | Define dimensions, raster background behavior, selection ordering, PDF page sizing, text behavior, failure handling, and file publication. |
| Storage, assets, draft durability, locks, rename, and recovery | Incomplete | `architecture/orc-workspace-bundle.md`, `architecture/persistence-and-assets.md` | Expand `doc_v1/architecture/orc-workspace-bundle.md` | Define schema versioning, asset IDs, save failure behavior, locks, project rename, recovery, and platform file paths. |
| Data indexes and document invariants | Incomplete | `architecture/flat-node-map.md`, `architecture/canonical-document-model.md` | Expand `doc_v1/architecture/canonical-document-model.md` | Decide the canonical node indexing model, parent reconstruction, node ordering, component slots, token references, and layout fields. |
| Browser renderer and measurement protocol | Missing | `architecture/canvas-renderer.md`, `architecture/process-and-ipc-model.md` | `doc_v1/architecture/browser-renderer.md` | Define render layers, overlays, live component mounting, measurement requests, revision matching, and export renderer availability. |
| MCP operation contracts and agent workflows | Incomplete | `mcp/command-contracts.md`, `mcp/agent-workflows.md`, `mcp/tool-schema-guidelines.md` | Expand `doc_v1/mcp/command-contracts.md` and add `doc_v1/mcp/agent-workflows.md` | Define each tool input and result, error codes, idempotency, browser-measurement failures, and safe agent workflows. |
| MCP host and transport lifecycle | Incomplete | `mcp/mcp-foundation.md`, `mcp/stdio-transport.md` | Expand `doc_v1/mcp/mcp-server.md` | Decide Streamable HTTP details, session and endpoint lifecycle, authentication boundary for localhost, and whether a stdio adapter is needed. |
| Browser stack and UI component policy | Missing | `quality/development-environment.md`, `interface/shadcn-component-policy.md`, `decisions/ADR-009-application-chrome-ui-stack.md` | `doc_v1/decisions/` after stack choice | Record Bun or another runtime, React tooling, Base UI versus Radix decision, Tailwind policy, Oxlint, Oxfmt, and supported browsers. |
| Schema migration and compatibility | Missing | `quality/schema-versioning-and-migrations.md`, `quality/compatibility-and-migrations.md` | `doc_v1/quality/schema-versioning-and-migrations.md` | Define loading older bundles, failed migration safety, format reader identity, and MCP compatibility. |
| Quality, performance, accessibility, and release proof | Missing | `quality/testing-and-acceptance.md`, `quality/performance-budgets.md` | `doc_v1/quality/testing-and-acceptance.md` | Define browser test matrix for Fedora and Windows, acceptance scenarios, performance targets, and release evidence. |
| Original Electron-specific ADRs | Out of scope | `decisions/ADR-001` through `ADR-009` | No direct copy. | Recreate only browser decisions that are explicitly selected for ORC-web. |

## Small details previously missed

The original Layers and Inspector contract already placed Flex layout and Constraints under Properties.
ORC-web now has dedicated documents for both and defines which selection types receive their controls.
The section order, visual grouping, field-level interaction, and unavailable states still need more detail.
The three documents cross-link so a reader can move between the panel rules and each layout contract.

The original canvas contract also contains the practical details that make properties usable: moving versus reparenting, direct resize rejection for parent-controlled objects, selection feedback, and keyboard focus.
Those belong in a dedicated ORC-web canvas-interactions document, not as fragments scattered across Flex and Constraints.

The original component contract distinguishes outer component geometry from declared component properties and editable slots.
ORC-web has the high-level boundary but no self-contained manifest or slot contract yet.

The original import specification distinguishes inspection from import and records exact dependencies for reopening.
ORC-web covers the high-level flow, but not the package and runtime rules needed to make an import result reproducible.

## Next documentation work

1. Write product scope and terminology so later documents use stable words and a clear V1 boundary.
2. Write editor layout and canvas interactions, then expand Layers and Properties to define section order, image controls, tokens, locks, and errors.
3. Write component manifest and strengthen component import with package support and preview-failure rules.
4. Write HTML, CSS, and Tailwind interchange, then split export into code, image, and PDF contracts if one document becomes unclear.
5. Complete the persistence, renderer, MCP, schema migration, and quality contracts after the user-facing rules are stable.

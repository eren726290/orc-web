# Export

## Status

Accepted V1 output behavior with open renderer details.
The dedicated MCP [export contract](../mcp/tools/export.md) exposes this same exporter through one tool with explicit targets, format, local destination, and applicable options.

## Human flow

Export begins from the current selection.
The person opens Export at the bottom of Properties and chooses an available format.
For React output, they choose CSS or Tailwind styling.
For image or PDF output containing an interactive or animated component, they choose an explicit named design state before capture.
They click Export, choose a destination, and confirm the output.
Advanced settings remain collapsed until requested.
This section also supports several selected compatible objects, without requiring bulk Properties editing.
Code-copy actions remain in the Code window.

One selected frame or object creates one output.
Multiple selected frames or objects create separate files by default when the chosen format supports separate files.
The export interface offers a combine option where the format supports one combined output.
PDF always combines selected frames or objects into one document with one selected item per page.

## Formats

| Format | Intended output |
| --- | --- |
| React | Component source, CSS or Tailwind styling, managed assets, and dependency information. |
| HTML or CSS | Static web output when the selected content supports it. |
| PNG | Raster image. |
| JPEG | Raster image with an explicit background. |
| WebP | Raster image. |
| AVIF | Raster image. |
| PDF | A paged document for selected frames or objects. |

HTML output must explain when a selected live component cannot export faithfully as static HTML.
React output carries declared component and dependency information needed to use the generated source.
React + Tailwind output generates readable `className` utilities from canonical design styles and document tokens.
When a value cannot be represented faithfully by a supported utility, include supporting CSS instead of changing the design's appearance.
Tailwind output includes the theme and dependency information needed to build the exported React source.
The selected Tailwind version follows the project's toolchain decision.
The supported source-preserving Tailwind workflow is defined in [Tailwind components](tailwind-components.md).

## Fonts

Exports use copied project fonts when the selected content needs them.
ORC-web includes those font files only when their inclusion was confirmed when they were imported into the project.
An installed-font reference is never copied into an export.
If a required font is unavailable, export uses the same fallback shown in the editor and marks the result as using a fallback font.

The complete project and missing-font behavior is defined in [Font management](../interface/font-management.md).

## Workspace image output

Exporting a workspace image crops to the visible bounds of the objects included in the export.
It does not capture editor panels, selection outlines, resize handles, or guides unless a future diagnostic export explicitly requests them.
Canvas constraint indicators are editor overlays and are excluded from every export format.
It captures the selected named component state with time progression disabled.
The [local rendering service](../architecture/system-architecture.md#local-rendering-service) performs visual capture from the committed revision using the editor's shared rendering code and prepared styles.
Image and PDF capture can run with the editor tab closed when the local server has an active project and the required renderer is available.
It does not capture an arbitrary in-progress animation frame or transient editor interaction.
The chosen export state determines capture even when the editor's Still view is on or off.
When the chosen state matches, capture uses the same defined stable appearance as Still view.
The same capture rule applies to each PDF page.
See [Motion](../interface/motion.md) for the animation contract.
MCP [get_screenshot](../mcp/tools/get_screenshot.md) reuses this stable-state capture service to return an inspection image at an identified applied revision.
That read can inspect applied state before autosave and leaves project/view/history state unchanged; file export retains its separate save and destination-publish rules below.

<!-- codex-pc 2026-10-24: Accepted frame-control export boundary. -->

## Frame overlays and capture state

Top-level frame labels and Still view buttons are editor UI and never enter generated design source or exported images/PDFs.
Existing saved name metadata is unaffected; excluding the visible strip does not remove the node's saved name.
Each frame's Edit Still view setting is independent of the explicit named state supplied to capture and cannot override that state.
Verify clean output through the supported product exporters when they are available; a standalone HTML check or editor screenshot alone does not certify image/PDF export.

## Design modes and tokens

Image and PDF exports use the selected Light or Dark design mode.
React and HTML or CSS exports include the token definitions needed to reproduce supported modes.
Existing Dark overrides and Typography values survive output even when their human value editors are deferred.
Required imported theme variables and styles remain included despite deferred panel recognition.
The [token release scope](../interface/tokens-and-modes.md#release-scope) and [Light/Dark V1.1 backlog](../../backlog/token-modes-v11.md) defer editing controls rather than output preservation.

## Reliability

Export reads a committed document revision.
The [Code window's clipboard actions](../interface/code-window.md#copy-and-export-boundaries) are distinct from complete export: selection snippets and source-file text do not package required dependencies, styles, or assets.
Intentionally copying a visible component-source draft does not change the committed-state export rule.
The server finishes pending autosave before it publishes an export result.
MCP file export requires an Untitled project to complete its first Save through the browser; it does not choose the project name or folder from the export destination.
Screenshot inspection remains available without that first-save requirement.
A failed required save or rendering operation preserves the applied design and does not publish a successful export result.
The export writer produces a complete temporary output before replacing a destination file.
Failure or cancellation leaves an existing destination unchanged.

## Agent-led application integration

The proposed [orc-repo-sync skill](../../skills/orc-repo-sync/SKILL.md) guides integration of a committed ORC code export into an existing application.
The agent traces the target codebase, preserves its application behavior, verifies the integrated result, and opens a pull request targeting `main` after the required checkpoints pass.
Any failure needs an explanation and user discussion before the agent applies an agreed repair.
Export readiness and successful application integration are separate checkpoints.
The [application integration plan](../../backlog/application-integration-skills.md) records prerequisites and release status; the existing export contract does not establish that repository integration is implemented.

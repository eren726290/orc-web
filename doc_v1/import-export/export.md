# Export

## Status

Accepted V1 output behavior with open renderer details.

## Human flow

Export begins from the current selection.
The person chooses Export and a format.
For React output, they choose CSS or Tailwind styling.
For image or PDF output containing an interactive or animated component, they choose an explicit named design state before capture.
They choose a destination and confirm the output.
Advanced settings remain collapsed until requested.

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
It captures the selected named component state with time progression disabled.
It does not capture an arbitrary in-progress animation frame or transient editor interaction.
The chosen export state determines capture even when the editor's Still view is on or off.
When the chosen state matches, capture uses the same defined stable appearance as Still view.
The same capture rule applies to each PDF page.
See [Motion](../interface/motion.md) for the animation contract.

## Design modes and tokens

Image and PDF exports use the selected Light or Dark design mode.
React and HTML or CSS exports include the token definitions needed to reproduce supported modes.

## Reliability

Export reads a committed document revision.
The server finishes pending autosave before it publishes an export result.
The export writer produces a complete temporary output before replacing a destination file.
Failure or cancellation leaves an existing destination unchanged.

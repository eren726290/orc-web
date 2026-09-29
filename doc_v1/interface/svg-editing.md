# SVG editing

## Status

Accepted V1 product behavior.

## Purpose

ORC-web treats an SVG as live vector artwork in the workspace.
A person can place and style supported SVG artwork without opening Code for ordinary adjustments.
The SVG remains vector content in the saved design and in supported code exports.

## Select and transform

Select is the tool for SVG placement and transformation.
Clicking an SVG selects the whole SVG object and shows its bounds, resize handles, and rotation handle.
Dragging the object moves it under its current layout rules.
Dragging a resize handle resizes it while preserving its proportions.
Dragging the rotation handle rotates the whole SVG.

These controls change the SVG object's box, position, and rotation.
They do not select or reshape a path inside the SVG.
The [Workspace and canvas](workspace-and-canvas.md) document defines shared Select behavior and layout rules.

## Properties

Properties shows the selected SVG's layout controls and the supported artwork controls below them.
The available controls depend on values that ORC-web can safely identify in the SVG source.

| SVG value | Properties control |
| --- | --- |
| Fill color | Color or design-token control |
| Stroke color | Color or design-token control |
| Stroke width | Number control |

For a multicolor SVG, Properties exposes each distinct supported fill or stroke color separately.
Changing one color does not recolor unrelated parts of the artwork.
If a color or stroke value cannot be safely mapped, Properties offers **Edit source** rather than guessing.

## Replace SVG

Replace SVG imports the new artwork and keeps the selected object's position, layout participation, size, rotation, and supported style bindings where they remain valid.
The new artwork is not assigned until the import succeeds.
Cancellation or an invalid source keeps the current SVG unchanged.

## Code and source

Code shows the SVG source for values outside the supported Properties controls.
This includes path data, unsupported styling forms, and source structure changes.
Applying source changes uses the shared command engine and preserves the current SVG when parsing, validation, or rendering fails.

## Export

React and HTML or CSS exports retain supported SVG markup as vector content.
Image and PDF export use the rendered SVG at its selected size and rotation.

## V1 boundary

V1 supports selecting, moving, proportionally resizing, rotating, replacing, and changing supported fill, stroke, and stroke-width values.
It does not include drawing new paths, selecting or moving individual path points, editing Bézier handles, combining shapes, or automatic editing of arbitrary SVG source.

## Related contracts

[Layers and Properties](layers-and-properties.md) defines the shared panel behavior.
[Workspace and canvas](workspace-and-canvas.md) defines Select and workspace placement.
[Code window](code-window.md) defines source editing and Apply.
[Export](../import-export/export.md) defines output behavior.

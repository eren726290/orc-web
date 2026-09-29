# Workspace and canvas

## Status

Accepted V1 product behavior.

## Infinite workspace

The workspace is an infinite pan-and-zoom canvas.
People can place loose objects directly in that workspace.
Frames are optional bounded containers within the same workspace.
There is no requirement for every object to belong to a frame.

The workspace shows live HTML, CSS, and React content.
It does not turn frames into static images while editing.
Resizing a frame updates its live content and responsive layout immediately.

## Frames

A frame has a size, position, visual style, layout mode, and optional clipping.
A frame can contain text, elements, images, SVG, components, and nested frames.
A frame can act like a page, a card, a section, a device screen, or a smaller layout container.

The visible product term is Frame.
Existing technical references may use Artboard until terminology is cleaned up.

## Top-level frame boundaries

Each top-level frame represents one design area at any arbitrary size chosen by the person or agent.
A top-level frame can be a website screen, a card, a device mockup, or any other bounded design.
Naming frames Desktop, Tablet, or Mobile does not create a linked variant or breakpoint relationship.

Top-level frames have separate layout, clipping, preview interaction, and overlay boundaries.
Nested frames belong to their immediate parent and remain part of that parent design area.
Shared tokens and components can intentionally connect values across frames, as described in [Tokens and modes](tokens-and-modes.md) and [Editable React components](react-components.md).

## Layout modes

| Human label | Saved layout | Behavior |
| --- | --- | --- |
| Free | `free` | People position children directly. |
| Horizontal | `row` | Children flow left to right. |
| Vertical | `column` | Children flow top to bottom. |

Each child may use a fixed size, fit its content, or fill the remaining available space.
Frames provide padding and gaps when they use Horizontal or Vertical layout.
The Properties panel uses human labels and avoids requiring knowledge of CSS Flexbox vocabulary.
Grid is deferred until these three modes are complete and easy to use.

The accepted [Flex layout behavior](flex-layout.md) covers Wrap in Flex, gap handles, padding, alignment, distribution, and per-axis sizing.
The accepted [Constraints behavior](constraints.md) covers children in Free frames and Absolute Position children inside Flex frames.
Its proportional Stretch mode is different from keeping both edge distances fixed.
Defaults, sizing conflicts, coordinate conversion, and platform shortcuts remain open details.

## Canvas tools

In Edit mode, the tool rail has Select, Pan, and Text, in that order.
Select is active by default.

Select uses the cursor icon.
Clicking an object selects it.
The selected object shows its bounds, resize handles, and relevant measurements.
Clicking a supported layer inside a live component selects that layer rather than its whole component root.
The canvas expands the selected object's ancestors in Layers and scrolls that row into view.
Dragging a selected object or frame moves it within the design under the current layout rules.
Dragging a resize handle changes the selected object or frame's size under those rules.
For an SVG object, Select also provides a rotation handle and preserves the artwork's proportions when resizing.
Select does not expose individual SVG path points in V1.
Moving an object into or out of a frame updates its parent in Layers while preserving its visible placement where that is possible.
When text editing is not active, Escape selects the immediate parent.
At workspace root, Escape clears the selection.

Pan uses the hand icon.
Dragging anywhere on the canvas, including over a frame or object, moves the workspace view.
All frames and objects move together on screen, while their saved positions and the current selection stay unchanged.

Text is for creating and editing text.
Activate it with T.
Click an existing Text object to edit it, or click empty workspace to create text and begin typing.
Drag on empty workspace to choose the new text box's starting width.
Double-clicking a Text object in Select mode also enters text editing.
The [Text editing](text-editing.md) document defines text creation, editing, and sizing behavior.
The [SVG editing](svg-editing.md) document defines the accepted SVG workflow.

Groups are ordinary containers used to keep objects together without adding a layout rule.
Frames and groups can nest.

## Several selected objects

Hold Shift and click an object to add it to or remove it from the current selection.
V1 uses this selection for moving, duplicating, deleting, Wrap in Flex, and exporting compatible objects together.
There is no drag-selection box in V1.
Properties does not batch-edit several objects in V1.
The [Layers and Properties](layers-and-properties.md) panel explains the resulting Properties state.

## Edit and Preview

Edit is the default workspace mode.
In Edit mode, clicking a live control selects the design object instead of triggering that control.
Preview gives pointer and keyboard interaction to live buttons, menus, inputs, and other components.
Preview does not save temporary interactions as design changes.
For example, typing into a preview input does not replace its saved default value.
When animation makes editing difficult, an optional **Still view** control in Edit shows supported animated components in a stable, live, editable appearance.
Preview runs their normal animation, and the control does not change saved design values.
The supported behavior and limits are defined in [Motion](motion.md).

One visible Preview control enters Preview mode.
One visible Exit Preview control returns to Edit mode.
Leaving Preview preserves the prior selection and workspace position.

## Performance boundary

The first implementation must prove that pan, zoom, selection, dragging, and live component rendering remain clear and responsive with a useful number of visible objects.
The object-count target and performance measurements remain open until the first canvas prototype exists.

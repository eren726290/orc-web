# Layers and Properties

## Status

Accepted V1 product behavior.

## Layers

Layers presents the same parent and child hierarchy stored in the canonical document.
The workspace root appears first, followed by loose objects and frames in workspace order.
Expanding a frame or group shows its direct children.
Reordering in Layers changes the document order and visible stacking where that order controls rendering.

Layer rows show the object name and simple state controls such as visibility and lock.
The panel does not create an independent tree or infer hierarchy from browser DOM.
Selecting a layer selects the same object on the canvas.
Selecting an object on the canvas selects the same Layers row.
Canvas selection expands the object's parent rows and scrolls that row into view.

Imported components have a root Layer object and expand to show the source-backed layers that their accepted component contract supports.
For example, a Hero can expose Heading, Image, and Button layers beneath its root.
The panel never infers editable rows from arbitrary runtime DOM.
Declared slots and supported collection items also appear where their binding defines a stable editable layer.
The complete boundary is defined in [Editable React components](react-components.md).

## Properties

Properties shows controls for the current selection.
The panel starts with the controls a person needs most often and keeps uncommon settings behind clear sections.
The interface uses familiar words such as Horizontal, Vertical, Width, Height, Spacing, and Corner radius.

For ordinary objects, Properties may expose name, visibility, lock, geometry, layout, text, style, tokens, and relevant attributes.
For a frame, it also exposes frame size, clipping, layout, padding, gaps, child sizing, and design mode.
For an imported component root, it exposes its instance properties plus outer placement and size.
For a selected source-backed component layer, it exposes the supported values owned by that layer's binding.
Known Base UI and Base UI-flavored shadcn components can supply those controls from their recognized definitions.

For a Text object, Properties exposes content and typography controls, sizing under Layout, and Overflow when its fixed height cannot show all its text.
Double-clicking text on the canvas opens inline editing, while Properties provides a direct content field.
The complete text workflow is defined in [Text editing](text-editing.md).

For a Free frame, its freely positioned children receive position and Constraints controls.
For a Horizontal or Vertical frame, the frame receives Flex layout controls.
Children participating in Flex receive their supported sizing and alignment controls.
An Absolute Position child receives position and Constraints controls instead of controls for its Flex slot.

[Flex layout](flex-layout.md) defines how a frame arranges its children.
[Constraints](constraints.md) defines how a free-positioned or Absolute Position child responds when its parent frame resizes.
An imported component root follows the same outer-object rules.
A source-backed child can expose its own layout controls only when its source binding owns that layout value.

## Image properties

For an Image object, Properties shows a preview, Replace image, Fit or Fill, and image position.
Fit shows the complete image within its box.
Fill covers the box and may crop the image.
Image position determines which part stays visible when cropped.
These controls adjust the image inside its box; the Layout controls size and position the box itself.
V1 handles cropping through Fill and image position.

Replacing the source preserves the existing box's sizing rules, position, and fitting settings, including explicit dimensions where present.
Source replacement imports the new image as a managed project asset and validates its reference before assigning it.
Fitting and image position use supported styles.
The new image is not assigned until import succeeds.
Cancellation or import or source validation failure keeps the current image assigned.
Failures show an explanation beside Replace image.

Each completed replacement or fitting or image-position edit uses the shared [command engine](../architecture/command-engine-and-history.md) and creates one Undo entry.
Undoing replacement restores the previous image and its settings.

## SVG properties

For an SVG object, Properties shows supported fill color, stroke color, and stroke width alongside its normal Layout controls.
Multicolor artwork exposes each distinct supported color separately.
Select controls the SVG's placement, proportional resizing, and rotation on the canvas.
The complete V1 boundary, replacement behavior, and Code fallback are defined in [SVG editing](svg-editing.md).

## Component properties

An imported component exposes an editable root plus the supported source-backed layers inside it.
Examples include a heading's text and typography, an image's source, and a button's label, variant, or spacing.
Changing a value updates the live component immediately and commits one undoable design edit when the change finishes.

The component manifest or recognized definition chooses the appropriate control type.
V1 control types include text, number, toggle, choice, color, asset, token-compatible values, and supported layout values.
Number controls should support direct typing and drag adjustment where useful.
Properties explains when an authored expression, external data source, or unsupported component shape requires a source edit instead of guessing.
That explanation applies to the unsupported value or operation, not automatically to every control on the selected component.
A heading may require Edit source for computed text while still exposing its supported font size and spacing.
Supported commands retain the logical selected layer through successive edits; an uncertain identity after source replacement clears selection with an explanation.
See [Editable React components](react-components.md), [Motion](motion.md), and [React source bindings](../architecture/react-source-bindings.md).

## Empty and several-selection states

With no selection, Properties shows a short workspace summary and clear actions to add a frame or object.
With several objects selected, Properties says how many objects are selected and says “Select one object to edit its properties.”
V1 does not provide mixed values or bulk Properties edits.
Several selected compatible objects can still move, duplicate, delete, Wrap in Flex, or export together.
Hold Shift and click to add or remove an object from that selection.
The canvas does not provide a drag-selection box in V1.

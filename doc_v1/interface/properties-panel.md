# Properties

## Status

Accepted V1 product behavior.

## Release scope

V1 includes selection-aware Layout, applicable Image and Component controls, Appearance, compatible tokens, and Export.
The individual Text typography and Overflow controls, font import/unavailable-font/replacement controls, and Replace SVG are scheduled for V1.1.
The [dedicated backlog](../../backlog/properties-panel-v1x.md#v11-properties-controls) records their exact scope.
The existing Text, Fonts, and SVG documents retain their researched behavior; this release decision determines when those specific Properties controls ship.
Text and SVG rendering, basic text-content editing, supported SVG styling, and existing source editing remain in V1.
The deferral does not remove declared text-valued properties from supported React components.
Saved Layer hide/show controls and MCP visibility mutations are separately [scheduled for V1.1](../../backlog/layer-visibility-v11.md); own locks and eligible frame modes remain V1.

## Layers

[Layers panel](layers-panel.md) owns hierarchy presentation, selection, naming, visibility, locking, and expansion.
This document owns the selected object's Properties controls.

## Properties

Properties shows controls for the current selection.
The panel starts with the controls a person needs most often and keeps uncommon settings behind clear sections.
The interface uses familiar words such as Horizontal, Vertical, Width, Height, Spacing, and Corner radius.

For ordinary objects, Properties may expose name, lock, geometry, layout, text, style, tokens, and relevant attributes.
Raw attribute or source edits without a supported visual control belong in Code.
For a frame, it also exposes frame size, clipping, layout, padding, gaps, child sizing, and design mode.
Layout includes **Clip content**, using the [frame clipping contract](workspace-and-canvas.md#frame-clipping).
Clipped children remain selectable and editable through Layers.
For an imported component root, it exposes its instance properties plus outer placement and size.
For a selected source-backed component layer, it exposes the supported values owned by that layer's binding.
Known Base UI and Base UI-flavored shadcn components can supply those controls from their recognized definitions.

For a Text object, V1 Properties exposes its supported content field and sizing under Layout.
Individual typography and Overflow controls belong to the preserved V1.1 plan rather than the V1 control inventory.
Double-clicking text on the canvas opens inline editing, while Properties provides a direct content field.
The complete text workflow is defined in [Text editing](text-editing.md).

For a Free frame, its freely positioned children receive position and Constraints controls.
For a Horizontal or Vertical frame, the frame receives Flex layout controls.
A Row frame also receives **Wrap to next line**, with the existing Gap used between items and rows.
Properties explains that Fixed-width items keep their widths while Fill items share available width separately within each row.
Changing Free, Row, or Column updates the layout live and uses the [layout-switching contract](flex-layout.md#switching-layout-modes).
Children participating in Flex receive their supported sizing and alignment controls.
An Absolute Position child receives position and Constraints controls instead of controls for its Flex slot.

[Flex layout](flex-layout.md) defines how a frame arranges its children.
[Constraints](constraints.md) defines how a free-positioned or Absolute Position child responds when its parent frame resizes.
Properties offers the supported edge and Center choices; Stretch is excluded from V1.
Changing a constraint preserves the current position and size, while the selected object's canvas indicators show its active references.
An imported component root follows the same outer-object rules.
A source-backed child can expose its own layout controls only when its source binding owns that layout value.

## Layout control inventory

Layout changes with the selected object's relationship to its parent.
A container can have placement and sizing controlled by its own parent while arranging its children with a separate layout.
Keep those two responsibilities clear in the panel.

| Selection | Applicable Layout controls |
| --- | --- |
| Loose workspace object | Workspace X/Y and supported Width/Height sizing; no parent-edge Constraints. |
| Frame or container | Its own supported placement and size, plus Free/Row/Column for its children and the applicable parent-layout controls below. |
| Child participating in Flex | Supported Width/Height sizing, applicable alignment, and Absolute Position; parent-controlled position remains read-only. |
| Free-positioned child | Position, supported size, and eligible Constraints against its immediate containing frame. |
| Absolute Position child | Position, supported size, and eligible Constraints; it has no participating Flex slot. |
| React component root | Supported outer Layout and instance controls; its internal layout is editable only through an accepted owner. |
| Supported React child layer | The relevant object controls only for values owned by its source binding. |

### Frame and Flex controls

| Control | Visible behavior |
| --- | --- |
| Layout mode | Free, Row, or Column; Horizontal and Vertical explanations follow the existing canvas terminology. |
| Width and Height | Each axis shows its current value and supported Fixed, Fit, or Fill mode. |
| Gap | One saved spacing value between participating children and between wrapped Row lines. |
| Padding | Horizontal and vertical fields with access to Top, Right, Bottom, and Left. |
| Alignment | Nine-point visual control for packed content. |
| Distribution | Visible Packed or Space between choice. |
| Wrap to next line | Row-only control for laying out additional lines within an available width. |
| Clip content | Frame clipping toggle independent of its wrapping and sizing choices. |
| Absolute Position | Child control that leaves Flex flow and exposes position and Constraints. |

Show Gap, Flex alignment, and Distribution for the frame that owns its participating children's layout.
Their values do not become independent controls on each child merely because that child is selected.
Changing direction preserves sibling order, and switching layout modes follows the existing conversion and Undo rules.
Space between can produce visible separation larger than Gap because Gap is the minimum separation.
Padding starts paired; differing opposite sides show Mixed, and expansion preserves the four saved values.
Completing a paired edit updates both corresponding sides as one command and one Undo step.
Each sizing axis reflects its actual owner; an undefined Fit/Fill dependency keeps Fill unavailable with the existing explanation to set the parent's dimension first.
The [Flex contract](flex-layout.md#properties-controls) owns sizing, wrapping, layout conversion, and placement mechanics.
Do not add Grid, separate row/column gaps, or Column wrapping through this inventory.

### Constraint controls

Show Constraints for eligible Free-positioned and Absolute Position children.
Participating Flex children and loose workspace objects have no parent-edge Constraint controls.
Supported React layers require a binding that owns the relevant free or absolute positioning.

| Control | Choices or behavior |
| --- | --- |
| Horizontal | Left, Right, Left & Right, or Center. |
| Vertical | Top, Bottom, Top & Bottom, or Center. |
| Constraint diagram | Interactive edge-and-center diagram synchronized with both labeled dropdowns. |

Horizontal and vertical choices are independent and reference the immediate containing frame.
Changing a mode preserves the current box and records the relationship for subsequent parent resizing.
Choosing Center preserves the current center offset; an explicit Align center action centers the object and updates that axis's constraint together.
Both-edge constraints control the corresponding dimension, so its size is shown as constraint-controlled rather than offering conflicting Fixed/Fit/Fill editing.
Adjust the parent or relevant margins to change that dimension.
Canvas constraint indicators remain informational overlays; the diagram and dropdowns perform the Properties edit.
The [Constraints contract](constraints.md#human-controls) owns the resize behavior, measurement, limits, and reparenting rules.
Stretch remains excluded from V1.

## Panel organization

Properties uses one selection-aware panel for ordinary HTML/CSS objects and supported React layers.
The selected object's readable name and type remain visible while the controls scroll.
Controls follow this order: Layout; applicable content or Component options; Appearance; Export.
For a selected component, the order is Layout, Component, Appearance, and Export.
Component controls belong in this same panel; ordinary objects have no Component section.
Layout and applicable content controls start expanded.
Unused Border and Shadow details start collapsed.
Irrelevant sections are hidden.
In the preserved V1.1 Text plan, Text color stays with typography rather than appearing twice in the panel.
Every control has a visible label and keyboard access.
Renaming uses the same saved display label as [Layer renaming](layers-panel.md#renaming-a-layer).
Selecting a locked object through Layers allows inspection while direct design edits require unlocking under the [lock contract](layers-panel.md#locking).

When a parent controls position, show the existing value with editing unavailable and explain **Position controlled by [parent name]**.
Offer **Select parent** to inspect the controlling layout.
Show Fit, Fill, or constraint-controlled dimensions accurately rather than silently converting them to Fixed.
Unavailable canvas resize axes show their sizing owner in Properties.
Fit follows content, Fill follows the parent's layout, and both-edge constraints follow the parent and margins.
An explicit supported switch to Fixed enables manual sizing; a resize gesture never makes that conversion automatically.
See [Manual resizing](workspace-and-canvas.md#manual-resizing) for handle availability.
Preserve imported CSS values that the available visual controls cannot safely represent and offer Edit source for that value.
MCP [update_styles](../mcp/tools/update_styles.md), [set_text](../mcp/tools/set_text.md), [move_nodes](../mcp/tools/move_nodes.md), and [resize_node](../mcp/tools/resize_node.md) use the same authoritative values, bindings, sizing owners, and shared/Only this rules.
Their agent-facing requests do not add bulk human Properties editing or accelerate the deferred typography, font, and SVG controls.

## Appearance

Appearance provides supported background or fill color, border color and width, corner radius, opacity, and a basic shadow control.
The basic shadow editor handles one outer shadow with color, horizontal and vertical offset, blur, and spread.
Existing complex or multiple shadows are preserved and use Edit source until their dedicated editor exists.
The preserved Text plan uses its Text color control; V1 SVG artwork uses its supported fill and stroke controls.
Compatible token choices remain beside the value they affect.

Corner radius starts with one combined field that assigns a value to all four corners.
An expand control reveals Top left, Top right, Bottom right, and Bottom left.
When the four corner values differ, the combined field shows **Mixed**.
Expanding or collapsing the corner controls preserves every existing value and creates no document edit.
Changing an individual corner affects only that corner; entering a combined value deliberately assigns it to all four.
Valid edits update live and finish as one command and one Undo step under the normal Properties editing rules.
Undo restores the previous corner values together.
Show these controls only where supported styling or a declared source binding owns the corresponding corner values.
Unsupported imported radius expressions retain their source and use Edit source rather than being flattened to guessed numbers.

An imported React layer receives an Appearance control only when a supported source binding or declared property owns that value.
The same shared-source and Only this / All copies rules apply to these edits.
Unsupported values retain their authored source rather than receiving a guessed replacement.
Dedicated gradient, multiple-shadow, filter, blend-mode, and complex-outline editors are deferred to the [Properties V1.x backlog](../../backlog/properties-panel-v1x.md).
Deferring a visual editor does not discard an imported effect: supported source retains it through rendering, saving, and export, with Code available for edits.

## Tokens beside property values

Each compatible property shows its normal value field with a token-picker control beside it.
Filter the picker to token types accepted by that property.
A linked value shows the token's readable name and resolved value, including units where applicable.
For example, a frame's Fill can show Background and its resolved color.
Matching a literal to an existing token value does not automatically create a link.

| Token category | Initial compatible V1 controls |
| --- | --- |
| Color | Fill/background, border color, and supported SVG fill/stroke. |
| Spacing | Flex Gap and Padding. |
| Corner radius | A combined radius or an individual corner. |
| Compatible declared component property | Only the accepted token type declared by that control. |

These choices require a supported value owner; they do not make arbitrary component styles visually editable.
Typography token editors and the corresponding Text controls remain scheduled for V1.1.
The [release scope](tokens-and-modes.md#release-scope) preserves existing values and mode resolution while deferring Light/Dark editors and imported-token panel integration.

Choosing another compatible token changes the selected reference rather than the token definition.
Editing the shared definition happens in the left [Tokens panel](tokens-panel.md#token-editor), where its reference count is shown.
For React values, shared/instance ownership and Only this / All copies still determine the effect of the requested reference change.

**Unlink token** replaces the selected property's reference with its current resolved direct value and preserves its appearance.
It leaves other references and the token definition intact, and Undo restores the binding.
If resolution or source ownership cannot be validated, keep the reference and explain the problem beside the control.

When there are no compatible tokens, show a category-specific empty state and **Create token**.
Start creation with the category and current valid direct value, then request a readable name.
Creation from a numeric value preserves its unit; creation from a color preserves its alpha.
Only categories with V1 creation controls offer this action.
Creation and application to the initiating property form one command and one Undo step.
Cancellation, validation failure, or a stale selection leaves no orphan token or unintended reference.
Opening the picker preserves selection and Properties, and its controls are labeled and keyboard accessible.
The [Tokens contract](tokens-and-modes.md#tokens-in-properties) owns definitions, compatible references, mode resolution, and shared editing.
This inventory does not add aliases or the deferred Text typography controls to V1.

## Editing and feedback

Properties has no Apply button.
Before starting a visual preview or edit that changes the source of an open Code draft, use the [Code draft safeguard](code-window.md#visual-edits-with-a-draft).
Discard permits the requested visual edit after clearing the draft; Cancel keeps the draft, selection, and Code scope and cancels that visual edit.
Properties never silently applies or merges unfinished Code.
Valid numeric typing and drag adjustments show the changed appearance live without requiring Enter.
Enter or leaving the field finishes a numeric adjustment as one command and one Undo entry.
Enter is optional; clicking elsewhere also finishes the adjustment.
Text content finishes on leaving its field while retaining multiline input.
Toggles and choices complete when the person chooses their value.
A continuous scrub, slider, or color-picker gesture previews live and commits once when the gesture finishes.
Temporary previews do not create document revisions or autosave each intermediate value.

Escape cancels an unfinished field edit and restores the appearance from before that edit.
Invalid input remains visible with a short inline explanation while the last valid appearance stays visible.
Failed validation or rendering preserves the committed design and creates no Undo entry.
Selection changes never apply an unfinished field value to a different object.
Successful edits update the applied source and support ordinary Undo through the shared [command engine](../architecture/command-engine-and-history.md).

## Image properties

Initial Image objects come from agent-built or imported designs.
V1 offers replacement through Properties; manual new-file insertion is deferred to V1.x.

For an Image object, Properties shows a preview, Replace image, and Fit or Fill.
Fit shows the complete image within its box.
Fill covers the box and may crop the image.
Fill preserves the existing image position, which determines which part stays visible when cropped.
When no position is specified, use Center.
These controls adjust the image inside its box; the Layout controls size and position the box itself.
Visual image-position controls, including the nine-position picker, are deferred to V1.x.
Custom positioning remains editable through Code or an agent.
The [Properties V1.x backlog](../../backlog/properties-panel-v1x.md) records the deferred control and preservation requirements.

Replacing the source preserves the existing box's sizing rules, position, and fitting settings, including explicit dimensions where present.
Source replacement imports the new image as a managed project asset and validates its reference before assigning it.
Fitting and preserved image position use supported styles.
The new image is not assigned until import succeeds.
Cancellation or import or source validation failure keeps the current image assigned.
Failures show an explanation beside Replace image.

Each completed replacement or fitting edit uses the shared [command engine](../architecture/command-engine-and-history.md) and creates one Undo entry.
Undoing replacement restores the previous image and its settings.
MCP [update_attributes](../mcp/tools/update_attributes.md) reuses this replacement behavior for supported image-source edits and also handles supported alternative text and link destinations through their accepted owners.
It does not require replacing the object's subtree; exposed component asset inputs retain [update_component_props](../mcp/tools/update_component_props.md), and image fitting remains a supported style change.

## SVG properties

For an SVG object, Properties shows supported fill color, stroke color, and stroke width alongside its normal Layout controls.
Multicolor artwork exposes each distinct supported color separately.
Select controls the SVG's placement, proportional resizing, and rotation on the canvas.
The complete V1 boundary, replacement behavior, and Code fallback are defined in [SVG editing](svg-editing.md).
Replace SVG is scheduled for V1.1 under the current [Properties release decision](../../backlog/properties-panel-v1x.md#v11-properties-controls).
The existing SVG document retains that researched replacement workflow for its later implementation.

## Component properties

The [component-import workflow](../import-export/component-import.md#placement-and-completion) selects the placed root and opens its supported instance and outer Layout controls here.
An imported component exposes an editable root plus the supported source-backed layers inside it.
Examples include a heading's supported text, an image's source, and a button's label, variant, or spacing.
Changing a value updates the live component immediately and commits one undoable design edit when the change finishes.

The component manifest or recognized definition chooses the appropriate control type.
Selecting a component root shows its supported instance controls in Component.
Selecting a supported child shows that child's own controls, without inheriting an unrelated parent's component-property list.
Ordinary objects do not receive a Component section.
Base UI and Base UI-flavored shadcn recognition supplies controls only for the actual accepted API and wrapper shape.
Prop names seen in a reference product do not become mandatory ORC-web component controls.
V1 control types include text, number, toggle, choice, color, asset, token-compatible values, and supported layout values.
Number controls should support direct typing and drag adjustment where useful.
Properties explains when an authored expression, external data source, or unsupported component shape requires a source edit instead of guessing.
That explanation applies to the unsupported value or operation, not automatically to every control on the selected component.
A heading may require Edit source for computed text while still exposing other supported values such as spacing.
Supported commands retain the logical selected layer through successive edits; an uncertain identity after source replacement clears selection with an explanation.

| Component control | Behavior |
| --- | --- |
| Declared values | Label, variant, size, disabled state, or other controls only when this component contract supports them. |
| Show content | Available for supported hidden regions such as a dialog or menu; it changes the editor view without rewriting saved open defaults. |
| Supported animation values | Declared or source-bound controls only, following the normal ownership and Undo rules. |
| Edit component source | Opens the existing bottom Code window for shared implementation editing. |

Show content follows [hidden-content behavior](react-components.md#hidden-component-content), and source editing follows [Code](code-window.md#shared-component-source).
Animation controls follow [Motion Properties support](motion.md#properties-support); the panel does not infer universal animation controls.
Properties explains whether a value belongs to this instance, shared source, a slot, a collection record, or a token before editing it.
Supported shared-source edits retain the existing Only this / All copies choice and one completed Undo step.
See [Editable React components](react-components.md), [Motion](motion.md), and [React source bindings](../architecture/react-source-bindings.md).

## Empty and several-selection states

With no selection, Properties shows **Select an object to edit its properties.**
It does not offer manual frame creation or new image/SVG file insertion in V1.
With several objects selected, Properties says how many objects are selected and says “Select one object to edit its properties.”
V1 does not provide mixed values across several selected objects or bulk Properties edits.
A combined field on one object can still show Mixed when its individual padding sides or corner values differ.
Several selected compatible objects can still move, delete, Wrap in Flex, or export together.
The dedicated Duplicate action is deferred to V1.x; Only this remains a supported shared-component editing choice.
Hold Shift and click to add or remove an object from that selection.
The canvas does not provide a drag-selection box in V1.

## Export

An Export section sits at the bottom of Properties for the current selection.
The person opens that section, chooses an available format, clicks Export, and chooses where to save the output.
For several selected compatible objects, Export remains available even though bulk property editing is excluded from V1.
With no selection, there is no selected design scope to export.
The [Export contract](../import-export/export.md) defines formats, combined output, capture states, and destination handling.
Code-copy actions remain in the [Code window](code-window.md).

# Text editing

## Status

The V1 text workflow below is accepted product behavior.
This document records the intended editor behavior and does not claim that it is implemented.
Exact rich-text storage and browser typography measurement details remain open.
The [Layers and Properties](properties-panel.md) document explains which text controls appear for the current selection.

## Create text

Click Text in the vertical toolbar or activate the Text tool with T.
Text creation does not require opening + Add.
Click an existing Text object with the Text tool to edit it.
Click once on empty workspace to create a text object sized to its content and begin typing.
Drag on empty workspace to choose a text box width, then type.
Dragged text wraps at that width and grows taller as its content needs more lines.
If a newly created text object is still empty when editing ends, discard it.
The T shortcut does not activate while another text field or text editor has focus.

## Edit text on the canvas

In Select mode, double-click a Text object to place the text cursor inside it.
The Text tool also enters text editing when you click an existing Text object.
Typing updates the live canvas immediately.
Press Escape or click outside the text to finish the edit.
Finishing an edit keeps the text and returns to object selection.
Ctrl+Z while the text cursor is active undoes text changes within the current editing session.
After the session ends, one document Undo restores the text from before that session.
The canvas keeps the same Text object and Layer while its content changes.

Text that belongs to an imported component follows the component's declared interface.
Edit a declared text property through its Properties control.
Edit text inside a declared editable slot as a normal Text object.
An arbitrary element inside the component's private React tree does not become an editable Text object.

## Text size and reflow

Changing text, font family, font weight, font size, line height, letter spacing, alignment, or inline formatting updates the rendered text immediately.
The text box adjusts according to its width and height sizing rules.
Changing the box does not silently reduce the font size.

Text created with a click fits both axes to its content.
Text created by dragging keeps the chosen width and fits its height to the wrapped content.
In a Horizontal or Vertical frame, text follows the selected Fixed, Fit, or Fill sizing mode on each axis.
With a Fixed or Fill width and Fit height, the text wraps within its available width and grows taller as needed.
Text inside a Free frame uses the same sizing and overflow controls as other free-positioned children.
The parent frame's layout and clipping settings continue to apply.
A Fixed-width, Fit-height Text object supports horizontal canvas resizing while its height follows wrapping.
Fit or Fill axes do not silently become Fixed through dragging; the shared [manual resize rules](workspace-and-canvas.md#manual-resizing) determine the available handles.
See [Flex layout](flex-layout.md) for parent layout and per-axis sizing rules.

## Overflow

If text has a Fixed height and its content does not fit, the Overflow control offers Visible, Clip, or Ellipsis.
Visible is the default and lets the content extend beyond the text box.
Clip hides content beyond the box.
Ellipsis shows an ellipsis at the end of the last visible line.
All three choices retain the complete text content.
The chosen font size remains unchanged when text overflows.
The parent frame may still clip the text according to its own clipping setting.
When text overflows and its parent layout allows Fit height, offer Fit height to expand the text box to show its full content.
Fit height changes the text box sizing rule and leaves the text and typography unchanged.

## Fonts and typography

The Properties panel provides controls for font family, weight, size, line height, letter spacing, alignment, and color.
The font picker, project and installed font choices, missing-font replacement preview, portability, and export rules are defined in [Font management](font-management.md).
ORC-web's supported browser and installed-font permission behavior are defined in [Browser support](../architecture/browser-support.md).

Typography and color controls accept compatible tokens where the token type and property match.
The [Tokens and modes](tokens-and-modes.md) document owns token editing and Light or Dark values.
Applying a token to only part of a text object's rich formatting remains open.

## Inline formatting

A text object remains one Text Layer when different words have different formatting.
While editing, select a range of words to show a small formatting toolbar near the selection.
The toolbar can apply bold, italic, underline, and text color to the selected range.
Selecting the whole text object and changing typography in Properties applies that value to the whole object.
Properties shows Mixed when the selected text object contains different values for a formatting property.
Inline formatting changes the rendered result and reflows the text box under its current sizing rules.

## Copy and paste

Copy and paste work as expected inside an active text edit.
Normal paste preserves supported bold, italic, underline, and text color formatting.
Paste as plain text inserts the words and line breaks using the destination formatting.
Both paste options preserve paragraphs and line breaks.
Unsupported source formatting falls back to the destination style.
Pasting onto the canvas when no text object is being edited belongs to the canvas paste contract.

## Saving and export

Finishing an edit applies its text or formatting change as one document command.
That command updates the same object shown in Layers and supports document Undo.
Save and reopen preserve the full text, its supported inline formatting, typography, and overflow choice.
React, HTML or CSS, image, and PDF output use the rendered text at the selected design mode and frame size.
The [Code window](code-window.md) keeps unapplied code in the current editing session until the person chooses Apply.
MCP [set_text](../mcp/tools/set_text.md) changes ordinary content or a reliably bound React text owner through that same command path.
Its [core JSON exchange](../mcp/tools/set_text.md#agreed-json-exchange) accepts plain-string replacement with reliable ownership and explicit shared-source scope.
The richer payload and affected formatting-range policy remain open; unsafe plain replacement does not flatten existing formatting or add deferred typography/Overflow panel controls.

## Open decisions

The canonical data model needs a rich-text representation that preserves content and inline formatting without creating a Layer for each formatted range.
Its schema and text-range indexing rules must be chosen before implementation.
The exact text toolbar placement, accessibility announcements, and keyboard shortcuts for inline formatting need interaction design.
The redistributable default font family and its license need to be selected.
Default text color and initial typography values need to be chosen.
Exact ellipsis behavior for multiple lines, Fit height availability when a parent controls the axis, and token binding on a formatted range remain open.
Canvas paste outside an active text edit is covered by the broader canvas interaction contract.

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
Resizing a frame updates its live content and supported responsive layout immediately.

## Editor layout

The top bar contains Dashboard at the far left, horizontal project tabs, and a separate **+** project button.
Each tab represents one separate `.orc` project, like a Figma file, and shows its project name and a close action.
The selected tab is visibly active.
V1 editor chrome has no ORC logo or version label.
One vertical toolbar between the left panel and canvas contains Select, Pan, Text, Code, and Preview, in that order.
Each control has a readable label and is accessible by keyboard.
The left panel has Layers and Tokens tabs.
Layers shows loose objects, frames, and their supported nested content.
[Layers panel](layers-panel.md) defines row presentation, renaming, locking, expansion, and the preserved V1.1 visibility workflow.
Tokens opens the dedicated [Tokens panel](tokens-panel.md), with separate token creation, grouped values, Search, and adjacent editors.
Switching left tabs preserves canvas selection and the selected object's Properties.
The infinite canvas occupies the center, and Properties occupies the right panel.

Code is closed initially.
Clicking Code in the vertical toolbar opens the Code window below the canvas; clicking it again hides the window.
Opening Code preserves the selection so its source stays connected to the selected visual object.
Hiding Code with unapplied changes follows the discard safeguard in [Code window](code-window.md).
The side panels and Code window are resizable.
Custom docking and panel rearrangement are deferred.

### Project tabs and Dashboard

Several project tabs can remain open, with one project active at a time.
Clicking a tab activates that project's canvas, Layers, Properties, Tokens, and Code.
Each open project retains its own selection, pan/zoom, panel state, unapplied Code draft, Undo history, and save state for the current session.
Switching tabs does not apply a Code draft, combine designs, or create a document Undo entry.
The [workspace bundle](../architecture/orc-workspace-bundle.md#starting-and-opening-projects) owns project-session and close behavior.

The top-bar **+** offers **New project** and **Open project**, using the existing project flows.
It is separate from the Layers panel's component-import **+ Add** button.
Opening an already open project activates its existing tab.
Dashboard returns to the existing New/Open/recent-project screen without closing open project tabs.
The backend retains the most recently active open project for MCP while Dashboard is displayed, following the [MCP active-project contract](../mcp/mcp-server.md#purpose-and-application-authority).

Closing a project tab uses that project's existing Code-draft and unsaved-design safeguards.
Cancel keeps the tab and its state open.
Closing the active tab activates another remaining project, or shows Dashboard with no active project when none remain.
A project tab is distinct from the Chrome browser tab containing the whole editor.

### Contextual save feedback

Show save feedback beside the relevant project tab or in its save/close flow when needed.
Show Saving while a write is in progress and brief Saved feedback after the current applied revision is written.
An idle, successfully saved project has no permanent Saved badge.
Not saved and Save failed remain visible while unresolved, with the existing first-save and recovery actions.
Autosave and the underlying save status continue under the [save contract](../architecture/orc-workspace-bundle.md#autosave) even when no badge is displayed.

## Human content entry points

The Layers tab has one **+ Add** button that directly opens [component import](../import-export/component-import.md).
Text creation uses the vertical toolbar's Text tool directly or its T shortcut.
V1 does not provide a manual draw-frame action.
Existing and imported frames remain editable, and this UI restriction does not remove frame support from the document or agent workflow.
Agents provide the initial image and SVG objects; people replace and adjust them through Properties.
Manual file insertion of new images or SVGs is deferred to V1.x.
The + Add button does not include Text, Frame, Image, or SVG entries in V1.
Create token stays in Tokens and compatible Properties controls rather than the component-import + Add button.

## Frames

A frame has a size, position, visual style, layout mode, and optional clipping.
A frame can contain text, elements, images, SVG, components, and nested frames.
A frame can act like a page, a card, a section, a device screen, or a smaller layout container.

The visible product term is Frame.
Existing technical references may use Artboard until terminology is cleaned up.

## Frame clipping

For a selected frame, Properties exposes **Clip content**.
On hides the portions of ordinary contained design content outside that frame's clipping boundary.
Off allows that content to remain visible outside the frame, subject to any containing frame's clipping.
Clipped objects remain in Layers and can still be selected and edited there.
Changing clipping preserves child positions, sizes, constraints, and layout rules.
It updates the live appearance, saves with the frame, and completes as one command and one Undo step.
Undo restores the previous clipping value.
The exact browser mapping of the clipping boundary remains an implementation detail to verify.

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
A Row can use Wrap to next line, retaining child order while laying out additional rows within the available width.
Its Gap applies between items and rows; Fixed widths remain fixed, while Fill widths share available space per row.
Switching layout modes updates the frame live; switching from Flex to Free keeps participating children at their measured positions and sizes.
Each completed layout switch or wrapping toggle is one Undo step, as defined in [Flex layout](flex-layout.md).
The Properties panel uses human labels and avoids requiring knowledge of CSS Flexbox vocabulary.
Grid is deferred until these three modes are complete and easy to use.

The accepted [Flex layout behavior](flex-layout.md) covers Wrap in Flex, gap handles, padding, alignment, distribution, and per-axis sizing.
The accepted [Constraints behavior](constraints.md) covers children in Free frames and Absolute Position children inside Flex frames.
V1 Constraints supports edge pins, both-edge fixed margins, and Center.
Selection shows the applicable canvas constraint indicators in Edit mode.
Wrap direction, starting gap/padding, initial Fit sizing with a necessary per-axis Fixed fallback, and Fill sharing are accepted in the Flex contract.
Moving between Free frames, Flex flow, and loose workspace uses the destination rules in [Constraints](constraints.md#reparenting-and-switching-layout).
Both-edge constraints honor minimum sizes, preserve the left or top margin when space is insufficient, and retain the saved margins for later expansion.
Exact wrapper placement, coordinate conversion, browser mapping, and platform shortcuts remain open details.

## Canvas tools

In Edit mode, the vertical toolbar starts with Select, Pan, and Text, followed by Code and Preview.
Select, Pan, and Text choose the active canvas tool; Code toggles its window and Preview enters the existing interaction mode.
Select is active by default.

Select uses the cursor icon.
Clicking an object selects it.
Canvas selection skips locked objects and objects protected by a locked ancestor; their [Layers rows](layers-panel.md#locking) remain selectable for inspection and unlocking.
Clicking empty workspace outside all frames clears selection.
Clearing selection removes the selection outline and Layers highlight without deleting, moving, or changing any design object.
Clicking an empty area inside a frame selects that frame.
When Code contains unapplied changes, changing or clearing selection first follows the safeguard in [Code window](code-window.md#unapplied-code).
The selected object shows its bounds, the resize handles allowed by its sizing rules, and relevant measurements.
Clicking a supported layer inside a live component selects that layer rather than its whole component root.
The canvas expands the selected object's ancestors in Layers and scrolls that row into view.
Dragging a selected object or frame moves it within the design under the current layout rules.
Dragging a resize handle changes the selected object or frame's size under those rules.
For an SVG object, Select also provides a rotation handle and preserves the artwork's proportions when resizing.
Select does not expose individual SVG path points in V1.
Moving an object into or out of a frame updates its parent in Layers, keeps its dropped position in Free placement, or joins the indicated slot in Flex flow.
Escape during an active move or resize restores the position and size from before that gesture.
The object remains selected.
Cancellation creates no document revision or Undo entry.
Releasing the mouse completes the change as one command and one Undo step.
With no active gesture or text edit, Escape selects the immediate parent.
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

## Manual resizing

Select offers manual resizing only on axes whose supported Fixed sizing allows the dimension to be changed directly.
Dragging an available handle changes that Fixed dimension and respects applicable size limits.
Fit dimensions follow content; change the content or explicitly choose Fixed in Properties before resizing that axis manually.
Fill dimensions follow the parent's available space; adjust the parent layout or explicitly choose Fixed where supported before resizing that axis manually.
Both-edge constraints control the dimension through the parent and margins; resize the parent or change those margins instead.
A resize gesture never silently changes Fit, Fill, or constraint-controlled sizing to Fixed.
Properties explains the sizing owner for unavailable axes and offers Select parent when the parent controls the value.

For example, a Text object with Fixed width and Fit height exposes horizontal resizing while its height follows the wrapped text.
SVG proportional resizing additionally follows the [SVG contract](svg-editing.md#select-and-transform).
Existing gesture cancellation, validation, and one-step Undo rules apply to every available resize handle.
Unsupported source bindings do not receive handles that would require guessing an authored change.
MCP [resize_node](../mcp/tools/resize_node.md) follows the same per-axis ownership; a supported sizing-mode conversion must be explicit and atomic.

## Keyboard movement

With canvas focus in Edit mode, arrow keys move selected Free-positioned or loose workspace objects by 1 px in unzoomed document units.
Shift+arrow moves those objects by 8 px.
Absolute Position children follow the same free-positioned nudge rules.
Moving a constrained object updates its saved offsets against the same immediate parent while preserving its constraint choices.
The command validates any coupled relationships instead of leaving a partial movement.

For one selected participating Flex child, arrows along the parent's layout direction move it one sibling position.
Left and Right reorder in a Row; Up and Down reorder in a Column.
Shift does not change a Flex reorder into a pixel movement.
Arrows across the Flex direction do not move the child out of flow or change its alignment.
The same Layers order controls rendering, including wrapped Rows.
Moving several compatible selected Free objects uses the same displacement and one atomic command.
Keyboard reordering of several selected Flex children remains an open interaction detail.

Text editing, Properties inputs, Code, and focused menus retain their own arrow-key behavior.
Preview sends keys to the live interface rather than running canvas movement commands.
Each completed keyboard movement or reorder is undoable through the shared command engine.
Selection remains on the moved object, and a rejected movement changes neither geometry nor history.
The exact grouping of held-key repeats into completed commands remains an implementation detail to verify.
MCP [move_nodes](../mcp/tools/move_nodes.md) changes supported saved positions under the current parent without implicit reparenting or Absolute Position conversion.
Explicit canvas drops and the single-item Flex keyboard reorder retain their existing structural behavior; the position tool does not turn a Flex pixel request into a reorder.

## Workspace zoom

Scrolling the mouse wheel over the canvas in Edit mode zooms the workspace view in or out.
Zoom preserves selection and does not change saved object dimensions or positions.
For a long frame, zoom out to find the section, pan to it, and zoom back in to edit.
V1 does not show a zoom percentage, zoom menu, or Fit selection or Fit all controls.
Wheel input over editor panels continues to scroll those panels rather than zooming the canvas.
In Preview, wheel input over live content follows its normal scrolling behavior, including nested scrollable areas.
Wheel input over live content does not zoom or pan the workspace, even at a scroll boundary or when that content cannot scroll.

## Several selected objects

Hold Shift and click an object to add it to or remove it from the current selection.
V1 uses this selection for moving, deleting, Wrap in Flex, and exporting compatible objects together.
There is no drag-selection box in V1.
Properties does not batch-edit several objects in V1.
The [Properties](properties-panel.md) contract explains the resulting Properties state.

## Delete and context menu

With canvas focus, Delete removes the selected object or objects through the command engine.
Deleting a frame removes its contained objects together as one Undo step.
Undo restores the deleted design objects.
Ordinary reversible object deletion has no confirmation popup.
When Text, a Properties field, or Code has editing focus, Delete edits that field's content instead of deleting the canvas selection.

Right-clicking an object selects it and opens a small contextual menu with supported Copy, Paste, Delete, Open code, and Export actions.
The menu uses the same commands as the corresponding shortcuts and panel controls and shows applicable keyboard shortcuts.
Open code opens the selected scope in the bottom Code window; Export opens the selected scope's Properties Export section.
Keyboard access is available for the same context actions.
Unsupported actions are omitted for the current selection.
Selection changes follow the existing unapplied-Code safeguard before switching targets.
The dedicated Duplicate action is deferred to V1.x, including its context-menu and collection-item entry points.
Copy/Paste remains available; the deferral does not remove Only this component copying.

## Copy and Paste inside the same project

In Edit mode with canvas focus, Ctrl+C copies the selected supported object or frame's latest applied design, and Ctrl+V pastes it into the same project.
The context menu uses the same Copy and Paste actions.
Inside Text, Properties fields, or Code, those shortcuts retain normal text editing behavior.
Copy reads applied content without changing the design or creating an Undo entry.
Unapplied Code, temporary Preview inputs, scroll positions, and open component states are not saved design content to copy.

Pasting a frame creates a separate frame with fresh IDs for its owned objects and preserves their saved content, styles, sizing, layout, clipping, and child order.
References between copied design objects point to their new IDs.
A copied top-level frame is another independent design area rather than a linked breakpoint or responsive variant.
The person can change the copy's frame-owned content and layout without changing the original frame.
Placement follows the destination's existing layout and constraint rules.

Pasting a supported React component creates another instance with the same applied instance properties, supplied content, style values, and supported live behavior.
The new instance reuses the existing shared component definition, dependencies, assets, and token references.
It receives its own source-backed Layer identities under the [source-binding contract](../architecture/react-source-bindings.md#identity-through-edits).
Changing a supported instance-owned label, variant, or size affects only that instance.
Changing shared implementation through Properties retains the [Only this / All copies choice](react-components.md#where-a-visual-edit-is-saved).
Paste itself does not make a shared component definition independent.

Token references remain shared after Paste.
For a locally owned property on the copy, choosing another token or unlinking to a direct value changes that property rather than the shared definition.
Editing the token definition still changes its linked uses, including the original, as defined in [Tokens and modes](tokens-and-modes.md#explicit-references-and-shared-effects).

Before Paste changes source or selection, resolve the applicable [Code draft safeguard](code-window.md#unapplied-code).
Paste validates the destination, locks, copied references, and supported source bindings before committing.
If clipboard access fails, the copy cannot be mapped reliably, validation fails, or the person cancels the draft safeguard, keep the design, selection, and document history unchanged.
Successful Paste selects the new object or frame, highlights it in Layers, and shows its supported Properties as one command and one Undo step.
Undo removes the pasted content while preserving the original; Redo restores that accepted copy and its identities.
The copied design and durable bindings use normal save and autosave.
Canvas object copying is distinct from the [Code window's code-copy actions](code-window.md#copy-and-export-boundaries).

## Edit and Preview

Edit is the default workspace mode.
In Edit mode, clicking a live control selects the design object instead of triggering that control.
Preview gives pointer and keyboard interaction to live buttons, menus, inputs, and other components.
When animation makes editing difficult, an optional **Still view** control in Edit shows supported animated components in a stable, live, editable appearance.
Preview runs their normal animation, and the control does not change saved design values.
The supported behavior and limits are defined in [Motion](motion.md).

### Selected-frame workflow

V1 previews one selected frame at a time.
Preview stays on the same localhost, in the same browser tab and existing canvas area.
It uses the existing live rendering path and applied design rather than creating another editable design or requiring another server.

1. Select one frame on the canvas or in Layers.
2. Click **Preview** in the vertical toolbar.
3. The canvas area shows only that frame and its nested content, with selection outlines, resize handles, and constraint indicators hidden.
4. Try its supported buttons, inputs, menus, scrolling, and animations.
5. Click the visible **Exit Preview** control to return to the infinite workspace.

Entering Preview preserves the frame's saved size, layout, clipping, source, and instance inputs.
It does not turn the frame into a static image or silently resize the design to fit the browser.
With no selection, a non-frame selection, or several selected objects, stay in Edit and show **Select one frame to preview**.
V1 does not choose one frame from a multiple selection automatically.
The later [multi-frame comparison workflow](../../backlog/multi-frame-preview-v1x.md) is deferred to V1.x.

### Temporary state and returning to Edit

Each Preview session starts from the latest applied design and the components' saved defaults.
Unapplied Code is not executed or silently applied by entering Preview.
Preview does not save temporary interactions as design changes.
For example, typing into a preview input does not replace its saved default value.
Temporary input values and opened menus belong to that Preview session rather than the saved design.
Each top-level frame keeps its own temporary Preview scroll position for the active session.
Scrolling one top-level frame does not scroll another.
Scrolling does not change saved layout, source, or default values and creates no document revision or Undo entry.

Leaving Preview preserves the prior selection and workspace position.
Restore the previous Edit view, including its pan, zoom, supported Show content choices, and Still view setting.
Discard the temporary Preview input, open-state, and scroll state; the next Preview starts from saved defaults again.
Entering, interacting with, and leaving Preview create no document revision or Undo entry.
Saved design changes continue to use the existing editing and source commands.

### Implementation requirements and research

The selected-frame workflow is accepted product behavior; its production implementation remains to be verified in Chrome on Fedora and Windows.
Keep the Preview frame and session state outside the [canonical document](../architecture/canonical-document-model.md#what-does-not-belong-in-the-document).
Verify the following with the actual workspace renderer rather than treating documentation research as a completed browser proof:

- Route pointer, keyboard, and wheel input to supported live content in Preview while keeping editing shortcuts inactive there.
- Keep supported menus, dialogs, and backdrops within the Preview frame's overlay boundary, with Exit Preview reachable by pointer and keyboard.
  Base UI's portal container controls placement, but modal focus trapping and document scroll locking also need deliberate handling, as described in the [Dialog API](https://base-ui.com/react/components/dialog).
- Correct Motion drag coordinates when the displayed frame is transformed by canvas zoom, following [Motion configuration](https://motion.dev/docs/react-motion-config).
- Preserve the distinction between browser-viewport responsiveness and frame-size responsiveness.
  CSS media queries and ordinary Tailwind `md:` utilities use the browser viewport; container queries use their declared container.
  A narrow frame does not automatically emulate a narrow browser viewport, so the supported mapping remains an implementation decision rather than a promised automatic conversion.
  See [MDN container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries) and [Tailwind responsive design](https://tailwindcss.com/docs/responsive-design).
- Reset supported Preview runtime state deliberately while retaining stable design identities, source bindings, and the previous Edit view.
  [React state preservation](https://react.dev/learn/preserving-and-resetting-state) explains why changing component identity or tree position can reset runtime state; it does not require rebuilding the document to switch modes.

[Webflow's canvas Preview workflow](https://help.webflow.com/hc/en-us/articles/33961334731411-Overflow-hidden) and [GrapesJS's Preview implementation](https://github.com/GrapesJS/grapesjs/blob/7fe07c839c37cf724346a7b5948551570e61680b/packages/core/src/commands/view/Preview.ts) support the editor-mode approach.
GrapesJS uses an [iframe canvas](https://grapesjs.com/docs/api/canvas.html) inside its editor, so this precedent establishes the interaction pattern rather than proving ORC-web's direct same-page renderer.

## Editor layout verification

These are implementation acceptance checks, not recorded application results.

- Verify the logo-free header, horizontal project tabs, Dashboard, project **+**, and the single Select/Pan/Text/Code/Preview toolbar, including keyboard access.
- Open two separate projects, switch between them, and verify independent design state, selection, view, Code drafts, Undo histories, save locations, and save feedback.
- Verify Dashboard preserves open tabs, opening an existing project focuses its tab, and project-tab closing preserves the existing Save/Discard/Cancel and Code-draft safeguards.
- Verify contextual Saving/Saved feedback, persistent unresolved Not saved/Save failed, active-project MCP reads, and rejection of edits addressed to another project without modifying either design.

## Performance boundary

The first implementation must prove that pan, zoom, selection, dragging, and live component rendering remain clear and responsive with a useful number of visible objects.
The object-count target and performance measurements remain open until the first canvas prototype exists.

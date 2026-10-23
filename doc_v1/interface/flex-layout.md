# Flex layout

## Status and scope

Accepted V1 behavior: Flex arranges children in relation to their frame and siblings.
V1 includes Wrap in Flex, Row and Column directions, row wrapping, gap, padding, alignment, Space between, Fixed/Fit/Fill sizing, nested frames, and Absolute Position for children outside the flow.
Flex layout, Row, Column, Wrap in Flex, and Absolute Position are the agreed product terms.
This applies the behavior in the Paper transcript supplied by the user.
It does not import Paper's unrelated product behavior.

The transcript does not settle every default, platform shortcut, conversion rule, or sizing conflict.
ORC-web additionally accepts the wrapping defaults, layout-mode switching, row wrapping, and Fill sizing behavior recorded below.
Remaining ORC-web details stay marked as proposals or open decisions.

This document owns parent Flex controls, child sizing in Flex, wrapping a selection, and ordering Flex children.
[Layers and Properties](properties-panel.md) defines where those controls appear for a selected frame or child.
[Constraints](constraints.md) owns placement and resize behavior for children outside Flex flow.

## Source and terminology

The source is the user-supplied transcript of "Flex layout in Paper" by Paper Design.
The transcript was supplied as text, without a video URL.
No independent viewing or verification of the video is claimed.
Timestamp references below identify the supplied transcript.

Paper explains its CSS terminology at 00:02–00:27.
The ORC-web section name is Flex layout.
Direction controls say Row and Column with horizontal and vertical icons and short explanations.
Familiar controls and visual examples should make the interface usable without prior CSS knowledge.

## Parent layout and child participation

The parent frame determines how its children are arranged.
A frame's own placement in its parent is separate from the layout it gives its children.
For example, a frame can be a child in a Row while arranging its own children in a Column.

| Parent layout | Child placement | Controls for the child |
| --- | --- | --- |
| Free | Free placement | Position, size, and Constraints. |
| Row or Column | Participates in Flex flow | Fixed, Fit, or Fill sizing and applicable alignment. |
| Row or Column | Absolute Position enabled | Position, size, and Constraints. |
| Infinite workspace | Loose root object | Workspace coordinates and size; no parent-edge Constraints. |

Flex arranges direct participating children in their Layers order.
Nested descendants follow their own parent layout.
Absolute children retain their parent and Layer identity but do not occupy a Flex slot.
Imported components participate through their outer design object.
A source-backed component layer participates in Flex only when its binding owns the relevant parent layout and child sizing values.
These participation rules follow the transcript at 00:28–01:22 and 11:27–12:16.

## Properties controls

Show the controls relevant to the selected frame or child.
Keep every operation available through a visible control even when a shortcut also exists.

| Control | Behavior |
| --- | --- |
| Direction | Row or Column; changing direction preserves sibling order. |
| Gap | One spacing value for adjacent participating children and, in a wrapped Row, between rows. |
| Wrap to next line | Allows a Row to place participating children onto additional rows when space runs out. |
| Padding | Horizontal and vertical values, with access to all four sides. |
| Alignment | A nine-point visual control for packed content. |
| Distribution | Packed or Space between, available as a visible choice. |
| Width and Height | Fixed, Fit, or Fill where the selected relationship supports that mode. |
| Absolute Position | Removes the selected child from Flex flow and reveals Constraints. |

The transcript covers direction at 03:53–04:34, alignment at 04:35–05:15, and distribution at 05:52–06:44.
In this document, Wrap in Flex means making a new Flex frame around a selection.
It does not mean wrapping Flex children onto additional lines.
Wrap to next line is the separate Row control for additional lines.
Independent row-gap and column-gap controls, Column wrapping, and detailed multi-line alignment remain open decisions.

## Switching layout modes

Changing an existing frame between Free, Row, and Column updates the layout live through Properties.
Free to Row or Column arranges participating children in their existing Layers order using the frame's gap, padding, and alignment.
Row to Column or Column to Row preserves sibling order and each child's sizing intent where the destination layout supports it.
Unsupported sizing relationships follow the existing unavailable-state and validation rules instead of leaving a partial conversion.

Row or Column to Free captures each participating child's current measured position and size in its immediate parent coordinates.
Those measured dimensions become its starting Fixed width and height, with Left and Top constraints for its new free placement.
The conversion keeps the children where they currently appear so the person can begin moving them freely.
Existing Absolute Position children retain their placement, sizing rules, and constraints.
Child identity and parent hierarchy stay intact throughout these layout switches.

Each completed switch is one command and one Undo step.
Undo restores the previous parent layout, child placement, sizing rules, and constraints together.
Measurement, source ownership, and rendering validation must succeed before committing the switch.
For a supported React layout, conversion updates the owning source or inputs rather than only changing runtime DOM.
Exact CSS projection and handling of unsupported source shapes remain implementation details to verify.

## Row wrapping

For a selected Row frame, Properties exposes **Wrap to next line**.
Off keeps participating children in one row under their existing sizing and overflow rules.
On allows children to continue onto additional rows when the frame's available width cannot accommodate them.
The child order remains the same across rows and in Layers.
Absolute Position children do not participate in line formation.

The existing Gap value supplies both spacing between items and spacing between rows.
A Fit-height frame grows to contain the resulting rows, including padding and applicable size limits.
A Fixed-height frame keeps its sizing intent and follows its clipping setting if rows extend outside it.
Toggling wrapping is one completed command and one Undo step and never changes the clipping setting.

Fixed-width cards keep their widths, leaving unused space in an incomplete final row under packed start alignment.
Fill cards share the available width within each row, after gaps, padding, and Fixed children, subject to their minimum and maximum widths.
Two Fill cards on a final row can therefore be wider than three Fill cards on the row above.
Use Fixed widths when cards should retain the same width across rows.
Space between still controls distribution of any remaining space within each row.
Properties explains the difference between Fixed widths and per-row Fill sharing.

Wrapping needs an available width at which to break lines; a Fit-width frame is not promised to wrap without a bound supplied by its layout or size limits.
The exact line-formation basis for Fill children and the browser mapping must be verified before implementation is considered supported.
This contract does not infer a card count or create a separate Grid layout.
Detailed row-group alignment, independent row/column gaps, and Column wrapping remain open rather than receiving guessed controls.

## Wrap in Flex

The transcript demonstrates a visible Wrap in Flex action and Shift+A at 01:23–01:55.
Wrap in Flex creates a new frame and reparents the selected objects into it as one command.
The current proposal limits wrapping to compatible consecutive siblings, including siblings at workspace root.
A selection spanning different parents or incompatible component slots needs an explanatory unavailable state rather than a guessed conversion.
Locked targets and ancestor-plus-descendant selections are rejected.

The person chooses Row or Column before committing.
The new frame starts with an 8 px gap and 0 padding.
After success, the new frame becomes selected so Properties exposes its direction, gap, padding, and sizing.
These defaults are ORC-web decisions rather than values inferred from the transcript.
The new frame starts with Fit sizing on each axis where its children can supply a valid content size.
The selected objects retain their existing sizing rules and current dimensions where those rules allow it.
If a Fill child needs a definite parent extent on an axis and none is independently available, give the new wrapper a Fixed size on that axis.
Derive that initial extent from the children's current measured dimensions in the chosen arrangement, including the starting gap and padding.
Show the resulting sizing choices in the conversion preview and Properties.
Do not change a valid Fit/Fill combination merely because it contains a Fill child.
This fallback chooses the new wrapper's initial sizing; it does not silently convert an existing parent's sizing mode.
The exact wrapper-placement default remains open.
The selected objects keep their existing sibling order.

Wrapping arbitrary free-positioned objects can change their arrangement.
Show the resulting arrangement in the live editor before the conversion is finalized.
Do not promise pixel preservation when converting a scattered selection into a Row.
Undo removes the wrapper and restores the original objects, parents, order, placement, and sizing.
Atomic conversion and the exact undo payload remain implementation details to verify.

## Gap editing

The transcript shows four ways to change gap at 02:02–02:32.
The editor supports direct typing, arrow-key adjustment in the input, dragging the input value, and dragging a canvas gap handle.
Every path edits the same saved gap value.
Dragging one visible gap changes the shared gap, rather than creating an unexplained per-child margin.
With fewer than two participating children, the numeric gap remains editable but there is no gap handle between children.
Absolute children do not create gap handles.

The transcript demonstrates arrow-key increments of 1 unit and 8 with Shift, or a custom nudge value.
The exact ORC-web increment and configuration remain open product details.
Input focus takes precedence over canvas shortcuts.
A scrub or gap-handle gesture creates one Undo entry on completion.
Cancellation restores the value from before the gesture.

## Padding editing

The transcript demonstrates paired horizontal and vertical padding, then independent sides, at 03:08–03:52.
The panel starts with paired controls and offers an explicit four-side expansion.
Expanding the controls does not change any values.
If existing opposite sides differ, the paired control displays **Mixed** until the person deliberately assigns one value to both.
The expanded controls reveal the current Top, Right, Bottom, and Left values.
Completing a paired-value edit assigns that value to both relevant sides as one command and one Undo step.
Undo restores the previous side values, including any asymmetry.
The live editing and cancellation rules are the same as other numeric [Properties fields](properties-panel.md#editing-and-feedback).
Changing padding reflows participating children and updates a Fit frame's size where applicable.
Component padding is editable through a supported source binding, a declared component property, or Code source editing.
Properties does not guess an internal layout mutation.

## Insertion and reordering

The transcript shows a destination outline and insertion line at 02:33–03:07.
ORC-web indicates the receiving frame and the exact sibling position before a drop.
An ordinary drop into a Flex frame joins its flow at the indicated insertion position.
The destination's gap and alignment arrange the object with its new siblings.
The live preview shows the resulting position and sizing before release.
Absolute Position remains a separate explicit placement choice, as described below.
Moving a participating Flex child reorders it; it does not silently make that child absolutely positioned.
Reparenting and constraint conversion follow [Constraints](constraints.md#reparenting-and-switching-layout).
Show unavailable destinations for locked frames, structural cycles, or incompatible component slots.

With canvas focus in Edit, Left or Right reorders one selected participating child by one sibling position in a Row, and Up or Down does so in a Column.
Text editing, Properties inputs, Code, and focused menus retain their own arrow-key behavior.
Shift does not convert a Flex reorder into free pixel movement.
Cross-axis arrows do not take the object out of flow or change alignment.
Each completed reorder updates Layers and canvas from the same child order and is undoable.
The full nudge, focus, and held-key boundaries are defined in [Keyboard movement](workspace-and-canvas.md#keyboard-movement).
MCP [reorder_nodes](../mcp/tools/reorder_nodes.md) uses the same authoritative child order and supported destination/participation rules.

## Alignment and Space between

The nine-point control describes physical positions such as top-left or bottom-center.
For a Row, horizontal choices control main-direction distribution and vertical choices control cross-direction alignment.
For a Column, those responsibilities exchange axes.
Changing direction preserves the sibling sequence.

Space between distributes remaining space between participating children.
The specified gap remains a minimum separation when there is enough room; the visible separation can therefore be larger than the Gap input.
With zero or one participating child, the proposal uses start placement without inventing distributed gaps.
The exact browser behavior with overflow and minimum sizes needs implementation verification.

Paper's double-click on the center alignment cell is a shortcut for Space between at 05:52–06:14.
ORC-web should expose the named distribution control first.
The double-click gesture is optional and must never be the only way to discover the operation.

## Fixed, Fit, and Fill

Each axis has its own sizing choice.
A frame can have a Fixed width and Fit height, or Fill width and Fixed height.

| Mode | Accepted V1 meaning |
| --- | --- |
| Fixed | Preserve the chosen dimension unless the person changes it or an explicit size limit applies. |
| Fit | Derive the dimension from participating content, gaps, and padding, subject to declared size limits. |
| Fill | Take available space supplied by a bounded parent layout. |

Fixed must not quietly become shrinkable merely because its parent is too small.
Overflow follows the frame's clipping setting and needs visible feedback.
For multiple Fill children on the main axis, share the available space equally after padding and gaps, subject to each child's minimum and maximum sizes.
In a wrapped Row, calculate that share independently within each row as defined in [Row wrapping](#row-wrapping).
Fixed children keep their chosen dimensions; Fill children share the remaining space.
Row applies this rule to width and Column applies it to height.
Size limits can produce unequal shares; preserve those limits rather than forcing every child to the same size.
When space is insufficient, retain the sizing rules and honor the frame's clipping setting.
On the cross axis, Fill stretches into the available inner extent.
Absolute children do not make a Flex frame larger under Fit sizing.

The transcript demonstrates the three modes at 08:36–10:52.
Its dashboard example does not define every possible Fit-parent and Fill-child combination.
A parent deriving its size solely from a Fill child on the same axis has no independently defined available size under these accepted editor rules.
When that dependency leaves no defined available space, show Fill as unavailable with **Set the parent's width first.** for width or **Set the parent's height first.** for height.
Keep the existing layout until the person resolves the dependency; do not silently change either sizing mode.
Valid nested Fit/Fill combinations remain supported.
Mixed Fixed, Fit, and Fill cases must be checked against actual browser measurements before declaring support.
Text wrapping and Fit height behavior are defined in [Text editing](text-editing.md).
Canvas handles respect each axis's sizing owner and follow [Manual resizing](workspace-and-canvas.md#manual-resizing).

## Worked example: account menu

The transcript builds this example across 05:52–07:49.

```text
Account menu: Row, Fixed width, Fit height, Space between
├── User info: Row, Fit, gap 8
│   ├── Avatar: Fixed
│   └── Identity: Column, Fit, gap 2
│       ├── Name: Fit
│       └── Email: Fit
└── Chevron: Fixed
```

The outer frame distributes space between User info and Chevron.
The inner Row keeps the avatar and text together.
The inner Column stacks the name and email without changing their relationship to the avatar.
Flattening those siblings would change the layout because Space between acts on direct children.

## Worked example: sidebar

The transcript demonstrates a sidebar at 07:50–08:35.
Use a Column with a bounded height and Space between.
Its two direct children are a navigation group and the account menu.
The navigation group contains the brand and links in its own Column.
Increasing the sidebar height adds space between those two outer children while keeping the navigation together.
This layout uses normal Flex flow and does not require an absolute bottom constraint.

## Absolute Position inside Flex

The transcript introduces a close button outside Flex flow at 11:27–12:16.
The proposed action captures the child's measured box in its parent's coordinate system before changing participation.
The same object ID, component properties, and parent remain intact.
Its siblings then reflow without reserving a slot for it.
The panel switches from Flex child placement to Position and Constraints.

Turning Absolute Position off returns the child to its existing sibling position in Flex flow.
Remove active absolute offsets and constraints in that same command so they cannot fight the new layout.
Undo restores the prior state.
If the parent uses Fit, its size can change when a child leaves or re-enters flow; the conversion preview must show that result.

## Persistence, commands, and export

Save parent layout and the Row wrapping choice separately from each child's participation and per-axis sizing intent.
Derive rendered line membership from the current layout rather than storing a second child order for each row.
Do not store measured drag-preview boxes as a second authoritative layout system.
The current model sketch needs a defined mapping for these values before implementation.

Wrap, reparent, participation changes, layout-mode switches, wrapping toggles, and size-mode changes each need one atomic command and one Undo step.
Human controls and agent edits must use the same validation and conversion rules.
The existing MCP names are not changed by this proposal.
The public tool mapping for an atomic Wrap in Flex operation remains open; composing several public mutations must not be presented as one atomic operation.
MCP [update_styles](../mcp/tools/update_styles.md) applies supported parent-owned layout/spacing values through these conversion rules, and [resize_node](../mcp/tools/resize_node.md) respects per-axis sizing ownership.
Their exact semantic field schemas remain open; arbitrary CSS assignment must not bypass atomic layout conversion or silently turn Fit/Fill into Fixed.

React and HTML/CSS exports should preserve layout intent using browser layout rules rather than freeze the latest measured positions.
Image and PDF exports use the rendered result at the chosen frame dimensions.

## Fedora and Windows shortcuts

Shift+A is proposed for Wrap in Flex when the canvas has focus.
The transcript uses macOS Option for duplication and Fill sizing shortcuts.
Alt equivalents and double-click edge gestures need validation on Fedora KDE, Windows, and the supported browsers before being promised.
All actions remain available through visible controls regardless of shortcut support.

## Acceptance scenarios for later implementation

- Wrap workspace-root siblings with the chosen direction, 8 px gap, and 0 padding; select the new frame, then Undo to restore their exact identities and placement.
- Verify Fit wrapper sizing and the per-axis Fixed fallback when a Fill child has no independently available parent extent, without converting valid Fit/Fill layouts.
- Drop an object into the indicated Flex slot and verify gap, alignment, Layers order, and one-step Undo.
- Reorder a Row and switch it to a Column without changing sibling order.
- Switch Row or Column to Free without moving visible children; Undo restores the previous layout and sizing, while existing Absolute Position children retain their rules.
- Toggle Wrap to next line and resize a bounded Row, preserving Layers order, item/row gap, Fit-height growth, and Fixed-height clipping.
- Verify Fixed cards keep their widths and Fill cards share space independently in each row, including an incomplete final row and min/max limits.
- Verify layout switches and row wrapping persist through save/reopen and supported React or HTML/CSS export.
- Change gap by typing and by canvas handle, producing the same saved value.
- Expand asymmetric padding controls without changing the existing four values.
- Resize the account-menu example and verify the text stays with the avatar.
- Resize the sidebar example and verify Space between separates its two outer children.
- Take a close button out of flow and verify it stops contributing to gaps and Fit sizing.
- Detect an unresolved Fit/Fill dependency without leaving a partial layout change.
- Share remaining width or height between Fill children while preserving Fixed dimensions and existing minimum/maximum sizes.
- Verify exported React or HTML/CSS reflows at different parent sizes.

These are proposed acceptance scenarios, not checks performed during this documentation work.

<!-- codex-pc 2026-10-19: Approved intrinsic Column projection.
The multiple-Fill contract above includes independently supplied content-sized Columns, not only explicit Fixed parent heights.
A supported ordinary Column may use the own --orc-intrinsic-column:1 CSS declaration to request the versioned intrinsic-column-v1 source projection.
Its canonical layout remains Flex Column and its canonical ordered children remain unchanged.
Generated HTML uses an outer single-cell Grid and an inner inherited Flex box so native intrinsic contribution and constrained equal sharing both work with changing Fit siblings and simultaneous limits.
The inner box is generated layout structure, not a new Layer, canonical parent or user-facing Grid mode.
Frame geometry, coordinates, paint, padding, borders and clipping stay on the outer object; flow membership, spacing and distribution use the inner box.
Renderer and copied HTML share one source projector and the importer recognizes only its exact inverse.
Unknown or modified marked structures are refused; explicitly removing data-orc-layout opts out and retains the real wrapper markup as ordinary editable HTML.
The marker and dependent child CSS enter through one atomic command with exact Undo/Redo.
An opted-in Column retains its wrapper through Fit/Fixed edits and shrinking membership; an explicit layout exit removes the marker and normalizes supported sizing in the same command.
The first wrapper insertion is a structural Edit conversion that can remount children; subsequent stable updates must preserve runtime identity.
Preview mounts the applied structure before interaction begins.
Source-backed React rewriting, portal behavior and complete export workflows remain separately tracked integration work.
Native source output must reflow without an editor runtime or saved measured dimensions.
See ../../backlog/intrinsic-column-wrapper-proposal.md and ../../backlog/intrinsic-column-react-review.md for the measured reason, tradeoffs and integration boundaries.
-->

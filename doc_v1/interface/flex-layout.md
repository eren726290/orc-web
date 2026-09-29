# Flex layout

## Status and scope

Accepted V1 behavior: Flex arranges children in relation to their frame and siblings.
V1 includes Wrap in Flex, Row and Column directions, gap, padding, alignment, Space between, Fixed/Fit/Fill sizing, nested frames, and Absolute Position for children outside the flow.
Flex layout, Row, Column, Wrap in Flex, and Absolute Position are the agreed product terms.
This applies the behavior in the Paper transcript supplied by the user.
It does not import Paper's unrelated product behavior.

The transcript does not settle every default, platform shortcut, conversion rule, or sizing conflict.
Those ORC-web details remain marked as proposals below.

This document owns parent Flex controls, child sizing in Flex, wrapping a selection, and ordering Flex children.
[Layers and Properties](layers-and-properties.md) defines where those controls appear for a selected frame or child.
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
| Gap | One consistent distance between adjacent participating children. |
| Padding | Horizontal and vertical values, with access to all four sides. |
| Alignment | A nine-point visual control for packed content. |
| Distribution | Packed or Space between, available as a visible choice. |
| Width and Height | Fixed, Fit, or Fill where the selected relationship supports that mode. |
| Absolute Position | Removes the selected child from Flex flow and reveals Constraints. |

The transcript covers direction at 03:53–04:34, alignment at 04:35–05:15, and distribution at 05:52–06:44.
In this document, Wrap in Flex means making a new Flex frame around a selection.
It does not mean wrapping Flex children onto additional lines.
Line wrapping, row-gap, column-gap, and multi-line alignment remain open decisions.

## Wrap in Flex

The transcript demonstrates a visible Wrap in Flex action and Shift+A at 01:23–01:55.
Wrap in Flex creates a new frame and reparents the selected objects into it as one command.
The current proposal limits wrapping to compatible consecutive siblings, including siblings at workspace root.
A selection spanning different parents or incompatible component slots needs an explanatory unavailable state rather than a guessed conversion.
Locked targets and ancestor-plus-descendant selections are rejected.

Initial direction, sizing, gap, and wrapper placement remain proposals because the transcript does not settle their defaults.
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
If existing opposite sides differ, the paired control displays a mixed value until the person deliberately assigns one value to both.
Changing padding reflows participating children and updates a Fit frame's size where applicable.
Component padding is editable through a supported source binding, a declared component property, or Code source editing.
Properties does not guess an internal layout mutation.

## Insertion and reordering

The transcript shows a destination outline and insertion line at 02:33–03:07.
ORC-web should indicate the receiving frame and the exact sibling position before a drop.
Moving a participating Flex child reorders it; it does not silently make that child absolutely positioned.
Dropping an ordinary object into Flex should preview its new position and sizing.
Show unavailable destinations for locked frames, structural cycles, or incompatible component slots.

Arrow keys reorder a selected Flex child along the main direction when the canvas has focus, as described in the transcript.
The exact keyboard-focus behavior must coexist with text editing, numeric inputs, menu navigation, and free-positioned object nudging.
Each completed reorder updates Layers and canvas from the same child order.

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

| Mode | Proposed meaning |
| --- | --- |
| Fixed | Preserve the chosen dimension unless the person changes it or an explicit size limit applies. |
| Fit | Derive the dimension from participating content, gaps, and padding, subject to declared size limits. |
| Fill | Take available space supplied by a bounded parent layout. |

Fixed must not quietly become shrinkable merely because its parent is too small.
Overflow follows the frame's clipping setting and needs visible feedback.
For multiple Fill children on the main axis, the starting proposal is equal shares of remaining space, subject to minimum and maximum sizes.
On the cross axis, Fill stretches into the available inner extent.
Absolute children do not make a Flex frame larger under Fit sizing.

The transcript demonstrates the three modes at 08:36–10:52.
Its dashboard example does not define every possible Fit-parent and Fill-child combination.
A parent deriving its size solely from a Fill child on the same axis has no independently defined available size under these proposed editor rules.
Show the dependency and require a resolving choice instead of repeatedly resizing parent and child or silently changing either mode.
Mixed Fixed, Fit, and Fill cases must be checked against actual browser measurements before declaring support.
Text wrapping and Fit height behavior are defined in [Text editing](text-editing.md).

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

Save parent layout separately from each child's participation and per-axis sizing intent.
Do not store measured drag-preview boxes as a second authoritative layout system.
The current model sketch needs a defined mapping for these values before implementation.

Wrap, reparent, participation changes, and size-mode changes each need one atomic command and one Undo step.
Human controls and agent edits must use the same validation and conversion rules.
The existing MCP names are not changed by this proposal.
The public tool mapping for an atomic Wrap in Flex operation remains open; composing several public mutations must not be presented as one atomic operation.

React and HTML/CSS exports should preserve layout intent using browser layout rules rather than freeze the latest measured positions.
Image and PDF exports use the rendered result at the chosen frame dimensions.

## Fedora and Windows shortcuts

Shift+A is proposed for Wrap in Flex when the canvas has focus.
The transcript uses macOS Option for duplication and Fill sizing shortcuts.
Alt equivalents and double-click edge gestures need validation on Fedora KDE, Windows, and the supported browsers before being promised.
All actions remain available through visible controls regardless of shortcut support.

## Acceptance scenarios for later implementation

- Wrap workspace-root siblings and Undo to restore their exact identities and placement.
- Reorder a Row and switch it to a Column without changing sibling order.
- Change gap by typing and by canvas handle, producing the same saved value.
- Expand asymmetric padding controls without changing the existing four values.
- Resize the account-menu example and verify the text stays with the avatar.
- Resize the sidebar example and verify Space between separates its two outer children.
- Take a close button out of flow and verify it stops contributing to gaps and Fit sizing.
- Detect an unresolved Fit/Fill dependency without leaving a partial layout change.
- Verify exported React or HTML/CSS reflows at different parent sizes.

These are proposed acceptance scenarios, not checks performed during this documentation work.

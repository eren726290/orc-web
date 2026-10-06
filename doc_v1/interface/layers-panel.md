# Layers panel

## Status

Accepted product behavior with the explicit release scope below.
This document owns the human Layers-panel workflow for ordinary HTML/CSS objects and supported React component layers.
The complete panel, source mapping, and platform behavior still require implementation and verification.

## Release scope

Names, selection, hierarchy, locks, and expansion remain V1.
Saved Layer hide/show and MCP visibility-setting mutations are [scheduled for V1.1](../../backlog/layer-visibility-v11.md).
The Visibility section preserves their researched future workflow; existing authored visibility and saved values remain supported.

## Purpose and placement

Layers lets a person find an object, understand its parent and children, select it, rename it, or lock it.
The future hide/show control follows the V1.1 schedule above.
It shares the left panel with the Tokens tab.
Switching between Layers and Tokens preserves the current selection and Properties.

The Layers tab has one **+ Add** button that directly opens [component import](../import-export/component-import.md).
Text creation uses the top-bar Text tool.
Manual frame creation and new image/SVG insertion remain outside the V1 entry points, as defined in [Workspace and canvas](workspace-and-canvas.md#human-content-entry-points).
When the project has no layers, the panel shows **No layers yet** and keeps the existing **+ Add** button visible.

## One hierarchy

Layers presents the same parent and child hierarchy as the saved design.
The workspace root contains loose objects and frames in document order.
Frames, groups, and supported component roots can contain nested objects.
An object does not need to belong to an artboard to appear in Layers.

Each row resolves to a stable object ID or accepted source-binding ID.
Display names, text content, HTML tags, and browser DOM positions are not editing identities.
Two objects with the same name remain separate targets.
The panel derives its hierarchy from canonical nodes and accepted component bindings.
It never builds an independently editable tree by inspecting arbitrary runtime DOM.

Layer order follows the document's child order.
Where that order controls rendering, a supported reorder also changes the visible stacking or Flex sequence.
Parent changes, reordering, and related geometry changes use the existing atomic commands and layout rules.
Layers row dragging for reordering or changing parents is scheduled for [V1.1](../../backlog/layers-drag-drop-v11.md).
V1 rearrangement uses the existing canvas movement and Flex keyboard reordering workflows.

## Row presentation

Use the readable object presentation established by the Paper reference: indentation, a disclosure arrow when applicable, a type icon, and a readable name.
The row's primary content is its icon and name.
Properties provides the selected object's name and type in its header.

| Object | Row presentation |
| --- | --- |
| Frame or ordinary container | Container icon and readable name; an arrow when it has children. |
| Text | `Aa` marker and readable label. |
| Image | Image icon and readable name. |
| SVG | SVG icon and readable name; an arrow for supported exposed children. |
| Supported SVG child | Applicable shape icon and readable name where the SVG contract exposes that child. |
| React component | Component icon and readable component or instance label; an arrow for supported editable children. |

Indentation shows the immediate parent relationship.
Readable authored names such as Navigation, Main heading, and Product image can coexist with generic names such as Frame or Text.
An image that looks like a complete interface still has one image row unless the document actually contains editable objects inside it.
Rows reflect the saved editable structure rather than the apparent complexity of the artwork.

Paper's observed image icons inform presentation without requiring ORC-web to convert Image nodes into Rectangle nodes.
React component identity and authored HTML semantics remain governed by ORC-web's own model and source contracts.
The icon artwork and any distinction between Row and Column container icons remain implementation choices.

```text
Landing page
├── Navigation
│   ├── Logo
│   └── Links
└── Hero
    ├── Main heading
    ├── Product image
    └── Buy button

Loose note
```

This example shows hierarchy and names; the actual panel supplies the applicable icons and disclosure arrows.
Landing page is a frame, Hero can be a React component, and Loose note is outside the frame.

## Selection and connected panels

Clicking a row's name selects that object.
The canvas and Layers identify the same selected object, and Properties shows its applicable controls.
Selecting an eligible object on the canvas highlights its Layers row, opens its ancestor branches, and scrolls that row into view.
Changing selection uses stable IDs even when multiple rows have identical names or displayed content.

Opening Code preserves selection.
The Code window uses the selected object or supported binding to show the relevant applied source.
With unapplied Code text, changing or clearing selection first asks **Discard unapplied changes?**.
Cancelling keeps the current selection and draft; discarding allows the requested selection change.
The complete safeguard belongs to [Code window](code-window.md#unapplied-code).

Hidden objects, clipped children, and locked objects remain available for selection through Layers.
Their visibility, clipping, or lock state determines what the canvas can show and what editing is allowed.
Selecting a hidden row does not make that object visible.
Selecting a locked row does not unlock it.
An affected component's runtime error placeholder and its Layers row still identify the component for inspection and repair.

The accepted several-object workflow remains Shift-click selection for compatible movement, deletion, Wrap in Flex, and export.
Its scope is defined in [Workspace and canvas](workspace-and-canvas.md#several-selected-objects).
V1 has no marquee selection or bulk Properties editing.
This document does not introduce additional tree-selection shortcuts.

## Renaming a Layer

Double-click a row's name to edit its display name in place.
Press Enter or click outside the name field to finish.
Escape cancels and restores the previous name.
Name-field typing retains normal text-editing keyboard behavior.
It must not trigger canvas nudges, object deletion, or document Undo for unrelated changes.

A completed rename changes the selected object's editor label and the matching Properties header.
The text displayed by a Text object, HTML tag, HTML `id`, React function name, import, and export name keep their own values.
Renaming Main heading to Page title leaves its visible heading words unchanged.
Renaming a Hero row does not rename its React implementation or create an independent component.

The command targets the selected stable identity, so another row with the same label is unaffected.
A successful rename is one command and one Undo step and is saved with the project.
Undo restores the previous label.
Rejected name validation preserves the committed label and creates no history entry.
Finishing with an empty name or a name containing only spaces keeps the previous name.
It creates no command or Undo entry and requires no additional dialog.
Exact feedback for other rejected name values remains an implementation question.
MCP [rename_nodes](../mcp/tools/rename_nodes.md) follows the same label/identity and empty-name rules through saved commands.

## Visibility

This saved editing workflow is scheduled for V1.1 and is not a V1 Layer control or MCP mutation.

An eye control appears when a row is hovered or selected.
Click it to hide the object; click again to show it.
The controls must also be reachable by keyboard with names that identify their target and action.
A hidden object retains a dimmed row and a persistent hidden indicator so it can be found and restored without hovering first.

Hiding removes the object from the visible design without deleting its saved content or children.
It cannot be selected by clicking an invisible canvas object, but its row remains selectable for Properties and restoration.
Showing it restores its existing design values and hierarchy.

Hiding a parent hides its descendants together.
The command changes the parent's own visibility setting and preserves every child's individual setting.
Showing the parent again leaves an individually hidden child hidden.
Showing only a child beneath a hidden parent does not override the parent.
The panel must distinguish inherited visibility from the child's own setting; the exact indicator treatment remains an implementation choice.

Each successful visibility toggle is one saved command and one Undo step.
Undo restores the previous visibility setting without rewriting child settings.
Failed validation preserves the previous state.

Saved Layer visibility is separate from **Show content**, which temporarily reveals a supported menu, dialog, or other hidden component region for editing.
Show content remains editor view state and preserves the component's saved default behavior, as defined in [Editable React components](react-components.md#hidden-component-content).

## Locking

A lock control appears when a row is hovered or selected.
A locked row retains a visible lock indicator.
The control is keyboard accessible and identifies the target object and Lock or Unlock action.

Locking protects an object from direct design edits.
Canvas selection skips locked objects.
Moving, resizing, deleting, renaming, or changing the locked object's design values requires unlocking it first.
Layers still allows selection of its row so the person can inspect Properties and Code and reach Unlock.
Applicable design controls are read-only while locked; source inspection remains available.
Code Apply and command handlers must enforce the applicable lock rules rather than relying only on disabled panel controls.

Locking a parent protects its descendants from direct edits as well.
Unlocking the parent preserves each child's own lock setting.
An individually locked child stays locked when the parent is unlocked.
For a child protected by a locked ancestor, Properties explains that the ancestor must be unlocked before editing.
The exact inherited-state indicator remains an implementation choice.

Each successful lock or unlock is one saved command and one Undo step.
The explicit Unlock action can remove the targeted lock; ordinary edit commands cannot bypass it.
Rejected commands leave the object and history unchanged.

Preview interactions continue normally.
A locked button can still run its supported interaction in Preview, and locking does not freeze Motion or React behavior.
Detailed lock handling for indirect shared-token or shared-component updates is deferred to [later V1.x](../../backlog/shared-update-locks-v1x.md), outside the V1.1 schedule.
This document does not promise that an object lock freezes every shared dependency.
MCP [update_node_settings](../mcp/tools/update_node_settings.md) follows these own/inherited lock rules.

## Expanding and collapsing

Opening a project shows its top-level frames and loose objects with child branches collapsed.
Canvas selection still reveals the selected row by expanding its ancestors under the existing selection rules.

A row with exposed children has a disclosure arrow.
Clicking that arrow expands or collapses the branch without selecting a different object.
Clicking the name selects the object; double-clicking the name starts renaming.
Leaf rows have no expand action.

Expanding shows the object's direct children, with deeper descendants following their own expansion state.
Collapsing removes that branch's descendants from the visible list without changing the saved design hierarchy.
Collapsing a branch preserves the current canvas selection and Properties, including when a selected descendant's row becomes temporarily out of view.
A later canvas selection reveals the selected row by opening its ancestor branches and scrolling it into view.

Expansion is editor view state.
It creates no document revision, Undo entry, or saved design change.
Any session preference storage remains an implementation question.
This batch does not add Expand all, Collapse all, search, or special tree-navigation shortcuts.

## React component layers and supported operations

A supported React component has a root row for its placement and can expose editable children through accepted source bindings.
A Hero can contain Heading, Product image, and Buy button rows while remaining a live React component.
Declared slots and local collection records can appear where their contracts provide a reliable editable identity.
Package internals, generated wrappers, portals, and arbitrary runtime descendants do not automatically become rows.

Each design control requires a supported owner for the value it changes.
A layer can have editable typography while its computed text requires Edit source.
The same rule applies to structural operations and, in V1.1, visibility operations that cannot be mapped reliably to authored React source or instance data.
Explain the unsupported operation and retain other supported controls rather than guessing a source mutation.

React display labels and editor locks need durable metadata associated with the stable source-backed layer identity.
The exact production fields are still an implementation task.
They must not create a second independently editable style tree or depend on the current DOM position.

Supported shared design changes use **Only this** or **All copies** under the [React source-binding contract](../architecture/react-source-bindings.md#choose-edit-scope).
A display-name edit alone does not invoke component copying.
After a supported command, selection follows the same logical layer.
After Code Apply, an uncertain old binding must be cleared with an explanation rather than silently selecting a similar element.
Verified text/style edits and reorders keep the same layer selected; a known deletion selects a verified surviving parent or clears selection under the [Code selection rules](code-window.md#selection-after-apply).
The resulting canvas selection, Layers highlight, Properties, and Code scope stay aligned.
MCP [reorder_nodes](../mcp/tools/reorder_nodes.md) and [delete_nodes](../mcp/tools/delete_nodes.md) require the same reliable structural/source owners and keep the committed tree consistent with the rendered design.
These agent operations do not add the deferred human Layers drag workflow.

## Commands, saving, and view state

| Action | Saved design change | Undo entry |
| --- | --- | --- |
| Rename a Layer | Display name. | One completed command. |
| Finish a rename with an empty name or only spaces | No design change. | None. |
| Hide or show, V1.1 | Target's own visibility setting. | One completed command. |
| Lock or unlock | Target's own lock setting. | One completed command. |
| Supported canvas reorder or reparent | Document order, parent, and coupled layout values. | Existing atomic command. |
| Select a row | No design change. | None. |
| Expand, collapse, or reveal a selected row | No design change. | None. |
| Switch Layers/Tokens tabs | No design change. | None. |

Names, visibility, and locks survive save/reopen through the canonical design.
Selection and expansion remain outside the portable design data.
Human and agent mutations use the same validation and command engine.
Agents read current applied state through `get_context` or `get_source`; this panel adds no feedback-loop mechanism or new MCP tool contract.

## Implementation verification

The following are acceptance scenarios to verify in the actual editor, not claims that the panel already passes them.

- Render loose objects, nested frames, ordinary HTML/CSS content, and a supported React component in one tree with the correct hierarchy and icons.
- Open a populated project and verify top-level rows are visible, child branches start collapsed, and later canvas selection reveals the selected path.
- Open an empty project and verify No layers yet and the existing + Add button remain visible.
- Select nested content on the canvas and verify its ancestors expand, its row scrolls into view, and Properties and Code retain the same target.
- Rename one of two identically named rows; verify only its label changes, its text and source identifiers survive, and Undo and save/reopen restore the right values.
- Cancel a rename with Escape and verify no committed label or history change.
- Finish a rename with an empty value and with only spaces; verify the previous label remains, no extra dialog appears, and no document revision or Undo entry is created.
- For V1.1, hide a parent containing an individually hidden child, show the parent again, and verify the child's own visibility was preserved.
- Select a hidden or clipped object through Layers and verify inspection and eligible editing remain available.
- Lock a parent containing an individually locked child, unlock the parent, and verify the child's own lock remains.
- Verify locked targets reject direct canvas, Properties, and Code edits while their rows stay inspectable and Unlock remains reachable.
- Confirm locking preserves normal Preview interaction for a live component.
- Collapse a branch containing the selected object; verify selection and Properties stay intact and a later canvas selection reveals the row again.
- Switch Layers/Tokens or open Code and verify selection remains unchanged.
- With unapplied Code text, request another row and verify cancellation retains the old selection and draft.
- Apply a text/style change, reorder, and selected-layer deletion; verify identity-based continuity or the verified-parent fallback, no guessed replacement, and unchanged design and selection on failed Apply.
- Verify keyboard focus can reach row selection, disclosure, rename and lock controls; verify visibility controls for V1.1 without leaking editing keys into canvas actions.
- Reject an unsupported React operation without modifying source or preventing unrelated supported edits.
- Verify name and lock commands create one Undo step each, and apply that requirement to V1.1 visibility commands, while selection and expansion create none.
- Verify V1 rearrangement uses canvas movement and Flex keyboard reordering, with Layers following the applied hierarchy and row dragging reserved for V1.1.

## Remaining implementation questions

The production binding metadata for Layer labels and locks remains open.
Exact supported visibility projection belongs to the V1.1 plan.
Inherited-state indicators, feedback for other rejected name values, detailed tree keyboard/focus behavior, and any session preference storage also require implementation decisions.
These are tracked in the [backlog](../../backlog/README.md#open-topics).
Existing deferrals such as marquee selection, bulk Properties, and Duplicate remain in the [Properties V1.x backlog](../../backlog/properties-panel-v1x.md).

## Related contracts

- [Properties](properties-panel.md) owns the selected object's controls, live edits, field feedback, and Export section.
- [Workspace and canvas](workspace-and-canvas.md) owns canvas tools, geometry, selection gestures, and Edit/Preview.
- [Editable React components](react-components.md) owns supported content, shared scope, hidden regions, and collections.
- [React source bindings](../architecture/react-source-bindings.md) owns editable identities, value ownership, and source updates.
- [Canonical document model](../architecture/canonical-document-model.md) owns hierarchy, saved fields, and invariants.
- [Command engine and history](../architecture/command-engine-and-history.md) owns validation, revisions, and Undo.
- [Code window](code-window.md) owns applied source, drafts, Apply, and component repair.
- [Tokens panel](tokens-panel.md) owns the separate Tokens tab and token-management workflow.
- [Tokens and modes](tokens-and-modes.md) owns shared design definitions, explicit references, and mode resolution.
- [SVG editing](svg-editing.md) owns the V1 vector editing boundary; expandable rows do not introduce anchor-point editing.
- [insert_html](../mcp/tools/insert_html.md#layers-hierarchy-and-object-kinds) owns the mapping of submitted HTML into ordinary objects and this existing Layers hierarchy.

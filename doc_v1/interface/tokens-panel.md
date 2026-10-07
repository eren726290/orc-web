# Tokens panel

## Status

Accepted V1 panel behavior with explicitly scheduled V1.1 controls.
This document is a product contract, not a claim of implemented behavior.
[Tokens and modes](tokens-and-modes.md) owns definitions, CSS representation, shared references, and mode resolution.
[Properties](properties-panel.md#tokens-beside-property-values) owns applying, replacing, unlinking, and creating a token from a selected value.

## Placement and release scope

Tokens shares the left panel with Layers.
Opening Tokens or a token editor preserves canvas selection, the workspace view, and the selected object's Properties.
Search sits directly below the Layers/Tokens tabs.
V1 has no redundant **Design tokens** heading or total token count above Search.
The panel retains a dedicated **Create token** control.
The Layers **+ Add** button remains dedicated to component import; token creation is separate.

V1 provides creation and default-value editing for Color, Spacing, and Corner radius tokens.
Existing Typography tokens remain visible for inspection and retain their values and connections.
Dedicated Typography creation and value editors, Light/Dark value editing, and recognition of imported theme tokens are scheduled for V1.1 in the [release scope](tokens-and-modes.md#release-scope).
Imported components still use their required authored styles and theme values in V1.

## Empty panel and grouped list

An empty registry shows **No tokens yet** and a centered **Create token** button.
It opens the same creation flow as the panel's dedicated control.
A design made entirely with direct values can have an empty Tokens panel and still render correctly.
The panel lists explicit document tokens; it does not create definitions by scanning matching colors or dimensions.

The scrolling list uses collapsible category headings for Color, Spacing, Corner radius, and Typography where existing definitions apply.
Typography values use the separate types recorded in the [V1.1 Typography backlog](../../backlog/typography-tokens-v11.md).
Each row shows a readable name and a compact preview or value.

| Category | Example row |
| --- | --- |
| Color | Purple swatch and Brand color. |
| Spacing | Section spacing and 24 px. |
| Corner radius | Button radius and 8 px. |
| Existing Typography | Its name and the appropriate preserved value, such as Heading size and 32 px. |

Numeric values retain meaningful units in the list and editor.
The [total token count display](../../backlog/token-count-v11.md) is scheduled for V1.1.
The effect of a shared token is shown through its reference count in the editor.

Search matches readable names across all categories, including collapsed groups.
Use case-insensitive matching and show the matching rows and their groups.
No matches show **No tokens found**.
Clearing Search restores the unfiltered list and its previous category expansion.
Searching and collapsing groups change editor view state only.

## Create a token

1. Click the panel's **Create token** control or the centered empty-panel button.
2. Choose an available V1 category: Color, Spacing, or Corner radius.
3. A small editor opens beside the panel with **Name** and the appropriate **Value** controls.
4. Enter a readable name and valid value, then confirm **Create**.
5. The new token appears in its category, ready to use; no object is automatically bound.

Creating Brand color from this panel does not change existing purple objects.
The person then selects an object and chooses Brand color through its compatible Properties picker.
Alternatively, Properties can create a token from its current direct value and apply it in the same command.
That entry point preserves the value's category and unit and follows the atomic [create-and-apply contract](properties-panel.md#tokens-beside-property-values).
Cancellation or failed creation leaves the registry unchanged.
A completed panel creation is one command and one Undo step.

If an agent omitted tokens from a foundation, the person can use either creation path or ask the agent to create reusable tokens and connect the relevant supported properties while preserving appearance.
The agent reads current applied state through `get_context` or `get_source` before using the shared command engine.
This workflow adds no separate feedback loop or MCP tool decision.

## Token editor

Clicking a row opens its editor beside the left panel while retaining the canvas and Properties.
The editor identifies the token's name, category, current value, and reference count before a value change.
V1 edits the default value for an editable category.
Existing Dark overrides are preserved; a default-value change affects Dark designs only where they use that default.
Existing Typography values remain inspectable without exposing their deferred value editors.

### Color controls

The Color editor provides **Name**, a color picker with a large preview, a typeable or pasteable **Color value**, and **Opacity**.
New colors start at 100% opacity unless creation from an existing value supplies another opacity.
Color and opacity represent one saved color value.
Changing either updates linked uses of that token value.
For example, Brand color at 50% opacity supplies the same translucent color to each linked use.
An object's own Opacity remains separate and affects the whole object, including its content.
Token color editing does not change that object-level control.
Exact accepted color formats and picker implementation remain open in the [token implementation decisions](tokens-and-modes.md#open-implementation-decisions).

### Spacing and corner-radius controls

The editor shows a numeric Value control with its unit visible.
New Spacing and Corner radius values can start with px.
Existing tokens using another supported unit, such as rem, keep that unit.
Creation from a Properties value keeps its supported unit rather than converting it silently to pixels.
Validation follows the token category and the supported properties receiving it.
Unsupported expressions retain their authored values or source instead of receiving guessed numeric replacements.

## Live editing and recovery

The editor has no Apply button for changes to an existing token.
Valid typing and picker adjustments preview on linked objects using the affected token value immediately.
Enter or leaving the field finishes the edit; Enter is optional.
A continuous color-picker or numeric gesture commits once as one Undo step.
Temporary previews create no document revision or intermediate autosave.

Escape cancels an unfinished adjustment and restores its previous appearance.
Closing the editor resolves or cancels the active adjustment before dismissing it.
Opening another token never applies an unfinished value to the new token.
Invalid input stays visible with a short inline explanation while the last valid appearance remains.
Failed validation or rendering preserves committed definitions, references, source, and history.
An outdated target or revision must not silently overwrite newer state.
The completed edit uses the same [command engine](../architecture/command-engine-and-history.md) as other design changes.
Undo restores the previous token value and the linked appearance; Redo reapplies it when the history branch is valid.

## Rename and delete

Editing Name changes the readable label only.
The token's stable identity, CSS variable, values, and connections remain intact.
Properties updates its displayed token name after commit.
Enter or leaving the field finishes a valid rename, and Escape cancels the unfinished edit.
One Undo restores the previous name.
Exact name-validation and duplicate-label rules remain implementation decisions rather than new restrictions.

Delete is available in the token editor where the operation is supported.
An unused token can be deleted and restored with one ordinary Undo step.
If a supported reference remains, keep the token and show **This token is still in use. Replace or unlink it before deleting.** beside the action.
The shared command checks the whole project's supported references, including hidden objects and recognized component source, rather than just visible rows.
The displayed count does not replace that authoritative check.
Unlinking or replacing a reference happens in Properties and does not delete the definition.
The precise accounting for shared source used by several instances remains an [implementation question](tokens-and-modes.md#open-implementation-decisions).
This panel does not add the original ORC's token Duplicate action.

## Saved commands and editor state

| Action | Persistence and Undo |
| --- | --- |
| Panel creation | Saves one unused definition as one completed command. |
| Properties create-and-apply | Saves the definition and intended binding together as one command. |
| Value edit or rename | Saves the completed adjustment as one Undo step. |
| Delete an unused token | Saves removal; Undo restores the token. |
| Switch tabs, Search, expand a category, or inspect a token | Editor state with no revision or Undo entry. |
| Cancel or reject an edit | Preserves committed state and adds no history entry. |

Definitions and explicit references survive save/reopen through the canonical document and managed source.
Unfinished field values remain session state until their completed command succeeds.
Controls have visible labels and keyboard access.
Typing and field shortcuts stay with the editor rather than leaking into canvas movement or deletion.
The application theme, frame design mode, and future token editing view retain their separate responsibilities.

## Implementation verification

These are acceptance scenarios for the actual editor, not results of the documentation checks.

- Create a token in an empty panel and confirm existing direct values remain unchanged until linked.
- Create from Properties and verify one atomic definition-and-binding command, including cancellation and stale-target rejection.
- Search across collapsed categories, clear the query, and retain canvas selection and Properties throughout.
- Verify Search sits directly below Layers/Tokens, without a duplicate panel heading or total token count; individual token editors retain their reference counts.
- Preview color, opacity, spacing, and radius changes across linked uses; verify cancellation and one Undo per completed adjustment.
- Rename a token and verify its CSS identifier and references survive, including save/reopen.
- Delete an unused token, reject deletion when hidden or recognized source references remain, and verify Undo.
- Edit a default value while preserving Dark overrides and existing Typography values.
- Open an imported component and confirm its required styles survive without automatic panel token registration.

## Related contracts and reference limits

- [Tokens and modes](tokens-and-modes.md) owns the saved definition and reference behavior.
- [Properties](properties-panel.md#tokens-beside-property-values) owns controls at each selected value.
- [Layers panel](layers-panel.md) owns object hierarchy and selection.
- [Workspace and canvas](workspace-and-canvas.md#editor-layout) owns placement and shared panel layout.
- [Paper Theme reference](../../../orc/luna/paper_screenshot/paper-theme-panel-reference.md#panel-structure) supports the grouped registry and adjacent color/radius editors.
- [Original ORC Tokens specification](../../../orc/doc_v1/interface/tokens-panel.md) informs creation, editing, naming, and safe deletion.

Paper's reference did not test edits, propagation, search behavior, rename, or deletion.
Its observed literal styles were not automatically connected to its token definitions.
These ORC-web workflows are accepted product decisions and still require implementation evidence.
Paper's larger category inventory, plus menu, and original ORC's one-mode limitation do not change the ORC-web release decisions.

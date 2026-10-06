# Light and Dark token editing for V1.1

## Status

The Tokens panel's Light/Dark value-editing controls are scheduled for V1.1 by the accepted scope discussion.
This is a narrow deferral of the human editing controls.
The saved token model, frame design modes, and preservation of existing mode values remain supported in V1.
The [token release scope](../doc_v1/interface/tokens-and-modes.md#release-scope) and [Tokens panel](../doc_v1/interface/tokens-panel.md) record this same boundary.

## V1 behavior to retain

The Tokens panel lets a person create and edit Color, Spacing, and Corner radius defaults through the ordinary token workflow.
The default value is used for Light and for Dark when no Dark override exists.
Existing Dark overrides survive default-value edits, saving, reopening, and supported exports.
Rendering resolves the saved values using the applicable workspace or frame design mode.
Frame Light/Dark choices remain separate from the deferred token-value editing controls.

## Controls scheduled for V1.1

| Control or state | Behavior |
| --- | --- |
| Light editing view | Edit the token's default Light value. |
| Dark editing view without an override | Show the default value with **Uses Light value**; editing creates a Dark override. |
| Dark editing view with an override | Edit the separate Dark value. |
| Use Light value | Remove the Dark override so Dark resolves to the default again. |

Switching the editing view chooses which token value to edit and does not change a frame's design mode.
A valid adjustment previews on linked objects using the affected mode value.
Changing the default also affects Dark objects that have no override.
Each completed value edit, override creation, or override removal is one command and one Undo step.
Switching views is editor state and creates no document revision or Undo entry.
Cancellation, invalid input, or failed validation preserves the committed token values and their bindings.
Undo restores the previous default or override, including whether an override existed.

## Later verification

Verify default edits with and without an existing Dark override, override creation and removal, cancellation, Undo/Redo, and save/reopen.
Verify independent Light and Dark frames render and export the appropriate values.
Confirm that changing the token editing view preserves canvas selection, Properties, and frame modes.

## Related contracts

- [Tokens and modes](../doc_v1/interface/tokens-and-modes.md) owns token definitions, compatible references, and mode inheritance.
- [Properties](../doc_v1/interface/properties-panel.md#tokens-beside-property-values) owns applying, replacing, unlinking, and creating a token from a selected value.
- [Export](../doc_v1/import-export/export.md#design-modes-and-tokens) owns mode-aware output.
- [Command engine and history](../doc_v1/architecture/command-engine-and-history.md) owns completed edits and Undo.

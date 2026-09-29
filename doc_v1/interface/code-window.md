# Code window

## Status

Accepted V1 product behavior.

## Purpose

The Code window lets people inspect and edit code connected to their design.
Code is useful when visual controls are not enough, but unfinished typing must never damage the live design.

## Selected object or frame code

Selecting an ordinary object or frame can show its HTML or JSX and relevant CSS.
People edit a draft, review any validation result, and choose Apply.
Apply updates the selected design scope as one completed command and one Undo step.
Invalid or unfinished code remains in the current Code window session with an explanation and does not alter the canonical document.
Copy offers `Copy as Tailwind` for the selected React scope.
React file export offers CSS or Tailwind styling.
Tailwind output generates `className` utilities from the selected design's canonical styles and tokens.

## Failed Apply

If Apply cannot parse, validate, compile, or render the proposed code, ORC-web identifies the affected object, frame, or component and shows the reason in the Code window.
The applied design remains on the canvas because the failed proposal never becomes a document revision.
The unsuccessful code remains available in the current editing session for correction.

The person can correct the draft in Code or ask an agent to fix the affected applied component.
An agent reads the current applied source and diagnostic through `get_context` or `get_source`, then submits its correction through the existing source mutation.
The agent never receives an unfinished private draft as though it were applied source.

Code Apply keeps stable identities where the editor can prove the selected structure still maps to the existing design.
New elements receive new IDs.
An ambiguous replacement must explain the identity change before it applies.

## Shared component source

An imported component instance shows its current use and declared property values.
Editing its implementation is a separate action named Edit component source.
That source belongs to a shared component record rather than one selected instance.

Applying valid shared source updates every instance that refers to that component record.
One Undo restores the prior source and all affected instances.
The Apply flow validates declared properties and slots so an update cannot silently discard an existing instance value.

Selecting a source-backed component layer identifies the source binding that its visual controls use.
A visual edit changes that owned source value through the same command engine as Code Apply.
Code remains the path for valid source changes that do not have a safe visual binding.
See [Editable React components](react-components.md), [Motion](motion.md), and [React source bindings](../architecture/react-source-bindings.md).

## Unapplied code

Unapplied code stays in the current editing session until the person chooses Apply, changes selection, or discards it.
It never compiles, executes, imports, applies, or changes the saved design until Apply succeeds.
Generated exports and MCP source reads use applied design state and exclude unapplied code.

If a person closes or reloads the editor with unapplied code, ORC-web asks **Discard unapplied changes?**.
Choosing Discard closes the editing session and reopening shows the last applied source.

## Runtime component errors

A component can apply successfully and fail later during Preview interaction or a later render.
For example, opening a menu can reach code that was not exercised during Apply.

ORC-web keeps the rest of the workspace, Layers, Properties, and Code window usable.
The affected component shows an error placeholder in its own bounds with the component name and a clear error summary.
It remains selectable through that placeholder and through Layers.

The placeholder offers **Retry** and **Open code**.
Retry attempts to render the current committed component again and does not change source or repair the error.
Open code opens the current applied source for that component.
The person can fix the source directly or ask an agent to fix it.

A runtime error does not silently undo the committed source or later design edits.
Undo remains available when the person chooses to reverse a relevant completed command.

## Scope for V1

V1 supports selected-object or frame source editing, shared imported-component source editing, and supported source-backed component layers.
It does not promise that every React pattern maps to individual visual Layers.
Component manifests and recognized component definitions remain the reliable source for visual component properties.

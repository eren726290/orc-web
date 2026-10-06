# Imported component and theme tokens for V1.1

## Status

Automatic recognition and exposure of imported component or theme tokens in the Tokens panel are scheduled for V1.1.
This entry records the accepted release decision from the token-workflow discussion.
It defers panel integration rather than the styles and theme inputs required by a supported component import.

## V1 behavior to retain

Supported imports retain the authored styles, CSS variables, theme inputs, assets, and dependencies required for their appearance.
The render pipeline continues to compile and use the accepted inputs under the [Tailwind component contract](../doc_v1/import-export/tailwind-components.md).
Saving and reopening preserve those inputs, and supported code exports include the styling needed to reproduce the component.
Imported styling must remain within its intended design scope.

V1 does not automatically register imported CSS variables or theme values as editable document tokens merely because a component uses them.
Supported source editing remains available for imported values whose ownership can be identified.
Existing document tokens created by a person or agent remain available through the normal Tokens and Properties workflows.
Literal values remain direct values until explicitly linked; matching names or values alone do not create a connection.

## Work scheduled for V1.1

- Recognize a defined subset of imported token definitions with known types, value owners, and supported references.
- Expose those tokens in the Tokens panel without maintaining an independently editable copy of their source values.
- Preserve their authored values, units, CSS identifiers, and supported connections.
- Distinguish imported origins when otherwise identical names would be confusing.
- Keep definitions from different origins separate unless their sharing is explicit.
- Validate changes through the shared command engine and affected component rendering before committing.
- Keep unsupported definitions, expressions, and references in their authored source with a clear editing boundary.

For example, a project Brand color of purple and an imported component's Brand color of blue must preserve their separate meanings and appearances.
Import must not merge them by name or by a coincidentally matching value.
The exact source-to-token representation, scope handling, and supported recognition patterns require evaluation before implementation promises broader compatibility.

## Later verification

Verify supported import, token exposure, source ownership, value propagation, and correct reference counts.
Verify same-name definitions from different origins remain distinct and do not restyle unrelated components or frames.
Verify invalid edits preserve the committed source, token definitions, and visible design.
Verify completed edits support Undo/Redo, save/reopen, and supported exports.
Verify unsupported expressions and literal styling survive without guessed token links.

## Related contracts

- [Tokens and modes](../doc_v1/interface/tokens-and-modes.md) owns explicit document tokens and compatible references.
- [Tokens panel](../doc_v1/interface/tokens-panel.md) owns the registry and human editing workflow.
- [Component import](../doc_v1/import-export/component-import.md) owns inspection, preparation, and source preservation.
- [Tailwind components](../doc_v1/import-export/tailwind-components.md) owns retained styles, theme inputs, compilation, and styling scope.
- [React source bindings](../doc_v1/architecture/react-source-bindings.md) owns reliable edit targets and source authority.
- [Export](../doc_v1/import-export/export.md) owns supported output.

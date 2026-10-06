# Typography token editors for V1.1

## Status

Dedicated human controls for creating and editing Typography token values are scheduled for V1.1.
This aligns their release timing with the deferred Text and Fonts controls in the [Properties V1.1 schedule](properties-panel-v1x.md#v11-properties-controls).
Keep existing typography tokens visible in V1 and retain their saved values and connections through supported rendering and export.

## Individual token values

| Value type | Example |
| --- | --- |
| Font family | Body font: Inter. |
| Font size | Heading size: 32 px. |
| Font weight | Heading weight: 600. |
| Line height | Body line height: 1.4. |
| Letter spacing | Heading spacing: -0.02 em. |

Each value has its own readable name and identity.
Changing Heading size must not also change the font family or weight.
The panel can group these individual values under Typography without combining them into one mandatory style object.
Exact persisted subtypes and compatible value grammar remain implementation decisions.

## Later implementation

Use the existing Name, type-appropriate Value, compatible reference, live-preview, cancellation, and one-Undo-per-adjustment contracts.
Preserve units and determine the accepted owner before changing source-backed typography.
Font-family choices follow the [font-management plan](../doc_v1/interface/font-management.md), including availability and portable assets.
Token creation itself must not imply that a font file was imported or may be redistributed.
Properties applies each token only where the corresponding supported Text or component control accepts its type.
Keep the existing [Text](../doc_v1/interface/text-editing.md) and Fonts research intact rather than redesigning it because the controls were deferred.

Verify creation, application, shared propagation, invalid values, cancellation, Undo/Redo, save/reopen, and export preservation for each value type.
Verify the selected text reflows according to its existing sizing rules when a typography value changes.
Aliases, composite styles, and broader token management retain their separate later-version scope.

## Related contracts

- [Tokens panel](../doc_v1/interface/tokens-panel.md) owns registry presentation and editing.
- [Tokens and modes](../doc_v1/interface/tokens-and-modes.md) owns identity, explicit references, units, and release scope.
- [Properties](../doc_v1/interface/properties-panel.md#tokens-beside-property-values) owns compatible value controls.

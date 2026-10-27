# Own Pen SVG transforms

This is the bounded SVG prerequisite authorized for the Pen workflow.
General imported multicolor artwork and arbitrary source-owned transforms remain outside this implementation slice.

| Trigger or state | Observable behavior |
| --- | --- |
| Select one unlocked own Pen SVG with editable Fixed axes | Show proportional resize and rotation handles alongside essential anchor handles. |
| Start proportional resize | Freeze the native SVG mapping and sizing ownership; retain the transformed top-left viewport corner as the pivot. |
| Move resize handle | Change both Fixed dimensions proportionally and compensate supported Free placement for the rotation origin. |
| Parent-controlled placement moves the required pivot | Refuse the candidate and explain that this layout cannot retain the resize pivot. |
| Start rotation | Require an owned ordinary 2D rotation and freeze the native transform origin. |
| Move rotation handle | Rotate around that origin using the frozen inverse mapping. |
| Scale or Rotation field | Permit typed values and existing numeric-field dragging without changing path geometry, identities or rules. |
| Pointer release | Commit the last complete accepted candidate as one ordinary command. |
| Exact return to the start | Create no command. |
| Escape or Undo during a gesture | Cancel the local gesture and retain the applied document; consume the owned key. |
| Lost capture, window blur, cancellation, changed project/revision/tool/selection/zoom, or Preview entry | Cancel the complete preview and prevent a later release from publishing it. |
| Unsupported source transform or sizing | Keep the current object and explain the prerequisite rather than replacing its source or converting sizing. |

Controls use the existing command, native preview, Fill preparation, history and Code-draft safeguard.
No solver call is needed because these operations retain local path geometry.
Their acceptance requires real pointer, property, cancellation, history and mapping checks in development and built Chrome.

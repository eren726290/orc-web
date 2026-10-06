# Layers dragging and reordering for V1.1

## Status

Scheduled for V1.1 by user decision.

## Scope

Add supported row dragging to the Layers panel.
Dragging within the same parent reorders an object; dropping into another frame changes its parent.
Show the destination and insertion position before the drop.
Canvas and Layers update together through one validated command and one Undo step.
Locked or unsupported moves preserve the current design.

Use the existing layout, constraint, source-ownership, and identity rules rather than creating a separate Layers mutation path.
React moves require reliable supported bindings and must respect shared editing scope.
The final interaction and supported source shapes need implementation verification.

## V1 behavior

V1 Layers retains selection, hierarchy, renaming, locking, and expanding or collapsing branches.
Saved visibility controls have their own [V1.1 schedule](layer-visibility-v11.md).
People use [canvas movement](../doc_v1/interface/workspace-and-canvas.md#canvas-tools) and [Flex keyboard reordering](../doc_v1/interface/workspace-and-canvas.md#keyboard-movement) for the supported V1 rearrangement workflow.

## Related contracts

- [Layers panel](../doc_v1/interface/layers-panel.md).
- [React source bindings](../doc_v1/architecture/react-source-bindings.md).

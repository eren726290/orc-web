# Canvas interaction

Canvas selection, text interaction, pan/zoom, and keyboard/pointer movement belong here.
Native design projection lives in ../rendering/.

Pointer movement freezes starting CSS, previews locally, and submits through shared commands only on release.
Current-parent Flex drops preview sibling order without publishing document state.
DropIndicator renders temporary receiving-frame outlines and Flex insertion lines outside the design tree.
Pointer placement converts ordinary Free frame/root coordinates or joins Flex flow through the existing atomic commands.
Native coordinate snapshots are temporary gesture state; authored CSS and canonical parent IDs remain saved authority.
Remaining gesture and resize work is tracked in [the gesture record](../../../backlog/canvas-pointer-gestures.md).

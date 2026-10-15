# Canvas interaction

Canvas selection, text interaction, pan/zoom, and keyboard/pointer movement belong here.
Native design projection lives in ../rendering/.

Pointer movement freezes starting CSS, previews locally, and submits through shared commands only on release.
Current-parent Flex drops preview sibling order without publishing document state.
DropIndicator renders temporary receiving-frame outlines and Flex insertion lines outside the design tree.
Pointer placement converts ordinary Free frame/root coordinates or joins Flex flow through the existing atomic commands.
Its reusable Free/flow conversion helpers live in ../layout/ alongside frame layout switching.
Native coordinate snapshots are temporary gesture state; authored CSS and canonical parent IDs remain saved authority.
Remaining gesture and resize work is tracked in [the gesture record](../../../backlog/canvas-pointer-gestures.md).

GapHandles shares the numeric Gap field with Properties.
gap-geometry.ts measures participating native child boxes and temporary wrapped-row bounds without saving geometry.
The active handle remains mounted across row reflow until its input finishes the pointer release.
Gap handle visuals and their 44px input targets live in gap-handles.css.

`overlay-geometry.ts` shares invalidation for selection outlines, Gap handles and drop indicators.
It observes active layout relationships, design mutations, native scroll/load events and CSS animation/transition events.
Frame refresh continues only while native animations are running or pending; inactive overlays disconnect their observers and scheduled work.
It measures temporary display geometry without writing canonical CSS or changing transformed-layout eligibility.

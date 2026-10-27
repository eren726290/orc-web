# Motion

## Status

Accepted V1 product behavior for source-authored Motion.

## Purpose

ORC-web components can use Motion to animate live React content.
Motion behavior belongs in the React component source, so the same component behaves consistently in the canvas, Preview, saved project, MCP workflow, and React export.

V1 does not add a separate timeline editor.

## How motion is authored

A developer selects a component and chooses **Edit component source** in the [Code window](code-window.md).
They write or change the Motion behavior in that React source, then choose Apply.

An agent changes the same applied source through the accepted [update_component_source](../mcp/tools/update_component_source.md) MCP tool.
Motion can arrive with JSX/TSX, Tailwind, Base UI-flavored shadcn, and SVG in one inspected composition through [import_component](../mcp/tools/import_component.md).
The agent does not wait for a person to press Apply.
Code Apply and the MCP mutation both use the shared command engine, source validation, revision checks, and Undo history.

For example, a component source can use Motion's React API to express an entrance animation, layout transition, hover effect, or open-state animation.
The exact source remains visible and editable in Code.

## Edit and Preview behavior

Automatic Motion animations keep running in Edit mode so a person can see the design's real movement.
Edit mode captures pointer and keyboard actions for selection and editing instead of running interactive component controls.
Selection outlines and handles follow the rendered position of a moving layer, including when the workspace is panned or zoomed.

Edit offers an optional **Still view** control when movement makes selection or adjustment difficult.
Still view keeps supported component content live and editable while showing a defined stable appearance instead of advancing its animation.
For example, a heading that fades in appears fully visible, and a moving card appears at its intended editing position.
Turning Still view on or off is an editor viewing choice and does not change the saved component behavior or add an Undo step.
Still view does not turn the component into an image.

Preview hands pointer and keyboard interaction to the component.
Hover, press, focus, drag, menu, dialog, and other supported interactions can then behave normally.
Leaving Preview returns to Edit without changing the saved design just because a preview interaction occurred.
Preview runs the component's normal animations even when Still view is enabled for Edit.
An animation may restart when entering Preview or after applying a source change.
The [selected-frame workflow and session reset](workspace-and-canvas.md#selected-frame-workflow) apply to animated components as well.
Preview animation progress is temporary and does not become a saved design value on exit.

<!-- codex-pc 2026-10-24: Accepted frame-specific Still view clarification. -->

## Frame-specific Still view

Still view starts off for every top-level frame.
Each top-level frame owns one snowflake icon button in its [frame strip](workspace-and-canvas.md#top-level-frame-label-and-still-view-control).
Enabling it applies the defined stable editable appearance to supported animated content throughout that frame, including nested components and nested frames.
Other top-level frames retain their own independent settings.
Selection changes do not transfer or reset a frame's setting.

Still view resolves the supported stable editing state rather than pausing at whichever animation instant was visible.
Entrance animations leave their content visible, and moving content uses its supported stable editing appearance.
The content remains live and editable through its supported owners.
Arbitrary React execution, unsupported animation loops, or unavailable stable states must produce an honest limitation rather than a claim that stabilization succeeded.
Do not infer a stable state by copying measured animated geometry into saved source.

Keep these settings in the existing project's editor view state, keyed by stable frame identity, outside canonical design data.
Toggling changes no component source, document revision, Undo history, or autosave status.
Project-tab switches and returning from Preview preserve the settings.
Preview always plays normal animations; exports independently resolve their explicit capture state.
No workspace-wide toggle or toolbar is introduced for loose animated objects; their scope remains [open](../../backlog/frame-controls.md#loose-animated-objects).

The production runtime must support frame-scoped stable-state resolution and report unsupported descendants before this control can claim success.
An icon or stored setting alone does not implement Still view.
See the [handoff](../../backlog/frame-controls.md#still-view-production-dependency) for the current dependency and required verification.

## Editing while motion is visible

Canvas edits change supported saved design values through their source bindings, instance properties, or local data.
An animated value at an intermediate moment is only a rendered state and does not become the saved value because the person selects or edits the layer.
For example, resizing a pulsing button changes its supported underlying size, not the size at the instant it was clicked.
To change the pulse, the person edits an exposed animation setting or the component source.

Still view can use Motion's animation-skipping support and author-supplied stable states for supported components.
Motion playback controls can pause and resume animations that expose those controls, but they do not provide a universal pause for arbitrary imported React code.
Custom animation loops need an author-supplied stable editing state if ORC-web cannot stop them reliably.
When a stable state is unavailable, the editor must say so and keep source editing available rather than claim that the component is frozen.

## Properties support

Properties exposes an animation value only when the component contract declares it or a supported source binding owns it.
For example, a component may expose a transition duration, a visible state, a variant, or a spacing value used by a Motion layout transition.

Properties never invents a Motion control by inspecting arbitrary animation code.
When an edit has no safe visual binding, it offers **Edit component source**.

Motion animation values follow the same edit ownership rules as other component values.
A shared source change affects every instance.
An instance prop or local collection value affects only its stated scope.

## Accessibility

The product and exported components must respect a person's reduced-motion preference.
Component source can use Motion's reduced-motion support or an equivalent supported source pattern.
The implementation must verify that the final behavior honors this preference in the supported Fedora and Windows browsers.

Reduced motion changes animation behavior for people who request it.
It does not define the still state captured by an image or PDF export.

## Image and PDF capture

Animation is time dependent, while an image or PDF needs one stable result.
Before capture, the person chooses an explicit named component state such as Default, Open, Loading, or Success.

The capture renderer resolves that state, disables time progression, and captures the result.
It must not capture whichever animation frame happened to be visible when the export began.
The selected state is capture input and does not overwrite the component's normal saved interaction behavior.
Still view and image or PDF capture use the same defined stable appearances when the chosen state matches.
Capture resolves its explicit named state independently of whether Still view is on in the editor.

## Component-library boundary

Motion can work with supported Base UI and Base UI-flavored shadcn components when their accepted source shape maps values safely.
V1 excludes Radix import paths from editable-component recognition.
The import boundary is defined in [Component import](../import-export/component-import.md).

## V1 boundary

V1 includes source-authored Motion, live animation, optional Still view for supported components, normal Preview interaction, declared animation properties, reduced-motion support, and deterministic still capture.
It excludes a visual timeline, automatic conversion of arbitrary Motion source into controls, universal freezing of custom animation logic, exact animation continuation after edits, and arbitrary runtime-DOM animation editing.

## References

- [Motion for React](https://motion.dev/docs/react)
- [Motion accessibility](https://motion.dev/docs/react-accessibility)
- [Motion and Base UI](https://motion.dev/docs/base-ui)
- [Motion configuration](https://motion.dev/docs/react-motion-config)
- [Motion playback controls](https://motion.dev/docs/animate#controls)
- [Motion configuration source](https://github.com/motiondivision/motion/blob/main/packages/framer-motion/src/context/MotionConfigContext.tsx)

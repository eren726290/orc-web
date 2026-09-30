# Editable React components

## Status

Accepted V1 product behavior.

## Purpose

ORC-web treats a supported React component as a live component with editable Layers inside it.
People can use a component as one object when moving it around the workspace, then select its supported contents to refine the design.

For example, a dashboard Hero can expose its heading, image, and button.
The Hero remains a real React component while those supported contents remain visually editable.

## Selecting a component

The Layers panel shows a component root at its workspace position.
Expanding the root shows source-backed layers that the component contract supports.

```text
Hero
├── Heading
├── Product image
└── Buy button
```

Selecting **Hero** changes its outer position, size, and eligible layout rules.
Selecting **Heading** changes its supported text and typography.
Selecting **Product image** can replace the image while preserving its supported box and fitting rules.
Selecting **Buy button** changes its supported label, variant, and style values.

The canvas and Layers always select the same source-backed layer.
ORC-web never turns every browser DOM element into a selectable layer.

## Edit and Preview

Edit is the default mode.
In Edit mode, a click selects the component layer under the pointer so a person can change its design.

Preview gives the same live component normal pointer and keyboard interaction.
Buttons can run their actions, inputs can accept temporary text, and menus can open.
Preview interactions do not overwrite the saved default design values.

One Preview button enters Preview.
A visible Exit preview button returns to Edit while preserving the person's selection and canvas position.
The broader canvas behavior is defined in [Workspace and canvas](workspace-and-canvas.md).

If a component fails while it renders or handles a Preview interaction, ORC-web contains the failure to that component and keeps the surrounding design usable.
The error placeholder remains selectable so the person can open its applied source or ask an agent to fix it.
[Code window](code-window.md) defines the error, Retry, unapplied-code, and repair behavior.

## Properties

Properties starts with the values that make the selected layer useful to edit.
It uses direct controls such as text, number, toggle, choice, color, asset, spacing, and supported layout values.

Known Base UI and Base UI-flavored shadcn components can provide human controls from their recognized import paths and supported API or render-prop shapes.
Base UI itself is unstyled, so it does not require Tailwind in order to be a supported component.
A Base UI-flavored shadcn component can additionally provide its Tailwind classes and theme values to the supported Tailwind workflow.

V1 excludes Radix import paths from editable-component recognition.
An unsupported component remains a source-edit candidate or a static import candidate instead of receiving guessed controls.

## Where a visual edit is saved

Before changing a value, Properties states who owns it.

| The selected value comes from | The edit changes |
| --- | --- |
| Shared component JSX | Every instance of that component |
| A prop on this component use | This instance only |
| A declared slot | The content in this slot |
| A local collection item | This item only |
| A supported token | The shown token scope |
| A computed or external value | Nothing automatically; use Code source |

For shared values, Properties says “Every [component name] instance.”
For instance values, it says “This instance only.”
The editor never hides this distinction.

Eligibility belongs to each value, not to the entire component.
If a heading's text comes from unsupported logic, Properties shows Edit source for that text while retaining any supported typography controls.
Other supported Layers remain selectable and editable.

When a supported shared value is changed in Properties, ORC asks one clear question: **Only this** or **All copies**.
Only this creates an independent component record for the selected instance and applies the requested change.
All copies changes the shared component source for every instance.
The choice, any independent copy, and the value change form one Undo step.

The person never needs to find a separate independent-copy action before changing a value.

Only this copies the local definitions needed to make the selected value independent.
It does not duplicate the whole project, package primitives, or shared theme.
If that boundary cannot be copied safely, the editor explains why Only this is unavailable and keeps supported All copies or source editing available.

The source-binding contract that makes these edits durable is defined in [React source bindings](../architecture/react-source-bindings.md).

## Hidden component content

Some components keep useful content hidden until they open, such as a menu, popover, dialog, tooltip, or select list.
In Edit mode, Properties offers **Show content** for a supported hidden region.

Show content reveals that region only for visual selection and editing.
It does not change the component's saved default open state.
Preview and exported code keep the component's normal behavior.

A dropdown, tooltip, or popover follows its trigger when the component moves or the workspace pans and zooms.
A dialog in a top-level frame covers its owning top-level frame while the ORC-web toolbar, Layers, and Properties remain available.
A dialog from a loose workspace object covers the visible canvas area.

Image and PDF export choose an explicit named design state such as Default or Open.
They never depend on whatever transient open state happened to be visible in a person's editor.

## Local collections

An agent-built component can contain local editable sample data, such as a list of cards.
The person can edit one card's text or image, duplicate one item, delete one item, or change the shared card design.

Editing an item value changes that item only.
Changing the card's shared source changes every item.
Changing the parent layout changes the list or grid.

If the visible values come from an external service or an unsupported computed expression, Properties says **Edit source** instead of pretending to update live data.

## Agent and human workflow

An agent can build a complete page foundation through the existing MCP tools.
After that work is applied, a designer can iterate the same components through Layers, Properties, the canvas, and Code.

Before an agent makes a later change, it calls `get_context` or `get_source` to read the current applied source and revision.
It then uses the same command engine as the human interface.
The agent does not need a separate feedback loop to learn visual edits.

## V1 boundary

V1 supports components with declared or reliably recognized editable shapes.
It does not promise visual editing for every React, JSX, dynamic data, or runtime DOM pattern.
Code source editing remains available when a safe visual binding does not exist for a particular value.
The Fedora experiments validate supported ownership discovery and editing in real component compositions; the complete Properties and Layers interface is still an implementation task.
See [React source-editing validation](../architecture/react-source-editing-validation.md) for established behavior and limits.

[Component import](../import-export/component-import.md) defines inspection and import.
[Code window](code-window.md) defines unapplied code and Apply.
[Motion](motion.md) defines source-authored interactive animation.
[Layers and Properties](layers-and-properties.md) defines the shared panels.

# Tokens and modes

## Status

Accepted token behavior with human controls explicitly scheduled below.
The exact persisted schema, CSS projection, and source mapping remain implementation decisions.
[Tokens panel](tokens-panel.md) owns the human management workflow.
[Properties](properties-panel.md#tokens-beside-property-values) owns controls at the selected value.

## Release scope

| Area | V1 | V1.1 |
| --- | --- | --- |
| Default values | Create and edit Color, Spacing, and Corner radius tokens. | Retain these controls. |
| Typography | Preserve existing definitions, inspection, connections, rendering, and export. | Create and edit individual font-family, font-size, font-weight, line-height, and letter-spacing tokens. |
| Light and Dark | Resolve saved modes and preserve existing Dark overrides; edit defaults for V1's editable categories. | Edit Light/Dark values, create Dark overrides, and restore Use Light value. |
| Imported themes | Retain authored CSS variables, styles, and required theme inputs without automatic panel registration. | Recognize and expose supported imported tokens with known source ownership. |

The dedicated [Typography](../../backlog/typography-tokens-v11.md), [Light/Dark](../../backlog/token-modes-v11.md), and [imported-token](../../backlog/imported-token-management-v11.md) backlogs retain these V1.1 workflows.
Deferring a human editor does not discard existing values or their supported rendering, save/reopen, or export behavior.
The preserved [Text editing](text-editing.md) plan does not bring its deferred typography controls into V1 through a token picker.
Aliases and broader management remain in the [Properties V1.x backlog](../../backlog/properties-panel-v1x.md).

## One token system

Tokens are named reusable design values shared by ordinary HTML/CSS and supported React content.
The document registry holds explicit definitions; Properties holds compatible references; rendering and export project those same values into CSS.
Imported theme CSS variables remain in their authored source in V1 rather than becoming a second editable token registry.

| Responsibility | Example | Meaning |
| --- | --- | --- |
| Readable name | Brand color | Human label in Tokens and Properties. |
| Stable ID | A generated token identity | Target of saved references and commands. |
| CSS variable | A generated identifier such as `--color-brand` | CSS representation used by supported rendering and export. |
| Value | Purple | Default or applicable mode value with its accepted type and units. |

The stable ID, readable name, and CSS variable have separate responsibilities.
Renaming changes only the readable name and preserves identity, CSS naming, values, and references.
People enter readable names; ORC-web generates valid CSS identifiers rather than requiring them to enter CSS syntax.
Exact generation, collision handling, namespaces, and scope remain open.
Do not keep an independently editable duplicate of a definition in generated CSS.

## Explicit references and shared effects

Properties lets a person enter a direct value or choose a compatible token.
A literal that matches a token's name or value is not automatically linked.
Creating a definition in Tokens does not bind objects or migrate matching literals.
An agent foundation without tokens can still render from direct values.
The person can create and link tokens explicitly or ask the agent to make those supported connections while preserving appearance.

Changing a token value updates every linked use that resolves to that affected default or mode value.
Frames can intentionally share these references without becoming linked design variants.
The panel shows the reference count before editing; the command validates the actual references.
Replacing a reference changes its chosen token, not either definition.

A direct value changes only the selected object or frame when that property is locally owned.
For React, instance properties and shared source keep their established ownership and Only this / All copies rules.
A token-definition edit remains shared even when individual component source is independent.
The owner must be a supported canonical value or source binding, not a temporary browser DOM value.
An imported component accepts a token through a declared compatible property or another validated supported source owner.
See [React source bindings](../architecture/react-source-bindings.md#choose-edit-scope) for source scope.

## Types, values, and units

V1's editable categories are Color, Spacing, and Corner radius.
Both the token category and the receiving property's accepted value type must match.
A shared unit alone does not make a radius token interchangeable with a spacing token.
The initial control mapping belongs to [Properties](properties-panel.md#tokens-beside-property-values).

Numeric tokens retain their supported units through editing, references, saving, CSS projection, and export.
New numeric values can default to px; existing supported rem values are not silently converted to pixels.
Creation from a direct value preserves its supported unit.
Color and its alpha form one token value; object-level Opacity remains separate.
Unsupported expressions retain their authored values or source rather than receiving guessed replacements.

Typography's individual font-family, font-size, font-weight, line-height, and letter-spacing values have separate identities and compatible receiving controls.
Their creation and value editors are scheduled for V1.1 rather than requiring one composite typography object.

## Tokens in Properties

Each compatible property has a token picker filtered to the token types it accepts.
A linked property shows the token's readable name and its resolved value, including units where applicable.
Choosing a different token changes the selected reference rather than either token definition.

**Unlink token** replaces that property's reference with its currently resolved direct value, preserving its appearance.
It does not delete the token or unlink other objects.
For React values, the stated source ownership and Only this / All copies rules still apply; unlinking must not silently rewrite a shared definition as an instance-only edit.
If the value cannot be resolved or written safely, keep the reference and explain why beside the control.
Undo restores the previous binding.

When no compatible tokens exist, show a category-specific message such as **No color tokens yet** and a **Create token** action.
Create token starts with the category and current valid direct value already filled in, then asks for a readable name.
Creation and application to the initiating property form one completed command and one Undo step.
Cancellation, validation failure, or a stale target must not create an orphan token or apply it to another selection.
Opening the picker preserves selection and Properties visibility.
The picker and token actions have keyboard access and labeled controls.
Create token is available only for categories with V1 creation controls.
Creating an unused definition directly in [Tokens panel](tokens-panel.md#create-a-token) remains a separate entry point.

## Light and Dark

Each token has one default value and may have a Dark override.
The default value is the Light value unless a later token mode adds a separate Light override.
When no Dark override exists, the default value applies in both modes.

| Token | Default value | Dark override |
| --- | --- | --- |
| Background | White | Dark gray |
| Text | Near-black | Near-white |
| Brand | Purple | Optional |
| Card spacing | 16px | Usually omitted |

V1's default-value editor preserves every existing Dark override.
A default change affects Dark uses only where no override exists.
Light/Dark editing views and override controls are scheduled for [V1.1](../../backlog/token-modes-v11.md#controls-scheduled-for-v11).
The future editing view chooses which value to edit without changing token identity or a frame's design mode.

## Mode inheritance

The workspace has a current design mode.
Loose workspace objects inherit that mode.
A frame inherits its parent mode unless the frame explicitly chooses Light or Dark.
Nested frames may therefore show different modes side by side.
Frame Light/Dark choices remain supported in V1 despite the token-editor deferral.
A frame remains an ordinary container; its optional Light, Dark, or Inherit choice selects existing token values.
Light uses defaults, Dark uses existing overrides with default fallback, and Inherit follows the parent or workspace.
This does not invent a palette or automatically recolor authored literal colors.
An agent can make a dark design directly without using mode switching.
The dedicated [update_node_settings contract](../mcp/tools/update_node_settings.md#light-dark-and-inherit-in-plain-terms) covers the MCP setting and a simple example.

The ORC-web application theme is independent of the design mode.
People can use a dark editor interface while designing a light frame.

## Commands, saving, and export

Completed definition creation, value editing, renaming, reference changes, and allowed deletion use the shared command engine.
Each adjustment is one Undo step, including shared changes affecting several frames.
Temporary previews, search, category expansion, and editor inspection do not create document revisions or Undo entries.
Deleting an in-use token is blocked until its supported references are replaced or unlinked.
Definitions, explicit references, units, CSS naming, and saved mode values survive save/reopen.
Unfinished field values remain session state rather than applied design data.
The agent reads fresh applied state through `get_context` or `get_source`, without a feedback loop.
[list_design_tokens](../mcp/tools/list_design_tokens.md) inspects registered definitions; [update_design_tokens](../mcp/tools/update_design_tokens.md) manages supported V1 definitions and [update_styles](../mcp/tools/update_styles.md) handles compatible object references.
Those MCP operations preserve the accepted category/default-value scope, authoritative references, and application Undo history.

Visual exports use the selected design mode.
React and HTML or CSS export include the token definitions needed to reproduce applicable mode values.
Code export preserves required imported theme inputs even when those values have no V1 panel editor.
Tailwind output follows the source-preserving and faithful fallback rules in [Tailwind components](../import-export/tailwind-components.md#code-mcp-and-export).

## Open implementation decisions

- Define the persisted token schema, Typography subtypes, accepted color/value grammar, and supported units.
- Define generated CSS naming, collisions, scope, and the durable registry-to-CSS or authored-source mapping without duplicate editable authority.
- Define reference-count accounting for shared source used by several instances, including hidden and recognized source references.
- Preserve distinct references in paired padding and corner fields; settle display and editing when different bindings resolve to equal values.
- Settle name validation, list ordering, and detailed keyboard/focus behavior.

Detailed lock handling for indirect shared updates is deferred to [later V1.x](../../backlog/shared-update-locks-v1x.md), outside the V1.1 schedule.

These questions are tracked in the [backlog](../../backlog/README.md#open-topics).
The panel's [implementation verification](tokens-panel.md#implementation-verification) still requires real editor evidence.

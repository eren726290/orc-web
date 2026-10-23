# Canonical document model

## Status

Accepted product shape with proposed field names and schema details.
The final validation schema is an implementation task.

## Design principle

One document describes the complete saved design.
Layers, Canvas, Properties, Tokens, Code Apply, imports, exports, and MCP commands read or change that one document.
The model stores design intent rather than browser DOM snapshots or transient editor state.

## Top-level shape

```ts
interface OrcWebDocument {
  schemaVersion: number
  id: string
  name: string
  revision: number
  workspaceRootIds: string[]
  nodes: Record<string, DesignNode>
  assets: Record<string, AssetRecord>
  tokens: Record<string, DesignToken>
  components: Record<string, ComponentRecord>
}
```

`workspaceRootIds` is ordered and may contain frames or ordinary loose objects.
This is the key difference from a model where every object must belong to an artboard.
An artboard is represented by a frame that has a chosen size and placement in the workspace.
A top-level frame is an independent design area with no automatic desktop, tablet, phone, or breakpoint relationship to another root frame.
Nested frames remain part of their parent design area.

## Nodes

```ts
type NodeKind = "frame" | "element" | "text" | "image" | "svg" | "component"

interface DesignNode {
  id: string
  kind: NodeKind
  name: string
  parentId: string | null
  children: string[]
  visible: boolean
  locked: boolean
  style: Record<string, string>
  attributes: Record<string, string>
  text?: string
  frame?: FrameSettings
  component?: ComponentInstance
}

interface FrameSettings {
  layout: "free" | "row" | "column"
  x: number
  y: number
  width: number
  height: number
  clipContent: boolean
  mode: "inherit" | "light" | "dark"
}
```

Every node has a generated stable ID.
Display names, browser element IDs, and source locations are not command targets.
`children` supplies the structural order used by Layers and rendering.
`parentId` mirrors the structural parent and must agree with `children`.
`name`, `visible`, and `locked` are saved per-object values; effective inherited visibility and lock state are derived from ancestor relationships.
The human controls and row presentation belong to [Layers panel](../interface/layers-panel.md).
Persisted visibility remains supported data while dedicated human hide/show and MCP visibility mutations are [scheduled for V1.1](../../backlog/layer-visibility-v11.md).
The illustrative `text?: string` field is insufficient for the accepted inline text formatting behavior.
The canonical model must preserve text content and supported formatting ranges within one Text node, as described in [Text editing](../interface/text-editing.md).
The rich-text field shape and range indexing rules remain open and must be settled before implementation.

A root node has `parentId: null` and appears exactly once in `workspaceRootIds`.
A non-root node appears exactly once in its parent’s `children` list.
The model rejects cycles, duplicate child IDs, missing nodes, and orphaned nodes.

## Frames and layout

A frame is a container with visible geometry and an optional clipping boundary.
Frames can nest inside frames.
Free layout allows direct child placement.
Row and Column lay out children in order with frame padding, gaps, and each child’s fixed, fit-content, or fill sizing behavior.
A Row can enable wrapping with one Gap value for both item and row spacing.
Save the wrapping intent and derive line membership from layout; the ordered children remain the single structural sequence.
A Flex-to-Free conversion commits the participating children's measured positions and Fixed sizes as authored placement in one command.
Undo restores their previous layout and sizing intent; existing Absolute Position children retain their rules.
Grid is not part of the initial V1 model.

The field sketch above is incomplete for the detailed [Flex layout](../interface/flex-layout.md) and [Constraints](../interface/constraints.md) proposals.
Before implementation, specify per-node sizing on each axis, parent layout settings, child participation, and constraint relationships.
Placement and size must apply to ordinary loose objects as well as frames.
The representation must record fixed edge distances and center offsets and identify each child's immediate reference frame.
Reparenting updates the parent, placement mode, sizing rules, and converted constraint relationships together.
Both-edge constraints retain their intended distances when a minimum or maximum size temporarily prevents the rendered margins from matching them.
Do not replace those saved distances with measurements of the clamped layout.
Choose one authoritative layout representation so the style map and structured layout fields cannot independently disagree.
The exact schema and CSS projection remain open and are not supplied by the illustrative `FrameSettings` block alone.

## Component records and instances

```ts
interface ComponentRecord {
  id: string
  source: ComponentSource
  entryPath: string
  exportName: string
  manifest: ComponentManifest
  sourceFingerprint: string
}

interface ComponentInstance {
  componentId: string
  props: Record<string, JsonValue>
}
```

One component record stores one shared implementation.
Many component nodes may refer to that record.
Applying a source edit changes the record and updates every instance.
An instance stores declared property values and its ordinary outer geometry.

An imported component can also expose supported authored elements as source-backed editable layers.
Each such layer has a generated stable editor ID and a binding to the source value or structure that owns it.
The binding may target a JSX literal, an instance prop, a declared slot, or one local collection item.
The binding topology is canonical design data rather than a snapshot of the browser's runtime DOM.
It does not create a second independently editable CSS or style tree.

The component manifest and recognized component definitions together declare supported properties, property types, defaults, choices, asset rules, token compatibility, optional slots, and source-backed layers.
They are the authority for Properties controls on imported components.
See [React source bindings](react-source-bindings.md) and [Editable React components](../interface/react-components.md) for the V1 editing contract.

## Tokens and modes

Tokens have stable IDs, human names, categories, and a default value.
Each token may provide a Dark override.
The token model is defined further in [Tokens and modes](../interface/tokens-and-modes.md).
Saved references target stable token identities; a generated CSS variable represents the same reference during rendering and export.
Readable names and CSS identifiers are distinct; renaming a label preserves identity, CSS naming, values, and bindings.
Supported units and existing Typography or Dark values survive even when their human editors are deferred.
Imported theme variables remain authored source in V1 rather than automatically becoming registry definitions.
The exact schema, CSS naming/scope, and durable source mapping remain open; do not add a second independently editable representation.
The renderer resolves the value using the active Light or Dark mode.
Human creation, editing, reference counts, and deletion belong to [Tokens panel](../interface/tokens-panel.md).

## What does not belong in the document

The document does not store selection, hover, expanded Layer rows, panel visibility, canvas zoom, Preview scroll positions, window size, browser history, or an Undo stack.
The selected Preview frame and its temporary input, open-state, and animation progress are also editor-session state, following the [Preview reset contract](../interface/workspace-and-canvas.md#temporary-state-and-returning-to-edit).
Canvas constraint indicators are derived editor view state and are not stored as design objects or styles.
Token search, category expansion, editor inspection, and unfinished previews are also outside canonical design data.
Unapplied Code window text is editing-session state outside the canonical design until Apply succeeds.
Local server configuration and MCP connection state are also outside the portable document.

<!-- codex-pc 2026-10-19: Approved native projection clarification.
"Grid is not part of the initial V1 model" above still describes the public layout model.
The intrinsic-column-v1 implementation projection uses native Grid internally without adding a canonical Grid layout or another saved hierarchy.
The own --orc-intrinsic-column:1 parent style declaration is the single opt-in authority; generated data-orc-layout/data-orc-flow markup and its inner Flex box derive from it.
No generated flow box has a canonical ID or Layers row.
Canonical children and parentId remain authoritative for identity and order, while explicit native helpers distinguish outer coordinates from inner flow.
The shared projector and its exact inverse preserve source round trips; unknown marked structures must refuse instead of being guessed into the model.
See ../../backlog/intrinsic-column-wrapper-proposal.md for the approved mapping and its source opt-out boundary.
-->

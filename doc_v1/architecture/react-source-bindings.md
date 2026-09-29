# React source bindings

## Status

Accepted V1 editing contract with proposed storage field names.
The final parser, AST library, and validation schema are implementation decisions.

## Purpose

ORC-web renders live React components and lets people select supported layers inside them.
That requires a durable connection between a visible layer and the React or JSX source that owns its value.

The connection is a source binding.
It makes a visual edit a source change rather than a temporary browser DOM change.
Canvas edits, Code Apply, and MCP mutations use the same command engine, validation, revision, and Undo rules.

## What a binding is

Each accepted editable component layer has a generated stable editor ID.
The editor ID resolves to a source binding recorded with the component record or instance.
It is not an HTML `id`, a CSS selector, a runtime DOM reference, or a line number in a source file.

The binding identifies the authored element or value and the scope that owns it.
The browser renderer can use the editor ID for selection, but the durable command resolves the binding before it changes source or document data.

```ts
interface SourceBinding {
  editorLayerId: string
  componentId: string
  target: "jsxLiteral" | "instanceProp" | "slot" | "collectionItem"
  sourceIdentity: string
  editableFields: string[]
}
```

This is an illustrative shape.
`sourceIdentity` must remain stable through formatting and harmless source movement without pretending that a raw character range is stable.

## Source-backed Layers

An imported component has a root Layer for placement in the workspace.
When its contract can derive safe bindings, the root expands to show source-backed child Layers.

For example:

```text
Hero
├── Heading
├── Product image
└── Buy button
```

Those rows represent supported authored React elements and values.
They do not represent every wrapper, generated element, portal, or browser runtime descendant.

The binding topology is saved canonical design data.
It is a reflection of accepted source structure and owns no separate editable style tree.
The source remains the authority for the component's implementation.

## Edit ownership

The same visible value can be owned at different scopes.
ORC-web must show the scope before a person changes it.

| Authored shape | Visual edit changes | Scope shown in Properties |
| --- | --- | --- |
| A JSX text or attribute literal inside a shared component | The shared component source | Every instance |
| A prop supplied by one component instance | That instance's prop value | This instance |
| A declared slot | The child content supplied to that slot | This slot |
| A local editable collection item | That one item record | This item |
| A supported token reference | The selected token or binding value | The stated token scope |
| A computed expression or external data result | Nothing automatically | Edit source |

Changing a JSX literal in `Hero` changes every `Hero` instance that uses the shared record.
Changing `<Hero title="Summer sale" />` changes only that instance.
Changing one item in a local card collection changes only that card.

Properties uses direct wording such as “Every Hero instance” or “This card only.”
It never presents a shared edit as though it affected one instance.

## Choose edit scope

When a person changes a supported shared source value, Properties asks whether to change **Only this** instance or **All copies**.
Only this creates a new component record from the current shared source, repoints the selected instance to it, and applies the requested value change.
All copies updates the shared component record.
The choice and value change are one explicit command with one Undo entry.

The scope choice appears where the person edits the value, so they do not need to find a separate independent-copy action.

## Accepted sources of bindings

V1 accepts bindings supplied by one of these sources:

- A component manifest that declares a supported property, slot, or collection.
- A recognized Base UI import path and supported API or render-prop shape.
- A recognized Base UI-flavored shadcn component shape.
- A static JSX shape that the importer can map without guessing.

V1 does not recognize Radix import paths as editable component contracts.
It does not derive bindings for arbitrary JSX, computed generated children, or arbitrary runtime DOM.
The importer explains whether a candidate is static-only, has a supported editable contract, or cannot be imported for V1 editing.

## Commit lifecycle

1. Import inspection or Code Apply parses the candidate source without changing the document.
2. The resolver derives or validates source bindings and checks existing instance properties, slots, and collection data.
3. The renderer prepares a candidate preview from the candidate source and generated styles.
4. A successful command commits source, bindings, document values, and one new revision together.
5. A failed parse, unsupported mapping, or render failure leaves the applied design unchanged and explains the problem.

A visual property edit follows the same lifecycle for the binding it targets.
The property control proposes a semantic value such as text, asset, color, spacing, or a supported static Tailwind utility change.
The command updates the owned source or document value, validates it, renders the committed revision, and records one Undo entry.

## Unapplied code and applied source

The Code window keeps typing as unapplied session text until the person presses Apply.
That text never changes bindings, the live canvas, generated exports, or MCP reads.
It is not written into the project bundle and reopening shows the last applied source.
Closing or reloading the editor with unapplied code asks **Discard unapplied changes?**.
After Apply succeeds, bindings are revalidated from the new source before the new revision becomes visible.

An Apply that would remove a value currently used by an instance, slot, or collection item must fail with an explanation.
It must not leave a component partially remapped.

## Agent workflow

An agent uses `get_context` or `get_source` to read the current applied revision before its next change.
It then calls an existing mutation tool with the expected revision.
The command engine reports a revision conflict if the agent's read is stale.

ORC-web does not need a separate agent-to-human feedback loop for this workflow.
An agent normally completes its foundation work, then a person iterates visually.
If an agent works again later, its fresh read supplies the applied human changes.

## Related contracts

[Editable React components](../interface/react-components.md) defines the human editing experience.
[Code window](../interface/code-window.md) defines unapplied code and source Apply.
[Motion](../interface/motion.md) defines source-authored animation.
[Tailwind components](../import-export/tailwind-components.md) defines supported Tailwind source handling.
[Command contracts](../mcp/command-contracts.md) defines IDs, revisions, atomicity, and Undo.

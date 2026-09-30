# React source bindings

## Status

Accepted V1 editing contract with proposed storage field names.
`@babel/parser` and Recast are the implementation direction for supported source edits, backed by the Fedora Chrome experiments recorded in [React source-editing validation](react-source-editing-validation.md).
The production resolver, storage format, and complete editor workflow still require implementation.

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

## Identity through edits

A supported visual command retains the selected authored element and component usage while changing their values.
Text, classes, or props must not become the sole identity of the layer being edited.
Two separate component usages remain separate editing targets even when their displayed text and literal props match.
Keyed collection records use their supported record identity rather than their current array position.

The Fedora experiments keep command-owned lineage through the parsed syntax tree and generated metadata outside authored TSX.
PR5 binds exact AST addresses to an exact source snapshot digest and transports those identities through supported commands.
These addresses identify nodes in that snapshot; they are not a general identity match after an arbitrary source replacement.
The experiment can reopen its saved metadata and distinguish the two tested initially identical component usages.

After Code Apply, the resolver must validate identities against the new source before using an old selection.
If it cannot prove continuity, it clears the uncertain selection and explains that the person needs to select again.
It never silently retargets an old handle to a similar element.
General reconciliation through formatting and harmless source movement remains an implementation requirement; the latest command-metadata experiment does not establish it.

Bindings are saved design data, while the current selected handle and Show content state are editor view state.
The experiment's saved JSON contains both for verification and does not define production `document.json`.

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

Only this must also make the requested nested source owner independent.
Copying only an outer component is insufficient when its selected styling still belongs to a shared local child definition.
The command follows the supported local definition path, copies the definitions needed for that edit, redirects the selected instance, and preserves unrelated instances.
Package primitives, theme tokens, and utility dependencies stay shared unless the requested edit explicitly changes their scope.
It allocates names without colliding with existing bindings and preserves required imports and exports.

The tested boundary is a direct local named-import path through top-level function components with a simple JSX return.
Captured module values, shadowed imports, and unsupported copying shapes must produce an explanation before any mutation.
Only this is unavailable when that independent boundary cannot be established safely.
Supported All copies edits and Code source remain available where their own validation permits them.
Arbitrary closure and module-graph copying is not a V1 promise.

## Accepted sources of bindings

V1 accepts bindings supplied by one of these sources:

- A component manifest that declares a supported property, slot, or collection.
- A recognized Base UI import path and supported API or render-prop shape.
- A recognized Base UI-flavored shadcn component shape.
- A static JSX shape that the importer can map without guessing.

V1 does not recognize Radix import paths as editable component contracts.
It does not derive bindings for arbitrary JSX, computed generated children, or arbitrary runtime DOM.
The importer explains the supported editable values and any source-only values before import.
It distinguishes a supported live component from a static-only candidate or a component with an unsupported runtime requirement.

Binding eligibility is decided per value or operation.
An unsupported computed title can require Edit source while the same layer's static typography remains visually editable.
Missing ownership for one internal value does not make every supported sibling or the whole component an indivisible object.
Recognition follows the selected component's required local wrappers and dependency paths; unrelated packages elsewhere in the project do not determine its eligibility.

## Commit lifecycle

1. Import inspection or Code Apply parses the candidate source without changing the document.
2. The resolver derives or validates source bindings and checks existing instance properties, slots, and collection data.
3. The renderer prepares a candidate preview from the candidate source and generated styles.
4. A successful command commits source, bindings, document values, and one new revision together.
5. A parse failure, failed required binding validation, or candidate render failure leaves the applied design unchanged and explains the problem.

A visual property edit follows the same lifecycle for the binding it targets.
The property control proposes a semantic value such as text, asset, color, spacing, or a supported static Tailwind utility change.
The command updates the owned source or document value, validates it, renders the committed revision, and records one Undo entry.
An unbound optional visual value may remain source-editable after valid Apply.
This does not permit Apply to discard existing required instance inputs or leave an accepted binding pointing at the wrong owner.

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

## Authoring editable foundations

Use normal React composition with clear ownership for values a designer is expected to change.
Supply instance content through supported props or slots, use complete static style or Tailwind class values, and keep editable sample collections local with stable keys.
Prefer direct local imports and small component boundaries whose shared and instance scopes are easy to identify.
These patterns let the resolver discover supported Layers without a designer writing configuration.
A manifest or declared controls can describe supported inputs when recognition alone is insufficient.

Computed values and external data remain valid source concepts, but they need a declared editable input or Code source when no reliable visual owner exists.
Do not replace normal React composition with one opaque page object merely to avoid source mapping.
The supported-pattern tests justify building the actual editor next; arbitrary-program reverse mapping is not a prerequisite.

## Related contracts

[Editable React components](../interface/react-components.md) defines the human editing experience.
[Code window](../interface/code-window.md) defines unapplied code and source Apply.
[Motion](../interface/motion.md) defines source-authored animation.
[Tailwind components](../import-export/tailwind-components.md) defines supported Tailwind source handling.
[React source-editing validation](react-source-editing-validation.md) records PRs 1–5, measured corrections, and remaining implementation limits.
[Command contracts](../mcp/command-contracts.md) defines IDs, revisions, atomicity, and Undo.

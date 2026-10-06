# insert_html

## Status and purpose

Accepted V1 behavior and refinements, recorded on 2026-10-04.
`insert_html` is the agent's main creation tool for ordinary editable layouts.
One call can create a complete header, section, sidebar, or other meaningful piece of a design.
The agent supplies a destination and an HTML fragment, and ORC-web maps supported content into canonical design objects.
Those objects use the existing browser renderer, Layers, Properties, Code, command engine, and portable project service.

Core JSON request/result fields and examples are accepted below.
Parser choice, supported tag/attribute/CSS grammar, resource addressing, limits, canonical mappings, and SDK/error integration remain implementation decisions.
The mixed editor workflow below has not been run, and this document does not establish an implemented tool.
The core schema expresses request/result shape; semantic validation must enforce the supported V1 behavior.

## Request responsibilities

| Input | Accepted responsibility |
| --- | --- |
| Active project, command identity, and expected revision | Use the existing shared command requirements and validate the intended applied state. |
| Destination | Identify workspace root or a valid existing frame/container with an explicit stable target. |
| HTML fragment | Supply the ordinary content to create, including its supported inline styles. |
| Insertion position | Append inside a container by default, or choose a valid position among its existing siblings. |
| Workspace position | Supply the unzoomed canvas position when creating a loose root object. |

The accepted field names and workspace/container distinction are recorded below.
Layer labels and authored HTML `id` attributes are not destination IDs.
The agent can find root/selection destinations through [get_context](get_context.md), or nested destinations through [get_tree](get_tree.md), without asking the person to select each target first.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and existing [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
The `projectId` wire field identifies the intended active project without renaming the persisted document identity or adopting the archived `documentId` envelope.
Supported HTML/CSS grammar, resources, canonical mappings, limits, and SDK/error integration remain implementation decisions.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "parentId": {"type": "string", "minLength": 1},
    "index": {"type": "integer", "minimum": 0},
    "position": {
      "type": "object",
      "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
      "required": ["x", "y"],
      "additionalProperties": false
    },
    "html": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "expectedRevision", "html"],
  "additionalProperties": false,
  "allOf": [{
    "if": {"required": ["parentId"]},
    "then": {"not": {"required": ["position"]}},
    "else": {"required": ["position"], "not": {"required": ["index"]}}
  }]
}
```

Supply `parentId` for a valid existing frame or ordinary container; omit it for workspace-root insertion.
Inside a parent, omit top-level `position` and use the fragment's supported layout and placement styles.
Optional `index` is a zero-based position in that parent's existing ordered children at `expectedRevision`.
Zero inserts before the first child, and the current child count inserts after the last; omission also appends.
Multiple roots inside a container are inserted consecutively in their submitted order at that position.
Reject an index beyond the current child count rather than clamping or moving the insertion.

At workspace root, require `position` in unzoomed workspace CSS pixels and exactly one meaningful HTML root; `index` is inapplicable.
Signed and fractional coordinates are allowed under the existing placement rules.
The parser/service validates root count, supported content, parent eligibility, locks, resources, and references; the JSON schema cannot establish those facts.
A nonempty string containing only whitespace or comments does not supply a meaningful object.
Detailed conversion and precedence between workspace placement and authored root CSS remain implementation work; conflicting unsupported placement must fail explicitly.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "createdRootIds": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}, "uniqueItems": true},
    "createdNodeCount": {"type": "integer", "minimum": 1}
  },
  "required": ["commandId", "projectId", "appliedRevision", "createdRootIds", "createdNodeCount"],
  "additionalProperties": false
}
```

`createdRootIds` identifies newly inserted top-level objects in their submitted order, including roots inserted inside a parent.
`createdNodeCount` counts all created canonical objects, including those roots and their descendants.
It must match the committed model and cannot be smaller than the number of returned roots.
A fresh successful insertion increases the applied revision once and creates one application Undo step.
Command/project identities must match the request; command retry handling belongs to the shared service.
Successful applied results remain separate from completed disk autosave.

### Request and response examples

Arguments, continuing from the frame-creation example at revision 13:

```json
{
  "commandId": "cmd_insert_html_1",
  "projectId": "project_1",
  "expectedRevision": 13,
  "parentId": "frame_1",
  "html": "<section layer-name=\"Hero\" style=\"display:flex;flex-direction:column;gap:24px;padding:24px\"><h1 layer-name=\"Heading\" style=\"margin:0\">Build something great</h1><p layer-name=\"Description\" style=\"margin:0\">Your next idea starts here.</p></section>"
}
```

Successful structured result:

```json
{
  "commandId": "cmd_insert_html_1",
  "projectId": "project_1",
  "appliedRevision": 14,
  "createdRootIds": ["hero_1"],
  "createdNodeCount": 3
}
```

The example creates Hero, Heading, and Description as three canonical objects.
Use `get_tree` to read their saved hierarchy and descendant IDs before subsequent edits.

Arguments for one loose workspace object:

```json
{
  "commandId": "cmd_insert_html_loose",
  "projectId": "project_1",
  "expectedRevision": 14,
  "position": {"x": 120, "y": 80},
  "html": "<div layer-name=\"Section\" style=\"width:240px;height:120px;background:#ffffff\"></div>"
}
```

The loose-object request is an alternative illustration, not an extra committed step before the replacement example.

## Destinations and layout

Inside a frame or ordinary container, insert the fragment's top-level objects as ordered children at the requested insertion position.
Append after existing children when no insertion position is supplied.
Multiple roots are allowed within that valid container and retain their submitted sequence.
Validate the requested sibling position rather than silently moving the insertion elsewhere.

At workspace root, create one root object at the supplied canvas position.
That object can contain an entire nested layout.
Do not add an artificial wrapper to turn several submitted roots into one; the caller must provide one meaningful root for this destination.
Workspace objects have no parent-edge constraints.

Inside Row or Column, ordinary children participate in the destination's Flex flow.
Explicit Absolute Position children follow the existing out-of-flow placement and constraint rules.
Inside Free layout, preserve supported authored placement and constraints under the existing parent reference convention.
The insertion must use the same authoritative layout representation as Properties and later agent commands.
Do not save independently editable inline CSS and structured layout values that can disagree.
See [Flex layout](../../interface/flex-layout.md#parent-layout-and-child-participation), [Constraints](../../interface/constraints.md#where-constraints-apply), and the [model's remaining layout mapping](../../architecture/canonical-document-model.md#frames-and-layout).

Insertion preserves unrelated existing objects and their authored styling.
Normal layout effects still apply: adding a Flex child can reflow siblings or change a Fit parent's measured size.
That reflow does not authorize rewriting unrelated content or changing another frame's styles.

A destination must support canonical ordinary children under the existing hierarchy rules.
An arbitrary runtime DOM element inside a React component is not such a destination merely because it is visible.
React content and supported slots must retain their established source ownership and [component contract](../../import-export/component-import.md#component-contract).

## Supported content

| Input | Result |
| --- | --- |
| Nested HTML | Selectable containers and children with the same meaningful hierarchy and supported HTML semantics. |
| Inline CSS | Supported layout and appearance, including Flex, sizing, spacing, positioning, colors, borders, and shadows. |
| Text | Content, meaningful inline spacing, and supported formatting ranges within the appropriate text object. |
| Inline SVG | Vector source and supported styling under the existing SVG object contract. |
| Images and backgrounds | Supported image placement/fitting or background styling, with required assets resolved through the project service. |
| Existing token references | Explicit compatible references to existing document tokens. |
| `layer-name` | Saved readable Layers label, separate from the generated stable object ID. |

Use inline CSS as this tool's V1 styling input.
It gives each authored value a clear ordinary-object owner.
CSS classes requiring unavailable stylesheets, `<style>` rules, and unsupported layout features must produce an explanation identifying the unsupported input.
The tool must not silently discard those styles and report success.
Grid remains outside the initial V1 layout model.

Supported rendering and available Properties controls have different scopes.
A supported value can remain in the saved design and Code even when Properties has no editor for it.
A missing Properties control alone must not make insertion fail.
Conversely, browser rendering alone does not establish that the canonical model can preserve and export the value faithfully.
Reject content that cannot be represented within the accepted V1 contract.

React/JSX, Base UI/shadcn components, Tailwind component source, and Motion behavior continue through the supported [component preparation](../../import-export/component-import.md#preparation-and-preview) and source workflow.
The agent uses [inspect_component_import](inspect_component_import.md), then [import_component](import_component.md) to prepare and place that live composition with its supporting files.
An HTML fragment is not an executable React module or an automatic Tailwind compiler input.
Do not treat scripts, JSX expressions, imports, hooks, or source-authored event handlers as ordinary editable HTML.
Unsupported behavior must be identified rather than executed or silently removed.
This preserves the accepted React workflow without introducing another runtime or sandbox.

A chosen reusable image, SVG, or font can first be registered through [import_asset](import_asset.md).
Font registration provides required loading for supported authored font-family references in ordinary HTML/CSS; it does not require a React import.
Direct resource preparation remains part of this insertion tool rather than making asset registration a mandatory extra call.

## Layers hierarchy and object kinds

Each meaningful imported object gets a row in the existing [Layers panel](../../interface/layers-panel.md).
Rows follow saved parent relationships and ordered children, not a second tree built from parser nodes or arbitrary runtime DOM.
Map supported containers, text, images, and SVG into the canonical object kinds and retained semantics.
The exact persisted semantic fields remain part of the [model implementation](../../architecture/canonical-document-model.md#nodes).

```text
Landing page: existing Frame
└── Hero: Flex container
    ├── Copy: Flex container
    │   ├── Heading: Text
    │   └── Description: Text
    ├── Photo: Image
    └── Badge: Absolute Position container
        ├── Icon: SVG
        └── Label: Text
```

Hero appears directly beneath Landing page when Hero is the submitted root.
Do not insert an extra Imported HTML row or another artificial design container.
Keep real authored containers, including an intentionally empty container with size or styling.
Preserve structural grouping when flattening it would alter layout, supported semantics, or later editing.

A supported `<h1>` can appear as a Text row called Heading while retaining its heading role in rendering and export.
A bold word can be a formatting range within that text object rather than another row.
Formatting-only spans do not require separate rows; a genuinely separate layout element remains a separate object.
Preserve meaningful spaces between inline elements and supported whitespace behavior while omitting parser-only whitespace rows.
Comments and formatting ranges do not create Layers objects.
Do not erase a meaningful attribute or semantic relationship merely to simplify the tree.

Badge remains a child of Hero when it uses Absolute Position.
Changing gap, resizing, or wrapping Flex content does not manufacture parent groups for the browser's computed rows.
Image objects have Image rows; a background image remains part of its owning object's supported styling rather than requiring an invented child row.
SVG remains a vector object with retained source, following [whole-object SVG selection](../../interface/svg-editing.md#select-and-transform).
Inserting SVG does not introduce path-point or Bézier editing into V1.

## Names, IDs, and ordinary attributes

`layer-name="Heading"` sets the saved editor label.
ORC-web generates the stable ID used by commands independently.
Renaming Heading to Main title preserves that ID and does not replace the heading's visible text.
Repeated readable labels are allowed; stable IDs distinguish their objects.

When `layer-name` is absent, use the Layers panel's existing generic/readable naming conventions.
Do not invent an elaborate separate naming system for HTML imports.
`layer-name` is editor metadata; exported application HTML should not require that attribute.
An ordinary HTML `id` retains its application meaning and must not become an ORC command target.
Allowed attributes retain their supported semantics under the final attribute grammar.
The distinction between editor identity, labels, and browser attributes follows the [canonical identity rules](../../architecture/canonical-document-model.md#nodes).

## Existing tokens

Resolve a supported `var(--...)` reference against the document's existing token-to-CSS mapping.
When it names a compatible existing token, retain its stable token binding rather than baking only the resolved value into the new object.
Rendering then follows the applicable saved mode and existing shared-token behavior.
Matching a literal to a token value does not create a binding.
Literal values remain literal values.

An unknown CSS variable needs a supported valid fallback or an unresolved-reference error.
A fallback does not create a token definition or pretend that an unknown variable has a stable registry identity.
The exact canonical representation of supported fallback expressions remains open.
Do not automatically invent tokens or import a theme into the Tokens panel.
Imported theme registration stays within its existing [V1.1 schedule](../../../backlog/imported-token-management-v11.md).
Token compatibility, units, identity, and mode resolution follow [Tokens and modes](../../interface/tokens-and-modes.md).

## Images and managed resources

Resolve required images and backgrounds through the existing project asset service before committing the insertion.
Retain the managed files and asset references required by the saved project, including supported fitting and background settings.
Use the project's resource rules rather than importing Paper-specific URL services.
External URLs retain their explicit dependency status under the [workspace bundle](../../architecture/orc-workspace-bundle.md#managed-dependencies).
The accepted asset schemes, URL handling, and exact resource records remain implementation decisions.

An unavailable or invalid required asset must fail preparation before any design objects are inserted.
Prepared assets must not become dangling committed records after a failed insertion.
Temporary preparation storage is an implementation detail and must not replace a prior valid saved project or its files.
Save the committed design and required managed resources consistently under the existing bundle contract.

## Preparation, commit, and response

1. Validate the active project, expected revision, destination, insertion position, and applicable lock and hierarchy rules.
2. Parse the fragment and map supported content into candidate objects with fresh stable IDs.
3. Resolve required assets, existing token references, and supported styling without mutating the applied design.
4. Validate canonical invariants and the candidate using the shared rendering path and prepared resources.
5. Commit the complete insertion as one command, one revision increase, and one Undo step.
6. Return the created root IDs, matching applied project revision, and created-object count.

The count describes the canonical objects created, including descendants, rather than raw HTML tokens or SVG path points.
The core successful result fields are recorded above; detailed SDK/tool errors remain open.
The response stays compact and does not automatically return every descendant ID or the entire source.
The agent requests relevant descendants through [get_tree](get_tree.md) and applied code through [get_source](get_source.md).
This compact result supersedes the earlier proposed automatic hierarchy response.

All steps use the existing [command engine](../../architecture/command-engine-and-history.md#command-lifecycle) and [local rendering service](../../architecture/system-architecture.md#local-rendering-service).
The renderer validates the candidate rather than becoming another saved design authority.
Fresh IDs and managed references are committed together with the new hierarchy.
Successful insertion follows normal autosave, and Untitled projects can insert before a save location exists.
Command success and disk-save success retain their existing distinction.
A later disk-save failure leaves the applied insertion available through the existing save-recovery workflow.

## Failures and unsupported input

Preparation or validation failure leaves the applied design, revision, and Undo history unchanged.
One unsupported child fails the entire insertion; supported siblings from that payload must not be partially inserted.
The same applies to unresolved required resources, invalid tokens, incompatible destinations, stale revisions, locked parents, and required rendering failure.

Identify the offending element, style, or resource and a reliable fragment location where available.
If no reliable location exists, report the known cause without inventing a line or column.
Do not silently remove unsupported input, invent a substitute style, or claim success after changing its meaning.
Exact error codes and schema envelopes remain open.

## Editing, source, history, and reopening

Canvas selection and Layers row selection address the same object.
Selecting Photo highlights its row and shows its applicable Properties controls.
Selecting nested content reveals the selected path under the existing panel rules.
Opening Code retains selection and shows the applicable applied source scope, subject to the existing draft safeguard.
Imported objects use the existing rename and lock behavior rather than a separate import-specific interface.
Their saved hide/show controls retain the [V1.1 schedule](../../../backlog/layer-visibility-v11.md).

Layers, Properties, Code, and MCP reads all use the same applied design.
Supported later visual edits update canonical values, and generated source represents those changes.
Preserve design meaning, supported semantics, styles, vectors, and resources without promising byte-identical input whitespace or formatting.

Undo of insertion removes the created subtree as one operation; Redo restores the associated identities under retained runtime history.
Undo/Redo of a later gap or style edit preserves the existing object identities.
Save/reopen retains IDs, hierarchy, names, supported layout, formatting, asset references, SVG source, and token bindings.
Reopening restores the saved design rather than the prior session's Undo stack.

Replacement uses the dedicated [replace_node_html](replace_node_html.md) contract and the same parsing and validation implementation.
It retains a compatible ordinary root's identity, parent, and sibling position while allocating fresh descendant IDs and committing the whole replacement atomically.
Its core JSON exchange is accepted; exact root compatibility, metadata/placement precedence, and reference reconciliation remain implementation decisions in that contract.

## Mixed-layout example and required editor proof

The proof must run through the actual ORC-web MCP endpoint and editor in Chrome on the PC.
A parser experiment alone can establish candidate model conversion, but cannot establish selection, Properties, saving, or the complete editor workflow.

Start with an existing Landing page frame, one existing compatible background token, and one resolvable project image.
The following fragment illustrates the requested structure, not a runnable payload with finalized asset addressing.
Replace `PROJECT_IMAGE_URL` with the accepted asset reference and `--color-background` with the existing token's actual CSS identifier.

```html
<section layer-name="Hero" style="position:relative;display:flex;gap:24px;padding:24px;background:var(--color-background)">
  <div layer-name="Copy" style="display:flex;flex-direction:column;gap:12px">
    <h1 layer-name="Heading" style="margin:0;font-size:32px">Build <strong>something</strong> useful</h1>
    <p layer-name="Description" style="margin:0">A live, editable layout.</p>
  </div>
  <img layer-name="Photo" src="PROJECT_IMAGE_URL" alt="Product preview" style="width:240px;height:160px;object-fit:cover" />
  <div layer-name="Badge" style="position:absolute;top:12px;right:12px;display:flex;gap:8px">
    <svg layer-name="Icon" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="#7357ff" />
    </svg>
    <span layer-name="Label">New</span>
  </div>
</section>
```

| Action | Evidence required |
| --- | --- |
| Call `insert_html` targeting Landing page | Correct rendered Flex/absolute layout, retained semantics and resources, one direct Hero root, correct count, root ID, and applied revision. |
| Read Hero through `get_tree` | Correct descendant identities and hierarchy, with Badge beneath Hero and no artificial wrappers or formatting rows. |
| Click Heading on the canvas | Matching Layers highlight and applicable Properties; its supported bold range and meaningful spaces remain intact. |
| Change Hero's gap from 24 to 32 through Properties | Live layout update and matching applied `get_source`, with unrelated design unchanged. |
| Undo, then Redo the gap change | Correct restored spacing and unchanged object identities. |
| Undo, then Redo the insertion through the retained history | Complete subtree removal/restoration as one insertion command with the same restored identities. |
| Save and reopen after confirming Saved | Retained structure, IDs, styles, formatting, image, SVG, and existing token binding. |
| Insert a payload with a supported sibling and an unsupported child | Whole-call rejection with no partial subtree, committed asset/token residue, revision change, or Undo entry. |

Also verify insertion among existing siblings, multiple roots inside a container, and one positioned root at workspace level.
Check a styled empty container, identically named siblings, unknown-variable fallback/error, missing assets, locked destinations, and stale revisions.
Verify available V1 controls without enabling the separately deferred typography/font/Replace SVG controls through this tool.
Record the tested versions, project revision, observed results, and remaining limitations on Fedora and Windows before declaring the workflow supported.
These are acceptance requirements, not passed tests.

## Research basis and limits

Paper's `write_html` motivates a useful high-level authoring tool, while ORC-web retains its own model and rendering architecture.
The independently inspected [Kraft README](https://github.com/agusegui/kraft/blob/3525f4f8ccd056f463fd3b303e872ed74517d340/README.md#L3) identifies an educational application demo using Paper MCP, not Paper's parser or compiler implementation.
Its [HTML authoring helper](https://github.com/agusegui/kraft/blob/3525f4f8ccd056f463fd3b303e872ed74517d340/scripts/lib/place-art.mjs#L67) demonstrates inline styles, layer names, image backgrounds, and token references.
Those examples establish submitted markup, not hidden compiler behavior or a tested ORC-web conversion.
The inspected [Paper HTML paste guide](https://paper.design/docs/paste/html) is evidence about that documented import path; it does not prove every current `write_html` capability.
The SVG conversion internals, arbitrary JSX execution, automatic theme-mode behavior, and lossless vector round trip asserted in the supplied snapshot were not established by that repository inspection.
This contract records the agreed ORC-web behavior and requires its own implementation proof.

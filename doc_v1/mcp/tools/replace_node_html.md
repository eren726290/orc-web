# replace_node_html

## Status and purpose

Accepted V1 behavior, recorded on 2026-10-04.
`replace_node_html` replaces an existing ordinary HTML/CSS object subtree with one supported HTML fragment root.
It lets an agent redesign a section while retaining that section's compatible root identity and structural location.
It reuses [insert_html](insert_html.md) parsing, canonical mapping, assets, tokens, supported styling, Layers semantics, and candidate validation.
Core JSON request/result fields and examples are accepted below.
Root compatibility, metadata/placement precedence, reference handling, supported grammar, limits, and SDK/error integration remain implementation decisions.
The actual replacement MCP/editor workflow has not been verified.

## Request and scope

The request identifies the active project, command identity, expected applied revision, stable existing root target, and replacement HTML.
The target must be an ordinary object whose subtree can be replaced under the canonical hierarchy rules.
Supply one meaningful replacement root; do not add an artificial wrapper around several roots.
Layer labels and authored HTML IDs are not the existing target identity.
Use [get_node](get_node.md), [get_tree](get_tree.md), and [get_source](get_source.md) to inspect the current section and its relevant references before replacing it.

The replacement follows the same V1 inline-CSS, text/formatting, image/background, SVG, and existing-token rules as insertion.
An unavailable stylesheet class, unsupported child/style, unresolved required resource, or unsupported payload must not be silently discarded.
React imports, JSX expressions, Motion code, and component implementation files continue through [update_component_source](update_component_source.md).
A browser element inside a React component is not an ordinary replacement target merely because its rendered tag looks like HTML.
Supported component slots retain their declared ownership and operation rules.

## Agreed JSON exchange

Core request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and existing [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
The `projectId` wire field identifies the intended active project; the archived envelope does not override these fields.
Root compatibility, metadata/placement precedence, required-reference reconciliation, supported grammar, limits, and SDK/error integration remain implementation decisions.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1},
    "html": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeId", "html"],
  "additionalProperties": false
}
```

`nodeId` identifies the existing ordinary root to replace at `expectedRevision`.
The replacement must contain one meaningful, compatible root; the parser/service validates this beyond the nonempty string shape.
A fragment containing only whitespace or comments cannot become a successful replacement.
The existing parent and sibling position remain attached to that continuing root.
Changing structural location uses [reorder_nodes](reorder_nodes.md), while supported submitted styles follow the retained parent's layout rules.
Root metadata and placement precedence must be defined before accepting combinations whose meaning cannot yet be preserved reliably.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "nodeId": {"type": "string", "minLength": 1}
  },
  "required": ["commandId", "projectId", "appliedRevision", "nodeId"],
  "additionalProperties": false
}
```

The successful `nodeId` matches the request's retained compatible root identity.
New descendants receive fresh IDs; obtain them through `get_tree` rather than reusing old descendant handles.
Command/project identities must match the request, and a fresh successful replacement increases the revision once with one application Undo step.
Command retry handling and tool errors use the shared service; applied success does not promise a completed disk save.

### Request and response examples

Arguments, continuing from the [insertion example](insert_html.md#agreed-json-exchange) at revision 14:

```json
{
  "commandId": "cmd_replace_html_1",
  "projectId": "project_1",
  "expectedRevision": 14,
  "nodeId": "hero_1",
  "html": "<section layer-name=\"Hero\" style=\"display:flex;flex-direction:column;gap:32px;padding:24px\"><h1 layer-name=\"Heading\" style=\"margin:0\">A fresh direction</h1><p layer-name=\"Description\" style=\"margin:0\">Explore your next idea.</p></section>"
}
```

Successful structured result:

```json
{
  "commandId": "cmd_replace_html_1",
  "projectId": "project_1",
  "appliedRevision": 15,
  "nodeId": "hero_1"
}
```

The example retains Hero's compatible ordinary container identity and structural location while replacing its content.
Exact compatibility and metadata/placement rules still need implementation validation; this exchange does not claim the running tool passes.

## Root identity and structural location

Keep the existing root's stable editor ID when the replacement is compatible with its ordinary-object contract and validated references.
Preserve its parent and sibling position, including its position in the workspace-root sequence.
Do not silently move the section into another frame, reorder it, or assign it an unrelated editing identity.
Submitted content and supported styling define the replacement under those retained relationships.

Root compatibility must account for canonical kind, supported semantics, hierarchy, placement, sizing, and any references that must remain valid.
The exact compatibility table and precedence for existing root metadata/placement versus submitted values must be defined before accepting those semantic combinations.
An incompatible replacement fails with an explanation rather than silently creating a new root ID.
Keeping a container in its current parent does not prevent normal layout effects when the replacement's content or sizing changes.
In a Flex parent, retain the structural slot and apply the accepted child-layout rules.

Newly created descendants receive fresh stable IDs.
Readable names and HTML IDs do not cause new descendants to inherit old editor identities.
Old descendant targets that were removed are no longer valid after success.
Do not guess that a similarly named heading or matching text is the same editing target.
Return the retained root ID; the agent can read its new descendants through [get_tree](get_tree.md).

Validate references affected by removing the old descendants before commit.
If required references, component/slot ownership, or other invariants cannot be preserved safely within the accepted replacement, reject it without changing the section.
Do not silently retarget old references to new descendants or delete shared token/component definitions that other objects still use.
The detailed reference and managed-record reconciliation remains an implementation task under the shared model and command rules.

## Layers and selection

The new subtree follows the submitted meaningful hierarchy and [insert_html Layers rules](insert_html.md#layers-hierarchy-and-object-kinds).
Preserve supported HTML semantics, meaningful whitespace, formatting ranges, real containers, and whole SVG source without parser-only rows or an Imported HTML wrapper.
The root row keeps its editing identity; descendant rows describe the newly committed objects.
Renaming remains separate from the stable identity and follows the existing Layers label rules.

All editor views read the same committed replacement.
Selection of a continuing compatible root can remain on that root.
Removed descendant selection follows the existing known-deletion behavior: select a verified surviving parent or clear uncertain selection rather than reuse a stale handle.
Browser selection remains view state and does not create a second design mutation.
The [Code selection contract](../../interface/code-window.md#selection-after-apply) supplies that existing parent/reselection behavior.

## Preparation, atomic commit, and response

1. Resolve the current ordinary target, expected revision, parent/order, applicable locks, and affected references.
2. Parse one replacement root using the shared HTML importer and map its supported content to candidate canonical objects.
3. Check root compatibility, retain the root ID and structural location, and allocate fresh IDs for new descendants.
4. Resolve required assets, existing token references, styles, root metadata/placement, and affected managed records without mutating the applied design.
5. Validate the complete candidate hierarchy, references, invariants, and required rendering through the shared rendering service.
6. Commit removal and replacement together as one command, one new revision, and one Undo step.
7. Return the resulting root ID and matching applied revision in a compact result.

The core successful result fields are recorded above; detailed SDK/tool errors remain open.
There is no intermediate applied state containing half the old section or only the supported children of the new payload.
The operation uses the [command lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle); required resources and managed records must agree with the committed revision.
Preserve unrelated objects, source, shared definitions, and frame styles.
Untitled projects can replace applied content before a save location exists.

## Failure, history, and saving

Unsupported HTML, incompatible roots, invalid/dangling required references, locked targets or affected descendants, stale revisions, missing assets/tokens, and failed preparation/rendering leave the applied design, revision, and Undo history unchanged.
Identify the known target, element, style, resource, reference, or reliable payload location without fabricating an explanation.
Do not commit partial objects or dangling managed records after failure.

Undo restores the old subtree, root/descendant identities, content, styles, references, and structural location as one operation.
Redo restores the accepted replacement with its recorded new descendant identities through retained history.
Save/reopen retains the successfully saved replacement and required assets/tokens/source records, not the previous session's Undo stack.
Command success and disk-save success remain distinct; a later save failure uses the existing recovery workflow without silently undoing the applied replacement.
Generated ordinary source reflects the canonical result without promising byte-identical input formatting.

## Required replacement proof

Start with an ordinary section among existing siblings, containing Flex layout, Free/Absolute Position content, text with meaningful spacing, an image, SVG, and an existing token reference.
Read its root and descendant IDs, then replace it once with another supported section through the actual MCP endpoint and Chrome editor.
Verify the retained compatible root ID, unchanged parent/order, fresh descendant IDs, correct Layers/selection, required resources, and unrelated content preservation.
Use `get_tree` to find a new child, perform a supported Properties or MCP value edit, and confirm `get_source` represents the applied result.
Undo/Redo the value edit and replacement, then save, confirm Saved, and reopen with the same committed design and identities.

Submit an unsupported child beside supported content and verify whole-call rejection without revision/history or committed-resource residue.
Also check incompatible root kinds, missing assets/tokens, locked/stale targets, removed descendant handles, required references that cannot survive, and an unsupported React target.
Verify root metadata/placement precedence and reference reconciliation once their exact rules are chosen.
Record actual toolchain and Chrome evidence on Fedora and Windows before declaring support.
These are acceptance requirements, not passed replacement implementation tests.

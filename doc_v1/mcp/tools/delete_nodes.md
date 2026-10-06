# delete_nodes

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`delete_nodes` removes explicitly identified supported objects and their owned subtrees.
It follows the existing [canvas deletion workflow](../../interface/workspace-and-canvas.md#delete-and-context-menu) and shared command engine.
Core JSON request/result fields, overlap rejection, explicit shared-source scope, and deleted-root results were accepted on 2026-10-05.
Detailed reference reconciliation, managed-record retention, source-owner alias handling, and SDK/error integration remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Request and ownership

Identify the active project, command identity, expected applied revision, and stable targets to remove.
Use [get_node](get_node.md) and relevant [get_source](get_source.md) reads to inspect ownership before deletion.
Labels, HTML IDs, and arbitrary runtime DOM elements are not deletion targets.
Deleting an ordinary frame or container removes its owned children with it.
Reject duplicate IDs and requests containing both an ancestor and its descendant; requesting the ancestor already removes its owned subtree.

A supported React deletion changes the actual JSX composition, declared editable slot, or local collection record that owns the content.
Computed or package-internal content without a reliable structural owner is unavailable to this operation.
Shared implementation changes require explicit All copies or supported Only this scope, with the existing [copying limits](../../architecture/react-source-bindings.md#choose-edit-scope).
Removing a placed component instance does not delete its shared definition or alter other instances using it.
Removing a child must preserve required component inputs, slot contracts, and other valid references.
Deleting nodes does not automatically delete shared tokens, component definitions, or assets still required elsewhere.

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
One call removes one or more explicit supported targets and their owned content together.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "expectedRevision": {"type": "integer", "minimum": 0},
    "nodeIds": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    },
    "scope": {"type": "string", "enum": ["all_copies", "only_this"]}
  },
  "required": ["commandId", "projectId", "expectedRevision", "nodeIds"],
  "additionalProperties": false
}
```

Targets are stable editing IDs, not labels, selectors, or arbitrary runtime DOM nodes.
Validate every requested target and its owned subtree before removing anything.
The schema rejects duplicate IDs; the service also rejects ancestor/descendant overlap against the actual applied hierarchy.
Missing IDs fail the complete request rather than being silently ignored.

Removing a placed React instance changes that instance's owned placement or authored usage without deleting its reusable definition or another instance.
Supported nested React deletion changes its actual JSX, slot, or local data owner.
Require explicit `scope: "all_copies"` or `scope: "only_this"` when that deletion belongs to shared implementation source.
Canonical and instance-owned content retain their actual owners; scope cannot make unsupported content deletable.
Only this makes the actual supported local owner independent under existing copying limits before the deletion commits.
Validate copying, source changes, required inputs, slot contracts, bindings, and candidate rendering together.

Deletion preserves reusable shared tokens, component definitions, and managed assets rather than automatically garbage-collecting them.
Records needed by surviving content and retained application Undo remain available.
Exact managed-record reconciliation and shared-source alias handling remain in the [delete implementation decisions](../../../backlog/mcp/command-contracts.md#delete-schema-implementation-decisions).

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {"type": "string", "minLength": 1},
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "deletedRootIds": {
      "type": "array", "minItems": 1, "uniqueItems": true,
      "items": {"type": "string", "minLength": 1}
    }
  },
  "required": ["commandId", "projectId", "appliedRevision", "deletedRootIds"],
  "additionalProperties": false
}
```

Return the requested deleted-root IDs in request order, matching command/project identities, and the committed applied revision.
Here a deleted root means a requested removal target, including a nested object; it does not mean only a workspace root.
Owned descendants are removed but are not enumerated automatically in this compact result.
A successful shared-source deletion can affect equivalent content in other instances without listing every affected layer.
Removed handles are unavailable to subsequent reads or edits until a supported application history restoration reinstates them.
Command success does not confirm disk saving.

### Request and response example

Remove one existing badge:

```json
{
  "commandId": "cmd_delete_1",
  "projectId": "project_1",
  "expectedRevision": 25,
  "nodeIds": ["badge_1"]
}
```

Successful structured result:

```json
{
  "commandId": "cmd_delete_1",
  "projectId": "project_1",
  "appliedRevision": 26,
  "deletedRootIds": ["badge_1"]
}
```

The example assumes eligible canonical or instance-owned content; shared implementation deletion additionally requires explicit scope.
These examples describe the agreed exchange, not executed MCP/editor behavior.

## Atomic validation and result

Validate targets, expected revision, applicable target/ancestor/subtree locks, source scope, required references, and hierarchy invariants.
Prepare affected source and bindings and validate the complete candidate and required rendering before commit.
Remove the accepted objects, owned content, and coupled references/source together as one command, one revision, and one Undo step.
One invalid target, locked affected object, required content that cannot be removed, unsupported structural binding, or failed candidate rejects the entire call.
The applied design and history remain unchanged after rejection.
Return `deletedRootIds`, command/project identities, and the applied revision through the compact agreed result.
Ordinary reversible deletion uses the application command directly without an additional confirmation popup.

## Editor views, history, and saving

Layers and the rendered design remove the same committed content; subsequent source/context reads reflect that state.
Removed IDs are unavailable to later edits until an application history restoration reinstates them.
Selection follows the existing [known-deletion rule](../../interface/code-window.md#selection-after-apply): select a verified surviving parent or clear uncertain selection.
Do not redirect a deleted handle to a similarly named object.
Private Code drafts retain their existing application safeguard and are not silently applied as part of deletion.

Application Undo restores removed objects with their IDs, parent/order, content, styles, source, inputs, and required references.
Redo removes the same restored content through retained session history.
Successful deletion follows normal autosave, with [command success separate from disk-save success](../../architecture/command-engine-and-history.md#command-lifecycle).
Save/reopen reproduces the applied deletion without requiring the prior session's Undo stack.
MCP [undo and redo tools are scheduled for V1.1](../../../backlog/mcp/undo-redo-v11.md); every successful V1 deletion still records application history.

## Required verification

Delete a loose object, a nested container, a whole frame, and one of two component instances while preserving unrelated designs and shared definitions.
Verify supported React JSX/slot/local-data deletion, explicit source scope, required-slot refusal, locked descendants, stale targets, and whole-request failure.
Check selection, removed handles, source output, reference/asset preservation, exact-ID restoration with application Undo/Redo, and save/reopen.
Check duplicate and ancestor/descendant rejection, deleted-root request order, descendant omission from responses, shared-source aliases, and failed Only this preparation without partial removal.
Static schema checks do not establish subtree locks, required references, source ownership, resource retention, candidate rendering, history, or persistence.
Use the actual MCP endpoint and Chrome editor on Fedora and Windows.
These checks remain unrun implementation requirements.

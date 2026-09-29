# Command contracts

## Status

Accepted shared command rules with proposed exact schemas.
This document applies to browser UI actions that persist design state and to the 39 public MCP tools.

## Common mutation input

Every document mutation provides a unique `commandId`, `documentId`, and integer `expectedRevision`.
The operation then provides explicit stable target IDs and an operation-specific payload.
`create_document` and `open_document` have no existing document target and use `expectedRevision: null`.

The implementation must use one schema source to derive browser routes, MCP inputs, TypeScript types, generated tool descriptions, and tests.
Tools must not accept arbitrary document patches.

## Shared mutation behavior

The engine validates the complete request before it changes the document.
It rejects missing targets, duplicate targets, invalid values, locked targets, parent-child cycles, invalid component properties, incompatible token use, and revision conflicts.
Batch commands are atomic.
One failed target causes the full request to fail without a partial document change.

A successful mutation returns `ok`, `commandId`, `documentId`, the committed `revision`, `affectedNodeIds`, and operation-specific output.
A failure returns `ok: false`, a stable error code, a clear message, whether the caller can recover, the current revision when known, and an action the caller can take next.

Candidate Apply failures return a recoverable error without committing a new revision.
Later runtime component errors are diagnostics attached to the current local editor session, not failed document mutations.
Read tools expose those diagnostics with the applied source or project context so an agent can inspect the current problem through its normal fresh read.

Reusing a completed `commandId` with identical input returns the first result.
Reusing it with different input fails.

## Stable IDs and targets

Commands target generated document IDs.
A source-backed component layer uses its generated editor ID, which resolves through a validated source binding.
Commands never target a Layer label, an HTML `id` attribute, CSS selector text, browser source range, or an arbitrary imported component runtime DOM node.
The workspace root is a documented virtual target for tools that list or place root objects.

## Command classes

| Class | Examples | Expected behavior |
| --- | --- | --- |
| Read | `get_node`, `get_tree`, `list_design_tokens` | Does not change revision or persistence. |
| Edit | `move_nodes`, `set_text`, `update_component_props` | Validates, saves, increments revision, and records Undo. |
| Import | `insert_html`, `import_component`, `import_asset` | Inspects or validates first, then commits all managed state together. |
| Lifecycle | `create_document`, `open_document`, `rename_document` | Changes the open project state and project bundle when successful. |
| Export | `export` | Reads one committed revision and writes outside the canonical design state. |

## Revision and renderer rules

The command engine owns the committed revision.
The browser may render a temporary drag preview, but it sends one final measured command to commit the gesture.
Computed-style, screenshot, and export commands that rely on browser rendering must identify the revision they measured or rendered.
When no matching renderer is available, they return a stable renderer-unavailable result.

## Undo and Redo contract

Every successful editable command creates one Undo entry unless its command-specific contract says otherwise.
Undo and Redo each change revision because they create new committed document states.
Undo restores the documented inverse of the original command.
Redo restores the original forward result if the history branch remains valid.

## Import contract

`inspect_component_import` performs no document mutation.
`import_component` requires a current inspected candidate fingerprint and rechecks source before committing.
The import either stores a complete usable component record and managed files or stores nothing.
An import failure never leaves a partial component node in the document.

## Destructive commands

`delete_nodes` removes complete selected subtrees.
`update_design_tokens` rejects deletion of a token that still has a design reference.
`update_component_source` rejects a source or manifest update that makes existing instance properties or slots invalid.
All destructive command results name the affected stable IDs.

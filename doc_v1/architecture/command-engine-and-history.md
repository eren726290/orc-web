# Command engine and history

## Status

Accepted behavior with proposed internal command mechanics.

## One editing path

Every completed design change uses a named command.
The browser UI, MCP server, Code Apply action, imports, and exports call documented command handlers instead of editing raw document maps.
This keeps validation and Undo consistent across human and agent work.

Examples include moving nodes, updating a component property, applying source, changing a token, importing a component, and deleting a frame.

## Command lifecycle

```text
Input → validate → build candidate document → verify invariants → persist → increment revision → publish result
```

The command engine applies the entire change or leaves the document unchanged.
It records one inverse history entry after a successful completed command.
The caller receives success only after the new document state is safe to autosave.

Candidate source application must also prove that its candidate renders before it commits.
If that check fails, the command leaves the current committed document untouched and returns a recoverable error.
An interaction path that only runs later can still fail at runtime, so a later component error does not silently roll back the committed revision.
The editor records that runtime diagnostic against the affected component for the current local session.

## Revisions

Each completed mutation increases `document.revision` by one.
Read operations may require the caller’s expected revision where returning stale layout or source would mislead the caller.
When a caller supplies an outdated revision, the command returns a revision-conflict result without applying a partial edit.

## Undo and Redo

Undo reverses one completed command.
Redo reapplies one reversed command.
Undo history is runtime state for an open local project session and is not the portable project’s canonical state.
Dragging and numeric scrubbing may show many temporary updates, but committing the gesture creates one history entry.
Applying shared component source is one history entry even when it changes many component instances.

## Command requirements

Every document mutation identifies its target document and a unique command ID.
Every mutation validates target IDs, expected revision, property values, locks, component manifests, parent and child rules, and document invariants before persistence.
Batch mutations either complete for every target or fail completely.
Commands target stable node, token, asset, and component IDs rather than Layer labels or browser DOM IDs.

## UI-only state

Selection, hover, expanded Layers rows, panel tabs, viewport position, and temporary drag previews are browser state.
They do not increment document revision and are not added to Undo history.
Visible, locked, and other saved node properties are document commands because they affect the design.

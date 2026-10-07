# Command engine and history

## Status

Accepted behavior with proposed internal command mechanics.

## One editing path

Every completed design change uses a named command.
The browser UI, MCP server, Code Apply action, imports, and exports call documented command handlers instead of editing raw document maps.
This keeps validation and Undo consistent across human and agent work.

Examples include moving nodes, updating a component property, applying source, changing a token, importing a component, and deleting a frame.
Component inspection and package preparation precede the [single placement command](../import-export/component-import.md#placement-and-completion); a prepared preview alone is not a workspace mutation or document Undo entry.
Canvas Copy reads an applied-design snapshot without a document command or Undo entry.
[Same-project Paste](../interface/workspace-and-canvas.md#copy-and-paste-inside-the-same-project) commits the new objects, instance inputs, and validated bindings together as one command and one Undo entry.

## Command lifecycle

```text
Input → validate → build candidate document → verify invariants and required rendering → commit active project, revision, and Undo → publish result → autosave
```

The command engine applies the entire change or leaves the document unchanged.
It records one inverse history entry after a successful completed command.
The caller receives success after the validated change is committed to the server's active project.
Command success does not mean the revision has been written to disk.
Untitled projects can complete commands before a save location exists.

For a project with a save location, autosave writes the applied revision and its required managed files afterward.
A disk-save failure does not turn that successful edit into a failed command or remove its Undo entry.
The applied design remains available in the server session for Retry or Save as.
Only a completed write of the current applied revision allows the editor to show Saved.
An older save finishing after another edit cannot mark the newer revision as Saved.
The [workspace bundle](orc-workspace-bundle.md#autosave) owns save status, reconnection, and disk recovery.

Candidate source application must also prove that its candidate renders before it commits.
The server uses the [local rendering service](system-architecture.md#local-rendering-service) for that initial-render check with the candidate's required styles and supported inputs.
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
Each open project session has its own history and revision.
Switching [project tabs](../interface/workspace-and-canvas.md#project-tabs-and-dashboard) retains those histories; Undo and Redo act on the active project's history.
Closing a project session releases its runtime history after the existing close safeguards.
Dragging and numeric scrubbing may show many temporary updates, but committing the gesture creates one history entry.
Applying shared component source is one history entry even when it changes many component instances.
With canvas focus, Ctrl+Z undoes the last completed design command and Ctrl+Shift+Z redoes it.
While typing in a Properties field, token field, canvas Text editor, or unapplied Code draft, Ctrl+Z follows that editor's typing history instead of changing unrelated design commands.
After the field or text edit finishes, the completed design adjustment is available as one document Undo step.
Code typing remains a draft; only successful Apply enters document history.
Before document Undo or Redo changes source owned by an open Code draft, the [Code draft safeguard](../interface/code-window.md#undo-and-redo-with-a-draft) asks whether to discard it.
Cancel preserves the draft, applied design, and history position; Discard permits the requested history action and refreshes Code from applied state.
Undo or Redo affecting unrelated source leaves the draft intact and proceeds normally.

## Command requirements

Every document mutation identifies its target document and a unique command ID.
Validate the addressed project against the active project before applying the command; never reinterpret a request for another or closed project as an edit to the current tab.
Every mutation validates target IDs, expected revision, property values, locks, component manifests, parent and child rules, and document invariants before committing the active project.
Lock validation includes applicable ancestor locks and distinguishes the explicit Unlock action from ordinary design edits.
Batch mutations either complete for every target or fail completely.
Commands target stable node, token, asset, and component IDs rather than Layer labels or browser DOM IDs.

## UI-only state

Selection, hover, expanded Layers rows, panel tabs, viewport position, and temporary drag previews are browser state.
Project tabs and per-project selection, viewport, panel state, and Code drafts are session state outside the portable design.
Token search, category expansion, inspection, and temporary value previews also remain editor state.
Code scope and highlighting, draft discard, and clipboard copying remain editor actions; the [Code window](../interface/code-window.md) defines their draft safeguards and copy boundaries.
They do not increment document revision and are not added to Undo history.
Visible, locked, and other saved node properties are document commands because they affect the design.
Display-name changes also use saved commands, while canceling a rename produces no completed design mutation.
The human rename, lock, selection, expansion, and future visibility workflows belong to [Layers panel](../interface/layers-panel.md).
Saved human hide/show and MCP visibility mutations retain their [V1.1 schedule](../../backlog/layer-visibility-v11.md); the persisted representation and shared command lifecycle remain available for that future operation.
The [Tokens panel](../interface/tokens-panel.md) defines token creation, live preview, rename, and safe deletion.
Properties creation and application of a token succeed together as one command or leave no definition or binding behind.
A completed shared-token adjustment creates one Undo entry, regardless of how many linked objects use the affected value.

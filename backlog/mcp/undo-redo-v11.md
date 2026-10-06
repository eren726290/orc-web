# MCP Undo and Redo — V1.1

## Decision and scope

Schedule the public MCP `undo` and `redo` tools for V1.1, agreed on 2026-10-04.
Application Undo/Redo remains in V1 under the [shared history contract](../../doc_v1/architecture/command-engine-and-history.md#undo-and-redo).
Every successful V1 MCP design mutation still records its normal application history entry.
A person can reverse an agent's completed change using the application's existing Undo controls.
The historical [catalog rows](tool-catalog.md#create-and-mutation-tools) do not make either MCP history tool a V1 requirement.

## Future implementation

Expose the existing project history service rather than create a separate agent history.
The discussed direction is one completed command per call, expected-revision validation, compact results, and unchanged design/history on failed restoration.
Final schemas, empty-history responses, client behavior, and any next-action summary in context reads belong to that future work.
Do not add an Undo/Redo-specific context summary as a V1 requirement from the preceding proposal.

Before release, verify shared human/agent history, source and binding restoration, stable IDs, Redo branching, draft safeguards, application autosave, and session lifetime.
Run through the actual MCP endpoint and Chrome editor on Fedora and Windows.
Dedicated active tool contracts should be written when the V1.1 behavior is finalized.

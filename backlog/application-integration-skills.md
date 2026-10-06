# Application integration skills

## Status

Recorded workflow direction with authored repository skills.
Execution against a real application and the required ORC interfaces remain unverified.
The release is unassigned; this plan does not add a V1 release requirement.

## Discussion basis and conclusion

The user supplied Elyx creator posts and an article, a designer's criticism of disconnected design tools, and replies from Elyx and Lunagraph creators.
These statements explain the authors' intended approaches; they are not ORC-web implementation evidence or independent tests of those products.
Exact X permalinks were not supplied.

| Point from the discussion | ORC-web conclusion |
| --- | --- |
| Elyx composes controls, blocks, and screens through file imports. | A freeform workspace can present reusable source organized across files in a project. |
| Elyx emphasizes local files, existing patterns, and product decisions as agent context. | Preserve inspectable source and explain integration decisions in the task's checkpoint record. |
| The designer questions whether the displayed design is the code and behavior that ship. | Verify the selected design with its actual styles, assets, dependencies, data, and relevant interactions. |
| Lunagraph distinguishes a proposed design from today's production application. | Support exploration, then make the transfer into the application an explicit, verified task. |
| Lunagraph supplies reusable editing tools around programmable content. | Selection, Layers, Properties, Tokens, Code, Undo, and exports provide a consistent environment for human iteration. |

The product aim is an agent-built foundation that a designer can refine, with those refinements preserved in applied design/source and an explicit path into the application.
Local files, a browser interface, and MCP are separate choices.
A local browser editor can own portable project files, and a local MCP adapter can expose application operations.
Direct edits to files belonging to an open ORC project still need defined reconciliation with the active project, bindings, revision, and Undo.
The shared command engine remains the path for accepted ORC mutations.

## Two explicit directions

| Skill | Input and destination | Completion result |
| --- | --- | --- |
| [orc-design-import](../skills/orc-design-import/SKILL.md) | A selected existing application screen, section, or component into an ORC project. | A verified editable foundation, recorded adaptations, and an evidence checkpoint. |
| [orc-repo-sync](../skills/orc-repo-sync/SKILL.md) | A committed ORC code export into the selected application directory. | A verified integration branch and pull request targeting `main`, with its evidence checkpoint. |

Each run starts from an explicit user request with a named source and destination.
Import keeps the original application source intact and writes accepted work into the chosen ORC project.
Integration modifies only the agreed application scope and preserves existing user work.
The target application's framework, package manager, compiler, and repository conventions govern application integration.
ORC's Bun/TypeScript choices do not automatically become requirements for that application.
HTML/CSS, SVG, supported React, Tailwind, and Motion retain their existing input, editing, and output limits.

## Checkpoints and failure repair

Each skill creates one persistent checkpoint record per run, using the target's existing task-report convention where possible.
Record source identity, revision or content fingerprint, destination, starting commit, intended changes, behavior to preserve, and the affected dependency/caller paths.
Track each step as pending, passed, failed, or blocked, with concrete completion conditions.
Evidence includes source citations, exact commands and exit results, logs, browser observations, and comparison captures where appearance matters.
Skipped or unavailable required checks stay blocked; previous experiment reports do not establish the current integration.

When a check fails, reproduce and investigate it, then tell the user what failed, what is affected, and the proposed repair.
Discuss the proposal and wait for the user's agreement before applying the repair.
Record that agreement, implement the agreed change, and rerun affected checks.
A broader repair or newly found issue needs renewed discussion before extending the diff.
User agreement authorizes a repair; it does not make a failed check pass.
Baseline failures remain visible and are distinguished from failures introduced by the task.

Repository integration finishes with a pull request targeting `main` after required verification and final diff review.
If `main` is absent, instructions conflict, or publication is unavailable, stop and report the blocker rather than silently changing the requested target or claiming completion.
The workflow ends at an open pull request; merging remains a separate user action.
Import finishes with the verified ORC project and its checkpoint; it does not require a source-repository pull request.

## Focused execution examples

Import a dashboard from an existing application with its actual local component imports, styles, assets, and a recorded initial state.
Compare the result in ORC, verify promised editable controls, perform supported edits, Undo/Redo, save, and reopen.
Required provider, routing, or service adaptations are discussed and recorded before preparation.

For integration, take the refined dashboard's committed export and trace the target application before editing.
Preserve existing routes, handlers, data contracts, and component interfaces while applying the agreed presentation changes.
For example, changing a checkout button's appearance must preserve its checkout action.
Exercise that application workflow after integration and include the observed result in the PR evidence.

## Remaining implementation work

- Locate and validate working ORC import, export, read, and mutation operations before executing either skill.
- Verify import fidelity, promised editability, save/reopen, and retention of source, styles, assets, and dependency records against a real project.
- Verify application integration in the real target architecture, including callers, styles, behavior, and the PR delivery path.
- Revisit exact operation interfaces after the MCP contract is settled, while retaining fresh applied reads and shared commands.
- Choose a release only after the required application paths work; the authored skill files alone do not establish feature readiness.

## Related contracts

- [Component import](../doc_v1/import-export/component-import.md) owns supported input preparation, readiness, and placement.
- [Export](../doc_v1/import-export/export.md) owns committed output and dependency packaging.
- [Source bindings](../doc_v1/architecture/react-source-bindings.md) owns React edit scope and per-value eligibility.
- [Command engine](../doc_v1/architecture/command-engine-and-history.md) owns revisions, validation, and Undo.
- [Workspace bundle](../doc_v1/architecture/orc-workspace-bundle.md) owns portable files and dependency records.
- [Code window](../doc_v1/interface/code-window.md#design-and-code-synchronization) owns applied design/code synchronization inside ORC.

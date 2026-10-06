---
name: orc-design-import
description: >-
  Imports a selected existing application screen, section, or component into ORC with traced source dependencies, verified appearance and editability, and an evidence checkpoint.
  Use when a user requests bringing repository UI into ORC, preparing an editable foundation from application code, or checking an existing application's design import.
---

# ORC design import

## Scope and prerequisites

Execute for an explicitly requested import; a discussion or review request authorizes planning or reading only.
Identify the source repository, selected route/screen/component, source revision, initial state, and destination ORC project.
Read the source's README, applicable AGENTS, package manifest or requirements, Makefile, and environment example when present, then follow relevant configuration and source.
Read ORC's current [component import contract](../../doc_v1/import-export/component-import.md) and [integration plan](../../backlog/application-integration-skills.md) when available.
Locate working ORC read, import, and mutation operations in the actual environment and verify their supported input formats.
If required operations are unavailable or instructions conflict, stop and report the blocked prerequisite before implementation.
Before repairing any failure, including a baseline failure, follow step 4 and obtain the user's agreement.
Write accepted design work through ORC's command engine; source files belong to the saved bundle under its managed storage rules.

## Checkpoint record

Create one persistent checkpoint file in the task's report location before import.
Record source commit and selected-file fingerprints, route/state, destination project/revision, dependencies, intended editable values, and any agreed adaptations.
For every step record pending, passed, failed, or blocked, its completion condition, and evidence paths or file/line citations.
For commands record the working directory, exact command, exit result, and log; for browser checks record environment, inputs, dimensions, actions, expected result, and observed result.
Keep baseline failures, user repair agreements, source-to-ORC ownership, final saved revision, and limitations in this same record.
A required skipped or unavailable check stays blocked; mark completion only from current evidence.

## 1. Inspect the original application

Record Git status and selected source fingerprints so the original application files can be checked afterward.
Trace the selected UI's local imports, component interfaces, styles, tokens, fonts, assets, package versions, state, events, providers, routing, and relevant data/service requirements.
Inspect the selected dependency path rather than deciding compatibility from unrelated installed packages.
Run relevant existing checks and exercise the original selected UI in the actual application.
Capture appearance and relevant interaction states under recorded inputs and dimensions.
Pass when the selected source, its required dependency path, baseline behavior, and existing failures are evidenced.

## 2. Define the supported import

Map ordinary HTML/CSS/SVG to supported ORC design values and React to its accepted source-backed layers, instance inputs, slots, or collections.
Identify editable owners and shared/instance scope for the values the designer is expected to change.
Use the installed ORC version's actual controls and recognition limits, including its Base UI/shadcn and Tailwind boundaries.
Report source-only values and unsupported runtime requirements before changing the destination.
Explain required provider, router, or service adaptations and discuss any local sample data or supplied example before using it.
Record agreed adaptations as differences from the original; preserve their origin and avoid presenting a substituted behavior as production behavior.
Pass when source files, required inputs, planned adaptations, supported operations, and promised editable values are identified.

## 3. Prepare and place

Read fresh applied ORC state through available `get_context` / `get_source` operations or their implemented equivalent and use the current expected revision for mutations.
Keep the original application source intact while preparing the selected source, exact dependency records, styles, theme inputs, and managed assets for ORC.
Respect commands that require Node and retain authored Tailwind classes or Motion source when supported.
Use implemented inspection/preparation operations and require successful candidate rendering with the real required styles and agreed inputs before placement.
Resolve affected Code drafts through ORC's existing safeguard and preserve destination locks and layout rules.
Commit accepted placement through the shared command engine and verify its actual Undo boundary and resulting selection.
If the source fingerprint or ORC revision changed, refresh the affected inspection before applying further changes.
Pass when the chosen content is applied and selectable with its promised editable owners and required rendering inputs.

## 4. Verify fidelity and editability

Compare the imported design with the original under equivalent inputs, dimensions, fonts, assets, styles, and applicable design modes.
Exercise relevant implemented interactions in Preview and inspect runtime/console errors.
For every promised editing category, perform a representative supported edit and verify the corresponding source or canonical value changed at the stated scope.
Check selection continuity, Layers/Properties connection, supported nested React layers or declared controls, and shared versus instance behavior where applicable.
Verify Undo/Redo, then save and reopen the project and confirm the accepted changes, source, assets, styles, and dependency records remain reproducible.
When a check fails, reproduce and investigate it, then report the failure, affected files/behavior, evidence, and proposed repair to the user.
Discuss the repair and wait for the user's agreement before applying it.
Record the agreement, apply that repair, and rerun the affected checks; a broader repair needs renewed discussion.
Keep required failed or blocked checks incomplete and report source-only boundaries explicitly.
Pass when appearance, relevant interactions, promised editing operations, history, and save/reopen meet the recorded conditions.

## 5. Review and deliver

Review actual ORC changes and their required supporting files against the planned import, including existing destination content that could be affected.
Use the blast-radius skill when available, or directly trace shared components, styles, tokens, dependencies, and run the relevant checks.
Confirm original application files remain unchanged and account for any pre-existing or concurrent work separately.
Recheck the final candidate after repairs and record the saved ORC revision, source provenance, evidence, adaptations, and remaining limitations.
Deliver the verified ORC project and checkpoint so the user can start visual iteration.
If a prerequisite or required check remains blocked, report partial progress and the exact blocker without marking import complete.
Pass when the final saved project matches the verified import and every required checkpoint has current evidence.

## Example

Import an existing dashboard's selected section with its real component imports, CSS, assets, and declared initial data.
Discuss any service adaptation, compare the imported result, and verify a supported instance property and layout edit at their correct owners.
Undo/Redo, save, reopen, and deliver the editable ORC project with the recorded evidence.

---
name: orc-repo-sync
description: >-
  Integrates committed ORC design output into an existing application with codebase analysis, evidence checkpoints, real application verification, and a pull request targeting main.
  Use when a user requests transferring an ORC design into a repository, applying an ORC redesign, or verifying that an ORC export fits existing application logic.
---

# ORC repo sync

## Scope and prerequisites

Execute for an explicitly requested integration; a discussion or review request authorizes planning or reading only.
Identify the ORC project and applied revision, selected design scope, target repository, directory, and intended behavior changes.
Read the target's README, applicable AGENTS, package manifest or requirements, Makefile, and environment example when present, then follow relevant configuration and source.
Read ORC's current [export contract](../../doc_v1/import-export/export.md) and [integration plan](../../backlog/application-integration-skills.md) when available.
Locate working ORC read/export operations in the actual environment and confirm their output format.
If required operations are unavailable or instructions conflict, stop and report the blocked prerequisite before implementation.
Before repairing any failure, including a baseline failure, follow step 4 and obtain the user's agreement.
Verify that the target repository has `main`; a different branch needs explicit user agreement.

## Checkpoint record

Create one persistent checkpoint file in the task's report location before integration.
Record source project/revision and export fingerprint, target path, starting Git commit/status, branch, intended changes, and behavior to preserve.
For every step record pending, passed, failed, or blocked, its completion condition, and evidence paths or file/line citations.
For commands record the working directory, exact command, exit result, and log; for browser checks record environment, route, state, actions, expected result, and observed result.
Keep baseline failures, user repair agreements, changed files, final tested commit, limitations, and PR URL in this same record.
A required skipped or unavailable check stays blocked; mark completion only from current evidence.

## 1. Establish the baseline

Inspect Git status and preserve existing work in an isolated integration branch or worktree without resetting or overwriting user changes.
Read the selected source and trace imports, exports, callers, styles, tokens, routing, events, state, data contracts, and dependency/configuration paths relevant to the intended change.
Run the target's relevant existing checks and exercise the original affected user workflow in the actual application.
Capture relevant appearance and states with reproducible inputs and dimensions.
Pass when the starting state, dependency/caller map, existing failures, and behavior assertions are recorded with evidence.

## 2. Map the integration

Read the committed code export and its required styles, theme inputs, assets, and dependency records.
A selection snippet or copied draft is insufficient when required supporting files are missing.
Map exported values and files to existing owners, preserving component interfaces, handlers, services, and navigation unless their change is explicitly requested.
Use the target application's framework, package manager, runtime, compiler, and version constraints.
Explain any dependency, theme, provider, or behavioral adaptation before adopting it and obtain agreement for changes beyond the requested scope.
Pass when every planned changed file has an owner, reason, preserved behavior, and runnable verification condition.

## 3. Integrate the selected design

Apply the agreed presentation/source changes within the mapped scope and retain existing application logic.
For HTML/CSS or SVG, inspect selectors, DOM structure, scripts, and consuming templates; for React, inspect props, children, hooks, events, imports, and consumers.
Preserve required Tailwind inputs and Motion behavior when present rather than checking an unrelated static approximation.
Update manifests and lockfiles together only for dependencies required by the agreed integration.
If the ORC source revision or target assumptions changed, refresh the affected baseline and plan before continuing.
Pass when the integrated candidate matches the agreed file map and is ready for actual application checks.

## 4. Verify and discuss failures

Run the appropriate build, type checking, linting, and tests using the target's actual commands and installed toolchain.
Exercise the affected workflow in the running application, including relevant interactions, state changes, loading/error behavior, and intended layout sizes.
Compare appearance with the intended ORC design under equivalent inputs, fonts, styles, and dimensions, and inspect console/runtime errors.
Check relevant shared consumers outside the edited directory and add a focused regression check where existing coverage cannot establish the preserved behavior.
When a check fails, reproduce and investigate it, then report the failure, affected files/behavior, evidence, and proposed repair to the user.
Discuss the repair and wait for the user's agreement before applying it.
Record the agreement, apply that repair, and rerun the affected checks; a broader repair needs renewed discussion.
Keep required failed or blocked checks incomplete; retain unrelated baseline failures explicitly in the report.
Pass when every required integration assertion passes and no new relevant failure remains.

## 5. Review the final change

Review the complete task diff against `main`, including configuration, assets, manifests, lockfiles, and consumers affected indirectly.
Use the blast-radius skill when available, or perform its caller/dependency analysis and runnable verification directly.
Remove accidental task changes and account for every retained change without touching pre-existing user work.
Check for lost logic, interface changes, CSS leakage, unrelated rewrites, and unnecessary dependencies.
Recheck the final source after any agreed repair or later change; results from an earlier candidate cannot certify a new one.
Pass when the reviewed diff, tested source, preserved behavior assertions, and checkpoint evidence agree.

## 6. Deliver the pull request

Commit only task-owned changes, record the tested commit, and use `gh` to push the integration branch and open a PR targeting `main`.
Write a multiline PR body to a file and pass it through `--body-file`.
Include the concrete change, preserved application behavior, checkpoint path, verification results, baseline failures, and remaining limitations.
Confirm the PR's base and head commit, record its URL, and leave it open for user review without merging it.
If publishing is blocked, report the verified local result and missing step while leaving delivery incomplete.
Pass when the actual PR targets `main` and references the reviewed, verified commit and its evidence.

## Example

Apply an ORC dashboard redesign to `src/dashboard` while preserving the existing checkout action.
Trace the button's callers and handler, capture the baseline, integrate the agreed appearance, and exercise checkout in the actual application.
Discuss any failure before repair, rerun the affected checks, then deliver the verified change as a PR to `main`.

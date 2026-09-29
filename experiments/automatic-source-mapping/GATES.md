# Gates: Automatic source-mapping experiment

Scope: Prove automatic ownership discovery for a documented TSX subset in installed Google Chrome, preserve reviewable evidence, and file a separate PR.

- [x] G1: Literal text and static Tailwind owners are discovered and edits persist in source and rendering.
  EVIDENCE: evidence/fedora-chrome/report.json, both case 1 results and before/after source.
- [x] G2: Reused and aliased cross-file components resolve their usage props and shared styles with accurate scopes.
  EVIDENCE: both case 2/3 results and evidence/fedora-chrome/owners.json.
- [x] G3: Local keyed collections resolve one record before and after reordering.
  EVIDENCE: both case 4 results and same-selection ownership records.
- [x] G4: Unsupported ownership and stale or ambiguous selections reject edits without altering source, saved state, or history.
  EVIDENCE: both case 5/6b results, expectedRejections, and eight boundary controls.
- [x] G5: Formatting, unrelated insertion, Undo, reopen, invalid parsing, and crashing candidates exercise rebuilt mappings and atomic candidate commits.
  EVIDENCE: both case 6a, Undo, candidate rejection, and reopen results.
- [x] G6: A renamed and reordered variation passes the same browser checks without resolver-specific mappings.
  EVIDENCE: eleven variation results and fixtures/variation/.
- [x] G7: Only this is either safely proven or explicitly unsupported with rejection evidence.
  EVIDENCE: both Only this rejection results; README.md documents the copying limitation.
- [x] G8: Runnable source, lockfile, environment, commands, ownership records, diagnostics, and inspected screenshots are available in Git without generated bundles or dependencies.
  EVIDENCE: package-lock.json, evidence/fedora-chrome/, and REPORT.md visual inspection.
- [x] G9: The documented checks and diff review pass; the branch excludes PR 1 and the PR is open without merging.
  EVIDENCE: REPORT.md Diff review; branch based on origin/master; https://github.com/eren726290/orc-web/pull/2 targets master and remains unmerged.

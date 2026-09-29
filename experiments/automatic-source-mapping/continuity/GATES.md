# Gates: Selection continuity

Scope: Test retained browser selection in the inherited mapping experiment, preserve baseline/final evidence, and file PR 3 against master.
Dependency: PR 2 commit 2663a28aff8325e67e15a399ca321a365e1d9e18.

- [x] G1: Baseline uses an actual single Chrome click and records raw-token successes and failures before implementation changes.
  EVIDENCE: evidence/baseline/report.json and records.json; two collection passes and six lost-token failures, exit 1.
- [x] G2: Successive literal and instance text/size/weight edits retain one logical selection, including the renamed variation.
  EVIDENCE: evidence/fedora-chrome/report.json and records.json; fourteen workflows pass, exit 0.
- [x] G3: Keyed collection edits, reorder, Undo, and Redo preserve record identity and agree with saved source/rendered properties.
  EVIDENCE: basic and variation collection operations in evidence/fedora-chrome/records.json.
- [x] G4: Deletion and ambiguous replacement invalidate selection safely; Undo restoration behavior is asserted.
  EVIDENCE: basic and variation delete, ambiguous, and collision operations in evidence/fedora-chrome/records.json.
- [x] G5: The justified correction preserves candidate rejection safety and all inherited mapping checks.
  EVIDENCE: rejected-candidate operations plus evidence/mapping-regression/report.json; thirty existing checks pass, exit 0.
- [x] G6: Exact commands, versions, exit codes, source and selection/owner records, and full diagnostics are committed separately from inherited evidence.
  EVIDENCE: REPORT.md and evidence/ preserve distinct baseline, AST, historical setup failures, and final Chrome outcomes.
- [ ] G7: PR 3 is open against master with its inherited dependency and new commits identified; PR 1 and PR 2 remain unchanged and unmerged.
  EVIDENCE: PR.md prepared; successful Chrome evidence complete; publication pending.

# Gates: Selection continuity

Scope: Test retained browser selection in the inherited mapping experiment, preserve baseline/final evidence, and file PR 3 against master.
Dependency: PR 2 commit 2663a28aff8325e67e15a399ca321a365e1d9e18.

- [x] G1: Baseline uses an actual single Chrome click and records raw-token successes and failures before implementation changes.
  EVIDENCE: evidence/baseline/report.json and records.json; two collection passes and six lost-token failures, exit 1.
- [ ] G2: Successive literal and instance text/size/weight edits retain one logical selection, including the renamed variation.
  EVIDENCE: pending
- [ ] G3: Keyed collection edits, reorder, Undo, and Redo preserve record identity and agree with saved source/rendered properties.
  EVIDENCE: pending
- [ ] G4: Deletion and ambiguous replacement invalidate selection safely; Undo restoration behavior is asserted.
  EVIDENCE: pending
- [ ] G5: The justified correction preserves candidate rejection safety and all inherited mapping checks.
  EVIDENCE: pending
- [ ] G6: Exact commands, versions, exit codes, source and selection/owner records, and full diagnostics are committed separately from inherited evidence.
  EVIDENCE: pending
- [ ] G7: PR 3 is open against master with its inherited dependency and new commits identified; PR 1 and PR 2 remain unchanged and unmerged.
  EVIDENCE: pending

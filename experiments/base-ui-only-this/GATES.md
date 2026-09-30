# Gates: Real Base UI editing and Only this

OWNS: experiments/base-ui-only-this/**, experiments/automatic-source-mapping/browser.ts, experiments/automatic-source-mapping/resolver.ts, experiments/automatic-source-mapping/continuity/session.ts, plans/pr4-copy-boundary.md, plans/README.md

Scope: Verify the real CLI-installed Base UI dialog and a conservative cross-file independent copy, then open PR 4 against master.
Starting commit: c230345902e8b33d4d772916ce010a72fe8704d6 (unmerged PR 3, inheriting PR 2).

- [x] G1: Record CLI/runtime, registry provenance, isolated dependency versions, generated source, and the unmodified discovery baseline.
  EVIDENCE: evidence/provenance, evidence/baseline, package-lock.json, COMMANDS.md.
- [x] G2: Raw and instrumented real dialog interaction, styling, Escape, and focus return agree; supported local owners edit correctly and unsupported internals refuse.
  EVIDENCE: evidence/fedora-chrome/report.json, first four PASS workflows; evidence/parentheses-reproduction records the corrected defect.
- [x] G3: One selected usage becomes independent through a discovered cross-file boundary; props/imports/bindings survive; other instances, shared utilities, and packages stay shared.
  EVIDENCE: evidence/fedora-chrome/report.json, fifth PASS workflow; copy-before.json and after.json.
- [x] G4: Unsupported required bindings refuse before commit and preserve source, rendering, saved state, and history.
  EVIDENCE: evidence/fedora-chrome/report.json, ninth PASS workflow; parameter-shadow refusal in fifth workflow.
- [x] G5: Copy and edit are one Undo step; Undo/Redo, save/reopen, parse/build/synchronous render rejection, and post-edit interaction pass.
  EVIDENCE: evidence/fedora-chrome/report.json, sixth through eighth PASS workflows; browser-diagnostics.json and ownership-records.json.
- [x] G6: Existing mapping and continuity checks, static checks, diff review, visual inspection, and complete evidence/report are finished.
  EVIDENCE: evidence/regression, REPORT.md, final inspected before/after/reopened screenshots.
- [ ] G7: PR 4 is open against master with dependencies stated; PR 1/2/3 remain open at their original heads.
  EVIDENCE: pending

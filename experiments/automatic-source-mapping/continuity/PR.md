## Selection continuity experiment

Depends on unmerged PR 2 at **2663a28aff8325e67e15a399ca321a365e1d9e18**.
Targets **master** and keeps new work in separate commits.
PR 1 and PR 2 are unchanged and must remain open.

## Findings and current verification status

- Actual installed Google Chrome baseline: **2 passed, 6 failed**, exit 1.
- Keyed record editing/reorder already retained selection.
- Literal text, instance-prop, and style changes invalidated the original token in both source variations.
- No silent wrong-element edit was reproduced; stale selections were refused.
- The inherited experiment had no persistent selection transport or Redo.
- Added a proposed command-owned continuity bridge and minimal selection/history session.
- **AST-only verification passed:** six successive-edit scenarios, two structural-collision checks, eight inherited boundary controls.
- **Corrected Chrome verification remains blocked:** sandbox denies `setsockopt`, Chrome exits SIGTRAP before assertions.
- The existing mapping regression also failed at the same Chrome setup step.

This is not a completed browser validation and must not be represented as an ORC Properties panel pass.
Runnable checks cover successive editing from one click, instance/shared scope, keyed data reorder, Undo/Redo, deletion with restoration on Undo, ambiguous source replacement, command-created ambiguity, and rejected candidates.
The resolver's existing identity algorithm and existing APIs are unchanged; the new command carries exact AST-node lineage and rejects uncertain rendered bindings.
No fixture-specific mapping, authored editor IDs, new package, application implementation, Base UI integration, independent copying, or MCP work.

## Evidence and reproduction

See `experiments/automatic-source-mapping/continuity/REPORT.md` for full results, exact versions, commands, limits, and evidence links.
Baseline ownership/source snapshots, logs, inspected screenshots, AST records, and complete setup-failure diagnostics are committed separately from inherited PR 2 evidence.
Fedora 44 KDE Wayland x64, Chrome 154.0.8037.57, Bun 1.4.2.
Exact inherited dependency lockfile is unchanged.

```bash
cd experiments/automatic-source-mapping
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund
bun continuity/baseline.ts # Expected raw-token continuity failures
bun continuity/logic-check.ts
bun continuity/proof.ts   # Must pass in installed Chrome before claiming the correction verified
bun run proof            # Required mapping regression rerun
```

Do not merge until the two final Chrome commands can execute and their evidence is reviewed.
This bounded work does not prove arbitrary React compatibility or complete ORC-web correctness.

## Selection continuity experiment

Depends on unmerged PR 2 at **2663a28aff8325e67e15a399ca321a365e1d9e18**.
Targets **master** and keeps new work in separate commits.
PR 1 and PR 2 are unchanged and must remain open.

## Findings and verification

- Actual installed Google Chrome baseline: **2 passed, 6 failed**, exit 1.
- Keyed record editing/reorder already retained selection.
- Literal text, instance-prop, and style changes invalidated the original token in both source variations.
- No silent wrong-element edit was reproduced; stale selections were refused.
- The inherited experiment had no persistent selection transport or Redo.
- Added a command-owned continuity bridge and minimal selection/history session.
- **AST-only verification passed:** six successive-edit scenarios, two structural-collision checks, eight inherited boundary controls.
- **Final installed-Chrome verification: 14 passed, 0 failed, exit 0**, across both source variations.
- **Existing mapping regression: 30 passed, 0 failed, exit 0** (22 browser checks plus 8 AST boundary controls).
- Earlier browser/network setup failures are preserved as historical evidence and resolved after Codex restarted.

Chrome checks cover successive editing from one click, instance/shared scope, keyed data reorder, Undo/Redo, deletion with restoration on Undo, ambiguous source replacement, command-created ambiguity, and rejected candidates.
The same logical selection handle is retained; tests never replace it or click again after edits.
The resolver's existing identity algorithm and existing APIs are unchanged; the new command carries exact AST-node lineage and rejects uncertain rendered bindings.
No fixture-specific mapping, authored editor IDs, new package, application implementation, Base UI integration, independent copying, or MCP work.

## Evidence and reproduction

See the [full report](https://github.com/eren726290/orc-web/blob/codex/selection-continuity/experiments/automatic-source-mapping/continuity/REPORT.md) for results, exact versions, commands, limits, and evidence links.
Baseline and final ownership/source snapshots, logs, inspected screenshots, AST records, and complete historical setup-failure diagnostics are committed separately from inherited PR 2 evidence.
Fedora 44 KDE Wayland x64, Chrome 154.0.8037.57, Bun 1.4.2.
Exact inherited dependency lockfile is unchanged.

```bash
cd experiments/automatic-source-mapping
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund
bun continuity/baseline.ts # Expected raw-token continuity failures
bun continuity/logic-check.ts
bun continuity/proof.ts   # 14 workflows, installed Chrome channel only
bun run proof            # 30 existing mapping checks
```

The baseline reproduction is separate commit `5ab9c14`; subsequent commits add the bounded correction and final evidence.
Review only PR 3 work with `git diff 2663a28aff8325e67e15a399ca321a365e1d9e18..codex/selection-continuity`.
The master comparison inherits PR 2 changes because PR 2 is still unmerged.
Supported command edits now retain selection; arbitrary semantic source rewrites and indistinguishable replacements remain unsupported or unresolved.
Findings support continuing the bounded approach without a general identity redesign.
No dependency was added or upgraded.
This does not validate the ORC Properties panel, selection recovery across process restarts, arbitrary React compatibility, or complete ORC-web correctness.

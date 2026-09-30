# Base UI dialog editing and independent-copy proof

This experiment uses the actual Base UI-flavored shadcn dialog and button fetched by global shadcn 4.19.0.
Read [REPORT.md](REPORT.md) for findings, reproduced failures, ownership boundaries, and limitations.
The final Fedora Google Chrome run passed 9 workflows, and inherited mapping and continuity checks passed 30 and 14 checks respectively.

## Reproduce in the integrated checkout

PR 5 uses the root manifest and `bun.lock` for all experiments.
Historical manifests and npm lockfiles are preserved under `../integration/evidence/historical-dependencies/`.
Use Bun, Node 22 or later, and installed Google Chrome stable.
No shadcn acquisition or dependency symlink is needed.
From the repository root:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run proofs:existing
bun run proofs:integration
```

The existing runner expects 12 original assertions, 30 mapping checks, 14 continuity workflows, and 9 real-component workflows, all exit 0.
The new integration runner expects four bounded workflows, all exit 0.
New output goes into ignored `runs/` directories; original evidence remains historical.
See [the PR 5 report](../integration/REPORT.md) for dependency reconciliation, corrections, and unresolved limits.
Chrome launches through `channel: "chrome"` and never falls back to Chromium.

## Contents

- `src/components/ui/`: untouched CLI-generated real dialog and button.
- `src/AccountDialog.tsx` and `src/Detail.tsx`: ordinary authored composition and cross-file style owner.
- `src/UnsafeAccountDialog.tsx` and `src/UnsafeDetail.tsx`: captured-binding refusal control.
- `only-this.ts`: bounded copying from discovered ownership and local import edges.
- `styles.ts`: full Tailwind stylesheet compilation for this static fixture.
- `proof.ts`: browser workflows, source/selection records, recovery checks, and screenshots.
- `baseline.ts`: inherited minimal-renderer control, expected to fail without the real stylesheet.
- `evidence/`: provenance, original failures, final run, and inherited checks.

The implementation depends on unmerged PR 3 at `c230345902e8b33d4d772916ce010a72fe8704d6`, which includes PR 2.
Only PR 4's new commits are new work; its diff against master also contains that inherited work.

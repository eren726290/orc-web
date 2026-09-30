# Base UI dialog editing and independent-copy proof

This experiment uses the actual Base UI-flavored shadcn dialog and button fetched by global shadcn 4.19.0.
Read [REPORT.md](REPORT.md) for findings, reproduced failures, ownership boundaries, and limitations.
The final Fedora Google Chrome run passed 9 workflows, and inherited mapping and continuity checks passed 30 and 14 checks respectively.

## Reproduce

Use Bun, Node 22 or later, and installed Google Chrome stable.
The CLI is not needed to rerun the committed fixture.
Dependencies are isolated here and pinned by `package-lock.json`.
From the repository root:

```bash
cd experiments/base-ui-only-this
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund
cd ../automatic-source-mapping
```

If this fresh checkout has no `node_modules` entry in `experiments/automatic-source-mapping`, create the experiment-only dependency link:

```bash
ln -s ../base-ui-only-this/node_modules node_modules
```

An existing installation there should resolve the seven inherited dependencies at the versions in this experiment's manifest.
Do not replace an existing dependency directory automatically.
The recorded runs used the symlink so the runtime and fixture resolve the same React installation.
Then:

```bash
cd ../base-ui-only-this
bun proof.ts
cd ../automatic-source-mapping
bun proof.ts
bun continuity/proof.ts
```

Expected exit codes are 0.
Expected summaries are `ALL 9 CHECKS PASSED`, `RESULT 30 passed, 0 failed`, and `CONTINUITY 14 passed, 0 failed`.
New output goes into ignored `runs/` directories.
The preserved baseline and final output under `evidence/` remain distinguishable.
Chrome is launched with `channel: "chrome"`; launch failures are errors.

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

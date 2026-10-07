# Recorded installation and execution commands

The original acquisition directory was `/home/eren/D/orc-web-pr4/experiments/base-ui-only-this`.
The active checkout after the restricted-sandbox interruption was `/tmp/orc-web-pr4-active`.
The final clean locked installation and Chrome proof ran in `/tmp/orc-pr4-clean/experiments/base-ui-only-this`.
The command sources are identical in the active checkout and clean reproduction directory.

## Global CLI acquisition

`components.json` sets `base-nova`, `rsc: false`, Lucide, `src/styles.css`, and `@/* -> src/*`.
These commands used the preinstalled global CLI, not a new project CLI dependency:

```bash
shadcn_node=/home/eren/.nvm/versions/node/v24.19.0/bin/node
shadcn_cli=/home/eren/.nvm/versions/node/v24.19.0/lib/node_modules/shadcn/dist/index.js
"$shadcn_node" "$shadcn_cli" --version
"$shadcn_node" "$shadcn_cli" docs dialog
"$shadcn_node" "$shadcn_cli" search @shadcn -q dialog
"$shadcn_node" "$shadcn_cli" info --json > evidence/provenance/cli-info.json
"$shadcn_node" "$shadcn_cli" view @shadcn/dialog > evidence/provenance/dialog-registry.json
"$shadcn_node" "$shadcn_cli" view @shadcn/button > evidence/provenance/button-registry.json
"$shadcn_node" "$shadcn_cli" add @shadcn/dialog --dry-run
"$shadcn_node" "$shadcn_cli" add @shadcn/dialog --yes
```

The last command generated the committed dialog/button and installed `cn`.
It exited 0.
Missing imports were inspected before this isolated install, which also pins the CLI-added dependency:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --save-exact --ignore-scripts --no-audit --no-fund @base-ui/react@1.8.0 lucide-react@1.48.0 class-variance-authority@0.7.1 cn@0.4.0 @tailwindcss/node@4.3.3 tw-animate-css@1.4.0
```

It added 28 packages and exited 0.
The inherited seven direct dependencies remain at their original exact versions.

## Baseline and correction

From `experiments/automatic-source-mapping`, before changing its renderer:

```bash
bun ../base-ui-only-this/baseline.ts
```

Captured run: `baseline-2026-09-29T22-22-25-335Z`, exit 1, 1 PASS and 3 FAIL.
After adding real stylesheet compilation, the strict raw/instrumented text comparison reproduced literal `()` output before its correction:

```bash
cd ../base-ui-only-this
bun proof.ts
```

Captured failure: `chrome-2026-09-30T00-49-33-052Z`, exit 1.
The full diagnostics and screenshots are preserved separately from final evidence.

## Final clean installation and checks

The committed manifests, authored/generated component source, proof, and inherited runtime modules were copied into an empty isolated reproduction directory.
The inherited modules resolved the same dependency tree through `../base-ui-only-this/node_modules`.
From that clean proof directory:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund
bun proof.ts
```

Both exited 0.
Final Chrome run: `chrome-2026-09-30T00-55-09-683Z`, 9 PASS and 0 FAIL.
No bundled browser was installed or used.
The browser launches through `chromium.launch({ channel: "chrome", headless: true })`.

From the active checkout's `experiments/automatic-source-mapping`:

```bash
bun proof.ts
bun continuity/proof.ts
```

Post-correction runs: `2026-09-30T00-51-18-584Z` and `continuity-final-2026-09-30T00-51-19-540Z`.
Both exited 0, with 30 and 14 passed checks respectively.

Static checks used the installed original-checkout Oxlint and Oxfmt binaries from `/home/eren/D/orc-web/node_modules/.bin`.
Oxlint checked the proof TypeScript and touched inherited modules; Oxfmt checked those modules and authored fixture TSX.
The untouched CLI-generated TSX is deliberately excluded from formatter writes.
Exact invocations, output, and exit codes are in `evidence/regression/static-checks.log`.
`git diff --check` also passed.

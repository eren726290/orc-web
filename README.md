# ORC-web

The [V1 specifications](doc_v1/README.md) describe the planned editor.
This branch integrates architecture experiments from PRs 1–4; it does not implement the application.
Read the [PR 5 report](experiments/integration/REPORT.md) for measured results and remaining limits.

## Reproduce

Use Bun 1.4.2, Node 22 or later, and installed Google Chrome stable on Fedora.

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
bun run proofs:existing
bun run proofs:integration
bun run check:source-types
```

The four existing proofs and the new integration workflows use the root installation and Chrome channel.
No global package CLI or dependency symlink is required.
`check:source-types` checks the integration and PR 4 source with dependency declaration checking skipped.
`bun run check:types` also checks dependency declarations and currently fails on seven missing internal declarations in the pinned Tailwind Node compiler package.
That limitation is recorded in the report; the full typecheck is not claimed to pass.

All dependencies have exact direct versions and a committed Bun lockfile.
Generated bundles, new runs, browser binaries, and `node_modules` are not committed.

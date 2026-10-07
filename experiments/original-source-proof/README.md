# Preserved original source-editing proof

The fixture and runner were copied from the preserved PR 1 verification directory, not recreated.
[provenance.json](provenance.json) records original paths and hashes.
The fixture is byte-identical to the supplied mobile original.
The executable runner differs only by `channel: "chrome"` in Playwright launch.
The original mobile files and report, and the earlier Fedora files and evidence, remain distinguishable under `evidence/mobile-original/` and `evidence/fedora-original/`.
Their package manifests and npm locks are historical inputs; the integrated root Bun installation runs this proof.

From the repository root:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run proofs:existing
```

The runner records output, exit code, report, final source, saved design, and screenshots in the integration run's original-proof directory.
Its historical assertion names and limitation labels still mention Chromium/Debian; the actual launch channel and browser version identify Fedora Google Chrome for new runs.
The twelve assertions are unchanged.

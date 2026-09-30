# Integrated dependency setup

[PR 5's report](../experiments/integration/REPORT.md) records the integration, dependency decisions, and measured outcomes.
One root manifest, `bun.lock`, and local `node_modules` serve the application dependency setup and all four experiments.
Historical PR manifests and imports are inventoried in [inventory.json](inventory.json).
Historical experiment lockfiles are retained as evidence, not active competing installation instructions.

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
```

[check.mjs](check.mjs) verifies exact versions, historical and actual source imports, compiler paths, one React installation, and actual Tailwind stylesheet import compilation.
[resolution.json](resolution.json) records this checkout's paths and versions.
[react-tree.txt](react-tree.txt) records React/Motion deduplication.
Motion and its relevant transitive packages retain the original proof's 13.4.4-era versions.
The historical application declared Motion 13.4.6; that version is not presented as tested here.
The project shadcn CLI was removed because the fixture source is already committed.
Global shadcn 4.19.0 was inspected for provenance and is not used by reproduction.

The initial JavaScript resolution probe incorrectly treated tw-animate-css as JavaScript.
The checker now verifies its style-only exports through real Tailwind compilation.
All experiment sources are present here; generated-entry resolution probes represent the directories that their builders create.
The real Chrome runs verify their combined runtime behavior.
Full third-party declaration checking remains unresolved for @tailwindcss/node 4.3.3, separately from dependency installation and browser behavior.

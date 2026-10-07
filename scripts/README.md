# Scaffold checks

Run checks from the repository root with the scripts in `package.json`.
`check-tooling.ts` verifies exact installed pins, vendored source hashes, and positive and negative controls through the real Oxlint CLI.
The isolated linter controls cover plugin loading and enforcement that browser workflows cannot exercise.
`check-browser.ts` opens the development page and production preview, checks React mounting and styles, and captures repeatable evidence.
Build first with `bun run build`.
The default browser check requires installed Google Chrome.
The explicit Chromium check is a scaffold smoke check and does not certify the supported Chrome target.
Generated evidence goes to ignored `artifacts/scaffold/`.

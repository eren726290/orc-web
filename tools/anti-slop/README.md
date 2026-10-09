# Selected anti-slop rules

Vendored from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop/tree/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b) under MIT.
Upstream revision: `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`.
Only chained assertions, reducer accumulator copying, assertion justifications, and the shared array helper are copied.
The upstream files are unmodified; `index.ts` is the local registration of these selected rules.
`provenance.json` records upstream paths and SHA-256 hashes.
Review updates before copying them, and keep `@oxlint/plugins` at the exact installed Oxlint version.

The CLI controls in `scripts/tooling/check-tooling.ts` accept valid code and reject known violations through the real installed Oxlint binary.
These isolated checks are justified because browser workflows do not exercise linter configuration or plugin loading.
The plugin is development tooling and is not imported by the application.

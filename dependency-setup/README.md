# Fresh-checkout dependency setup

This setup starts at default-branch commit `8b2158b3c84ad5fec59aa0e39ce5c8e3cda76cf1` on `codex/fresh-default-20260930`.
The checkout is `/home/eren/D/orc-web-fresh-20260930`.
GitHub still identifies `master` as the default branch.

## Arrangement

One root `package.json`, `bun.lock`, and local `node_modules` serve the application and experiments.
Experiment source placed below this root uses normal ancestor module resolution.
No dependency links to earlier checkouts or global package resolution are needed.
The fetched PR refs are inspection references; their source and historical evidence have not been merged or copied into this branch.

[inventory.json](inventory.json) records the exact inspected heads of PRs 1–4, every tracked package manifest, and imported package specifiers with source paths and line numbers.
PR 1 tracks its application manifest and verification report, but not its original runnable proof or proof lockfile.
Its report records Motion 13.4.4; the supplied original proof also requires Babel parser, Recast, React, React DOM, Tailwind, and Playwright, all declared here.
PR 3 inherits PR 2's manifest without adding packages.
PR 4 adds the real component's Base UI, class-variance-authority, cn, Lucide, tw-animate-css, and Tailwind Node compiler imports.
The current default branch has no application source or manifest to upgrade.

The root manifest retains PR 1's application/tool versions except Motion.
Motion is pinned to the original proof's 13.4.4 rather than the application's 13.4.6.
Overrides pin framer-motion 13.4.4, motion-dom 13.4.4, and motion-utils 13.3.0 to prevent their ranges selecting newer versions.
This is not a claim that the original proof's entire mobile lockfile has been reproduced.
Other transitive dependencies are locked by the new `bun.lock`.
TypeScript 7.0.2 and Bun, Node, React, and React DOM type packages are explicitly local.
shadcn 4.21.0 is retained from the application manifest; PR 4's historical global CLI was 4.19.0 and is not needed to rerun its generated fixture.
No new component acquisition was performed.
No candidate-only packages such as Zustand or Vitest were added.

## Commands and results

Commands ran with Bun 1.4.2, Node 22.23.2, and npm 10.9.8.

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 bun install --frozen-lockfile
bun run check:dependencies
npm ls react react-dom motion framer-motion motion-dom motion-utils --all
./node_modules/.bin/tsc --version
./node_modules/.bin/oxlint --deny-warnings dependency-setup/check.mjs
./node_modules/.bin/oxfmt --check dependency-setup/check.mjs package.json
```

Installation and frozen-lock verification succeeded with exit 0.
The dependency check verifies all 28 direct packages and three overridden Motion dependencies at exact versions.
It checks 74 JavaScript import contexts from PR source and compiles the discovered stylesheet imports using the real Tailwind Node compiler.
The compiler resolves Tailwind and tw-animate-css inside this checkout.
The fixture, generated-entry, instrumentation, and original-proof resolution contexts all resolve the same React, JSX runtime, and React DOM files.
React DOM itself resolves that same React installation.
[resolution.json](resolution.json) records actual absolute paths and versions.
[react-tree.txt](react-tree.txt) shows the installed React dependency tree and deduplication.

The initial checker rejected tw-animate-css using Node's JavaScript resolver because that package exports only a `style` condition.
The checker now uses actual Tailwind compilation for CSS imports.
This was a checker correction, not a dependency or proof failure.

## Limits

Resolution contexts model the earlier source paths; the experiment sources are not present on this fresh default-branch checkout.
This setup verifies installed dependency ownership, not the browser proofs, application behavior, or TypeScript source correctness.
The earlier TypeScript 7 configuration issue remains a separate source/configuration task.
No browser binaries were installed, no earlier PR was modified, and no commit or PR was created by this setup.

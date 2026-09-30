# Automatic React source ownership experiment

This is a runnable architecture experiment, separate from ORC-web application code and PR 1.
The branch starts at `origin/master` commit `8b2158b3c84ad5fec59aa0e39ce5c8e3cda76cf1` and needs no PR 1 merge.
The remote has `master` and no `main`, so this PR targets `master` without changing the default branch.

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

## What is discovered

Babel parses ordinary authored TSX and Recast preserves and edits its syntax tree.
The resolver discovers local function declarations, import/export symbols, static JSX values, literal usage props, and keyed local collection records.
An analysis pass generates structural element and usage identities without fixture names, displayed text, positions, or manually authored IDs.
The generated build wraps component usages in React context and intrinsic elements in a helper that emits ordinary HTML with generated selection attributes.
There are no additional DOM wrapper elements.
Generated imports, wrappers, selection attributes, and metadata are kept out of saved authored source.
The test harness uses heading text as its browser click oracle; the resolver receives only generated node, usage, and record identities.

| Selection | Discovered owner | Reported scope |
| --- | --- | --- |
| Single literal JSX child | JSX text or string expression | This element, or the owning shared component |
| Destructured prop expression | Literal prop at the selected component usage | This instance |
| Static `className` | Implementation's complete literal string | Every component instance, or this element |
| Local mapped record field | Array declaration, key field, literal key, and string field | This item |
| Calculated/external-shaped text | No supported source owner | Edit source, with reason |

Each supported command runs selection → discovered owner → source edit → candidate parse/build/render → saved source/history commit.
Rejected commands leave applied source, revision, saved file, history, and rendered heading state unchanged.
Undo and reopening rebuild mappings from authored sources.

## Supported syntax subset

- Top-level named function declarations with direct JSX returns, including named/default exports.
- Intrinsic JSX elements containing one nonempty JSX text child or one string expression.
- Complete static `className` strings, including expression-wrapped string literals.
- Plain object-destructured string props, including a local destructured name, supplied by one identifiable usage with a literal string attribute.
- Local named/default imports whose target function is directly exported from the implementation file.
- Relative local module paths and one-target alias patterns supplied from the fixture's `tsconfig.json` paths.
- Module-level `const` arrays of literal objects, a single expression-bodied `.map(record => <element key={record.key}>...)`, and a direct `{record.field}` string child.
- Unique literal string or numeric record keys, checked for React's string-coerced key collisions.
- Formatting and unrelated declaration insertion that preserve the selected JSX's semantic shape.

The collection resolver rejects mutation, shadowed array declarations, and unrecognized references instead of assuming data-flow safety.
The text resolver rejects nested callable/block scopes, reassigned prop variables, spread overrides, ambiguous identical usages, and ambiguous identical elements.
The eight boundary controls in [boundaries.ts](boundaries.ts) include a positive prop control and seven explicit rejection controls.

## Identity and limitations

An identity hashes the module path, owning function symbol, and canonical JSX subtree, excluding formatting, locations, and comments.
Collections additionally carry the discovered React record key, so reordering data does not use an array position.
Duplicate structural identities are invalidated rather than disambiguated by index.
Semantic edits to an element or usage can change its identity; the editor must reselect after such edits.
File/function renames and arbitrary structural rewrites do not have persistent selection guarantees.
Identical semantic replacement cannot reveal the author's intent from source alone.
This is a conservative identity experiment, not a persistent object identity design.

Only this independent-component copying is unsupported.
The experiment discovers its shared binding, then rejects the operation without cloning a fixture-specific function.
Safe copying across imports, closures, exports, and nested usages needs a separate symbol-aware experiment before offering that command.

Calculated strings, external-shaped input, computed classes, mixed JSX children, mutable data, forwarded/computed props, nested scopes, re-exports, memo/HOC wrappers, and arbitrary React syntax are outside the proven subset.
Imported library components and their internal DOM are not mapped by this experiment.
The instrumentation is not certified for refs, portals, hydration, animation behavior, arbitrary event semantics, or all React identity/lifecycle behavior.
Candidate validation exercises synchronous initial rendering; it does not prove safety against later asynchronous errors or arbitrary side effects.
The synthetic Tailwind theme checks typography and preservation of variant tokens, not an imported application's complete design system.
The experiment does not validate complete ORC-web correctness, arbitrary React compatibility, Motion animation correctness, MCP design, or Windows support.

## Dependencies and checks

All application and experiment packages resolve from the root installation.
`ast-types@0.16.3` remains explicitly declared for checked Recast nodes and builders.
Motion is not imported by these mapping fixtures.
Run the root-local Oxlint and Oxfmt commands recorded in the [PR 5 report](../integration/REPORT.md).
The earlier report and evidence retain their historical versions and commands.

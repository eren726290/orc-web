# PR 4 ownership and copying assessment

Status: Bounded experiment plan, evaluated against c230345902e8b33d4d772916ce010a72fe8704d6.
The `improve` skill is used for this source ownership assessment only.
Implementation is separately authorized by the PR 4 task and stays inside the experiment.

## Existing evidence and intent

`experiments/automatic-source-mapping/resolver.ts` discovers local function symbols, usage chains, and static host values but has no independent-copy operation.
`experiments/automatic-source-mapping/continuity/session.ts` already prepares candidates before persistence and stores source/selection snapshots for Undo and Redo.
`doc_v1/interface/react-components.md` requires Only this plus the requested edit to form one Undo step.
`experiments/base-ui-only-this/evidence/baseline/report.json` reproduces missing real stylesheet compilation and blocked content clicks.
This renderer limitation does not justify changing the component implementation.

## Boundary decision

Discover the selected host owner and its selected local usage chain from the existing analysis.
Copy the outer selected local function and the local function path to the style owner, into their existing modules under collision-free names.
Redirect only the selected outer usage and the copied internal references on that path.
Imports to unchanged local shadcn components, imported utility functions, third-party packages, and CSS tokens remain shared.
Generated portal scopes are runtime context; they are not evidence that the portal primitive owns an authored child value.
Do not recursively copy every import or vendor Base UI.

Support only named, directly exported top-level function declarations with one direct JSX return, plain destructured parameters, and import-backed free references.
Reject captured module bindings, nested closures, namespace imports on a copied edge, re-exports, duplicate bindings, and paths that cannot be identified uniquely.
Do not claim support for cyclic or arbitrary module graphs.
Check binding requirements before constructing or committing a copy.
This is deliberately narrower than arbitrary React/module copying.

## Implementation and verification order

1. Preserve raw/instrumented real component controls, registry provenance, original source, exact packages, and the existing baseline failure.
2. Extend the renderer with optional real styles, raw control, runtime location, and a browser activation probe; preserve defaults for old experiments.
3. Add the bounded copy operation under `experiments/base-ui-only-this` and expose one session method to commit its sources/selection together.
4. Verify instance text, shared style, cross-file independent nested style, collision avoidance, preserved props/imports, normal dialog interaction, and unsupported bindings.
5. Verify Undo/Redo, save/reopen, and parse/build/synchronous render failure without changing applied state.
6. Run `bun proof.ts` from the new experiment and both `bun proof.ts` and `bun continuity/proof.ts` from the inherited experiment.
7. Inspect screenshots and diff, record failures and remaining limits, then open PR 4 against master with the exact PR 3 dependency.

The only inherited source changes are renderer options, an instrumentation-off control, and an atomic session application method.
Application code, specifications, MCP, package dependencies of the application, and earlier PR branches are outside the allowed change set.
No general architecture refactor is justified by the current evidence.

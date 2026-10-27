# Pen geometry and solver adapter

This domain owns ORC pen geometry, directed circular arcs, independent guards, deterministic SVG output, strict portable records and the typed editing-time solver boundary.
It does not own native CSS layout or application history.
Application integration validates complete source, outer attributes, placement and dependent layout writes atomically.
The [Pen contract](../../doc_v1/interface/pen-tool.md) owns the accepted scope.

`model.ts`, `record.ts` and `validation.ts` define record version 1, path-local stable identities, connected topology, complete arc centers/sweeps and supported rules.
Coordinates are finite doubles strictly inside magnitude 1e9.
Geometric tolerance is 1e-6 and segments at or below length 1e-9 refuse.
The guards reject collapsed segments, invalid circles, sweeps beyond a half circle, unsatisfied rules and reversed tangent traversal.
`source.ts` emits shortest round-trip SVG numbers and verifies reconstructed circles independently of the fingerprint.
`bounds.ts`, `viewport.ts` and `artwork.ts` validate analytic extrema, round stroke bounds and public viewBox containment.
Flow editing preserves the frozen viewport origin and refuses growth left or above it.
`source-compatibility.ts` recognizes only the supported parsed single-path structure and equivalent numeric geometry.

`drawing.ts` owns snap priority, tangent construction, explicit fallback and exact closure.
`deletion.ts` removes affected segments/rules and preserves unchanged complete arcs and identities.
`candidate.ts` projects complete pen/style/insert writes and validates the resulting document.
`solver-input.ts`, `solver-response.ts` and `solver.ts` keep the own format separate from the pinned upstream exchange and independently guard every numerical result.
`continuation.ts` subdivides outstanding motion and retains the entire last valid path on refusal.
Its pure next/accept/refuse steps also support asynchronous Worker solving in the editor.
The synchronous numerical diagnostic helper retains its count/time allowance, which cannot preempt an individual WASM call.
Essential handles and auxiliary guides belong to the editor rather than saved geometry.
The [performance record](../../backlog/pen-integration.md#measured-solver-blocker) records the Worker comparison and retained large-path preview latency.

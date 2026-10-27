# Isolated pen solver checks

This group owns the pinned WASM rebuild, numerical adapter checks, and standalone Chrome loading checks.
It does not certify actual ORC drawing or development/built application asset loading.
Those workflows belong to the later editor pen E2E suite.

Numerical checks are isolated because exact residuals, arc direction, tiny encoded segments, degenerate solver successes, and complete rollback cannot reliably be established from screenshots alone.
Retain build inputs, raw logs, hashes, runtime versions, failures, and success results under ignored `artifacts/pen-solver/`.

Run `bun run check:pen-solver` for the ordinary committed-binary checks.
Set `ORC_CHROME_EXECUTABLE` when Chrome is installed somewhere other than the current evidence environment.
`check-provenance.ts` separately checks the retained fresh native suite logs and ignored upstream build inputs; it requires the audit artifacts from this rebuild.
The native baseline ran the ordinary upstream suite, with 216 passed, zero failed, and three ignored tests.
The wrapper's two native checks cover contradictory fixed geometry rollback and invalid references/nonfinite inputs.
These checks do not replace actual ORC development and built application E2E coverage.

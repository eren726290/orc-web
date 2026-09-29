# From experiments/automatic-source-mapping, before the sandbox changed:
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund
set -o pipefail
bun continuity/baseline.ts 2>&1 | tee runs/pr3-baseline-console.log
baseline_exit=${PIPESTATUS[0]}
printf '%s\n' "$baseline_exit" > runs/pr3-baseline-exit.txt
# Baseline exit: 1, from six continuity assertion failures and two passing collection workflows.

# AST verification in the writable /tmp copy after permissions changed:
bun continuity/logic-check.ts 2>&1 | tee runs/pr3-logic-console.log
logic_exit=${PIPESTATUS[0]}
printf '%s\n' "$logic_exit" > runs/pr3-logic-exit.txt
# AST exit: 0. This is not browser validation.

# Post-correction Chrome attempts, both blocked at browser launch:
bun continuity/proof.ts > runs/pr3-final-console.log 2>&1
final_exit=$?
printf '%s\n' "$final_exit" > runs/pr3-final-exit.txt
bun run proof > runs/pr3-regression-console.log 2>&1
regression_exit=$?
printf '%s\n' "$regression_exit" > runs/pr3-regression-exit.txt
# Both browser exits: 1, setup failure. No Chromium fallback.

/home/eren/D/orc-web/node_modules/.bin/oxfmt --check resolver.ts continuity/*.ts
/home/eren/D/orc-web/node_modules/.bin/oxlint resolver.ts continuity/*.ts
git diff --cached --check

# From /tmp/orc-web-pr3-selection after committing the prepared changes:
git push origin codex/selection-continuity
# Exit 128: Could not resolve host: github.com. No PR was created.

# Successful retry after Codex restart, from experiments/automatic-source-mapping:
set -o pipefail
bun continuity/proof.ts 2>&1 | tee runs/pr3-retry-console.log
retry_exit=${PIPESTATUS[0]}
printf '%s\n' "$retry_exit" > runs/pr3-retry-exit.txt
# Exit 0: 14 continuity workflows pass on installed Google Chrome.
bun run proof 2>&1 | tee runs/pr3-retry-mapping-console.log
mapping_retry_exit=${PIPESTATUS[0]}
printf '%s\n' "$mapping_retry_exit" > runs/pr3-retry-mapping-exit.txt
# Exit 0: 30 inherited mapping checks pass.
# Evidence copied from continuity-final-2026-09-29T21-59-45-435Z and 2026-09-29T21-59-57-895Z.

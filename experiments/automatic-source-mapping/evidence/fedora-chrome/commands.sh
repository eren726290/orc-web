# Commands executed on the Fedora PC; run from experiments/automatic-source-mapping.
# Initial installation (lockfile creation).
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --ignore-scripts --no-audit --no-fund
# Clean lockfile reproduction.
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund > runs/reproduction-install.log 2>&1
install_exit=$?
printf '%s\n' "$install_exit" > runs/reproduction-install-exit.txt
# Proof execution with complete combined output and the proof's exit status.
set -o pipefail
bun run proof 2>&1 | tee runs/reproduction-console.log
proof_exit=${PIPESTATUS[0]}
printf '%s\n' "$proof_exit" > runs/reproduction-exit-code.txt
# Existing lint and formatting tools; no package upgrade.
/home/eren/D/orc-web/node_modules/.bin/oxfmt --check resolver.ts browser.ts runtime.tsx boundaries.ts proof.ts
/home/eren/D/orc-web/node_modules/.bin/oxlint resolver.ts browser.ts runtime.tsx boundaries.ts proof.ts
# Staged diff review at the worktree root.
git diff --cached --check
# Fallow's review guide and judgment round-trip are retained under ignored review-tmp/.
# These pipelines were run from /home/eren/D/orc-web-pr2.
git diff --cached --relative=experiments/automatic-source-mapping | /home/eren/D/ORC/node_modules/.bin/fallow review --root experiments/automatic-source-mapping --diff-stdin --no-cache --walkthrough-guide --format json > experiments/automatic-source-mapping/review-tmp/guide.json
git diff --cached --relative=experiments/automatic-source-mapping | /home/eren/D/ORC/node_modules/.bin/fallow review --root experiments/automatic-source-mapping --diff-stdin --no-cache --walkthrough-file experiments/automatic-source-mapping/review-tmp/judgment.json --format json > experiments/automatic-source-mapping/review-tmp/validated.json

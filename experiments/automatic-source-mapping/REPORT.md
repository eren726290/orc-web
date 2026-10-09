# Fedora Google Chrome mapping results

## Conclusion

The final run passed 30 checks with exit code 0: 22 Chrome integration checks across two source variations and eight resolver boundary controls.
All six required cases passed within the documented syntax subset.
Only this is unsupported, and its refusal is tested rather than counted as successful component copying.
The findings support continuing with conservative Babel/Recast ownership discovery and explicit Edit source fallbacks.
They do not establish arbitrary React compatibility or complete ORC-web correctness.

## Environment and installation

| Tool/package | Scope and path | Actual version |
| --- | --- | --- |
| Fedora | Host KDE Plasma Desktop Edition, x86_64 | 44 |
| KDE Plasma | Host Wayland session, `plasmashell` | 6.7.5 |
| Bun | `/home/eren/.bun/bin/bun` | 1.4.2 |
| Node | `/home/eren/.nvm/versions/node/v22.23.2/bin/node` | 22.23.2 |
| npm | Same Node installation, `bin/npm` | 10.9.8 |
| Chrome stable | `/usr/bin/google-chrome-stable`, Playwright Chrome channel | 154.0.8037.57 |
| Babel parser | Experiment-local `node_modules/@babel/parser` | 7.29.9 |
| Recast | Experiment-local `node_modules/recast` | 0.24.0 |
| ast-types | Experiment-local `node_modules/ast-types` | 0.16.3 |
| React / React DOM | Experiment-local `node_modules` | 19.3.0 / 19.3.0 |
| Tailwind | Experiment-local `node_modules/tailwindcss` | 4.3.3 |
| Playwright | Experiment-local `node_modules/playwright` | 1.63.0 |
| Oxlint / Oxfmt | Existing application tool binaries used for static checks | 1.86.0 / 0.71.0 |
| Fallow | Existing `/home/eren/D/ORC/node_modules/.bin/fallow` | 3.10.0 |

The additional direct dependency, ast-types, was inventoried as installed version 0.16.3 before declaration.
It exposes Recast's node checks/builders without relying on an undeclared transitive import.
No application dependencies, product specifications, default branch, or MCP configuration changed.
There is no code or merge dependency on PR 1, and PR 1 was not rechecked for this task.

Initial installation used `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --ignore-scripts --no-audit --no-fund` in this experiment directory.
Reproduction then used the committed lockfile with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund`, followed by `bun run proof`.
Both dependency installation and proof execution returned exit code 0.
The exact captured shell commands are in [commands.sh](evidence/fedora-chrome/commands.sh).
The reproduction run directory was `runs/2026-09-29T20-30-26-158Z`.
The reported UTC date comes from this PC's clock.

## Cases and evidence

| Case | Both variations | What was asserted |
| --- | --- | --- |
| Literal content | PASS | Discovered literal and static class owners; saved special characters literally; rendered heading changes from 36px to 48px |
| Reused component | PASS | Selected usage's title alone changes; shared class owner reports shared scope and changes both instances |
| Cross-file component | PASS | Alias path and renamed import resolve; usage prop edits caller only; shared class edits implementation only; unrelated export survives |
| Local collection | PASS | Discovered record/key/string field; one item changes; the same selection edits the same key after reversing the array |
| Unsupported ownership | PASS | Calculated and external-shaped values report Edit source; refusals preserve source, saved state, revision, history, and view; static styling remains usable |
| Source changes | PASS | Reformat and unrelated declaration insertion preserve working selection; structural duplication explicitly invalidates old mapping; Undo restores it |
| Integration | PASS | Undo restores source/render; save/reopen rebuilds prop and record owners; malformed source and crashing candidates preserve applied state |
| Only this | UNSUPPORTED | Shared owner is discovered; copying is refused with atomic state-preservation checks |
| Boundary controls | 8 PASS | Positive literal prop, nested scope shadows, spread override, duplicate usage, array shadow, coerced key collision, collection mutation |

The second fixture changes component names, prop names, module paths, literal text, declaration order, record names, and numeric rather than string keys.
The resolver contains no fixture configuration or display-text lookup.

- [Machine report and complete expected rejection diagnostics](evidence/fedora-chrome/report.json)
- [Selected-element-to-owner records](evidence/fedora-chrome/owners.json)
- [Every candidate's console/build/page-error diagnostics](evidence/fedora-chrome/browser-diagnostics.json)
- [Complete execution output](evidence/fedora-chrome/console.log) and [exit code](evidence/fedora-chrome/exit-code.txt)
- [Clean dependency installation output](evidence/fedora-chrome/install.log)
- [Basic before source](evidence/fedora-chrome/basic/before/src/App.tsx), [after source](evidence/fedora-chrome/basic/after/src/App.tsx), and [implementation edit](evidence/fedora-chrome/basic/after/src/ui/Promo.tsx)
- [Variation before source](evidence/fedora-chrome/variation/before/src/Landing.tsx), [after source](evidence/fedora-chrome/variation/after/src/Landing.tsx), and [implementation edit](evidence/fedora-chrome/variation/after/src/panels/Feature.tsx)

## Visual inspection

All six before, after, and reopened screenshots were inspected.
Both fixtures show readable system fonts, expected typography changes, separate unchanged sibling text, and reordered records.
The special-character heading renders quotes, angle brackets, braces, and a colored seedling emoji without missing-glyph boxes.
The edited screenshots show the retained hover underline on the selected heading; reopened screenshots show its ordinary pointer state.
Heading text, computed size/weight, classes, and record order are asserted equal after reopen; pixel equality across pointer states is not asserted.

| Fixture | Before | After | Reopened |
| --- | --- | --- | --- |
| Basic | [PNG](evidence/fedora-chrome/basic/before.png) | [PNG](evidence/fedora-chrome/basic/after.png) | [PNG](evidence/fedora-chrome/basic/reopened.png) |
| Renamed variation | [PNG](evidence/fedora-chrome/variation/before.png) | [PNG](evidence/fedora-chrome/variation/after.png) | [PNG](evidence/fedora-chrome/variation/reopened.png) |

## Failures and remaining questions

The first development run recorded 18 passes and two harness failures when checking the malformed-source diagnostic.
Babel rejected the malformed source correctly, but Bun's stack string omitted the error message, so the diagnostic did not match the unchanged assertion.
The harness now captures error name, message, and stack; the assertion was not weakened.
The original failure report and candidate diagnostics are preserved separately in [development-failure](evidence/development-failure/report.json).
This was a proof-harness failure, with no observed dependency compatibility or Chrome setup failure.
The final clean-install run has zero failing checks.

Persistent identity across arbitrary source changes and safe independent component copying remain unresolved architecture work.
The evidence shows conservative supported-pattern mapping works; it does not justify guessing mappings for unsupported syntax.
Next, evaluate lexical symbol/data-flow analysis and persistent identity reconciliation on representative imported components before expanding the supported subset.
Safe cross-file copying needs closure/import/export analysis before Only this can be offered.
The full limitations and supported syntax are in [README.md](README.md).

## Diff review

Oxlint, Oxfmt's implementation-file check, and `git diff --cached --check` passed.
Manual review covered resolver ownership, conservative rejection, generated metadata separation, candidate-state sequencing, lockfile versions, and evidence exclusions.
Fallow's guide reported no structural decisions; three changed-region judgments were accepted with zero stale or unanchored rejections.
The guide deprioritized 12 files, which were still reviewed as fixture/evidence inputs.
Fallow emitted missing-node_modules warnings during its analysis, so its graph review is supplementary evidence rather than a dependency-resolution certificate.
The clean npm installation and actual Chrome execution establish the recorded dependency resolution and bounded runtime result.
Persistent identity and Only this remain explicit architecture questions for later review.

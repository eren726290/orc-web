# Gates: PR 5 focused follow-up

OWNS: package.json, bun.lock, patches/**, README.md, dependency-setup/**, experiments/integration/**, experiments/automatic-source-mapping/resolver.ts, experiments/automatic-source-mapping/continuity/session.ts

- [x] F1: The original full declaration failure and same-tree TS6/TS7 comparison are preserved, and the justified correction passes full checking.
  CHECK: bun run check:types
  EXPECT: tsc --noEmit
  EVIDENCE: automatic-evidence=v1; definition-sha256=c67e38a4ec70bf6e467d26582dde15950cb1e48354e828c335ff276dad510b92; exit=0; EXPECT=matched; output-sha256=07c87a886e905de8c98886f52da588e3b23ef90cb02e794aca38305136e8a098; output-bytes=91; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=fc5a54d96b0c/20 entries

- [x] F2: Initially identical usages retain the second instance through repeated edits, Undo/Redo, and reopening, with a real initial Chrome click.
  CHECK: bun experiments/integration/identical-instances.ts
  EXPECT: IDENTICAL INSTANCES PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=a6344655ed97a04ed9c3210c09d810563ef654aa5fdf47544ab3fdb73df01831; exit=0; EXPECT=matched; output-sha256=d3f770cf8366479f5ca5974ab07635ae215cfc379fbda331c9c3522907de43e7; output-bytes=128; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=fc5a54d96b0c/20 entries

- [x] F3: Affected inherited suites and existing integration checks pass with their assertions intact.
  CHECK: node experiments/integration/verify-followup.mjs
  EXPECT: FOLLOWUP EVIDENCE VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=c1bdcdaf02a594105a4532a97c0c6e08ccaeb0c5ed5404aec0f897bcf0cb04f0; exit=0; EXPECT=matched; output-sha256=3586a5887b78a605b9bf96012321372000ceda4334a8bc3c4be61b718c97fdd7; output-bytes=149; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=fc5a54d96b0c/20 entries

- [x] F4: The report, exact diagnostics, source-owner records, screenshots, and final diff are reviewed; updates are pushed to PR5 and PRs 1–4 remain unchanged.
  EVIDENCE: manual: reviewed the focused diff and unchanged inherited assertions; inspected before/after Unicode screenshots; verified full and scoped checks, frozen patch installation, and affected regression evidence; pushed to existing PR5, updated its description, and checked earlier PR heads remain open and unchanged.

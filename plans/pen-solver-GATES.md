# Gates: guarded pen solver candidate

Scope: rebuild the pinned solver and prove the isolated adapter's numerical, rollback, isolation, and browser-loading behavior before production integration.

- [x] P1A: The fresh pinned native suite and official compiler target have retained identities and passing evidence.
  CHECK: bun scripts/solver/check-provenance.ts
  EXPECT: PEN_SOLVER_PROVENANCE_VERIFIED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=0dd0f6d7195fa89ed5c4cfb50da8f2dccc577814f6b5486440b336dde7407b43; exit=0; EXPECT=matched; output-sha256=e2b5e9411e8f529d8616e129f6a3b41892dbfa62b694ac7731876325caa0cb85; output-bytes=31; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

- [x] P1B: The guarded adapter passes its numerical and rejection matrix in Bun with independent geometry controls.
  CHECK: bun scripts/solver/check-solver.ts
  EXPECT: PEN_SOLVER_BUN_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=6cc1025c244e44e86019698a8b78766f27985243f571333f476fd632b00235f8; exit=0; EXPECT=matched; output-sha256=1ad2eb97bff31bdf23012cfc667a838e068dcf6d1481a4fbfd14a1f8165142a5; output-bytes=32; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

- [x] P1C: A real Chrome fixture loads the same binary and passes the adapter and native SVG checks.
  CHECK: bun scripts/solver/check-browser.ts
  EXPECT: PEN_SOLVER_CHROME_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=f1eca548d1037c4e77045073760ad11ea9b0f84f7cd300152b22d2baf5fac025; exit=0; EXPECT=matched; output-sha256=a5d579c176b1fd95306aa765bc1e778cd0e0e16e321bfb02af21e00f16ba3d1b; output-bytes=25; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

- [x] P1D: The new source passes required static checks without weakening existing limits.
  CHECK: bun run check:types && bun run lint && bun run check:format && printf 'PEN_SOLVER_STATIC_PASSED\n'
  EXPECT: PEN_SOLVER_STATIC_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=39a4ae8614c200af24b0c58993cad7fa9de3d461656dbf2d4ad1a8ce347ad014; exit=0; EXPECT=matched; output-sha256=c53f8c9fa8bb91d1707a99e408511fd734e5f640a4adec72db2b934b29599d4d; output-bytes=392; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

- [x] P1E: Exact shipped dependency licenses and source provenance are recorded, with no application integration claim.
  EVIDENCE: Reviewed solver/pen/licenses.json against all 14 registry entries in the pinned Cargo.lock; selected MIT and mandatory Unicode notices, SolidCraft MIT, conservative font OFL and official Rust standard-library notices are retained. build.json records the pinned compiler, source hashes, release flags, 683058 bytes, SHA-256 38e22d058eb04b6e57b69bee4152b474aa90053b2b7e6e9b587d7a32e96a766a and zero imports. Ordinary suite 216/0/3 and wrapper suite 2/0/0 retained under artifacts/pen-solver. Bun and standalone Chrome passed 13 numerical groups; Chrome additionally passed five independent native SVG checks. This is an isolated adapter candidate, not application integration evidence.

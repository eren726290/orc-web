# Gates: PR 5 integrated verification

OWNS: package.json, bun.lock, .gitignore, dependency-setup/**, experiments/**

Scope: Integrate earlier proofs, verify checkout-local dependencies, investigate three remaining boundaries, preserve evidence, and publish PR 5 without changing earlier PRs.

- [x] G1: Exact PR ancestry and original proof provenance are recorded.
  CHECK: node experiments/integration/verify-evidence.mjs
  EXPECT: EVIDENCE VERIFIED:
  EVIDENCE: automatic-evidence=v1; definition-sha256=0479e6c417eb38431b4308a5fc09c7937f6a28c027e30f00ea51bcc99f5227c4; exit=0; EXPECT=matched; output-sha256=69f371f5e52621361068582be1eea99501a07299472b3ef81af85e3f42be797c; output-bytes=159; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=b0b464a6532c/24 entries

- [x] G2: Frozen installation and all actual experiment imports resolve inside this checkout with one React installation.
  CHECK: bun run check:dependencies
  EXPECT: PASS:
  EVIDENCE: automatic-evidence=v1; definition-sha256=ba260f1177135cc7c9f5a948ba5f5a18c8e69f0b8953fe1b83fd6ebb5ac4b81a; exit=0; EXPECT=matched; output-sha256=1c3d0e0908343835c0453cf4121c64535385fc6b57d31f9c3456bafdfbffffc1; output-bytes=165; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=b0b464a6532c/24 entries

- [x] G3: The four existing proofs pass in the combined environment with their assertions retained.
  CHECK: node experiments/integration/verify-evidence.mjs
  EXPECT: EVIDENCE VERIFIED:
  EVIDENCE: automatic-evidence=v1; definition-sha256=0479e6c417eb38431b4308a5fc09c7937f6a28c027e30f00ea51bcc99f5227c4; exit=0; EXPECT=matched; output-sha256=69f371f5e52621361068582be1eea99501a07299472b3ef81af85e3f42be797c; output-bytes=159; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=b0b464a6532c/24 entries

- [x] G4: Show content, identical usages, and copying continuity have measured baselines and final outcomes.
  CHECK: node experiments/integration/verify-evidence.mjs
  EXPECT: EVIDENCE VERIFIED:
  EVIDENCE: automatic-evidence=v1; definition-sha256=0479e6c417eb38431b4308a5fc09c7937f6a28c027e30f00ea51bcc99f5227c4; exit=0; EXPECT=matched; output-sha256=69f371f5e52621361068582be1eea99501a07299472b3ef81af85e3f42be797c; output-bytes=159; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=b0b464a6532c/24 entries

- [x] G5: Fresh installation reproduces the documented checks without old checkouts or global packages.
  CHECK: node experiments/integration/verify-evidence.mjs
  EXPECT: EVIDENCE VERIFIED:
  EVIDENCE: automatic-evidence=v1; definition-sha256=0479e6c417eb38431b4308a5fc09c7937f6a28c027e30f00ea51bcc99f5227c4; exit=0; EXPECT=matched; output-sha256=69f371f5e52621361068582be1eea99501a07299472b3ef81af85e3f42be797c; output-bytes=159; shell=/bin/sh; cwd=/home/eren/D/orc-web-fresh-20260930; path=b0b464a6532c/24 entries

- [x] G6: Diff, evidence, screenshots, and limitations are reviewed and PR 5 is open against master.
  EVIDENCE: manual: reviewed implementation diff, preserved assertions and generated component source, verified fresh Chrome results, visually inspected modal/Unicode screenshots, and checked https://github.com/eren726290/orc-web/pull/5 is open against master with PRs 1–4 open at unchanged heads.

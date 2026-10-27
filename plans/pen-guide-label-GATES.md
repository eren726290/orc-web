# Gates: Pen guide label readability

OWNS: src/editor/pen/**, scripts/e2e/editor/pen/**, plans/pen-guide-label-*.md, plans/pen-progress.md, backlog/pen-integration.md

Scope: keep all representative Pen annotations legible and associated with their geometry without changing document data, essential handles or guide preference behavior.

- [x] G1: The retained P crowding is reproduced in the real editor and the new rendered-bounds assertion fails before application changes.
  EVIDENCE: artifacts/pen-guide-readability/before.log and before/development-failure.png, development-trace.zip and result.json preserve the observed short-line/arc collision and original application source identity.

- [x] G3: Required static, tooling, health, codebase and built application checks pass against the final source checkpoint.
  CHECK: python3 artifacts/pen-guide-readability/run-checks.py static
  EXPECT: GUIDE_STATIC_PASSED
  CWD: ..
  EVIDENCE: automatic-evidence=v1; definition-sha256=245acb69e0aa63ff2d3299a2f283c01fd15dc5b410e8c3ef69ae78ba76421d14; exit=0; EXPECT=matched; output-sha256=f7b4397909eba8b85acc2107aa81ce31bf91ed3ee7d240be43adfda7f9886444; output-bytes=1161; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=d50c603aa92a/24 entries

- [x] G4: The full Pen workflow suite preserves existing correctness.
  CHECK: python3 artifacts/pen-guide-readability/run-checks.py pen
  EXPECT: GUIDE_PEN_PASSED
  CWD: ..
  EVIDENCE: automatic-evidence=v1; definition-sha256=968ed61b2e920f76351866cd637ebb6a7741c9a789ad6b7a5440553e66aa6c0d; exit=0; EXPECT=matched; output-sha256=c8c80596480ae680ed001dd556a1bddedc994dc14019d072f6c90868b63110a3; output-bytes=157; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=d50c603aa92a/24 entries

- [x] G6: Separate performance observations quantify browser work without concurrent owned checks.
  CHECK: python3 artifacts/pen-guide-readability/run-checks.py performance
  EXPECT: GUIDE_PERFORMANCE_PASSED
  CWD: ..
  EVIDENCE: automatic-evidence=v1; definition-sha256=7a28fce87ae2611b6ebf309d35ba58f5c2fc71ade9559d65f51b258093b7adf7; exit=0; EXPECT=matched; output-sha256=2fbd29a25957e38747b40f39caf0cdd2ae3ccb7861aa6ecd5e63f55fd0e5386d; output-bytes=196; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=d50c603aa92a/24 entries

- [ ] G5: Current screenshots are inspected, historical evidence is preserved, the main checkout is unchanged and unrelated dirty source is intact.
  EVIDENCE: Current bowl, stem, edge and nested screenshots inspected; scope-review.json verifies unchanged main and unrelated Pen files; historical Pen traces/screenshots/manifests preserved. The original standalone tooling summary was overwritten before archival and its bytes were not recovered.

- [x] G2: Draft, selection, edges, zoom, nested transforms, scrolling and stable pointer scenes retain readable labels and true geometry.
  CHECK: python3 artifacts/pen-guide-readability/verify-evidence.py
  EXPECT: GUIDE_EVIDENCE_PASSED
  CWD: ..
  EVIDENCE: automatic-evidence=v1; definition-sha256=e3835aba6e59b3fc613659a8b85a3fabaa7e5e2fd29a8f17f1796ef3d2f7b163; exit=0; EXPECT=matched; output-sha256=ca68b4d52709e36490072f5898fd541c94595b32a348bcc7e012d9632724a10d; output-bytes=92; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=d50c603aa92a/24 entries


ABANDON: G5 The old artifacts/scaffold/tooling.json summary was overwritten before backup; an external backup is needed to restore its original timestamp and bytes. All correctness commands pass and historical Pen screenshots, traces and manifests are preserved; see pen-guide-label-report.md.

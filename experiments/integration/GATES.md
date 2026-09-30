# Gates: PR 5 integrated verification

OWNS: package.json, bun.lock, .gitignore, dependency-setup/**, experiments/**

Scope: Integrate earlier proofs, verify checkout-local dependencies, investigate three remaining boundaries, preserve evidence, and publish PR 5 without changing earlier PRs.

- [ ] G1: Exact PR ancestry and original proof provenance are recorded.
  EVIDENCE: pending

- [ ] G2: Frozen installation and all actual experiment imports resolve inside this checkout with one React installation.
  CHECK: bun run check:dependencies
  EXPECT: PASS:
  EVIDENCE: pending

- [ ] G3: The four existing proofs pass in the combined environment with their assertions retained.
  EVIDENCE: pending

- [ ] G4: Show content, identical usages, and copying continuity have measured baselines and final outcomes.
  EVIDENCE: pending

- [ ] G5: Fresh installation reproduces the documented checks without old checkouts or global packages.
  EVIDENCE: pending

- [ ] G6: Diff, evidence, screenshots, and limitations are reviewed and PR 5 is open against master.
  EVIDENCE: pending

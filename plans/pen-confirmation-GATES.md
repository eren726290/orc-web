# Gates: local pen solver confirmation

Scope: clarify proposed contracts, rebuild the pinned sketch solver, execute geometric checks in Bun and Chrome, and preserve ORC files outside plans.

- [x] G1: proposed contracts clarify the reviewed boundaries and identify remaining production adoption decisions
  EVIDENCE: Manually reviewed pen-contract-clarifications.md and pen-wasm-confirmation.md on 2026-10-25 against the original proposal, current source, and measured counterexamples. Complete arcs, directed joins, source eligibility, atomic writes, precision, coordinates and keyboard ownership are explicit. Production adoption and transformed Flex proof remain explicitly separate.

- [x] G2: the pinned source builds a verifiable WASM binary with recorded compiler and dependency identities
  CHECK: python3 /tmp/orc-pen-confirmation-hlZWca/verify-build.py
  EXPECT: PINNED_WASM_BUILD_VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=3b021e35a0fdd1c19b60a5090c87a0320324a15fd6fc90e92b9412596863fef4; exit=0; EXPECT=matched; output-sha256=14d458cf648a2395a9cd9b030319fbab304f41714b4728763ffd113c9e1c396c; output-bytes=95; shell=/bin/sh; cwd=/tmp/orc-pen-confirmation-hlZWca; path=3c2c725de257/22 entries

- [x] G3: Bun executes the rebuilt binary and passes asserted geometric cases and negative controls
  CHECK: bun /tmp/orc-pen-confirmation-hlZWca/check.mjs bun
  EXPECT: PEN_CONFIRMATION_PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=d0eb4a52f7fd8c2258ed8400e1e4e9aef595583ed2c5e6bfb3340dabc23f64b9; exit=0; EXPECT=matched; output-sha256=351e6482085dacfe2404d7c147b458ed3d4df3c8195530a246b9629bb17fecd5; output-bytes=1687; shell=/bin/sh; cwd=/tmp/orc-pen-confirmation-hlZWca; path=3c2c725de257/22 entries

- [x] G4: Chrome loads the same binary over HTTP and passes the same geometry assertions
  CHECK: bun /tmp/orc-pen-confirmation-hlZWca/check.mjs chrome
  EXPECT: CHROME_CONFIRMATION_PASS
  EVIDENCE: automatic-evidence=v1; definition-sha256=2a1b28215ee8fb1b557eb1234e58db15c6d8a43519ae77ab4a036abebfa5bd05; exit=0; EXPECT=matched; output-sha256=735f7c0a69cdcebc50c6aa3860f07a6f7a0c76594ed5b1586b18b8f023ac9850; output-bytes=3268; shell=/bin/sh; cwd=/tmp/orc-pen-confirmation-hlZWca; path=3c2c725de257/22 entries

- [x] G5: all inventoried ORC files outside plans remain unchanged
  CHECK: python3 /tmp/orc-pen-confirmation-hlZWca/repo-guard.py check
  EXPECT: ORC_SCOPE_UNCHANGED
  EVIDENCE: automatic-evidence=v1; definition-sha256=2f7bc413a1e63693bce1b9286b558bfcbf93f36bd74248faedad8b092e959060; exit=0; EXPECT=matched; output-sha256=9f7076aa7084268477fcecf0dbe14a5b2fda80d59f46861c0b539f9030f36e22; output-bytes=24; shell=/bin/sh; cwd=/tmp/orc-pen-confirmation-hlZWca; path=3c2c725de257/22 entries

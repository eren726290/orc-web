# Gates: portable pen data and atomic commands

Scope: strict portable record parsing, source/outer-attribute agreement, and one existing command/history/save boundary.
Native editor candidate mounting and Fill preparation remain a required subsequent P2 slice.

- [x] P2A: Strict record parsing rejects unsupported versions, malformed geometry, mismatched SVG, and stale outer bounds without accepting partial metadata.
  CHECK: bun scripts/e2e/editor/pen/check-record.ts
  EXPECT: PEN_RECORD_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb6b4d1d76380fe50114546296c7f8c8c0c329c5517fb1434ab319e7b3d15ecc; exit=0; EXPECT=matched; output-sha256=2f0ff113953adf17b0608ceb46606f1bb3d04cbaa7e8902deaa00826c8401daa; output-bytes=28; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

- [x] P2B: Real project commands publish one consistent geometry edit, retain exact history and saved IDs, and reject malformed, stale, reused or locked commands without any project changes.
  CHECK: bun scripts/e2e/editor/pen/check-commands.ts
  EXPECT: PEN_COMMANDS_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=007329ab78917cbd84dff576c24b49b153b0dc55aa38a3857d8b4e2b8394d6a7; exit=0; EXPECT=matched; output-sha256=d6b082f18f89fbdb7f3d1e17765be5bf20a411c3db3b834dc8ad1e70e4857c11; output-bytes=29; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

- [x] P2C: Data and command changes pass required static checks and production build.
  CHECK: bun run check:types && bun run lint && bun run check:format && bun run build && printf 'PEN_DATA_STATIC_PASSED\n'
  EXPECT: PEN_DATA_STATIC_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=0afc2d23ced1ef773e7204a1be7a0726d0236c561e4d8ee6f160ef9d282db21a; exit=0; EXPECT=matched; output-sha256=d3d90db657e67a2e1e76d4366f305e68b06b93a8a6aad99a8c32f83286ee504a; output-bytes=912; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=cf565079b7c0/24 entries

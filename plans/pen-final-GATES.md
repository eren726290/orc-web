# Gates: Pen integration checkpoint

Scope: current-source verification and review of the approved bounded Pen extension.
The measured performance remedy uses the unchanged pinned solver in a disposable Worker under the owner's existing implementation authority.
Earlier ledgers record staged checkpoints; this ledger owns final source verification.

- [x] P6A: Current source passes strict compilers, lint, formatting, build, tooling and reviewed full Fallow analysis.
  CHECK: bun run check:types && bun run lint && bun run check:format && bun run build && bun run check:tooling && bun run check:ts7 && bunx --no-install fallow dead-code --format json --quiet --explain --output-file artifacts/pen-final-dead-code.json && bunx --no-install fallow health --format json --quiet --explain --output-file artifacts/pen-final-health.json && printf 'PEN_FINAL_STATIC_PASSED\n'
  EXPECT: PEN_FINAL_STATIC_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=7131a4e3d6fc10b19ee5e40bb9ab31f7aa5b9f83c33d87e347c594da7a49cb33; exit=0; EXPECT=matched; output-sha256=eac19dbef9a40a188caa2e1943a9351efa6ed08af02171b6b3d9c1dbf623bf75; output-bytes=1512; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=f29bb29d703e/24 entries

- [x] P6B: Strict pen records, actual command/bundle boundaries and the pinned numerical/browser adapter retain their required behavior.
  CHECK: bun run check:pen-data && bun run check:pen-solver && bun run check:pen-provenance && printf 'PEN_FINAL_DATA_SOLVER_PASSED\n'
  EXPECT: PEN_FINAL_DATA_SOLVER_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=9833591fd0baf585d31f76b8890b5d8a43add9a399a56e9461ed8cdfdd090ee8; exit=0; EXPECT=matched; output-sha256=34dd833edf1ed1a1762d8b66cfc60601ebd3dccfcef4b6c716a37d07ba2ce812; output-bytes=385; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=f29bb29d703e/24 entries

- [x] P6C: The current human drawing, mapping, source, transform, lifecycle, refusal and numerical interaction workflows pass in their declared application modes.
  CHECK: bun run check:pen
  EXPECT: PEN_DRAWING_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=ae148fc0891a2c82f5c023e8d4ee772cc607e8c34c6179057c708595cabcd1f1; exit=0; EXPECT=matched; output-sha256=240f863f7458e1702ecff1e3bb1afae701882ee37e054461178855751736baa6; output-bytes=593; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=f29bb29d703e/24 entries

- [x] P6D: Existing affected command, storage, rendering, input, history and native layout workflows retain their declared behavior.
  CHECK: bun run check:atomic chrome && bun run check:bundle chrome && bun run check:rendering chrome && bun run check:boundaries chrome && bun run check:history chrome && bun run check:deletion chrome && bun run check:preview chrome && bun run check:movement chrome && bun run check:layout chrome && bun run check:padding chrome && bun run check:gap chrome && bun run check:alignment chrome && bun run check:participation chrome && bun run check:sizing chrome && bun run check:nested-placement chrome && bun run check:intrinsic-sizing chrome && bun run check:editor chrome && bun run check:saving chrome && printf 'PEN_FINAL_REGRESSIONS_PASSED\n'
  EXPECT: PEN_FINAL_REGRESSIONS_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=e20b64c1ce56342b258b0b1a23b8538d018d090da43ba91e1797b4c959144f03; exit=0; EXPECT=matched; output-sha256=10c39af13164e3a0c435aaf032a862812f9295a8e399e79a67678490a199f4d0; output-bytes=1505; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=f29bb29d703e/24 entries

- [x] P6E: Complete pointer work and distinct pointer-to-frame latency have current source-bound observations on representative sizes.
  CHECK: bun run check:pen-performance
  EXPECT: PEN_PERFORMANCE_PASSED
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=cdd51f854c536d126e23cd858a47daa7249e51ec9a1115ad7f89a27a5dee6573; exit=0; EXPECT=matched; output-sha256=c589ad971e0eda369bea14c8979932851a0811bcbf677745238579341a3d1e67; output-bytes=81; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=f29bb29d703e/24 entries

- [x] P6F: The measured synchronous large-path solver blocker has an approved remedy and new evidence satisfying the agreed interaction.
  EVIDENCE: reviewed pen-worker-plan.md, current source-matched performance/lifecycle results and pen-final-report.md; the unchanged module runs in one disposable Worker per gesture, stale replies cannot publish and release commits only the last complete native candidate. Production 402-anchor complete preview is 326.3 ms median / 351.7 ms p95, while pointer-to-second-frame latency is 16.6 / 20.5 ms. Genuine pending return/Escape/Undo/release preserve the applied document and command count in both modes. Later Worker-close events and remaining preview lag are reported separately; no universal latency threshold is claimed.

- [x] P6G: The acceptance matrix, shared-file conflict review, exact source/binary/runtime identities and remaining dependencies are recorded without claiming unfinished behavior complete.
  EVIDENCE: pen-acceptance.md maps all 40 rows, with 39 covered and X2 dependent on missing product exporters. pen-integration-review.md and artifacts/pen-integration/main-overlap-final.json retain nine shared-file overlaps and current native-ownership dependencies. final-manifest.json matches 32 result files against 251 current source files and records 17 additional source/build inputs, eight built files, the pinned binary and actual runtimes. Combined source SHA-256 is d93e8a210e24eb8a804b6bebaf0c32cc153eb53c84516985f25d98d8d237d961. pen-final-report.md retains exact commands, browser/mode qualifications, performance limits and unfinished product/integration work; the main checkout remains untouched.

- [x] P6H: Existing panel resizing, cancellation, keyboard limits, project view state and native percentage selection geometry retain their normal development/built behavior after the Properties scroll correction.
  CHECK: bun run check:panels
  EXPECT: workspace panels passed
  CWD: .
  EVIDENCE: automatic-evidence=v1; definition-sha256=b1264cd6dac2dd429c01e63891e4004ac509d7ef840f9ecb2f4f3a450e070ca4; exit=0; EXPECT=matched; output-sha256=f1236541163e3a68e5a3b9fdc795df49262234becced3a4e0b0ef89051acc40c; output-bytes=66; shell=/bin/sh; cwd=/home/eren/D/orc-web-pen; path=f29bb29d703e/24 entries

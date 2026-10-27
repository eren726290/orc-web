# Gates: Pen mapping and artwork

Scope: proportional native SVG mapping, rotation and transform-origin compensation, compatible source edits, and the approved artwork controls.

- [ ] P4A: Proportional rotated paths retain unchanged-anchor screen coordinates during committed and cancelled edits in both application modes.
  CHECK: bun scripts/e2e/editor/pen/check-layout.ts chrome
  EXPECT: PEN_LAYOUT_PASSED
  CWD: .
  EVIDENCE: pending

- [ ] P4B: Compatible source/paint edits retain identities and rules; incompatible source detaches visibly and supported stroke edits preserve valid bounds.
  CHECK: bun scripts/e2e/editor/pen/check-source.ts chrome
  EXPECT: PEN_SOURCE_PASSED
  CWD: .
  EVIDENCE: pending

- [ ] P4C: Mapping and artwork code passes strict type, lint and format checks.
  CHECK: bun run check:types && bun run lint && bun run check:format && printf 'PEN_MAPPING_STATIC_PASSED\n'
  EXPECT: PEN_MAPPING_STATIC_PASSED
  CWD: .
  EVIDENCE: pending

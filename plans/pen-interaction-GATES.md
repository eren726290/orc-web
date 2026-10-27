# Gates: complete Pen interactions

Scope: local drawing rules, exact closure, open-path continuation, anchor deletion, guide preferences and drag continuation/lifecycle.

- [ ] P5A: Actual editor workflows preserve node identity on continuation, remove the intended anchor/segments/rules, refuse protected deletion, and keep guides in view state only.
  CHECK: bun scripts/e2e/editor/pen/check-editor.ts chrome
  EXPECT: PEN_EDITOR_PASSED
  CWD: .
  EVIDENCE: pending

- [ ] P5B: Numerical drawing/deletion controls cover both directions, caps, closure, snap priority, Shift/Alt and directed guarded continuation.
  CHECK: bun scripts/e2e/editor/pen/check-interactions.ts
  EXPECT: PEN_INTERACTIONS_PASSED
  CWD: .
  EVIDENCE: pending

- [ ] P5C: Complete pointer work has retained observations and bounded outstanding-motion behavior on representative path sizes.
  CHECK: bun scripts/e2e/editor/pen/check-performance.ts chrome
  EXPECT: PEN_PERFORMANCE_PASSED
  CWD: .
  EVIDENCE: pending

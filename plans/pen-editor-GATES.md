# Gates: first human Pen workflow

Scope: complete native previews, Pen lines and tangent arcs, guarded anchor dragging, cancellation, one-command history, persistence and actual application WASM loading.
P4/P5 source compatibility, full snap/delete/guide behavior and bounded transform/artwork controls remain later milestones.

- [ ] P3A: The first Pen path is created through the toolbar and keyboard in the actual development and built editor, preserving source/record/native agreement and one-command history.
  CHECK: bun scripts/e2e/editor/pen/check-editor.ts chrome
  EXPECT: PEN_EDITOR_PASSED
  CWD: .
  EVIDENCE: pending

- [ ] P3B: Root/Free and supported flow candidates mount complete native SVG and required Fill writes; rejection, cancellation and acknowledgement cannot restore stale fields.
  CHECK: bun scripts/e2e/editor/pen/check-layout.ts chrome
  EXPECT: PEN_LAYOUT_PASSED
  CWD: .
  EVIDENCE: pending

- [ ] P3C: All pen source passes static checks, a production build, and the existing atomic command regression.
  CHECK: bun run check:types && bun run lint && bun run check:format && bun run build && bun scripts/e2e/editor/check-atomic.ts chrome && printf 'PEN_EDITOR_STATIC_PASSED\n'
  EXPECT: PEN_EDITOR_STATIC_PASSED
  CWD: .
  EVIDENCE: pending

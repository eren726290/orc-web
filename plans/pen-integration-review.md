# Pen integration review

This branch remains an independent working tree at `53b2951229627d6be9d0b950237226de186a3d82` plus its uncommitted Pen changes.
The main checkout at `/home/eren/D/orc-web` was read only.
No commit, push, merge, rebase or PR was performed.
The initial overlap snapshot is `artifacts/pen-integration/main-overlap.json`, with the reviewed main-side patch beside it.
The refreshed final snapshot and patch are `artifacts/pen-integration/main-overlap-final.json` and `main-overlap-final.patch`.
The snapshot is a point-in-time review because main has concurrent uncommitted frame-label, corner-radius and Constraints work.

## Shared-file overlaps

| Shared file | Integration requirement |
| --- | --- |
| `src/editor/canvas/Canvas.tsx` | Compose the Pen hooks/overlay/input handlers with main's FrameLabels and ConstraintIndicators; retain existing selection, drop and Gap overlays. |
| `src/editor/properties/Properties.tsx` | Retain main's fixed selected-name header, scrolling property-content, ConstraintControls, CornerRadiusControls and position-ownership readout while adding own-Pen controls. |
| `src/app/styles.css` | The same Properties scroll/header correction is now adopted in this branch; retain it with the narrowly scoped native SVG paint reset correction. |
| `src/editor/properties/README.md` | Combine independent ownership/control documentation with the Pen size-readout and scrolling-form notes. |
| `package.json` | Add the Pen check/build aliases alongside main's frame-label/corner-radius/Constraints aliases; dependencies remain unchanged. |
| `doc_v1/architecture/canonical-document-model.md` | Keep main's frame-label/Still view ownership notes alongside the optional Pen-record contract. |
| `IMPLEMENTATION_STATUS.md` | Retain all independent checkpoints and qualify Pen scope, current evidence and large-path latency. |
| `backlog/README.md` | Retain independent frame/Constraints topics and the Pen integration boundary link. |
| `scripts/e2e/editor/README.md` | Retain all independent check documentation and add the Pen suite link. |

The Pen branch now reuses main's fixed-header/scrolling-content layout and supplies its own bounded read-only Fixed size readout under rotation.
Main also changes native sizing, position, flow/Free placement and property-ownership helpers used indirectly by Pen.
The final refresh adds an active-editor argument to `useLayoutOwnership`, resolves the current rendered object on each invalidation and retains read-only PropertyField input identity while measured values change.
Compose the corresponding Properties call with that active-editor contract and preserve those ordinary readout/focus changes when integrating the Pen controls.
The reviewed Center projection uses a recognized individual percentage translation; Both uses automatic dimensions with opposing insets.
Pen currently refuses individual transforms, incompatible Free placement and nonproportional/non-Fixed dimensions before reshaping or resizing.
Those refusals must remain visible rather than flattening Constraints into Left/Top or Fixed sizing during integration.
The actual combined checkout has not been built or tested by this task.
After integration, rerun the Pen suite, existing affected native-layout checks and main's Constraints, corner-radius and frame-label checks.

## Suggested bounded composition order

1. Preserve and settle main's independent ordinary controls and native ownership changes.
2. Bring over the portable Pen model, strict parser/command/source changes, pinned adapter/build inputs and ordinary own-Pen SVG data tests.
3. Compose the small shared Canvas, Workspace, Properties and rendering hooks manually, keeping both sets of controls and native guards.
4. Run current-source static checks, the complete human Pen suite, affected existing regressions and the main-side new feature checks.
5. Measure performance separately with no competing owned browser/tooling runs and review every acceptance row.

This order is a handoff recommendation, not an instruction to perform a merge under the present authorization.
The dependency licenses and exact reproducible binary identity live under `solver/pen/`.
SolidCraft is the adopted external numerical implementation; tangent construction uses direct own geometry without another library.
The [acceptance map](pen-acceptance.md), [Worker correction](pen-worker-plan.md) and [integration ledger](pen-final-GATES.md) define completion evidence and retained limitations.

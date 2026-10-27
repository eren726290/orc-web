# Pen agent handoff

Prepared by the main ORC-web agent on 2026-10-25.
Status: implementation handoff with explicit open adoption decisions.
Reviewed baseline: `53b2951229627d6be9d0b950237226de186a3d82`, `feat: support nested and intrinsic Column Fill sizing`.
The receiving agent has the Claude conversation and three reference videos, but has not received the main agent's research or verification records.

## Start here

1. Read this entire file, then [the implementation and verification guide](/home/eren/D/orc-web/plans/pen-agent-implementation.md).
2. Work in `/home/eren/D/orc-web-pen`, on its existing `pen-tool` branch.
   Read that checkout's `AGENTS.md`, root `README.md`, `package.json`, and the contextual README in each module before editing it.
3. Inspect the actual checkout and compare it with the baseline below.
   Preserve any work already present in your session.
4. Read the original proposal and the linked research records when reaching the corresponding geometry, source, or solver work.
   The material below summarizes the consequential requirements so execution does not depend on the main chat's history.
5. Present the remaining behavior and architecture decisions with concrete recommendations before adopting changes to accepted contracts.
   Continue independent source inspection and isolated verification while awaiting an answer.
6. Implement and verify the staged milestones in the companion guide under the user's instruction in your session.
   Report each completed milestone and its actual limits before calling the whole pen complete.

These handoff files currently live in the main checkout's temporary `plans/` folder.
They are uncommitted and are not automatically present in the separate Git worktree.
Read the absolute paths above; neither checking out `master` nor copying the main checkout's working tree is necessary.
The main agent is providing research and this handoff, not implementing the pen.
The user will manually give this handoff to the pen agent.

## Ownership and checkout boundaries

| Location | Role |
| --- | --- |
| `/home/eren/D/orc-web` | Main ORC-web checkout on `master`; read-only reference for the pen agent |
| `/home/eren/D/orc-web-pen` | Existing pen implementation worktree on `pen-tool` |
| `/home/eren/D/orc-web/plans/` | Temporary research and handoff documents |
| `/home/eren/.cache/orc-pen-diagnostics/20261025/` | Retained native solver evidence and isolated toolchain; preserve the recorded evidence |

Both worktrees were at the full baseline SHA above when checked for this handoff.
The pen worktree was clean at that check.
The main checkout has existing uncommitted frame-label code, tests, and documentation; those changes are not in the pen worktree.
Do not copy them, reset them, or treat their absence from `pen-tool` as a pen regression.
Reconcile future upstream changes deliberately and report conflicts without discarding either side.
This handoff does not authorize changing the main checkout, merging, pushing, or opening a PR.
Keep any implementation commits on the pen branch under the user's instructions.
Do not read or modify the root `GATES.md` as part of this handoff; use a separately named feature ledger if needed.

Useful initial read-only commands, run in the pen worktree:

```sh
git branch --show-current
git rev-parse HEAD
git status --short
git diff --stat 53b2951229627d6be9d0b950237226de186a3d82..HEAD -- shared server src scripts package.json bun.lock doc_v1
```

Expected initial branch is `pen-tool`.
An updated HEAD or dirty files require a source comparison and preservation of existing work, rather than a reset.

## Product direction

Build a simple 2D Pen for precise geometric logos and illustrations.
Its first geometry types are straight lines and circular arcs.
Horizontal, vertical, perpendicular, and tangent rules persist when a user moves an anchor.
One pen drawing is one connected open or closed path in one ordinary SVG node.
SVG remains the browser rendering and public export representation.
An optional, independently versioned ORC editing record remembers geometry, stable identities, and rules outside public SVG attributes.
The solver is an editing dependency, not a runtime dependency of exported artwork.

Use the terms **Pen**, **pen path**, **anchor**, **segment**, and **rule** in the product.
ORC already uses Constraints for layout behavior, so geometric rules should not introduce a second meaning for that panel.
The videos communicate interaction and visual intent; they do not prove the internals of another product or expand the first pen release.
Quiver-style gradients, organic curves, and complex illustrations are a later aspiration.

### First pen scope

- One path per SVG node, open or closed, made from lines and circular arcs.
- Pen creation and anchor editing only for paths carrying ORC's valid own record.
- Persistent horizontal, vertical, perpendicular, and tangent rules.
- Pointer drawing, anchor dragging, anchor deletion, finishing, exact closure, and clear rejection feedback.
- Temporary guides and measurements, with one Guides & labels view toggle.
- One existing application history entry per completed drawing, extension, or anchor drag.
- Ordinary project saving, reopening, source compatibility, and plain SVG output.
- Browser-native rendering through the current renderer and existing native layout model.

### Deferred scope

MCP implementation follows the working human tool and the existing application-first prerequisite.
The future names `get_pen_path`, `create_pen_path`, and `edit_pen_path` express direction, not endpoints to implement now.
Arbitrary imported SVG point editing, `convert_to_pen_path`, typed dimensions, shape presets, a geometric constraints panel, Bézier handles, G2 continuity, splines, holes, multiple contours, booleans, fillet handles, anchor locking, and inserting anchors mid-segment are deferred.
Background grids, rulers, snapping to other objects, gradients, the move-away-and-back arc gesture, and simultaneous human/agent editing are also deferred.
The `gap 26` measurement between separate objects in the reference video is a V1.1 follow-up.
It is unrelated to the solver diagnostic named `gap_counter` and to the editor's existing layout Gap controls.
Use the existing backlog conventions when the pen work adopts and records deferred items in its own branch.
Do not silently turn a performance concern into a new product path-length limit or a replacement solver project.

## Human interaction contract

The following summarizes the owner's direction reported in the supplied proposal.
Apply the corrections and open-decision handling later in this file where the proposal is incomplete or inconsistent.

| Action | Intended behavior |
| --- | --- |
| P or Pen toolbar button | Select Pen without changing its view preferences |
| First click | Begin a local draft with the first anchor |
| Subsequent click | Add a line by default |
| A before placement | Toggle only the next segment between line and tangent arc; reset to line after placement |
| First segment | Recommend a line because there is no incoming tangent direction |
| Collinear arc target | Show the supported straight-line fallback |
| Shift | Constrain the next direction to 45-degree steps; a 0/90-degree result can acquire H/V |
| Alt | Temporarily suspend drawing snaps; check current key ownership before wiring it |
| Enter | Finish a valid draft |
| Escape in a new drawing | Finish with at least two anchors; otherwise cancel the draft |
| Click first anchor | Add the intended closing segment and close exactly; incompatible arc closure must explain its refusal |
| Select an own pen path | Show its anchor handles without a separate point-edit mode |
| Drag an anchor | Hold only that anchor; preserve rules and keep the last valid shape on rejection |
| Escape during drag | Restore the complete pre-gesture state without a command |
| Delete selected anchor | Remove it and adjacent segments; connect surviving neighbors with the required straight replacement and drop affected rules |
| Delete leaving fewer than two anchors | Use the normal whole-node deletion path and its lock/layout/draft safeguards |

Handle first/last anchors of open paths and closing anchors explicitly when deriving deletion replacements.
A refused anchor deletion still consumes the key so the whole selected object is not accidentally deleted.
Anchor selection is local editing state, separate from the editor's selected-object IDs.
Arc centers are internal geometry shown as a `+` when appropriate, not additional selectable anchors.
Chained rules can move other anchors; the tool does not promise that every other point remains fixed.
An anchor drag that returns to the applied state should not create a spurious command.
Click-and-drag is not the proposed drawing gesture for creating Bézier handles or a new arc.

The draft and selected-anchor handlers must consume their owned keys before object Delete, object Escape, movement, and document history handlers.
Normal text, Properties, and Code inputs retain their own keys.
Undo during an uncommitted interaction first cancels that interaction, rather than accidentally undoing a previous saved command.
Test pointer capture loss, blur, project switching, tool switching, Preview entry, zoom changes, and applied revision changes.
Choose explicit finish/cancel behavior for each transition and preserve the last applied document.
Do not leave orphan draft nodes in the canonical document.

### Creation destination

The proposal places a new path in the selected frame, or in the workspace when nothing is selected.
Recommended completion of that rule: freeze one eligible selected frame when the draft starts; otherwise use the workspace when there is no selected destination.
Use workspace coordinates for a root path and the selected frame's verified coordinate/layout mapping for a child.
Append a new child at the parent's current end slot unless the owner approves a different insertion rule.
In Row/Column, retain native flow placement rather than writing Free coordinates implicitly.
Pointer hover over a different frame should not silently change the frozen destination during drawing.
Selection of a non-frame, multiple potential destinations, or a locked/unsupported frame needs a clearly documented resolution or an explanatory refusal before drafting.
Settle that remaining destination behavior in P0 and test root, Free-frame, and supported flow-frame creation separately.

Continuing an existing open path was left open in the proposal.
Recommended gesture: activate Pen and click an eligible end anchor to extend that same path, with the completed extension forming one new command.
Confirm the chosen behavior with the owner when settling the interaction decisions; the first milestone need not invent another toolbar or mode.

### Snapping and guides

Consider the previous segment and the current path only.
H/V uses the path's local axes so rotating the outer SVG does not change the saved rule meaning.
Choose the candidate with the closest angle; break ties by tangent, perpendicular, then horizontal/vertical.
The proposed starting angular tolerance is 2.5 degrees, independent of zoom.
Picking and closing distances are screen-space tolerances converted through the actual rendered SVG mapping.
Human snapping may project a draft endpoint; future coordinate-exact agent operations must only detect already satisfied relationships.

New paths use a thin stroke and no fill, with a deterministic default documented by the implementation.
Closed paths can be filled.
Compatible fill, stroke-color, and stroke-width edits must preserve rules.
These artwork controls are promised behavior, but their production UI is not all implemented in the baseline.
Track the prerequisite explicitly rather than declaring pen styling complete from a Code-only experiment.

Guides & labels defaults on and belongs to existing project-specific browser view state.
It is not a portable design field and does not change the document revision, history, or save status.
Preserve its preference across project tabs and Preview restoration using the existing view-state lifetime.
Do not infer application-restart persistence from the current in-memory view-state map.
The proposed control location is a Pen option in Properties; exact placement remains an implementation decision to reconcile with the owner.
Anchor handles, dashed alignment lines, construction circles, `+` centers, live length/angle/radius, selected-anchor coordinates, rule markers, and the line/arc mode hint are derived editor UI.
Measurements display one decimal in the application's design units while stored geometry retains full precision.
Failure feedback identifies the refused rule, such as "can't keep tangent", and retains the last valid preview.
Guides and labels stay outside canonical nodes, SVG source, Code output, Preview, and supported exports.
Define handle visibility when Guides & labels is off; the proposal groups anchor squares with guides but also requires direct anchor editing.
Recommend retaining essential selected-path editing handles while hiding auxiliary construction graphics and measurements, and confirm that clarification rather than treating it as an existing agreement.

## Corrections that must reach the implementation

### Complete arc geometry

Store a circle center and directed traversal, or an equivalent complete circular-arc representation, with the segment endpoints.
Two endpoints do not determine an arc once its tangent rule or incoming segment is removed.
Keep centers internal and preserve the existing arc through rule removal and save/reopen.
Convert the own traversal direction deliberately to and from SolidCraft's counter-clockwise arc representation.
Verify both left and right turns and reversed path traversal; an always-`1` SVG sweep flag only covers the original one-direction fixture.
Keep SolidCraft's required fixed origin separate from the user's freely movable first anchor.

### Safe solving

Start a drag from the last complete accepted state and pass every pre-move solver point as the reference.
After solving, independently validate geometry, rule residuals, encoded SVG, and directed tangent joins before accepting a step.
Restore the entire prior state on solver failure or guard failure.
Successful solver status alone can include collapsed geometry or a reversed tangent continuation.
Unsigned tangency alone allows the outgoing line to reverse; logical incoming and outgoing directions must agree at a smooth join.
Maintain a negative control that succeeds through the unguarded solver and is rejected by the production guard.

Use the intended lighter `Analysis::StatusOnly` mode for drag checks.
Its zero DOF value and empty determined arrays are placeholders, not a full-constraint result.
Run full analysis when the release/result actually needs that information.
Use adaptive small steps, bounded attempted work per frame, the last accepted result, and explicit handling of outstanding pointer motion.
A tested 320-step move succeeded where coarse steps reversed direction, but 320 is not a production constant.
Decide how release settles or rejects remaining motion without publishing an invalid final jump.
The solver's decomposition Budget does not interrupt a slow numerical solve.
Measure complete editor work before claiming responsive dragging or deciding that a Worker is needed.

### Source, record, and bounds

Keep the editing record outside the SVG attributes map and outside generated public source.
Retain the geometry-only hash, but also validate supported structure and coordinate interpretation.
The same `d` with a new path transform, extra visible path, or changed wrapper can make the old handles wrong.
Preserve compatible styling and unchanged Code Apply only after deliberate compatibility checks.
Detach incompatible editing metadata with an explanation and retain ordinary SVG artwork.
Meaningful ancestor Source Apply currently does not preserve descendant identities; do not promise otherwise.

Publish source, record, canonical outer SVG attributes, viewBox, Fixed dimensions, supported placement, and any dependent layout writes as one validated command.
The current renderer and serializer take outer attributes from the canonical node, not from the root tag inside `node.source`.
Checking only the source string's viewBox is therefore insufficient.
Mount the complete native preview before checking layout dependencies, and restore every affected value on cancellation.
Keep the versioned intrinsic Column projection and its generated inner flow distinct from the canonical outer frame.

Use a frozen inverse screen matrix of the rendered SVG for each gesture.
An axis-aligned selection rectangle is not an inverse coordinate transform.
Bounds must include arc extrema and the supported stroke caps/joins.
Reboxing must preserve the mapping of unchanged anchors after scale and rotation, including transform-origin effects.
Free placement compensation and parent-controlled Flex behavior require separate evidence.
Reject an unsupported candidate with an explanation rather than silently converting its layout mode.

### Precision and identity

Three-decimal SVG output can collapse a valid 0.0004-unit segment.
Recommend deterministic round-trip numeric encoding with normalized negative zero, validated after serialization.
Choose and document production tolerances, supported coordinate range, and stroke-bound calculations.
The upstream sketch's actual hard caps are 20,000 points and 40,000 solver constraints; arc centers and the fixed origin count as points.
Its current `MAX_COORD` is `1e9`, with finite coordinates strictly inside that magnitude.
These are upstream safety limits, not permission to advertise unlimited paths or impose an unapproved smaller product limit.

Stable anchor/segment/rule IDs are identities, not array indexes.
Allocation must avoid reuse after deletion and after Undo followed by a new history branch.
A counter restored by Undo can reuse a discarded ID, so test that case explicitly.
Fresh unique identities are recommended; reconcile any visible `a1`/`s1`/`r1` formatting promise from the proposal before finalizing the encoding.
Copying a path's internal IDs into a new containing node remains valid because their uniqueness is path-local.
Use the existing whole-document history rather than adding a separate pen history store.

## Open decisions and authority

The original proposal reports the owner's direction and mixes agreed behavior, recommendations, open questions, and historical verification.
The main agent's later clarification files are proposals, not an adopted replacement specification.
The current [SVG V1 boundary](/home/eren/D/orc-web-pen/doc_v1/interface/svg-editing.md:60) still excludes path drawing and point editing.
The user intends to develop the pen in its own worktree; inclusion in the V1 release remains a decision based on the verified result.

Resolve the following in one concise decision summary with recommendations before adopting conflicting accepted behavior:

| Decision | Recommendation | Why it is still explicit |
| --- | --- | --- |
| Arc cap versus exact closure | Display the projected endpoint for ordinary capped previews; refuse an incompatible exact closing arc | A major arc cannot always reach the chosen endpoint within a 180-degree limit |
| Numeric output | Deterministic round-trip representation and validation of final SVG | This corrects the proposal's mandatory three-decimal wording |
| Portable format compatibility | Independently version the pen record and document how earlier builds reject it; decide project schema wording | The baseline parser is strict, so optional fields do not make old builds compatible |
| Transformed and Flex placement | Prove supported cases and explicit refusals before claiming appearance-preserving reboxing | Existing position helpers deliberately reject transformed chains |
| SVG styling/transform prerequisites | Identify the bounded prerequisite work needed for the promised pen workflow | Resize/rotation gestures and SVG artwork controls remain incomplete in the baseline |

Routine module names, command discriminants, hash implementation, and minimal loader details can be selected from the existing architecture.
They should not create unnecessary permission requests or new configuration systems.
Document the chosen ID strategy, default stroke, supported caps/joins, tolerance, guide-control placement, and open-path continuation gesture with their checks.
An SVG marker is optional and should exist only for a demonstrated requirement; a marker cannot replace record/source validation.
Future MCP parity for adding/removing rules and switching segment types requires its own UI/API decision, not an implicit extra panel in this implementation.

After approval, update the corresponding accepted documentation and implementation together in the pen branch.
Preserve existing `doc_v1` content and add dated `codex-pc` comments explaining the correction, evidence, replacement behavior, and tradeoffs, following the owner's documentation instruction.
This handoff itself leaves `doc_v1` unchanged.

## Evidence already available

| Evidence | What it establishes | Limit |
| --- | --- | --- |
| [Original proposal](</home/eren/.codex/attachments/a2109d4b-dd55-4e62-a53b-195b907daeca/Pasted text.txt>) | Owner direction, human workflow, deferred features, Claude's sandbox scripts and outputs | Proposal, not a production implementation; sandbox recipes and several current-state claims were corrected |
| [Main assessment](/home/eren/D/orc-web/plans/cad-pen-review.md) | Geometry counterexamples, parser/source/command hazards, scope and implementation order | Read-only assessment |
| [Contract clarifications](/home/eren/D/orc-web/plans/pen-contract-clarifications.md) | Corrected arc, source, numeric, coordinate, guard, and lifecycle proposals | Production adoption decisions remain explicit |
| [Local WASM confirmation](/home/eren/D/orc-web/plans/pen-wasm-confirmation.md) | Historical native baseline and rebuilt solver running in Bun and Chrome fixtures | Original temporary workspace, wrapper, binary, screenshots and raw logs are now unavailable |
| [Native diagnostic follow-up](/home/eren/D/orc-web/plans/pen-diagnostic-results.md) | All three previously ignored measurements actually executed, plus an enabled arc control | Native solver evidence; no new WASM or ORC workflow verification |
| [Figcraft reference](/home/eren/D/orc-web/plans/figcraft-reference.md) | Focused coordinate, refitting, keyboard, and gesture test references | Not a dependency, solver replacement, renderer, or industry-wide proof |

The original proposal attachment has SHA-256 `b11d48e57450c89f9c3f83009481bd2d67f065bb4bad23ceb34c9075b676d9d7`.
The supplied [Claude follow-up snapshot](</home/eren/.codex/attachments/08e2c694-6e00-4f67-a06c-42a03f366072/Pasted text.txt>) explains that older separate Claude spike files were stale and were never supplied to the main agent.
Treat its embedded wrapper and the proposal's Appendix B as throwaway research code, not an adapter to ship unchanged.
If an attachment is missing in your environment, report the missing input instead of reconstructing a supposed agreement from memory.

### Solver identity and results

Pinned upstream: SolidCraft `cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4`, package `solidcraft-sketch` 0.15.0, with `solidcraft-geom`.
Official source: [pinned SolidCraft tree](https://github.com/tangency-labs/solidcraft/tree/cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4).
The checked workspace uses Rust 1.95.0 and edition 2024, with MIT OR Apache-2.0 licensing.
Only the small sketch dependency is the candidate; the rest of SolidCraft's application and UI are not ORC dependencies.

Historical local confirmation used `rustc 1.95.0`, commit `59807616e1fa2540724bfbac14d7976d7e4a3860`, the normal `wasm32-unknown-unknown` target, and isolated Zig 0.15.2 host linking.
It did not require Rust bootstrap, patched standard libraries, or ignoring the required Rust version.
The reported wrapper produced 677,586 WASM bytes, zero imports, and SHA-256 `a573da6a3744e772e64180dd7f4f038c2458405bb2a699c1e5c57e097e4abe79`.
That is a historical identity, not an available binary or an expected checksum for your different production wrapper.
The record reports 216 ordinary native tests passing, three then ignored measurements, and 18 confirmation groups passing in Bun 1.4.2 and Chrome for Testing 154.0.8037.57.
Its two browser modes were standalone direct modules and a Bun-bundled fixture, not ORC's Vite development and built applications.

The original `/tmp/orc-pen-confirmation-hlZWca/` directory no longer exists.
Rebuild a successor wrapper and reproduce the consequential guards instead of claiming those old raw files or a reusable production adapter exist.
The historical report remains useful context, but it is not independently rerunnable from its expired artifact links.

Fresh native follow-up on 2026-10-25 verified all 1,913 upstream archive files and 14 downloaded dependency archives against the original source and lockfile.
All three requested measurements ran individually with one passed, zero failed, zero ignored, and exit code 0 per command.
The printed geometry counts still matter:

- Disabling the constructive helper produced 30 failed solves and 183 lost-side/direction checks among 6,600 edits.
  The enabled-helper control ran the same generated families with zero failures and zero lost-side checks.
- The 1,000-edit continuation diagnostic accepted 638 edits and classified 362 other outcomes with zero unexplained cases.
  Classification totals were 218 infeasible targets, 43 targets permitting only a mirrored solution, and 101 solution-branch endings.
- The full direct solver solved all 5,000 bracket/fan cases without recorded mirroring.
  It failed 73 of 500 complex triconnected linkage cases, also without recorded mirroring.
  Those exact 73 failures were not classified for feasibility or rerun with continuation.
  They are a different generated dataset from the previous diagnostic.

Do not describe a successful test process as proof that every geometry solved.
Investigate the complex-linkage failures further if their failure types occur in the intended line/arc pen topology.
Do not silently remove promised pen behavior or launch a general replacement solver to eliminate an unrelated measurement counter.

### Performance and missing proof

The historical 29-point fixture, representing 20 path anchors, met its isolated median-at-most-8 ms and p95-at-most-12 ms criterion in Bun and both Chrome fixture modes.
The 602-point fixture measured roughly 17–22 ms at p95 in Chrome before complete editor work and can exceed a 60 Hz frame budget in one synchronous call.
Those figures include adapter transfer and guards but do not certify ORC pointer events, Properties, native Fill validation, layout, painting, or hundreds of continuation steps.
A single slow numerical solve is not preempted by a JavaScript step-count cap.
Keep the original main-thread candidate while measuring the real workflow; justify any Worker or product limit from evidence and agreed scope.

## Immediate deliverable for the pen agent

Start with a checkout/drift summary and the concise decision list above.
Then use the companion guide to establish one complete path creation/editing transaction with exact cancellation, history, save/reopen, and rejection behavior.
Build out the rest of the human pen only on that working foundation.
The expected final report identifies completed scope, changed files, exact checked source, commands and browser versions, retained evidence, unresolved dependencies, and the next bounded task.
The main agent's research does not certify a production pen, complete exports, Windows, or the future MCP workflow.

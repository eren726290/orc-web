# Pen implementation and verification guide

Companion to [the start-here handoff](/home/eren/D/orc-web/plans/pen-agent-handoff.md).
Prepared on 2026-10-25 against `53b2951229627d6be9d0b950237226de186a3d82`.
This guide describes future implementation and checks; its commands have not been run against a production pen.
Use `/home/eren/D/orc-web-pen` as the working directory for application work.

## Read before editing

Read the start-here handoff in full.
Read the target checkout's root instructions and contextual READMEs.
For accepted behavior, read `doc_v1/interface/svg-editing.md`, the relevant tool/selection/placement/Preview sections of `doc_v1/interface/workspace-and-canvas.md`, `doc_v1/interface/code-window.md`, `doc_v1/interface/properties-panel.md`, `doc_v1/architecture/canonical-document-model.md`, `doc_v1/architecture/command-engine-and-history.md`, and `doc_v1/import-export/export.md`.
Read `IMPLEMENTATION_STATUS.md` and the relevant layout/source backlog before assuming a documented control or exporter already works.
For UI changes, read `design/README.md` and the relevant design references, adapting them to accepted ORC behavior.
The ordinary SVG pen does not require the pending production React/component integration milestone.
Editing arbitrary imported React component internals is a separate source-ownership problem and remains outside this handoff.

Recheck every referenced symbol against the live checkout.
Line numbers below are navigation aids for the reviewed baseline, not permission to overwrite newer code.
The main checkout's uncommitted frame-label work must not be imported as part of this task.

## Current integration map

| Baseline file | Existing responsibility | Required pen integration |
| --- | --- | --- |
| [shared/document/model.ts:16](/home/eren/D/orc-web-pen/shared/document/model.ts:16) | Discriminated canonical node types; SVG currently has only `source` | Add the chosen optional editing-record type to SVG deliberately |
| [shared/document/document.ts:25](/home/eren/D/orc-web-pen/shared/document/document.ts:25) | Strict known-field parsing and construction | Permit and parse the record with exact version, reference, and numeric validation |
| [shared/document/document.ts:112](/home/eren/D/orc-web-pen/shared/document/document.ts:112) | Hierarchy and orphan validation | Add or invoke semantic pen invariants before a candidate can publish |
| [shared/commands/commands.ts:13](/home/eren/D/orc-web-pen/shared/commands/commands.ts:13) | Atomic mutation union, batch envelope and parsing | Add the geometry mutation and its boundary parser; retain one existing command envelope |
| [server/commands/mutations.ts:13](/home/eren/D/orc-web-pen/server/commands/mutations.ts:13) | Atomic writes and ordinary lock checks | Apply the complete pen write through this lock-protected transaction |
| [server/projects/projects.ts:80](/home/eren/D/orc-web-pen/server/projects/projects.ts:80) | Idempotence, expected revision, cloned candidate, validation, history and autosave scheduling | Preserve this publication boundary and validate all coupled values before it |
| [server/projects/bundle.ts:62](/home/eren/D/orc-web-pen/server/projects/bundle.ts:62) | Parse on reopen; serialize the whole document on save | Round-trip valid records and refuse unsupported/malformed projects without changing files |
| [shared/source/html-source.ts:27](/home/eren/D/orc-web-pen/shared/source/html-source.ts:27) | Generate source from canonical outer attributes and SVG inner content | Keep metadata out of output and update outer attributes together with path content |
| [server/source/html.ts:50](/home/eren/D/orc-web-pen/server/source/html.ts:50) | Ordinary Source Apply and equivalent-source retention | Reconcile compatible selected-root SVG edits and provide detachment feedback |
| [src/editor/code/html-import.ts:176](/home/eren/D/orc-web-pen/src/editor/code/html-import.ts:176) | Import SVG as ordinary source without a pen record | Preserve ordinary imported-SVG behavior and avoid fabricating editing metadata |
| [src/editor/rendering/renderer.tsx:49](/home/eren/D/orc-web-pen/src/editor/rendering/renderer.tsx:49) | Native SVG rendering with canonical attributes | Reuse this renderer for the preview and applied pen node |
| [src/editor/rendering/svg-styles.ts:3](/home/eren/D/orc-web-pen/src/editor/rendering/svg-styles.ts:3) | Runtime SVG style containment and Edit restrictions | Preserve existing isolation and compare canonical source rather than altered runtime innerHTML |
| [src/editor/Workspace.tsx:153](/home/eren/D/orc-web-pen/src/editor/Workspace.tsx:153) | Text/delete-specific candidate preparation and shared command submission | Add explicit pen and insertion preparation instead of relying on a pass-through |
| [src/editor/Workspace.tsx:383](/home/eren/D/orc-web-pen/src/editor/Workspace.tsx:383) | Input exclusions, queued history, movement and object keys | Give the owning pen interaction first refusal on its keys and cancellation |
| [src/editor/properties/property-preview.ts:4](/home/eren/D/orc-web-pen/src/editor/properties/property-preview.ts:4) | Style/text/rename previews only | Add an explicit complete pen-preview shape or a focused adapter |
| [src/editor/canvas/pointer-layout.ts:17](/home/eren/D/orc-web-pen/src/editor/canvas/pointer-layout.ts:17) | Reorder candidate projection plus property previews | Update any reused candidate projection to understand all new writes |
| [src/editor/layout/fill-sharing.ts:280](/home/eren/D/orc-web-pen/src/editor/layout/fill-sharing.ts:280) | Simulate style/reorder/delete for native shared Fill | Account for changed pen dimensions/attributes and new insertion membership explicitly |
| [src/editor/layout/fill-sharing.ts:534](/home/eren/D/orc-web-pen/src/editor/layout/fill-sharing.ts:534) | Prepare coupled CSS and refuse actual writes to locked peers | Include necessary dependent writes in the same preview and atomic command |
| [src/editor/layout/sizing.ts:598](/home/eren/D/orc-web-pen/src/editor/layout/sizing.ts:598) | Capture native Fill relationships against candidate membership | Validate against the rendered pen candidate, including intrinsic supply changes |
| [src/editor/layout/layout-box.ts:14](/home/eren/D/orc-web-pen/src/editor/layout/layout-box.ts:14) | Resolve generated Column flow versus canonical outer parent | Keep object placement on the outer box and flow membership on the inner box |
| [src/editor/layout/coordinates.ts:11](/home/eren/D/orc-web-pen/src/editor/layout/coordinates.ts:11) | Parent positions for untransformed chains | Do not substitute this for an inverse SVG matrix or transformed reboxing proof |
| [src/editor/canvas/overlay-geometry.ts:14](/home/eren/D/orc-web-pen/src/editor/canvas/overlay-geometry.ts:14) | Observe native geometry changes for editor overlays | Reuse invalidation while keeping handles and guides outside artwork |
| [src/editor/view-state.ts:3](/home/eren/D/orc-web-pen/src/editor/view-state.ts:3) | Project-local browser tool, selection, panels and pan state | Add Pen and its appropriate view preference without saving editor-only geometry |
| [src/editor/Toolbar.tsx:30](/home/eren/D/orc-web-pen/src/editor/Toolbar.tsx:30) | Select/Pan/Text tool buttons | Add the accessible Pen button using the installed icon library and existing UI conventions |
| [src/editor/properties/Properties.tsx:194](/home/eren/D/orc-web-pen/src/editor/properties/Properties.tsx:194) | Current ordinary appearance fields | Identify and deliver the bounded SVG styling prerequisites for the promised workflow |
| [src/session/session-client.ts:32](/home/eren/D/orc-web-pen/src/session/session-client.ts:32) | Reject a new action while busy | Coordinate release and queued history explicitly; do not assume it queues all commands |

### Three excerpts that explain the main hazards

Baseline SVG parsing in `shared/document/document.ts`:

```ts
case "svg":
  return { ...base, kind: "svg", source: string(input.source) };
```

The type and strict allowed-field list must change together with this parser.
`validateDocument` currently checks the tree, not record/source geometry agreement.

Baseline preview support in `src/editor/properties/property-preview.ts`:

```ts
type NodePreview = Extract<Mutation, { kind: "style" | "text" | "rename" }>;
```

Neither this preview nor the existing pointer reorder adapter can preview new SVG source, metadata, or outer attributes automatically.

Baseline workspace preparation in `src/editor/Workspace.tsx`:

```ts
if (mutation.kind !== "delete") return mutation;
```

Text has its own check just before that line, but an otherwise new mutation simply passes through.
Calling this function by name is not evidence that a pen candidate received layout protection.

## Implementation boundaries and conventions

Keep pure record parsing, geometry, deterministic SVG output, and shared compatibility checks in a focused shared domain, such as `shared/pen/`.
Keep Pen interaction state, UI, and feature-specific styles together, such as `src/editor/pen/`.
Use a focused solver-wrapper/build directory with a README, exact upstream pin, and reproducible lockfile rather than mixing Rust files into unrelated application roots.
Choose its actual location after consulting the existing root folder map.
Keep E2E fixtures and feature helpers together under a focused group such as `scripts/e2e/editor/pen/`, with an owning check entry point in the established scripts structure.
These directory names are recommendations, not directories already implemented by the main agent.
Read and update the owning READMEs and folder map when introducing a group.
Keep `scripts/`, `server/`, `shared/`, and `src/` roots limited to their documented entry points and foundation files.

Match the existing discriminated mutation unions, `unknown` boundary inputs, shared validation helpers, explanatory refusals, and whole-command publication.
Keep required compiler TS6 and the normal build configuration.
Fallow's cyclomatic review/enforcement threshold is 10, and Oxlint's function-size limit is 40 lines in the reviewed configuration.
Retain reviewed anti-slop rules and the editor/design styling boundary.
Do not introduce a new general history store, saved DOM tree, measured layout graph, second SVG renderer, or generic framework for hypothetical later features.

## Milestones

### P0. Reconcile the checkout and adoption decisions

Inspect the target branch, local changes, active command state, source excerpts, and existing contextual documentation.
Record expected behavior and concrete failure cases before implementation.
Give the owner the concise decision list from the handoff with recommendations and evidence.
Resolve creation destination, coordinate origin, sibling slot, pointer-over-frame behavior, and selection ambiguity before the P3 drawing workflow.
Resolve contract conflicts before changing accepted support or portable format expectations.
Independent source reads and isolated geometry/build checks can continue meanwhile.
Treat the original proposal's `[Agreed]` labels as reported owner intent, not proof that its sandbox code or every technical statement is correct.

Completion criterion: a written scope/decision checkpoint identifies the actual base, preserved local work, approved corrections, unresolved dependencies, intended first milestone, and acceptance checks.
If the base differs, inspect changed in-scope modules and adapt this source map before implementation.
Do not automatically reset, pull, rebase, or merge merely to match this handoff.

### P1. Rebuild and verify a guarded solver adapter

Use the full pinned SolidCraft SHA from the handoff and Rust 1.95.0 with the official `wasm32-unknown-unknown` standard target.
Keep the own pen format separate from upstream serialized sketches.
Provide the smallest typed interface needed to construct the supported geometry, apply rules, solve with a held anchor and complete pre-move reference, and return a validated result.
Define per-path instance/session ownership and disposal explicitly so the throwaway fixture's single global sketch cannot leak between paths or projects.
Handle loading failure, unavailable exports, and WASM traps through the existing explanatory error flow while preserving the prior applied document.
Keep the planned main-thread load-once approach as the measured starting point.

Rebuild a successor to the expired local wrapper rather than claiming to copy it from `/tmp`.
In the separately pinned upstream source checkout, run `cargo test --locked -p solidcraft-sketch` and retain a fresh ordinary-suite baseline before integrating the rebuilt adapter.
Report the normal command's ignored tests separately from the already recorded explicit diagnostic runs.
The proposal's embedded wrapper lacks the corrected pre-move reference, complete guarded rollback, and directed-join checks.
Its always-one-way arc writer and global fixture state are not a production design.
Use the normal Rust target; the historical Ubuntu bootstrap and patched-standard-library recipe is not needed on this verified toolchain.
An upstream or compiler version change requires a new recorded comparison rather than an unannounced update.

Validate both arc directions, H/V/Perpendicular, exact closure, rule removal, deleted incoming segments, reloaded records, finite values, coordinate range, tiny emitted geometry, contradictory fixed geometry, degenerate successes, directed reversal, and complete rollback.
Use independent analytic/SVG checks rather than deriving every expected result from the same converter under test.
Isolated tests are justified here because exact numerical residuals, encoded sweep direction, and refusal controls cannot reliably be proved through pixels alone.
State that reason before adding them and keep normal user workflows in E2E.

Retain wrapper source, exact dependency lock and provenance, build commands, compiler/target identities, build flags, final WASM size/hash/import list, and required license notices.
Audit the licenses of the dependencies actually shipped in the binary; the previous research did not complete that graph.
Preserve the native diagnostic directory as evidence rather than adding the production wrapper to its checked upstream source tree.

The currently retained private Rust environment is described in `/home/eren/.cache/orc-pen-diagnostics/20261025/env.sh`.
Its native diagnostics used a private Cargo source replacement pointing at a now-stopped localhost relay, then ran offline.
Do not copy that experimental Cargo configuration into the product or assume it is a normal online package source.
Use a separate build environment or deliberately configured verified caches for the production wrapper.
Verify that the WASM target is actually installed before building; the fresh diagnostic rebuild only needed the native target.

Completion criterion: a reproducible pinned binary passes the guarded numerical matrix in Bun and a real Chrome-loaded fixture, with failure controls, per-path isolation, and retained evidence.
This proves the adapter candidate only; app asset loading is checked again in P3.

### P2. Establish portable data and one atomic edit

Implement the optional independently versioned SVG editing record and strict parsing.
Validate IDs and uniqueness, references, one connected path, open/closed structure, complete arcs and direction, rule compatibility, supported numeric range, nondegeneracy, and final encoded SVG agreement.
Unknown versions and malformed records must refuse visibly without silently dropping data or modifying an existing bundle.
Use one deterministic converter for browser and backend checks.
Treat SVG source/public outer attributes and metadata as one mutually consistent candidate.

Add the chosen atomic pen mutation to the shared union/parser and the server mutation handler.
Update every consumer found by searching those discriminants and node kinds, not just the first switch that TypeScript reports.
Reuse existing command IDs, idempotence fingerprints, expected revisions, inherited locks, cloned candidates, one history entry, revision publication, and save scheduling.
Include required source, record, viewBox, dimensions, placement, and dependent CSS in the same transaction.
Do not send independent Source Apply and style requests for one pen edit.

Browser solving does not remove server validation.
The server must independently reject invalid record/source pairs and invalid geometry rather than trusting a client `solved` flag.
The existing `validateDocument` hierarchy check does not provide this validation.
Keep source/import restrictions and inherited lock behavior intact.

Extend the full native candidate/preview representation to include SVG content, metadata and outer attributes.
Add the new write kinds to relevant candidate projections and Fill analysis deliberately.
Insertion needs particular attention because the existing shared-Fill simulator accounts for style/reorder/delete, not an arbitrary newly inserted sibling.
Prepare dependent style changes against the final candidate and reject actual writes to locked peers before publication.

Completion criterion: a real command produces one consistent document and one history entry, exact Undo/Redo restores all coupled fields, save/reopen retains the record and IDs, and stale, locked, malformed, or mismatched candidates change nothing.
Use the existing atomic and saved-bundle check patterns plus the focused new pen checks.

### P3. Deliver the first complete human workflow

Add the Pen toolbar button and P shortcut through existing tool/view state.
Implement a local draft capable of a line and tangent arc, finish it into one ordinary SVG node through P2, select an anchor, drag it safely, cancel it, Undo/Redo the completed edit, and save/reopen it.
Use the existing session readiness and unapplied-Code draft safeguard before beginning or committing an affected edit.
Keep draft geometry out of the applied document and do not emit a server command per pointer step.

Use actual rendered SVG coordinates and freeze the gesture-start mapping.
Capture affected native Fill dependencies before preview, mount the complete candidate, check native layout, and accept only a valid step.
Clear the complete preview in every failure/cancellation path and after acknowledgement.
Prevent stale post-acknowledgement preview cleanup from restoring old geometry or submitting a second command.
Test release followed immediately by Undo while the command is pending.
The session client does not queue arbitrary new requests while busy.

Load the identical intended WASM asset through ORC's actual Vite development app and built Bun-served app.
Retain its identity and request/load result in both modes.
Verify production asset paths and a load-failure recovery path without bypassing validation or leaving a half-created path.
Rust must remain a rebuild tool rather than a normal end-user runtime dependency.

Completion criterion: a real UI-driven first path can be created, dragged, cancelled, committed once, undone/redone, saved and reopened in both app modes with no runtime errors and matching source/record/native geometry.
An API-seeded SVG fixture alone is not completion of the human drawing workflow.

### P4. Complete source compatibility, geometry mapping and native layout

Preserve unchanged Apply through the equivalent-source path.
For a changed selected SVG root, retain metadata only after parsed geometry, supported structure, and coordinate mapping remain compatible.
Cover fill, stroke-color, stroke-width and formatting-only edits without using an entire-source-text hash as the geometry test.
Changing supported stroke width also needs fresh bounds/placement validation; retaining rules alone is insufficient.
Incompatible geometry, inner transforms, additional artwork, or replacement must detach with the agreed explanation and leave valid ordinary SVG.
Keep ancestor structural replacement's incomplete descendant identity reconciliation explicit.

Prove Free reboxing with arc extrema and supported stroke caps/joins first.
Then prove proportional sizing, rotation, transform-origin compensation, nested pan/zoom, scrolled ancestors, clipped frames, and the supported parent-controlled Row/Column cases.
For intrinsic Columns, resolve outer object placement and the generated inner flow through `layout-box.ts`.
Test insertion and later geometry edits when the path supplies intrinsic parent size or changes a sibling Fill cohort.
Rejected candidates restore the entire prior source, attributes, dimensions, placement, record, peer CSS, selection and history state as applicable.
Do not save measured native boxes or replace the accepted native CSS sizing projection with a JavaScript layout solver.

The promised SVG resize/rotation gestures and artwork fields are incomplete in this baseline.
Coordinate with the owner/main agent on the smallest prerequisite work and overlap before implementing shared transform UI.
Use source-driven fixtures to investigate mapping while clearly distinguishing them from delivered user controls.

Completion criterion: matrix-based assertions prove unchanged anchors keep their intended screen mapping, valid native layout still responds to later content changes, compatible source retains IDs/rules, incompatible source detaches visibly, and unsupported candidates refuse without partial changes.

### P5. Finish the human pen scope

Complete all interactions in the start-here table, including snap priority, Shift/Alt, both arc directions, the approved half-circle/closure behavior, open-path continuation, open/closed deletion, and lower-anchor-count whole-node deletion.
Implement adaptive continuation and explicit pending-motion behavior within the measured interaction policy.
Complete Guides & labels and the bounded styling prerequisites needed for the promised human workflow.
Keep temporary guides outside the rendered design, clean them up when their owner disappears, and preserve normal Properties/Code input behavior.
Make the toolbar and toggle keyboard-accessible with appropriate names and exposed state, and reuse existing icons and semantic editor styling.
Do not add decorative animation that obscures precise feedback.

Completion criterion: every applicable acceptance row below has recorded evidence, or an explicit unmet dependency that prevents claiming the complete pen feature.
Deferring an agreed first-version behavior is a scope decision to report, not a passing test.

### P6. Prepare integration review

Update the feature READMEs, approved contract annotations, implementation status, deferred-work records and verification commands in the pen branch.
Report the branch/commit and working changes, exact source hashes, binary/compiler identities, completed acceptance rows, commands, exit codes, browser versions, artifacts, and unresolved limits.
Identify shared-file conflicts with main work and propose an integration order.
Keep release timing and any merge/push operation under the user's separate instruction.
Human pen completion does not authorize implementing the future MCP server or expanding source-backed React editing.

## Verification

### Existing static commands

Run from the pen worktree after implementing the corresponding changes:

```sh
bun install --frozen-lockfile
bun run check:types
bun run lint
bun run check:tooling
bun run check:format
bun run check:codebase
bun run check:health
bun run build
```

Expected result is exit code 0 with no unexplained errors or new unreviewed findings.
Review Fallow output rather than automatically deleting reported code or weakening its configuration.
Preserve the agreed 10 cyclomatic and 40-line function thresholds.
Run the optional `bun run check:ts7` checkpoint after substantial shared/configuration changes as appropriate and record its actual result; TS6 remains required.
Do not suppress dependency declaration checking or change compiler strictness to obtain a passing result.

### Browser selection and evidence

At handoff preparation, `/usr/bin/google-chrome-stable` and `/opt/google/chrome/chrome` were absent.
The following executable was present and its version command returned `Google Chrome for Testing 155.0.8059.12`:

```sh
export ORC_CHROME_EXECUTABLE=/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome
"$ORC_CHROME_EXECUTABLE" --version
```

Another available executable at `/home/eren/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome` reported `Google Chrome for Testing 153.0.8010.12`.
These version-only observations do not constitute passing app checks in either version.
The historical WASM confirmation used 154.0.8037.57; do not label a run with 153 or 155 as the same browser checkpoint.
Recheck actual executable availability and version before running, and report the real browser rather than inferring its identity from a folder or `chrome` argument.
The owner permits the in-app Browser and installed/managed Google Chrome as needed.
Use repeatable existing E2E tooling for retained workflow evidence; a new browser-automation replacement is not part of the pen task.

### Focused pen suite to add

Add a package alias `check:pen` following the existing feature-check structure.
That alias does not exist at the reviewed baseline.
Recommended future invocation after it is implemented:

```sh
ORC_PEN_EVIDENCE=acceptance bun run check:pen chrome
```

Define and document any feature-specific scenario selectors used by the new runner.
Run real development and built app modes rather than relabeling standalone direct/bundled solver fixtures as app verification.
Use [check-boundaries.ts](/home/eren/D/orc-web-pen/scripts/e2e/editor/check-boundaries.ts) as a runner example and [app-process.ts](/home/eren/D/orc-web-pen/scripts/support/app-process.ts) for owned subprocess startup/shutdown.
Use [editor-evidence.ts](/home/eren/D/orc-web-pen/scripts/support/editor-evidence.ts) to record commit, source hashes and working diff; include new Rust sources, Cargo locks and WASM identity explicitly because that existing helper does not enumerate every possible new solver directory or binary.
Retain screenshots, traces, command/inputs, expected and observed geometry, runtime errors, document/history effects, and source/binary hashes under the feature's ignored evidence folder.
Preserve a result manifest on failure as well as on success.

For every rejection/cancellation row, compare applied source, own record, outer attributes, placement, revision, history and relevant peer changes before and after.
For every successful user operation, assert its command count and exact history behavior rather than only taking a screenshot.
Use a tolerance derived from the declared numeric/display policy and independently computed geometry.

### Acceptance matrix

| ID | Required observable behavior |
| --- | --- |
| D1 | P and the toolbar select Pen without changing Guides & labels; normal input fields retain P/A/Enter/Delete |
| D2 | First anchor stays local; Enter/Escape with an insufficient draft creates no orphan node or history entry |
| D3 | Straight drawing uses the frozen root/frame destination, verified coordinate origin and explicit sibling slot, commits once, and restores exactly through Undo/Redo |
| D4 | A affects only the next segment, both arc directions work, collinear fallback is explicit, and first-segment behavior matches the chosen contract |
| D5 | Closest-angle snapping, tie order, Shift 45-degree steps, Alt suspension and zoom-independent angular tolerance match the declared policy |
| D6 | Ordinary cap preview shows its actual endpoint; exact line/arc closure creates only the intended closing segment and rejects an incompatible major-arc endpoint |
| D7 | Completing and continuing an open path has the chosen one-command history and preserves containing node identity |
| G1 | H/V, perpendicular and tangent relationships survive valid drags with independent residual assertions |
| G2 | Only the dragged anchor is held; expected rule ripple occurs without accidentally fixing the first anchor to the solver origin |
| G3 | Coarse directed reversal or degenerate solver success is reproduced by an unguarded control, then rejected and fully rolled back by the guarded path |
| G4 | Large pointer jumps, reverse travel, near-degenerate arcs and pointer release follow the measured continuation/pending-motion policy |
| G5 | Escape, pointercancel, blur, tool/project change, revision change, zoom change and Preview entry cancel according to the declared lifecycle without later accidental commits |
| G6 | One completed drag is one command, return-to-start is a no-op, and immediate pending Undo does not require undoing a second accidental command |
| E1 | Open endpoint, open interior and closed-path anchor deletion produce the declared segment/rule changes |
| E2 | Deleting below two anchors uses normal whole-node guards; refusal consumes Delete and preserves the selected object |
| E3 | Adapter/data regression checks prove that rule removal and removal of an incoming segment leave an existing arc reconstructable; this row does not add a deferred human rule-removal control |
| E4 | IDs survive ordinary edits, Undo/Redo and save/reopen; deletion and a new Undo branch do not reuse discarded identities |
| S1 | Optional records are parsed, versioned and semantically validated while ordinary SVG projects continue to open |
| S2 | Unknown versions, invalid references, duplicate IDs, invalid topology, NaN/infinity/range violations and record/source mismatch refuse without changed bundle bytes or active session |
| S3 | Equivalent and formatting-only Apply preserve metadata when supported structure and mapping match |
| S4 | Fill/stroke/stroke-width edits preserve rules and maintain valid new bounds; geometry/inner-transform/additional-artwork replacement detaches with an explanation |
| S5 | Meaningful ancestor source replacement follows the documented identity boundary and never leaves falsely attached descendant metadata |
| S6 | Plain SVG/source contains no own record or editor overlays; reimported plain SVG has ordinary whole-object behavior |
| S7 | Valid path save/reopen reconstructs the same directed geometry, IDs, rules, layout and editable state |
| L1 | Pan/zoom, viewBox scaling, proportional sizing, rotation and scrolling map pointer coordinates through the actual SVG matrix |
| L2 | Reboxing preserves unchanged-anchor screen positions and supported stroke bounds after scale/rotation and transform-origin compensation |
| L3 | Free, supported Row/Column, wrapping and intrinsic Column ancestry preserve canonical outer placement and correct flow membership |
| L4 | New insertion and later pen-size edits preserve or explicitly reject intrinsic Fill supply and shared Fill coefficient changes |
| L5 | A locked target/ancestor or a required locked dependent peer causes whole-command refusal with no partial preview or save |
| L6 | Unsupported/source-owned/constraint-owned placement is explained and retained without an implicit layout-mode conversion |
| U1 | Guides toggle affects only editor view state and survives project-tab and Preview restoration without a revision/history/save-status change |
| U2 | Guides, centers, labels and selected handles align after movement, zoom, rotation, reflow and nested scrolling; stale observers are cleaned up |
| U3 | Keyboard-owned pen keys do not trigger object actions, document history or Preview interaction accidentally |
| U4 | Compatible supported artwork controls work through the promised UI without losing rules; unavailable prerequisites remain explicitly incomplete |
| R1 | Intended WASM bytes load in actual development and built ORC apps and in the Bun adapter check, with version/hash/import evidence |
| R2 | WASM load failure, invalid result or trap preserves the applied state and permits a documented retry/cancellation path |
| R3 | Two pen paths and two projects do not share mutable solver state or leak pending work across selection/project changes |
| R4 | Complete pointer-frame work, including conversion, guards, native SVG/layout and overlays, has measured median/p95/worst observations at representative sizes |
| X1 | Generated standalone SVG renders without solver code or metadata and retains independent analytic geometry checks |
| X2 | Actual supported image/PDF exports exclude overlays when their exporter exists; a browser screenshot or source snippet is not reported as complete product-export verification |

If Copy/Paste or duplication is implemented in the live checkout, also prove that it copies the record while assigning a fresh containing node identity.
If the baseline still lacks that general feature, record the dependency and test the relevant cloning behavior without inventing a full clipboard milestone.
Likewise, identify missing general transform/export controls rather than weakening acceptance rows or silently expanding the task into unrelated V1 milestones.

### Existing affected regressions

After the focused pen workflow passes, run the relevant existing commands against the same current source and actual browser:

```sh
bun run check:atomic chrome
bun run check:bundle chrome
bun run check:rendering chrome
bun run check:boundaries chrome
bun run check:history chrome
bun run check:deletion chrome
bun run check:preview chrome
bun run check:movement chrome
bun run check:layout chrome
bun run check:padding chrome
bun run check:gap chrome
bun run check:alignment chrome
bun run check:participation chrome
bun run check:sizing chrome
bun run check:nested-placement chrome
bun run check:intrinsic-sizing chrome
```

Check each runner's live channel/mode support and keep its normal development/built coverage.
Use documented focused scenario selectors while diagnosing, then retain the relevant full regression coverage for the milestone being claimed.
Add the general editor/saving checks when command/session/storage changes affect them.
Existing source patterns to extend are `scripts/e2e/editor/check-atomic.ts`, `scripts/e2e/projects/check-bundle.ts`, `scripts/e2e/rendering/check-rendering.ts`, and the boundary helpers beside `check-boundaries.ts`.
The shared intrinsic Column scenario specifically exercises the approved wrapper and source inverse, which pen bounds/preview work must preserve.

For interactive manual inspection, `ORC_DEV_PORT=5174 bun run dev` selects a separate frontend port and lets the existing development launcher allocate its backend.
Setting only `ORC_PORT` does not select the development frontend because `scripts/dev.ts` launches its backend with port 0.
For scripted checks, prefer the existing `launchApp` helper, which owns dynamic ports and shuts down only its own process.

## Completion and pause conditions

A milestone is complete only when its declared applicable behavior and failure cases have actual passing evidence on the tested source.
A complete feature claim additionally accounts for every first-version requirement, styling/transform prerequisite, source boundary, history/save workflow, and supported export condition.
Report the checked platform/browser/app modes and the unverified ones explicitly.
The current research does not certify Windows, the complete application, complete export support, or future MCP behavior.

Pause dependent work and report the concrete cause when an accepted contract needs changing, a format decision is unresolved, transformed/Flex reboxing cannot preserve its promised behavior, a protected layout dependency would be lost, or measured synchronous solving prevents the agreed interaction.
If a check fails, reproduce and diagnose the failure under the existing testing rules before fixing it; do not change an assertion simply to match a wrong result.
Each retry should test a specific explanation.
Present the smallest correct remedy and its tradeoffs before expanding architecture or support.
Do not activate a TypeScript fallback solver, substitute a different renderer, remove guards, impose an unapproved product limit, or drop a first-version behavior to obtain a green report.
Independent work may continue when it does not depend on the unresolved decision.

At a good stopping point, record the exact last passing source, failed/pending checks, modified files, owned process state, evidence paths, decision dependencies, and the next command/task.
That record must be sufficient to resume after a usage-limit interruption without reconstructing the chat.

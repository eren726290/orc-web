# Shared intrinsic Column: native wrapper proposal

## Decision status

This is a concrete proposal from the user-authorized percentage follow-up on 2026-10-18.
It has not been adopted in the application or accepted V1 specification.
The existing verified Flex implementation and the unresolved-combination guard remain unchanged.
The requested research and proposal are separate from completing the general intrinsic Column feature.

## Recommendation

Use one generated layout wrapper inside an explicitly owned ordinary Column frame.
The frame's outer box uses one native Grid cell.
The wrapper remains a normal Column Flex container and contains the same ordered design children.
The browser derives the intrinsic outer height from content, then stretches the inner Flex box to the resulting grid area.
Flex then allocates that definite space, including changing Fit siblings and individual minimum and maximum limits.
No JavaScript size allocator, measured-height cache, artificial Fixed parent height, hidden mirror, or saved dependency graph is proposed.

This changes emitted DOM structure and the mapping between canonical objects and layout boxes.
That architecture change requires agreement under [AGENTS.md](../AGENTS.md#scope).
It does not introduce a user-facing Grid layout mode or reduce the accepted shared Fill behavior.

## What the percentage review established

The same-hierarchy percentage candidate was extended to account for both children's minima and maxima.
The independent oracle solves equal allocation within the actual available parent budget, preserving overflowing minima and unused space after all maxima bind.
The candidate passes the tested two-Fill controls without a changing Fit sibling, including a separately authored Fixed sibling.
It still fails when an ordinary Fit sibling changes, whether that sibling precedes, separates, or follows the Fill children.

One simultaneous-limit counterexample has Fill bounds 0–70 and 80–120.
With a Fit sibling of 20 and 16px of gaps, the native parent measures 136px.
The remaining 100px requires 20/80, but the percentage candidate produces 40/80.
Changing the Fit sibling to 90 makes the parent 206px and still leaves 100px for Fill.
The candidate now produces 70/120 instead of 20/80.
The percentage denominator includes the Fit sibling's changing contribution, so it does not express the remaining budget correctly.
These measurements reject this formula, not every possible construction in CSS.

Exact source, browser identities, commands, observations and checks are in [the focused evidence directory](../.unlazy/intrinsic-fill/percentage-followup/README.md).

## Native mechanism

The proposed emitted structure is:

```html
<div data-orc-layout="intrinsic-column-v1"
     style="display:grid; grid-template-rows:minmax(0,1fr); grid-template-columns:minmax(0,1fr); flex-direction:column; flex-wrap:nowrap; gap:8px;">
  <div data-orc-flow="intrinsic-column-v1"
       style="display:flex; flex-direction:inherit; flex-wrap:inherit; gap:inherit; justify-content:inherit; align-items:inherit; align-content:inherit; min-height:0; min-width:0; align-self:stretch; justify-self:stretch;">
    <!-- Existing ordered children. -->
  </div>
</div>
```

The outer frame keeps its dimensions, limits, padding, borders, paint, clipping, placement and authored layout declarations.
The inner box inherits the parent-owned Flex direction, wrapping, gaps and alignment declarations.
Its forced stretch is a projection detail, independent of alignment of the design children.
The final property allowlist and shorthand handling must be implemented once in a shared projection helper.

The children reuse the existing source-derived common outer basis and decoration compensation from [fill-sharing.ts](../src/editor/layout/fill-sharing.ts#L327).
Their basis gains a zero-percent term, such as `calc(0% + var(--orc-fill-basis))` for border-box sizing.
Content-box sizing subtracts the existing authored decoration input inside the same expression.
The existing shrink coefficient remains `basis / (basis - decoration)`.
The percentage term makes the basis content-dependent while the intrinsic containing size is indefinite, then resolves against the definite stretched Flex box for actual sharing.
Replacing that term with a plain 200px basis causes empty children to manufacture a positive intrinsic parent height in the negative control.
Replacing the outer Grid box with block layout restores unequal intrinsic Flex shares in the other negative control.

The normative motivation is Grid's [layout algorithm](https://drafts.csswg.org/css-grid-2/#layout-algorithm), which treats grid areas and stretched items as definite for item layout, together with Flex's [basis resolution rule](https://drafts.csswg.org/css-flexbox-1/#flex-basis-property).
The actual browser measurements establish the tested behavior of this combination.
They are not a guarantee about untested engines or all nesting patterns.

## Source preservation and saved authority

Keep canonical node IDs, `parentId`, ordered `children`, and the existing style maps authoritative.
Do not add a canonical wrapper node or a second editable layout tree.
Record an explicit versioned projection marker on the owning ordinary frame when the person enters this supported relationship.
The proposed marker is `data-orc-layout="intrinsic-column-v1"`, stored through the existing attributes map.
Keep the canonical parent layout as Flex Column; a shared deterministic projector emits the outer Grid box and generated inner Flex box.
The marker and exact owned child projection distinguish this relationship from arbitrary source-authored Grid or Flex.

The generated inner box has no design object ID, Layer row, name, lock, selection or separate history.
It remains present for that opted-in Column through Fit/Fixed height changes, avoiding structural remounts merely because a bound changes.
An explicit layout conversion away from this representation removes the marker and normalizes affected owned declarations in the same command.
Stable rendered identity through those conversions still needs application verification.

Exported and copied source must contain the real wrapper and CSS required for native behavior.
This is a deliberate source structure change when the representation is adopted, so byte-identical original markup is not promised for the converted frame.
Unrelated objects and declarations retain their existing source ownership and priorities.
The outer frame remains the authority for inherited layout declarations, so editing its Gap does not require two independently editable Gap values.

Code Apply must recognize and reverse only the exact versioned emitted wrapper shape.
Applying unchanged generated source must preserve canonical IDs, children, revision and history.
Edits to ordinary parent values and child source must round-trip through that same recognizer.
If someone structurally edits a marked generated wrapper into an unknown shape, report the mismatch instead of silently discarding its styles or children.
Removing the projection marker explicitly opts that source into ordinary authored HTML, where the real wrapper becomes part of its source-controlled hierarchy.
Do not reinterpret an arbitrary unmarked div as a generated wrapper.

This importer work is necessary, not hypothetical.
The actual current [importHTML](../src/editor/code/html-import.ts#L150) creates a canonical node for every ordinary element.
The focused executable check shows that it currently imports the generated wrapper as a real object, while [nodeSource](../shared/source/html-source.ts#L19) emits direct canonical children.
The current application therefore cannot adopt this wrapper through a renderer-only patch.

Adding a wrapper also changes direct-child selectors.
The executable control changes `:scope > [data-fill]` from two matches to zero.
Start with eligible owned ordinary div frames and inline styles; do not automatically rewrite source-backed React components, external selectors, semantic list/table structures, or uncertain bindings.
Those retain their existing source boundary until their owners can perform a deliberate source transformation.
This proposal does not establish imported React support or settle its later binding design.

## History, drafts and saving

Entering, leaving, or changing this relationship remains one ordinary atomic command.
The marker and necessary dependent CSS changes belong in the same candidate and inverse snapshot.
Reject the entire candidate if ownership, locks, source preparation or native validation fails.
The existing [Projects command and history path](../server/projects/projects.ts#L80) already commits and restores canonical document snapshots.
It should not need a separate wrapper history engine.

Browser reflow after text, font, image or parent-size changes creates no command, revision, autosave, or new measured CSS value.
Undo restores the previous intent, and the native browser lays that intent out again.
Cancellation must restore the preview's marker and dependent CSS together without committing.
Draft impact checks must use the same projected source as the Code window; [historyImpact](../server/projects/projects.ts#L121) already calls the shared serializer.
No independent generated-source cache should become history authority.

The marker, parent CSS and child CSS fit the existing [node attributes and style maps](../shared/document/model.ts#L5).
Save/reopen should regenerate the same wrapper from that intent.
No schema-version bump is proposed solely for these existing fields.
The implementing build must recognize only its exact supported projection signature rather than guess Fill ownership.
Earlier checkouts do not understand this marker and are not certified to render or edit projects using it.
Compatibility with those unreleased checkouts must not be assumed from an unchanged schema number.
The prototype has not verified application Undo, draft safeguards, locks, persistence or old-build behavior.

## Export effects

| Output | Required behavior |
| --- | --- |
| HTML/CSS | Emit the extra div and native CSS, retaining responsive content sizing without JavaScript or measured pixel snapshots. |
| React | Emit the corresponding wrapper in ordinary generated JSX and the same CSS; do not rewrite imported component source without a proven binding. |
| React + Tailwind | Use faithful supporting CSS for the percentage basis and shrink expression where utilities are insufficient. |
| PNG, image formats and PDF | Use the same projector in the background renderer and capture the resulting native layout at the requested dimensions and state. |
| Code copy | Show the actual required source structure; a snippet remains distinct from a complete packaged export. |

The script-free [prototype.html](../.unlazy/intrinsic-fill/percentage-followup/prototype.html) demonstrates that native output does not need a layout runtime.
The browser-parser reload controls exercise serialized markup and CSS separately from the live DOM.
They do not certify ORC's complete exporters, managed assets, React output or background capture, which remain separate implementation work.
The [accepted export contract](../doc_v1/interface/flex-layout.md#L297) already requires reflowing layout intent rather than frozen measured positions.

## Concrete implementation boundary after agreement

| Owner | Required work and current assumption |
| --- | --- |
| `shared/source/` | Add one deterministic, reversible projection description reused by markup emission and the renderer, including property ownership and exact version recognition. |
| `src/editor/rendering/renderer.tsx` | Emit the generated box from canonical intent for Canvas and Preview, preserving the outer object's ID, attributes, clipping and focus rules. |
| `src/editor/code/html-import.ts`, `server/source/html.ts` | Recognize exact generated markup before ordinary node creation; preserve no-op Apply identity and reject ambiguous marked structures. |
| `src/editor/layout/sizing.ts`, `fill-sharing.ts`, `fill-dependencies.ts` | Recognize the new owned basis signature and distinguish outer box, inner layout box and canonical parent. Keep the independent-supply proof and exact bounds. |
| `src/editor/layout/frame-layout.ts`, `position.ts`, `coordinates.ts`, `absolute-placement.ts`, `flow-placement.ts`, validation helpers | Resolve only this known generated box instead of assuming that `parentElement` is always the canonical parent. Measure frame placement relative to the outer box and flow slots relative to the inner box. |
| `src/editor/canvas/keyboard-movement.ts`, `pointer-placement.ts`, `gap-geometry.ts`, overlays | Preserve canonical order, hit targets, drop slots, gap ownership, parent outlines, scroll offsets and zoom across the generated box. |
| `src/editor/properties/` | Observe the correct outer and inner boxes; preserve live preview, cancellation, focus and one-command commits. |
| Source copy, history-impact and eventual exporters | Consume the same projection, preserving existing applied-versus-draft and committed-revision boundaries. |
| Focused E2E and relevant READMEs/status | Cover the new relationship, source round trips and affected workflows, then update folder documentation and verified status. |

For example, [ownedSizingRelationship](../src/editor/layout/sizing.ts#L652) currently rejects any DOM parent without the canonical parent's object ID.
[renderedChild](../src/editor/layout/frame-layout.ts#L114) queries only direct DOM children.
[readPositionOwner](../src/editor/layout/position.ts#L5) and [renderedFlexChild](../src/editor/layout/absolute-placement.ts#L26) have the same parent identity assumption.
These are concrete integration changes, not reasons to weaken their checks globally.
Use one explicit resolver for this generated representation and keep refusing other unknown wrappers.

Before claiming application support, verify nested Fill and independent-supply cut points, parent/child limits, padding, both box models, fractional rendering boundaries, alignment and Space between, source edits, font/image loads, absolute children, transformed-layout refusals, deletion, reorder, reparenting, zoom, scroll, previews, cancellation, locks, Undo/Redo, Code drafts and save/reopen.
Export checks must exercise emitted markup at several dimensions and content lengths, not only a screenshot at the original size.
Fedora's supported stable Chrome and Windows need their own evidence.
The isolated measurements do not settle that list.

After agreement, add `codex-pc` comments to the accepted documents while preserving their existing content.
Clarify the internal wrapper projection under [canonical frames and layout](../doc_v1/architecture/canonical-document-model.md#frames-and-layout), the source and responsive-output obligations under [Flex persistence and export](../doc_v1/interface/flex-layout.md#persistence-commands-and-export), and renderer parity under [system architecture](../doc_v1/architecture/system-architecture.md#rendering-and-source-ownership).
Keep Flex as the product model and explicitly distinguish the internal single-cell Grid from a new user-facing Grid feature.
If a proposed comment conflicts with an existing accepted contract, explain that conflict before adopting the contract change.

## Alternatives and adoption boundary

Continuing the same-hierarchy percentage formula retains the measured Fit-sibling budget defect.
Replacing all Column children with independent Grid tracks retains the earlier capped-track redistribution defects.
A measured JavaScript layout runtime could supply a budget, but it would add remeasurement scheduling, convergence and export-runtime obligations that this native wrapper avoids in the tested cases.
A fixed-height fallback or narrower V1 contract would change accepted behavior and is not proposed here.

Approve this emitted-wrapper architecture for focused implementation only if the extra exported markup and explicit source transformation are acceptable.
That approval would authorize implementing the shared projector, exact recognizer and affected ownership paths, followed by verification.
It would not certify the feature in advance, authorize arbitrary React rewrites, or permit dropping failures from the acceptance criteria.
If the integration exposes another real blocker, report it with evidence before changing the agreed contract again.

Application code, repository tests, package dependencies and `doc_v1` were preserved during this research.
No commit, push or architecture adoption is included.

## Verification record

The tested checkout is `950e8a28d785d7783b471e689e3538bc75a7be31` plus the existing uncommitted intrinsic-sizing work captured in `percentage-followup/baseline.json`.
The native runs used Fedora 44, Linux 7.2.5-200.fc44.x86_64, and the installed agent-browser CLI.
Both binaries were identified directly, not inferred from their session names:

- Google Chrome for Testing 153.0.8010.12, `/home/eren/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, SHA-256 `8c599d43aec53f2460a31ae2f4af6bd863f8258b34ff519564bc5d4726bfaa1e`.
- Google Chrome for Testing 154.0.8037.57, `/home/eren/.agent-browser/browsers/chrome-154.0.8037.57/chrome`, SHA-256 `e528b77a8b250c48a5bbd7aeeabbc2813940c0a2fe39b1b11fbaf1f01fb04f18`.

The percentage review measures 333 live states per browser.
Its 30 no-sibling and 30 independently Fixed-sibling controls pass.
Of the remaining 273 Fit-sibling states, 183 fail in each browser.
The paired raw observations match between binaries.

The proposed wrapper measures 745 positive live or parsed-reload states and two intentional negative controls per browser.
Every positive state passes constrained allocation, physical gap checks and the applicable live/fresh comparison.
The negative controls correctly detect unequal sharing without the outer Grid box and false intrinsic supply without the percentage term.
The positive states cover two and three Fill children, one interleaved changing Fit sibling plus a Fixed sibling, simultaneous child bounds, parent bounds including a minimum stronger than its maximum, overflow, unused capped space, parent/child decoration, unequal margins, both child box models, live Fit and Fill text changes, Fit/Fixed transitions, serialization and parsing, and empty content.
This is a bounded native result, not complete application certification or an exhaustive layout proof.
Multiple changing Fit siblings, arbitrary nested projections, source-aware Undo and full export integration remain unverified.

Run from the repository root with the recorded binaries and the local evidence scripts present:

```sh
python3 .unlazy/intrinsic-fill/percentage-followup/run.py
python3 .unlazy/intrinsic-fill/percentage-followup/wrapper-run.py
python3 .unlazy/intrinsic-fill/percentage-followup/source-run.py
python3 .unlazy/intrinsic-fill/percentage-followup/audit.py
```

The first three commands retain their full browser invocations, exit codes, source inputs or hashes, measurements and conclusions in `result.json`, `wrapper-result.json` and `source-result.json`.
The source check builds and calls the actual current serializer and importer; it does not claim to have implemented the proposed recognizer.
The final check verifies the exact protected file inventory and all 219 initial hashes, including application code, repository checks, dependencies, AGENTS.md and doc_v1.
The evidence directory is ignored local research, while this proposal records the mechanism, counterexamples, scope and integration obligations for future checkout readers.
An earlier negative control ceased to distinguish the candidate after the wrapper inherited the parent's Gap, so it was replaced by the explicit unequal-sharing control.
That failed verifier attempt is retained as `wrapper-inherit-control-failure.json`; it is not used as a passing run.

## React compatibility follow-up, 2026-10-19

The user requested a small React and established-practice review before deciding on adoption.
The [focused React review](intrinsic-column-react-review.md) records primary documentation and an actual paired-browser experiment with the installed React, Base UI and Motion versions.
Stable wrappers preserve the tested state, input, focus, refs, context and event behavior across ordinary sizing changes.
Inserting the wrapper into an already mounted component tree resets transient state even with the same child key.
The lifecycle for that first structural conversion must be defined and verified before adoption; keeping the wrapper afterward does not eliminate the initial remount.
Layout containers have documented industry precedents, while this exact ORC sizing projection remains custom and does not have blanket compatibility with arbitrary React source.
The original application integration and source/history/export verification requirements remain open.

## Adoption authorization, 2026-10-19

The user approved implementing this proposal together with the React lifecycle conditions.
Canonical activation uses the own `--orc-intrinsic-column:1` CSS declaration through the existing atomic style command.
Generated HTML retains the proposed versioned `data-orc-layout` and `data-orc-flow` attributes.
This avoids adding an attribute command or a second authoritative projection registry.
Exact source opt-out removes `data-orc-layout`, strips only the recognized canonical CSS marker, and retains the real wrapper and its content as ordinary authored markup.
Unknown reserved versions refuse with an explanation.
Ordinary Code import retains its existing CSSOM shorthand and priority normalization; equivalent-source Apply preserves the original canonical document through the existing no-op comparison.
Implementation and integrated verification are in progress; this authorization does not itself establish runtime completion.

## Implementation checkpoint, 2026-10-20

The approved ordinary wrapper implementation and current verification are complete.
See the [implementation checkpoint](../IMPLEMENTATION_STATUS.md#ordinary-intrinsic-column-wrapper-checkpoint) and [source-bound aggregate audit](../artifacts/editor/intrinsic-column-current-audit.json).
The source/render projector, exact inverse recognition, outer/flow coordinate distinction, atomic ownership updates and opted-in interactions now have recorded application verification.
Canonical object identity and child order remain unchanged, equivalent generated Code Apply is a no-op, and save/reopen retains the responsive source.
Both browser versions and both application modes pass all seven intrinsic scenarios, including multiple changing Fit siblings and the selected nested arrangements.
The final full sizing and affected regressions pass as well.
Earlier unverified native-research claims above describe their original research checkpoint; the application evidence here supersedes only the cases it actually covers.
First activation remains the agreed structural Edit conversion; later opted-in Fit/Fixed changes retain mounted descendants, and Preview mounts from applied structure.
Arbitrary imported React source rewriting, arbitrary direct-child selectors, complete exporters, broad animation performance and supported-platform certification remain separate work.
No application compiler migration, dependency addition, public Grid control, commit or push is included.

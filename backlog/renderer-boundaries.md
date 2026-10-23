# Renderer boundary follow-up

## Current corrections

The October 15, 2026 investigation reproduced ordinary Edit content editing through Tab focus, SVG selector rules restyling the editor and unrelated objects, and stale selection outlines during native transitions and scrolling.
The focused corrections use the existing ordinary renderer, source preparation and canvas overlays.
See the [investigation](../artifacts/editor/review-react-boundaries/REPORT.md) and [correction checkpoint](../IMPLEMENTATION_STATUS.md#native-renderer-boundary-corrections-2026-10-15).
No accepted architecture was replaced.

## SVG stylesheet support

SVG projection contains selector rules within the vector using native CSS `@scope`.
Local rules and nested media, supports, container and scope groups are supported.
Code retains the original selectors and canonical source; runtime scoping is derived display state.
External stylesheet imports and global definitions such as `@keyframes`, `@font-face`, `@property`, namespaces and named layers are unsupported by this preparation path.
Source Apply rejects unsupported definitions without changing the document or history.
The renderer excludes global definitions from legacy or directly inserted source rather than publishing them into the editor page.
Such existing artwork can lose effects that depend on those definitions; its saved source is retained for repair.

Supporting global definitions requires deliberate name ownership and reference preparation, including references through animation shorthands, custom properties, fonts and layers.
Do not restore uncontained definitions to obtain an appearance match.
Any expansion must preserve artwork behavior, prevent collisions between separate vectors and editor styles, and pass history, reopen and complete output checks.
The CSS specification explicitly states that global definitions inside `@scope` are not scoped by that rule.
See [CSS Cascading and Inheritance Level 6](https://www.w3.org/TR/css-cascade-6/#scoped-styles).

Complete HTML, React, image and PDF exporters remain unfinished.
They must use equivalent style preparation for their output boundary and retain authored vector content and resources.
The current source serialization/reopening checks do not certify a complete exported application.

## React integration acceptance

Imported React components remain unimplemented in the production renderer.
The ordinary input, SVG selector and native geometry corrections do not complete the React requirements below.
These entries preserve observed research and implementation acceptance work within the existing V1 scope.
Proposed mechanisms and unresolved decisions are not new accepted architectural contracts.

### Research provenance and reproduction

The October 15 investigation reviewed `032e4dfbace4c6cfa6511fddf8fc4db2ce380c73` with the then-pending TS7 tooling files.
Its isolated library experiment used React/React DOM 19.3.0, Base UI 1.8.0, Motion/motion-dom 14.0.0 and Tailwind 4.3.3 on Fedora 44 with Bun 1.4.2 and Chromium 153.0.8010.12.
These are historical tested versions, not a claim about the latest releases or future installations.
The library results explicitly record `applicationCertification: false`.
The ordinary application corrections were subsequently verified against `e18b86d50b560de31665789f50a024a880fe1180` plus the correction files identified in the implementation checkpoint.

The [full investigation](../artifacts/editor/review-react-boundaries/REPORT.md), [library experiment](../artifacts/editor/review-react-boundaries/libraries.ts), [library fixture](../artifacts/editor/review-react-boundaries/library-fixture.tsx) and [results](../artifacts/editor/review-react-boundaries/libraries.json) contain the original observations.
Those files are ignored local artifacts and may be absent in another checkout.
The findings, minimal reproduction recipes and acceptance checks below are retained here so work can resume without them.
If the artifacts are present, run `bun artifacts/editor/review-react-boundaries/libraries.ts` from the repository root to rerun the isolated experiment.
An exit of zero means its assertions observed the stated behavior, including the unwanted behavior; it does not mean ORC's integration requirements passed.
When dependencies change, verify installed identities and repeat the controls before relying on the historical result.

### 1. React and Motion event ownership

Status: demonstrated integration gap in an isolated composition; production React integration is not implemented.
The ordinary native focus leak is already corrected separately.

The experiment compared a parent boundary using bubbling pointer cancellation, an explicit capture boundary, and an interactive Preview control.
With the bubbling boundary, Motion's pointerdown callback ran once and its press transform began before the parent could isolate the interaction.
Base UI Select did not open through the tested pointer action, but focusing its trigger and pressing ArrowDown still opened it.
The explicit capture control prevented the tested callback and Select openings; the Preview control allowed them.
This establishes the failure of bubbling-only ownership for those cases, not universal correctness of capture for all components or events.

Minimal reproduction: render a Motion press target and Base UI Select inside a transformed React design with a parent bubbling pointer handler that prevents the default action.
Count the target's pointer callbacks and inspect its transform during pointerdown.
Then focus Select's trigger and press ArrowDown.
Compare the same composition with pointer/key capture enabled and with normal interaction enabled.

Implementation starting points are [Canvas](../src/editor/canvas/Canvas.tsx), the [shared renderer](../src/editor/rendering/renderer.tsx), [Workspace shortcuts](../src/editor/Workspace.tsx) and [Preview](../src/editor/preview/Preview.tsx), followed by the supported React source/binding preparation path when implemented.
Resolve design-owned targets through supported component and binding identities, and route relevant input before their handlers run in Edit.
Retain editor-owned canvas text, Properties, Code, selection and gesture input.
Keep automatic source animations running in Edit according to the [Motion contract](../doc_v1/interface/motion.md#edit-and-preview-behavior).
Preview must enable supported component interactions and discard temporary state on exit.

Open decisions: the supported pointer, mouse, keyboard, focus, wheel and hover event coverage; handling React portal event propagation; and how preparation recognizes unsupported document listeners or effects that bypass the boundary.
Capture alone cannot isolate arbitrary document listeners or component effects.
Report unsupported runtime capabilities before accepting a composition rather than claiming blanket event isolation.

Acceptance checks during actual React integration:

- Exercise pointer press, drag initiation, Tab/Shift+Tab, Enter, Space, ArrowDown and Escape through the supported Motion and Base UI compositions in Edit and Preview.
- In Edit, assert that component press/drag/open callbacks stay inactive, automatic animation remains visible, and ORC selection/editing still works.
- In Preview, assert that the same supported interactions work, editor movement/deletion/history shortcuts stay inactive, and temporary interaction state resets on re-entry.
- Verify canvas text, Properties and Code input remain usable, including draft cancellation and history safeguards.
- Verify blocked design interactions and temporary Preview interactions do not change canonical values, revision or history.
- Repeat at different canvas zooms and through supported portals, then repeat on Fedora and Windows Chrome.

### 2. Base UI portals, modal focus and scrolling

Status: demonstrated integration gap in the isolated Base UI Dialog experiment; no production imported-modal workflow is available to certify.
Complete this with component preparation and Preview, after supported event ownership is established.

At design scale 0.5, a 200px popup portalled to `document.body` remained 200px wide and lost the design's inherited red theme variable.
Using a design-local portal container produced a 100px displayed popup and restored the red theme.
Both configurations still locked document body scrolling.
The body portal covered the external Exit control.
The scoped portal left Exit pointer-hit-testable, but modal management set `aria-hidden="true"` on Exit, and the tested Tab action focused the opener rather than Exit.
The experiment did not certify screen-reader access or a complete keyboard traversal sequence.
Changing the portal container therefore resolved placement/inheritance in that fixture without establishing the full modal contract.

Minimal reproduction: place a themed Base UI Dialog inside a design scaled to 0.5 with Exit outside the design.
Compare an omitted portal container with an explicit design container.
Measure popup width and computed theme color, document scroll state, Exit hit testing, accessibility attributes, and actual keyboard focus after Tab.

Prepare a design-owned portal host through supported component APIs and verify placement, zoom, inherited styles, collision bounds, focus and scroll behavior together.
Use the [selected-frame Preview contract](../doc_v1/interface/workspace-and-canvas.md#implementation-requirements-and-research) for the required boundary and reachable Exit control.
Preserve supported modal behavior and the existing [direct same-page rendering policy](../doc_v1/architecture/system-architecture.md#direct-component-rendering).
Do not assume a universal portal provider, globally disable modality, or introduce an iframe as an unreviewed workaround.

Open decisions: supported host registration, nested portal ownership, positioner collision/reference boundaries under zoom, modal focus/scroll adaptation, and refusal of compositions whose required modal behavior cannot coexist with Exit access.
Any accepted-contract change requires the user's agreement before implementation.

Acceptance checks during actual portal integration:

- Open supported Select, Popover and Dialog compositions near each frame edge at multiple zooms, including a nested overlay.
- Verify overlay placement, size and theme inheritance against the intended design and supported collision boundary.
- Verify Tab/Shift+Tab, Escape, opener focus restoration and Exit access by pointer, keyboard and screen reader while the overlay is open.
- Verify component/frame scrolling, unrelated-frame scrolling, and restoration of document scroll/focus state after dismissal and Preview exit.
- Verify backdrops cannot unintentionally cover the editor or unrelated designs, and modal accessibility management does not hide Exit.
- Verify Preview re-entry starts from saved defaults and that all temporary overlay activity leaves document/history unchanged.

### 3. Tailwind styling and the editor reset

Status: demonstrated cascade collision using actual compiler output; production Tailwind React import remains unimplemented.
The ordinary importer currently rejects class attributes, so this is not a failure of an existing ordinary Tailwind workflow.

The experiment compiled `flex p-8 w-32` with the installed Tailwind 4.3.3 compiler.
The unmarked positive control rendered as flex with 32px padding and 128px width.
Adding `data-orc-id` under `.canvas-world [data-orc-id] { all: revert; box-sizing: border-box; }` changed it to block layout, zero padding and the 1280px host width.
An inline-style control retained flex layout, 32px padding and 128px width.
This demonstrates that the ordinary reset overrides the tested generated utilities when imported React layers receive the same marker.

Minimal reproduction: compile those complete class strings, mount marked and unmarked elements under the current reset, and compare computed display, padding and width with the inline-style control.
Use actual generated CSS rather than a hand-written approximation of Tailwind utilities.

Implementation starting points are the reset in [app styles](../src/app/styles.css), the [renderer](../src/editor/rendering/renderer.tsx), and the future shared component/style preparation path.
Restrict the ordinary reset to objects it owns, and prepare imported CSS, theme variables and portal content for their intended design scope.
Preserve ordinary HTML/SVG inline rendering while doing so.
Resolve the component's stylesheet entry, theme inputs and source-detection inputs before initial render and before source updates commit.
The [Tailwind contract](../doc_v1/import-export/tailwind-components.md#stylesheet-entry-and-source-detection) requires retained build inputs, and its [style scope](../doc_v1/import-export/tailwind-components.md#style-scope) forbids restyling unrelated designs or the editor.

Open decisions: how renderer ownership marks ordinary versus component content, the supported generated-style isolation mechanism, cascade/layer ordering, required source-path registration, and supported global name/reference preparation.
The SVG `@scope` correction does not settle the complete Tailwind/theme/global-definition problem.
Keep dynamic classes, unsupported plugins and arbitrary project-wide styles within their existing recognition limits.

Acceptance checks during actual Tailwind integration:

- Compile the chosen component's real stylesheet, complete static utilities, variants and theme inputs, including a required source file outside the editor's own source tree.
- Compare rendered layout and styling with a standalone positive control before accepting the import.
- Mount two unrelated imported designs beside ordinary HTML/SVG and editor controls; verify that one design's reset, utilities and variables do not alter the others.
- Verify required styles and variables reach supported portal content without becoming editor-wide styles.
- Apply supported source/class edits through commands and verify atomic failure, exact history, draft protection, save/reopen and rebuilding from retained inputs.
- Verify React/Tailwind output from a fresh consumer using the retained source, assets and exact dependencies when complete exports become available.

### 4. Complete exports and animation performance

Status: unfinished implementation and verification work; the investigation did not demonstrate a specific completed-export failure or establish a performance target.
Source serialization, copied snippets, native CSS transition tests and isolated library experiments are not complete export or Motion performance certification.

The wrapped Height Fill work on 2026-10-15 reproduced a concrete ordinary source-serialization boundary before complete exports exist.
`nodeSource` includes a saved `visible: false` child without projecting its hidden state into CSS.
In the retained 600px-wide Row, that child occupies 1000px and changes the visible Fill child's height from the editor's 76px to 66px.
An explicit `display: none` positive control restores the expected 76px and excludes the hidden child from native line formation.
The [failing source check](../artifacts/editor/sizing-wrapped-cross-expanded-result.json), [paired visibility observations and exact source](../artifacts/editor/wrapped-cross-native/visibility.json), and their screenshots retain the reproduction against `950e8a2` with the recorded uncommitted sizing changes.
During source/export integration, define how saved hidden state reaches copied HTML, complete static output and capture without losing authored display declarations or changing canonical source ownership.
Verify a hidden child in the middle of Flex siblings, hidden descendants, source round-trips, history and reopening, with an otherwise visible control.
The focused sizing fixture uses explicit CSS hiding and does not close this serialization boundary.

The [export contract](../doc_v1/import-export/export.md), [Motion capture contract](../doc_v1/interface/motion.md#image-and-pdf-capture) and [local rendering service](../doc_v1/architecture/system-architecture.md#local-rendering-service) define the accepted behavior.
Build this on the existing command/project authority and shared renderer after the required component, style, asset and dependency preparation is available.
The current [native overlay watcher](../src/editor/canvas/overlay-geometry.ts) is a starting point for display measurements; it does not prove ordering against future Motion writes or arbitrary custom animation loops.
The historical scheduling review found Motion's read phase precedes its render writes, so choosing a read callback alone does not establish same-frame overlay alignment.
Recheck the actual installed scheduler when integrating Motion.

Complete output acceptance checks:

- Build exported React with CSS and Tailwind in a fresh consumer from retained source, styles, themes, assets and exact dependency records.
- Verify supported interactions, vector appearance and design modes without loading ORC's editor stylesheet or relying on the original machine's cache.
- Verify supported static HTML/CSS fidelity, and show an explicit explanation for a live component that cannot be represented faithfully.
- Verify the accepted PNG, JPEG, WebP, AVIF and PDF paths for their applicable selection, background, crop and multi-item/page behavior.
- Capture an explicit named component state from a committed revision with time progression disabled, and verify repeated captures reproduce that state independently of the editor's animation progress or Still view setting.
- Verify image/PDF capture with the editor tab closed, managed fonts and assets, declared fallback fonts, and exclusion of panels, outlines, Gap/drop controls and constraint indicators.
- Verify required saves finish before publication; render/save failure and cancellation preserve the applied design and existing destination, and export creates no design mutation or Undo entry.
- Verify stylesheet containment and equivalent appearance in the actual exported consumer or capture renderer, including SVG and unrelated-design controls.

Motion measurement and performance acceptance work:

- Exercise actual supported Motion entrance, layout and transform animations, a moving sibling/ancestor, and interactions in Preview while measuring selection/Gap/drop alignment at different zooms.
- Measure overlay geometry after the relevant Motion writes and retain per-frame error samples; do not infer correctness from settled positions or session polling.
- Verify start, cancellation, pause/Still view where supported, reduced-motion behavior, deselection, Preview transitions and unmount cleanup without changing saved animation values.
- Record hardware, operating system, browser/library versions, viewport, object/selection counts, animation mix and exact source/commands for representative scenes.
- Measure frame timing, missed frames, overlay error, layout/measurement cost, idle activity and listener/observer cleanup before and after any optimization.
- Choose representative workloads, acceptable geometry error and performance budgets before declaring a performance gate passed.
  Those budgets remain unresolved; this record creates no invented object-count limit or frame-rate promise.
- Retain traces and measurements, repeat on supported Fedora and Windows Chrome, and distinguish measured results from unsupported custom animation behavior.

Open export decisions include supported React/static conversion shapes, stable named-state resolution, font/asset readiness, output collision/publication behavior and handling unsupported global stylesheet definitions.
Open performance decisions include the supported Motion scheduling phase, representative workloads, target hardware and agreed timing/error budgets.
These require evidence and, where they alter an accepted contract or expand scope, the user's agreement.

### Evidence required to close an item

Before implementation, verify current package identities and recreate the relevant minimal failure or missing-feature control against the actual production integration path.
Record the tested commit and uncommitted changes, exact commands, fixtures, browser/platform versions, observations and failure diagnostics.
Retain passing and failing controls, screenshots/traces where useful, and a source inventory that can be matched to the result.
Complete the item's acceptance checks in development and built modes on the required platforms, or explicitly retain its unverified remainder.
Update this backlog and the implementation overview with the exact completed scope and remaining decisions.
Do not close an item solely because an isolated fixture, a source-copy check or the ordinary renderer suite passes.

The [workspace Preview contract](../doc_v1/interface/workspace-and-canvas.md#implementation-requirements-and-research), [Motion contract](../doc_v1/interface/motion.md) and [direct rendering policy](../doc_v1/architecture/system-architecture.md#direct-component-rendering) already require these boundaries.
The isolated library experiments remain research evidence rather than production integration certification.

## Resumption

After the ordinary bug-fix checkpoint, resume wrapped Row cross-axis Height Fill.
Start with native line sizing and independently available parent height, then verify supported preview/command behavior, history, locks, source preservation and save/reopen.
Windows, installed stable Chrome, screen readers, complete exports and broad animation performance remain unverified.

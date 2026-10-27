# Layout ownership

Native ordinary-layout ownership recognition and coordinate checks shared by Properties and canvas placement belong here.
Free and flow placement conversions and atomic frame layout switching also belong here.
frame-layout-validation.ts verifies the native candidate before publishing a layout command.
These helpers derive ownership from the rendered CSS and canonical parent relationship.
Ownership readouts do not save a second layout model or change authored sizing modes.
Cross-axis Fill recognition uses native computed automatic margins, including variable-resolved values, so intrinsic content is not mislabeled as stretch.
Layout switches explicitly capture participating children's Fixed Free sizes and Left/Top placement when leaving Flex.
frame-layout.ts also owns Row wrapping and its active CSS projection.
The frame's own --orc-row-wrap declaration preserves the Row choice while Column disables wrapping.
Native line membership remains derived from CSS rather than saved rows or measurements.
padding.ts reads authored physical padding ownership and prepares atomic paired or single-side CSS changes without flattening source expressions.
The [projection record](../../../backlog/native-layout-projection.md#ordinary-layout-switching) defines the CSS-owned distinction between normal Free placement and explicit Absolute Position.

gap.ts recognizes equal authored fixed-pixel gap axes and prepares one atomic shared-gap edit.
Unequal axes, incompatible priorities, resets, and source expressions stay available through Code.
alignment.ts reads authored alignment and prepares parent-only physical packed positions or native Space between, preserving source expressions and per-property priority.
absolute-placement.ts prepares measured participation changes through the existing Free/flow conversions, preserving the selected child's parent and sibling slot.
sizing.ts recognizes native per-axis ownership and prepares explicit ordinary Fixed/Fit, bounded Fill in nowrap Rows/Columns and wrapped Rows, and supported intrinsic Fill in ordinary nowrap frames.
New cross-axis Fill requires an ordinary nowrap Row or Column, or a wrapped Row, an owned parent extent traced to an independently authored bound, owned physical sizing/alignment, and no effective automatic cross margin.
It writes only the cross dimension and explicit stretch, preserving priorities, margins, limits and main-axis factors.
Wrapped Height Fill stretches within its native row and preserves the parent's align-content value.
Later width, content, decoration and wrapping changes reflow through CSS without saved row heights.
Owned nested Fill can trace the same physical axis through participating Fill ancestors to an active Fixed size or equal limits.
fill-dependencies.ts captures temporary supported Fill axes and checks candidate document membership after native previews.
Sizing, layout, wrapping, alignment, participation, pointer placement, deletion and text edits preserve those relationships or reject before commit.
Existing intrinsic relationships retain active Fixed/equal-limit contributions through participating canonical content.
Removing their sole contributor or erasing inherited Fill alignment rejects with an explanation; explicit supported Fixed/Fit exits remain available.
Workspace checks text candidates before Properties preview and through the shared Properties/canvas commit path.
The native sizing authority remains in sizing.ts; candidate membership never becomes a saved dependency graph.
Numeric Fill values remain read-only; supported explicit Fixed/Fit exits remain available under valid intrinsic parents.
A single bounded nowrap main-axis Fill retains the auto dimension, grow 1, shrink 0, and literal zero-pixel basis projection.
An owned sole intrinsic Column Fill uses auto height and basis with grow 1 and shrink 1 so independent content still contributes with a zero minimum.
Prospective intrinsic supply excludes the selected object's replaced Fixed dimension while retaining independently owned descendants, siblings, text and active bounds.
Parent Fit conversion includes necessary sole-height-Fill basis changes in the same command, stops at independent Fixed/equal-bound descendants, and checks locks only for actual dependent writes.
Intrinsic wrapped Row Height Fill follows each native row's extent, including a zero-height empty row when another row supplies content.
Shared intrinsic Column sizing uses the explicitly opted-in native projection described below.
fill-sharing.ts owns multiple-child equal outer sharing through child-local numeric CSS inputs and exact native variable expressions.
Its command preparation freezes the applied ownership, derives final membership and decoration from the proposed styles/reorder/delete edits, and appends only necessary dependent style changes.
Equivalent numeric input declarations are retained verbatim so a no-op does not create an unnecessary dependent write to a locked peer.
Entering shared Fill records the active box-sizing explicitly when its declaration was omitted.
Both joins and removals normalize the common basis, preserving native resize, minima, maxima, margins, overflow, priority, locks and atomic history without saved measured boxes.
Properties padding, sizing, participation changes, layout switching, pointer placement and deletion use that same preparation before their relevant preview and commit paths.
Unowned source expressions, competing logical properties, fractional border widths, and unresolved bounds remain available through Code.
Fixed participants with independent pixel dimensions remain supported beside Fill even when they have an aspect ratio.
Main-axis Fixed/Fit exits normalize understood Flex factors and remove inputs owned by the shared projection.
Wrapped Rows use the same source-derived common outer basis for native line formation and per-line sharing.
A sole wrapped Fill child uses that shared projection too; toggling wrapping prepares any needed child changes in the same atomic command.
Parent edits also inspect the parent's own child cohort when determining dependent style changes.
Unchanged parent layout declarations use the captured native display, direction and wrapping, preserving source variables while explicit proposed layout changes take precedence.
Broader intrinsic bounds, arbitrary source, logical ownership, and uncertain dependencies remain unfinished boundaries.

## Intrinsic Column projection

`layout-box.ts` distinguishes the canonical outer object from its exact generated inner Flex flow.
Canonical parent coordinates, paint, clipping, padding, borders, and dimensions use the outer box.
Flow membership, gaps, order, and distribution use the generated inner box.
`fill-sharing.ts` activates the own `--orc-intrinsic-column:1` declaration atomically when a supported content-sized Column gains multiple Fill children.
The shared source projector emits a versioned outer Grid and inner Flex box, while the canonical frame remains a Column with its existing IDs and children.
Percentage-bearing bases preserve intrinsic contribution and reuse native equal outer sharing with decoration compensation.
The wrapper remains mounted through later Fit/Fixed changes and membership reductions.
An explicit conversion away from Column removes the marker in the same command.
The first structural insertion belongs to Edit mode; later Preview sessions mount the applied structure.
There is no saved geometry or runtime sizing solver.

## Parent-edge Constraints

`constraints.ts` derives ordinary immediate-parent eligibility and prepares position-preserving per-axis mode changes or explicit Align center through existing CSS batches and native candidate validation.
`constraint-css.ts` recognizes the physical native projection shared by ownership, sizing and movement.
Start/End use one fixed inset, Fixed sizing and normal self-alignment.
Both uses opposing insets with normal self-alignment, auto dimensions for frames and native stretch dimensions for other ordinary boxes.
Normal alignment retains the start edge when a small parent and a size limit overconstrain the insets.
Source-authored stretch self-alignment and intrinsic replaced sizing without an explicit stretch dimension remain in Code.
Center uses unsafe native self-centering, zero-sum opposing pixel insets and Fixed sizing, with margin-box compensation.
Later size edits retain the border-box center relationship without adding a transform or changing fixed descendants' containing blocks.
Existing coordinate guards remain intact for arbitrary transforms, aspect-ratio coupling, logical/source-owned values and uncertain margins.
Ownership checks distinguish saved place-self declarations from browser serialization of the reviewed physical longhands.
Free reparenting remeasures the current relationship; joining Flex or workspace root clears editor centering in the same command.
`frameReference` excludes native scrollbar gutters and accounts for a reserved starting gutter before applying scroll and canvas scale.
Both-edge limits retain authored offsets, preserve the start edge and expose temporary end-margin conflicts without writing measured boxes back into the document.
Sizing bound traversal also follows recognized physical Both-edge relationships to an independently owned Fixed or equal-limit ancestor.
A nested constrained Row/Column can retain its main/cross Fill children without treating a measured box as an authored bound.
The same rule supports the existing opted-in Column projection and continues to reject loss of the sole parent supply.
`position.ts` derives read-only measured X/Y for supported End/Center axes without exposing CSS auto or a sizing label as a position.

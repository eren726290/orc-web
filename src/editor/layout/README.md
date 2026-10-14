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
sizing.ts recognizes native per-axis ownership and prepares explicit ordinary Fixed/Fit, bounded cross-axis Fill, and bounded main-axis Fill in nowrap Rows/Columns and wrapped Rows.
New cross-axis Fill requires an ordinary nowrap Row or Column, an independently authored parent bound, owned physical sizing/alignment, and no effective automatic cross margin.
It writes only the cross dimension and explicit stretch, preserving priorities, margins, limits and main-axis factors.
Numeric Fill values remain read-only; supported explicit Fixed/Fit exits remain available under valid intrinsic parents.
A single nowrap main-axis Fill retains the auto dimension, grow 1, shrink 0, and literal zero-pixel basis projection.
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
Wrapped cross-axis Fill, arbitrary source, logical ownership, and uncertain dependencies remain unfinished boundaries.

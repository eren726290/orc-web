# Design rendering

The native node renderer and rich-text run helpers belong here.
Canvas and Preview use this renderer; it projects the existing canonical document.

Edit removes design-owned Tab stops, autofocus and native content editing while retaining authored attributes for Preview and Code.
`svg-styles.ts` contains SVG selector rules within their vector using native CSS `@scope`, including nested media, supports, container and scope groups.
Global stylesheet definitions and external stylesheet imports are rejected by source preparation because `@scope` does not contain them.
Legacy or directly inserted SVG source cannot publish those global definitions through the renderer.
Runtime scope and Edit restrictions never rewrite saved SVG source.
SVG roots reset the editor preflight's display and vertical alignment without resetting presentation attributes such as fill and stroke.
The SVG exclusion has zero specificity so the following border-box default still wins for HTML objects.
A bordered/padded ordinary Fixed frame is a native rendering regression control.

Owned ordinary div Columns with `--orc-intrinsic-column: 1` use the shared native source projection.
Their outer object retains its identity, paint, placement, clipping and native attributes.
One generated inner Flex box contains the same ordered canonical children and inherits layout values from the outer object.
That box remains mounted across opted-in Fit/Fixed CSS changes.
First insertion changes React ancestry; the editor's structural conversion and Preview mounting policy owns that boundary.
This renderer does not import or rewrite source-backed React components.

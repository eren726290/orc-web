# Design rendering

The native node renderer and rich-text run helpers belong here.
Canvas and Preview use this renderer; it projects the existing canonical document.

Edit removes design-owned Tab stops, autofocus and native content editing while retaining authored attributes for Preview and Code.
`svg-styles.ts` contains SVG selector rules within their vector using native CSS `@scope`, including nested media, supports, container and scope groups.
Global stylesheet definitions and external stylesheet imports are rejected by source preparation because `@scope` does not contain them.
Legacy or directly inserted SVG source cannot publish those global definitions through the renderer.
Runtime scope and Edit restrictions never rewrite saved SVG source.

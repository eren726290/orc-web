# ORC-web backlog

This directory tracks ideas and decisions that still need discussion.
Backlog entries are not product requirements until they are accepted and recorded in [`../doc_v1/`](../doc_v1/README.md).

## Open topics

- Validate the recommended React, Vite, and browser-check foundation with the real ORC-web implementation before treating it as final.
- Run the [Fedora source-editing verification task](../doc_v1/architecture/react-source-editing-validation.md) in supported Google Chrome, then decide whether Babel plus Recast remains the source-editing choice.
- Define ORC-web's MCP server, SDK, transports, and tool dependencies last, after project, import, source-binding, and export implementation requirements are known.
- Adapt the original ORC's 39-tool inventory to ORC-web's loose workspace objects and frame operations.
- Define any desktop conversion path for the accepted ORC-web `.orc` folder format.
- Define component manifests, support for npx based import workflows, and behavior for packages that need unsupported runtime features.
- Record the exact current stable Chrome version used for each Fedora and Windows V1 verification run, and choose a minimum version only if implementation requires one.
- Review the accepted behavior and remaining proposals in the detailed [Flex layout](../doc_v1/interface/flex-layout.md) and [Constraints](../doc_v1/interface/constraints.md) documents derived from the user-supplied Paper transcripts.
- Define Flex defaults and Wrap in Flex eligibility, settle Fit/Fill sizing conflicts and overflow behavior, and verify keyboard shortcuts on Fedora KDE and Windows.
- Define the canonical layout schema and browser/CSS mapping, including constraint reference boxes, size limits, aspect ratios, transformed objects, and atomic MCP operations.
- Define the canonical rich-text data shape and range indexing, choose the redistributable default font, and settle accepted font file formats and family-name conflict behavior.

## Deferred beyond the first V1 workflow

- Reconsider Grid layout after Free, Row, and Column work well.
- Add marquee selection and bulk Properties editing after the basic several-object actions are proven in V1.
- Add alignment guides and snapping for object edges, centers, equal spacing, matching sizes, and frame padding after V1.
- Add SVG path, anchor-point, and Bézier-handle editing after the V1 SVG selection and styling workflow is proven.
- Define support for dynamic Tailwind expressions, custom plugins, arbitrary package CSS, and imported projects outside the V1 [Tailwind component workflow](../doc_v1/import-export/tailwind-components.md).

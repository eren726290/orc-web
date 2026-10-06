# MCP tools outside V1

## Status

Accepted release decisions recorded on 2026-10-05.
These public operations stay outside MCP V1, with a later release unassigned.
This file takes precedence over their historical rows in the [candidate catalog](tool-catalog.md).
It does not change the accepted design-editing tools or the application's existing project workflow.

## Project management

Keep `list_documents`, `create_document`, `open_document`, and `rename_document` outside MCP V1.
The person uses the browser's New/Open/recent-project and existing naming workflows, then the agent works on the active project.
The [project contract](../../doc_v1/architecture/orc-workspace-bundle.md#starting-and-opening-projects) retains one active project and the Untitled first-save flow.
The [MCP server](../../doc_v1/mcp/mcp-server.md#purpose-and-application-authority) continues serving that same active project to the agent.
This decision does not introduce another project selector or automatically rename a saved folder.

Revisit public project-management operations if a concrete workflow needs agent-controlled project listing, creation, opening, or naming.
At that time, define their relationship to active state, pending saves, unapplied Code, and browser project changes before writing tool contracts.

## Fresh whole-project validation

Keep the standalone `validate_document` tool outside MCP V1.
Each edit validates its candidate through the existing [command lifecycle](../../doc_v1/architecture/command-engine-and-history.md#command-lifecycle), including compilation and initial rendering where required.
Failed validation returns the known error and preserves the previous applied design and history.
`get_context` reports current known diagnostics; reading them does not run a fresh whole-project scan.
An initial-render check does not prove every later interaction or the full application's correctness.

Revisit a separate on-demand scan if agents need to freshly validate the entire project beyond the checks performed by individual commands.
Define its scope, render requirements, revision consistency, result limits, and unavailable-check reporting before promoting it to a public tool.

## Standalone font listing

Keep `list_fonts` outside MCP V1, with a later release unassigned.
Required authored fonts, project assets, and supported rendering/save/export remain part of the accepted design workflows.
The separate [import_asset contract](../../doc_v1/mcp/tools/import_asset.md) is accepted for V1 to register chosen supported images, SVG, or font files and return reusable managed references and relevant metadata.
Its required font loading supports ordinary HTML/CSS and React; registration does not add a standalone font-listing operation.

Revisit font enumeration when an agent needs a standalone list of available font families, weights, styles, or approved installed-font metadata.
Keep the existing approved-access boundary and distinguish project/default fonts from computer-specific references.
This does not accelerate the [V1.1 human font controls](../properties-panel-v1x.md#v11-properties-controls).

## Conditional-style management

Keep `list_style_conditions` and `update_style_conditions` outside MCP V1, with a later release unassigned.
Supported responsive, hover, focus, and dark-mode styles remain part of the existing [Tailwind component workflow](../../doc_v1/import-export/tailwind-components.md).
An agent identifies the relevant object/source owner through `get_source`, reads managed component CSS or Tailwind files through [get_component_source](../../doc_v1/mcp/tools/get_component_source.md), and applies supported related-file edits through `update_component_source`.
The existing source-update service rebuilds and validates that candidate before committing it.
This decision does not introduce a separate editable condition registry or broaden support for arbitrary CSS or computed class expressions.

Revisit standalone condition listing/editing when a concrete workflow needs structured condition management beyond the supported source path.
Define condition ownership and its relationship to authored styles before promoting either candidate to a public tool.

## Related release decisions

Public MCP [Undo/Redo](undo-redo-v11.md) has its own V1.1 schedule.
Saved Layer hide/show and MCP visibility mutations have their own [V1.1 schedule](../layer-visibility-v11.md).
The [active inventory](../../doc_v1/mcp/tools/README.md) records focused accepted tools; project information/selection remain in `get_context` and direct children use a shallow `get_tree` request.
Historical candidate rows remain unchanged for reference, without overriding these current responsibilities or release decisions.

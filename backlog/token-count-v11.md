# Tokens panel total count for V1.1

## Status

The Tokens panel's total token count display is scheduled for V1.1.
The [V1 panel](../doc_v1/interface/tokens-panel.md#placement-and-release-scope) places Search directly below Layers/Tokens without a redundant Design tokens heading or total count.

## Deferred display

Choose a compact presentation for the number of registered token definitions in the active project.
Count definitions rather than linked objects, individual uses, or matching direct values.
Keep Search directly below the tabs and avoid restoring the redundant panel heading.
The exact placement and how any filtered count is distinguished from the registry total remain V1.1 decisions.

## Existing V1 behavior

Individual token editors retain their reference counts so people can understand the effect of a shared-token change.
Authoritative in-use checks still protect deletion; hiding the panel total does not change those checks or MCP registry reads.

## Verification

Check empty and populated registries and active Search filters without confusing definition totals with individual reference counts.

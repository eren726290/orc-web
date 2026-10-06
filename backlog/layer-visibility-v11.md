# Saved Layer hide/show for V1.1

## Decision and scope

Saved Layer hide/show controls and public MCP visibility-setting mutations are excluded from V1 and scheduled for V1.1 by the user's scope correction.
The [Layers Visibility section](../doc_v1/interface/layers-panel.md#visibility) retains the researched future workflow.
Its former blanket V1 wording does not override this release decision.
Lock/unlock and optional frame Light/Dark/Inherit remain V1 responsibilities.

## V1 behavior to preserve

Keep supported authored CSS/React visibility, conditional rendering, existing saved values, and required rendering/save/export behavior.
Keep inspection of supported hidden/clipped content through its saved hierarchy where available.
Do not delete the persisted visibility representation simply because its dedicated editing control is deferred.
Editor Show content remains a separate viewing operation for supported menus/dialogs and does not change their saved default state.
This deferral does not disable source editing or require every component to remain visually open.

## Future implementation

Expose the existing saved visibility command through the Layers eye control and the appropriate MCP setting operation.
Retain stable target IDs, own versus inherited state, parent/child preservation, and reliable source ownership for supported React content.
One accepted toggle uses one shared application command and Undo step; failure leaves the prior design intact.
Keep saved visibility separate from temporary reveal, selection, expansion, and animation state.

Before release, verify parent hiding/showing with independently hidden children, inherited-state indicators, keyboard access, source-backed limits, MCP whole-call failures, application Undo/Redo, save/reopen, and export.
Use the actual editor and MCP endpoint on Fedora and Windows rather than treating documentation checks as implementation evidence.

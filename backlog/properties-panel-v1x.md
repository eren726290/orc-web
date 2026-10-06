# Properties panel and related editing work for V1.x

## Status

Deferred beyond V1 by the accepted Properties scope discussion.
This file records future work rather than promising delivery in a specific V1.x release.
The Fonts, Text, and SVG controls in [V1.1 Properties controls](#v11-properties-controls) are specifically scheduled for V1.1.
Other entries retain their later-version status until separately scheduled.
The current product contract is [Properties](../doc_v1/interface/properties-panel.md).

## Deferred controls

| Area | Deferred work | V1 behavior to retain |
| --- | --- | --- |
| Panel personalization | Custom section ordering and saved panel preferences. | Stable section order, relevant controls, and readable selection identity. |
| Layout | Grid authoring and additional layout features after their own discussion. | Agreed Flex, Constraints, padding, gap, and Fixed/Fit/Fill controls. |
| Appearance | Dedicated gradient, multiple-shadow, filter, blend-mode, and complex-outline editors. | Basic fill, border, radius, opacity, and one outer shadow; preserve supported imported effects in source. |
| Text | V1.1 individual typography and Overflow controls below; advanced OpenType feature controls and text effects remain later work. | Basic text-content editing, existing rendering and sizing, and supported source editing. |
| Fonts | V1.1 Import font, unavailable-font feedback, and Replace font controls below. | Existing authored-font rendering and supported source editing. |
| Images | Manual new-file insertion and visual image-position controls. | Replace existing images and choose Fit/Fill while preserving image positioning. |
| SVG | V1.1 Replace SVG below; manual insertion and anchor-point, path, and Bézier-handle editing remain later work. | Existing rendering, selection and transforms, supported fill/stroke controls, and source editing. |
| React recognition | Broader support for complex expressions and authored component shapes. | Per-value safe bindings, supported nested layers, source fallback, and clear edit ownership. |
| Tokens | V1.1 [Typography editors](typography-tokens-v11.md), [Light/Dark editors](token-modes-v11.md), and [imported-token panel integration](imported-token-management-v11.md). | Color/Spacing/Corner radius defaults, compatible pickers, preserved units, reference replacement, unlinking, and atomic create-and-apply; retain existing values and required imported styles. |
| Editing preferences | Custom adjustment modes and editing preferences. | Live valid changes, inline errors, Escape cancellation, and one Undo per completed adjustment. |
| Multiple selection | Mixed-value bulk Properties editing. | Select one object for Properties; existing compatible group actions and Export remain. |
| Duplication | Dedicated Duplicate action for objects, several selected objects, and local collection items. | Copy/Paste and Only this remain available without a Duplicate menu action. |

Custom panel docking is also deferred; V1 has resizable panels in the accepted workspace layout.
Manual frame creation remains deferred; existing and imported frames stay supported.
Marquee selection remains deferred alongside bulk editing.
Aliases and expanded token-management features remain deferred without a V1.1 commitment.

Visual image-position controls, including the nine-position picker, are scheduled for V1.x discussion.
V1 keeps Replace image and Fit/Fill, preserves imported or authored positions, and uses Center when no position is specified.
Existing positioning survives replacement, save/reopen, and export; Code or an agent can edit custom positioning.

## V1.1 Properties controls

These specific Properties controls are excluded from V1 and scheduled for V1.1 by the latest scope discussion.
The user clarified that the deferral concerns the listed controls, while Text and SVG remain rendering technologies supported by ORC-web.
Keep the existing Text, Fonts, and SVG research documents intact as the implementation plan.
Their earlier V1 wording does not override this narrower release decision for the controls below.

| Area | Controls scheduled for V1.1 | Preserved plan |
| --- | --- | --- |
| Text | Individual typography controls for font family, weight, size, line height, letter spacing, alignment, and color; the Visible, Clip, and Ellipsis Overflow choices. | [Text editing](../doc_v1/interface/text-editing.md#fonts-and-typography) and [Overflow](../doc_v1/interface/text-editing.md#overflow). |
| Fonts | Import font, Font unavailable feedback, and Replace font with its preview and confirmation workflow. | [Font management](../doc_v1/interface/font-management.md#choose-and-import) and [missing-font replacement](../doc_v1/interface/font-management.md#missing-fonts-and-replacement). |
| SVG | Replace SVG through Properties while preserving the existing artwork's supported box and settings. | [Replace SVG](../doc_v1/interface/svg-editing.md#replace-svg). |

This scheduling does not defer the Text tool, basic text-content editing, the browser's rendering of authored typography, existing SVG rendering or styling, or supported source editing.
It also does not remove declared text-valued component properties, such as a button's label, from V1's Component section.
Image replacement remains in V1.
SVG anchor-point editing and advanced OpenType controls keep their separate later-version status; this decision does not schedule them for V1.1.

Before implementing the V1.1 controls, use the preserved plans to verify source ownership, live rendering, one Undo per completed edit, asset replacement failure handling, and save/reopen and export preservation.
Do not rebuild the researched approach merely because its controls were delayed.

## Preservation and later evaluation

An unavailable visual control must not silently discard an imported style or effect.
Keep the supported authored source for rendering, save/reopen, and export, and provide Code editing for values without safe visual controls.
Adding a future Properties editor must retain source ownership, supported instance/shared scope, reliable Undo, and the component's behavior.
Broader React recognition needs evidence for each newly supported source shape rather than a promise to reverse arbitrary application logic.
Before accepting a deferred feature, settle its human workflow and verify the affected source and save/export paths.
For bulk edits, define compatible targets and atomic behavior before exposing Mixed values as editable controls.

## Related contracts

- [Workspace and canvas](../doc_v1/interface/workspace-and-canvas.md) owns tools, selection, context actions, and manual creation boundaries.
- [Tokens and modes](../doc_v1/interface/tokens-and-modes.md) owns token references and Light/Dark values.
- [Editable React components](../doc_v1/interface/react-components.md) owns nested editing, shared scope, and collection items.
- [Text editing](../doc_v1/interface/text-editing.md), [Font management](../doc_v1/interface/font-management.md), and [SVG editing](../doc_v1/interface/svg-editing.md) preserve the researched workflows with the control release timing above.

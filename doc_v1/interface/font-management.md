# Font management

## Status

Accepted V1 product behavior.
Authored-font rendering, source preservation, and supported project save/export remain V1 responsibilities.
The picker, Import font, Font unavailable feedback, and Replace font workflows below retain their researched plan under the [V1.1 Properties control schedule](../../backlog/properties-panel-v1x.md#v11-properties-controls).

## Goal

Fonts must keep a design visually stable when its `.orc` project moves between Fedora and Windows.
They affect text width, line breaks, box height, and therefore surrounding layout.

## Font sources

ORC-web presents fonts in three clear groups.

| Source | Availability | Project portability |
| --- | --- | --- |
| Project font | Copied into the `.orc` project's `assets/` folder. | Available wherever the project is opened. |
| Installed font | Available only on the current computer after the person approves access. | The project records the requested family and style but does not copy the font file. |
| Default font | Bundled with ORC-web for a new project. | Available without an internet connection. |

The font picker shows project fonts first, then approved installed fonts, then the default font.
Search uses family, weight, and style names.

## Choose and import

Selecting a font in Properties updates the selected text live.
Properties then shows the available weight and style choices for that family.
Choosing a family, weight, or style completes as one Undoable design edit.

Use **Import font** to add a font file to the project.
ORC-web copies the file into managed project assets only when the person confirms that the font may be included in the project.
The project then renders from that copied file on Fedora and Windows.

Choosing an installed font without importing it keeps a local font reference.
This is useful for a font that the person may use locally but may not redistribute.

## Missing fonts and replacement

When a project asks for a font that is unavailable on the current computer, ORC-web keeps the saved family, weight, and style choice.
It renders a fallback and shows **Font unavailable** on the affected text selection and in Properties.

Properties offers **Import font** and **Replace font**.
Import font adds the requested file to the project when the person has it and may include it.
Replace font opens the available choices and previews the candidate on the live canvas before confirmation.

The preview shows changed wrapping, text-box height, and any resulting parent layout change.
Choosing **Replace** commits the new family, weight, and style as one Undo step.
Choosing **Cancel** restores the previous displayed fallback and changes nothing in the saved design.

## Layout behavior

Changing a font never silently changes font size to preserve a previous line break.
The text object reflows under its current width, height, overflow, Flex, or Constraints rules.
The [Text editing](text-editing.md) document defines those rules.

If a font replacement changes a frame's content size, that frame follows its existing Fit, Fixed, or Fill sizing rules.
ORC-web shows the result live before a replacement is committed.

## Save and export

Project fonts save in the `.orc` folder with other managed assets.
React, HTML or CSS, image, and PDF exports use the project font files when they are available.
An export can include a copied project font only when its inclusion was confirmed at import time.

An installed-font reference is not copied into the project or export.
If that font is unavailable during export, ORC-web uses the displayed fallback and marks the export result as using a fallback font.

The [Workspace bundle](../architecture/orc-workspace-bundle.md) document defines where managed assets live.
The [Export](../import-export/export.md) document defines output behavior.

## Agent access

[import_asset](../mcp/tools/import_asset.md) is an accepted V1 operation for registering a chosen supported image, SVG, or font as a reusable managed resource.
Font registration preserves family/weight/style metadata and supplies required font loading for ordinary HTML/CSS and React without placing an object or assigning a new family.
It retains the inclusion, validation, save/export, and application-history rules above.
Required font files can also travel directly through supported source/import preparation and complete export.
The human font controls remain V1.1.

`list_fonts` stays [outside MCP V1](../../backlog/mcp/tool-release-scope.md#standalone-font-listing), with a later release unassigned.
Any future local-font listing retains the person's approved-access boundary and distinguishes project/default fonts from computer-specific references.

## Open implementation details

The bundled default font family and its redistribution license still need selection.
The accepted font file formats, family-name conflict behavior, and exact font-availability metadata remain implementation decisions.

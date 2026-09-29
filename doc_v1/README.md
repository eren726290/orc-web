# ORC-web V1 specification

## Purpose

ORC-web is a local browser-based design editor for web-native interfaces.
People run a local server and open ORC-web in their browser through localhost.
It is a separate browser-based alternative to the original ORC desktop application.
It does not inherit the original ORC architecture or document schema by default.

V1 targets Fedora Linux and Windows.
macOS is outside the V1 target.
The current Debian mobile setup is used for documentation only.
Implementation and platform verification happen on a Fedora 44 KDE Plasma and Windows 11 dual-boot PC.

## Reading this specification

This directory is self-contained for ORC-web.
An agent or contributor should start here and follow the linked documents for the area they are changing.
The original ORC documentation may provide historical context, but ORC-web decisions live here.
When this specification does not decide a topic, record it in [`../backlog/`](../backlog/README.md) rather than borrowing a desktop rule implicitly.

## Product map

| Area | Document | What it owns |
| --- | --- | --- |
| Architecture | [System architecture](architecture/system-architecture.md) | Local processes, authority, and data flow. |
| Browser support | [Browser support](architecture/browser-support.md) | Chrome support policy, local-server boundaries, clipboard, shortcuts, and verification. |
| Document data | [Canonical document model](architecture/canonical-document-model.md) | The saved design structure and invariants. |
| Projects and saving | [Workspace bundle](architecture/orc-workspace-bundle.md) | Untitled projects, `.orc` folders, autosave, and recovery. |
| Editing commands | [Command engine and history](architecture/command-engine-and-history.md) | Revisions, validation, Undo, and shared UI or agent edits. |
| Canvas | [Workspace and canvas](interface/workspace-and-canvas.md) | Infinite workspace, frames, layouts, and Edit or Preview. |
| Flex layout | [Flex layout](interface/flex-layout.md) | Accepted V1 behavior for wrapping, spacing, alignment, child sizing, and Absolute Position; defaults and implementation details remain open. |
| Constraints | [Constraints](interface/constraints.md) | Accepted V1 behavior for edge pins, centering, fixed margins, and proportional Stretch; ORC-web measurement details remain open. |
| Panels | [Layers and Properties](interface/layers-and-properties.md) | Hierarchy, selection, and human controls. |
| Text | [Text editing](interface/text-editing.md) | Creation, inline editing, typography, rich formatting, sizing, and clipboard behavior. |
| Fonts | [Font management](interface/font-management.md) | Project fonts, installed fonts, missing-font replacement, and portable output. |
| SVG | [SVG editing](interface/svg-editing.md) | Vector selection, supported styling, replacement, source editing, and V1 limits. |
| React components | [Editable React components](interface/react-components.md) | Source-backed layers, visual edit ownership, shared instances, hidden content, and collections. |
| Motion | [Motion](interface/motion.md) | Live source-authored animation, optional Still view in Edit, accessible motion, and still capture. |
| Code | [Code window](interface/code-window.md) | Unapplied session code, Apply, and shared component source. |
| Tokens | [Tokens and modes](interface/tokens-and-modes.md) | Shared values plus Light and Dark modes. |
| Imports | [Component import](import-export/component-import.md) | npm, npx, local, and shadcn imports. |
| Tailwind components | [Tailwind components](import-export/tailwind-components.md) | Supported source import, browser compilation, visual class edits, and faithful React export. |
| Exports | [Export](import-export/export.md) | React with CSS or Tailwind, HTML, images, and PDF. |
| Source mapping | [React source bindings](architecture/react-source-bindings.md) | Stable editor IDs that resolve visual component layers to authored React source. |
| Agents | [MCP server](mcp/mcp-server.md) | Local MCP endpoint, transport, and server behavior. |
| Agent tools | [Tool catalog](mcp/tool-catalog.md) | The 39 public V1 MCP tools. |
| Tool rules | [Command contracts](mcp/command-contracts.md) | Shared inputs, results, and command rules. |

## Status vocabulary

Accepted means the behavior is agreed for V1.
Proposed means the document gives a direction that still needs agreement or implementation validation.
Open means the decision belongs in the backlog.

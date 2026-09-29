# Browser support

## Status

Accepted V1 runtime target.

## Supported browser

ORC-web V1 supports the current stable desktop release of Google Chrome on Fedora Linux and Windows.
The release check records the exact Chrome version used on each operating system.
Older Chrome releases do not have a V1 support promise.

Chrome is the one browser used for V1 implementation and end-to-end verification.
Firefox, Microsoft Edge, Brave, and other browsers may render ordinary web content, but ORC-web does not promise that its editor workflow works there in V1.

## Local server and project folders

People run ORC-web through `http://localhost`.
The local server owns opening, saving, and exporting `.orc` project folders.
The project workflow does not rely on a browser directory picker, so project storage remains one local-server behavior rather than a different workflow for each browser.

The [Workspace bundle](orc-workspace-bundle.md) document defines Untitled projects, first Save, autosave, and recovery.

## Clipboard and shortcuts

Copy, cut, and paste use the standard keyboard actions when the canvas or an active text editor has focus.
ORC-web keeps a visible control for every essential action because some browser shortcuts belong to Chrome itself.
For example, ORC-web never claims Ctrl+W, Ctrl+L, or browser zoom shortcuts as editor shortcuts.

The editor requests clipboard access only from a direct person action when Chrome requires permission.
If Chrome declines clipboard access, ORC-web explains the failed action and keeps the current design unchanged.

## Installed fonts

Chrome can offer installed fonts only after the person explicitly requests them and grants the browser permission.
ORC-web does not scan or list installed fonts automatically.
Project fonts and the bundled default font remain available even if installed-font access is declined.

The complete font workflow is defined in [Font management](../interface/font-management.md).

## Verification

Before a V1 release, verify this complete workflow on current stable Chrome for both Fedora and Windows:

1. Start the local server and open ORC-web through localhost.
2. Create or open a project, then save and reopen it.
3. Create and edit text, import a project font, and replace an unavailable font.
4. Copy and paste text and canvas objects.
5. Pan, zoom, select, edit, Preview, and export a frame.

Record the Chrome version and operating-system version with the result.

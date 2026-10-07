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
The server also uses installed Chrome headlessly through Playwright for the accepted [local rendering service](system-architecture.md#local-rendering-service).
Candidate validation and visual capture can run with the editor tab closed; the local server still needs an active project and an available renderer.
Its application verification is separate from the historical headless experiment results below.

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

## Automated browser checks

During interactive development in the Codex desktop app, use its built-in [@Browser](https://learn.chatgpt.com/docs/browser) to open the local editor and check focused UI workflows.
With Developer mode enabled, it can inspect the page's DOM, applied styles, and console while we debug.
Use Playwright below for repeatable automated checks and the local rendering service.

Use Playwright with installed Google Chrome and `channel: "chrome"` for supported-browser checks.
Headless mode is the normal repeatable automation path for source edits, computed styles, interactions, and regression assertions.
Chrome runs the browser without displaying its window.
Modern Chrome shares its implementation between headless and visible modes, as documented in [Chrome Headless](https://developer.chrome.com/docs/automation-and-testing/headless).

Playwright's default bundled Chromium headless shell differs from installed Chrome's headless mode.
The original Debian experiment used that shell; Fedora PRs used installed Google Chrome headlessly.
See [Playwright browser channels](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge) and the [source-editing evidence](react-source-editing-validation.md).
Record the browser channel, headless or visible mode, exact browser version, operating system, and checked behavior with each result.

Headless fixture results establish the tested browser behavior, not the usability of the complete editor.
They do not certify Windows when the run happened only on Fedora.

## Release and visible-browser verification

Before a V1 release, verify this complete workflow on current stable Chrome for both Fedora and Windows:

1. Start the local server and open ORC-web through localhost.
2. Create or open a project, then save and reopen it.
3. Create and edit text, verify existing authored-font rendering and preservation, and retain saved font choices when fallback rendering is needed.
4. Copy and paste text and canvas objects.
5. Pan, zoom, select, edit, Preview, and export a frame.

Import font, Font unavailable feedback, and Replace font controls are scheduled for [V1.1](../../backlog/properties-panel-v1x.md#v11-properties-controls) and are not required V1 release checks.

Record the Chrome version and operating-system version with the result.
Also use visible Chrome on each supported platform to review actual dragging, typing, focus, nested scrolling, shortcuts, clipboard permissions, fonts, and visual placement alongside the editor panels.
Use automated assertions for repeatable correctness and visible review for the human workflow and platform integration.
Rerun passing experiment suites when relevant code, dependencies, or unresolved behavior changes; headless operation alone is not a reason to repeat all completed work.

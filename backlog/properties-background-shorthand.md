# Properties background shorthand correction

Status: corrected and verified in development and built Chromium on Linux.

## Reproduced observation

The clipping workflow screenshot shows a blue ordinary frame while its Properties Fill field says `transparent`.
The frame uses authored `background: #dce9f7`; the field currently reads only `background-color` and falls back to transparent.
The observation is retained in `artifacts/editor/clipping-parent-development-on.png` and the matching parent workflow result.
The relevant implementation is `src/editor/properties/Properties.tsx`, and the expected supported background/color control is defined in `doc_v1/interface/properties-panel.md` under Appearance.

## Required correction

Read the effective authored color using the browser's CSS declaration parser, including shorthand/longhand order and `!important`.
Keep background images, unrelated declarations, and priority intact when changing the color through the existing command engine.
Verify live preview, cancellation, one-command commit, exact Undo, and a clear Code boundary for unresolved shorthand owners in development and built modes.
Do not add a saved computed-color field or a gradient editor.

## Verification

The first regression run read `red` from an earlier longhand although the later background shorthand owned `rgb(51, 102, 153)`.
Its failing command, screenshot, trace, and tested source are retained in `artifacts/editor/appearance-baseline-result.json` and its linked files.
The next run exposed React's conflicting background shorthand/longhand update warning, retained in `appearance-attempt1-result.json` and its trace.
Ordinary nodes now use their existing native CSS projection once, preserving authored declaration order and priority without duplicate React style updates.
Properties parses the authored declaration to display its actual color and commits an ordered color override through one atomic command.
The development and built `bun run check:editor` regression passes normal and important shorthand precedence, gradient-image retention, preview/cancel, one revision, exact Undo, and an unresolved variable-shorthand Code boundary without browser errors.
`artifacts/editor/appearance-verification-result.json` records the tested commit, source hashes, command, browser, and results.
Rendering, Preview, atomic commands, movement, clipping, history, panels, types/build, lint, formatting, and Fallow were rerun after the correction.
The atomic check now waits for the acknowledged rendered revision before inspecting hierarchy; its retained timing failure is in `artifacts/editor/atomic-dom-timing-failure-result.json` and the built trace beside it.
These results do not certify installed Google Chrome, Windows, imported React styling, or component animations.

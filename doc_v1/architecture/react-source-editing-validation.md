# React source-editing validation

## Status

An isolated source-editing proof passed on the documentation machine.
Fedora Google Chrome verification is required before selecting the parser and source-editing packages for the real application.
Windows verification remains required for the supported-platform promise.

This document records evidence for an implementation decision.
It is not an ORC-web application implementation and does not expand the V1 product contract.

## Question evaluated

Can a source-backed visual edit reliably change authored React and Tailwind source, render the candidate in a browser, preserve the prior applied design when the candidate fails, Undo a completed edit, and reproduce the result after reopen?

The bounded candidate used `@babel/parser` for TSX parsing and Recast for structured source edits.
Tailwind compiled the static utility classes found in the fixture.
Bun built and served the browser candidate.
Playwright drove a real Chromium browser engine.

## Controlled fixture

The fixture contained two uses of one `Hero` React component and a local `products` array.
Each Hero rendered a Motion section, a Tailwind-styled heading, and independent React button state.
The headings used a declared `instanceId` binding.
Each product record used a declared product ID.

Those bindings deliberately model the source bindings ORC-web will need.
The proof did not inspect arbitrary runtime DOM and guess where its source came from.

## Passed checks

| Check | Result |
| --- | --- |
| Parse and print untouched TSX | The source remained byte-for-byte identical. |
| Initial React, Tailwind, and browser render | Both headings rendered at 36 px. |
| Edit selected Hero title | Changed only the selected instance and preserved quotes, braces, HTML-like text, and Unicode as literal text. |
| Edit shared heading size | Changed both instances from 36 px to 48 px and retained hover and responsive Tailwind utilities. |
| Choose Only this | Created an independent first Hero with medium font weight while the shared second Hero stayed bold. |
| Undo Only this | Removed the independent component and restored the shared source and rendering. |
| Edit one collection item | Changed only the selected product record. |
| Undo collection edit | Restored both the exact prior source and browser rendering. |
| Candidate runtime crash | Rejected the update and preserved applied source, browser design, history, and saved file. |
| Malformed TypeScript or JSX | The parser rejected the candidate. |
| Source preservation and interaction | The authored comment and Motion declaration remained, and the independent React button state still worked. |
| Save and reopen | A fresh browser context reproduced the final text, typography, and local product data. |

The proof ran with Bun 1.3.14, `@babel/parser` 7.29.9, Recast 0.24.0, React and React DOM 19.3.0, Tailwind CSS 4.3.3, Motion 13.4.4, and Playwright 1.63.0.
It used Playwright Chromium 153.0.8010.12 on Debian ARM64.

## What passed means

The proof demonstrates one full candidate path:

```text
Select a declared layer
→ resolve its declared source owner
→ parse and change source
→ compile Tailwind and build React
→ render the candidate in a browser
→ commit one revision and save
```

The candidate did not alter browser DOM as its durable result.
It changed the source that generated the browser content.
The failed-candidate check shows the intended command behavior: render before commit, then retain the previously applied version on failure.

## Limits

The proof does not prove any of the following:

- Automatic editable-layer discovery in arbitrary React, JSX, or package code.
- Cross-file import resolution and symbol ownership.
- Safe edits to computed expressions, template fragments, external data, or arbitrary dynamic Tailwind classes.
- Correct behavior of the real ORC-web command engine, `.orc` persistence, Properties panel, or MCP adapter.
- Fedora Google Chrome or Windows Google Chrome support.
- Motion timing or animation correctness.

The Debian screenshot showed missing emoji glyphs even though the source and DOM text preserved Unicode.
That is a machine-font issue and does not confirm portable font rendering.

## Fedora verification task

Run this task on Fedora 44 KDE Plasma with the current stable desktop release of Google Chrome.
Use a fresh local working directory and install the exact proof dependencies before running it.
Do not add the proof packages to ORC-web's application dependency list.

1. Recreate the controlled fixture described above with two `Hero` instances, the declared `instanceId` bindings, the local `products` array, one Motion section, and static Tailwind heading utilities.
2. Use `@babel/parser` 7.29.9 and Recast 0.24.0 to implement the same twelve checks in this document.
3. Run the browser checks through installed Google Chrome, not a bundled Chromium binary.
4. Record the Chrome version, Fedora version, Bun version, package versions, complete console output, and screenshots before, after, and after reopen.
5. Record each check as pass or fail, including the exact failing assertion and relevant browser error.
6. Compare the final saved source and rendered result after reopening in a fresh browser context.

If all twelve checks pass, report that this bounded candidate is confirmed on Fedora Chrome.
If one fails, report the failure without changing ORC-web documentation or implementation, then evaluate whether the issue belongs to the proof, a dependency, or the candidate approach.

## Decision rule

Keep Babel plus Recast as the leading source-editing candidate only if the Fedora Chrome task passes and subsequent ORC-web implementation can produce the declared source bindings described in [React source bindings](react-source-bindings.md).
Otherwise return to the checkpoint before this documentation update and reconsider the source-editing tool choice.

The implementation must still pass the same behavior through the real command engine before the product claims support.

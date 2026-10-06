# Fedora Chrome source-editing verification

## Result

All twelve assertions in the supplied bounded React source-editing proof passed on Fedora 44 using Google Chrome 154.0.8037.57.
The proof process exited with code 0.
The only change to the supplied proof runner was `channel: "chrome"` in Playwright's browser launch, so the run used installed Google Chrome rather than Playwright Chromium.

## Environment

| Item | Value |
| --- | --- |
| Operating system | Fedora Linux 44 KDE Plasma Desktop Edition |
| Architecture | x86_64 |
| Session | KDE Plasma 6.7.5 on Wayland |
| Browser | Google Chrome stable 154.0.8037.57 |
| Bun | 1.4.2 |
| Proof dependencies | Exact supplied npm lockfile versions |
| Motion | 13.4.4 in the isolated proof directory |
| Playwright | 1.63.0 |

The original mobile run used Bun 1.3.14 on Debian ARM64 with Playwright Chromium 153.0.8010.12.
The Fedora run used Bun 1.4.2 on Linux x64 with Google Chrome 154.0.8037.57.

## Passed assertions

1. Unchanged TSX parse and print preservation.
2. Initial React and Tailwind rendering with two 36 px headings.
3. One instance text edit with quotes, braces, HTML-like text, and Unicode.
4. Shared typography update with hover and responsive Tailwind utilities retained.
5. Only this creates an independent component.
6. Undo restores the shared component reference.
7. One local collection record changes.
8. Undo restores the previous collection source and rendering.
9. A crashing candidate keeps applied source, visible design, history, and saved state.
10. Malformed TypeScript or JSX is rejected.
11. The authored comment and Motion declaration survive, and React button interaction works.
12. Save and reopen reproduces final text, typography, and collection data.

The final source and saved design matched.
The final rendered view matched the supplied mobile baseline.
I inspected before, after, and reopened screenshots.
The seedling emoji rendered without missing-glyph boxes in Chrome.

## Scope

This confirms the supplied bounded example on Fedora Google Chrome.
It does not validate arbitrary React source recognition, cross-file bindings, the complete ORC-web editor, Motion timing correctness, or Windows support.
The detailed proof limits remain in [React source-editing validation](../doc_v1/architecture/react-source-editing-validation.md).

## Evidence

The isolated working directory was `/home/eren/D/orc-web-verification-bcEXsU/chrome-working`.
It contains `console.log`, `proof.exit`, `artifacts/report.json`, `after.tsx`, `saved-design.json`, and the three screenshots.
The proof dependencies were installed only in that isolated directory.
ORC-web source files and Git history were not changed by the proof run.

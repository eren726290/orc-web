# Corner radius workflow

Focused ordinary Properties checks for combined and individual corner radii live here.
The owning runner is ../check-corner-radius.ts, exposed as check:corner-radius.
Assertions follow the accepted Appearance contract in doc_v1/interface/properties-panel.md.
They verify native CSS, paint-only geometry, field interactions, source ownership, command/history safeguards, generated source, and project saving.
The runner records the actual browser, source hashes, commands, checks, screenshots, traces, and failures for development and built application modes.
These checks do not certify source-backed React controls, tokens, Windows, or unfinished image/PDF exporters.

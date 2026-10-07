# Editor tooling implementation checkpoint

Accepted development choices are recorded in [system architecture](../doc_v1/architecture/system-architecture.md#development-codebase-checks).

## Shadcn lint

Install and configure `@shadcn/lint` when the editor's semantic tokens and first shared component contracts exist.
Apply rules to the editor's controls and panels, with reviewed allowances for dynamic layout values.
Preserve imported design styles and canvas rendering requirements.
Verify both valid editor usage and deliberate violations through the configured lint command.
The scaffold has no editor token or component contracts yet, so this configuration is not installed or claimed complete.

## Bun backend type scope

The scaffold checks frontend source, Vite/Node tooling, and vendored lint rules with explicit Node and Vite ambient types.
Bun and Vite declarations conflict when their ambient globals are loaded together at the current pins.
When implementing the Bun backend, give its source a separate type scope with Bun ambient types and retain complete library checking in both scopes.
Do not silence the collision with `skipLibCheck`.

## Supported-platform verification

The scaffold's Chromium smoke checks do not certify installed Google Chrome or Windows.
Run the same browser checks with installed Chrome on Fedora and Windows, recording the exact executable and version.
The previous session's `/usr/bin/google-chrome-stable` launcher and `/opt/google/chrome/chrome` binary are absent in the current environment, and the Chrome RPM is not installed.
Make supported Google Chrome available before claiming Chrome runtime readiness.
The complete runtime, saving, command, export, and MCP verification remains the existing V1 implementation work.

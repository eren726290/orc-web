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

The backend now has its own `tsconfig.server.json` and passes complete library checking.
Bun 1.4.2 also refers to `TextEncoderEncodeIntoResult` and unqualified TLS names absent from the pinned Node 22 declarations.
`server/bun-compat.d.ts` supplies aliases to the equivalent Node types within the backend scope.
Recheck and remove that compatibility file when an upstream Bun/Node type update resolves the declaration errors.

## Fallow function-size reporting

Fallow 3.32.0 accepts `health.maxUnitSize: 40`, but a control containing a 44-line function produced no size finding and exited successfully.
Recheck this behavior when updating Fallow before relying on its health command to enforce function length.
Oxlint's native `max-lines-per-function` rule enforces the limit now and reads it from `.fallowrc.json`.
The tooling controls accept a 40-line function and reject a 41-line function.

`complexity-crap` is a warning because its score includes uncollected coverage as zero, independently of the accepted complexity limit.
Cyclomatic complexity 10 and cognitive complexity 15 remain blocking health rules.
Function size 40 remains a blocking Oxlint rule.
Retain and review CRAP findings alongside E2E evidence rather than adding low-value unit tests to change the score.

## Supported-platform verification

The scaffold's Chromium smoke checks do not certify installed Google Chrome or Windows.
Run the same browser checks with installed Chrome on Fedora and Windows, recording the exact executable and version.
The previous session's `/usr/bin/google-chrome-stable` launcher and `/opt/google/chrome/chrome` binary are absent in the current environment, and the Chrome RPM is not installed.
Make supported Google Chrome available before claiming Chrome runtime readiness.
The complete runtime, saving, command, export, and MCP verification remains the existing V1 implementation work.

# ORC-web

ORC-web V1 is a local browser editor under development.
This checkout provides the verified frontend scaffold and development checks.
Build and verify the Bun backend, editor workflows, saving, and exports first.
Implement MCP afterward on top of the working ORC-web V1 services.
See [implementation status](IMPLEMENTATION_STATUS.md) and the [V1 specification](doc_v1/README.md).

## Development

Use Bun 1.4.2 and Node.js 22.23.2 or a compatible newer Node release for the verified toolchain.
Install the locked dependencies with `bun install --frozen-lockfile`.
Run `bun run dev` and open the printed localhost URL.
The current command starts Vite only; the combined Bun backend launch remains implementation work.

## Checks

```sh
bun run check:types
bun run lint
bun run check:tooling
bun run check:format
bun run build
bun run check:browser
bun run check:codebase
bun run check:health
```

`check:browser` requires installed Google Chrome and verifies development and production-preview mounting.
Set `ORC_CHROME_EXECUTABLE` to the full Chrome executable path if it is installed outside Playwright's standard Chrome location.
`check:browser:chromium` is an explicit fallback smoke check with Playwright Chromium and does not certify Chrome support.
Browser and tooling results go to ignored `artifacts/scaffold/`.
Fallow findings require review before any removal; a finding is not automatic deletion authority.
Run `check:codebase` and `check:health` after substantial changes and before release.
`check:health` enforces the cyclomatic complexity limit in `.fallowrc.json`.
`lint` enforces its function-size limit through Oxlint's native rule, including blank lines, comments, and immediately invoked functions.
`bun run format` formats scaffold source and configuration without rewriting project documentation or vendored upstream rules.
See [scaffold verification](SCAFFOLD_VERIFICATION.md) for tested versions, results, and limitations.

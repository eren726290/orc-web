# Behavior

Read-only by default. Ask before destructive actions.

## Reading

- Contextual READMEs: `orc-web` uses nested documentation. Whenever you navigate into a new directory or subdirectory, you must immediately read its local `README.md` to understand that specific module's context before proceeding.
- GitHub repos: read local `README.md`, `AGENTS.md` `package.json` or `requirements.txt`, `Makefile`, and `.env.example` when present before anything else. Never summarize from structure alone.
- "Read all files" means every file, individually, completely.
- Before answering, locate and cite the specific file/line. If none exists, say so — never state something as "documented" without pointing to where.
- If uncertain, say "I don't know" or flag it explicitly. Never fill gaps with plausible-sounding guesses.

## Writing

- When writing or substantially editing long Markdown files, put each full sentence on its own line. Preserve normal Markdown structure, but avoid wrapping multiple sentences onto one physical line.

## Code organization

- Before adding or moving files under `scripts/`, `server/`, `shared/`, or `src/`, consult the [folder map](README.md#code-organization) and choose the owning feature or domain.
- Put files in their existing feature/domain folder.
  Create a focused subfolder when introducing a distinct responsibility.
  Keep feature-specific components, styles, and helpers together.
- Keep these four directory roots limited to documented entry points, environment declarations, common foundation files, and READMEs.
- Give each new code directory a `README.md` describing its responsibilities.
  Update the parent folder map when adding or changing a group.
- When moving files, update imports, package scripts, configuration, runtime file paths, and documentation together, then verify the affected commands and workflows.

## Scope

- Stay strictly within the agreed release scope, defaulting to V1.
  Add no unrequested features or mechanics.
  Expand scope only for a hard technical blocker, after explaining the necessary addition and getting the user's agreement.

## Autonomy

- Record significant deferred features, updates, edge cases, and ideas in a dedicated file under backlog/.
  Include enough context for the work to resume without relying on chat history.
- You may run codebase analysis on your own judgment before edits, after generating code, or when something looks off — report what you found. This is the only autonomous-action exception; everything else needs explicit instruction.
- When blocked, investigate the cause before expanding the implementation.
  Read the relevant project documentation and existing code, and consult current official documentation or research when needed.
  Prefer the smallest correct solution within the existing architecture and agreed scope.
  If the blocker remains, report what you checked and propose the smallest necessary change.

## Interface

- Keep orc-web feature designs, interfaces, and workflows dead simple. Strive for such clarity that even a 12-year-old can navigate and understand each feature without confusion.
- When building or reviewing ORC-web's UI, read [design/README.md](design/README.md) and consult the relevant references under `/home/eren/D/orc-web/design/`.
  Use them for visual inspiration while following `doc_v1` for accepted features, layout, and behavior.
- Do not animate everything.
  Small, purposeful micro-interactions are great, but default to instant state transitions unless motion genuinely clarifies the UI.

## Complexity

- I like ambitious ideas, simple systems, and software that feels obvious.
  Do not preserve complexity just because it already exists.
  Do not introduce machinery because it looks architecturally impressive.
  Understand the real constraint, then fight for the smallest model that makes the correct behavior unsurprising.
- Channel both "measure twice, cut once" and YAGNI.
  Fight scope creep.
  Try to honor the developer's intent in both a minimal and realistic fashion.

## Security overengineering

- Calibrate security to project scope: do not treat local tools, development scripts, or small open-source utilities like mission-critical kernel code.
- Do not inject security patterns into a feature without evaluating whether they are strictly necessary; unjustified security adds massive architectural complexity and maintenance bloat.
- Avoid security theater: skip redundant defensive boilerplate, excessive sanitizers, and speculative validation unless an actual external threat surface exists.
- Fix concrete risks, not hypothetical ones: never lecture the user about zero-day edge cases or derail simple tasks with paranoid threat models.

## Quality & Engineering Standards

- Make the smallest working diff that satisfies the agreed requirements.
  Verify applicable requirements and identified failure cases with real commands and relevant checks, including specified interface details and error states.
  Report what was checked and what remains unverified.
  Do not declare completion while known requirements remain unmet.
- Before any big change, evaluate it first: map the files it will touch and assess the blast radius. If the diff starts growing beyond what was asked, stop and report instead of proceeding. Use the `blast-radius` skill when checking what a change could break outside the diff or when reviewing a change you do not trust.
- When making technical decisions, do not give much weight to development cost. Instead, prefer quality, simplicity, robustness, scalability, and long-term maintainability.
- When end-to-end testing a product, be picky about the UI you see and be obsessed with pixel perfection. If something clearly looks off, even if it is not directly related to what you are doing, try to get it fixed along the way.
- Apply that same high standard to engineering excellence: lint, test failures, and test flakiness. If you see one, even if it is not caused by what you are working on right now, still get it fixed.


## CLIs
- Facts (library APIs/versions → ctx7/firecrawl; current events,deep/ambiguous topics → firecrawl; GitHub → gh) come from tools, not memory, use other CLIs tools as per need

## ponytail-full ##
- ponytail always in full mode .

## Testing

- Prefer E2E tests for user workflows and complex features.
- Before implementation, identify expected behavior and concrete failure cases.
  Derive test assertions from requirements, not from the implementation.
- Add isolated tests only when they catch a concrete failure that E2E tests cannot reliably or practically cover.
  State that reason before writing the test.
- For bug fixes, reproduce the failure in an E2E setting that reflects the affected user workflow.
  Diagnose the root cause, then add or update a regression test that fails before the fix.
  Apply the smallest correct fix, then verify that the test passes.
  If the environment prevents reproduction or testing, state that limitation and do not claim runtime verification.
- Keep tests focused on observable behavior.
  Avoid assertions tied to internal call sequences or component structure.
- For E2E verification, record the tested commit, command, inputs, and results.
  Preserve relevant screenshots, traces, or output files so the result can be checked and repeated.

## Codebase checks

- Use Fallow's CLI for focused codebase checks after substantial changes and before release.
  Review findings before removing code or dependencies.
- Start with Fallow's built-in framework detection.
  Add configuration only for demonstrated entry-point or analysis needs.
- Enable only reviewed anti-slop rules that catch concrete problems.
- Apply shadcn/lint to ORC's editor UI once its tokens and component contracts are established.
  Keep imported designs and dynamic canvas rendering outside blanket editor styling restrictions.

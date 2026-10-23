import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";
import { sharedColumn } from "./intrinsic-sizing/shared-column";
import { core } from "./intrinsic-sizing/core";
import { projection } from "./intrinsic-sizing/projection";
import { guards } from "./intrinsic-sizing/guards";
import { persistence } from "./intrinsic-sizing/persistence";
import { wrapped } from "./intrinsic-sizing/wrapped";
import { placement } from "./intrinsic-sizing/placement";
import type { Suite } from "./intrinsic-sizing/support";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_INTRINSIC_EVIDENCE ?? "verification";
const scenario = process.env.ORC_INTRINSIC_SCENARIO ?? "all";
const modes = process.env.ORC_INTRINSIC_MODES ?? "development+built";
assert.ok(
  [
    "all",
    "core",
    "projection",
    "guards",
    "persistence",
    "wrapped",
    "placement",
    "shared-column",
  ].includes(scenario),
);
assert.ok(["development", "built", "development+built"].includes(modes));
const executable =
  channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : chromium.executablePath();
assert.ok(executable, "Set ORC_CHROME_EXECUTABLE for an exact Chrome identity");
const executableSha256 = createHash("sha256")
  .update(await readFile(executable))
  .digest("hex");
await mkdir("artifacts/editor", { recursive: true });
const temporary = await mkdtemp(join("artifacts/editor", "intrinsic-fixtures-"));
const before = sourceEvidence();
const checks: string[] = [];
const inputs: unknown[] = [];
const browser = await chromium.launch({ channel, executablePath: executable });
let failure: string | null = null;
try {
  if (modes !== "built") await verifyMode(browser, "development");
  if (modes !== "development") await verifyMode(browser, "built");
  assert.deepEqual(
    sourceEvidence().sourceHashes,
    before.sourceHashes,
    "Checks require frozen source",
  );
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    JSON.stringify(
      {
        ...before,
        after: sourceEvidence(),
        channel,
        browserVersion: browser.version(),
        executable,
        executableSha256,
        modes,
        phase,
        scenario,
        command: `ORC_INTRINSIC_EVIDENCE=${phase} ORC_INTRINSIC_MODES=${modes} ORC_INTRINSIC_SCENARIO=${scenario} bun scripts/e2e/editor/check-intrinsic-sizing.ts ${channel}`,
        requirements: [
          "doc_v1/interface/flex-layout.md:217",
          "doc_v1/interface/flex-layout.md:234",
          "doc_v1/interface/properties-panel.md:205",
          "doc_v1/interface/text-editing.md:37",
        ],
        open: [
          "Source-backed React rewriting",
          "Complete product exporters",
          "Windows and stable desktop Chrome verification",
        ],
        checks,
        inputs,
        failure,
      },
      null,
      2,
    ),
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("Intrinsic sizing editor workflow passed\n");

async function verifyMode(browser: Browser, mode: "development" | "built") {
  assert.deepEqual(
    sourceEvidence().sourceHashes,
    before.sourceHashes,
    "Application launch requires frozen source",
  );
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("flushSync")) errors.push(message.text());
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const suite: Suite = { page, mode, temporary, inputs, checks, artifact };
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await exercise(suite);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    const exit = await app.stop();
    inputs.push({ mode, exit, errors, appOutput: app.output });
    assert.equal(exit, 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
  }
}
async function exercise(suite: Suite) {
  const scenarios = {
    core,
    projection,
    guards,
    wrapped,
    placement,
    persistence,
    "shared-column": sharedColumn,
  };
  for (const [name, workflow] of Object.entries(scenarios)) {
    if (scenario !== "all" && scenario !== name) continue;
    inputs.push({ mode: suite.mode, scenario: name, startedAt: new Date().toISOString() });
    await workflow(suite);
  }
}
function artifact(name: string) {
  return join("artifacts/editor", `intrinsic-${phase}-${channel}-${scenario}-${name}`);
}

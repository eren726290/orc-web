import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";
import { inputBoundary } from "./boundary-input";
import { geometryBoundary } from "./boundary-geometry";
import { svgBoundary } from "./boundary-svg";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_BOUNDARY_EVIDENCE ?? "verification";
const scenario = process.env.ORC_BOUNDARY_SCENARIO ?? "all";
assert.ok(["all", "input", "geometry", "svg"].includes(scenario));
await mkdir("artifacts/editor", { recursive: true });
const temporary = await mkdtemp("artifacts/editor/boundary-fixtures-");
const evidence = sourceEvidence();
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
let failure: string | null = null;
try {
  await verifyMode("development");
  if (process.env.ORC_BOUNDARY_MODES !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    JSON.stringify(
      {
        ...evidence,
        after: sourceEvidence(),
        channel,
        browser: browser.version(),
        scenario,
        executable: process.env.ORC_CHROME_EXECUTABLE ?? null,
        command: `ORC_BOUNDARY_EVIDENCE=${phase} ORC_BOUNDARY_SCENARIO=${scenario} ORC_BOUNDARY_MODES=${process.env.ORC_BOUNDARY_MODES ?? "both"} bun scripts/e2e/editor/check-boundaries.ts ${channel}`,
        modes: process.env.ORC_BOUNDARY_MODES ?? "both",
        checks,
        failure,
      },
      null,
      2,
    ),
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("renderer boundary checks passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    if (scenario === "all" || scenario === "input") await inputBoundary(page);
    if (scenario === "all" || scenario === "geometry") await geometryBoundary(page);
    if (scenario === "all" || scenario === "svg")
      await svgBoundary(page, join(process.cwd(), temporary), mode);
    assert.deepEqual(errors, []);
    checks.push(`${mode}: ${scenario} passed`);
    await page.screenshot({ path: artifact(`${mode}.png`) });
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`) });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
  }
}

function artifact(suffix: string) {
  return `artifacts/editor/boundaries-${phase}-${channel}-${scenario}-${suffix}`;
}

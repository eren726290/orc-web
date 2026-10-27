import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";
import { boundarySeed } from "./boundary-support";
import { fixture, select } from "./corner-radius/support";
import { radiusWorkflow } from "./corner-radius/workflow";
import { radiusSafeguards } from "./corner-radius/safeguards";
import { radiusPersistence } from "./corner-radius/persistence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_RADIUS_EVIDENCE ?? "verification";
const modes = process.env.ORC_RADIUS_MODES ?? "development+built";
assert.ok(["development", "built", "development+built"].includes(modes));
await mkdir("artifacts/editor", { recursive: true });
const evidence = sourceEvidence();
const checks: string[] = [];
const inputs: unknown[] = [];
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
let failure: string | null = null;
try {
  if (modes !== "built") await verifyMode("development");
  if (modes !== "development") await verifyMode("built");
  assert.deepEqual(
    sourceEvidence().sourceHashes,
    evidence.sourceHashes,
    "Verification source is frozen",
  );
} catch (cause) {
  failure = cause instanceof Error ? (cause.stack ?? cause.message) : String(cause);
  throw cause;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    JSON.stringify(
      {
        ...evidence,
        after: sourceEvidence(),
        channel,
        browserVersion: browser.version(),
        executable: process.env.ORC_CHROME_EXECUTABLE ?? null,
        command: `ORC_RADIUS_EVIDENCE=${phase} ORC_RADIUS_MODES=${modes} bun run check:corner-radius ${channel}`,
        fixture: fixture(),
        checks,
        inputs,
        failure,
      },
      null,
      2,
    ),
  );
}
process.stdout.write("corner radius workflow passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("/api/commands"))
      inputs.push({ mode, request: request.postDataJSON() });
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await boundarySeed(page, fixture());
    await select(page);
    await radiusWorkflow(page, checks);
    await radiusSafeguards(page, checks);
    await radiusPersistence(page, mode, checks);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(`${mode}: no uncaught browser errors; owned app exits cleanly`);
  } catch (cause) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw cause;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
  }
}

function artifact(name: string) {
  return `artifacts/editor/corner-radius-${phase}-${name}`;
}

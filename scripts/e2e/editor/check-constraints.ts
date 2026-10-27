import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";
import { boundarySeed } from "./boundary-support";
import { fixture, select } from "./constraints/support";
import { constraintSafeguards } from "./constraints/safeguards";
import { constraintIndicators } from "./constraints/indicators";
import { constraintPersistence } from "./constraints/persistence";
import { constraintPlacement } from "./constraints/placement";
import { replacedConstraints } from "./constraints/replaced";
import { constrainedFill } from "./constraints/fill";
import { constraintsWorkflow } from "./constraints/workflow";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_CONSTRAINT_EVIDENCE ?? "verification";
const modes = process.env.ORC_CONSTRAINT_MODES ?? "development+built";
assert.ok(["development", "built", "development+built"].includes(modes));
await mkdir("artifacts/editor", { recursive: true });
const evidence = sourceEvidence(),
  checks: string[] = [],
  inputs: unknown[] = [];
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
let failure: string | null = null;
try {
  if (modes !== "built") await verifyMode("development");
  if (modes !== "development") await verifyMode("built");
  assert.deepEqual(sourceEvidence().sourceHashes, evidence.sourceHashes);
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
        command: `ORC_CONSTRAINT_EVIDENCE=${phase} ORC_CONSTRAINT_MODES=${modes} bun run check:constraints ${channel}`,
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
process.stdout.write("constraints workflow passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode),
    context = await browser.newContext({
      baseURL: app.url,
      viewport: { width: 1440, height: 1000 },
    });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("[vite]")) inputs.push({ mode, console: message.text() });
  });
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) inputs.push({ mode, navigation: frame.url() });
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("/api/commands"))
      inputs.push({ mode, request: request.postDataJSON() });
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await page.goto(app.url);
    await createProject(page);
    await runWorkflow(page, mode);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
    checks.push(`${mode}: no uncaught browser errors; owned app shuts down cleanly`);
  } catch (cause) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw cause;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    inputs.push({ mode, runtime: app.output });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
  }
}
function artifact(name: string) {
  return `artifacts/editor/constraints-${phase}-${name}`;
}

async function runWorkflow(page: Page, mode: string) {
  const count = checks.length;
  process.stdout.write(`${mode}: controls and native sizing\n`);
  await constraintsWorkflow(page, checks);
  process.stdout.write(`${mode}: safeguards\n`);
  await constraintSafeguards(page, checks);
  process.stdout.write(`${mode}: indicators\n`);
  await constraintIndicators(page, checks);
  process.stdout.write(`${mode}: placement\n`);
  await constraintPlacement(page, checks);
  process.stdout.write(`${mode}: images and vectors\n`);
  await replacedConstraints(page, checks);
  process.stdout.write(`${mode}: constrained Fill\n`);
  await constrainedFill(page, checks);
  process.stdout.write(`${mode}: persistence\n`);
  await constraintPersistence(page, mode, checks);
  for (let i = count; i < checks.length; i++) checks[i] = `${mode}: ${checks[i]}`;
}

async function createProject(page: Page) {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await boundarySeed(page, fixture());
  await select(page);
}

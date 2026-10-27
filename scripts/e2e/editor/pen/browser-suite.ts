import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { launchApp } from "../../../support/app-process";
import { sourceEvidence } from "../../../support/editor-evidence";
import type { Suite } from "../intrinsic-sizing/support";

export async function runPenBrowserSuite(
  name: string,
  token: string,
  workflow: (suite: Suite) => Promise<void>,
) {
  const directory = `artifacts/pen-${name}`;
  await mkdir(directory, { recursive: true });
  const executable =
    process.env.ORC_CHROME_EXECUTABLE ??
    "/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome";
  process.env.ORC_CHROME_EXECUTABLE = executable;
  const browser = await chromium.launch({ executablePath: executable });
  const inputs: unknown[] = [];
  const checks: string[] = [];
  const before = sourceEvidence();
  let failed: string | null = null;
  try {
    for (const mode of ["development", "built"] as const)
      await verify(browser, directory, mode, inputs, checks, workflow);
    assert.deepEqual(sourceEvidence().sourceHashes, before.sourceHashes);
    console.log(token);
  } catch (error) {
    failed = error instanceof Error ? (error.stack ?? error.message) : String(error);
    throw error;
  } finally {
    await browser.close();
    await save(directory, {
      ...before,
      after: sourceEvidence(),
      command: `bun scripts/e2e/editor/pen/check-${name}.ts chrome`,
      executable,
      browserVersion: browser.version(),
      inputs,
      checks,
      failed,
    });
  }
}

async function save(directory: string, result: unknown) {
  await writeFile(join(directory, "result.json"), JSON.stringify(result, null, 2));
}

async function verify(
  browser: Browser,
  directory: string,
  mode: "development" | "built",
  inputs: unknown[],
  checks: string[],
  workflow: (suite: Suite) => Promise<void>,
) {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const artifact = (name: string) => join(directory, name);
  const suite: Suite = { page, mode, temporary: directory, inputs, checks, artifact };
  try {
    await page.goto(app.url);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await workflow(suite);
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
  }
}

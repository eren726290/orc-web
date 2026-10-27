import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { sha256, bytes } from "../../../../solver/pen/build.json";
import { launchApp } from "../../../support/app-process";
import { sourceEvidence } from "../../../support/editor-evidence";
import { documentFor, waitRevision } from "./support";
import { drawPath, dragAndCancel, insufficientDraft } from "./editor-flow";
import { cancelLoading, loadFailure, pendingUndo, returnToStart } from "./failure-flow";
import { continuationAndDeletion, guideToggle } from "./interaction-flow";

import { guideReadability } from "./guide-readability";

const directory = "artifacts/pen-editor";
await mkdir(directory, { recursive: true });
const executable =
  process.env.ORC_CHROME_EXECUTABLE ??
  "/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome";
const browser = await chromium.launch({ executablePath: executable });
const results: unknown[] = [];
let failed: string | null = null;
try {
  for (const mode of ["development", "built"] as const) await verify(mode);
  console.log("PEN_EDITOR_PASSED");
} catch (error) {
  failed = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    join(directory, "result.json"),
    JSON.stringify(
      {
        ...sourceEvidence(),
        command: "bun scripts/e2e/editor/pen/check-editor.ts chrome",
        executable,
        browserVersion: browser.version(),
        results,
        failed,
      },
      null,
      2,
    ),
  );
}

async function verify(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 1000 },
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const errors: string[] = [];
  const commands: unknown[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/commands") commands.push(request.postDataJSON());
  });
  try {
    const result = await exercise(page, app.url, mode);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: join(directory, `${mode}.png`), fullPage: true });
    results.push({ mode, ...result, errors, commands });
  } catch (error) {
    await page.screenshot({ path: join(directory, `${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: join(directory, `${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
  }
}

async function exercise(page: Page, url: string, mode: string) {
  await page.goto(url);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await loadFailure(page);
  const response = await cancelLoading(page);
  await assertWasm(response);
  const created = await drawPath(page);
  const moved = await dragAndCancel(page);
  await returnToStart(page);
  await pendingUndo(page);
  await insufficientDraft(page);
  await continuationAndDeletion(page);
  await guideToggle(page);
  await saveReopen(page, mode);
  await guideReadability(page, mode);
  return {
    created,
    moved,
    wasm: { url: response.url(), status: response.status(), bytes, sha256 },
  };
}

async function assertWasm(response: import("playwright").Response) {
  const loaded = await response.body();
  assert.equal(response.status(), 200);
  assert.equal(loaded.byteLength, bytes);
  assert.equal(createHash("sha256").update(loaded).digest("hex"), sha256);
}

async function saveReopen(page: Page, mode: string) {
  const before = await documentFor(page);
  const temporary = await mkdtemp(join(directory, `${mode}-bundle-`));
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Save project", exact: true });
  await dialog.getByLabel("Project name", { exact: true }).fill("Pen workflow");
  await dialog.getByLabel("Save in folder", { exact: true }).fill(join(process.cwd(), temporary));
  await dialog.getByRole("button", { name: "Save project", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const saved = await documentFor(page);
  assert.deepEqual(saved, { ...before, name: "Pen workflow" });
  await page.getByRole("button", { name: "Close Pen workflow", exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  const open = page.getByRole("dialog", { name: "Open project", exact: true });
  await open
    .getByLabel("Project folder", { exact: true })
    .fill(join(process.cwd(), temporary, "Pen workflow.orc"));
  await open.getByRole("button", { name: "Open project", exact: true }).click();
  await open.waitFor({ state: "hidden" });
  await waitRevision(page, before.revision);
  assert.deepEqual(await documentFor(page), saved);
}

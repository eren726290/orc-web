import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";
import { folderRace, independentProjects, saveRecovery } from "../projects/editor-recovery";
import { sourceWorkflow } from "./editor-source";
import { appearanceProperties, pendingPropertyHistory, propertyPreview } from "./editor-properties";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium", "Use chrome or chromium");
const artifacts = "artifacts/editor";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "foundation-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
try {
  for (const mode of ["development", "built"] as const) await verifyMode(mode);
  await writeFile(
    join(artifacts, "foundation.json"),
    `${JSON.stringify({ ...sourceEvidence(), channel, browserVersion: browser.version(), command: `bun run check:editor ${channel}`, checks }, null, 2)}\n`,
  );
  process.stdout.write("editor verification passed\n");
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error" && !entry.location().url.includes("/api/commands"))
      errors.push(entry.text());
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await verifyWorkflow(page, app, mode);
    await page.screenshot({ path: join(artifacts, `${mode}-editor.png`), fullPage: true });
    assert.deepEqual(errors, [], "No browser errors");
    checks.push(
      `${mode}: text, pending-edit Undo/Redo, rejected commands, save/reopen, independent projects, folder response races, save failure, Retry, Code Apply/Discard, invalid source, draft safeguards including Escape and Dashboard reload, live property preview/cancel/commit/invalid input, background shorthand precedence/image/priority preservation and Code boundary, no browser errors`,
    );
  } catch (failure) {
    await page.screenshot({ path: join(artifacts, `${mode}-failure.png`), fullPage: true });
    throw failure;
  } finally {
    await context.tracing.stop({ path: join(artifacts, `${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
    checks.push(`${mode}: graceful shutdown`);
  }
}

async function verifyWorkflow(
  page: Page,
  app: Awaited<ReturnType<typeof launchApp>>,
  mode: string,
) {
  await createText(page);
  await pendingPropertyHistory(page);
  await editAndHistory(page);
  await verifyCommands(page, mode);
  await saveReopen(page, mode);
  await independentProjects(page, `Verified ${mode}`);
  await folderRace(page, join(process.cwd(), temporary, `Verified ${mode}.orc`));
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Edited design", { exact: true })
    .click();
  await saveRecovery(page, app);
  await sourceWorkflow(page);
  await propertyPreview(page);
  await appearanceProperties(page);
}

async function createText(page: Page) {
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).click();
  const input = page.getByRole("textbox", { name: "Edit canvas text" });
  await input.fill("My first design");
  await input.press("Escape");
  await page.getByRole("textbox", { name: "Content", exact: true }).waitFor();
  assert.equal(await page.locator(".canvas-world [data-orc-id]").innerText(), "My first design");
  assert.equal(await page.locator(".layer-row.selected").count(), 1);
}

async function editAndHistory(page: Page) {
  const input = page.getByRole("textbox", { name: "Content", exact: true });
  await input.fill("Edited design");
  await page.getByRole("application", { name: "Canvas" }).click();
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Edited design", { exact: true })
    .waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("My first design", { exact: true })
    .waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+Shift+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Edited design", { exact: true })
    .waitFor();
}

async function verifyCommands(page: Page, mode: string) {
  const before = parseSession(await (await page.request.get("/api/session")).json());
  const project = before.projects[0];
  assert.ok(project);
  const id = project.document.workspaceRootIds[0];
  const base = {
    projectId: project.document.id,
    commandId: crypto.randomUUID(),
    expectedRevision: project.document.revision,
  };
  const response = await page.request.post("/api/commands", {
    data: { ...base, expectedRevision: 0, mutation: { kind: "rename", id, name: "Stale" } },
  });
  assert.equal(response.status(), 400);
  assert.deepEqual(parseSession(await (await page.request.get("/api/session")).json()), before);
  await verifyLockedCommand(page, base, id);
  checks.push(`${mode}: stale and locked commands leave applied state and history unchanged`);
}

async function verifyLockedCommand(
  page: Page,
  base: { projectId: string; commandId: string; expectedRevision: number },
  id: string,
) {
  const lock = await page.request.post("/api/commands", {
    data: { ...base, mutation: { kind: "lock", id, locked: true } },
  });
  assert.equal(lock.status(), 200);
  const locked = parseSession(await lock.json());
  const denied = await page.request.post("/api/commands", {
    data: {
      ...base,
      commandId: crypto.randomUUID(),
      expectedRevision: base.expectedRevision + 1,
      mutation: { kind: "delete", ids: [id] },
    },
  });
  assert.equal(denied.status(), 400);
  assert.deepEqual(parseSession(await (await page.request.get("/api/session")).json()), locked);
  const unlock = await page.request.post("/api/commands", {
    data: {
      ...base,
      commandId: crypto.randomUUID(),
      expectedRevision: base.expectedRevision + 1,
      mutation: { kind: "lock", id, locked: false },
    },
  });
  assert.equal(unlock.status(), 200);
}

async function saveReopen(page: Page, mode: string) {
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Verified ${mode}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), temporary));
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const folder = join(process.cwd(), temporary, `Verified ${mode}.orc`);
  const saved: unknown = JSON.parse(await readFile(join(folder, "document.json"), "utf8"));
  const session = parseSession(await (await page.request.get("/api/session")).json());
  assert.deepEqual(saved, session.projects[0].document);
  await page.getByRole("button", { name: `Close Verified ${mode}`, exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(folder);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Edited design", { exact: true })
    .waitFor();
  const reopened = parseSession(await (await page.request.get("/api/session")).json());
  assert.deepEqual(reopened.projects[0].document, saved);
  assert.equal(reopened.projects[0].canUndo, false);
}

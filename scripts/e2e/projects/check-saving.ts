import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { mkdirSync, unlinkSync, watch } from "node:fs";
import { hostname } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { chromium, type Browser, type Page } from "playwright";
import { acquireBundle, createBundle } from "../../../server/projects/bundle";
import { emptyDocument } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { object, string } from "../../../shared/validation";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const artifacts = "artifacts/editor";
const phase = process.env.ORC_SAVING_EVIDENCE === "before" ? "before" : "verification";
const checks: string[] = [];
const observations: Record<string, unknown>[] = [];
if (process.argv[2] === "--lock-child") await lockChild();
else await verify();

async function verify() {
  const channel = process.argv[2] ?? "chromium";
  assert.ok(channel === "chrome" || channel === "chromium", "Use chrome or chromium");
  await mkdir(artifacts, { recursive: true });
  const temporary = await mkdtemp(join(process.cwd(), artifacts, "bundle-saving-fixtures-"));
  const browser = await chromium.launch({
    channel,
    executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
  });
  let failure: string | null = null;
  try {
    for (const mode of ["development", "built"] as const)
      await verifyMode(browser, temporary, mode);
    await verifyLocks(temporary);
    process.stdout.write("bundle saving passed\n");
  } catch (error) {
    failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
    throw error;
  } finally {
    await browser.close();
    await writeFile(
      artifact("result.json"),
      `${JSON.stringify(
        {
          ...sourceEvidence(),
          channel,
          browserVersion: browser.version(),
          command: `bun scripts/e2e/projects/check-saving.ts ${channel}`,
          phase,
          checks,
          observations,
          failure,
        },
        null,
        2,
      )}\n`,
    );
    await rm(temporary, { recursive: true, force: true });
  }
}

async function verifyMode(browser: Browser, temporary: string, mode: "development" | "built") {
  const app = await launchApp(mode);
  const root = join(temporary, mode);
  await mkdir(root);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await createDesign(page);
    await firstSave(page, root, mode);
    await saveAs(page, root, mode);
    await preserveUnexpectedFiles(page, root, mode);
    await preserveExistingBundle(page, root, mode);
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    for (const project of (await session(page)).projects)
      await page.request.post("/api/projects/close", {
        data: { projectId: project.document.id, discard: true },
      });
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    for (const folder of await readdir(root))
      assert.ok(!(await readdir(join(root, folder))).includes(".orc.lock"));
    checks.push(`${mode}: graceful shutdown releases writable locks`);
  }
}

async function createDesign(page: Page) {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).click();
  const field = page.getByRole("textbox", { name: "Edit canvas text" });
  await field.fill("Before save");
  await field.press("Escape");
  await editText(page, "Ready to save");
}

async function editText(page: Page, content: string) {
  const field = page.getByRole("textbox", { name: "Content", exact: true });
  await field.fill(content);
  const response = page.waitForResponse(
    (entry) => new URL(entry.url()).pathname === "/api/commands",
  );
  await field.press("Tab");
  assert.equal((await response).status(), 200);
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText(content, { exact: true })
    .waitFor();
}

async function firstSave(page: Page, root: string, mode: string) {
  const before = await session(page);
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await configureSave(page, root, "Original");
  await recoverSave(page, root, mode, "Original", before);
  const saved = await session(page);
  assert.equal(saved.projects[0]?.document.id, before.projects[0]?.document.id);
  assert.equal(saved.projects[0]?.document.revision, before.projects[0]?.document.revision);
  assert.equal(saved.projects[0]?.canUndo, true);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Before save", { exact: true })
    .waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+Shift+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Ready to save", { exact: true })
    .waitFor();
  await waitSaved(page);
  checks.push(
    `${mode}: failed first Save retains applied identity and executable Undo/Redo history`,
  );
}

async function saveAs(page: Page, root: string, mode: string) {
  const original = join(root, "Original.orc");
  const bytes = await readFile(join(original, "document.json"), "utf8");
  const lock = await readFile(join(original, ".orc.lock"), "utf8");
  await prepareSaveAs(page, original, "Save as content");
  assert.equal(await readFile(join(original, "document.json"), "utf8"), bytes);
  assert.equal(await readFile(join(original, ".orc.lock"), "utf8"), lock);
  const before = await session(page);
  await configureSave(page, root, "Copy");
  await recoverSave(page, root, mode, "Copy", before);
  assert.equal(await readFile(join(original, "document.json"), "utf8"), bytes);
  assert.ok(!(await readdir(original)).includes(".orc.lock"));
  const saved = (await session(page)).projects[0];
  assert.equal(saved?.document.id, before.projects[0]?.document.id);
  assert.equal(saved?.document.revision, before.projects[0]?.document.revision);
  assert.equal(saved?.canUndo, before.projects[0]?.canUndo);
  checks.push(
    `${mode}: failed Save as retains original bytes/lock/history until the new save succeeds`,
  );
}

async function prepareSaveAs(page: Page, folder: string, content: string) {
  const moved = `${folder}.probe-moved`;
  await rename(folder, moved);
  try {
    await editText(page, content);
    await page.getByRole("button", { name: "Save failed", exact: true }).waitFor();
  } finally {
    await rename(moved, folder);
  }
  await page.getByRole("button", { name: "Save failed", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save as", exact: true }).click();
}

async function configureSave(page: Page, root: string, name: string) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Project name", exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "Save in folder", exact: true }).fill(root);
}

async function submitSave(page: Page) {
  const response = page.waitForResponse(
    (entry) => new URL(entry.url()).pathname === "/api/projects/save",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Save project", exact: true }).click();
  return response;
}

async function submitFault(page: Page, fault: ReturnType<typeof publicationFault>) {
  try {
    return await submitSave(page);
  } finally {
    fault.finish();
  }
}

async function recoverSave(
  page: Page,
  root: string,
  mode: string,
  name: string,
  before: Awaited<ReturnType<typeof session>>,
) {
  const fault = publicationFault(root, name, "missing temporary");
  const response = await submitFault(page, fault);
  assert.equal(response.status(), 400);
  const error = object(await response.json());
  assert.ok(string(error.error).includes("rename"), "Fault reaches real document publication");
  assert.deepEqual(await session(page), before, "Failed publication preserves the whole session");
  await page.getByRole("dialog").getByRole("alert").waitFor();
  await page.screenshot({ path: artifact(`${mode}-${name}-failure.png`), fullPage: true });
  await assert.rejects(
    stat(fault.folder),
    { code: "ENOENT" },
    "Rollback removes only the new empty folder",
  );
  const retried = await submitSave(page);
  assert.equal(
    retried.status(),
    200,
    "The same name succeeds once the injected storage fault stops",
  );
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  observations.push({
    mode,
    name,
    error,
    failedSessionRetained: true,
    sameNameRetryStatus: retried.status(),
  });
  checks.push(
    `${mode}: ${name} publication failure removes owned empty destination and permits same-name retry`,
  );
}

function publicationFault(
  root: string,
  name: string,
  kind: "missing temporary" | "unexpected file",
) {
  const folder = join(root, `${name}.orc`);
  let injected = false;
  let failure: unknown;
  const watcher = watch(root, { recursive: true }, (_event, entry) => {
    const relative = entry?.toString();
    if (injected || failure) return;
    try {
      if (kind === "unexpected file" && relative === `${name}.orc`) {
        mkdirSync(join(folder, "document.json"));
        injected = true;
      } else if (
        kind === "missing temporary" &&
        relative?.startsWith(`${name}.orc/.document-`) &&
        relative.endsWith(".tmp")
      ) {
        unlinkSync(join(root, relative));
        injected = true;
      }
    } catch (error) {
      failure = error;
    }
  });
  return {
    folder,
    finish: () => {
      watcher.close();
      if (failure) throw failure;
      assert.ok(injected, "The owned storage fault must reach the actual Save write");
    },
  };
}

async function preserveUnexpectedFiles(page: Page, root: string, mode: string) {
  await prepareSaveAs(page, join(root, "Copy.orc"), "Unexpected-file preservation");
  const before = await session(page);
  await configureSave(page, root, "Unexpected");
  const fault = publicationFault(root, "Unexpected", "unexpected file");
  const response = await submitFault(page, fault);
  assert.equal(response.status(), 400);
  assert.deepEqual(await session(page), before);
  assert.deepEqual(await readdir(fault.folder), ["document.json"]);
  assert.ok((await stat(join(fault.folder, "document.json"))).isDirectory());
  await rmdir(join(fault.folder, "document.json"));
  await rmdir(fault.folder);
  await page.getByRole("dialog").press("Escape");
  await page.getByRole("button", { name: "Save failed", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await waitSaved(page);
  checks.push(`${mode}: failed Save as preserves unexpected files and releases only its new lock`);
}

async function preserveExistingBundle(page: Page, root: string, mode: string) {
  const original = join(root, "Original.orc");
  const bytes = await readFile(join(original, "document.json"), "utf8");
  const before = await session(page);
  const response = await page.request.post("/api/projects/save", {
    data: {
      projectId: before.activeProjectId,
      parent: root,
      name: "Original",
    },
  });
  assert.equal(response.status(), 400);
  assert.deepEqual(await session(page), before);
  assert.equal(await readFile(join(original, "document.json"), "utf8"), bytes);
  checks.push(`${mode}: an existing destination is never removed or overwritten`);
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

async function waitSaved(page: Page) {
  for (let count = 0; count < 200; count++) {
    if ((await session(page)).projects[0]?.saveStatus.kind === "saved") return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Owned project autosave did not complete");
}

async function verifyLocks(temporary: string) {
  await metadataFailure(temporary, "metadata");
  await metadataFailure(temporary, "metadata-create");
  await permissionFailure(temporary);
  await competingWriters(temporary);
  for (const host of [hostname(), "another-probe-host"]) await existingLock(temporary, host);
}

async function metadataFailure(temporary: string, mode: "metadata" | "metadata-create") {
  assert.notEqual(
    process.platform,
    "win32",
    "The EFBIG fault control requires a POSIX child file-size limit; Windows needs independent verification",
  );
  const folder = join(temporary, `${mode}.orc`);
  const bytes = `${JSON.stringify(emptyDocument())}\n`;
  if (mode === "metadata") {
    await mkdir(folder);
    await writeFile(join(folder, "document.json"), bytes);
  }
  const child = startChild(mode, mode === "metadata" ? folder : temporary, true);
  try {
    assert.equal(await child.exited, 1);
    assert.ok(
      child.lines.join("\n").includes("EFBIG"),
      "Real failed metadata write remains the reported cause",
    );
    if (mode === "metadata") {
      assert.deepEqual(
        await readdir(folder),
        ["document.json"],
        "Failed metadata leaves no empty lock",
      );
      assert.equal(await readFile(join(folder, "document.json"), "utf8"), bytes);
    } else
      await assert.rejects(
        stat(folder),
        { code: "ENOENT" },
        "Acquisition failure rolls back its new empty folder",
      );
    observations.push({ mode, output: child.lines });
    checks.push(
      `${mode}: real EFBIG retains its cause, closes its handle, and removes owned lock/empty folder`,
    );
  } finally {
    await stopChild(child);
  }
}

async function permissionFailure(temporary: string) {
  assert.notEqual(
    process.platform,
    "win32",
    "Directory permission fault injection requires independent Windows verification",
  );
  const folder = join(temporary, "permission.orc");
  await mkdir(folder);
  await chmod(folder, 0o500);
  try {
    await assert.rejects(acquireBundle(folder), { code: "EACCES" });
    assert.deepEqual(await readdir(folder), []);
    checks.push("Lock creation reports real EACCES instead of claiming another writer exists");
  } finally {
    await chmod(folder, 0o700);
  }
}

async function competingWriters(temporary: string) {
  const folder = join(temporary, "competing.orc");
  await mkdir(folder);
  const children = [startChild("normal", folder), startChild("normal", folder)];
  try {
    const results = await Promise.all(children.map((child) => child.ready));
    assert.equal(results.filter((result) => result.startsWith("ACQUIRED=")).length, 1);
    assert.equal(results.filter((result) => result.startsWith("FAILED=")).length, 1);
    const bytes = await readFile(join(folder, ".orc.lock"), "utf8");
    const denied = await startDeniedChild(folder);
    assert.equal(await readFile(join(folder, ".orc.lock"), "utf8"), bytes);
    observations.push({ mode: "competing writers", results, denied, lockBytes: bytes });
    checks.push(
      "Competing processes grant exactly one writable bundle and preserve its lock on refused open",
    );
  } finally {
    for (const child of children) await stopChild(child);
  }
  assert.deepEqual(await readdir(folder), []);
}

async function existingLock(temporary: string, host: string) {
  const folder = join(temporary, host === hostname() ? "stale.orc" : "foreign.orc");
  await mkdir(folder);
  const bytes = JSON.stringify({ pid: 2_147_483_647, host, probeStale: true });
  await writeFile(join(folder, ".orc.lock"), bytes);
  const delayed = startChild("delayed-stale", folder);
  try {
    const result = await delayed.first;
    const other = await startDeniedChild(folder);
    assert.ok(
      result.startsWith("FAILED="),
      "Existing stale lock is refused without racy reclamation",
    );
    assert.equal(await readFile(join(folder, ".orc.lock"), "utf8"), bytes);
    observations.push({ mode: "existing lock", host, result, other, bytes });
    checks.push(
      `${host}: stale/foreign locks are never deleted and refusal explains manual recovery`,
    );
  } finally {
    await stopChild(delayed);
  }
}

async function startDeniedChild(folder: string) {
  const child = startChild("normal", folder);
  try {
    const result = await child.ready;
    assert.ok(result.startsWith("FAILED="), "A second process cannot acquire the existing lock");
    assert.ok(
      result.includes(".orc.lock") && result.includes("confirm"),
      "Refusal explains safe recovery",
    );
    assert.equal(await child.exited, 1);
    return result;
  } finally {
    await stopChild(child);
  }
}

function startChild(mode: string, folder: string, limited = false) {
  const script = join(process.cwd(), "scripts/e2e/projects/check-saving.ts");
  const args = [script, "--lock-child", mode, folder];
  const child = limited
    ? spawn(
        "bash",
        ["-c", 'ulimit -f 0; exec "$@"', "owned-lock-check", process.execPath, ...args],
        { stdio: ["ignore", "pipe", "pipe"] },
      )
    : spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  const lines: string[] = [];
  let firstResolve: (line: string) => void;
  let readyResolve: (line: string) => void;
  const first = new Promise<string>((resolve) => {
    firstResolve = resolve;
  });
  const ready = new Promise<string>((resolve) => {
    readyResolve = resolve;
  });
  const exited = new Promise<number | null>((resolve) => child.once("exit", resolve));
  child.stderr.on("data", (chunk: Buffer) => lines.push(chunk.toString()));
  createInterface({ input: child.stdout }).on("line", (line: string) => {
    lines.push(line);
    firstResolve(line);
    if (/^(?:ACQUIRED|FAILED)=/u.test(line)) readyResolve(line);
  });
  return { process: child, lines, first, ready, exited };
}

async function stopChild(child: ReturnType<typeof startChild>) {
  if (child.process.exitCode === null && child.process.signalCode === null)
    child.process.kill("SIGTERM");
  const timer = setTimeout(() => child.process.kill("SIGKILL"), 10_000);
  try {
    await child.exited;
  } finally {
    clearTimeout(timer);
  }
}

async function lockChild() {
  const mode = string(process.argv[3]);
  const folder = string(process.argv[4]);
  if (mode.startsWith("metadata")) process.on("SIGXFSZ", () => undefined);
  if (mode === "delayed-stale") delayStaleRead();
  try {
    const bundle =
      mode === "metadata-create"
        ? await createBundle(folder, "metadata-create")
        : await acquireBundle(folder);
    if (mode.startsWith("metadata")) {
      process.stdout.write(`ACQUIRED=${JSON.stringify({ pid: process.pid, mode })}\n`);
      await bundle.release();
      return;
    }
    const timer = setTimeout(() => process.exit(2), 15_000);
    process.on("SIGTERM", () => {
      void bundle.release().finally(() => {
        clearTimeout(timer);
        process.exit(0);
      });
    });
    process.stdout.write(`ACQUIRED=${JSON.stringify({ pid: process.pid, mode })}\n`);
  } catch (error) {
    process.stdout.write(`FAILED=${JSON.stringify({ mode, message: String(error) })}\n`);
    process.exitCode = 1;
  }
}

function delayStaleRead() {
  const original = JSON.parse;
  JSON.parse = (raw: string, reviver?: Parameters<typeof JSON.parse>[1]) => {
    const value: unknown = original(raw, reviver);
    if (
      typeof value === "object" &&
      value !== null &&
      "probeStale" in value &&
      value.probeStale === true
    ) {
      process.stdout.write(`STALE_READ=${process.pid}\n`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2_000);
    }
    return value;
  };
}

function artifact(suffix: string) {
  return join(artifacts, `bundle-saving-${phase}-${suffix}`);
}

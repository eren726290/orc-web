import assert from "node:assert/strict";
import { readFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { Page } from "playwright";
import { parseSession } from "../../../shared/session/session";
import type { launchApp } from "../../support/app-process";
import type { ProjectSnapshot } from "../../../shared/document/model";

export async function independentProjects(page: Page, name: string) {
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Edited design", { exact: true })
    .click();
  const before = await session(page);
  const first = before.projects[0];
  assert.ok(first);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  assert.equal((await session(page)).activeProjectId, first.document.id);
  await createOtherProject(page);
  await rejectInactiveEdit(page, first);
  await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("textbox", { name: "Content", exact: true }).waitFor();
  await until(
    async () =>
      (await page.getByRole("textbox", { name: "Content", exact: true }).inputValue()) ===
      "Edited design",
  );
  assert.equal(
    await page.getByRole("textbox", { name: "Content", exact: true }).inputValue(),
    "Edited design",
  );
  await page.getByRole("button", { name: "Untitled", exact: true }).click();
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Second project", { exact: true })
    .waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+Shift+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Second project", { exact: true })
    .waitFor();
  await closeUnsaved(page);
  await page.getByRole("button", { name, exact: true }).click();
}

async function createOtherProject(page: Page) {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).click();
  await page.getByRole("textbox", { name: "Edit canvas text" }).fill("Second project");
  await page.getByRole("textbox", { name: "Edit canvas text" }).press("Escape");
  await page.getByRole("textbox", { name: "Content", exact: true }).waitFor();
}

async function rejectInactiveEdit(page: Page, first: ProjectSnapshot) {
  const both = await session(page);
  assert.equal(both.projects.length, 2);
  assert.deepEqual(both.projects[0], first);
  const denied = await page.request.post("/api/commands", {
    data: {
      projectId: first.document.id,
      expectedRevision: first.document.revision,
      commandId: crypto.randomUUID(),
      mutation: { kind: "delete", ids: first.document.workspaceRootIds },
    },
  });
  assert.equal(denied.status(), 400);
  assert.deepEqual(await session(page), both);
}

async function closeUnsaved(page: Page) {
  await page.getByRole("button", { name: "Close Untitled", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal((await session(page)).projects.length, 2);
  await page.getByRole("button", { name: "Close Untitled", exact: true }).click();
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal((await session(page)).projects.length, 1);
}

export async function folderRace(page: Page, folder: string) {
  const release = await holdFolderResponse(page, "**/api/folders?path=");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Project folder", exact: true });
  assert.equal(
    await input.isDisabled(),
    true,
    "Initial folder discovery must not replace an editable input mid-keystroke",
  );
  const initial = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/folders",
  );
  release();
  await initial;
  await page.unroute("**/api/folders?path=");
  await input.waitFor();
  const finish = await holdFolderResponse(page, "**/api/folders?path=*");
  await page.getByRole("button", { name: "Parent folder", exact: true }).click();
  await input.fill(folder);
  const navigated = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/folders",
  );
  finish();
  await navigated;
  assert.equal(await input.inputValue(), folder);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal((await session(page)).projects.length, 1);
  await page.unroute("**/api/folders?path=*");
}

async function holdFolderResponse(page: Page, pattern: string) {
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(pattern, async (route) => {
    const response = await route.fetch();
    await ready;
    await route.fulfill({ response });
  });
  return release;
}

export async function saveRecovery(page: Page, app: Awaited<ReturnType<typeof launchApp>>) {
  const before = await session(page);
  const project = before.projects[0];
  assert.ok(project?.path);
  const folder = project.path;
  const moved = `${folder}.moved`;
  await rename(folder, moved);
  try {
    const failed = await reproduceSaveFailure(page, project, moved);
    app.child.kill("SIGTERM");
    await until(() => app.output.some((line) => line.includes("Keep ORC-web open")));
    assert.equal((await page.request.get("/api/session")).status(), 200);
    assert.equal(app.child.exitCode, null);
    await rename(moved, folder);
    await page.getByRole("button", { name: "Save failed", exact: true }).click();
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page
      .getByRole("button", { name: "Save failed", exact: true })
      .waitFor({ state: "hidden" });
    const recovered = await session(page);
    assert.deepEqual(recovered.projects[0]?.document, failed.projects[0]?.document);
    assert.equal(recovered.projects[0]?.canUndo, true);
    assert.equal(recovered.projects[0]?.saveStatus.kind, "saved");
    assert.deepEqual(
      JSON.parse(await readFile(join(folder, "document.json"), "utf8")),
      recovered.projects[0]?.document,
    );
  } finally {
    await rename(moved, folder).catch((error: unknown) => {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    });
    await page.request.post("/api/projects/retry", { data: { projectId: project.document.id } });
  }
}

async function reproduceSaveFailure(page: Page, project: ProjectSnapshot, moved: string) {
  await page
    .getByRole("textbox", { name: "Content", exact: true })
    .fill("Retained after save failure");
  await page.getByRole("application", { name: "Canvas" }).click();
  await page.getByRole("button", { name: "Save failed", exact: true }).waitFor();
  const failed = await session(page);
  assert.equal(failed.projects[0]?.saveStatus.kind, "failed");
  assert.equal(failed.projects[0]?.canUndo, true);
  assert.deepEqual(
    JSON.parse(await readFile(join(moved, "document.json"), "utf8")),
    project.document,
  );
  return failed;
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

async function until(condition: () => boolean | Promise<boolean>) {
  const deadline = Date.now() + 10_000;
  while (!(await condition())) {
    assert.ok(Date.now() < deadline, "Expected process output before timeout");
    await delay(25);
  }
}

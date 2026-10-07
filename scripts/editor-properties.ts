import assert from "node:assert/strict";
import type { Page } from "playwright";
import { parseSession } from "../shared/session";

export async function propertyPreview(page: Page) {
  const before = parseSession(await (await page.request.get("/api/session")).json());
  const project = before.projects[0];
  assert.ok(project);
  const id = project.document.workspaceRootIds[0];
  const layer = page.locator(`[data-orc-id="${id}"]`);
  const x = page.getByRole("spinbutton", { name: "X", exact: true });
  await x.fill("140");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).left), "140px");
  assert.deepEqual(
    parseSession(await (await page.request.get("/api/session")).json()).projects[0]?.document,
    project.document,
  );
  await x.press("Escape");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).left), "60px");
  assert.deepEqual(
    parseSession(await (await page.request.get("/api/session")).json()).projects[0]?.document,
    project.document,
  );
  await x.fill("145");
  await x.press("Enter");
  await page
    .getByRole("textbox", { name: "Object source" })
    .getByText(/left: 145px/u)
    .waitFor();
  const after = parseSession(await (await page.request.get("/api/session")).json());
  assert.equal(after.projects[0]?.document.revision, project.document.revision + 1);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page
    .getByRole("textbox", { name: "Object source" })
    .getByText(/left: 60px/u)
    .waitFor();
}

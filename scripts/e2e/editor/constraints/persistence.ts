import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { nodeSource } from "../../../../shared/source/html-source";
import { box, change, close, select, session, selectField } from "./support";

export async function constraintPersistence(page: Page, mode: string, checks: string[]) {
  await source(page);
  await saveReopen(page, mode);
  await select(page);
  await page.locator(".constraint-controls").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `artifacts/editor/constraints-${process.env.ORC_CONSTRAINT_EVIDENCE ?? "verification"}-${mode}-controls.png`,
    fullPage: true,
  });
  checks.push(
    "Saved CSS retains responsive constraints in generated standalone source and real project save/reopen",
  );
}
async function source(page: Page) {
  await change(page, "width", "center");
  await change(page, "height", "end");
  const before = await box(page),
    project = (await session(page)).projects[0];
  const source = nodeSource(project.document, "parent");
  assert.ok(!source.includes("constraint-indicators") && !source.includes("constraint-controls"));
  const standalone = await page.context().newPage();
  try {
    await standalone.setContent(source);
    const parent = standalone.locator('[layer-name="parent"]'),
      child = standalone.locator('[layer-name="child"]');
    const a = await child.boundingBox(),
      p = await parent.boundingBox();
    assert.ok(a && p);
    await parent.evaluate((element) => {
      element.style.width = `${parseFloat(element.style.width) + 80}px`;
      element.style.height = `${parseFloat(element.style.height) + 60}px`;
    });
    const b = await child.boundingBox();
    assert.ok(b);
    close(b.x - a.x, 40);
    close(b.y - a.y, 60);
    close(b.width, a.width);
    close(b.height, a.height);
    assert.equal(
      await standalone
        .locator(".constraint-indicators, .constraint-controls, .selection-outline")
        .count(),
      0,
    );
  } finally {
    await standalone.close();
  }
  close((await box(page)).x, before.x);
}
async function saveReopen(page: Page, mode: string) {
  const temporary = await mkdtemp(join(process.cwd(), "artifacts/editor/constraint-save-"));
  try {
    await page.getByRole("button", { name: "Not saved", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Project name", exact: true })
      .fill(`Constraints ${mode}`);
    await page.getByRole("textbox", { name: "Save in folder", exact: true }).fill(temporary);
    await page.getByRole("button", { name: "Save project", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    const saved = (await session(page)).projects[0];
    assert.ok(saved.path);
    assert.deepEqual(
      JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
      saved.document,
    );
    const before = await box(page);
    await page.getByRole("button", { name: `Close ${saved.document.name}`, exact: true }).click();
    await page.getByRole("button", { name: "Open project", exact: true }).click();
    await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(saved.path);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Open project", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await select(page);
    assert.deepEqual((await session(page)).projects[0].document, saved.document);
    assert.equal((await session(page)).projects[0].canUndo, false);
    assert.equal(await selectField(page, "width").inputValue(), "center");
    assert.equal(await selectField(page, "height").inputValue(), "end");
    const after = await box(page);
    for (const key of ["x", "y", "width", "height"] as const) close(after[key], before[key]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

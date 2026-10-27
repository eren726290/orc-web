import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { nodeSource } from "../../../../shared/source/html-source";
import { corners, field, noEdit, radii, select, session } from "./support";

export async function radiusPersistence(page: Page, mode: string, checks: string[]) {
  await panel(page, mode);
  const project = (await session(page)).projects[0];
  const source = nodeSource(project.document, "radius");
  const rendered = await page.context().newPage();
  try {
    await rendered.setContent(source);
    assert.equal(await rendered.locator(".corner-radius-controls").count(), 0);
    const radius = await rendered
      .locator("svg, div")
      .first()
      .evaluate((element) => getComputedStyle(element).borderTopLeftRadius);
    assert.equal(radius, "21px");
  } finally {
    await rendered.close();
  }
  await noEdit(page, async () => {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
    assert.equal(await page.locator(".frame-preview .corner-radius-controls").count(), 0);
    assert.equal(await field(page).isDisabled(), true);
    await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  });
  await radii(page, Array(4).fill(21));
  await saveReopen(page, mode);
  await corners(page);
  await page.locator(".corner-radius-controls").scrollIntoViewIfNeeded();
  checks.push(
    `${mode}: minimum-width keyboard controls, independent generated source, Preview restoration and real UI save/reopen`,
  );
}

async function panel(page: Page, mode: string) {
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await noEdit(page, async () => {
    await corners(page);
    const summary = page.locator(".corner-radius-controls summary");
    await summary.focus();
    const visible = await summary.evaluate((element) => {
      const panel = element.closest(".properties-panel");
      if (!panel) throw new Error("Missing Properties panel");
      return {
        overflow: panel.scrollWidth - panel.clientWidth,
        height: element.getBoundingClientRect().height,
        outline: getComputedStyle(element).outlineStyle,
      };
    });
    assert.ok(visible.overflow <= 1);
    assert.ok(visible.height >= 44);
    assert.equal(visible.outline, "solid");
    await summary.press("Tab");
    assert.equal(
      await field(page, "Top left").evaluate((element) => element === document.activeElement),
      true,
    );
  });
  await page.locator(".corner-radius-controls").scrollIntoViewIfNeeded();
  await visibleHeader(page);
  await page.screenshot({
    path: `artifacts/editor/corner-radius-${process.env.ORC_RADIUS_EVIDENCE ?? "verification"}-${mode}-minimum-panel.png`,
  });
}

async function visibleHeader(page: Page) {
  const bounds = await page.locator(".property-title").evaluate((title) => {
    const panel = title.closest(".properties-panel");
    if (!panel) throw new Error("Missing Properties panel");
    const outer = panel.getBoundingClientRect();
    const header = title.getBoundingClientRect();
    return {
      top: header.top,
      bottom: header.bottom,
      parentTop: outer.top,
      parentBottom: outer.bottom,
      viewport: window.innerHeight,
    };
  });
  assert.ok(
    bounds.top >= Math.max(bounds.parentTop, 0) - 1 &&
      bounds.bottom <= Math.min(bounds.parentBottom, bounds.viewport),
    "Selected name/type stay visible while Properties scrolls",
  );
  assert.equal(
    await page.locator(".workspace").evaluate((element) => element.scrollTop),
    0,
    "Properties scroll does not scroll the workspace",
  );
}

async function saveReopen(page: Page, mode: string) {
  const temporary = await mkdtemp(join(process.cwd(), "artifacts/editor/radius-save-"));
  try {
    await page.getByRole("button", { name: "Not saved", exact: true }).click();
    await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Radius ${mode}`);
    await page.getByRole("textbox", { name: "Save in folder", exact: true }).fill(temporary);
    await page.getByRole("button", { name: "Save project", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    const saved = (await session(page)).projects[0];
    assert.ok(saved.path);
    assert.deepEqual(
      JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
      saved.document,
    );
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
    await radii(page, Array(4).fill(21));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

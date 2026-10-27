import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Page } from "playwright";
import { commands } from "../intrinsic-sizing/support";
import { canvasPoint, handlePoint, waitHandles } from "./support";
import { guideDocument as documentFor } from "./guide-project";
import { guideEdges } from "./guide-edge-flow";
import { guideBounds, readableGuides } from "./guide-bounds";

const directory = "artifacts/pen-guide-readability";

export async function guideReadability(page: Page, mode: string) {
  await openCopy(page, mode);
  const before = await documentFor(page);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const blank = await canvasPoint(page, 40, 40);
  await page.mouse.click(blank.x, blank.y);
  await page.keyboard.press("p");
  await bowlDraft(page);
  await page.screenshot({ path: join(directory, `${mode}-bowl.png`) });
  await writeFile(
    join(directory, `${mode}-bowl-bounds.json`),
    JSON.stringify(await guideBounds(page), null, 2),
  );
  await readableGuides(page, "P bowl draft");
  await stableDraft(page);
  assert.deepEqual(await documentFor(page), before, "Guide draft changed applied geometry.");
  await page.keyboard.press("Control+z");
  await waitHandles(page, 0);
  await stemSelection(page, mode);
  await guideEdges(page, mode);
}

async function openCopy(page: Page, mode: string) {
  const temporary = await mkdtemp(join(directory, `${mode}-copy-`));
  const bundle = resolve(temporary, "Guide P fixture.orc");
  await mkdir(bundle);
  await writeFile(
    join(bundle, "document.json"),
    await readFile("scripts/e2e/editor/pen/guide-p-fixture.json"),
  );
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Open project", exact: true });
  await dialog.getByLabel("Project folder", { exact: true }).fill(bundle);
  await dialog.getByRole("button", { name: "Open project", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.locator(".layer-name").getByText("P stem", { exact: true }).waitFor();
}

async function bowlDraft(page: Page) {
  const points = [
    [462, 423],
    [462, 548],
    [464, 549],
    [530, 565],
    [533.4150504266873, 281],
    [462, 298],
  ];
  for (const [index, [x, y]] of points.entries()) {
    if (index >= 3) await page.keyboard.press("a");
    const point = await canvasPoint(page, x, y);
    await page.mouse.click(point.x, point.y);
    await waitHandles(page, index + 1);
  }
}

async function stemSelection(page: Page, mode: string) {
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.locator(".layer-name").getByText("P stem", { exact: true }).click();
  const point = await handlePoint(page, 2);
  const before = await documentFor(page);
  const observed = commands(page);
  await page.mouse.click(point.x, point.y);
  await readableGuides(page, "P stem with selected coordinates");
  await page.screenshot({ path: join(directory, `${mode}-stem.png`) });
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
}

async function stableDraft(page: Page) {
  const point = await canvasPoint(page, 440, 320);
  for (const offset of [2, -2, 1, 0]) await page.mouse.move(point.x + offset, point.y);
  const first = await readableGuides(page, "Nearby draft pointer updates");
  for (let repeat = 0; repeat < 4; repeat++) {
    await page.mouse.move(point.x, point.y);
    assert.deepEqual(await guideBounds(page), first, "Unchanged pointer scene moved labels.");
  }
}

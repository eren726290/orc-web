import assert from "node:assert/strict";
import type { Page } from "playwright";
import { exactHistory } from "../intrinsic-sizing/support";
import { documentFor, handlePoint, penFor, waitHandles, waitRevision } from "./support";

export async function continuationAndDeletion(page: Page) {
  const before = await documentFor(page);
  const original = await penFor(page);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await page
    .getByRole("navigation", { name: "Canvas tools" })
    .getByRole("button", { name: "Pen", exact: true })
    .click();
  const end = await handlePoint(page, original.pen.anchors.length);
  await page.mouse.click(end.x, end.y);
  await page.mouse.click(end.x + 60, end.y + 40);
  await page.keyboard.press("Enter");
  const continued = await waitRevision(page, before.revision + 1);
  const extended = await penFor(page);
  assert.equal(extended.id, original.id);
  assert.deepEqual(extended.pen.anchors.slice(0, -1), original.pen.anchors);
  assert.deepEqual(extended.pen.segments.slice(0, -1), original.pen.segments);
  await exactHistory(page, before, continued);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await deleteAnchor(page, 2);
  await protectedDelete(page);
  while ((await penFor(page)).pen.anchors.length > 2) await deleteAnchor(page, 1);
  const last = await documentFor(page);
  const point = await handlePoint(page, 1);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press("Delete");
  const removed = await waitRevision(page, last.revision + 1);
  assert.equal(removed.nodes[original.id], undefined);
  await exactHistory(page, last, removed);
  await page.keyboard.press("Control+z");
  await waitRevision(page, last.revision + 4);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
}

async function deleteAnchor(page: Page, index: number) {
  const before = await documentFor(page);
  const path = (await penFor(page)).pen;
  const point = await handlePoint(page, index);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.press("Delete");
  const after = await waitRevision(page, before.revision + 1);
  const changed = await penFor(page);
  assert.equal(changed.pen.anchors.length, path.anchors.length - 1);
  assert.ok(!changed.pen.anchors.some((anchor) => anchor.id === path.anchors[index - 1].id));
  await exactHistory(page, before, after);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
}

async function protectedDelete(page: Page) {
  const point = await handlePoint(page, 1);
  await page.mouse.click(point.x, point.y);
  await page.getByRole("button", { name: "Lock Pen", exact: true }).click();
  await page.getByRole("button", { name: "Unlock Pen", exact: true }).waitFor();
  const before = await documentFor(page);
  await page.getByRole("application", { name: "Canvas" }).press("Delete");
  await page
    .locator(".workspace-notice")
    .filter({ hasText: /Unlock/u })
    .waitFor();
  assert.deepEqual(await documentFor(page), before);
  await page.getByRole("button", { name: "Unlock Pen", exact: true }).click();
  await page.getByRole("button", { name: "Lock Pen", exact: true }).waitFor();
}

export async function guideToggle(page: Page) {
  const before = await documentFor(page);
  const count = (await penFor(page)).pen.anchors.length;
  const control = page.getByRole("checkbox", { name: "Guides & labels", exact: true });
  assert.equal(await control.isChecked(), true);
  await control.uncheck();
  assert.equal(await page.locator(".pen-guides").count(), 0);
  await waitHandles(page, count);
  await page.getByRole("application", { name: "Canvas" }).press("p");
  assert.equal(await control.isChecked(), false);
  await control.check();
  await page.locator(".pen-guides").waitFor();
  assert.deepEqual(await documentFor(page), before);
  await page.getByRole("button", { name: "Select", exact: true }).click();
}

import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  box,
  change,
  close,
  command,
  history,
  patch,
  select,
  selectField,
  session,
  settled,
} from "./support";

export async function constraintPlacement(page: Page, checks: string[]) {
  await select(page, "parent");
  const free = page.waitForResponse(command);
  await page.getByRole("button", { name: "Free", exact: true }).click();
  assert.equal((await free).status(), 200);
  await settled(page);
  await select(page);
  await change(page, "width", "center");
  await change(page, "height", "center");
  await nested(page);
  await cancelTransfer(page);
  await transfer(page, "destination");
  assert.equal(await selectField(page, "width").inputValue(), "center");
  const before = await box(page);
  await patch(page, "destination", { width: "340px", height: "300px" });
  const after = await box(page);
  close(after.x - before.x, 40);
  close(after.y - before.y, 30);
  await transfer(page, null);
  assert.equal(await page.locator(".constraint-controls").count(), 0);
  await transfer(page, "parent");
  assert.equal(await selectField(page, "width").inputValue(), "start");
  await select(page, "destination");
  const row = page.waitForResponse(command);
  await page.getByRole("button", { name: "Row", exact: true }).click();
  assert.equal((await row).status(), 200);
  await settled(page);
  await select(page);
  await change(page, "width", "center");
  await transfer(page, "destination");
  assert.equal(await page.locator(".constraint-controls").count(), 0);
  const style = (await session(page)).projects[0].document.nodes.child.style;
  assert.equal(style["justify-self"], "auto");
  await transfer(page, "parent");
  assert.equal(await selectField(page, "width").inputValue(), "start");
  checks.push(
    "Centered-frame descendants stay editable; pointer Free/root/Flex conversion retains geometry and exact atomic history",
  );
}
async function nested(page: Page) {
  await select(page, "leaf");
  const before = await box(page, "leaf");
  const response = page.waitForResponse(command);
  await selectField(page, "width").selectOption("end");
  assert.equal((await response).status(), 200);
  await settled(page);
  await patch(page, "child", { width: "180px" });
  const after = await box(page, "leaf");
  close(after.x - before.x, 20);
  await select(page);
}
async function previewTransfer(page: Page, parentId: string | null) {
  const before = (await session(page)).projects[0].document;
  const child = page.locator('.canvas-world [data-orc-id="child"]');
  const start = await child.boundingBox();
  assert.ok(start);
  const destination = parentId
    ? await page.locator(`.canvas-world [data-orc-id="${parentId}"]`).boundingBox()
    : await page.locator(".canvas").boundingBox();
  assert.ok(destination);
  const target = parentId
    ? { x: destination.x + destination.width * 0.75, y: destination.y + destination.height * 0.75 }
    : { x: destination.x + destination.width * 0.75, y: destination.y + destination.height * 0.8 };
  await page.mouse.move(start.x + start.width * 0.8, start.y + start.height * 0.8);
  await page.mouse.down();
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
  await page.mouse.move(target.x, target.y, { steps: 10 });
  await settled(page);
  assert.equal(
    await child.evaluate((e) => e.parentElement?.getAttribute("data-orc-id") ?? null),
    parentId,
  );
  assert.deepEqual((await session(page)).projects[0].document, before);
  const preview = await child.boundingBox();
  assert.ok(preview);
  return { before, child, start, preview };
}

async function transfer(page: Page, parentId: string | null) {
  const { before, child, preview } = await previewTransfer(page, parentId);
  const response = page.waitForResponse(command);
  await page.mouse.up();
  assert.equal((await response).status(), 200);
  await settled(page);
  const committed = await child.boundingBox();
  assert.ok(committed);
  for (const key of ["x", "y", "width", "height"] as const) close(committed[key], preview[key]);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes.child.parentId, parentId);
  await history(page, "undo");
  assert.deepEqual((await session(page)).projects[0].document.nodes, before.nodes);
  await history(page, "redo");
  assert.deepEqual((await session(page)).projects[0].document.nodes, after.nodes);
}

async function cancelTransfer(page: Page) {
  const { before, child, start } = await previewTransfer(page, "destination");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await settled(page);
  assert.deepEqual((await session(page)).projects[0].document, before);
  const after = await child.boundingBox();
  assert.ok(after);
  for (const key of ["x", "y", "width", "height"] as const) close(after[key], start[key]);
}

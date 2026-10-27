import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  accepted,
  edit,
  field,
  history,
  isCommand,
  noEdit,
  radii,
  select,
  session,
  settled,
} from "./support";

export async function radiusSafeguards(page: Page, checks: string[]) {
  await accepted(page, { kind: "lock", id: "radius", locked: true });
  assert.equal(await field(page).isDisabled(), true);
  const expand = page.getByRole("button", { name: "Expand radius", exact: true });
  if (await expand.count()) await expand.click();
  await select(page, "nested");
  assert.equal(await field(page).isDisabled(), true);
  await accepted(page, { kind: "lock", id: "radius", locked: false });
  await select(page);
  await drafts(page);
  await rejection(page);
  await pendingUndo(page);
  await selectionIsolation(page);
  checks.push(
    "Own/ancestor locks, protected Code drafts, failed-command rollback, pending Undo and selection isolation retain applied source/history",
  );
}

async function drafts(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = `${await source.innerText()}\n<!-- radius draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page);
  await field(page).fill("19");
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.equal(await source.innerText(), draft);
  await field(page).fill("19");
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await radii(page, Array(4).fill(19));
  assert.deepEqual(await session(page), before);
  const response = page.waitForResponse(isCommand);
  await field(page).press("Enter");
  assert.equal((await response).status(), 200);
  await settled(page);
  await page.getByRole("button", { name: "Code", exact: true }).click();
}

async function rejection(page: Page) {
  const before = (await session(page)).projects[0].document;
  await page.route("**/api/commands", (route) =>
    route.fulfill({ status: 400, json: { error: "Radius rejection control" } }),
  );
  try {
    await field(page).fill("25");
    await radii(page, Array(4).fill(25));
    const response = page.waitForResponse(isCommand);
    await field(page).press("Enter");
    assert.equal((await response).status(), 400);
    await page.getByRole("alert").filter({ hasText: "Radius rejection control" }).waitFor();
    await radii(page, Array(4).fill(19));
    assert.deepEqual((await session(page)).projects[0].document, before);
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
  await edit(page, "Corner radius", "20", Array(4).fill(20));
}

async function pendingUndo(page: Page) {
  const before = (await session(page)).projects[0].document;
  let release = () => {};
  let received = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route("**/api/commands", async (route) => {
    const response = await route.fetch();
    received();
    await hold;
    await route.fulfill({ response });
  });
  try {
    await field(page).fill("29");
    await field(page).press("Enter");
    await ready;
    const undone = page.waitForResponse((r) => r.url().endsWith("/api/history"));
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    release();
    assert.equal((await undone).status(), 200);
    await settled(page);
    assert.deepEqual((await session(page)).projects[0].document.nodes, before.nodes);
    await radii(page, Array(4).fill(20));
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
}

async function selectionIsolation(page: Page) {
  const before = (await session(page)).projects[0].document;
  await field(page).fill("21");
  const response = page.waitForResponse(isCommand);
  await select(page, "other");
  assert.equal((await response).status(), 200);
  await settled(page);
  assert.equal(await field(page).inputValue(), "0");
  assert.deepEqual((await session(page)).projects[0].document.nodes.other, before.nodes.other);
  await select(page);
  await radii(page, Array(4).fill(21));
  await noEdit(page, async () => {
    await field(page).fill("22");
    await field(page).press("Escape");
    await select(page, "other");
    await select(page);
  });
  await history(page, "undo");
  await radii(page, Array(4).fill(20));
  await history(page, "redo");
}

import assert from "node:assert/strict";
import type { Styles } from "../../../../shared/document/model";
import type { Page } from "playwright";
import {
  accepted,
  box,
  change,
  close,
  command,
  history,
  noEdit,
  patch,
  select,
  selectField,
  session,
  settled,
} from "./support";

const sourceCases: Styles[] = [
  { transform: "rotate(5deg)" },
  { "justify-self": "var(--alignment, center)" },
  { "place-self": "stretch" },
  { display: "none" },
  { "aspect-ratio": "2 / 1" },
  { "inset-inline-start": "10px" },
  { "margin-left": "10%" },
  { "padding-left": "var(--pad,10px)" },
];

export async function constraintSafeguards(page: Page, checks: string[]) {
  await select(page);
  await change(page, "width", "center");
  await ownership(page);
  await drafts(page);
  await stale(page);
  await rejection(page);
  await pendingUndo(page);
  checks.push(
    "Source expressions, priorities, transformed and locked boundaries, draft Cancel/Discard, rollback and pending Undo",
  );
}
async function ownership(page: Page) {
  const style = (await session(page)).projects[0].document.nodes.child.style;
  await patch(page, "child", { left: "var(--position)", "--position": "40px" });
  assert.equal(await selectField(page, "width").isDisabled(), true);
  assert.equal(await selectField(page, "height").isEnabled(), true);
  await patch(page, "child", {
    left: style.left,
    right: style.right,
    "justify-self": style["justify-self"],
  });
  for (const values of sourceCases) {
    await patch(page, "child", values);
    assert.equal(await selectField(page, "width").isDisabled(), true);
    await accepted(page, { kind: "style", id: "child", values: {}, unset: Object.keys(values) });
  }
  await patch(page, "child", {
    width: "auto",
    left: "40px",
    right: "20px",
    "justify-self": "stretch",
  });
  assert.equal(await selectField(page, "width").isDisabled(), true);
  await patch(page, "child", {
    right: "auto !important",
    left: "40px !important",
    "justify-self": "normal",
    width: "160px !important",
  });
  await change(page, "width", "end");
  const after = (await session(page)).projects[0].document.nodes.child.style;
  assert.ok(after.right.endsWith(" !important"));
  assert.ok(after.width.endsWith(" !important"));
  await accepted(page, { kind: "lock", id: "parent", locked: true });
  assert.equal(await selectField(page, "width").isDisabled(), true);
  await accepted(page, { kind: "lock", id: "parent", locked: false });
  await accepted(page, { kind: "lock", id: "child", locked: true });
  assert.equal(await selectField(page, "width").isDisabled(), true);
  await accepted(page, { kind: "lock", id: "child", locked: false });
}
async function drafts(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const draft = `${await source.innerText()}\n<!-- constraint draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(draft);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const before = await session(page),
    original = await box(page);
  await selectField(page, "width").selectOption("center");
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.equal(await source.innerText(), draft);
  close((await box(page)).x, original.x);
  await selectField(page, "width").selectOption("center");
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await settled(page);
  assert.equal(
    (await session(page)).projects[0].document.revision,
    before.projects[0].document.revision + 1,
  );
  await page.getByRole("button", { name: "Code", exact: true }).click();
}
async function rejection(page: Page) {
  const before = await session(page),
    initial = await box(page);
  await page.route("**/api/commands", (route) =>
    route.fulfill({ status: 400, json: { error: "Constraint rejection control" } }),
  );
  try {
    const response = page.waitForResponse(command);
    await selectField(page, "width").selectOption("both");
    assert.equal((await response).status(), 400);
    await page.getByRole("alert").filter({ hasText: "Constraint rejection control" }).waitFor();
    await settled(page);
    assert.deepEqual(await session(page), before);
    close((await box(page)).x, initial.x);
    assert.equal(await selectField(page, "width").inputValue(), "center");
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
}
async function pendingUndo(page: Page) {
  const before = (await session(page)).projects[0].document;
  let release = () => {},
    received = () => {};
  const hold = new Promise<void>((r) => {
      release = r;
    }),
    ready = new Promise<void>((r) => {
      received = r;
    });
  await page.route("**/api/commands", async (route) => {
    const response = await route.fetch();
    received();
    await hold;
    await route.fulfill({ response });
  });
  try {
    await selectField(page, "width").selectOption("both");
    await ready;
    const undone = page.waitForResponse((r) => r.url().endsWith("/api/history"));
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    release();
    assert.equal((await undone).status(), 200);
    await settled(page);
    assert.deepEqual((await session(page)).projects[0].document.nodes, before.nodes);
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  await noEdit(page, () => selectField(page, "width").selectOption("center"));
  await history(page, "redo");
  assert.equal(await selectField(page, "width").inputValue(), "both");
}

async function stale(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.press("Control+a");
  await page.keyboard.insertText(`${await source.innerText()}\n<!-- stale constraints draft -->`);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  await selectField(page, "width").selectOption("both");
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  const root = (await session(page)).projects[0].document.nodes.parent;
  await patch(page, "parent", { width: `${parseFloat(root.style.width) + 1}px` });
  const expected = await session(page);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: /layout changed/iu })
    .waitFor();
  await settled(page);
  assert.deepEqual(await session(page), expected);
  await page.getByRole("button", { name: "Code", exact: true }).click();
}

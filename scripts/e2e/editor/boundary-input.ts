import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DesignNode } from "../../../shared/document/model";
import { boundarySeed, boundarySession } from "./boundary-support";

export async function inputBoundary(page: Page) {
  await boundarySeed(page, inputFixture());
  const before = await boundarySession(page);
  const canvas = page.getByRole("application", { name: "Canvas" });
  await canvas.focus();
  for (const key of ["Tab", "Shift+Tab", "Tab"]) {
    await page.keyboard.press(key);
    assert.equal(
      await page.evaluate(() => document.activeElement?.closest("[data-orc-id]") !== null),
      false,
      "Edit Tab navigation cannot enter design-owned focus stops",
    );
  }
  const editable = page.locator('[data-orc-id="boundary-editable"]');
  await editable.focus();
  await page.keyboard.press("End");
  await page.keyboard.type("X");
  assert.equal(
    await editable.innerText(),
    "Saved design text",
    "Edit cannot change native design content",
  );
  assert.deepEqual(await boundarySession(page), before);
  await previewEditing(page);
  assert.deepEqual(await boundarySession(page), before);
  await canvasTextEditing(page);
}

function inputFixture(): DesignNode[] {
  const base = { visible: true, locked: false, attributes: {}, style: {}, children: [] };
  return [
    {
      ...base,
      id: "boundary-input-frame",
      name: "Boundary input frame",
      kind: "frame",
      parentId: null,
      mode: "inherit",
      clipContent: false,
      children: ["boundary-editable", "boundary-tabstop", "boundary-textarea"],
      style: { position: "absolute", left: "40px", top: "40px", width: "400px", height: "250px" },
    },
    {
      ...base,
      id: "boundary-editable",
      name: "Boundary editable",
      kind: "element",
      tag: "div",
      parentId: "boundary-input-frame",
      attributes: { contenteditable: "true", tabindex: "0", autofocus: "" },
      children: ["boundary-text"],
      style: { width: "200px", height: "50px" },
    },
    {
      ...base,
      id: "boundary-text",
      name: "Boundary text",
      kind: "text",
      tag: "span",
      parentId: "boundary-editable",
      runs: [{ text: "Saved design text", style: {} }],
    },
    ...extraInputs(base),
  ];
}

function extraInputs(base: {
  visible: boolean;
  locked: boolean;
  children: string[];
  attributes: {};
  style: {};
}): DesignNode[] {
  return [
    {
      ...base,
      id: "boundary-tabstop",
      name: "Boundary tab stop",
      kind: "element",
      tag: "div",
      parentId: "boundary-input-frame",
      attributes: { tabindex: "3" },
      style: { width: "80px", height: "40px" },
    },
    {
      ...base,
      id: "boundary-textarea",
      name: "Boundary textarea",
      kind: "text",
      tag: "textarea",
      parentId: "boundary-input-frame",
      attributes: { "aria-label": "Boundary design textarea" },
      runs: [{ text: "Saved textarea", style: {} }],
    },
  ];
}

async function previewEditing(page: Page) {
  await page.getByRole("button", { name: "Boundary input frame", exact: true }).click();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const editable = page.locator('.preview-world [data-orc-id="boundary-editable"]');
  await editable.fill("Temporary design text");
  assert.equal(await editable.innerText(), "Temporary design text");
  await editable.focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("data-orc-id")),
    "boundary-textarea",
  );
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
  assert.equal(
    await page.locator('[data-orc-id="boundary-editable"]').innerText(),
    "Saved design text",
  );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(
    await editable.innerText(),
    "Saved design text",
    "Preview starts from saved defaults",
  );
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
}

async function canvasTextEditing(page: Page) {
  await page.locator('[data-orc-id="boundary-text"]').dblclick();
  const editor = page.getByRole("textbox", { name: "Edit canvas text", exact: true });
  await editor.fill("Committed canvas text");
  await editor.press("Escape");
  await page.waitForFunction(
    () =>
      document.querySelector('[data-orc-id="boundary-text"]')?.textContent ===
      "Committed canvas text",
  );
  const x = page.getByRole("spinbutton", { name: "X", exact: true });
  await x.fill("60");
  await x.press("Enter");
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const code = page.getByRole("textbox", { name: "Object source" });
  await code.press("Control+a");
  await page.keyboard.insertText(
    '<span style="position:absolute;left:60px">Code still accepts input</span>',
  );
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
}

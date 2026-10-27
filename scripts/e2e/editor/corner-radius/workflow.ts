import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DesignNode } from "../../../../shared/document/model";
import {
  corners,
  edit,
  field,
  history,
  isCommand,
  labels,
  noEdit,
  radii,
  reset,
  session,
  settled,
} from "./support";

export async function radiusWorkflow(page: Page, checks: string[]) {
  assert.equal(await field(page).inputValue(), "");
  assert.equal(await field(page).getAttribute("placeholder"), "Mixed");
  await noEdit(page, async () => {
    await corners(page);
    for (const [i, label] of labels.entries())
      assert.equal(await field(page, label).inputValue(), String([8, 12, 16, 20][i]));
    await page.locator(".corner-radius-controls summary").press("Space");
    await field(page).focus();
    await field(page).press("Tab");
  });
  checks.push(
    "Mixed values and keyboard disclosure preserve data, save status, history and commands",
  );
  await previewCancellation(page);
  await corners(page);
  await edit(page, "Top left", "11.25", [11.25, 12, 16, 20]);
  await edit(page, "Top right", "13.5", [11.25, 13.5, 16, 20]);
  await edit(page, "Bottom right", "17.75", [11.25, 13.5, 17.75, 20]);
  await edit(page, "Bottom left", "22.25", [11.25, 13.5, 17.75, 22.25], "Tab");
  await edit(page, "Corner radius", "15", [15, 15, 15, 15]);
  await unchangedRedo(page);
  await numericAdjustments(page);
  await cancelScrub(page);
  checks.push(
    "Combined/individual numeric edits preview and commit once; exact history restores asymmetric source and untouched nodes/geometry",
  );
  await sourceOwnership(page);
  await priorities(page);
  checks.push(
    "Unsupported radius expressions remain in Code; explicit independent corners stay editable and CSS priority/order survives preview, commit and history",
  );
  await edit(page, "Corner radius", "0.0000001", Array(4).fill(0.0000001));
  assert.equal(await field(page).getAttribute("readonly"), null);
  await edit(page, "Corner radius", "9999", Array(4).fill(9999));
  await reset(page, { "border-radius": "18px" });
  checks.push(
    "Tiny exponent values and oversized radii remain editable without flattening authored values to painted bounds",
  );
}

async function previewCancellation(page: Page) {
  await noEdit(page, async () => {
    await field(page).fill("24.5");
    await radii(page, Array(4).fill(24.5));
    await field(page).fill("-1");
    await page
      .getByRole("alert")
      .getByText("Enter a valid corner radius.", { exact: true })
      .waitFor();
    await radii(page, Array(4).fill(24.5));
    await field(page).press("Escape");
    await radii(page, [8, 12, 16, 20]);
  });
}

async function unchangedRedo(page: Page) {
  await history(page, "undo");
  assert.equal((await session(page)).projects[0].canRedo, true);
  await noEdit(page, async () => {
    await field(page, "Top left").fill("11.25");
    await field(page, "Top left").press("Enter");
  });
  await history(page, "redo");
}

async function numericAdjustments(page: Page) {
  await field(page).focus();
  await field(page).press("ArrowUp");
  await field(page).press("Shift+ArrowUp");
  await radii(page, Array(4).fill(24));
  const arrows = page.waitForResponse(isCommand);
  await field(page).press("Enter");
  assert.equal((await arrows).status(), 200);
  await settled(page);
  await field(page).scrollIntoViewIfNeeded();
  const box = await field(page).boundingBox();
  assert.ok(box);
  const before = (await session(page)).projects[0].document;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 12, box.y + box.height / 2, { steps: 4 });
  await radii(page, Array(4).fill(36));
  assert.deepEqual((await session(page)).projects[0].document, before);
  const response = page.waitForResponse(isCommand);
  await page.mouse.up();
  assert.equal((await response).status(), 200);
  await settled(page);
  assert.equal((await session(page)).projects[0].document.revision, before.revision + 1);
  await noEdit(page, async () => {
    await page.locator(".property-title").click();
  });
  await history(page, "undo");
  await radii(page, Array(4).fill(24));
  await history(page, "redo");
  await radii(page, Array(4).fill(36));
}

async function sourceOwnership(page: Page) {
  const cases: DesignNode["style"][] = [
    { "border-radius": "var(--curve)", "--curve": "8px" },
    { "border-radius": "VAR(--curve)", "--curve": "8px" },
    { "border-radius": "10%" },
    { "border-radius": "calc(2px + 3px)" },
    { "border-radius": "4px / 8px" },
    { "border-radius": "inherit" },
    { "border-radius": "initial" },
    { "border-radius": "unset" },
    { "border-radius": "revert" },
    { "border-radius": "revert-layer" },
    { "border-radius": "8px", "border-start-start-radius": "12px" },
    { "border-radius": "8px", all: "initial" },
  ];
  for (const values of cases) {
    await reset(page, values);
    await noEdit(page, async () => {
      assert.equal(await field(page).getAttribute("readonly"), "");
      await corners(page);
      for (const label of labels)
        assert.equal(await field(page, label).getAttribute("readonly"), "");
    });
  }
  await partialOwnership(page);
}

async function cancelScrub(page: Page) {
  await noEdit(page, async () => {
    await field(page).scrollIntoViewIfNeeded();
    const box = await field(page).boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 9, box.y + box.height / 2, { steps: 4 });
    await radii(page, Array(4).fill(45));
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await radii(page, Array(4).fill(36));
  });
}

async function partialOwnership(page: Page) {
  await reset(page, {
    "border-radius": "8px 12px 16px 20px",
    "border-top-left-radius": "var(--curve)",
    "--curve": "9px",
  });
  assert.equal(await field(page).getAttribute("readonly"), "");
  assert.equal(await field(page, "Top left").getAttribute("readonly"), "");
  await edit(page, "Top right", "7", [9, 7, 16, 20]);
  assert.equal(
    (await session(page)).projects[0].document.nodes.radius.style["border-top-left-radius"],
    "var(--curve)",
  );
  await reset(page, {
    "border-radius": "var(--curve)",
    "--curve": "6px 12px 16px 20px",
    "border-top-left-radius": "6px",
  });
  await edit(page, "Top left", "10", [10, 12, 16, 20]);
  assert.equal(
    (await session(page)).projects[0].document.nodes.radius.style["border-radius"],
    "var(--curve)",
  );
}

async function priorities(page: Page) {
  await reset(page, {
    "border-top-left-radius": "90px !important",
    "border-radius": "8px 12px 16px 20px !important",
  });
  await radii(page, [8, 12, 16, 20]);
  await edit(page, "Top left", "11", [11, 12, 16, 20]);
  assert.equal(
    (await session(page)).projects[0].document.nodes.radius.style["border-top-left-radius"],
    "11px !important",
  );
  await reset(page, { "border-radius": "8px", "border-top-left-radius": "12px !important" });
  await edit(page, "Corner radius", "17", Array(4).fill(17));
  const style = (await session(page)).projects[0].document.nodes.radius.style;
  assert.equal(style["border-top-left-radius"], "17px !important");
  assert.equal(style["border-top-right-radius"], "17px");
}

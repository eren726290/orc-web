import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  box,
  change,
  close,
  patch,
  select,
  selectField,
  session,
  noEdit,
  history,
} from "./support";

export async function constraintsWorkflow(page: Page, checks: string[]) {
  await modes(page);
  checks.push(
    "All horizontal and vertical modes preserve the box, resize natively and use one exact Undo step",
  );
  await diagram(page);
  await fixedContext(page);
  await center(page);
  checks.push(
    "Off-center capture, true alignment, independent axes, centered size edits and keyboard movement",
  );
  await bothLimits(page);
  checks.push(
    "Both-edge minima/maxima keep start edges and retained end offsets restore after parent growth",
  );
  await eligibility(page);
  checks.push(
    "Immediate nested parent, explicit Absolute Flex child, root/flow exclusion and narrow keyboard controls",
  );
}

async function modes(page: Page) {
  for (const axis of ["width", "height"] as const)
    for (const mode of ["end", "both", "center", "start"]) {
      await modeCase(page, axis, mode);
    }
}

async function center(page: Page) {
  await change(page, "width", "center");
  await change(page, "height", "center");
  await centerSizeEdits(page);
  for (const axis of ["width", "height"] as const) {
    await change(page, axis, "center", () =>
      page
        .getByRole("button", {
          name: `Align ${axis === "width" ? "horizontal" : "vertical"} center`,
          exact: true,
        })
        .click(),
    );
    const aligned = await box(page);
    close(
      aligned[axis === "width" ? "x" : "y"] + aligned[axis] / 2,
      aligned[axis === "width" ? "parentWidth" : "parentHeight"] / 2,
    );
  }
  await noEdit(page, () =>
    page.getByRole("button", { name: "Align horizontal center", exact: true }).click(),
  );
  const centered = await box(page);
  const response = page.waitForResponse((r) => r.url().endsWith("/api/commands"));
  await page.getByRole("application", { name: "Canvas" }).press("ArrowRight");
  assert.equal((await response).status(), 200);
  await selectField(page, "width").waitFor();
  close((await box(page)).x, centered.x + 1);
  assert.equal(await selectField(page, "width").inputValue(), "center");
  await history(page, "undo");
  await history(page, "redo");
}

async function bothLimits(page: Page) {
  await change(page, "width", "both");
  await change(page, "height", "both");
  assert.equal(await page.getByLabel("Width sizing", { exact: true }).inputValue(), "Constraints");
  assert.equal(await page.getByLabel("Width", { exact: true }).getAttribute("readonly"), "");
  const before = await box(page),
    style = (await session(page)).projects[0].document.nodes.child.style;
  await patch(page, "child", { "min-width": "200px", "min-height": "120px" });
  await patch(page, "parent", { width: "160px", height: "140px" });
  const small = await box(page);
  close(small.x, before.x);
  close(small.y, before.y);
  close(small.width, 200);
  close(small.height, 120);
  assert.ok(
    await page.getByText("A size limit overrides an end margin.", { exact: false }).isVisible(),
  );
  await patch(page, "parent", { width: "420px", height: "320px" });
  await patch(page, "child", {
    "min-width": "0px",
    "min-height": "0px",
    "max-width": "180px",
    "max-height": "130px",
  });
  await patch(page, "parent", { width: "620px", height: "520px" });
  const large = await box(page);
  close(large.x, before.x);
  close(large.y, before.y);
  close(large.width, 180);
  close(large.height, 130);
  const saved = (await session(page)).projects[0].document.nodes.child.style;
  assert.equal(saved.right, style.right);
  assert.equal(saved.bottom, style.bottom);
  await patch(page, "child", { "max-width": "none", "max-height": "none" });
  await patch(page, "parent", { width: "420px", height: "320px" });
  const restored = await box(page);
  close(restored.width, before.width);
  close(restored.height, before.height);
}

async function eligibility(page: Page) {
  await select(page, "leaf");
  assert.equal(await selectField(page, "width").isEnabled(), true);
  await select(page, "parent");
  assert.equal(await page.locator(".constraint-controls").count(), 0);
  await select(page);
  await change(page, "width", "start");
  await change(page, "height", "start");
  await select(page, "parent");
  await page.getByRole("button", { name: "Row", exact: true }).click();
  await select(page);
  assert.equal(await page.locator(".constraint-controls").count(), 0);
  const response = page.waitForResponse((r) => r.url().endsWith("/api/commands"));
  await page.getByLabel("Absolute Position", { exact: true }).click();
  assert.equal((await response).status(), 200);
  await selectField(page, "width").waitFor({ state: "visible" });
  await selectField(page, "width").waitFor();
  await change(page, "width", "end");
  const before = await box(page);
  await patch(page, "parent", { width: "500px" });
  close((await box(page)).x, before.x + 80);
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await page.locator(".constraint-controls").scrollIntoViewIfNeeded();
  assert.ok(
    (await page.locator(".properties-panel").evaluate((e) => e.scrollWidth - e.clientWidth)) <= 1,
  );
  await selectField(page, "width").focus();
  await change(page, "width", "start", () => selectField(page, "width").press("ArrowUp"));
}

async function diagram(page: Page) {
  await change(page, "width", "both", () =>
    page.getByRole("button", { name: "Horizontal Right", exact: true }).press("Enter"),
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Horizontal Left", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Horizontal Right", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await change(page, "width", "end", () =>
    page.getByRole("button", { name: "Horizontal Left", exact: true }).click(),
  );
  await change(page, "width", "start");
}

async function modeCase(page: Page, axis: "width" | "height", mode: string) {
  const before = await box(page);
  await change(page, axis, mode);
  const converted = await box(page);
  if (mode === "end" || mode === "center") {
    const field = page.getByLabel(axis === "width" ? "X" : "Y", { exact: true });
    assert.equal(await field.getAttribute("readonly"), "");
    close(Number(await field.inputValue()), converted[axis === "width" ? "x" : "y"]);
  }
  for (const key of ["x", "y", "width", "height"] as const) close(converted[key], before[key]);
  const parent = (await session(page)).projects[0].document.nodes.parent;
  const value = parseFloat(parent.style[axis]);
  await patch(page, "parent", { [axis]: `${value + 80}px` });
  const after = await box(page),
    position = axis === "width" ? "x" : "y";
  close(after[position], converted[position] + (mode === "end" ? 80 : mode === "center" ? 40 : 0));
  close(after[axis], converted[axis] + (mode === "both" ? 80 : 0));
  await patch(page, "parent", { [axis]: `${value}px` });
}

async function centerSizeEdits(page: Page) {
  const before = await box(page);
  for (const [axis, label, value] of [
    ["width", "Width", "160"],
    ["height", "Height", "100"],
  ] as const) {
    await change(page, axis, "center", async () => {
      const field = page.getByLabel(label, { exact: true });
      assert.equal(await field.isEditable(), true);
      await field.fill(value);
      await field.press("Enter");
    });
  }
  const after = await box(page);
  close(after.x + after.width / 2, before.x + before.width / 2);
  close(after.y + after.height / 2, before.y + before.height / 2);
}

async function fixedContext(page: Page) {
  await patch(page, "leaf", { position: "fixed", left: "12px", top: "15px" });
  const before = await page.locator('.canvas-world [data-orc-id="leaf"]').boundingBox();
  assert.ok(before);
  await change(page, "width", "center");
  const after = await page.locator('.canvas-world [data-orc-id="leaf"]').boundingBox();
  assert.ok(after);
  for (const key of ["x", "y", "width", "height"] as const) close(after[key], before[key]);
  const transform = await page.locator('.canvas-world [data-orc-id="child"]').evaluate((e) => ({
    transform: getComputedStyle(e).transform,
    translate: getComputedStyle(e).translate,
  }));
  assert.deepEqual(transform, { transform: "none", translate: "none" });
  await change(page, "width", "start");
  await patch(page, "leaf", { position: "absolute", left: "15px", top: "10px" });
}

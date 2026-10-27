import assert from "node:assert/strict";
import { frame } from "../intrinsic-sizing/fixtures";
import { install, commands, settled, type Suite } from "../intrinsic-sizing/support";
import { arcFixture } from "../../../solver/fixtures";
import { nodeFixture } from "./fixtures";
import { documentFor, handlePoint, screenMatrix, sameMapping } from "./support";

export async function constraintIntegration(suite: Suite) {
  for (const mode of ["end", "both", "center"] as const) {
    const pen = { ...nodeFixture(arcFixture()), parentId: "parent" };
    await install(suite, [
      frame("parent", null, [pen.id], {
        position: "absolute",
        left: "100px",
        top: "100px",
        width: "500px",
        height: "400px",
      }),
      pen,
    ]);
    await suite.page.getByRole("button", { name: "Select", exact: true }).click();
    const expand = suite.page.getByRole("button", { name: "Expand parent", exact: true });
    if (await expand.count()) await expand.click();
    await suite.page.locator(".layer-name").getByText("Pen", { exact: true }).click();
    for (const axis of ["Horizontal", "Vertical"]) {
      const response = suite.page.waitForResponse(
        (r) => r.url().endsWith("/api/commands") && r.request().method() === "POST",
      );
      await suite.page.getByLabel(`${axis} constraint`, { exact: true }).selectOption(mode);
      assert.equal((await response).status(), 200);
      await settled(suite.page);
    }
    await constrainedDrag(suite, mode);
    await constrainedStroke(suite, mode);
  }
}

async function constrainedDrag(suite: Suite, mode: string) {
  const page = suite.page;
  const before = await documentFor(page);
  const matrix = await screenMatrix(page, "pen-node");
  const observed = commands(page);
  const point = await handlePoint(page, 4);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y + 40, { steps: 4 });
  await page
    .locator(".workspace-notice")
    .filter({ hasText: /Free|Fixed|Left\/Top|layout would move/u })
    .waitFor();
  if (await page.locator(".canvas").evaluate((canvas) => canvas.hasPointerCapture(1)))
    await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  sameMapping(matrix, await screenMatrix(page, "pen-node"));
  observed.stop();
  for (const axis of ["Horizontal", "Vertical"])
    assert.equal(await page.getByLabel(`${axis} constraint`, { exact: true }).inputValue(), mode);
  suite.checks.push(
    `${suite.mode}: ${mode} constraints refuse incompatible Pen reboxing without flattening source or history`,
  );
}

async function constrainedStroke(suite: Suite, mode: string) {
  const page = suite.page;
  const before = await documentFor(page);
  const matrix = await screenMatrix(page, "pen-node");
  const observed = commands(page);
  const stroke = page.getByLabel("Stroke width", { exact: true });
  await stroke.fill("12");
  await stroke.press("Enter");
  await page
    .getByRole("alert")
    .filter({ hasText: /Free|Fixed|Left\/Top/u })
    .waitFor();
  await settled(page);
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  sameMapping(matrix, await screenMatrix(page, "pen-node"));
  observed.stop();
  for (const axis of ["Horizontal", "Vertical"])
    assert.equal(await page.getByLabel(`${axis} constraint`, { exact: true }).inputValue(), mode);
  suite.checks.push(
    `${suite.mode}: ${mode} constraints reject incompatible stroke reboxing without moving artwork or changing the saved relationship`,
  );
  await stroke.press("Escape");
  assert.equal(await stroke.inputValue(), "2");
}

import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DesignNode } from "../../../shared/document/model";
import { boundaryCommand, boundarySeed, boundarySession } from "./boundary-support";

export async function geometryBoundary(page: Page) {
  await geometryFixture(page);
  await page.route("**/api/session", () => {});
  try {
    await page.getByRole("button", { name: "Boundary moving", exact: true }).click();
    const x = page.getByRole("spinbutton", { name: "X", exact: true });
    await x.fill("190");
    await x.press("Enter");
    await page.waitForFunction(() =>
      document
        .querySelector('[data-orc-id="boundary-moving"]')
        ?.getAttribute("style")
        ?.includes("190px"),
    );
    await movingAlignment(page, "boundary-moving");
    await transformAlignment(page);
    await scrollAlignment(page);
    await panAlignment(page);
    await layoutAlignment(page);
  } finally {
    await page.unroute("**/api/session");
  }
}

async function geometryFixture(page: Page) {
  const base = { visible: true, locked: false, attributes: {}, children: [], parentId: null };
  await boundarySeed(page, [
    {
      ...base,
      id: "boundary-moving",
      name: "Boundary moving",
      kind: "element",
      tag: "div",
      style: {
        position: "absolute",
        left: "100px",
        top: "350px",
        width: "80px",
        height: "40px",
        background: "lightblue",
        transition: "left 1.5s linear, transform 1.5s linear",
      },
    },
  ]);
  await scrollFixture(page, base);
}

async function scrollFixture(
  page: Page,
  base: { visible: boolean; locked: boolean; attributes: {}; children: string[]; parentId: null },
) {
  await boundarySeed(page, [
    {
      ...base,
      id: "boundary-scroll",
      name: "Boundary scroll",
      kind: "element",
      tag: "div",
      children: ["boundary-descendant"],
      style: {
        position: "absolute",
        left: "300px",
        top: "350px",
        width: "180px",
        height: "120px",
        overflow: "scroll",
      },
    },
    {
      ...base,
      id: "boundary-descendant",
      name: "Boundary descendant",
      kind: "element",
      tag: "div",
      parentId: "boundary-scroll",
      style: { width: "100px", height: "500px", background: "pink" },
    },
  ]);
}

async function movingAlignment(page: Page, id: string) {
  const samples = await page.evaluate(async (id) => {
    const target = document.querySelector(`[data-orc-id="${id}"]`);
    const outline = document.querySelector(".selection-outline");
    if (!target || !outline) throw new Error("Missing geometry fixture");
    const result = [];
    for (let index = 0; index < 50; index++) {
      // Sample after all frame callbacks, including the overlay update, have finished.
      await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
      const box = target.getBoundingClientRect();
      const selection = outline.getBoundingClientRect();
      result.push({
        x: box.x,
        error: Math.max(Math.abs(box.x - selection.x), Math.abs(box.y - selection.y)),
      });
    }
    return result;
  }, id);
  assert.ok(
    Math.max(...samples.map((sample) => sample.x)) -
      Math.min(...samples.map((sample) => sample.x)) >
      20,
    "The object actually moves while sampled",
  );
  assert.ok(Math.max(...samples.map((sample) => sample.error)) < 2, JSON.stringify(samples));
  await page.waitForTimeout(1600);
  await aligned(page, id);
}

async function transformAlignment(page: Page) {
  await boundaryCommand(page, {
    kind: "style",
    id: "boundary-moving",
    values: { transform: "translateX(90px)" },
  });
  await page.unroute("**/api/session");
  await page.waitForFunction(() =>
    document
      .querySelector('[data-orc-id="boundary-moving"]')
      ?.getAttribute("style")
      ?.includes("translateX(90px)"),
  );
  await page.route("**/api/session", () => {});
  await movingAlignment(page, "boundary-moving");
  const before = await boundarySession(page);
  await page.locator('[data-orc-id="boundary-descendant"]').click({ position: { x: 10, y: 10 } });
  await aligned(page, "boundary-descendant");
  assert.deepEqual(
    await boundarySession(page),
    before,
    "Measurement creates no history or saved styles",
  );
}

async function scrollAlignment(page: Page) {
  const before = await boundarySession(page);
  await page.locator('[data-orc-id="boundary-scroll"]').evaluate((node) => {
    node.scrollTop = 30;
  });
  await aligned(page, "boundary-descendant");
  assert.equal(
    await page.locator('[data-orc-id="boundary-scroll"]').evaluate((node) => node.scrollTop),
    30,
  );
  assert.deepEqual(await boundarySession(page), before);
}

async function panAlignment(page: Page) {
  const canvas = page.getByRole("application", { name: "Canvas" });
  await canvas.hover({ position: { x: 600, y: 600 } });
  await page.mouse.wheel(0, -100);
  await aligned(page, "boundary-descendant");
  await canvas.click({ position: { x: 650, y: 650 } });
  await page.locator(".selection-outline").waitFor({ state: "hidden" });
  await noIdleMeasurements(page);
}

async function noIdleMeasurements(page: Page) {
  const count = await page.evaluate(async () => {
    // Let the visible frame labels finish the selection/layout update before measuring idle work.
    for (let index = 0; index < 2; index++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const original = Element.prototype.getBoundingClientRect;
    let count = 0;
    Element.prototype.getBoundingClientRect = function () {
      if (this.matches(".canvas,.canvas-world,[data-orc-id]")) count++;
      return original.call(this);
    };
    try {
      for (let index = 0; index < 12; index++)
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return count;
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
  });
  assert.equal(count, 0, "Deselection stops geometry measurement");
}

async function layoutAlignment(page: Page) {
  await page.unroute("**/api/session");
  await boundarySeed(page, layoutNodes);
  await page.locator('[data-orc-id="boundary-following"]').click();
  await boundaryCommand(page, {
    kind: "style",
    id: "boundary-sibling",
    values: { width: "140px" },
  });
  await page.waitForFunction(() =>
    document
      .querySelector('[data-orc-id="boundary-sibling"]')
      ?.getAttribute("style")
      ?.includes("140px"),
  );
  await page.route("**/api/session", () => {});
  await movingAlignment(page, "boundary-following");
  await page.getByRole("button", { name: "Boundary layout", exact: true }).click();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator(".selection-outline").waitFor({ state: "hidden" });
  await noIdleMeasurements(page);
  await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
}

const layoutBase = { visible: true, locked: false, attributes: {}, children: [] };
const layoutNodes: DesignNode[] = [
  {
    ...layoutBase,
    id: "boundary-layout",
    name: "Boundary layout",
    kind: "frame",
    mode: "inherit",
    clipContent: false,
    parentId: null,
    children: ["boundary-sibling", "boundary-following"],
    style: {
      position: "absolute",
      left: "80px",
      top: "600px",
      width: "300px",
      height: "80px",
      display: "flex",
    },
  },
  {
    ...layoutBase,
    id: "boundary-sibling",
    name: "Boundary sibling",
    kind: "element",
    tag: "div",
    parentId: "boundary-layout",
    style: {
      width: "60px",
      height: "40px",
      transition: "width 1.5s linear",
      background: "green",
    },
  },
  {
    ...layoutBase,
    id: "boundary-following",
    name: "Boundary following",
    kind: "element",
    tag: "div",
    parentId: "boundary-layout",
    style: { width: "60px", height: "40px", background: "pink" },
  },
];

async function aligned(page: Page, id: string) {
  await page.waitForFunction(
    (id) => {
      const target = document.querySelector(`[data-orc-id="${id}"]`);
      const outline = document.querySelector(".selection-outline");
      if (!target || !outline) return false;
      const box = target.getBoundingClientRect(),
        selection = outline.getBoundingClientRect();
      return [
        box.x - selection.x,
        box.y - selection.y,
        box.width - selection.width,
        box.height - selection.height,
      ].every((difference) => Math.abs(difference) < 2);
    },
    id,
    { timeout: 3000 },
  );
}

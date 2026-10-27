import assert from "node:assert/strict";
import type { Page } from "playwright";
import { canvasPoint, documentFor, handlePoint, waitRevision } from "./support";

export async function cancelLoading(page: Page) {
  const before = await documentFor(page);
  await observeCompilation(page);
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*.wasm", async (route) => {
    await held;
    await route.continue();
  });
  try {
    const requested = page.waitForRequest((request) => request.url().endsWith(".wasm"));
    const response = page.waitForResponse((response) => response.url().endsWith(".wasm"));
    const point = await canvasPoint(page, 80, 80);
    await page.mouse.click(point.x, point.y);
    await requested;
    await page.keyboard.press("Delete");
    await page
      .locator(".workspace-notice")
      .filter({ hasText: "Finish this pen interaction" })
      .waitFor({ timeout: 3000 });
    await page.keyboard.press("Escape");
    assert.ok(release);
    release();
    const loaded = await response;
    await page.waitForFunction(() => document.body.dataset.penCompiled === "true");
    assert.equal(
      await page.locator(".pen-anchor").count(),
      0,
      "A cancelled click created a late draft after the real WASM finished loading.",
    );
    assert.deepEqual(await documentFor(page), before);
    return loaded;
  } finally {
    release?.();
    await page.unrouteAll({ behavior: "wait" });
  }
}

async function observeCompilation(page: Page) {
  await page.evaluate(() => {
    const compile = WebAssembly.compile;
    WebAssembly.compile = (...args) =>
      compile(...args).then((module) => {
        WebAssembly.compile = compile;
        document.body.dataset.penCompiled = "true";
        return module;
      });
  });
}

export async function loadFailure(page: Page): Promise<void> {
  const before = await documentFor(page);
  await page.route("**/*.wasm", (route) =>
    route.fulfill({ status: 503, contentType: "text/plain", body: "Intentional asset failure" }),
  );
  try {
    const rejected = page.waitForResponse(
      (response) => response.url().endsWith(".wasm") && response.status() === 503,
    );
    await page.getByRole("button", { name: "Pen", exact: true }).click();
    await rejected;
    await page.locator(".workspace-notice").filter({ hasText: "Pen could not load." }).waitFor();
    const retry = page.waitForResponse(
      (response) => response.url().endsWith(".wasm") && response.status() === 503,
    );
    const point = await canvasPoint(page, 200, 180);
    await page.mouse.click(point.x, point.y);
    await retry;
    await page.locator(".workspace-notice").filter({ hasText: "Pen could not load." }).waitFor();
    assert.equal(await page.locator(".pen-anchor").count(), 0);
    assert.deepEqual(
      await documentFor(page),
      before,
      "Failed asset loading created applied or draft geometry.",
    );
  } finally {
    await page.unroute("**/*.wasm");
  }
}

export async function pendingUndo(page: Page): Promise<void> {
  const before = await documentFor(page);
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/commands", async (route) => {
    await held;
    await route.continue();
  });
  try {
    const point = await handlePoint(page, 3);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 8, point.y + 10, { steps: 4 });
    const pending = page.waitForRequest(
      (request) => new URL(request.url()).pathname === "/api/commands",
    );
    await page.mouse.up();
    await pending;
    assert.deepEqual(await documentFor(page), before);
    await page.keyboard.press("Control+z");
    assert.ok(release);
    release();
    assert.deepEqual(
      (await waitRevision(page, before.revision + 2)).nodes,
      before.nodes,
      "Pending Undo did not undo exactly the released drag.",
    );
    await page.keyboard.press("Control+Shift+z");
    const redone = await waitRevision(page, before.revision + 3);
    assert.notDeepEqual(redone.nodes, before.nodes);
  } finally {
    release?.();
    await page.unroute("**/api/commands");
  }
}

export async function returnToStart(page: Page): Promise<void> {
  const before = await documentFor(page);
  const requests: string[] = [];
  const listener = (request: import("playwright").Request) => {
    if (new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postData() ?? "");
  };
  page.on("request", listener);
  try {
    const point = await handlePoint(page, 4);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 10, point.y + 12, { steps: 4 });
    await page.mouse.move(point.x, point.y, { steps: 4 });
    await page.mouse.up();
    assert.deepEqual(await documentFor(page), before);
    assert.deepEqual(requests, [], "A drag returning to its starting point published a command.");
  } finally {
    page.off("request", listener);
  }
}

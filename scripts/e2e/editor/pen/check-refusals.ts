import assert from "node:assert/strict";
import type { Worker } from "playwright";
import { frame, layout } from "../intrinsic-sizing/fixtures";
import {
  accepted,
  choose,
  commands,
  exactHistory,
  install,
  native,
  select,
  type Suite,
} from "../intrinsic-sizing/support";
import { runPenBrowserSuite } from "./browser-suite";
import { nodeFixture } from "./fixtures";
import {
  canvasPoint,
  documentFor,
  handlePoint,
  screenMatrix,
  sameMapping,
  waitHandles,
  waitRevision,
} from "./support";

await runPenBrowserSuite("refusals", "PEN_REFUSALS_PASSED", async (suite) => {
  await destinations(suite);
  await flowShift(suite);
  await sourceSizing(suite);
  await draftGuard(suite);
  await workerLoadFailure(suite);
  await solverFailures(suite);
  await protectedFill(suite);
});

async function protectedFill(suite: Suite) {
  const page = suite.page;
  await install(suite, fillFixture());
  await choose(suite, "leaf", "height", "Fill", ["leaf"]);
  await choose(suite, "peer", "height", "Fill", ["leaf", "peer"]);
  await accepted(suite, { kind: "lock", id: "peer", locked: true });
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await lockedReflow(suite);
  suite.checks.push(
    `${suite.mode}: a locked Fill peer permits native reflow when Pen resizing requires no peer CSS write`,
  );
}

function fillFixture() {
  const pen = nodeFixture();
  pen.parentId = "root";
  pen.style = {
    position: "static",
    width: "202px",
    height: "202px",
    "flex-grow": "0",
    "flex-shrink": "0",
    "flex-basis": "auto",
    margin: "0px",
  };
  return [
    frame("root", null, [pen.id, "leaf", "peer"], {
      ...layout,
      position: "absolute",
      left: "60px",
      top: "40px",
      width: "500px",
      height: "650px",
      "flex-direction": "column",
    }),
    pen,
    ...["leaf", "peer"].map((id) =>
      frame(id, "root", [], { ...layout, width: "100px", height: "100px", "min-height": "0px" }),
    ),
  ];
}

async function lockedReflow(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  const height = await native(page, "peer");
  const observed = commands(page);
  const scale = page.getByRole("spinbutton", { name: "Scale (%)", exact: true });
  await scale.fill("125");
  await scale.press("Enter");
  const after = await waitRevision(page, before.revision + 1);
  assert.equal(observed.requests.length, 1);
  observed.stop();
  assert.equal(after.nodes["pen-node"].style.height, "252.5px");
  assert.deepEqual(after.nodes.peer, before.nodes.peer);
  assert.deepEqual(after.nodes.leaf, before.nodes.leaf);
  assert.ok((await native(page, "peer")).height < height.height);
  await exactHistory(page, before, after);
}

async function destinations(suite: Suite) {
  const page = suite.page;
  const a = frame("a", null, [], {
    position: "absolute",
    left: "50px",
    top: "40px",
    width: "300px",
    height: "250px",
  });
  const b = frame("b", null, [], {
    position: "absolute",
    left: "400px",
    top: "40px",
    width: "300px",
    height: "250px",
  });
  await install(suite, [a, b]);
  await select(page, "a");
  await page
    .locator(".layer-name")
    .getByText("b", { exact: true })
    .click({ modifiers: ["Shift"] });
  await page.getByRole("button", { name: "Pen", exact: true }).click();
  await refusedClick(suite, /Select one frame/u);
  await select(page, "a");
  await accepted(suite, { kind: "lock", id: "a", locked: true });
  await refusedClick(suite, /Unlock the destination/u);
  await accepted(suite, { kind: "lock", id: "a", locked: false });
  await accepted(suite, { kind: "style", id: "a", values: { transform: "rotate(20deg)" } });
  await refusedClick(suite, /transform|Code/iu);
  suite.checks.push(
    `${suite.mode}: ambiguous, locked and unsupported transformed destinations keep the whole document`,
  );
}

async function refusedClick(suite: Suite, message: RegExp) {
  const before = await documentFor(suite.page);
  const observed = commands(suite.page);
  const point = await canvasPoint(suite.page, 220, 200);
  await suite.page.mouse.click(point.x, point.y);
  await suite.page.locator(".workspace-notice").filter({ hasText: message }).waitFor();
  assert.equal(await suite.page.locator(".pen-anchor").count(), 0);
  assert.deepEqual(await documentFor(suite.page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
}

async function flowShift(suite: Suite) {
  const page = suite.page;
  await install(suite, [
    frame("centered", null, [], {
      ...layout,
      position: "absolute",
      left: "60px",
      top: "40px",
      width: "500px",
      height: "400px",
      "justify-content": "center",
    }),
  ]);
  await select(page, "centered");
  const before = await documentFor(page);
  const observed = commands(page);
  const point = await canvasPoint(page, 180, 180);
  await page.mouse.click(point.x, point.y);
  await waitHandles(page, 1);
  const first = await handlePoint(page, 1);
  await page.mouse.click(first.x + 80, first.y + 30);
  await page
    .locator(".workspace-notice")
    .filter({ hasText: /layout would move/u })
    .waitFor();
  await page.keyboard.press("Escape");
  await waitHandles(page, 0);
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
  suite.checks.push(
    `${suite.mode}: native flow that shifts the frozen origin refuses the complete insertion`,
  );
}

async function sourceSizing(suite: Suite) {
  const page = suite.page;
  const node = nodeFixture();
  node.style.width = "auto";
  await install(suite, [node]);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  const before = await documentFor(page);
  const observed = commands(page);
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 10, point.y + 12);
  await page.mouse.up();
  await page.locator(".workspace-notice").filter({ hasText: /Fixed/u }).waitFor();
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
  assert.equal((await documentFor(page)).nodes[node.id].style.width, "auto");
  suite.checks.push(
    `${suite.mode}: source-owned sizing refuses anchor edits without converting its mode`,
  );
}

async function draftGuard(suite: Suite) {
  const page = suite.page;
  await install(suite, [nodeFixture()]);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Object source", exact: true });
  const original = await editor.innerText();
  await editor.fill(original + "\n");
  await editor.press("End");
  for (const key of ["p", "a", "Enter", "Delete"]) await editor.press(key);
  const draft = await editor.innerText();
  const before = await documentFor(page);
  const point = await handlePoint(page, 3);
  await page.mouse.click(point.x, point.y);
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await editor.innerText(), draft);
  assert.deepEqual(await documentFor(page), before);
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  suite.checks.push(
    `${suite.mode}: Code retains Pen keys and cancelling its draft safeguard retains the whole path`,
  );
}

async function solverFailures(suite: Suite) {
  const page = suite.page;
  const matrix = await screenMatrix(page, "pen-node");
  for (const kind of ["trap", "invalid"] as const) {
    const before = await documentFor(page);
    const observed = commands(page);
    const created = page.waitForEvent("worker");
    const point = await handlePoint(page, 3);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
    await injectFailure(await created, kind);
    await page.mouse.move(point.x + 10, point.y + 12);
    await page
      .locator(".workspace-notice")
      .filter({ hasText: /unreachable|invalid buffer/u })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.mouse.up();
    assert.deepEqual(await documentFor(page), before);
    assert.deepEqual(observed.requests, []);
    sameMapping(matrix, await screenMatrix(page, "pen-node"));
    observed.stop();
  }
  const before = await documentFor(page);
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
  await page.mouse.move(point.x + 5, point.y + 6, { steps: 4 });
  await page.mouse.up();
  await waitRevision(page, before.revision + 1);
  suite.checks.push(
    `${suite.mode}: a real WASM trap and invalid buffer preserve the applied path; a fresh gesture retries successfully`,
  );
}

async function injectFailure(worker: Worker, kind: "trap" | "invalid") {
  await worker.evaluate((kind) => {
    const original = Object.getOwnPropertyDescriptor(WebAssembly.Instance.prototype, "exports");
    if (!original?.get) throw new Error("Expected native WASM exports getter.");
    const getter = original.get;
    const trap = new WebAssembly.Instance(
      new WebAssembly.Module(
        new Uint8Array([
          0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 7, 8, 1, 4, 116, 114, 97, 112,
          0, 0, 10, 5, 1, 3, 0, 0, 11,
        ]),
      ),
    ).exports.trap;
    Object.defineProperty(WebAssembly.Instance.prototype, "exports", {
      configurable: true,
      get(this: WebAssembly.Instance) {
        return {
          ...Reflect.apply(getter, this, []),
          solve_request: kind === "trap" ? trap : () => -1,
        };
      },
    });
  }, kind);
}

async function workerLoadFailure(suite: Suite) {
  const page = suite.page;
  const before = await documentFor(page);
  const observed = commands(page);
  await page.route("**/*solver-worker*", (route) => route.abort());
  const point = await handlePoint(page, 3);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.waitForFunction(() => document.querySelector(".canvas")?.hasPointerCapture(1));
  await page.mouse.move(point.x + 10, point.y + 12);
  await page
    .locator(".workspace-notice")
    .filter({ hasText: /worker|load/iu })
    .waitFor();
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await page.unroute("**/*solver-worker*");
  assert.deepEqual(await documentFor(page), before);
  assert.deepEqual(observed.requests, []);
  observed.stop();
  suite.checks.push(`${suite.mode}: a failed Worker asset preserves the path and permits retry`);
}

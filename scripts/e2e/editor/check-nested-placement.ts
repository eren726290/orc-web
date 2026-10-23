import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page, type Request, type Response } from "playwright";
import { parseCommand, type Mutation } from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { replaceText } from "../../../src/editor/rendering/text-runs";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

type Axis = "width" | "height";
type Case = { axis: Axis; content: boolean; fixedZero: boolean };
type Removal = "delete" | "absolute" | "reparent";
type GuardCase = { axis: Axis; removal: Removal; second: boolean };
type TextEntry = "properties" | "canvas";
type TextSupport = "sole" | "second" | "bounded" | "fixed-zero" | "exit-Fixed" | "exit-Fit";
type TextCase = { axis: Axis; entry: TextEntry; support: TextSupport };
const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_NESTED_PLACEMENT_EVIDENCE ?? "verification";
const modes = process.env.ORC_NESTED_PLACEMENT_MODES ?? "development+built";
assert.ok(["development", "built", "development+built"].includes(modes));
const scenario = process.env.ORC_NESTED_PLACEMENT_SCENARIO ?? "all";
assert.ok(["all", "placement", "guards", "text"].includes(scenario));
const directory = process.env.ORC_NESTED_PLACEMENT_DIRECTORY ?? "artifacts/editor";
await mkdir(directory, { recursive: true });
const evidence = sourceEvidence();
const inputs: unknown[] = [];
const checks: string[] = [];
const failures: string[] = [];
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
let failure: string | null = null;
try {
  await nativeControls();
  if (modes !== "built") await verifyMode("development");
  if (modes !== "development") await verifyMode("built");
  assert.deepEqual(failures, [], "Fill dependencies must survive placement and later edits");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify(
      {
        ...evidence,
        after: sourceEvidence(),
        channel,
        browserVersion: browser.version(),
        modes,
        phase,
        scenario,
        command: `ORC_NESTED_PLACEMENT_DIRECTORY=${directory} ORC_NESTED_PLACEMENT_EVIDENCE=${phase} ORC_NESTED_PLACEMENT_MODES=${modes} ORC_NESTED_PLACEMENT_SCENARIO=${scenario} bun scripts/e2e/editor/check-nested-placement.ts ${channel}`,
        requirement: "doc_v1/interface/flex-layout.md:234-237",
        inputs,
        checks,
        failures,
        failure,
      },
      null,
      2,
    )}\n`,
  );
}
process.stdout.write("Nested cross-Fill placement workflow passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await page.getByRole("button", { name: "New project", exact: true }).click();
    await page.getByText("No layers yet", { exact: true }).waitFor();
    await workflow(page, mode);
    assert.deepEqual(errors, []);
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    const exit = await app.stop();
    inputs.push({ mode, exit, errors, appOutput: app.output });
    assert.equal(exit, 0);
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
  }
}

async function workflow(page: Page, mode: string) {
  for (const axis of ["width", "height"] satisfies Axis[]) {
    if (["all", "placement"].includes(scenario)) {
      await validPlacement(page, mode, { axis, content: true, fixedZero: false });
      await validPlacement(page, mode, { axis, content: false, fixedZero: true });
      await unresolvedPlacement(page, mode, { axis, content: false, fixedZero: false });
    }
    if (["all", "guards"].includes(scenario)) await guardWorkflow(page, mode, axis);
    if (["all", "text"].includes(scenario)) await textWorkflow(page, mode, axis);
  }
}

function frame(
  id: string,
  parentId: string | null,
  children: string[],
  style: DesignNode["style"],
): DesignNode {
  return {
    id,
    parentId,
    children,
    name: id,
    kind: "frame",
    clipContent: false,
    mode: "inherit",
    visible: true,
    locked: false,
    attributes: { title: `Retained ${id}` },
    style,
  };
}

function fixture(test: Case): DesignNode[] {
  const main = test.axis === "width" ? "height" : "width";
  const direction = test.axis === "width" ? "column" : "row";
  const layout = { display: "flex", "flex-direction": direction, "align-items": "flex-start" };
  const roots = { ...layout, position: "absolute", top: "80px", [main]: "160px" };
  return [
    frame("source", null, ["item"], {
      ...roots,
      left: "80px",
      [test.axis]: "120px",
      background: "#e8edf4",
    }),
    frame("destination", null, [], {
      ...roots,
      left: "380px",
      [test.axis]: test.fixedZero ? "0px" : "max-content",
      padding: "12px",
      background: "#cddfd2",
    }),
    frame("item", "source", test.content ? ["content"] : [], {
      ...layout,
      [main]: "40px",
      [test.axis]: "auto",
      "align-self": "stretch",
      flex: "0 0 auto",
      background: "#c8d9ee",
    }),
    ...(test.content
      ? [
          frame("content", "item", [], {
            [test.axis]: "60px",
            [main]: "20px",
            flex: "0 0 auto",
            background: "#7087a3",
          }),
        ]
      : []),
  ];
}

async function reset(page: Page, test: Case) {
  const document = (await session(page)).projects[0].document;
  if (document.workspaceRootIds.length)
    await accepted(page, { kind: "delete", ids: document.workspaceRootIds });
  await accepted(page, { kind: "insert", nodes: fixture(test) });
  const expand = page.getByRole("button", { name: "Expand source", exact: true });
  if (await expand.count()) await expand.click();
  await page.locator(".layer-name").getByText("item", { exact: true }).click();
  await settled(page);
  close((await geometry(page, "item"))[test.axis], 120);
  const label = test.axis === "width" ? "Width" : "Height";
  assert.equal(
    await page
      .getByRole("combobox", { name: `${label} sizing`, exact: true })
      .locator("option:checked")
      .innerText(),
    "Fill",
  );
}

async function validPlacement(page: Page, mode: string, test: Case) {
  await reset(page, test);
  const before = await session(page);
  const original = await geometry(page, "item");
  const commands = observeCommands(page);
  try {
    await drag(page);
    await validPreview(page, test, before);
    await cancel(page);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(await geometry(page, "item"), original);
    assert.deepEqual(commands.requests, []);
    assert.deepEqual(commands.historyRequests, []);
    await drag(page);
    await validPreview(page, test, before);
    const pending = page.waitForResponse(isCommand);
    await page.mouse.up();
    assert.equal((await pending).status(), 200);
    await settled(page);
    const after = (await session(page)).projects[0].document;
    assertPlacement(before.projects[0].document, after, commands.requests);
    await placedGeometry(page, test);
    await exactHistory(page, before.projects[0].document, after);
    await page.screenshot({
      path: artifact(`${mode}-${test.axis}-${test.fixedZero ? "zero" : "content"}.png`),
    });
    inputs.push({
      mode,
      test,
      before,
      after,
      requests: commands.requests,
      historyRequests: commands.historyRequests,
      geometry: await geometry(page, "item"),
    });
    checks.push(`${mode} ${test.axis}: valid placement, Escape and history passed`);
  } finally {
    commands.stop();
  }
}

async function validPreview(page: Page, test: Case, before: Awaited<ReturnType<typeof session>>) {
  assert.equal(await renderedParent(page), "destination");
  assert.equal(await page.locator('[data-orc-drop-parent="destination"]').count(), 1);
  assert.equal(await page.locator('[data-orc-drop-object="item"]').count(), 1);
  assert.deepEqual(await session(page), before, "Preview cannot publish source or history");
  await placedGeometry(page, test);
}

async function placedGeometry(page: Page, test: Case) {
  const item = await geometry(page, "item");
  close(item[test.axis], test.fixedZero ? 0 : 60);
  if (test.content) close((await geometry(page, "content"))[test.axis], 60);
  const style = await node(page, "item").evaluate((element) => ({
    axis: element.style.getPropertyValue(
      element.parentElement?.style.flexDirection === "column" ? "width" : "height",
    ),
    align: getComputedStyle(element).alignSelf,
  }));
  assert.deepEqual(style, { axis: "auto", align: "stretch" });
}

async function unresolvedPlacement(page: Page, mode: string, test: Case) {
  await reset(page, test);
  const before = await session(page);
  const original = await geometry(page, "item");
  const commands = observeCommands(page);
  try {
    await drag(page);
    const preview = await observation(page);
    await page.screenshot({ path: artifact(`${mode}-${test.axis}-unresolved-preview.png`) });
    await cancel(page);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(await geometry(page, "item"), original);
    assert.deepEqual(commands.requests, []);
    assert.deepEqual(commands.historyRequests, []);
    await drag(page);
    await page.mouse.up();
    await settled(page);
    const after = await session(page);
    const drop = await observation(page);
    assert.deepEqual(commands.historyRequests, []);
    inputs.push({
      mode,
      test,
      before,
      after,
      original,
      preview,
      drop,
      requests: commands.requests,
    });
    await page.screenshot({ path: artifact(`${mode}-${test.axis}-unresolved-drop.png`) });
    assertRejection(test.axis, before, after, preview, drop, commands.requests);
    checks.push(`${mode} ${test.axis}: unresolved destination refused without changes`);
  } catch (error) {
    failures.push(`${mode} ${test.axis}: ${errorMessage(error)}`);
  } finally {
    commands.stop();
  }
}

function assertRejection(
  axis: Axis,
  before: Awaited<ReturnType<typeof session>>,
  after: Awaited<ReturnType<typeof session>>,
  preview: Awaited<ReturnType<typeof observation>>,
  drop: Awaited<ReturnType<typeof observation>>,
  requests: unknown[],
) {
  assert.deepEqual(
    { parent: preview.parent, marker: preview.marker, extent: preview.geometry[axis] },
    { parent: "source", marker: 0, extent: 120 },
    "Unresolved preview must retain original parent and size",
  );
  assert.deepEqual(requests, [], "Unavailable drop submits no command");
  assert.deepEqual(after, before, "Unavailable drop retains exact session, source and history");
  assert.equal(drop.parent, "source");
  assert.equal(drop.marker, 0);
  close(drop.geometry[axis], 120);
  assert.ok(drop.notice.startsWith(`Set the parent's ${axis} first.`), drop.notice);
}

async function observation(page: Page) {
  return {
    parent: await renderedParent(page),
    geometry: await geometry(page, "item"),
    marker: await page.locator(".flex-drop-marker").count(),
    notice: (await page.locator(".workspace-notice").allTextContents()).join("").trim(),
  };
}

function assertPlacement(before: DesignDocument, after: DesignDocument, requests: unknown[]) {
  assert.equal(requests.length, 1, "Drop submits exactly one command");
  const command = parseCommand(requests[0]);
  assert.equal(command.mutation.kind, "batch", "Placement and sizing are one atomic batch");
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes.item.parentId, "destination");
  assert.equal(after.nodes.item.style.width, before.nodes.item.style.width);
  assert.equal(after.nodes.item.style.height, before.nodes.item.style.height);
  assert.equal(after.nodes.item.style["align-self"], "stretch");
  assertRetainedItem(before.nodes.item, after.nodes.item);
  assert.deepEqual(after.nodes.source.children, []);
  assert.deepEqual(after.nodes.destination.children, ["item"]);
  const restored = structuredClone(after);
  for (const id of ["item", "source", "destination"]) restored.nodes[id] = before.nodes[id];
  assertContent(restored, before);
  assert.deepEqual(after.nodes.source.style, before.nodes.source.style);
  assert.deepEqual(after.nodes.destination.style, before.nodes.destination.style);
}

function assertRetainedItem(before: DesignNode, after: DesignNode) {
  assert.deepEqual({ ...after, parentId: before.parentId, style: before.style }, before);
  const placement = ["position", "flex-grow", "flex-shrink", "flex-basis"];
  const unrelated = (style: DesignNode["style"]) =>
    Object.fromEntries(Object.entries(style).filter(([property]) => !placement.includes(property)));
  assert.deepEqual(unrelated(after.style), unrelated(before.style));
}

async function drag(page: Page) {
  return dragNode(page, "item");
}

async function dragNode(page: Page, id: string) {
  const grab = await node(page, id).evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x + box.width * 0.85, y: box.y + box.height * 0.85 };
  });
  const target = await node(page, "destination").evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  });
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 10 });
  await settled(page);
}

async function cancel(page: Page) {
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await settled(page);
  assert.equal(await page.locator(".flex-drop-marker").count(), 0);
}

async function exactHistory(page: Page, before: DesignDocument, after: DesignDocument) {
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
}

async function history(page: Page, direction: "undo" | "redo") {
  const pending = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/history" && response.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  assert.equal((await pending).status(), 200);
  await settled(page);
}

function observeCommands(page: Page) {
  const requests: unknown[] = [];
  const historyRequests: unknown[] = [];
  const record = (request: Request) => {
    if (request.method() !== "POST") return;
    const path = new URL(request.url()).pathname;
    if (path === "/api/commands") requests.push(request.postDataJSON());
    if (path === "/api/history") historyRequests.push(request.postDataJSON());
  };
  page.on("request", record);
  return { requests, historyRequests, stop: () => page.off("request", record) };
}

async function accepted(page: Page, mutation: Mutation) {
  const document = (await session(page)).projects[0].document;
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: document.id,
      expectedRevision: document.revision,
      commandId: crypto.randomUUID(),
      mutation,
    },
  });
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
}

async function settled(page: Page) {
  const revision = (await session(page)).projects[0].document.revision;
  await page.waitForFunction(
    (value) =>
      document.querySelector(".canvas")?.getAttribute("data-orc-revision") === String(value),
    revision,
  );
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

async function geometry(page: Page, id: string) {
  return node(page, id).evaluate((element) => {
    const world = element.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const box = element.getBoundingClientRect();
    const origin = world.getBoundingClientRect();
    return {
      x: (box.x - origin.x) / scale,
      y: (box.y - origin.y) / scale,
      width: box.width / scale,
      height: box.height / scale,
    };
  });
}

async function nativeControls() {
  const page = await browser.newPage();
  try {
    for (const axis of ["width", "height"] satisfies Axis[])
      for (const fixedZero of [false, true]) await nativeControl(page, axis, fixedZero);
    checks.push("Native width/height intrinsic 60px and independent Fixed zero controls passed");
  } finally {
    await page.close();
  }
}

async function nativeControl(page: Page, axis: Axis, fixedZero: boolean) {
  const main = axis === "width" ? "height" : "width";
  const direction = axis === "width" ? "column" : "row";
  const content = fixedZero ? "" : `<div style="${axis}:60px;${main}:20px;flex:0 0 auto"></div>`;
  await page.setContent(
    `<div id="parent" style="display:flex;flex-direction:${direction};${axis}:${fixedZero ? "0px" : "max-content"};${main}:160px;padding:12px;align-items:flex-start"><div id="child" style="display:flex;${axis}:auto;${main}:40px;align-self:stretch;flex:0 0 auto">${content}</div></div>`,
  );
  const extent = await page
    .locator("#child")
    .evaluate((element, physicalAxis) => element.getBoundingClientRect()[physicalAxis], axis);
  close(extent, fixedZero ? 0 : 60);
  inputs.push({ nativeControl: { axis, fixedZero, expected: fixedZero ? 0 : 60, extent } });
}

function node(page: Page, id: string) {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`);
}
function renderedParent(page: Page) {
  return node(page, "item").evaluate((element) =>
    element.parentElement?.getAttribute("data-orc-id"),
  );
}
async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}
function isCommand(response: Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}
function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual({ ...actual, revision: 0 }, { ...expected, revision: 0 });
}
function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.1, `Expected ${expected}, got ${actual}`);
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
function artifact(suffix: string) {
  return join(directory, `nested-placement-${phase}-${suffix}`);
}

async function guardWorkflow(page: Page, mode: string, axis: Axis) {
  for (const removal of ["delete", "absolute", "reparent"] satisfies Removal[])
    for (const second of [false, true]) {
      const label = `${mode}-${axis}-${removal}-${second ? "second" : "sole"}`;
      await collectCase(page, label, () => contributorCase(page, label, { axis, removal, second }));
    }
  for (const choice of ["Fixed", "Fit"] as const) {
    const label = `${mode}-${axis}-explicit-${choice}`;
    await collectCase(page, label, () => explicitExit(page, label, axis, choice));
  }
  for (const exit of [false, true]) {
    const label = `${mode}-${axis}-alignment-${exit ? "explicit-exit" : "implicit"}`;
    await collectCase(page, label, () => alignmentCase(page, label, axis, exit));
  }
}

async function collectCase(page: Page, label: string, action: () => Promise<void>) {
  try {
    await action();
    checks.push(`${label}: passed`);
  } catch (error) {
    failures.push(`${label}: ${errorMessage(error)}`);
  } finally {
    await page.screenshot({ path: artifact(`${label}.png`), fullPage: true });
  }
}

function contributorFixture(axis: Axis, second: boolean) {
  const main = axis === "width" ? "height" : "width";
  const direction = axis === "width" ? "column" : "row";
  const layout = { display: "flex", "flex-direction": direction, "align-items": "flex-start" };
  return [
    frame("root", null, ["leaf", "content", ...(second ? ["second"] : [])], {
      ...layout,
      position: "absolute",
      left: "80px",
      top: "80px",
      [axis]: "300px",
      [main]: "180px",
      background: "#e8edf4",
    }),
    frame("leaf", "root", [], {
      ...layout,
      [axis]: "auto",
      [main]: "40px",
      "align-self": "stretch",
      flex: "0 0 auto",
      background: "#c8d9ee",
    }),
    fixedContributor("content", axis, 60, 40),
    ...(second ? [fixedContributor("second", axis, 80, 30)] : []),
    contributorDestination(layout),
  ];
}

function fixedContributor(id: string, axis: Axis, extent: number, mainExtent: number) {
  const main = axis === "width" ? "height" : "width";
  return frame(id, "root", [], {
    [axis]: `${extent}px`,
    [main]: `${mainExtent}px`,
    flex: "0 0 auto",
    background: "#7087a3",
  });
}

function contributorDestination(layout: DesignNode["style"]) {
  return frame("destination", null, [], {
    ...layout,
    position: "absolute",
    left: "480px",
    top: "80px",
    width: "160px",
    height: "180px",
    background: "#cddfd2",
  });
}

async function installFixture(page: Page, nodes: DesignNode[]) {
  const document = (await session(page)).projects[0].document;
  if (document.workspaceRootIds.length)
    await accepted(page, { kind: "delete", ids: document.workspaceRootIds });
  await accepted(page, { kind: "insert", nodes });
}

async function selectGuard(page: Page, id: string) {
  const document = (await session(page)).projects[0].document;
  const ancestors: string[] = [];
  let parent = document.nodes[id].parentId;
  while (parent) {
    ancestors.unshift(parent);
    parent = document.nodes[parent].parentId;
  }
  for (const ancestor of ancestors) {
    const expand = page.getByRole("button", { name: `Expand ${ancestor}`, exact: true });
    if (await expand.count()) await expand.click();
  }
  await page.locator(".layer-name").getByText(id, { exact: true }).click();
  await settled(page);
}

async function chooseMode(page: Page, id: string, axis: Axis, choice: "Fixed" | "Fit") {
  await selectGuard(page, id);
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  const label = axis === "width" ? "Width" : "Height";
  const control = page.getByRole("combobox", { name: `${label} sizing`, exact: true });
  await control.selectOption({ label: choice });
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.equal(await control.locator("option:checked").innerText(), choice);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  await exactHistory(page, before, after);
  inputs.push({ trigger: "Explicit sizing", id, axis, choice, before, after });
}

async function intrinsicRoot(page: Page, axis: Axis, second: boolean) {
  await installFixture(page, contributorFixture(axis, second));
  close((await geometry(page, "leaf"))[axis], 300);
  await chooseMode(page, "root", axis, "Fit");
  close((await geometry(page, "root"))[axis], second ? 80 : 60);
  close((await geometry(page, "leaf"))[axis], second ? 80 : 60);
  close((await geometry(page, "content"))[axis], 60);
}

async function guardSnapshot(page: Page) {
  const boxes: Record<string, Awaited<ReturnType<typeof geometry>> | null> = {};
  for (const id of ["root", "middle", "leaf", "content", "second", "destination"])
    boxes[id] = (await node(page, id).count()) ? await geometry(page, id) : null;
  return { session: await session(page), boxes };
}

async function contributorCase(page: Page, label: string, test: GuardCase) {
  await intrinsicRoot(page, test.axis, test.second);
  await selectGuard(page, "content");
  const before = await guardSnapshot(page);
  const commands = observeCommands(page);
  try {
    const preview = await removeContributor(page, test.removal);
    const after = await guardSnapshot(page);
    const messages = await guardMessages(page);
    inputs.push({
      label,
      test,
      before,
      after,
      preview,
      messages,
      requests: commands.requests,
      historyRequests: commands.historyRequests,
    });
    if (test.second) {
      assert.equal(commands.requests.length, 1);
      await retainedContributor(
        page,
        test,
        before.session.projects[0].document,
        after.session.projects[0].document,
      );
    } else {
      assertGuardRefusal(before, after, commands, messages, `Set the parent's ${test.axis} first.`);
      if (preview) assert.deepEqual(preview, before);
    }
  } finally {
    commands.stop();
  }
}

async function removeContributor(page: Page, removal: Removal) {
  let preview: Awaited<ReturnType<typeof guardSnapshot>> | null = null;
  if (removal === "delete") await page.getByRole("application", { name: "Canvas" }).press("Delete");
  else if (removal === "absolute")
    await page.getByRole("checkbox", { name: "Absolute Position", exact: true }).click();
  else {
    await dragNode(page, "content");
    preview = await guardSnapshot(page);
    await page.mouse.up();
  }
  await settled(page);
  return preview;
}

async function retainedContributor(
  page: Page,
  test: GuardCase,
  before: DesignDocument,
  after: DesignDocument,
) {
  assert.equal(after.revision, before.revision + 1);
  close((await geometry(page, "root"))[test.axis], 80);
  close((await geometry(page, "leaf"))[test.axis], 80);
  assert.deepEqual(after.nodes.second, before.nodes.second);
  assert.deepEqual(after.nodes.leaf, before.nodes.leaf);
  if (test.removal === "delete") assert.equal(after.nodes.content, undefined);
  else {
    close((await geometry(page, "content"))[test.axis], 60);
    if (test.removal === "absolute") {
      assert.equal(
        await node(page, "content").evaluate((element) => getComputedStyle(element).position),
        "absolute",
      );
      assert.equal(
        await page.getByRole("checkbox", { name: "Absolute Position", exact: true }).isChecked(),
        true,
      );
    } else assert.equal(after.nodes.content.parentId, "destination");
  }
  await exactHistory(page, before, after);
}

async function explicitExit(page: Page, label: string, axis: Axis, choice: "Fixed" | "Fit") {
  await intrinsicRoot(page, axis, false);
  await chooseMode(page, "leaf", axis, choice);
  await selectGuard(page, "content");
  const before = (await session(page)).projects[0].document;
  const commands = observeCommands(page);
  try {
    await removeContributor(page, "delete");
    const after = (await session(page)).projects[0].document;
    inputs.push({ label, before, after, requests: commands.requests });
    assert.equal(commands.requests.length, 1);
    assert.equal(after.revision, before.revision + 1);
    assert.equal(after.nodes.content, undefined);
    close((await geometry(page, "leaf"))[axis], choice === "Fixed" ? 60 : 0);
    close((await geometry(page, "root"))[axis], choice === "Fixed" ? 60 : 0);
    await exactHistory(page, before, after);
  } finally {
    commands.stop();
  }
}

function alignmentFixture(axis: Axis) {
  const main = axis === "width" ? "height" : "width";
  const direction = axis === "width" ? "column" : "row";
  const inner = axis === "width" ? "row" : "column";
  return [
    frame("root", null, ["middle"], {
      display: "flex",
      "flex-direction": direction,
      "align-items": "stretch",
      position: "absolute",
      left: "80px",
      top: "80px",
      [axis]: "300px",
      [main]: "160px",
      background: "#e8edf4",
    }),
    frame("middle", "root", ["leaf"], {
      display: "flex",
      "flex-direction": inner,
      [axis]: "auto",
      [main]: "40px",
      flex: "0 0 auto",
      background: "#c8d9ee",
    }),
    frame("leaf", "middle", [], {
      [axis]: "auto",
      [main]: "40px",
      "flex-grow": "1",
      "flex-shrink": "0",
      "flex-basis": "0px",
      [`min-${axis}`]: "0px",
      background: "#7087a3",
    }),
  ];
}

async function alignmentCase(page: Page, label: string, axis: Axis, exit: boolean) {
  await installFixture(page, alignmentFixture(axis));
  close((await geometry(page, "middle"))[axis], 300);
  close((await geometry(page, "leaf"))[axis], 300);
  if (exit) await chooseMode(page, "middle", axis, "Fixed");
  await selectGuard(page, "root");
  const before = await guardSnapshot(page);
  const commands = observeCommands(page);
  try {
    await page.getByRole("button", { name: "Align top left", exact: true }).click();
    await settled(page);
    const after = await guardSnapshot(page);
    const messages = await guardMessages(page);
    inputs.push({ label, axis, exit, before, after, messages, requests: commands.requests });
    if (exit) {
      assert.equal(commands.requests.length, 1);
      close((await geometry(page, "middle"))[axis], 300);
      close((await geometry(page, "leaf"))[axis], 300);
      await exactHistory(
        page,
        before.session.projects[0].document,
        after.session.projects[0].document,
      );
    } else {
      const expected = `This change would remove ${axis === "width" ? "Width" : "Height"} Fill. Change the object's sizing first.`;
      assertGuardRefusal(before, after, commands, messages, expected);
    }
  } finally {
    commands.stop();
  }
}

function assertGuardRefusal(
  before: Awaited<ReturnType<typeof guardSnapshot>>,
  after: Awaited<ReturnType<typeof guardSnapshot>>,
  commands: ReturnType<typeof observeCommands>,
  messages: string[],
  expected: string,
) {
  assert.deepEqual(commands.requests, [], "Refusal submits no command");
  assert.deepEqual(commands.historyRequests, [], "Refusal submits no history request");
  assert.deepEqual(after, before, "Refusal preserves exact session, history and native geometry");
  assert.ok(
    messages.some((message) => message.startsWith(expected)),
    messages.join("\n"),
  );
}

async function guardMessages(page: Page) {
  return [
    ...(await page.getByRole("alert").allTextContents()),
    ...(await page.locator(".workspace-notice").allTextContents()),
  ].map((text) => text.trim());
}

async function textWorkflow(page: Page, mode: string, axis: Axis) {
  for (const entry of ["properties", "canvas"] satisfies TextEntry[])
    for (const support of [
      "sole",
      "second",
      "bounded",
      "exit-Fixed",
      "exit-Fit",
    ] satisfies TextSupport[]) {
      const label = `${mode}-${axis}-text-${entry}-${support}`;
      await collectCase(page, label, () => textCase(page, label, { axis, entry, support }));
    }
  const label = `${mode}-${axis}-text-properties-fixed-zero`;
  await collectCase(page, label, () =>
    textCase(page, label, { axis, entry: "properties", support: "fixed-zero" }),
  );
}

function textContributor(axis: Axis, support: TextSupport): DesignNode {
  return {
    id: "content",
    name: "content",
    parentId: "root",
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    kind: "text",
    tag: "p",
    runs: [{ text: "Independent content", style: {} }],
    style: {
      width: "max-content",
      height: "max-content",
      ...(support === "fixed-zero" ? { [axis]: "0px" } : {}),
      margin: "0px",
      display: "block",
      position: "relative",
      flex: "0 0 auto",
      "font-size": "20px",
      "line-height": "20px",
      "white-space": "pre-wrap",
    },
  };
}

async function textRoot(page: Page, test: TextCase) {
  const nodes = contributorFixture(test.axis, test.support === "second").filter(
    (node) => node.id !== "content",
  );
  await installFixture(page, [...nodes, textContributor(test.axis, test.support)]);
  if (test.support !== "bounded") await chooseMode(page, "root", test.axis, "Fit");
  if (test.support === "exit-Fixed" || test.support === "exit-Fit")
    await chooseMode(page, "leaf", test.axis, test.support === "exit-Fixed" ? "Fixed" : "Fit");
  await selectGuard(page, "content");
}

async function textInput(page: Page, entry: TextEntry) {
  if (entry === "canvas") await node(page, "content").dblclick();
  return page.getByRole("textbox", {
    name: entry === "canvas" ? "Edit canvas text" : "Content",
    exact: true,
  });
}

async function textCase(page: Page, label: string, test: TextCase) {
  await textRoot(page, test);
  const before = await guardSnapshot(page);
  const commands = observeCommands(page);
  try {
    const result = await clearText(page, test, before, commands);
    const { preview, previewMessages, after, messages } = result;
    inputs.push({
      label,
      test,
      before,
      ...result,
      requests: [...commands.requests],
      historyRequests: [...commands.historyRequests],
    });
    if (test.support === "sole") {
      assertGuardRefusal(before, after, commands, messages, `Set the parent's ${test.axis} first.`);
      assert.deepEqual(preview, before, "Rejected text keeps live layout, source and history");
      if (test.entry === "properties")
        assert.ok(
          previewMessages.some((message) =>
            message.startsWith(`Set the parent's ${test.axis} first.`),
          ),
          "Blocked text preview explains its missing independent parent size",
        );
      await retryText(page, test, before.session.projects[0].document, commands);
    } else {
      assert.equal(commands.requests.length, 1);
      await acceptedText(page, test, before, after);
    }
  } finally {
    commands.stop();
  }
}

async function clearText(
  page: Page,
  test: TextCase,
  before: Awaited<ReturnType<typeof guardSnapshot>>,
  commands: ReturnType<typeof observeCommands>,
) {
  const input = await textInput(page, test.entry);
  if (test.entry === "properties" && ["sole", "bounded"].includes(test.support)) {
    await input.fill("Temporary content");
    await settled(page);
    assert.equal(await node(page, "content").innerText(), "Temporary content");
    await cancelTextInput(page, input, before, commands);
  }
  await input.fill("");
  await settled(page);
  const preview = await guardSnapshot(page);
  const previewMessages = await guardMessages(page);
  if (test.entry === "properties" && test.support === "sole") {
    await cancelTextInput(page, input, before, commands);
    await input.fill("");
    await settled(page);
  }
  const committed = test.support === "sole" ? null : page.waitForResponse(isCommand);
  await input.blur();
  if (committed) assert.equal((await committed).status(), 200);
  await settled(page);
  return {
    preview,
    previewMessages,
    after: await guardSnapshot(page),
    messages: await guardMessages(page),
  };
}

async function cancelTextInput(
  page: Page,
  input: Awaited<ReturnType<typeof textInput>>,
  before: Awaited<ReturnType<typeof guardSnapshot>>,
  commands: ReturnType<typeof observeCommands>,
) {
  await settled(page);
  assert.deepEqual(commands.requests, [], "Text preview submits no command");
  await input.press("Escape");
  await settled(page);
  assert.deepEqual(await guardSnapshot(page), before, "Escape restores text, layout and history");
  assert.deepEqual(commands.requests, [], "Text cancellation submits no command");
  assert.deepEqual(commands.historyRequests, [], "Text cancellation submits no history request");
}

async function acceptedText(
  page: Page,
  test: TextCase,
  before: Awaited<ReturnType<typeof guardSnapshot>>,
  after: Awaited<ReturnType<typeof guardSnapshot>>,
) {
  const previous = before.session.projects[0].document;
  const current = after.session.projects[0].document;
  assert.equal(current.revision, previous.revision + 1);
  assertTextDocument(current, previous, "");
  const expected = textExtent(test, before);
  close((await geometry(page, "root"))[test.axis], expected);
  close((await geometry(page, "leaf"))[test.axis], test.support === "exit-Fit" ? 0 : expected);
  await exactHistory(page, previous, current);
}

function assertTextDocument(actual: DesignDocument, previous: DesignDocument, value: string) {
  const content = previous.nodes.content;
  if (content.kind !== "text") throw new Error("Expected original text node");
  assertContent(actual, {
    ...previous,
    nodes: { ...previous.nodes, content: { ...content, runs: replaceText(content.runs, value) } },
  });
}

function textExtent(test: TextCase, before: Awaited<ReturnType<typeof guardSnapshot>>) {
  if (test.support === "second") return 80;
  if (test.support === "bounded") return 300;
  if (test.support === "exit-Fixed") return before.boxes.leaf?.[test.axis] ?? NaN;
  return 0;
}

async function retryText(
  page: Page,
  test: TextCase,
  before: DesignDocument,
  commands: ReturnType<typeof observeCommands>,
) {
  const input = page.getByRole("textbox", {
    name: test.entry === "canvas" ? "Edit canvas text" : "Content",
    exact: true,
  });
  await input.fill("Recovered content");
  const committed = page.waitForResponse(isCommand);
  await input.blur();
  assert.equal((await committed).status(), 200);
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(commands.requests.length, 1, "Retry submits one supported text command");
  assert.equal(after.revision, before.revision + 1);
  assertTextDocument(after, before, "Recovered content");
  close((await geometry(page, "leaf"))[test.axis], (await geometry(page, "root"))[test.axis]);
  inputs.push({
    trigger: "Text recovery retry",
    test,
    before,
    after,
    requests: [...commands.requests],
  });
  await exactHistory(page, before, after);
}

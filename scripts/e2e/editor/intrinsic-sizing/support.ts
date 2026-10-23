import assert from "node:assert/strict";
import type { Page, Request, Response } from "playwright";
import { parseCommand, type Mutation } from "../../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../../shared/document/model";
import { boundaryCommand, boundarySession } from "../boundary-support";

export type Axis = "width" | "height";
export type Mode = "Fixed" | "Fit" | "Fill";
export type Suite = {
  page: Page;
  mode: string;
  temporary: string;
  inputs: unknown[];
  checks: string[];
  artifact: (name: string) => string;
};
export const session = boundarySession;
export const axes: Axis[] = ["width", "height"];

export function control(page: Page, axis: Axis) {
  return page.getByRole("combobox", { name: `${label(axis)} sizing`, exact: true });
}
export function field(page: Page, axis: Axis) {
  return page.getByLabel(label(axis), { exact: true });
}
function label(axis: Axis) {
  return axis === "width" ? "Width" : "Height";
}
export function node(page: Page, id: string) {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`);
}
export function isCommand(response: Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}
export async function settled(page: Page) {
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
export async function accepted(suite: Suite, mutation: Mutation) {
  const result = await boundaryCommand(suite.page, mutation);
  suite.inputs.push({ fixtureMutation: mutation, result });
  await settled(suite.page);
}
export async function install(suite: Suite, nodes: DesignNode[]) {
  const current = (await session(suite.page)).projects[0].document;
  if (current.workspaceRootIds.length)
    await accepted(suite, { kind: "delete", ids: current.workspaceRootIds });
  await accepted(suite, { kind: "insert", nodes });
}
export async function select(page: Page, id: string) {
  await settled(page);
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
export function native(page: Page, id: string) {
  return node(page, id).evaluate((element) => {
    const world = element.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const box = element.getBoundingClientRect();
    const origin = world.getBoundingClientRect();
    return {
      x: (box.left - origin.left) / scale,
      y: (box.top - origin.top) / scale,
      width: box.width / scale,
      height: box.height / scale,
    };
  });
}
export async function extent(page: Page, id: string, axis: Axis, expected: number) {
  await page.waitForFunction(
    ({ id, axis, expected }) => {
      const element = document.querySelector(`.canvas-world [data-orc-id="${id}"]`);
      const world = element?.closest(".canvas-world");
      if (!element || !world) return false;
      const scale = new DOMMatrix(getComputedStyle(world).transform).a;
      return Math.abs(element.getBoundingClientRect()[axis] / scale - expected) < 0.1;
    },
    { id, axis, expected },
  );
}
export function sameDocument(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual({ ...actual, revision: 0 }, { ...expected, revision: 0 });
}
export function commands(page: Page) {
  const requests: unknown[] = [];
  const record = (request: Request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postDataJSON());
  };
  page.on("request", record);
  return { requests, stop: () => page.off("request", record) };
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
export async function exactHistory(page: Page, before: DesignDocument, after: DesignDocument) {
  await history(page, "undo");
  sameDocument((await session(page)).projects[0].document, before);
  await history(page, "redo");
  sameDocument((await session(page)).projects[0].document, after);
}
export async function choose(suite: Suite, id: string, axis: Axis, mode: Mode, allowed = [id]) {
  await select(suite.page, id);
  return completed(suite, id, axis, allowed, () =>
    control(suite.page, axis)
      .selectOption({ label: mode })
      .then(() => {}),
  );
}
export async function edit(suite: Suite, id: string, axis: Axis, value: number) {
  await select(suite.page, id);
  const before = await session(suite.page);
  const preview = commands(suite.page);
  try {
    await field(suite.page, axis).fill(String(value));
    assert.deepEqual(
      await session(suite.page),
      before,
      "Numeric preview creates no revision or history",
    );
    assert.deepEqual(preview.requests, [], "Numeric preview submits no command");
  } finally {
    preview.stop();
  }
  return completed(suite, id, axis, [id], () => field(suite.page, axis).press("Enter"));
}
async function completed(
  suite: Suite,
  id: string,
  axis: Axis,
  allowed: string[],
  action: () => Promise<void>,
) {
  const page = suite.page;
  const before = (await session(page)).projects[0].document;
  const observed = commands(page);
  try {
    const pending = page.waitForResponse(isCommand);
    await action();
    const response = await pending;
    assert.equal(response.status(), 200, await response.text());
    await settled(page);
    const after = (await session(page)).projects[0].document;
    assert.equal(observed.requests.length, 1, "One completed sizing edit submits one command");
    const request = assertSizingChanges(before, after, axis, allowed, observed.requests[0]);
    suite.inputs.push({
      trigger: "Sizing edit",
      id,
      axis,
      before,
      after,
      request,
      native: await native(page, id),
    });
    await exactHistory(page, before, after);
    return { before, after, request };
  } finally {
    observed.stop();
  }
}
function assertSizingChanges(
  before: DesignDocument,
  after: DesignDocument,
  axis: Axis,
  allowed: string[],
  input: unknown,
) {
  const request = parseCommand(input);
  assert.equal(request.mutation.kind, "batch");
  if (request.mutation.kind !== "batch") throw new Error("Sizing needs an atomic batch");
  const properties = [
    axis,
    "align-self",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "box-sizing",
    "--orc-fill-basis",
    "--orc-fill-decoration",
    "--orc-intrinsic-column",
  ];
  for (const edit of request.mutation.mutations) {
    assert.equal(edit.kind, "style");
    if (edit.kind !== "style") throw new Error("Sizing changes CSS only");
    assert.ok(allowed.includes(edit.id), `Unexpected dependent write to ${edit.id}`);
    for (const key of [...Object.keys(edit.values), ...(edit.unset ?? [])])
      assert.ok(properties.includes(key), key);
  }
  assertDocumentChanges(before, after, allowed, properties);
  return request;
}
function assertDocumentChanges(
  before: DesignDocument,
  after: DesignDocument,
  allowed: string[],
  properties: string[],
) {
  assert.equal(after.revision, before.revision + 1);
  const unrelated = (node: DesignNode) =>
    Object.fromEntries(Object.entries(node.style).filter(([key]) => !properties.includes(key)));
  const restored = structuredClone(after);
  for (const id of allowed) {
    assert.deepEqual(
      unrelated(after.nodes[id]),
      unrelated(before.nodes[id]),
      `${id}: preserve unrelated CSS`,
    );
    restored.nodes[id].style = before.nodes[id].style;
  }
  sameDocument(restored, before);
}
export async function unchanged(suite: Suite, label: string, action: () => Promise<void>) {
  const page = suite.page;
  const before = await snapshot(page);
  const observed = commands(page);
  try {
    await action();
    await settled(page);
    const after = await snapshot(page);
    assert.deepEqual(after, before, label);
    assert.deepEqual(observed.requests, [], "Refusal/cancellation submits no command");
    suite.inputs.push({ trigger: label, before, after, requests: observed.requests });
  } finally {
    observed.stop();
  }
}
async function snapshot(page: Page) {
  const state = await session(page);
  const boxes: Record<string, Awaited<ReturnType<typeof native>>> = {};
  for (const id of Object.keys(state.projects[0].document.nodes))
    boxes[id] = await native(page, id);
  return { state, boxes };
}
export async function refuse(
  suite: Suite,
  axis: Axis,
  mode: Mode,
  message = /parent|Code|Unlock|Fill/iu,
) {
  await unchanged(suite, `Refuse ${axis} ${mode}`, async () => {
    const selected = control(suite.page, axis);
    const option = selected.getByRole("option", { name: mode, exact: true });
    if ((await selected.isDisabled()) || (await option.getAttribute("disabled")) !== null) return;
    await selected.selectOption({ label: mode });
    await suite.page.getByRole("alert").filter({ hasText: message }).waitFor();
  });
}
export async function fillReadout(page: Page, id: string, axis: Axis) {
  await select(page, id);
  assert.equal(await control(page, axis).locator("option:checked").innerText(), "Fill");
  assert.equal(await field(page, axis).getAttribute("readonly"), "");
}

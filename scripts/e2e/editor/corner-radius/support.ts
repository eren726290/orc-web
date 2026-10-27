import assert from "node:assert/strict";
import type { Page, Response } from "playwright";
import type { DesignNode } from "../../../../shared/document/model";
import type { Mutation } from "../../../../shared/commands/commands";
import { boundaryCommand, boundarySession } from "../boundary-support";

export { boundarySession as session } from "../boundary-support";
export const labels = ["Top left", "Top right", "Bottom right", "Bottom left"];
const properties = [
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
];

export function fixture(): DesignNode[] {
  const first = frame("radius", { "border-radius": "8px 12px 16px 20px" });
  first.children = ["nested"];
  return [first, { ...frame("nested"), parentId: first.id }, frame("other", { left: "420px" })];
}

function frame(id: string, style: DesignNode["style"] = {}): DesignNode {
  return {
    id,
    name: id,
    kind: "frame",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    clipContent: true,
    mode: "inherit",
    style: {
      position: "absolute",
      left: "60px",
      top: "60px",
      width: "240px",
      height: "160px",
      background: "#dce7ef",
      ...style,
    },
  };
}

export function field(page: Page, label = "Corner radius") {
  return page.getByLabel(label, { exact: true });
}

export async function settled(page: Page) {
  const revision = (await boundarySession(page)).projects[0].document.revision;
  await page.waitForFunction(
    (revision) =>
      document.querySelector(".canvas")?.getAttribute("data-orc-revision") === String(revision),
    revision,
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

export async function accepted(page: Page, mutation: Mutation) {
  await boundaryCommand(page, mutation);
  await settled(page);
}

export async function select(page: Page, id = "radius") {
  await page.getByRole("button", { name: id, exact: true }).click();
  assert.equal(await field(page, "Name").inputValue(), id);
}

export function isCommand(response: Response) {
  return response.url().endsWith("/api/commands") && response.request().method() === "POST";
}

export async function history(page: Page, direction: "undo" | "redo") {
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/history") && r.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  assert.equal((await response).status(), 200);
  await settled(page);
}

export async function noEdit(page: Page, action: () => Promise<void>) {
  const before = await boundarySession(page);
  const commands: string[] = [];
  const listener = (request: import("playwright").Request) => {
    if (request.url().endsWith("/api/commands")) commands.push(request.postData() ?? "");
  };
  page.on("request", listener);
  try {
    await action();
    await settled(page);
    assert.deepEqual(await boundarySession(page), before);
    assert.deepEqual(commands, []);
  } finally {
    page.off("request", listener);
  }
}

export async function radii(page: Page, expected: number[], id = "radius") {
  await page.waitForFunction(
    ({ expected, id, properties }) => {
      const element = document.querySelector(`.canvas-world [data-orc-id="${id}"]`);
      if (!element) return false;
      const style = getComputedStyle(element);
      return properties.every(
        (property, i) =>
          Math.abs(parseFloat(style.getPropertyValue(property)) - expected[i]) < 1e-9,
      );
    },
    { expected, id, properties },
  );
}

export async function corners(page: Page) {
  const details = page.locator(".corner-radius-controls details");
  if (!(await details.evaluate((element) => element.hasAttribute("open"))))
    await details.locator("summary").press("Enter");
}

export async function edit(
  page: Page,
  label: string,
  value: string,
  expected: number[],
  finish = "Enter",
) {
  const before = (await boundarySession(page)).projects[0].document;
  const geometry = await designBox(page);
  await field(page, label).fill(value);
  await radii(page, expected);
  assert.deepEqual((await boundarySession(page)).projects[0].document, before);
  const response = page.waitForResponse(isCommand);
  await field(page, label).press(finish);
  assert.equal((await response).status(), 200);
  await settled(page);
  const after = (await boundarySession(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.deepEqual(
    { ...after.nodes.radius, style: before.nodes.radius.style },
    before.nodes.radius,
  );
  for (const id of Object.keys(before.nodes).filter((id) => id !== "radius"))
    assert.deepEqual(after.nodes[id], before.nodes[id]);
  await history(page, "undo");
  assert.deepEqual((await boundarySession(page)).projects[0].document.nodes, before.nodes);
  await history(page, "redo");
  assert.deepEqual((await boundarySession(page)).projects[0].document.nodes, after.nodes);
  await radii(page, expected);
  assert.deepEqual(await designBox(page), geometry);
}

async function designBox(page: Page) {
  return page.locator('.canvas-world [data-orc-id="radius"]').evaluate((element) => {
    const world = element.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const box = element.getBoundingClientRect();
    const origin = world.getBoundingClientRect();
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    return {
      x: (box.x - origin.x) / scale,
      y: (box.y - origin.y) / scale,
      width: box.width / scale,
      height: box.height / scale,
    };
  });
}

export async function reset(page: Page, values: DesignNode["style"]) {
  const node = (await boundarySession(page)).projects[0].document.nodes.radius;
  const unset = Object.keys(node.style).filter(
    (key) => key.includes("radius") || key === "all" || key.startsWith("--curve"),
  );
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "radius", values: {}, unset },
      { kind: "style", id: "radius", values },
    ],
  });
}

import assert from "node:assert/strict";
import type { Page, Response } from "playwright";
import type { DesignNode, Styles } from "../../../../shared/document/model";
import type { Mutation } from "../../../../shared/commands/commands";
import { boundaryCommand, boundarySession } from "../boundary-support";
export { boundarySession as session } from "../boundary-support";

export function frame(
  id: string,
  parentId: string | null,
  style: Styles = {},
): Extract<DesignNode, { kind: "frame" }> {
  return {
    id,
    name: id,
    kind: "frame",
    parentId,
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    clipContent: false,
    mode: "inherit",
    style: {
      position: "absolute",
      left: "60px",
      top: "40px",
      width: "120px",
      height: "80px",
      "box-sizing": "border-box",
      background: "#b3c5d8",
      ...style,
    },
  };
}
export function fixture(): DesignNode[] {
  return [
    {
      ...frame("parent", null, {
        left: "40px",
        top: "60px",
        width: "420px",
        height: "320px",
        padding: "14px",
        border: "6px solid #66717a",
        background: "#eef1f3",
      }),
      children: ["child", "peer"],
    },
    {
      ...frame("child", "parent", {
        padding: "5px",
        border: "3px solid #506a82",
        margin: "2px 4px",
      }),
      children: ["leaf"],
    },
    frame("leaf", "child", { left: "15px", top: "10px", width: "25px", height: "20px" }),
    frame("peer", "parent", { left: "230px", top: "190px", width: "40px", height: "30px" }),
    frame("destination", null, { left: "500px", top: "70px", width: "260px", height: "240px" }),
  ];
}
export function selectField(page: Page, axis: "width" | "height") {
  return page.getByLabel(`${axis === "width" ? "Horizontal" : "Vertical"} constraint`, {
    exact: true,
  });
}
export function command(response: Response) {
  return response.url().endsWith("/api/commands") && response.request().method() === "POST";
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
export async function patch(page: Page, id: string, values: Styles) {
  await accepted(page, { kind: "style", id, values });
}
export async function select(page: Page, id = "child") {
  const nodes = (await boundarySession(page)).projects[0].document.nodes;
  const parents: string[] = [];
  let parent = nodes[id].parentId;
  while (parent) {
    parents.unshift(parent);
    parent = nodes[parent].parentId;
  }
  for (const parentId of parents) {
    const button = page.getByRole("button", {
      name: `Expand ${nodes[parentId].name}`,
      exact: true,
    });
    if (await button.count()) await button.click();
  }
  await page.getByRole("button", { name: id, exact: true }).click();
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), id);
  await settled(page);
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
export async function box(page: Page, id = "child") {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`).evaluate((element) => {
    const parent = element.parentElement!,
      world = element.closest(".canvas-world")!;
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const b = element.getBoundingClientRect(),
      p = parent.getBoundingClientRect(),
      style = getComputedStyle(parent);
    return {
      x: (b.x - p.x) / scale - parseFloat(style.borderLeftWidth) + parent.scrollLeft,
      y: (b.y - p.y) / scale - parseFloat(style.borderTopWidth) + parent.scrollTop,
      width: b.width / scale,
      height: b.height / scale,
      parentWidth:
        p.width / scale - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth),
      parentHeight:
        p.height / scale - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth),
    };
  });
}
export function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.12, `${actual} should equal ${expected}`);
}
export async function change(
  page: Page,
  axis: "width" | "height",
  mode: string,
  action?: () => Promise<unknown>,
  target = "child",
) {
  if (!action && (await selectField(page, axis).inputValue()) === mode) {
    await noEdit(page, () => selectField(page, axis).selectOption(mode));
    return;
  }
  const before = (await boundarySession(page)).projects[0].document;
  const response = page.waitForResponse(command);
  if (action) await action();
  else await selectField(page, axis).selectOption(mode);
  assert.equal((await response).status(), 200);
  await settled(page);
  const after = (await boundarySession(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  for (const id of Object.keys(before.nodes).filter((id) => id !== target))
    assert.deepEqual(after.nodes[id], before.nodes[id]);
  await history(page, "undo");
  assert.deepEqual((await boundarySession(page)).projects[0].document.nodes, before.nodes);
  await history(page, "redo");
  assert.deepEqual((await boundarySession(page)).projects[0].document.nodes, after.nodes);
  await selectField(page, axis).waitFor({ state: "visible" });
  assert.equal(await selectField(page, axis).inputValue(), mode);
}
export async function noEdit(page: Page, action: () => Promise<unknown>) {
  const before = await boundarySession(page);
  const inputs: string[] = [];
  const listener = (request: import("playwright").Request) => {
    if (request.url().endsWith("/api/commands")) inputs.push(request.postData() ?? "");
  };
  page.on("request", listener);
  try {
    await action();
    await settled(page);
    assert.deepEqual(await boundarySession(page), before);
    assert.deepEqual(inputs, []);
  } finally {
    page.off("request", listener);
  }
}

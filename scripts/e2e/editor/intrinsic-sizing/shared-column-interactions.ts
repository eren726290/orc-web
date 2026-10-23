import assert from "node:assert/strict";
import { interactionFixture, interaction } from "./shared-column-actions";
import { allocation } from "./shared-column-allocation";
import { sharedProperties } from "./shared-column-properties";
import { sharedMembership } from "./shared-column-membership";
import {
  fillReadout,
  native,
  node,
  select,
  session,
  settled,
  unchanged,
  type Suite,
} from "./support";

export async function sharedInteractions(suite: Suite) {
  await movement(suite);
  await reparent(suite);
  await sharedProperties(suite);
  await exits(suite);
  await sharedMembership(suite);
}
async function movement(suite: Suite) {
  await interactionFixture(suite);
  await select(suite.page, "peer");
  const result = await interaction(suite, "Opted-in keyboard Column reorder", () =>
    suite.page.getByRole("application", { name: "Canvas" }).press("ArrowUp"),
  );
  assert.deepEqual(result.after.nodes.root.children, ["leaf", "fit-a", "peer", "fit-b", "third"]);
  for (const id of result.before.nodes.root.children)
    assert.deepEqual(result.after.nodes[id], result.before.nodes[id]);
  await nativeOrder(suite, result.after.nodes.root.children);
  await select(suite.page, "third");
  await unchanged(suite, "Opted-in pointer slot preview cancels", async () => {
    await dragTo(suite, "third", "fit-a", false);
    await suite.page.keyboard.press("Escape");
    await suite.page.mouse.up();
  });
  const ordered = await interaction(suite, "Opted-in pointer Column reorder", async () => {
    await dragTo(suite, "third", "fit-a", false);
    await suite.page.mouse.up();
  });
  assert.deepEqual(ordered.after.nodes.root.children, ["leaf", "third", "fit-a", "peer", "fit-b"]);
  await nativeOrder(suite, ordered.after.nodes.root.children);
  await allocation(suite, ["leaf", "peer", "third"]);
}
async function reparent(suite: Suite) {
  await interactionFixture(suite);
  await select(suite.page, "third");
  await unchanged(suite, "Opted-in cross-parent preview cancels", async () => {
    await dragTo(suite, "third", "destination", true);
    await suite.page.keyboard.press("Escape");
    await suite.page.mouse.up();
  });
  const moved = await interaction(suite, "Fill leaves opted-in Column", async () => {
    await dragTo(suite, "third", "destination", true);
    await suite.page.mouse.up();
  });
  assert.equal(moved.after.nodes.third.parentId, "destination");
  assert.deepEqual(moved.after.nodes.destination.children, ["third"]);
  await allocation(suite, ["leaf", "peer"]);
  const returned = await interaction(suite, "Fill rejoins opted-in Column", async () => {
    await dragTo(suite, "third", "root", true);
    await suite.page.mouse.up();
  });
  assert.equal(returned.after.nodes.third.parentId, "root");
  assert.equal(returned.after.nodes.root.children[0], "third");
  await allocation(suite, ["leaf", "peer", "third"]);
}
async function dragTo(suite: Suite, id: string, target: string, frameTarget: boolean) {
  const before = (await session(suite.page)).projects[0].document;
  const start = await node(suite.page, id).boundingBox();
  const end = await node(suite.page, target).boundingBox();
  assert.ok(start && end);
  await suite.page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await suite.page.mouse.down();
  await settled(suite.page);
  const point = await dragPath(suite, id, start, end, frameTarget);
  await suite.page.mouse.move(point.x, point.y, { steps: 5 });
  await settled(suite.page);
  assert.deepEqual(
    (await session(suite.page)).projects[0].document,
    before,
    "Pointer preview publishes no revision",
  );
  await suite.page
    .locator(`.flex-drop-outline[data-orc-drop-parent="${frameTarget ? target : "root"}"]`)
    .waitFor({ state: "visible" });
  const marker = suite.page.locator(`.flex-drop-marker[data-orc-drop-object="${id}"]`);
  await marker.waitFor({ state: "visible" });
  assert.equal(await marker.evaluate((element) => getComputedStyle(element).pointerEvents), "none");
  await suite.page.screenshot({
    path: suite.artifact(`${suite.mode}-shared-drop-${id}-${target}.png`),
    fullPage: true,
  });
}
async function dragPath(
  suite: Suite,
  id: string,
  start: { x: number; y: number; width: number; height: number },
  end: { x: number; y: number; width: number; height: number },
  frameTarget: boolean,
) {
  const document = (await session(suite.page)).projects[0].document;
  const parent = document.nodes[id].parentId;
  assert.ok(parent);
  const source = await node(suite.page, parent).boundingBox();
  assert.ok(source);
  await suite.page.mouse.move(source.x + source.width - 4, start.y + start.height / 2);
  if (!frameTarget) return { x: source.x + source.width - 4, y: end.y + end.height * 0.2 };
  const y = Math.min(source.y, end.y) - 20;
  await suite.page.mouse.move(source.x + source.width - 4, y);
  await suite.page.mouse.move(end.x + 4, y);
  return { x: end.x + 4, y: end.y + 4 };
}

async function nativeOrder(suite: Suite, expected: string[]) {
  const order = await node(suite.page, "root")
    .locator(':scope > [data-orc-flow="intrinsic-column-v1"] > [data-orc-id]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("data-orc-id")));
  assert.deepEqual(order, expected, "Generated flow preserves canonical order");
  const boxes = await Promise.all(expected.map((id) => native(suite.page, id)));
  for (let index = 1; index < boxes.length; index++) assert.ok(boxes[index].y > boxes[index - 1].y);
}
async function exits(suite: Suite) {
  for (const target of ["Free", "Row"]) {
    await interactionFixture(suite);
    const before = (await session(suite.page)).projects[0].document;
    const boxes = await Promise.all(before.nodes.root.children.map((id) => native(suite.page, id)));
    await select(suite.page, "root");
    const result = await interaction(suite, `Opted-in Column to ${target}`, () =>
      suite.page.getByRole("button", { name: target, exact: true }).click(),
    );
    assert.equal(result.after.nodes.root.style["--orc-intrinsic-column"], undefined);
    assert.equal(await node(suite.page, "root").locator(":scope > [data-orc-flow]").count(), 0);
    assert.deepEqual(result.after.nodes.root.children, before.nodes.root.children);
    await exitedGeometry(suite, target, result, boxes);
  }
}

async function exitedGeometry(
  suite: Suite,
  target: string,
  result: Awaited<ReturnType<typeof interaction>>,
  boxes: Awaited<ReturnType<typeof native>>[],
) {
  if (target === "Free")
    for (const [index, id] of result.before.nodes.root.children.entries()) {
      const actual = await native(suite.page, id);
      for (const property of ["x", "y", "width", "height"] as const)
        assert.ok(
          Math.abs(actual[property] - boxes[index][property]) < 0.15,
          `${id}: Free preserves outer ${property}`,
        );
    }
  else {
    for (const id of ["leaf", "peer", "third"]) {
      await fillReadout(suite.page, id, "height");
      assert.equal(result.after.nodes[id].style["flex-grow"], "0");
      assert.equal(result.after.nodes[id].style["--orc-fill-basis"], undefined);
    }
    assert.equal(
      await node(suite.page, "root").evaluate((element) => getComputedStyle(element).flexDirection),
      "row",
    );
  }
}

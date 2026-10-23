import assert from "node:assert/strict";
import { interaction, interactionFixture } from "./shared-column-actions";
import { allocation } from "./shared-column-allocation";
import {
  accepted,
  choose,
  edit,
  native,
  node,
  select,
  session,
  unchanged,
  type Suite,
} from "./support";

export async function sharedProperties(suite: Suite) {
  await interactionFixture(suite);
  await select(suite.page, "root");
  await numeric(suite, "Gap", "18");
  await gapHandle(suite);
  await numeric(suite, "Vertical padding", "9");
  await select(suite.page, "leaf");
  await numeric(suite, "Vertical padding", "8");
  await select(suite.page, "root");
  await interaction(suite, "Opted-in packed cross-axis alignment", () =>
    suite.page.getByRole("button", { name: "Align top right", exact: true }).click(),
  );
  const parent = await native(suite.page, "root");
  const child = await native(suite.page, "leaf");
  assert.ok(
    Math.abs(child.x + child.width - parent.x - parent.width + 13) < 0.15,
    "Right alignment uses the outer parent's border/padding",
  );
  await distribution(suite);
}
async function numeric(suite: Suite, label: string, value: string) {
  const input = suite.page.getByLabel(label, { exact: true });
  await unchanged(suite, `Opted-in ${label} preview cancellation`, async () => {
    await input.fill(value);
    await allocation(suite, ["leaf", "peer", "third"]);
    await input.press("Escape");
  });
  await interaction(suite, `Opted-in ${label} Properties commit`, async () => {
    const before = await session(suite.page);
    await input.fill(value);
    assert.deepEqual(await session(suite.page), before);
    await allocation(suite, ["leaf", "peer", "third"]);
    await input.press("Enter");
  });
  await allocation(suite, ["leaf", "peer", "third"]);
}
async function gapHandle(suite: Suite) {
  const handle = suite.page.locator('.gap-handle[data-axis="y"] input').first();
  await handle.waitFor({ state: "visible" });
  await unchanged(suite, "Opted-in native Gap handle cancels", async () => {
    await dragHandle(suite);
    await suite.page.keyboard.press("Escape");
    await suite.page.mouse.up();
  });
  await interaction(suite, "Opted-in native Gap handle commits", async () => {
    await dragHandle(suite);
    await suite.page.mouse.up();
  });
  assert.equal(await suite.page.getByLabel("Gap", { exact: true }).inputValue(), "28");
  await allocation(suite, ["leaf", "peer", "third"]);
}
async function dragHandle(suite: Suite) {
  const handle = suite.page.locator('.gap-handle[data-axis="y"] input').first();
  const box = await handle.boundingBox();
  assert.ok(box);
  const before = await session(suite.page);
  await suite.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await suite.page.mouse.down();
  await suite.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 10, { steps: 5 });
  assert.deepEqual(await session(suite.page), before, "Handle preview submits no revision");
  await allocation(suite, ["leaf", "peer", "third"]);
}
async function distribution(suite: Suite) {
  await choose(suite, "root", "height", "Fixed", ["root", "leaf", "peer", "third"]);
  await edit(suite, "root", "height", 600);
  for (const id of ["leaf", "peer", "third"])
    await accepted(suite, { kind: "style", id, values: { "max-height": "50px" } });
  await interaction(suite, "Opted-in capped Space between", () =>
    suite.page.getByRole("button", { name: "Space between", exact: true }).click(),
  );
  const root = await native(suite.page, "root");
  const first = await native(suite.page, "leaf");
  const last = await native(suite.page, "third");
  assert.ok(
    Math.abs(first.y - root.y - 14) < 0.15,
    "First outer margin follows outer padding/border",
  );
  assert.ok(
    Math.abs(last.y + last.height - root.y - root.height + 11) < 0.15,
    "Last box reaches the outer content edge",
  );
  assert.equal(await suite.page.getByLabel("Gap", { exact: true }).inputValue(), "28");
  assert.equal(
    await node(suite.page, "root")
      .locator(":scope > [data-orc-flow]")
      .evaluate((element) => getComputedStyle(element).justifyContent),
    "space-between",
  );
  await interaction(suite, "Opted-in packed distribution exit", () =>
    suite.page.getByRole("button", { name: "Packed", exact: true }).click(),
  );
  await allocation(suite, ["leaf", "peer", "third"]);
}

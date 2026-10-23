import assert from "node:assert/strict";
import { interaction, interactionFixture } from "./shared-column-actions";
import { allocation } from "./shared-column-allocation";
import { choose, native, select, unchanged, type Suite } from "./support";

export async function sharedMembership(suite: Suite) {
  await interactionFixture(suite, true);
  await select(suite.page, "third");
  const before = await native(suite.page, "third");
  await interaction(suite, "Opted-in Fill becomes Absolute", () =>
    suite.page.getByRole("checkbox", { name: "Absolute Position", exact: true }).click(),
  );
  const after = await native(suite.page, "third");
  for (const key of ["x", "y", "width", "height"] as const)
    assert.ok(Math.abs(after[key] - before[key]) < 0.15, `Absolute preserves outer ${key}`);
  await allocation(suite, ["leaf", "peer"]);
  await interaction(suite, "Absolute child rejoins opted-in flow", () =>
    suite.page.getByRole("checkbox", { name: "Absolute Position", exact: true }).click(),
  );
  await choose(suite, "third", "height", "Fill", ["root", "leaf", "peer", "third"]);
  await allocation(suite, ["leaf", "peer", "third"]);
  await deletion(suite, "third", ["leaf", "peer"]);
  await deletion(suite, "peer", ["leaf"]);
  await select(suite.page, "supplier");
  await unchanged(suite, "Opted-in last independent supplier cannot be deleted", async () => {
    await suite.page.getByRole("application", { name: "Canvas" }).press("Delete");
    await suite.page
      .getByRole("alert")
      .filter({ hasText: "Set the parent's height first." })
      .waitFor();
  });
}
async function deletion(suite: Suite, id: string, remaining: string[]) {
  await select(suite.page, id);
  const result = await interaction(suite, `Opted-in ${id} deletion rebases survivors`, () =>
    suite.page.getByRole("application", { name: "Canvas" }).press("Delete"),
  );
  assert.equal(result.after.nodes[id], undefined);
  assert.deepEqual(result.after.nodes.root.children, remaining);
  assert.deepEqual(result.after.nodes.supplier, result.before.nodes.supplier);
  await allocation(suite, remaining);
}

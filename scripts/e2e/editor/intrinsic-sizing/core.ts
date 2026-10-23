import assert from "node:assert/strict";
import { fixture, type Fixture, type Relation, type Supply } from "./fixtures";
import {
  accepted,
  axes,
  choose,
  control,
  extent,
  fillReadout,
  install,
  native,
  refuse,
  select,
  type Suite,
} from "./support";

export async function core(suite: Suite) {
  for (const axis of axes)
    for (const relation of ["main", "cross"] satisfies Relation[]) {
      for (const supply of ["descendant", "sibling", "text"] satisfies Supply[])
        await entry(suite, { axis, relation, supply });
      await parentFit(suite, { axis, relation, supply: "descendant" });
      await circular(suite, { axis, relation, supply: "none" });
      await sourceOwned(suite, { axis, relation, supply: "descendant" });
      await minimum(suite, { axis, relation, supply: "none" });
    }
  suite.checks.push(
    `${suite.mode}: intrinsic entry and parent Fit follow independent content on both axes; circular/source-owned controls refuse`,
  );
}
async function entry(suite: Suite, test: Fixture) {
  await install(suite, fixture(test));
  const supply = (await native(suite.page, "supplier"))[test.axis];
  await choose(suite, "leaf", test.axis, "Fill");
  await expectedSupply(suite, test, supply);
  await fillReadout(suite.page, "leaf", test.axis);
  await growSupplier(suite, test);
  const grown = (await native(suite.page, "supplier"))[test.axis];
  assert.ok(grown > supply, "Independent content actually grows");
  await expectedSupply(suite, test, grown);
  suite.inputs.push({ trigger: "Independent intrinsic Fill entry", test, supply, grown });
}
async function expectedSupply(suite: Suite, test: Fixture, supply: number) {
  const siblingMain = test.supply === "sibling" && test.relation === "main";
  await extent(suite.page, "root", test.axis, supply + (siblingMain ? 8 : 0));
  await extent(suite.page, "leaf", test.axis, siblingMain ? 0 : supply);
}
async function growSupplier(suite: Suite, test: Fixture) {
  if (test.supply === "text") {
    const text =
      test.axis === "width" ? "Independent content grows wider" : "Independent\ncontent\ngrows";
    await accepted(suite, { kind: "text", id: "supplier", runs: [{ text, style: {} }] });
  } else await accepted(suite, { kind: "style", id: "supplier", values: { [test.axis]: "95px" } });
}
async function parentFit(suite: Suite, test: Fixture) {
  await install(suite, fixture({ ...test, bounded: true, filling: true }));
  await extent(suite.page, "leaf", test.axis, 300);
  const allowed = test.axis === "height" && test.relation === "main" ? ["root", "leaf"] : ["root"];
  const result = await choose(suite, "root", test.axis, "Fit", allowed);
  await extent(suite.page, "root", test.axis, 60);
  await extent(suite.page, "leaf", test.axis, 60);
  await fillReadout(suite.page, "leaf", test.axis);
  assert.deepEqual(result.after.nodes.supplier, result.before.nodes.supplier);
  suite.inputs.push({ trigger: "Legacy bounded Fill parent becomes Fit", test, result });
}
async function circular(suite: Suite, test: Fixture) {
  await install(suite, fixture(test));
  await select(suite.page, "leaf");
  assert.equal(
    await control(suite.page, test.axis)
      .getByRole("option", { name: "Fill", exact: true })
      .getAttribute("disabled"),
    "",
    "The selected current Fixed size cannot supply its own future Fill",
  );
  await refuse(suite, test.axis, "Fill");
  await install(suite, fixture({ ...test, bounded: true, filling: true }));
  await select(suite.page, "root");
  await refuse(suite, test.axis, "Fit", /parent.*(?:width|height)|(?:width|height).*parent/iu);
}
async function sourceOwned(suite: Suite, test: Fixture) {
  for (const owner of ["root", "leaf"]) {
    const nodes = fixture(test);
    const node = nodes.find((node) => node.id === owner);
    assert.ok(node);
    node.style[test.axis] = "var(--source-size, 80px)";
    await install(suite, nodes);
    await select(suite.page, "leaf");
    await refuse(suite, test.axis, "Fill");
  }
}
async function minimum(suite: Suite, test: Fixture) {
  const nodes = fixture(test);
  nodes[0].style[`min-${test.axis}`] = "90px";
  await install(suite, nodes);
  await choose(suite, "leaf", test.axis, "Fill");
  await extent(suite.page, "root", test.axis, 90);
  await extent(suite.page, "leaf", test.axis, 90);
  suite.inputs.push({ trigger: "Positive active minimum independently supplies Fill", test });
}

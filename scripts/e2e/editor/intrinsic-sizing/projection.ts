import assert from "node:assert/strict";
import { column, nested, withPeer } from "./fixtures";
import {
  accepted,
  choose,
  commands,
  edit,
  exactHistory,
  extent,
  fillReadout,
  install,
  isCommand,
  refuse,
  select,
  session,
  settled,
  type Suite,
} from "./support";

export async function projection(suite: Suite) {
  for (const box of ["border-box", "content-box"])
    for (const minimum of ["auto", "0px"])
      for (const bound of ["none", "minimum", "maximum"])
        await variation(suite, box, minimum, bound);
  await nestedConversion(suite);
  await lockedDependent(suite);
  await lockedUnmodified(suite);
  for (const cut of ["fixed", "equal"] as const) await independentCut(suite, cut);
  await boundedJoin(suite);
  await intrinsicSharing(suite);
  suite.checks.push(
    `${suite.mode}: sole Column Fill follows content/bounds/decoration; nested transitions are atomic; bounded joins preserve equal outer sharing`,
  );
}
async function variation(suite: Suite, box: string, minimum: string, bound: string) {
  const nodes = column();
  Object.assign(nodes[1].style, {
    "box-sizing": box,
    "min-height": minimum,
    padding: "10px",
    border: "2px solid black",
  });
  if (bound === "minimum") nodes[0].style["min-height"] = "150px";
  if (bound === "maximum") nodes[0].style["max-height"] = "40px";
  await install(suite, nodes);
  await choose(suite, "leaf", "height", "Fill");
  await limitedGeometry(suite, minimum, bound, 84);
  await accepted(suite, { kind: "style", id: "supplier", values: { height: "95px" } });
  await limitedGeometry(suite, minimum, bound, 119);
  await accepted(suite, {
    kind: "style",
    id: "root",
    values: {},
    unset: ["min-height", "max-height"],
  });
  await extent(suite.page, "leaf", "height", 119);
  await choose(suite, "root", "height", "Fixed");
  await edit(suite, "root", "height", 400);
  await extent(suite.page, "leaf", "height", 400);
  await edit(suite, "root", "height", 40);
  await extent(suite.page, "leaf", "height", minimum === "auto" ? 119 : 40);
  await choose(suite, "root", "height", "Fit");
  await extent(suite.page, "root", "height", 119);
  await extent(suite.page, "leaf", "height", 119);
  await fillReadout(suite.page, "leaf", "height");
  suite.inputs.push({ trigger: "Sole Column intrinsic projection", box, minimum, bound });
}
async function limitedGeometry(suite: Suite, minimum: string, bound: string, content: number) {
  const parent = bound === "minimum" ? 150 : bound === "maximum" ? 40 : content;
  const child = bound === "maximum" && minimum === "auto" ? content : parent;
  await extent(suite.page, "root", "height", parent);
  await extent(suite.page, "leaf", "height", child);
}
async function nestedConversion(suite: Suite) {
  await install(suite, nested());
  const result = await choose(suite, "root", "height", "Fit", ["root", "first", "middle"]);
  for (const id of ["root", "first", "middle"]) await extent(suite.page, id, "height", 60);
  assert.deepEqual(result.after.nodes.supplier, result.before.nodes.supplier);
  for (const id of ["first", "middle"]) {
    assert.equal(
      result.after.nodes[id].style.height,
      "auto",
      "Dependent conversion retains Fill intent",
    );
    assert.notDeepEqual(result.after.nodes[id].style, result.before.nodes[id].style);
    await fillReadout(suite.page, id, "height");
  }
  await accepted(suite, { kind: "style", id: "supplier", values: { height: "95px" } });
  for (const id of ["root", "first", "middle"]) await extent(suite.page, id, "height", 95);
}
async function lockedDependent(suite: Suite) {
  await install(suite, nested());
  await accepted(suite, { kind: "lock", id: "middle", locked: true });
  await select(suite.page, "root");
  await refuse(suite, "height", "Fit", /unlock/iu);
  await accepted(suite, { kind: "lock", id: "middle", locked: false });
  await choose(suite, "root", "height", "Fit", ["root", "first", "middle"]);
  await extent(suite.page, "root", "height", 60);
}
async function lockedUnmodified(suite: Suite) {
  const nodes = withPeer(column("descendant", true));
  Object.assign(nodes[1].style, {
    height: "auto",
    "flex-grow": "1",
    "flex-shrink": "0",
    "flex-basis": "0px",
  });
  await install(suite, nodes);
  await accepted(suite, { kind: "lock", id: "peer", locked: true });
  const result = await choose(suite, "root", "height", "Fit", ["root", "leaf"]);
  assert.deepEqual(
    result.after.nodes.peer,
    result.before.nodes.peer,
    "An unchanged locked Fixed peer must not block conversion",
  );
  await extent(suite.page, "root", "height", 108);
  await accepted(suite, { kind: "lock", id: "peer", locked: false });
}
async function independentCut(suite: Suite, cut: "fixed" | "equal") {
  await install(suite, nested(cut));
  await accepted(suite, { kind: "lock", id: "middle", locked: true });
  const result = await choose(suite, "root", "height", "Fit");
  assert.deepEqual(result.after.nodes.first, result.before.nodes.first);
  assert.deepEqual(result.after.nodes.middle, result.before.nodes.middle);
  await extent(suite.page, "root", "height", 90);
  await extent(suite.page, "middle", "height", 90);
  await accepted(suite, { kind: "lock", id: "middle", locked: false });
}
async function boundedJoin(suite: Suite) {
  const nodes = withPeer(column(), true);
  Object.assign(nodes[1].style, { padding: "10px", border: "2px solid black" });
  await install(suite, nodes);
  await choose(suite, "leaf", "height", "Fill");
  await choose(suite, "root", "height", "Fixed");
  await edit(suite, "root", "height", 400);
  await accepted(suite, { kind: "lock", id: "leaf", locked: true });
  await select(suite.page, "peer");
  await refuse(suite, "height", "Fill", /unlock/iu);
  await accepted(suite, { kind: "lock", id: "leaf", locked: false });
  await choose(suite, "peer", "height", "Fill", ["leaf", "peer"]);
  for (const id of ["leaf", "peer"]) await extent(suite.page, id, "height", 196);
  await accepted(suite, { kind: "lock", id: "leaf", locked: true });
  await edit(suite, "root", "height", 500);
  for (const id of ["leaf", "peer"]) await extent(suite.page, id, "height", 246);
  await accepted(suite, { kind: "lock", id: "leaf", locked: false });
  await cohortRemoval(suite);
}
async function cohortRemoval(suite: Suite) {
  await select(suite.page, "peer");
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    const pending = suite.page.waitForResponse(isCommand);
    await suite.page.getByRole("application", { name: "Canvas" }).press("Delete");
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    const after = (await session(suite.page)).projects[0].document;
    assert.equal(observed.requests.length, 1);
    assert.equal(after.nodes.peer, undefined);
    assert.deepEqual(after.nodes.root.children, ["leaf"]);
    assert.deepEqual(after.nodes.root.style, before.nodes.root.style);
    assert.deepEqual(after.nodes.supplier, before.nodes.supplier);
    await extent(suite.page, "leaf", "height", 500);
    await exactHistory(suite.page, before, after);
    await fillReadout(suite.page, "leaf", "height");
  } finally {
    observed.stop();
  }
  await choose(suite, "root", "height", "Fit", ["root", "leaf"]);
  await extent(suite.page, "root", "height", 84);
  await extent(suite.page, "leaf", "height", 84);
  await extent(suite.page, "supplier", "height", 60);
  const survivor = (await session(suite.page)).projects[0].document.nodes.leaf.style;
  assert.equal(survivor["flex-basis"], "auto");
  assert.equal(survivor["--orc-fill-basis"], undefined);
  assert.equal(survivor["--orc-fill-decoration"], undefined);
}
async function intrinsicSharing(suite: Suite) {
  await install(suite, withPeer(column()));
  await choose(suite, "leaf", "height", "Fill");
  await choose(suite, "peer", "height", "Fill", ["root", "leaf", "peer"]);
  await extent(suite.page, "root", "height", 68);
  for (const id of ["leaf", "peer"]) await extent(suite.page, id, "height", 30);
  await choose(suite, "root", "height", "Fixed");
  await edit(suite, "root", "height", 400);
  for (const id of ["leaf", "peer"]) await extent(suite.page, id, "height", 196);
  await choose(suite, "root", "height", "Fit");
  await extent(suite.page, "root", "height", 68);
  for (const id of ["leaf", "peer"]) await extent(suite.page, id, "height", 30);
}

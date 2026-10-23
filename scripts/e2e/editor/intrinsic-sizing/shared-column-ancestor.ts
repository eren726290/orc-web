import assert from "node:assert/strict";
import { column, frame, layout, withPeer } from "./fixtures";
import { allocation } from "./shared-column-allocation";
import { choose, extent, install, native, session, type Suite } from "./support";

type AncestorCase = { align: string; margin: string; value: string };
export async function ancestorSupply(suite: Suite) {
  const cases = [
    { align: "flex-start", margin: "", value: "" },
    { align: "stretch", margin: "", value: "" },
    ...["margin-top", "margin-bottom", "margin-block-start", "margin-block-end"].map((margin) => ({
      align: "stretch",
      margin,
      value: "auto",
    })),
    { align: "stretch", margin: "margin-top", value: "var(--edge, auto)" },
  ];
  for (const test of cases) await ancestorCase(suite, test);
}
async function ancestorCase(suite: Suite, test: AncestorCase) {
  await install(suite, ancestorFixture(test));
  await choose(suite, "leaf", "height", "Fill", ["root", "leaf"]);
  const before = await native(suite.page, "root");
  await choose(suite, "peer", "height", "Fill", ["root", "leaf", "peer"]);
  const after = await native(suite.page, "root");
  const document = (await session(suite.page)).projects[0].document;
  assert.equal(document.nodes.root.parentId, "stage");
  if (test.align === "stretch" && !test.margin) {
    assert.equal(
      document.nodes.root.style["--orc-intrinsic-column"],
      undefined,
      "Actual bounded cross Fill needs no wrapper activation",
    );
    await extent(suite.page, "root", "height", 400);
  } else {
    assert.equal(
      document.nodes.root.style["--orc-intrinsic-column"],
      "1",
      "Non-stretch or automatic cross margin cannot supply intrinsic Column height",
    );
    assert.ok(
      Math.abs(after.height - before.height) < 0.15,
      "Joining Fill preserves independent intrinsic content budget instead of taking ancestor height",
    );
  }
  await allocation(suite, ["leaf", "peer"]);
  suite.inputs.push({
    trigger: "Ancestor actual alignment and margins control intrinsic Column supply",
    test,
    before,
    after,
  });
}
function ancestorFixture(test: AncestorCase) {
  const nodes = withPeer(column());
  nodes[0].parentId = "stage";
  Object.assign(nodes[0].style, {
    position: "relative",
    height: "auto",
    left: "auto",
    top: "auto",
  });
  if (test.margin) nodes[0].style[test.margin] = test.value;
  const peer = nodes.find((item) => item.id === "peer");
  assert.ok(peer);
  peer.children.push("peer-supply");
  nodes.push(frame("peer-supply", "peer", [], { ...layout, width: "20px", height: "40px" }));
  nodes.push(
    frame("stage", null, ["root"], {
      ...layout,
      position: "absolute",
      left: "80px",
      top: "80px",
      width: "500px",
      height: "400px",
      "align-items": test.align,
    }),
  );
  return nodes;
}

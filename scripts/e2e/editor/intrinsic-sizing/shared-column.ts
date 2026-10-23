import assert from "node:assert/strict";
import { nextProject } from "./persistence";
import { frame, layout } from "./fixtures";
import { sharedFixture } from "./shared-column-fixtures";
import { enterShared, textChange } from "./shared-column-actions";
import { allocation } from "./shared-column-allocation";
import { ancestorSupply } from "./shared-column-ancestor";
import { sharedInteractions } from "./shared-column-interactions";
import { sharedSafeguards } from "./shared-column-guards";
import { sharedPersistence } from "./shared-column-source";
import {
  accepted,
  choose,
  edit,
  extent,
  install,
  native,
  node,
  select,
  session,
  type Suite,
} from "./support";

export async function sharedColumn(suite: Suite) {
  const project = (await session(suite.page)).projects[0];
  if (project.path) await nextProject(suite, project.document.name);
  await entry(suite);
  await conversion(suite);
  await bounds(suite);
  await ancestorSupply(suite);
  await nestedSupply(suite);
  await sharedSafeguards(suite);
  await sharedInteractions(suite);
  await sharedPersistence(suite);
  suite.checks.push(
    `${suite.mode}: shared intrinsic Column entry/conversion, constrained allocation, content response, nested supply, safeguards and responsive source persistence`,
  );
}
async function entry(suite: Suite) {
  await install(suite, sharedFixture(3, true));
  await enterShared(suite);
  await choose(suite, "third", "height", "Fill", ["root", "leaf", "peer", "third"]);
  const ids = ["leaf", "peer", "third"];
  await allocation(suite, ids);
  await textChange(suite, "fit-a", "Changing\nFit\nsibling\ncontent");
  await textChange(suite, "fit-b", "A\nsecond\nchanging\nFit\nsibling");
  await allocation(suite, ids);
  const before = await native(suite.page, "root");
  await textChange(
    suite,
    "supplier",
    "Independent\nFill\ncontent\nwith\nmore\nlines\nthan\nbefore",
  );
  assert.ok(
    (await native(suite.page, "root")).height > before.height,
    "Dominant independent content changes intrinsic height",
  );
  await allocation(suite, ids);
  const document = (await session(suite.page)).projects[0].document;
  assert.equal(document.nodes.root.style.display, "flex");
  assert.equal(
    await node(suite.page, "root").evaluate((element) => getComputedStyle(element).display),
    "grid",
  );
  const generated = node(suite.page, "root").locator(
    ':scope > [data-orc-flow="intrinsic-column-v1"]',
  );
  assert.equal(await generated.count(), 1);
  assert.equal(await generated.evaluate((element) => getComputedStyle(element).display), "flex");
  assert.equal(document.nodes.root.style["flex-direction"], "column");
  assert.deepEqual(document.nodes.root.children, ["leaf", "fit-a", "fit-b", "peer", "third"]);
  assert.equal(
    Object.keys(document.nodes).length,
    7,
    "Generated box creates no canonical node or Layer",
  );
}
async function conversion(suite: Suite) {
  const nodes = sharedFixture(3);
  nodes[0].style.height = "480px";
  await install(suite, nodes);
  const ids = ["leaf", "peer", "third"];
  await enterShared(suite, ids);
  await choose(suite, "root", "height", "Fit", ["root", ...ids]);
  const identity = await node(suite.page, "supplier").elementHandle();
  assert.ok(identity);
  await allocation(suite, ids);
  await textChange(suite, "supplier", "Independent\ncontent\nresponse");
  await allocation(suite, ids);
  await choose(suite, "root", "height", "Fixed", ["root", ...ids]);
  await edit(suite, "root", "height", 540);
  await allocation(suite, ids);
  await choose(suite, "root", "height", "Fit", ["root", ...ids]);
  await allocation(suite, ids);
  assert.equal(
    await identity.evaluate((element) => element.isConnected),
    true,
    "Stable opted-in Fit/Fixed changes preserve mounted child identity",
  );
  await identity.dispose();
}
async function bounds(suite: Suite) {
  await install(suite, sharedFixture(2, true));
  await enterShared(suite);
  for (const height of ["max-content", "100px", "480px"]) {
    await accepted(suite, {
      kind: "style",
      id: "root",
      values: { height, "min-height": "140px", "max-height": "420px" },
    });
    await accepted(suite, {
      kind: "style",
      id: "leaf",
      values: { "min-height": "0px", "max-height": "70px" },
    });
    await accepted(suite, {
      kind: "style",
      id: "peer",
      values: { "min-height": "80px", "max-height": "120px" },
    });
    const heightAfter = (await native(suite.page, "root")).height;
    assert.ok(
      heightAfter >= 140 && heightAfter <= 420,
      "Parent simultaneous limits constrain its outer height",
    );
    await allocation(suite, ["leaf", "peer"]);
    await textChange(suite, "fit-a", `Fit\nsibling\nchanges ${height}`);
    await allocation(suite, ["leaf", "peer"]);
  }
  await accepted(suite, {
    kind: "style",
    id: "root",
    values: { "min-height": "480px", "max-height": "200px" },
  });
  await extent(suite.page, "root", "height", 480);
  await allocation(suite, ["leaf", "peer"]);
}
async function nestedSupply(suite: Suite) {
  const nodes = sharedFixture();
  const supplier = nodes.find((item) => item.id === "supplier");
  assert.ok(supplier);
  supplier.parentId = "middle";
  nodes[1].children = ["middle"];
  nodes.push(
    frame("middle", "leaf", ["supplier"], {
      ...layout,
      "flex-direction": "column",
      width: "80px",
      height: "max-content",
    }),
  );
  await install(suite, nodes);
  await choose(suite, "middle", "height", "Fill");
  await choose(suite, "leaf", "height", "Fill", ["root", "leaf", "middle"]);
  await choose(suite, "peer", "height", "Fill", ["root", "leaf", "peer", "middle"]);
  await textChange(suite, "supplier", "Nested\nindependent\ncontent\nchanges");
  await allocation(suite, ["leaf", "peer"]);
  await select(suite.page, "root");
}

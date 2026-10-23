import assert from "node:assert/strict";
import { frame, layout } from "./fixtures";
import { sharedFixture } from "./shared-column-fixtures";
import { allocation } from "./shared-column-allocation";
import {
  choose,
  commands,
  exactHistory,
  fillReadout,
  isCommand,
  install,
  select,
  session,
  settled,
  type Suite,
} from "./support";

export async function enterShared(suite: Suite, ids = ["leaf", "peer"]) {
  for (const id of ids) await choose(suite, id, "height", "Fill", ["root", ...ids]);
  for (const id of ids) await fillReadout(suite.page, id, "height");
  await allocation(suite, ids);
}
export async function textChange(suite: Suite, id: string, value: string) {
  await select(suite.page, id);
  const input = suite.page.getByRole("textbox", { name: "Content", exact: true });
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    await input.fill(value);
    const pending = suite.page.waitForResponse(isCommand);
    await input.blur();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    assert.equal(observed.requests.length, 1, "One completed text edit submits one command");
    await exactHistory(suite.page, before, (await session(suite.page)).projects[0].document);
  } finally {
    observed.stop();
  }
}

export async function interaction(suite: Suite, label: string, action: () => Promise<unknown>) {
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    const [response] = await Promise.all([suite.page.waitForResponse(isCommand), action()]);
    assert.equal(response.status(), 200, await response.text());
    await settled(suite.page);
    const after = (await session(suite.page)).projects[0].document;
    assert.equal(observed.requests.length, 1, `${label}: one command`);
    assert.equal(after.revision, before.revision + 1);
    await exactHistory(suite.page, before, after);
    suite.inputs.push({ trigger: label, before, after, requests: observed.requests });
    return { before, after };
  } finally {
    observed.stop();
  }
}

export async function interactionFixture(suite: Suite, soleSupply = false) {
  const nodes = sharedFixture(3, !soleSupply);
  if (soleSupply) {
    nodes[0].children = nodes[0].children.filter((id) => !id.startsWith("fit-"));
    nodes.splice(0, nodes.length, ...nodes.filter((item) => !item.id.startsWith("fit-")));
  }
  nodes.push(
    frame("destination", null, [], {
      ...layout,
      position: "absolute",
      left: "420px",
      top: "80px",
      width: "180px",
      height: "200px",
      "flex-direction": "column",
    }),
  );
  await install(suite, nodes);
  await enterShared(suite, ["leaf", "peer", "third"]);
}

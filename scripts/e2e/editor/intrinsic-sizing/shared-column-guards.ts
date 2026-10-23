import assert from "node:assert/strict";
import { column, withPeer } from "./fixtures";
import { sharedFixture } from "./shared-column-fixtures";
import { enterShared } from "./shared-column-actions";
import { allocation } from "./shared-column-allocation";
import {
  accepted,
  choose,
  commands,
  control,
  exactHistory,
  field,
  install,
  isCommand,
  refuse,
  select,
  session,
  settled,
  unchanged,
  type Suite,
} from "./support";

export async function sharedSafeguards(suite: Suite) {
  await noSupply(suite);
  await sourceBoundaries(suite);
  await locks(suite);
  await cancellation(suite);
  await preview(suite);
  await draft(suite);
}
async function noSupply(suite: Suite) {
  await install(suite, withPeer(column("none")));
  await choose(suite, "leaf", "height", "Fill");
  await select(suite.page, "peer");
  await refuse(suite, "height", "Fill");
  const nodes = withPeer(column("none", true));
  await install(suite, nodes);
  await enterShared(suite);
  await select(suite.page, "root");
  await refuse(suite, "height", "Fit");
}
async function sourceBoundaries(suite: Suite) {
  for (const id of ["root", "peer"]) {
    const nodes = sharedFixture();
    Object.assign(nodes[1].style, {
      height: "auto",
      "flex-grow": "1",
      "flex-shrink": "1",
      "flex-basis": "auto",
    });
    const owner = nodes.find((item) => item.id === id);
    assert.ok(owner);
    owner.style.height = "var(--source-height, 180px)";
    await install(suite, nodes);
    await select(suite.page, "peer");
    await refuse(suite, "height", "Fill");
  }
}
async function locks(suite: Suite) {
  await install(suite, sharedFixture());
  await choose(suite, "leaf", "height", "Fill", ["root", "leaf"]);
  for (const id of ["root", "leaf", "peer"]) {
    await accepted(suite, { kind: "lock", id, locked: true });
    await select(suite.page, "peer");
    await refuse(suite, "height", "Fill", /unlock/iu);
    await accepted(suite, { kind: "lock", id, locked: false });
  }
  await choose(suite, "peer", "height", "Fill", ["root", "leaf", "peer"]);
  await accepted(suite, { kind: "lock", id: "fit-a", locked: true });
  await choose(suite, "root", "height", "Fixed", ["root", "leaf", "peer"]);
  await accepted(suite, { kind: "lock", id: "fit-a", locked: false });
}
async function cancellation(suite: Suite) {
  await install(suite, sharedFixture());
  await enterShared(suite);
  await select(suite.page, "root");
  await unchanged(
    suite,
    "Shared parent numeric preview cancels CSS and generated structure",
    async () => {
      await field(suite.page, "height").fill("440");
      await allocation(suite, ["leaf", "peer"]);
      await field(suite.page, "height").press("Escape");
    },
  );
}
async function preview(suite: Suite) {
  await select(suite.page, "root");
  const before = await session(suite.page);
  const requests = commands(suite.page);
  try {
    await suite.page.getByRole("button", { name: "Preview", exact: true }).click();
    await suite.page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
    await allocation(suite, ["leaf", "peer"], ".preview-world");
    await suite.page.getByRole("button", { name: "Exit Preview", exact: true }).click();
    await settled(suite.page);
    assert.deepEqual(await session(suite.page), before);
    assert.deepEqual(requests.requests, []);
  } finally {
    requests.stop();
  }
}
async function draft(suite: Suite) {
  await install(suite, sharedFixture());
  await choose(suite, "leaf", "height", "Fill", ["root", "leaf"]);
  await select(suite.page, "peer");
  await suite.page.getByRole("button", { name: "Code", exact: true }).click();
  const source = suite.page.getByRole("textbox", { name: "Object source", exact: true });
  const value = `${await source.innerText()}\n<!-- shared intrinsic draft -->`;
  await source.press("Control+a");
  await suite.page.keyboard.insertText(value);
  await suite.page.getByText("Unapplied changes", { exact: true }).waitFor();
  const dialog = suite.page.getByRole("dialog", {
    name: "Discard unapplied changes?",
    exact: true,
  });
  await unchanged(
    suite,
    "Cancel shared projection preserves selected peer Code draft",
    async () => {
      await control(suite.page, "height").selectOption("Fill");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    },
  );
  assert.equal(await source.innerText(), value);
  await control(suite.page, "height").selectOption("Fill");
  await discardCommit(suite);
  await suite.page.getByRole("button", { name: "Code", exact: true }).click();
}
async function discardCommit(suite: Suite) {
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    const pending = suite.page.waitForResponse(isCommand);
    await suite.page
      .getByRole("dialog", { name: "Discard unapplied changes?", exact: true })
      .getByRole("button", { name: "Discard", exact: true })
      .click();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    assert.equal(observed.requests.length, 1);
    await exactHistory(suite.page, before, (await session(suite.page)).projects[0].document);
    await allocation(suite, ["leaf", "peer"]);
  } finally {
    observed.stop();
  }
}

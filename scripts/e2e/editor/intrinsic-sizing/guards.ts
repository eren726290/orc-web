import assert from "node:assert/strict";
import { column, frame, layout } from "./fixtures";
import {
  accepted,
  choose,
  commands,
  control,
  exactHistory,
  extent,
  field,
  install,
  isCommand,
  native,
  node,
  sameDocument,
  select,
  session,
  settled,
  unchanged,
  type Suite,
} from "./support";

export async function guards(suite: Suite) {
  await numericCancellation(suite);
  await drafts(suite);
  await stale(suite);
  await rejection(suite);
  await pendingUndo(suite);
  await ownLock(suite);
  for (const entry of ["properties", "canvas"]) await textGuard(suite, entry);
  for (const removal of ["delete", "absolute"])
    for (const second of [false, true]) await contributor(suite, removal, second);
  suite.checks.push(
    `${suite.mode}: intrinsic sizing retains preview/draft/rejection/history safeguards and guards sole text/content suppliers`,
  );
}
async function numericCancellation(suite: Suite) {
  await install(suite, column());
  await choose(suite, "leaf", "height", "Fill");
  await select(suite.page, "root");
  await unchanged(suite, "Intrinsic parent numeric preview cancellation", async () => {
    await field(suite.page, "height").fill("200");
    await extent(suite.page, "leaf", "height", 200);
    await field(suite.page, "height").press("Escape");
  });
}
async function makeDraft(suite: Suite) {
  const page = suite.page;
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const value = `${await source.innerText()}\n<!-- intrinsic sizing draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(value);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  return value;
}
function draftDialog(suite: Suite) {
  return suite.page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
}
async function drafts(suite: Suite) {
  await install(suite, column());
  await select(suite.page, "leaf");
  const draft = await makeDraft(suite);
  await unchanged(suite, "Draft Cancel preserves intrinsic sizing and source", async () => {
    await control(suite.page, "height").selectOption("Fill");
    await draftDialog(suite).getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(
      await suite.page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
      draft,
    );
  });
  const before = (await session(suite.page)).projects[0].document;
  await control(suite.page, "height").selectOption("Fill");
  const observed = commands(suite.page);
  try {
    const pending = suite.page.waitForResponse(isCommand);
    await draftDialog(suite).getByRole("button", { name: "Discard", exact: true }).click();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    assert.equal(observed.requests.length, 1);
    await extent(suite.page, "leaf", "height", 60);
    await exactHistory(suite.page, before, (await session(suite.page)).projects[0].document);
  } finally {
    observed.stop();
  }
  await suite.page.getByRole("button", { name: "Code", exact: true }).click();
}
async function stale(suite: Suite) {
  await install(suite, column());
  await select(suite.page, "leaf");
  await makeDraft(suite);
  await control(suite.page, "height").selectOption("Fill");
  await draftDialog(suite).waitFor();
  await accepted(suite, { kind: "style", id: "root", values: { height: "150px" } });
  await unchanged(suite, "Stale intrinsic preparation preserves the newer revision", async () => {
    await draftDialog(suite).getByRole("button", { name: "Discard", exact: true }).click();
    await suite.page
      .getByRole("alert")
      .filter({ hasText: "The layout changed. Try again." })
      .waitFor();
  });
  await suite.page.getByRole("button", { name: "Code", exact: true }).click();
}
async function rejection(suite: Suite) {
  const page = suite.page;
  await install(suite, column());
  await select(page, "leaf");
  const before = await session(page);
  const box = await native(page, "leaf");
  await page.route("**/api/commands", (route) =>
    route.fulfill({ status: 409, json: { error: "Intrinsic sizing rejection control" } }),
  );
  try {
    await control(page, "height").selectOption("Fill");
    await page
      .getByRole("alert")
      .filter({ hasText: "Intrinsic sizing rejection control" })
      .waitFor();
    await settled(page);
    assert.deepEqual(await session(page), before);
    assert.deepEqual(await native(page, "leaf"), box);
    assert.equal(await control(page, "height").locator("option:checked").innerText(), "Fixed");
    assert.equal(await control(page, "height").isEnabled(), true);
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
  await page.getByRole("button", { name: "Dismiss error", exact: true }).click();
  await choose(suite, "leaf", "height", "Fill");
}
async function pendingUndo(suite: Suite) {
  await install(suite, column());
  await select(suite.page, "leaf");
  const before = (await session(suite.page)).projects[0].document;
  const acknowledgement = await holdAcknowledgement(suite);
  const observed = commands(suite.page);
  try {
    await control(suite.page, "height").selectOption("Fill");
    await acknowledgement.received;
    await suite.page.getByRole("application", { name: "Canvas" }).press("Control+z");
    acknowledgement.release();
    await suite.page.waitForFunction(
      async (revision) =>
        (await (await fetch("/api/session")).json()).projects[0].document.revision >= revision + 2,
      before.revision,
    );
    await settled(suite.page);
    sameDocument((await session(suite.page)).projects[0].document, before);
    assert.equal(observed.requests.length, 1);
    suite.inputs.push({
      trigger: "Intrinsic sizing pending Undo",
      before,
      requests: observed.requests,
    });
  } finally {
    acknowledgement.release();
    observed.stop();
    await suite.page.unrouteAll({ behavior: "wait" });
  }
}
async function holdAcknowledgement(suite: Suite) {
  let release = () => {};
  let ready = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const received = new Promise<void>((resolve) => {
    ready = resolve;
  });
  await suite.page.route("**/api/commands", async (route) => {
    const response = await route.fetch();
    ready();
    await held;
    await route.fulfill({ response });
  });
  return { received, release };
}
async function ownLock(suite: Suite) {
  await install(suite, column());
  await accepted(suite, { kind: "lock", id: "leaf", locked: true });
  await select(suite.page, "leaf");
  await unchanged(suite, "Locked intrinsic child remains inspectable", async () => {
    assert.equal(await control(suite.page, "height").isDisabled(), true);
  });
  await accepted(suite, { kind: "lock", id: "leaf", locked: false });
  await choose(suite, "leaf", "height", "Fill");
}
async function textGuard(suite: Suite, entry: string) {
  const page = suite.page;
  await install(suite, column("text"));
  await choose(suite, "leaf", "height", "Fill");
  await select(page, "supplier");
  if (entry === "canvas") await node(page, "supplier").dblclick();
  const input = page.getByRole("textbox", {
    name: entry === "canvas" ? "Edit canvas text" : "Content",
    exact: true,
  });
  await unchanged(
    suite,
    `${entry}: clearing the sole intrinsic Column text supplier refuses`,
    async () => {
      await input.fill("");
      await input.blur();
      await page.getByRole("alert").filter({ hasText: "Set the parent's height first." }).waitFor();
    },
  );
  const before = (await session(page)).projects[0].document;
  await input.fill("Recovered\ncontent");
  const pending = page.waitForResponse(isCommand);
  await input.blur();
  assert.equal((await pending).status(), 200);
  await settled(page);
  await extent(page, "root", "height", 40);
  await extent(page, "leaf", "height", 40);
  await exactHistory(page, before, (await session(page)).projects[0].document);
}
async function contributor(suite: Suite, removal: string, second: boolean) {
  const nodes = column();
  if (second) {
    nodes[1].children.push("second");
    nodes.push(frame("second", "leaf", [], { ...layout, width: "40px", height: "20px" }));
  }
  await install(suite, nodes);
  await choose(suite, "leaf", "height", "Fill");
  await select(suite.page, "supplier");
  if (removal === "absolute")
    assert.equal(
      await suite.page
        .getByRole("checkbox", { name: "Absolute Position", exact: true })
        .isEnabled(),
      true,
      "The positioned fixture must reach the dependency guard",
    );
  const action = () =>
    removal === "delete"
      ? suite.page.getByRole("application", { name: "Canvas" }).press("Delete")
      : suite.page.getByRole("checkbox", { name: "Absolute Position", exact: true }).click();
  if (!second)
    await unchanged(suite, `${removal}: sole intrinsic contributor refuses`, async () => {
      await action();
      await suite.page
        .getByRole("alert")
        .filter({ hasText: "Set the parent's height first." })
        .waitFor();
    });
  else {
    const before = (await session(suite.page)).projects[0].document;
    const pending = suite.page.waitForResponse(isCommand);
    await action();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    await extent(suite.page, "leaf", "height", 20);
    await exactHistory(suite.page, before, (await session(suite.page)).projects[0].document);
  }
}

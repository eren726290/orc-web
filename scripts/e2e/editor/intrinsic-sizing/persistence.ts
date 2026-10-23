import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator } from "playwright";
import { nodeSource } from "../../../../shared/source/html-source";
import { fixture } from "./fixtures";
import {
  accepted,
  axes,
  choose,
  extent,
  fillReadout,
  install,
  isCommand,
  select,
  session,
  settled,
  type Axis,
  type Suite,
} from "./support";

export async function persistence(suite: Suite) {
  for (const axis of axes) {
    await install(suite, fixture({ axis, relation: "main", supply: "descendant" }));
    await choose(suite, "leaf", axis, "Fill");
    await sourceRoundTrip(suite);
    await standalone(suite, axis);
    const saved = await saveReopen(suite, axis);
    await accepted(suite, { kind: "style", id: "supplier", values: { [axis]: "95px" } });
    await extent(suite.page, "root", axis, 95);
    await extent(suite.page, "leaf", axis, 95);
    suite.inputs.push({ trigger: "Reopened intrinsic source remains responsive", axis, saved });
    if (axis === "width") await nextProject(suite, saved.document.name);
  }
  suite.checks.push(
    `${suite.mode}: intrinsic source round-trip, standalone response and saved/reopened documents retain native sizing`,
  );
}
async function sourceRoundTrip(suite: Suite) {
  const page = suite.page;
  await select(page, "root");
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const before = await session(page);
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.press("Control+a");
  await page.keyboard.insertText(
    `${nodeSource(before.projects[0].document, "root")}\n<!-- intrinsic round trip -->`,
  );
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.deepEqual(
    await session(page),
    before,
    "Equivalent source does not change sizing, identities or history",
  );
  await page.getByRole("button", { name: "Code", exact: true }).click();
}
async function standalone(suite: Suite, axis: Axis) {
  const document = (await session(suite.page)).projects[0].document;
  const output = await suite.page.context().newPage();
  try {
    await output.setContent(nodeSource(document, "root"));
    const root = output.locator('[layer-name="root"]');
    const leaf = output.locator('[layer-name="leaf"]');
    const supplier = output.locator('[layer-name="supplier"]');
    for (const size of [60, 95]) {
      await standaloneDimension(supplier, axis, `${size}px`);
      assert.ok(
        Math.abs(
          (await leaf.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)) -
            size,
        ) < 0.1,
      );
    }
    await standaloneDimension(root, axis, "400px");
    assert.ok(
      Math.abs(
        (await leaf.evaluate((element, axis) => element.getBoundingClientRect()[axis], axis)) - 400,
      ) < 0.1,
    );
    suite.inputs.push({
      trigger: "Standalone intrinsic HTML source",
      axis,
      source: nodeSource(document, "root"),
      contentSizes: [60, 95],
      boundedSize: 400,
    });
  } finally {
    await output.close();
  }
}
async function standaloneDimension(target: Locator, axis: Axis, value: string) {
  await target.evaluate(
    (element, input) => {
      if (!(element instanceof HTMLElement)) throw new Error("Expected ordinary HTML source");
      element.style.setProperty(input.axis, input.value);
    },
    { axis, value },
  );
}
export async function saveReopen(suite: Suite, axis: Axis, suffix = "") {
  const page = suite.page;
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill(`Intrinsic ${suite.mode} ${axis}${suffix}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), suite.temporary));
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const saved = (await session(page)).projects[0];
  assert.ok(saved.path);
  assert.deepEqual(
    JSON.parse(await readFile(join(saved.path, "document.json"), "utf8")),
    saved.document,
  );
  await page.getByRole("button", { name: `Close ${saved.document.name}`, exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("textbox", { name: "Project folder", exact: true }).fill(saved.path);
  await page.getByRole("dialog").getByRole("button", { name: "Open project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await fillReadout(page, "leaf", axis);
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo || reopened.canRedo, false);
  await extent(page, "leaf", axis, 60);
  suite.inputs.push({ trigger: "Intrinsic UI save/reopen", axis, saved, reopened });
  return saved;
}
export async function nextProject(suite: Suite, name: string) {
  await suite.page.getByRole("button", { name: `Close ${name}`, exact: true }).click();
  const dialog = suite.page.getByRole("alertdialog");
  if (await dialog.count())
    await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  await suite.page.getByRole("button", { name: "New project", exact: true }).click();
  await suite.page.getByText("No layers yet", { exact: true }).waitFor();
}

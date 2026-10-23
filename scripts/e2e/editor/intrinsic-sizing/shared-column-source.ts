import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { nodeSource } from "../../../../shared/source/html-source";
import { sharedFixture } from "./shared-column-fixtures";
import { enterShared, textChange } from "./shared-column-actions";
import { allocation } from "./shared-column-allocation";
import {
  commands,
  install,
  isCommand,
  sameDocument,
  select,
  session,
  settled,
  type Suite,
} from "./support";

export async function sharedPersistence(suite: Suite) {
  await install(suite, sharedFixture());
  await enterShared(suite);
  await roundTrip(suite);
  await standalone(suite);
  await saveReopen(suite);
  await textChange(suite, "supplier", "Reopened\nindependent\ncontent\nresponse");
  await allocation(suite, ["leaf", "peer"]);
}
async function roundTrip(suite: Suite) {
  await select(suite.page, "root");
  await suite.page.getByRole("button", { name: "Code", exact: true }).click();
  const before = await session(suite.page);
  const html = nodeSource(before.projects[0].document, "root");
  assert.ok(html.includes('data-orc-layout="intrinsic-column-v1"'));
  assert.ok(html.includes('data-orc-flow="intrinsic-column-v1"'));
  const source = suite.page.getByRole("textbox", { name: "Object source", exact: true });
  assert.equal(
    (await source.innerText()).trim(),
    html.trim(),
    "Code copy contains the generated native source",
  );
  await source.press("Control+a");
  await suite.page.keyboard.insertText(`${html}\n<!-- equivalent generated source -->`);
  await suite.page.getByText("Unapplied changes", { exact: true }).waitFor();
  const observed = commands(suite.page);
  try {
    const pending = suite.page.waitForResponse(isCommand);
    await suite.page.getByRole("button", { name: "Apply", exact: true }).click();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    assert.deepEqual(
      await session(suite.page),
      before,
      "No-op generated Apply preserves IDs, hierarchy, revision and history",
    );
    assert.equal(observed.requests.length, 1);
  } finally {
    observed.stop();
  }
  suite.inputs.push({
    trigger: "Shared intrinsic Column equivalent source Apply",
    source: html,
    before,
  });
  await suite.page.getByRole("button", { name: "Code", exact: true }).click();
}
async function standalone(suite: Suite) {
  const document = (await session(suite.page)).projects[0].document;
  const html = nodeSource(document, "root");
  const page = await suite.page.context().newPage();
  try {
    for (const width of [320, 800]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(html);
      assert.equal(await page.locator("[layer-name]").count(), Object.keys(document.nodes).length);
      await standaloneState(page, 420, "Fit sibling", "Second Fit sibling", 178);
      await standaloneState(page, 420, "Fit\nsibling\nchanges\nagain", "Second\nFit\nsibling", 128);
      await standaloneState(page, 220, "Fit sibling", "Second Fit sibling", 78);
      await page.locator('[layer-name="root"]').evaluate((element) => {
        if (element instanceof HTMLElement) element.style.height = "max-content";
      });
      const before = await page
        .locator('[layer-name="root"]')
        .evaluate((element) => element.getBoundingClientRect().height);
      await page.locator('[layer-name="supplier"]').evaluate((element) => {
        element.textContent = "Source\ntext\nresponse\nwith\nmany\nlines\nof\nindependent\ncontent";
      });
      assert.ok(
        (await page
          .locator('[layer-name="root"]')
          .evaluate((element) => element.getBoundingClientRect().height)) > before,
      );
      const parsed = await page.content();
      await page.setContent(parsed);
      await standaloneState(page, 420, "Fit sibling", "Second Fit sibling", 178);
      suite.inputs.push({
        trigger: "Parsed script-free shared Column responsive HTML",
        width,
        source: html,
        parsed,
      });
    }
  } finally {
    await page.close();
  }
}
async function standaloneState(
  page: Suite["page"],
  height: number,
  first: string,
  second: string,
  expected: number,
) {
  await page.locator('[layer-name="root"]').evaluate((element, value) => {
    if (element instanceof HTMLElement) element.style.height = `${value}px`;
  }, height);
  await page.locator('[layer-name="fit-a"]').evaluate((element, value) => {
    element.textContent = value;
  }, first);
  await page.locator('[layer-name="fit-b"]').evaluate((element, value) => {
    element.textContent = value;
  }, second);
  for (const id of ["leaf", "peer"]) {
    const actual = await page
      .locator(`[layer-name="${id}"]`)
      .evaluate((element) => element.getBoundingClientRect().height);
    assert.ok(
      Math.abs(actual - expected) < 0.15,
      `${id}: standalone constrained equal share ${expected}, got ${actual}`,
    );
  }
}
async function saveReopen(suite: Suite) {
  const page = suite.page;
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Project name", exact: true })
    .fill(`Shared Column ${suite.mode}`);
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
  await settled(page);
  const reopened = (await session(page)).projects[0];
  sameDocument(reopened.document, saved.document);
  assert.equal(reopened.canUndo || reopened.canRedo, false);
  assert.equal(nodeSource(reopened.document, "root"), nodeSource(saved.document, "root"));
  await allocation(suite, ["leaf", "peer"]);
  suite.inputs.push({ trigger: "Shared Column UI save/reopen", saved, reopened });
}

import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import type { Page } from "playwright";
import { parseSession } from "../../../shared/session/session";
import type { DesignDocument, Styles } from "../../../shared/document/model";

export async function pendingPropertyHistory(page: Page) {
  let acknowledge = () => {};
  let received = () => {};
  const release = new Promise<void>((resolve) => {
    acknowledge = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route("**/api/commands", async (route) => {
    const response = await route.fetch();
    received();
    await release;
    await route.fulfill({ response });
  });
  try {
    await page.getByRole("textbox", { name: "Content", exact: true }).fill("Pending edit");
    await page.getByRole("application", { name: "Canvas" }).click();
    await Promise.race([
      ready,
      delay(5000).then(() => {
        throw new Error("The pending Properties command was not received.");
      }),
    ]);
    assert.equal(
      await page.getByRole("textbox", { name: "Content", exact: true }).isDisabled(),
      true,
    );
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    acknowledge();
    await page
      .getByRole("application", { name: "Canvas" })
      .getByText("My first design", { exact: true })
      .waitFor({ timeout: 5000 });
  } finally {
    acknowledge();
    await page.unrouteAll({ behavior: "wait" });
  }
}

export async function propertyPreview(page: Page) {
  const before = parseSession(await (await page.request.get("/api/session")).json());
  const project = before.projects[0];
  assert.ok(project);
  const id = project.document.workspaceRootIds[0];
  const layer = page.locator(`[data-orc-id="${id}"]`);
  const x = page.getByRole("spinbutton", { name: "X", exact: true });
  await x.fill("140");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).left), "140px");
  assert.deepEqual(
    parseSession(await (await page.request.get("/api/session")).json()).projects[0]?.document,
    project.document,
  );
  await x.press("Escape");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).left), "60px");
  assert.deepEqual(
    parseSession(await (await page.request.get("/api/session")).json()).projects[0]?.document,
    project.document,
  );
  await x.fill("145");
  await x.press("Enter");
  await page
    .getByRole("textbox", { name: "Object source" })
    .getByText(/left: 145px/u)
    .waitFor();
  const after = parseSession(await (await page.request.get("/api/session")).json());
  assert.equal(after.projects[0]?.document.revision, project.document.revision + 1);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page
    .getByRole("textbox", { name: "Object source" })
    .getByText(/left: 60px/u)
    .waitFor();
  await invalidProperty(page, id);
}

async function invalidProperty(page: Page, id: string) {
  const before = parseSession(await (await page.request.get("/api/session")).json());
  const opacity = page.getByRole("spinbutton", { name: "Opacity", exact: true });
  const layer = page.locator(`[data-orc-id="${id}"]`);
  await opacity.fill("0.5");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).opacity), "0.5");
  await opacity.fill("2");
  await page
    .getByRole("alert")
    .getByText("Enter a valid opacity.", { exact: true })
    .waitFor({ timeout: 5000 });
  assert.equal(await opacity.inputValue(), "2");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).opacity), "0.5");
  await opacity.press("Enter");
  assert.equal(await opacity.inputValue(), "2");
  assert.deepEqual(parseSession(await (await page.request.get("/api/session")).json()), before);
  await opacity.press("Escape");
  assert.equal(await opacity.inputValue(), "1");
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).opacity), "1");
}

export async function appearanceProperties(page: Page) {
  for (const priority of ["", " !important"]) {
    const before = await backgroundFixture(page, {
      "background-color": `red${priority}`,
      background: `linear-gradient(white, black) center / 20px 20px no-repeat #336699${priority}`,
    });
    const id = before.workspaceRootIds[0];
    const fill = page.getByRole("textbox", { name: "Fill", exact: true });
    assert.equal(
      await page
        .locator(`.canvas-world [data-orc-id="${id}"]`)
        .evaluate((element) => getComputedStyle(element).backgroundColor),
      "rgb(51, 102, 153)",
    );
    assert.equal(await fill.inputValue(), "rgb(51, 102, 153)");
    await backgroundPreview(page, id, before);
    await backgroundCommit(page, id, before, priority);
  }
  const before = await backgroundFixture(page, { background: "var(--missing, #abcdef)" });
  const fill = page.getByRole("textbox", { name: "Fill", exact: true });
  assert.equal(await fill.inputValue(), "Edit source");
  assert.ok(await fill.evaluate((element: HTMLInputElement) => element.readOnly));
  assert.deepEqual((await editorSession(page)).projects[0].document, before);
}

async function backgroundFixture(page: Page, values: Styles): Promise<DesignDocument> {
  const project = (await editorSession(page)).projects[0];
  const id = project.document.workspaceRootIds[0];
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: project.document.id,
      commandId: crypto.randomUUID(),
      expectedRevision: project.document.revision,
      mutation: {
        kind: "batch",
        mutations: [
          { kind: "style", id, values: {}, unset: ["background", "background-color"] },
          { kind: "style", id, values },
        ],
      },
    },
  });
  assert.equal(response.status(), 200, await response.text());
  await page.reload();
  await page.getByRole("button", { name: project.document.name, exact: true }).click();
  await page.locator(`.canvas-world [data-orc-id="${id}"]`).click();
  return (await editorSession(page)).projects[0].document;
}

async function backgroundPreview(page: Page, id: string, before: DesignDocument) {
  const layer = page.locator(`.canvas-world [data-orc-id="${id}"]`);
  const fill = page.getByRole("textbox", { name: "Fill", exact: true });
  const image = await layer.evaluate((element) => getComputedStyle(element).backgroundImage);
  assert.match(image, /^linear-gradient/u);
  assert.equal(
    await layer.evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(51, 102, 153)",
  );
  await fill.fill("#ffcc00");
  assert.equal(
    await layer.evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(255, 204, 0)",
  );
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).backgroundImage), image);
  assert.deepEqual((await editorSession(page)).projects[0].document, before);
  await fill.press("Escape");
  assert.equal(await fill.inputValue(), "rgb(51, 102, 153)");
  assert.equal(
    await layer.evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(51, 102, 153)",
  );
  assert.equal(await layer.evaluate((element) => getComputedStyle(element).backgroundImage), image);
  assert.deepEqual((await editorSession(page)).projects[0].document, before);
}

async function backgroundCommit(page: Page, id: string, before: DesignDocument, priority: string) {
  const fill = page.getByRole("textbox", { name: "Fill", exact: true });
  await fill.fill("#ffcc00");
  const pending = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/commands" &&
      response.request().method() === "POST",
  );
  await fill.press("Enter");
  assert.equal((await pending).status(), 200);
  const after = (await editorSession(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(after.nodes[id].style["background-color"], `#ffcc00${priority}`);
  assert.equal(after.nodes[id].style.background, before.nodes[id].style.background);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page.waitForFunction((nodeId) => {
    const element = document.querySelector(`.canvas-world [data-orc-id="${nodeId}"]`);
    return element && getComputedStyle(element).backgroundColor === "rgb(51, 102, 153)";
  }, id);
  const undone = (await editorSession(page)).projects[0].document;
  assert.deepEqual({ ...undone, revision: 0 }, { ...before, revision: 0 });
  assert.equal(await fill.inputValue(), "rgb(51, 102, 153)");
}

async function editorSession(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

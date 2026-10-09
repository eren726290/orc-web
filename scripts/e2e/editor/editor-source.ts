import assert from "node:assert/strict";
import type { Page } from "playwright";
import { parseSession } from "../../../shared/session/session";
import { nodeSource } from "../../../shared/source/html-source";

const draft =
  '<p layer-name="Heading" style="position: absolute; left: 60px; top: 80px; color: #334455; margin: 0;">Draft &amp; value <strong>bold</strong></p>';

export async function sourceWorkflow(page: Page) {
  const before = await session(page);
  const project = before.projects[0];
  assert.ok(project);
  const id = project.document.workspaceRootIds[0];
  await page.getByRole("button", { name: "Code", exact: true }).click();
  assert.equal(
    await page.getByRole("textbox", { name: "Object source" }).innerText(),
    nodeSource(project.document, id),
  );
  await typeSource(page, draft);
  assert.deepEqual(await session(page), before, "Typing must not change applied state or history");
  await protectDraft(page);
  await protectEscape(page);
  await protectDashboard(page, project.document.name);
  await unrelatedHistory(page, id);
  const beforeApply = await session(page);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .getByText("Unapplied changes", { exact: true })
    .waitFor({ state: "hidden", timeout: 5000 });
  const applied = await session(page);
  const node = applied.projects[0]?.document.nodes[id];
  assert.ok(node?.kind === "text");
  assert.equal(node.runs.map((run) => run.text).join(""), "Draft & value bold");
  assert.equal(node.runs.at(-1)?.style["font-weight"], "700");
  const bounds = await page.locator(`.canvas-world [data-orc-id="${id}"]`).boundingBox();
  assert.ok(
    bounds && bounds.width > 90 && bounds.height < 30,
    "Loose auto-width text must use available canvas space",
  );
  assert.equal(
    applied.projects[0]?.document.revision,
    beforeApply.projects[0].document.revision + 1,
  );
  await page.locator(".layer-row.selected").getByText("Heading", { exact: true }).waitFor();
  await invalidSource(page);
  await sourceHistory(page, id);
  await changedOwner(page, id);
}

async function changedOwner(page: Page, id: string) {
  await typeSource(page, "<p>Keep this draft</p>");
  const before = await session(page);
  const project = before.projects[0];
  assert.ok(project);
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: project.document.id,
      expectedRevision: project.document.revision,
      commandId: crypto.randomUUID(),
      mutation: { kind: "rename", id, name: "Changed owner" },
    },
  });
  assert.equal(response.status(), 200);
  const changed = parseSession(await response.json());
  await page.locator(".code-heading strong").getByText("Changed owner", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .locator(".code-error")
    .getByText(/applied source changed/u)
    .waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: "Object source" }).innerText(),
    "<p>Keep this draft</p>",
  );
  const after = (await session(page)).projects[0];
  const expected = changed.projects[0];
  assert.deepEqual(
    [after.document, after.canUndo, after.canRedo],
    [expected.document, expected.canUndo, expected.canRedo],
    "Conflicting Apply must leave document and history intact",
  );
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Dismiss error", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page.locator(".code-heading strong").getByText("Heading", { exact: true }).waitFor();
}

async function protectDraft(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await cancelDraft(page);
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), draft);
  await page.getByRole("application", { name: "Canvas" }).click({ position: { x: 10, y: 10 } });
  await cancelDraft(page);
  assert.equal(await page.locator(".layer-row.selected").count(), 1);
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await cancelDraft(page);
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), draft);
}

async function cancelDraft(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}

async function protectEscape(page: Page) {
  await page.getByRole("application", { name: "Canvas" }).press("Escape");
  await cancelDraft(page);
  assert.equal(await page.locator(".layer-row.selected").count(), 1);
  const field = page.getByRole("spinbutton", { name: "X", exact: true });
  const before = await field.inputValue();
  await field.fill("120");
  await cancelDraft(page);
  assert.equal(await field.inputValue(), before);
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), draft);
}

async function protectDashboard(page: Page, name: string) {
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  let warned = false;
  page.once("dialog", async (dialog) => {
    warned = dialog.type() === "beforeunload";
    await dialog.dismiss();
  });
  await page.reload({ timeout: 5000 }).catch(() => null);
  assert.ok(warned, "Dashboard must retain the browser-close safeguard for project drafts");
  await page.getByRole("button", { name, exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), draft);
}

async function unrelatedHistory(page: Page, id: string) {
  const before = await session(page);
  const project = before.projects[0];
  assert.ok(project);
  const node = structuredClone(project.document.nodes[id]);
  assert.ok(node?.kind === "text");
  node.id = crypto.randomUUID();
  node.name = "Separate object";
  node.style = { ...node.style, left: "10px", top: "10px" };
  node.runs = [{ text: "Separate source", style: {} }];
  assert.equal(
    (
      await page.request.post("/api/commands", {
        data: {
          projectId: project.document.id,
          expectedRevision: project.document.revision,
          commandId: crypto.randomUUID(),
          mutation: { kind: "insert", nodes: [node] },
        },
      })
    ).status(),
    200,
  );
  const separate = page
    .getByRole("application", { name: "Canvas" })
    .getByText("Separate source", { exact: true });
  await separate.waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await separate.waitFor({ state: "hidden" });
  assert.equal(await page.getByRole("textbox", { name: "Object source" }).innerText(), draft);
  assert.equal(await page.getByRole("dialog").count(), 0);
}

async function invalidSource(page: Page) {
  const before = await session(page);
  await typeSource(page, "<p>unfinished");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .locator(".code-error")
    .getByText(/Missing closing tag/u)
    .waitFor();
  const after = await session(page);
  assert.deepEqual(after.projects[0]?.document, before.projects[0]?.document);
  assert.equal(after.projects[0]?.canUndo, before.projects[0]?.canUndo);
  assert.equal(
    await page.getByRole("textbox", { name: "Object source" }).innerText(),
    "<p>unfinished",
  );
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Dismiss error", exact: true }).click();
}

async function sourceHistory(page: Page, id: string) {
  await page.getByRole("application", { name: "Canvas" }).press("Control+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Retained after save failure", { exact: true })
    .waitFor();
  await page.getByRole("application", { name: "Canvas" }).press("Control+Shift+z");
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Draft & value", { exact: false })
    .waitFor();
  const current = await session(page);
  const project = current.projects[0];
  assert.ok(project?.document.nodes[id]);
  assert.equal(
    await page.getByRole("textbox", { name: "Object source" }).innerText(),
    nodeSource(project.document, id),
  );
}

async function typeSource(page: Page, source: string) {
  const editor = page.getByRole("textbox", { name: "Object source", exact: true });
  await editor.press("Control+a");
  await page.keyboard.insertText(source);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

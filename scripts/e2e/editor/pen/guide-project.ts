import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { Mutation } from "../../../../shared/commands/commands";
import { boundarySession } from "../boundary-support";

export async function guideDocument(page: Page) {
  const session = await boundarySession(page);
  const project = session.projects.find(
    (project) => project.document.id === session.activeProjectId,
  );
  assert.ok(project, "The guide fixture must have an active project.");
  return project.document;
}

export async function guideCommand(page: Page, mutation: Mutation) {
  const document = await guideDocument(page);
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: document.id,
      expectedRevision: document.revision,
      commandId: crypto.randomUUID(),
      mutation,
    },
  });
  assert.equal(response.status(), 200, await response.text());
  await page.waitForFunction(
    (revision) =>
      window.document.querySelector(".canvas")?.getAttribute("data-orc-revision") ===
      String(revision),
    document.revision + 1,
  );
}

import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { parseSession } from "../../../shared/session/session";

export async function boundarySession(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

export async function boundaryCommand(page: Page, mutation: Mutation) {
  const project = (await boundarySession(page)).projects[0];
  const response = await page.request.post("/api/commands", {
    data: {
      projectId: project.document.id,
      expectedRevision: project.document.revision,
      commandId: crypto.randomUUID(),
      mutation,
    },
  });
  assert.equal(response.status(), 200, await response.text());
  return parseSession(await response.json());
}

export async function boundarySeed(page: Page, nodes: DesignNode[]) {
  await boundaryCommand(page, { kind: "insert", nodes });
  await page.locator(`[data-orc-id="${nodes[0].id}"]`).waitFor();
}

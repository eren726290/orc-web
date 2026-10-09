import assert from "node:assert/strict";
import { chromium } from "playwright";
import { launchApp } from "../../support/app-process";
import { pendingPropertyHistory } from "./editor-properties";

const app = await launchApp("built");
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: app.url });
const page = await context.newPage();
await context.tracing.start({ screenshots: true, snapshots: true });
try {
  await page.goto(app.url);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).click();
  const text = page.getByRole("textbox", { name: "Edit canvas text" });
  await text.fill("My first design");
  await text.press("Escape");
  await page.getByRole("textbox", { name: "Content", exact: true }).waitFor();
  await pendingPropertyHistory(page);
  process.stdout.write("pending property history passed\n");
} finally {
  await context.tracing.stop({ path: "artifacts/editor/history-trace.zip" });
  await browser.close();
  assert.equal(await app.stop(), 0);
}

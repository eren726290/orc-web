import assert from "node:assert/strict";
import type { Page } from "playwright";
import { parseSession } from "../../../shared/session/session";
import { nodeSource } from "../../../shared/source/html-source";
import { boundarySeed, boundarySession } from "./boundary-support";

const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><style>html body .app-shell { background-color: rgb(255,0,255); } html body .canvas-world [data-orc-id="boundary-other"] { opacity: .25; } rect { fill: rgb(0,0,255); } @media (min-width: 1px) { #art { stroke: rgb(0,128,0); stroke-width: 4px; } }</style></defs><rect id="art" width="60" height="60" fill="red"/></svg>';

export async function svgBoundary(page: Page, folder: string, mode: string) {
  await svgFixture(page);
  const before = await appearance(page);
  await page.getByRole("button", { name: "Boundary SVG", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await apply(page, source);
  assert.deepEqual(
    await appearance(page),
    before,
    "SVG stylesheet cannot restyle the editor or other designs",
  );
  await artwork(page, "rgb(0, 0, 255)");
  const applied = (await boundarySession(page)).projects[0].document;
  assert.ok(
    nodeSource(applied, "boundary-svg").includes("html body .app-shell"),
    "Saved source retains authored selectors",
  );
  assert.ok(
    !nodeSource(applied, "boundary-svg").includes("@scope"),
    "Runtime scope is never canonical",
  );
  await svgHistory(page, before);
  await rejectedStyles(page);
  await svgReopen(page, folder, mode);
  assert.deepEqual(await appearance(page), before);
  await artwork(page, "rgb(0, 0, 255)");
}

async function rejectedStyles(page: Page) {
  for (const css of [
    "@font-face {font-family:system-ui;src:url(missing.woff2)}",
    "@keyframes external {from {opacity:0} to {opacity:1}}",
  ]) {
    const before = await boundarySession(page);
    const code = page.getByRole("textbox", { name: "Object source" });
    await code.press("Control+a");
    await page.keyboard.insertText(
      `<svg width="100" height="100"><style>${css}</style><rect width="60" height="60"/></svg>`,
    );
    const result = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/commands" &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    assert.equal(
      (await result).status(),
      400,
      "Uncontained global stylesheet definitions reject before commit",
    );
    await page.locator(".code-error").waitFor();
    assert.deepEqual(await boundarySession(page), before);
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await page.getByRole("button", { name: "Dismiss error", exact: true }).click();
  }
}

async function svgFixture(page: Page) {
  const base = { visible: true, locked: false, children: [], parentId: null, attributes: {} };
  await boundarySeed(page, [
    {
      ...base,
      id: "boundary-svg",
      name: "Boundary SVG",
      kind: "svg",
      source: '<svg width="100" height="100"><rect width="60" height="60" fill="red"/></svg>',
      style: { position: "absolute", left: "40px", top: "40px" },
      attributes: { width: "100", height: "100" },
    },
    {
      ...base,
      id: "boundary-other",
      name: "Boundary other",
      kind: "element",
      tag: "div",
      style: {
        position: "absolute",
        left: "200px",
        top: "40px",
        width: "100px",
        height: "100px",
        background: "green",
      },
    },
  ]);
}

async function appearance(page: Page) {
  return page.evaluate(() => {
    const shell = document.querySelector(".app-shell"),
      other = document.querySelector('[data-orc-id="boundary-other"]');
    if (!shell || !other) throw new Error("Missing unrelated design");
    return {
      editor: getComputedStyle(shell).backgroundColor,
      other: getComputedStyle(other).opacity,
    };
  });
}

async function artwork(page: Page, fill: string) {
  await page.waitForFunction((fill) => {
    const rect = document.querySelector('[data-orc-id="boundary-svg"] rect');
    return rect && getComputedStyle(rect).fill === fill;
  }, fill);
  if (fill === "rgb(0, 0, 255)")
    assert.equal(
      await page
        .locator('[data-orc-id="boundary-svg"] rect')
        .evaluate((node) => getComputedStyle(node).stroke),
      "rgb(0, 128, 0)",
    );
}

async function apply(page: Page, value: string) {
  const code = page.getByRole("textbox", { name: "Object source" });
  await code.press("Control+a");
  await page.keyboard.insertText(value);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
}

async function svgHistory(page: Page, before: Awaited<ReturnType<typeof appearance>>) {
  const canvas = page.getByRole("application", { name: "Canvas" });
  await canvas.press("Control+z");
  await artwork(page, "rgb(255, 0, 0)");
  assert.deepEqual(await appearance(page), before);
  await canvas.press("Control+Shift+z");
  await artwork(page, "rgb(0, 0, 255)");
  assert.deepEqual(await appearance(page), before);
}

async function svgReopen(page: Page, folder: string, mode: string) {
  const project = (await boundarySession(page)).projects[0];
  const response = await page.request.post("/api/projects/save", {
    data: { projectId: project.document.id, parent: folder, name: mode },
  });
  assert.equal(response.status(), 200);
  const saved = parseSession(await response.json()).projects[0];
  assert.equal(
    (
      await page.request.post("/api/projects/close", {
        data: { projectId: project.document.id, discard: false },
      })
    ).status(),
    200,
  );
  assert.equal(
    (await page.request.post("/api/projects/open", { data: { path: saved.path } })).status(),
    200,
  );
  assert.deepEqual((await boundarySession(page)).projects[0].document, saved.document);
  await page.reload();
  await page.getByRole("button", { name: mode, exact: true }).click();
  await page.locator('[data-orc-id="boundary-svg"]').waitFor();
}

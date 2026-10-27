import assert from "node:assert/strict";
import type { Page } from "playwright";
import { runPenBrowserSuite } from "./browser-suite";
import { nodeFixture } from "./fixtures";
import { documentFor, penFor, sameMapping, screenMatrix, waitRevision } from "./support";
import { exactHistory, install, type Suite } from "../intrinsic-sizing/support";
import { boundaryCommand } from "../boundary-support";
import { nodeSource } from "../../../../shared/source/html-source";
import { frame } from "../intrinsic-sizing/fixtures";
import { select } from "../intrinsic-sizing/support";
import { writeFile } from "node:fs/promises";

await runPenBrowserSuite("source", "PEN_SOURCE_PASSED", async (suite) => {
  await compatible(suite);
  await detach(suite);
  await serverSource(suite);
  await artwork(suite);
  await ancestor(suite);
  await plainSVG(suite);
});

async function ancestor(suite: Suite) {
  const page = suite.page;
  const pen = nodeFixture();
  pen.parentId = "ancestor";
  await install(suite, [
    frame("ancestor", null, [pen.id], {
      position: "absolute",
      left: "50px",
      top: "40px",
      width: "500px",
      height: "450px",
      background: "#ffffff",
    }),
    pen,
  ]);
  await select(page, "ancestor");
  if (!(await page.getByRole("textbox", { name: "Object source", exact: true }).isVisible()))
    await page.getByRole("button", { name: "Code", exact: true }).click();
  const before = await documentFor(page);
  await apply(page, nodeSource(before, "ancestor").replace("#ffffff", "#eeeeee"));
  const after = await waitRevision(page, before.revision + 1);
  assert.equal(after.nodes[pen.id], undefined);
  const svgs = Object.values(after.nodes).filter((node) => node.kind === "svg");
  assert.equal(svgs.length, 1);
  assert.ok(svgs[0].kind === "svg" && !svgs[0].pen);
  await page
    .locator(".workspace-notice")
    .filter({ hasText: /ancestor source also replaces descendant identities/u })
    .waitFor();
  await exactHistory(page, before, after);
  suite.checks.push(
    `${suite.mode}: meaningful ancestor Apply explains descendant replacement and leaves ordinary SVG; Undo restores all identities`,
  );
}

async function plainSVG(suite: Suite) {
  const node = nodeFixture();
  await install(suite, [node]);
  const before = await documentFor(suite.page);
  const source = nodeSource(before, node.id);
  assert.ok(!/geometryHash|pen-anchor|pen-guides|pen-solver|a1|s1|r1/u.test(source));
  await writeFile(suite.artifact(`${suite.mode}-standalone.svg`), source);
  const page = await suite.page.context().newPage();
  try {
    await page.setContent(source);
    const length = await page.locator("path").evaluate((path) => {
      if (!(path instanceof SVGPathElement)) throw new Error("Expected native SVG.");
      return path.getTotalLength();
    });
    assert.ok(Math.abs(length - (400 + 100 * Math.PI)) < 0.1);
  } finally {
    await page.close();
  }
  await boundaryCommand(suite.page, {
    kind: "source",
    id: node.id,
    source: source
      .replace('stroke="#18181b"', 'stroke="#2244ff"')
      .replace("<path", '<path opacity="0.8"'),
  });
  const ordinary = await waitRevision(suite.page, before.revision + 1);
  const imported = ordinary.nodes[node.id];
  assert.ok(imported.kind === "svg" && !imported.pen);
  suite.checks.push(
    `${suite.mode}: standalone SVG has independent native analytic geometry and no metadata or solver; ordinary source replacement does not adopt Pen data`,
  );
}

async function compatible(suite: Suite) {
  const page = suite.page;
  await install(suite, [nodeFixture()]);
  await selectPen(page);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const before = await documentFor(page);
  const original = await penFor(page);
  await apply(
    page,
    nodeSource(before, original.id).replace("M 0 0", "M +0.000,0e0").replace("<path", "\n <path"),
  );
  assert.deepEqual(
    await documentFor(page),
    before,
    "A geometry-equivalent numeric/whitespace rewrite created history.",
  );
  await apply(
    page,
    nodeSource(before, original.id)
      .replace('fill="none"', 'fill="#fed24a"')
      .replace('stroke="#18181b"', 'stroke="#246aff"'),
  );
  const painted = await waitRevision(page, before.revision + 1);
  assert.deepEqual((await penFor(page)).pen, original.pen);
  await exactHistory(page, before, painted);
  const matrix = await screenMatrix(page, original.id);
  await apply(
    page,
    nodeSource(painted, original.id).replace('stroke-width="2"', 'stroke-width="8"'),
  );
  const widened = await waitRevision(page, painted.revision + 3);
  assert.deepEqual((await penFor(page)).pen, original.pen);
  assert.deepEqual((await penFor(page)).attributes.viewBox, "-4 -4 208 208");
  sameMapping(matrix, await screenMatrix(page, original.id));
  await exactHistory(page, { ...painted, revision: widened.revision - 1 }, widened);
  suite.inputs.push({ trigger: "compatible source/paint and stroke reboxing", before, widened });
  suite.checks.push(
    `${suite.mode}: formatting-only no-op, fill/stroke rule retention, native stroke bounds and exact history`,
  );
}

async function artwork(suite: Suite) {
  const page = suite.page;
  await install(suite, [nodeFixture()]);
  await selectPen(page);
  const before = await documentFor(page);
  const record = (await penFor(page)).pen;
  const field = page.getByRole("spinbutton", { name: "Stroke width", exact: true });
  await field.fill("12");
  assert.deepEqual(await documentFor(page), before);
  await field.press("Escape");
  assert.deepEqual(await documentFor(page), before);
  const matrix = await screenMatrix(page, "pen-node");
  await field.fill("7");
  await field.press("Enter");
  const widened = await waitRevision(page, before.revision + 1);
  assert.deepEqual((await penFor(page)).pen, record);
  assert.equal((await penFor(page)).attributes["stroke-width"], "7");
  sameMapping(matrix, await screenMatrix(page, "pen-node"));
  await exactHistory(page, before, widened);
  const color = page.getByRole("textbox", { name: "Fill", exact: true });
  await color.fill("#fdbb43");
  await color.press("Enter");
  await waitRevision(page, widened.revision + 3);
  assert.deepEqual((await penFor(page)).pen, record);
  assert.equal((await penFor(page)).attributes.fill, "#fdbb43");
  suite.checks.push(
    `${suite.mode}: real artwork fields preview/cancel, preserve rules and rebox stroke bounds atomically`,
  );
}

async function detach(suite: Suite) {
  const page = suite.page;
  for (const change of [
    (source: string) => source.replace("M 0 0", "M 1 0"),
    (source: string) => source.replace("<path", '<path transform="translate(1)"'),
    (source: string) => source.replace("</svg>", '<circle r="5"/></svg>'),
    (source: string) => source.replace('viewBox="-1 -1 202 202"', 'viewBox="0 0 400 400"'),
    (source: string) => source.replace(/viewBox="[^"]*"/u, ""),
  ]) {
    await install(suite, [nodeFixture()]);
    await selectPen(page);
    const before = await documentFor(page);
    await apply(page, change(nodeSource(before, "pen-node")));
    const after = await waitRevision(page, before.revision + 1);
    const node = after.nodes["pen-node"];
    assert.ok(node.kind === "svg" && !node.pen);
    await page
      .locator(".workspace-notice")
      .filter({ hasText: /detached/u })
      .waitFor();
    assert.equal(await page.locator(".pen-anchor").count(), 0);
    await exactHistory(page, before, after);
  }
  suite.checks.push(
    `${suite.mode}: changed geometry, inner transform and additional artwork visibly detach with exact Undo/Redo`,
  );
}

async function serverSource(suite: Suite) {
  await install(suite, [nodeFixture()]);
  const page = suite.page;
  const before = await documentFor(page);
  await boundaryCommand(page, {
    kind: "source",
    id: "pen-node",
    source: nodeSource(before, "pen-node").replace('stroke-width="2"', 'stroke-width="6"'),
  });
  const after = await waitRevision(page, before.revision + 1);
  const node = after.nodes["pen-node"];
  assert.ok(node.kind === "svg" && node.pen);
  assert.deepEqual(node.pen, nodeFixture().pen);
  assert.equal(node.attributes.viewBox, "-3 -3 206 206");
  suite.checks.push(
    `${suite.mode}: direct Source command independently preserves compatible pen data and recomputes stroke bounds`,
  );
}

async function selectPen(page: Page) {
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
}

async function apply(page: Page, source: string) {
  const editor = page.getByRole("textbox", { name: "Object source", exact: true });
  await editor.press("Control+a");
  await page.keyboard.insertText(source);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page.getByText("Unapplied changes", { exact: true }).waitFor({ state: "hidden" });
}

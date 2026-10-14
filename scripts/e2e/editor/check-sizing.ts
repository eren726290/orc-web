import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page, type Request, type Response } from "playwright";
import {
  parseCommand,
  type AtomicMutation,
  type Mutation,
} from "../../../shared/commands/commands";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { nodeSource } from "../../../shared/source/html-source";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

type Axis = "width" | "height";
const wrappedIds = ["wrap-fill-1", "wrap-fill-2", "wrap-fill-3", "wrap-fill-4", "wrap-fill-5"];
const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chromium" || channel === "chrome");
const phase = process.env.ORC_SIZING_EVIDENCE ?? "verification";
const modes = process.env.ORC_SIZING_MODES ?? "development+built";
const scenario = process.env.ORC_SIZING_SCENARIO ?? "all";
assert.ok(scenario === "all" || scenario === "sharing" || scenario === "wrapped");
await mkdir("artifacts/editor", { recursive: true });
const temporary = await mkdtemp(join("artifacts/editor", "sizing-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const evidence = sourceEvidence();
const checks: string[] = [];
const inputs: unknown[] = [];
const requirements = [
  "Explicit Fixed preserves the chosen dimension under overflow; Fit follows supported normal-flow content.",
  "Fixed/Fit changes only the selected axis and understood main-axis Flex factors; cross-axis Fill changes only the selected axis and alignment in one command and Undo step.",
  "Bounded nowrap cross-axis Fill follows native parent resizing, decoration, margins and limits while numeric gestures remain read-only and explicit Fixed/Fit exits stay available.",
  "Single main-axis Fill uses auto/1/0/0px with real nonshrinking Fixed/Fit siblings, preserves native minima and rejects unresolved bounds and later unsupported conversions.",
  "Wrapped Row Fill uses a verified source-derived outer basis and shares available space per native line, preserving unequal decoration, limits, Fixed/Fit siblings and responsive saving.",
  "Text wrapping, wrapped frame lines, source ownership, Fill/Constraints readouts and placement conversions remain native.",
  "Locks, drafts, stale preparation, rejection and pending history preserve canonical state and restore controls.",
  "Numeric preview/cancellation, keyboard focus, minimum panel width, source round-trip and saving remain usable.",
];
let failure: string | null = null;
try {
  if (modes !== "built") await verifyMode("development");
  if (modes !== "development") await verifyMode("built");
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify({ ...evidence, after: sourceEvidence(), channel, browserVersion: browser.version(), modes, phase, scenario, command: `ORC_SIZING_EVIDENCE=${phase} ORC_SIZING_MODES=${modes} ORC_SIZING_SCENARIO=${scenario} bun scripts/e2e/editor/check-sizing.ts ${channel}`, requirements, checks, inputs, failure }, null, 2)}\n`,
  );
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write(
  scenario === "wrapped"
    ? "Wrapped Fill editor workflow passed\n"
    : "fixed and fit sizing workflow passed\n",
);

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("flushSync")) errors.push(message.text());
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    await newProject(page, app.url);
    if (scenario === "wrapped") await wrappedCheckpoint(page, mode);
    else if (scenario === "sharing") await sharingCheckpoint(page, mode);
    else await workflow(page, mode);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    const exit = await app.stop();
    inputs.push({ mode, exit, errors, appOutput: app.output });
    assert.equal(exit, 0);
    assert.ok(app.output.includes("ORC_SHUTDOWN_COMPLETE"));
    checks.push(`${mode}: owned application closed cleanly`);
  }
}

async function newProject(page: Page, url: string) {
  assert.equal((await page.goto(url))?.status(), 200);
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByText("No layers yet", { exact: true }).waitFor();
  await accepted(page, { kind: "insert", nodes: fixture() });
  await select(page, "item");
  for (const axis of ["width", "height"] as const)
    assert.equal(
      await control(page, axis).count(),
      1,
      `Ordinary Flex children expose ${axis} sizing`,
    );
}

function frame(
  id: string,
  parentId: string | null,
  children: string[],
  style: DesignNode["style"],
): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children,
    kind: "frame",
    clipContent: false,
    mode: "inherit",
    visible: true,
    locked: false,
    attributes: { title: `Retained ${id}` },
    style,
  };
}

function text(
  id: string,
  parentId: string | null,
  value: string,
  style: DesignNode["style"],
): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children: [],
    kind: "text",
    tag: "div",
    visible: true,
    locked: false,
    attributes: { title: `Retained ${id}` },
    runs: [{ text: value, style: {} }],
    style: { "font-size": "16px", "line-height": "20px", ...style },
  };
}

function fixture(): DesignNode[] {
  return [parentFrame(), ...flowFixture(), ...looseFixture(), ...sidebarFixture()];
}

function parentFrame() {
  return frame("row", null, ["item", "sibling", "absolute", "hidden"], {
    position: "absolute",
    left: "80px",
    top: "80px",
    display: "flex",
    width: "300px",
    height: "160px",
    gap: "10px",
    padding: "12px",
    border: "3px solid black",
    "box-sizing": "border-box",
    "align-items": "flex-start",
  });
}

function flowFixture(): DesignNode[] {
  return [
    frame("item", "row", ["label"], {
      display: "flex",
      width: "80px",
      height: "70px",
      flex: "0 0 auto",
      "align-items": "flex-start",
      "box-sizing": "border-box",
      background: "#dce7ef",
    }),
    text("label", "item", "Account menu", {
      width: "max-content",
      height: "auto",
      flex: "0 0 auto",
    }),
    frame("sibling", "row", [], { width: "60px", height: "30px", flex: "0 0 auto" }),
    frame("absolute", "row", [], {
      position: "absolute",
      left: "20px",
      top: "20px",
      width: "20px",
      height: "600px",
    }),
    {
      ...frame("hidden", "row", [], { width: "1000px", height: "1000px", flex: "0 0 auto" }),
      visible: false,
    },
  ];
}

function looseFixture(): DesignNode[] {
  return [
    text("text", null, "A narrow text box wraps these words onto several lines.", {
      position: "absolute",
      left: "500px",
      top: "80px",
      width: "max-content",
      height: "auto",
    }),
    frame("free", null, ["free-child"], {
      position: "absolute",
      left: "500px",
      top: "350px",
      width: "200px",
      height: "150px",
    }),
    frame("free-child", "free", [], {
      position: "absolute",
      left: "180px",
      top: "120px",
      width: "80px",
      height: "70px",
    }),
  ];
}

function sidebarFixture(): DesignNode[] {
  return [
    frame("sidebar", null, ["navigation", "account"], {
      position: "absolute",
      left: "360px",
      top: "300px",
      display: "flex",
      "flex-direction": "column",
      width: "340px",
      height: "400px",
      padding: "12px",
      gap: "16px",
      "justify-content": "space-between",
      "align-items": "flex-start",
      "box-sizing": "border-box",
      background: "#eef3f7",
    }),
    ...navigationFixture(),
    ...accountFixture(),
    ...identityFixture(),
  ];
}

function navigationFixture(): DesignNode[] {
  return [
    frame("navigation", "sidebar", ["brand", "nav-projects", "nav-settings"], {
      display: "flex",
      "flex-direction": "column",
      width: "max-content",
      height: "max-content",
      gap: "6px",
      "align-items": "flex-start",
      flex: "0 0 auto",
    }),
    ...[
      ["brand", "ORC"],
      ["nav-projects", "Projects"],
      ["nav-settings", "Settings"],
    ].map(([id, value]) =>
      text(id, "navigation", value, { width: "max-content", height: "auto", flex: "0 0 auto" }),
    ),
  ];
}

function accountFixture(): DesignNode[] {
  return [
    frame("account", "sidebar", ["user-info", "chevron"], {
      display: "flex",
      width: "300px",
      height: "max-content",
      padding: "8px",
      border: "1px solid black",
      "box-sizing": "border-box",
      gap: "16px",
      "justify-content": "space-between",
      "align-items": "center",
      flex: "0 0 auto",
    }),
    frame("user-info", "account", ["avatar", "identity"], {
      display: "flex",
      width: "max-content",
      height: "max-content",
      gap: "8px",
      "align-items": "center",
      flex: "0 0 auto",
    }),
    frame("avatar", "user-info", [], {
      width: "44px",
      height: "44px",
      flex: "0 0 auto",
      background: "#cad9e5",
    }),
    text("chevron", "account", "›", { width: "12px", height: "20px", flex: "0 0 auto" }),
  ];
}

function identityFixture(): DesignNode[] {
  return [
    frame("identity", "user-info", ["account-name", "account-email"], {
      display: "flex",
      "flex-direction": "column",
      width: "max-content",
      height: "max-content",
      gap: "2px",
      "align-items": "flex-start",
      flex: "0 0 auto",
    }),
    text("account-name", "identity", "Alex Morgan", {
      width: "max-content",
      height: "auto",
      flex: "0 0 auto",
    }),
    text("account-email", "identity", "alex@example.com", {
      width: "max-content",
      height: "auto",
      flex: "0 0 auto",
    }),
  ];
}

async function workflow(page: Page, mode: string) {
  await wrappedWorkflow(page);
  await accepted(page, { kind: "delete", ids: ["wrapped-fill"] });
  await mainFillWorkflow(page);
  await crossFillWorkflow(page);
  await inspection(page);
  await fixedOverflow(page);
  await decoratedCapture(page);
  await textWrapping(page);
  await frameContent(page);
  await composedLayouts(page, mode);
  await sourceBoundaries(page);
  await shorthandOrder(page);
  await sizingDependencies(page);
  await autoMarginOwnership(page);
  await numericPreview(page);
  await locks(page);
  await drafts(page);
  await staleDraft(page);
  await rejection(page);
  await pendingHistory(page);
  await conversions(page);
  await minimumPanel(page, mode);
  await saveReopen(page, mode);
}

async function wrappedCheckpoint(page: Page, mode: string) {
  await wrappedWorkflow(page);
  await wrappedSaving(page, mode);
}

async function wrappedWorkflow(page: Page) {
  await accepted(page, { kind: "insert", nodes: wrappedFixture() });
  await wrappedToggle(page, true);
  for (const id of wrappedIds) {
    await select(page, id);
    await fillAvailability(page, "width", true);
    await sharingChoice(page, id, "width", "Fill", wrappedIds);
  }
  await wrappedObserve(page, [
    [200, 200, 200],
    [305, 305],
  ]);
  await wrappedResizing(page);
  await wrappedPadding(page);
  await wrappedLimits(page);
  await wrappedParticipation(page);
  await wrappedLaterActions(page);
  await wrappedSource(page);
  await wrappedSourceLayouts(page);
  await wrappedToggle(page, false);
  for (const id of wrappedIds) close((await native(page, id)).width, 116);
  await wrappedToggle(page, true);
  await wrappedObserve(page, [
    [200, 200, 200],
    [305, 305],
  ]);
  checks.push("Wrapped Fill controls, row allocation, later edits and source remain native");
}

function wrappedFixture(): DesignNode[] {
  return [
    frame("wrapped-fill", null, wrappedIds, {
      position: "absolute",
      left: "60px",
      top: "360px",
      display: "flex",
      width: "644px",
      height: "auto",
      padding: "10px",
      border: "2px solid black",
      gap: "10px",
      "box-sizing": "border-box",
      "align-items": "flex-start",
      "align-content": "flex-start",
    }),
    ...wrappedIds.map((id, index) => {
      const decoration = [40, 6, 18, 0, 30][index];
      const border = Math.min(2, decoration / 2);
      const content = index % 2 === 1;
      return frame(id, "wrapped-fill", [], {
        position: "relative",
        display: "flex",
        width: `${content ? 80 - decoration : 80}px`,
        height: `${content ? 30 - 2 * border : 30}px`,
        border: `${border}px solid #345`,
        "padding-left": `${decoration / 2 - border}px`,
        "padding-right": `${decoration / 2 - border}px`,
        "box-sizing": content ? "content-box" : "border-box",
        "min-width": "0px",
        "flex-grow": "0",
        "flex-shrink": "0",
        "flex-basis": "auto",
        background: "#c5d7e4",
      });
    }),
  ];
}

async function wrappedSourceLayouts(page: Page) {
  const before = (await session(page)).projects[0].document;
  const variants: DesignNode["style"][] = [
    { display: "var(--layout)", "--layout": "flex" },
    { "flex-direction": "var(--direction)", "--direction": "row" },
    { "flex-wrap": "var(--wrapping)", "--wrapping": "wrap" },
    {
      "flex-wrap": "var(--orc-row-wrap)",
      "--orc-row-wrap": "var(--wrapping)",
      "--wrapping": "wrap",
    },
  ];
  for (const values of variants) {
    const nodes = wrappedFixture();
    nodes[0].style = { ...nodes[0].style, "flex-wrap": "wrap", ...values };
    await wrappedRestoreStyles(page, nodes);
    for (const id of wrappedIds.slice(0, 2)) {
      await select(page, id);
      await sharingChoice(page, id, "width", "Fill", wrappedIds);
      assert.equal(
        (await session(page)).projects[0].document.nodes[id].style["--orc-fill-basis"],
        "200px",
      );
    }
    await wrappedObserve(page, [[215, 215, 80, 80], [80]]);
    const after = (await session(page)).projects[0].document;
    assert.deepEqual(after.nodes["wrapped-fill"].style, nodes[0].style);
    await select(page, "wrapped-fill");
    await sourceRoundTrip(page, "wrapped-fill");
    inputs.push({ trigger: "Wrapped Fill source layout", values, after });
  }
  await wrappedRestoreStyles(
    page,
    ["wrapped-fill", ...wrappedIds].map((id) => before.nodes[id]),
  );
  checks.push("Source-variable parent layout preserves equal per-row Fill and source ownership");
}

async function wrappedRestoreStyles(page: Page, nodes: DesignNode[]) {
  const current = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "batch",
    mutations: nodes.flatMap((node): AtomicMutation[] => [
      { kind: "style", id: node.id, values: {}, unset: Object.keys(current.nodes[node.id].style) },
      { kind: "style", id: node.id, values: node.style },
    ]),
  });
}

async function wrappedToggle(page: Page, value: boolean, id = "wrapped-fill") {
  await select(page, id);
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("checkbox", { name: "Wrap to next line", exact: true }).setChecked(value);
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(
    await page.getByRole("checkbox", { name: "Wrap to next line", exact: true }).isChecked(),
    value,
  );
  inputs.push({
    trigger: "Wrapped Fill toggle",
    value,
    before,
    after,
    command: parseCommand(response.request().postDataJSON()),
  });
  await exactHistory(page, before, after);
}

async function wrappedObserve(
  page: Page,
  rows: number[][],
  gap = 10,
  ids = wrappedIds,
  fitHeight = true,
) {
  const boxes = await Promise.all(ids.map((id) => native(page, id)));
  const parent = await native(page, "wrapped-fill");
  let index = 0;
  for (const [row, widths] of rows.entries())
    for (const width of widths) {
      close(boxes[index].width, width);
      close(boxes[index].y - parent.y, 12 + row * (30 + gap));
      index++;
    }
  assert.equal(index, ids.length);
  if (fitHeight) close(parent.height, 24 + rows.length * 30 + (rows.length - 1) * gap);
  inputs.push({ trigger: "Wrapped Fill native rows", rows, gap, ids, boxes, parent });
}

async function wrappedResizing(page: Page) {
  const cases: [string, number[][]][] = [
    ["1224", [[232, 232, 232, 232, 232]]],
    ["854", [[200, 200, 200, 200], [830]]],
    ["434", [[200, 200], [200, 200], [410]]],
    ["234", [[210], [210], [210], [210], [210]]],
    [
      "644",
      [
        [200, 200, 200],
        [305, 305],
      ],
    ],
  ];
  await select(page, "wrapped-fill");
  for (const [value, rows] of cases) {
    await edit(page, "wrapped-fill", "width", value);
    await wrappedObserve(page, rows);
  }
  await wrappedProperty(page, "Gap", "20");
  await wrappedObserve(page, [[300, 300], [300, 300], [620]], 20);
  await wrappedProperty(page, "Gap", "10");
  await wrappedProperty(page, "Horizontal padding", "20");
  await wrappedObserve(page, [[295, 295], [295, 295], [600]]);
  await wrappedProperty(page, "Horizontal padding", "10");
  checks.push(
    "Parent resizing, Gap and Padding form native lines without changing Fill declarations",
  );
}

async function wrappedProperty(page: Page, label: string, value: string) {
  const before = (await session(page)).projects[0].document;
  const input = page.getByLabel(label, { exact: true });
  await input.fill(value);
  assertContent((await session(page)).projects[0].document, before);
  const pending = page.waitForResponse(isCommand);
  await input.press("Enter");
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  inputs.push({
    trigger: "Wrapped Fill property",
    label,
    value,
    before,
    after,
    command: parseCommand(response.request().postDataJSON()),
  });
  await exactHistory(page, before, after);
}

async function wrappedPadding(page: Page) {
  await select(page, wrappedIds[0]);
  const input = page.getByLabel("Horizontal padding", { exact: true });
  const before = (await session(page)).projects[0].document;
  await input.fill("80");
  await wrappedObserve(page, [[305, 305], [305, 305], [620]]);
  assertContent((await session(page)).projects[0].document, before);
  await input.press("Escape");
  await wrappedObserve(page, [
    [200, 200, 200],
    [305, 305],
  ]);
  await accepted(page, { kind: "lock", id: wrappedIds[1], locked: true });
  await noEdit(page, async () => {
    await input.fill("80");
    await input.press("Enter");
    await page.getByRole("alert").filter({ hasText: "Unlock the affected Fill objects" }).waitFor();
  });
  await accepted(page, { kind: "lock", id: wrappedIds[1], locked: false });
  await wrappedProperty(page, "Horizontal padding", "80");
  await wrappedObserve(page, [[305, 305], [305, 305], [620]]);
  assert.equal(
    (await session(page)).projects[0].document.nodes[wrappedIds[1]].style["--orc-fill-basis"],
    "264px",
  );
  await wrappedProperty(page, "Horizontal padding", "18");
  await wrappedObserve(page, [
    [200, 200, 200],
    [305, 305],
  ]);
  checks.push(
    "Child decoration changes preview and rebase every dependent row atomically; locks and Escape preserve applied state",
  );
}

async function wrappedLimits(page: Page) {
  await patch(page, wrappedIds[0], { "min-width": "250px" });
  await patch(page, wrappedIds[1], { "max-width": "80px" });
  await wrappedObserve(page, [
    [257, 86, 257],
    [305, 305],
  ]);
  await patch(page, wrappedIds[0], { "min-width": "0px" });
  await patch(page, wrappedIds[1], { "max-width": "none" });
  await select(page, "wrapped-fill");
  await edit(page, "wrapped-fill", "height", "50");
  for (const clipContent of [false, true]) {
    await accepted(page, { kind: "clip", id: "wrapped-fill", clipContent });
    await wrappedObserve(
      page,
      [
        [200, 200, 200],
        [305, 305],
      ],
      10,
      wrappedIds,
      false,
    );
    const parent = await native(page, "wrapped-fill");
    close(parent.height, 50);
    assert.equal(parent.overflow, clipContent ? "hidden" : "visible");
  }
  await accepted(page, { kind: "clip", id: "wrapped-fill", clipContent: false });
  await choose(page, "wrapped-fill", "height", "Fit");
  checks.push(
    "Per-row native min/max redistribution and Fixed-height clipping preserve sizing intent",
  );
}

async function wrappedParticipation(page: Page) {
  await select(page, wrappedIds[4]);
  const before = (await session(page)).projects[0].document;
  const box = await native(page, wrappedIds[4]);
  await participation(page, true);
  close((await native(page, wrappedIds[4])).width, box.width);
  await wrappedObserve(page, [[200, 200, 200], [620]], 10, wrappedIds.slice(0, 4));
  await exactHistory(page, before, (await session(page)).projects[0].document);
  await history(page, "undo");
  await sharingChoice(page, wrappedIds[4], "width", "Fixed", wrappedIds);
  await sharingChoice(page, wrappedIds[4], "width", "Fill", wrappedIds);
  await wrappedObserve(page, [
    [200, 200, 200],
    [305, 305],
  ]);
}

async function wrappedSource(page: Page) {
  await select(page, wrappedIds[0]);
  await sourceRoundTrip(page, wrappedIds[0]);
  await sharingSourceEdit(
    page,
    "--orc-fill-decoration: 40px;",
    "--orc-fill-decoration: 41px;",
    wrappedIds[0],
  );
  await noEdit(page, async () => {
    assert.equal(await control(page, "width").isDisabled(), true);
  });
  await history(page, "undo");
  const source = nodeSource((await session(page)).projects[0].document, "wrapped-fill");
  const output = await page.context().newPage();
  try {
    await output.setContent(source);
    const parent = output.locator('[layer-name="wrapped-fill"]');
    for (const [width, expected] of [
      [644, [200, 200, 200, 305, 305]],
      [434, [200, 200, 200, 200, 410]],
    ] as const) {
      await parent.evaluate((element, width) => {
        if (element instanceof HTMLElement) element.style.width = `${width}px`;
      }, width);
      const sizes = await parent.evaluate((element) =>
        Array.from(element.children).map((child) => child.getBoundingClientRect().width),
      );
      sizes.forEach((size, index) => close(size, expected[index]));
    }
  } finally {
    await output.close();
  }
  checks.push(
    "Wrapped Fill source round-trip preserves ownership and standalone HTML reflows at another parent width",
  );
}

async function wrappedLaterActions(page: Page) {
  await wrappedMixed(page);
  await wrappedDeletion(page);
  await wrappedDraft(page);
  await wrappedReparent(page);
}

async function wrappedMixed(page: Page) {
  await accepted(page, {
    kind: "insert",
    nodes: [
      frame("wrapped-fixed", "wrapped-fill", [], {
        width: "80px",
        height: "30px",
        flex: "0 0 auto",
      }),
      frame("wrapped-fit", "wrapped-fill", ["wrapped-fit-content"], {
        display: "flex",
        width: "max-content",
        height: "30px",
        flex: "0 0 auto",
      }),
      frame("wrapped-fit-content", "wrapped-fit", [], {
        width: "53px",
        height: "30px",
        flex: "0 0 auto",
      }),
    ],
  });
  await wrappedObserve(
    page,
    [
      [200, 200, 200],
      [228.5, 228.5, 80, 53],
    ],
    10,
    [...wrappedIds, "wrapped-fixed", "wrapped-fit"],
  );
  await accepted(page, { kind: "delete", ids: ["wrapped-fixed", "wrapped-fit"] });
  checks.push(
    "Mixed Fixed/Fit siblings preserve their widths while Fill shares only that row's remainder",
  );
}

async function wrappedDeletion(page: Page) {
  await select(page, wrappedIds[0]);
  await wrappedProperty(page, "Horizontal padding", "80");
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("application", { name: "Canvas" }).press("Delete");
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.nodes[wrappedIds[0]], undefined);
  for (const id of wrappedIds.slice(1))
    assert.equal(after.nodes[id].style["--orc-fill-basis"], "200px");
  await wrappedObserve(page, [[200, 200, 200], [620]], 10, wrappedIds.slice(1));
  inputs.push({
    trigger: "Wrapped Fill deletion",
    before,
    after,
    command: parseCommand(response.request().postDataJSON()),
  });
  await exactHistory(page, before, after);
  await history(page, "undo");
  await select(page, wrappedIds[0]);
  await wrappedProperty(page, "Horizontal padding", "18");
  checks.push(
    "Deleting the most decorated Fill child rebases surviving rows in the same command and Undo step",
  );
}

async function wrappedDraft(page: Page) {
  await select(page, "wrapped-fill");
  const draft = await makeDraft(page);
  await noEdit(page, async () => {
    await page.getByRole("checkbox", { name: "Wrap to next line", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Discard unapplied changes?", exact: true })
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    assert.equal(
      await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
      draft,
    );
  });
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Discard unapplied changes?", exact: true })
    .getByRole("button", { name: "Discard", exact: true })
    .click();
  await settled(page);
  checks.push(
    "Wrapping draft cancellation preserves the source draft, document, native layout and history",
  );
}

function wrappedIncomingFixture(): DesignNode[] {
  return [
    frame("incoming-parent", null, ["incoming-fill"], {
      position: "absolute",
      left: "60px",
      top: "550px",
      display: "flex",
      width: "244px",
      height: "54px",
      padding: "10px",
      border: "2px solid black",
      "box-sizing": "border-box",
      "align-items": "flex-start",
    }),
    frame("incoming-fill", "incoming-parent", [], {
      position: "relative",
      display: "flex",
      width: "auto",
      height: "30px",
      padding: "5px",
      border: "2px solid black",
      "box-sizing": "border-box",
      "min-width": "0px",
      flex: "1 0 0px",
    }),
  ];
}

async function wrappedReparent(page: Page) {
  await accepted(page, { kind: "insert", nodes: wrappedIncomingFixture() });
  await wrappedToggle(page, true, "incoming-parent");
  assert.equal(
    (await session(page)).projects[0].document.nodes["incoming-fill"].style["--orc-fill-basis"],
    "200px",
  );
  await select(page, "incoming-fill");
  const before = (await session(page)).projects[0].document;
  await noEdit(page, async () => {
    await wrappedPointerPreview(page);
    assertContent((await session(page)).projects[0].document, before);
    await page.keyboard.press("Escape");
    await page.mouse.up();
  });
  await wrappedPointerPreview(page);
  const pending = page.waitForResponse(isCommand);
  await page.mouse.up();
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.nodes["incoming-fill"].parentId, "wrapped-fill");
  assert.deepEqual(after.nodes["wrapped-fill"].children, [...wrappedIds, "incoming-fill"]);
  inputs.push({
    trigger: "Wrapped Fill reparent",
    before,
    after,
    command: parseCommand(response.request().postDataJSON()),
  });
  await exactHistory(page, before, after);
  await history(page, "undo");
  await accepted(page, { kind: "delete", ids: ["incoming-parent"] });
  checks.push(
    "Single-grow wrapping and wrapped pointer adoption preserve native preview, Escape and exact atomic history",
  );
}

async function wrappedPointerPreview(page: Page) {
  const source = await page.locator('.canvas-world [data-orc-id="incoming-fill"]').boundingBox();
  const target = await page.locator('.canvas-world [data-orc-id="wrapped-fill"]').boundingBox();
  assert.ok(source && target);
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x + source.width / 2 + 8, source.y + source.height / 2, {
    steps: 4,
  });
  await page.mouse.move(target.x - 20, source.y + source.height / 2, { steps: 6 });
  await page.mouse.move(target.x - 20, target.y + target.height - 5, { steps: 6 });
  await page.mouse.move(target.x + target.width - 5, target.y + target.height - 5, { steps: 10 });
  await page.locator(".flex-drop-marker").waitFor();
  await wrappedObserve(
    page,
    [
      [200, 200, 200],
      [200, 200, 200],
    ],
    10,
    [...wrappedIds, "incoming-fill"],
  );
}

async function wrappedSaving(page: Page, mode: string) {
  await select(page, "wrapped-fill");
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Wrapped ${mode}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), temporary));
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
  await select(page, wrappedIds[0]);
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo || reopened.canRedo, false);
  assert.equal(await modeLabel(page, "width"), "Fill");
  await wrappedObserve(page, [
    [200, 200, 200],
    [305, 305],
  ]);
  await select(page, "wrapped-fill");
  await edit(page, "wrapped-fill", "width", "434");
  await wrappedObserve(page, [[200, 200], [200, 200], [410]]);
  inputs.push({
    trigger: "Wrapped Fill persistence",
    mode,
    saved: saved.document,
    reopened: reopened.document,
  });
}

async function sharingCheckpoint(page: Page, mode: string) {
  await accepted(page, {
    kind: "insert",
    nodes: [text("main-fit-content", "absolute", "Fit", { width: "40px", height: "40px" })],
  });
  for (const direction of ["row", "column"] as const) await sharingWorkflow(page, direction);
  await accepted(page, { kind: "delete", ids: ["main-fit-content"] });
  await saveReopen(page, mode);
}

async function mainFillWorkflow(page: Page) {
  await accepted(page, {
    kind: "insert",
    nodes: [text("main-fit-content", "absolute", "Fit", { width: "40px", height: "40px" })],
  });
  try {
    for (const direction of ["row", "column"] as const) {
      const axis = direction === "row" ? "width" : "height";
      await sharingWorkflow(page, direction);
      await mainFillFixture(page, direction);
      await fillAvailability(page, axis, true);
      await choose(page, "item", axis, "Fill");
      await mainFillObservation(page, axis, 430);
      await crossFillInspection(page, axis);
      for (const extent of [700, 250, 180, 430]) {
        await patch(page, "row", { [axis]: `${extent}px` });
        await mainFillObservation(page, axis, extent);
      }
      await choose(page, "item", axis, "Fixed");
      close((await native(page, "item"))[axis], 228);
      await choose(page, "item", axis, "Fill");
      await choose(page, "item", axis, "Fit");
      close((await native(page, "item"))[axis], axis === "width" ? 40 : 30);
      inputs.push({ trigger: "Single main Fill with Fixed and intrinsic Fit siblings", direction });
      await mainFillBoundaries(page, direction);
      await mainFillLimits(page, direction);
      await mainFillDecoration(page, direction);
      await mainFillLaterChanges(page, direction);
    }
    await mainFillSafeguards(page);
  } finally {
    await accepted(page, { kind: "delete", ids: ["main-fit-content"] });
  }
  await reset(page);
  checks.push(
    "Main-axis Fill allocates the native remainder while Fixed/Fit siblings keep their main sizes; explicit exits and exact history work on both axes",
  );
}

async function sharingWorkflow(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  await mainFillFixture(page, direction);
  await accepted(page, {
    kind: "insert",
    nodes: [frame("sharing-fixed", "row", [], { width: "80px", height: "80px", flex: "0 0 auto" })],
  });
  try {
    await sharingDecoration(page, axis);
    await choose(page, "item", axis, "Fill");
    await select(page, "sibling");
    await fillAvailability(page, axis, true);
    await sharingChoice(page, "sibling", axis, "Fill");
    for (const extent of [430, 700, 250, 180, 430]) {
      await patch(page, "row", { [axis]: `${extent}px` });
      await sharingObservation(page, axis, extent);
    }
    await select(page, "sibling");
    await sharingChoice(page, "sibling", axis, "Fixed");
    await sharingChoice(page, "sibling", axis, "Fill");
    await select(page, "item");
    await sharingSourceOwnership(page, axis);
    await sharingMembership(page, axis);
    await sharingFreeConversion(page, axis);
    await sharingLimits(page, axis);
    await sharingPadding(page, axis);
    await sharingLaterChanges(page, axis);
  } finally {
    await accepted(page, { kind: "delete", ids: ["sharing-fixed"] });
  }
  checks.push(
    `${direction}: unequal outer Fill sharing, native resize and overflow, exits, padding, atomic history`,
  );
}

async function sharingDecoration(page: Page, axis: Axis) {
  const edges = axis === "width" ? ["left", "right"] : ["top", "bottom"];
  for (const [id, padding, border, box] of [
    ["item", "15px", "5px solid black", "border-box"],
    ["sibling", "2px", "1px solid black", "content-box"],
  ])
    await patch(page, id, {
      display: "flex",
      padding,
      border,
      "box-sizing": box,
      [`min-${axis}`]: "0px",
      [`margin-${edges[0]}`]: "0px",
      [`margin-${edges[1]}`]: "0px",
    });
  await select(page, "item");
}

async function sharingChoice(
  page: Page,
  id: string,
  axis: Axis,
  mode: "Fill" | "Fixed" | "Fit",
  members = ["item", "sibling"],
) {
  if (mode === "Fill") await fillAvailability(page, axis, true);
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await control(page, axis).selectOption(mode);
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.revision, before.revision + 1);
  assert.equal(await modeLabel(page, axis), mode);
  const command = parseCommand(response.request().postDataJSON());
  assert.equal(command.mutation.kind, "batch");
  const restored = structuredClone(after);
  for (const member of members) restored.nodes[member].style = before.nodes[member].style;
  assertContent(restored, before);
  inputs.push({ trigger: "Equal Fill sizing choice", id, axis, mode, before, after, command });
  await exactHistory(page, before, after);
}

async function sharingObservation(page: Page, axis: Axis, extent: number, decoration = 40) {
  const available = extent - 197;
  const equal = available / 2;
  const first = Math.max(decoration, Math.min(available - 6, equal));
  const second = Math.max(6, available - first);
  const boxes = await Promise.all(
    ["item", "sibling", "absolute", "sharing-fixed"].map((id) => native(page, id)),
  );
  close(boxes[0][axis], first);
  close(boxes[1][axis], second);
  close(boxes[2][axis], 53);
  close(boxes[3][axis], 80);
  inputs.push({
    trigger: "Equal outer Fill native allocation",
    axis,
    extent,
    decoration,
    expected: [first, second],
    boxes,
  });
}

async function sharingPadding(page: Page, axis: Axis) {
  const label = axis === "width" ? "Horizontal padding" : "Vertical padding";
  const input = page.getByLabel(label, { exact: true });
  const before = (await session(page)).projects[0].document;
  await input.fill("30");
  await sharingObservation(page, axis, 430, 70);
  assertContent((await session(page)).projects[0].document, before);
  await input.press("Escape");
  await sharingObservation(page, axis, 430);
  await input.fill("30");
  const pending = page.waitForResponse(isCommand);
  await input.press("Enter");
  assert.equal((await pending).status(), 200);
  await settled(page);
  await sharingObservation(page, axis, 430, 70);
  await exactHistory(page, before, (await session(page)).projects[0].document);
}

async function sharingSourceOwnership(page: Page, axis: Axis) {
  await select(page, "sibling");
  const before = (await session(page)).projects[0].document;
  await sharingSourceEdit(page, "--orc-fill-decoration: 6px;", "--orc-fill-decoration: 1px;");
  await noEdit(page, async () => {
    assert.equal(await control(page, axis).isDisabled(), true);
    assert.equal(await field(page, axis).getAttribute("readonly"), "");
  });
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await sharingSourceEdit(page, "--orc-fill-basis: 200px;", "--orc-fill-basis: 2e2px;");
  await accepted(page, { kind: "lock", id: "sibling", locked: true });
  await select(page, "item");
  await sharingPaddingValue(page, axis, "20", 50);
  assert.equal(
    (await session(page)).projects[0].document.nodes.sibling.style["--orc-fill-basis"],
    "2e2px",
  );
  await sharingPaddingValue(page, axis, "15", 40);
  await accepted(page, { kind: "lock", id: "sibling", locked: false });
  inputs.push({
    trigger:
      "Stale source factors relinquish ownership; equivalent local input preserves locked peer",
    axis,
  });
}

async function sharingSourceEdit(page: Page, from: string, to: string, id = "sibling") {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const document = (await session(page)).projects[0].document;
  const applied = nodeSource(document, id);
  const next = applied.replace(from, to);
  assert.notEqual(next, applied);
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.press("Control+a");
  await page.keyboard.insertText(next);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  await page.getByRole("button", { name: "Code", exact: true }).click();
}

async function sharingMembership(page: Page, axis: Axis) {
  await select(page, "absolute");
  await sharingChoice(page, "absolute", axis, "Fill", ["item", "sibling", "absolute"]);
  for (const id of ["item", "sibling", "absolute"]) close((await native(page, id))[axis], 286 / 3);
  const before = (await session(page)).projects[0].document;
  const box = await native(page, "absolute");
  await participation(page, true);
  close((await native(page, "absolute"))[axis], box[axis]);
  for (const id of ["item", "sibling"]) close((await native(page, id))[axis], 150);
  await exactHistory(page, before, (await session(page)).projects[0].document);
  await history(page, "undo");
  await sharingChoice(page, "absolute", axis, "Fit", ["item", "sibling", "absolute"]);
  await sharingObservation(page, axis, 430);
  await select(page, "item");
}

async function sharingFreeConversion(page: Page, axis: Axis) {
  const hidden = (await session(page)).projects[0].document.nodes.hidden;
  await accepted(page, { kind: "delete", ids: [hidden.id] });
  try {
    const before = (await session(page)).projects[0].document;
    const boxes = await Promise.all(["item", "sibling"].map((id) => native(page, id)));
    await select(page, "row");
    await layout(page, "Free");
    for (const [index, id] of ["item", "sibling"].entries()) {
      close((await native(page, id))[axis], boxes[index][axis]);
      assert.equal(
        (await session(page)).projects[0].document.nodes[id].style["--orc-fill-basis"],
        undefined,
      );
    }
    await history(page, "undo");
    assertContent((await session(page)).projects[0].document, before);
    await sharingObservation(page, axis, 430);
  } finally {
    await accepted(page, { kind: "insert", nodes: [hidden] });
  }
  await select(page, "item");
}

async function sharingLimits(page: Page, axis: Axis) {
  await patch(page, "item", { [`min-${axis}`]: "180px" });
  await patch(page, "sibling", { [`max-${axis}`]: "30px" });
  for (const extent of [430, 700]) {
    await patch(page, "row", { [axis]: `${extent}px` });
    close((await native(page, "item"))[axis], extent - 233);
    close((await native(page, "sibling"))[axis], 36);
  }
  await patch(page, "row", { [axis]: "430px" });
  await patch(page, "sibling", { [`max-${axis}`]: "none" });
  await patch(page, "item", { [`min-${axis}`]: "auto" });
  await patch(page, "label", { [axis]: "200px" });
  close((await native(page, "item"))[axis], 240);
  close((await native(page, "sibling"))[axis], 6);
  await accepted(page, { kind: "clip", id: "item", clipContent: true });
  await sharingObservation(page, axis, 430);
  await accepted(page, { kind: "clip", id: "item", clipContent: false });
  await patch(page, "label", { width: "40px", height: "30px" });
  await patch(page, "item", { [`min-${axis}`]: "0px" });
}

async function sharingLaterChanges(page: Page, axis: Axis) {
  const label = axis === "width" ? "Horizontal padding" : "Vertical padding";
  await accepted(page, { kind: "lock", id: "sibling", locked: true });
  await noEdit(page, async () => {
    await page.getByLabel(label, { exact: true }).fill("120");
    await page.getByLabel(label, { exact: true }).press("Enter");
    await page.getByRole("alert").filter({ hasText: "Unlock the affected Fill objects" }).waitFor();
  });
  await accepted(page, { kind: "lock", id: "sibling", locked: false });
  await sharingPaddingValue(page, axis, "120", 250);
  await sharingRemoval(page, axis);
  await sharingPaddingValue(page, axis, "5", 20);
  await select(page, "sibling");
  await sourceRoundTrip(page, "sibling");
  await fillAvailability(page, axis, true);
  await sharingObservation(page, axis, 430, 20);
}

async function sharingPaddingValue(page: Page, axis: Axis, value: string, decoration: number) {
  const input = page.getByLabel(axis === "width" ? "Horizontal padding" : "Vertical padding", {
    exact: true,
  });
  const before = (await session(page)).projects[0].document;
  await input.fill(value);
  await sharingObservation(page, axis, 430, decoration);
  const side = axis === "width" ? "padding-left" : "padding-top";
  const nativePadding = await page
    .locator('.canvas-world [data-orc-id="item"]')
    .evaluate((element, side) => getComputedStyle(element).getPropertyValue(side), side);
  close(Number.parseFloat(nativePadding), Number(value));
  const pending = page.waitForResponse(isCommand);
  await input.press("Enter");
  assert.equal((await pending).status(), 200);
  await settled(page);
  await sharingObservation(page, axis, 430, decoration);
  await exactHistory(page, before, (await session(page)).projects[0].document);
}

async function sharingRemoval(page: Page, axis: Axis) {
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("application", { name: "Canvas" }).press("Delete");
  const response = await pending;
  assert.equal(response.status(), 200);
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assert.equal(after.nodes.item, undefined);
  assert.equal(after.nodes.sibling.style["--orc-fill-basis"], "200px");
  close((await native(page, "sibling"))[axis], 243);
  inputs.push({
    trigger: "Fill member deletion rebases survivors atomically",
    axis,
    before,
    after,
    command: parseCommand(response.request().postDataJSON()),
  });
  await exactHistory(page, before, after);
  await history(page, "undo");
  await select(page, "item");
}

async function mainFillObservation(page: Page, axis: Axis, extent: number) {
  const boxes = {
    item: await native(page, "item"),
    fixed: await native(page, "sibling"),
    fit: await native(page, "absolute"),
  };
  const expected = Math.max(0, extent - 202);
  close(boxes.item[axis], expected);
  close(boxes.fixed[axis], 80);
  close(boxes.fit[axis], 53);
  const projection = await mainFillProjection(page, axis);
  inputs.push({
    trigger: "Main Fill allocation",
    axis,
    extent,
    expected,
    boxes,
    projection,
    document: (await session(page)).projects[0].document,
  });
}

async function mainFillProjection(page: Page, axis: Axis) {
  const projection = await page
    .locator('.canvas-world [data-orc-id="item"]')
    .evaluate((element, axis) => {
      const style = element.style;
      return {
        dimension: style.getPropertyValue(axis),
        grow: style.flexGrow,
        shrink: style.flexShrink,
        basis: style.flexBasis,
        priority: [axis, "flex-grow", "flex-shrink", "flex-basis"].map((key) =>
          style.getPropertyPriority(key),
        ),
      };
    }, axis);
  assert.deepEqual(projection, {
    dimension: "auto",
    grow: "1",
    shrink: "0",
    basis: "0px",
    priority: ["important", "important", "important", "important"],
  });
  return projection;
}

async function mainFillBoundaries(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  const edge = direction === "row" ? "margin-left" : "margin-top";
  const cases: [string, DesignNode["style"]][] = [
    ["row", { [axis]: "max-content" }],
    ["row", { [axis]: "var(--bound)", "--bound": "430px" }],
    ["row", { "flex-wrap": direction === "row" ? "wrap-reverse" : "wrap" }],
    ["sibling", { flex: "1 0 0px" }],
    ["sibling", { flex: "0 1 auto" }],
    ["absolute", { [axis]: "var(--fit)", "--fit": "53px" }],
    ["item", { [edge]: "var(--margin)", "--margin": "auto" }],
    ["sibling", { [edge]: "auto" }],
    ["item", { "aspect-ratio": "2" }],
    ["item", { [axis === "width" ? "inline-size" : "block-size"]: "80px" }],
  ];
  for (const [id, values] of cases) {
    await mainFillFixture(page, direction);
    await patch(page, id, values);
    const result = await noEdit(page, () => fillAvailability(page, axis, false));
    inputs.push({
      trigger: "Main Fill ownership boundary",
      direction,
      axis,
      id,
      values,
      available: false,
      ...result,
    });
  }
}

async function mainFillLimits(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  await mainFillFixture(page, direction);
  await patch(page, "row", {
    [`min-${axis}`]: "430px",
    [`max-${axis}`]: "430px",
  });
  await choose(page, "item", axis, "Fill");
  await select(page, "row");
  await choose(page, "row", axis, "Fit");
  await mainFillObservation(page, axis, 430);
  const equalBounds = {
    document: (await session(page)).projects[0].document,
    native: await native(page, "item"),
  };
  await patch(page, "item", { [`max-${axis}`]: "100px" });
  close((await native(page, "item"))[axis], 100);
  const capped = {
    document: (await session(page)).projects[0].document,
    native: await native(page, "item"),
  };
  await patch(page, "item", { [`min-${axis}`]: "300px" });
  close((await native(page, "item"))[axis], 300);
  inputs.push({
    trigger: "Main Fill equal bounds and explicit limits",
    direction,
    axis,
    equalBounds,
    capped,
    conflictingMin: {
      document: (await session(page)).projects[0].document,
      native: await native(page, "item"),
    },
  });
  await mainFillMinimum(page, direction);
}

async function mainFillMinimum(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  await mainFillFixture(page, direction);
  await accepted(page, { kind: "style", id: "item", values: {}, unset: [`min-${axis}`] });
  await patch(page, "label", { [axis]: "500px" });
  await choose(page, "item", axis, "Fill");
  const intrinsicDocument = (await session(page)).projects[0].document;
  const intrinsicNative = await native(page, "item");
  close(intrinsicNative[axis], 500);
  assert.equal(
    Object.hasOwn((await session(page)).projects[0].document.nodes.item.style, `min-${axis}`),
    false,
  );
  await page.getByText(/This object extends beyond its parent\./u).waitFor();
  const overflowVisible = await page
    .getByText(/This object extends beyond its parent\./u)
    .isVisible();
  await mainFillClipping(page, axis);
  await patch(page, "item", { [`min-${axis}`]: "0px" });
  const zeroNative = await native(page, "item");
  close(zeroNative[axis], 228);
  inputs.push({
    trigger: "Main Fill equal bounds, limits and retained automatic minimum",
    direction,
    axis,
    intrinsicDocument,
    intrinsicNative,
    overflowVisible,
    zeroDocument: (await session(page)).projects[0].document,
    zeroNative,
  });
}

async function mainFillClipping(page: Page, axis: Axis) {
  await select(page, "row");
  for (const clip of [true, false]) {
    const before = (await session(page)).projects[0].document;
    const childBefore = await native(page, "item");
    const pending = page.waitForResponse(isCommand);
    await page.getByLabel("Clip content", { exact: true }).click();
    assert.equal((await pending).status(), 200);
    await settled(page);
    assert.equal(await page.getByLabel("Clip content", { exact: true }).isChecked(), clip);
    const after = (await session(page)).projects[0].document;
    assert.deepEqual(after.nodes.item, before.nodes.item);
    const childAfter = await native(page, "item");
    close(childAfter[axis], childBefore[axis]);
    inputs.push({
      trigger: "Main Fill clipping preserves overflow size",
      axis,
      clip,
      before,
      after,
      childBefore,
      childAfter,
    });
  }
  await select(page, "item");
}

async function mainFillDecoration(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  const edges = direction === "row" ? ["left", "right"] : ["top", "bottom"];
  for (const box of ["border-box", "content-box"]) {
    await mainFillFixture(page, direction);
    await patch(page, "item", {
      "box-sizing": box,
      [`padding-${edges[0]}`]: "5px",
      [`padding-${edges[1]}`]: "13px",
      [`border-${edges[0]}`]: "2px solid black",
      [`border-${edges[1]}`]: "4px solid black",
    });
    await choose(page, "item", axis, "Fill");
    for (const extent of [430, 180, 700]) {
      await patch(page, "row", { [axis]: `${extent}px` });
      const measured = await native(page, "item");
      const expected = Math.max(24, extent - 202);
      close(measured[axis], expected);
      close((await native(page, "sibling"))[axis], 80);
      close((await native(page, "absolute"))[axis], 53);
      inputs.push({
        trigger: "Main Fill decoration and floor",
        direction,
        axis,
        box,
        extent,
        expected,
        measured,
        document: (await session(page)).projects[0].document,
      });
    }
    const before = await native(page, "item");
    await choose(page, "item", axis, "Fixed");
    close((await native(page, "item"))[axis], before[axis]);
  }
}

async function mainFillLaterChanges(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  await mainFillFixture(page, direction);
  await choose(page, "item", axis, "Fill");
  await mainFillParentGuards(page, direction);
  await patch(page, "row", { [axis]: "max-content" });
  await select(page, "item");
  await choose(page, "item", axis, "Fixed");
  await mainFillFixture(page, direction);
  await choose(page, "item", axis, "Fill");
  await patch(page, "sibling", { flex: "1 0 0px" });
  await choose(page, "item", axis, "Fit");
  await mainFillFixture(page, direction);
  await choose(page, "item", axis, "Fill");
  const before = (await session(page)).projects[0].document;
  const box = await native(page, "item");
  await participation(page, true);
  close((await native(page, "item"))[axis], box[axis]);
  await exactHistory(page, before, (await session(page)).projects[0].document);
  await patch(page, "row", { [axis]: "max-content" });
  await participation(page, false);
  assert.equal(await modeLabel(page, axis), "Fixed");
  inputs.push({
    trigger: "Main Fill later dependency, direction, wrap, exits and participation",
    direction,
  });
}

async function mainFillParentGuards(page: Page, direction: "row" | "column") {
  await select(page, "row");
  await rejectedMainFillAction(page, direction, "parent-fit");
  await rejectedMainFillAction(page, direction, "direction");
}

async function rejectedMainFillAction(
  page: Page,
  direction: "row" | "column",
  action: "parent-fit" | "direction",
) {
  const axis = direction === "row" ? "width" : "height";
  const text = {
    "parent-fit": "Use Code to change this content-dependent sizing.",
    direction: "Use Code to convert this source-controlled sizing between Flex axes.",
  }[action];
  const result = await noEdit(page, async () => {
    if (action === "parent-fit") await control(page, axis).selectOption({ label: "Fit" });
    else
      await page
        .getByRole("button", { name: direction === "row" ? "Column" : "Row", exact: true })
        .click();
    await page.getByRole("alert").filter({ hasText: text }).waitFor();
  });
  inputs.push({
    trigger: "Main Fill unsupported action",
    direction,
    axis,
    action,
    alert: text,
    ...result,
  });
}

async function mainFillSafeguards(page: Page) {
  await mainFillFixture(page, "row");
  await locks(page, true);
  await mainFillFixture(page, "row");
  await drafts(page, "Fill");
  await mainFillFixture(page, "row");
  await staleDraft(page, "Fill", true);
  await mainFillFixture(page, "row");
  await rejection(page, "Fill");
  await pendingHistory(page, "Fill");
}

async function mainFillFixture(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  const edges = direction === "row" ? ["left", "right"] : ["top", "bottom"];
  await reset(page);
  await patch(page, "row", {
    width: "430px",
    height: "430px",
    "flex-direction": direction,
    "flex-wrap": "nowrap",
  });
  await patch(page, "item", {
    [axis]: "80px !important",
    [`min-${axis}`]: "0px",
    flex: "0 0 auto !important",
    [`margin-${edges[0]}`]: "-3px",
    [`margin-${edges[1]}`]: "11px",
  });
  await patch(page, "label", { width: "40px", height: "30px" });
  await patch(page, "sibling", {
    [axis]: "80px",
    [`margin-${edges[0]}`]: "2px",
    [`margin-${edges[1]}`]: "5px",
  });
  await mainFitSibling(page, direction);
  await select(page, "item");
}

async function mainFitSibling(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "width" : "height";
  const edges = direction === "row" ? ["left", "right"] : ["top", "bottom"];
  await patch(page, "absolute", {
    position: "relative",
    left: "auto",
    top: "auto",
    display: "flex",
    "flex-direction": direction,
    width: "31px",
    height: "31px",
    [axis]: "max-content",
    flex: "0 0 auto",
    [`padding-${edges[0]}`]: "3px",
    [`padding-${edges[1]}`]: "7px",
    [`border-${edges[0]}`]: "1px solid black",
    [`border-${edges[1]}`]: "2px solid black",
    [`margin-${edges[0]}`]: "6px",
    [`margin-${edges[1]}`]: "-2px",
  });
}

async function crossFillWorkflow(page: Page) {
  for (const direction of ["row", "column"] as const) {
    const axis = direction === "row" ? "height" : "width";
    await crossFillFixture(page, direction);
    await fillAvailability(page, axis, true);
    await choose(page, "item", axis, "Fill");
    close((await native(page, "item"))[axis], axis === "height" ? 136 : 256);
    await crossFillInspection(page, axis);
    await patch(page, "row", { [axis]: axis === "height" ? "220px" : "340px" });
    close((await native(page, "item"))[axis], axis === "height" ? 176 : 296);
    await patch(page, "row", { "align-items": "flex-end" });
    close((await native(page, "item"))[axis], axis === "height" ? 176 : 296);
    const captured = await native(page, "item");
    await choose(page, "item", axis, "Fixed");
    close((await native(page, "item"))[axis], captured[axis]);
    await patch(page, "row", { [axis]: axis === "height" ? "260px" : "380px" });
    close((await native(page, "item"))[axis], captured[axis]);
    await choose(page, "item", axis, "Fill");
    await choose(page, "item", axis, "Fit");
    close((await native(page, "item"))[axis], axis === "height" ? 30 : 40);
    await choose(page, "item", axis, "Fill");
    assert.equal((await native(page, "item"))[`${axis}Priority`], "important");
    await crossFillBoundaries(page, direction);
    await crossFillBounds(page, direction);
    await crossFillDecoration(page, direction);
    await crossFillParentSources(page, direction);
  }
  await crossFillSafeguards(page);
  await reset(page);
  checks.push(
    "Explicit cross-axis Fill follows bounded parents while numeric gestures remain read-only; Fixed captures and Fit follows content with exact history and preserved priority",
  );
}

async function crossFillDecoration(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "height" : "width";
  const edges = direction === "row" ? ["top", "bottom"] : ["left", "right"];
  for (const box of ["border-box", "content-box"]) {
    await crossFillFixture(page, direction);
    await patch(page, "item", {
      "box-sizing": box,
      [`padding-${edges[0]}`]: "5px",
      [`padding-${edges[1]}`]: "13px",
      [`border-${edges[0]}`]: "2px solid black",
      [`border-${edges[1]}`]: "4px solid black",
    });
    await choose(page, "item", axis, "Fill");
    close((await native(page, "item"))[axis], axis === "height" ? 136 : 256);
    await patch(page, "row", { padding: "20px", border: "5px solid black" });
    close((await native(page, "item"))[axis], axis === "height" ? 116 : 236);
    await patch(page, "row", { [axis]: "0px" });
    close((await native(page, "item"))[axis], 24);
    await patch(page, "row", { [axis]: "250px" });
    close((await native(page, "item"))[axis], 186);
    const before = await native(page, "item");
    await choose(page, "item", axis, "Fixed");
    close((await native(page, "item"))[axis], before[axis]);
    inputs.push({ trigger: "Cross Fill native decoration and floors", direction, box });
  }
}

async function crossFillParentSources(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "height" : "width";
  for (const style of [
    { [axis]: "50%" },
    { [axis]: "var(--bound)", "--bound": "200px" },
    { [axis === "height" ? "block-size" : "inline-size"]: "200px" },
    { [`min-${axis}`]: "var(--bound)", [`max-${axis}`]: "200px", "--bound": "200px" },
  ]) {
    await crossFillFixture(page, direction);
    await patch(page, "row", style);
    await noEdit(page, () => fillAvailability(page, axis, false));
    inputs.push({ trigger: "Cross Fill independently owned parent boundary", direction, style });
  }
}

async function crossFillSafeguards(page: Page) {
  await crossFillFixture(page, "column");
  await drafts(page, "Fill");
  await staleDraft(page, "Fill");
  await rejection(page, "Fill");
  await pendingHistory(page, "Fill");
}

async function crossFillFixture(page: Page, direction: "row" | "column") {
  await reset(page);
  await patch(page, "row", { width: "300px", height: "180px", "flex-direction": direction });
  const edges =
    direction === "row" ? ["margin-top", "margin-bottom"] : ["margin-left", "margin-right"];
  await patch(page, "item", {
    width: "80px !important",
    height: "70px !important",
    "align-self": "center !important",
    "--cross-edge": "7px",
    [edges[0]]: "var(--cross-edge)",
    [edges[1]]: "7px",
  });
  await patch(page, "label", { width: "40px", height: "30px" });
  await patch(page, "sibling", { display: "none" });
  await select(page, "item");
}

async function fillAvailability(page: Page, axis: Axis, available: boolean) {
  const option = control(page, axis).getByRole("option", { name: "Fill", exact: true });
  assert.equal(await option.count(), 1, "The sizing selector exposes explicit Fill availability");
  assert.equal((await option.getAttribute("disabled")) !== null, !available);
  inputs.push({ trigger: "Fill availability", axis, available });
}

async function crossFillInspection(page: Page, axis: Axis) {
  await noEdit(page, async () => {
    const input = field(page, axis);
    assert.equal(await control(page, axis).isDisabled(), false);
    assert.equal(await input.getAttribute("readonly"), "");
    assert.ok(Number.isFinite(Number(await input.inputValue())));
    const before = await native(page, "item");
    await input.press("ArrowUp");
    await input.press("Enter");
    const box = await input.boundingBox();
    assert.ok(box);
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 30, box.y + box.height / 2);
    await page.mouse.up();
    close((await native(page, "item"))[axis], before[axis]);
  });
}

async function crossFillBoundaries(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "height" : "width";
  const edge = direction === "row" ? "margin-top" : "margin-left";
  const cases: DesignNode["style"][] = [
    { [edge]: "auto" },
    { [edge]: "var(--cross-edge)", "--cross-edge": "auto" },
    { [axis]: "var(--size)", "--size": "70px" },
    { [axis === "height" ? "block-size" : "inline-size"]: "70px" },
    { "align-self": "var(--alignment)", "--alignment": "center" },
    { "place-self": "center" },
    { "aspect-ratio": "2" },
    { transform: "scale(1.1)" },
  ];
  for (const style of cases) {
    await crossFillFixture(page, direction);
    await patch(page, "item", style);
    await noEdit(page, () => fillAvailability(page, axis, false));
    inputs.push({ trigger: "Cross-axis Fill source boundary", direction, style });
  }
  await crossFillFixture(page, direction);
  await patch(page, "row", { "flex-wrap": "wrap" });
  await noEdit(page, () => fillAvailability(page, axis, false));
}

async function crossFillBounds(page: Page, direction: "row" | "column") {
  const axis = direction === "row" ? "height" : "width";
  await crossFillFixture(page, direction);
  await patch(page, "row", { [axis]: "max-content" });
  await noEdit(page, async () => {
    await fillAvailability(page, axis, false);
    await page.getByText(`Set the parent's ${axis} first.`, { exact: true }).waitFor();
  });
  await patch(page, "row", { [`min-${axis}`]: "200px", [`max-${axis}`]: "200px" });
  await fillAvailability(page, axis, true);
  await choose(page, "item", axis, "Fill");
  close((await native(page, "item"))[axis], 156);
  await patch(page, "item", { [`max-${axis}`]: "90px" });
  close((await native(page, "item"))[axis], 90);
  await patch(page, "item", { [`min-${axis}`]: "250px" });
  close((await native(page, "item"))[axis], 250);
  await page.getByText(/This object extends beyond its parent\./u).waitFor();
  const before = (await session(page)).projects[0].document;
  await select(page, "row");
  const pending = page.waitForResponse(isCommand);
  await page.getByLabel("Clip content", { exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.equal(await page.getByLabel("Clip content", { exact: true }).isChecked(), true);
  close((await native(page, "item"))[axis], 250);
  assert.deepEqual((await session(page)).projects[0].document.nodes.item, before.nodes.item);
  inputs.push({
    trigger: "Cross-axis Fill bounded limits",
    direction,
    native: await native(page, "item"),
  });
}

async function composedLayouts(page: Page, mode: string) {
  await reset(page);
  const before = (await session(page)).projects[0].document;
  const initial = await composedBoxes(page);
  await resizeAccount(page);
  const wider = await composedBoxes(page);
  close(wider.user.width, initial.user.width);
  assert.ok(
    wider.chevron.x - wider.user.x - wider.user.width >
      initial.chevron.x - initial.user.x - initial.user.width,
  );
  await select(page, "sidebar");
  await edit(page, "sidebar", "width", "420");
  await edit(page, "sidebar", "height", "620");
  const taller = await composedBoxes(page);
  close(
    taller.account.y - taller.nav.y - taller.nav.height,
    initial.account.y - initial.nav.y - initial.nav.height + 220,
  );
  assertComposedGaps(initial);
  assertComposedGaps(wider);
  assertComposedGaps(taller);
  const after = (await session(page)).projects[0].document;
  const restored = structuredClone(after);
  for (const id of ["sidebar", "account"]) restored.nodes[id].style = before.nodes[id].style;
  assertContent(restored, before);
  inputs.push({
    trigger: "Nested account menu and sidebar",
    before,
    after,
    initial,
    wider,
    taller,
  });
  await page.screenshot({ path: artifact(`${mode}-composed.png`), fullPage: true });
  checks.push(
    "Composed account Row keeps avatar/identity together; taller bounded sidebar separates only navigation/account while native inner gaps and canonical hierarchy remain intact",
  );
}

async function resizeAccount(page: Page) {
  await select(page, "account");
  assert.equal(await modeLabel(page, "height"), "Fit");
  await choose(page, "account", "height", "Fixed");
  await edit(page, "account", "height", "88");
  await choose(page, "account", "height", "Fit");
  await edit(page, "account", "width", "340");
}

async function composedBoxes(page: Page) {
  return {
    account: await native(page, "account"),
    user: await native(page, "user-info"),
    avatar: await native(page, "avatar"),
    identity: await native(page, "identity"),
    name: await native(page, "account-name"),
    email: await native(page, "account-email"),
    chevron: await native(page, "chevron"),
    nav: await native(page, "navigation"),
    brand: await native(page, "brand"),
    projects: await native(page, "nav-projects"),
    settings: await native(page, "nav-settings"),
  };
}

function assertComposedGaps(boxes: Awaited<ReturnType<typeof composedBoxes>>) {
  close(boxes.avatar.width, 44);
  close(boxes.identity.x - boxes.avatar.x - boxes.avatar.width, 8);
  close(boxes.user.width, boxes.avatar.width + 8 + boxes.identity.width);
  close(boxes.name.x, boxes.identity.x);
  close(boxes.email.x, boxes.identity.x);
  close(boxes.email.y - boxes.name.y - boxes.name.height, 2);
  close(boxes.identity.width, Math.max(boxes.name.width, boxes.email.width));
  close(boxes.projects.y - boxes.brand.y - boxes.brand.height, 6);
  close(boxes.settings.y - boxes.projects.y - boxes.projects.height, 6);
}

async function inspection(page: Page) {
  await noEdit(page, async () => {
    for (const id of ["item", "row", "text"]) {
      await select(page, id);
      for (const axis of ["width", "height"] as const) {
        assert.equal(await control(page, axis).isEnabled(), true);
        assert.equal(
          await control(page, axis).getByRole("option", { name: "Fixed", exact: true }).count(),
          1,
        );
        assert.equal(
          await control(page, axis).getByRole("option", { name: "Fit", exact: true }).count(),
          1,
        );
      }
    }
  });
  await select(page, "item");
  await choose(page, "item", "width", "Fit");
  await history(page, "undo");
  await noEdit(page, async () => {
    await control(page, "width").selectOption({ label: "Fixed" });
  });
  assert.equal((await session(page)).projects[0].canRedo, true);
  await history(page, "redo");
  checks.push(
    "Inspection and unchanged choices retain source, revision and Redo; supported axes expose labeled Fixed/Fit choices",
  );
}

async function fixedOverflow(page: Page) {
  for (const direction of ["row", "column"]) {
    const axis = direction === "row" ? "width" : "height";
    await reset(page, "row", { "flex-direction": direction, width: "140px", height: "140px" });
    await patch(page, "item", { flex: "0 1 auto", [axis]: "90px" });
    await select(page, "item");
    await choose(page, "item", axis, "Fixed");
    await edit(page, "item", axis, "220");
    close((await native(page, "item"))[axis], 220);
    const parent = await native(page, "row");
    assert.ok(parent[axis === "width" ? "scrollWidth" : "scrollHeight"] > parent[axis]);
    assert.equal(parent.overflow, "visible");
    await page.getByText("This object extends beyond its parent.", { exact: true }).waitFor();
    inputs.push({
      trigger: "Fixed overflow",
      direction,
      parent,
      child: await native(page, "item"),
    });
  }
  checks.push(
    "Fixed main-axis dimensions remain 220 px under Row/Column overflow without changing sibling rules or clipping",
  );
}

async function decoratedCapture(page: Page) {
  await reset(page, "item", {
    width: "max-content",
    height: "max-content",
    padding: "7.25px 9.5px",
    border: "2.5px solid black",
    margin: "3.25px",
    "box-sizing": "content-box",
  });
  await patch(page, "label", { width: "67.75px !important", height: "26.5px" });
  for (const delta of [420, -840]) {
    const previous = (await native(page, "item")).scale;
    await page.getByRole("application", { name: "Canvas" }).hover();
    await page.mouse.wheel(0, delta);
    await page.waitForFunction(
      (value) =>
        new DOMMatrix(getComputedStyle(document.querySelector(".canvas-world")!).transform).a !==
        value,
      previous,
    );
    await settled(page);
    for (const axis of ["width", "height"] as const) {
      const before = await native(page, "item");
      await choose(page, "item", axis, "Fixed");
      const after = await native(page, "item");
      close(after.width, before.width);
      close(after.height, before.height);
      close(
        parseFloat((await session(page)).projects[0].document.nodes.item.style[axis]),
        parseFloat(before[axis === "width" ? "cssWidth" : "cssHeight"]),
      );
      await choose(page, "item", axis, "Fit");
    }
  }
  checks.push(
    "Fit-to-Fixed captures fractional used CSS dimensions with content-box decoration, margins and canvas zoom preserved",
  );
}

async function textWrapping(page: Page) {
  await reset(page);
  await select(page, "text");
  await choose(page, "text", "width", "Fixed");
  await edit(page, "text", "width", "130");
  const narrow = await native(page, "text");
  assert.ok(narrow.height > 20);
  await edit(page, "text", "width", "260");
  assert.ok((await native(page, "text")).height < narrow.height);
  await page.getByRole("textbox", { name: "Content", exact: true }).fill("More words ".repeat(20));
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("textbox", { name: "Content", exact: true }).press("Tab");
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.ok((await native(page, "text")).height > narrow.height);
  assert.equal(await modeLabel(page, "height"), "Fit");
  checks.push(
    "Fixed-width/Fit-height Text wraps and grows with content; width changes preserve text and typography",
  );
}

async function frameContent(page: Page) {
  await reset(page, "row", {
    width: "140px",
    height: "160px",
    "flex-wrap": "wrap",
    "--orc-row-wrap": "wrap",
  });
  await select(page, "row");
  await choose(page, "row", "height", "Fit");
  const wrapped = await native(page, "row");
  assert.ok(wrapped.height < 600, "Absolute and hidden children cannot supply Fit height");
  assert.ok((await native(page, "sibling")).y > (await native(page, "item")).y);
  await edit(page, "row", "width", "300");
  assert.ok((await native(page, "row")).height < wrapped.height);
  await choose(page, "row", "width", "Fit");
  assert.ok((await native(page, "row")).width < 1000);
  checks.push(
    "Wrapped Row Fit height follows normal-flow lines, Gap and Padding; Absolute/hidden children contribute neither slots nor size",
  );
}

async function unavailable(page: Page, axis: Axis) {
  const choice = control(page, axis);
  if (await choice.count()) assert.equal(await choice.isDisabled(), true);
  const numeric = field(page, axis);
  if (await numeric.count())
    assert.ok((await numeric.isDisabled()) || (await numeric.getAttribute("readonly")) !== null);
}

async function sourceBoundaries(page: Page) {
  const cases: DesignNode["style"][] = [
    { width: "50%" },
    { width: "calc(80px + 2px)" },
    { width: "var(--size)", "--size": "80px" },
    { width: "inherit" },
    { width: "min-content" },
    { "inline-size": "90px" },
    { "min-width": "var(--bound)", "--bound": "90px" },
    { "max-width": "calc(90px + 10px)" },
    { all: "initial" },
    { flex: "var(--factors)", "--factors": "0 0 auto" },
  ];
  for (const style of cases) {
    await reset(page, "item", style);
    await noEdit(page, async () => {
      await unavailable(page, "width");
    });
    inputs.push({ trigger: "Sizing source boundary", style });
  }
  await reset(page, "item", { width: "8e1px !important" });
  await choose(page, "item", "width", "Fit");
  assert.equal((await native(page, "item")).widthPriority, "important");
  await choose(page, "item", "width", "Fixed");
  assert.equal((await native(page, "item")).widthPriority, "important");
  await sizeLimits(page);
  await freeCounterexample(page);
  await reset(page, "free-child", { width: "auto", "inset-inline": "10px 20px" });
  await select(page, "free-child");
  await noEdit(page, async () => {
    await unavailable(page, "width");
  });
  await formattingCounterexamples(page);
  checks.push(
    "Expressions, logical/reset/limit ownership and unresolved flex stay source-owned; supported pixel priorities survive explicit conversion",
  );
}

async function formattingCounterexamples(page: Page) {
  await reset(page, "row", { display: "table", height: "140px" });
  await patch(page, "item", { display: "table-cell", height: "20px" });
  await noEdit(page, async () => {
    await unavailable(page, "height");
  });
  assert.ok((await native(page, "item")).height > 20, "Table-cell height is a minimum, not Fixed");
  await reset(page, "row", { "flex-direction": "column", "align-items": "stretch" });
  await patch(page, "item", { width: "auto", "inline-size": "120px" });
  await noEdit(page, async () => {
    await unavailable(page, "width");
    assert.notEqual(await modeLabel(page, "width"), "Fill");
  });
  close((await native(page, "item")).width, 120);
}

async function shorthandOrder(page: Page) {
  await reset(page, "item", { width: "max-content" });
  await orderedFactors(page);
  await choose(page, "item", "width", "Fit");
  await normalizedFactors(page);
  await reset(page, "item", { width: "90px" });
  await orderedFactors(page);
  await noEdit(page, async () => {
    await field(page, "width").focus();
    await field(page, "width").press("Tab");
  });
  await field(page, "width").fill("9");
  await size(page, "item", "width", 9);
  await edit(page, "item", "width", "90");
  await normalizedFactors(page);
  checks.push(
    "Later literal flex shorthand cannot make matching canonical factors or dimensions an incorrect no-op",
  );
}

async function orderedFactors(page: Page) {
  await accepted(page, {
    kind: "batch",
    mutations: [
      {
        kind: "style",
        id: "item",
        unset: ["flex", "flex-grow", "flex-shrink", "flex-basis"],
        values: {},
      },
      {
        kind: "style",
        id: "item",
        values: { "flex-grow": "0", "flex-shrink": "0", "flex-basis": "auto", flex: "0 1 40px" },
      },
    ],
  });
}

async function normalizedFactors(page: Page) {
  const factors = await page.locator('.canvas-world [data-orc-id="item"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.flexGrow, style.flexShrink, style.flexBasis];
  });
  assert.deepEqual(factors, ["0", "0", "auto"]);
}

async function sizeLimits(page: Page) {
  await reset(page, "item", { "min-width": "40px", "max-width": "100px" });
  await choose(page, "item", "width", "Fit");
  const before = await native(page, "item");
  assert.ok(before.width >= 39.9 && before.width <= 100.1);
  await choose(page, "item", "width", "Fixed");
  close((await native(page, "item")).width, before.width);
}

async function freeCounterexample(page: Page) {
  await select(page, "free");
  const before = await native(page, "free");
  await noEdit(page, async () => {
    for (const axis of ["width", "height"] as const) {
      const choice = control(page, axis);
      if (!(await choice.count())) continue;
      const fit = choice.getByRole("option", { name: "Fit", exact: true });
      assert.equal(
        (await fit.getAttribute("disabled")) !== null,
        true,
        "Absolute children do not prove content-enclosing Free Fit",
      );
    }
  });
  close((await native(page, "free")).width, before.width);
  close((await native(page, "free")).height, before.height);
  inputs.push({
    trigger: "Free Fit counterexample",
    before,
    child: await native(page, "free-child"),
  });
}

async function sizingDependencies(page: Page) {
  await reset(page, "item", { "flex-direction": "column", width: "max-content" });
  await patch(page, "label", { width: "auto", "align-self": "stretch" });
  await select(page, "label");
  await noEdit(page, async () => {
    assert.equal(await modeLabel(page, "width"), "Fill");
    assert.equal(await control(page, "width").isEnabled(), true);
    assert.equal(await field(page, "width").getAttribute("readonly"), "");
    await fillAvailability(page, "width", false);
  });
  await select(page, "item");
  const children = (await session(page)).projects[0].document.nodes.label;
  await choose(page, "item", "height", "Fit");
  await select(page, "row");
  await edit(page, "row", "width", "360");
  assert.deepEqual((await session(page)).projects[0].document.nodes.label, children);
  assert.ok((await native(page, "item")).width > 0);
  await select(page, "label");
  await choose(page, "label", "width", "Fit");
  await choose(page, "label", "width", "Fixed");
  await dependencyRejection(page);
  await boundedDependency(page);
  await constraintsReadout(page);
  checks.push(
    "Bounded nested Fit with intrinsic cross-axis Fill remains native; unresolved same-axis grow and Constraints remain explicit without silent conversion",
  );
}

async function boundedDependency(page: Page) {
  await reset(page, "row", { "min-width": "200px", "max-width": "200px" });
  await patch(page, "item", { width: "auto", flex: "1 0 0px" });
  await patch(page, "sibling", { display: "none" });
  const child = (await session(page)).projects[0].document.nodes.item;
  const before = await native(page, "item");
  await select(page, "row");
  await choose(page, "row", "width", "Fit");
  close((await native(page, "row")).width, 200);
  close((await native(page, "item")).width, before.width);
  assert.deepEqual((await session(page)).projects[0].document.nodes.item, child);
  await select(page, "item");
  assert.equal(await modeLabel(page, "width"), "Fill");
}

async function autoMarginOwnership(page: Page) {
  for (const direction of ["row", "column"] as const)
    for (const margin of ["7px", "auto", "var(--cross-margin)"]) {
      const axis = direction === "row" ? "height" : "width";
      await marginFixture(page, direction, margin);
      await noEdit(page, async () => {
        await select(page, "item");
        const measured = await native(page, "item");
        const mode = await modeLabel(page, axis);
        const fill = margin === "7px";
        close(measured[axis], fill ? (axis === "height" ? 146 : 266) : axis === "height" ? 30 : 40);
        assert.equal(
          mode === "Fill",
          fill,
          `${direction} ${margin}: effective auto margins suppress stretch`,
        );
        inputs.push({
          trigger: "Cross-axis margin ownership",
          direction,
          axis,
          margin,
          mode,
          native: measured,
        });
      });
    }
  checks.push(
    "Literal and variable-resolved cross-axis auto margins retain intrinsic sizes and numeric margins retain native Fill without inspection commands",
  );
}

async function marginFixture(page: Page, direction: "row" | "column", margin: string) {
  await reset(page, "row", {
    "flex-direction": direction,
    "align-items": "stretch",
    height: "180px",
    padding: "10px",
    border: "0px solid black",
  });
  const edges =
    direction === "row" ? ["margin-top", "margin-bottom"] : ["margin-left", "margin-right"];
  await patch(page, "item", {
    width: direction === "row" ? "70px" : "auto",
    height: direction === "row" ? "auto" : "70px",
    "--cross-margin": "auto",
    [edges[0]]: margin,
    [edges[1]]: margin,
  });
  await patch(page, "label", { width: "40px", height: "30px" });
  await patch(page, "sibling", { display: "none" });
}

async function dependencyRejection(page: Page) {
  await reset(page, "item", { width: "auto", flex: "1 0 0px" });
  await patch(page, "sibling", { display: "none" });
  await select(page, "row");
  await noEdit(page, async () => {
    const fit = control(page, "width").getByRole("option", { name: "Fit", exact: true });
    if ((await fit.getAttribute("disabled")) !== null) return;
    await control(page, "width").selectOption({ label: "Fit" });
    await page
      .getByRole("alert")
      .filter({ hasText: /parent.*width|width.*parent/iu })
      .waitFor();
  });
}

async function constraintsReadout(page: Page) {
  await reset(page, "free-child", { width: "auto", left: "10px", right: "20px" });
  await select(page, "free-child");
  await noEdit(page, async () => {
    await unavailable(page, "width");
  });
}

async function numericPreview(page: Page) {
  await reset(page);
  await select(page, "item");
  const before = await native(page, "item");
  const input = await field(page, "width").elementHandle();
  assert.ok(input);
  await noEdit(page, async () => {
    await field(page, "width").fill("101.5");
    await size(page, "item", "width", 101.5);
    assert.equal(await control(page, "width").isDisabled(), true);
    assert.equal(await control(page, "height").isDisabled(), true);
    assert.ok(
      (await field(page, "height").isDisabled()) ||
        (await field(page, "height").getAttribute("readonly")) !== null,
    );
    assert.equal(
      await input.evaluate((element) => element.isConnected && document.activeElement === element),
      true,
    );
    await field(page, "width").fill("-3");
    await page.getByRole("alert").filter({ hasText: /valid/iu }).waitFor();
    await size(page, "item", "width", 101.5);
    await field(page, "width").press("Escape");
  });
  close((await native(page, "item")).width, before.width);
  assert.equal(await control(page, "width").isEnabled(), true);
  assert.equal(await control(page, "height").isEnabled(), true);
  await edit(page, "item", "width", "102.5");
  assert.equal(await input.evaluate((element) => element.isConnected), true);
  await edit(page, "item", "height", "55", "Tab");
  assert.equal(await page.getByLabel("Name", { exact: true }).inputValue(), "item");
  await numericModeCapture(page);
  checks.push(
    "Numeric typing previews without commands; invalid values retain the last valid preview; Escape cancels and Enter/blur commit once",
  );
}

async function numericModeCapture(page: Page) {
  await reset(page);
  await choose(page, "item", "width", "Fit");
  const value = await field(page, "width").inputValue();
  await noEdit(page, async () => {
    await field(page, "width").focus();
    await field(page, "width").press("Tab");
  });
  await field(page, "width").fill(String(Number(value) + 1));
  await size(page, "item", "width", Number(value) + 1);
  await edit(page, "item", "width", value);
  assert.equal(await modeLabel(page, "width"), "Fixed");
}

async function locks(page: Page, prepared = false) {
  if (!prepared) await reset(page);
  for (const id of ["item", "row"]) {
    await accepted(page, { kind: "lock", id, locked: true });
    await select(page, "item");
    assert.equal(await control(page, "width").isDisabled(), true);
    assert.equal(await control(page, "height").isDisabled(), true);
    const before = await session(page);
    const response = await command(page, { kind: "style", id: "item", values: { width: "1px" } });
    assert.equal(response.status(), 400);
    assert.deepEqual(await session(page), before);
    await accepted(page, { kind: "lock", id, locked: false });
  }
  checks.push(
    "Own and ancestor locks disable sizing and reject direct commands without changing document/history",
  );
}

async function makeDraft(page: Page) {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  const value = `${await source.innerText()}\n<!-- sizing draft -->`;
  await source.press("Control+a");
  await page.keyboard.insertText(value);
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  return value;
}

async function drafts(page: Page, choice: "Fit" | "Fill" = "Fit") {
  const draft = await makeDraft(page);
  const before = await session(page);
  await control(page, "width").selectOption({ label: choice });
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.deepEqual(await session(page), before);
  assert.equal(
    await page.getByRole("textbox", { name: "Object source", exact: true }).innerText(),
    draft,
  );
  await control(page, "width").selectOption({ label: choice });
  const pending = page.waitForResponse(isCommand);
  await dialog.getByRole("button", { name: "Discard", exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  assertAxisOnly(
    before.projects[0].document,
    (await session(page)).projects[0].document,
    "item",
    "width",
    choice,
  );
  assert.equal(await modeLabel(page, "width"), choice);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Draft Cancel retains draft/applied state; Discard permits one selected-axis sizing command",
  );
}

async function staleDraft(page: Page, choice: "Fit" | "Fill" = "Fit", prepared = false) {
  if (!prepared) {
    if (choice === "Fill") await crossFillFixture(page, "column");
    else await reset(page);
  }
  await makeDraft(page);
  await control(page, "width").selectOption({ label: choice });
  const dialog = page.getByRole("dialog", { name: "Discard unapplied changes?", exact: true });
  await dialog.waitFor();
  await accepted(page, { kind: "style", id: "row", values: { width: "350px" } });
  await noEdit(page, async () => {
    await dialog.getByRole("button", { name: "Discard", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "The layout changed. Try again." }).waitFor();
  });
  await page.getByRole("button", { name: "Code", exact: true }).click();
  checks.push(
    "Newer applied revisions during draft preparation reject stale sizing and preserve the newer source/history",
  );
}

async function rejection(page: Page, choice: "Fit" | "Fill" = "Fit") {
  const before = await session(page);
  const box = await native(page, "item");
  await page.route("**/api/commands", (route) =>
    route.fulfill({ status: 409, json: { error: "Sizing rejection control" } }),
  );
  try {
    await control(page, "width").selectOption({ label: choice });
    await page.getByRole("alert").filter({ hasText: "Sizing rejection control" }).waitFor();
    await settled(page);
    assert.deepEqual(await session(page), before);
    close((await native(page, "item")).width, box.width);
    assert.equal(await modeLabel(page, "width"), "Fixed");
    assert.equal(await control(page, "width").isEnabled(), true);
  } finally {
    await page.unrouteAll({ behavior: "wait" });
  }
  await choose(page, "item", "width", choice);
  await choose(page, "item", "width", "Fixed");
  checks.push(
    "Rejected sizing restores native box, canonical readout and editability; the same control can retry immediately",
  );
}

async function pendingHistory(page: Page, choice: "Fit" | "Fill" = "Fit") {
  let release = () => {};
  let ready = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const received = new Promise<void>((resolve) => {
    ready = resolve;
  });
  const before = (await session(page)).projects[0].document;
  const requests: unknown[] = [];
  await page.route("**/api/commands", async (route) => {
    requests.push(route.request().postDataJSON());
    const response = await route.fetch();
    ready();
    await held;
    await route.fulfill({ response });
  });
  try {
    await control(page, "width").selectOption({ label: choice });
    await received;
    await page.getByRole("application", { name: "Canvas" }).press("Control+z");
    release();
    await page.waitForFunction(
      async (revision) =>
        (await (await fetch("/api/session")).json()).projects[0].document.revision >= revision + 2,
      before.revision,
    );
    await settled(page);
    assertContent((await session(page)).projects[0].document, before);
    assert.equal(requests.length, 1);
    inputs.push({ trigger: "Sizing pending Undo", requests });
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  checks.push(
    "Immediate Undo waits for one sizing acknowledgement and restores the complete prior document",
  );
}

async function conversions(page: Page) {
  await reset(page);
  await select(page, "row");
  await noEdit(page, async () => {
    await page.getByRole("button", { name: "Column", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: /unavailable child measurements/u })
      .waitFor();
  });
  const hidden = (await session(page)).projects[0].document.nodes.hidden;
  await accepted(page, { kind: "delete", ids: [hidden.id] });
  try {
    await measurableConversions(page);
  } finally {
    await accepted(page, { kind: "insert", nodes: [hidden] });
  }
}

async function measurableConversions(page: Page) {
  await select(page, "item");
  await choose(page, "item", "width", "Fit");
  await choose(page, "item", "height", "Fit");
  const original = (await session(page)).projects[0].document;
  await select(page, "row");
  for (const mode of ["Column", "Row"] as const) {
    await layout(page, mode);
    const node = (await session(page)).projects[0].document.nodes.item;
    assert.equal(node.style.width, original.nodes.item.style.width);
    assert.equal(node.style.height, original.nodes.item.style.height);
    assert.deepEqual(node.children, original.nodes.item.children);
  }
  await select(page, "item");
  const before = await native(page, "item");
  await participation(page, true);
  close((await native(page, "item")).width, before.width);
  close((await native(page, "item")).height, before.height);
  await participation(page, false);
  await select(page, "row");
  const boxes = [await native(page, "item"), await native(page, "sibling")];
  await layout(page, "Free");
  for (const [index, id] of ["item", "sibling"].entries()) {
    close((await native(page, id)).width, boxes[index].width);
    close((await native(page, id)).height, boxes[index].height);
  }
  await layout(page, "Row");
  checks.push(
    "Fixed/Fit CSS survives direction changes; Absolute and Flex-to-Free retain measured boxes and canonical sibling order",
  );
}

async function layout(page: Page, mode: "Row" | "Column" | "Free") {
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("button", { name: mode, exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  const after = (await session(page)).projects[0].document;
  await exactHistory(page, before, after);
}

async function participation(page: Page, absolute: boolean) {
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("checkbox", { name: "Absolute Position", exact: true }).click();
  assert.equal((await pending).status(), 200);
  await settled(page);
  assert.equal(
    await page.getByRole("checkbox", { name: "Absolute Position", exact: true }).isChecked(),
    absolute,
  );
}

async function minimumPanel(page: Page, mode: string) {
  await reset(page);
  await page.getByRole("separator", { name: "Resize Properties", exact: true }).press("Home");
  await control(page, "width").focus();
  const measured = await page.locator(".properties-panel").evaluate((panel) => ({
    width: panel.getBoundingClientRect().width,
    overflow: panel.scrollWidth > panel.clientWidth,
    focused: document.activeElement?.getAttribute("aria-label"),
    visible: document.activeElement?.matches(":focus-visible"),
    clipped: [...panel.querySelectorAll("input, select")].some(
      (field) => field.getBoundingClientRect().right > panel.getBoundingClientRect().right,
    ),
    targets: [...panel.querySelectorAll(".sizing-control input, .sizing-control select")].map(
      (field) => field.getBoundingClientRect().height,
    ),
  }));
  assert.equal(measured.width, 240);
  assert.equal(measured.overflow || measured.clipped, false);
  assert.equal(measured.focused, "Width sizing");
  assert.equal(measured.visible, true);
  assert.equal(measured.targets.length, 4);
  assert.ok(
    measured.targets.every((height) => height >= 44),
    JSON.stringify(measured.targets),
  );
  await page.screenshot({ path: artifact(`${mode}-minimum.png`), fullPage: true });
  inputs.push({ mode, minimumPanel: measured });
  checks.push(
    `${mode}: 240 px Properties retains unclipped sizing fields and visible keyboard focus`,
  );
}

async function saveReopen(page: Page, mode: string) {
  await crossFillFixture(page, "column");
  await choose(page, "item", "width", "Fill");
  const savedBoxes = await prepareSavedMainFill(page);
  await sourceRoundTrip(page);
  const box = await native(page, "item");
  await page.getByRole("button", { name: "Not saved", exact: true }).click();
  await page.getByRole("textbox", { name: "Project name", exact: true }).fill(`Sizing ${mode}`);
  await page
    .getByRole("textbox", { name: "Save in folder", exact: true })
    .fill(join(process.cwd(), temporary));
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
  await select(page, "item");
  const reopened = (await session(page)).projects[0];
  assert.deepEqual(reopened.document, saved.document);
  assert.equal(reopened.canUndo || reopened.canRedo, false);
  assert.equal(await modeLabel(page, "width"), "Fill");
  close((await native(page, "item")).width, box.width);
  await verifySavedMainFill(page, mode, saved.document, reopened.document, savedBoxes);
  await select(page, "item");
  close((await native(page, "item")).width, box.width + 50);
  inputs.push({ mode, saved: saved.document, reopened: reopened.document, native: box });
  checks.push(
    `${mode}: source round-trip and UI save/reopen retain sizing CSS, native boxes and fresh history`,
  );
}

async function prepareSavedMainFill(page: Page) {
  for (const [id, axis] of [
    ["account", "height"],
    ["user-info", "width"],
  ] as const) {
    await select(page, id);
    await choose(page, id, axis, "Fill");
    await sourceRoundTrip(page, id);
  }
  for (const id of ["user-info", "chevron"]) await patch(page, id, { "min-width": "0px" });
  await select(page, "chevron");
  await sharingChoice(page, "chevron", "width", "Fill", ["user-info", "chevron"]);
  close((await native(page, "user-info")).width, 133);
  close((await native(page, "chevron")).width, 133);
  await sourceRoundTrip(page, "chevron");
  await select(page, "item");
  return savedFillBoxes(page);
}

async function savedFillBoxes(page: Page) {
  return {
    item: await native(page, "item"),
    account: await native(page, "account"),
    "user-info": await native(page, "user-info"),
    navigation: await native(page, "navigation"),
    chevron: await native(page, "chevron"),
  };
}

async function verifySavedMainFill(
  page: Page,
  mode: string,
  saved: DesignDocument,
  reopened: DesignDocument,
  savedBoxes: Awaited<ReturnType<typeof savedFillBoxes>>,
) {
  const reopenedHistory = (await session(page)).projects[0];
  const reopenedModes = await reopenedFillModes(page);
  const reopenedBoxes = await savedFillBoxes(page);
  for (const id of ["item", "account", "user-info", "navigation", "chevron"] as const)
    for (const axis of ["width", "height"] as const)
      close(reopenedBoxes[id][axis], savedBoxes[id][axis]);
  await patch(page, "sidebar", { height: "480px" });
  await patch(page, "account", { width: "350px" });
  await patch(page, "row", { width: "350px" });
  const resizedBoxes = await savedFillBoxes(page);
  close(resizedBoxes.account.height, savedBoxes.account.height + 80);
  close(resizedBoxes["user-info"].width, savedBoxes["user-info"].width + 25);
  close(resizedBoxes.item.width, savedBoxes.item.width + 50);
  close(resizedBoxes.navigation.height, savedBoxes.navigation.height);
  close(resizedBoxes.chevron.width, savedBoxes.chevron.width + 25);
  inputs.push({
    trigger: "Nested main and cross Fill persistence",
    mode,
    saved,
    reopened,
    savedBoxes,
    reopenedBoxes,
    resizedBoxes,
    reopenedModes,
    reopenedHistory: { canUndo: reopenedHistory.canUndo, canRedo: reopenedHistory.canRedo },
    resizedDocument: (await session(page)).projects[0].document,
  });
}

async function reopenedFillModes(page: Page) {
  const reopenedModes: Record<string, string> = {};
  for (const [id, axis] of [
    ["item", "width"],
    ["account", "height"],
    ["user-info", "width"],
    ["chevron", "width"],
  ] as const) {
    await select(page, id);
    reopenedModes[id] = await modeLabel(page, axis);
    assert.equal(reopenedModes[id], "Fill");
    assert.equal(await field(page, axis).getAttribute("readonly"), "");
  }
  return reopenedModes;
}

async function sourceRoundTrip(page: Page, id = "item") {
  await page.getByRole("button", { name: "Code", exact: true }).click();
  const before = await session(page);
  const source = page.getByRole("textbox", { name: "Object source", exact: true });
  await source.press("Control+a");
  await page.keyboard.insertText(
    `${nodeSource(before.projects[0].document, id)}\n<!-- sizing source round trip -->`,
  );
  await page.getByText("Unapplied changes", { exact: true }).waitFor();
  const pending = page.waitForResponse(isCommand);
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  assert.deepEqual(await session(page), before);
  await page.getByRole("button", { name: "Code", exact: true }).click();
}

async function choose(page: Page, id: string, axis: Axis, choice: "Fixed" | "Fit" | "Fill") {
  const before = (await session(page)).projects[0].document;
  const pending = page.waitForResponse(isCommand);
  await control(page, axis).selectOption({ label: choice });
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assertAxisOnly(before, after, id, axis, choice);
  assert.equal(await modeLabel(page, axis), choice);
  inputs.push({
    trigger: "Sizing choice",
    id,
    axis,
    choice,
    request: sizingRequest(response, before, id, axis, choice),
    before,
    after,
    native: await native(page, id),
  });
  await exactHistory(page, before, after);
}

async function edit(page: Page, id: string, axis: Axis, value: string, key = "Enter") {
  const before = (await session(page)).projects[0].document;
  await field(page, axis).fill(value);
  await size(page, id, axis, Number(value));
  assertContent((await session(page)).projects[0].document, before);
  const pending = page.waitForResponse(isCommand);
  await field(page, axis).press(key);
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await settled(page);
  const after = (await session(page)).projects[0].document;
  assertAxisOnly(before, after, id, axis);
  inputs.push({
    trigger: "Sizing number",
    id,
    axis,
    value,
    request: sizingRequest(response, before, id, axis),
    before,
    after,
    native: await native(page, id),
  });
  await exactHistory(page, before, after);
}

function sizingRequest(
  response: Response,
  before: DesignDocument,
  id: string,
  axis: Axis,
  choice: "Fixed" | "Fit" | "Fill" = "Fixed",
) {
  const request = parseCommand(response.request().postDataJSON());
  assert.equal(request.mutation.kind, "batch");
  if (request.mutation.kind !== "batch") throw new Error("Sizing must submit one atomic batch");
  for (const mutation of request.mutation.mutations) {
    assert.equal(mutation.kind, "style");
    if (mutation.kind !== "style") throw new Error("Sizing must edit CSS only");
    assert.equal(mutation.id, id);
    for (const property of [...Object.keys(mutation.values), ...(mutation.unset ?? [])])
      assert.ok(sizingProperties(before, id, axis, choice).includes(property));
  }
  return request;
}

function assertAxisOnly(
  before: DesignDocument,
  after: DesignDocument,
  id: string,
  axis: Axis,
  choice: "Fixed" | "Fit" | "Fill" = "Fixed",
) {
  assert.equal(after.revision, before.revision + 1);
  const restored = structuredClone(after);
  restored.nodes[id].style = before.nodes[id].style;
  assertContent(restored, before);
  const allowed = sizingProperties(before, id, axis, choice);
  const unrelated = (node: DesignNode) =>
    Object.fromEntries(
      Object.entries(node.style).filter(([property]) => !allowed.includes(property)),
    );
  assert.deepEqual(unrelated(before.nodes[id]), unrelated(after.nodes[id]));
}

function sizingProperties(
  before: DesignDocument,
  id: string,
  axis: Axis,
  choice: "Fixed" | "Fit" | "Fill",
) {
  const node = before.nodes[id];
  const parent = node.parentId ? before.nodes[node.parentId] : null;
  const flow =
    parent &&
    ["flex", "inline-flex"].includes(parent.style.display) &&
    !["absolute", "fixed"].includes(node.style.position);
  const main = flow ? (parent.style["flex-direction"] === "column" ? "height" : "width") : null;
  if (main === axis) return [axis, "flex-grow", "flex-shrink", "flex-basis"];
  return choice === "Fill" ? [axis, "align-self"] : [axis];
}

async function exactHistory(page: Page, before: DesignDocument, after: DesignDocument) {
  await history(page, "undo");
  assertContent((await session(page)).projects[0].document, before);
  await history(page, "redo");
  assertContent((await session(page)).projects[0].document, after);
}

function assertContent(actual: DesignDocument, expected: DesignDocument) {
  assert.deepEqual({ ...actual, revision: 0 }, { ...expected, revision: 0 });
}

async function reset(page: Page, id = "item", values: DesignNode["style"] = {}) {
  const document = (await session(page)).projects[0].document;
  await accepted(page, {
    kind: "batch",
    mutations: fixture().flatMap((node): AtomicMutation[] => [
      { kind: "style", id: node.id, values: {}, unset: Object.keys(document.nodes[node.id].style) },
      { kind: "style", id: node.id, values: { ...node.style, ...(node.id === id ? values : {}) } },
      ...(node.kind === "frame"
        ? [{ kind: "clip" as const, id: node.id, clipContent: node.clipContent }]
        : []),
    ]),
  });
  await select(page, "item");
}

async function patch(page: Page, id: string, values: DesignNode["style"]) {
  await accepted(page, { kind: "style", id, values });
}

async function noEdit(page: Page, action: () => Promise<void>) {
  const before = await session(page);
  let after;
  const requests: string[] = [];
  const record = (request: Request) => {
    if (new URL(request.url()).pathname === "/api/commands")
      requests.push(request.postData() ?? "");
  };
  page.on("request", record);
  try {
    await action();
    await settled(page);
    after = await session(page);
    assert.deepEqual(after, before);
    assert.deepEqual(requests, []);
    return { before, after, requests };
  } finally {
    page.off("request", record);
    inputs.push({ trigger: "No sizing edit", before, after, requests });
  }
}

function native(page: Page, id: string) {
  return page.locator(`.canvas-world [data-orc-id="${id}"]`).evaluate((element) => {
    const world = element.closest(".canvas-world");
    if (!world) throw new Error("Missing canvas world");
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: box.x / scale,
      y: box.y / scale,
      width: box.width / scale,
      height: box.height / scale,
      scale,
      cssWidth: style.width,
      cssHeight: style.height,
      overflow: style.overflow,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      widthPriority: element.style.getPropertyPriority("width"),
      heightPriority: element.style.getPropertyPriority("height"),
    };
  });
}

async function size(page: Page, id: string, axis: Axis, expected: number) {
  await page.waitForFunction(
    ({ id, axis, expected }) => {
      const element = document.querySelector(`.canvas-world [data-orc-id="${id}"]`);
      return (
        element !== null && Math.abs(parseFloat(getComputedStyle(element)[axis]) - expected) < 0.1
      );
    },
    { id, axis, expected },
  );
}

async function select(page: Page, id: string) {
  await settled(page);
  const document = (await session(page)).projects[0].document;
  const parents: string[] = [];
  let parent = document.nodes[id].parentId;
  while (parent) {
    parents.unshift(parent);
    parent = document.nodes[parent].parentId;
  }
  for (const ancestor of parents) {
    await page.locator(".layer-name").getByText(ancestor, { exact: true }).waitFor();
    const expand = page.getByRole("button", { name: `Expand ${ancestor}`, exact: true });
    if (await expand.count()) await expand.click();
  }
  await page.locator(".layer-name").getByText(id, { exact: true }).click();
  await settled(page);
}

async function command(page: Page, mutation: Mutation) {
  const document = (await session(page)).projects[0].document;
  return page.request.post("/api/commands", {
    data: {
      projectId: document.id,
      expectedRevision: document.revision,
      commandId: crypto.randomUUID(),
      mutation,
    },
  });
}

async function accepted(page: Page, mutation: Mutation) {
  const response = await command(page, mutation);
  assert.equal(response.status(), 200, await response.text());
  inputs.push({ mutation, status: response.status(), response: await response.json() });
  await settled(page);
}

async function history(page: Page, direction: "undo" | "redo") {
  const pending = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/history" && response.request().method() === "POST",
  );
  await page
    .getByRole("application", { name: "Canvas" })
    .press(direction === "undo" ? "Control+z" : "Control+Shift+z");
  assert.equal((await pending).status(), 200);
  await settled(page);
}

async function settled(page: Page) {
  const revision = (await session(page)).projects[0].document.revision;
  await page.waitForFunction(
    (value) =>
      document.querySelector(".canvas")?.getAttribute("data-orc-revision") === String(value),
    revision,
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}
function control(page: Page, axis: Axis) {
  return page.getByRole("combobox", {
    name: `${axis === "width" ? "Width" : "Height"} sizing`,
    exact: true,
  });
}
function field(page: Page, axis: Axis) {
  return page.getByLabel(axis === "width" ? "Width" : "Height", { exact: true });
}
async function modeLabel(page: Page, axis: Axis) {
  return control(page, axis).locator("option:checked").innerText();
}
function isCommand(response: Response) {
  return (
    new URL(response.url()).pathname === "/api/commands" && response.request().method() === "POST"
  );
}
function close(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 0.1, `Expected ${expected}, got ${actual}`);
}
function artifact(suffix: string) {
  return join("artifacts/editor", `sizing-${phase}-${suffix}`);
}

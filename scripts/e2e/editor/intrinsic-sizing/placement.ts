import assert from "node:assert/strict";
import { parseCommand } from "../../../../shared/commands/commands";
import { nodeSource } from "../../../../shared/source/html-source";
import type { DesignDocument } from "../../../../shared/document/model";
import { column, frame, layout, withPeer } from "./fixtures";
import { nextProject, saveReopen } from "./persistence";
import {
  accepted,
  choose,
  commands,
  exactHistory,
  extent,
  fillReadout,
  install,
  isCommand,
  node,
  select,
  session,
  sameDocument,
  settled,
  unchanged,
  type Suite,
} from "./support";

export async function placement(suite: Suite) {
  for (const sibling of [false, true]) {
    await prepare(suite, sibling);
    await cancel(suite);
    await complete(suite, false, sibling);
  }
  await prepare(suite, false);
  await complete(suite, true, false);
  await source(suite);
  const saved = await saveReopen(suite, "height", " placement");
  await accepted(suite, { kind: "style", id: "supplier", values: { height: "95px" } });
  await extent(suite.page, "leaf", "height", 95);
  await extent(suite.page, "destination", "height", 119);
  await nextProject(suite, saved.document.name);
  await priorities(suite);
  await fixedSupply(suite);
  await refusal(suite);
  await sharedDestination(suite);
  suite.checks.push(
    `${suite.mode}: shared Fill placement uses prospective sole membership; previews cancel exactly, commits/history/source/reopening preserve content; circular destinations refuse and independently supplied shared destinations succeed`,
  );
}

function fixtures(sibling: boolean, content = true) {
  const nodes = withPeer(column(content ? "descendant" : "none", true));
  nodes[0].style.height = "400px";
  nodes.push(
    frame("destination", null, sibling ? ["destination-supplier"] : [], {
      ...layout,
      "flex-direction": "column",
      position: "absolute",
      left: "400px",
      top: "80px",
      width: "180px",
      height: "max-content",
      padding: "10px",
      border: "2px solid black",
      gap: "8px",
    }),
  );
  if (sibling)
    nodes.push(
      frame("destination-supplier", "destination", [], {
        ...layout,
        width: "40px",
        height: "40px",
      }),
    );
  return nodes;
}

async function prepare(suite: Suite, sibling: boolean, content = true) {
  await install(suite, fixtures(sibling, content));
  await choose(suite, "leaf", "height", "Fill");
  await choose(suite, "peer", "height", "Fill", ["leaf", "peer"]);
  await select(suite.page, "leaf");
}

async function start(suite: Suite) {
  const leaf = await node(suite.page, "leaf").boundingBox();
  assert.ok(leaf);
  await suite.page.mouse.move(leaf.x + leaf.width - 8, leaf.y + 14);
  await suite.page.mouse.down();
  await settled(suite.page);
}

async function target(suite: Suite, cached = false) {
  const destination = await node(suite.page, "destination").boundingBox();
  assert.ok(destination);
  const position = { x: destination.x + 4, y: destination.y + 10 };
  if (cached) {
    await suite.page.mouse.move(position.x, position.y - 50);
    await settled(suite.page);
    assert.equal(await renderedParent(suite), null, "Intermediate preview leaves the source");
  }
  await suite.page.mouse.move(position.x, position.y);
  await settled(suite.page);
  assert.equal(
    await renderedParent(suite),
    "destination",
    "An independently supplied shared child becomes sole Fill in its destination",
  );
  if (cached) {
    await suite.page.mouse.move(position.x, position.y - 50);
    await settled(suite.page);
    await suite.page.mouse.move(position.x, position.y);
    await settled(suite.page);
    assert.equal(await renderedParent(suite), "destination", "Cached destination remains valid");
  }
}

function renderedParent(suite: Suite) {
  return node(suite.page, "leaf").evaluate((element) => {
    const parent = element.parentElement;
    return (
      (parent?.getAttribute("data-orc-flow") === "intrinsic-column-v1"
        ? parent.parentElement
        : parent
      )?.getAttribute("data-orc-id") ?? null
    );
  });
}

async function cancel(suite: Suite) {
  await unchanged(
    suite,
    "Intrinsic placement Escape restores source, geometry and history",
    async () => {
      await start(suite);
      await target(suite);
      await suite.page.keyboard.press("Escape");
      await suite.page.mouse.up();
    },
  );
}

async function complete(suite: Suite, cached: boolean, sibling: boolean) {
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    await start(suite);
    await target(suite, cached);
    assert.deepEqual((await session(suite.page)).projects[0].document, before);
    assert.deepEqual(observed.requests, [], "Preview submits no command");
    const pending = suite.page.waitForResponse(isCommand);
    await suite.page.mouse.up();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    const after = (await session(suite.page)).projects[0].document;
    assert.equal(observed.requests.length, 1, "One completed placement submits one command");
    const request = parseCommand(observed.requests[0]);
    assert.equal(request.mutation.kind, "batch");
    assert.equal(after.revision, before.revision + 1);
    assert.equal(after.nodes.leaf.parentId, "destination");
    assert.deepEqual(after.nodes.supplier, before.nodes.supplier);
    assert.deepEqual(after.nodes.root.children, ["peer"]);
    assert.deepEqual(after.nodes.root.style, before.nodes.root.style);
    retainedSource(before, after);
    await geometry(suite, sibling);
    await exactHistory(suite.page, before, after);
    await geometry(suite, sibling);
    await fillReadout(suite.page, "leaf", "height");
    suite.inputs.push({
      trigger: "Intrinsic pointer placement",
      cached,
      sibling,
      before,
      after,
      request,
    });
  } finally {
    observed.stop();
  }
}

async function geometry(suite: Suite, sibling: boolean) {
  await extent(suite.page, "leaf", "height", 60);
  await extent(suite.page, "supplier", "height", 60);
  await extent(suite.page, "peer", "height", 400);
  await extent(suite.page, "destination", "height", sibling ? 132 : 84);
  const style = (await session(suite.page)).projects[0].document.nodes.leaf.style;
  for (const [property, value] of Object.entries({
    height: "auto",
    "flex-grow": "1",
    "flex-shrink": "1",
    "flex-basis": "auto",
  }))
    assert.equal(style[property]?.replace(/\s*!important\s*$/u, ""), value);
  assert.equal(style["--orc-fill-basis"], undefined);
  assert.equal(style["--orc-fill-decoration"], undefined);
}

function retainedSource(before: DesignDocument, after: DesignDocument) {
  const restored = structuredClone(after);
  const placement = [
    "position",
    "width",
    "height",
    "align-self",
    "left",
    "right",
    "top",
    "bottom",
    "--orc-absolute-position",
  ];
  const sharing = [
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "--orc-fill-basis",
    "--orc-fill-decoration",
  ];
  for (const id of ["leaf", "peer"]) {
    const allowed = id === "leaf" ? [...placement, ...sharing] : sharing;
    const unrelated = (design: DesignDocument) =>
      Object.fromEntries(
        Object.entries(design.nodes[id].style).filter(([property]) => !allowed.includes(property)),
      );
    assert.deepEqual(unrelated(after), unrelated(before), `${id}: preserve unrelated CSS`);
    restored.nodes[id].style = before.nodes[id].style;
  }
  for (const id of ["root", "destination"]) restored.nodes[id].children = before.nodes[id].children;
  restored.nodes.leaf.parentId = before.nodes.leaf.parentId;
  assert.deepEqual(after.nodes.destination.children, [
    "leaf",
    ...before.nodes.destination.children,
  ]);
  sameDocument(restored, before);
}

async function priorities(suite: Suite) {
  await prepare(suite, false);
  const original = (await session(suite.page)).projects[0].document.nodes.leaf.style;
  const properties = ["height", "flex-grow", "flex-shrink", "flex-basis"];
  await accepted(suite, {
    kind: "style",
    id: "leaf",
    values: Object.fromEntries(
      properties.map((property) => [property, `${original[property]} !important`]),
    ),
  });
  await complete(suite, true, false);
  const result = (await session(suite.page)).projects[0].document.nodes.leaf.style;
  for (const property of properties) assert.match(result[property], /!important$/u);
  suite.inputs.push({ trigger: "Placement retains source declaration priority", original, result });
}

async function fixedSupply(suite: Suite) {
  const nodes = fixtures(false, false);
  const destination = nodes.find((node) => node.id === "destination");
  assert.ok(destination);
  destination.children.push("target-fill");
  nodes.push(targetFill("0px"));
  await install(suite, nodes);
  await select(suite.page, "leaf");
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    await start(suite);
    await target(suite, true);
    const pending = suite.page.waitForResponse(isCommand);
    await suite.page.mouse.up();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    const after = (await session(suite.page)).projects[0].document;
    assert.equal(observed.requests.length, 1);
    assert.equal(after.nodes.leaf.style.height, "80px");
    retainedSource(before, after);
    await extent(suite.page, "destination", "height", 112);
    await extent(suite.page, "leaf", "height", 80);
    await extent(suite.page, "target-fill", "height", 0);
    await exactHistory(suite.page, before, after);
    suite.inputs.push({
      trigger: "Retained Fixed incoming size supplies destination Fill",
      before,
      after,
      requests: observed.requests,
    });
  } finally {
    observed.stop();
  }
}

async function refusal(suite: Suite) {
  await prepare(suite, false, false);
  await unchanged(suite, "Refuse circular intrinsic destination", async () => {
    await start(suite);
    const box = await node(suite.page, "destination").boundingBox();
    assert.ok(box);
    await suite.page.mouse.move(box.x + 4, box.y + 10);
    await suite.page
      .locator(".workspace-notice")
      .filter({ hasText: "Set the parent's height first." })
      .waitFor();
    await suite.page.mouse.up();
  });
}

async function sharedDestination(suite: Suite) {
  await prepare(suite, false);
  await accepted(suite, { kind: "insert", nodes: [targetFill("40px")] });
  await select(suite.page, "leaf");
  const before = (await session(suite.page)).projects[0].document;
  const observed = commands(suite.page);
  try {
    await start(suite);
    await target(suite, true);
    const pending = suite.page.waitForResponse(isCommand);
    await suite.page.mouse.up();
    assert.equal((await pending).status(), 200);
    await settled(suite.page);
    assert.equal(observed.requests.length, 1);
    const after = (await session(suite.page)).projects[0].document;
    assert.equal(after.nodes.destination.style["--orc-intrinsic-column"], "1");
    assert.deepEqual(after.nodes.destination.children, ["leaf", "target-fill"]);
    await extent(suite.page, "destination", "height", 132);
    for (const id of ["leaf", "target-fill"]) await extent(suite.page, id, "height", 50);
    await exactHistory(suite.page, before, after);
    suite.inputs.push({
      trigger: "Shared intrinsic destination preserves pointer/history contract",
      before,
      after,
    });
  } finally {
    observed.stop();
  }
}

function targetFill(minimum: string) {
  return frame("target-fill", "destination", [], {
    ...layout,
    width: "40px",
    height: "auto",
    "min-height": minimum,
    "flex-grow": "1",
    "flex-shrink": "1",
    "flex-basis": "auto",
  });
}

async function source(suite: Suite) {
  const design = (await session(suite.page)).projects[0].document;
  const output = await suite.page.context().newPage();
  try {
    const html = nodeSource(design, "destination");
    await output.setContent(html);
    const sizes = await output.evaluate(() => {
      const root = document.querySelector('[layer-name="destination"]');
      const leaf = document.querySelector('[layer-name="leaf"]');
      const supplier = document.querySelector('[layer-name="supplier"]');
      if (!root || !leaf || !(supplier instanceof HTMLElement)) throw new Error("Missing source");
      const measure = () => [
        root.getBoundingClientRect().height,
        leaf.getBoundingClientRect().height,
      ];
      const before = measure();
      supplier.style.height = "95px";
      return { before, after: measure() };
    });
    assert.deepEqual(sizes, { before: [84, 60], after: [119, 95] });
    suite.inputs.push({ trigger: "Reparented intrinsic standalone source", html, sizes });
  } finally {
    await output.close();
  }
}

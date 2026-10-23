import assert from "node:assert/strict";
import { nodeSource } from "../../../../shared/source/html-source";
import { fixture, frame, layout } from "./fixtures";
import { nextProject, saveReopen } from "./persistence";
import {
  choose,
  control,
  edit,
  exactHistory,
  extent,
  fillReadout,
  install,
  isCommand,
  select,
  session,
  settled,
  unchanged,
  type Suite,
} from "./support";

export async function wrapped(suite: Suite) {
  for (const alignment of ["flex-start", "stretch"])
    for (const content of [false, true]) await row(suite, alignment, content);
  await install(suite, rows("flex-start", false));
  await choose(suite, "leaf", "height", "Fill");
  const saved = await saveReopen(suite, "height", " wrapped");
  await edit(suite, "root", "width", 100);
  await extent(suite.page, "root", "height", 68);
  await extent(suite.page, "leaf", "height", 0);
  await nextProject(suite, saved.document.name);
  suite.checks.push(
    `${suite.mode}: intrinsic wrapped Height Fill follows native row reflow, preserves valid empty rows and guards its last supplier; source and save/reopen stay responsive`,
  );
}

function rows(alignment: string, content: boolean) {
  const nodes = fixture({ axis: "height", relation: "cross", supply: "sibling" });
  Object.assign(nodes[0].style, {
    width: "160px",
    "flex-wrap": "wrap",
    "align-content": alignment,
  });
  nodes[2].style.width = "60px";
  if (content) {
    nodes[1].children.push("inside");
    nodes.push(frame("inside", "leaf", [], { ...layout, width: "20px", height: "40px" }));
  }
  return nodes;
}

async function row(suite: Suite, alignment: string, content: boolean) {
  await install(suite, rows(alignment, content));
  await select(suite.page, "leaf");
  assert.equal(
    await control(suite.page, "height")
      .getByRole("option", { name: "Fill", exact: true })
      .getAttribute("disabled"),
    null,
    "Independent participating content supplies the Fit-height wrapped Row",
  );
  await choose(suite, "leaf", "height", "Fill");
  await extent(suite.page, "root", "height", 60);
  await extent(suite.page, "leaf", "height", 60);
  await edit(suite, "root", "width", 100);
  await extent(suite.page, "root", "height", (content ? 40 : 0) + 68);
  await extent(suite.page, "leaf", "height", content ? 40 : 0);
  await fillReadout(suite.page, "leaf", "height");
  await edit(suite, "supplier", "height", 95);
  await extent(suite.page, "root", "height", (content ? 40 : 0) + 103);
  await extent(suite.page, "leaf", "height", content ? 40 : 0);
  await edit(suite, "root", "width", 160);
  await extent(suite.page, "root", "height", 95);
  await extent(suite.page, "leaf", "height", 95);
  await source(suite, content);
  await removeSupplier(suite, content);
  suite.inputs.push({ trigger: "Intrinsic wrapped row", alignment, content });
}

async function removeSupplier(suite: Suite, content: boolean) {
  await select(suite.page, "supplier");
  const action = () => suite.page.getByRole("application", { name: "Canvas" }).press("Delete");
  if (!content) {
    await unchanged(suite, "Removing the last wrapped intrinsic supplier refuses", async () => {
      await action();
      await suite.page
        .getByRole("alert")
        .filter({ hasText: "Set the parent's height first." })
        .waitFor();
    });
    return;
  }
  const before = (await session(suite.page)).projects[0].document;
  const pending = suite.page.waitForResponse(isCommand);
  await action();
  assert.equal((await pending).status(), 200);
  await settled(suite.page);
  await extent(suite.page, "root", "height", 40);
  await extent(suite.page, "leaf", "height", 40);
  await exactHistory(suite.page, before, (await session(suite.page)).projects[0].document);
}

async function source(suite: Suite, content: boolean) {
  const design = (await session(suite.page)).projects[0].document;
  const output = await suite.page.context().newPage();
  try {
    await output.setContent(nodeSource(design, "root"));
    const actual = await output.evaluate(() => {
      const root = document.querySelector('[layer-name="root"]');
      const leaf = document.querySelector('[layer-name="leaf"]');
      if (!(root instanceof HTMLElement) || !leaf) throw new Error("Missing source objects");
      const measure = () => [
        root.getBoundingClientRect().height,
        leaf.getBoundingClientRect().height,
      ];
      const wide = measure();
      root.style.width = "100px";
      return { wide, narrow: measure() };
    });
    assert.deepEqual(actual, {
      wide: [95, 95],
      narrow: [(content ? 40 : 0) + 103, content ? 40 : 0],
    });
  } finally {
    await output.close();
  }
}

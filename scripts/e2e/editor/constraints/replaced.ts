import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DesignNode } from "../../../../shared/document/model";
import { accepted, box, change, close, frame, patch, select, selectField } from "./support";

const {
  clipContent: _clip,
  mode: _mode,
  ...base
} = frame("image", "destination", {
  left: "20px",
  top: "20px",
  width: "80px",
  height: "40px",
  margin: "2px",
  border: "3px solid",
  padding: "4px",
  "box-sizing": "content-box",
});

export async function replacedConstraints(page: Page, checks: string[]) {
  const image: DesignNode = {
    ...base,
    kind: "image",
    attributes: {
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'/%3E",
      alt: "Constraints image",
    },
  };
  const svg: DesignNode = {
    ...base,
    id: "vector",
    name: "vector",
    kind: "svg",
    style: { ...base.style, top: "100px" },
    source:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" fill="teal" /></svg>',
  };
  const input: DesignNode = {
    ...base,
    id: "input",
    name: "input",
    kind: "element",
    tag: "input",
    attributes: { value: "Native input" },
  };
  await accepted(page, { kind: "insert", nodes: [image, svg, input] });
  for (const id of ["image", "vector", "input"]) await exercise(page, id);
  await select(page);
  checks.push(
    "Images, SVGs and native inputs retain Both-edge stretch, limits, Center and box-model behavior",
  );
}
async function exercise(page: Page, id: string) {
  await patch(page, "destination", { width: "260px", height: "240px" });
  await select(page, id);
  await unownedStretch(page, id);
  const before = await box(page, id);
  await change(page, "width", "both", undefined, id);
  await change(page, "height", "both", undefined, id);
  const same = await box(page, id);
  close(same.x, before.x);
  close(same.width, before.width);
  close(same.y, before.y);
  close(same.height, before.height);
  await patch(page, "destination", { width: "340px", height: "300px" });
  const expanded = await box(page, id);
  close(expanded.width, before.width + 80);
  close(expanded.height, before.height + 60);
  await limits(page, id, before);
  await change(page, "width", "center", undefined, id);
  await change(page, "height", "center", undefined, id);
  const centered = await box(page, id);
  await patch(page, id, { width: "110px", height: "70px" });
  const resized = await box(page, id);
  close(centered.x + centered.width / 2, resized.x + resized.width / 2);
  close(centered.y + centered.height / 2, resized.y + resized.height / 2);
  assert.equal(
    await page.getByLabel("Horizontal constraint", { exact: true }).inputValue(),
    "center",
  );
  await patch(page, "destination", { width: "260px", height: "240px" });
}

async function limits(page: Page, id: string, before: Awaited<ReturnType<typeof box>>) {
  await patch(page, id, { "min-width": "200px", "min-height": "120px" });
  await patch(page, "destination", { width: "10px", height: "10px" });
  const small = await box(page, id);
  close(small.x, before.x);
  close(small.y, before.y);
  close(small.width, 200 + before.width - 80);
  close(small.height, 120 + before.height - 40);
  await patch(page, id, {
    "min-width": "0px",
    "min-height": "0px",
    "max-width": "110px",
    "max-height": "70px",
  });
  await patch(page, "destination", { width: "800px", height: "800px" });
  const large = await box(page, id);
  close(large.x, before.x);
  close(large.y, before.y);
  close(large.width, 110 + before.width - 80);
  close(large.height, 70 + before.height - 40);
  await patch(page, id, { "max-width": "none", "max-height": "none" });
  await patch(page, "destination", { width: "340px", height: "300px" });
}

async function unownedStretch(page: Page, id: string) {
  for (const [axis, edge, size] of [
    ["width", "right", "80px"],
    ["height", "bottom", "40px"],
  ] as const) {
    await patch(page, id, { [axis]: "auto", [edge]: "20px" });
    assert.equal(await selectField(page, axis).isDisabled(), true);
    await patch(page, id, { [axis]: size, [edge]: "auto" });
    assert.equal(await selectField(page, axis).isEnabled(), true);
  }
}

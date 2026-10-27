import assert from "node:assert/strict";
import type { Page } from "playwright";
import { accepted, box, change, close, frame, patch, select, session, settled } from "./support";

const boundStyle = {
  position: "absolute",
  display: "flex",
  left: "30px",
  right: "auto",
  top: "20px",
  bottom: "auto",
  width: "160px",
  height: "120px",
  padding: "7px",
  border: "3px solid",
  translate: "none",
};

export async function constrainedFill(page: Page, checks: string[]) {
  const parent = {
    ...frame("bound-root", null, {
      left: "850px",
      top: "400px",
      width: "400px",
      height: "300px",
      display: "flex",
      "flex-direction": "row",
      "align-items": "flex-start",
    }),
    children: ["bound-frame"],
  };
  const child = {
    ...frame("bound-frame", "bound-root", { display: "flex" }),
    children: ["bound-leaf"],
  };
  const leaf = frame("bound-leaf", "bound-frame");
  await accepted(page, { kind: "insert", nodes: [parent, child, leaf] });
  for (const direction of ["row", "column"] as const)
    for (const axis of ["width", "height"] as const) await boundCase(page, direction, axis);
  await select(page);
  await accepted(page, { kind: "delete", ids: ["bound-root"] });
  checks.push(
    "Both-edge Row/Column frames preserve main/cross Fill through independent parent bounds and reject loss of the sole parent supply",
  );
}
async function boundCase(page: Page, direction: "row" | "column", axis: "width" | "height") {
  await prepare(page, direction, axis);
  await select(page, "bound-leaf");
  assert.equal(
    await page
      .getByLabel(axis === "width" ? "Width sizing" : "Height sizing", { exact: true })
      .inputValue(),
    "Fill",
  );
  await select(page, "bound-frame");
  const before = await box(page, "bound-leaf");
  await change(page, axis, "both", undefined, "bound-frame");
  close((await box(page, "bound-leaf"))[axis], before[axis]);
  await patch(page, "bound-root", { [axis]: axis === "width" ? "480px" : "380px" });
  close((await box(page, "bound-leaf"))[axis], before[axis] + 80);
  await unresolved(page, axis);
  await select(page, "bound-frame");
  await change(page, axis, "end", undefined, "bound-frame");
  const fixed = await box(page, "bound-leaf");
  await patch(page, "bound-root", { [axis]: axis === "width" ? "400px" : "300px" });
  close((await box(page, "bound-leaf"))[axis], fixed[axis]);
}
async function prepare(page: Page, direction: "row" | "column", axis: "width" | "height") {
  const main = (direction === "row") === (axis === "width");
  await accepted(page, {
    kind: "batch",
    mutations: [
      { kind: "style", id: "bound-root", values: { width: "400px", height: "300px" } },
      {
        kind: "style",
        id: "bound-frame",
        unset: direction === "row" ? ["--orc-intrinsic-column"] : [],
        values: {
          ...boundStyle,
          "flex-direction": direction,
          ...(direction === "column" ? { "--orc-intrinsic-column": "1" } : {}),
        },
      },
      {
        kind: "style",
        id: "bound-leaf",
        values: {
          position: "relative",
          left: "auto",
          right: "auto",
          top: "auto",
          bottom: "auto",
          width: axis === "width" ? "auto" : "20px",
          height: axis === "height" ? "auto" : "20px",
          flex: main ? "1 0 0px" : "0 0 auto",
          "align-self": "stretch",
        },
      },
    ],
  });
}
async function unresolved(page: Page, axis: "width" | "height") {
  await select(page, "bound-root");
  const before = (await session(page)).projects[0].document;
  await page
    .getByLabel(axis === "width" ? "Width sizing" : "Height sizing", { exact: true })
    .selectOption("Fit");
  await page
    .getByRole("alert")
    .filter({ hasText: /Fill|parent/u })
    .waitFor();
  await settled(page);
  assert.deepEqual((await session(page)).projects[0].document, before);
}

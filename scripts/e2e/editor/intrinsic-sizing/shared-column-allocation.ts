import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { Suite } from "./support";

export async function allocation(suite: Suite, ids: string[], world = ".canvas-world") {
  const measurement = await measure(suite.page, world);
  const growing = measurement.children.filter((child) => ids.includes(child.id));
  assert.equal(growing.length, ids.length);
  const siblings = measurement.children.filter((child) => !ids.includes(child.id));
  const budget =
    measurement.content -
    siblings.reduce((sum, child) => sum + child.size + child.before + child.after, 0) -
    measurement.gap * Math.max(0, measurement.children.length - 1) -
    growing.reduce((sum, child) => sum + child.before + child.after, 0);
  const expected = shares(budget, growing);
  growing.forEach((child, index) =>
    assert.ok(
      Math.abs(child.size - expected[index]) < 0.15,
      `${child.id}: outer height ${child.size}, constrained equal share ${expected[index]}, budget ${budget}`,
    ),
  );
  assertGaps(measurement);
  suite.inputs.push({
    trigger: "Shared Column native constrained allocation",
    ids,
    world,
    measurement,
    budget,
    expected,
  });
  return measurement;
}
function assertGaps(measurement: Awaited<ReturnType<typeof measure>>) {
  for (let index = 1; index < measurement.children.length; index++) {
    const previous = measurement.children[index - 1];
    const current = measurement.children[index];
    assert.ok(
      Math.abs(
        current.top -
          previous.top -
          previous.size -
          previous.after -
          current.before -
          measurement.gap,
      ) < 0.15,
      `${current.id}: authored gap and unequal margins`,
    );
  }
}
function shares(budget: number, children: { minimum: number; maximum: number }[]) {
  let low = 0;
  let high = Math.max(0, budget, ...children.map((child) => child.minimum));
  for (let step = 0; step < 64; step++) {
    const middle = (low + high) / 2;
    const total = children.reduce(
      (sum, child) => sum + Math.max(child.minimum, Math.min(child.maximum, middle)),
      0,
    );
    if (total > budget) high = middle;
    else low = middle;
  }
  return children.map((child) => Math.max(child.minimum, Math.min(child.maximum, low)));
}
async function measure(page: Page, world: string) {
  return page.locator(`${world} [data-orc-id="root"]`).evaluate((root) => {
    const parent = getComputedStyle(root);
    const host = root.closest(".canvas-world, .preview-world");
    const scale = host ? new DOMMatrix(getComputedStyle(host).transform).a : 1;
    const number = (value: string) => Number.parseFloat(value) || 0;
    const decoration = (style: CSSStyleDeclaration) =>
      ["padding-top", "padding-bottom", "border-top-width", "border-bottom-width"].reduce(
        (sum, property) => sum + number(style.getPropertyValue(property)),
        0,
      );
    const children = [...root.querySelectorAll("[data-orc-id]")].filter(
      (child) =>
        !["absolute", "fixed"].includes(getComputedStyle(child).position) &&
        getComputedStyle(child).display !== "none" &&
        child.parentElement?.closest("[data-orc-id]") === root,
    );
    return {
      content: root.getBoundingClientRect().height / scale - decoration(parent),
      gap: number(parent.rowGap),
      children: children.map((child) => {
        const style = getComputedStyle(child);
        const box = child.getBoundingClientRect();
        const extra = style.boxSizing === "content-box" ? decoration(style) : 0;
        return {
          id: child.getAttribute("data-orc-id") ?? "",
          size: box.height / scale,
          top: box.top / scale,
          before: number(style.marginTop),
          after: number(style.marginBottom),
          minimum: Math.max(decoration(style), number(style.minHeight) + extra),
          maximum:
            style.maxHeight === "none"
              ? Infinity
              : Math.max(number(style.minHeight) + extra, number(style.maxHeight) + extra),
        };
      }),
    };
  });
}

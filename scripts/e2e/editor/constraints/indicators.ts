import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  accepted,
  box,
  change,
  close,
  noEdit,
  patch,
  select,
  selectField,
  session,
  settled,
} from "./support";

export async function constraintIndicators(page: Page, checks: string[]) {
  await select(page);
  await change(page, "width", "end");
  await change(page, "height", "center");
  await verifyLines(page);
  await navigation(page);
  await change(page, "height", "center", () =>
    page.getByRole("button", { name: "Align vertical center", exact: true }).click(),
  );
  const center = page.locator('[data-constraint-line="height-center"] line');
  await page.waitForFunction(() => {
    const l = document.querySelector('[data-constraint-line="height-center"] line');
    return l && Math.abs(Number(l.getAttribute("y1")) - Number(l.getAttribute("y2"))) < 0.12;
  });
  assert.equal(await center.count(), 1);
  assert.equal(await page.locator('[data-constraint-line="height-center"] path').count(), 1);
  await noEdit(page, async () => {
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await page.getByRole("button", { name: "Exit Preview", exact: true }).waitFor();
    assert.equal(await page.locator(".constraint-indicators").count(), 0);
    await page.getByRole("button", { name: "Exit Preview", exact: true }).click();
    await verifyLines(page);
    const c = await page.locator(".canvas").boundingBox();
    assert.ok(c);
    await page.mouse.click(c.x + 15, c.y + 15);
    assert.equal(await page.locator(".constraint-indicators").count(), 0);
    await select(page);
  });
  await motion(page, checks);
  await scrolling(page);
  checks.push(
    "Dotted edge and Center markers follow selection, pan/zoom and native scrolling; Preview and selection create no document edits",
  );
}
async function verifyLines(page: Page) {
  await page.waitForFunction(
    () => document.querySelectorAll(".constraint-indicators line").length === 2,
  );
  const values = await page.locator(".constraint-indicators").evaluate((svg) => {
    const child = document.querySelector('.canvas-world [data-orc-id="child"]')!,
      parent = child.parentElement!,
      canvas = document.querySelector(".canvas")!;
    const b = child.getBoundingClientRect(),
      p = parent.getBoundingClientRect(),
      o = canvas.getBoundingClientRect();
    const scale = new DOMMatrix(getComputedStyle(child.closest(".canvas-world")!).transform).a;
    const lines = Array.from(svg.querySelectorAll("line")).map((l) => ({
      key: l.parentElement!.getAttribute("data-constraint-line"),
      x1: Number(l.getAttribute("x1")),
      x2: Number(l.getAttribute("x2")),
      y1: Number(l.getAttribute("y1")),
      y2: Number(l.getAttribute("y2")),
    }));
    return {
      lines,
      child: { right: b.right - o.x, y: b.y + b.height / 2 - o.y, x: b.x + b.width / 2 - o.x },
      parent: {
        right: p.left + (parent.clientLeft + parent.clientWidth) * scale - o.x,
        y: p.top + (parent.clientTop + parent.clientHeight / 2) * scale - o.y,
      },
    };
  });
  const width = values.lines.find((l) => l.key === "width-end")!,
    height = values.lines.find((l) => l.key === "height-center")!;
  close(width.x1, values.child.right);
  close(width.x2, values.parent.right);
  close(width.y1, values.child.y);
  close(height.x1, values.child.x);
  close(height.y1, values.child.y);
  close(height.y2, values.parent.y);
}
async function scrolling(page: Page) {
  await accepted(page, { kind: "clip", id: "parent", clipContent: true });
  await patch(page, "peer", { left: "700px", top: "600px" });
  await patch(page, "parent", { "scrollbar-gutter": "stable both-edges" });
  await noEdit(page, async () => {
    await page.locator('.canvas-world [data-orc-id="parent"]').evaluate((e) => {
      e.scrollLeft = 20;
      e.scrollTop = 15;
    });
    await settled(page);
    await verifyLines(page);
  });
  const before = await box(page);
  await change(page, "width", "start");
  const after = await box(page);
  close(after.x, before.x);
  await change(page, "width", "end");
  await page.locator('.canvas-world [data-orc-id="parent"]').evaluate((e) => {
    e.scrollLeft = 0;
    e.scrollTop = 0;
  });
  await patch(page, "peer", { left: "230px", top: "190px" });
  await patch(page, "parent", { "scrollbar-gutter": "auto" });
  await accepted(page, { kind: "clip", id: "parent", clipContent: false });
  assert.equal((await session(page)).projects[0].document.nodes.child.parentId, "parent");
  assert.equal(await selectField(page, "width").inputValue(), "end");
}

async function navigation(page: Page) {
  await noEdit(page, async () => {
    await page.locator(".canvas").hover();
    await page.mouse.wheel(0, 330);
    await settled(page);
    await verifyLines(page);
    await page.getByRole("button", { name: "Pan", exact: true }).click();
    const b = await page.locator(".canvas").boundingBox();
    assert.ok(b);
    await page.mouse.move(b.x + 40, b.y + 40);
    await page.mouse.down();
    await page.mouse.move(b.x + 70, b.y + 60, { steps: 5 });
    await page.mouse.up();
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await verifyLines(page);
  });
}

async function motion(page: Page, checks: string[]) {
  const old = (await session(page)).projects[0].document.nodes.child.style.right;
  await patch(page, "child", { transition: "right 600ms linear" });
  await patch(page, "child", {
    right: `${parseFloat(old) - 60}px${old.includes("!important") ? " !important" : ""}`,
  });
  await page.waitForFunction(() =>
    document
      .querySelector('.canvas-world [data-orc-id="child"]')
      ?.getAnimations()
      .some((a) => a.playState === "running"),
  );
  await page.getByLabel("X", { exact: true }).focus();
  const input = await page.getByLabel("X", { exact: true }).elementHandle();
  const samples = await page.evaluate(transitionSamples, input);
  assert.ok(Math.max(...samples.lines) < 3, JSON.stringify(samples));
  assert.ok(Math.max(...samples.positions) < 0.12, JSON.stringify(samples));
  checks.push(
    `Native position transition: ${samples.lines.length} frames, maximum line error ${Math.max(...samples.lines).toFixed(3)}px and position readout error ${Math.max(...samples.positions).toFixed(3)} document units`,
  );
  await patch(page, "child", { right: old, transition: "none" });
}

async function transitionSamples(input: HTMLElement | SVGElement | null) {
  if (!(input instanceof HTMLInputElement)) throw new Error("Missing X readout");
  const lines: number[] = [],
    positions: number[] = [];
  for (let i = 0; i < 12; i++) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (!input.isConnected || document.activeElement !== input)
      throw new Error("Position readout lost its input or keyboard focus.");
    const child = document.querySelector('.canvas-world [data-orc-id="child"]')!,
      parent = child.parentElement!,
      canvas = document.querySelector(".canvas")!,
      world = child.closest(".canvas-world")!,
      line = document.querySelector('[data-constraint-line="width-end"] line')!;
    const box = child.getBoundingClientRect(),
      origin = parent.getBoundingClientRect(),
      style = getComputedStyle(parent),
      scale = new DOMMatrix(getComputedStyle(world).transform).a;
    lines.push(
      Math.abs(Number(line.getAttribute("x1")) - (box.right - canvas.getBoundingClientRect().x)),
    );
    positions.push(
      Math.abs(
        Number(input.value) -
          ((box.x - origin.x) / scale - parseFloat(style.borderLeftWidth) + parent.scrollLeft),
      ),
    );
  }
  return { lines, positions };
}

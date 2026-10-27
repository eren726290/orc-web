import assert from "node:assert/strict";
import { runPenBrowserSuite } from "./browser-suite";
import { performanceFixture } from "./performance-fixture";
import { install, type Suite } from "../intrinsic-sizing/support";
import { documentFor, handlePoint } from "./support";
import type { Page } from "playwright";
import { writeFile } from "node:fs/promises";
import { object } from "../../../../shared/validation";

type Timings = {
  request: number[];
  preview: number[];
  solve: number[];
  cycle: number[];
  latency: number[];
};

await runPenBrowserSuite("performance", "PEN_PERFORMANCE_PASSED", async (suite) => {
  for (const count of [20, 402]) await measure(suite, count);
});

async function measure(suite: Suite, count: number) {
  const page = suite.page;
  const node = performanceFixture(count);
  await install(suite, [node]);
  await page.locator(".layer-name").getByText("Pen", { exact: true }).click();
  await observeWork(page);
  const before = await documentFor(page);
  const point = await handlePoint(page, 1);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.locator('.pen-anchor[aria-pressed="true"]').waitFor();
  const stop = await profile(suite, count);
  await probe(page, point);
  await stop();
  await page.keyboard.press("Escape");
  await page.mouse.up();
  assert.deepEqual(await documentFor(page), before, "Performance probing must cancel cleanly.");
  const raw = object(
    await page.evaluate(() => JSON.parse(document.body.dataset.penTimings ?? "{}")),
  );
  const data = {
    request: samples(raw.request),
    preview: samples(raw.preview),
    solve: samples(raw.solve),
    cycle: samples(raw.cycle),
    latency: samples(
      await page.evaluate(() => JSON.parse(document.body.dataset.penLatency ?? "[]")),
    ),
  };
  record(suite, node, data);
}

async function probe(page: Page, point: { x: number; y: number }) {
  let completed = 0;
  for (let step = 0; step < 240 && (step < 24 || completed < 12); step++) {
    await page.mouse.move(
      point.x + 10 + Math.sin(step / 3) * 6,
      point.y + 10 + Math.cos(step / 3) * 6,
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    completed = await page.evaluate(() => Number(document.body.dataset.penCycles));
  }
}

async function profile(suite: Suite, count: number) {
  if (process.env.ORC_PEN_PROFILE !== "1") return async () => {};
  const client = await suite.page.context().newCDPSession(suite.page);
  await client.send("Profiler.enable");
  await client.send("Profiler.start");
  return async () => {
    const result = await client.send("Profiler.stop");
    await writeFile(
      suite.artifact(`${suite.mode}-${count}.cpuprofile`),
      JSON.stringify(result.profile),
    );
    await client.detach();
  };
}

function record(suite: Suite, node: ReturnType<typeof performanceFixture>, data: Timings) {
  const count = node.pen.anchors.length;
  assert.ok(data.request.length >= 12, "Missing browser request work observations.");
  assert.ok(data.preview.length >= 12, "Missing complete native/overlay work observations.");
  assert.ok(data.solve.length >= 12, "Missing actual Worker numerical observations.");
  assert.ok(data.cycle.length >= 12, "Missing complete solve-to-native-preview observations.");
  assert.ok(data.latency.length >= 12);
  suite.inputs.push({
    mode: suite.mode,
    anchors: count,
    geometryPoints: count + node.pen.segments.filter((segment) => segment.kind === "arc").length,
    upstreamPoints:
      count + node.pen.segments.filter((segment) => segment.kind === "arc").length + 1,
    mainThreadRequestMs: summarize(data.request),
    mainThreadPreviewMs: summarize(data.preview),
    workerSolveMs: summarize(data.solve),
    solveToPreviewMs: summarize(data.cycle),
    pointerToSecondFrameMs: summarize(data.latency),
    raw: data,
  });
  suite.checks.push(
    `${suite.mode}: ${count}-anchor browser work, Worker solving, complete preview and pointer-to-frame observations; cancellation preserves applied state`,
  );
}

function samples(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0)
  )
    throw new Error("Invalid timing samples.");
  return value;
}

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    worst: sorted.at(-1),
  };
}

async function observeWork(page: Page) {
  await page.evaluate(() => {
    const cleanup: unknown = Reflect.get(window, Symbol.for("orc-pen-observer"));
    if (typeof cleanup === "function") cleanup();
    const data: Omit<Timings, "latency"> = { request: [], preview: [], solve: [], cycle: [] };
    document.body.dataset.penCycles = "0";
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        for (const key of ["request", "preview", "solve", "cycle"] as const)
          if (entry.name === `orc-pen-${key}`) data[key].push(entry.duration);
      }
      document.body.dataset.penCycles = String(data.cycle.length);
      document.body.dataset.penTimings = JSON.stringify(data);
    });
    observer.observe({ entryTypes: ["measure"] });
    Reflect.set(window, Symbol.for("orc-pen-observer"), () => observer.disconnect());
  });
  await page.evaluate(observeFrames);
}

function observeFrames() {
  const cleanup: unknown = Reflect.get(window, Symbol.for("orc-pen-frames"));
  if (typeof cleanup === "function") cleanup();
  const controller = new AbortController();
  const latency: number[] = [];
  document.body.dataset.penLatency = "[]";
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!(event.target instanceof Element) || !event.target.closest(".canvas")) return;
      const start = performance.now();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          latency.push(performance.now() - start);
          document.body.dataset.penLatency = JSON.stringify(latency);
        }),
      );
    },
    { signal: controller.signal },
  );
  Reflect.set(window, Symbol.for("orc-pen-frames"), () => controller.abort());
}

import assert from "node:assert/strict";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { renderer } from "../automatic-source-mapping/browser";
import { resolve, type Sources } from "../automatic-source-mapping/resolver";
import { clickSelection, diagnostic } from "../automatic-source-mapping/continuity/support";

// Run from the inherited experiment directory so its unchanged runtime path resolves.
const root = path.resolve("../base-ui-only-this");
const run = path.join(root, "runs", "baseline-" + new Date().toISOString().replace(/[:.]/g, "-"));
await mkdir(run, { recursive: true });
const sources: Sources = {};
for (const file of await readdir(path.join(root, "src"), { recursive: true })) {
  if (/\.tsx?$/.test(file))
    sources["src/" + file] = await readFile(path.join(root, "src", file), "utf8");
}
const browser = await chromium.launch({ channel: "chrome", headless: true });
const render = await renderer(browser, run);
const results: unknown[] = [];
let candidate: Awaited<ReturnType<typeof render.prepare>> | undefined;
async function check(name: string, operation: () => Promise<unknown>) {
  try {
    const evidence = await operation();
    results.push({ name, result: "PASS", evidence });
    console.log("PASS " + name);
  } catch (error) {
    results.push({ name, result: "FAIL", diagnostic: diagnostic(error) });
    console.error("FAIL " + name + "\n" + diagnostic(error));
    process.exitCode = 1;
  }
}
try {
  candidate = await render.prepare(sources, { "@/*": ["src/*"] }, "src/App.tsx");
  const { page, analysis } = candidate;
  await check(
    "Existing instrumentation preserves dialog open, Escape, and focus return",
    async () => {
      const trigger = page.getByRole("button", { name: "Open personal", exact: true });
      await trigger.click();
      await page.getByRole("dialog").waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert(await trigger.evaluate((el) => el === document.activeElement));
    },
  );
  await page.getByRole("button", { name: "Open personal", exact: true }).click();
  await check(
    "Existing discovery finds an instance-owned literal title inside the real dialog",
    async () => {
      const selection = await clickSelection(page, "Personal account");
      const owner = resolve(analysis, selection, "text");
      assert.equal(owner.kind, "prop");
      return { selection, owner };
    },
  );
  await check("Existing discovery finds the nested cross-file shared style owner", async () => {
    await page.getByText("Local account guidance 🌱", { exact: true }).click();
    const selection = await page.evaluate(
      () => Object.getOwnPropertyDescriptor(window, "__selection")?.value,
    );
    const owner = resolve(analysis, selection, "classes");
    assert.equal(owner.kind, "classes");
    return { selection, owner };
  });
  await page.screenshot({ path: path.join(run, "before.png"), fullPage: true });
  await check(
    "Existing renderer supplies the actual dialog's Tailwind position and padding",
    async () => {
      const style = await page.getByRole("dialog").evaluate((el) => ({
        position: getComputedStyle(el).position,
        padding: getComputedStyle(el).padding,
      }));
      assert.equal(style.position, "fixed");
      assert.equal(style.padding, "16px");
      return style;
    },
  );
} finally {
  await writeFile(
    path.join(run, "report.json"),
    JSON.stringify(
      {
        chrome: browser.version(),
        bun: Bun.version,
        results,
        missing: ["Only this has no implementation in the inherited experiment"],
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(run, "browser-diagnostics.json"),
    JSON.stringify(render.diagnostics, null, 2),
  );
  await writeFile(path.join(run, "sources.json"), JSON.stringify(sources, null, 2));
  await candidate?.context.close();
  await browser.close();
  render.close();
  console.log("BASELINE " + run);
}

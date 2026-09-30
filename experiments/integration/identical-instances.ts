import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { namedTypes as n } from "ast-types";
import { renderer } from "../automatic-source-mapping/browser";
import { session } from "../automatic-source-mapping/continuity/session";
import {
  clickSelection,
  diagnostic,
  environment,
} from "../automatic-source-mapping/continuity/support";
import { parse, resolve } from "../automatic-source-mapping/resolver";

const run = path.join(import.meta.dir, "runs", "initial-identical-" + Date.now());
await mkdir(run, { recursive: true });
const sources = {
  "src/App.tsx": `function Notice({ title }: { title: string }) {
  return <h1 className="text-4xl font-bold">{title}</h1>;
}
export default function App() {
  return <main><Notice title="Same heading" /><Notice title="Same heading" /></main>;
}
`,
};
const browser = await chromium.launch({ channel: "chrome", headless: true });
const render = await renderer(browser, path.join(run, "browser"), {
  runtime: path.resolve(import.meta.dir, "../automatic-source-mapping/runtime.tsx"),
});
const saved = path.join(run, "saved.json");
let active: Awaited<ReturnType<typeof session>> | undefined;
let result = "FAIL";
let failure: string | null = null;
const records: unknown[] = [];
try {
  active = await session({
    render,
    sources,
    aliases: {},
    entry: "src/App.tsx",
    saved,
    commandIdentity: true,
  });
  const s = active;
  records.push({ session: "initial", operations: s.records });
  await s.select(await clickSelection(s.page, s.page.locator("h1").nth(1)));
  const handle = s.handle;
  const initial = await s.record("second instance selected once");
  await writeFile(path.join(run, "before.tsx"), s.sources["src/App.tsx"]);
  await s.page.screenshot({ path: path.join(run, "before.png"), fullPage: true });
  // Preserve the actual editing-command failure when the initial owner cannot resolve.
  if (s.handle.selection && resolve(s.analysis, s.handle.selection, "text").kind === "unsupported")
    await s.change("text", "Attempt second instance edit");

  async function check(current: typeof s, expected: string, label: string, file = saved) {
    const record = await current.record(label);
    const persisted = JSON.parse(await readFile(file, "utf8"));
    assert.deepEqual(persisted.sources, current.sources);
    assert.deepEqual(persisted.selection, current.handle.selection);
    assert(current.handle.selection);
    const owner = resolve(current.analysis, current.handle.selection, "text");
    assert.equal(owner.kind, "prop");
    assert.equal(owner.scope, "This instance");
    const flags = await current.page.locator("h1").evaluateAll(
      (elements, selection) =>
        elements.map((el) => ({
          text: el.textContent,
          selected:
            el.getAttribute("data-orc-node") === selection.node &&
            el.getAttribute("data-orc-usage") === JSON.stringify(selection.usages) &&
            el.getAttribute("data-orc-record") === JSON.stringify(selection.record),
        })),
      current.handle.selection,
    );
    assert.deepEqual(flags, [
      { text: "Same heading", selected: false },
      { text: expected, selected: true },
    ]);
    assert.equal((await current.selectedView()).length, 1);
    const titles: string[] = [];
    const ast = parse(current.sources["src/App.tsx"]);
    for (const usages of current.analysis.usages.values())
      for (const usage of usages) {
        const attr = usage.node.openingElement.attributes?.find(
          (a) => n.JSXAttribute.check(a) && a.name.name === "title",
        );
        assert(n.JSXAttribute.check(attr));
        const value = n.JSXExpressionContainer.check(attr.value)
          ? attr.value.expression
          : attr.value;
        assert(n.StringLiteral.check(value));
        titles.push(value.value);
      }
    assert.deepEqual(titles, ["Same heading", expected]);
    assert(n.File.check(ast));
    assert.equal(record.view[0].size, "36px");
    assert.equal(record.view[0].weight, "700");
    return record;
  }
  await check(s, "Same heading", "initial identical owners");
  async function reopen(expected: string, next: string, name: string) {
    const persisted = JSON.parse(await readFile(saved, "utf8"));
    const reopened = await session({
      render,
      ...persisted,
      aliases: {},
      entry: "src/App.tsx",
      saved: path.join(run, name + ".json"),
      commandIdentity: true,
    });
    records.push({ session: name, operations: reopened.records });
    try {
      assert.deepEqual(reopened.handle.selection, s.handle.selection);
      await check(reopened, expected, name + " restored selection", path.join(run, name + ".json"));
      await reopened.change("text", next);
      await check(reopened, next, name + " edit without click", path.join(run, name + ".json"));
    } finally {
      await reopened.close();
    }
  }
  await reopen("Same heading", "Second after identical reopen 🌱", "identical-reopened");
  await s.change("text", "Second edit 🌱");
  const first = await check(s, "Second edit 🌱", "first edit");
  assert.equal(s.handle, handle);
  await s.change("text", "Second successive edit 🌱");
  const second = await check(s, "Second successive edit 🌱", "second edit without reselection");
  assert.equal(s.handle, handle);
  await s.undo();
  await check(s, "Second edit 🌱", "Undo second edit");
  assert.deepEqual(s.sources, first.sources);
  assert.deepEqual(s.handle.selection, first.selection);
  await s.undo();
  await check(s, "Same heading", "Undo restores identical pair");
  assert.deepEqual(s.sources, sources);
  assert.deepEqual(s.handle.selection, initial.selection);
  await reopen("Same heading", "Second after Undo reopen", "undo-identical-reopened");
  await s.redo();
  await check(s, "Second edit 🌱", "Redo first edit");
  await s.redo();
  await check(s, "Second successive edit 🌱", "Redo second edit");
  assert.deepEqual(s.sources, second.sources);
  assert.deepEqual(s.handle.selection, second.selection);
  await reopen("Second successive edit 🌱", "Second after edited reopen", "edited-reopened");
  await writeFile(path.join(run, "after.tsx"), s.sources["src/App.tsx"]);
  await writeFile(path.join(run, "edited-saved.json"), await readFile(saved, "utf8"));
  await s.page.screenshot({ path: path.join(run, "after.png"), fullPage: true });

  // A byte-changing source Apply has no command lineage for the selected initial occurrence.
  await s.sourceEdit(
    { "src/App.tsx": sources["src/App.tsx"] + "\n// External source replacement\n" },
    "uncertain external replacement",
  );
  assert.equal(s.handle.selection, null);
  const bytes = await readFile(saved, "utf8");
  await assert.rejects(() => s.change("text", "Wrong occurrence"));
  assert.equal(await readFile(saved, "utf8"), bytes);
  result = "PASS";
  console.log("IDENTICAL INSTANCES PASSED");
} catch (error) {
  failure = diagnostic(error);
  console.error(failure);
  process.exitCode = 1;
} finally {
  if (active) await active.close();
  render.close();
  await writeFile(
    path.join(run, "report.json"),
    JSON.stringify(
      {
        result,
        failure,
        environment: await environment(browser.version()),
        sources,
        records,
        diagnostics: render.diagnostics,
      },
      null,
      2,
    ),
  );
  await browser.close();
  console.log("RUN " + run);
}

import assert from "node:assert/strict";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page, type Locator } from "playwright";
import * as recast from "recast";
import { renderer } from "../automatic-source-mapping/browser";
import { session } from "../automatic-source-mapping/continuity/session";
import { diagnostic, environment } from "../automatic-source-mapping/continuity/support";
import {
  analyze,
  resolve,
  type Sources,
  type Selection,
} from "../automatic-source-mapping/resolver";
import { onlyThis } from "./only-this";
import { realStyles } from "./styles";

const root = path.dirname(fileURLToPath(import.meta.url));
const run = path.join(root, "runs", "chrome-" + new Date().toISOString().replace(/[:.]/g, "-"));
await mkdir(run, { recursive: true });
const aliases = { "@/*": ["src/*"] };
const sources: Sources = {};
for (const file of await readdir(path.join(root, "src"), { recursive: true }))
  if (/\.tsx?$/.test(file))
    sources["src/" + file] = await readFile(path.join(root, "src", file), "utf8");
await writeFile(path.join(run, "before.json"), JSON.stringify(sources, null, 2));
const results: { name: string; result: string; evidence?: unknown; diagnostic?: string }[] = [];
const records: unknown[] = [];
const diagnostics: unknown[] = [];
const cleanups: (() => Promise<unknown> | unknown)[] = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let activeTrigger = "Open personal";

async function check(name: string, operation: () => Promise<unknown>) {
  try {
    const evidence = await operation();
    results.push({ name, result: "PASS", evidence });
    console.log("PASS " + name);
  } catch (error) {
    const failure = diagnostic(error);
    results.push({ name, result: "FAIL", diagnostic: failure });
    console.error("FAIL " + name + "\n" + failure);
    throw error;
  }
}
async function selectionFromClick(page: Page, target: Locator): Promise<Selection> {
  await target.click();
  const value: unknown = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(window, "__selection")?.value,
  );
  assert(
    value && typeof value === "object" && "node" in value && "usages" in value && "record" in value,
  );
  assert(
    typeof value.node === "string" &&
      Array.isArray(value.usages) &&
      value.usages.every((item) => typeof item === "string"),
  );
  assert(
    value.record === null || typeof value.record === "string" || typeof value.record === "number",
  );
  return { node: value.node, usages: value.usages, record: value.record };
}
async function closeDialog(page: Page) {
  if (await page.getByRole("dialog").count()) {
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
}
async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => {})),
    );
  });
}
async function interactions(page: Page) {
  await closeDialog(page);
  const views = [];
  for (const name of ["Open personal", "Open team"]) {
    const trigger = page.getByRole("button", { name, exact: true });
    for (const closing of ["Escape", "Done", "Close"]) {
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await settle(page);
      const view = await dialog.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          title: el.querySelector("h2")?.textContent,
          position: style.position,
          padding: style.padding,
          radius: style.borderRadius,
          width: style.width,
          background: style.backgroundColor,
        };
      });
      assert.equal(view.position, "fixed");
      assert.equal(view.padding, "16px");
      assert.equal(view.radius, "12px");
      assert.equal(view.width, "384px");
      if (closing === "Escape") await page.keyboard.press("Escape");
      else await dialog.getByRole("button", { name: closing, exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      assert(
        await trigger.evaluate((el) => el === document.activeElement),
        "Focus must return to the opening trigger",
      );
      views.push({ name, closing, view });
    }
  }
  await page.getByRole("button", { name: activeTrigger, exact: true }).click();
  await settle(page);
  return views;
}
async function pairView(page: Page) {
  const output = [];
  for (const name of ["Open personal", "Open team"]) {
    await closeDialog(page);
    await page.getByRole("button", { name, exact: true }).click();
    output.push(
      await page.getByRole("dialog").evaluate((el) => {
        const heading = el.querySelector("h2 span");
        const note = el.querySelector("p[data-orc-node]");
        assertElement(heading);
        assertElement(note);
        function assertElement(value: Element | null): asserts value is Element {
          if (!value) throw new Error("Expected authored dialog content");
        }
        return {
          title: heading.textContent,
          headingSize: getComputedStyle(heading).fontSize,
          note: note.textContent,
          noteSize: getComputedStyle(note).fontSize,
          noteWeight: getComputedStyle(note).fontWeight,
        };
      }),
    );
  }
  await closeDialog(page);
  await page.getByRole("button", { name: activeTrigger, exact: true }).click();
  await settle(page);
  return output;
}
async function makeSession(
  render: Awaited<ReturnType<typeof renderer>>,
  input: Sources,
  name: string,
) {
  const saved = path.join(run, name + "-saved.json");
  const state = await session({ render, sources: input, aliases, entry: "src/App.tsx", saved });
  cleanups.push(() => state.close());
  records.push({ name, operations: state.records });
  return { state, saved };
}
async function checkpoint(state: Awaited<ReturnType<typeof session>>, saved: string) {
  return {
    sources: state.sources,
    file: await readFile(saved, "utf8"),
    undo: state.undoCount,
    redo: state.redoCount,
    revision: state.revision,
    selection: state.handle.selection,
    view: await state.selectedView(),
    dialog: await state.page.getByRole("dialog").textContent(),
  };
}

try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const options = {
    runtime: path.resolve(root, "../automatic-source-mapping/runtime.tsx"),
    styles: realStyles,
  };
  const raw = await renderer(browser, path.join(run, "raw"), { ...options, instrumented: false });
  const mapped = await renderer(browser, path.join(run, "mapped"), options);
  const render = await renderer(browser, path.join(run, "commands"), {
    ...options,
    // Browser test activation only: fresh candidate contexts remount closed dialogs.
    // It opens the trigger; it never clicks content or replaces a selection token.
    activate: async (page) => {
      await page.getByRole("button", { name: activeTrigger, exact: true }).click();
      await page.getByRole("dialog").waitFor();
    },
  });
  for (const item of [raw, mapped, render]) {
    cleanups.push(() => item.close());
    diagnostics.push(item.diagnostics);
  }
  const rawCandidate = await raw.prepare(sources, aliases, "src/App.tsx");
  const mappedCandidate = await mapped.prepare(sources, aliases, "src/App.tsx");
  cleanups.push(
    () => rawCandidate.context.close(),
    () => mappedCandidate.context.close(),
  );
  await check(
    "Raw and instrumented Base UI dialogs have identical styling, open/close/Escape and focus return",
    async () => {
      assert.equal(await rawCandidate.page.locator("[data-orc-node]").count(), 0);
      const rawViews = await interactions(rawCandidate.page);
      const mappedViews = await interactions(mappedCandidate.page);
      // Compare actual user-visible text too; popup styles alone miss printer artifacts.
      const rawText = await rawCandidate.page.locator("body").innerText();
      const mappedText = await mappedCandidate.page.locator("body").innerText();
      await rawCandidate.page.screenshot({
        path: path.join(run, "raw-control.png"),
        fullPage: true,
      });
      await mappedCandidate.page.screenshot({
        path: path.join(run, "instrumented-control.png"),
        fullPage: true,
      });
      await writeFile(
        path.join(run, "control-dom.json"),
        JSON.stringify({ rawText, mappedText }, null, 2),
      );
      assert.equal(
        mappedText,
        rawText,
        "Instrumentation must preserve all visible text without printer artifacts",
      );
      assert.deepEqual(mappedViews, rawViews);
      await mappedCandidate.page.screenshot({ path: path.join(run, "before.png"), fullPage: true });
      return { rawViews, mappedViews };
    },
  );

  const title = await makeSession(render, sources, "title");
  await check(
    "Click discovers a literal instance prop; text edit changes only that usage",
    async () => {
      await title.state.select(
        await selectionFromClick(
          title.state.page,
          title.state.page
            .getByRole("heading", { name: "Personal account", exact: true })
            .locator("span"),
        ),
      );
      const owner = resolve(title.state.analysis, title.state.handle.selection!, "text");
      assert.equal(owner.kind, "prop");
      assert.equal(owner.scope, "This instance");
      await title.state.change("text", 'Personal "ORC" & <teams> {together} 🌱');
      const view = await pairView(title.state.page);
      assert.deepEqual(
        view.map((item) => item.title),
        ['Personal "ORC" & <teams> {together} 🌱', "Team account"],
      );
      assert(
        title.state.sources["src/App.tsx"].includes('Personal \\"ORC\\"') ||
          title.state.sources["src/App.tsx"].includes('Personal "ORC"'),
      );
      assert.equal(title.state.sources["src/AccountDialog.tsx"], sources["src/AccountDialog.tsx"]);
      return { owner, view };
    },
  );
  await check(
    "Shared implementation typography edits both instances and reports shared scope",
    async () => {
      const owner = resolve(title.state.analysis, title.state.handle.selection!, "classes");
      assert.equal(owner.kind, "classes");
      assert.match(owner.scope, /^Every /);
      await title.state.change("classes", { from: "text-xl", to: "text-2xl" });
      const view = await pairView(title.state.page);
      assert.deepEqual(
        view.map((item) => item.headingSize),
        ["24px", "24px"],
      );
      assert.equal(
        title.state.sources["src/components/ui/dialog.tsx"],
        sources["src/components/ui/dialog.tsx"],
      );
      return { owner, view };
    },
  );
  await check(
    "Package internals and computed local shadcn classes refuse instead of guessing",
    async () => {
      const page = title.state.page;
      const close = page.getByRole("dialog").getByRole("button", { name: "Close", exact: true });
      assert.equal(await close.getAttribute("data-orc-node"), null);
      const header = page.locator('[data-slot="dialog-header"]');
      const selection = await selectionFromClick(page, header);
      const owner = resolve(title.state.analysis, selection, "classes");
      assert.equal(owner.kind, "unsupported");
      assert.equal(owner.scope, "Edit source");
      const before = await checkpoint(title.state, title.saved);
      const { edit } = await import("../automatic-source-mapping/resolver");
      assert.throws(
        () =>
          edit(analyze(title.state.sources, aliases), owner, {
            from: "font-medium",
            to: "font-bold",
          }),
        /Edit source/,
      );
      assert.deepEqual(await checkpoint(title.state, title.saved), before);
      // Safely mapped title remains usable through the existing stored handle.
      await title.state.change("classes", { from: "font-bold", to: "font-medium" });
      return {
        owner,
        boundary:
          "Local literal child values are mapped; package internals and cn/spread values are not",
      };
    },
  );

  // Collision fixtures are browser test inputs, not resolver tables or authored editor IDs.
  const collisionSources = {
    ...sources,
    "src/AccountDialog.tsx":
      sources["src/AccountDialog.tsx"] +
      '\nconst AccountDialogIndependent = "reserved outer name";\n',
    "src/Detail.tsx":
      sources["src/Detail.tsx"] + '\nconst DetailIndependent = "reserved nested name";\n',
    "src/App.tsx":
      sources["src/App.tsx"] + '\nconst AccountDialogIndependent = "reserved caller name";\n',
  };
  const copy = await makeSession(render, collisionSources, "copy");
  let boundary: ReturnType<typeof onlyThis> | undefined;
  let copiedSources: Sources | undefined;
  let copiedView: Awaited<ReturnType<typeof pairView>> | undefined;
  await check(
    "Only this discovers and copies outer plus cross-file style owner, preserves props/imports and avoids collisions",
    async () => {
      await copy.state.select(
        await selectionFromClick(
          copy.state.page,
          copy.state.page.getByText("Local account guidance 🌱", { exact: true }),
        ),
      );
      const original = copy.state.handle.selection!;
      const owner = resolve(copy.state.analysis, original, "classes");
      assert.equal(owner.kind, "classes");
      assert.equal(owner.file, "src/Detail.tsx");
      const shadowed = {
        ...copy.state.sources,
        "src/AccountDialog.tsx": copy.state.sources["src/AccountDialog.tsx"].replace(
          "{ title, trigger }",
          "{ title, trigger, Note }",
        ),
      };
      assert.throws(
        () => onlyThis(shadowed, aliases, original, { from: "font-bold", to: "font-medium" }),
        /parameter shadows a component import/,
      );
      boundary = onlyThis(copy.state.sources, aliases, original, {
        from: "font-bold",
        to: "font-medium",
      });
      assert.equal(boundary.copied.length, 2);
      assert.deepEqual(
        boundary.copied.map((item) => item.from),
        ["src/AccountDialog.tsx::AccountDialog", "src/Detail.tsx::Detail"],
      );
      assert(boundary.copied.every((item) => item.to.endsWith("Independent2")));
      const analysis = analyze(boundary.sources, aliases);
      const copiedOuter = boundary.copied[0].to;
      const copiedDetail = boundary.copied[1].to;
      for (const item of boundary.copied) {
        const [file, name] = item.from.split("::");
        const original = copy.state.analysis.modules.get(file)?.functions.get(name);
        const retained = analysis.modules.get(file)?.functions.get(name);
        assert(original && retained);
        assert.equal(recast.print(retained.node).code, recast.print(original.node).code);
      }
      assert(analysis.modules.get("src/AccountDialog.tsx")?.imports.has("Note"));
      assert(
        [...analysis.modules.get("src/AccountDialog.tsx")!.imports.values()].includes(copiedDetail),
      );
      // Outer-only copying would still use Note -> original Detail and leave the edited style shared.
      assert.equal(
        copy.state.analysis.modules.get("src/AccountDialog.tsx")?.imports.get("Note"),
        owner.file + "::Detail",
      );
      const before = copy.state.undoCount;
      await copy.state.applyCopiedChange(boundary, "Only this and nested style edit");
      assert.equal(copy.state.undoCount, before + 1);
      assert(copy.state.handle.selection);
      const redirected = [...copy.state.analysis.usages.values()]
        .flat()
        .filter((item) => item.file === "src/App.tsx");
      assert.equal(redirected.filter((item) => item.target === copiedOuter).length, 1);
      assert.equal(
        redirected.filter((item) => item.target === "src/AccountDialog.tsx::AccountDialog").length,
        1,
      );
      for (const file of [
        "src/components/ui/dialog.tsx",
        "src/components/ui/button.tsx",
        "src/UnsafeAccountDialog.tsx",
        "src/UnsafeDetail.tsx",
      ])
        assert.equal(copy.state.sources[file], collisionSources[file]);
      copiedSources = copy.state.sources;
      copiedView = await pairView(copy.state.page);
      assert.deepEqual(
        copiedView.map((item) => item.title),
        ["Personal account", "Team account"],
      );
      assert.deepEqual(
        copiedView.map((item) => item.noteWeight),
        ["500", "700"],
      );
      await copy.state.page.screenshot({ path: path.join(run, "after.png"), fullPage: true });
      await writeFile(path.join(run, "after.json"), JSON.stringify(copiedSources, null, 2));
      return {
        owner,
        selection: original,
        boundary: boundary.copied,
        view: copiedView,
        shared: [
          "Original definitions",
          "CLI dialog/button source",
          "CSS tokens",
          "Base UI and utility packages",
        ],
      };
    },
  );
  await check(
    "Copy plus edit is one Undo step; Undo and Redo restore references, source, selection and appearance",
    async () => {
      assert(boundary && copiedSources && copiedView);
      const selection = copy.state.handle.selection;
      await copy.state.undo();
      assert.deepEqual(copy.state.sources, collisionSources);
      assert(copy.state.handle.selection);
      assert.deepEqual(
        (await pairView(copy.state.page)).map((item) => item.noteWeight),
        ["700", "700"],
      );
      assert.equal(copy.state.undoCount, 0);
      assert.equal(copy.state.redoCount, 1);
      await copy.state.redo();
      assert.deepEqual(copy.state.sources, copiedSources);
      assert.deepEqual(copy.state.handle.selection, selection);
      assert.deepEqual(await pairView(copy.state.page), copiedView);
      assert.deepEqual(
        (await copy.state.selectedView()).map((item) => item.weight),
        ["500"],
      );
    },
  );
  await check(
    "Save/reopen rebuilds independent and shared instances; normal dialog interaction still works",
    async () => {
      const saved = JSON.parse(await readFile(copy.saved, "utf8"));
      assert.deepEqual(saved.sources, copiedSources);
      const candidate = await render.prepare(saved.sources, aliases, "src/App.tsx");
      try {
        assert.deepEqual(await pairView(candidate.page), copiedView);
        assert.notEqual(
          resolve(candidate.analysis, saved.selection, "classes").kind,
          "unsupported",
        );
        await interactions(candidate.page);
        await candidate.page.screenshot({ path: path.join(run, "reopened.png"), fullPage: true });
        await writeFile(path.join(run, "reopened.json"), JSON.stringify(saved.sources, null, 2));
      } finally {
        await candidate.context.close();
      }
      await interactions(copy.state.page);
    },
  );
  await check(
    "Parse, build and synchronous render failures reject candidates without partial source/save/history changes",
    async () => {
      for (const kind of ["parse", "build", "render"]) {
        const before = await checkpoint(copy.state, copy.saved);
        const next = { ...copy.state.sources };
        if (kind === "parse") next["src/App.tsx"] += "\nconst = ;";
        if (kind === "build")
          next["src/App.tsx"] = 'import "./missing-module";\n' + next["src/App.tsx"];
        if (kind === "render")
          next["src/App.tsx"] = next["src/App.tsx"].replace(
            "export default function App() {",
            'export default function App() { throw new Error("synchronous candidate crash");',
          );
        await assert.rejects(() => copy.state.sourceEdit(next, "Rejected " + kind));
        assert.deepEqual(await checkpoint(copy.state, copy.saved), before);
      }
      await interactions(copy.state.page);
    },
  );
  activeTrigger = "Open unsupported";
  const unsafe = await makeSession(render, sources, "unsupported");
  await check(
    "Captured module binding refuses Only this before commit and preserves source/render/save/history",
    async () => {
      await unsafe.state.select(
        await selectionFromClick(
          unsafe.state.page,
          unsafe.state.page.getByText("Cannot copy this safely from module state", { exact: true }),
        ),
      );
      const before = await checkpoint(unsafe.state, unsafe.saved);
      let reason = "";
      assert.throws(() => {
        try {
          onlyThis(unsafe.state.sources, aliases, unsafe.state.handle.selection!, {
            from: "font-bold",
            to: "font-medium",
          });
        } catch (error) {
          reason = diagnostic(error);
          throw error;
        }
      }, /captures module binding suffix/);
      assert.deepEqual(await checkpoint(unsafe.state, unsafe.saved), before);
      return { reason };
    },
  );
  console.log("ALL " + results.length + " CHECKS PASSED");
} catch (error) {
  process.exitCode = 1;
  if (!results.some((item) => item.result === "FAIL"))
    results.push({ name: "Setup", result: "FAIL", diagnostic: diagnostic(error) });
  console.error(diagnostic(error));
} finally {
  await writeFile(
    path.join(run, "report.json"),
    JSON.stringify(
      {
        environment: await environment(browser?.version() ?? "launch failed"),
        results,
        records,
        limitations: [
          "Direct JSX functions and direct named import edges only",
          "Fresh candidate contexts remount dialogs; browser test activation reopens a trigger without reselecting content",
          "No package-internal, computed-class, arbitrary closure/re-export/module-graph copying",
          "No later async failure or arbitrary side-effect safety claim",
        ],
      },
      null,
      2,
    ),
  );
  await writeFile(path.join(run, "browser-diagnostics.json"), JSON.stringify(diagnostics, null, 2));
  for (const cleanup of cleanups.reverse()) await cleanup();
  await browser?.close();
  console.log("RUN " + run);
}

import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";
import { renderer } from "../automatic-source-mapping/browser";
import { session } from "../automatic-source-mapping/continuity/session";
import {
  clickSelection,
  headings,
  diagnostic,
  environment,
} from "../automatic-source-mapping/continuity/support";
import { parse, resolve, type Sources } from "../automatic-source-mapping/resolver";
import { realStyles } from "../base-ui-only-this/styles";
import { onlyThis } from "../base-ui-only-this/only-this";

const baseline = process.argv.includes("--baseline");
const root = path.resolve(import.meta.dir, "../..");
const run = path.join(
  import.meta.dir,
  "runs",
  (baseline ? "baseline-" : "yellow-") + new Date().toISOString().replace(/[:.]/g, "-"),
);
await mkdir(run, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results: unknown[] = [];
const records: unknown[] = [];
const diagnostics: unknown[] = [];
async function test(name: string, action: () => Promise<unknown>) {
  try {
    results.push({ name, result: "PASS", evidence: await action() });
    console.log("PASS " + name);
  } catch (error) {
    results.push({ name, result: "FAIL", diagnostic: diagnostic(error) });
    console.error("FAIL " + name + "\n" + diagnostic(error));
    process.exitCode = 1;
  }
}
const aliases = { "@/*": ["src/*"] };
const dialogSources: Sources = {};
for (const file of await readdir(path.join(root, "experiments/base-ui-only-this/src"), {
  recursive: true,
}))
  if (/\.tsx?$/.test(file))
    dialogSources["src/" + file] = await readFile(
      path.join(root, "experiments/base-ui-only-this/src", file),
      "utf8",
    );
function cloneElement(node: n.JSXElement): n.JSXElement {
  const statement = parse("const copy = (" + recast.print(node).code + ");").program.body[0];
  assert(n.VariableDeclaration.check(statement));
  const declaration = statement.declarations[0];
  assert(n.VariableDeclarator.check(declaration));
  assert(n.JSXElement.check(declaration.init));
  return declaration.init;
}
async function settled(page: import("playwright").Page) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
  });
}
try {
  await test("Revealed dialog stays visible through supported edits without candidate trigger clicks", async () => {
    const render = await renderer(browser, path.join(run, "revealed"), {
      runtime: path.join(root, "experiments/automatic-source-mapping/runtime.tsx"),
      styles: realStyles,
    });
    diagnostics.push(render.diagnostics);
    const saved = path.join(run, "revealed-saved.json");
    const s = await session({
      render,
      sources: dialogSources,
      aliases,
      entry: "src/App.tsx",
      saved,
    });
    records.push({ name: "revealed", operations: s.records });
    try {
      await s.page.getByRole("button", { name: "Open personal", exact: true }).click();
      await s.select(
        await clickSelection(
          s.page,
          s.page.getByRole("heading", { name: "Personal account", exact: true }).locator("span"),
        ),
      );
      if (!baseline) {
        const source = structuredClone(s.sources);
        const history = s.undoCount;
        const revision = s.revision;
        await s.showContent();
        assert.deepEqual(s.sources, source);
        assert.equal(s.undoCount, history);
        assert.equal(s.revision, revision);
      }
      const handle = s.handle;
      for (const command of [
        { field: "text", value: "Visible while editing 🌱" },
        { field: "classes", value: { from: "text-xl", to: "text-2xl" } },
        { field: "classes", value: { from: "font-bold", to: "font-medium" } },
      ] as const) {
        await s.change(command.field, command.value);
        assert.equal(s.handle, handle);
        assert.equal(
          await s.page.getByRole("dialog").count(),
          1,
          "Revealed content must remain visible after candidate remount",
        );
        assert(s.handle.selection);
        assert.equal((await s.selectedView()).length, 1);
      }
      const selected = await s.selectedView();
      assert.equal(selected[0].text, "Visible while editing 🌱");
      assert.equal(selected[0].size, "24px");
      assert.equal(selected[0].weight, "500");
      const persisted = JSON.parse(await readFile(saved, "utf8"));
      const reopened = await session({
        render,
        ...persisted,
        aliases,
        entry: "src/App.tsx",
        saved: path.join(run, "revealed-reopened.json"),
      });
      try {
        assert.equal(await reopened.page.getByRole("dialog").count(), 1);
        assert.deepEqual(await reopened.selectedView(), selected);
      } finally {
        await reopened.close();
      }
      await settled(s.page);
      await s.page.screenshot({ path: path.join(run, "revealed-after.png"), fullPage: true });
      const beforeSource = s.sources;
      const rev = s.revision;
      const undo = s.undoCount;
      await s.hideContent();
      assert.equal(await s.page.getByRole("dialog").count(), 0);
      assert.deepEqual(s.sources, beforeSource);
      assert.equal(s.revision, rev);
      assert.equal(s.undoCount, undo);
      const trigger = s.page.getByRole("button", { name: "Open personal", exact: true });
      await trigger.click();
      await s.page.getByRole("dialog").waitFor();
      await s.page.keyboard.press("Escape");
      await s.page.getByRole("dialog").waitFor({ state: "hidden" });
      assert(await trigger.evaluate((el) => el === document.activeElement));
      await s.showContent();
      assert.equal(await s.page.getByRole("dialog").count(), 1);
      assert(
        Object.values(s.sources).every(
          (source) => !source.includes("open={true}") && !source.includes("__ORC"),
        ),
      );
      return {
        view: await s.selectedView(),
        retained: "Show content target and selected source owner",
        reset: "Uncontrolled component state remounts",
        sourceDefault: "unchanged",
      };
    } finally {
      await s.close();
      render.close();
    }
  });
  for (const [variant, entry, text, peer] of [
    ["basic", "src/App.tsx", "First instance", "Second instance"],
    ["variation", "src/Landing.tsx", "Beta instance", "Alpha instance"],
  ]) {
    await test(
      variant + " command-created identical usages retain the selected instance",
      async () => {
        const inputRoot = path.join(root, "experiments/automatic-source-mapping/fixtures", variant);
        const sources: Sources = {};
        for (const file of await readdir(inputRoot, { recursive: true }))
          if (/\.tsx?$/.test(file)) {
            const ast = parse(await readFile(path.join(inputRoot, file), "utf8"));
            recast.types.visit(ast, {
              visitJSXAttribute(p) {
                if (n.StringLiteral.check(p.node.value))
                  p.node.value = b.jsxExpressionContainer(b.stringLiteral(p.node.value.value));
                this.traverse(p);
              },
            });
            sources[file] = recast.print(ast).code;
          }
        const render = await renderer(browser, path.join(run, variant), {
          runtime: path.join(root, "experiments/automatic-source-mapping/runtime.tsx"),
        });
        diagnostics.push(render.diagnostics);
        const saved = path.join(run, variant + "-saved.json");
        const s = await session({
          render,
          sources,
          aliases,
          entry,
          saved,
          commandIdentity: !baseline,
        });
        records.push({ name: variant, operations: s.records });
        try {
          await s.select(await clickSelection(s.page, text));
          const original = await s.record("initial");
          const handle = s.handle;
          await s.change("text", peer);
          assert(
            s.handle.selection,
            "Command-owned edit must retain particular usage when its syntax becomes identical",
          );
          assert.equal(s.handle, handle);
          assert.equal(resolve(s.analysis, s.handle.selection, "text").kind, "prop");
          const collisionSaved = JSON.parse(await readFile(saved, "utf8"));
          const collisionReopened = await session({
            render,
            ...collisionSaved,
            aliases,
            entry,
            saved: path.join(run, variant + "-identical-reopened.json"),
            commandIdentity: true,
          });
          try {
            assert.deepEqual(collisionReopened.handle.selection, s.handle.selection);
            assert.equal((await collisionReopened.selectedView()).length, 1);
            await collisionReopened.change("text", "Edited after reopening identical usages");
            assert.equal(
              (await headings(collisionReopened.page)).filter((item) => item.text === peer).length,
              1,
            );
          } finally {
            await collisionReopened.close();
          }

          await s.change("text", "Same selected copy after collision 🌱");
          const view = await headings(s.page);
          assert.equal(
            view.filter((item) => item.text === "Same selected copy after collision 🌱").length,
            1,
          );
          assert.equal(view.filter((item) => item.text === peer).length, 1);
          await s.undo();
          assert(s.handle.selection);
          await s.undo();
          assert.deepEqual(s.sources, sources);
          assert.deepEqual(s.handle.selection, original.selection);
          await s.redo();
          assert(s.handle.selection);
          await s.redo();
          assert.equal((await s.selectedView())[0].text, "Same selected copy after collision 🌱");
          const persisted = JSON.parse(await readFile(saved, "utf8"));
          const reopened = await session({
            render,
            ...persisted,
            aliases,
            entry,
            saved: path.join(run, variant + "-reopened.json"),
            commandIdentity: true,
          });
          try {
            assert.deepEqual(reopened.handle.selection, s.handle.selection);
            await reopened.change("text", "Reopened selected copy");
            assert.equal(
              (await headings(reopened.page)).filter((item) => item.text === peer).length,
              1,
            );
          } finally {
            await reopened.close();
          }
          // Arbitrary replacement gets no command lineage. Duplicate the selected host explicitly.
          const host = s.analysis.hosts.get(s.handle.selection!.node)?.[0];
          assert(host);
          const ast = parse(s.sources[host.file]);
          let replaced = false;
          recast.types.visit(ast, {
            visitJSXElement(p) {
              if (recast.print(p.node).code === recast.print(host.node).code) {
                p.replace(
                  b.jsxFragment(b.jsxOpeningFragment(), b.jsxClosingFragment(), [
                    p.node,
                    cloneElement(p.node),
                  ]),
                );
                replaced = true;
                return false;
              }
              this.traverse(p);
            },
          });
          assert(replaced);
          await s.sourceEdit(
            { ...s.sources, [host.file]: recast.print(ast).code },
            "uncertain external duplication",
          );
          assert.equal(s.handle.selection, null);
          const bytes = await readFile(saved, "utf8");
          await assert.rejects(() => s.change("text", "wrong copy"));
          assert.equal(await readFile(saved, "utf8"), bytes);
          return { view, externalReplacement: "invalidated safely" };
        } finally {
          await s.close();
          render.close();
        }
      },
    );
  }
  await test("Only this then successive edit, Undo/Redo and reopen preserve selected independent relationship", async () => {
    const render = await renderer(browser, path.join(run, "copy"), {
      runtime: path.join(root, "experiments/automatic-source-mapping/runtime.tsx"),
      styles: realStyles,
      ...(baseline
        ? {
            activate: async (page: import("playwright").Page) => {
              await page.getByRole("button", { name: "Open personal", exact: true }).click();
            },
          }
        : {}),
    });
    diagnostics.push(render.diagnostics);
    const saved = path.join(run, "copy-saved.json");
    const s = await session({
      render,
      sources: dialogSources,
      aliases,
      entry: "src/App.tsx",
      saved,
    });
    records.push({ name: "copy", operations: s.records });
    try {
      if (!baseline)
        await s.page.getByRole("button", { name: "Open personal", exact: true }).click();
      await s.select(
        await clickSelection(
          s.page,
          s.page.getByText("Local account guidance 🌱", { exact: true }),
        ),
      );
      if (!baseline) await s.showContent();
      const original = await s.record("before copy");
      const handle = s.handle;
      const copied = onlyThis(s.sources, aliases, s.handle.selection!, {
        from: "font-bold",
        to: "font-medium",
      });
      await s.applyCopiedChange(copied, "Only this");
      assert.equal(s.handle, handle);
      assert(s.handle.selection);
      assert.equal((await s.selectedView())[0].weight, "500");
      assert.equal(s.undoCount, 1);
      const copiedSelection = structuredClone(s.handle.selection);
      const copiedSource = structuredClone(s.sources);
      await s.change("text", "Independent guidance after copying 🌱");
      assert.equal(s.handle, handle);
      assert.equal((await s.selectedView())[0].text, "Independent guidance after copying 🌱");
      assert.equal(s.sources["src/Detail.tsx"].includes(">Local account guidance 🌱</p>"), true);
      assert.equal(s.undoCount, 2);
      const edited = await s.record("after successive independent edit");
      await s.undo();
      assert.deepEqual(s.sources, copiedSource);
      assert.deepEqual(s.handle.selection, copiedSelection);
      await s.undo();
      assert.deepEqual(s.sources, dialogSources);
      assert.deepEqual(s.handle.selection, original.selection);
      assert.equal((await s.selectedView())[0].weight, "700");
      await s.redo();
      assert.deepEqual(s.handle.selection, copiedSelection);
      await s.redo();
      assert.deepEqual(s.sources, edited.sources);
      assert.deepEqual(s.handle.selection, edited.selection);
      const persisted = JSON.parse(await readFile(saved, "utf8"));
      const reopened = await session({
        render,
        ...persisted,
        aliases,
        entry: "src/App.tsx",
        saved: path.join(run, "copy-reopened.json"),
      });
      try {
        assert.deepEqual(reopened.handle.selection, s.handle.selection);
        assert.equal(
          (await reopened.selectedView())[0].text,
          "Independent guidance after copying 🌱",
        );
        if (!baseline) await reopened.hideContent();
        await reopened.page.getByRole("button", { name: "Open team", exact: true }).click();
        assert.equal(
          await reopened.page.getByText("Local account guidance 🌱", { exact: true }).count(),
          1,
        );
        assert.equal(
          await reopened.page
            .getByText("Independent guidance after copying 🌱", { exact: true })
            .count(),
          0,
        );
      } finally {
        await reopened.close();
      }
      await settled(s.page);
      await s.page.screenshot({ path: path.join(run, "copy-after.png"), fullPage: true });
      return { boundary: copied.copied, selected: s.handle.selection, state: edited };
    } finally {
      await s.close();
      render.close();
    }
  });
} finally {
  await writeFile(
    path.join(run, "report.json"),
    JSON.stringify(
      {
        baseline,
        environment: await environment(browser.version()),
        results,
        records,
        diagnostics,
      },
      null,
      2,
    ),
  );
  await browser.close();
  console.log("RUN " + run);
}

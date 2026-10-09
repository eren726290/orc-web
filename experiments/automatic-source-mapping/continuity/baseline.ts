import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as recast from "recast";
import { namedTypes as n } from "ast-types";
import { chromium } from "playwright";
import { analyze, resolve, edit, parse } from "../resolver";
import { renderer } from "../browser";
import { variants, fixture, clickSelection, headings, diagnostic, environment } from "./support";

const run = path.resolve(
  "runs",
  "continuity-baseline-" + new Date().toISOString().replace(/[:.]/g, "-"),
);
await mkdir(run, { recursive: true });
console.log("RUN " + run);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const render = await renderer(browser, run);
const results: { variant: string; scenario: string; result: string; diagnostic?: string }[] = [];
const records: unknown[] = [];
try {
  for (const config of variants) {
    for (const kind of ["literal", "instance", "collection", "style-only"]) {
      const input = await fixture(config.name);
      let sources = input.sources;
      let current = await render.prepare(sources, input.aliases, config.entry);
      const output = path.join(run, config.name + "-" + kind);
      await mkdir(output, { recursive: true });
      try {
        const selection = await clickSelection(
          current.page,
          kind === "collection"
            ? config.item
            : kind === "instance"
              ? config.instance
              : config.literal,
        );
        // Deliberately hold the exact click token. No reselection or token replacement.
        function record(label: string) {
          const owners = {
            text: resolve(current.analysis, selection, "text"),
            classes: resolve(current.analysis, selection, "classes"),
          };
          records.push({ variant: config.name, scenario: kind, label, selection, owners, sources });
          return owners;
        }
        const initial = record("one browser click");
        assert.notEqual(initial.text.kind, "unsupported");
        await current.page.screenshot({ path: path.join(output, "before.png"), fullPage: true });
        async function change(
          field: "text" | "classes",
          value: string | { from: string; to: string },
        ) {
          const analysis = analyze(sources, input.aliases);
          const owner = resolve(analysis, selection, field);
          const next = edit(analysis, owner, value);
          const candidate = await render.prepare(next, input.aliases, config.entry);
          await current.context.close();
          current = candidate;
          sources = next;
        }
        if (kind === "style-only") await change("classes", { from: "text-4xl", to: "text-5xl" });
        else await change("text", "Selected once 🌱");
        const after = record("after first edit, exact original token");
        await current.page.screenshot({
          path: path.join(output, "after-first-edit.png"),
          fullPage: true,
        });
        await writeFile(
          path.join(output, "view.json"),
          JSON.stringify(await headings(current.page), null, 2),
        );
        assert.equal(
          after.text.kind,
          initial.text.kind,
          "Retained selection must still resolve its text owner after first edit",
        );
        assert.equal(
          after.classes.kind,
          "classes",
          "Retained selection must still resolve typography after first edit",
        );
        if (kind === "collection") {
          const owner = after.text;
          assert(owner.kind === "collection");
          const ast = parse(sources[owner.file]);
          recast.types.visit(ast, {
            visitVariableDeclarator(p) {
              if (
                n.Identifier.check(p.node.id) &&
                p.node.id.name === owner.list &&
                n.ArrayExpression.check(p.node.init)
              )
                p.node.init.elements.reverse();
              this.traverse(p);
            },
          });
          sources = { ...sources, [owner.file]: recast.print(ast).code };
          const candidate = await render.prepare(sources, input.aliases, config.entry);
          await current.context.close();
          current = candidate;
          const reordered = record("after data reorder");
          assert.deepEqual(reordered.text, owner);
          await change("text", "Same key after reorder");
          record("after second record edit");
          assert.equal(
            await current.page.getByRole("heading", { level: 3 }).first().textContent(),
            "Same key after reorder",
          );
        } else {
          await change(
            "classes",
            kind === "style-only"
              ? { from: "font-bold", to: "font-medium" }
              : { from: "text-4xl", to: "text-5xl" },
          );
          record("after second edit");
        }
        results.push({ variant: config.name, scenario: kind, result: "PASS" });
        console.log("PASS " + config.name + " " + kind);
      } catch (error) {
        results.push({
          variant: config.name,
          scenario: kind,
          result: "FAIL",
          diagnostic: diagnostic(error),
        });
        console.error("FAIL " + config.name + " " + kind + "\n" + diagnostic(error));
        process.exitCode = 1;
      } finally {
        await current.context.close();
      }
    }
  }
} finally {
  await writeFile(
    path.join(run, "report.json"),
    JSON.stringify(
      {
        inheritedCommit: "2663a28aff8325e67e15a399ca321a365e1d9e18",
        environment: await environment(browser.version()),
        command: "bun continuity/baseline.ts",
        missing: ["Persistent selection transport", "Redo"],
        results,
      },
      null,
      2,
    ),
  );
  await writeFile(path.join(run, "records.json"), JSON.stringify(records, null, 2));
  await writeFile(
    path.join(run, "browser-diagnostics.json"),
    JSON.stringify(render.diagnostics, null, 2),
  );
  await browser.close();
  render.close();
  console.log(
    "BASELINE " +
      results.filter((r) => r.result === "PASS").length +
      " passed, " +
      results.filter((r) => r.result === "FAIL").length +
      " failed",
  );
}

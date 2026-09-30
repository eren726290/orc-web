import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";
import { chromium } from "playwright";
import { analyze, resolve, parse, type Analysis, type Owner } from "../resolver";
import { renderer } from "../browser";
import { session } from "./session";
import { variants, fixture, clickSelection, headings, diagnostic, environment } from "./support";

const run = path.resolve(
  "runs",
  "continuity-final-" + new Date().toISOString().replace(/[:.]/g, "-"),
);
await mkdir(run, { recursive: true });
console.log("RUN " + run);
const browser = await chromium
  .launch({ channel: "chrome", headless: true })
  .catch(async (error) => {
    await writeFile(
      path.join(run, "setup-failure.json"),
      JSON.stringify(
        {
          status: "BLOCKED_SETUP",
          command: "bun continuity/proof.ts",
          diagnostic: diagnostic(error),
          environment: await environment(
            execFileSync("/usr/bin/google-chrome-stable", ["--version"], {
              encoding: "utf8",
            }).trim(),
          ),
          results: [],
        },
        null,
        2,
      ),
    );
    throw error;
  });
const render = await renderer(browser, run);
const results: { variant: string; scenario: string; result: string; diagnostic?: string }[] = [];
const records: unknown[] = [];

function string(node: unknown): string {
  if (n.StringLiteral.check(node) || n.JSXText.check(node)) return node.value.trim();
  if (n.JSXExpressionContainer.check(node)) return string(node.expression);
  throw new Error("Expected literal source value");
}
function property(node: n.ObjectExpression, name: string) {
  return node.properties.find(
    (p) => n.ObjectProperty.check(p) && n.Identifier.check(p.key) && p.key.name === name,
  );
}
function ownerValue(analysis: Analysis, owner: Owner): string {
  if (owner.kind === "literal" || owner.kind === "classes") {
    const host = analysis.hosts.get(owner.host)?.[0];
    assert(host);
    if (owner.kind === "literal")
      return string(
        host.node.children.find((child) => !n.JSXText.check(child) || child.value.trim()),
      );
    const attr = host.node.openingElement.attributes?.find(
      (a) => n.JSXAttribute.check(a) && a.name.name === "className",
    );
    assert(n.JSXAttribute.check(attr));
    return string(attr.value);
  }
  if (owner.kind === "prop") {
    const site = analysis.usages.get(owner.site)?.[0];
    assert(site);
    const attr = site.node.openingElement.attributes?.find(
      (a) => n.JSXAttribute.check(a) && a.name.name === owner.property,
    );
    assert(n.JSXAttribute.check(attr));
    return string(attr.value);
  }
  if (owner.kind === "collection") {
    const array = analysis.modules.get(owner.file)?.arrays.get(owner.list);
    assert(array);
    const record = array.elements.find((item) => {
      if (!n.ObjectExpression.check(item)) return false;
      const key = property(item, owner.key);
      return (
        n.ObjectProperty.check(key) &&
        (n.StringLiteral.check(key.value) || n.NumericLiteral.check(key.value)) &&
        key.value.value === owner.record
      );
    });
    assert(n.ObjectExpression.check(record));
    const value = property(record, owner.property);
    assert(n.ObjectProperty.check(value));
    return string(value.value);
  }
  throw new Error("Unsupported source owner");
}

try {
  for (const config of variants) {
    for (const kind of [
      "literal",
      "instance",
      "collection",
      "delete",
      "ambiguous",
      "collision",
      "rejected-candidate",
    ]) {
      const input = await fixture(config.name);
      if (kind === "collision") {
        // Additional ordinary source variation: expression-wrapped literal usage props.
        for (const [file, source] of Object.entries(input.sources)) {
          const ast = parse(source);
          recast.types.visit(ast, {
            visitJSXElement(p) {
              if (
                n.JSXIdentifier.check(p.node.openingElement.name) &&
                /^[A-Z]/.test(p.node.openingElement.name.name)
              ) {
                for (const attr of p.node.openingElement.attributes ?? []) {
                  if (n.JSXAttribute.check(attr) && n.StringLiteral.check(attr.value))
                    attr.value = b.jsxExpressionContainer(b.stringLiteral(attr.value.value));
                }
              }
              this.traverse(p);
            },
          });
          input.sources[file] = recast.print(ast).code;
        }
      }
      const output = path.join(run, config.name + "-" + kind);
      await mkdir(output, { recursive: true });
      const saved = path.join(output, "saved.json");
      const s = await session({ render, ...input, entry: config.entry, saved });
      const retainedHandle = s.handle;
      let clicks = 0;
      try {
        // The only browser lookup/click used to acquire selection in this entire scenario.
        const token = await clickSelection(
          s.page,
          kind === "collection"
            ? config.item
            : kind === "instance" || kind === "collision"
              ? config.instance
              : config.literal,
        );
        clicks++;
        await s.select(token);
        const beforeView = await headings(s.page);
        await s.page.screenshot({ path: path.join(output, "before.png"), fullPage: true });
        async function check(label: string, invalid = false) {
          assert.equal(s.handle, retainedHandle);
          assert.equal(clicks, 1);
          const row = await s.record(label);
          const persisted = JSON.parse(await readFile(saved, "utf8"));
          assert.deepEqual(persisted.sources, s.sources);
          assert.deepEqual(persisted.selection, s.handle.selection);
          assert.equal(persisted.revision, s.revision);
          assert.deepEqual(
            await s.page.evaluate(
              () => Object.getOwnPropertyDescriptor(window, "__selection")?.value,
            ),
            s.handle.selection,
          );
          assert(
            Object.values(s.sources).every(
              (source) => !source.includes("data-orc-") && !source.includes("__ORC"),
            ),
          );
          if (invalid) {
            assert.equal(s.handle.selection, null);
            assert.match(s.handle.reason ?? "", /invalidated/);
            assert.deepEqual(row.view, []);
          } else {
            assert(row.owners);
            assert.notEqual(row.owners.text.kind, "unsupported");
            assert.notEqual(row.owners.classes.kind, "unsupported");
            assert.equal(row.view.length, 1);
            assert.equal(row.view[0].text, ownerValue(s.analysis, row.owners.text));
            assert.equal(row.view[0].classes, ownerValue(s.analysis, row.owners.classes));
            if (kind === "collection") {
              assert.equal(row.owners.text.kind, "collection");
              if (row.owners.text.kind === "collection")
                assert.equal(row.owners.text.record, config.key);
              assert.equal(s.handle.selection?.record, config.key);
            }
          }
          return {
            sources: structuredClone(s.sources),
            selection: structuredClone(s.handle.selection),
            view: await headings(s.page),
          };
        }
        const initial = await check("initial one-click selection");
        const states = [initial];
        async function change(
          field: "text" | "classes",
          value: string | { from: string; to: string },
        ) {
          await s.change(field, value);
          states.push(await check("verified " + field));
        }
        if (["literal", "instance"].includes(kind)) {
          await change("text", 'One retained selection "ORC" & <safe> {literal} 🌱');
          const afterText = await headings(s.page);
          assert.equal(afterText.filter((row, i) => row.text !== beforeView[i].text).length, 1);
          assert.equal((await s.selectedView())[0].size, "36px");
          await change("classes", { from: "text-4xl", to: "text-5xl" });
          assert.equal((await s.selectedView())[0].size, "48px");
          await change("classes", { from: "font-bold", to: "font-medium" });
          assert.equal((await s.selectedView())[0].weight, "500");
          const row = await s.record("scope assertions");
          assert(row.owners);
          assert.equal(
            row.owners.text.scope,
            kind === "instance" ? "This instance" : "This element",
          );
          if (kind === "instance") {
            assert.match(row.owners.classes.scope, /^Every .+ instance$/);
            const view = await headings(s.page);
            assert.equal(view[1].size, "48px");
            assert.equal(view[2].size, "48px");
            assert.equal(view[1].weight, "500");
            assert.equal(view[2].weight, "500");
            assert.equal(view[2].text, beforeView[2].text);
            assert.deepEqual(
              view.filter((_, i) => i !== 1 && i !== 2),
              beforeView.filter((_, i) => i !== 1 && i !== 2),
            );
          } else assert.deepEqual((await headings(s.page)).slice(1), beforeView.slice(1));
        } else if (kind === "collection") {
          await change("text", "Edited record once 🌱");
          const row = await s.record("record before reorder");
          assert(row.owners?.text.kind === "collection");
          const owner = row.owners.text;
          const ast = parse(s.sources[owner.file]);
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
          await s.sourceEdit(
            { ...s.sources, [owner.file]: recast.print(ast).code },
            "reverse keyed data",
          );
          states.push(await check("same key after reorder"));
          await change("text", "Edited same record again");
          assert.equal((await s.selectedView())[0].text, "Edited same record again");
          const view = await headings(s.page);
          assert.deepEqual(view.slice(0, 5), beforeView.slice(0, 5));
          assert.deepEqual(view.slice(7), beforeView.slice(7));
          assert.equal(view[6].text, beforeView[5].text);
        } else if (kind === "delete" || kind === "ambiguous") {
          const active = s.handle.selection;
          assert(active);
          const analysis = analyze(s.sources, input.aliases);
          const host = analysis.hosts.get(active.node)?.[0];
          assert(host);
          const module = analysis.modules.get(host.file);
          assert(module);
          let changes = 0;
          recast.types.visit(module.ast, {
            visitJSXElement(p) {
              if (p.node === host.node) {
                changes++;
                if (kind === "delete") p.prune();
                else {
                  const statement = parse("const duplicate = (" + recast.print(p.node).code + ");")
                    .program.body[0];
                  assert(n.VariableDeclaration.check(statement));
                  const declaration = statement.declarations[0];
                  assert(
                    n.VariableDeclarator.check(declaration) && n.JSXElement.check(declaration.init),
                  );
                  p.replace(
                    b.jsxFragment(b.jsxOpeningFragment(), b.jsxClosingFragment(), [
                      p.node,
                      declaration.init,
                    ]),
                  );
                }
                return false;
              }
              this.traverse(p);
            },
          });
          assert.equal(changes, 1);
          await s.sourceEdit({ ...s.sources, [host.file]: recast.print(module.ast).code }, kind);
          await check("invalidated by " + kind, true);
          const beforeRejected = await readFile(saved, "utf8");
          await assert.rejects(
            () => s.change("text", "must not target sibling"),
            /Selection invalidated/,
          );
          assert.equal(await readFile(saved, "utf8"), beforeRejected);
          await s.undo();
          const restored = await check("Undo restores element and its prior selection");
          assert.deepEqual(restored, initial);
          await s.redo();
          await check("Redo invalidates again", true);
          await s.undo();
          await check("Undo restores again");
          await change("classes", { from: "font-bold", to: "font-medium" });
          assert.equal(s.redoCount, 0, "New edit clears Redo");
        } else if (kind === "collision") {
          // A known value edit can also make two usages structurally identical.
          const active = s.handle.selection;
          assert(active);
          const analysis = analyze(s.sources, input.aliases);
          const host = analysis.hosts.get(active.node)?.[0];
          assert(host);
          const owner = resolve(analysis, active, "text");
          assert(owner.kind === "prop");
          const peer = [...analysis.usages.values()]
            .flat()
            .find((site) => site.target === host.component && site.id !== owner.site);
          assert(peer);
          const attribute = peer.node.openingElement.attributes?.find(
            (attr) => n.JSXAttribute.check(attr) && attr.name.name === owner.property,
          );
          assert(n.JSXAttribute.check(attribute));
          await s.change("text", string(attribute.value));
          await check("command-created identical usages invalidate selection", true);
          await s.undo();
          assert.deepEqual(await check("Undo collision restores particular usage"), initial);
        } else {
          const before = await check("before rejected candidates");
          const savedBefore = await readFile(saved, "utf8");
          const histories = [s.undoCount, s.redoCount, s.revision];
          await assert.rejects(
            () =>
              s.sourceEdit(
                { ...s.sources, [config.entry]: s.sources[config.entry] + "\nconst = ;" },
                "malformed TSX",
              ),
            /Unexpected/,
          );
          const ast = parse(s.sources[config.entry]);
          const active = s.handle.selection;
          assert(active);
          const component = s.analysis.hosts.get(active.node)?.[0].component;
          assert(component);
          recast.types.visit(ast, {
            visitFunctionDeclaration(p) {
              if (p.node.id?.name === component.split("::")[1])
                p.node.body.body.unshift(
                  b.throwStatement(
                    b.newExpression(b.identifier("Error"), [
                      b.stringLiteral("continuity candidate crash"),
                    ]),
                  ),
                );
              this.traverse(p);
            },
          });
          await assert.rejects(
            () =>
              s.sourceEdit(
                { ...s.sources, [config.entry]: recast.print(ast).code },
                "crashing candidate",
              ),
            /continuity candidate crash/,
          );
          assert.deepEqual(await check("after rejected candidates"), before);
          assert.equal(await readFile(saved, "utf8"), savedBefore);
          assert.deepEqual([s.undoCount, s.redoCount, s.revision], histories);
          await change("text", "Selection usable after rejection");
        }
        if (["literal", "instance", "collection"].includes(kind)) {
          for (let i = states.length - 2; i >= 0; i--) {
            await s.undo();
            assert.deepEqual(await check("Undo properties"), states[i]);
          }
          for (let i = 1; i < states.length; i++) {
            await s.redo();
            assert.deepEqual(await check("Redo properties"), states[i]);
          }
        }
        await s.page.screenshot({ path: path.join(output, "after.png"), fullPage: true });
        await writeFile(path.join(output, "sources.json"), JSON.stringify(s.sources, null, 2));
        results.push({ variant: config.name, scenario: kind, result: "PASS" });
        console.log("PASS " + config.name + " " + kind + ": one click, retained logical handle");
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
        records.push({ variant: config.name, scenario: kind, clicks, operations: s.records });
        await s.close();
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
        command: "bun continuity/proof.ts",
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
    "CONTINUITY " +
      results.filter((r) => r.result === "PASS").length +
      " passed, " +
      results.filter((r) => r.result === "FAIL").length +
      " failed",
  );
}

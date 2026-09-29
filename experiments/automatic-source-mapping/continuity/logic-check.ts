import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";
import { analyze, resolve, editRetainingSelection, type Selection } from "../resolver";
import { checkBoundaries } from "../boundaries";
import { variants, fixture } from "./support";

// AST-only diagnostics supplement the blocked Chrome rerun; they are not browser evidence.
const records: unknown[] = [];
for (const variant of variants) {
  const input = await fixture(variant.name);
  for (const kind of ["literal", "prop", "collection"]) {
    let analysis = analyze(input.sources, input.aliases);
    const options = [...analysis.hosts.values()].flat().flatMap((host) => {
      const usages = [...analysis.usages.values()]
        .flat()
        .filter((site) => site.target === host.component)
        .slice(0, 1)
        .map((site) => site.id);
      const array = host.loop && analysis.modules.get(host.file)?.arrays.get(host.loop.list);
      let record: string | number | null = null;
      if (host.loop && array) {
        const item = array.elements.at(-1);
        if (item && "properties" in item) {
          for (const property of item.properties) {
            if (
              "key" in property &&
              property.key &&
              "name" in property.key &&
              property.key.name === host.loop.key &&
              "value" in property &&
              property.value &&
              "value" in property.value
            ) {
              const value = property.value.value;
              if (typeof value === "string" || typeof value === "number") record = value;
            }
          }
        }
      }
      const selection = { node: host.id, usages, record };
      return resolve(analysis, selection, "text").kind === kind &&
        resolve(analysis, selection, "classes").kind === "classes"
        ? [selection]
        : [];
    });
    const initial = options[0];
    assert(initial, "Positive owner control");
    let selection: Selection = initial;
    for (const command of [
      { field: "text", value: 'Successive "source" 🌱' },
      {
        field: "classes",
        value: { from: kind === "collection" ? "text-xl" : "text-4xl", to: "text-5xl" },
      },
      { field: "classes", value: { from: "font-bold", to: "font-medium" } },
    ] satisfies { field: "text" | "classes"; value: string | { from: string; to: string } }[]) {
      const before = { selection, owner: resolve(analysis, selection, command.field) };
      const next = editRetainingSelection(analysis, selection, command.field, command.value);
      analysis = analyze(next.sources, input.aliases);
      selection = next.selection;
      assert.equal(resolve(analysis, selection, "text").kind, kind);
      assert.equal(resolve(analysis, selection, "classes").kind, "classes");
      assert.equal(selection.record, initial.record);
      records.push({
        variant: variant.name,
        kind,
        command,
        before,
        after: { selection, owner: resolve(analysis, selection, command.field) },
      });
    }
    if (kind === "prop") {
      const owner = resolve(analysis, selection, "text");
      assert(owner.kind === "prop");
      const host = analysis.hosts.get(selection.node)?.[0];
      assert(host);
      const peer = [...analysis.usages.values()]
        .flat()
        .find((site) => site.target === host.component && site.id !== owner.site);
      assert(peer);
      const attribute = peer.node.openingElement.attributes?.find(
        (attr) => n.JSXAttribute.check(attr) && attr.name.name === owner.property,
      );
      assert(n.JSXAttribute.check(attribute) && n.StringLiteral.check(attribute.value));
      const peerValue = attribute.value.value;
      // Ensure both usages use the same supported literal syntax before testing a structural collision.
      attribute.value = b.jsxExpressionContainer(b.stringLiteral(peerValue));
      const module = analysis.modules.get(peer.file);
      assert(module);
      analysis = analyze(
        { ...analysis.sources, [peer.file]: recast.print(module.ast).code },
        input.aliases,
      );
      assert.equal(resolve(analysis, selection, "text").kind, "prop");
      const collision = editRetainingSelection(analysis, selection, "text", peerValue);
      const uncertain = resolve(
        analyze(collision.sources, input.aliases),
        collision.selection,
        "text",
      );
      assert.equal(uncertain.kind, "unsupported");
      records.push({ variant: variant.name, kind: "command-created ambiguity", owner: uncertain });
      console.log("PASS AST " + variant.name + " command-created ambiguous usage rejected");
    }
    console.log("PASS AST " + variant.name + " " + kind + " successive value edits");
  }
}
const boundaries = checkBoundaries();
boundaries.forEach((test) => console.log("PASS boundary " + test.name));
const directory = path.resolve("runs", "continuity-logic");
await mkdir(directory, { recursive: true });
await writeFile(
  path.join(directory, "report.json"),
  JSON.stringify({ kind: "AST-only, not Chrome validation", records, boundaries }, null, 2),
);
console.log(
  "AST CHECKS PASSED: 6 successive-edit scenarios, 2 collision checks, 8 boundary controls",
);

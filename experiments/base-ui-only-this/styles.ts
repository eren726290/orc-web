import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compile } from "@tailwindcss/node";
import * as recast from "recast";
import { parse, type Sources } from "../automatic-source-mapping/resolver";

export async function realStyles(sources: Sources) {
  // ponytail: scan static strings including cn/cva inputs; dynamic utility generation needs a real project build.
  const candidates = new Set<string>();
  for (const source of Object.values(sources)) {
    const ast = parse(source);
    recast.types.visit(ast, {
      visitStringLiteral(p) {
        for (const candidate of p.node.value.split(/\s+/)) if (candidate) candidates.add(candidate);
        this.traverse(p);
      },
    });
  }
  const cssFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "src/styles.css");
  const compiler = await compile(await readFile(cssFile, "utf8"), {
    base: path.dirname(cssFile),
    onDependency() {},
  });
  return compiler.build([...candidates]);
}

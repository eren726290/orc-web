import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, readdir, rename } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";
import { chromium } from "playwright";
import {
  analyze,
  resolve,
  edit,
  parse,
  type Sources,
  type Selection,
  type Owner,
} from "./resolver";
import { renderer } from "./browser";
import { checkBoundaries } from "./boundaries";

// Fixture names and expected text are test oracles only. The resolver imports no fixture configuration.
const variants = [
  {
    name: "basic",
    entry: "src/App.tsx",
    implementation: "src/ui/Promo.tsx",
    literal: "Ordinary literal heading",
    first: "First instance",
    second: "Second instance",
    cross: "Across the file boundary",
    item: "Reading chair",
    otherItem: "Desk lamp",
    key: "chair",
  },
  {
    name: "variation",
    entry: "src/Landing.tsx",
    implementation: "src/panels/Feature.tsx",
    literal: "Another authored heading",
    first: "Alpha instance",
    second: "Beta instance",
    cross: "Aliased sibling module",
    item: "Wool rug",
    otherItem: "Oak stool",
    key: 42,
  },
];
const run = path.resolve("runs", new Date().toISOString().replace(/[:.]/g, "-"));
await mkdir(run, { recursive: true });
console.log("RUN " + run);
const results: { variant: string; name: string; result: "PASS" | "FAIL"; diagnostic?: string }[] =
  [];
const ownership: {
  variant: string;
  label: string;
  selection: Selection;
  field: string;
  owner: Owner;
}[] = [];
const expectedRejections: { variant: string; label: string; diagnostic: string }[] = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const render = await renderer(browser, run);

async function load(directory: string): Promise<Sources> {
  const sources: Sources = {};
  async function walk(relative: string) {
    for (const file of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, file.name);
      if (file.isDirectory()) await walk(name);
      else if (/\.tsx?$/.test(name))
        sources[name] = await readFile(path.join(directory, name), "utf8");
    }
  }
  await walk("src");
  return sources;
}
async function saveSources(directory: string, sources: Sources) {
  for (const [file, source] of Object.entries(sources)) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), source);
  }
}
function readSaved(text: string): { sources: Sources; revision: number } {
  const value: unknown = JSON.parse(text);
  assert(value && typeof value === "object" && "sources" in value && "revision" in value);
  assert(typeof value.revision === "number" && value.sources && typeof value.sources === "object");
  const sources: Sources = {};
  for (const [file, source] of Object.entries(value.sources)) {
    assert.equal(typeof source, "string");
    if (typeof source === "string") sources[file] = source;
  }
  return { sources, revision: value.revision };
}

async function scenario(config: (typeof variants)[number]) {
  const output = path.join(run, config.name);
  await mkdir(output, { recursive: true });
  const original = await load(path.join("fixtures", config.name));
  const aliases = JSON.parse(
    await readFile(path.join("fixtures", config.name, "tsconfig.json"), "utf8"),
  ).compilerOptions.paths;
  let state = { sources: original, revision: 0 };
  const history: (typeof state)[] = [];
  let current = await render.prepare(state.sources, aliases, config.entry);
  const saved = path.join(output, "saved.json");
  await writeFile(saved, JSON.stringify(state, null, 2));
  await saveSources(path.join(output, "before"), original);
  await current.page.screenshot({ path: path.join(output, "before.png"), fullPage: true });

  function pass(name: string) {
    results.push({ variant: config.name, name, result: "PASS" });
    console.log("PASS " + config.name + ": " + name);
  }
  async function selected(text: string) {
    await current.page.getByRole("heading", { name: text, exact: true }).click();
    const value: unknown = await current.page.evaluate(
      () => Object.getOwnPropertyDescriptor(window, "__selection")?.value,
    );
    assert(
      value &&
        typeof value === "object" &&
        "node" in value &&
        "usages" in value &&
        "record" in value,
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
  function owner(selection: Selection, field: "text" | "classes", label: string) {
    const found = resolve(current.analysis, selection, field);
    ownership.push({ variant: config.name, label, selection, field, owner: found });
    return found;
  }
  async function snapshot() {
    return current.page.locator("h1,h2,h3,h4").evaluateAll((elements) =>
      elements.map((el) => ({
        tag: el.tagName,
        text: el.textContent,
        size: getComputedStyle(el).fontSize,
        weight: getComputedStyle(el).fontWeight,
        classes: el.className,
      })),
    );
  }
  async function apply(sources: Sources, label: string, undo = false) {
    const candidate = await render.prepare(sources, aliases, config.entry);
    const next = { sources, revision: state.revision + 1 };
    try {
      await writeFile(saved + ".tmp", JSON.stringify(next, null, 2));
      await rename(saved + ".tmp", saved);
    } catch (error) {
      await candidate.context.close();
      throw error;
    }
    if (undo) history.pop();
    else history.push(state);
    state = next;
    await current.context.close();
    current = candidate;
    console.log("COMMIT " + config.name + " " + state.revision + ": " + label);
  }
  async function change(
    selection: Selection,
    field: "text" | "classes",
    value: string | { from: string; to: string },
    scope = "normal",
  ) {
    const analysis = analyze(state.sources, aliases);
    const found = resolve(analysis, selection, field);
    if (scope === "only-this")
      throw new Error(
        "Edit source: Only this is outside the safe module-copy subset of this experiment",
      );
    await apply(edit(analysis, found, value), "discovered " + found.kind);
  }
  async function undo() {
    const previous = history.at(-1);
    assert(previous);
    await apply(previous.sources, "Undo", true);
  }
  async function rejected(label: string, action: () => Promise<void>, reason: RegExp) {
    const before = {
      sources: state.sources,
      revision: state.revision,
      history: history.length,
      saved: await readFile(saved, "utf8"),
      view: await snapshot(),
    };
    let threw = false;
    try {
      await action();
    } catch (error) {
      threw = true;
      const diagnostic =
        error instanceof Error
          ? error.name + ": " + error.message + "\n" + error.stack
          : String(error);
      assert.match(diagnostic, reason);
      expectedRejections.push({ variant: config.name, label, diagnostic });
    }
    assert(threw, label + " must reject");
    assert.deepEqual(state.sources, before.sources);
    assert.equal(state.revision, before.revision);
    assert.equal(history.length, before.history);
    assert.equal(await readFile(saved, "utf8"), before.saved);
    assert.deepEqual(await snapshot(), before.view);
  }

  try {
    let selection = await selected(config.literal);
    assert.equal(owner(selection, "text", "literal text").kind, "literal");
    const literal = 'Literal "quotes" & <teams> {safe} 🌱';
    await change(selection, "text", literal);
    assert.equal(
      await current.page.getByRole("heading", { name: literal, exact: true }).count(),
      1,
    );
    assert(state.sources[config.entry].includes(JSON.stringify(literal)));
    selection = await selected(literal);
    assert.equal(owner(selection, "classes", "literal typography").scope, "This element");
    await change(selection, "classes", { from: "text-4xl", to: "text-5xl" });
    assert.equal(
      await current.page
        .getByRole("heading", { name: literal, exact: true })
        .evaluate((el) => getComputedStyle(el).fontSize),
      "48px",
    );
    assert.equal(state.sources[config.implementation], original[config.implementation]);
    pass("1: literal text and static Tailwind owners discovered; source and rendering edited");

    selection = await selected(config.first);
    const firstOwner = owner(selection, "text", "instance prop");
    assert.equal(firstOwner.kind, "prop");
    assert.equal(firstOwner.scope, "This instance");
    if (firstOwner.kind === "prop") assert.equal(firstOwner.file, config.entry);
    const instanceTitle = 'Chosen "ORC" & <label> {literal} 🌱';
    await change(selection, "text", instanceTitle);
    assert.equal(
      await current.page.getByRole("heading", { name: config.second, exact: true }).count(),
      1,
    );
    assert.equal(await current.page.locator("label").count(), 0);
    assert(state.sources[config.entry].includes(JSON.stringify(instanceTitle)));
    selection = await selected(instanceTitle);
    const shared = owner(selection, "classes", "shared component typography");
    const component = current.analysis.hosts.get(selection.node)?.[0].component;
    assert(component);
    assert.equal(shared.scope, "Every " + component.split("::")[1] + " instance");
    const sourceBeforeStyle = { ...state.sources },
      viewBeforeStyle = await snapshot();
    await change(selection, "classes", { from: "text-4xl", to: "text-5xl" });
    for (const text of [instanceTitle, config.second]) {
      const heading = current.page.getByRole("heading", { name: text, exact: true });
      assert.equal(await heading.evaluate((el) => getComputedStyle(el).fontSize), "48px");
      assert((await heading.getAttribute("class"))?.includes("hover:underline"));
      assert((await heading.getAttribute("class"))?.includes("md:tracking-wide"));
    }
    pass("2: particular usage prop and shared component style discovered with correct scopes");
    await undo();
    assert.deepEqual(state.sources, sourceBeforeStyle);
    assert.deepEqual(await snapshot(), viewBeforeStyle);
    pass("Undo restores exact source, rebuilt mappings, and rendered typography");
    await change(await selected(instanceTitle), "classes", { from: "text-4xl", to: "text-5xl" });

    selection = await selected(config.cross);
    const crossOwner = owner(selection, "text", "aliased cross-file usage");
    assert.equal(crossOwner.kind, "prop");
    if (crossOwner.kind === "prop") assert.equal(crossOwner.file, config.entry);
    const crossText = "Edited cross-file usage";
    const implementationBefore = state.sources[config.implementation];
    await change(selection, "text", crossText);
    assert.equal(state.sources[config.implementation], implementationBefore);
    assert.equal(
      await current.page
        .getByRole("heading", { name: "Another cross-file instance", exact: true })
        .count(),
      1,
    );
    selection = await selected(crossText);
    const crossStyle = owner(selection, "classes", "cross-file implementation");
    assert.equal(crossStyle.kind, "classes");
    if (crossStyle.kind === "classes") assert.equal(crossStyle.file, config.implementation);
    const callerBefore = state.sources[config.entry];
    await change(selection, "classes", { from: "text-4xl", to: "text-5xl" });
    assert.equal(state.sources[config.entry], callerBefore);
    assert(
      state.sources[config.implementation].includes(
        'export const untouched = "Unrelated module value"',
      ),
    );
    for (const text of [crossText, "Another cross-file instance"]) {
      assert.equal(
        await current.page
          .getByRole("heading", { name: text, exact: true })
          .evaluate((el) => getComputedStyle(el).fontSize),
        "48px",
      );
    }
    pass(
      "3: aliased module and imported-name resolution edit the correct usage and implementation files",
    );

    selection = await selected(config.item);
    const collection = owner(selection, "text", "collection before reorder");
    assert.equal(collection.kind, "collection");
    if (collection.kind !== "collection") throw new Error("Expected a discovered keyed record");
    assert.equal(collection.record, config.key);
    const itemTitle = "Updated local record 🌱";
    await change(selection, "text", itemTitle);
    assert.equal(
      await current.page.getByRole("heading", { name: config.otherItem, exact: true }).count(),
      1,
    );
    const ast = parse(state.sources[collection.file]);
    recast.types.visit(ast, {
      visitVariableDeclarator(p) {
        if (
          n.Identifier.check(p.node.id) &&
          p.node.id.name === collection.list &&
          n.ArrayExpression.check(p.node.init)
        )
          p.node.init.elements.reverse();
        this.traverse(p);
      },
    });
    await apply(
      { ...state.sources, [collection.file]: recast.print(ast).code },
      "Reorder source array",
    );
    assert.deepEqual(await current.page.getByRole("heading", { level: 3 }).allTextContents(), [
      itemTitle,
      config.otherItem,
    ]);
    const reordered = owner(selection, "text", "same collection selection after reorder");
    assert.deepEqual(reordered, collection);
    await change(selection, "text", "Record edited after reorder");
    assert.deepEqual(await current.page.getByRole("heading", { level: 3 }).allTextContents(), [
      "Record edited after reorder",
      config.otherItem,
    ]);
    pass(
      "4: React key discovers stable record identity; reorder never retargets by array position",
    );

    for (const text of ["Price: 21", "From external-shaped input"]) {
      selection = await selected(text);
      const blocked = owner(selection, "text", "unsupported " + text);
      assert.equal(blocked.kind, "unsupported");
      assert.equal(blocked.scope, "Edit source");
      await rejected(text, () => change(selection, "text", "must not apply"), /Edit source/);
    }
    selection = await selected("Price: 21");
    assert.equal(owner(selection, "classes", "safe style beside calculated text").kind, "classes");
    await change(selection, "classes", { from: "text-xl", to: "text-4xl" });
    assert.equal(
      await current.page
        .getByRole("heading", { name: "Price: 21", exact: true })
        .evaluate((el) => getComputedStyle(el).fontSize),
      "36px",
    );
    pass(
      "5: calculated and external-shaped text reject atomically; safely mapped style stays usable",
    );

    selection = await selected(instanceTitle);
    const formatted = Object.fromEntries(
      Object.entries(state.sources).map(([file, source]) => [
        file,
        recast.prettyPrint(parse(source), { tabWidth: 4 }).code,
      ]),
    );
    formatted[config.entry] = "const unrelatedInsertedValue = 123;\n" + formatted[config.entry];
    await apply(formatted, "Format all modules and insert unrelated code");
    assert.equal(
      owner(selection, "text", "old selection after formatting and insertion").kind,
      "prop",
    );
    await change(selection, "text", "Instance after formatting");
    assert.equal(
      await current.page.getByRole("heading", { name: config.second, exact: true }).count(),
      1,
    );
    pass("6a: formatting and unrelated insertion rebuild mappings without retargeting selections");

    selection = await selected(crossText);
    const target = current.analysis.hosts.get(selection.node)?.[0];
    assert(target);
    const ambiguous = parse(state.sources[target.file]);
    const targetNode = current.analysis.hosts.get(selection.node)?.[0].node;
    assert(targetNode);
    const printedTarget = recast.prettyPrint(targetNode).code;
    let duplicated = 0;
    const containers: n.JSXElement[] = [];
    recast.types.visit(ambiguous, {
      visitJSXElement(p) {
        if (recast.prettyPrint(p.node).code === printedTarget) {
          const container = p.parent.value;
          assert(n.JSXElement.check(container));
          containers.push(container);
          duplicated++;
          return false;
        }
        this.traverse(p);
      },
    });
    assert.equal(duplicated, 1);
    const duplicateDeclaration = parse("const copy = (" + printedTarget + ");").program.body[0];
    assert(n.VariableDeclaration.check(duplicateDeclaration));
    const duplicateVariable = duplicateDeclaration.declarations[0];
    assert(
      n.VariableDeclarator.check(duplicateVariable) && n.JSXElement.check(duplicateVariable.init),
    );
    containers[0].children.push(duplicateVariable.init);
    await apply(
      { ...state.sources, [target.file]: recast.print(ambiguous).code },
      "Ambiguous structural duplication",
    );
    const stale = owner(selection, "text", "ambiguous old selection");
    assert.equal(stale.kind, "unsupported");
    if (stale.kind === "unsupported") assert.match(stale.reason, /invalidated.*ambiguous/);
    await rejected(
      "ambiguous old selection",
      () => change(selection, "text", "wrong element"),
      /Edit source/,
    );
    await undo();
    assert.equal(resolve(current.analysis, selection, "text").kind, "prop");
    pass(
      "6b: ambiguous structural replacement explicitly invalidates old selection; Undo restores mapping",
    );

    const onlySelection = await selected("Instance after formatting");
    assert.equal(
      owner(onlySelection, "classes", "Only this discovered shared binding").kind,
      "classes",
    );
    await rejected(
      "Only this unsupported",
      () => change(onlySelection, "classes", { from: "font-bold", to: "font-medium" }, "only-this"),
      /Only this/,
    );
    pass("Only this explicitly unsupported and rejected without fixture-specific cloning");
    await rejected(
      "invalid TSX",
      () =>
        apply(
          { ...state.sources, [config.entry]: state.sources[config.entry] + "\nconst = ;" },
          "Invalid source",
        ),
      /Unexpected token|Unexpected/,
    );
    const crashAst = parse(state.sources[config.entry]);
    const selectedHost = current.analysis.hosts.get(onlySelection.node)?.[0];
    assert(selectedHost?.component);
    const crashName = selectedHost.component.split("::")[1];
    recast.types.visit(crashAst, {
      visitFunctionDeclaration(p) {
        if (p.node.id?.name === crashName)
          p.node.body.body.unshift(
            b.throwStatement(
              b.newExpression(b.identifier("Error"), [b.stringLiteral("candidate crash")]),
            ),
          );
        this.traverse(p);
      },
    });
    await rejected(
      "crashing candidate",
      () =>
        apply({ ...state.sources, [config.entry]: recast.print(crashAst).code }, "Crashing source"),
      /candidate crash/,
    );
    pass("Invalid source and crashing candidate preserve source, design, saved state, and history");

    const finalView = await snapshot();
    await current.page.screenshot({ path: path.join(output, "after.png"), fullPage: true });
    await saveSources(path.join(output, "after"), state.sources);
    const persisted = readSaved(await readFile(saved, "utf8"));
    assert(
      Object.values(persisted.sources).every(
        (source) => !source.includes("data-orc-") && !source.includes("__ORC"),
      ),
    );
    await current.context.close();
    current = await render.prepare(persisted.sources, aliases, config.entry);
    state = persisted;
    assert.deepEqual(await snapshot(), finalView);
    assert.equal(
      owner(await selected("Instance after formatting"), "text", "fresh mapping after reopen").kind,
      "prop",
    );
    assert.equal(
      owner(
        await selected("Record edited after reorder"),
        "text",
        "fresh keyed mapping after reopen",
      ).kind,
      "collection",
    );
    await current.page.screenshot({ path: path.join(output, "reopened.png"), fullPage: true });
    await writeFile(path.join(output, "final-view.json"), JSON.stringify(finalView, null, 2));
    pass("Save/reopen regenerates working mappings from uninstrumented saved source");
  } finally {
    await current.context.close();
  }
}

try {
  for (const check of checkBoundaries()) {
    results.push({ variant: "boundaries", name: check.name, result: "PASS" });
    console.log("PASS boundaries: " + check.name);
  }
  for (const config of variants) {
    try {
      await scenario(config);
    } catch (error) {
      const diagnostic =
        error instanceof Error
          ? error.name + ": " + error.message + "\n" + error.stack
          : String(error);
      results.push({ variant: config.name, name: "scenario failure", result: "FAIL", diagnostic });
      console.error("FAIL " + config.name + "\n" + diagnostic);
      process.exitCode = 1;
    }
  }
} catch (error) {
  const diagnostic =
    error instanceof Error ? error.name + ": " + error.message + "\n" + error.stack : String(error);
  results.push({
    variant: "boundaries",
    name: "boundary check failure",
    result: "FAIL",
    diagnostic,
  });
  console.error(diagnostic);
  process.exitCode = 1;
} finally {
  const dependencies = Object.fromEntries(
    await Promise.all(
      [
        "@babel/parser",
        "ast-types",
        "recast",
        "react",
        "react-dom",
        "tailwindcss",
        "playwright",
      ].map(async (name) => [
        name,
        JSON.parse(await readFile(path.join("node_modules", name, "package.json"), "utf8")).version,
      ]),
    ),
  );
  const report = {
    environment: {
      os: await readFile("/etc/os-release", "utf8"),
      architecture: process.arch,
      session: process.env.XDG_SESSION_TYPE,
      desktop: process.env.XDG_CURRENT_DESKTOP,
      bun: Bun.version,
      chrome: browser.version(),
      node: execFileSync("node", ["--version"], { encoding: "utf8" }).trim(),
      npm: execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(),
      dependencies,
    },
    commands: [
      "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --ignore-scripts --no-audit --no-fund",
      "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts --no-audit --no-fund",
      "bun run proof",
    ],
    results,
    expectedRejections,
    unsupported: [
      "Only this component cloning",
      "Calculated or external-data-shaped text",
      "Non-literal props, mixed content, arbitrary components, mutable data, and ambiguous source identities",
    ],
  };
  await writeFile(path.join(run, "report.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(run, "owners.json"), JSON.stringify(ownership, null, 2));
  await writeFile(
    path.join(run, "browser-diagnostics.json"),
    JSON.stringify(render.diagnostics, null, 2),
  );
  await browser.close();
  render.close();
  console.log(
    "RESULT " +
      results.filter((item) => item.result === "PASS").length +
      " passed, " +
      results.filter((item) => item.result === "FAIL").length +
      " failed. Evidence: " +
      run,
  );
}

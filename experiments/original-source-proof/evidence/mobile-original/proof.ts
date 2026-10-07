import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as recast from "recast";
import * as babelParser from "@babel/parser";
import { compile } from "tailwindcss";
import { chromium } from "playwright";

// A deliberately bounded executable experiment, not the ORC-web implementation.
// Instance and collection IDs in this fixture are explicitly authored bindings.
const b = recast.types.builders;
const parser = { parse: (source: string) => babelParser.parse(source, {
  sourceType: "module", plugins: ["typescript", "jsx"], tokens: true,
}) };
const parse = (source: string) => recast.parse(source, { parser });
const original = await readFile(new URL("fixture.tsx", import.meta.url), "utf8");
await mkdir("artifacts", { recursive: true });
let state = { source: original, revision: 0 };
const history: typeof state[] = [];
const results: { name: string; result: string }[] = [];
const pass = (name: string) => {
  results.push({ name, result: "PASS" });
  console.log(`PASS ${name}`);
};

function findExactlyOne(ast: any, type: string, predicate: (node: any) => boolean) {
  const matches: any[] = [];
  recast.types.visit(ast, {
    [`visit${type}`](path: any) {
      if (predicate(path.node)) matches.push(path.node);
      this.traverse(path);
    },
  } as any);
  assert.equal(matches.length, 1, `Expected one unambiguous ${type} binding`);
  return matches[0];
}
function attr(node: any, name: string) {
  const matches = node.attributes.filter((a: any) =>
    a.type === "JSXAttribute" && a.name.name === name);
  assert.equal(matches.length, 1, `Expected one ${name} attribute`);
  return matches[0];
}
function instance(ast: any, id: string) {
  return findExactlyOne(ast, "JSXOpeningElement", (node: any) =>
    node.attributes.some((a: any) => a.type === "JSXAttribute" &&
      a.name.name === "instanceId" && a.value?.type === "StringLiteral" && a.value.value === id));
}
function declaration(ast: any, name: string) {
  return findExactlyOne(ast, "FunctionDeclaration", (node: any) => node.id?.name === name);
}
function headingClass(component: any) {
  return attr(findExactlyOne(component, "JSXOpeningElement", (node: any) =>
    node.name.type === "JSXIdentifier" && node.name.name === "h1"), "className");
}
function changeClass(component: any, from: string, to: string) {
  const a = headingClass(component);
  assert.equal(a.value.type, "StringLiteral", "Computed classes require a separate binding");
  const tokens = a.value.value.split(/\s+/);
  assert.equal(tokens.filter((token: string) => token === from).length, 1);
  a.value = b.stringLiteral(tokens.map((token: string) => token === from ? to : token).join(" "));
}
function updateInstanceTitle(ast: any, id: string, title: string) {
  // Expression-wrapped string values prevent quotes, braces and HTML-like text becoming JSX.
  attr(instance(ast, id), "title").value = b.jsxExpressionContainer(b.stringLiteral(title));
}
function makeIndependent(ast: any, id: string) {
  const use = instance(ast, id);
  const shared = declaration(ast, use.name.name);
  const name = "HeroIndependentA";
  assert(!ast.program.body.some((node: any) => node.id?.name === name));
  const independent = parse(recast.print(shared).code).program.body[0];
  independent.id = b.identifier(name);
  changeClass(independent, "font-bold", "font-medium");
  ast.program.body.splice(ast.program.body.indexOf(shared) + 1, 0, independent);
  use.name = b.jsxIdentifier(name);
}
function updateProduct(ast: any, id: string, title: string) {
  const list = findExactlyOne(ast, "VariableDeclarator", (node: any) => node.id?.name === "products");
  assert.equal(list.init.type, "ArrayExpression");
  const entries = list.init.elements.filter((node: any) => node.type === "ObjectExpression" &&
    node.properties.some((p: any) => p.type === "ObjectProperty" && p.key.name === "id" && p.value.value === id));
  assert.equal(entries.length, 1);
  const value = entries[0].properties.find((p: any) => p.key.name === "title");
  value.value = b.stringLiteral(title);
}

const files = new Map<string, { body: string; type: string }>();
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch(req) {
  const file = files.get(new URL(req.url).pathname);
  return file ? new Response(file.body, { headers: { "content-type": file.type } }) :
    new Response("Not found", { status: 404 });
} });
const browser = await chromium.launch({ headless: true });
let buildNumber = 0;
let current: Awaited<ReturnType<typeof render>>;

async function render(source: string) {
  const ast = parse(source);
  const classes = new Set<string>();
  recast.types.visit(ast, { visitJSXAttribute(path: any) {
    if (path.node.name.name === "className" && path.node.value?.type === "StringLiteral") {
      for (const token of path.node.value.value.split(/\s+/)) classes.add(token);
    }
    this.traverse(path);
  } });
  const compiler = await compile(`@theme {
    --text-4xl: 2.25rem; --text-5xl: 3rem;
    --font-weight-medium: 500; --font-weight-bold: 700;
    --breakpoint-md: 48rem; --tracking-wide: 0.025em;
  } @tailwind utilities;`);
  const css = compiler.build([...classes]);
  const id = ++buildNumber;
  const componentPath = `${process.cwd()}/artifacts/component-${id}.tsx`;
  const entryPath = `${process.cwd()}/artifacts/entry-${id}.tsx`;
  await writeFile(componentPath, source);
  await writeFile(entryPath, `import {createRoot} from "react-dom/client";
    import App from "./component-${id}.tsx";
    createRoot(document.getElementById("root")).render(<App/>);
    document.addEventListener("click", event => {
      const target = event.target;
      if (target instanceof Element && target.matches("h1, h2")) {
        window.__selection = {
          instanceId: target.closest("[data-instance]")?.getAttribute("data-instance") ?? null,
          productId: target.closest("[data-product]")?.getAttribute("data-product") ?? null
        };
      }
    });
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));`);
  const bundle = await Bun.build({ entrypoints: [entryPath], target: "browser",
    define: { "process.env.NODE_ENV": '"production"' } });
  assert(bundle.success, bundle.logs.map(String).join("\n"));
  files.set(`/app-${id}.js`, { body: await bundle.outputs[0].text(), type: "text/javascript" });
  files.set(`/styles-${id}.css`, { body: css, type: "text/css" });
  files.set(`/candidate-${id}`, { body: `<!doctype html><html><head>
    <meta charset="utf-8"><link rel="stylesheet" href="/styles-${id}.css">
    <style>html{font-size:16px}body{font-family:system-ui;margin:32px}section{padding:20px;border:1px solid #bbb;margin-bottom:20px}h1{margin:0 0 12px}button{padding:8px 16px}</style>
    </head><body><div id="root"></div><script type="module" src="/app-${id}.js"></script></body></html>`, type: "text/html" });
  const context = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(`${server.url}candidate-${id}`);
    await page.waitForFunction(() => (window as any).__ready, { timeout: 5000 });
    assert.equal(errors.length, 0, errors.join("\n"));
    assert.equal(await page.locator("h1").count(), 2, "Both Heroes must render");
    return { page, context, css };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function snapshot() {
  return current.page.evaluate(() => ({
    heroes: [...document.querySelectorAll("[data-instance]")].map(el => {
      const h = el.querySelector("h1")!;
      return { id: el.getAttribute("data-instance"), text: h.textContent,
        fontSize: getComputedStyle(h).fontSize, fontWeight: getComputedStyle(h).fontWeight,
        classes: h.className };
    }),
    products: [...document.querySelectorAll("[data-product]")].map(el => ({
      id: el.getAttribute("data-product"), text: el.querySelector("h2")!.textContent,
    })),
  }));
}
async function commit(label: string, mutate: (ast: any) => void) {
  const ast = parse(state.source);
  mutate(ast);
  const source = recast.print(ast).code;
  const candidate = await render(source);
  const previous = state;
  state = { source, revision: state.revision + 1 };
  history.push(previous);
  await writeFile("artifacts/saved-design.json", JSON.stringify(state, null, 2));
  await current.context.close();
  current = candidate;
  console.log(`COMMIT ${state.revision}: ${label}`);
}
async function undo() {
  const previous = history.at(-1);
  assert(previous);
  const candidate = await render(previous.source);
  history.pop();
  state = { source: previous.source, revision: state.revision + 1 };
  await writeFile("artifacts/saved-design.json", JSON.stringify(state, null, 2));
  await current.context.close();
  current = candidate;
}

try {
  assert.equal(recast.print(parse(original)).code, original);
  pass("Parsing and printing without edits preserves the source exactly");
  current = await render(original);
  assert.deepEqual((await snapshot()).heroes.map(h => h.fontSize), ["36px", "36px"]);
  await current.page.screenshot({ path: "artifacts/before.png", fullPage: true });
  pass("Initial React TSX and Tailwind render two 36px headings in Chromium");

  await current.page.locator('[data-instance="hero-a"] h1').click();
  const selection = await current.page.evaluate(() => (window as any).__selection);
  assert.equal(selection.instanceId, "hero-a");
  const specialTitle = 'Build "ORC" & <teams> {together} 🌱';
  await commit("Edit selected Hero title", ast => updateInstanceTitle(ast, selection.instanceId, specialTitle));
  let view = await snapshot();
  assert.deepEqual(view.heroes.map(h => h.text), [specialTitle, "Meet the team"]);
  assert.equal(await current.page.locator("teams").count(), 0);
  pass("Click resolves the declared instance; text edit changes only A, with literal quotes, braces, HTML-like text and Unicode");

  await commit("All copies: 36px to 48px", ast => changeClass(declaration(ast, "Hero"), "text-4xl", "text-5xl"));
  view = await snapshot();
  assert.deepEqual(view.heroes.map(h => h.fontSize), ["48px", "48px"]);
  assert(view.heroes.every(h => h.classes.includes("hover:underline") && h.classes.includes("md:tracking-wide")));
  assert(current.css.includes(".text-5xl"));
  assert(!current.css.includes(".text-4xl"));
  pass("Shared typography changes both Heroes; rebuilt Tailwind CSS preserves hover and responsive classes");

  const sharedBefore = recast.print(declaration(parse(state.source), "Hero")).code;
  const historyBefore = history.length;
  await commit("Only this: independent Hero A with medium weight", ast => makeIndependent(ast, "hero-a"));
  assert.equal(history.length, historyBefore + 1);
  assert.equal(recast.print(declaration(parse(state.source), "Hero")).code, sharedBefore);
  assert.equal(instance(parse(state.source), "hero-a").name.name, "HeroIndependentA");
  assert.equal(instance(parse(state.source), "hero-b").name.name, "Hero");
  assert.deepEqual((await snapshot()).heroes.map(h => h.fontWeight), ["500", "700"]);
  pass("Only this clones A in one command; shared Hero and B remain unchanged");
  await undo();
  assert.equal(instance(parse(state.source), "hero-a").name.name, "Hero");
  assert(!state.source.includes("function HeroIndependentA"));
  assert.deepEqual((await snapshot()).heroes.map(h => h.fontWeight), ["700", "700"]);
  pass("One Undo removes the independent definition and restores A's shared reference and appearance");
  await commit("Repeat independent A for final saved example", ast => makeIndependent(ast, "hero-a"));

  await current.page.locator('[data-product="p2"] h2').click();
  const productSelection = await current.page.evaluate(() => (window as any).__selection);
  const beforeProduct = state.source;
  await commit("Edit one local data entry", ast => updateProduct(ast, productSelection.productId, "Reading chair 🌱"));
  assert.deepEqual((await snapshot()).products.map(p => p.text), ["Desk lamp", "Reading chair 🌱"]);
  pass("Repeated content edits the selected local product record only");
  await undo();
  assert.equal(state.source, beforeProduct);
  assert.deepEqual((await snapshot()).products.map(p => p.text), ["Desk lamp", "Reading chair"]);
  pass("One Undo restores the exact previous source and rendered product list");
  await commit("Reapply product edit for saved example", ast => updateProduct(ast, "p2", "Reading chair 🌱"));

  const savedBeforeFailure = await readFile("artifacts/saved-design.json", "utf8");
  const sourceBeforeFailure = state.source;
  const historyBeforeFailure = history.length;
  const viewBeforeFailure = await snapshot();
  await assert.rejects(() => commit("Reject runtime crash", ast => {
    declaration(ast, "HeroIndependentA").body.body.unshift(
      b.throwStatement(b.newExpression(b.identifier("Error"), [b.stringLiteral("candidate crash")])));
  }));
  assert.equal(state.source, sourceBeforeFailure);
  assert.equal(history.length, historyBeforeFailure);
  assert.equal(await readFile("artifacts/saved-design.json", "utf8"), savedBeforeFailure);
  assert.deepEqual(await snapshot(), viewBeforeFailure);
  pass("Candidate render crash preserves applied source, visible design, history and saved file");
  assert.throws(() => parse(state.source + "\nconst = ;"));
  pass("Malformed JSX/TypeScript is rejected by the parser");

  const motionText = 'initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}';
  assert(state.source.includes("// Keep this comment and its unusual spacing:   café 🌱."));
  assert(state.source.includes(motionText));
  await current.page.locator('[data-instance="hero-a"] button').click();
  assert.equal(await current.page.locator('[data-instance="hero-a"] button').textContent(), "Clicks: 1");
  assert.equal(await current.page.locator('[data-instance="hero-b"] button').textContent(), "Clicks: 0");
  pass("Comment and Motion declaration survive; independent React button behavior still works");

  const savedView = await snapshot();
  await current.page.screenshot({ path: "artifacts/after.png", fullPage: true });
  await writeFile("artifacts/after.tsx", state.source);
  const persisted = JSON.parse(await readFile("artifacts/saved-design.json", "utf8"));
  await current.context.close();
  state = persisted;
  current = await render(state.source);
  assert.deepEqual(await snapshot(), savedView);
  await current.page.screenshot({ path: "artifacts/reopened.png", fullPage: true });
  pass("Reopening the saved source in a fresh browser context reproduces text, styling and data");
  await writeFile("artifacts/report.json", JSON.stringify({
    runtime: Bun.version, platform: `${process.platform}/${process.arch}`,
    browser: browser.version(), results, finalView: savedView,
    limitations: ["Explicit fixture bindings, not a general component recognizer",
      "One TSX file; no cross-file symbol resolution or arbitrary computed expressions",
      "Scratch source persistence, not the ORC-web bundle or command-engine implementation",
      "Debian ARM64 Chromium, not Fedora/Windows Chrome certification"],
  }, null, 2));
  console.log(`ALL ${results.length} CHECKS PASSED`);
} finally {
  await browser.close();
  await server.stop(true);
}

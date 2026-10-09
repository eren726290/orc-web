import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as recast from "recast";
import { namedTypes as n } from "ast-types";
import { compile } from "tailwindcss";
import type { Browser, Page } from "playwright";
import { analyze, instrument, type Sources, type Aliases } from "./resolver";

export async function renderer(
  browser: Browser,
  directory: string,
  options: {
    runtime?: string;
    styles?: (sources: Sources) => Promise<string>;
    instrumented?: boolean;
    activate?: (page: Page) => Promise<void>;
  } = {},
) {
  const files = new Map<string, { body: string; type: string }>();
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const file = files.get(new URL(request.url).pathname);
      return file
        ? new Response(file.body, { headers: { "content-type": file.type } })
        : new Response("Not found", { status: 404 });
    },
  });
  let serial = 0;
  const diagnostics: { build: number; phase: string; messages: string[] }[] = [];

  async function prepare(sources: Sources, aliases: Aliases, entry: string) {
    const id = ++serial;
    const workspace = path.join(directory, "generated", String(id));
    const messages: string[] = [];
    let context: Awaited<ReturnType<Browser["newContext"]>> | null = null;
    try {
      const analysis = analyze(sources, aliases);
      const generated = instrument(
        analysis,
        options.runtime ?? path.resolve("runtime.tsx"),
        options.instrumented !== false,
      );
      const classes = new Set<string>();
      for (const module of analysis.modules.values()) {
        recast.types.visit(module.ast, {
          visitJSXAttribute(p) {
            const value = p.node.value;
            const text = n.StringLiteral.check(value)
              ? value.value
              : n.JSXExpressionContainer.check(value) && n.StringLiteral.check(value.expression)
                ? value.expression.value
                : null;
            if (p.node.name.name === "className" && text !== null) {
              for (const token of text.split(/\s+/)) classes.add(token);
            }
            this.traverse(p);
          },
        });
      }
      const compiler = await compile(
        "@theme { --text-4xl: 2.25rem; --text-5xl: 3rem; " +
          "--text-xl: 1.25rem; --font-weight-bold: 700; --font-weight-medium: 500; " +
          "--breakpoint-md: 48rem; --tracking-wide: 0.025em; } @tailwind utilities;",
      );
      const css = options.styles ? await options.styles(sources) : compiler.build([...classes]);
      for (const [file, source] of Object.entries(generated)) {
        const destination = path.join(workspace, file);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, source);
      }
      const entryPath = path.join(workspace, "mount.tsx");
      await writeFile(
        entryPath,
        'import { createRoot } from "react-dom/client";\nimport Root from "./' +
          entry +
          '";\n' +
          'createRoot(document.getElementById("root")).render(<Root />);\n' +
          'document.addEventListener("click", event => {\n' +
          "  if (!(event.target instanceof Element)) return;\n" +
          '  const el = event.target.closest("[data-orc-node]");\n' +
          '  if (el) window.__selection = { node: el.getAttribute("data-orc-node"), ' +
          'usages: JSON.parse(el.getAttribute("data-orc-usage")), record: JSON.parse(el.getAttribute("data-orc-record")) };\n' +
          "});\nrequestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));\n",
      );
      const bundle = await Bun.build({
        entrypoints: [entryPath],
        target: "browser",
        define: { "process.env.NODE_ENV": '"production"' },
      });
      messages.push(...bundle.logs.map(String));
      assert(bundle.success, "Candidate compilation failed: " + messages.join("\n"));
      files.set("/app-" + id + ".js", {
        body: await bundle.outputs[0].text(),
        type: "text/javascript",
      });
      files.set("/style-" + id + ".css", { body: css, type: "text/css" });
      files.set("/candidate-" + id, {
        body:
          '<!doctype html><html><head><meta charset="utf-8">' +
          '<link rel="stylesheet" href="/style-' +
          id +
          '.css">' +
          (options.styles
            ? ""
            : "<style>html{font-size:16px}body{font-family:system-ui;margin:24px;max-width:1000px}" +
              "h1,h2,h3,h4{margin:10px 0}section,aside,article{border:1px solid #ddd;padding:12px;margin:8px 0}" +
              "main>div{display:flex;gap:16px}main>div article{flex:1}</style>") +
          "</head><body>" +
          '<div id="root"></div><script type="module" src="/app-' +
          id +
          '.js"></script></body></html>',
        type: "text/html",
      });
      context = await browser.newContext({ viewport: { width: 1100, height: 1050 } });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("console", (event) => messages.push(event.type() + ": " + event.text()));
      page.on("pageerror", (error) => {
        const diagnostic = error.name + ": " + error.message + "\n" + error.stack;
        errors.push(diagnostic);
        messages.push("pageerror: " + diagnostic);
      });
      await page.goto(String(server.url) + "candidate-" + id);
      await page.waitForFunction(() => Object.hasOwn(window, "__ready"), null, { timeout: 5000 });
      assert.equal(errors.length, 0, errors.join("\n"));
      await options.activate?.(page);
      assert.equal(errors.length, 0, errors.join("\n"));
      if (options.instrumented !== false)
        assert(
          (await page.locator("[data-orc-node]").count()) > 0,
          "Candidate did not render instrumented authored elements",
        );
      diagnostics.push({ build: id, phase: "accepted", messages });
      return { page, context, analysis };
    } catch (error) {
      messages.push(
        error instanceof Error
          ? error.name + ": " + error.message + "\n" + error.stack
          : String(error),
      );
      diagnostics.push({ build: id, phase: "rejected", messages });
      if (context) await context.close();
      throw error;
    }
  }
  return { prepare, diagnostics, close: () => server.stop(true) };
}

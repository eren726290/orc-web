import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Page } from "playwright";
import type { Sources, Selection } from "../resolver";

// Browser click oracles only. Implementation code never imports this configuration.
export const variants = [
  {
    name: "basic",
    entry: "src/App.tsx",
    literal: "Ordinary literal heading",
    instance: "First instance",
    item: "Reading chair",
    key: "chair",
  },
  {
    name: "variation",
    entry: "src/Landing.tsx",
    literal: "Another authored heading",
    instance: "Alpha instance",
    item: "Wool rug",
    key: 42,
  },
];
export async function fixture(name: string) {
  const root = path.join("fixtures", name);
  const sources: Sources = {};
  for (const file of await readdir(root, { recursive: true })) {
    if (/\.tsx?$/.test(file)) sources[file] = await readFile(path.join(root, file), "utf8");
  }
  const aliases = JSON.parse(await readFile(path.join(root, "tsconfig.json"), "utf8"))
    .compilerOptions.paths;
  return { sources, aliases };
}
export async function clickSelection(page: Page, text: string): Promise<Selection> {
  await page.getByRole("heading", { name: text, exact: true }).click();
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
export async function headings(page: Page) {
  return page.locator("h1,h2,h3,h4").evaluateAll((elements) =>
    elements.map((el) => ({
      text: el.textContent,
      size: getComputedStyle(el).fontSize,
      weight: getComputedStyle(el).fontWeight,
      classes: el.className,
    })),
  );
}
export function diagnostic(error: unknown) {
  return error instanceof Error
    ? error.name + ": " + error.message + "\n" + error.stack
    : String(error);
}
export async function environment(chrome: string) {
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  const dependencies = Object.fromEntries(
    await Promise.all(
      Object.keys(manifest.dependencies).map(async (name) => [
        name,
        JSON.parse(await readFile(path.join("node_modules", name, "package.json"), "utf8")).version,
      ]),
    ),
  );
  return {
    os: await readFile("/etc/os-release", "utf8"),
    architecture: process.arch,
    session: process.env.XDG_SESSION_TYPE,
    desktop: process.env.XDG_CURRENT_DESKTOP,
    bun: Bun.version,
    chrome,
    node: execFileSync("node", ["--version"], { encoding: "utf8" }).trim(),
    npm: execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(),
    dependencies,
  };
}

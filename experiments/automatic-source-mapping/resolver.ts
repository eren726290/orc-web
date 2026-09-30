import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import * as babel from "@babel/parser";
import * as recast from "recast";
import { namedTypes as n, builders as b, type NodePath } from "ast-types";

export type Sources = Record<string, string>;
export type Aliases = Record<string, string[]>;
export type CommandBindings = Record<string, { digest: string; ids: Record<string, string> }>;
export type Selection = { node: string; usages: string[]; record: string | number | null };
type FunctionInfo = { file: string; name: string; node: n.FunctionDeclaration };
type Loop = { list: string; parameter: string; key: string; value: n.MemberExpression };
type Host = {
  id: string;
  file: string;
  component: string | null;
  node: n.JSXElement;
  loop: Loop | null;
  nested: boolean;
};
type Usage = { id: string; file: string; target: string; node: n.JSXElement };
type Module = {
  ast: n.File;
  functions: Map<string, FunctionInfo>;
  exports: Map<string, string>;
  imports: Map<string, string>;
  arrays: Map<string, n.ArrayExpression>;
};
export type Analysis = {
  sources: Sources;
  aliases: Aliases;
  modules: Map<string, Module>;
  hosts: Map<string, Host[]>;
  usages: Map<string, Usage[]>;
  bindings: CommandBindings;
};
export type Owner =
  | { kind: "literal"; file: string; host: string; scope: string }
  | { kind: "prop"; file: string; site: string; property: string; scope: string }
  | {
      kind: "collection";
      file: string;
      list: string;
      key: string;
      record: string | number;
      property: string;
      scope: string;
    }
  | { kind: "classes"; file: string; host: string; scope: string }
  | { kind: "unsupported"; scope: "Edit source"; reason: string };

export function parse(source: string): n.File {
  const ast = recast.parse(source, {
    parser: {
      parse: (text: string) =>
        babel.parse(text, { sourceType: "module", plugins: ["typescript", "jsx"], tokens: true }),
    },
  });
  assert(n.File.check(ast));
  return ast;
}

const omitted = new Set(["loc", "start", "end", "original", "extra", "comments", "tokens"]);
function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape).filter((item) => item !== null);
  if (!value || typeof value !== "object") return value;
  if (
    "type" in value &&
    value.type === "JSXText" &&
    "value" in value &&
    typeof value.value === "string"
  ) {
    return value.value.trim() ? { type: "JSXText", value: value.value.trim() } : null;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !omitted.has(key))
      .sort(([a], [z]) => a.localeCompare(z))
      .map(([key, item]) => [key, shape(item)]),
  );
}
function identity(file: string, component: string | null, node: n.JSXElement) {
  return createHash("sha256")
    .update(JSON.stringify([file, component, shape(node)]))
    .digest("hex")
    .slice(0, 24);
}
function attribute(node: n.JSXElement, name: string) {
  const matches =
    node.openingElement.attributes?.filter(
      (item) =>
        n.JSXAttribute.check(item) && n.JSXIdentifier.check(item.name) && item.name.name === name,
    ) ?? [];
  return matches.length === 1 && n.JSXAttribute.check(matches[0]) ? matches[0] : null;
}
function scalar(node: unknown): string | number | undefined {
  if (n.StringLiteral.check(node) || n.NumericLiteral.check(node)) return node.value;
  return undefined;
}
function stringValue(node: unknown): string | undefined {
  if (n.StringLiteral.check(node)) return node.value;
  if (n.JSXExpressionContainer.check(node) && n.StringLiteral.check(node.expression))
    return node.expression.value;
  return undefined;
}
function parentFunction(p: NodePath): n.FunctionDeclaration | null {
  for (let cursor = p.parent; cursor; cursor = cursor.parent) {
    if (n.FunctionDeclaration.check(cursor.value)) return cursor.value;
  }
  return null;
}
function mapLoop(p: NodePath): Loop | null {
  for (let cursor = p.parent; cursor; cursor = cursor.parent) {
    const node = cursor.value;
    if (
      !n.CallExpression.check(node) ||
      !n.MemberExpression.check(node.callee) ||
      !n.Identifier.check(node.callee.object) ||
      !n.Identifier.check(node.callee.property) ||
      node.callee.computed ||
      node.callee.property.name !== "map"
    )
      continue;
    const callback = node.arguments[0];
    if (
      !n.ArrowFunctionExpression.check(callback) ||
      callback.params.length !== 1 ||
      !n.Identifier.check(callback.params[0]) ||
      !n.JSXElement.check(callback.body)
    )
      return null;
    const key = attribute(callback.body, "key");
    if (
      !key ||
      !n.JSXExpressionContainer.check(key.value) ||
      !n.MemberExpression.check(key.value.expression)
    )
      return null;
    const value = key.value.expression;
    if (
      value.computed ||
      !n.Identifier.check(value.object) ||
      !n.Identifier.check(value.property) ||
      value.object.name !== callback.params[0].name
    )
      return null;
    return {
      list: node.callee.object.name,
      parameter: value.object.name,
      key: value.property.name,
      value,
    };
  }
  return null;
}
function modulePath(file: string, specifier: string, sources: Sources, aliases: Aliases) {
  let resolved = specifier.startsWith(".")
    ? path.posix.join(path.posix.dirname(file), specifier)
    : null;
  for (const [pattern, targets] of Object.entries(aliases)) {
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
    if (specifier.startsWith(prefix) && targets.length === 1) {
      resolved = targets[0].replace("*", specifier.slice(prefix.length));
    }
  }
  if (resolved === null) return null;
  const matches = [resolved, resolved + ".tsx", resolved + ".ts", resolved + "/index.tsx"]
    .map((item) => path.posix.normalize(item))
    .filter((item) => Object.hasOwn(sources, item));
  return matches.length === 1 ? matches[0] : null;
}
function add<T>(map: Map<string, T[]>, key: string, item: T) {
  map.set(key, [...(map.get(key) ?? []), item]);
}
function unsupported(reason: string): Owner {
  return { kind: "unsupported", scope: "Edit source", reason };
}
function unique<T>(map: Map<string, T[]>, key: string): T | null {
  const items = map.get(key);
  return items?.length === 1 ? items[0] : null;
}

function sourceDigest(source: string) {
  return createHash("sha256").update(source).digest("hex");
}
function address(p: NodePath) {
  const names: (string | number)[] = [];
  for (let cursor = p; cursor.parent; cursor = cursor.parent) names.unshift(cursor.name);
  return JSON.stringify(names);
}

export function analyze(
  sources: Sources,
  aliases: Aliases,
  bindings: CommandBindings = {},
): Analysis {
  const modules = new Map<string, Module>();
  const hosts = new Map<string, Host[]>(),
    usages = new Map<string, Usage[]>();
  for (const [file, source] of Object.entries(sources)) {
    if (/\b(?:__ORC|_orc[A-Z])/.test(source))
      throw new Error("Reserved generated instrumentation names appear in authored source");
    const module: Module = {
      ast: parse(source),
      functions: new Map(),
      exports: new Map(),
      imports: new Map(),
      arrays: new Map(),
    };
    for (const statement of module.ast.program.body) {
      const declaration =
        n.ExportNamedDeclaration.check(statement) || n.ExportDefaultDeclaration.check(statement)
          ? statement.declaration
          : statement;
      if (
        n.FunctionDeclaration.check(declaration) &&
        declaration.id &&
        typeof declaration.id.name === "string"
      ) {
        const name = declaration.id.name;
        module.functions.set(name, { file, name, node: declaration });
        if (n.ExportDefaultDeclaration.check(statement)) module.exports.set("default", name);
        if (n.ExportNamedDeclaration.check(statement)) module.exports.set(name, name);
      }
      if (n.VariableDeclaration.check(declaration) && declaration.kind === "const") {
        for (const item of declaration.declarations) {
          if (
            n.VariableDeclarator.check(item) &&
            n.Identifier.check(item.id) &&
            n.ArrayExpression.check(item.init)
          ) {
            module.arrays.set(item.id.name, item.init);
          }
        }
      }
    }
    modules.set(file, module);
  }
  for (const [file, module] of modules) {
    for (const statement of module.ast.program.body) {
      if (!n.ImportDeclaration.check(statement)) continue;
      const targetFile = modulePath(file, String(statement.source.value), sources, aliases);
      const target = targetFile ? modules.get(targetFile) : null;
      if (!target || !targetFile) continue;
      for (const specifier of statement.specifiers ?? []) {
        const imported = n.ImportDefaultSpecifier.check(specifier)
          ? "default"
          : n.ImportSpecifier.check(specifier) && n.Identifier.check(specifier.imported)
            ? specifier.imported.name
            : null;
        const name = imported ? target.exports.get(imported) : null;
        if (name && specifier.local && typeof specifier.local.name === "string")
          module.imports.set(specifier.local.name, targetFile + "::" + name);
      }
    }
    recast.types.visit(module.ast, {
      visitJSXElement(p) {
        const node = p.node,
          tag = node.openingElement.name;
        const fn = parentFunction(p);
        const fnInfo =
          fn?.id && typeof fn.id.name === "string" ? module.functions.get(fn.id.name) : null;
        const component = fnInfo?.node === fn && fn?.id ? file + "::" + fn.id.name : null;
        const bound = bindings[file];
        const id =
          bound?.digest === sourceDigest(sources[file])
            ? (bound.ids[address(p)] ?? identity(file, component, node))
            : identity(file, component, node);
        if (n.JSXIdentifier.check(tag) && /^[a-z]/.test(tag.name)) {
          const loop = mapLoop(p);
          let nestedCallables = 0,
            nestedBlock = false;
          for (let cursor = p.parent; cursor && cursor.value !== fn; cursor = cursor.parent) {
            if (
              n.FunctionExpression.check(cursor.value) ||
              n.ArrowFunctionExpression.check(cursor.value)
            )
              nestedCallables++;
            if (n.BlockStatement.check(cursor.value) && cursor.value !== fn?.body)
              nestedBlock = true;
          }
          add(hosts, id, {
            id,
            file,
            component,
            node,
            loop,
            nested: nestedBlock || nestedCallables > (loop ? 1 : 0),
          });
        } else if (n.JSXIdentifier.check(tag)) {
          const local = module.functions.get(tag.name);
          const target = local ? file + "::" + local.name : module.imports.get(tag.name);
          if (target) add(usages, id, { id, file, target, node });
        }
        this.traverse(p);
      },
    });
  }
  return { sources, aliases, modules, hosts, usages, bindings };
}

// Distinguish separate authored usages within this exact source snapshot.
// These addresses are not matched against later external source replacements.
export function initialUsageBindings(analysis: Analysis): CommandBindings {
  const duplicates = new Set(
    [...analysis.usages.values()]
      .filter((items) => items.length > 1)
      .flat()
      .map((site) => site.node),
  );
  const bindings: CommandBindings = {};
  for (const [file, module] of analysis.modules) {
    const ids: Record<string, string> = {};
    const digest = sourceDigest(analysis.sources[file]);
    recast.types.visit(module.ast, {
      visitJSXElement(p) {
        if (duplicates.has(p.node)) {
          const key = address(p);
          ids[key] =
            "initial-" +
            createHash("sha256")
              .update(JSON.stringify([file, digest, key]))
              .digest("hex")
              .slice(0, 24);
        }
        this.traverse(p);
      },
    });
    if (Object.keys(ids).length) bindings[file] = { digest, ids };
  }
  return bindings;
}

function functionInfo(analysis: Analysis, key: string | null) {
  if (!key) return null;
  const [file, name] = key.split("::");
  return analysis.modules.get(file)?.functions.get(name) ?? null;
}
function hasSpread(node: n.JSXElement) {
  return node.openingElement.attributes?.some((item) => n.JSXSpreadAttribute.check(item));
}
function recordProperty(record: n.ObjectExpression, key: string) {
  const fields = record.properties.filter(
    (item) =>
      n.ObjectProperty.check(item) &&
      !item.computed &&
      (n.Identifier.check(item.key)
        ? item.key.name
        : n.StringLiteral.check(item.key)
          ? item.key.value
          : null) === key,
  );
  return fields.length === 1 && n.ObjectProperty.check(fields[0]) ? fields[0] : null;
}
function collectionArray(analysis: Analysis, host: Host) {
  if (!host.loop) return null;
  const module = analysis.modules.get(host.file);
  const array = module?.arrays.get(host.loop.list);
  if (!module || !array || array.elements.length === 0) return null;
  const keys: (string | number)[] = [];
  for (const item of array.elements) {
    if (
      !n.ObjectExpression.check(item) ||
      item.properties.some((p) => !n.ObjectProperty.check(p) || p.computed)
    )
      return null;
    const key = recordProperty(item, host.loop.key);
    const value = scalar(key?.value);
    if (value === undefined) return null;
    keys.push(value);
  }
  if (new Set(keys.map(String)).size !== keys.length) return null;
  // ponytail: reject unrecognized references; use lexical data-flow analysis before accepting mutation or shadowing.
  let unsafe = false;
  recast.types.visit(module.ast, {
    visitIdentifier(p) {
      if (p.node.name === host.loop?.list) {
        const parent = p.parent?.value;
        const declared =
          n.VariableDeclarator.check(parent) && parent.id === p.node && parent.init === array;
        const mapped =
          n.MemberExpression.check(parent) &&
          parent.object === p.node &&
          !parent.computed &&
          n.Identifier.check(parent.property) &&
          parent.property.name === "map";
        if (!declared && !mapped) unsafe = true;
      }
      this.traverse(p);
    },
  });
  return unsafe ? null : array;
}

export function resolve(
  analysis: Analysis,
  selection: Selection,
  field: "text" | "classes",
): Owner {
  const host = unique(analysis.hosts, selection.node);
  if (!host)
    return unsupported(
      "Selection invalidated: source element is missing or structurally ambiguous",
    );
  if (selection.usages.some((site) => !unique(analysis.usages, site))) {
    return unsupported(
      "Selection invalidated: component usage is missing or structurally ambiguous",
    );
  }
  if (hasSpread(host.node)) return unsupported("Spread attributes may override the authored value");
  if (host.nested)
    return unsupported("Nested callable or block scopes need lexical binding analysis");
  const info = functionInfo(analysis, host.component);
  if (!info) return unsupported("Only top-level named function components are mapped");
  const shared = [...analysis.usages.values()].some((items) =>
    items.some((item) => item.target === host.component),
  );
  const scope = host.loop
    ? "Every " + host.loop.list + " item"
    : shared
      ? "Every " + info.name + " instance"
      : "This element";
  if (field === "classes") {
    const a = attribute(host.node, "className");
    return a && stringValue(a.value) !== undefined
      ? { kind: "classes", file: host.file, host: host.id, scope }
      : unsupported("A complete static className string is required");
  }
  const children = (host.node.children ?? []).filter(
    (child) => !(n.JSXText.check(child) && !child.value.trim()),
  );
  if (children.length !== 1) return unsupported("Mixed or nested content has no single text owner");
  const child = children[0];
  if (
    n.JSXText.check(child) ||
    (n.JSXExpressionContainer.check(child) && n.StringLiteral.check(child.expression))
  ) {
    return { kind: "literal", file: host.file, host: host.id, scope };
  }
  if (!n.JSXExpressionContainer.check(child))
    return unsupported("Text is not a supported literal or expression");
  const expression = child.expression;
  if (
    n.MemberExpression.check(expression) &&
    !expression.computed &&
    n.Identifier.check(expression.object) &&
    n.Identifier.check(expression.property) &&
    host.loop &&
    expression.object.name === host.loop.parameter
  ) {
    const array = collectionArray(analysis, host);
    if (!array || selection.record === null)
      return unsupported("A local const array with unique literal React keys is required");
    const records = array.elements.filter(
      (item) =>
        n.ObjectExpression.check(item) &&
        scalar(recordProperty(item, host.loop!.key)?.value) === selection.record,
    );
    const record = records[0];
    if (
      records.length !== 1 ||
      !n.ObjectExpression.check(record) ||
      typeof scalar(recordProperty(record, expression.property.name)?.value) !== "string"
    ) {
      return unsupported("The selected record must own one literal string property");
    }
    return {
      kind: "collection",
      file: host.file,
      list: host.loop.list,
      key: host.loop.key,
      record: selection.record,
      property: expression.property.name,
      scope: "This item",
    };
  }
  if (n.Identifier.check(expression) && !host.loop) {
    const param = info.node.params[0];
    const prop =
      n.ObjectPattern.check(param) &&
      param.properties.find(
        (item) =>
          n.ObjectProperty.check(item) &&
          !item.computed &&
          n.Identifier.check(item.key) &&
          n.Identifier.check(item.value) &&
          item.value.name === expression.name,
      );
    if (prop && n.ObjectProperty.check(prop) && n.Identifier.check(prop.key)) {
      let assigned = false;
      recast.types.visit(info.node, {
        visitAssignmentExpression(p) {
          if (n.Identifier.check(p.node.left) && p.node.left.name === expression.name)
            assigned = true;
          this.traverse(p);
        },
        visitUpdateExpression(p) {
          if (n.Identifier.check(p.node.argument) && p.node.argument.name === expression.name)
            assigned = true;
          this.traverse(p);
        },
      });
      if (assigned) return unsupported("The prop binding is reassigned");
      const sites = selection.usages
        .map((id) => unique(analysis.usages, id))
        .filter((site) => site?.target === host.component);
      const site = sites.at(-1);
      const a = site && attribute(site.node, prop.key.name);
      if (!site || !a || hasSpread(site.node) || stringValue(a.value) === undefined) {
        return unsupported("The component usage must supply a literal string prop");
      }
      return {
        kind: "prop",
        file: site.file,
        site: site.id,
        property: prop.key.name,
        scope: "This instance",
      };
    }
  }
  return unsupported("Calculated text or external-data-shaped input has no supported source owner");
}

export function edit(
  analysis: Analysis,
  owner: Owner,
  value: string | { from: string; to: string },
): Sources {
  if (owner.kind === "unsupported") throw new Error("Edit source: " + owner.reason);
  if (owner.kind === "classes" && typeof value !== "string") {
    const host = unique(analysis.hosts, owner.host);
    const a = host && attribute(host.node, "className");
    const old = a && stringValue(a.value);
    if (!a || typeof old !== "string") throw new Error("Static classes no longer available");
    const tokens = old.split(/\s+/);
    if (tokens.filter((token) => token === value.from).length !== 1)
      throw new Error("The utility owner is ambiguous");
    a.value = b.stringLiteral(
      tokens.map((token) => (token === value.from ? value.to : token)).join(" "),
    );
  } else if (typeof value !== "string") throw new Error("Text edit requires a string");
  else if (owner.kind === "literal") {
    const host = unique(analysis.hosts, owner.host);
    if (!host) throw new Error("Source element no longer available");
    host.node.children = [b.jsxExpressionContainer(b.stringLiteral(value))];
  } else if (owner.kind === "prop") {
    const site = unique(analysis.usages, owner.site);
    const a = site && attribute(site.node, owner.property);
    if (!a) throw new Error("Component usage no longer available");
    a.value = b.jsxExpressionContainer(b.stringLiteral(value));
  } else if (owner.kind === "collection") {
    const array = analysis.modules.get(owner.file)?.arrays.get(owner.list);
    const records = array?.elements.filter(
      (item) =>
        n.ObjectExpression.check(item) &&
        scalar(recordProperty(item, owner.key)?.value) === owner.record,
    );
    const record = records?.[0];
    const p =
      records?.length === 1 &&
      n.ObjectExpression.check(record) &&
      recordProperty(record, owner.property);
    if (!p) throw new Error("Collection record no longer available");
    p.value = b.stringLiteral(value);
  } else throw new Error("Unsupported edit value");
  const result = { ...analysis.sources };
  const module = analysis.modules.get(owner.file);
  if (!module) throw new Error("Source module no longer available");
  result[owner.file] = recast.print(module.ast).code;
  return result;
}

// Carry only the exact AST nodes owned by this value-edit command into its next build.
// ponytail: no reconciliation for arbitrary source rewrites; invalidate them without command lineage.
export function editRetainingSelection(
  analysis: Analysis,
  selection: Selection,
  field: "text" | "classes",
  value: string | { from: string; to: string },
  carryCommandBindings = false,
): { sources: Sources; selection: Selection; bindings?: CommandBindings } {
  const host = unique(analysis.hosts, selection.node);
  const sites = selection.usages.map((id) => unique(analysis.usages, id));
  if (!host || sites.some((site) => !site)) throw new Error("Selection invalidated before editing");
  const sources = edit(analysis, resolve(analysis, selection, field), value);
  const targets = new Set([host.node, ...sites.flatMap((site) => (site ? [site.node] : []))]);
  const ids = new Map<n.JSXElement, string>();
  const bindings: CommandBindings = {};
  const oldIds = new Map(
    [...analysis.hosts.values(), ...analysis.usages.values()]
      .flat()
      .map((item) => [item.node, item.id]),
  );
  for (const [file, module] of analysis.modules) {
    const retained: Record<string, string> = {};
    recast.types.visit(module.ast, {
      visitJSXElement(p) {
        if (carryCommandBindings && targets.has(p.node)) {
          const prior = oldIds.get(p.node);
          if (!prior) throw new Error("Command node lineage unavailable");
          const stable = prior.startsWith("command-") ? prior : "command-" + prior;
          retained[address(p)] = stable;
          ids.set(p.node, stable);
        } else if (targets.has(p.node)) {
          // Normalize builders through the same parser used by the candidate rebuild.
          const statement = parse("const fragment = (" + recast.print(p.node).code + ");").program
            .body[0];
          assert(n.VariableDeclaration.check(statement));
          const variable = statement.declarations[0];
          assert(n.VariableDeclarator.check(variable));
          assert(n.JSXElement.check(variable.init));
          const fn = parentFunction(p);
          const component =
            fn?.id &&
            typeof fn.id.name === "string" &&
            module.functions.get(fn.id.name)?.node === fn
              ? file + "::" + fn.id.name
              : null;
          ids.set(p.node, identity(file, component, variable.init));
        }
        this.traverse(p);
      },
    });
    if (carryCommandBindings && Object.keys(retained).length) {
      // Exact AST addresses are carried only by this value mutation, never matched against an external rewrite.
      const rebuilt = parse(sources[file]);
      const found = new Set<string>();
      recast.types.visit(rebuilt, {
        visitJSXElement(p) {
          found.add(address(p));
          this.traverse(p);
        },
      });
      if (Object.keys(retained).some((key) => !found.has(key)))
        throw new Error("Command changed selected AST structure");
      bindings[file] = { digest: sourceDigest(sources[file]), ids: retained };
    }
  }
  const node = ids.get(host.node);
  if (!node) throw new Error("Edited node lineage unavailable");
  const usages = sites.map((site) => {
    const id = site && ids.get(site.node);
    if (!id) throw new Error("Edited usage lineage unavailable");
    return id;
  });
  return {
    sources,
    selection: { node, usages, record: selection.record },
    ...(carryCommandBindings ? { bindings } : {}),
  };
}

export function instrument(analysis: Analysis, runtimePath: string, enabled = true): Sources {
  const generated = analyze(analysis.sources, analysis.aliases, analysis.bindings);
  const hostNodes = new Map<n.JSXElement, Host>(),
    siteNodes = new Map<n.JSXElement, Usage>();
  for (const items of generated.hosts.values())
    for (const item of items) hostNodes.set(item.node, item);
  for (const items of generated.usages.values())
    for (const item of items) siteNodes.set(item.node, item);
  const attr = (name: string, value: string) =>
    b.jsxAttribute(b.jsxIdentifier(name), b.stringLiteral(value));
  const output: Sources = {};
  for (const [file, module] of generated.modules) {
    const dialogImports = new Set(
      module.ast.program.body.flatMap((statement) =>
        n.ImportDeclaration.check(statement) && statement.source.value === "@base-ui/react/dialog"
          ? (statement.specifiers ?? []).flatMap((specifier) =>
              n.ImportSpecifier.check(specifier) &&
              n.Identifier.check(specifier.imported) &&
              specifier.imported.name === "Dialog" &&
              specifier.local
                ? [specifier.local.name]
                : [],
            )
          : [],
      ),
    );
    recast.types.visit(module.ast, {
      visitJSXElement(p) {
        if (!enabled) return false;
        const host = hostNodes.get(p.node),
          site = siteNodes.get(p.node);
        this.traverse(p);
        const tagName = p.node.openingElement.name;
        if (
          n.JSXMemberExpression.check(tagName) &&
          n.JSXIdentifier.check(tagName.object) &&
          dialogImports.has(tagName.object.name) &&
          tagName.property.name === "Root"
        ) {
          p.node.openingElement.name = b.jsxIdentifier("__ORCRevealDialog");
          if (p.node.closingElement)
            p.node.closingElement.name = b.jsxIdentifier("__ORCRevealDialog");
          p.node.openingElement.attributes?.unshift(
            b.jsxAttribute(
              b.jsxIdentifier("_orcPrimitive"),
              b.jsxExpressionContainer(
                b.memberExpression(b.identifier(tagName.object.name), b.identifier("Root")),
              ),
            ),
          );
        } else if (host && n.JSXIdentifier.check(p.node.openingElement.name)) {
          const tag = p.node.openingElement.name.name;
          p.node.openingElement.name = b.jsxIdentifier("__ORCHost");
          if (p.node.closingElement) p.node.closingElement.name = b.jsxIdentifier("__ORCHost");
          p.node.openingElement.attributes?.unshift(
            attr("_orcTag", tag),
            attr("_orcNode", host.id),
          );
          if (host.loop)
            p.node.openingElement.attributes?.push(
              b.jsxAttribute(
                b.jsxIdentifier("_orcRecord"),
                b.jsxExpressionContainer(host.loop.value),
              ),
            );
        } else if (site) {
          const key = attribute(p.node, "key");
          p.replace(
            b.jsxElement(
              b.jsxOpeningElement(
                b.jsxIdentifier("__ORCScope"),
                [attr("site", site.id), ...(key ? [key] : [])],
                false,
              ),
              b.jsxClosingElement(b.jsxIdentifier("__ORCScope")),
              // Recast preserves return-expression parentheses. Keep them in an expression,
              // otherwise wrapping a parenthesized JSX return prints literal '(' and ')' children.
              [b.jsxExpressionContainer(p.node)],
            ),
          );
        }
      },
    });
    for (const statement of module.ast.program.body) {
      if (!n.ImportDeclaration.check(statement)) continue;
      const resolved = modulePath(
        file,
        String(statement.source.value),
        analysis.sources,
        analysis.aliases,
      );
      if (resolved) {
        let relative = path.posix.relative(path.posix.dirname(file), resolved);
        if (!relative.startsWith(".")) relative = "./" + relative;
        statement.source = b.stringLiteral(relative);
      }
    }
    output[file] =
      (enabled
        ? "import { Host as __ORCHost, Scope as __ORCScope, RevealDialog as __ORCRevealDialog } from " +
          JSON.stringify(runtimePath) +
          ";\n"
        : "") + recast.print(module.ast).code;
  }
  return output;
}

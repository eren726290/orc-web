import assert from "node:assert/strict";
import * as recast from "recast";
import { namedTypes as n, builders as b } from "ast-types";
import {
  analyze,
  parse,
  resolve,
  type Aliases,
  type Analysis,
  type Selection,
  type Sources,
} from "../automatic-source-mapping/resolver";

type CopyResult = {
  sources: Sources;
  node: string;
  rootUsage: string;
  copied: { from: string; to: string }[];
};

function one<T>(items: T[] | undefined, reason: string): T {
  if (items?.length !== 1) throw new Error("Only this unavailable: " + reason);
  return items[0];
}

function owningComponent(analysis: Analysis, file: string, target: n.JSXElement) {
  const module = analysis.modules.get(file);
  if (!module) return null;
  const owners: string[] = [];
  for (const [name, info] of module.functions) {
    let found = false;
    recast.types.visit(info.node, {
      visitJSXElement(p) {
        if (p.node === target) found = true;
        this.traverse(p);
      },
    });
    if (found) owners.push(file + "::" + name);
  }
  return owners.length === 1 ? owners[0] : null;
}

function directExports(analysis: Analysis, component: string) {
  const [file, name] = component.split("::");
  const module = analysis.modules.get(file);
  return module?.exports.get(name) === name;
}

function pathToOwner(analysis: Analysis, root: string, owner: string) {
  const edges = new Map<string, string[]>();
  for (const usages of analysis.usages.values()) {
    for (const usage of usages) {
      const parent = owningComponent(analysis, usage.file, usage.node);
      if (parent) edges.set(parent, [...(edges.get(parent) ?? []), usage.target]);
    }
  }
  const queue: string[][] = [[root]];
  const complete: string[][] = [];
  while (queue.length) {
    const current = queue.shift()!;
    const last = current.at(-1)!;
    if (last === owner) complete.push(current);
    else
      for (const next of new Set(edges.get(last) ?? []))
        if (!current.includes(next)) queue.push([...current, next]);
  }
  return one(complete, "the selected owner must have one local definition path");
}

function rejectCapturedModuleBindings(analysis: Analysis, component: string) {
  const [file, name] = component.split("::");
  const module = analysis.modules.get(file);
  const info = module?.functions.get(name);
  assert(info && module);
  const fn = info.node;
  const statement = fn.body.body[0];
  if (
    fn.async ||
    fn.generator ||
    fn.body.body.length !== 1 ||
    !n.ReturnStatement.check(statement) ||
    !n.JSXElement.check(statement.argument)
  )
    throw new Error(
      "Only this unavailable: copied functions require one direct JSX return; closures and executable bodies are unsupported",
    );
  const allowed = new Set<string>();
  for (const parameter of fn.params) {
    if (!n.ObjectPattern.check(parameter))
      throw new Error("Only this unavailable: only plain destructured parameters are supported");
    for (const property of parameter.properties) {
      if (
        !n.ObjectProperty.check(property) ||
        property.computed ||
        !n.Identifier.check(property.value)
      )
        throw new Error(
          "Only this unavailable: parameter defaults, rest and nested bindings are unsupported",
        );
      allowed.add(property.value.name);
    }
  }
  const imports = new Set<string>();
  for (const declaration of module.ast.program.body)
    if (n.ImportDeclaration.check(declaration))
      for (const specifier of declaration.specifiers ?? [])
        if (specifier.local && typeof specifier.local.name === "string")
          imports.add(specifier.local.name);
  recast.types.visit(statement.argument, {
    visitJSXSpreadAttribute() {
      throw new Error("Only this unavailable: spread bindings are unsupported");
    },
    visitJSXExpressionContainer(p) {
      const expression = p.node.expression;
      if (n.Identifier.check(expression)) {
        if (!allowed.has(expression.name) && !imports.has(expression.name))
          throw new Error(
            `Only this unavailable: ${name} captures module binding ${expression.name}; arbitrary closures are unsupported`,
          );
      } else if (
        !n.JSXElement.check(expression) &&
        !n.StringLiteral.check(expression) &&
        !n.NumericLiteral.check(expression) &&
        !n.BooleanLiteral.check(expression) &&
        !n.NullLiteral.check(expression) &&
        !n.JSXEmptyExpression.check(expression)
      )
        throw new Error("Only this unavailable: computed expressions and closures are unsupported");
      this.traverse(p);
    },
    visitJSXOpeningElement(p) {
      const tag = p.node.name;
      if (!n.JSXIdentifier.check(tag))
        throw new Error("Only this unavailable: namespace component bindings are unsupported");
      if (/^[A-Z]/.test(tag.name) && !imports.has(tag.name))
        throw new Error(
          "Only this unavailable: local function dependencies must use direct imports",
        );
      if (allowed.has(tag.name))
        throw new Error("Only this unavailable: a parameter shadows a component import");
      this.traverse(p);
    },
  });
}

function freshName(analysis: Analysis, file: string, base: string) {
  const module = analysis.modules.get(file);
  assert(module);
  const used = new Set<string>();
  recast.types.visit(module.ast, {
    visitIdentifier(p) {
      used.add(p.node.name);
      this.traverse(p);
    },
    visitJSXIdentifier(p) {
      used.add(p.node.name);
      this.traverse(p);
    },
  });
  let candidate = base + "Independent";
  for (let suffix = 2; used.has(candidate); suffix++) candidate = base + "Independent" + suffix;
  return candidate;
}

function cloneFunction(source: n.FunctionDeclaration, name: string) {
  const statement = parse(recast.print(source).code).program.body[0];
  assert(n.FunctionDeclaration.check(statement));
  assert(statement.id);
  statement.id = b.identifier(name);
  return statement;
}

function appendExport(module: { ast: n.File }, declaration: n.FunctionDeclaration) {
  module.ast.program.body.push(b.exportNamedDeclaration(declaration, []));
}

function importIndependent(
  analysis: Analysis,
  importerFile: string,
  oldLocal: string,
  importedName: string,
  localName: string,
) {
  const module = analysis.modules.get(importerFile);
  assert(module);
  const declarations = module.ast.program.body.filter(
    (statement) =>
      n.ImportDeclaration.check(statement) &&
      statement.specifiers?.some((specifier) => specifier.local?.name === oldLocal),
  );
  const declaration = one(declarations, "the copied edge must use one direct import");
  assert(n.ImportDeclaration.check(declaration));
  if (
    !declaration.specifiers?.some(
      (specifier) => n.ImportSpecifier.check(specifier) && specifier.local?.name === oldLocal,
    )
  )
    throw new Error("Only this unavailable: copied edges require a named direct import");
  declaration.specifiers ??= [];
  declaration.specifiers.push(
    b.importSpecifier(b.identifier(importedName), b.identifier(localName)),
  );
}

export function onlyThis(
  sources: Sources,
  aliases: Aliases,
  selection: Selection,
  change: { from: string; to: string },
): CopyResult {
  const analysis = analyze(sources, aliases);
  const owner = resolve(analysis, selection, "classes");
  if (owner.kind !== "classes" || !owner.scope.startsWith("Every "))
    throw new Error("Only this unavailable: select one shared static class owner");
  const host = one(analysis.hosts.get(owner.host), "the selected source element is ambiguous");
  if (!host.component)
    throw new Error("Only this unavailable: selected source has no component owner");
  const selectedRoot = one(
    analysis.usages.get(selection.usages[0]),
    "the selected instance usage is ambiguous",
  );
  const copyPath = pathToOwner(analysis, selectedRoot.target, host.component);
  for (const component of copyPath) {
    if (!directExports(analysis, component))
      throw new Error("Only this unavailable: copied definitions must be directly exported");
    rejectCapturedModuleBindings(analysis, component);
  }

  const names = new Map<string, string>();
  for (const component of copyPath) {
    const [file, name] = component.split("::");
    names.set(component, freshName(analysis, file, name));
  }
  const clones = new Map<string, n.FunctionDeclaration>();
  for (const component of copyPath) {
    const [file, name] = component.split("::");
    const info = analysis.modules.get(file)?.functions.get(name);
    assert(info);
    clones.set(component, cloneFunction(info.node, names.get(component)!));
  }

  for (let index = 0; index < copyPath.length - 1; index++) {
    const parent = copyPath[index],
      child = copyPath[index + 1];
    const [parentFile] = parent.split("::"),
      [childFile, childName] = child.split("::");
    const module = analysis.modules.get(parentFile);
    const clone = clones.get(parent);
    assert(module && clone);
    const oldLocals = [...module.imports.entries()]
      .filter(([, target]) => target === child)
      .map(([local]) => local);
    if (parentFile === childFile) oldLocals.push(childName);
    const oldLocal = one([...new Set(oldLocals)], "the copied dependency must have one local name");
    const localName = freshName(analysis, parentFile, childName);
    let replacements = 0;
    recast.types.visit(clone, {
      visitJSXElement(p) {
        const tag = p.node.openingElement.name;
        if (n.JSXIdentifier.check(tag) && tag.name === oldLocal) {
          tag.name = localName;
          if (p.node.closingElement && n.JSXIdentifier.check(p.node.closingElement.name))
            p.node.closingElement.name.name = localName;
          replacements++;
        }
        this.traverse(p);
      },
    });
    if (replacements !== 1)
      throw new Error("Only this unavailable: copied dependency usage must be unique");
    if (parentFile !== childFile)
      importIndependent(analysis, parentFile, oldLocal, names.get(child)!, localName);
  }

  const [rootFile, rootName] = copyPath[0].split("::");
  const callerModule = analysis.modules.get(selectedRoot.file);
  assert(callerModule);
  const rootTag = selectedRoot.node.openingElement.name;
  if (!n.JSXIdentifier.check(rootTag))
    throw new Error("Only this unavailable: namespace component usages are unsupported");
  const oldRootLocal = rootTag.name;
  const newRootLocal = freshName(analysis, selectedRoot.file, rootName);
  rootTag.name = newRootLocal;
  if (
    selectedRoot.node.closingElement &&
    n.JSXIdentifier.check(selectedRoot.node.closingElement.name)
  )
    selectedRoot.node.closingElement.name.name = newRootLocal;
  if (selectedRoot.file !== rootFile)
    importIndependent(
      analysis,
      selectedRoot.file,
      oldRootLocal,
      names.get(copyPath[0])!,
      newRootLocal,
    );

  const ownerComponent = copyPath.at(-1)!;
  const originalInfo = analysis.modules
    .get(ownerComponent.split("::")[0])
    ?.functions.get(ownerComponent.split("::")[1]);
  const ownerClone = clones.get(ownerComponent);
  assert(originalInfo && ownerClone);
  const cloneHosts: n.JSXElement[] = [];
  const originalHostSource = recast.print(host.node).code;
  recast.types.visit(ownerClone, {
    visitJSXElement(p) {
      if (recast.print(p.node).code === originalHostSource) cloneHosts.push(p.node);
      this.traverse(p);
    },
  });
  const cloneHost = one(cloneHosts, "copied owner lineage must be unique");
  const classAttribute = cloneHost.openingElement.attributes?.find(
    (attribute) => n.JSXAttribute.check(attribute) && attribute.name.name === "className",
  );
  if (!n.JSXAttribute.check(classAttribute) || !n.StringLiteral.check(classAttribute.value))
    throw new Error("Only this unavailable: copied owner needs a static className");
  const tokens = classAttribute.value.value.split(/\s+/);
  if (tokens.filter((token) => token === change.from).length !== 1)
    throw new Error("Only this unavailable: requested utility is ambiguous");
  classAttribute.value = b.stringLiteral(
    tokens.map((token) => (token === change.from ? change.to : token)).join(" "),
  );

  for (const component of [...copyPath].reverse()) {
    const [file] = component.split("::");
    appendExport(analysis.modules.get(file)!, clones.get(component)!);
  }
  const nextSources = { ...sources };
  for (const [file, module] of analysis.modules) nextSources[file] = recast.print(module.ast).code;
  const next = analyze(nextSources, aliases);
  const copiedOwner = ownerComponent.split("::")[0] + "::" + names.get(ownerComponent);
  const changedHostSource = recast.print(cloneHost).code;
  const copiedHosts = [...next.hosts.values()]
    .flat()
    .filter(
      (item) =>
        item.component === copiedOwner && recast.print(item.node).code === changedHostSource,
    );
  const copiedHost = one(copiedHosts, "the copied owner must map to one host");
  const copiedRoot = [...next.usages.values()]
    .flat()
    .filter(
      (item) =>
        item.target === rootFile + "::" + names.get(copyPath[0]) && item.file === selectedRoot.file,
    );
  const rootUsage = one(copiedRoot, "the redirected usage must be unique");
  return {
    sources: nextSources,
    node: copiedHost.id,
    rootUsage: rootUsage.id,
    copied: copyPath.map((component) => ({
      from: component,
      to: component.split("::")[0] + "::" + names.get(component),
    })),
  };
}

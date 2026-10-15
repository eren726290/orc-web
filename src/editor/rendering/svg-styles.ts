import { svgContent } from "../../../shared/source/svg-source";

export function scopedSVGContent(source: string, id: string, interactive: boolean) {
  const parsed = new DOMParser().parseFromString(`<svg>${svgContent(source)}</svg>`, "text/html");
  const svg = parsed.querySelector("svg");
  if (!svg) throw new Error("Missing SVG artwork.");
  for (const style of svg.querySelectorAll("style")) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style.textContent ?? "");
    removeGlobalRules(sheet);
    // Scope selectors without rewriting the source saved or shown in Code.
    style.textContent = `@scope ([data-orc-id="${CSS.escape(id)}"]) { ${[...sheet.cssRules].map((rule) => rule.cssText).join("\n")} }`;
  }
  if (!interactive)
    for (const element of svg.querySelectorAll(
      "a,[tabindex],[autofocus],[contenteditable],[focusable]",
    )) {
      element.setAttribute("tabindex", "-1");
      element.removeAttribute("autofocus");
      if (element.hasAttribute("contenteditable")) element.setAttribute("contenteditable", "false");
    }
  return svg.innerHTML;
}

function removeGlobalRules(group: CSSStyleSheet | CSSGroupingRule) {
  for (let index = group.cssRules.length - 1; index >= 0; index--) {
    const rule = group.cssRules[index];
    if (localGroup(rule)) removeGlobalRules(rule);
    else if (!(rule instanceof CSSNestedDeclarations)) group.deleteRule(index);
  }
}

function localGroup(rule: CSSRule): rule is CSSGroupingRule {
  return (
    rule instanceof CSSStyleRule ||
    rule instanceof CSSMediaRule ||
    rule instanceof CSSSupportsRule ||
    rule instanceof CSSContainerRule ||
    rule instanceof CSSScopeRule
  );
}

export function validateSVGStyles(element: Element) {
  for (const style of element.querySelectorAll("style")) {
    const sheet = new CSSStyleSheet();
    const source = style.textContent ?? "";
    sheet.replaceSync(source);
    assertLocalRules(sheet.cssRules);
  }
}

function assertLocalRules(rules: CSSRuleList) {
  for (const rule of rules) {
    if (localGroup(rule)) assertLocalRules(rule.cssRules);
    else if (!(rule instanceof CSSNestedDeclarations))
      throw new Error(
        "SVG styles support local selectors, media, supports, container and scope rules; global stylesheet definitions are unsupported.",
      );
  }
}

import { htmlLanguage } from "@codemirror/lang-html";
import { cssLanguage } from "@codemirror/lang-css";
import type { DesignNode, NodeBase, Styles, TextRun } from "../../../shared/document/model";
import { validateSVGStyles } from "../rendering/svg-styles";
import {
  columnFlowAttribute,
  columnFlowStyle,
  columnLayout,
  columnLayoutAttribute,
  columnMarker,
  columnProjectionEligible,
  hasColumnProjection,
} from "../../../shared/source/intrinsic-column";

const inlineTags = new Set([
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "small",
  "sub",
  "sup",
  "br",
  "mark",
  "code",
]);
const allowedTags = new Set([
  "div",
  "section",
  "main",
  "article",
  "header",
  "footer",
  "nav",
  "aside",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "button",
  "a",
  "ul",
  "ol",
  "li",
  "label",
  "input",
  "textarea",
  "select",
  "option",
  "form",
  "img",
  "hr",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "blockquote",
  "pre",
  "details",
  "summary",
  ...inlineTags,
]);
const voidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const textTags = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "button",
  "a",
  "label",
  "pre",
  "blockquote",
  ...inlineTags,
]);

export async function importHTML(source: string): Promise<DesignNode[]> {
  validateMarkup(source);
  const root = htmlRoot(source);
  readElement(root, null, []);
  const host = document.createElement("div");
  document.body.append(host);
  try {
    host.innerHTML = root.outerHTML;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const mounted = host.firstElementChild;
    if (!mounted) throw new Error("The ordinary root could not render.");
    const nodes: DesignNode[] = [];
    readElement(mounted, null, nodes);
    return nodes;
  } finally {
    host.remove();
  }
}

function validateMarkup(source: string) {
  const tree = htmlLanguage.parser.configure({ dialect: "selfClosing" }).parse(source);
  tree.iterate({
    enter(node) {
      if (node.type.isError)
        throw new Error(`HTML near character ${node.from + 1} is incomplete or invalid.`);
      if (node.name !== "Element") return;
      const tag = node.node.getChild("OpenTag")?.getChild("TagName");
      if (
        tag &&
        !node.node.getChild("CloseTag") &&
        !voidTags.has(source.slice(tag.from, tag.to).toLowerCase())
      )
        throw new Error(`Missing closing tag near character ${node.from + 1}.`);
    },
  });
}

function htmlRoot(source: string): Element {
  const document = new DOMParser().parseFromString(source, "text/html");
  const roots = [...document.body.childNodes].filter(
    (node) =>
      node.nodeType !== Node.COMMENT_NODE &&
      !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()),
  );
  if (roots.length !== 1 || !(roots[0] instanceof Element))
    throw new Error("Provide one complete HTML root element.");
  if (document.head.childNodes.length)
    throw new Error(
      "Use inline CSS in this ordinary object; module source belongs to a component.",
    );
  return roots[0];
}

function readElement(element: Element, parentId: string | null, nodes: DesignNode[]): DesignNode {
  const tag = element.localName;
  const attributes = readAttributes(element);
  const style = readStyle(element.getAttribute("style") ?? "");
  const content = columnContent(element, style, attributes);
  const children: string[] = [];
  const base = {
    id: randomId(),
    name: element.getAttribute("layer-name") || tag,
    parentId,
    children,
    visible: true,
    locked: false,
    style,
    attributes,
  };
  if (tag === "svg") {
    validateSVG(element);
    const node: DesignNode = { ...base, kind: "svg", source: element.outerHTML };
    nodes.push(node);
    return node;
  }
  if (!allowedTags.has(tag)) throw new Error(`Unsupported ordinary HTML element: ${tag}.`);
  const node = ordinaryNode(base, element);
  nodes.push(node);
  if (node.kind === "element") for (const child of content) readChild(child, node, nodes);
  return node;
}

function columnContent(element: Element, style: Styles, attributes: Record<string, string>) {
  const version = element.getAttribute(columnLayoutAttribute);
  if (version === null) {
    if (Object.hasOwn(style, columnMarker)) {
      if (!hasColumnProjection(style)) invalidColumn();
      delete style[columnMarker];
    }
    return element.childNodes;
  }
  const flow = element.firstElementChild;
  if (version !== columnLayout || element.localName !== "div" || !flow) invalidColumn();
  if (!hasColumnProjection(style) || !exactColumnFlow(element, flow)) invalidColumn();
  restoreColumnStyle(style);
  delete attributes[columnLayoutAttribute];
  return flow.childNodes;
}

function restoreColumnStyle(style: Styles) {
  const display = style.display;
  if (display?.replace(/\s*!important\s*$/iu, "").trim() !== "grid") invalidColumn();
  for (const key of ["grid-template-rows", "grid-template-columns"]) {
    if (style[key] !== "minmax(0px, 1fr)") invalidColumn();
    delete style[key];
  }
  if (!columnProjectionEligible(style)) invalidColumn();
  style.display = /!important\s*$/iu.test(display) ? "flex !important" : "flex";
}

function exactColumnFlow(element: Element, flow: Element): boolean {
  if (flow.localName !== "div" || flow.getAttribute(columnFlowAttribute) !== columnLayout)
    return false;
  if (flow.attributes.length !== 2 || !flow.hasAttribute("style")) return false;
  if (
    [...element.childNodes].some(
      (child) =>
        child !== flow && !(child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()),
    )
  )
    return false;
  let style: Styles;
  try {
    style = readStyle(flow.getAttribute("style") ?? "");
  } catch {
    invalidColumn();
  }
  const expected = readStyle(
    Object.entries(columnFlowStyle)
      .map(([key, value]) => `${key}: ${value};`)
      .join(" "),
  );
  return (
    Object.keys(style).length === Object.keys(expected).length &&
    Object.entries(expected).every(([key, value]) => style[key] === value)
  );
}

function invalidColumn(): never {
  throw new Error(
    "The intrinsic Column source does not match its generated layout. Restore its supported version, wrapper and CSS, or remove data-orc-layout and any unknown --orc-intrinsic-column version to use ordinary HTML.",
  );
}

function ordinaryNode(base: NodeBase, element: Element): DesignNode {
  const tag = element.localName;
  if (tag === "img") return { ...base, kind: "image" };
  if (textTags.has(tag) && isTextElement(element))
    return { ...base, kind: "text", tag, runs: readRuns(element, {}) };
  return { ...base, kind: "element", tag };
}

function readChild(child: ChildNode, parent: DesignNode, nodes: DesignNode[]) {
  if (child instanceof Element) parent.children.push(readElement(child, parent.id, nodes).id);
  else if (child.nodeType === Node.TEXT_NODE && child.textContent && meaningfulText(child)) {
    const node: DesignNode = {
      id: randomId(),
      kind: "text",
      tag: "span",
      name: "Text",
      parentId: parent.id,
      children: [],
      visible: true,
      locked: false,
      style: {},
      attributes: {},
      runs: [{ text: child.textContent, style: {} }],
    };
    nodes.push(node);
    parent.children.push(node.id);
  }
}

function meaningfulText(child: ChildNode): boolean {
  if (child.textContent?.trim()) return true;
  const range = document.createRange();
  range.selectNodeContents(child);
  const rectangles = [...range.getClientRects()];
  const whitespace = child.parentElement
    ? getComputedStyle(child.parentElement).whiteSpace
    : "normal";
  return (
    rectangles.length > 0 &&
    (whitespace.startsWith("pre") ||
      whitespace === "break-spaces" ||
      rectangles.some((box) => box.width > 0))
  );
}

function randomId(): string {
  return [...crypto.getRandomValues(new Uint32Array(4))]
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("");
}

function isTextElement(element: Element): boolean {
  return [...element.childNodes].every(
    (child) =>
      !(child instanceof Element) ||
      (inlineTags.has(child.localName) &&
        [...child.attributes].every(({ name }) => name === "style") &&
        isTextElement(child)),
  );
}

function readRuns(element: Element, inherited: Styles): TextRun[] {
  const styles: Record<string, Styles> = {
    b: { "font-weight": "700" },
    strong: { "font-weight": "700" },
    i: { "font-style": "italic" },
    em: { "font-style": "italic" },
    u: { "text-decoration": "underline" },
    s: { "text-decoration": "line-through" },
  };
  return [...element.childNodes].flatMap((child): TextRun[] => {
    if (child.nodeType === Node.TEXT_NODE)
      return [{ text: child.textContent ?? "", style: inherited }];
    if (!(child instanceof Element)) return [];
    readAttributes(child);
    if (child.localName === "br")
      return [{ text: "\n", style: { ...inherited, "white-space": "pre" } }];
    return readRuns(child, {
      ...inherited,
      ...styles[child.localName],
      ...readStyle(child.getAttribute("style") ?? ""),
    });
  });
}

function readAttributes(element: Element): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const { name, value } of element.attributes) {
    if (
      name.startsWith("on") ||
      name === "srcdoc" ||
      (/^(?:href|src|action|formaction)$/u.test(name) && /^\s*javascript:/iu.test(value))
    )
      throw new Error(`Executable attribute ${name} belongs to React source.`);
    if (name === "class")
      throw new Error(
        "Ordinary HTML uses inline styles; import component source for stylesheet classes.",
      );
    if (!["style", "layer-name"].includes(name)) attributes[name] = value;
  }
  return attributes;
}

function readStyle(source: string): Styles {
  const element = document.createElement("div");
  element.style.cssText = source;
  const css = `div { ${source} }`;
  cssLanguage.parser.parse(css).iterate({
    enter(node) {
      if (node.type.isError) throw new Error("The inline CSS is incomplete or invalid.");
      if (node.name !== "Declaration") return;
      const property = node.node.getChild("PropertyName") ?? node.node.getChild("VariableName");
      const colon = node.node.getChild(":");
      if (!property || !colon) throw new Error("The inline CSS declaration is incomplete.");
      const key = css.slice(property.from, property.to);
      const value = css
        .slice(colon.to, node.to)
        .trim()
        .replace(/\s*!important\s*$/iu, "");
      if (!value || (!key.startsWith("--") && !CSS.supports(key, value)))
        throw new Error(`Invalid CSS: ${key}: ${value}.`);
    },
  });
  return Object.fromEntries(
    [...element.style].map((key) => [
      key,
      element.style.getPropertyValue(key) +
        (element.style.getPropertyPriority(key) ? " !important" : ""),
    ]),
  );
}

function validateSVG(element: Element) {
  for (const style of element.querySelectorAll("style"))
    cssLanguage.parser.parse(style.textContent ?? "").iterate({
      enter(node) {
        if (node.type.isError) throw new Error("The SVG stylesheet is incomplete or invalid.");
        if (node.name === "ImportStatement")
          throw new Error("SVG styles cannot import external stylesheets.");
      },
    });
  validateSVGStyles(element);
  for (const child of [element, ...element.querySelectorAll("*")]) {
    if (["script", "foreignObject", "iframe"].includes(child.localName))
      throw new Error(`Unsupported SVG content: ${child.localName}.`);
    readAttributes(child);
  }
}

import { parser } from "@lezer/html";

export function svgContent(source: string): string {
  const tree = parser.configure({ dialect: "selfClosing" }).parse(source);
  const element = tree.topNode.getChild("Element");
  const opening = element?.getChild("OpenTag") ?? element?.getChild("SelfClosingTag");
  const tag = opening?.getChild("TagName");
  if (!opening || !tag || source.slice(tag.from, tag.to).toLowerCase() !== "svg")
    throw new Error("The vector source must contain one SVG root.");
  if (opening.name === "SelfClosingTag") return "";
  const closing = element?.getChild("CloseTag");
  if (!closing) throw new Error("The SVG root is incomplete.");
  return source.slice(opening.to, closing.from);
}

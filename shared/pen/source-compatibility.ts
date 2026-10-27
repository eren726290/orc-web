import { parser } from "@lezer/html";
import type { PenRecord } from "./model";
import { penPathData } from "./source";
import { svgContent } from "../source/svg-source";

export function compatiblePenSource(source: string, record: PenRecord): boolean {
  const content = svgContent(source).trim();
  const tree = parser.configure({ dialect: "selfClosing" }).parse(content);
  let invalid = false;
  tree.iterate({
    enter(node) {
      if (node.type.isError) invalid = true;
    },
  });
  const elements = tree.topNode.getChildren("Element");
  const element = elements[0];
  if (
    invalid ||
    elements.length !== 1 ||
    !element ||
    content.slice(0, element.from).trim() ||
    content.slice(element.to).trim()
  )
    return false;
  const opening = element.getChild("SelfClosingTag") ?? element.getChild("OpenTag");
  const tag = opening?.getChild("TagName");
  if (!opening || !tag || content.slice(tag.from, tag.to) !== "path") return false;
  return compatiblePath(content, element, opening, record);
}

function compatiblePath(
  content: string,
  element: ReturnType<typeof parser.parse>["topNode"],
  opening: ReturnType<typeof parser.parse>["topNode"],
  record: PenRecord,
): boolean {
  const attributes = opening.getChildren("Attribute");
  const name = attributes[0]?.getChild("AttributeName");
  const value = attributes[0]?.getChild("AttributeValue");
  if (attributes.length !== 1 || !name || !value || content.slice(name.from, name.to) !== "d")
    return false;
  const closing = element.getChild("CloseTag");
  if (closing && content.slice(opening.to, closing.from).trim()) return false;
  const data = content.slice(value.from, value.to);
  const unquoted = /^["']/u.test(data) ? data.slice(1, -1) : data;
  return samePathNumbers(unquoted, penPathData(record));
}

function samePathNumbers(incoming: string, canonical: string): boolean {
  const token = /[MLAZ]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/giu;
  const parts = incoming.match(token);
  const expected = canonical.match(token);
  if (
    incoming.replace(token, "").replace(/[\s,]/gu, "") ||
    !parts ||
    !expected ||
    parts.length !== expected.length
  )
    return false;
  for (let index = 0; index < expected.length; index++)
    if (
      expected[index] === "A" &&
      (!/^[01]$/u.test(parts[index + 4]) || !/^[01]$/u.test(parts[index + 5]))
    )
      return false;
  return parts.every((part, index) =>
    Number.isFinite(Number(expected[index]))
      ? Number(part) === Number(expected[index])
      : part === expected[index],
  );
}

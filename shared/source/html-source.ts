import type { DesignDocument, DesignNode, Styles } from "../document/model";
import { svgContent } from "./svg-source";

function escape(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );
}

function styleSource(style: Styles): string {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
}

export function nodeSource(document: DesignDocument, id: string): string {
  const node = document.nodes[id];
  if (!node) throw new Error("Object no longer exists.");
  if (node.kind === "svg") return `<svg${sourceAttributes(node)}>${svgContent(node.source)}</svg>`;
  const tag = node.kind === "image" ? "img" : node.kind === "frame" ? "div" : node.tag;
  const attributes = sourceAttributes(node);
  if (["img", "br", "hr", "input", "wbr", "area", "col", "source"].includes(tag))
    return `<${tag}${attributes}>`;
  const content =
    node.kind === "text"
      ? node.runs
          .map((run) =>
            Object.keys(run.style).length
              ? `<span style="${escape(styleSource(run.style))}">${escape(run.text)}</span>`
              : escape(run.text),
          )
          .join("")
      : node.children.map((child) => nodeSource(document, child)).join("");
  return `<${tag}${attributes}>${content}</${tag}>`;
}

function sourceAttributes(node: DesignNode): string {
  const style = { ...node.style };
  if (node.kind === "frame") style.overflow = node.clipContent ? "hidden" : "visible";
  const values = { ...node.attributes, "layer-name": node.name, style: styleSource(style) };
  return Object.entries(values)
    .map(([key, value]) => ` ${key}="${escape(value)}"`)
    .join("");
}

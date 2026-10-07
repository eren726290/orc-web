import { createElement, type CSSProperties } from "react";
import type { DesignDocument, DesignNode, Styles } from "../shared/model";

function cssStyle(style: Styles): CSSProperties {
  return Object.fromEntries(
    Object.entries(style).map(([key, value]) => [
      key.startsWith("--")
        ? key
        : key.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase()),
      value.replace(/\s*!important\s*$/iu, ""),
    ]),
  );
}

export function RenderNode({ document, id }: { document: DesignDocument; id: string }) {
  const node = document.nodes[id];
  if (!node || !node.visible) return null;
  const attributes = nodeAttributes(node);
  const children = node.children.map((child) => (
    <RenderNode key={child} document={document} id={child} />
  ));
  switch (node.kind) {
    case "image":
      return createElement("img", { ...attributes, alt: node.attributes.alt ?? "" });
    case "svg":
      return <div {...attributes} dangerouslySetInnerHTML={{ __html: node.source }} />;
    case "text":
      return createElement(
        node.tag,
        attributes,
        node.runs.map((run, index) => (
          <span key={index} style={cssStyle(run.style)}>
            {run.text}
          </span>
        )),
      );
    case "frame":
      return <div {...attributes}>{children}</div>;
    case "element":
      return createElement(node.tag, attributes, children);
  }
}

function nodeAttributes(node: DesignNode) {
  const style =
    node.kind === "frame"
      ? { ...node.style, overflow: node.clipContent ? "hidden" : "visible" }
      : node.style;
  return {
    ...node.attributes,
    "data-orc-id": node.id,
    style: cssStyle(style),
    ref: (element: HTMLElement | SVGElement | null) => projectStyle(element, style),
  };
}

function projectStyle(element: HTMLElement | SVGElement | null, style: Styles) {
  if (!element) return;
  for (const [key, value] of Object.entries(style))
    element.style.setProperty(
      key,
      value.replace(/\s*!important\s*$/iu, ""),
      /!important\s*$/iu.test(value) ? "important" : "",
    );
}

export function createTextNode(x: number, y: number, text: string): DesignNode {
  return {
    id: crypto.randomUUID(),
    kind: "text",
    tag: "p",
    name: "Text",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    attributes: {},
    runs: [{ text, style: {} }],
    style: {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: "max-content",
      height: "auto",
      margin: "0",
      "font-family": "system-ui, sans-serif",
      "font-size": "24px",
      "white-space": "pre-wrap",
      color: "#181818",
    },
  };
}

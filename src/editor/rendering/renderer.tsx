import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import {
  containsNode,
  textContent,
  type DesignDocument,
  type DesignNode,
  type Styles,
} from "../../../shared/document/model";
import { scopedSVGContent } from "./svg-styles";
import {
  columnFlowAttribute,
  columnFlowStyle,
  columnLayout,
  columnLayoutAttribute,
  hasColumnProjection,
  projectColumnStyle,
} from "../../../shared/source/intrinsic-column";

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

export function RenderNode({
  document,
  id,
  scopeId,
}: {
  document: DesignDocument;
  id: string;
  scopeId?: string;
}) {
  const node = document.nodes[id];
  if (!node || !node.visible) return null;
  const attributes = nodeAttributes(node, document, scopeId);
  const children = node.children.map((child) => (
    <RenderNode key={child} document={document} id={child} scopeId={scopeId} />
  ));
  const content = columnChildren(node.style, children);
  switch (node.kind) {
    case "image":
      return createElement("img", { ...attributes, alt: node.attributes.alt ?? "" });
    case "svg":
      return (
        <svg
          {...attributes}
          dangerouslySetInnerHTML={{
            __html: scopedSVGContent(node.source, node.id, scopeId !== undefined),
          }}
        />
      );
    case "text":
      return renderText(node, attributes, scopeId !== undefined);
    case "frame":
      return <div {...attributes}>{content}</div>;
    case "element":
      return createElement(node.tag, attributes, content);
  }
}

function columnChildren(style: Styles, children: ReactNode[]) {
  return hasColumnProjection(style)
    ? createElement(
        "div",
        {
          [columnFlowAttribute]: columnLayout,
          style: cssStyle(columnFlowStyle),
        },
        children,
      )
    : children.length
      ? children
      : undefined;
}

function renderText(
  node: Extract<DesignNode, { kind: "text" }>,
  attributes: ReturnType<typeof nodeAttributes>,
  interactive: boolean,
) {
  if (node.tag === "textarea")
    return createElement("textarea", {
      ...attributes,
      defaultValue: textContent(node),
      readOnly: !interactive || node.attributes.readonly !== undefined,
    });
  if (node.tag === "option") return createElement("option", attributes, textContent(node));
  return createElement(
    node.tag,
    attributes,
    node.runs.map((run, index) => (
      <span key={index} style={cssStyle(run.style)}>
        {run.text}
      </span>
    )),
  );
}

function svgAttributes(attributes: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(attributes)
      .filter(([key]) => !["tabindex", "autofocus", "contenteditable"].includes(key))
      .map(([key, value]) => [
        key.startsWith("data-") || key.startsWith("aria-")
          ? key
          : key.replace(/[:-]([a-z])/gu, (_, letter: string) => letter.toUpperCase()),
        value,
      ]),
  );
}

function nodeAttributes(node: DesignNode, document: DesignDocument, scopeId?: string) {
  const within = scopeId !== undefined && containsNode(document, scopeId, node.id);
  const ancestor = scopeId !== undefined && containsNode(document, node.id, scopeId);
  const style = nodeStyle(node, scopeId, within);
  return {
    ...(node.kind === "svg"
      ? svgAttributes(node.attributes)
      : nativeAttributes(node, within, document)),
    "data-orc-id": node.id,
    ...(hasColumnProjection(node.style) ? { [columnLayoutAttribute]: columnLayout } : {}),
    ...focusAttributes(node.attributes, within),
    inert:
      scopeId !== undefined && !within && !ancestor ? true : node.attributes.inert !== undefined,
    style: undefined,
    ref: (element: HTMLElement | SVGElement | null) =>
      projectStyle(element, style, ancestor && !within),
  };
}

function nodeStyle(node: DesignNode, scopeId: string | undefined, within: boolean): Styles {
  let style =
    node.kind === "frame"
      ? { ...node.style, overflow: node.clipContent ? "hidden" : "visible" }
      : node.style;
  if (scopeId && !within)
    style = {
      ...style,
      visibility: "hidden",
      "pointer-events": "none",
    };
  if (scopeId === node.id) style = { visibility: "visible", "pointer-events": "auto", ...style };
  return projectColumnStyle(style);
}

function nativeAttributes(node: DesignNode, interactive: boolean, document: DesignDocument) {
  const attributes = htmlAttributes(node.attributes);
  if ("tag" in node && node.tag === "option") delete attributes.selected;
  if (node.kind !== "element" || !["input", "select"].includes(node.tag)) return attributes;
  delete attributes.value;
  delete attributes.checked;
  if (node.tag === "select")
    return { ...attributes, defaultValue: defaultSelection(document, node) };
  return {
    ...attributes,
    defaultValue: node.attributes.value,
    defaultChecked: node.attributes.checked !== undefined,
    readOnly: !interactive || node.attributes.readonly !== undefined,
  };
}

function focusAttributes(attributes: DesignNode["attributes"], interactive: boolean) {
  return {
    tabIndex: interactive ? authoredTabIndex(attributes.tabindex) : -1,
    autoFocus: interactive && attributes.autofocus !== undefined,
    contentEditable:
      attributes.contenteditable === undefined
        ? undefined
        : interactive
          ? authoredEditing(attributes.contenteditable)
          : false,
    suppressContentEditableWarning: interactive && attributes.contenteditable !== undefined,
  };
}

function authoredTabIndex(value: string | undefined) {
  const index = Number.parseInt(value ?? "", 10);
  return Number.isFinite(index) ? index : undefined;
}

function authoredEditing(value: string): HTMLAttributes<HTMLElement>["contentEditable"] {
  const normalized = value.toLowerCase();
  if (normalized === "" || normalized === "true") return true;
  if (normalized === "false") return false;
  return normalized === "plaintext-only" ? "plaintext-only" : "inherit";
}

function defaultSelection(document: DesignDocument, node: DesignNode) {
  const selected = nativeOptions(document, node.id)
    .filter((option) => option.selected)
    .map((option) => option.value);
  return node.attributes.multiple !== undefined ? selected : selected[0];
}

function htmlAttributes(attributes: DesignNode["attributes"]): Record<string, string | boolean> {
  const aliases: Record<string, string> = {
    class: "className",
    for: "htmlFor",
    readonly: "readOnly",
    autofocus: "autoFocus",
    tabindex: "tabIndex",
    contenteditable: "contentEditable",
  };
  const flags = [
    "disabled",
    "required",
    "multiple",
    "open",
    "hidden",
    "readOnly",
    "autoFocus",
    "checked",
    "selected",
    "inert",
  ];
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => {
      const property = aliases[key] ?? key;
      return [property, flags.includes(property) ? true : value];
    }),
  );
}

function nativeOptions(
  document: DesignDocument,
  id: string,
): { value: string; selected: boolean }[] {
  const node = document.nodes[id];
  if ("tag" in node && node.tag === "option")
    return [
      {
        value: node.attributes.value ?? nativeText(document, id),
        selected: node.attributes.selected !== undefined,
      },
    ];
  return node.children.flatMap((child) => nativeOptions(document, child));
}

function nativeText(document: DesignDocument, id: string): string {
  const node = document.nodes[id];
  return node.kind === "text"
    ? textContent(node)
    : node.children.map((child) => nativeText(document, child)).join("");
}

function projectStyle(element: HTMLElement | SVGElement | null, style: Styles, unclip = false) {
  if (!element) return;
  // Native declaration order owns shorthand precedence and !important.
  element.style.cssText = "";
  for (const [key, value] of Object.entries(style))
    element.style.setProperty(
      key,
      value.replace(/\s*!important\s*$/iu, ""),
      /!important\s*$/iu.test(value) ? "important" : "",
    );
  if (unclip) {
    const computed = getComputedStyle(element);
    if (
      computed.display === "block" &&
      [computed.overflowX, computed.overflowY].some((value) => !["visible", "clip"].includes(value))
    )
      element.style.setProperty("display", "flow-root");
    element.style.setProperty("overflow", "visible");
  }
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

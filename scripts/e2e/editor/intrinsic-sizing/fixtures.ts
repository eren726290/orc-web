import type { DesignNode, Styles } from "../../../../shared/document/model";
import type { Axis } from "./support";

export type Relation = "main" | "cross";
export type Supply = "none" | "descendant" | "sibling" | "text";
export type Fixture = {
  axis: Axis;
  relation: Relation;
  supply: Supply;
  bounded?: boolean;
  filling?: boolean;
};
export const layout: Styles = {
  display: "flex",
  position: "relative",
  "flex-direction": "row",
  "align-items": "flex-start",
  "align-content": "flex-start",
  "box-sizing": "border-box",
  "flex-grow": "0",
  "flex-shrink": "0",
  "flex-basis": "auto",
};
export function frame(
  id: string,
  parentId: string | null,
  children: string[],
  style: Styles,
): DesignNode {
  return {
    id,
    name: id,
    parentId,
    children,
    style,
    kind: "frame",
    clipContent: false,
    mode: "inherit",
    visible: true,
    locked: false,
    attributes: { title: `Retained ${id}` },
  };
}
function direction(test: Pick<Fixture, "axis" | "relation">) {
  const main = test.axis === "width" ? "row" : "column";
  return test.relation === "main" ? main : main === "row" ? "column" : "row";
}
export function fixture(test: Fixture): DesignNode[] {
  const rootChildren = ["leaf", ...(test.supply === "sibling" ? ["supplier"] : [])];
  const leafChildren = ["descendant", "text"].includes(test.supply) ? ["supplier"] : [];
  const root = frame("root", null, rootChildren, {
    ...layout,
    "flex-direction": direction(test),
    position: "absolute",
    left: "80px",
    top: "80px",
    width: "180px",
    height: "180px",
    [test.axis]: test.bounded ? "300px" : "max-content",
    gap: "8px",
    background: "#e8edf4",
  });
  const leaf = frame("leaf", "root", leafChildren, {
    ...layout,
    "flex-direction": test.axis === "width" ? "row" : "column",
    width: "80px",
    height: "80px",
    [test.axis]: test.filling ? "auto" : "80px",
    [`min-${test.axis}`]: "0px",
    background: "#c8d9ee",
    ...(test.filling ? fillStyles(test.relation) : {}),
  });
  return [root, leaf, ...supplier(test)];
}
function fillStyles(relation: Relation): Styles {
  return relation === "main"
    ? { "flex-grow": "1", "flex-shrink": "0", "flex-basis": "0px" }
    : { "align-self": "stretch" };
}
function supplier(test: Fixture): DesignNode[] {
  if (test.supply === "none") return [];
  const parent = test.supply === "sibling" ? "root" : "leaf";
  if (test.supply !== "text")
    return [
      frame("supplier", parent, [], {
        ...layout,
        width: "40px",
        height: "40px",
        [test.axis]: "60px",
        background: "#7087a3",
      }),
    ];
  return [
    {
      id: "supplier",
      name: "supplier",
      parentId: parent,
      children: [],
      kind: "text",
      tag: "div",
      visible: true,
      locked: false,
      attributes: {},
      runs: [{ text: "Independent", style: {} }],
      style: {
        ...layout,
        display: "block",
        width: "max-content",
        height: "max-content",
        font: "10px/20px monospace",
        "white-space": "pre",
        margin: "0px",
      },
    },
  ];
}
export function column(supply: Supply = "descendant", bounded = false) {
  return fixture({ axis: "height", relation: "main", supply, bounded });
}
export function nested(cut: "none" | "fixed" | "equal" = "none") {
  const children = ["first", "middle", "supplier"];
  return [
    frame("root", null, ["first"], {
      ...layout,
      "flex-direction": "column",
      position: "absolute",
      left: "80px",
      top: "80px",
      width: "180px",
      height: "300px",
    }),
    ...children.slice(0, 2).map((id, index) =>
      frame(id, index ? "first" : "root", [children[index + 1]], {
        ...layout,
        "flex-direction": "column",
        width: "80px",
        height: "auto",
        "min-height": "0px",
        ...fillStyles("main"),
        ...(id === "first" ? cutStyles(cut) : {}),
      }),
    ),
    frame("supplier", "middle", [], { ...layout, width: "40px", height: "60px" }),
  ];
}
function cutStyles(cut: "none" | "fixed" | "equal"): Styles {
  if (cut === "fixed") return { height: "90px", "flex-grow": "0", "flex-basis": "auto" };
  return cut === "equal" ? { "min-height": "90px", "max-height": "90px" } : {};
}
export function withPeer(nodes: DesignNode[], decorated = false) {
  nodes[0].children.push("peer");
  nodes.push(
    frame("peer", "root", [], {
      ...layout,
      width: "50px",
      height: "40px",
      "min-height": "0px",
      ...(decorated
        ? { "box-sizing": "content-box", padding: "3px", border: "1px solid black" }
        : {}),
    }),
  );
  return nodes;
}

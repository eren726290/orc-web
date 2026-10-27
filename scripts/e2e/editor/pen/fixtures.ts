import type { DesignNode } from "../../../../shared/document/model";
import type { PenGeometry, PenRecord } from "../../../../shared/pen/model";
import { penRecord } from "../../../../shared/pen/source";
import { penSVG } from "../../../../shared/pen/artwork";
import { penBounds, penViewBox } from "../../../../shared/pen/bounds";
import { badgeFixture } from "../../../solver/fixtures";

export type PenNode = Extract<DesignNode, { kind: "svg" }> & { pen: PenRecord };

export function nodeFixture(path: PenGeometry = badgeFixture()): PenNode {
  const pen = penRecord(path);
  const box = penBounds(path, 2);
  return {
    id: "pen-node",
    name: "Pen",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    kind: "svg",
    source: penSVG(pen),
    pen,
    attributes: {
      viewBox: penViewBox(path, 2),
      fill: "none",
      stroke: "#18181b",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    style: {
      position: "absolute",
      left: "40px",
      top: "40px",
      width: `${box.width}px`,
      height: `${box.height}px`,
      "flex-shrink": "0",
    },
  };
}

export function penEdit(node: PenNode) {
  return {
    kind: "pen" as const,
    id: node.id,
    source: node.source,
    pen: node.pen,
    attributes: node.attributes,
    style: node.style,
  };
}

export function circleFixture(): PenGeometry {
  return {
    anchors: [
      { id: "a1", x: 0, y: 0 },
      { id: "a2", x: 0, y: 100 },
    ],
    segments: [
      { id: "s1", kind: "arc", from: "a1", to: "a2", center: { x: 0, y: 50 }, sweep: 1 },
      { id: "s2", kind: "arc", from: "a2", to: "a1", center: { x: 0, y: 50 }, sweep: 1 },
    ],
    rules: [
      { id: "r1", kind: "tangent", first: "s1", second: "s2" },
      { id: "r2", kind: "tangent", first: "s2", second: "s1" },
    ],
    closed: true,
  };
}

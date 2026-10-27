import type { DesignNode } from "../../../shared/document/model";
import type { PenGeometry, PenRecord } from "../../../shared/pen/model";
import { penBounds } from "../../../shared/pen/bounds";
import { penSVG, penStroke, validatePenDimensions } from "../../../shared/pen/artwork";
import { penRecord } from "../../../shared/pen/source";
import { flowPenViewport, penViewport, viewportSource } from "../../../shared/pen/viewport";

export type PenNode = Extract<DesignNode, { kind: "svg" }> & { pen: PenRecord };

export function reboxPenNode(
  node: PenNode,
  path: PenGeometry,
  placement?: (
    before: ReturnType<typeof penViewport>,
    after: ReturnType<typeof penViewport>,
    scale: number,
  ) => { x: number; y: number },
): PenNode {
  const { before, after, scale, flowing } = reboxMetrics(node, path);
  if (!placement && node.style.transform && node.style.transform !== "none")
    throw new Error("This path's transformed placement needs a supported Pen mapping.");
  const delta = placement?.(before, after, scale) ?? {
    x: (after.x - before.x) * scale,
    y: (after.y - before.y) * scale,
  };
  const pen = penRecord(path);
  return {
    ...node,
    pen,
    source: penSVG(pen),
    attributes: { ...node.attributes, viewBox: viewportSource(after) },
    style: {
      ...node.style,
      ...(!flowing
        ? {
            left: `${Number.parseFloat(node.style.left) + delta.x}px`,
            top: `${Number.parseFloat(node.style.top) + delta.y}px`,
          }
        : {}),
      width: `${after.width * scale}px`,
      height: `${after.height * scale}px`,
    },
  };
}

export function newPenNode(
  path: PenGeometry,
  id: string,
  parentId: string | null,
  placement: "free" | "flow" = "free",
): PenNode {
  const box = placement === "flow" ? flowPenViewport(path, 2) : penBounds(path, 2);
  const pen = penRecord(path);
  return {
    id,
    name: "Pen",
    parentId,
    children: [],
    visible: true,
    locked: false,
    kind: "svg",
    pen,
    source: penSVG(pen),
    attributes: {
      viewBox: viewportSource(box),
      fill: "none",
      stroke: "#181818",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    style: {
      display: "block",
      ...(placement === "flow"
        ? { position: "static" }
        : { position: "absolute", left: `${box.x}px`, top: `${box.y}px` }),
      width: `${box.width}px`,
      height: `${box.height}px`,
      margin: "0",
      "flex-grow": "0",
      "flex-shrink": "0",
      "flex-basis": "auto",
    },
  };
}

function reboxMetrics(node: PenNode, path: PenGeometry) {
  validatePenDimensions(node.style);
  const stroke = penStroke(node.attributes);
  const before = penViewport(node.attributes.viewBox);
  const flowing = ["static", "relative", undefined].includes(node.style.position);
  const after = flowing ? flowPenViewport(path, stroke, before) : penBounds(path, stroke);
  const scale = Number.parseFloat(node.style.width) / before.width;
  if (Math.abs(Number.parseFloat(node.style.height) / before.height - scale) > 1e-6)
    throw new Error("Use proportional Fixed sizing before reshaping this pen path.");
  if (
    !flowing &&
    (node.style.position !== "absolute" ||
      ![node.style.left, node.style.top].every((value) =>
        /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/iu.test(value ?? ""),
      ))
  )
    throw new Error("Choose supported Free placement before reshaping this pen path.");
  return { before, after, scale, flowing };
}

export function penNodeWrite(node: PenNode) {
  return {
    kind: "pen" as const,
    id: node.id,
    pen: node.pen,
    source: node.source,
    attributes: node.attributes,
    style: node.style,
  };
}

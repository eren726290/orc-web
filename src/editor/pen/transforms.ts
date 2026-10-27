import { validatePenDimensions } from "../../../shared/pen/artwork";
import { penViewport } from "../../../shared/pen/viewport";
import type { PenNode } from "./node";
import type { penReboxing } from "./reboxing";

export function penScale(node: PenNode): number {
  validatePenDimensions(node.style);
  const box = penViewport(node.attributes.viewBox);
  const scale = Number.parseFloat(node.style.width) / box.width;
  if (Math.abs(Number.parseFloat(node.style.height) / box.height - scale) > 1e-6)
    throw new Error("Choose proportional Fixed sizing before using this transform.");
  return scale;
}

export function penRotation(node: PenNode): number | null {
  const transform = node.style.transform ?? "none";
  if (transform === "none") return 0;
  const match = /^rotate\((-?(?:\d+(?:\.\d*)?|\.\d+))deg\)$/u.exec(transform);
  return match ? Number(match[1]) : null;
}

export function scalePenNode(
  node: PenNode,
  scale: number,
  rebox: ReturnType<typeof penReboxing>,
): PenNode {
  if (!(scale > 0) || !Number.isFinite(scale))
    throw new Error("Use a positive proportional scale.");
  penScale(node);
  const box = penViewport(node.attributes.viewBox);
  const delta = rebox(box, box, scale);
  const free = node.style.position === "absolute";
  if (
    free &&
    ![node.style.left, node.style.top].every((value) => /^-?[\d.e+-]+px$/iu.test(value ?? ""))
  )
    throw new Error("Use supported Free placement before resizing this SVG.");
  return {
    ...node,
    style: {
      ...node.style,
      width: `${box.width * scale}px`,
      height: `${box.height * scale}px`,
      ...(free
        ? {
            left: `${Number.parseFloat(node.style.left) + delta.x}px`,
            top: `${Number.parseFloat(node.style.top) + delta.y}px`,
          }
        : {}),
    },
  };
}

export function rotatePenNode(node: PenNode, degrees: number): PenNode {
  if (penRotation(node) === null || !Number.isFinite(degrees))
    throw new Error("This SVG transform is controlled by source. Edit it in Code.");
  return { ...node, style: { ...node.style, transform: `rotate(${degrees % 360}deg)` } };
}

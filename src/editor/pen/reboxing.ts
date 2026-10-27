import type { PenViewport } from "../../../shared/pen/viewport";
import type { PenNode } from "./node";

export function penReboxing(node: PenNode, canvas: HTMLElement) {
  const element = canvas.querySelector(`[data-orc-id="${CSS.escape(node.id)}"]`);
  if (!(element instanceof SVGSVGElement)) throw new Error("The pen SVG is unavailable.");
  const style = getComputedStyle(element);
  const matrix = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
  if (
    !matrix.is2D ||
    (style.position === "absolute" &&
      [style.justifySelf, style.alignSelf].some((value) => value.includes("center"))) ||
    node.style.transform?.includes("%") ||
    [style.translate, style.rotate, style.scale].some((value) => value !== "none")
  )
    throw new Error(
      "Use Left/Top placement and a 2D SVG transform without separate translate, rotate or scale before reshaping or changing stroke.",
    );
  const origin = (node.style["transform-origin"] ?? "50% 50%").split(/\s+/u);
  const oldSize = {
    width: Number.parseFloat(node.style.width),
    height: Number.parseFloat(node.style.height),
  };
  const initial = originPoint(origin, oldSize);
  const nativeOrigin = style.transformOrigin.split(/\s+/u).map(Number.parseFloat);
  if (Math.hypot(initial.x - nativeOrigin[0], initial.y - nativeOrigin[1]) > 0.1)
    throw new Error("The path's transform origin is controlled by source. Edit it in Code.");
  return (before: PenViewport, after: PenViewport, scale: number) => {
    const next = originPoint(origin, { width: after.width * scale, height: after.height * scale });
    const x = initial.x - next.x;
    const y = initial.y - next.y;
    const vx = (after.x - before.x) * scale;
    const vy = (after.y - before.y) * scale;
    return {
      x: x - matrix.a * x - matrix.c * y + matrix.a * vx + matrix.c * vy,
      y: y - matrix.b * x - matrix.d * y + matrix.b * vx + matrix.d * vy,
    };
  };
}

function originPoint(parts: string[], size: { width: number; height: number }) {
  if (parts.length !== 2) throw new Error("Use a two-axis percentage or pixel transform origin.");
  const numbers = parts.map((value, index) => {
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:px|%)$/u.test(value))
      throw new Error("Use a percentage or pixel transform origin before reshaping this path.");
    return (
      Number.parseFloat(value) *
      (value.endsWith("%") ? (index ? size.height : size.width) / 100 : 1)
    );
  });
  return { x: numbers[0], y: numbers[1] };
}

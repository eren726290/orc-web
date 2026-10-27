import { isLocked, type DesignDocument } from "../../../shared/document/model";
import type { PenPoint } from "../../../shared/pen/model";
import { frameReference } from "../layout/free-placement";
import { readFrameLayout } from "../layout/frame-layout";
import { flowBox } from "../layout/layout-box";
import type { PenGeometry } from "../../../shared/pen/model";

export function svgMapping(canvas: HTMLDivElement, id: string) {
  const svg = canvas.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
  if (!(svg instanceof SVGSVGElement)) throw new Error("The path's native SVG is unavailable.");
  const native = svg.getScreenCTM();
  if (!native) throw new Error("This SVG does not have an editable 2D coordinate mapping.");
  // Chrome can return SVGMatrix, which has affine coefficients but no is2D property.
  const matrix = DOMMatrix.fromMatrix(native);
  if (
    !matrix.is2D ||
    ![matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].every(Number.isFinite) ||
    Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-12
  )
    throw new Error("This SVG does not have an editable 2D coordinate mapping.");
  return { forward: matrix, inverse: matrix.inverse() };
}

export function localPoint(matrix: DOMMatrix, point: PenPoint): PenPoint {
  const mapped = new DOMPoint(point.x, point.y).matrixTransform(matrix);
  return { x: mapped.x, y: mapped.y };
}

export function penDestination(
  document: DesignDocument,
  selected: string[],
  canvas: HTMLDivElement,
  pan: { x: number; y: number; scale: number },
) {
  const origin = canvas.getBoundingClientRect();
  let parentId: string | null = null;
  let reference = { x: origin.x + pan.x, y: origin.y + pan.y };
  if (selected.length) {
    if (selected.length !== 1)
      throw new Error("Select one frame or clear the selection to draw in the workspace.");
    const frame = document.nodes[selected[0]];
    if (frame?.kind !== "frame")
      throw new Error("Select a frame or clear the selection to begin a new path.");
    if (isLocked(document, frame.id))
      throw new Error("Unlock the destination frame before drawing.");
    const layout = readFrameLayout(frame);
    if (!layout) throw new Error("Choose a frame with a supported layout to draw here.");
    const element = canvas.querySelector(`[data-orc-id="${CSS.escape(frame.id)}"]`);
    if (!(element instanceof HTMLElement)) throw new Error("The destination frame is unavailable.");
    if (layout !== "Free") return flowDestination(element, frame.id);
    reference = frameReference(element, canvas, pan.scale);
    parentId = frame.id;
  }
  const forward = new DOMMatrix([pan.scale, 0, 0, pan.scale, reference.x, reference.y]);
  return {
    parentId,
    forward,
    inverse: forward.inverse(),
    placement: "free" as const,
  };
}

function flowDestination(parent: HTMLElement, parentId: string) {
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  probe.setAttribute("viewBox", "0 0 2 2");
  probe.style.cssText =
    "display:block;position:static;width:2px;height:2px;margin:0;flex:0 0 auto;visibility:hidden;";
  flowBox(parent).append(probe);
  try {
    const native = probe.getScreenCTM();
    if (!native) throw new Error("The frame's native flow coordinates are unavailable.");
    const forward = DOMMatrix.fromMatrix(native);
    return {
      parentId,
      forward,
      inverse: forward.inverse(),
      placement: "flow" as const,
    };
  } finally {
    probe.remove();
  }
}

export function validatePenMapping(
  canvas: HTMLDivElement,
  id: string,
  path: PenGeometry,
  expected: DOMMatrix,
): void {
  const actual = svgMapping(canvas, id).forward;
  for (const anchor of path.anchors) {
    const before = localPoint(expected, anchor);
    const after = localPoint(actual, anchor);
    if (Math.hypot(after.x - before.x, after.y - before.y) > 0.1)
      throw new Error(
        "This layout would move the path away from its editing coordinates. Use Free placement for this shape.",
      );
  }
}

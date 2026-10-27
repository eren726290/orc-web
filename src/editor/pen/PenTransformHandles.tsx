import { Maximize2, RotateCw } from "lucide-react";
import { penViewport } from "../../../shared/pen/viewport";
import type { PenNode } from "./node";
import { localPoint } from "./coordinates";
import { penRotation, penScale } from "./transforms";

export function PenTransformHandles({
  node,
  matrix,
  disabled,
}: {
  node: PenNode;
  matrix: DOMMatrix;
  disabled: boolean;
}) {
  const { points, resize, rotate, eligible } = transformGeometry(node, matrix);
  return (
    <>
      <svg className="pen-transform-box" aria-hidden="true">
        <polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        {eligible && (
          <>
            <line x1={points[2].x} y1={points[2].y} x2={resize.x} y2={resize.y} />
            <line
              x1={(points[0].x + points[1].x) / 2}
              y1={(points[0].y + points[1].y) / 2}
              x2={rotate.x}
              y2={rotate.y}
            />
          </>
        )}
      </svg>
      {eligible && (
        <>
          <TransformButton kind="scale" point={resize} disabled={disabled} />
          <TransformButton kind="rotation" point={rotate} disabled={disabled} />
        </>
      )}
    </>
  );
}

function transformGeometry(node: PenNode, matrix: DOMMatrix) {
  let eligible = false;
  try {
    eligible = penScale(node) > 0 && penRotation(node) !== null;
  } catch {
    eligible = false;
  }
  const box = penViewport(node.attributes.viewBox);
  const points = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ].map((point) => localPoint(matrix, point));
  const center = { x: (points[0].x + points[2].x) / 2, y: (points[0].y + points[2].y) / 2 };
  const top = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  const resize = outside(points[2], center);
  const rotate = outside(top, center);
  return { points, resize, rotate, eligible };
}

function TransformButton({
  kind,
  point,
  disabled,
}: {
  kind: "scale" | "rotation";
  point: { x: number; y: number };
  disabled: boolean;
}) {
  const resize = kind === "scale";
  const Icon = resize ? Maximize2 : RotateCw;
  return (
    <button
      className="pen-transform-handle"
      data-pen-transform={kind}
      disabled={disabled}
      aria-label={resize ? "Resize SVG proportionally" : "Rotate SVG"}
      title={
        resize
          ? "Drag to resize. Arrow keys change scale by 1%; Shift uses 8%."
          : "Drag to rotate. Arrow keys change rotation by 1°; Shift uses 8°."
      }
      style={{ left: point.x, top: point.y }}
    >
      <Icon size={12} aria-hidden="true" />
    </button>
  );
}

function outside(point: { x: number; y: number }, center: { x: number; y: number }) {
  const length = Math.hypot(point.x - center.x, point.y - center.y);
  return {
    x: point.x + ((point.x - center.x) * 40) / length,
    y: point.y + ((point.y - center.y) * 40) / length,
  };
}

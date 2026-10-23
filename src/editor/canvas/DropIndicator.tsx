import { flowStyle } from "../layout/layout-box";
import { useEffect, useState } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import type { ViewState } from "../view-state";
import { pointerDrop, type PointerPreview } from "./pointer-layout";
import { observeOverlayGeometry } from "./overlay-geometry";

type Props = {
  canvas: React.RefObject<HTMLDivElement | null>;
  document: DesignDocument;
  preview: PointerPreview;
  pan: ViewState["pan"];
};

export function DropIndicator(props: Props) {
  const geometry = useDropGeometry(props);
  const drop = pointerDrop(props.preview);
  if (!geometry || !drop) return null;
  return (
    <svg className="selection-overlays" width="100%" height="100%" aria-hidden="true">
      <rect
        className="flex-drop-outline"
        data-orc-drop-parent={drop.parentId}
        {...geometry.outline}
        fill="none"
        stroke="var(--color-editor-selection)"
        strokeDasharray="4 3"
      />
      {geometry.marker && (
        <rect
          className="flex-drop-marker"
          data-orc-drop-object={drop.id}
          {...geometry.marker}
          fill="var(--color-editor-selection)"
        />
      )}
    </svg>
  );
}

function useDropGeometry(props: Props) {
  const [geometry, setGeometry] = useState<ReturnType<typeof measureDrop>>(null);
  useEffect(() => {
    const measure = () => setGeometry(measureDrop(props.canvas.current, props.preview));
    const drop = pointerDrop(props.preview);
    if (!drop || !drop.parentId) return;
    return observeOverlayGeometry(props.canvas.current, [drop.parentId, drop.id], measure);
  }, [props.canvas, props.document, props.preview, props.pan]);
  return geometry;
}

function measureDrop(canvas: HTMLDivElement | null, preview: PointerPreview) {
  const drop = pointerDrop(preview);
  if (!canvas || !drop || drop.parentId === null) return null;
  const parent = canvas.querySelector(`[data-orc-id="${CSS.escape(drop.parentId)}"]`);
  const child = canvas.querySelector(`[data-orc-id="${CSS.escape(drop.id)}"]`);
  if (!parent || !child) return null;
  const origin = canvas.getBoundingClientRect();
  const frame = parent.getBoundingClientRect();
  const object = child.getBoundingClientRect();
  const row = flowStyle(parent).flexDirection === "row";
  const flow =
    ["flex", "inline-flex"].includes(flowStyle(parent).display) &&
    !["absolute", "fixed"].includes(getComputedStyle(child).position);
  const x = object.x - origin.x;
  const y = object.y - origin.y;
  return {
    outline: {
      x: frame.x - origin.x + 0.5,
      y: frame.y - origin.y + 0.5,
      width: Math.max(0, frame.width - 1),
      height: Math.max(0, frame.height - 1),
    },
    marker: !flow
      ? null
      : row
        ? { x: x - 3, y, width: 2, height: object.height }
        : { x, y: y - 3, width: object.width, height: 2 },
  };
}

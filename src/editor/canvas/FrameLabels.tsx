import { useEffect, useState, type RefObject } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import type { ViewState } from "../view-state";
import { observeOverlayGeometry } from "./overlay-geometry";
import "./frame-labels.css";

type FrameBox = { id: string; left: number; top: number; width: number };

export function FrameLabels(props: {
  canvas: RefObject<HTMLDivElement | null>;
  document: DesignDocument;
  pan: ViewState["pan"];
}) {
  const [boxes, setBoxes] = useState<FrameBox[]>([]);
  useEffect(() => {
    const ids = props.document.workspaceRootIds.filter(
      (id) => props.document.nodes[id].kind === "frame" && props.document.nodes[id].visible,
    );
    const measure = () => setBoxes(measureFrames(props.canvas.current, ids));
    if (!ids.length) return;
    return observeOverlayGeometry(props.canvas.current, ids, measure);
  }, [props.canvas, props.document, props.pan]);
  return (
    <div className="frame-labels">
      {boxes.map((box) => {
        const node = props.document.nodes[box.id];
        if (!node?.visible || node.kind !== "frame" || node.parentId !== null) return null;
        return (
          <div
            key={box.id}
            className="frame-label"
            data-frame-label={box.id}
            style={{ insetInlineStart: box.left, insetBlockStart: box.top, inlineSize: box.width }}
          >
            {node.name}
          </div>
        );
      })}
    </div>
  );
}

function measureFrames(canvas: HTMLDivElement | null, ids: string[]): FrameBox[] {
  if (!canvas) return [];
  const origin = canvas.getBoundingClientRect();
  return ids.flatMap((id) => {
    const element = canvas.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
    if (!element?.getClientRects().length) return [];
    const bounds = element.getBoundingClientRect();
    return [
      { id, left: bounds.left - origin.left, top: bounds.top - origin.top, width: bounds.width },
    ];
  });
}

import { useEffect, useState, type RefObject } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import type { ViewState } from "../view-state";
import { readConstraints } from "../layout/constraints";
import { frameReference } from "../layout/free-placement";
import { observeOverlayGeometry } from "./overlay-geometry";
import "./constraint-indicators.css";

type Line = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  center: boolean;
  horizontal: boolean;
};

export function ConstraintIndicators(props: {
  canvas: RefObject<HTMLDivElement | null>;
  document: DesignDocument;
  selected: string[];
  pan: ViewState["pan"];
}) {
  const [snapshot, setSnapshot] = useState<{ id: string | null; lines: Line[] }>({
    id: null,
    lines: [],
  });
  const id = props.selected.length === 1 ? props.selected[0] : null;
  useEffect(() => {
    if (!id) return;
    return observeOverlayGeometry(props.canvas.current, [id], () =>
      setSnapshot({ id, lines: measureIndicators(props.canvas.current, props.document, id) }),
    );
  }, [props.canvas, props.document, id, props.pan]);
  if (!id || snapshot.id !== id || !snapshot.lines.length) return null;
  return (
    <svg className="constraint-indicators" aria-hidden="true" data-constraint-target={id}>
      {snapshot.lines.map((line) => (
        <g key={line.key} data-constraint-line={line.key}>
          <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          {line.center && (
            <path
              d={
                line.horizontal
                  ? `M ${line.x2} ${line.y2 - 4} v 8`
                  : `M ${line.x2 - 4} ${line.y2} h 8`
              }
            />
          )}
        </g>
      ))}
    </svg>
  );
}

function measureIndicators(
  canvas: HTMLDivElement | null,
  document: DesignDocument,
  id: string,
): Line[] {
  const node = document.nodes[id];
  if (!canvas || !node) return [];
  const current = readConstraints(document, node);
  const world = canvas.querySelector(".canvas-world");
  const parent = current?.element.closest(`[data-orc-id="${CSS.escape(node.parentId ?? "")}"]`);
  if (
    !current ||
    !(parent instanceof HTMLElement) ||
    !world ||
    !current.element.getClientRects().length
  )
    return [];
  try {
    const scale = new DOMMatrix(getComputedStyle(world).transform).a;
    const ref = frameReference(parent, canvas, scale);
    const box = current.element.getBoundingClientRect();
    const origin = canvas.getBoundingClientRect();
    const reference = {
      x: ref.x + parent.scrollLeft * scale,
      y: ref.y + parent.scrollTop * scale,
      width: ref.width * scale,
      height: ref.height * scale,
    };
    return indicatorLines(current, box, origin, reference);
  } catch {
    return [];
  }
}

function indicatorLines(
  current: NonNullable<ReturnType<typeof readConstraints>>,
  box: DOMRect,
  origin: DOMRect,
  reference: { x: number; y: number; width: number; height: number },
): Line[] {
  return (["width", "height"] as const).flatMap((axis) => {
    const mode = current[axis].mode;
    if (!mode || !current[axis].editable) return [];
    const horizontal = axis === "width";
    const start = horizontal ? box.x : box.y;
    const cross = horizontal ? box.y + box.height / 2 - origin.y : box.x + box.width / 2 - origin.x;
    const offset = horizontal ? origin.x : origin.y;
    const parentStart = horizontal ? reference.x : reference.y;
    return (mode === "both" ? ["start", "end"] : [mode]).map((edge) => {
      const from =
        start + (edge === "end" ? box[axis] : edge === "center" ? box[axis] / 2 : 0) - offset;
      const to =
        parentStart +
        (edge === "end" ? reference[axis] : edge === "center" ? reference[axis] / 2 : 0) -
        offset;
      return {
        key: `${axis}-${edge}`,
        x1: horizontal ? from : cross,
        y1: horizontal ? cross : from,
        x2: horizontal ? to : cross,
        y2: horizontal ? cross : to,
        center: edge === "center",
        horizontal,
      };
    });
  });
}

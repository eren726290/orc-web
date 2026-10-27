import { isLocked } from "../../../shared/document/model";
import { penAnchor } from "../../../shared/pen/model";
import { createPenWorker, readPenWorkerResult } from "./worker-client";
import { flushSync } from "react-dom";
import { localPoint, svgMapping, validatePenMapping } from "./coordinates";
import { penNodeWrite, reboxPenNode, type PenNode } from "./node";
import { preparePenPreview } from "./preview";
import { penReboxing } from "./reboxing";
import {
  acceptPenMove,
  nextPenMove,
  penMotion,
  refusePenMove,
} from "../../../shared/pen/continuation";
import { distance } from "../../../shared/pen/geometry";
import { penTolerance } from "../../../shared/pen/model";
import type { Dragging, PenInput, PenProps, PenState } from "./types";
import { penScale } from "./transforms";

export function selectedPen(props: PenProps): PenNode | null {
  const node =
    props.view.selected.length === 1 ? props.appliedDocument.nodes[props.view.selected[0]] : null;
  return node?.kind === "svg" && node.pen ? { ...node, pen: node.pen } : null;
}

export function beginAnchorDrag(
  props: PenProps,
  input: PenInput,
  module: WebAssembly.Module,
): Dragging {
  const node = selectedPen(props);
  const canvas = props.canvas.current;
  if (!node || !canvas || !input.anchor) throw new Error("Select an editable pen anchor.");
  if (isLocked(props.appliedDocument, node.id))
    throw new Error("Unlock this path before editing anchors.");
  penScale(node);
  const { inverse, forward } = svgMapping(canvas, node.id);
  const anchor = penAnchor(node.pen, input.anchor);
  const pointer = localPoint(inverse, input.point);
  const rebox = penReboxing(node, canvas);
  const prepare = preparePenPreview(props.appliedDocument, props.preview, (candidate) => {
    const proposed = candidate.nodes[node.id];
    if (proposed.kind === "svg" && proposed.pen)
      validatePenMapping(canvas, node.id, proposed.pen, forward);
  });
  return {
    node,
    anchor: anchor.id,
    inverse,
    point: input.point,
    pointer: input.pointer,
    offset: { x: pointer.x - anchor.x, y: pointer.y - anchor.y },
    motion: penMotion(node.pen, anchor.id),
    frame: null,
    mutation: null,
    solver: createPenWorker(module),
    busy: false,
    rebox,
    prepare,
  };
}

export function targetAnchor(drag: Dragging, input: PenInput): void {
  if (drag.point.x === input.point.x && drag.point.y === input.point.y) {
    drag.motion = penMotion(drag.node.pen, drag.anchor);
    drag.mutation = null;
    drag.prepare([penNodeWrite(drag.node)]);
    return;
  }
  const point = localPoint(drag.inverse, input.point);
  drag.motion.target = { x: point.x - drag.offset.x, y: point.y - drag.offset.y };
  drag.motion.pending = true;
}

export async function moveAnchor(
  props: PenProps,
  drag: Dragging,
  active: () => boolean,
  update: () => void,
): Promise<void> {
  const motion = drag.motion;
  const request = nextPenMove(motion);
  if (!request || drag.busy) return;
  drag.busy = true;
  const start = performance.now();
  try {
    const pending = drag.solver.solve(motion.path, request);
    measureWork("request", start);
    const result = await pending;
    if (active() && drag.motion === motion) applyWorkerMove(props, drag, result, start, update);
  } catch (error) {
    if (active() && drag.motion === motion) {
      refusePenMove(motion, error);
      props.notice(motion.message);
      update();
    }
  } finally {
    drag.busy = false;
  }
}

function applyWorkerMove(
  props: PenProps,
  drag: Dragging,
  value: unknown,
  start: number,
  update: () => void,
) {
  const work = performance.now();
  try {
    const result = readPenWorkerResult(value);
    performance.measure("orc-pen-solve", { start: work - result.numericWorkMs, end: work });
    if (result.kind === "refused") throw new Error(result.message);
    acceptPenMove(drag.motion, result.path, (path) => {
      const node = reboxPenNode(drag.node, path, drag.rebox);
      drag.mutation = drag.prepare([penNodeWrite(node)]);
    });
  } catch (error) {
    refusePenMove(drag.motion, error);
  }
  props.notice(drag.motion.message);
  flushSync(update);
  measureWork("preview", work);
  performance.measure("orc-pen-cycle", { start, end: performance.now() });
  performance.clearMeasures("orc-pen-cycle");
  performance.clearMeasures("orc-pen-solve");
}

function measureWork(kind: "request" | "preview", start: number) {
  performance.measure(`orc-pen-${kind}`, { start, end: performance.now() });
  performance.clearMeasures(`orc-pen-${kind}`);
}

export function disposeDrag(drag: Dragging): void {
  if (drag.frame !== null) cancelAnimationFrame(drag.frame);
  drag.solver.dispose();
}

export async function finishAnchorDrag(props: PenProps, state: PenState): Promise<void> {
  const drag = state.dragging;
  if (!drag) return;
  state.dragging = null;
  state.pressed = null;
  disposeDrag(drag);
  if (distance(penAnchor(drag.motion.path, drag.anchor), drag.motion.target) > penTolerance)
    props.notice("Stopped at the last valid shape. Release discards outstanding pointer motion.");
  if (props.canvas.current?.hasPointerCapture(drag.pointer))
    props.canvas.current.releasePointerCapture(drag.pointer);
  props.preview(null);
  if (drag.mutation) await props.mutate(drag.mutation);
}

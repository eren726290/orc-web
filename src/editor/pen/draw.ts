import { penIdentity } from "../../../shared/pen/model";
import { appendPenSegment, type NextPenIds } from "../../../shared/pen/drawing";
import { newPenNode, penNodeWrite, reboxPenNode, type PenNode } from "./node";
import { localPoint, penDestination, svgMapping, validatePenMapping } from "./coordinates";
import { preparePenPreview } from "./preview";
import { penReboxing } from "./reboxing";
import { isLocked } from "../../../shared/document/model";
import type { Drawing, PenInput, PenProps, PenState } from "./types";

function nextPenIds(): NextPenIds {
  return {
    anchor: penIdentity("a"),
    segment: penIdentity("s"),
    rule: penIdentity("r"),
  };
}

export function continueDrawing(props: PenProps, node: PenNode): Drawing {
  const canvas = props.canvas.current;
  if (!canvas || node.pen.closed || isLocked(props.appliedDocument, node.id))
    throw new Error("Select an unlocked open path to continue.");
  const mapping = svgMapping(canvas, node.id);
  return {
    ...mapping,
    original: node,
    rebox: penReboxing(node, canvas),
    placement: ["static", "relative", undefined].includes(node.style.position) ? "flow" : "free",
    parentId: node.parentId,
    nodeId: node.id,
    placed: node.pen,
    shown: node.pen,
    mode: "line",
    ids: nextPenIds(),
    prepare: preparePenPreview(props.appliedDocument, props.preview, (candidate) => {
      const proposed = candidate.nodes[node.id];
      if (proposed.kind === "svg" && proposed.pen)
        validatePenMapping(canvas, node.id, proposed.pen, mapping.forward);
    }),
  };
}

function drawingNode(drawing: Drawing, path: Drawing["placed"]) {
  return drawing.original && drawing.rebox
    ? reboxPenNode(drawing.original, path, drawing.rebox)
    : newPenNode(path, drawing.nodeId, drawing.parentId, drawing.placement);
}

export function beginDrawing(props: PenProps, input: PenInput): Drawing {
  const canvas = props.canvas.current;
  if (!canvas) throw new Error("The canvas is unavailable.");
  const destination = penDestination(
    props.appliedDocument,
    props.view.selected,
    canvas,
    props.view.pan,
  );
  const point =
    destination.placement === "flow"
      ? { x: 1, y: 1 }
      : localPoint(destination.inverse, input.point);
  const nodeId = crypto.randomUUID();
  const path = {
    anchors: [{ id: penIdentity("a"), ...point }],
    segments: [],
    rules: [],
    closed: false,
  };
  return {
    ...destination,
    original: null,
    rebox: null,
    nodeId,
    placed: path,
    shown: path,
    mode: "line",
    ids: nextPenIds(),
    prepare: preparePenPreview(props.appliedDocument, props.preview, (candidate) => {
      const node = candidate.nodes[nodeId];
      if (node.kind === "svg" && node.pen)
        validatePenMapping(canvas, nodeId, node.pen, destination.forward);
    }),
  };
}

export function showDrawing(props: PenProps, drawing: Drawing, input: PenInput, place: boolean) {
  const first = drawing.placed.anchors[0];
  const close = place && input.anchor === first.id && drawing.placed.anchors.length >= 2;
  const target = close ? first : localPoint(drawing.inverse, input.point);
  const result = appendPenSegment(drawing.placed, target, {
    arc: drawing.mode === "arc",
    shift: input.shift,
    alt: input.alt,
    close,
    ids: drawing.ids,
  });
  const node = drawingNode(drawing, result.path);
  drawing.prepare([drawing.original ? penNodeWrite(node) : { kind: "insert", nodes: [node] }]);
  drawing.shown = result.path;
  props.notice(result.message);
  if (place) {
    drawing.placed = result.path;
    drawing.mode = "line";
    drawing.ids = nextPenIds();
  }
  return close;
}

export async function finishDrawing(props: PenProps, state: PenState): Promise<void> {
  const drawing = state.drawing;
  if (!drawing) return;
  state.drawing = null;
  props.preview(null);
  if (drawing.placed.anchors.length < 2) return;
  if (drawing.original && JSON.stringify(drawing.placed) === JSON.stringify(drawing.original.pen))
    return;
  const node = drawingNode(drawing, drawing.placed);
  const mutation = props.appliedDocument.nodes[node.id]
    ? penNodeWrite(node)
    : { kind: "insert" as const, nodes: [node] };
  if (await props.mutate(mutation)) props.setView({ selected: [node.id], tool: "select" });
}

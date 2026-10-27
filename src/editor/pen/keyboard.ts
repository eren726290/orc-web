import { finishDrawing } from "./draw";
import { selectedPen } from "./drag";
import { deleteSelectedAnchor } from "./delete";
import type { PenProps, PenState } from "./types";

export function editingPenInput(event: React.KeyboardEvent): boolean {
  return (
    event.target instanceof Element &&
    Boolean(event.target.closest("input,textarea,select,[contenteditable],.code-window"))
  );
}

export function penUndoKey(event: React.KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z";
}

export function penKey(
  event: React.KeyboardEvent,
  props: PenProps,
  state: PenState,
  cancel: () => void,
  update: () => void,
): boolean {
  if (editingPenInput(event)) return false;
  if ((state.dragging || state.loading) && (event.key === "Escape" || penUndoKey(event))) cancel();
  else if (state.drawing && penUndoKey(event)) cancel();
  else if (!interactionKey(event, props, state, update)) return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function interactionKey(
  event: React.KeyboardEvent,
  props: PenProps,
  state: PenState,
  update: () => void,
): boolean {
  if (state.loading || state.drawing || state.dragging)
    return draftKey(event, props, state, update);
  if (event.key !== "Delete") return false;
  const selected = state.selectedAnchor;
  if (!selected || selected.nodeId !== selectedPen(props)?.id) return false;
  void deleteSelectedAnchor(props, state).finally(update);
  return true;
}

function draftKey(
  event: React.KeyboardEvent,
  props: PenProps,
  state: PenState,
  update: () => void,
): boolean {
  if (["Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key))
    props.notice("Finish this pen interaction before editing objects.");
  else if (state.drawing && ["Enter", "Escape"].includes(event.key))
    void finishDrawing(props, state).finally(update);
  else if (state.drawing && plainArcKey(event)) {
    state.drawing.mode = state.drawing.mode === "line" ? "arc" : "line";
    update();
  } else return false;
  return true;
}

function plainArcKey(event: React.KeyboardEvent): boolean {
  return !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "a";
}

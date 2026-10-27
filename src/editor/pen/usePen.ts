import { useCallback, useEffect, useRef, useState } from "react";
import { sessionClient } from "../../session/session-client";
import { penModule } from "./loader";
import { beginDrawing, continueDrawing, finishDrawing, showDrawing } from "./draw";
import {
  beginAnchorDrag,
  disposeDrag,
  finishAnchorDrag,
  moveAnchor,
  selectedPen,
  targetAnchor,
} from "./drag";
import type { PenInput, PenProps, PenState } from "./types";
import { penKey } from "./keyboard";

export function usePen(props: PenProps) {
  const state = useRef<PenState>(emptyPenState());
  const [snapshot, setSnapshot] = useState<PenState>(emptyPenState);
  const update = useCallback(() => setSnapshot({ ...state.current }), []);
  const { preview, canvas } = props;
  const cancel = useCallback(() => {
    const current = state.current;
    current.epoch++;
    current.loading = false;
    const drag = current.dragging;
    if (drag) disposeDrag(drag);
    current.drawing = null;
    current.dragging = null;
    current.pressed = null;
    if (drag && canvas.current?.hasPointerCapture(drag.pointer))
      canvas.current.releasePointerCapture(drag.pointer);
    preview(null);
    update();
  }, [preview, canvas, update]);
  const active = useCallback(() => penActive(state.current), []);
  usePenCancellation(props, cancel, active);
  usePenLoading(props);
  return {
    state: snapshot,
    cancel,
    lost: () => {
      if (state.current.dragging || state.current.loading) cancel();
    },
    down: (event: React.PointerEvent<HTMLDivElement>) =>
      penDown(event, props, state.current, update),
    move: (event: React.PointerEvent<HTMLDivElement>) =>
      penMove(event, props, state.current, update),
    up: (event: React.PointerEvent<HTMLDivElement>) => penUp(event, props, state.current, update),
    key: (event: React.KeyboardEvent) => penKey(event, props, state.current, cancel, update),
  };
}

function emptyPenState(): PenState {
  return {
    loading: false,
    drawing: null,
    dragging: null,
    selectedAnchor: null,
    epoch: 0,
    pressed: null,
  };
}

function penActive(state: PenState): boolean {
  return Boolean(state.loading || state.drawing || state.dragging || state.pressed !== null);
}

function input(event: React.PointerEvent<HTMLDivElement>): PenInput {
  const target = event.target instanceof Element ? event.target.closest("[data-pen-anchor]") : null;
  return {
    point: { x: event.clientX, y: event.clientY },
    pointer: event.pointerId,
    anchor: target?.getAttribute("data-pen-anchor") ?? null,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

function penDown(
  event: React.PointerEvent<HTMLDivElement>,
  props: PenProps,
  state: PenState,
  update: () => void,
): boolean {
  const current = input(event);
  if (event.button !== 0 || props.disabled || (props.view.tool !== "pen" && !current.anchor))
    return false;
  event.preventDefault();
  event.currentTarget.focus();
  state.pressed = current.pointer;
  void begin(props, state, current, update);
  return true;
}

async function begin(props: PenProps, state: PenState, input: PenInput, update: () => void) {
  const epoch = ++state.epoch;
  state.loading = true;
  props.notice(null);
  try {
    const module = await penModule();
    if (state.epoch !== epoch) return;
    state.loading = false;
    if (!(await props.beforeEdit())) return;
    if (state.epoch !== epoch || !sameProject(props)) return;
    await beginReady(props, state, input, module);
  } catch (error) {
    if (state.epoch === epoch)
      props.notice(error instanceof Error ? error.message : "The pen action failed.");
  } finally {
    if (state.epoch === epoch) state.loading = false;
    update();
  }
}

async function beginReady(
  props: PenProps,
  state: PenState,
  input: PenInput,
  module: WebAssembly.Module,
) {
  const continued = canContinue(props, input);
  if (state.drawing) {
    if (showDrawing(props, state.drawing, input, true)) await finishDrawing(props, state);
  } else if (continued) state.drawing = continueDrawing(props, continued);
  else if (input.anchor && selectedPen(props)) {
    startAnchorDrag(props, state, input, module);
  } else state.drawing = beginDrawing(props, input);
}

function startAnchorDrag(
  props: PenProps,
  state: PenState,
  input: PenInput,
  module: WebAssembly.Module,
) {
  if (!input.anchor) return;
  state.selectedAnchor = { nodeId: props.view.selected[0], anchor: input.anchor };
  if (state.pressed !== input.pointer) return;
  state.dragging = beginAnchorDrag(props, input, module);
  props.canvas.current?.setPointerCapture(input.pointer);
}

function sameProject(props: PenProps): boolean {
  const active = sessionClient.snapshot().session;
  return (
    active.activeProjectId === props.appliedDocument.id &&
    active.projects.find((project) => project.document.id === active.activeProjectId)?.document
      .revision === props.appliedDocument.revision
  );
}

function canContinue(props: PenProps, input: PenInput) {
  const node = selectedPen(props);
  return props.view.tool === "pen" &&
    node &&
    !node.pen.closed &&
    input.anchor === node.pen.anchors.at(-1)?.id
    ? node
    : null;
}

function penMove(
  event: React.PointerEvent<HTMLDivElement>,
  props: PenProps,
  state: PenState,
  update: () => void,
): boolean {
  if (!state.drawing && !state.dragging) return false;
  try {
    if (state.dragging) {
      targetAnchor(state.dragging, input(event));
      scheduleDrag(props, state, update);
    } else if (state.drawing) showDrawing(props, state.drawing, input(event), false);
  } catch (error) {
    props.notice(error instanceof Error ? error.message : "This pen move is unavailable.");
  }
  update();
  return true;
}

function penUp(
  event: React.PointerEvent<HTMLDivElement>,
  props: PenProps,
  state: PenState,
  update: () => void,
): boolean {
  state.pressed = null;
  if (!state.dragging) return false;
  penMove(event, props, state, update);
  void finishAnchorDrag(props, state).finally(update);
  return true;
}

function scheduleDrag(props: PenProps, state: PenState, update: () => void) {
  const drag = state.dragging;
  if (!drag || drag.frame !== null || drag.busy || !drag.motion.pending) return;
  drag.frame = requestAnimationFrame(() => {
    drag.frame = null;
    if (state.dragging !== drag) return;
    void moveAnchor(props, drag, () => state.dragging === drag, update).finally(() => {
      if (state.dragging === drag && drag.motion.pending) scheduleDrag(props, state, update);
    });
  });
}

export function usePenCancellation(props: PenProps, cancel: () => void, active: () => boolean) {
  const selected = props.view.selected.join("\0");
  useEffect(() => {
    cancel();
    return cancel;
  }, [
    cancel,
    props.appliedDocument.id,
    props.appliedDocument.revision,
    props.view.tool,
    props.view.pan.x,
    props.view.pan.y,
    props.view.pan.scale,
    props.disabled,
    selected,
  ]);
  useEffect(() => {
    const cancelActive = () => {
      if (active()) cancel();
    };
    window.addEventListener("blur", cancelActive);
    window.addEventListener("pointercancel", cancelActive);
    window.addEventListener("scroll", cancelActive, true);
    return () => {
      window.removeEventListener("blur", cancelActive);
      window.removeEventListener("pointercancel", cancelActive);
      window.removeEventListener("scroll", cancelActive, true);
    };
  }, [cancel, active]);
}

function usePenLoading(props: PenProps) {
  const id = selectedPen(props)?.id;
  const tool = props.view.tool;
  const { notice } = props;
  useEffect(() => {
    if (tool !== "pen" && !id) return;
    let active = true;
    void penModule().catch((error: unknown) => {
      if (active)
        notice(
          error instanceof Error ? error.message : "Pen could not load. Click the canvas to retry.",
        );
    });
    return () => {
      active = false;
    };
  }, [id, tool, notice]);
}

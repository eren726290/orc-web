import { useCallback, useRef } from "react";
import { sessionClient } from "../../session/session-client";
import { usePenCancellation } from "./usePen";
import {
  beginTransform,
  keyboardTransform,
  moveTransform,
  type TransformGesture,
  type TransformInput,
  type TransformKind,
} from "./transform-gesture";
import type { PenProps } from "./types";
import { editingPenInput, penUndoKey } from "./keyboard";

type State = { gesture: TransformGesture | null; pressed: number | null; epoch: number };

export function usePenTransform(props: PenProps) {
  const state = useRef<State>({ gesture: null, pressed: null, epoch: 0 });
  const { preview, canvas } = props;
  const cancel = useCallback(() => {
    const gesture = state.current.gesture;
    state.current.epoch++;
    state.current.gesture = null;
    state.current.pressed = null;
    if (gesture && canvas.current?.hasPointerCapture(gesture.input.pointer))
      canvas.current.releasePointerCapture(gesture.input.pointer);
    preview(null);
  }, [preview, canvas]);
  const active = useCallback(
    () => Boolean(state.current.gesture || state.current.pressed !== null),
    [],
  );
  usePenCancellation(props, cancel, active);
  return {
    cancel,
    lost: () => {
      if (state.current.gesture) cancel();
    },
    down: (event: React.PointerEvent<HTMLDivElement>) => {
      const kind = transformKind(event.target);
      if (!kind || event.button !== 0) return false;
      event.preventDefault();
      event.currentTarget.focus();
      state.current.pressed = event.pointerId;
      void begin(props, state.current, kind, {
        pointer: event.pointerId,
        point: { x: event.clientX, y: event.clientY },
      });
      return true;
    },
    move: (event: React.PointerEvent<HTMLDivElement>) => move(props, state.current, event),
    up: (event: React.PointerEvent<HTMLDivElement>) => finish(props, state.current, event),
    key: (event: React.KeyboardEvent) => key(props, state.current, cancel, event),
  };
}

function transformKind(target: EventTarget | null): TransformKind | null {
  const value =
    target instanceof Element
      ? target.closest("[data-pen-transform]")?.getAttribute("data-pen-transform")
      : null;
  return value === "scale" || value === "rotation" ? value : null;
}

async function begin(props: PenProps, state: State, kind: TransformKind, input: TransformInput) {
  const epoch = ++state.epoch;
  try {
    if (!(await props.beforeEdit()) || state.epoch !== epoch || state.pressed !== input.pointer)
      return;
    const session = sessionClient.snapshot().session;
    const document = session.projects.find(
      (project) => project.document.id === session.activeProjectId,
    )?.document;
    if (
      document?.id !== props.appliedDocument.id ||
      document.revision !== props.appliedDocument.revision
    )
      return;
    state.gesture = beginTransform(props, kind, input);
    props.canvas.current?.setPointerCapture(input.pointer);
    props.notice(null);
  } catch (error) {
    props.notice(error instanceof Error ? error.message : "The SVG transform failed.");
  }
}

function move(props: PenProps, state: State, event: React.PointerEvent<HTMLDivElement>) {
  if (!state.gesture) return false;
  try {
    moveTransform(state.gesture, { x: event.clientX, y: event.clientY });
    props.notice(null);
  } catch (error) {
    props.notice(error instanceof Error ? error.message : "The SVG transform failed.");
  }
  return true;
}

function finish(props: PenProps, state: State, event: React.PointerEvent<HTMLDivElement>) {
  state.pressed = null;
  const gesture = state.gesture;
  if (!gesture) return false;
  move(props, state, event);
  state.gesture = null;
  if (props.canvas.current?.hasPointerCapture(gesture.input.pointer))
    props.canvas.current.releasePointerCapture(gesture.input.pointer);
  props.preview(null);
  if (gesture.mutation) void props.mutate(gesture.mutation);
  return true;
}

function key(props: PenProps, state: State, cancel: () => void, event: React.KeyboardEvent) {
  if (editingPenInput(event)) return false;
  if (state.gesture && (event.key === "Escape" || penUndoKey(event))) cancel();
  else {
    const kind = transformKind(event.target);
    if (!kind || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key))
      return false;
    const sign = ["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 1;
    void keyboardTransform(props, kind, sign * (event.shiftKey ? 8 : 1));
  }
  event.preventDefault();
  event.stopPropagation();
  return true;
}

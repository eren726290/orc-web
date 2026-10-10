import { useCallback, useEffect, useRef, type PointerEvent } from "react";

type Props = {
  owner: string;
  value: number | null;
  disabled: boolean;
  scale: number;
  min: number;
  prepare: () => boolean | Promise<boolean>;
  preview: (value: number | null) => void;
  commit: (value: number) => Promise<boolean>;
  error: (message: string) => void;
};
type Gesture = {
  props: Props;
  element: HTMLElement;
  pointer: number;
  axis: "x" | "y";
  origin: number;
  start: number;
  value: number;
  ready: boolean;
  moved: boolean;
};

export function useNumberDrag(props: Props) {
  const gesture = useRef<Gesture | null>(null);
  const pending = useRef(false);
  const cancel = useCallback(() => {
    const current = gesture.current;
    if (!current) return;
    gesture.current = null;
    release(current);
    current.props.preview(null);
  }, []);
  useDragEvents(gesture, pending, cancel);
  useEffect(() => {
    cancel();
    return cancel;
  }, [cancel, props.owner, props.disabled, props.scale]);
  return {
    busy: () => gesture.current !== null || pending.current,
    begin: (event: PointerEvent<HTMLElement>, axis: "x" | "y") => {
      if (!pending.current) void beginDrag(event, axis, props, gesture, cancel);
    },
  };
}

async function beginDrag(
  event: PointerEvent<HTMLElement>,
  axis: "x" | "y",
  props: Props,
  gesture: React.RefObject<Gesture | null>,
  cancel: () => void,
) {
  if (props.disabled || props.value === null || event.button !== 0) return;
  const element = event.currentTarget;
  if (element.matches(":disabled")) return;
  const current = createGesture(event, axis, props, props.value);
  gesture.current = current;
  try {
    const allowed = await props.prepare();
    if (gesture.current !== current) return;
    if (allowed) current.ready = true;
    else cancel();
  } catch (cause) {
    cancel();
    props.error(cause instanceof Error ? cause.message : String(cause));
  }
}

function createGesture(
  event: PointerEvent<HTMLElement>,
  axis: "x" | "y",
  props: Props,
  value: number,
): Gesture {
  const element = event.currentTarget;
  event.preventDefault();
  event.stopPropagation();
  element.focus();
  const input = element instanceof HTMLInputElement ? Number(element.value) : value;
  const start = Number.isFinite(input) && input >= props.min ? input : value;
  const current: Gesture = {
    props,
    element,
    pointer: event.pointerId,
    axis,
    origin: axis === "x" ? event.clientX : event.clientY,
    start,
    value: start,
    ready: false,
    moved: false,
  };
  element.setPointerCapture(event.pointerId);
  if (element instanceof HTMLInputElement) element.select();
  return current;
}

function moveDrag(event: globalThis.PointerEvent, current: Gesture | null) {
  if (!current?.ready || current.pointer !== event.pointerId) return;
  const delta = (current.axis === "x" ? event.clientX : event.clientY) - current.origin;
  if (!current.moved && Math.abs(delta) < 3) return;
  current.moved = true;
  event.preventDefault();
  current.value = Math.max(
    current.props.min,
    current.start + Math.round(delta / current.props.scale),
  );
  current.props.preview(current.value);
}

async function finishDrag(
  event: globalThis.PointerEvent,
  gesture: React.RefObject<Gesture | null>,
  pending: React.RefObject<boolean>,
) {
  const current = gesture.current;
  if (!current || current.pointer !== event.pointerId) return;
  moveDrag(event, current);
  gesture.current = null;
  release(current);
  if (!current.ready || !current.moved) return;
  pending.current = true;
  try {
    if (current.value !== current.props.value) await current.props.commit(current.value);
  } catch (cause) {
    current.props.error(cause instanceof Error ? cause.message : String(cause));
  } finally {
    pending.current = false;
    current.props.preview(null);
  }
}

function release(current: Gesture) {
  if (current.element.hasPointerCapture(current.pointer))
    current.element.releasePointerCapture(current.pointer);
}

function useDragEvents(
  gesture: React.RefObject<Gesture | null>,
  pending: React.RefObject<boolean>,
  cancel: () => void,
) {
  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => moveDrag(event, gesture.current);
    const up = (event: globalThis.PointerEvent) => void finishDrag(event, gesture, pending);
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !gesture.current) return;
      if (gesture.current.ready) {
        event.preventDefault();
        event.stopPropagation();
      }
      cancel();
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", escape, true);
      cancel();
    };
  }, [gesture, pending, cancel]);
}

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { preparePointerPlacement } from "./pointer-placement";
import { pointerCommit, type PointerPreview } from "./pointer-layout";

type Props = {
  document: DesignDocument;
  selected: string[];
  scale: number;
  disabled: boolean;
  tool: string;
  beforeEdit: () => Promise<boolean>;
  select: (id: string | null, extend: boolean) => Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
  notice: (message: string | null) => void;
};
type Gesture = {
  pointer: number;
  canvas: HTMLDivElement;
  x: number;
  y: number;
  revision: number;
  selected: string[];
  scale: number;
  movement: ReturnType<typeof preparePointerPlacement> | null;
  ready: boolean;
  preview: PointerPreview;
};

export function usePointerMovement(props: Props) {
  const gesture = useRef<Gesture | null>(null);
  const [preview, setPreview] = useState<PointerPreview>(null);
  const cancel = useCallback(() => {
    const current = gesture.current;
    gesture.current = null;
    setPreview(null);
    if (current?.canvas.hasPointerCapture(current.pointer))
      current.canvas.releasePointerCapture(current.pointer);
  }, []);
  useMovementCancellation(props, gesture, cancel);
  usePointerCancellation(cancel);
  const begin = (event: PointerEvent<HTMLDivElement>, id: string) =>
    beginMovement(event, id, props, gesture, cancel);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current?.ready || current.pointer !== event.pointerId) return;
    if (props.document.revision !== current.revision) return cancel();
    const x = event.clientX - current.x;
    const y = event.clientY - current.y;
    if (!current.preview && Math.hypot(x, y) < 3) return;
    try {
      current.canvas.setPointerCapture(current.pointer);
      current.preview = pointerPreview(current, props.document, x, y);
      setPreview(current.preview);
    } catch (error) {
      props.notice(error instanceof Error ? error.message : String(error));
      cancel();
    }
  };
  const finish = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    move(event);
    const change = pointerCommit(props.document, gesture.current?.preview ?? null);
    cancel();
    if (change && props.document.revision === current.revision) void props.mutate(change);
  };
  return { preview, begin, move, finish, cancel, active: () => gesture.current !== null };
}

async function beginMovement(
  event: PointerEvent<HTMLDivElement>,
  id: string,
  props: Props,
  gesture: React.RefObject<Gesture | null>,
  cancel: () => void,
) {
  const current: Gesture = {
    pointer: event.pointerId,
    canvas: event.currentTarget,
    x: event.clientX,
    y: event.clientY,
    revision: props.document.revision,
    selected: props.selected.includes(id) ? props.selected : [id],
    scale: props.scale,
    movement: null,
    ready: false,
    preview: null,
  };
  gesture.current = current;
  props.notice(null);
  const allowed = props.selected.includes(id)
    ? await props.beforeEdit()
    : await props.select(id, false);
  if (gesture.current !== current) return;
  if (!allowed) return cancel();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (gesture.current !== current) return;
  current.ready = true;
}

function useMovementCancellation(
  props: Props,
  gesture: React.RefObject<Gesture | null>,
  cancel: () => void,
) {
  const selected = props.selected.join("\0");
  useEffect(() => {
    const current = gesture.current;
    if (current && current.selected.join("\0") !== selected) cancel();
  }, [cancel, gesture, selected]);
  useEffect(() => {
    cancel();
    return cancel;
  }, [cancel, props.document.id, props.document.revision, props.tool, props.scale, props.disabled]);
}

function pointerPreview(current: Gesture, document: DesignDocument, x: number, y: number) {
  if (!x && !y) return null;
  current.movement ??= preparePointerPlacement(
    document,
    current.selected,
    current.canvas,
    current.scale,
    { x: current.x, y: current.y },
  );
  return current.movement({ x: x / current.scale, y: y / current.scale });
}

function usePointerCancellation(cancel: () => void) {
  useEffect(() => {
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [cancel]);
}

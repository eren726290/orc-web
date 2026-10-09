import { useEffect, useRef, useState, type PointerEvent } from "react";
import { isLocked, textContent, type DesignDocument } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { createTextNode, RenderNode } from "../rendering/renderer";
import { replaceText } from "../rendering/text-runs";
import { usePointerMovement } from "./pointer-movement";
import { DropIndicator } from "./DropIndicator";
import { pointerDocument, type PointerPreview } from "./pointer-layout";
import type { ViewState } from "../view-state";

type Props = {
  document: DesignDocument;
  view: ViewState;
  setView: (patch: Partial<ViewState>) => void;
  select: (id: string | null, extend: boolean) => Promise<boolean>;
  beforeEdit: () => Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
  notice: (message: string | null) => void;
  disabled: boolean;
  keyDown: (event: React.KeyboardEvent) => void;
};
type Editing =
  | { kind: "new"; x: number; y: number; text: string }
  | { kind: "existing"; id: string; x: number; y: number; text: string };

export function Canvas(props: Props) {
  const editor = useCanvasEditor(props);
  const movement = usePointerMovement({
    ...props,
    tool: props.view.tool,
    selected: props.view.selected,
    scale: props.view.pan.scale,
  });
  const { canvas, handlers } = useCanvasEvents(props, editor.setEditing, movement);
  const rendered = { ...props, document: pointerDocument(props.document, movement.preview) };
  useCanvasWheel(canvas, props.view.pan, props.setView, movement.cancel);
  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- This application canvas implements custom keyboard commands and requires focus. */
  return (
    <div
      ref={canvas}
      className={`canvas tool-${props.view.tool}`}
      data-orc-revision={props.document.revision}
      role="application"
      aria-label="Canvas"
      tabIndex={0}
      onKeyDown={(event) => canvasKey(event, props, movement)}
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest("[data-orc-id]")) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      {...handlers}
    >
      <CanvasContent props={rendered} editing={editor.editing} finish={editor.finish} />
      <CanvasOverlays canvas={canvas} props={rendered} preview={movement.preview} />
    </div>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
}

function useCanvasEditor(props: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const finish = async (text: string) => {
    if (!editing) return;
    let accepted = true;
    if (editing.kind === "new" && text)
      accepted = await props.mutate({
        kind: "insert",
        nodes: [createTextNode(editing.x, editing.y, text)],
      });
    if (editing.kind === "existing") {
      const node = props.document.nodes[editing.id];
      if (node?.kind === "text")
        accepted = await props.mutate({
          kind: "text",
          id: node.id,
          runs: replaceText(node.runs, text),
        });
    }
    if (!accepted) return;
    setEditing(null);
    props.setView({ tool: "select" });
  };
  return { editing, setEditing, finish };
}

function useCanvasEvents(
  props: Props,
  edit: (value: Editing) => void,
  movement: ReturnType<typeof usePointerMovement>,
) {
  const canvas = useRef<HTMLDivElement>(null);
  const pan = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    movement.move(event);
    panCanvas(event, props, pan.current);
  };
  const stop = () => {
    pan.current = null;
  };
  const doubleClick = (event: React.MouseEvent) =>
    startTextEditing(event.target, props, canvas.current, edit);
  return {
    canvas,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) =>
        canvasPointer(event, props, pan, edit, movement),
      onPointerMove: move,
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
        stop();
        movement.finish(event);
      },
      onPointerCancel: () => {
        stop();
        movement.cancel();
      },
      onLostPointerCapture: () => {
        stop();
        movement.cancel();
      },
      onDoubleClick: doubleClick,
    },
  };
}

function CanvasContent({
  props,
  editing,
  finish,
}: {
  props: Props;
  editing: Editing | null;
  finish: (text: string) => Promise<void>;
}) {
  return (
    <>
      <div
        className="canvas-world"
        style={{
          transform: `translate(${props.view.pan.x}px, ${props.view.pan.y}px) scale(${props.view.pan.scale})`,
        }}
      >
        {props.document.workspaceRootIds.map((id) => (
          <RenderNode key={id} document={props.document} id={id} />
        ))}
        {editing && <CanvasText editing={editing} finish={finish} />}
      </div>
      {!props.document.workspaceRootIds.length && !editing && (
        <div className="canvas-empty">
          <span>Make room for an idea.</span>
          <p>Use Text to leave a note, or + Add to bring in a component.</p>
        </div>
      )}
    </>
  );
}

function canvasPointer(
  event: PointerEvent<HTMLDivElement>,
  props: Props,
  pan: React.RefObject<{ startX: number; startY: number; x: number; y: number } | null>,
  edit: (value: Editing) => void,
  movement: ReturnType<typeof usePointerMovement>,
) {
  if (
    event.button !== 0 ||
    props.disabled ||
    (event.target instanceof HTMLElement && event.target.closest("textarea"))
  )
    return;
  event.currentTarget.focus();
  if (props.view.tool === "pan") {
    pan.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: props.view.pan.x,
      y: props.view.pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    return;
  }
  selectOrMove(event, props, edit, movement);
}

async function canvasSelection(
  event: PointerEvent<HTMLDivElement>,
  props: Props,
  edit: (value: Editing) => void,
) {
  const canvas = event.currentTarget;
  event.preventDefault();
  const target = event.target instanceof Element ? event.target.closest("[data-orc-id]") : null;
  const id = target?.getAttribute("data-orc-id") ?? null;
  if (props.view.tool === "text" && !id) {
    if (!(await props.beforeEdit())) return;
    const bounds = canvas.getBoundingClientRect();
    edit({
      kind: "new",
      x: (event.clientX - bounds.left - props.view.pan.x) / props.view.pan.scale,
      y: (event.clientY - bounds.top - props.view.pan.y) / props.view.pan.scale,
      text: "",
    });
  } else if (props.view.tool === "text") void startTextEditing(event.target, props, canvas, edit);
  else if (!id || !isLocked(props.document, id)) props.select(id, event.shiftKey);
}

async function startTextEditing(
  target: EventTarget | null,
  props: Props,
  canvas: HTMLElement | null,
  edit: (value: Editing) => void,
) {
  const element = target instanceof Element ? target.closest("[data-orc-id]") : null;
  const id = element?.getAttribute("data-orc-id");
  const node = id ? props.document.nodes[id] : null;
  if (!node || node.kind !== "text" || !canvas || !element || isLocked(props.document, node.id))
    return;
  const bounds = element.getBoundingClientRect();
  const surface = canvas.getBoundingClientRect();
  if (!(await props.beforeEdit()) || !(await props.select(node.id, false))) return;
  edit({
    kind: "existing",
    id: node.id,
    x: (bounds.left - surface.left - props.view.pan.x) / props.view.pan.scale,
    y: (bounds.top - surface.top - props.view.pan.y) / props.view.pan.scale,
    text: textContent(node),
  });
}

function CanvasText({ editing, finish }: { editing: Editing; finish: (text: string) => void }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textarea.current?.focus();
  }, []);
  return (
    <textarea
      ref={textarea}
      aria-label="Edit canvas text"
      className="canvas-text-editor"
      defaultValue={editing.text}
      style={{ left: editing.x, top: editing.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={(event) => finish(event.target.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") event.currentTarget.blur();
      }}
    />
  );
}

function useCanvasWheel(
  canvas: React.RefObject<HTMLDivElement | null>,
  pan: ViewState["pan"],
  change: Props["setView"],
  cancel: () => void,
) {
  useEffect(() => {
    const element = canvas.current;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      cancel();
      const bounds = element?.getBoundingClientRect();
      if (!bounds) return;
      const scale = Math.max(0.1, Math.min(8, pan.scale * Math.exp(-event.deltaY * 0.0015)));
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      change({
        pan: {
          scale,
          x: x - ((x - pan.x) * scale) / pan.scale,
          y: y - ((y - pan.y) * scale) / pan.scale,
        },
      });
    };
    element?.addEventListener("wheel", wheel, { passive: false });
    return () => element?.removeEventListener("wheel", wheel);
  }, [canvas, pan, change, cancel]);
}

function SelectionOutline(props: {
  canvas: React.RefObject<HTMLDivElement | null>;
  selected: string[];
  document: DesignDocument;
  pan: ViewState["pan"];
}) {
  const [boxes, setBoxes] = useState<
    { id: string; left: number; top: number; width: number; height: number }[]
  >([]);
  useEffect(() => {
    const measure = () => {
      const surface = props.canvas.current;
      if (!surface) return;
      setBoxes(measureSelection(surface, props.selected));
    };
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (props.canvas.current) {
      observer.observe(props.canvas.current);
      for (const id of props.selected) {
        const element = props.canvas.current.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
        if (element) observer.observe(element);
      }
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [props.canvas, props.selected, props.document, props.pan]);
  return (
    <div className="selection-overlays">
      {boxes.map((box) => (
        <div key={box.id} className="selection-outline" style={box} />
      ))}
    </div>
  );
}

function measureSelection(surface: HTMLDivElement, selected: string[]) {
  const origin = surface.getBoundingClientRect();
  return selected.flatMap((id) => {
    const element = surface.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
    if (!element) return [];
    const bounds = element.getBoundingClientRect();
    return [
      {
        id,
        left: bounds.left - origin.left,
        top: bounds.top - origin.top,
        width: bounds.width,
        height: bounds.height,
      },
    ];
  });
}

function canvasKey(
  event: React.KeyboardEvent,
  props: Props,
  movement: ReturnType<typeof usePointerMovement>,
) {
  if (!movement.active()) return props.keyDown(event);
  if (event.key === "Escape") movement.cancel();
  event.preventDefault();
  event.stopPropagation();
}

function panCanvas(
  event: PointerEvent<HTMLDivElement>,
  props: Props,
  start: { startX: number; startY: number; x: number; y: number } | null,
) {
  if (start)
    props.setView({
      pan: {
        ...props.view.pan,
        x: start.x + event.clientX - start.startX,
        y: start.y + event.clientY - start.startY,
      },
    });
}

function selectOrMove(
  event: PointerEvent<HTMLDivElement>,
  props: Props,
  edit: (value: Editing) => void,
  movement: ReturnType<typeof usePointerMovement>,
) {
  const target = event.target instanceof Element ? event.target.closest("[data-orc-id]") : null;
  const id = target?.getAttribute("data-orc-id");
  if (props.view.tool === "select" && id && !isLocked(props.document, id) && !event.shiftKey) {
    event.preventDefault();
    void movement.begin(event, id);
  } else canvasSelection(event, props, edit);
}

function CanvasOverlays({
  canvas,
  props,
  preview,
}: {
  canvas: React.RefObject<HTMLDivElement | null>;
  props: Props;
  preview: PointerPreview;
}) {
  return (
    <>
      <DropIndicator
        canvas={canvas}
        document={props.document}
        preview={preview}
        pan={props.view.pan}
      />
      <SelectionOutline
        canvas={canvas}
        selected={props.view.selected}
        document={props.document}
        pan={props.view.pan}
      />
    </>
  );
}

import { useRef, type PointerEvent, type KeyboardEvent } from "react";
import type { ViewState } from "./view-state";

type Props = {
  panel: keyof ViewState["panels"];
  view: ViewState;
  change: (patch: Partial<ViewState>) => void;
};
type Drag = { position: number; size: number; pointerId: number } | null;
const settings = {
  layers: { label: "Layers", minimum: 216, maximum: 440, sign: 1 },
  properties: { label: "Properties", minimum: 240, maximum: 440, sign: -1 },
  code: { label: "Code", minimum: 120, maximum: 600, sign: -1 },
};

export function PanelResize(props: Props) {
  const config = settings[props.panel];
  const resize = (size: number) =>
    props.change({
      panels: {
        ...props.view.panels,
        [props.panel]: Math.max(config.minimum, Math.min(config.maximum, size)),
      },
    });
  const handlers = usePanelDrag(props, resize);
  // A focusable separator supplies the keyboard equivalent of dragging its edge.
  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
  return (
    <hr
      className={`panel-resize ${props.panel === "code" ? "horizontal" : "vertical"}`}
      aria-label={`Resize ${config.label}`}
      aria-orientation={props.panel === "code" ? "horizontal" : "vertical"}
      aria-valuemin={config.minimum}
      aria-valuemax={config.maximum}
      aria-valuenow={props.view.panels[props.panel]}
      tabIndex={0}
      {...handlers}
    />
  );
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
}

function usePanelDrag(props: Props, resize: (size: number) => void) {
  const drag = useRef<Drag>(null);
  const cancel = () => {
    if (drag.current) resize(drag.current.size);
    drag.current = null;
  };
  const position = (event: PointerEvent) =>
    props.panel === "code" ? event.clientY : event.clientX;
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (drag.current || event.button !== 0) return;
      drag.current = beginDrag(event, position(event), props.view.panels[props.panel]);
    },
    onPointerMove: (event: PointerEvent) => {
      const start = drag.current;
      if (start?.pointerId === event.pointerId)
        resize(start.size + (position(event) - start.position) * settings[props.panel].sign);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    onKeyDown: (event: KeyboardEvent) => panelKey(event, props, resize, cancel),
  };
}

function beginDrag(event: PointerEvent<HTMLElement>, position: number, size: number): Drag {
  event.preventDefault();
  event.currentTarget.focus();
  event.currentTarget.setPointerCapture(event.pointerId);
  return { position, size, pointerId: event.pointerId };
}

function panelKey(
  event: KeyboardEvent,
  props: Props,
  resize: (size: number) => void,
  cancel: () => void,
) {
  const config = settings[props.panel];
  const directions: Record<string, number> =
    props.panel === "code" ? { ArrowUp: -1, ArrowDown: 1 } : { ArrowLeft: -1, ArrowRight: 1 };
  const direction = directions[event.key];
  if (event.key === "Escape") cancel();
  else if (event.key === "Home") resize(config.minimum);
  else if (event.key === "End") resize(config.maximum);
  else if (direction)
    resize(props.view.panels[props.panel] + direction * config.sign * (event.shiftKey ? 32 : 8));
  else return;
  event.preventDefault();
}

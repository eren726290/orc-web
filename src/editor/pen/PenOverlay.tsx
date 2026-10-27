import { useEffect, useState } from "react";
import { isLocked } from "../../../shared/document/model";
import type { PenGeometry } from "../../../shared/pen/model";
import { localPoint } from "./coordinates";
import { observeOverlayGeometry } from "../canvas/overlay-geometry";
import type { PenProps, PenState } from "./types";
import { selectedPen } from "./drag";
import type { PenNode } from "./node";
import "./pen.css";
import { PenGuides } from "./PenGuides";
import { PenTransformHandles } from "./PenTransformHandles";

type Handle = { id: string; x: number; y: number; index: number };
type Geometry = { handles: Handle[]; matrix: DOMMatrix | null; width: number; height: number };
const emptyGeometry: Geometry = { handles: [], matrix: null, width: 0, height: 0 };

export function PenOverlay({ props, state }: { props: PenProps; state: PenState }) {
  const selected = selectedPen(props);
  const path = visiblePath(state, selected);
  const id = state.drawing?.nodeId ?? selected?.id ?? null;
  const geometry = usePenGeometry(props, id, path, state.drawing?.forward ?? null);
  if (!path) return null;
  return (
    <div className="pen-overlays">
      <AuxiliaryGuides props={props} state={state} path={path} geometry={geometry} id={id} />
      <PenHandles props={props} state={state} selected={selected} geometry={geometry} id={id} />
      <PenHint state={state} />
      <SelectionTransforms
        props={props}
        state={state}
        selected={selected}
        matrix={geometry.matrix}
      />
    </div>
  );
}

function visiblePath(state: PenState, selected: PenNode | null) {
  return state.dragging?.motion.path ?? state.drawing?.shown ?? selected?.pen;
}

type OverlayProps = {
  props: PenProps;
  state: PenState;
  selected: PenNode | null;
  geometry: Geometry;
  id: string | null;
};

function PenHandles({ props, state, selected, geometry, id }: OverlayProps) {
  const locked = selected && isLocked(props.appliedDocument, selected.id);
  const active = state.selectedAnchor?.nodeId === id ? state.selectedAnchor.anchor : null;
  return geometry.handles.map((point) => (
    <button
      key={point.id}
      type="button"
      className="pen-anchor"
      data-pen-anchor={point.id}
      aria-label={`Anchor ${point.index}`}
      aria-pressed={active === point.id}
      disabled={props.disabled || Boolean(locked)}
      style={{ left: point.x, top: point.y }}
    />
  ));
}

function AuxiliaryGuides({
  props,
  state,
  path,
  geometry,
  id,
}: Omit<OverlayProps, "selected"> & { path: PenGeometry }) {
  if (!props.view.penGuides || !geometry.matrix) return null;
  const active = state.selectedAnchor?.nodeId === id ? state.selectedAnchor.anchor : undefined;
  return <PenGuides {...geometry} matrix={geometry.matrix} path={path} selected={active} />;
}

function SelectionTransforms({
  props,
  state,
  selected,
  matrix,
}: Pick<OverlayProps, "props" | "state" | "selected"> & { matrix: DOMMatrix | null }) {
  if (!selected || !matrix || props.view.tool !== "select" || state.dragging) return null;
  return (
    <PenTransformHandles
      node={selected}
      matrix={matrix}
      disabled={props.disabled || isLocked(props.appliedDocument, selected.id)}
    />
  );
}

function PenHint({ state }: { state: PenState }) {
  if (state.drawing)
    return (
      <output className="pen-hint">
        {state.drawing.mode === "arc" ? "Tangent arc" : "Line"} · A to switch · Enter to finish
        {state.drawing.placement === "flow" && " · Frame places this path"}
      </output>
    );
  return state.dragging?.motion.pending ? (
    <output className="pen-hint">Moving to pointer… Release keeps the last valid shape.</output>
  ) : null;
}

function usePenGeometry(
  props: PenProps,
  id: string | null,
  path: PenGeometry | undefined,
  fallback: DOMMatrix | null,
) {
  const [geometry, setGeometry] = useState<Geometry>(emptyGeometry);
  useEffect(() => {
    const measure = () => setGeometry(measureGeometry(props.canvas.current, id, path, fallback));
    measure();
    return observeOverlayGeometry(props.canvas.current, id ? [id] : [], measure);
  }, [id, path, props.canvas, props.view.pan, fallback]);
  return geometry;
}

function measureGeometry(
  canvas: HTMLDivElement | null,
  id: string | null,
  path: PenGeometry | undefined,
  fallback: DOMMatrix | null,
): Geometry {
  if (!canvas || !path) return emptyGeometry;
  const svg = id ? canvas.querySelector(`[data-orc-id="${CSS.escape(id)}"]`) : null;
  const native = svg instanceof SVGSVGElement ? svg.getScreenCTM() : fallback;
  if (!native) return emptyGeometry;
  const surface = canvas.getBoundingClientRect();
  const matrix = DOMMatrix.fromMatrix(native);
  matrix.e -= surface.x;
  matrix.f -= surface.y;
  const handles = path.anchors
    .map((anchor, index) => {
      const point = localPoint(matrix, anchor);
      return { id: anchor.id, ...point, index: index + 1 };
    })
    .filter(
      (point) =>
        point.x > -22 &&
        point.x < surface.width + 22 &&
        point.y > -22 &&
        point.y < surface.height + 22,
    );
  return { handles, matrix, width: surface.width, height: surface.height };
}

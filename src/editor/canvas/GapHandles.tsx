import { useEffect, useState } from "react";
import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import type { ViewState } from "../view-state";
import { readGap } from "../layout/gap";
import { GapField } from "../properties/frame-gap-controls";
import "./gap-handles.css";
import type { PropertyPreview } from "../properties/property-preview";
import { measureGaps } from "./gap-geometry";

type Props = {
  canvas: React.RefObject<HTMLDivElement | null>;
  document: DesignDocument;
  appliedDocument: DesignDocument;
  view: ViewState;
  disabled: boolean;
  beforeEdit: () => Promise<boolean>;
  preview: (value: PropertyPreview) => void;
  mutate: (value: Mutation) => Promise<boolean>;
};

type GapPoint = ReturnType<typeof measureGaps>[number];

export function GapHandles(props: Props) {
  const document = props.appliedDocument;
  const node =
    props.view.selected.length === 1 ? document.nodes[props.view.selected[0]] : undefined;
  const enabled =
    node?.kind === "frame" &&
    props.view.tool === "select" &&
    !isLocked(document, node.id) &&
    readGap(node).value !== null;
  const geometry = useGapGeometry(props, enabled ? node : undefined);
  const held = useHeldGap(
    geometry,
    `${document.id}/${document.revision}/${node?.id}/${props.view.pan.scale}`,
  );
  if (!enabled || !node) return null;
  return held.geometry.map((point) => (
    <GapHandle
      key={`${document.id}/${node.id}/${point.key}`}
      props={props}
      node={node}
      point={point}
      hold={held.hold}
    />
  ));
}

function GapHandle({
  props,
  node,
  point,
  hold,
}: {
  props: Props;
  node: DesignNode;
  point: GapPoint;
  hold: (point: GapPoint) => void;
}) {
  return (
    <div
      className="gap-handle"
      data-axis={point.axis}
      style={{ insetInlineStart: point.x, insetBlockStart: point.y }}
      onPointerDownCapture={(event) => {
        if (!props.disabled && event.button === 0) hold(point);
      }}
    >
      <GapField
        document={props.appliedDocument}
        node={node}
        label={point.label}
        axis={point.axis}
        scale={props.view.pan.scale}
        disabled={props.disabled}
        prepare={props.beforeEdit}
        preview={props.preview}
        mutate={props.mutate}
      />
    </div>
  );
}

function useHeldGap(geometry: GapPoint[], owner: string) {
  const [held, setHeld] = useState<{ point: GapPoint; owner: string } | null>(null);
  useEffect(() => {
    const release = () => setHeld(null);
    // Let the input's pointerup listener finish before removing a reflowed handle.
    const completed = () => window.setTimeout(release, 0);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") release();
    };
    window.addEventListener("pointerup", completed);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerup", completed);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  const retain = held?.owner === owner && !geometry.some((point) => point.key === held.point.key);
  return {
    geometry: retain ? [...geometry, held.point] : geometry,
    hold: (point: GapPoint) => setHeld({ point, owner }),
  };
}

function useGapGeometry(props: Props, node: DesignNode | undefined) {
  const [geometry, setGeometry] = useState<ReturnType<typeof measureGaps>>([]);
  useEffect(() => {
    const measure = () => setGeometry(measureGaps(props.canvas.current, props.document, node));
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    const canvas = props.canvas.current;
    if (canvas) {
      observer.observe(canvas);
      for (const id of node ? [node.id, ...node.children] : []) {
        const element = canvas.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
        if (element) observer.observe(element);
      }
      canvas.addEventListener("scroll", measure, true);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas?.removeEventListener("scroll", measure, true);
    };
  }, [props.canvas, props.document, props.view.pan, node]);
  return geometry;
}

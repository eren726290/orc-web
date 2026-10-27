import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter } from "lucide-react";
import { readConstraints, prepareConstraints } from "../layout/constraints";
import type { ConstraintAxis, ConstraintMode } from "../layout/constraint-css";
import { FrameLayoutControls, useLayoutFocus } from "./frame-layout-controls";
import { observeOverlayGeometry } from "../canvas/overlay-geometry";
import "./constraint-controls.css";

type Props = Parameters<typeof FrameLayoutControls>[0];
const choices = ["start", "end", "both", "center"] as const;
const labels = {
  width: ["Left", "Right", "Left & Right", "Center"],
  height: ["Top", "Bottom", "Top & Bottom", "Center"],
};
type Change = (axis: ConstraintAxis, mode: ConstraintMode, align?: boolean) => Promise<void>;

export function ConstraintControls(props: Props) {
  const state = useConstraintChange(props);
  if (!state.current) return null;
  return (
    <div className="constraint-controls">
      <h3>Constraints</h3>
      <fieldset disabled={state.pending} aria-label="Constraints">
        <ConstraintDiagram current={state.current} change={state.change} />
        <div className="constraint-choices">
          <AxisChoice axis="width" current={state.current.width} change={state.change} />
          <AxisChoice axis="height" current={state.current.height} change={state.change} />
        </div>
      </fieldset>
      {state.current.width.message || state.current.height.message ? (
        <p>Constraints controlled by source. Edit in Code.</p>
      ) : (
        <p>Both edges: fixed edge distances.</p>
      )}
      {(state.current.width.limited || state.current.height.limited) && (
        <p>A size limit overrides an end margin. The saved margins are retained.</p>
      )}
      {state.error && <p role="alert">{state.error}</p>}
    </div>
  );
}

type AxisProps = {
  axis: ConstraintAxis;
  current: NonNullable<ReturnType<typeof readConstraints>>["width"];
  change: Change;
};

function AxisChoice({ axis, current, change }: AxisProps) {
  const horizontal = axis === "width";
  const name = horizontal ? "Horizontal" : "Vertical";
  const Icon = horizontal ? AlignHorizontalJustifyCenter : AlignVerticalJustifyCenter;
  return (
    <div className="constraint-axis">
      <label className="field">
        {name}
        <select
          aria-label={`${name} constraint`}
          value={current.mode ?? "source"}
          disabled={!current.editable}
          onChange={(event) => {
            const value = choices.find((mode) => mode === event.currentTarget.value);
            if (value) void change(axis, value);
          }}
        >
          {choices.map((mode, index) => (
            <option key={mode} value={mode}>
              {labels[axis][index]}
            </option>
          ))}
          {current.mode === null && <option value="source">Source</option>}
        </select>
      </label>
      <button
        type="button"
        aria-label={`Align ${name.toLowerCase()} center`}
        title={`Align ${name.toLowerCase()} center`}
        disabled={!current.editable}
        onClick={() => void change(axis, "center", true)}
      >
        <Icon aria-hidden="true" />
      </button>
    </div>
  );
}

function ConstraintDiagram({
  current,
  change,
}: {
  current: NonNullable<ReturnType<typeof readConstraints>>;
  change: Change;
}) {
  return (
    <fieldset className="constraint-diagram" aria-label="Constraint diagram">
      {(["width", "height"] as const).flatMap((axis) =>
        ["start", "center", "end"].map((part) => {
          const mode = part === "start" || part === "end" ? part : "center";
          const active =
            current[axis].mode === mode || (mode !== "center" && current[axis].mode === "both");
          const edge = labels[axis][mode === "start" ? 0 : mode === "end" ? 1 : 3];
          return (
            <button
              key={`${axis}-${mode}`}
              type="button"
              className={`constraint-${axis}-${mode}`}
              aria-label={`${axis === "width" ? "Horizontal" : "Vertical"} ${edge}`}
              title={`${axis === "width" ? "Horizontal" : "Vertical"} ${edge}`}
              aria-pressed={active}
              disabled={!current[axis].editable}
              onClick={() => void change(axis, toggleEdge(current[axis].mode, mode))}
            >
              <DiagramMark axis={axis} center={mode === "center"} />
            </button>
          );
        }),
      )}
      <span className="constraint-object" aria-hidden="true" />
    </fieldset>
  );
}

function toggleEdge(current: ConstraintMode | null, edge: ConstraintMode): ConstraintMode {
  if (edge === "center") return edge;
  const other = edge === "start" ? "end" : "start";
  return current === "both" ? other : current === other ? "both" : edge;
}

function useConstraintChange(props: Props) {
  const [current, setCurrent] = useState<ReturnType<typeof readConstraints>>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remember = useLayoutFocus(pending, props.node.id);
  useLayoutEffect(() => {
    if (pending) return;
    const canvas = document.querySelector<HTMLDivElement>(".canvas");
    return observeOverlayGeometry(canvas, [props.node.id], () =>
      setCurrent(readConstraints(props.document, props.node)),
    );
  }, [props.document, props.node, pending]);
  const change: Change = async (axis, mode, align = false) => {
    if (pending) return;
    remember();
    setPending(true);
    setError(null);
    try {
      if (!(await props.prepare())) return;
      const candidate = prepareConstraints(props.document, props.node.id, axis, mode, align);
      if (!candidate) return;
      flushSync(() => props.preview(candidate.mutation));
      candidate.validate();
      await props.mutate(candidate.mutation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The constraint change failed.");
    } finally {
      props.preview(null);
      setPending(false);
    }
  };
  return { current, pending, error, change };
}

function DiagramMark({ axis, center }: { axis: ConstraintAxis; center: boolean }) {
  if (!center) return <span aria-hidden="true" />;
  return axis === "width" ? (
    <AlignHorizontalJustifyCenter aria-hidden="true" />
  ) : (
    <AlignVerticalJustifyCenter aria-hidden="true" />
  );
}

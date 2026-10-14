import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  prepareFrameAlignment,
  readFrameAlignment,
  type AlignmentChoice,
} from "../layout/alignment";
import { FrameLayoutControls, useLayoutFocus } from "./frame-layout-controls";
import "./alignment-controls.css";

type Props = Parameters<typeof FrameLayoutControls>[0];
const edges = ["start", "center", "end"] as const;
const vertical = ["top", "middle", "bottom"];
const horizontal = ["left", "center", "right"];

export function FrameAlignmentControls(props: Props) {
  const state = useFrameAlignmentChange(props);
  if (!state.current) return null;
  return (
    <div className="alignment-controls">
      <PackedAlignment {...state} current={state.current} />
      <Distribution {...state} current={state.current} />
      {!state.current.packedOwned && <p>Alignment controlled by source. Edit in Code.</p>}
      {state.current.distribution === "Space between" && (
        <p>Gap is the minimum. Choosing a position uses Packed.</p>
      )}
      {state.error && <p role="alert">{state.error}</p>}
    </div>
  );
}

type Controls = Pick<ReturnType<typeof useFrameAlignmentChange>, "pending" | "change"> & {
  current: NonNullable<ReturnType<typeof readFrameAlignment>>;
};

function PackedAlignment({ current, pending, change }: Controls) {
  return (
    <fieldset aria-label="Packed alignment" disabled={pending || !current.packedOwned}>
      <legend>Alignment</legend>
      <div className="alignment-grid">
        {edges.flatMap((y, row) =>
          edges.map((x, column) => {
            const label = `Align ${vertical[row]} ${horizontal[column]}`;
            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={current.point?.x === x && current.point.y === y}
                onClick={() => void change({ kind: "point", x, y })}
              >
                <span aria-hidden="true" />
              </button>
            );
          }),
        )}
      </div>
    </fieldset>
  );
}

function Distribution({ current, pending, change }: Controls) {
  return (
    <fieldset aria-label="Distribution" disabled={pending || !current.distributionOwned}>
      <legend>Distribution</legend>
      <div className="alignment-distribution">
        {(["Packed", "Space between"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={current.distribution === value}
            onClick={() => void change({ kind: "distribution", value })}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function useFrameAlignmentChange(props: Props) {
  const [current, setCurrent] = useState<ReturnType<typeof readFrameAlignment>>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rememberFocus = useLayoutFocus(pending, props.node.id);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() =>
      setCurrent(readFrameAlignment(props.document, props.node)),
    );
    return () => cancelAnimationFrame(frame);
  }, [props.document, props.node]);
  const change = async (choice: AlignmentChoice) => {
    if (pending) return;
    rememberFocus();
    setPending(true);
    setError(null);
    try {
      if (!(await props.prepare())) return;
      const candidate = prepareFrameAlignment(props.document, props.node.id, choice);
      if (!candidate) return;
      flushSync(() => props.preview(candidate.mutation));
      candidate.validate();
      await props.mutate(candidate.mutation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The alignment change failed.");
    } finally {
      props.preview(null);
      setPending(false);
    }
  };
  return { current, pending, error, change };
}

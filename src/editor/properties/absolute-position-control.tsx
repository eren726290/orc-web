import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { prepareAbsolutePosition, readAbsolutePosition } from "../layout/absolute-placement";
import { FrameLayoutControls, useLayoutFocus } from "./frame-layout-controls";

type Props = Parameters<typeof FrameLayoutControls>[0];

export function AbsolutePositionControl(props: Props) {
  const { current, action, change, error } = useAbsolutePosition(props);
  if (!current) return null;
  return (
    <div className="layout-controls">
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={action ?? current.absolute}
          disabled={action !== null || !current.editable}
          onChange={(event) => void change(event.currentTarget.checked)}
        />
        Absolute Position
      </label>
      <p>
        {!current.editable
          ? "Position controlled by source. Edit in Code."
          : current.absolute
            ? "Outside the flow. Position is relative to the parent."
            : "In the flow. The parent arranges this object."}
      </p>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function useAbsolutePosition(props: Props) {
  const [current, setCurrent] = useState<ReturnType<typeof readAbsolutePosition>>(null);
  const [action, setAction] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rememberFocus = useLayoutFocus(action !== null, props.node.id);
  useLayoutEffect(() => {
    if (action !== null) return;
    const frame = requestAnimationFrame(() =>
      setCurrent(readAbsolutePosition(props.document, props.node)),
    );
    return () => cancelAnimationFrame(frame);
  }, [props.document, props.node, action]);
  const change = async (absolute: boolean) => {
    if (action !== null) return;
    rememberFocus();
    setAction(absolute);
    setError(null);
    try {
      if (!(await props.prepare())) return;
      const candidate = prepareAbsolutePosition(props.document, props.node.id, absolute);
      if (!candidate) return;
      flushSync(() => props.preview(candidate.mutation));
      candidate.validate();
      await props.mutate(candidate.mutation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The position change failed.");
    } finally {
      props.preview(null);
      setAction(null);
    }
  };
  return { current, action, change, error };
}

import { useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { prepareSizing, readSizing, type SizingAxis, type SizingMode } from "../layout/sizing";
import { FrameLayoutControls, useLayoutFocus } from "./frame-layout-controls";
import { PropertyField } from "./property-field";
import { penSizingReadout } from "../pen/sizing-readout";
import "./sizing-controls.css";

type PairProps = Parameters<typeof FrameLayoutControls>[0];
type Props = PairProps & {
  axis: SizingAxis;
  active: SizingAxis | null;
  activate: (axis: SizingAxis | null) => void;
};

export function SizingControls(props: PairProps) {
  const [active, activate] = useState<SizingAxis | null>(null);
  return (
    <>
      <SizingControl {...props} axis="width" active={active} activate={activate} />
      <SizingControl {...props} axis="height" active={active} activate={activate} />
    </>
  );
}

function SizingControl(props: Props) {
  const state = useSizingControl(props);
  const label = props.axis === "width" ? "Width" : "Height";
  const current = state.current;
  return (
    <fieldset className="sizing-control" disabled={state.blocked}>
      <SizingChoice {...state} label={label} />
      <SizingValue props={props} state={state} label={label} />
      {current?.message && <p>{current.message}</p>}
      {state.error && <p role="alert">{state.error}</p>}
    </fieldset>
  );
}

function SizingValue({
  props,
  state,
  label,
}: {
  props: Props;
  state: ReturnType<typeof useSizingControl>;
  label: string;
}) {
  const current = state.current;
  return (
    <PropertyField
      label={label}
      value={current?.value ?? "Edit source"}
      type={current?.editable ? "number" : "text"}
      min={0}
      step="any"
      readOnly={!current?.editable || state.pending}
      commitUnchanged={props.active === props.axis && current?.mode !== "Fixed"}
      adjustment={{
        owner: `${props.document.id}/${props.document.revision}/${props.node.id}/${props.axis}`,
        axis: "x",
        scale: 1,
      }}
      decode={decodeSize}
      prepare={props.prepare}
      preview={state.preview}
      cancel={state.cancel}
      commit={(value) => state.complete("Fixed", Number(value))}
    />
  );
}

function SizingChoice(props: ReturnType<typeof useSizingControl> & { label: string }) {
  const mode = props.current?.mode ?? "Source";
  return (
    <label className="field">
      {props.label} sizing
      <select
        aria-label={`${props.label} sizing`}
        value={mode}
        disabled={props.active || props.pending || !props.current?.convertible}
        onChange={(event) => {
          const value = event.currentTarget.value;
          if (isSizingMode(value)) void props.complete(value);
        }}
      >
        <option value="Fixed">Fixed</option>
        <option value="Fit" disabled={!props.current?.fit}>
          Fit
        </option>
        <option value="Fill" disabled={!props.current?.fill}>
          Fill
        </option>
        {!isSizingMode(mode) && (
          <option value={mode} disabled>
            {mode}
          </option>
        )}
      </select>
    </label>
  );
}

function isSizingMode(value: string): value is SizingMode {
  return value === "Fixed" || value === "Fit" || value === "Fill";
}

function useSizingReadout(props: Props, busy: boolean) {
  const [current, setCurrent] = useState<ReturnType<typeof readSizing> | null>(null);
  useLayoutEffect(() => {
    if (busy) return;
    const element = document.querySelector(
      `.canvas-world [data-orc-id="${CSS.escape(props.node.id)}"]`,
    );
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setCurrent(
          penSizingReadout(props.node, props.axis) ??
            readSizing(props.document, props.node, props.axis),
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    if (element?.parentElement) observer.observe(element.parentElement);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [props.document, props.node, props.axis, busy]);
  return current;
}

function useSizingControl(props: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = props.active !== null;
  const blocked = active && props.active !== props.axis;
  const current = useSizingReadout(props, active || pending);
  const rememberFocus = useLayoutFocus(pending, props.node.id);
  const cancel = () => {
    props.preview(null);
    props.activate(null);
  };
  const preview = sizingPreview(props, { setError, cancel });
  const complete = sizingCompletion(props, {
    pending,
    setPending,
    setError,
    rememberFocus,
    cancel,
  });
  return { current, active, blocked, pending, error, preview, cancel, complete };
}

function sizingPreview(
  props: Props,
  state: {
    setError: (value: string | null) => void;
    cancel: () => void;
  },
) {
  const { document, node, axis } = props;
  return (value: string) => {
    state.setError(null);
    try {
      flushSync(() => props.preview(null));
      const candidate = prepareSizing(document, node.id, axis, "Fixed", Number(value));
      if (!candidate) {
        state.cancel();
        return;
      }
      flushSync(() => {
        props.activate(props.axis);
        props.preview(candidate.mutation);
      });
      candidate.validate();
    } catch (cause) {
      state.cancel();
      state.setError(cause instanceof Error ? cause.message : "The size change failed.");
    }
  };
}

function sizingCompletion(
  props: Props,
  state: {
    pending: boolean;
    setPending: (value: boolean) => void;
    setError: (value: string | null) => void;
    rememberFocus: () => void;
    cancel: () => void;
  },
) {
  return async (mode: SizingMode, value?: number) => {
    if (state.pending) return false;
    state.rememberFocus();
    props.activate(props.axis);
    state.setPending(true);
    state.setError(null);
    try {
      if (!(await props.prepare())) return false;
      flushSync(() => props.preview(null));
      const candidate = prepareSizing(props.document, props.node.id, props.axis, mode, value);
      if (!candidate) return true;
      flushSync(() => props.preview(candidate.mutation));
      candidate.validate();
      return await props.mutate(candidate.mutation);
    } catch (cause) {
      state.setError(cause instanceof Error ? cause.message : "The size change failed.");
      return false;
    } finally {
      state.cancel();
      state.setPending(false);
    }
  };
}

function decodeSize(value: string) {
  const number = Number(value);
  return value.trim() && Number.isFinite(number) && number >= 0 ? String(number) : null;
}

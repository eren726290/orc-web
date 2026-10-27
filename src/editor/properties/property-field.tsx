import { useId, useLayoutEffect, useRef, useState } from "react";
import { useNumberDrag } from "./number-drag";

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "number";
  multiline?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  readOnly?: boolean;
  commitUnchanged?: boolean;
  adjustment?: { owner: string; axis: "x" | "y"; scale: number };
  decode: (value: string) => string | null;
  prepare: () => boolean | Promise<boolean>;
  preview: (value: string) => void;
  cancel: () => void;
  commit: (value: string) => Promise<boolean>;
};
type Field = HTMLInputElement | HTMLTextAreaElement;

export function PropertyField(props: Props) {
  const { error, errorId, attributes, setError } = useField(props);
  return (
    <label className="field">
      {props.label}
      {props.multiline ? (
        <textarea key={props.value} rows={3} {...attributes} />
      ) : props.adjustment ? (
        <AdjustableInput props={props} attributes={attributes} error={setError} />
      ) : (
        <input
          key={props.readOnly ? undefined : props.value}
          type={props.type ?? "text"}
          min={props.min}
          max={props.max}
          step={props.step}
          {...attributes}
          value={props.readOnly ? props.value : undefined}
          defaultValue={props.readOnly ? undefined : props.value}
        />
      )}
      {error && (
        <small id={errorId} role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

function useField(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);
  const errorId = useId();
  const attributes = {
    defaultValue: props.value,
    placeholder: props.placeholder,
    readOnly: props.readOnly,
    "aria-invalid": error !== null,
    "aria-label": props.label,
    "aria-describedby": error ? errorId : undefined,
    onFocus: () => {
      cancelled.current = false;
    },
    onChange: (event: React.ChangeEvent<Field>) => {
      beginChange(event.currentTarget, props, setError);
    },
    onBlur: (event: React.FocusEvent<Field>) => {
      if (cancelled.current) cancelled.current = false;
      else void finishChange(event.currentTarget, props).then(setError);
    },
    onKeyDown: (event: React.KeyboardEvent<Field>) => {
      if (event.key === "Escape") {
        cancelled.current = true;
        event.currentTarget.value = props.value;
        props.cancel();
        event.currentTarget.blur();
      } else if (event.key === "Enter" && !props.multiline) event.currentTarget.blur();
      else if (props.adjustment) adjustNumber(event, props, setError);
    },
  };
  return { error, errorId, attributes, setError };
}

function AdjustableInput({
  props,
  attributes,
  error,
}: {
  props: Props;
  attributes: ReturnType<typeof useField>["attributes"];
  error: (message: string | null) => void;
}) {
  const { input, drag } = useAdjustableDrag(props, error);
  return (
    <input
      ref={input}
      type={props.type ?? "number"}
      min={props.min}
      step={props.step}
      {...attributes}
      onPointerDown={(event) => drag.begin(event, props.adjustment?.axis ?? "x")}
      onBlur={(event) => {
        if (!drag.busy()) attributes.onBlur(event);
      }}
    />
  );
}

function useAdjustableDrag(props: Props, error: (message: string | null) => void) {
  const input = useRef<HTMLInputElement>(null);
  const applied = useRef(props.value);
  useLayoutEffect(() => {
    applied.current = props.value;
    if (input.current) input.current.value = props.value;
  }, [props.value]);
  const drag = useNumberDrag({
    owner: props.adjustment?.owner ?? "",
    value: Number(props.value),
    disabled: Boolean(props.readOnly),
    scale: props.adjustment?.scale ?? 1,
    min: props.min ?? 0,
    prepare: props.prepare,
    error,
    preview: (value) => {
      if (input.current) input.current.value = value === null ? applied.current : String(value);
      if (value === null) props.cancel();
      else {
        const decoded = props.decode(String(value));
        if (decoded !== null) props.preview(decoded);
      }
    },
    commit: (value) => {
      const decoded = props.decode(String(value));
      return decoded === null ? Promise.resolve(false) : props.commit(decoded);
    },
  });
  return { input, drag };
}

function adjustNumber(
  event: React.KeyboardEvent<Field>,
  props: Props,
  setError: (message: string | null) => void,
) {
  if (props.readOnly || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  const current = Number(event.currentTarget.value);
  if (!Number.isFinite(current) || !event.currentTarget.value) return;
  const step = (event.shiftKey ? 8 : 1) * (event.key === "ArrowUp" ? 1 : -1);
  event.currentTarget.value = String(Math.max(props.min ?? 0, current + step));
  beginChange(event.currentTarget, props, setError);
}

function beginChange(element: Field, props: Props, setError: (error: string | null) => void) {
  const value = element.value;
  const candidate = props.decode(value);
  setError(candidate === null ? `Enter a valid ${props.label.toLowerCase()}.` : null);
  if (candidate === null) return;
  const allowed = props.prepare();
  if (typeof allowed === "boolean") {
    if (allowed) props.preview(candidate);
    else element.value = props.value;
  } else {
    element.value = props.value;
    void allowed.then((accepted) => {
      if (accepted) {
        element.value = value;
        props.preview(candidate);
      }
    });
  }
}

async function finishChange(element: Field, props: Props): Promise<string | null> {
  if (props.readOnly) return null;
  const value = props.decode(element.value);
  if (value === null) {
    return `Enter a valid ${props.label.toLowerCase()}.`;
  }
  if (!props.commitUnchanged && value === props.decode(props.value)) {
    element.value = props.value;
    props.cancel();
    return null;
  }
  try {
    if (!(await props.commit(value))) element.value = props.value;
    return null;
  } finally {
    props.cancel();
  }
}

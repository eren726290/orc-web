import { useId, useState } from "react";

type Props = {
  label: string;
  value: string;
  type?: "text" | "number";
  multiline?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  readOnly?: boolean;
  decode: (value: string) => string | null;
  prepare: () => boolean | Promise<boolean>;
  preview: (value: string) => void;
  cancel: () => void;
  commit: (value: string) => Promise<boolean>;
};
type Field = HTMLInputElement | HTMLTextAreaElement;

export function PropertyField(props: Props) {
  const { error, errorId, attributes } = useField(props);
  return (
    <label className="field">
      {props.label}
      {props.multiline ? (
        <textarea key={props.value} rows={3} {...attributes} />
      ) : (
        <input
          key={props.value}
          type={props.type ?? "text"}
          min={props.min}
          max={props.max}
          step={props.step}
          {...attributes}
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
  const errorId = useId();
  const attributes = {
    defaultValue: props.value,
    readOnly: props.readOnly,
    "aria-invalid": error !== null,
    "aria-label": props.label,
    "aria-describedby": error ? errorId : undefined,
    onChange: (event: React.ChangeEvent<Field>) => {
      beginChange(event.currentTarget, props, setError);
    },
    onBlur: (event: React.FocusEvent<Field>) => {
      void finishChange(event.currentTarget, props).then(setError);
    },
    onKeyDown: (event: React.KeyboardEvent<Field>) => {
      if (event.key === "Escape") {
        event.currentTarget.value = props.value;
        props.cancel();
        event.currentTarget.blur();
      } else if (event.key === "Enter" && !props.multiline) event.currentTarget.blur();
    },
  };
  return { error, errorId, attributes };
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
  if (value === props.decode(props.value)) {
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

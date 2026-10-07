import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const attributes = {
    defaultValue: props.value,
    readOnly: props.readOnly,
    "aria-invalid": error !== null,
    onChange: (event: React.ChangeEvent<Field>) => {
      setError(null);
      beginChange(event.currentTarget, props);
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
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

function beginChange(element: Field, props: Props) {
  const value = element.value;
  const preview = () => {
    const candidate = props.decode(value);
    if (candidate === null) props.cancel();
    else props.preview(candidate);
  };
  const allowed = props.prepare();
  if (typeof allowed === "boolean") {
    if (allowed) preview();
    else element.value = props.value;
  } else {
    element.value = props.value;
    void allowed.then((accepted) => {
      if (accepted) {
        element.value = value;
        preview();
      }
    });
  }
}

async function finishChange(element: Field, props: Props): Promise<string | null> {
  if (props.readOnly) return null;
  const value = props.decode(element.value);
  if (value === null) {
    element.value = props.value;
    props.cancel();
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

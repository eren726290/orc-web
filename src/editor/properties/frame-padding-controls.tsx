import { useState } from "react";
import { flushSync } from "react-dom";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { paddingChange, readPadding } from "../layout/padding";
import { PropertyField } from "./property-field";
import type { PropertyPreview } from "./property-preview";
import { prepareFillSharing } from "../layout/fill-sharing";
import "./padding-controls.css";

type Props = {
  document: DesignDocument;
  node: DesignNode;
  prepare: () => boolean | Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
  preview: (value: PropertyPreview) => void;
};
type Side = ReturnType<typeof readPadding>["top"];

export function FramePaddingControls(props: Props) {
  if (props.node.kind !== "frame") return null;
  const sides = readPadding(props.node);
  return (
    <div className="padding-controls">
      <h3>Padding</h3>
      <div className="field-grid">
        <PaddingField {...props} label="Horizontal padding" sides={[sides.left, sides.right]} />
        <PaddingField {...props} label="Vertical padding" sides={[sides.top, sides.bottom]} />
      </div>
      <details>
        <summary>Individual sides</summary>
        <div className="field-grid">
          <PaddingField {...props} label="Top padding" sides={[sides.top]} />
          <PaddingField {...props} label="Right padding" sides={[sides.right]} />
          <PaddingField {...props} label="Bottom padding" sides={[sides.bottom]} />
          <PaddingField {...props} label="Left padding" sides={[sides.left]} />
        </div>
      </details>
      {Object.values(sides).some((side) => !side.fixed) && (
        <p>Some padding is controlled by source. Edit those values in Code.</p>
      )}
    </div>
  );
}

function PaddingField(props: Props & { label: string; sides: [Side, ...Side[]] }) {
  const source = props.sides.some((side) => !side.fixed);
  const mixed = !source && props.sides.some((side) => side.value !== props.sides[0].value);
  const value = source ? "Edit source" : mixed ? "" : String(parseFloat(props.sides[0].value));
  const actions = usePaddingActions(props);
  return (
    <>
      <PropertyField
        label={props.label}
        value={value}
        placeholder={mixed ? "Mixed" : undefined}
        type={source || mixed ? "text" : "number"}
        min={0}
        step="any"
        readOnly={source}
        decode={(value) => decodePadding(value, mixed)}
        prepare={props.prepare}
        preview={actions.preview}
        cancel={() => props.preview(null)}
        commit={actions.commit}
      />
      {actions.error && <p role="alert">{actions.error}</p>}
    </>
  );
}

function usePaddingActions(props: Props & { sides: [Side, ...Side[]] }) {
  const [error, setError] = useState<string | null>(null);
  const change = (value: string) => {
    flushSync(() => props.preview(null));
    const mutation = paddingChange(props.node.id, props.sides, value);
    mutation.mutations.push(...prepareFillSharing(props.document)(mutation.mutations));
    return mutation;
  };
  const fail = (cause: unknown) => {
    props.preview(null);
    setError(cause instanceof Error ? cause.message : "The padding change failed.");
  };
  return {
    error,
    preview: (value: string) => {
      setError(null);
      try {
        props.preview(value ? change(value) : null);
      } catch (cause) {
        fail(cause);
      }
    },
    commit: async (value: string) => {
      setError(null);
      try {
        return await props.mutate(change(value));
      } catch (cause) {
        fail(cause);
        return false;
      }
    },
  };
}

function decodePadding(value: string, mixed: boolean) {
  value = value.trim();
  if (mixed && !value) return "";
  const number = Number(value);
  if (!value || !Number.isFinite(number) || number < 0) return null;
  const css = `${number}px`;
  return CSS.supports("padding-top", css) ? css : null;
}

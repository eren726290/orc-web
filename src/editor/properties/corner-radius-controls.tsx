import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { cornerRadiusChange, readCornerRadius } from "./corner-radius";
import { PropertyField } from "./property-field";
import type { PropertyPreview } from "./property-preview";
import "./corner-radius-controls.css";

type Props = {
  document: DesignDocument;
  node: DesignNode;
  prepare: () => boolean | Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
  preview: (value: PropertyPreview) => void;
};

export function CornerRadiusControls(props: Props) {
  const corners = readCornerRadius(props.node);
  return (
    <div className="corner-radius-controls">
      <RadiusField {...props} label="Corner radius" corners={corners} />
      <details>
        <summary>Individual corners</summary>
        <div className="field-grid">
          {corners.map((corner) => (
            <RadiusField key={corner.property} {...props} label={corner.label} corners={[corner]} />
          ))}
        </div>
      </details>
      {corners.some((corner) => corner.value === null) && (
        <p>Some corners are controlled by source. Edit those values in Code.</p>
      )}
    </div>
  );
}

function RadiusField(
  props: Props & { label: string; corners: ReturnType<typeof readCornerRadius> },
) {
  const source = props.corners.some((corner) => corner.value === null);
  const mixed = !source && props.corners.some((corner) => corner.value !== props.corners[0].value);
  const value = source ? "Edit source" : mixed ? "" : String(props.corners[0].value);
  const change = (value: string) => cornerRadiusChange(props.node.id, props.corners, value);
  return (
    <PropertyField
      label={props.label}
      value={value}
      placeholder={mixed ? "Mixed" : undefined}
      type={source || mixed ? "text" : "number"}
      readOnly={source}
      min={0}
      step="any"
      adjustment={
        mixed
          ? undefined
          : {
              owner: `${props.document.id}/${props.document.revision}/${props.node.id}`,
              axis: "x",
              scale: 1,
            }
      }
      decode={(value) => decodeRadius(value, mixed)}
      prepare={props.prepare}
      preview={(value) => props.preview(value ? change(value) : null)}
      cancel={() => props.preview(null)}
      commit={(value) => props.mutate(change(value))}
    />
  );
}

function decodeRadius(value: string, mixed: boolean) {
  value = value.trim();
  if (mixed && !value) return "";
  const number = Number(value);
  if (!value || !Number.isFinite(number) || number < 0) return null;
  return CSS.supports("border-radius", `${number}px`) ? `${number}px` : null;
}

import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { readFrameLayout } from "../layout/frame-layout";
import { gapChange, readGap } from "../layout/gap";
import { PropertyField } from "./property-field";
import type { PropertyPreview } from "./property-preview";
import "./gap-controls.css";

type Props = {
  document: DesignDocument;
  node: DesignNode;
  prepare: () => boolean | Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
  preview: (value: PropertyPreview) => void;
};

export function FrameGapControls(props: Props) {
  if (props.node.kind !== "frame" || !["Row", "Column"].includes(readFrameLayout(props.node) ?? ""))
    return null;
  const gap = readGap(props.node);
  return (
    <div className="gap-controls">
      <GapField {...props} label="Gap" />
      <p>
        {gap.value === null
          ? "Gap controlled by source. Edit in Code."
          : "Drag the value or a canvas gap. Arrows adjust by 1; Shift by 8."}
      </p>
    </div>
  );
}

export function GapField(
  props: Props & { label: string; axis?: "x" | "y"; scale?: number; disabled?: boolean },
) {
  const gap = readGap(props.node);
  const change = (value: string) => gapChange(props.node.id, gap.priority, Number(value));
  return (
    <PropertyField
      label={props.label}
      value={gap.value === null ? "Edit source" : String(gap.value)}
      type={gap.value === null ? "text" : "number"}
      min={0}
      step="any"
      readOnly={gap.value === null || props.disabled}
      adjustment={{
        owner: `${props.document.id}/${props.document.revision}/${props.node.id}`,
        axis: props.axis ?? "x",
        scale: props.scale ?? 1,
      }}
      decode={(value) =>
        value.trim() &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0 &&
        CSS.supports("gap", `${Number(value)}px`)
          ? String(Number(value))
          : null
      }
      prepare={props.prepare}
      preview={(value) => props.preview(change(value))}
      cancel={() => props.preview(null)}
      commit={(value) => props.mutate(change(value))}
    />
  );
}

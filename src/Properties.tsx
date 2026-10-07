import { isLocked, textContent, type DesignDocument, type DesignNode } from "../shared/model";
import type { Mutation } from "../shared/commands";
import { replaceText } from "./text-runs";
import { PropertyField } from "./property-field";
import type { PropertyPreview } from "./property-preview";

type Props = {
  document: DesignDocument;
  selected: string[];
  mutate: (mutation: Mutation) => Promise<boolean>;
  disabled: boolean;
  prepare: () => boolean | Promise<boolean>;
  preview: (value: PropertyPreview) => void;
};
type EditProps = Pick<Props, "mutate" | "prepare" | "preview"> & { node: DesignNode };

export function Properties(props: Props) {
  const node = props.selected.length === 1 ? props.document.nodes[props.selected[0]] : null;
  if (!node) return <EmptyProperties count={props.selected.length} />;
  const editing = { node, mutate: props.mutate, prepare: props.prepare, preview: props.preview };
  return (
    <aside className="properties-panel">
      <div className="property-title">
        <strong>{node.name}</strong>
        <span>{node.kind}</span>
      </div>
      <fieldset disabled={props.disabled || isLocked(props.document, node.id)}>
        <section className="property-section">
          <h2>Layout</h2>
          <NodeLayout {...editing} />
        </section>
        {node.kind === "text" && (
          <section className="property-section">
            <h2>Text</h2>
            <TextContent {...editing} />
          </section>
        )}
        <section className="property-section">
          <h2>Appearance</h2>
          <NodeAppearance {...editing} />
        </section>
      </fieldset>
      {isLocked(props.document, node.id) && (
        <p className="panel-empty">Unlock this object or its parent to edit.</p>
      )}
    </aside>
  );
}

function EmptyProperties({ count }: { count: number }) {
  return (
    <aside className="properties-panel">
      <div className="panel-heading">Properties</div>
      <p className="panel-empty">
        {count > 1
          ? `${count} objects selected. Select one object to edit its properties.`
          : "Select an object to edit its properties."}
      </p>
    </aside>
  );
}

function NodeLayout(props: EditProps) {
  const change = (name: string): Extract<Mutation, { kind: "rename" }> => ({
    kind: "rename",
    id: props.node.id,
    name,
  });
  return (
    <>
      <PropertyField
        label="Name"
        value={props.node.name}
        decode={(value) => value.trim() || props.node.name}
        prepare={props.prepare}
        preview={(value) => props.preview(change(value))}
        cancel={() => props.preview(null)}
        commit={(value) => props.mutate(change(value))}
      />
      <div className="field-grid">
        <StyleField {...props} property="left" label="X" fallback="0px" numeric="px" />
        <StyleField {...props} property="top" label="Y" fallback="0px" numeric="px" />
        <StyleField
          {...props}
          property="width"
          label="Width"
          fallback="auto"
          numeric="px"
          min={0}
        />
        <StyleField
          {...props}
          property="height"
          label="Height"
          fallback="auto"
          numeric="px"
          min={0}
        />
      </div>
    </>
  );
}

function TextContent(props: EditProps) {
  const change = (value: string): Extract<Mutation, { kind: "text" }> => ({
    kind: "text",
    id: props.node.id,
    runs: props.node.kind === "text" ? replaceText(props.node.runs, value) : [],
  });
  return (
    <PropertyField
      label="Content"
      value={textContent(props.node)}
      multiline
      decode={(value) => value}
      prepare={props.prepare}
      preview={(value) => props.preview(change(value))}
      cancel={() => props.preview(null)}
      commit={(value) => props.mutate(change(value))}
    />
  );
}

function NodeAppearance(props: EditProps) {
  return (
    <>
      <StyleField {...props} property="background-color" label="Fill" fallback="transparent" />
      <StyleField
        {...props}
        property="border-radius"
        label="Corner radius"
        fallback="0px"
        numeric="px"
        min={0}
      />
      <StyleField
        {...props}
        property="opacity"
        label="Opacity"
        fallback="1"
        numeric="number"
        min={0}
        max={1}
      />
    </>
  );
}

type StyleProps = EditProps & {
  property: string;
  label: string;
  fallback: string;
  numeric?: "px" | "number";
  min?: number;
  max?: number;
};

function StyleField(props: StyleProps) {
  const authored = props.node.style[props.property] ?? props.fallback;
  const fixed = /^-?\d+(?:\.\d+)?px$/u.test(authored);
  const readOnly = props.numeric === "px" && !fixed;
  const fit = ["auto", "max-content", "fit-content"].includes(authored);
  const value =
    fixed && props.numeric === "px"
      ? String(parseFloat(authored))
      : readOnly && fit
        ? "Fit"
        : authored;
  const change = (value: string): Extract<Mutation, { kind: "style" }> => ({
    kind: "style",
    id: props.node.id,
    values: { [props.property]: value },
  });
  return (
    <PropertyField
      label={props.label}
      value={value}
      readOnly={readOnly}
      type={props.numeric && !readOnly ? "number" : "text"}
      min={props.min}
      max={props.max}
      step={props.numeric === "number" ? 0.01 : "any"}
      decode={(value) => decodeStyle(value, props)}
      prepare={props.prepare}
      preview={(value) => props.preview(change(value))}
      cancel={() => props.preview(null)}
      commit={(value) => props.mutate(change(value))}
    />
  );
}

function decodeStyle(value: string, props: StyleProps): string | null {
  if (props.numeric) {
    const number = Number(value);
    if (!value.trim() || !Number.isFinite(number)) return null;
    if (props.min !== undefined && number < props.min) return null;
    if (props.max !== undefined && number > props.max) return null;
    const result = `${number}${props.numeric === "px" ? "px" : ""}`;
    return CSS.supports(props.property, result) ? result : null;
  }
  return value.trim() && CSS.supports(props.property, value.trim()) ? value.trim() : null;
}

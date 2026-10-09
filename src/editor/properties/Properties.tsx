import {
  isLocked,
  textContent,
  type DesignDocument,
  type DesignNode,
} from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { replaceText } from "../rendering/text-runs";
import { PropertyField } from "./property-field";
import type { PropertyPreview } from "./property-preview";
import { useLayoutOwnership } from "./use-layout-ownership";

type Props = {
  document: DesignDocument;
  selected: string[];
  mutate: (mutation: Mutation) => Promise<boolean>;
  disabled: boolean;
  prepare: () => boolean | Promise<boolean>;
  preview: (value: PropertyPreview) => void;
  select: (id: string) => Promise<boolean>;
};
type EditProps = Pick<Props, "mutate" | "prepare" | "preview"> & {
  node: DesignNode;
  ownership: ReturnType<typeof useLayoutOwnership>;
};

export function Properties(props: Props) {
  const node = props.selected.length === 1 ? props.document.nodes[props.selected[0]] : null;
  const ownership = useLayoutOwnership(props.document, node?.id);
  if (!node) return <EmptyProperties count={props.selected.length} />;
  const editing = {
    node,
    ownership,
    mutate: props.mutate,
    prepare: props.prepare,
    preview: props.preview,
  };
  return (
    <aside className="properties-panel">
      <div className="property-title">
        <strong>{node.name}</strong>
        <span>{node.kind}</span>
      </div>
      <PropertySections
        key={node.id}
        {...editing}
        disabled={props.disabled || isLocked(props.document, node.id)}
        select={props.select}
      />
      {isLocked(props.document, node.id) && (
        <p className="panel-empty">Unlock this object or its parent to edit.</p>
      )}
    </aside>
  );
}

function PropertySections(props: EditProps & Pick<Props, "disabled" | "select">) {
  return (
    <>
      <section className="property-section">
        <h2>Layout</h2>
        <fieldset disabled={props.disabled}>
          <NodeLayout {...props} />
          <FrameClipping {...props} />
        </fieldset>
        {props.ownership.position && (
          <PositionOwner position={props.ownership.position} select={props.select} />
        )}
      </section>
      <fieldset disabled={props.disabled}>
        {props.node.kind === "text" && (
          <section className="property-section">
            <h2>Text</h2>
            <TextContent {...props} />
          </section>
        )}
        <section className="property-section">
          <h2>Appearance</h2>
          <NodeAppearance {...props} />
        </section>
      </fieldset>
    </>
  );
}

function PositionOwner({
  position,
  select,
}: {
  position: NonNullable<EditProps["ownership"]["position"]>;
  select: Props["select"];
}) {
  return (
    <div className="position-owner">
      <p>Position controlled by {position.name}</p>
      <button type="button" onClick={() => void select(position.id)}>
        Select parent
      </button>
    </div>
  );
}

function FrameClipping(props: EditProps) {
  if (props.node.kind !== "frame") return null;
  return (
    <label className="checkbox-field">
      <input
        type="checkbox"
        checked={props.node.clipContent}
        onChange={(event) =>
          void props.mutate({
            kind: "clip",
            id: props.node.id,
            clipContent: event.currentTarget.checked,
          })
        }
      />
      Clip content
    </label>
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
      <BackgroundField {...props} />
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

function BackgroundField(props: EditProps) {
  const style = document.createElement("div").style;
  style.cssText = Object.entries(props.node.style)
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
  const color = style.getPropertyValue("background-color");
  const unresolved = !color && Boolean(props.node.style.background);
  const priority = style.getPropertyPriority("background-color");
  const change = (value: string) => backgroundChange(props.node.id, value, priority);
  return (
    <PropertyField
      label="Fill"
      value={unresolved ? "Edit source" : color || "transparent"}
      readOnly={unresolved}
      decode={(value) => (CSS.supports("background-color", value.trim()) ? value.trim() : null)}
      prepare={props.prepare}
      preview={(value) => props.preview(change(value))}
      cancel={() => props.preview(null)}
      commit={(value) => props.mutate(change(value))}
    />
  );
}

function backgroundChange(
  id: string,
  value: string,
  priority: string,
): Extract<PropertyPreview, { kind: "batch" }> {
  return {
    kind: "batch",
    mutations: [
      { kind: "style", id, values: {}, unset: ["background-color"] },
      {
        kind: "style",
        id,
        values: { "background-color": value + (priority ? " !important" : "") },
      },
    ],
  };
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
  const { value, readOnly } = styleFieldValue(props);
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

function styleFieldValue(props: StyleProps) {
  if ((props.property === "left" || props.property === "top") && props.ownership.position)
    return { value: props.ownership.position[props.property], readOnly: true };
  const authored = props.node.style[props.property] ?? props.fallback;
  const fixed = /^-?\d+(?:\.\d+)?px$/u.test(authored);
  const owner =
    props.property === "width" || props.property === "height"
      ? props.ownership[props.property]
      : null;
  const readOnly = Boolean(owner) || (props.numeric === "px" && !fixed);
  const value = owner ?? styleFieldDisplay(authored, props.numeric, readOnly);
  return { value, readOnly };
}

function styleFieldDisplay(authored: string, numeric: StyleProps["numeric"], readOnly: boolean) {
  if (numeric === "px" && !readOnly) return String(parseFloat(authored));
  const fit = ["auto", "max-content", "fit-content"].includes(authored);
  return readOnly && fit ? "Fit" : authored;
}

function decodeStyle(value: string, props: StyleProps): string | null {
  value = value.trim();
  if (props.numeric) {
    const number = Number(value);
    if (
      !value ||
      !Number.isFinite(number) ||
      number < (props.min ?? -Infinity) ||
      number > (props.max ?? Infinity)
    )
      return null;
    value = `${number}${props.numeric === "px" ? "px" : ""}`;
  }
  return CSS.supports(props.property, value) ? value : null;
}

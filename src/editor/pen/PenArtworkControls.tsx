import { useRef, useState } from "react";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { PropertyField } from "../properties/property-field";
import type { PropertyPreview } from "../properties/property-preview";
import { penNodeWrite, reboxPenNode, type PenNode } from "./node";
import { penReboxing } from "./reboxing";
import { preparePenPreview } from "./preview";
import { penRotation, penScale, rotatePenNode, scalePenNode } from "./transforms";

type Props = {
  document: DesignDocument;
  node: DesignNode;
  prepare: () => boolean | Promise<boolean>;
  preview: (value: PropertyPreview) => void;
  mutate: (mutation: Mutation) => Promise<boolean>;
};
type FieldProps = Omit<Props, "node"> & {
  node: PenNode;
  property: "fill" | "stroke" | "stroke-width" | "scale" | "rotation";
  label: string;
};

export function PenArtworkControls(props: Props) {
  if (props.node.kind !== "svg" || !props.node.pen) return null;
  const node = { ...props.node, pen: props.node.pen };
  return (
    <>
      <ArtworkField {...props} node={node} property="fill" label="Fill" />
      <ArtworkField {...props} node={node} property="stroke" label="Stroke" />
      <ArtworkField {...props} node={node} property="stroke-width" label="Stroke width" />
      <ArtworkField {...props} node={node} property="scale" label="Scale (%)" />
      <ArtworkField {...props} node={node} property="rotation" label="Rotation" />
    </>
  );
}

function ArtworkField(props: FieldProps) {
  const field = useArtworkField(props);
  const value = fieldValue(props);
  const overridden = value === "Edit source";
  const closed = props.property !== "fill" || props.node.pen.closed;
  const readOnly = overridden || !closed;
  return (
    <>
      <PropertyField
        label={props.label}
        value={value}
        readOnly={readOnly}
        type={
          ["stroke-width", "scale", "rotation"].includes(props.property) && !readOnly
            ? "number"
            : "text"
        }
        min={props.property === "rotation" ? undefined : 0}
        adjustment={
          props.property === "scale" || props.property === "rotation"
            ? {
                owner: `${props.document.id}/${props.document.revision}/${props.node.id}/${props.property}`,
                axis: "x",
                scale: 1,
              }
            : undefined
        }
        step="any"
        prepare={props.prepare}
        preview={field.preview}
        cancel={field.cancel}
        commit={field.commit}
        decode={(value) => decode(props.property, value)}
      />
      {!closed && <small>Close the path to fill it.</small>}
      {field.error && <p role="alert">{field.error}</p>}
    </>
  );
}

function fieldValue(props: FieldProps): string {
  try {
    if (props.property === "scale") return String(penScale(props.node) * 100);
    if (props.property === "rotation") return String(penRotation(props.node) ?? "Edit source");
    return Object.hasOwn(props.node.style, props.property)
      ? "Edit source"
      : (props.node.attributes[props.property] ?? "none");
  } catch {
    return "Edit source";
  }
}

function useArtworkField(props: FieldProps) {
  const [error, setError] = useState<string | null>(null);
  const context = useRef<ReturnType<typeof artworkContext> | null>(null);
  const change = (value: string) => {
    context.current ??= artworkContext(props);
    return context.current.change(value);
  };
  const cancel = () => {
    context.current = null;
    props.preview(null);
  };
  return {
    error,
    cancel,
    preview(value: string) {
      try {
        setError(null);
        const node = change(value);
        context.current?.prepare([penNodeWrite(node)]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The artwork change failed.");
      }
    },
    async commit(value: string) {
      try {
        if (!(await props.prepare())) return false;
        return await props.mutate(penNodeWrite(change(value)));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The artwork change failed.");
        return false;
      } finally {
        cancel();
      }
    },
  };
}

function artworkContext(props: FieldProps) {
  const canvas = document.querySelector(".canvas");
  if (!(canvas instanceof HTMLElement)) throw new Error("The canvas is unavailable.");
  let rebox: ReturnType<typeof penReboxing> | null = null;
  const prepare = preparePenPreview(props.document, props.preview);
  return {
    prepare,
    change(value: string) {
      if (props.property === "rotation") return rotatePenNode(props.node, Number(value));
      rebox ??= props.property === "fill" ? null : penReboxing(props.node, canvas);
      if (props.property === "scale" && rebox)
        return scalePenNode(props.node, Number(value) / 100, rebox);
      const node = {
        ...props.node,
        attributes: { ...props.node.attributes, [props.property]: value },
      };
      return !rebox ? node : reboxPenNode(node, node.pen, rebox);
    },
  };
}

function decode(property: string, value: string): string | null {
  value = value.trim();
  if (!["stroke-width", "scale", "rotation"].includes(property))
    return value === "none" || CSS.supports("color", value) ? value : null;
  const number = Number(value);
  return value &&
    Number.isFinite(number) &&
    (property === "rotation" || number >= 0) &&
    Math.abs(number) < 1e9
    ? String(number)
    : null;
}

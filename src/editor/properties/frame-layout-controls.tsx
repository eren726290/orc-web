import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowRightLeft, ArrowUpDown, Move } from "lucide-react";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import {
  prepareFrameLayout,
  prepareRowWrapping,
  readFrameLayout,
  readRowWrapping,
  type FrameLayout,
} from "../layout/frame-layout";
import "./layout-controls.css";
import type { PropertyPreview } from "./property-preview";

type Props = {
  document: DesignDocument;
  node: DesignNode;
  prepare: () => boolean | Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
  preview: (value: PropertyPreview) => void;
};
const layouts = [
  ["Free", Move],
  ["Row", ArrowRightLeft],
  ["Column", ArrowUpDown],
] as const;

export function FrameLayoutControls(props: Props) {
  const { current, error, pending, change, wrapping } = useFrameLayoutChange(props);
  if (props.node.kind !== "frame") return null;
  return (
    <div className="layout-controls">
      <fieldset aria-label="Frame layout" disabled={pending}>
        {layouts.map(([mode, Icon]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={mode === current}
            onClick={() => void change(mode)}
          >
            <Icon aria-hidden="true" />
            {mode}
          </button>
        ))}
      </fieldset>
      <p>
        {current === "Row"
          ? "Arrange children horizontally."
          : current === "Column"
            ? "Arrange children vertically."
            : current === "Free"
              ? "Place children freely."
              : "Layout controlled by source."}
      </p>
      {current === "Row" && <RowWrapping value={wrapping} pending={pending} change={change} />}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function RowWrapping(props: {
  value: boolean | null;
  pending: boolean;
  change: (value: boolean) => Promise<void>;
}) {
  if (props.value === null) return <p>Wrapping controlled by source. Edit in Code.</p>;
  return (
    <>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={props.value}
          disabled={props.pending}
          onChange={(event) => void props.change(event.currentTarget.checked)}
        />
        Wrap to next line
      </label>
      <p>Fixed cards keep their widths. Fill shares space within each row.</p>
    </>
  );
}

function useFrameLayoutChange(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<FrameLayout | boolean | null>(null);
  const pending = action !== null;
  const rememberFocus = useLayoutFocus(pending, props.node.id);
  const current = readFrameLayout(props.node);
  const wrapping = typeof action === "boolean" ? action : readRowWrapping(props.node);
  const change = async (mode: FrameLayout | boolean) => {
    if (mode === current || pending) return;
    rememberFocus();
    setError(null);
    setAction(mode);
    try {
      if (!(await props.prepare())) return;
      const candidate =
        typeof mode === "boolean"
          ? prepareRowWrapping(props.document, props.node.id, mode)
          : prepareFrameLayout(props.document, props.node.id, mode);
      if (!candidate) return;
      flushSync(() => props.preview(candidate.mutation));
      candidate.validate();
      await props.mutate(candidate.mutation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The layout change failed.");
    } finally {
      props.preview(null);
      setAction(null);
    }
  };
  return { current, error, pending, change, wrapping };
}

export function useLayoutFocus(pending: boolean, id: string) {
  const focused = useRef<{
    id: string;
    button: HTMLButtonElement | HTMLInputElement | HTMLSelectElement;
  } | null>(null);
  useLayoutEffect(() => {
    const saved = focused.current;
    if (pending || !saved || saved.id !== id) return;
    if (
      saved.button.isConnected &&
      !saved.button.matches(":disabled") &&
      document.activeElement === document.body
    )
      saved.button.focus();
  }, [pending, id]);
  return () => {
    const button = document.activeElement;
    focused.current =
      button instanceof HTMLButtonElement ||
      button instanceof HTMLInputElement ||
      button instanceof HTMLSelectElement
        ? { id, button }
        : null;
  };
}

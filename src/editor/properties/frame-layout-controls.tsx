import { useState } from "react";
import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import type { Mutation } from "../../../shared/commands/commands";
import { prepareFrameLayout, readFrameLayout, type FrameLayout } from "../layout/frame-layout";
import "./layout-controls.css";

type Props = {
  document: DesignDocument;
  node: DesignNode;
  prepare: () => boolean | Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
};

export function FrameLayoutControls(props: Props) {
  const { current, error, pending, change } = useFrameLayoutChange(props);
  if (props.node.kind !== "frame") return null;
  return (
    <div className="layout-controls">
      <fieldset aria-label="Frame layout" disabled={pending}>
        {(["Free", "Row", "Column"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={mode === current}
            onClick={() => void change(mode)}
          >
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
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function useFrameLayoutChange(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const current = readFrameLayout(props.node);
  const change = async (mode: FrameLayout) => {
    if (mode === current || pending) return;
    setError(null);
    setPending(true);
    try {
      if (!(await props.prepare())) return;
      const mutation = prepareFrameLayout(props.document, props.node.id, mode);
      if (mutation) await props.mutate(mutation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The layout change failed.");
    } finally {
      setPending(false);
    }
  };
  return { current, error, pending, change };
}

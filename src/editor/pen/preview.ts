import { flushSync } from "react-dom";
import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument } from "../../../shared/document/model";
import { penCandidate, type PenWrite } from "../../../shared/pen/candidate";
import { prepareFillSharing } from "../layout/fill-sharing";
import { prepareFillDependencies } from "../layout/sizing";
import type { PropertyPreview } from "../properties/property-preview";

export function preparePenPreview(
  document: DesignDocument,
  show: (value: PropertyPreview) => void,
  validate?: (candidate: DesignDocument) => void,
) {
  const checkDependencies = prepareFillDependencies(document);
  const sharing = prepareFillSharing(document);
  let accepted: DesignDocument | null = null;
  const render = (candidate: DesignDocument) =>
    flushSync(() => show({ kind: "pen-preview", candidate }));
  return (edits: PenWrite[]): Mutation => {
    try {
      const initial = penCandidate(document, edits);
      render(initial);
      const dependent = sharing(edits);
      const complete = [...edits, ...dependent];
      const candidate = dependent.length ? penCandidate(document, complete) : initial;
      if (candidate !== initial) render(candidate);
      checkDependencies(candidate);
      validateNativePen(candidate, edits);
      validate?.(candidate);
      accepted = candidate;
      return complete.length === 1 ? complete[0] : { kind: "batch", mutations: complete };
    } catch (error) {
      flushSync(() => show(accepted ? { kind: "pen-preview", candidate: accepted } : null));
      throw error;
    }
  };
}

function validateNativePen(document: DesignDocument, edits: PenWrite[]): void {
  const ids = edits.flatMap((edit) =>
    edit.kind === "insert" ? edit.nodes.map((node) => node.id) : [edit.id],
  );
  for (const id of ids) {
    const node = document.nodes[id];
    if (node?.kind !== "svg" || !node.pen) continue;
    const element = window.document.querySelector(
      `.canvas-world [data-orc-id="${CSS.escape(id)}"]`,
    );
    if (
      !(element instanceof SVGSVGElement) ||
      element.getAttribute("viewBox") !== node.attributes.viewBox
    )
      throw new Error("The pen candidate's native SVG is unavailable.");
    validateNativeDimensions(element, node.style);
  }
}

function validateNativeDimensions(element: SVGSVGElement, style: Record<string, string>) {
  for (const axis of ["width", "height"]) {
    const size = Number.parseFloat(getComputedStyle(element).getPropertyValue(axis));
    if (
      !Number.isFinite(size) ||
      size <= 0 ||
      Math.abs(size - Number.parseFloat(style[axis])) > 0.1
    )
      throw new Error("Choose supported Fixed sizing before editing this pen path.");
  }
}

export function penWrites(mutation: Mutation): PenWrite[] {
  const edits = mutation.kind === "batch" ? mutation.mutations : [mutation];
  return edits.map((edit) => {
    if (edit.kind !== "pen" && edit.kind !== "insert" && edit.kind !== "style")
      throw new Error("A pen transaction contains an unsupported edit.");
    return edit;
  });
}

export function isPenMutation(mutation: Mutation): boolean {
  if (mutation.kind === "batch") return mutation.mutations.some(isPenMutation);
  return (
    mutation.kind === "pen" ||
    (mutation.kind === "insert" &&
      mutation.nodes.some((node) => node.kind === "svg" && node.pen !== undefined))
  );
}

import { deletePenAnchor } from "../../../shared/pen/deletion";
import { isLocked } from "../../../shared/document/model";
import { selectedPen } from "./drag";
import { penNodeWrite, reboxPenNode, type PenNode } from "./node";
import { penReboxing } from "./reboxing";
import type { PenProps, PenState } from "./types";

export async function deleteSelectedAnchor(props: PenProps, state: PenState) {
  const node = selectedPen(props);
  const selected = state.selectedAnchor;
  if (!node || !selected || selected.nodeId !== node.id) return;
  try {
    if (props.disabled || isLocked(props.appliedDocument, node.id))
      throw new Error("Unlock this path before deleting anchors.");
    if (!(await props.beforeEdit())) return;
    const mutation = deletion(props, node, selected.anchor);
    if (await props.mutate(mutation)) state.selectedAnchor = null;
  } catch (error) {
    props.notice(error instanceof Error ? error.message : "This anchor cannot be deleted.");
  }
}

function deletion(props: PenProps, node: PenNode, anchor: string) {
  const path = deletePenAnchor(node.pen, anchor);
  if (!path) return { kind: "delete" as const, ids: [node.id] };
  const canvas = props.canvas.current;
  if (!canvas) throw new Error("The canvas is unavailable.");
  return penNodeWrite(reboxPenNode(node, path, penReboxing(node, canvas)));
}

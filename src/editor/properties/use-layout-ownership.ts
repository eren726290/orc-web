import { useLayoutEffect, useState } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import { observeOverlayGeometry } from "../canvas/overlay-geometry";
import { readSizingOwners } from "../layout/sizing";
import { readPositionOwner, readConstraintPosition } from "../layout/position";

const empty = { width: null, height: null, position: null, constraintPosition: null };

export function useLayoutOwnership(
  document: DesignDocument,
  id: string | undefined,
  active: boolean,
) {
  const [snapshot, setSnapshot] = useState<{
    id: string | undefined;
    owners: ReturnType<typeof readOwnership>;
  }>({ id: undefined, owners: empty });
  useLayoutEffect(() => {
    if (!active || !id) return;
    const canvas = window.document.querySelector<HTMLDivElement>(".canvas");
    return observeOverlayGeometry(canvas, [id], () =>
      setSnapshot({ id, owners: readOwnership(document, id) }),
    );
  }, [document, id, active]);
  return snapshot.id === id ? snapshot.owners : empty;
}

function readOwnership(document: DesignDocument, id: string | undefined) {
  const element = id
    ? window.document.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`)
    : null;
  const node = id ? document.nodes[id] : null;
  if (!node || !(element instanceof HTMLElement || element instanceof SVGElement)) return empty;
  const parent = node.parentId ? document.nodes[node.parentId] : undefined;
  return {
    ...readSizingOwners(node, element, parent),
    position: readPositionOwner(element, parent),
    constraintPosition: readConstraintPosition(document, node, element),
  };
}

import { useLayoutEffect, useState } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import { readSizingOwners } from "../layout/sizing";

const empty = { width: null, height: null };

export function useSizingOwners(document: DesignDocument, id: string | undefined) {
  const [owners, setOwners] = useState<ReturnType<typeof readSizingOwners>>(empty);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      const node = id ? document.nodes[id] : null;
      const element = id
        ? window.document.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`)
        : null;
      const parent = node?.parentId ? document.nodes[node.parentId] : undefined;
      setOwners(
        node && (element instanceof HTMLElement || element instanceof SVGElement)
          ? readSizingOwners(node, element, parent)
          : empty,
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [document, id]);
  return owners;
}

import { useLayoutEffect, useState } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import { readSizingOwners } from "../layout/sizing";
import { readPositionOwner } from "../layout/position";

const empty = { width: null, height: null, position: null };

export function useLayoutOwnership(document: DesignDocument, id: string | undefined) {
  const [snapshot, setSnapshot] = useState<{
    id: string | undefined;
    owners: ReturnType<typeof readOwnership>;
  }>({ id: undefined, owners: empty });
  useLayoutEffect(() => {
    const element = id
      ? window.document.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`)
      : null;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        setSnapshot({ id, owners: readOwnership(document, id, element) }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    if (element?.parentElement) {
      observer.observe(element.parentElement);
      for (const sibling of element.parentElement.children) observer.observe(sibling);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [document, id]);
  return snapshot.id === id ? snapshot.owners : empty;
}

function readOwnership(document: DesignDocument, id: string | undefined, element: Element | null) {
  const node = id ? document.nodes[id] : null;
  if (!node || !(element instanceof HTMLElement || element instanceof SVGElement)) return empty;
  const parent = node.parentId ? document.nodes[node.parentId] : undefined;
  return {
    ...readSizingOwners(node, element, parent),
    position: readPositionOwner(element, parent),
  };
}

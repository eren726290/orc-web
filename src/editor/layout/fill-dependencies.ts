import { containsNode, type DesignDocument } from "../../../shared/document/model";

type Axis = "width" | "height";
type Readout = { fill: boolean; supplied: boolean; exit: boolean } | null;
type Inspect = (document: DesignDocument, id: string, axis: Axis) => Readout;

export function captureFillDependencies(document: DesignDocument, inspect: Inspect) {
  const dependencies = Object.values(document.nodes).flatMap((node) =>
    (["width", "height"] as const).flatMap((axis) => {
      const current = inspect(document, node.id, axis);
      return current?.fill && current.supplied
        ? [{ id: node.id, axis, value: node.style[axis] }]
        : [];
    }),
  );
  return (candidate: DesignDocument) => {
    for (const { id, axis, value } of dependencies) {
      const node = candidate.nodes[id];
      if (!node) continue;
      const current = inspect(candidate, id, axis);
      const converted = node.style[axis] !== value && current?.exit;
      if (converted || (current?.fill && current.supplied)) continue;
      throw new Error(fillDependencyMessage(current, axis));
    }
  };
}

function fillDependencyMessage(current: Readout, axis: Axis) {
  if (current && !current.fill)
    return `This change would remove ${axis === "width" ? "Width" : "Height"} Fill. Change the object's sizing first.`;
  return `Set the parent's ${axis} first.`;
}

export function deletionCandidate(document: DesignDocument, ids: string[]): DesignDocument {
  const remaining = Object.values(document.nodes).filter(
    (node) => !ids.some((id) => containsNode(document, id, node.id)),
  );
  const retained = new Set(remaining.map((node) => node.id));
  return {
    ...document,
    workspaceRootIds: document.workspaceRootIds.filter((id) => retained.has(id)),
    nodes: Object.fromEntries(
      remaining.map((node) => [
        node.id,
        {
          ...node,
          children: node.children.filter((id) => retained.has(id)),
        },
      ]),
    ),
  };
}

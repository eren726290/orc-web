import { isLocked, type DesignDocument } from "../shared/model";
import type { Mutation } from "../shared/commands";

export function applyMutation(
  document: DesignDocument,
  mutation: Exclude<Mutation, { kind: "source" }>,
): void {
  if (mutation.kind === "insert") return insertNodes(document, mutation.nodes);
  if (mutation.kind === "delete") return deleteNodes(document, mutation.ids);
  const node = document.nodes[mutation.id];
  if (!node) throw new Error("Object no longer exists.");
  const locking = mutation.kind === "lock";
  const lockedId = locking ? node.parentId : node.id;
  if (lockedId !== null && isLocked(document, lockedId))
    throw new Error("Unlock the object or its parent before editing.");
  updateNode(node, mutation);
}

function updateNode(
  node: DesignDocument["nodes"][string],
  mutation: Exclude<Mutation, { kind: "insert" | "delete" | "source" }>,
): void {
  switch (mutation.kind) {
    case "rename":
      if (mutation.name.trim()) node.name = mutation.name.trim();
      break;
    case "style":
      node.style = { ...node.style, ...mutation.values };
      break;
    case "text": {
      if (node.kind !== "text") throw new Error("This object has no editable text.");
      node.runs = structuredClone(mutation.runs);
      break;
    }
    case "lock":
      node.locked = mutation.locked;
      break;
  }
}

function insertNodes(document: DesignDocument, nodes: DesignDocument["nodes"][string][]): void {
  const incoming = new Set(nodes.map((node) => node.id));
  if (incoming.size !== nodes.length) throw new Error("Duplicate object identities.");
  for (const node of nodes) {
    if (document.nodes[node.id]) throw new Error("Object identity already exists.");
    if (node.parentId && !incoming.has(node.parentId) && isLocked(document, node.parentId)) {
      throw new Error("Unlock the parent before inserting.");
    }
    document.nodes[node.id] = structuredClone(node);
  }
  for (const node of nodes) {
    if (node.parentId === null) document.workspaceRootIds.push(node.id);
    else if (!incoming.has(node.parentId)) document.nodes[node.parentId].children.push(node.id);
  }
}

function deleteNodes(document: DesignDocument, ids: string[]): void {
  for (const id of ids)
    if (isLocked(document, id)) throw new Error("Unlock the object before deleting.");
  const remove = (id: string) => {
    const node = document.nodes[id];
    if (!node) return;
    node.children.forEach(remove);
    delete document.nodes[id];
  };
  for (const id of ids) {
    const node = document.nodes[id];
    if (!node) continue;
    const parent =
      node.parentId === null ? document.workspaceRootIds : document.nodes[node.parentId].children;
    parent.splice(parent.indexOf(id), 1);
    remove(id);
  }
}

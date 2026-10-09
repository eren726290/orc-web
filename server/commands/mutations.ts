import { containsNode, isLocked, type DesignDocument } from "../../shared/document/model";
import type { AtomicMutation, Mutation } from "../../shared/commands/commands";

export function applyMutation(
  document: DesignDocument,
  mutation: Exclude<Mutation, { kind: "source" }>,
): void {
  if (mutation.kind === "batch") {
    for (const edit of mutation.mutations) applyAtomicMutation(document, edit);
  } else applyAtomicMutation(document, mutation);
}

function applyAtomicMutation(document: DesignDocument, mutation: AtomicMutation): void {
  if (mutation.kind === "insert") return insertNodes(document, mutation.nodes);
  if (mutation.kind === "delete") return deleteNodes(document, mutation.ids);
  if (mutation.kind === "reorder") return reorderNode(document, mutation);
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
  mutation: Exclude<AtomicMutation, { kind: "insert" | "delete" | "reorder" }>,
): void {
  switch (mutation.kind) {
    case "rename":
      if (mutation.name.trim()) node.name = mutation.name.trim();
      break;
    case "style":
      updateStyle(node, mutation);
      break;
    case "text": {
      if (node.kind !== "text") throw new Error("This object has no editable text.");
      node.runs = structuredClone(mutation.runs);
      break;
    }
    case "lock":
      node.locked = mutation.locked;
      break;
    case "clip":
      if (node.kind !== "frame") throw new Error("Only a frame can clip its content.");
      node.clipContent = mutation.clipContent;
      break;
  }
}

function updateStyle(
  node: DesignDocument["nodes"][string],
  mutation: Extract<AtomicMutation, { kind: "style" }>,
): void {
  for (const property of mutation.unset ?? []) delete node.style[property];
  node.style = { ...node.style, ...mutation.values };
}

function reorderNode(
  document: DesignDocument,
  mutation: Extract<AtomicMutation, { kind: "reorder" }>,
): void {
  const node = document.nodes[mutation.id];
  if (!node) throw new Error("Object no longer exists.");
  const destination = siblings(document, mutation.parentId);
  if (isLocked(document, node.id))
    throw new Error("Unlock the object or its parent before editing.");
  if (mutation.parentId !== null && isLocked(document, mutation.parentId))
    throw new Error("Unlock the destination parent before moving.");
  if (mutation.parentId !== null && containsNode(document, node.id, mutation.parentId))
    throw new Error("An object cannot be moved into itself or its descendants.");
  const maximum = destination.length - (node.parentId === mutation.parentId ? 1 : 0);
  if (mutation.index > maximum) throw new Error("The destination index is out of range.");
  const current = siblings(document, node.parentId);
  current.splice(current.indexOf(node.id), 1);
  destination.splice(mutation.index, 0, node.id);
  node.parentId = mutation.parentId;
}

function siblings(document: DesignDocument, parentId: string | null): string[] {
  if (parentId === null) return document.workspaceRootIds;
  const parent = document.nodes[parentId];
  if (!parent) throw new Error("Object no longer exists.");
  const voidTags = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ];
  if (
    parent.kind !== "frame" &&
    (parent.kind !== "element" || voidTags.includes(parent.tag.toLowerCase()))
  )
    throw new Error("This object cannot contain ordinary children.");
  return parent.children;
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
    else {
      const parent = siblings(document, node.parentId);
      if (!incoming.has(node.parentId)) parent.push(node.id);
    }
  }
}

function deleteNodes(document: DesignDocument, ids: string[]): void {
  const checkLocks = (id: string) => {
    if (isLocked(document, id)) throw new Error("Unlock the object before deleting.");
    document.nodes[id].children.forEach(checkLocks);
  };
  ids.forEach(checkLocks);
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

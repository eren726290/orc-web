export type Styles = Record<string, string>;

export type TextRun = { text: string; style: Styles };

export type NodeBase = {
  id: string;
  name: string;
  parentId: string | null;
  children: string[];
  visible: boolean;
  locked: boolean;
  style: Styles;
  attributes: Record<string, string>;
};

export type DesignNode = NodeBase &
  (
    | { kind: "frame"; clipContent: boolean; mode: "inherit" | "light" | "dark" }
    | { kind: "element"; tag: string }
    | { kind: "text"; tag: string; runs: TextRun[] }
    | { kind: "image" }
    | { kind: "svg"; source: string }
  );

export type DesignDocument = {
  schemaVersion: 1;
  id: string;
  name: string;
  revision: number;
  workspaceRootIds: string[];
  nodes: Record<string, DesignNode>;
};

export type SaveStatus =
  | { kind: "not-saved" }
  | { kind: "saving"; revision: number }
  | { kind: "saved"; revision: number }
  | { kind: "failed"; message: string };

export type ProjectSnapshot = {
  document: DesignDocument;
  path: string | null;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
};

export type SessionSnapshot = {
  activeProjectId: string | null;
  projects: ProjectSnapshot[];
  recentPaths: string[];
};

export function emptyDocument(): DesignDocument {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: "Untitled",
    revision: 0,
    workspaceRootIds: [],
    nodes: {},
  };
}

export function isLocked(document: DesignDocument, id: string): boolean {
  const node = document.nodes[id];
  if (!node) throw new Error("Object no longer exists.");
  return node.locked || (node.parentId !== null && isLocked(document, node.parentId));
}

export function textContent(node: DesignNode): string {
  return node.kind === "text" ? node.runs.map((run) => run.text).join("") : "";
}

export function containsNode(
  document: DesignDocument,
  ancestorId: string,
  nodeId: string,
): boolean {
  let id: string | null = nodeId;
  while (id) {
    if (id === ancestorId) return true;
    id = document.nodes[id]?.parentId ?? null;
  }
  return false;
}

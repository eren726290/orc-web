import { parseNode } from "../shared/document";
import { withRenderPage } from "./rendering";
import { isLocked, type DesignDocument, type DesignNode } from "../shared/model";

let importer: Promise<string> | null = null;

async function importerModule(): Promise<string> {
  const result = await Bun.build({
    entrypoints: ["src/html-import.ts"],
    target: "browser",
    format: "esm",
  });
  if (!result.success || !result.outputs[0]) throw new Error("The HTML importer could not start.");
  return result.outputs[0].text();
}

async function prepareHTML(source: string) {
  importer ??= importerModule();
  const module = await importer;
  const value: unknown = await withRenderPage((page) =>
    page.evaluate(
      async ({ source, module }) => {
        const url = URL.createObjectURL(new Blob([module], { type: "text/javascript" }));
        try {
          const parser = await import(url);
          return parser.importHTML(source);
        } finally {
          URL.revokeObjectURL(url);
        }
      },
      { source, module },
    ),
  ).catch((failure: unknown) => {
    const message = failure instanceof Error ? failure.message : "HTML preparation failed.";
    throw new Error(message.split("\n")[0].replace(/^page\.evaluate: (?:Error: )?/u, ""));
  });
  if (!Array.isArray(value)) throw new Error("The HTML importer returned invalid content.");
  return value.map(parseNode);
}

export async function applySource(
  document: DesignDocument,
  id: string,
  source: string,
): Promise<void> {
  const previous = document.nodes[id];
  if (!previous) throw new Error("Object no longer exists.");
  const affected = descendants(document, id);
  assertUnlocked(document, affected);
  const nodes = await prepareHTML(source);
  const incoming = nodes[0];
  if (!incoming || !compatible(previous, incoming))
    throw new Error("Keep the selected root's element type when editing its source.");
  const root = previous.kind === "frame" ? frameRoot(previous, incoming) : incoming;
  nodes[0] = root;
  const generatedId = root.id;
  for (const node of nodes) if (node.parentId === generatedId) node.parentId = id;
  root.id = id;
  root.parentId = previous.parentId;
  root.locked = previous.locked;
  root.visible = previous.visible;
  for (const target of affected) delete document.nodes[target];
  for (const node of nodes) document.nodes[node.id] = node;
}

function assertUnlocked(document: DesignDocument, ids: string[]) {
  for (const id of ids)
    if (isLocked(document, id))
      throw new Error("Unlock the affected layer before applying source.");
}

function compatible(previous: DesignNode, incoming: DesignNode): boolean {
  if (previous.kind === "frame") {
    return incoming.kind === "element" && incoming.tag === "div";
  }
  if (previous.kind !== incoming.kind) return false;
  if (
    (previous.kind === "element" || previous.kind === "text") &&
    (incoming.kind === "element" || incoming.kind === "text")
  )
    return previous.tag === incoming.tag;
  return true;
}

function frameRoot(
  previous: Extract<DesignNode, { kind: "frame" }>,
  incoming: DesignNode,
): DesignNode {
  const style = { ...incoming.style };
  const overflow = style.overflow;
  if (overflow && !["hidden", "visible"].includes(overflow))
    throw new Error("A frame supports hidden or visible content clipping.");
  delete style.overflow;
  return {
    id: incoming.id,
    name: incoming.name,
    parentId: incoming.parentId,
    children: incoming.children,
    attributes: incoming.attributes,
    style,
    visible: incoming.visible,
    locked: incoming.locked,
    kind: "frame",
    clipContent: overflow ? overflow === "hidden" : previous.clipContent,
    mode: previous.mode,
  };
}

function descendants(document: DesignDocument, id: string): string[] {
  return [id, ...document.nodes[id].children.flatMap((child) => descendants(document, child))];
}

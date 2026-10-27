import type { DesignDocument } from "../../../shared/document/model";
import { mutationInput } from "../../session/useSession";
import type { PropertyPreview } from "../properties/property-preview";
import { penNodeWrite } from "./node";
import { preparePenPreview } from "./preview";

export async function applyPenSource(
  document: DesignDocument,
  id: string,
  source: string,
  act: (path: string, input: unknown) => Promise<boolean>,
  preview: (value: PropertyPreview) => void,
): Promise<boolean | null> {
  const previous = document.nodes[id];
  if (previous?.kind !== "svg" || !previous.pen) return null;
  const { importHTML, preparePenSource } = await import("../code/html-import");
  const nodes = await importHTML(source);
  const node = nodes[0] && preparePenSource(previous, nodes[0]);
  if (!node) return null;
  if (JSON.stringify(node) === JSON.stringify(previous)) return true;
  try {
    const mutation = preparePenPreview(document, preview)([penNodeWrite(node)]);
    return await act("/api/commands", mutationInput(document.id, document.revision, mutation));
  } finally {
    preview(null);
  }
}

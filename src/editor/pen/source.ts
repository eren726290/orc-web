import type { DesignNode, Styles } from "../../../shared/document/model";
import { compatiblePenSource } from "../../../shared/pen/source-compatibility";
import { penSVG, penStroke, validatePenArtwork } from "../../../shared/pen/artwork";
import { penViewport } from "../../../shared/pen/viewport";
import { penReboxing } from "./reboxing";
import { reboxPenNode, type PenNode } from "./node";

export function preparePenSource(previous: DesignNode, incoming: DesignNode): PenNode | null {
  if (
    previous.kind !== "svg" ||
    !previous.pen ||
    incoming.kind !== "svg" ||
    !compatiblePenSource(incoming.source, previous.pen)
  )
    return null;
  if (!incoming.attributes.viewBox) return null;
  const oldBox = penViewport(previous.attributes.viewBox);
  const newBox = penViewport(incoming.attributes.viewBox ?? "");
  if (JSON.stringify(oldBox) !== JSON.stringify(newBox)) return null;
  const candidate: PenNode = {
    ...incoming,
    id: previous.id,
    parentId: previous.parentId,
    visible: previous.visible,
    locked: previous.locked,
    pen: previous.pen,
    source: penSVG(previous.pen),
  };
  if (samePresentation(candidate, previous)) return { ...previous, pen: previous.pen };
  if (penStroke(candidate.attributes) === penStroke(previous.attributes)) {
    validatePenArtwork(candidate);
    return candidate;
  }
  return reboxSource(candidate);
}

function samePresentation(candidate: DesignNode, previous: DesignNode): boolean {
  return (
    candidate.name === previous.name &&
    JSON.stringify(Object.entries(candidate.attributes).sort()) ===
      JSON.stringify(Object.entries(previous.attributes).sort()) &&
    normalizedStyle(candidate.style) === normalizedStyle(previous.style)
  );
}

function normalizedStyle(style: Styles): string {
  const element = document.createElement("div");
  for (const [key, value] of Object.entries(style))
    element.style.setProperty(
      key,
      value.replace(/\s*!important\s*$/iu, ""),
      /!important\s*$/iu.test(value) ? "important" : "",
    );
  return element.style.cssText;
}

function reboxSource(node: PenNode): PenNode {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;visibility:hidden;left:0;top:0;";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries(node.attributes)) svg.setAttribute(key, value);
  svg.setAttribute("data-orc-id", node.id);
  svg.style.cssText = normalizedStyle(node.style);
  host.append(svg);
  document.body.append(host);
  try {
    const result = reboxPenNode(node, node.pen, penReboxing(node, host));
    validatePenArtwork(result);
    return result;
  } finally {
    host.remove();
  }
}

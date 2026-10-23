import { flowStyle } from "./layout-box";
import type { FrameLayout } from "./frame-layout";

export function frameLayoutValidation(element: HTMLElement, target: FrameLayout, scale: number) {
  const revision = element.closest(".canvas")?.getAttribute("data-orc-revision");
  const boxes = [element, ...element.querySelectorAll("[data-orc-id]")].map((node) => ({
    node,
    bounds: node.getBoundingClientRect(),
  }));
  return () => {
    validateFrame(element, target, revision);
    for (const box of boxes) validateBox(box, target === "Free", scale);
  };
}

function validateFrame(
  element: HTMLElement,
  target: FrameLayout,
  revision: string | null | undefined,
) {
  if (
    !element.isConnected ||
    element.closest(".canvas")?.getAttribute("data-orc-revision") !== revision
  )
    throw new Error("The layout changed. Try the switch again.");
  const style = flowStyle(element);
  const layout = ["flex", "inline-flex"].includes(style.display)
    ? style.flexDirection
    : style.display;
  if (layout !== (target === "Free" ? "block" : target.toLowerCase()))
    throw new Error("Use Code to change this source-controlled layout.");
}

function validateBox(box: { node: Element; bounds: DOMRect }, preserve: boolean, scale: number) {
  const id = box.node.getAttribute("data-orc-id");
  const node = id
    ? document.querySelector(`.canvas-world [data-orc-id="${CSS.escape(id)}"]`)
    : box.node;
  if (!node) throw new Error("The object's rendered box is unavailable.");
  const rendered = node.getBoundingClientRect();
  for (const property of ["x", "y", "width", "height"] as const)
    if (
      !node.isConnected ||
      !Number.isFinite(rendered[property]) ||
      (preserve && Math.abs(rendered[property] - box.bounds[property]) / scale > 0.1)
    )
      throw new Error(
        "Use Code to change this layout; the switch cannot preserve its rendered boxes.",
      );
}

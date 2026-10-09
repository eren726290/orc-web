export function hasCoordinateTransform(style: CSSStyleDeclaration) {
  return (
    ["transform", "translate", "rotate", "scale", "perspective"].some(
      (property) => style.getPropertyValue(property) !== "none",
    ) || !["1", "normal"].includes(style.zoom)
  );
}

export function parentRelativePosition(element: HTMLElement | SVGElement) {
  const parent = element.parentElement;
  const world = element.closest(".canvas-world");
  if (!parent || !world || !element.getClientRects().length) return null;
  for (
    let current: Element | null = element;
    current && current !== world;
    current = current.parentElement
  )
    if (hasCoordinateTransform(getComputedStyle(current))) return null;
  const scale = new DOMMatrix(getComputedStyle(world).transform).a;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const bounds = element.getBoundingClientRect();
  const origin = parent.getBoundingClientRect();
  const style = getComputedStyle(parent);
  return {
    left: String(
      Math.round(
        ((bounds.x - origin.x) / scale - parseFloat(style.borderLeftWidth) + parent.scrollLeft) *
          100,
      ) / 100,
    ),
    top: String(
      Math.round(
        ((bounds.y - origin.y) / scale - parseFloat(style.borderTopWidth) + parent.scrollTop) * 100,
      ) / 100,
    ),
  };
}

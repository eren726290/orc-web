import { labelLeader } from "./guide-label-leader";
import { placeLabel, type LabelBox } from "./guide-label-placement";

export function layoutGuideLabels(svg: SVGSVGElement | null) {
  if (!svg) return;
  const viewport = svg.getBoundingClientRect();
  const labels = measureLabels(svg);
  const occupied = controlBounds(svg, viewport);
  for (const { origin } of labels)
    occupied.push({ x: origin.x - 4, y: origin.y - 4, width: 8, height: 8 });
  const placements = labels.map((label) => {
    const box = placeLabel(
      label.origin,
      {
        width: label.bounds.width + 6,
        height: label.bounds.height + 6,
      },
      occupied,
      { x: viewport.width, y: viewport.height },
    );
    occupied.push(box);
    return { ...label, box };
  });
  // Measure the whole scene before writing any SVG attributes, without another React render.
  for (const { element, bounds, origin, box } of placements) {
    element.setAttribute("transform", `translate(${box.x + 3 - bounds.x} ${box.y + 3 - bounds.y})`);
    const leader = element.previousElementSibling;
    if (leader instanceof SVGPathElement)
      leader.setAttribute(
        "d",
        labelLeader(
          origin,
          box,
          placements.filter((label) => label.element !== element).map((label) => label.box),
        ),
      );
  }
}

function controlBounds(svg: SVGSVGElement, viewport: DOMRect): LabelBox[] {
  const controls =
    svg.parentElement?.querySelectorAll(
      ".pen-anchor,.pen-transform-handle,.pen-center,.pen-hint",
    ) ?? [];
  return Array.from(controls, (element) => {
    const box = element.getBoundingClientRect();
    return {
      x: box.x - viewport.x - 3,
      y: box.y - viewport.y - 3,
      width: box.width + 6,
      height: box.height + 6,
    };
  });
}

function measureLabels(svg: SVGSVGElement) {
  const labels = Array.from(
    svg.querySelectorAll<SVGTextElement>("[data-pen-label]"),
    (element) => ({
      element,
      bounds: element.getBBox(),
      origin: { x: Number(element.dataset.labelX), y: Number(element.dataset.labelY) },
    }),
  );
  labels.sort(
    (a, b) =>
      Number(b.element.dataset.penLabel === "coordinates") -
      Number(a.element.dataset.penLabel === "coordinates"),
  );
  return labels;
}

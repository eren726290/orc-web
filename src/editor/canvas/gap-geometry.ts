import type { DesignDocument, DesignNode } from "../../../shared/document/model";
import { hasCoordinateTransform } from "../layout/coordinates";
import { checkMovementCoordinates, flowChildren } from "./keyboard-movement";

export function measureGaps(
  canvas: HTMLDivElement | null,
  document: DesignDocument,
  node: DesignNode | undefined,
) {
  if (!canvas || !node) return [];
  const parent = canvas.querySelector(`[data-orc-id="${CSS.escape(node.id)}"]`);
  if (!(parent instanceof HTMLElement)) return [];
  const style = getComputedStyle(parent);
  if (!ordinaryGapLayout(style)) return [];
  try {
    checkMovementCoordinates(parent, canvas);
    const children = flowChildren(document, node, canvas);
    if (children.some(({ computed }) => computed.order !== "0" || hasCoordinateTransform(computed)))
      return [];
    return gapPoints(canvas, parent, children, style.flexDirection);
  } catch {
    return [];
  }
}

function ordinaryGapLayout(style: CSSStyleDeclaration) {
  return (
    ["flex", "inline-flex"].includes(style.display) &&
    style.direction === "ltr" &&
    style.writingMode === "horizontal-tb" &&
    !hasCoordinateTransform(style) &&
    ["row", "column"].includes(style.flexDirection) &&
    style.flexWrap !== "wrap-reverse" &&
    (style.flexDirection !== "column" || style.flexWrap === "nowrap")
  );
}

type Box = { id: string; name: string; rect: Pick<DOMRect, "left" | "right" | "top" | "bottom"> };

function gapPoints(
  canvas: HTMLDivElement,
  parent: HTMLElement,
  children: ReturnType<typeof flowChildren>,
  direction: string,
) {
  const origin = canvas.getBoundingClientRect();
  const boxes = children.map(({ node, element }): Box => ({
    id: node.id,
    name: node.name,
    rect: element.getBoundingClientRect(),
  }));
  const gaps = adjacent(boxes, direction);
  if (direction === "row") gaps.push(...adjacent(rowBounds(boxes), "column"));
  return gaps.flatMap((point) =>
    visibleGap(parent, point) ? [{ ...point, x: point.x - origin.x, y: point.y - origin.y }] : [],
  );
}

function adjacent(boxes: Box[], direction: string) {
  return boxes.flatMap((box, index) => {
    const next = boxes[index + 1];
    const point = next ? between(box.rect, next.rect, direction) : null;
    return point && next
      ? [
          {
            ...point,
            key: `${box.id}/${next.id}/${point.axis}`,
            label: `Gap between ${box.name} and ${next.name}`,
          },
        ]
      : [];
  });
}

function rowBounds(boxes: Box[]) {
  const rows: Box[] = [];
  for (const box of boxes) {
    const row = rows.at(-1);
    if (
      row &&
      box.rect.left >= row.rect.right - 0.1 &&
      box.rect.top < row.rect.bottom &&
      box.rect.bottom > row.rect.top
    ) {
      row.rect = {
        left: Math.min(row.rect.left, box.rect.left),
        right: box.rect.right,
        top: Math.min(row.rect.top, box.rect.top),
        bottom: Math.max(row.rect.bottom, box.rect.bottom),
      };
    } else
      rows.push({
        ...box,
        name: `row containing ${box.name}`,
        rect: {
          left: box.rect.left,
          right: box.rect.right,
          top: box.rect.top,
          bottom: box.rect.bottom,
        },
      });
  }
  return rows;
}

function between(a: Box["rect"], b: Box["rect"], direction: string) {
  const xStart = Math.max(a.left, b.left),
    xEnd = Math.min(a.right, b.right);
  const yStart = Math.max(a.top, b.top),
    yEnd = Math.min(a.bottom, b.bottom);
  if (direction === "row" && b.left >= a.right - 0.1 && yEnd > yStart)
    return {
      axis: "x" as const,
      x: (a.right + b.left) / 2,
      y: (yStart + yEnd) / 2,
      touching: b.left - a.right < 0.1,
    };
  if (direction === "column" && b.top >= a.bottom - 0.1 && xEnd > xStart)
    return {
      axis: "y" as const,
      x: (xStart + xEnd) / 2,
      y: (a.bottom + b.top) / 2,
      touching: b.top - a.bottom < 0.1,
    };
  return null;
}

function visibleGap(parent: HTMLElement, point: { x: number; y: number; touching: boolean }) {
  const target = document
    .elementsFromPoint(point.x, point.y)
    .find((element) => !element.closest(".gap-handle"));
  return target === parent || (point.touching && target !== undefined && parent.contains(target));
}

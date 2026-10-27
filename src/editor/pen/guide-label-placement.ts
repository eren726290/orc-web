export type LabelBox = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

export function placeLabel(
  origin: Point,
  size: Pick<LabelBox, "width" | "height">,
  occupied: LabelBox[],
  viewport: Point,
): LabelBox {
  const candidates = labelCandidates(origin, size).map((point) => ({
    ...size,
    x: Math.max(6, Math.min(point.x, viewport.x - size.width - 6)),
    y: Math.max(6, Math.min(point.y, viewport.y - size.height - 6)),
  }));
  let best = candidates[0];
  let score = Infinity;
  for (const candidate of candidates) {
    const overlap = occupied.reduce((area, box) => area + overlapArea(candidate, box), 0);
    if (overlap === 0) return candidate;
    if (overlap < score) {
      score = overlap;
      best = candidate;
    }
  }
  // shortcut: a finite viewport cannot separate arbitrarily dense labels; retain every measurement.
  return best;
}

function labelCandidates(origin: Point, size: Pick<LabelBox, "width" | "height">) {
  const right = origin.x + 12;
  const left = origin.x - size.width - 12;
  const above = origin.y - size.height - 12;
  const below = origin.y + 12;
  const positions = [
    { x: right, y: above },
    { x: left, y: above },
    { x: right, y: below },
    { x: left, y: below },
    { x: origin.x - size.width / 2, y: above },
    { x: origin.x - size.width / 2, y: below },
  ];
  positions.push(
    { x: right + size.width + 16, y: above },
    { x: left - size.width - 16, y: above },
    { x: right + size.width + 16, y: below },
    { x: left - size.width - 16, y: below },
  );
  for (const step of [1, 2, 3, 4]) {
    positions.push({ x: right, y: above - step * (size.height + 8) });
    positions.push({ x: left, y: below + step * (size.height + 8) });
  }
  return positions;
}

function overlapArea(a: LabelBox, b: LabelBox) {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return Math.max(0, width) * Math.max(0, height);
}

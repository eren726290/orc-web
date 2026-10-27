import type { LabelBox } from "./guide-label-placement";
type Point = { x: number; y: number };

export function labelLeader(origin: Point, box: LabelBox, labels: LabelBox[]) {
  const target = {
    x: Math.max(box.x, Math.min(origin.x, box.x + box.width)),
    y: Math.max(box.y, Math.min(origin.y, box.y + box.height)),
  };
  if (Math.hypot(target.x - origin.x, target.y - origin.y) <= 26) return "";
  const routes = [[origin, target]];
  const sides = [
    box.x - 4,
    box.x + box.width + 4,
    Math.min(box.x, ...labels.map((label) => label.x)) - 4,
    Math.max(box.x + box.width, ...labels.map((label) => label.x + label.width)) + 4,
  ];
  for (const x of sides) {
    const end = { x: x < box.x ? box.x : box.x + box.width, y: box.y + box.height / 2 };
    routes.push([origin, { x, y: origin.y }, { x, y: end.y }, end]);
  }
  for (const y of [
    box.y - 4,
    box.y + box.height + 4,
    Math.min(box.y, ...labels.map((label) => label.y)) - 4,
    Math.max(box.y + box.height, ...labels.map((label) => label.y + label.height)) + 4,
  ]) {
    const end = { x: box.x + box.width / 2, y: y < box.y ? box.y : box.y + box.height };
    routes.push([origin, { x: origin.x, y }, { x: end.x, y }, end]);
  }
  const route = routes.find((points) => clearRoute(points, labels)) ?? routes[0];
  return route.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
}

function clearRoute(points: Point[], boxes: LabelBox[]) {
  return points
    .slice(1)
    .every((point, index) => boxes.every((box) => !crossesBox(points[index], point, box)));
}

function crossesBox(a: Point, b: Point, box: LabelBox) {
  let start = 0;
  let end = 1;
  for (const [axis, length] of [
    ["x", "width"],
    ["y", "height"],
  ] as const) {
    const delta = b[axis] - a[axis];
    if (delta === 0) {
      if (a[axis] < box[axis] || a[axis] > box[axis] + box[length]) return false;
    } else {
      const first = (box[axis] - a[axis]) / delta;
      const last = (box[axis] + box[length] - a[axis]) / delta;
      start = Math.max(start, Math.min(first, last));
      end = Math.min(end, Math.max(first, last));
    }
  }
  return start <= end;
}

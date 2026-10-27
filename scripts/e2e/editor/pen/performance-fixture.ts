import { appendPenSegment } from "../../../../shared/pen/drawing";
import type { PenGeometry } from "../../../../shared/pen/model";
import { nodeFixture } from "./fixtures";

export function performanceFixture(count: number) {
  let path: PenGeometry = {
    anchors: [{ id: "a0", x: 0, y: 0 }],
    segments: [],
    rules: [],
    closed: false,
  };
  let direction = { x: 1, y: 0 };
  for (let index = 1; index < count; index++) {
    const start = path.anchors.at(-1);
    if (!start) throw new Error("Missing fixture anchor.");
    const arc = index % 2 === 0;
    const side = [1, -1, -1, 1][(index / 2 - 1) % 4];
    const normal = { x: -direction.y, y: direction.x };
    const target = arc
      ? {
          x: start.x + direction.x * 20 + normal.x * side * 20,
          y: start.y + direction.y * 20 + normal.y * side * 20,
        }
      : { x: start.x + direction.x * 40, y: start.y + direction.y * 40 };
    path = appendPenSegment(path, target, {
      arc,
      shift: false,
      alt: false,
      close: false,
      ids: { anchor: `a${index}`, segment: `s${index}`, rule: `r${index}` },
    }).path;
    if (arc) direction = { x: normal.x * side, y: normal.y * side };
  }
  const node = nodeFixture(path);
  Object.assign(node.style, { left: "80px", top: "100px" });
  return node;
}

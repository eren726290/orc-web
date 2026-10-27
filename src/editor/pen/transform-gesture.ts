import { isLocked } from "../../../shared/document/model";
import type { PenPoint } from "../../../shared/pen/model";
import { penViewport } from "../../../shared/pen/viewport";
import { readSizingOwners } from "../layout/sizing";
import { localPoint, svgMapping } from "./coordinates";
import { selectedPen } from "./drag";
import { penNodeWrite, type PenNode } from "./node";
import { preparePenPreview } from "./preview";
import { penReboxing } from "./reboxing";
import { penRotation, penScale, rotatePenNode, scalePenNode } from "./transforms";
import type { PenProps } from "./types";
import type { Mutation } from "../../../shared/commands/commands";

export type TransformKind = "scale" | "rotation";
export type TransformInput = { point: PenPoint; pointer: number };
export type TransformGesture = {
  kind: TransformKind;
  input: TransformInput;
  node: PenNode;
  inverse: DOMMatrix;
  box: ReturnType<typeof penViewport>;
  pivot: PenPoint;
  scale: number;
  rebox: ReturnType<typeof penReboxing>;
  start: PenPoint;
  mutation: Mutation | null;
  prepare: ReturnType<typeof preparePenPreview>;
};

function transformTarget(props: PenProps): PenNode {
  const node = selectedPen(props);
  if (!node || props.disabled || isLocked(props.appliedDocument, node.id))
    throw new Error("Select an unlocked Pen SVG to transform it.");
  const element = props.canvas.current?.querySelector(`[data-orc-id="${CSS.escape(node.id)}"]`);
  if (!(element instanceof SVGSVGElement)) throw new Error("The SVG is unavailable.");
  const owners = readSizingOwners(
    node,
    element,
    node.parentId ? props.appliedDocument.nodes[node.parentId] : undefined,
  );
  if (owners.width || owners.height)
    throw new Error("Choose editable Fixed width and height before transforming this SVG.");
  penScale(node);
  if (penRotation(node) === null)
    throw new Error("This SVG transform is controlled by source. Edit it in Code.");
  return node;
}

export function beginTransform(
  props: PenProps,
  kind: TransformKind,
  input: TransformInput,
): TransformGesture {
  const node = transformTarget(props);
  const canvas = props.canvas.current;
  if (!canvas) throw new Error("The canvas is unavailable.");
  const { forward, inverse } = svgMapping(canvas, node.id);
  const box = penViewport(node.attributes.viewBox);
  const element = canvas.querySelector(`[data-orc-id="${CSS.escape(node.id)}"]`);
  if (!(element instanceof SVGSVGElement)) throw new Error("The SVG is unavailable.");
  const origin = getComputedStyle(element).transformOrigin.split(/\s+/u).map(Number.parseFloat);
  const scale = penScale(node);
  const pivot =
    kind === "scale"
      ? { x: box.x, y: box.y }
      : { x: box.x + origin[0] / scale, y: box.y + origin[1] / scale };
  const expected = localPoint(forward, pivot);
  return {
    kind,
    input,
    node,
    inverse,
    box,
    pivot,
    scale,
    rebox: penReboxing(node, canvas),
    start: localPoint(inverse, input.point),
    mutation: null,
    prepare: preparePenPreview(props.appliedDocument, props.preview, () => {
      const actual = localPoint(svgMapping(canvas, node.id).forward, pivot);
      if (Math.hypot(actual.x - expected.x, actual.y - expected.y) > 0.1)
        throw new Error(
          "This layout cannot keep the transform pivot. Use supported Free placement.",
        );
    }),
  };
}

export function moveTransform(gesture: TransformGesture, point: PenPoint) {
  const local = localPoint(gesture.inverse, point);
  const { node, box, start, pivot } = gesture;
  let candidate = node;
  if (point.x !== gesture.input.point.x || point.y !== gesture.input.point.y) {
    if (gesture.kind === "scale") {
      const factor =
        1 +
        ((local.x - start.x) * box.width + (local.y - start.y) * box.height) /
          (box.width ** 2 + box.height ** 2);
      if (Math.abs(factor - 1) > 1e-9)
        candidate = scalePenNode(node, gesture.scale * factor, gesture.rebox);
    } else {
      const angle =
        Math.atan2(local.y - pivot.y, local.x - pivot.x) -
        Math.atan2(start.y - pivot.y, start.x - pivot.x);
      if (Math.abs(angle) > 1e-9)
        candidate = rotatePenNode(node, (penRotation(node) ?? 0) + (angle * 180) / Math.PI);
    }
  }
  const mutation = gesture.prepare([penNodeWrite(candidate)]);
  gesture.mutation = candidate === node ? null : mutation;
}

export async function keyboardTransform(props: PenProps, kind: TransformKind, step: number) {
  try {
    if (!(await props.beforeEdit())) return;
    const node = transformTarget(props);
    const canvas = props.canvas.current;
    if (!canvas) return;
    const candidate =
      kind === "scale"
        ? scalePenNode(node, penScale(node) * (1 + step / 100), penReboxing(node, canvas))
        : rotatePenNode(node, (penRotation(node) ?? 0) + step);
    await props.mutate(penNodeWrite(candidate));
  } catch (error) {
    props.notice(error instanceof Error ? error.message : "The SVG transform failed.");
  }
}

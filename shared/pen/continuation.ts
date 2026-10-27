import { distance } from "./geometry";
import { penAnchor, penTolerance, type PenGeometry, type PenPoint } from "./model";
import type { createPenSolver } from "./solver";

export type PenMotion = {
  path: PenGeometry;
  anchor: string;
  target: PenPoint;
  step: number;
  pending: boolean;
  message: string | null;
};

export function penMotion(path: PenGeometry, anchor: string): PenMotion {
  return {
    path,
    anchor,
    target: penAnchor(path, anchor),
    step: motionStep(path),
    pending: false,
    message: null,
  };
}

function motionStep(path: PenGeometry): number {
  return Math.max(
    penTolerance * 2,
    Math.min(
      8,
      ...path.segments.map((segment, index) => {
        const start = path.anchors[index];
        return (
          (segment.kind === "arc"
            ? distance(start, segment.center)
            : distance(start, path.anchors[(index + 1) % path.anchors.length])) / 8
        );
      }),
    ),
  );
}

export function continuePenMotion(
  motion: PenMotion,
  solver: ReturnType<typeof createPenSolver>,
  accept: (path: PenGeometry) => void,
  now: () => number = () => performance.now(),
): void {
  const start = now();
  for (let attempt = 0; attempt < 4 && now() - start < 8; attempt++) {
    const drag = nextPenMove(motion);
    if (!drag) return;
    const result = solver.solve(motion.path, drag);
    try {
      if (result.kind === "refused") throw new Error(result.message);
      acceptPenMove(motion, result.path, accept);
    } catch (error) {
      refusePenMove(motion, error);
      if (!motion.pending) return;
    }
  }

  motion.pending = distance(penAnchor(motion.path, motion.anchor), motion.target) > penTolerance;
}

export function nextPenMove(motion: PenMotion) {
  const held = penAnchor(motion.path, motion.anchor);
  const remaining = distance(held, motion.target);
  motion.pending = remaining > penTolerance;
  if (!motion.pending) return null;
  const fraction = Math.min(1, motion.step / remaining);
  return {
    id: motion.anchor,
    to: {
      x: held.x + (motion.target.x - held.x) * fraction,
      y: held.y + (motion.target.y - held.y) * fraction,
    },
  };
}

export function acceptPenMove(
  motion: PenMotion,
  path: PenGeometry,
  accept: (path: PenGeometry) => void,
) {
  accept(path);
  motion.path = path;
  motion.message = null;
  motion.step = Math.min(motionStep(path), motion.step * 1.5);
  motion.pending = distance(penAnchor(path, motion.anchor), motion.target) > penTolerance;
}

export function refusePenMove(motion: PenMotion, error: unknown) {
  motion.message = error instanceof Error ? error.message : "This pen move is unavailable.";
  motion.step /= 2;
  if (motion.step < penTolerance * 2) motion.pending = false;
}

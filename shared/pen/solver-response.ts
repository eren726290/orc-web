import { nonnegativeInteger, object } from "../validation";
import type { PenPoint } from "./model";
import { validatePenPoint } from "./validation";

export type PenSolverReport = {
  dof: number | null;
  iterations: number;
  maxResidual: number;
  failing: number[];
};

export type NumericResult = PenSolverReport & {
  ok: boolean;
  points: PenPoint[];
};

function solverPoint(value: unknown): PenPoint {
  if (!Array.isArray(value) || value.length !== 2) throw new Error("Invalid solver point.");
  const [x, y]: unknown[] = value;
  if (typeof x !== "number" || typeof y !== "number")
    throw new Error("Invalid solver coordinates.");
  const point = { x, y };
  validatePenPoint(point);
  return point;
}

export function solverResponse(value: unknown): NumericResult {
  const input = object(value);
  if (typeof input.error === "string") throw new Error(input.error);
  if (
    typeof input.ok !== "boolean" ||
    !Array.isArray(input.points) ||
    !Array.isArray(input.failing)
  ) {
    throw new Error("The pen solver returned an invalid result.");
  }
  if (typeof input.maxResidual !== "number" || !Number.isFinite(input.maxResidual)) {
    throw new Error("The pen solver returned an invalid residual.");
  }
  return {
    ok: input.ok,
    points: input.points.map(solverPoint),
    dof: input.dof === null ? null : nonnegativeInteger(input.dof),
    iterations: nonnegativeInteger(input.iterations),
    maxResidual: input.maxResidual,
    failing: input.failing.map(nonnegativeInteger),
  };
}

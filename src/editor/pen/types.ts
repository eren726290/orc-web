import type { Mutation } from "../../../shared/commands/commands";
import type { DesignDocument } from "../../../shared/document/model";
import type { PenGeometry, PenPoint } from "../../../shared/pen/model";
import type { NextPenIds } from "../../../shared/pen/drawing";
import type { createPenWorker } from "./worker-client";
import type { PropertyPreview } from "../properties/property-preview";
import type { ViewState } from "../view-state";
import type { PenNode } from "./node";
import type { preparePenPreview } from "./preview";
import type { penReboxing } from "./reboxing";
import type { PenMotion } from "../../../shared/pen/continuation";

export type PenProps = {
  appliedDocument: DesignDocument;
  document: DesignDocument;
  canvas: React.RefObject<HTMLDivElement | null>;
  view: ViewState;
  disabled: boolean;
  beforeEdit: () => Promise<boolean>;
  preview: (value: PropertyPreview) => void;
  mutate: (mutation: Mutation) => Promise<boolean>;
  setView: (patch: Partial<ViewState>) => void;
  notice: (value: string | null) => void;
};

export type Drawing = {
  original: PenNode | null;
  rebox: ReturnType<typeof penReboxing> | null;
  placement: "free" | "flow";
  nodeId: string;
  parentId: string | null;
  placed: PenGeometry;
  shown: PenGeometry;
  mode: "line" | "arc";
  ids: NextPenIds;
  forward: DOMMatrix;
  inverse: DOMMatrix;
  prepare: ReturnType<typeof preparePenPreview>;
};

export type Dragging = {
  node: PenNode;
  anchor: string;
  point: PenPoint;
  offset: PenPoint;
  pointer: number;
  inverse: DOMMatrix;
  motion: PenMotion;
  frame: number | null;
  mutation: Mutation | null;
  solver: ReturnType<typeof createPenWorker>;
  busy: boolean;
  rebox: ReturnType<typeof penReboxing>;
  prepare: ReturnType<typeof preparePenPreview>;
};

export type PenState = {
  loading: boolean;
  drawing: Drawing | null;
  dragging: Dragging | null;
  selectedAnchor: { nodeId: string; anchor: string } | null;
  epoch: number;
  pressed: number | null;
};

export type PenInput = {
  point: PenPoint;
  pointer: number;
  anchor: string | null;
  shift: boolean;
  alt: boolean;
};

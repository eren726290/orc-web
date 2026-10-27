import { useLayoutEffect, useRef } from "react";
import { layoutGuideLabels } from "./guide-label-layout";
import { penAnchor, type PenGeometry, type PenSegment } from "../../../shared/pen/model";
import { arcSweep, distance } from "../../../shared/pen/geometry";
import { localPoint } from "./coordinates";

export function PenGuides({
  path,
  matrix,
  selected,
  width,
  height,
}: {
  path: PenGeometry;
  matrix: DOMMatrix;
  selected: string | undefined;
  width: number;
  height: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => layoutGuideLabels(ref.current));
  const anchor = path.anchors.find((point) => point.id === selected);
  const segments = visibleSegments(path, matrix, width, height);
  return (
    <svg ref={ref} className="pen-guides" aria-hidden="true">
      <g transform={matrix.toString()}>
        {segments.map((segment) => (
          <Construction key={segment.id} path={path} segment={segment} />
        ))}
      </g>
      {segments.map((segment) => (
        <Measurement key={segment.id} path={path} segment={segment} matrix={matrix} />
      ))}
      {anchor && (
        <GuideLabel id="coordinates" point={localPoint(matrix, anchor)}>
          X {anchor.x.toFixed(1)} · Y {anchor.y.toFixed(1)}
        </GuideLabel>
      )}
    </svg>
  );
}

function visibleSegments(path: PenGeometry, matrix: DOMMatrix, width: number, height: number) {
  return path.segments.filter((segment, index) => {
    const from = localPoint(matrix, path.anchors[index]);
    const to = localPoint(matrix, path.anchors[(index + 1) % path.anchors.length]);
    let left = Math.min(from.x, to.x);
    let right = Math.max(from.x, to.x);
    let top = Math.min(from.y, to.y);
    let bottom = Math.max(from.y, to.y);
    if (segment.kind === "arc") {
      const center = localPoint(matrix, segment.center);
      const radius = distance(path.anchors[index], segment.center);
      const rx = radius * Math.hypot(matrix.a, matrix.c);
      const ry = radius * Math.hypot(matrix.b, matrix.d);
      left = center.x - rx;
      right = center.x + rx;
      top = center.y - ry;
      bottom = center.y + ry;
    }
    return right > -50 && left < width + 50 && bottom > -50 && top < height + 50;
  });
}

function Construction({ path, segment }: { path: PenGeometry; segment: PenSegment }) {
  const from = penAnchor(path, segment.from);
  const to = penAnchor(path, segment.to);
  return segment.kind === "arc" ? (
    <circle cx={segment.center.x} cy={segment.center.y} r={distance(from, segment.center)} />
  ) : (
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
  );
}

function Measurement({
  path,
  segment,
  matrix,
}: {
  path: PenGeometry;
  segment: PenSegment;
  matrix: DOMMatrix;
}) {
  const from = penAnchor(path, segment.from);
  const to = penAnchor(path, segment.to);
  const middle = localPoint(matrix, { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 });
  const marker = path.rules
    .filter((rule) =>
      "segment" in rule ? rule.segment === segment.id : rule.second === segment.id,
    )
    .map(
      (rule) => ({ horizontal: "H", vertical: "V", perpendicular: "⊥", tangent: "T" })[rule.kind],
    )
    .join(" ");
  const measurement =
    segment.kind === "arc"
      ? `R ${distance(from, segment.center).toFixed(1)} · ${((arcSweep(path, segment) * 180) / Math.PI).toFixed(1)}°`
      : `L ${distance(from, to).toFixed(1)} · ${((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI).toFixed(1)}°`;
  const center = segment.kind === "arc" ? localPoint(matrix, segment.center) : null;
  return (
    <>
      <GuideLabel id={segment.id} point={middle}>
        {measurement} {marker}
      </GuideLabel>
      {center && (
        <text className="pen-center" x={center.x} y={center.y}>
          +
        </text>
      )}
    </>
  );
}

function GuideLabel({
  id,
  point,
  children,
}: {
  id: string;
  point: { x: number; y: number };
  children: React.ReactNode;
}) {
  return (
    <>
      <path className="pen-label-leader" />
      <text
        data-pen-label={id}
        data-label-x={point.x}
        data-label-y={point.y}
        x={point.x + 10}
        y={point.y - 10}
      >
        {children}
      </text>
    </>
  );
}

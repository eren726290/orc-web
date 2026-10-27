import { penIdentity, type PenGeometry } from "./model";
import { validatePenGeometry } from "./validation";

export function deletePenAnchor(path: PenGeometry, id: string): PenGeometry | null {
  if (!path.anchors.some((anchor) => anchor.id === id))
    throw new Error("The selected anchor no longer exists.");
  const anchors = path.anchors.filter((anchor) => anchor.id !== id);
  if (anchors.length < 2) return null;
  const count = path.closed ? anchors.length : anchors.length - 1;
  const segments = Array.from({ length: count }, (_, index) => {
    const from = anchors[index].id;
    const to = anchors[(index + 1) % anchors.length].id;
    return (
      path.segments.find((segment) => segment.from === from && segment.to === to) ?? {
        id: penIdentity("s"),
        kind: "line" as const,
        from,
        to,
      }
    );
  });
  const kept = new Set(segments.map((segment) => segment.id));
  const rules = path.rules.filter((rule) =>
    "segment" in rule ? kept.has(rule.segment) : kept.has(rule.first) && kept.has(rule.second),
  );
  const result = { anchors, segments, rules, closed: path.closed };
  validatePenGeometry(result);
  return result;
}

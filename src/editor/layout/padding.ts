import type { Mutation } from "../../../shared/commands/commands";
import type { DesignNode } from "../../../shared/document/model";

type PaddingSide = {
  property: string;
  value: string;
  priority: string;
  fixed: boolean;
};

export function readPadding(node: DesignNode) {
  const style = document.createElement("div").style;
  style.cssText = Object.entries(node.style)
    .map(([property, value]) => `${property}:${value};`)
    .join("");
  const logical = Object.keys(node.style).some((property) =>
    /^padding-(?:inline|block)(?:-(?:start|end))?$/u.test(property),
  );
  const source = logical || Boolean(style.all);
  const side = (edge: string): PaddingSide => {
    const property = `padding-${edge}`;
    const value = style.getPropertyValue(property);
    const unresolved =
      !value && (Object.hasOwn(node.style, "padding") || Object.hasOwn(node.style, property));
    return {
      property,
      value: value || (unresolved || source ? "Edit source" : "0px"),
      priority: style.getPropertyPriority(property),
      fixed: !source && !unresolved && (!value || /^\d+(?:\.\d+)?(?:e[+-]?\d+)?px$/u.test(value)),
    };
  };
  return { top: side("top"), right: side("right"), bottom: side("bottom"), left: side("left") };
}

export function paddingChange(id: string, sides: PaddingSide[], value: string) {
  return {
    kind: "batch",
    mutations: [
      { kind: "style", id, values: {}, unset: sides.map((side) => side.property) },
      {
        kind: "style",
        id,
        values: Object.fromEntries(
          sides.map((side) => [side.property, value + (side.priority ? " !important" : "")]),
        ),
      },
    ],
  } satisfies Mutation;
}

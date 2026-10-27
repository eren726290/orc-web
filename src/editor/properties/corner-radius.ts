import type { Mutation } from "../../../shared/commands/commands";
import type { DesignNode } from "../../../shared/document/model";

const corners = [
  ["Top left", "border-top-left-radius"],
  ["Top right", "border-top-right-radius"],
  ["Bottom right", "border-bottom-right-radius"],
  ["Bottom left", "border-bottom-left-radius"],
];

export function readCornerRadius(node: DesignNode) {
  const style = document.createElement("div").style;
  style.cssText = Object.entries(node.style)
    .map(([property, value]) => `${property}:${value};`)
    .join("");
  const source =
    Boolean(style.all) ||
    Object.keys(node.style).some((property) =>
      /^border-(?:start|end)-(?:start|end)-radius$/u.test(property),
    );
  return corners.map(([label, property]) => {
    const value = style.getPropertyValue(property);
    const unresolved =
      !value && (Object.hasOwn(node.style, "border-radius") || Object.hasOwn(node.style, property));
    const fixed =
      !source &&
      !unresolved &&
      (!value || /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/iu.test(value));
    return {
      label,
      property,
      value: fixed ? parseFloat(value || "0px") : null,
      priority: style.getPropertyPriority(property),
    };
  });
}

export function cornerRadiusChange(
  id: string,
  corners: ReturnType<typeof readCornerRadius>,
  value: string,
) {
  return {
    kind: "batch",
    mutations: [
      { kind: "style", id, values: {}, unset: corners.map((corner) => corner.property) },
      {
        kind: "style",
        id,
        values: Object.fromEntries(
          corners.map((corner) => [
            corner.property,
            value + (corner.priority ? " !important" : ""),
          ]),
        ),
      },
    ],
  } satisfies Mutation;
}

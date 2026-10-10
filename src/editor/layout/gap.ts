import type { Mutation } from "../../../shared/commands/commands";
import type { DesignNode } from "../../../shared/document/model";

export function readGap(node: DesignNode) {
  const style = document.createElement("div").style;
  style.cssText = Object.entries(node.style)
    .map(([property, value]) => `${property}:${value};`)
    .join("");
  const row = style.rowGap;
  const column = style.columnGap;
  const priority = style.getPropertyPriority("row-gap");
  const unresolved = !row && Object.hasOwn(node.style, "gap");
  const fixed = /^\d+(?:\.\d+)?(?:e[+-]?\d+)?px$/u.test(row);
  const zero = !unresolved && ["", "normal"].includes(row);
  const owned =
    !style.all &&
    row === column &&
    priority === style.getPropertyPriority("column-gap") &&
    (fixed || zero);
  return { value: owned ? (fixed ? parseFloat(row) : 0) : null, priority };
}

export function gapChange(id: string, priority: string, value: number) {
  const mutations: Extract<Mutation, { kind: "style" }>[] = [
    { kind: "style", id, values: {}, unset: ["gap", "row-gap", "column-gap"] },
    { kind: "style", id, values: { gap: `${value}px${priority ? " !important" : ""}` } },
  ];
  return {
    kind: "batch",
    mutations,
  } satisfies Mutation;
}

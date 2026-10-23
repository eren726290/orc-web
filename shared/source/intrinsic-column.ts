import type { Styles } from "../document/model";

export const columnMarker = "--orc-intrinsic-column";
export const columnVersion = "1";
export const columnLayout = "intrinsic-column-v1";
export const columnLayoutAttribute = "data-orc-layout";
export const columnFlowAttribute = "data-orc-flow";
export const columnFlowStyle: Styles = {
  display: "flex",
  "flex-flow": "inherit",
  "place-content": "inherit",
  "align-items": "inherit",
  gap: "inherit",
  "min-height": "0px",
  "min-width": "0px",
  "place-self": "stretch",
};

export function hasColumnProjection(style: Styles): boolean {
  return (
    Object.hasOwn(style, columnMarker) &&
    style[columnMarker]?.replace(/\s*!important\s*$/iu, "").trim() === columnVersion
  );
}

export function columnProjectionEligible(style: Styles): boolean {
  return (
    !Object.keys(style).some((property) => /^grid(?:-|$)/u.test(property)) &&
    columnFlowValue(style, "flex-direction", "row") === "column" &&
    columnFlowValue(style, "flex-wrap", "nowrap") === "nowrap"
  );
}

function columnFlowValue(style: Styles, property: string, fallback: string): string {
  let value = fallback;
  let important = false;
  for (const [key, declaration] of Object.entries(style)) {
    if (key !== property && key !== "flex-flow") continue;
    const priority = /!important\s*$/iu.test(declaration);
    if (important && !priority) continue;
    const plain = declaration.replace(/\s*!important\s*$/iu, "").trim();
    value = key === property ? plain : flowPart(plain, property, fallback);
    important = priority;
  }
  return value;
}

function flowPart(value: string, property: string, fallback: string): string {
  const tokens = value.split(/\s+/u);
  if (
    tokens.some((token) =>
      ["inherit", "initial", "unset", "revert", "revert-layer"].includes(token),
    )
  )
    return value;
  const allowed =
    property === "flex-direction"
      ? ["column", "column-reverse", "row", "row-reverse"]
      : ["nowrap", "wrap", "wrap-reverse"];
  return tokens.find((token) => allowed.includes(token)) ?? fallback;
}

export function projectColumnStyle(style: Styles): Styles {
  if (!Object.hasOwn(style, columnMarker)) return style;
  if (!hasColumnProjection(style) || !columnProjectionEligible(style))
    throw new Error(
      "The intrinsic Column projection requires its known version, an owned non-wrapping Column, and no competing Grid CSS.",
    );
  if (style.display?.replace(/\s*!important\s*$/iu, "").trim() !== "flex")
    throw new Error("The intrinsic Column projection requires an owned Flex display.");
  return {
    ...style,
    display: /!important\s*$/iu.test(style.display) ? "grid !important" : "grid",
    "grid-template-rows": "minmax(0px, 1fr)",
    "grid-template-columns": "minmax(0px, 1fr)",
  };
}

export const absolutePosition = "var(--orc-absolute-position)";
export const insetProperties = [
  "inset",
  "inset-inline",
  "inset-block",
  "inset-inline-start",
  "inset-inline-end",
  "inset-block-start",
  "inset-block-end",
  "left",
  "right",
  "top",
  "bottom",
];

export function isExplicitAbsolute(style: CSSStyleDeclaration) {
  return (
    style.position === absolutePosition &&
    style.getPropertyValue("--orc-absolute-position").trim() === "absolute"
  );
}

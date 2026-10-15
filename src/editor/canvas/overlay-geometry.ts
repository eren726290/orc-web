import { flushSync } from "react-dom";

const geometryEvents = [
  "scroll",
  "transitionrun",
  "transitionend",
  "transitioncancel",
  "animationstart",
  "animationend",
  "animationcancel",
  "load",
];

export function observeOverlayGeometry(
  canvas: HTMLDivElement | null,
  ids: string[],
  measure: () => void,
) {
  const world = canvas?.querySelector(".canvas-world");
  if (!canvas || !world) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    flushSync(measure);
    if (
      world
        .getAnimations({ subtree: true })
        .some((animation) => animation.playState === "running" || animation.pending)
    )
      schedule();
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const resize = new ResizeObserver(schedule);
  for (const element of layoutRelations(canvas, ids)) resize.observe(element);
  const mutation = new MutationObserver(schedule);
  mutation.observe(world, {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: true,
  });
  for (const event of geometryEvents) canvas.addEventListener(event, schedule, true);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();
    for (const event of geometryEvents) canvas.removeEventListener(event, schedule, true);
  };
}

function layoutRelations(canvas: HTMLDivElement, ids: string[]) {
  const elements = new Set<Element>([canvas]);
  for (const id of ids) {
    let element = canvas.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
    while (element && element !== canvas) {
      elements.add(element);
      if (element.parentElement && element.parentElement !== canvas)
        for (const sibling of element.parentElement.children) elements.add(sibling);
      element = element.parentElement;
    }
  }
  return elements;
}

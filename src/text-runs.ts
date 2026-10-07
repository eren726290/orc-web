import type { TextRun } from "../shared/model";

export function replaceText(runs: TextRun[], next: string): TextRun[] {
  const previous = runs.map((run) => run.text).join("");
  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix])
    prefix++;
  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous.at(-suffix - 1) === next.at(-suffix - 1)
  )
    suffix++;
  const before = sliceRuns(runs, 0, prefix);
  const after = sliceRuns(runs, previous.length - suffix, previous.length);
  const inserted = next.slice(prefix, next.length - suffix);
  const style = styleAt(runs, prefix);
  return [...before, ...(inserted ? [{ text: inserted, style }] : []), ...after];
}

function styleAt(runs: TextRun[], position: number) {
  let end = 0;
  for (const run of runs) {
    end += run.text.length;
    if (position <= end) return { ...run.style };
  }
  return {};
}

function sliceRuns(runs: TextRun[], start: number, end: number): TextRun[] {
  let offset = 0;
  const result: TextRun[] = [];
  for (const run of runs) {
    const text = run.text.slice(Math.max(0, start - offset), Math.max(0, end - offset));
    if (text) result.push({ text, style: { ...run.style } });
    offset += run.text.length;
  }
  return result;
}

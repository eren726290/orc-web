import { writeFile, rename } from "node:fs/promises";
import {
  analyze,
  resolve,
  editRetainingSelection,
  type Sources,
  type Aliases,
  type Selection,
} from "../resolver";
import type { renderer } from "../browser";

type Render = Awaited<ReturnType<typeof renderer>>;
type State = { sources: Sources; selection: Selection | null; reason: string | null };

// Experiment command state only. The logical handle never gets replaced by the test.
export async function session({
  render,
  sources,
  aliases,
  entry,
  saved,
}: {
  render: Render;
  sources: Sources;
  aliases: Aliases;
  entry: string;
  saved: string;
}) {
  let state: State = { sources, selection: null, reason: "No selection" };
  let current = await render.prepare(sources, aliases, entry);
  let revision = 0;
  const history: State[] = [],
    future: State[] = [];
  const handle = {
    get selection() {
      return state.selection;
    },
    get reason() {
      return state.reason;
    },
  };
  const records: unknown[] = [];
  async function persist(next: State, nextRevision: number) {
    await writeFile(saved + ".tmp", JSON.stringify({ ...next, revision: nextRevision }, null, 2));
    await rename(saved + ".tmp", saved);
  }
  await persist(state, revision);

  async function selectedView() {
    if (!state.selection) return [];
    return current.page.locator("[data-orc-node]").evaluateAll(
      (els, selection) =>
        els
          .filter(
            (el) =>
              el.getAttribute("data-orc-node") === selection.node &&
              el.getAttribute("data-orc-usage") === JSON.stringify(selection.usages) &&
              el.getAttribute("data-orc-record") === JSON.stringify(selection.record),
          )
          .map((el) => ({
            text: el.textContent,
            size: getComputedStyle(el).fontSize,
            weight: getComputedStyle(el).fontWeight,
            classes: el.className,
          })),
      state.selection,
    );
  }
  async function record(label: string) {
    const owners = state.selection
      ? {
          text: resolve(current.analysis, state.selection, "text"),
          classes: resolve(current.analysis, state.selection, "classes"),
        }
      : null;
    const view = await selectedView();
    const result = {
      label,
      revision,
      selection: state.selection,
      reason: state.reason,
      owners,
      view,
      sources: state.sources,
      history: history.length,
      future: future.length,
    };
    records.push(result);
    return result;
  }
  async function commit(next: State, operation: "edit" | "undo" | "redo", label: string) {
    await record("before " + label);
    const candidate = await render.prepare(next.sources, aliases, entry);
    try {
      if (next.selection) {
        const text = resolve(candidate.analysis, next.selection, "text");
        const classes = resolve(candidate.analysis, next.selection, "classes");
        const count = await candidate.page
          .locator("[data-orc-node]")
          .evaluateAll(
            (els, selection) =>
              els.filter(
                (el) =>
                  el.getAttribute("data-orc-node") === selection.node &&
                  el.getAttribute("data-orc-usage") === JSON.stringify(selection.usages) &&
                  el.getAttribute("data-orc-record") === JSON.stringify(selection.record),
              ).length,
            next.selection,
          );
        if (count !== 1 || (text.kind === "unsupported" && classes.kind === "unsupported")) {
          next = {
            ...next,
            selection: null,
            reason: "Selection invalidated: missing or uncertain source/rendered binding",
          };
        }
      }
      // This publishes engine-owned selection state. It never reads a replacement token from DOM/text.
      await candidate.page.evaluate(
        (selection) =>
          Object.defineProperty(window, "__selection", {
            value: selection,
            writable: true,
            configurable: true,
          }),
        next.selection,
      );
      await persist(next, revision + 1);
    } catch (error) {
      await candidate.context.close();
      throw error;
    }
    if (operation === "undo") {
      history.pop();
      future.push(state);
    } else if (operation === "redo") {
      future.pop();
      history.push(state);
    } else {
      history.push(state);
      future.length = 0;
    }
    state = next;
    revision++;
    await current.context.close();
    current = candidate;
    await record("after " + label);
  }
  async function copiedSelection(node: string, rootUsage: string, sources: Sources) {
    const candidate = await render.prepare(sources, aliases, entry);
    try {
      const matches = await candidate.page.locator("[data-orc-node]").evaluateAll(
        (elements, target) =>
          elements.flatMap((element) => {
            if (element.getAttribute("data-orc-node") !== target.node) return [];
            const usages: unknown = JSON.parse(element.getAttribute("data-orc-usage") ?? "null");
            const record: unknown = JSON.parse(element.getAttribute("data-orc-record") ?? "null");
            return Array.isArray(usages) && usages.includes(target.rootUsage)
              ? [{ node: target.node, usages, record }]
              : [];
          }),
        { node, rootUsage },
      );
      if (matches.length !== 1)
        throw new Error("Only this candidate did not produce one certain rendered binding");
      const [selection] = matches;
      if (
        !selection.usages.every((usage: unknown) => typeof usage === "string") ||
        !(
          selection.record === null ||
          typeof selection.record === "string" ||
          typeof selection.record === "number"
        )
      )
        throw new Error("Only this candidate produced invalid selection metadata");
      return { node: selection.node, usages: selection.usages, record: selection.record };
    } finally {
      await candidate.context.close();
    }
  }
  return {
    handle,
    records,
    get page() {
      return current.page;
    },
    get analysis() {
      return current.analysis;
    },
    get sources() {
      return state.sources;
    },
    get revision() {
      return revision;
    },
    get undoCount() {
      return history.length;
    },
    get redoCount() {
      return future.length;
    },
    record,
    selectedView,
    async select(selection: Selection) {
      if (state.selection || history.length)
        throw new Error("This experiment accepts one initial selection per session");
      state = { ...state, selection, reason: null };
      await persist(state, revision);
      await record("one browser click");
    },
    async change(field: "text" | "classes", value: string | { from: string; to: string }) {
      if (!state.selection) throw new Error("Selection invalidated");
      const next = editRetainingSelection(
        analyze(state.sources, aliases),
        state.selection,
        field,
        value,
      );
      await commit({ ...next, reason: null }, "edit", "change " + field);
    },
    async sourceEdit(next: Sources, label: string) {
      // No inferred lineage for direct source edits; retain only a still-unambiguous token.
      await commit({ ...state, sources: next }, "edit", label);
    },
    async applyCopiedChange(
      next: { sources: Sources; node: string; rootUsage: string },
      label: string,
    ) {
      const selection = await copiedSelection(next.node, next.rootUsage, next.sources);
      await commit({ sources: next.sources, selection, reason: null }, "edit", label);
    },
    async undo() {
      const previous = history.at(-1);
      if (!previous) throw new Error("Nothing to Undo");
      await commit(previous, "undo", "Undo");
    },
    async redo() {
      const next = future.at(-1);
      if (!next) throw new Error("Nothing to Redo");
      await commit(next, "redo", "Redo");
    },
    close: () => current.context.close(),
  };
}

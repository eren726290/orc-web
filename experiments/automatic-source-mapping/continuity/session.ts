import { writeFile, rename } from "node:fs/promises";
import {
  analyze,
  resolve,
  editRetainingSelection,
  type Sources,
  type Aliases,
  type Selection,
  type CommandBindings,
} from "../resolver";
import type { renderer } from "../browser";

type Render = Awaited<ReturnType<typeof renderer>>;
type State = {
  sources: Sources;
  selection: Selection | null;
  reason: string | null;
  bindings: CommandBindings;
  revealed: string[];
};

// Experiment command state only. The logical handle never gets replaced by the test.
export async function session({
  render,
  sources,
  aliases,
  entry,
  saved,
  commandIdentity = false,
  selection = null,
  reason = null,
  bindings = {},
  revealed = [],
  revision: initialRevision = 0,
}: {
  render: Render;
  sources: Sources;
  aliases: Aliases;
  entry: string;
  saved: string;
  commandIdentity?: boolean;
  selection?: Selection | null;
  reason?: string | null;
  bindings?: CommandBindings;
  revealed?: string[];
  revision?: number;
}) {
  let state: State = {
    sources,
    selection,
    reason: selection ? reason : "No selection",
    bindings,
    revealed,
  };
  let current = await render.prepare(sources, aliases, entry, state);
  if (
    selection &&
    resolve(current.analysis, selection, "text").kind === "unsupported" &&
    resolve(current.analysis, selection, "classes").kind === "unsupported"
  )
    state = { ...state, selection: null, reason: "Selection invalidated on reopen" };
  let revision = initialRevision;
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
  await current.page.evaluate(
    (selection) =>
      Object.defineProperty(window, "__selection", {
        value: selection,
        writable: true,
        configurable: true,
      }),
    state.selection,
  );
  await persist(state, revision);

  async function selectedView(page = current.page, selection = state.selection) {
    if (!selection) return [];
    return page.locator("[data-orc-node]").evaluateAll(
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
      selection,
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
      bindings: state.bindings,
      revealed: state.revealed,
      history: history.length,
      future: future.length,
    };
    records.push(result);
    return result;
  }
  async function commit(next: State, operation: "edit" | "undo" | "redo", label: string) {
    await record("before " + label);
    const candidate = await render.prepare(next.sources, aliases, entry, next);
    try {
      if (next.selection) {
        const text = resolve(candidate.analysis, next.selection, "text");
        const classes = resolve(candidate.analysis, next.selection, "classes");
        const count = (await selectedView(candidate.page, next.selection)).length;
        if (count !== 1 || (text.kind === "unsupported" && classes.kind === "unsupported")) {
          next = {
            ...next,
            selection: null,
            reason: "Selection invalidated: missing or uncertain source/rendered binding",
          };
        }
      }
      next = {
        ...next,
        revealed: next.revealed.filter((id) => candidate.analysis.usages.get(id)?.length === 1),
      };
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
    const candidate = await render.prepare(sources, aliases, entry, {
      revealed: state.revealed.map((id) => (id === state.selection?.usages[0] ? rootUsage : id)),
    });
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
  async function revealContent(show: boolean) {
    if (!state.selection) throw new Error("Select supported content before Show content");
    const root = state.selection.usages[0];
    if (!root || current.analysis.usages.get(root)?.length !== 1)
      throw new Error("Show content unavailable: uncertain local usage");
    const next = { ...state, revealed: show ? [root] : [] };
    const candidate = await render.prepare(next.sources, aliases, entry, next);
    try {
      if (
        show &&
        ((await candidate.page.getByRole("dialog").count()) !== 1 ||
          (await selectedView(candidate.page, next.selection)).length !== 1)
      )
        throw new Error("Show content unavailable: expected one supported Base UI dialog");
      await persist(next, revision);
    } catch (error) {
      await candidate.context.close();
      throw error;
    }
    await current.context.close();
    current = candidate;
    state = next;
    await record(show ? "Show content" : "Hide content");
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
    showContent: () => revealContent(true),
    hideContent: () => revealContent(false),
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
        analyze(state.sources, aliases, state.bindings),
        state.selection,
        field,
        value,
        commandIdentity,
      );
      const revealed = state.revealed.map((id) => {
        const index = state.selection!.usages.indexOf(id);
        return index < 0 ? id : next.selection.usages[index];
      });
      await commit({ ...state, ...next, revealed, reason: null }, "edit", "change " + field);
    },
    async sourceEdit(next: Sources, label: string) {
      // No inferred lineage for direct source edits; retain only a still-unambiguous token.
      await commit({ ...state, sources: next, bindings: {} }, "edit", label);
    },
    async applyCopiedChange(
      next: { sources: Sources; node: string; rootUsage: string },
      label: string,
    ) {
      const selection = await copiedSelection(next.node, next.rootUsage, next.sources);
      const revealed = state.revealed.map((id) =>
        id === state.selection?.usages[0] ? next.rootUsage : id,
      );
      await commit(
        { ...state, sources: next.sources, selection, bindings: {}, revealed, reason: null },
        "edit",
        label,
      );
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

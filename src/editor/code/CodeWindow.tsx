import { useEffect, useEffectEvent, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { nodeSource } from "../../../shared/source/html-source";
import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import type { ViewState } from "../view-state";

type Props = {
  document: DesignDocument;
  view: ViewState;
  change: (patch: Partial<ViewState>) => void;
  apply: () => Promise<void>;
  disabled: boolean;
  error: string | null;
};

export function CodeWindow(props: Props) {
  const node =
    props.view.selected.length === 1 ? props.document.nodes[props.view.selected[0]] : null;
  if (!node)
    return (
      <section className="code-window">
        <div className="panel-heading">Code</div>
        <p className="panel-empty">Select an object to view its code.</p>
      </section>
    );
  const applied = nodeSource(props.document, node.id);
  const draft = props.view.draft;
  const change = (source: string) =>
    props.change({
      draft:
        source === applied
          ? null
          : {
              nodeId: node.id,
              source,
              baseSource: draft?.baseSource ?? applied,
            },
    });
  return (
    <section className="code-window">
      <CodeHeading {...props} node={node} />
      {draft && node.children.length > 0 && (
        <p className="code-warning">
          Applying this subtree replaces its descendant layer identities.
        </p>
      )}
      {props.error && (
        <p className="code-error" role="alert">
          {node.name} · {props.error}
        </p>
      )}
      <CodeEditor key={node.id} value={draft?.source ?? applied} change={change} />
    </section>
  );
}

function CodeHeading(props: Props & { node: DesignNode }) {
  return (
    <div className="code-heading">
      <div>
        <strong>{props.node.name}</strong>
        <small>{props.node.kind === "svg" ? "SVG" : "HTML"} source · This object</small>
      </div>
      <div className="code-actions">
        {props.view.draft && <span className="code-pending">Unapplied changes</span>}
        <button
          disabled={!props.view.draft || props.disabled}
          onClick={() => props.change({ draft: null })}
        >
          Discard changes
        </button>
        <button
          className="primary"
          disabled={!props.view.draft || props.disabled || isLocked(props.document, props.node.id)}
          onClick={() => void props.apply()}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function CodeEditor({ value, change }: { value: string; change: (value: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const initial = useRef(value);
  const changed = useEffectEvent(change);
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          html(),
          lineNumbers(),
          highlightActiveLine(),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.contentAttributes.of({ "aria-label": "Object source" }),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) changed(update.state.doc.toString());
          }),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, []);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value)
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);
  return <div className="code-editor" ref={host} />;
}

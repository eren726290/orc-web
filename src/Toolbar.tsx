import { Code2, Hand, MousePointer2, Play, Type } from "lucide-react";
import type { ViewState } from "./view-state";

type Props = {
  view: ViewState;
  tool: (tool: ViewState["tool"]) => void;
  code: () => void;
  preview: () => void;
};

export function Toolbar(props: Props) {
  return (
    <nav className="toolbar" aria-label="Canvas tools">
      <button
        aria-pressed={props.view.tool === "select"}
        onClick={() => props.tool("select")}
        title="Select (V)"
      >
        <MousePointer2 size={20} />
        <span>Select</span>
      </button>
      <button
        aria-pressed={props.view.tool === "pan"}
        onClick={() => props.tool("pan")}
        title="Pan (H)"
      >
        <Hand size={20} />
        <span>Pan</span>
      </button>
      <button
        aria-pressed={props.view.tool === "text"}
        onClick={() => props.tool("text")}
        title="Text (T)"
      >
        <Type size={20} />
        <span>Text</span>
      </button>
      <div className="toolbar-divider" />
      <button aria-pressed={props.view.codeOpen} onClick={props.code}>
        <Code2 size={20} />
        <span>Code</span>
      </button>
      <button onClick={props.preview}>
        <Play size={20} />
        <span>Preview</span>
      </button>
    </nav>
  );
}

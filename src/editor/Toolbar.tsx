import { Code2, Hand, MousePointer2, PenTool, Play, Type } from "lucide-react";
import type { ViewState } from "./view-state";

type Props = {
  view: ViewState;
  tool: (tool: ViewState["tool"]) => void;
  code: () => void;
  preview: () => void;
  previewing: boolean;
};

export function Toolbar(props: Props) {
  return (
    <nav className="toolbar" aria-label="Canvas tools">
      <CanvasTools view={props.view} tool={props.tool} previewing={props.previewing} />
      <div className="toolbar-divider" />
      <button aria-pressed={props.view.codeOpen} disabled={props.previewing} onClick={props.code}>
        <Code2 size={20} />
        <span>Code</span>
      </button>
      <button onClick={props.preview} disabled={props.previewing} aria-pressed={props.previewing}>
        <Play size={20} />
        <span>Preview</span>
      </button>
    </nav>
  );
}

const canvasTools = [
  ["select", "Select", "V", MousePointer2],
  ["pan", "Pan", "H", Hand],
  ["text", "Text", "T", Type],
  ["pen", "Pen", "P", PenTool],
] as const;

function CanvasTools(props: Pick<Props, "view" | "tool" | "previewing">) {
  return (
    <>
      {canvasTools.map(([value, label, key, Icon]) => (
        <button
          key={value}
          aria-pressed={props.view.tool === value}
          disabled={props.previewing}
          onClick={() => props.tool(value)}
          title={`${label} (${key})`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </>
  );
}

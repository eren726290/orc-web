import { useEffect, useRef, type MouseEvent } from "react";
import type { DesignDocument } from "../../../shared/document/model";
import type { ViewState } from "../view-state";
import { RenderNode } from "../rendering/renderer";
import "./preview.css";

export type PreviewView = { id: string; width: number; height: number; transform: string };

function preventLinkNavigation(event: MouseEvent<HTMLDivElement>) {
  // ponytail: Links cannot leave Preview until an isolated routing boundary exists.
  if (event.target instanceof Element && event.target.closest("a[href]")) event.preventDefault();
}

export function previewView(id: string, pan: ViewState["pan"]): PreviewView | null {
  const canvas = document.querySelector(".canvas");
  const element = canvas?.querySelector(`[data-orc-id="${CSS.escape(id)}"]`);
  if (!(canvas instanceof HTMLElement) || !element) return null;
  const origin = canvas.getBoundingClientRect();
  const bounds = element.getBoundingClientRect();
  return {
    id,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    transform: `translate(${pan.x + 24 - bounds.left + origin.left}px, ${pan.y + 24 - bounds.top + origin.top}px) scale(${pan.scale})`,
  };
}

export function Preview({
  document,
  view,
  exit,
}: {
  document: DesignDocument;
  view: PreviewView;
  exit: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <section className="frame-preview" aria-label="Frame Preview">
      <header className="preview-heading">
        <span>{document.nodes[view.id]?.name}</span>
        <button ref={button} onClick={exit}>
          Exit Preview
        </button>
      </header>
      <div
        className="preview-viewport"
        onSubmit={(event) => event.preventDefault()}
        onClickCapture={preventLinkNavigation}
        onAuxClickCapture={preventLinkNavigation}
      >
        <div
          className="canvas-world preview-world"
          style={{ width: view.width, height: view.height, transform: view.transform }}
        >
          {document.workspaceRootIds.map((id) => (
            <RenderNode key={id} document={document} id={id} scopeId={view.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

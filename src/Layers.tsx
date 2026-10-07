import { ChevronDown, ChevronRight, Component, Image, Lock, Square, Unlock } from "lucide-react";
import type { Mutation } from "../shared/commands";
import type { DesignDocument, DesignNode } from "../shared/model";
import type { ViewState } from "./view-state";

type Props = {
  document: DesignDocument;
  view: ViewState;
  select: (id: string, extend: boolean) => void;
  expand: (id: string) => void;
  mutate: (mutation: Mutation) => void;
  add: () => void;
};

export function Layers(props: Props) {
  return (
    <section className="layers-panel" aria-label="Layers">
      <div className="panel-heading">
        <span>Layers</span>
        <button onClick={props.add}>+ Add</button>
      </div>
      {props.document.workspaceRootIds.length ? (
        <ul className="layer-list">
          {props.document.workspaceRootIds.map((id) => (
            <LayerBranch key={id} id={id} depth={0} {...props} />
          ))}
        </ul>
      ) : (
        <p className="panel-empty">No layers yet</p>
      )}
    </section>
  );
}

function LayerBranch(props: Props & { id: string; depth: number }) {
  const node = props.document.nodes[props.id];
  const expanded = props.view.expanded.includes(node.id);
  return (
    <li>
      <div
        className={`layer-row ${props.view.selected.includes(node.id) ? "selected" : ""}`}
        style={{ paddingLeft: 8 + props.depth * 16 }}
      >
        <LayerDisclosure node={node} expanded={expanded} expand={props.expand} />
        <button className="layer-name" onClick={(event) => props.select(node.id, event.shiftKey)}>
          <LayerIcon node={node} />
          <span>{node.name}</span>
        </button>
        <button
          className={`layer-lock ${node.locked ? "locked" : ""}`}
          onClick={() => props.mutate({ kind: "lock", id: node.id, locked: !node.locked })}
          aria-label={`${node.locked ? "Unlock" : "Lock"} ${node.name}`}
        >
          {node.locked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
      </div>
      {expanded && (
        <ul>
          {node.children.map((id) => (
            <LayerBranch key={id} {...props} id={id} depth={props.depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function LayerDisclosure({
  node,
  expanded,
  expand,
}: {
  node: DesignNode;
  expanded: boolean;
  expand: Props["expand"];
}) {
  return node.children.length > 0 ? (
    <button
      className="disclosure"
      onClick={() => expand(node.id)}
      aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}
      aria-expanded={expanded}
    >
      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  ) : (
    <span className="disclosure" />
  );
}

function LayerIcon({ node }: { node: DesignNode }) {
  if (node.kind === "text") return <span className="text-marker">Aa</span>;
  if (node.kind === "image") return <Image size={15} />;
  if (node.kind === "svg") return <Component size={15} />;
  return <Square size={15} />;
}

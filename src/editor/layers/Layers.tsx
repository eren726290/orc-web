import { useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Component, Image, Lock, Square, Unlock } from "lucide-react";
import type { Mutation } from "../../../shared/commands/commands";
import { isLocked, type DesignDocument, type DesignNode } from "../../../shared/document/model";
import type { ViewState } from "../view-state";
import { LayerRename } from "./LayerRename";
import "./layers.css";

type Props = {
  document: DesignDocument;
  view: ViewState;
  select: (id: string, extend: boolean) => Promise<boolean>;
  expand: (id: string) => void;
  mutate: (mutation: Mutation) => Promise<boolean>;
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
  const row = useSelectedRow(node.id, props.view);
  const expanded = props.view.expanded.includes(node.id);
  const inheritedLock = node.parentId !== null && isLocked(props.document, node.parentId);
  return (
    <li>
      <div
        ref={row}
        className={`layer-row ${props.view.selected.includes(node.id) ? "selected" : ""}`}
        style={{ paddingInlineStart: 8 + props.depth * 16 }}
      >
        <LayerDisclosure node={node} expanded={expanded} expand={props.expand} />
        <LayerRename
          node={node}
          locked={isLocked(props.document, node.id)}
          inheritedLock={inheritedLock}
          icon={<LayerIcon node={node} />}
          select={props.select}
          mutate={props.mutate}
        />
        <LayerLock node={node} inheritedLock={inheritedLock} mutate={props.mutate} />
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

function useSelectedRow(id: string, view: ViewState) {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view.selected.includes(id)) row.current?.scrollIntoView({ block: "nearest" });
  }, [id, view.selected]);
  return row;
}

function LayerLock({
  node,
  inheritedLock,
  mutate,
}: {
  node: DesignNode;
  inheritedLock: boolean;
  mutate: Props["mutate"];
}) {
  return (
    <button
      className={`layer-lock ${node.locked || inheritedLock ? "locked" : ""}`}
      onClick={() => mutate({ kind: "lock", id: node.id, locked: !node.locked })}
      aria-label={`${node.locked ? "Unlock" : "Lock"} ${node.name}`}
      disabled={inheritedLock}
      title={inheritedLock ? "Unlock the locked parent before editing this layer." : undefined}
    >
      {node.locked || inheritedLock ? <Lock size={13} /> : <Unlock size={13} />}
    </button>
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

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import type { Mutation } from "../../../shared/commands/commands";
import type { DesignNode } from "../../../shared/document/model";

type Props = {
  node: DesignNode;
  locked: boolean;
  inheritedLock: boolean;
  icon: ReactNode;
  select: (id: string, extend: boolean) => Promise<boolean>;
  mutate: (mutation: Mutation) => Promise<boolean>;
};

export function LayerRename(props: Props) {
  const { editing, start, finish, button } = useRename(props);
  const explanation = props.inheritedLock
    ? "Unlock the locked parent before renaming this layer."
    : props.locked
      ? "Unlock this layer before renaming it."
      : "Double-click the name or use Rename to edit this layer's name.";
  return (
    <>
      {editing ? (
        <span className="layer-name-edit">
          {props.icon}
          <NameInput name={props.node.name} finish={finish} readOnly={props.locked} />
        </span>
      ) : (
        <button
          ref={button}
          className="layer-name"
          title={explanation}
          onClick={(event) => {
            if (event.detail < 2) void props.select(props.node.id, event.shiftKey);
          }}
          onDoubleClick={() => void start()}
        >
          {props.icon}
          <span>{props.node.name}</span>
        </button>
      )}
      <button
        className="layer-rename"
        aria-label={`Rename ${props.node.name}`}
        title={explanation}
        disabled={props.locked || editing}
        onClick={() => void start()}
      >
        <Pencil aria-hidden="true" />
      </button>
    </>
  );
}

function useRename(props: Props) {
  const [editing, setEditing] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const start = async () => {
    if (!props.locked && (await props.select(props.node.id, false))) setEditing(true);
  };
  const finish = (value: string, returnFocus = false) => {
    setEditing(false);
    if (returnFocus) requestAnimationFrame(() => button.current?.focus());
    const name = value.trim();
    if (!props.locked && name && name !== props.node.name)
      void props.mutate({ kind: "rename", id: props.node.id, name });
  };
  return { editing, start, finish, button };
}

function NameInput({
  name,
  finish,
  readOnly,
}: {
  name: string;
  finish: (value: string, returnFocus?: boolean) => void;
  readOnly: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return (
    <input
      ref={input}
      aria-label="Layer name"
      defaultValue={name}
      readOnly={readOnly}
      onBlur={(event) => finish(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          finish(event.key === "Escape" ? name : event.currentTarget.value, true);
        }
      }}
    />
  );
}

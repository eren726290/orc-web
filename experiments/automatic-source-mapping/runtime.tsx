import { createContext, createElement, useContext } from "react";
import type { ReactNode, ElementType } from "react";

const Usage = createContext<string[]>([]);

export function Scope({ site, children }: { site: string; children: ReactNode }) {
  const ancestors = useContext(Usage);
  return <Usage value={[...ancestors, site]}>{children}</Usage>;
}

export function Host({
  _orcTag,
  _orcNode,
  _orcRecord = null,
  children,
  ...props
}: {
  _orcTag: string;
  _orcNode: string;
  _orcRecord?: string | number | null;
  children?: ReactNode;
  [prop: string]: unknown;
}) {
  const usage = useContext(Usage);
  return createElement(
    _orcTag,
    {
      ...props,
      "data-orc-node": _orcNode,
      "data-orc-usage": JSON.stringify(usage),
      "data-orc-record": JSON.stringify(_orcRecord),
    },
    children,
  );
}

// Supported Edit-mode view override only. Authored props and Preview defaults remain untouched.
export function RevealDialog({
  _orcPrimitive,
  ...props
}: {
  _orcPrimitive: ElementType;
  [key: string]: unknown;
}) {
  const usages = useContext(Usage);
  const revealed: string[] = Object.getOwnPropertyDescriptor(window, "__orcReveal")?.value ?? [];
  return createElement(_orcPrimitive, {
    ...props,
    ...(usages.some((id) => revealed.includes(id)) ? { open: true } : {}),
  });
}

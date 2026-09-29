import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";

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

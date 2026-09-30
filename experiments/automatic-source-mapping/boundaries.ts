import assert from "node:assert/strict";
import { namedTypes as n } from "ast-types";
import { analyze, resolve } from "./resolver";

// Negative controls for unsupported syntax. IDs below come from analysis, never authored mappings.
export function checkBoundaries() {
  const cases = [
    {
      name: "positive literal prop control",
      source:
        'function View({ title }) { return <h1>{title}</h1>; } export default function App(){return <View title="authored" />;}',
      supported: true,
    },
    {
      name: "nested block shadows prop",
      source:
        'function View({ title }) { { const title = "shadow"; return <h1>{title}</h1>; } } export default function App(){return <View title="authored" />;}',
    },
    {
      name: "nested callable shadows prop",
      source:
        'function View({ title }) { return <div>{[1].map(title => <h1>{title}</h1>)}</div>; } export default function App(){return <View title="authored" />;}',
    },
    {
      name: "spread usage can override literal prop",
      source:
        'const other={title:"override"}; function View({title}){return <h1>{title}</h1>;} export default function App(){return <View title="authored" {...other} />;}',
    },
    {
      name: "identical usages are structurally ambiguous",
      source:
        'function View({title}){return <h1>{title}</h1>;} export default function App(){return <><View title="same"/><View title="same"/></>;}',
    },
    {
      name: "local array shadows module array",
      source:
        'const data=[{code:1,title:"module"}]; export default function App(){const data=[{code:1,title:"local"}];return <div>{data.map(item=><h1 key={item.code}>{item.title}</h1>)}</div>;}',
    },
    {
      name: "React keys collide after string coercion",
      source:
        'const data=[{code:1,title:"number"},{code:"1",title:"string"}]; export default function App(){return <div>{data.map(item=><h1 key={item.code}>{item.title}</h1>)}</div>;}',
    },
    {
      name: "mutated collection is not a static record owner",
      source:
        'const data=[{code:1,title:"authored"}]; data[0].title="runtime"; export default function App(){return <div>{data.map(item=><h1 key={item.code}>{item.title}</h1>)}</div>;}',
    },
  ];
  for (const test of cases) {
    const analysis = analyze({ "control.tsx": test.source }, {});
    const heading = [...analysis.hosts.values()]
      .flat()
      .find(
        (host) =>
          n.JSXIdentifier.check(host.node.openingElement.name) &&
          host.node.openingElement.name.name === "h1",
      );
    assert(heading);
    const owner = resolve(
      analysis,
      { node: heading.id, usages: [...analysis.usages.keys()], record: 1 },
      "text",
    );
    assert.equal(owner.kind === "unsupported", !test.supported, test.name);
  }
  return cases.map((test) => ({ name: test.name, result: "PASS" }));
}

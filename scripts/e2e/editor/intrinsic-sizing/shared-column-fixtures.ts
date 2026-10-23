import { column, frame, layout, withPeer } from "./fixtures";

export function sharedFixture(count = 2, decorated = false) {
  const nodes = withPeer(column("text"));
  const root = nodes[0];
  root.children.splice(1, 0, "fit-a", "fit-b");
  nodes.push(text("fit-a", "Fit sibling"), text("fit-b", "Second Fit sibling"));
  if (count === 3) {
    root.children.push("third");
    nodes.push(
      frame("third", "root", [], { ...layout, width: "50px", height: "40px", "min-height": "0px" }),
    );
  }
  if (decorated) decorate(nodes);
  return nodes;
}
function text(id: string, value: string) {
  const node = column("text")[2];
  if (node.kind !== "text") throw new Error("Expected text fixture");
  return { ...node, id, name: id, parentId: "root", runs: [{ text: value, style: {} }] };
}
function decorate(nodes: ReturnType<typeof sharedFixture>) {
  Object.assign(nodes[0].style, { padding: "7px 11px", border: "2px solid black" });
  Object.assign(nodes[1].style, {
    padding: "3px",
    border: "2px solid black",
    "margin-top": "3px",
    "margin-bottom": "5px",
  });
  const peer = nodes.find((item) => item.id === "peer");
  if (!peer) throw new Error("Expected peer");
  Object.assign(peer.style, {
    "box-sizing": "content-box",
    padding: "7px",
    border: "1px solid black",
    "margin-top": "7px",
    "margin-bottom": "1px",
  });
}

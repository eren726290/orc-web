import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseDocument, parseNode, validateDocument } from "../../../../shared/document/document";
import { emptyDocument } from "../../../../shared/document/model";
import { parsePenRecord } from "../../../../shared/pen/record";
import { penIdentity } from "../../../../shared/pen/model";
import { penBounds } from "../../../../shared/pen/bounds";
import { penRecord } from "../../../../shared/pen/source";
import { nodeSource } from "../../../../shared/source/html-source";
import { sourceEvidence } from "../../../support/editor-evidence";
import {
  arcFixture,
  badgeFixture,
  lineFixture,
  oppositeArcsFixture,
} from "../../../solver/fixtures";
import { circleFixture, nodeFixture } from "./fixtures";

const checks: string[] = [];
const base = penRecord(badgeFixture());
const invalid: [string, unknown, RegExp][] = [
  ["unknown version", { ...base, version: 2 }, /Unsupported pen record version/u],
  ["unknown data", { ...base, future: true }, /Unsupported pen record field/u],
  ["missing list", { ...base, segments: null }, /collection/u],
  [
    "nonfinite coordinate",
    { ...base, anchors: [{ ...base.anchors[0], x: Infinity }, ...base.anchors.slice(1)] },
    /finite/u,
  ],
  [
    "coordinate range",
    { ...base, anchors: [{ ...base.anchors[0], x: 1e9 }, ...base.anchors.slice(1)] },
    /smaller/u,
  ],
  ["duplicate identity", { ...base, rules: [{ ...base.rules[0], id: "a1" }] }, /unique/u],
  [
    "disconnected segment",
    { ...base, segments: [{ ...base.segments[0], from: "unknown" }, ...base.segments.slice(1)] },
    /path order/u,
  ],
  ["wrong closure", { ...base, closed: false }, /connected/u],
  ["unknown rule", { ...base, rules: [{ id: "r1", kind: "parallel" }] }, /Unsupported pen rule/u],
  [
    "invalid rule reference",
    { ...base, rules: [{ id: "r1", kind: "horizontal", segment: "missing" }] },
    /unknown segment/u,
  ],
  [
    "wrong rule geometry",
    { ...base, rules: [{ id: "r1", kind: "horizontal", segment: "s4" }] },
    /keep horizontal/u,
  ],
  ["wrong hash", { ...base, geometryHash: "0000000000000000" }, /hash/u],
  [
    "unknown center data",
    {
      ...base,
      segments: [
        base.segments[0],
        { ...base.segments[1], center: { x: 100, y: 100, z: 0 } },
        ...base.segments.slice(2),
      ],
    },
    /arc center field/u,
  ],
];

function roundTrips(): void {
  for (const path of [
    lineFixture(),
    arcFixture(),
    arcFixture(-1),
    badgeFixture(),
    oppositeArcsFixture(),
    circleFixture(),
  ]) {
    const node = nodeFixture(path);
    assert.deepEqual(parsePenRecord(JSON.parse(JSON.stringify(node.pen))), node.pen);
    assert.deepEqual(parseNode(JSON.parse(JSON.stringify(node))), node);
    const document = emptyDocument();
    document.nodes[node.id] = node;
    document.workspaceRootIds = [node.id];
    assert.deepEqual(parseDocument(JSON.parse(JSON.stringify(document))), document);
    const source = nodeSource(document, node.id);
    assert.ok(source.includes(node.attributes.viewBox));
    assert.ok(!/geometryHash|anchors|segments|rules|data-orc-pen/u.test(source));
  }
  checks.push(
    "line, both arc directions, closed path and two-arc circle round-trip without public metadata",
  );
}

function invalidNodes(): void {
  const node = nodeFixture();
  const cases = [
    { ...node, source: node.source.replace("M 0 0", "M 1 0") },
    { ...node, source: node.source.replace("<path", '<path transform="translate(1)"') },
    { ...node, source: node.source.replace("</svg>", '<circle r="10"/></svg>') },
    { ...node, attributes: { ...node.attributes, viewBox: "0 0 1 1" } },
    { ...node, attributes: { ...node.attributes, "stroke-width": "20" } },
    { ...node, attributes: { ...node.attributes, "vector-effect": "non-scaling-stroke" } },
    { ...node, style: { ...node.style, "stroke-width": "20" } },
    { ...node, children: ["child"] },
  ];
  for (const candidate of cases) assert.throws(() => parseNode(candidate));
  const document = emptyDocument();
  document.nodes[node.id] = cases[0];
  document.workspaceRootIds = [node.id];
  assert.throws(() => validateDocument(document), /does not match/u);
  const { pen: _pen, ...ordinary } = node;
  assert.deepEqual(
    parseNode({ ...ordinary, source: '<svg><rect width="100" height="20"/></svg>' }).kind,
    "svg",
  );
  checks.push(
    "source, transforms, extra artwork, public bounds and direct typed candidates are independently validated",
  );
}

function boundsAndIdentities(): void {
  const padded = nodeFixture();
  padded.attributes.viewBox = "-10 -10 220 220";
  assert.deepEqual(parseNode(padded), padded);
  assert.deepEqual(penBounds(badgeFixture(), 2), { x: -1, y: -1, width: 202, height: 202 });
  assert.deepEqual(penBounds(circleFixture(), 2), { x: -51, y: -1, width: 102, height: 102 });
  assert.deepEqual(penBounds(lineFixture(), 0), { x: 10, y: 10, width: 70, height: 1 });
  const ids = Array.from({ length: 128 }, () => penIdentity("a"));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith("a")));
  checks.push(
    "independent arc-extrema and round-stroke bounds, zero-thickness minimum, fresh identities",
  );
}

mkdirSync("artifacts/pen-data", { recursive: true });
try {
  roundTrips();
  invalidNodes();
  boundsAndIdentities();
  for (const [name, input, message] of invalid) {
    assert.throws(() => parsePenRecord(input), message, name);
    checks.push(name);
  }
  writeFileSync(
    "artifacts/pen-data/record-result.json",
    JSON.stringify(
      {
        ...sourceEvidence(),
        command: "bun scripts/e2e/editor/pen/check-record.ts",
        checks,
        invalid,
      },
      null,
      2,
    ),
  );
  console.log(`PEN_RECORD_PASSED ${checks.length} groups`);
} catch (error) {
  writeFileSync(
    "artifacts/pen-data/record-result.json",
    JSON.stringify({ ...sourceEvidence(), checks, failed: String(error) }, null, 2),
  );
  throw error;
}

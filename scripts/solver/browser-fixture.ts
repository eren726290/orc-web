import type { PenGeometry } from "../../shared/pen/model";
import { penPathData } from "../../shared/pen/source";
import { arcFixture, badgeFixture, lineFixture, oppositeArcsFixture } from "./fixtures";
import { solverChecks } from "./checks";
import { check, close } from "./oracle";

function nativePath(name: string, geometry: PenGeometry): SVGPathElement {
  const figure = document.createElement("figure");
  const caption = document.createElement("figcaption");
  caption.textContent = name;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "280");
  svg.setAttribute("height", "240");
  svg.setAttribute("viewBox", "-60 -110 300 340");
  const path = document.createElementNS(svg.namespaceURI, "path");
  check(path instanceof SVGPathElement, "Native SVG path unavailable.");
  path.setAttribute("d", penPathData(geometry));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#222");
  path.setAttribute("stroke-width", "1");
  svg.append(path);
  figure.append(caption, svg);
  document.body.append(figure);
  return path;
}

function nativeArcChecks(): string[] {
  for (const sign of [1, -1]) {
    const path = nativePath(
      sign === 1 ? "Clockwise arc" : "Counterclockwise arc",
      arcFixture(sign),
    );
    close(path.getTotalLength(), 100 + 15 * Math.PI, "Native line/arc/line length", 0.05);
    const midpoint = path.getPointAtLength(50 + 7.5 * Math.PI);
    close(midpoint.x, 30 / Math.sqrt(2), "Native arc midpoint x", 0.02);
    close(midpoint.y, sign * 30 * (1 - 1 / Math.sqrt(2)), "Native arc midpoint side", 0.02);
  }
  const badge = nativePath("Exactly closed badge", badgeFixture());
  close(badge.getTotalLength(), 400 + 100 * Math.PI, "Native closed path length", 0.1);
  const halfway = badge.getPointAtLength(100 + 50 * Math.PI);
  close(halfway.x, 200, "Native semicircle midpoint x", 0.03);
  close(halfway.y, 100, "Native semicircle midpoint y", 0.03);
  const opposite = nativePath("Consecutive opposite-turn arcs", oppositeArcsFixture());
  close(opposite.getTotalLength(), 80 + 20 * Math.PI, "Native opposite-turn arc length", 0.05);
  const tiny = lineFixture();
  tiny.anchors = [
    { id: "a1", x: 0, y: 0 },
    { id: "a2", x: 0.0004, y: 0 },
  ];
  close(
    nativePath("Tiny emitted segment", tiny).getTotalLength(),
    0.0004,
    "Tiny native SVG length",
    1e-8,
  );
  return [
    "both SVG sweep directions",
    "independent arc midpoints",
    "exact closed geometry",
    "opposite arcs",
    "tiny emitted line",
  ];
}

async function main() {
  const response = await fetch("/pen-solver.wasm");
  check(response.ok, `WASM request failed: ${response.status}.`);
  const bytes = await response.clone().arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const sha256 = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const module = await WebAssembly.compileStreaming(response);
  const numerical = solverChecks(module);
  const native = nativeArcChecks();
  document.body.dataset.result = JSON.stringify({
    numerical,
    native,
    sha256,
    bytes: bytes.byteLength,
  });
}

main().catch((error: unknown) => {
  document.body.dataset.result = JSON.stringify({
    failed: error instanceof Error ? error.stack : String(error),
  });
});

import { readdir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";
import { parseCommand } from "../shared/commands";
import { boolean, nonnegativeInteger, object, string } from "../shared/validation";
import type { Projects } from "./projects";

export async function readRoute(request: Request, projects: Projects): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/session") return Response.json(projects.snapshot());
  if (url.pathname === "/api/history-impact")
    return Response.json(
      projects.historyImpact(
        string(url.searchParams.get("projectId")),
        historyDirection(url.searchParams.get("direction")),
        string(url.searchParams.get("nodeId")),
      ),
    );
  if (url.pathname === "/api/folders") {
    const path = await realpath(url.searchParams.get("path") || homedir());
    const entries = await readdir(path, { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort();
    return Response.json({ path, parent: dirname(path), directories });
  }
  return staticResponse(url.pathname);
}

export async function writeRoute(request: Request, projects: Projects): Promise<Response> {
  const path = new URL(request.url).pathname;
  const input = object(await request.json());
  switch (path) {
    case "/api/projects/new":
      projects.create();
      break;
    case "/api/projects/activate":
      projects.activate(string(input.projectId));
      break;
    case "/api/projects/open":
      await projects.load(string(input.path));
      break;
    case "/api/projects/save":
      await projects.saveAs(string(input.projectId), string(input.parent), string(input.name));
      break;
    case "/api/projects/retry":
      await projects.retry(string(input.projectId));
      break;
    case "/api/projects/close":
      await projects.close(string(input.projectId), boolean(input.discard));
      break;
    case "/api/commands":
      await projects.execute(parseCommand(input));
      break;
    case "/api/history":
      projects.history(
        string(input.projectId),
        nonnegativeInteger(input.expectedRevision),
        historyDirection(input.direction),
      );
      break;
    default:
      return Response.json({ error: "Unknown application action." }, { status: 404 });
  }
  return Response.json(projects.snapshot());
}

function historyDirection(value: unknown): "undo" | "redo" {
  if (value === "undo" || value === "redo") return value;
  throw new Error("Invalid history action.");
}

async function staticResponse(pathname: string): Promise<Response> {
  const root = resolve("dist");
  const path = resolve(root, `.${decodeURIComponent(pathname === "/" ? "/index.html" : pathname)}`);
  if (!path.startsWith(`${root}${sep}`)) return new Response("Not found", { status: 404 });
  const file = Bun.file(path);
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  return new Response(file);
}

export function validateOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin === null) return;
  const url = new URL(origin);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("ORC-web accepts local requests only.");
  }
}

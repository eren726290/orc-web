import { Projects, message } from "./projects/projects";
import { readRoute, validateOrigin, writeRoute } from "./http/http";
import { closeRenderingBrowser } from "./rendering/rendering";

const projects = new Projects();
let pending: Promise<unknown> = Promise.resolve();
let stopping = false;
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.ORC_PORT ?? 3000),
  maxRequestBodySize: 16 * 1024 * 1024,
  async fetch(request) {
    try {
      if (stopping)
        return Response.json({ error: "ORC-web is finishing pending saves." }, { status: 503 });
      validateOrigin(request);
      if (request.method === "GET") return await readRoute(request, projects);
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      const result = pending.then(() => writeRoute(request, projects));
      pending = result.catch(() => undefined);
      return await result;
    } catch (error) {
      return Response.json({ error: message(error) }, { status: 400 });
    }
  },
});

process.stdout.write(`ORC_BACKEND_URL=${server.url}\n`);
if (!process.env.ORC_DEV) process.stdout.write(`Open ORC-web: ${server.url}\n`);

async function shutdown(): Promise<void> {
  if (stopping) return;
  stopping = true;
  try {
    await pending;
    await projects.shutdown();
    await closeRenderingBrowser();
    await server.stop();
    process.stdout.write("ORC_SHUTDOWN_COMPLETE\n");
    process.exit(0);
  } catch (error) {
    stopping = false;
    process.stderr.write(`${message(error)}\n`);
  }
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

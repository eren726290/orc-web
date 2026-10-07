import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";

const backend = spawn(process.execPath, ["server/start.ts"], {
  env: { ...process.env, ORC_PORT: "0", ORC_DEV: "1" },
  stdio: ["inherit", "pipe", "inherit"],
});

const backendUrl = await new Promise<string>((resolve, reject) => {
  const lines = createInterface({ input: backend.stdout });
  lines.on("line", (line: string) => {
    if (line.startsWith("ORC_BACKEND_URL=")) resolve(line.slice("ORC_BACKEND_URL=".length));
    else process.stdout.write(`${line}\n`);
  });
  backend.once("error", reject);
  backend.once("exit", (code) => reject(new Error(`Backend stopped during startup (${code}).`)));
});

const http = createHttpServer();
const frontend = await createServer({
  server: {
    middlewareMode: true,
    hmr: { server: http },
    proxy: { "/api": { target: backendUrl } },
  },
});
http.on("request", frontend.middlewares);
await new Promise<void>((resolve, reject) => {
  http.once("error", reject);
  http.listen(Number(process.env.ORC_DEV_PORT ?? 5173), "127.0.0.1", resolve);
});
const address = http.address();
if (!address || typeof address === "string") throw new Error("The editor address is unavailable.");
process.stdout.write(
  `Open ORC-web: http://127.0.0.1:${address.port}/\nORC_EDITOR_URL=http://127.0.0.1:${address.port}/\n`,
);

backend.once("exit", async (code) => {
  await frontend.close();
  await new Promise<void>((resolve) => http.close(() => resolve()));
  process.exit(code ?? 1);
});

const stop = () => {
  backend.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

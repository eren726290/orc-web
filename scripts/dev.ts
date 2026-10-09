import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "vite";

const backend = spawn(process.execPath, ["server/start.ts"], {
  env: { ...process.env, ORC_PORT: "0", ORC_DEV: "1" },
  stdio: ["inherit", "pipe", "inherit"],
});
const exited = new Promise<number>((resolve) => {
  backend.once("exit", (code) => resolve(code ?? 1));
  backend.once("error", () => resolve(1));
});
const http = createHttpServer();
let frontend: Awaited<ReturnType<typeof createServer>> | undefined;
const stop = () => {
  backend.kill("SIGTERM");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
let code = 1;
try {
  await startFrontend();
  code = await exited;
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Development startup failed."}\n`,
  );
  stop();
  await exited;
} finally {
  await frontend?.close();
  await new Promise<void>((resolve) => http.close(() => resolve()));
}
process.exit(code);

function backendAddress(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const lines = createInterface({ input: backend.stdout });
    lines.on("line", (line: string) => {
      if (line.startsWith("ORC_BACKEND_URL=")) resolve(line.slice("ORC_BACKEND_URL=".length));
      else process.stdout.write(`${line}\n`);
    });
    backend.once("error", reject);
    backend.once("exit", (code) => reject(new Error(`Backend stopped during startup (${code}).`)));
  });
}

async function startFrontend(): Promise<void> {
  const backendUrl = await backendAddress();
  frontend = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server: http },
      proxy: { "/api": { target: backendUrl } },
    },
  });
  assertBackendRunning();
  http.on("request", frontend.middlewares);
  await new Promise<void>((resolve, reject) => {
    http.once("error", reject);
    http.listen(Number(process.env.ORC_DEV_PORT ?? 5173), "127.0.0.1", resolve);
  });
  assertBackendRunning();
  const address = http.address();
  if (!address || typeof address === "string")
    throw new Error("The editor address is unavailable.");
  process.stdout.write(
    `Open ORC-web: http://127.0.0.1:${address.port}/\nORC_EDITOR_URL=http://127.0.0.1:${address.port}/\n`,
  );
}

function assertBackendRunning(): void {
  if (backend.exitCode !== null || backend.signalCode !== null)
    throw new Error("Backend stopped during development startup.");
}

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

export async function launchApp(mode: "development" | "built") {
  const child = spawn(process.execPath, [mode === "built" ? "server/start.ts" : "scripts/dev.ts"], {
    env: {
      ...process.env,
      ORC_PORT: "0",
      ORC_DEV_PORT: "0",
      ORC_RENDER_BROWSER: process.argv[2] ?? "chromium",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const output: string[] = [];
  child.stderr.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  const exited = new Promise<number | null>((resolve) => child.once("exit", resolve));
  const url = await startupUrl(child, mode, output);
  return {
    url,
    output,
    child,
    stop: async () => {
      child.kill("SIGTERM");
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          exited,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              child.kill("SIGKILL");
              reject(new Error("Test application failed to shut down."));
            }, 15_000);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function startupUrl(
  child: ReturnType<typeof spawn>,
  mode: "development" | "built",
  output: string[],
) {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Application startup timed out."));
    }, 20_000);
    const prefix = mode === "built" ? "ORC_BACKEND_URL=" : "ORC_EDITOR_URL=";
    if (!child.stdout) throw new Error("Test application output is unavailable.");
    createInterface({ input: child.stdout }).on("line", (line: string) => {
      output.push(line);
      if (line.startsWith(prefix)) {
        clearTimeout(timer);
        resolve(line.slice(prefix.length));
      }
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Application exited during startup (${code}): ${output.join("\n")}`));
    });
  });
}

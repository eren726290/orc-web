import { sha256, bytes as expectedBytes } from "../../../solver/pen/build.json";

let compiled: Promise<WebAssembly.Module> | null = null;

async function load(): Promise<WebAssembly.Module> {
  const response = await fetch(new URL("../../../shared/pen/pen-solver.wasm", import.meta.url));
  if (!response.ok) throw new Error("Pen could not load. Choose Pen again to retry.");
  const bytes = await response.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hash = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (bytes.byteLength !== expectedBytes || hash !== sha256)
    throw new Error("The Pen solver asset does not match this build. Reload ORC and try again.");
  const module = await WebAssembly.compile(bytes);
  if (WebAssembly.Module.imports(module).length)
    throw new Error("The Pen solver requires unsupported host imports.");
  return module;
}

export function penModule(): Promise<WebAssembly.Module> {
  compiled ??= load().catch((error: unknown) => {
    compiled = null;
    if (error instanceof TypeError)
      throw new Error("Pen could not load. Click the canvas to retry.", {
        cause: error,
      });
    throw error;
  });
  return compiled;
}

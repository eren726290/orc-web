import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, readlink, rename, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parseSession } from "../../shared/session/session";

type Process = { pid: number; group: number; state: string; args: string };

if (process.platform !== "linux")
  throw new Error("Lifecycle process inspection requires Linux /proc.");
await mkdir("artifacts/editor", { recursive: true });
const directory = await mkdtemp("artifacts/editor/lifecycle-");
const checks: Record<string, unknown>[] = [];
try {
  await occupiedPort();
  await normalShutdown();
  await saveFailure();
} finally {
  const sources = ["scripts/dev.ts", "scripts/runtime/check-lifecycle.ts", "server/start.ts"];
  const hashes = await Promise.all(
    sources.map(async (path) => [
      path,
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    ]),
  );
  await writeFile(
    join(directory, "evidence.json"),
    `${JSON.stringify(
      {
        commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
        command: "bun scripts/runtime/check-lifecycle.ts",
        date: new Date().toISOString(),
        platform: process.platform,
        bun: process.versions.bun,
        sources: Object.fromEntries(hashes),
        checks,
      },
      null,
      2,
    )}\n`,
  );
}
process.stdout.write(`development lifecycle passed: ${directory}\n`);

function start(port: number) {
  const child = spawn(process.execPath, ["scripts/dev.ts"], {
    env: { ...process.env, ORC_DEV_PORT: String(port), ORC_RENDER_BROWSER: "chromium" },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.ok(child.pid);
  const pid = child.pid;
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  const exited = new Promise<number | null>((resolve) => child.once("exit", resolve));
  return { child, pid, exited, output: () => output };
}

async function processes(group: number): Promise<Process[]> {
  const entries = await readdir("/proc");
  const records = await Promise.all(
    entries.filter((entry) => /^\d+$/u.test(entry)).map(readProcess),
  );
  return records.filter(
    (entry): entry is Process => entry !== null && entry.group === group && entry.state !== "Z",
  );
}

async function readProcess(entry: string): Promise<Process | null> {
  try {
    const [stat, command] = await Promise.all([
      readFile(`/proc/${entry}/stat`, "utf8"),
      readFile(`/proc/${entry}/cmdline`, "utf8"),
    ]);
    const fields = stat.slice(stat.lastIndexOf(") ") + 2).split(" ");
    return {
      pid: Number(entry),
      group: Number(fields[2]),
      state: fields[0],
      args: command.replaceAll("\0", " "),
    };
  } catch {
    return null;
  }
}

async function backendPort(pid: number): Promise<number> {
  const descriptors = await readdir(`/proc/${pid}/fd`);
  const links = await Promise.all(
    descriptors.map((fd) => readlink(`/proc/${pid}/fd/${fd}`).catch(() => "")),
  );
  const sockets = new Set(
    links.filter((link) => link.startsWith("socket:[")).map((link) => link.slice(8, -1)),
  );
  const lines = (await readFile("/proc/net/tcp", "utf8")).split("\n").slice(1);
  for (const line of lines) {
    const fields = line.trim().split(/\s+/u);
    if (fields[3] === "0A" && sockets.has(fields[9]))
      return Number.parseInt(fields[1].split(":")[1], 16);
  }
  return 0;
}

async function until<T>(read: () => T | Promise<T>, description: string): Promise<NonNullable<T>> {
  const deadline = Date.now() + 10_000;
  while (true) {
    const result = await read();
    if (result) return result;
    assert.ok(Date.now() < deadline, description);
    await delay(10);
  }
}

async function finish(app: ReturnType<typeof start>, name: string) {
  const before = await processes(app.pid);
  for (const entry of before) signal(entry.pid, "SIGTERM");
  const deadline = Date.now() + 3_000;
  while ((await processes(app.pid)).length > 0 && Date.now() < deadline) await delay(20);
  const forced = await processes(app.pid);
  for (const entry of forced) signal(entry.pid, "SIGKILL");
  await app.exited;
  await until(
    async () => (await processes(app.pid)).length === 0,
    "The check must clean up its owned processes",
  );
  await writeFile(join(directory, `${name}.log`), app.output());
  checks.push({ name: `${name} cleanup`, forced, remaining: await processes(app.pid) });
  assert.deepEqual(await processes(app.pid), [], "The check must clean up its owned processes");
}

function signal(pid: number, value: NodeJS.Signals) {
  try {
    process.kill(pid, value);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;
  }
}

async function exitWithin(app: ReturnType<typeof start>) {
  const deadline = Date.now() + 10_000;
  while (app.child.exitCode === null && app.child.signalCode === null) {
    assert.ok(Date.now() < deadline, `Development process did not exit: ${app.output()}`);
    await delay(10);
  }
  return app.exited;
}

async function occupiedPort() {
  const listener = createServer();
  await new Promise<void>((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const address = listener.address();
  assert.ok(address && typeof address !== "string");
  const app = start(address.port);
  try {
    assert.equal(await exitWithin(app), 1);
    assert.match(app.output(), /EADDRINUSE|port .* in use/u);
    const survivors = await processes(app.pid);
    checks.push({ name: "occupied editor port", port: address.port, survivors });
    assert.deepEqual(survivors, [], "Startup failure must not leave its backend running");
  } finally {
    await finish(app, "occupied-port");
    await new Promise<void>((resolve) => listener.close(() => resolve()));
  }
}

async function ready(app: ReturnType<typeof start>) {
  const url = await until(
    () => app.output().match(/^ORC_EDITOR_URL=(.+)$/mu)?.[1],
    "No editor startup marker",
  );
  const backend = (await processes(app.pid)).find((entry) =>
    entry.args.includes("server/start.ts"),
  );
  assert.ok(backend, "The process absence check must first find the live backend");
  const port = await backendPort(backend.pid);
  assert.ok(port, "The live backend must have an HTTP listener");
  const backendUrl = `http://127.0.0.1:${port}/`;
  assert.equal((await fetch(new URL("api/session", url))).status, 200);
  assert.equal((await fetch(new URL("api/session", backendUrl))).status, 200);
  return { url, backendUrl, backendPid: backend.pid };
}

async function normalShutdown() {
  const app = start(0);
  try {
    const live = await ready(app);
    app.child.kill("SIGTERM");
    assert.equal(await exitWithin(app), 0);
    assert.match(app.output(), /ORC_SHUTDOWN_COMPLETE/u);
    assert.deepEqual(await processes(app.pid), []);
    for (const url of [live.url, live.backendUrl]) {
      await assert.rejects(
        fetch(new URL("api/session", url), { signal: AbortSignal.timeout(1_000) }),
      );
    }
    checks.push({ name: "normal shutdown", ...live, childExit: app.child.exitCode });
  } finally {
    await finish(app, "normal-shutdown");
  }
}

async function session(url: string, action?: string, data?: unknown) {
  const response = await fetch(
    new URL(action ?? "api/session", url),
    action
      ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(data),
        }
      : undefined,
  );
  assert.equal(response.status, 200, await response.clone().text());
  return parseSession(await response.json());
}

async function saveFailure() {
  const app = start(0);
  const folder = join(directory, "Shutdown.orc");
  const moved = `${folder}.moved`;
  let projectId: string | undefined;
  let url: string | undefined;
  try {
    url = (await ready(app)).url;
    const created = await session(url, "api/projects/new", {});
    projectId = created.activeProjectId ?? undefined;
    assert.ok(projectId);
    await session(url, "api/projects/save", { projectId, parent: directory, name: "Shutdown" });
    await rename(folder, moved);
    const failed = await failSave(url, projectId, moved);
    app.child.kill("SIGTERM");
    await until(
      () => app.output().includes("Keep ORC-web open"),
      "Shutdown must report failed save recovery",
    );
    assert.equal(app.child.exitCode, null);
    assert.deepEqual(await session(url), failed);
    await rename(moved, folder);
    const retried = await retrySave(url, projectId, folder);
    assert.deepEqual(retried.projects[0]?.document, failed.projects[0]?.document);
    app.child.kill("SIGTERM");
    assert.equal(await exitWithin(app), 0);
    await assert.rejects(readFile(join(folder, ".orc.lock")), { code: "ENOENT" });
    checks.push({ name: "failed save retains application and Retry permits shutdown", projectId });
  } finally {
    await rename(moved, folder).catch(() => undefined);
    try {
      if (url && projectId && app.child.exitCode === null)
        await session(url, "api/projects/retry", { projectId });
    } finally {
      await finish(app, "failed-save");
    }
  }
}

async function failSave(url: string, projectId: string, moved: string) {
  const before = (await session(url)).projects[0]?.document;
  const node = {
    kind: "text",
    id: crypto.randomUUID(),
    name: "Retained text",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    style: {},
    attributes: {},
    tag: "p",
    runs: [{ text: "Retained after save failure", style: {} }],
  };
  await session(url, "api/commands", {
    projectId,
    expectedRevision: 0,
    commandId: crypto.randomUUID(),
    mutation: { kind: "insert", nodes: [node] },
  });
  const failed = await until(async () => {
    const current = await session(url);
    return current.projects[0]?.saveStatus.kind === "failed" ? current : null;
  }, "The test must observe a real failed save");
  assert.equal(failed.projects[0]?.document.revision, 1);
  assert.equal(failed.projects[0]?.canUndo, true);
  assert.deepEqual(failed.projects[0]?.document.nodes[node.id], node);
  assert.deepEqual(JSON.parse(await readFile(join(moved, "document.json"), "utf8")), before);
  return failed;
}

async function retrySave(url: string, projectId: string, folder: string) {
  const retried = await session(url, "api/projects/retry", { projectId });
  assert.equal(retried.projects[0]?.saveStatus.kind, "saved");
  assert.deepEqual(
    JSON.parse(await readFile(join(folder, "document.json"), "utf8")),
    retried.projects[0]?.document,
  );
  return retried;
}

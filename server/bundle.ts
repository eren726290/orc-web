import { mkdir, open, readFile, realpath, rename, rm } from "node:fs/promises";
import { hostname } from "node:os";
import { join, resolve } from "node:path";
import { parseDocument } from "../shared/document";
import type { DesignDocument } from "../shared/model";
import { object, string } from "../shared/validation";

export type WritableBundle = { path: string; release: () => Promise<void> };

export async function acquireBundle(folder: string): Promise<WritableBundle> {
  const path = await realpath(resolve(folder));
  if (!path.endsWith(".orc")) throw new Error("Choose an .orc project folder.");
  const lockPath = join(path, ".orc.lock");
  await removeStaleLock(lockPath);
  const handle = await open(lockPath, "wx").catch(() => {
    throw new Error("This project is already open for writing.");
  });
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid, host: hostname() }));
  } finally {
    await handle.close();
  }
  return { path, release: () => rm(lockPath, { force: true }) };
}

async function removeStaleLock(lockPath: string): Promise<void> {
  const raw = await readFile(lockPath, "utf8").catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  if (raw === null) return;
  const lock = object(JSON.parse(raw));
  if (typeof lock.pid !== "number") throw new Error("The project lock cannot be read.");
  if (string(lock.host) === hostname() && processExists(lock.pid)) return;
  await rm(lockPath);
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false;
    return true;
  }
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export async function readBundle(path: string): Promise<DesignDocument> {
  const raw = await readFile(join(path, "document.json"), "utf8");
  return parseDocument(JSON.parse(raw));
}

export async function createBundle(parent: string, name: string): Promise<WritableBundle> {
  const trimmed = name.trim();
  const controlCharacter = [...trimmed].some((character) => character.charCodeAt(0) < 32);
  if (!trimmed || /[<>:"/\\|?*]/u.test(trimmed) || controlCharacter || /[. ]$/u.test(trimmed)) {
    throw new Error("Choose a project name without reserved filename characters.");
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(trimmed))
    throw new Error("That project name is reserved.");
  const path = join(await realpath(parent), `${trimmed}.orc`);
  await mkdir(path);
  return acquireBundle(path);
}

export async function writeBundle(path: string, document: DesignDocument): Promise<void> {
  const temporary = join(path, `.document-${crypto.randomUUID()}.tmp`);
  try {
    const handle = await open(temporary, "wx");
    try {
      await handle.writeFile(`${JSON.stringify(document, null, 2)}\n`);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, join(path, "document.json"));
  } finally {
    await rm(temporary, { force: true });
  }
}

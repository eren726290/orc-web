import { mkdir, open, readFile, realpath, rename, rm, rmdir } from "node:fs/promises";
import { hostname } from "node:os";
import { join, resolve } from "node:path";
import { parseDocument } from "../../shared/document/document";
import type { DesignDocument } from "../../shared/document/model";

export type WritableBundle = { path: string; release: () => Promise<void> };

export async function acquireBundle(folder: string): Promise<WritableBundle> {
  const path = await realpath(resolve(folder));
  if (!path.endsWith(".orc")) throw new Error("Choose an .orc project folder.");
  const lockPath = join(path, ".orc.lock");
  const handle = await open(lockPath, "wx").catch((error: unknown) => {
    if (hasCode(error, "EEXIST"))
      throw new Error(
        "This project has an existing .orc.lock. Close its owning ORC-web session. If that session no longer exists, confirm the project has no other writer before removing the lock file.",
      );
    throw error;
  });
  try {
    try {
      await handle.writeFile(JSON.stringify({ pid: process.pid, host: hostname() }));
    } finally {
      await handle.close();
    }
  } catch (error) {
    return failAfterCleanup(error, () => rm(lockPath, { force: true }));
  }
  return { path, release: () => rm(lockPath, { force: true }) };
}

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code;
}

async function removeEmptyFolder(path: string): Promise<void> {
  try {
    await rmdir(path);
  } catch (error: unknown) {
    if (!hasCode(error, "ENOENT") && !hasCode(error, "ENOTEMPTY")) throw error;
  }
}

async function failAfterCleanup(error: unknown, cleanup: () => Promise<void>): Promise<never> {
  try {
    await cleanup();
  } catch (cleanupError) {
    throw new Error(`${String(error)} Cleanup also failed: ${String(cleanupError)}`, {
      cause: error,
    });
  }
  throw error;
}

export async function rollbackNewBundle(bundle: WritableBundle, error: unknown): Promise<never> {
  return failAfterCleanup(error, async () => {
    await bundle.release();
    await removeEmptyFolder(bundle.path);
  });
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
  try {
    return await acquireBundle(path);
  } catch (error) {
    return failAfterCleanup(error, () => removeEmptyFolder(path));
  }
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

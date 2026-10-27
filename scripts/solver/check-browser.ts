import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { chromium } from "playwright";
import { object } from "../../shared/validation";
import { sourceEvidence } from "../support/editor-evidence";
import { checkBuild } from "./check-build";

const directory = "artifacts/pen-solver/browser";
mkdirSync(directory, { recursive: true });
const executable =
  process.env.ORC_CHROME_EXECUTABLE ??
  "/home/eren/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome";
const browserIdentity = execFileSync(executable, ["--version"], { encoding: "utf8" }).trim();
const evidence = {
  ...sourceEvidence(),
  executable,
  browserIdentity,
  command: "bun scripts/solver/check-browser.ts",
  mode: "standalone HTTP-loaded bundled fixture, not ORC application",
};

async function runBrowser(origin: string) {
  const browser = await chromium.launch({ executablePath: executable, headless: true });
  const errors: string[] = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1200, height: 1000 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    try {
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(origin);
      await page.waitForFunction(() => document.body.dataset.result !== undefined);
      const data = await page.locator("body").getAttribute("data-result");
      assert.ok(data);
      const result = object(JSON.parse(data));
      assert.equal(result.failed, undefined, String(result.failed));
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `${directory}/native-svg.png`, fullPage: true });
      return { browserVersion: browser.version(), result, errors };
    } finally {
      await context.tracing.stop({ path: `${directory}/trace.zip` });
    }
  } finally {
    await browser.close();
  }
}

function fixtureResponse(request: IncomingMessage, response: ServerResponse): void {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname === "/pen-solver.wasm") {
    response.setHeader("Content-Type", "application/wasm");
    response.end(readFileSync("shared/pen/pen-solver.wasm"));
  } else if (pathname === "/fixture.js") {
    response.setHeader("Content-Type", "text/javascript");
    response.end(readFileSync(`${directory}/fixture.js`));
  } else if (pathname === "/") {
    response.setHeader("Content-Type", "text/html");
    response.end(
      '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><title>Pen solver candidate</title><h1>Pen solver candidate</h1><p>Isolated fixture. Production ORC workflows remain unverified.</p><script type="module" src="/fixture.js"></script>',
    );
  } else {
    response.writeHead(404);
    response.end();
  }
}

async function main() {
  const identity = await checkBuild();
  execFileSync("bun", [
    "build",
    "scripts/solver/browser-fixture.ts",
    "--target=browser",
    `--outdir=${directory}`,
    "--entry-naming=fixture.js",
  ]);
  const server = createServer(fixtureResponse);
  await new Promise<void>((ready, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", ready);
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const result = await runBrowser(`http://127.0.0.1:${address.port}`);
    assert.equal(result.result.sha256, identity.sha256);
    assert.equal(result.result.bytes, identity.bytes);
    writeFileSync(`${directory}/result.json`, JSON.stringify({ ...evidence, ...result }, null, 2));
    console.log("PEN_SOLVER_CHROME_PASSED");
  } finally {
    await new Promise<void>((closed, reject) =>
      server.close((error) => (error ? reject(error) : closed())),
    );
  }
}

try {
  await main();
} catch (error) {
  writeFileSync(
    `${directory}/result.json`,
    JSON.stringify(
      { ...evidence, failed: error instanceof Error ? error.stack : String(error) },
      null,
      2,
    ),
  );
  throw error;
}

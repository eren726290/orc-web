import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Browser } from "playwright";
import { createServer, preview, type PreviewServer } from "vite";

const channel = process.argv[2] ?? "chrome";
assert.ok(channel === "chrome" || channel === "chromium", "Use chrome or chromium");
const dev = await createServer({ server: { host: "127.0.0.1", port: 0 } });
let production: PreviewServer | undefined;
let browser: Browser | undefined;
const results: { mode: string; screenshot: string; checks: string[] }[] = [];

try {
  await dev.listen();
  production = await preview({ preview: { host: "127.0.0.1", port: 0 } });
  browser = await chromium.launch({
    channel,
    executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
    headless: true,
  });
  mkdirSync("artifacts/scaffold", { recursive: true });

  for (const [mode, server] of [
    ["development", dev],
    ["production-preview", production],
  ] as const) {
    const url = server.resolvedUrls?.local[0];
    assert.ok(url, `${mode} must expose a local URL`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("requestfailed", (request) =>
        errors.push(`${request.url()}: ${request.failure()?.errorText}`),
      );
      const response = await page.goto(url);
      assert.equal(response?.status(), 200);
      await page.locator("#root > main").waitFor();
      assert.equal(await page.title(), "ORC-web");
      assert.equal(await page.locator("main").innerText(), "ORC-web");
      const styles = await page.locator("body").evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          margin: computed.margin,
          fontFamily: computed.fontFamily,
          boxSizing: computed.boxSizing,
        };
      });
      assert.equal(styles.margin, "0px");
      assert.equal(styles.boxSizing, "border-box");
      assert.ok(styles.fontFamily.includes("system-ui"));
      const screenshot = `artifacts/scaffold/${channel}-${mode}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
      assert.deepEqual(errors, [], `${mode} browser errors`);
      results.push({
        mode,
        screenshot,
        checks: [
          "HTTP 200",
          "React mount",
          "page title",
          "Tailwind preflight",
          "body styles",
          "no browser errors",
        ],
      });
    } finally {
      await context.close();
    }
  }

  const sourceFiles = execFileSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "src",
      "scripts",
      "tools/anti-slop",
      "index.html",
      "package.json",
      "bun.lock",
      "tsconfig.json",
      "vite.config.ts",
      "oxlint.config.ts",
      ".oxfmtrc.json",
      ".fallowrc.json",
    ],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n");
  const sourceHashes = Object.fromEntries(
    sourceFiles.map((path) => [
      path,
      createHash("sha256").update(readFileSync(path)).digest("hex"),
    ]),
  );
  writeFileSync(
    `artifacts/scaffold/${channel}-browser.json`,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
        diffSha256: createHash("sha256")
          .update(execFileSync("git", ["diff", "HEAD"]))
          .digest("hex"),
        platform: process.platform,
        bun: process.versions.bun,
        channel,
        executablePath: process.env.ORC_CHROME_EXECUTABLE,
        sourceHashes,
        browserVersion: browser.version(),
        headless: true,
        scope: "Frontend scaffold only; no editor or backend workflows exist yet.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Browser scaffold verification passed");
} finally {
  await browser?.close();
  await production?.close();
  await dev.close();
}

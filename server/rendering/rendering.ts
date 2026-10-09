import { chromium, type Browser, type Page } from "playwright";

let browser: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser)
    browser = chromium
      .launch({
        channel: process.env.ORC_RENDER_BROWSER ?? "chrome",
        executablePath: process.env.ORC_CHROME_EXECUTABLE,
      })
      .catch((error: unknown) => {
        browser = null;
        throw new Error(
          `Cannot start the local rendering browser: ${error instanceof Error ? error.message : "Browser unavailable."}`,
        );
      });
  return browser;
}

export async function withRenderPage<T>(work: (page: Page) => Promise<T>): Promise<T> {
  const context = await (await getBrowser()).newContext();
  try {
    await context.route("**/*", (route) => route.abort());
    return await work(await context.newPage());
  } finally {
    await context.close();
  }
}

export async function closeRenderingBrowser(): Promise<void> {
  const pending = browser;
  browser = null;
  if (pending) await (await pending).close();
}

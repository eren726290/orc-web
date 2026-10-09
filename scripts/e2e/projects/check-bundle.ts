import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import {
  emptyDocument,
  type DesignDocument,
  type DesignNode,
} from "../../../shared/document/model";
import { parseSession } from "../../../shared/session/session";
import { launchApp } from "../../support/app-process";
import { sourceEvidence } from "../../support/editor-evidence";

const channel = process.argv[2] ?? "chromium";
assert.ok(channel === "chrome" || channel === "chromium", "Use chrome or chromium");
const artifacts = "artifacts/editor";
const phase = process.env.ORC_BUNDLE_EVIDENCE === "before" ? "before" : "verification";
await mkdir(artifacts, { recursive: true });
const temporary = await mkdtemp(join(artifacts, "bundle-fixtures-"));
const browser = await chromium.launch({
  channel,
  executablePath: channel === "chrome" ? process.env.ORC_CHROME_EXECUTABLE : undefined,
});
const checks: string[] = [];
const inputs: { mode: string; name: string; bytes: string }[] = [];
let failure: string | null = null;
try {
  for (const mode of ["development", "built"] as const) await verifyMode(mode);
} catch (error) {
  failure = error instanceof Error ? (error.stack ?? error.message) : String(error);
  throw error;
} finally {
  await browser.close();
  await writeEvidence();
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write("bundle preservation passed\n");

async function verifyMode(mode: "development" | "built") {
  const app = await launchApp(mode);
  const context = await browser.newContext({
    baseURL: app.url,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    assert.equal((await page.goto(app.url))?.status(), 200);
    await createPriorProject(page);
    for (const entry of rejectedInputs()) await rejectOpen(page, mode, entry);
    await verifyValidOpen(page, mode);
    await page.screenshot({ path: artifact(`${mode}.png`), fullPage: true });
  } catch (error) {
    await page.screenshot({ path: artifact(`${mode}-failure.png`), fullPage: true });
    throw error;
  } finally {
    await context.tracing.stop({ path: artifact(`${mode}-trace.zip`) });
    await context.close();
    assert.equal(await app.stop(), 0, app.output.join("\n"));
    for (const folder of await readdir(temporary)) {
      assert.ok(!(await readdir(join(temporary, folder))).includes(".orc.lock"));
    }
    checks.push(`${mode}: graceful shutdown releases project locks`);
  }
}

async function createPriorProject(page: Page) {
  await page.getByRole("button", { name: "New project", exact: true }).click();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).click();
  const input = page.getByRole("textbox", { name: "Edit canvas text" });
  await input.fill("Retain my design");
  await input.press("Escape");
  await page.getByRole("textbox", { name: "Content", exact: true }).waitFor();
  await page.getByRole("application", { name: "Canvas" }).getByText("Retain my design").waitFor();
}

type RejectedInput = { name: string; document: unknown; field: string; owner: string };

function rejectedInputs(): RejectedInput[] {
  const documents = ["assets", "tokens", "components"].map((field) => ({
    name: `document-${field}`,
    document: { ...validDocument(), [field]: { preserved: "required project data" } },
    field,
    owner: "project",
  }));
  const nodes = (["frame", "element", "text", "image", "svg"] as const).map((kind) => {
    const document = validDocument();
    const node = exampleNode(kind);
    return {
      name: `node-${kind}`,
      document: { ...document, nodes: { text: { ...node, constraints: { x: "center" } } } },
      field: "constraints",
      owner: "object",
    };
  });
  const document = validDocument();
  return [
    ...documents,
    ...nodes,
    {
      name: "text-run",
      document: {
        ...document,
        nodes: {
          text: {
            ...exampleNode("text"),
            runs: [
              { text: "Keep this formatting", style: {}, formattingMetadata: { preserve: true } },
            ],
          },
        },
      },
      field: "formattingMetadata",
      owner: "text run",
    },
  ];
}

function validDocument(): DesignDocument {
  return {
    ...emptyDocument(),
    name: "Valid preserved bundle",
    workspaceRootIds: ["text"],
    nodes: { text: exampleNode("text") },
  };
}

function exampleNode(kind: DesignNode["kind"]): DesignNode {
  const base = {
    id: "text",
    name: "Existing text",
    parentId: null,
    children: [],
    visible: true,
    locked: false,
    style: {},
    attributes: {},
  };
  switch (kind) {
    case "frame":
      return { ...base, kind, clipContent: false, mode: "inherit" };
    case "element":
      return { ...base, kind, tag: "section" };
    case "text":
      return { ...base, kind, tag: "p", runs: [{ text: "Valid bundle content", style: {} }] };
    case "image":
      return { ...base, kind };
    case "svg":
      return {
        ...base,
        kind,
        source: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',
      };
  }
}

async function fixture(mode: string, name: string, document: unknown) {
  const folder = join(process.cwd(), temporary, `${mode}-${name}.orc`);
  const bytes = `${JSON.stringify(document, null, 2)}\n`;
  await mkdir(folder);
  await writeFile(join(folder, "document.json"), bytes);
  inputs.push({ mode, name, bytes });
  return { folder, bytes };
}

async function submitOpen(page: Page, folder: string) {
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Project folder", exact: true }).fill(folder);
  const response = page.waitForResponse(
    (entry) => new URL(entry.url()).pathname === "/api/projects/open",
  );
  await dialog.getByRole("button", { name: "Open project", exact: true }).click();
  return response;
}

async function rejectOpen(page: Page, mode: string, entry: RejectedInput) {
  const saved = await fixture(mode, entry.name, entry.document);
  const before = await session(page);
  const response = await submitOpen(page, saved.folder);
  assert.equal(response.status(), 400, `${entry.name}: unsupported saved data must be rejected`);
  const dialog = page.getByRole("dialog");
  const explanation = dialog.getByRole("alert");
  await explanation.waitFor();
  assert.ok(
    (await explanation.innerText()).includes(`Unsupported ${entry.owner} field "${entry.field}"`),
  );
  assert.deepEqual(await session(page), before, `${entry.name}: preserve the complete session`);
  assert.equal(await readFile(join(saved.folder, "document.json"), "utf8"), saved.bytes);
  assert.deepEqual(
    await readdir(saved.folder),
    ["document.json"],
    "Rejected open releases its lock",
  );
  await page.screenshot({ path: artifact(`${mode}-${entry.name}.png`), fullPage: true });
  await dialog.press("Escape");
  await page.getByRole("button", { name: "Untitled", exact: true }).click();
  await page.getByRole("application", { name: "Canvas" }).getByText("Retain my design").waitFor();
  checks.push(
    `${mode}: ${entry.name} rejection, visible explanation, unchanged session and bytes, no lock`,
  );
}

async function verifyValidOpen(page: Page, mode: string) {
  const document = validDocument();
  const saved = await fixture(mode, "valid", document);
  const before = await session(page);
  assert.equal((await submitOpen(page, saved.folder)).status(), 200);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("application", { name: "Canvas" })
    .getByText("Valid bundle content")
    .waitFor();
  const after = await session(page);
  assert.equal(after.activeProjectId, document.id);
  assert.deepEqual(after.projects[0], before.projects[0]);
  assert.deepEqual(after.projects.at(-1)?.document, document);
  assert.equal(await readFile(join(saved.folder, "document.json"), "utf8"), saved.bytes);
  checks.push(`${mode}: valid bundle opens and renders, earlier project retained, disk unchanged`);
}

async function session(page: Page) {
  return parseSession(await (await page.request.get("/api/session")).json());
}

function artifact(suffix: string) {
  return join(artifacts, `bundle-${phase}-${suffix}`);
}

async function writeEvidence() {
  await writeFile(
    artifact("result.json"),
    `${JSON.stringify(
      {
        ...sourceEvidence(),
        channel,
        browserVersion: browser.version(),
        phase,
        command: `bun scripts/e2e/projects/check-bundle.ts ${channel}`,
        checks,
        inputs,
        failure,
      },
      null,
      2,
    )}\n`,
  );
}

# Gates: ORC-web documentation coverage and text-editing specification

Scope: Compare every original ORC V1 Markdown document with ORC-web, identify unrepresented browser-relevant behavior, and record the text-editing decisions accepted through discussion without duplicating covered material.
Use these gates to track feature adoption while preserving ORC-web's own architecture and explicitly recording adaptations, deferrals, and open decisions.
The [second ittraton](#second-ittraton) adds only missing coverage checks and updates the historical audit's status.

- [x] G1: Every Markdown file under `/root/orc/doc_v1` is read and recorded in a source inventory.
  CHECK: test -f .unlazy/original-doc-inventory.md && find /root/orc/doc_v1 -type f -name '*.md' | wc -l
  EXPECT: 46
  EVIDENCE: 46

- [x] G2: Every Markdown file under `doc_v1` is read and mapped against the original source inventory.
  CHECK: test -f .unlazy/orc-web-coverage-audit.md && find doc_v1 -type f -name '*.md' | wc -l
  EXPECT: 17
  EVIDENCE: 17

- [x] G3: Each browser-relevant missing or incomplete feature has a source citation, a proposed ORC-web document destination, and a status of missing, incomplete, intentionally deferred, or out of scope.
  CHECK: rg -n '^\| .* \| (Missing|Incomplete|Intentionally deferred|Out of scope) \|' .unlazy/orc-web-coverage-audit.md
  EXPECT: /\| .* \| (Missing|Incomplete|Intentionally deferred|Out of scope) \|/
  EVIDENCE: 43:| Quality, performance, accessibility, and release proof | Missing | `quality/testing-and-acceptance.md`, `quality/performance-budgets.md` | `doc_v1/quality/testing-and-acceptance.md` | Define brow

- [x] G4: The audit has a concrete next-document order that prioritizes missing user-facing features before architecture duplication.
  CHECK: rg -n '^## Next documentation work$' .unlazy/orc-web-coverage-audit.md
  EXPECT: ## Next documentation work
  EVIDENCE: 62:## Next documentation work

- [x] G5: The dedicated text document covers all agreed V1 text creation, editing, sizing, overflow, font, formatting, and clipboard behavior.
  CHECK: rg -c '^## ' doc_v1/interface/text-editing.md
  EXPECT: 10
  EVIDENCE: 10

- [x] G6: Properties, canvas, Flex, tokens, the document model, and the index link to the self-contained text contract where relevant.
  CHECK: node -e 'const fs=require("node:fs"); const files=["doc_v1/README.md","doc_v1/interface/properties-panel.md","doc_v1/interface/workspace-and-canvas.md","doc_v1/interface/flex-layout.md","doc_v1/interface/tokens-and-modes.md","doc_v1/architecture/canonical-document-model.md"]; for (const f of files) if (!fs.readFileSync(f,"utf8").includes("text-editing.md")) { console.error(`missing text-editing.md link in ${f}`); process.exitCode=1 } if (!process.exitCode) console.log("All six text-document entry points link to text-editing.md")'
  EXPECT: All six text-document entry points link to text-editing.md
  EVIDENCE: All six text-document entry points link to text-editing.md

- [x] G7: Rich-text storage requirements are recorded without pretending the canonical schema is settled.
  CHECK: rg -n 'inline formatting|rich-text' doc_v1/architecture/canonical-document-model.md backlog/README.md
  EXPECT: rich-text
  EVIDENCE: backlog/README.md:18:- Define the canonical rich-text data shape and range indexing, choose the redistributable default font, and verify installed-font access in supported Fedora and Windows browsers.

- [x] G8: The canvas document no longer says Flex and Constraints are awaiting agreement.
  CHECK: ! rg -n 'await agreement|proposal\]' doc_v1/interface/workspace-and-canvas.md && echo 'No stale pending-agreement wording in workspace document'
  EXPECT: No stale pending-agreement wording in workspace document
  EVIDENCE: No stale pending-agreement wording in workspace document

- [x] G9: The docs in this change contain no broken relative Markdown links or whitespace errors.
  CHECK: git diff --check && ! rg -n '[[:blank:]]+$' doc_v1/interface/text-editing.md doc_v1/interface/properties-panel.md doc_v1/interface/workspace-and-canvas.md doc_v1/interface/flex-layout.md doc_v1/interface/tokens-and-modes.md doc_v1/architecture/canonical-document-model.md doc_v1/README.md backlog/README.md .unlazy/orc-web-coverage-audit.md && node -e 'const fs=require("node:fs"),path=require("node:path"); const roots=["doc_v1","backlog"]; const files=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith(".md")) files.push(p)}}; roots.forEach(walk); const re=/(?<!!)\[[^\]]*\]\(([^)]+)\)/g; const bad=[]; for(const f of files){const s=fs.readFileSync(f,"utf8"); for(const m of s.matchAll(re)){const t=m[1].split("#")[0]; if(!t||t.includes("://")||t.startsWith("mailto:")||t.startsWith("/")) continue; if(!fs.existsSync(path.resolve(path.dirname(f),t))) bad.push(`${f}: ${t}`)}} if(bad.length){console.error(bad.join("\n")); process.exit(1)} console.log(`All relative links resolve across ${files.length} Markdown files`)'
  EXPECT: All relative links resolve across
  EVIDENCE: All relative links resolve across 19 Markdown files

- [x] G10: Every text behavior accepted in discussion is recorded, and unresolved storage or browser details remain explicitly open.
  EVIDENCE: doc_v1/interface/text-editing.md:12-27, 29-32, 34-58, 60-76, 78-94, 104-113

- [x] G11: Layers and Properties, Flex layout, and Constraints link to one another in both directions.
  CHECK: node -e 'const fs=require("node:fs"); const links={"doc_v1/interface/properties-panel.md":["flex-layout.md","constraints.md"],"doc_v1/interface/flex-layout.md":["properties-panel.md","constraints.md"],"doc_v1/interface/constraints.md":["properties-panel.md","flex-layout.md"]}; for(const [f,targets] of Object.entries(links)){const s=fs.readFileSync(f,"utf8");for(const t of targets)if(!s.includes(t)){console.error(`${f} does not link ${t}`);process.exitCode=1}}if(!process.exitCode)console.log("All three layout and Properties documents link to each other")'
  EXPECT: All three layout and Properties documents link to each other
  EVIDENCE: All three layout and Properties documents link to each other

## Gates: React component, Motion, and Tailwind V1 documentation

Scope: Record the accepted browser component workflow without leaving the earlier one-layer component or Tailwind-export-only rules in force.

- [x] R1: The canonical model, component import, Layers and Properties, Constraints, and MCP contracts describe source-backed editable component layers instead of a blanket one-object rule.
  CHECK: rg -n 'one workspace object|one Layer|internal React DOM does not become|internal DOM of an imported component is not editable' doc_v1 || true
  EXPECT: No stale blanket component-editing rule remains.
  EVIDENCE: No matches on 2026-09-28.

- [x] R2: Self-contained V1 documents define React source bindings, editable component layers, Motion, and supported Tailwind component handling.
  CHECK: test -f doc_v1/architecture/react-source-bindings.md && test -f doc_v1/interface/react-components.md && test -f doc_v1/interface/motion.md && test -f doc_v1/import-export/tailwind-components.md
  EXPECT: All four V1 documents exist.
  EVIDENCE: All four V1 documents exist.

- [x] R3: Base UI and Base UI-flavored shadcn support, Radix exclusion, shared-versus-instance edits, hidden content, collection items, code Apply, and agent fresh reads have an explicit V1 contract.
  CHECK: node -e 'const fs=require("node:fs"); const files=["doc_v1/interface/react-components.md","doc_v1/interface/motion.md","doc_v1/import-export/tailwind-components.md","doc_v1/architecture/react-source-bindings.md"]; const text=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n"); for(const s of ["Base UI","Radix","Only this","Show content","collection","get_context","Apply","Motion"]) if(!text.includes(s)){console.error(`missing ${s}`);process.exit(1)} console.log("All accepted V1 component workflow terms are documented")'
  EXPECT: All accepted V1 component workflow terms are documented.
  EVIDENCE: All accepted V1 component workflow terms are documented.

- [x] R4: The V1 Tailwind path includes browser compilation, limited reliable visual class editing, faithful export, and clear dynamic-class limits.
  CHECK: node -e 'const fs=require("node:fs"); const s=fs.readFileSync("doc_v1/import-export/tailwind-components.md","utf8"); for(const x of ["compiler","static", "dynamic", "Export"]) if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)} console.log("Tailwind V1 path and boundary are documented")'
  EXPECT: Tailwind V1 path and boundary are documented.
  EVIDENCE: Tailwind V1 path and boundary are documented.

- [x] R5: The product index and all changed documents have resolving relative links and no whitespace errors.
  CHECK: git diff --check && node -e 'const fs=require("node:fs"),path=require("node:path"); const files=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".md"))files.push(p)}}; ["doc_v1","backlog"].forEach(walk); const re=/(?<!!)\\[[^\\]]*\\]\\(([^)]+)\\)/g,bad=[];for(const f of files)for(const m of fs.readFileSync(f,"utf8").matchAll(re)){const t=m[1].split("#")[0];if(t&&!t.includes("://")&&!t.startsWith("mailto:")&&!t.startsWith("/")&&!fs.existsSync(path.resolve(path.dirname(f),t)))bad.push(`${f}: ${t}`)}if(bad.length){console.error(bad.join("\\n"));process.exit(1)}console.log(`All relative links resolve across ${files.length} Markdown files`)' && ! rg -n '[[:blank:]]+$' doc_v1 backlog
  EXPECT: All relative links resolve and no trailing whitespace is present.
  EVIDENCE: All relative links resolve across 24 Markdown files and no trailing whitespace was found.

- [x] R6: Failed Apply keeps the applied design and current session text, while later component crashes remain repairable through Code or an agent's normal fresh reads.
  CHECK: node -e 'const fs=require("node:fs");const files=["doc_v1/interface/code-window.md","doc_v1/interface/react-components.md","doc_v1/architecture/command-engine-and-history.md","backlog/mcp/tool-catalog.md","backlog/mcp/command-contracts.md"];const s=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n");for(const x of ["Failed Apply","Runtime component errors","Retry","Open code","get_context","unapplied Code window text","does not silently undo"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("Component recovery contract is documented")'
  EXPECT: Component recovery contract is documented.
  EVIDENCE: Component recovery contract is documented.

- [x] R7: Only applied design changes persist in a project, and closing or reloading with unapplied Code window text asks for explicit discard.
  CHECK: node -e 'const fs=require("node:fs");const files=["doc_v1/architecture/orc-workspace-bundle.md","doc_v1/interface/code-window.md","doc_v1/architecture/react-source-bindings.md"];const s=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n");for(const x of ["Saved means that the applied design is written","current editing session","Discard unapplied changes?","last applied source"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}if(s.includes("code-drafts.json")){console.error("persistent code draft file remains");process.exit(1)}console.log("Applied-only persistence contract is documented")'
  EXPECT: Applied-only persistence contract is documented.
  EVIDENCE: Applied-only persistence contract is documented.

- [x] R8: Untitled starts, command success before autosave, revision-aware Saved status, save failure, and same-session reconnect preserve the applied project.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/architecture/orc-workspace-bundle.md","utf8");for(const x of ["New project immediately opens", "Untitled", "First Save", "Save failed", "Retry", "Save as", "Disconnected", "last successfully saved design"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}const fs=require("node:fs"),assert=require("node:assert/strict"),c=fs.readFileSync("doc_v1/architecture/command-engine-and-history.md","utf8");for(const t of ["commit active project, revision, and Undo","Command success does not mean","Untitled projects can complete commands","disk-save failure","older save finishing"])assert(c.includes(t),"Missing command/save rule: "+t);assert(!c.includes("verify invariants → persist"),"Stale persist-before-success lifecycle");for(const t of ["Edit success and disk-save success are separate states.","server'"'"'s current applied project and save status","reconnection does not replace","last successful disk save","last valid saved revision must retain"])assert(s.includes(t),"Missing recovery rule: "+t);assert(!s.includes("reads the server'"'"'s saved project state"),"Stale disk-only reconnect");for(const f of ["backlog/mcp/command-contracts.md","backlog/mcp/mcp-server.md"])assert(fs.readFileSync(f,"utf8").includes("command-engine-and-history.md#command-lifecycle"),"Missing shared lifecycle: "+f);console.log("Project start and save-recovery contract is documented")'
  EXPECT: Project start and save-recovery contract is documented.
  EVIDENCE: R8 passed on 2026-10-03; command success, disk save status, same-session reconnect, and shared UI/MCP lifecycle wording passed static checks.

- [x] R9: SVG V1 editing uses Select for whole-artwork placement and transformation, Properties for supported colors and strokes, and defers path anchor editing.
  CHECK: node -e 'const fs=require("node:fs");const files=["doc_v1/interface/svg-editing.md","doc_v1/interface/properties-panel.md","doc_v1/interface/workspace-and-canvas.md","backlog/README.md"];const s=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n");for(const x of ["rotation handle","preserving its proportions","Stroke width","Replace SVG","individual path points","anchor-point"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("SVG V1 editing boundary is documented")'
  EXPECT: SVG V1 editing boundary is documented.
  EVIDENCE: SVG V1 editing boundary is documented.

- [x] R10: Alignment guides and snapping are explicitly deferred beyond V1.
  CHECK: rg -n 'Add alignment guides and snapping' backlog/README.md
  EXPECT: Add alignment guides and snapping
  EVIDENCE: Alignment-guide deferral is documented.

## Gates: Frame boundaries, selection, and edit scope

Scope: Record the accepted free-workspace model, simple selection model, and fluent single-instance component editing.

- [x] F1: Top-level frames are independent, arbitrary-sized design areas without automatic desktop, tablet, or phone variants.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/workspace-and-canvas.md","utf8");for(const x of ["Top-level frame boundaries","arbitrary size","does not create a linked variant"])if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}console.log("Frame boundary contract is documented")'
  EXPECT: Frame boundary contract is documented.
  EVIDENCE: Frame boundary contract is documented.

- [x] F2: Canvas and Layers selection stay synchronized, basic Shift-click selection remains available, and bulk Properties editing plus marquee selection are deferred.
  CHECK: node -e 'const fs=require("node:fs");const s=fs.readFileSync("doc_v1/interface/workspace-and-canvas.md","utf8")+fs.readFileSync("doc_v1/interface/properties-panel.md","utf8");for(const x of ["Hold Shift and click","drag-selection box","Select one object to edit its properties","scrolls that row into view"])if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}console.log("Selection boundary is documented")'
  EXPECT: Selection boundary is documented.
  EVIDENCE: Selection boundary is documented.

- [x] F3: A shared component edit offers Only this or All copies in Properties, and a direct token value can remain local to one object or frame.
  CHECK: node -e 'const fs=require("node:fs");const s=fs.readFileSync("doc_v1/interface/react-components.md","utf8")+fs.readFileSync("doc_v1/architecture/react-source-bindings.md","utf8")+fs.readFileSync("doc_v1/interface/tokens-and-modes.md","utf8");for(const x of ["Only this","All copies","direct value changes only the selected object or frame"])if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}console.log("Local and shared edit scope is documented")'
  EXPECT: Local and shared edit scope is documented.
  EVIDENCE: Local and shared edit scope is documented.

- [x] F4: Imported styles stay within their intended design scope and overlays follow their trigger or owning top-level frame.
  CHECK: node -e 'const fs=require("node:fs");const s=fs.readFileSync("doc_v1/interface/react-components.md","utf8")+fs.readFileSync("doc_v1/import-export/tailwind-components.md","utf8");for(const x of ["follows its trigger","owning top-level frame","intended design scope"])if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}console.log("Style and overlay boundary is documented")'
  EXPECT: Style and overlay boundary is documented.
  EVIDENCE: Style and overlay boundary is documented.

- [x] F5: The updated documents have resolving relative links and no whitespace errors.
  CHECK: git diff --check && ! rg -n '[[:blank:]]+$' doc_v1 backlog
  EXPECT: No whitespace error is present.
  EVIDENCE: All relative links resolve across 24 Markdown files and no trailing whitespace was found.

## Gates: Chrome and portable fonts

Scope: Record the accepted Chrome-only V1 support policy and the font workflow that keeps a project usable across Fedora and Windows.

- [x] B1: V1 targets current stable desktop Chrome on Fedora and Windows, project-folder work remains server-owned, and V1 release checks exclude deferred font controls.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/architecture/browser-support.md","utf8");for(const x of ["current stable desktop release of Google Chrome","Fedora Linux and Windows","local server owns opening, saving, and exporting"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}const assert=require("node:assert/strict");assert(s.includes("existing authored-font rendering and preservation"),"Missing V1 font preservation check");assert(s.includes("are not required V1 release checks"),"Missing V1.1 font scope");assert(!s.includes("Create and edit text, import a project font"),"Stale V1 font import requirement");console.log("Chrome V1 support contract is documented")'
  EXPECT: Chrome V1 support contract is documented.
  EVIDENCE: B1 passed on 2026-10-03; V1 font rendering/preservation checks remain, and deferred import/replacement controls are explicitly excluded from the V1 release checklist.

- [x] B2: Project fonts are portable assets when inclusion is confirmed, while installed fonts remain local references with a visible replacement workflow.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/font-management.md","utf8");for(const x of ["Project font","Installed font","Font unavailable","previews the candidate","one Undo step","not copied into the project or export"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("Portable-font contract is documented")'
  EXPECT: Portable-font contract is documented.

- [x] B3: The index, text editing, workspace bundle, and export documents link to the new browser and font contracts.
  CHECK: node -e 'const fs=require("node:fs");const files={"doc_v1/README.md":["browser-support.md","font-management.md"],"doc_v1/interface/text-editing.md":["font-management.md","browser-support.md"],"doc_v1/architecture/orc-workspace-bundle.md":["font-management.md"],"doc_v1/import-export/export.md":["font-management.md"]};for(const [f,targets]of Object.entries(files)){const s=fs.readFileSync(f,"utf8");for(const t of targets)if(!s.includes(t)){console.error(`${f} missing ${t}`);process.exit(1)}}console.log("Font and browser links are documented")'
  EXPECT: Font and browser links are documented.

## Gates: implementation stack and source-editing evidence

Scope: Record the accepted Bun decision, recommended application foundation, reviewed PR1–5 evidence, and supported implementation direction without representing experiments as the completed editor.

- [x] S1: Stack statuses remain explicit; accepted startup/shutdown define one browser address, pending saves, and managed process cleanup, while accepted MCP connection/read contracts are active and the earlier drafts remain provisional in the backlog.
  CHECK: node -e 'const s=require("node:fs").readFileSync("backlog/stack-proposal.md","utf8");for(const x of ["Accepted.","Recommended foundation.","Validated direction", "type-checking CLI", "intentionally settled last"])if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}const fs=require("node:fs"),assert=require("node:assert/strict"),a=fs.readFileSync("doc_v1/architecture/system-architecture.md","utf8");for(const t of ["## Startup and runtime modes","`bun run dev` starts","one localhost address served by Vite","forwards application backend requests to Bun","Two server processes","Bun serves those files","does not require the Vite development server","## Normal terminal shutdown","Ctrl+C","shutdown handler explicitly","finishes pending saves","stops the development Vite process","must also await its own save work","failed write does not count","does not apply or persist unfinished Code drafts","Fedora and Windows"])assert(a.includes(t),"Missing startup/shutdown rule: "+t);for(const f of ["backlog/stack-proposal.md","backlog/README.md"])for(const t of ["system-architecture.md#startup-and-runtime-modes","system-architecture.md#normal-terminal-shutdown"])assert(fs.readFileSync(f,"utf8").includes(t),"Missing runtime connection: "+f);assert(fs.readFileSync("doc_v1/architecture/orc-workspace-bundle.md","utf8").includes("system-architecture.md#normal-terminal-shutdown"),"Missing save/shutdown connection");for(const f of ["mcp-server.md","read-tools.md","sdk-and-protocol-research.md"])assert(fs.existsSync("doc_v1/mcp/"+f),"Missing active MCP document: "+f);assert(!fs.existsSync("doc_v1/mcp/tool-catalog.md")&&!fs.existsSync("doc_v1/mcp/command-contracts.md"),"Provisional inventory promoted without review");for(const f of ["mcp-server.md","tool-catalog.md","command-contracts.md"])assert(fs.readFileSync("backlog/mcp/"+f,"utf8").includes("Provisional"),"Missing provisional MCP status: "+f);assert(fs.readFileSync("doc_v1/README.md","utf8").includes("MCP backlog"),"Missing deferred MCP pointer");assert(fs.readFileSync("backlog/README.md","utf8").includes("## MCP reference drafts"),"Missing MCP backlog index");console.log("Stack statuses are explicit")'
  EXPECT: Stack statuses are explicit.
  EVIDENCE: Startup batch static review passed: 54/54 selected gates and 387 links/anchors across 42 Markdown files; five files changed, with no files added or removed. Application startup and shutdown still require Fedora/Windows verification.
  EVIDENCE: MCP backlog move passed on 2026-10-03: 54/54 static gates and 393 links/anchors across 42 Markdown files; three drafts moved, six connected files updated, and 33 files unchanged. All MCP sections and candidate tool-table rows were preserved.

- [x] S2: The reviewed PR1–5 results, corrected failures, type-checking scope, and remaining limits are recorded against immutable commits.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/architecture/react-source-editing-validation.md","utf8");for(const x of ["Evidence by PR","Initially", "Actual failures corrected", "TypeScript and dependency checking", "Remaining limits", "7e8f3b5e314c9f42e6a2d455ef0e1db7dc44c6fc"])if(!s.toLowerCase().includes(x.toLowerCase())){console.error(`missing ${x}`);process.exit(1)}console.log("Proof results and limits are explicit")'
  EXPECT: Proof results and limits are explicit.
  EVIDENCE: Proof results and limits are explicit.

- [x] S3: Source-binding and index links point to completed Fedora evidence instead of a pending handoff.
  CHECK: node -e 'const fs=require("node:fs");for(const f of ["doc_v1/README.md","doc_v1/architecture/react-source-bindings.md","backlog/README.md","backlog/stack-proposal.md"]){const s=fs.readFileSync(f,"utf8");if(!s.includes("react-source-editing-validation.md")||/awaiting Fedora|Fedora verification task|Fedora handoff task/.test(s)){console.error(`missing link or stale status in ${f}`);process.exit(1)}}console.log("Reviewed Fedora evidence is linked")'
  EXPECT: Reviewed Fedora evidence is linked.
  EVIDENCE: Reviewed Fedora evidence is linked.

- [x] S4: Per-value fallback, command identity limits, and Only this copying boundaries connect the source contract to the human interface.
  CHECK: node -e 'const fs=require("node:fs");const s=fs.readFileSync("doc_v1/architecture/react-source-bindings.md","utf8");for(const x of ["Identity through edits","snapshot digest","per value or operation","Only this is unavailable","Authoring editable foundations","get_context"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}for(const f of ["doc_v1/interface/react-components.md","doc_v1/interface/properties-panel.md","doc_v1/interface/code-window.md","doc_v1/import-export/component-import.md"])if(!fs.readFileSync(f,"utf8").includes("Edit source")){console.error(`missing fallback in ${f}`);process.exit(1)}console.log("Source ownership and UI boundaries are connected")'
  EXPECT: Source ownership and UI boundaries are connected.
  EVIDENCE: Source ownership and UI boundaries are connected.

- [x] S5: Browser evidence retains visible Fedora/Windows verification; the shared local Chrome service has an explicit runtime dependency, candidate/capture scope, cleanup, failure behavior, and implementation limits.
  CHECK: node -e 'const fs=require("node:fs");const s=fs.readFileSync("doc_v1/architecture/browser-support.md","utf8");for(const x of ["channel: \"chrome\"","Headless mode","headless shell","visible Chrome","Fedora and Windows"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}const assert=require("node:assert/strict"),a=fs.readFileSync("doc_v1/architecture/system-architecture.md","utf8");for(const t of ["## Local rendering service","Playwright to run installed Google Chrome headlessly","same rendering code","one background Chrome process","fresh non-persistent browser context","editor tab is closed","active project, revision, and Undo history unchanged","Temporary canvas dragging and scrubbing","application runtime dependency","production implementation is not yet verified","Live Edit and Preview components continue to render directly"])assert(a.includes(t),"Missing renderer rule: "+t);for(const f of ["doc_v1/architecture/browser-support.md","doc_v1/import-export/component-import.md","doc_v1/import-export/export.md","backlog/stack-proposal.md","backlog/README.md"])assert(fs.readFileSync(f,"utf8").includes("system-architecture.md#local-rendering-service"),"Missing renderer connection: "+f);assert(fs.readFileSync("backlog/stack-proposal.md","utf8").includes("Accepted runtime direction"),"Missing renderer dependency status");console.log("Browser evidence and release checks are distinguished")'
  EXPECT: Browser evidence and release checks are distinguished.
  EVIDENCE: S5 passed on 2026-10-03; local renderer scope, Playwright runtime status, direct canvas rendering, connected contracts, and remaining platform verification are documented.

- [x] S6: TS6 is the accepted V1 checker, TS7 is a separate compatibility checkpoint, and PR5's original compiler results remain historical evidence.
  CHECK: node -e 'const fs=require("node:fs");const p="doc_v1/architecture/typescript-tooling.md",s=fs.readFileSync(p,"utf8");for(const x of ["Accepted V1 development policy","check:types","check:ts7","same project source","separate pinned compiler installation","Migration conditions","Choosing TS6 for V1 does not remove"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}for(const f of ["doc_v1/README.md","doc_v1/architecture/system-architecture.md","doc_v1/architecture/react-source-editing-validation.md","backlog/stack-proposal.md","backlog/README.md"]){if(!fs.readFileSync(f,"utf8").includes("typescript-tooling.md")){console.error(`missing policy link in ${f}`);process.exit(1)}}if(fs.readFileSync("backlog/stack-proposal.md","utf8").includes("| Type checking | TypeScript 7 CLI |")){console.error("stale TS7 baseline");process.exit(1)}console.log("TS6 baseline, TS7 checkpoint, and historical evidence are connected")'
  EXPECT: TS6 baseline, TS7 checkpoint, and historical evidence are connected.
  EVIDENCE: TS6 baseline, TS7 checkpoint, and historical evidence are connected.

## Gates: workspace and Properties documentation — 2026-10-01

Scope: Verify the documentation decisions recorded in the latest workspace, import, Properties, editing, and backlog batch.
These gates establish specification coverage and consistency; they do not certify an implemented editor.
Earlier sections retain their historical counts and evidence rather than representing this batch.

- [x] W1: Workspace layout records the agreed top bar, Layers/Tokens tabs, Code placement, resizable panels, and selection preservation.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/workspace-and-canvas.md": ["project name, save status, Select, Pan, Text, Preview, and Code", "Layers and Tokens tabs", "Switching left tabs preserves", "closed initially", "below the canvas", "resizable"]};const forbidden={};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W1 documentation check passed")'
  EXPECT: W1 documentation check passed
  EVIDENCE: W1 documentation check passed

- [x] W2: Content entry points and component import record direct Text, focused + Add, authorized preparation, placement, Retry, cancellation, and manual-insertion deferrals.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/text-editing.md": ["Click Text in the top bar", "does not require opening + Add"], "doc_v1/import-export/component-import.md": ["directly opens the component-import panel", "Package, Registry, or Local", "One **Import** action", "preparation progress", "clicks inside a frame", "Properties automatically", "Escape cancels placement", "**Retry**"], "doc_v1/interface/workspace-and-canvas.md": ["does not provide a manual draw-frame", "Manual file insertion of new images or SVGs is deferred"]};const forbidden={"doc_v1/interface/text-editing.md": ["Choose Add → Text"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W2 documentation check passed")'
  EXPECT: W2 documentation check passed
  EVIDENCE: W2 documentation check passed

- [x] W3: Selection clearing, frame selection, Edit wheel zoom, normal Preview scrolling, temporary frame scroll positions, and absence of visible zoom controls are documented.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/workspace-and-canvas.md": ["Clicking empty workspace outside all frames clears selection", "without deleting, moving, or changing", "empty area inside a frame selects that frame", "Scrolling the mouse wheel over the canvas in Edit mode", "Zoom preserves selection", "For a long frame, zoom out", "does not show a zoom percentage", "including nested scrollable areas", "does not zoom or pan the workspace, even at a scroll boundary", "temporary Preview scroll position", "Scrolling one top-level frame does not scroll another", "Scrolling does not change saved layout, source, or default values and creates no document revision or Undo entry"], "doc_v1/architecture/canonical-document-model.md": ["Preview scroll positions"], "backlog/README.md": ["accepted [Edit/Preview wheel routing]"]};const forbidden={"doc_v1/interface/workspace-and-canvas.md": ["Preview input routing for scrollable live content remains an implementation detail to settle"], "backlog/README.md": ["Settle canvas wheel routing in Preview"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W3 documentation check passed")'
  EXPECT: W3 documentation check passed
  EVIDENCE: W3 passed on 2026-10-02 with all 54 selected documentation gates; 335 local links and anchors across 39 Markdown files passed, and git diff --check was clean.

- [x] W4: Properties records section order, a visible name/type header, parent-controlled values, clipping, individual corner-radius controls, Appearance controls, and selection-based Export.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/properties-panel.md": ["readable name and type remain visible", "Controls follow this order: Layout", "**Select parent**", "border color and width, corner radius, opacity", "one outer shadow", "**Clip content**", "Clipped children remain selectable and editable through Layers.", "Top left, Top right, Bottom right, and Bottom left", "combined field shows **Mixed**", "preserves every existing value", "Undo restores the previous corner values together.", "V1 does not provide mixed values across several selected objects", "An Export section sits at the bottom", "several selected compatible objects"]};const forbidden={};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W4 documentation check passed")'
  EXPECT: W4 documentation check passed
  EVIDENCE: W4 documentation check passed; rerun 2026-10-01 for clipping and corner-radius controls.

- [x] W5: Token controls define compatible pickers, readable linkage, replacement, unlinking, safe ownership, and atomic creation/application.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/tokens-and-modes.md": ["filtered to the token types", "readable name and its resolved value", "Choosing a different token", "**Unlink token**", "Only this / All copies", "one completed command and one Undo step", "orphan token"]};const forbidden={};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W5 documentation check passed")'
  EXPECT: W5 documentation check passed
  EVIDENCE: W5 documentation check passed

- [x] W6: Editing records live values without Apply, cancellation and inline errors, focus-aware Undo/Delete, context actions, same-project Copy/Paste ownership and history, and Duplicate deferral.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/properties-panel.md": ["Properties has no Apply button", "live without requiring Enter", "Enter is optional", "Escape cancels", "short inline explanation", "Temporary previews do not create document revisions"], "doc_v1/architecture/command-engine-and-history.md": ["With canvas focus, Ctrl+Z", "typing history", "only successful Apply enters document history", "Canvas Copy reads an applied-design snapshot", "Same-project Paste"], "doc_v1/interface/workspace-and-canvas.md": ["Delete removes the selected", "Delete edits that field", "Copy, Paste, Delete, Open code, and Export", "Duplicate action is deferred", "## Copy and Paste inside the same project", "Ctrl+C copies", "Ctrl+V pastes", "fresh IDs", "another independent design area", "same applied instance properties", "reuses the existing shared component definition", "Only this / All copies choice", "Token references remain shared", "Before Paste changes source or selection", "keep the design, selection, and document history unchanged", "Successful Paste selects", "Redo restores that accepted copy and its identities"], "doc_v1/interface/react-components.md": ["duplicate an item is deferred"], "doc_v1/architecture/react-source-bindings.md": ["allocates fresh Layer identities", "Shared implementation bindings retain their existing definition owner", "Paste validates the copied binding topology"], "doc_v1/interface/code-window.md": ["Canvas Copy/Paste", "the actions below copy code text"]};const forbidden={"doc_v1/interface/workspace-and-canvas.md": ["moving, duplicating"], "doc_v1/interface/properties-panel.md": ["move, duplicate, delete"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W6 documentation check passed")'
  EXPECT: W6 documentation check passed
  EVIDENCE: W6 passed on 2026-10-02 with all 54 selected documentation gates, 343 local links and anchors across 39 Markdown files, and git diff --check clean.
  Reviewed five changed files against the pre-edit snapshot; 34 Markdown files are unchanged, and these checks verify documentation rather than an implemented clipboard workflow.

- [x] W7: Every agreed Properties deferral is in a dedicated linked backlog file and the exact deferred-work instruction is in AGENTS.md.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"backlog/properties-panel-v1x.md": ["Panel personalization", "Grid authoring", "gradient, multiple-shadow, filter, blend-mode", "OpenType", "Manual new-file insertion", "Broader support", "Aliases", "Custom adjustment", "Mixed-value", "Duplicate", "must not silently discard", "Custom panel docking", "Manual frame creation"], "backlog/README.md": ["properties-panel-v1x.md"], "doc_v1/interface/properties-panel.md": ["properties-panel-v1x.md"], "doc_v1/interface/tokens-and-modes.md": ["properties-panel-v1x.md"], "AGENTS.md": ["- Track deferred work: if a significant feature, future update , edge case, or idea is pushed out of the current scope, immediately document it in a backlog folder a didected backlog file. Never let important tasks get lost in the chat history."]};const forbidden={};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}for(const [f,terms]of Object.entries(forbidden)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(!s.includes(t),f+": stale "+t)}console.log("W7 documentation check passed")'
  EXPECT: W7 documentation check passed
  EVIDENCE: W7 documentation check passed

- [x] W8: Relative links and anchors resolve, changed files have no whitespace errors, and the new backlog has no trailing whitespace.
  CHECK: git diff --check && ! rg -n "[[:blank:]]+$" backlog/properties-panel-v1x.md && node -e 'const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");const files=["AGENTS.md","GATES.md"];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith(".md"))files.push(p)}}["doc_v1","backlog"].forEach(walk);let n=0;for(const f of files){for(const m of fs.readFileSync(f,"utf8").matchAll(/\]\(([^)]+)\)/g)){const t=m[1];if(t.includes("://")||t.startsWith("/")||t.startsWith("mailto:"))continue;const [p,a]=t.split("#"),d=p?path.resolve(path.dirname(f),p):f;assert(fs.existsSync(d),f+": "+t);if(a&&fs.statSync(d).isFile()){const heads=[...fs.readFileSync(d,"utf8").matchAll(/^#+\s+(.+)$/gm)].map(x=>x[1].toLowerCase().replace(/[^\w\- ]/g,"").replace(/ /g,"-"));assert(heads.includes(a),f+": "+t)}n++}}console.log("W8 links and anchors passed: "+n+" across "+files.length+" Markdown files")'
  EXPECT: W8 links and anchors passed
  EVIDENCE: W8 links and anchors passed: 150 across 32 Markdown files

- [x] W9: Properties explicitly inventories selection-based Layout, Flex and Constraints options, Component controls, and tokens beside values, with the listed Fonts/Text/SVG controls scheduled for V1.1 and their researched plans preserved.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/properties-panel.md":["## Release scope","## Layout control inventory","### Frame and Flex controls","### Constraint controls","Nine-point visual control","Packed or Space between","Top, Right, Bottom, and Left","| Horizontal | Left, Right, Left & Right, or Center.","| Vertical | Top, Bottom, Top & Bottom, or Center.","diagram synchronized with both labeled dropdowns","no parent-edge Constraint controls","For a selected component, the order is Layout, Component, Appearance, and Export.","Ordinary objects do not receive a Component section.","| Show content |","| Edit component source |","| Supported animation values |","## Tokens beside property values","readable name and resolved value","**Unlink token**","**Create token**","Creation and application to the initiating property form one command and one Undo step.","Replace SVG is scheduled for V1.1","v11-properties-controls"],"backlog/properties-panel-v1x.md":["## V1.1 Properties controls","excluded from V1 and scheduled for V1.1","Visible, Clip, and Ellipsis","Import font, Font unavailable feedback, and Replace font","Keep the existing Text, Fonts, and SVG research documents intact","earlier V1 wording does not override","does not defer the Text tool","Image replacement remains in V1.","does not schedule them for V1.1."],"backlog/README.md":["V1.1 control schedule"],"doc_v1/README.md":["linked V1.1 control schedule"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}console.log("W9 Properties inventory and V1.1 schedule check passed")'
  EXPECT: W9 Properties inventory and V1.1 schedule check passed
  EVIDENCE: W9 passed with 17 selected documentation gates, relative links/anchors and whitespace checks; Fonts, Text, and SVG documents verified byte-for-byte unchanged on 2026-10-01.

## second ittraton

Scope: Add documentation checks for adopted details absent from earlier gates.
Reuse existing gates for covered features, as mapped in the [updated adoption audit](.unlazy/orc-web-coverage-audit.md#second-ittraton).
A passed documentation gate confirms the recorded contract; application behavior still needs implementation evidence.

- [x] I1: The adoption audit distinguishes historical gaps from current coverage, reuses existing gates, cites original and ORC-web contracts, and leaves unaccepted work open.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={".unlazy/orc-web-coverage-audit.md": ["## second ittraton", "takes precedence", "own architecture and scope", "Existing coverage to reuse", "W1–W7", "R1–R4", "R6–R8", "I2 checks", "I3 checks", "I4 checks", "not newly accepted", "Local MCP transport and read responsibilities are accepted", "Application implementation"], "GATES.md": ["## second ittraton", "feature adoption while preserving ORC-web'"'"'s own architecture"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}const path=require("node:path");for(const f of ["GATES.md",".unlazy/orc-web-coverage-audit.md"]){const s=fs.readFileSync(f,"utf8").split("## second ittraton")[1];for(const m of s.matchAll(/\]\(([^)]+)\)/g)){const [p,a]=m[1].split("#"),d=p?path.resolve(path.dirname(f),p):f;assert(fs.existsSync(d),f+": "+m[1]);if(a){const heads=[...fs.readFileSync(d,"utf8").matchAll(/^#+\s+(.+)$/gm)].map(x=>x[1].toLowerCase().replace(/[^\w\- ]/g,"").replace(/ /g,"-"));assert(heads.includes(a),f+": "+m[1])}}}console.log("I1 adoption documentation check passed")'
  EXPECT: I1 adoption documentation check passed
  EVIDENCE: I1 adoption documentation check passed; rerun 2026-10-01.

- [x] I5: The dedicated Layers contract records accepted row presentation, connected selection, renaming, the preserved V1.1 visibility plan, V1 locks, collapsed opening defaults, the empty state, blank-name handling, and the V1.1 row-dragging schedule; connected documents retain no stale pending-discussion rules.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const f="doc_v1/interface/layers-panel.md",s=fs.readFileSync(f,"utf8");for(const t of ["## Row presentation","## Selection and connected panels","## Renaming a Layer","## Visibility","## Locking","## Expanding and collapsing","## React component layers and supported operations","## Commands, saving, and view state","## Implementation verification","## Remaining implementation questions","persistent hidden indicator","preserves every child","An individually locked child stays locked","Press Enter or click outside","Escape cancels","one command and one Undo step","Collapsing a branch preserves","Preview interactions continue normally","Discard unapplied changes?","indirect shared","stable","Show content","**No layers yet**","keeps the existing **+ Add** button visible","top-level frames and loose objects with child branches collapsed","empty name or a name containing only spaces keeps the previous name","no command or Undo entry and requires no additional dialog","row dragging for reordering or changing parents is scheduled for [V1.1]","layers-drag-drop-v11.md","Supported canvas reorder or reparent"])assert(s.includes(t),f+": missing "+t);for(const t of ["The default expansion on a newly opened project","Blank-name handling and exact validation feedback remain","Initial expansion, empty-project row presentation, blank-name validation","Detailed Layers drag-and-drop gestures remain an implementation question"])assert(!s.includes(t),"stale Layers rule: "+t);const b=fs.readFileSync("backlog/README.md","utf8");assert(!b.includes("remaining initial-expansion, empty-project, blank-name"),"stale Layers backlog");assert(b.includes("layers-drag-drop-v11.md"),"missing Layers V1.1 backlog link");assert(fs.readFileSync("backlog/layers-drag-drop-v11.md","utf8").includes("Scheduled for V1.1 by user decision."),"missing Layers V1.1 schedule");assert(s.includes("layer-visibility-v11.md")&&fs.readFileSync("backlog/layer-visibility-v11.md","utf8").includes("excluded from V1 and scheduled for V1.1"),"missing hide/show V1.1 schedule");for(const f of ["doc_v1/README.md","doc_v1/interface/properties-panel.md","doc_v1/interface/workspace-and-canvas.md","doc_v1/interface/react-components.md","doc_v1/interface/code-window.md","doc_v1/interface/svg-editing.md","doc_v1/architecture/canonical-document-model.md","doc_v1/architecture/command-engine-and-history.md","doc_v1/architecture/react-source-bindings.md","backlog/README.md",".unlazy/orc-web-coverage-audit.md"])assert(fs.readFileSync(f,"utf8").includes("layers-panel.md"),f+": missing Layers link");const p=fs.readFileSync("doc_v1/interface/properties-panel.md","utf8");assert(!p.includes("## Further Layers discussion"),"stale Properties Layers discussion");assert(!fs.readFileSync("backlog/README.md","utf8").includes("Revisit layer renaming"),"stale backlog discussion");assert(!fs.readFileSync(".unlazy/orc-web-coverage-audit.md","utf8").includes("detailed Layers controls still await discussion"),"stale current audit");for(const t of ["## Editing and feedback","## Image properties","## SVG properties","## Component properties","## Export"])assert(p.includes(t),"Properties contract lost: "+t);console.log("I5 Layers documentation check passed")'
  EXPECT: I5 Layers documentation check passed
  EVIDENCE: I5 passed on 2026-10-02 with all 54 selected documentation gates, 349 local links and anchors across 40 Markdown files, and git diff --check clean.
  Reviewed three changed files against the pre-edit snapshot; 37 Markdown files are unchanged, and these checks verify documentation rather than implemented Layers behavior.

- [x] I2: Image controls define Fit/Fill with preserved positioning and deferred visual positioning, preserve the box on replacement, validate before assignment, keep the old image on failure, and provide one Undo per completed edit.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/properties-panel.md": ["Fit shows the complete image within its box.", "Fill covers the box and may crop the image.", "Replacing the source preserves the existing box'"'"'s sizing rules, position, and fitting settings", "managed project asset", "The new image is not assigned until import succeeds.", "Cancellation or import or source validation failure keeps the current image assigned.", "creates one Undo entry.", "Undoing replacement restores the previous image and its settings.", "manual new-file insertion is deferred to V1.x.", "preserves the existing image position", "When no position is specified, use Center.", "Visual image-position controls, including the nine-position picker, are deferred to V1.x.", "Custom positioning remains editable through Code or an agent."], "backlog/properties-panel-v1x.md": ["Visual image-position controls, including the nine-position picker", "Existing positioning survives replacement, save/reopen, and export"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}assert(!fs.readFileSync("doc_v1/interface/properties-panel.md","utf8").includes("Properties shows a preview, Replace image, Fit or Fill, and image position."),"stale image-position control");console.log("I2 adoption documentation check passed")'
  EXPECT: I2 adoption documentation check passed
  EVIDENCE: I2 adoption documentation check passed; rerun 2026-10-01.

- [x] I3: Canvas tools respect layout ownership; single-frame Preview stays in the existing browser page, resets temporary session state, restores the Edit view, and separates deferred multi-frame comparison from V1.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/workspace-and-canvas.md": ["Select is active by default.", "Select uses the cursor icon.", "Dragging a selected object or frame moves it within the design under the current layout rules.", "Dragging a resize handle changes", "## Manual resizing", "## Keyboard movement", "by 1 px in unzoomed document units.", "Shift+arrow moves those objects by 8 px.", "Fit dimensions follow content", "Fill dimensions follow", "Both-edge constraints control the dimension", "never silently changes Fit, Fill, or constraint-controlled sizing to Fixed", "preserving its constraint choices", "Text editing, Properties inputs, Code, and focused menus retain", "Each completed keyboard movement or reorder is undoable", "Pan uses the hand icon.", "Dragging anywhere on the canvas, including over a frame or object, moves the workspace view.", "their saved positions and the current selection stay unchanged.", "Text is for creating and editing text.", "Click an existing Text object to edit it", "clicking a live control selects the design object instead of triggering that control.", "Preview gives pointer and keyboard interaction", "Preview does not save temporary interactions as design changes.", "Leaving Preview preserves the prior selection and workspace position.", "Escape during an active move or resize restores", "The object remains selected.", "Cancellation creates no document revision or Undo entry.", "Releasing the mouse completes the change as one command and one Undo step.", "With no active gesture or text edit, Escape selects the immediate parent."], "doc_v1/interface/svg-editing.md": ["required changes on both axes are supported", "never silently converts either axis"], "doc_v1/interface/text-editing.md": ["supports horizontal canvas resizing while its height follows wrapping"], "doc_v1/interface/properties-panel.md": ["Unavailable canvas resize axes show their sizing owner"], "doc_v1/interface/flex-layout.md": ["Left or Right reorders one selected participating child by one sibling position", "Cross-axis arrows do not take the object out of flow"], "doc_v1/interface/constraints.md": ["does not offer manual resizing on a both-edge-controlled axis"], "backlog/README.md": ["held-arrow command grouping"]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)};const preview={"doc_v1/interface/workspace-and-canvas.md": ["### Selected-frame workflow", "V1 previews one selected frame at a time.", "same localhost, in the same browser tab", "only that frame and its nested content", "Select one frame to preview", "Each Preview session starts from the latest applied design", "Unapplied Code is not executed", "Discard the temporary Preview input, open-state, and scroll state", "Entering, interacting with, and leaving Preview create no document revision", "portal container controls placement", "ordinary Tailwind `md:` utilities", "implementation decision rather than a promised automatic conversion", "multi-frame-preview-v1x.md"], "doc_v1/interface/react-components.md": ["one selected frame and its nested live components", "Temporary input and open state are discarded on exit", "Show content choices are restored", "Exit Preview usable"], "doc_v1/interface/motion.md": ["selected-frame workflow and session reset", "Preview animation progress is temporary"], "doc_v1/architecture/canonical-document-model.md": ["selected Preview frame and its temporary input", "Preview reset contract"], "doc_v1/architecture/system-architecture.md": ["Selected-frame Preview uses the same localhost", "does not introduce another project service"], "backlog/README.md": ["multi-frame Preview backlog", "selected-frame Preview"], "backlog/multi-frame-preview-v1x.md": ["later V1.x", "Outside V1; the exact release is not assigned.", "1. Select both frames.", "side by side", "same localhost", "Side-by-side display must not resize the saved design", "Interactions create no saved design changes", "not evidence that comparison Preview has been implemented or tested."]};for(const [f,terms]of Object.entries(preview)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}const comparison=fs.readFileSync("backlog/multi-frame-preview-v1x.md","utf8");assert(!comparison.includes("Shift-select"),"comparison entry must not prescribe Shift-select");assert(!comparison.includes("scheduled for V1.1"),"comparison release is not assigned");console.log("I3 adoption documentation check passed")'
  EXPECT: I3 adoption documentation check passed
  EVIDENCE: I3 passed on 2026-10-02 with all 54 selected documentation gates; 363 local links and anchors across 42 Markdown files passed, and git diff --check was clean.
  Reviewed seven changed files and one new backlog against the pre-edit snapshot; 34 Markdown files remain unchanged.
  These checks verify the documented Preview contract and release scope, not an implemented browser workflow.

- [x] I4: Flex and Constraints define parent/child participation, the adopted controls and resize behavior, define initial wrapper sizing, layout-mode switching, row wrapping, reparenting, small-parent limits, and selected-object canvas indicators, exclude Stretch, preserve Undo/layout intent, and retain unresolved browser/schema details.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");const required={"doc_v1/interface/flex-layout.md": ["Wrap in Flex, Row and Column directions, row wrapping, gap, padding, alignment, Space between, Fixed/Fit/Fill sizing", "Absolute children retain their parent and Layer identity but do not occupy a Flex slot.", "changing direction preserves sibling order", "Undo removes the wrapper and restores the original objects, parents, order, placement, and sizing.", "Expanding the controls does not change any values.", "paired control displays **Mixed**", "both relevant sides as one command and one Undo step.", "Undo restores the previous side values, including any asymmetry.", "Moving a participating Flex child reorders it; it does not silently make that child absolutely positioned.", "Turning Absolute Position off returns the child to its existing sibling position", "exports should preserve layout intent", "Independent row-gap and column-gap controls, Column wrapping, and detailed multi-line alignment remain open decisions.", "## Switching layout modes", "## Row wrapping", "Each completed switch is one command and one Undo step.", "Those measured dimensions become its starting Fixed width and height", "Existing Absolute Position children retain their placement", "**Wrap to next line**", "both spacing between items and spacing between rows", "share the available width within each row", "Two Fill cards on a final row can therefore be wider", "A Fit-height frame grows", "A Fixed-height frame keeps", "Derive rendered line membership", "current model sketch needs a defined mapping", "The person chooses Row or Column before committing.", "The new frame starts with an 8 px gap and 0 padding.", "After success, the new frame becomes selected", "The new frame starts with Fit sizing on each axis", "give the new wrapper a Fixed size on that axis.", "Do not change a valid Fit/Fill combination", "The exact wrapper-placement default remains open.", "An ordinary drop into a Flex frame joins its flow", "For multiple Fill children on the main axis, share the available space equally", "Fixed children keep their chosen dimensions", "show Fill as unavailable with **Set the parent'"'"'s width first.**", "Valid nested Fit/Fill combinations remain supported.", "| Mode | Accepted V1 meaning |"], "doc_v1/interface/constraints.md": ["Constraints apply to a child of a Free frame and to an Absolute Position child of a Flex frame.", "loose workspace objects do not receive parent-edge constraints.", "Both dropdowns and the diagram edit the same values and stay synchronized.", "Left & Right: fixed edge distances", "New free-positioned children default to Left and Top.", "Center alignment updates", "Undo restores the previous parent", "keeps the object at the dropped workspace position", "Preserve its existing constraint choices", "derive new edge distances or center offsets", "Moving an object to workspace root keeps its dropped workspace position", "one command and one Undo step.", "Left & Right preserves the left margin", "Top & Bottom preserves the top margin", "Keep the saved constraint distances throughout resizing", "Enlarging the parent restores the intended margins", "Measurements must match the expected document revision.", "proposals", "V1 does not offer proportional Stretch as a constraint mode.", "Changing a constraint preserves the currently measured box", "## Canvas constraint indicators", "For one selected eligible object in Edit mode", "Dotted line from the object'"'"'s left-edge midpoint", "Dotted lines toward both corresponding parent edges", "If already centered, show the marker alone.", "Horizontal and vertical indicators are independent.", "They have no numeric distance labels.", "Changes to constraint values still happen through Properties.", "Selection or indicator updates create no document revision or Undo entry."], "doc_v1/interface/workspace-and-canvas.md": ["Selection shows the applicable canvas constraint indicators in Edit mode.", "## Frame clipping", "Clipped objects remain in Layers", "Changing clipping preserves child positions, sizes, constraints, and layout rules.", "Undo restores the previous clipping value."], "doc_v1/interface/properties-panel.md": ["preserves the current position and size", "edge and Center choices; Stretch is excluded"], "doc_v1/architecture/canonical-document-model.md": ["fixed edge distances and center offsets", "Canvas constraint indicators are derived editor view state", "Do not replace those saved distances with measurements of the clamped layout."], "doc_v1/import-export/export.md": ["Canvas constraint indicators are editor overlays and are excluded from every export format."], ".unlazy/orc-web-coverage-audit.md": ["Stretch is excluded from V1 by user decision, with no backlog entry."]};for(const [f,terms]of Object.entries(required)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}assert(!fs.readFileSync("doc_v1/interface/flex-layout.md","utf8").includes("the starting proposal is equal shares"),"stale Fill proposal");for(const f of ["doc_v1/interface/constraints.md","doc_v1/interface/workspace-and-canvas.md","doc_v1/architecture/canonical-document-model.md","doc_v1/README.md"]){assert(!/proportional Stretch;|Both-edge and Stretch|from proportional Stretch|\| Stretch \||Its proportional Stretch mode/.test(fs.readFileSync(f,"utf8")),f+": stale Stretch support")}console.log("I4 adoption documentation check passed")'
  EXPECT: I4 adoption documentation check passed
  EVIDENCE: I4 adoption documentation check passed; rerun 2026-10-01 including paired-padding rules.

## Gates: Tokens panel and release scope, 2026-10-02

Scope: Record the accepted token workflow and V1.1 deferrals without changing unrelated researched plans or finalizing MCP.
These checks verify documentation coverage, links, and preservation, not implemented rendering behavior.

- [x] T1: A dedicated panel contract covers creation, presentation, editing, rename, deletion, counts, and view state.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/tokens-panel.md","utf8");for(const t of ["centered **Create token**","token count","Search","collapsible","Name","Opacity","100%","Enter or leaving the field","Escape cancels","one Undo step","This token is still in use. Replace or unlink it before deleting.","no object is automatically bound","Typography","V1.1","reference count","not a claim of implemented behavior"])if(!s.includes(t))throw Error("Missing panel decision: "+t);console.log("T1 panel coverage passed")'
  EXPECT: T1 panel coverage passed
  EVIDENCE: T1 panel coverage passed; reviewed the complete dedicated panel contract on 2026-10-02.

- [x] T2: Token definitions preserve identity, CSS naming, units, explicit links, mode resolution, source authority, and open implementation questions.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/tokens-and-modes.md","utf8");for(const t of ["stable ID","CSS variable","Renaming","not automatically linked","units","Dark override","one default value","Only this / All copies","orphan token","Open implementation decisions","imported-token-management-v11.md","typography-tokens-v11.md","token-modes-v11.md"])if(!s.includes(t))throw Error("Missing token decision: "+t);for(const t of ["**+ Add** token action","The Tokens panel has a Light or Dark editing view."])if(s.includes(t))throw Error("Stale token rule: "+t);console.log("T2 token model coverage passed")'
  EXPECT: T2 token model coverage passed
  EVIDENCE: T2 token model coverage passed; earlier reference, unlink, creation, inheritance, and export rules were retained or linked, with the agreed release changes explicit.

- [x] T3: Properties links the panel and maps compatible V1 categories while preserving atomic creation, unlinking, ownership, and units.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/properties-panel.md","utf8");for(const t of ["tokens-panel.md","| Color |","| Spacing |","| Corner radius |","Flex Gap and Padding","combined radius or an individual corner","preserves its unit","**Unlink token**","Only this / All copies","Creation and application to the initiating property form one command and one Undo step.","Typography token editors","V1.1"])if(!s.includes(t))throw Error("Missing Properties decision: "+t);console.log("T3 Properties connections passed")'
  EXPECT: T3 Properties connections passed
  EVIDENCE: T3 Properties connections passed; existing Properties and source-ownership gates also passed.

- [x] T4: Three dedicated V1.1 backlogs retain mode controls, individual typography values, and imported-token scope without deferring rendering.
  CHECK: node -e 'const fs=require("node:fs"),r=fs.readFileSync("backlog/README.md","utf8"),map={"token-modes-v11.md":["Uses Light value","Use Light value","one Undo step","Existing Dark overrides"],"typography-tokens-v11.md":["Font family","Font size","Font weight","Line height","Letter spacing","existing typography tokens"],"imported-token-management-v11.md":["V1.1","CSS variables","known types","different origins","source"]};for(const [f,terms]of Object.entries(map)){if(!r.includes(f))throw Error("Unindexed backlog: "+f);const s=fs.readFileSync("backlog/"+f,"utf8");for(const t of terms)if(!s.includes(t))throw Error(f+": missing "+t)}if(fs.readFileSync("backlog/token-modes-v11.md","utf8").includes("needs alignment in the next specification update"))throw Error("Stale alignment task");console.log("T4 V1.1 scope coverage passed")'
  EXPECT: T4 V1.1 scope coverage passed
  EVIDENCE: T4 V1.1 scope coverage passed; three dedicated backlogs are indexed, with existing styles and saved values preserved and aliases retaining their separate later-version scope.

- [x] T5: Entry points, architecture, imports, exports, and adoption audit link the correct authorities.
  CHECK: node -e 'const fs=require("node:fs"),map={"doc_v1/README.md":["tokens-panel.md","typography-tokens-v11.md"],"doc_v1/interface/workspace-and-canvas.md":["tokens-panel.md"],"doc_v1/interface/layers-panel.md":["tokens-panel.md"],"doc_v1/architecture/canonical-document-model.md":["CSS variable","tokens-panel.md"],"doc_v1/architecture/command-engine-and-history.md":["tokens-panel.md"],"doc_v1/import-export/component-import.md":["imported-token-management-v11.md"],"doc_v1/import-export/tailwind-components.md":["imported-token-management-v11.md"],"doc_v1/import-export/export.md":["token-modes-v11.md"],".unlazy/orc-web-coverage-audit.md":["tokens-panel.md","T1","Typography"]};for(const [f,terms]of Object.entries(map)){const s=fs.readFileSync(f,"utf8");for(const t of terms)if(!s.includes(t))throw Error(f+": missing "+t)}console.log("T5 token entry points passed")'
  EXPECT: T5 token entry points passed
  EVIDENCE: T5 token entry points passed; workspace, Layers, Properties, model, commands, imports, exports, and the second-ittraton audit link the token authorities.

- [x] T6: Review the complete batch diff, resolve links and anchors, run applicable existing gates, and verify unrelated researched plans and MCP files are unchanged.
  CHECK: git diff --check
  EXPECT: No whitespace errors.
  EVIDENCE: git diff --check passed; 26/26 selected documentation checks passed, including T1–T6 and 20 existing gates; 308 local links and anchors across 39 Markdown files passed on 2026-10-02.
  EVIDENCE: Reviewed the complete token batch against its pre-edit snapshot: 16 existing files updated, two added, no files removed, and 21 existing Markdown files unchanged, including Text, Fonts, SVG, source bindings, AGENTS, and all MCP documents.
  EVIDENCE: New and changed files passed trailing-whitespace and duplicate-heading checks; a duplicate heading found during review was corrected before completion.

## Gates: Code window refinements, 2026-10-02

Scope: Refine source display, explicit Apply, draft protection, and clipboard boundaries without adding another source authority or external repository synchronization.
These are documentation checks, not application tests.

- [x] CW1: Source scopes, highlighting, and two-way synchronization preserve ownership and selection.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/code-window.md","utf8");for(const t of ["## Source display and scope","Hero → Heading · Component source · All copies","Hero · This instance","## Design and Code synchronization","source binding","Opening or highlighting source preserves","does not create a second editable source authority"])if(!s.includes(t))throw Error("Missing source rule: "+t);console.log("CW1 source coverage passed")'
  EXPECT: CW1 source coverage passed
  EVIDENCE: CW1 source coverage passed; reviewed the source-display table, owner navigation, scope labels, and retained Only this / All copies boundary.

- [x] CW2: Explicit Apply, toolbar states, and the same-source visual-edit guard protect session drafts.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/code-window.md","utf8");for(const t of ["## Draft controls","Unapplied changes","Discard changes","## Visual edits with a draft","Before previewing or changing","Discard unapplied changes?","Switching between instance and component-source scopes","does not silently apply or merge","Typing alone does not compile","Disabled","Cancel"])if(!s.includes(t))throw Error("Missing draft rule: "+t);console.log("CW2 draft coverage passed")'
  EXPECT: CW2 draft coverage passed
  EVIDENCE: CW2 draft coverage passed; selection, scope, window-close, and same-source visual-edit paths require explicit discard or cancellation without silently applying a draft.

- [x] CW3: Clipboard actions distinguish applied selection, visible component source, and normal text copying; research limits remain explicit.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/code-window.md","utf8");for(const t of ["## Copy and export boundaries","Copy selection","Copy component source","including unapplied changes","Ctrl+C","dependency closure","## Research basis","2026-09-16","silently committed","not proven","Copy as Tailwind"])if(!s.includes(t))throw Error("Missing copy rule: "+t);console.log("CW3 clipboard coverage passed")'
  EXPECT: CW3 clipboard coverage passed
  EVIDENCE: CW3 clipboard coverage passed; applied-only exports and MCP reads remain intact, with intentional human source-copy behavior and the supplied research limits explicit.

- [x] CW4: Connected contracts link the Code authority; the complete batch diff, existing gates, local links, and protected files pass review.
  CHECK: git diff --check && node -e 'const fs=require("node:fs");for(const [f,t]of Object.entries({"doc_v1/interface/properties-panel.md":"code-window.md#visual-edits-with-a-draft","doc_v1/architecture/react-source-bindings.md":"code-window.md#visual-edits-with-a-draft","doc_v1/architecture/command-engine-and-history.md":"Code scope and highlighting","doc_v1/import-export/export.md":"code-window.md#copy-and-export-boundaries","doc_v1/README.md":"Source scopes",".unlazy/orc-web-coverage-audit.md":"CW1–CW4"}))if(!fs.readFileSync(f,"utf8").includes(t))throw Error(f+": missing Code connection");console.log("CW4 connected contracts passed")'
  EXPECT: No whitespace errors; no unrelated file changes in this batch.
  EVIDENCE: All 48 selected documentation gates passed, including CW1–CW4; 319 local links and anchors across 39 Markdown files passed on 2026-10-02.
  EVIDENCE: Reviewed the complete batch against its pre-edit snapshot: eight existing files changed, 31 unchanged, no files added or removed; AGENTS, backlogs, Text/Fonts/SVG plans, tokens, and all MCP documents are unchanged in this batch.
  EVIDENCE: No trailing whitespace or new duplicate headings; retained the existing Properties title/subheading pair without expanding this batch into unrelated cleanup.
  EVIDENCE: These checks verify the written contracts only; no application runtime or platform tests were run.

### Selection, history, and diagnostics follow-up

- [x] CW5: Structural Apply preserves verified identity, selects a verified surviving parent after deletion, clears uncertain handles, and keeps selection on failure.
  CHECK: node -e 'const fs=require("node:fs"),s=fs.readFileSync("doc_v1/interface/code-window.md","utf8");for(const t of ["## Selection after Apply","Text or styling changes","Reordering an existing layer","nearest surviving design parent","workspace root is not a selectable object","If Apply fails, keep the previous design and selection.","If continuity cannot be proved"])if(!s.includes(t))throw Error("Missing selection rule: "+t);for(const f of ["doc_v1/interface/layers-panel.md","doc_v1/architecture/react-source-bindings.md"])if(!fs.readFileSync(f,"utf8").includes("code-window.md#selection-after-apply"))throw Error("Missing selection connection: "+f);console.log("CW5 selection coverage passed")'
  EXPECT: CW5 selection coverage passed
  EVIDENCE: CW5 passed; Code, Layers, and source bindings distinguish verified continuity, known deletion with a verified parent, and uncertain replacement without guessing an identity.

- [x] CW6: Document Undo/Redo protects an overlapping draft while Code typing retains text history and unrelated source changes remain available.
  CHECK: node -e 'const fs=require("node:fs"),s=fs.readFileSync("doc_v1/interface/code-window.md","utf8");for(const t of ["### Undo and Redo with a draft","Ctrl+Z while typing","Before document Undo or Redo changes","**Discard**","**Cancel**","history position","refreshes Code from the resulting applied state","Undo or Redo that affects unrelated source","does not silently apply or merge"])if(!s.includes(t))throw Error("Missing history rule: "+t);if(!fs.readFileSync("doc_v1/architecture/command-engine-and-history.md","utf8").includes("code-window.md#undo-and-redo-with-a-draft"))throw Error("Missing history connection");console.log("CW6 history coverage passed")'
  EXPECT: CW6 history coverage passed
  EVIDENCE: CW6 passed; reviewed text-history routing, discard-and-refresh, cancellation with unchanged history position, and unrelated-source Undo/Redo without discarding the draft.

- [x] CW7: Diagnostics identify the affected source, highlight only reliable authored-source locations, preserve the draft and design, and retain existing documentation boundaries.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/code-window.md","utf8");for(const t of ["affected component or file","exact location in the authored source","highlight that line in the draft","do not guess a line","Hero.tsx · Line 12","current editing session for correction"])if(!s.includes(t))throw Error("Missing diagnostic rule: "+t);console.log("CW7 diagnostic coverage passed")'
  EXPECT: CW7 diagnostic coverage passed; complete batch diff, links, whitespace, and existing gates pass review.
  EVIDENCE: All 51 selected documentation gates passed, including CW5–CW7; 324 local links and anchors across 39 Markdown files passed on 2026-10-02, with git diff --check clean.
  EVIDENCE: Reviewed the complete follow-up diff against its pre-edit snapshot: six existing files changed, 33 unchanged, no files added or removed, and no new duplicate headings or trailing whitespace.
  EVIDENCE: Application code, AGENTS, backlogs, Properties, workspace, token plans, Text/Fonts/SVG plans, and MCP documents are unchanged in this batch; these are static documentation checks, not runtime or platform test results.

## Gates: Component import refinements, 2026-10-02

Scope: Document usable component selection, initial inputs, preparation, faithful preview, destination layout, and one-command placement.
These checks verify written contracts, not an implemented importer.

- [x] IM1: The existing source routes and single Import authorization lead to usable component selection without treating every export as placeable.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/import-export/component-import.md","utf8");for(const t of ["Package, Registry, or Local","One **Import** action","## Choosing a usable component","Hooks and utilities","composed example","source generated by an npx command","Inspection is read-only."])if(!s.includes(t))throw Error("Missing selection rule: "+t);console.log("IM1 source selection passed")'
  EXPECT: IM1 source selection passed
  EVIDENCE: Source-selection checks passed: read-only inspection, one Import authorization, usable entries, supplied compositions, and generated-source choices.

- [x] IM2: Preview readiness requires supported initial inputs, source, dependencies, styles, and successful rendering without invented behavior or changes to existing designs.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/import-export/component-import.md","utf8");for(const t of ["## Initial inputs","declared defaults","author or agent","missing required inputs","## Preparation and preview","Ready to place","same supported rendering","Tailwind compiler","requires Node","does not overwrite","not invent data or behavior"])if(!s.includes(t))throw Error("Missing readiness rule: "+t);console.log("IM2 preview readiness passed")'
  EXPECT: IM2 preview readiness passed
  EVIDENCE: Readiness checks passed: supported defaults and required inputs, Bun/Node requirements, Tailwind compilation, scoped styles, and successful initial rendering are documented without claiming full interaction validation.

- [x] IM3: Placement validates destinations and drafts, commits once, selects the root, and supports Undo; portable dependency records preserve exact versions while installations and builds remain local data.
  CHECK: node -e 'const fs=require("node:fs"),s=fs.readFileSync("doc_v1/import-export/component-import.md","utf8");for(const t of ["## Placement and completion","Free frame","Flex frame","one command and one Undo entry","Before adding the object","Code draft safeguard","Undo removes the placed instance","Redo restores","Cancellation or placement failure","exact dependency information"])if(!s.includes(t))throw Error("Missing placement rule: "+t);for(const [f,t]of Object.entries({"doc_v1/interface/properties-panel.md":"component-import.md#placement-and-completion","doc_v1/import-export/tailwind-components.md":"component-import.md#preparation-and-preview","doc_v1/architecture/command-engine-and-history.md":"component-import.md#placement-and-completion","doc_v1/README.md":"preview readiness",".unlazy/orc-web-coverage-audit.md":"IM1–IM3"}))if(!fs.readFileSync(f,"utf8").includes(t))throw Error("Missing import connection: "+f);const assert=require("node:assert/strict"),b=fs.readFileSync("doc_v1/architecture/orc-workspace-bundle.md","utf8");for(const t of ["application installation","exact dependency manifest and lockfile","direct and transitive package versions","rebuildable local data","fresh computer may require internet access","without silently substituting a different version","writable-session lock and package dependency lockfile"])assert(b.includes(t),"Missing portable dependency rule: "+t);for(const f of ["doc_v1/import-export/component-import.md","doc_v1/import-export/tailwind-components.md","backlog/stack-proposal.md","backlog/README.md"])assert(fs.readFileSync(f,"utf8").includes("orc-workspace-bundle.md#managed-dependencies"),"Missing dependency connection: "+f);assert(!fs.readFileSync("doc_v1/import-export/tailwind-components.md","utf8").includes("without relying on a mutable package registry"),"Stale offline portability wording");console.log("IM3 placement and connections passed")'
  EXPECT: IM3 placement and connections passed; full batch diff, existing gates, local links, and preservation checks pass.
  EVIDENCE: All 54 selected documentation gates passed on 2026-10-03; 381 local links and anchors across 42 Markdown files passed, with git diff --check clean.
  Reviewed the complete backend batch against its pre-edit snapshot: 13 existing files changed, 29 unchanged, no files added or removed.
  These are static documentation checks; the local rendering service and application runtime remain unverified.

## Gates: Application integration skills, 2026-10-03

Scope: Record the X discussion's conclusion and create two focused agent workflows with actual verification and user agreement before failure repair.
These gates check authored documentation and skill structure; execution against an application still needs implementation evidence.

- [x] SK1: Both skills have matching names, invocation descriptions, bounded instructions, persistent evidence checkpoints, and the report/discuss/agree/fix rule.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict");for(const name of ["orc-repo-sync","orc-design-import"]){const s=fs.readFileSync("skills/"+name+"/SKILL.md","utf8");assert(s.startsWith("---\nname: "+name+"\ndescription: >-\n"),name+": invalid frontmatter");assert(s.includes("Use when a user requests"),name+": missing trigger");assert(s.trimEnd().split("\n").length<100,name+": instructions exceed the focused skill limit");for(const t of ["one persistent checkpoint file","exact command, exit result","wait for the user\u0027s agreement before applying it","rerun the affected checks","required operations are unavailable","instructions conflict"])assert(s.includes(t),name+": missing "+t)}console.log("SK1 skill structure and failure safeguards passed")'
  EXPECT: SK1 skill structure and failure safeguards passed
  EVIDENCE: Both skill frontmatter blocks and descriptions passed structural validation; instructions remain under 100 lines and explicitly require user agreement before repairing any failure, including baseline failures.

- [x] SK2: The discussion conclusion and skill directions are indexed with execution prerequisites, no new V1 release requirement, verified import delivery, and a main-targeted integration PR.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),b=fs.readFileSync("backlog/application-integration-skills.md","utf8");for(const t of ["## Discussion basis and conclusion","A freeform workspace", "Local files, a browser interface, and MCP are separate choices.","does not add a V1 release requirement","unverified","original application source intact","pull request targeting `main`","User agreement authorizes a repair; it does not make a failed check pass.","## Remaining implementation work"])assert(b.includes(t),"Missing integration decision: "+t);for(const f of ["doc_v1/README.md","backlog/README.md","doc_v1/import-export/component-import.md","doc_v1/import-export/export.md"])assert(fs.readFileSync(f,"utf8").includes("application-integration-skills.md"),"Missing integration pointer: "+f);const sync=fs.readFileSync("skills/orc-repo-sync/SKILL.md","utf8"),imp=fs.readFileSync("skills/orc-design-import/SKILL.md","utf8");for(const t of ["Review the complete task diff against `main`","actual application","actual PR targets `main`","without merging it"])assert(sync.includes(t),"Missing integration completion: "+t);for(const t of ["original application files remain unchanged","save and reopen","shared command engine","Deliver the verified ORC project and checkpoint"])assert(imp.includes(t),"Missing import completion: "+t);console.log("SK2 directions, scope, and completion boundaries passed")'
  EXPECT: SK2 directions, scope, and completion boundaries passed
  EVIDENCE: The backlog plan, both skills, and all four documentation entry points passed coverage checks; missing operations remain blockers and application execution remains unverified.

- [x] SK3: Review the whole batch, validate local links and anchors including skills, check whitespace, and preserve all files outside the agreed scope.
  CHECK: git diff --check && ! rg -n '[[:blank:]]+$' skills backlog/application-integration-skills.md
  EXPECT: No whitespace errors; local links, skill metadata, and the pre-edit snapshot comparison pass.
  EVIDENCE: Reviewed the complete batch diff; 57/57 selected static gates and 413 local links/anchors across 45 Markdown files passed on 2026-10-03, with git diff --check clean.
  EVIDENCE: Five existing files updated, three files added, no files removed, and 38 existing files unchanged, including AGENTS, architecture contracts, panel specifications, researched plans, and MCP drafts.
  EVIDENCE: These checks validate documentation and skill instructions; no application integration was executed and no PR, commit, or push was created in this task.

## Gates: Local MCP connection and reads, 2026-10-03

Scope: Record accepted localhost HTTP, connection lifetime, repeated agent/designer turns, and context/source reads, with SDK research and the remaining inventory explicitly separate.
These are static documentation checks, not a tested MCP server or client connection.

- [x] MC1: Local HTTP uses the existing Bun backend, preserves project/Undo authority, distinguishes editor and MCP addresses, and records normal turn-taking and process lifetime without new editing coordination controls.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),s=fs.readFileSync("doc_v1/mcp/mcp-server.md","utf8");for(const t of ["Accepted V1 transport","plain localhost HTTP","http://127.0.0.1:<backend-port>/mcp","not the editor page","does not keep a separate design document","Command success and disk-save success remain separate","Configure the agent","Finishing an agent task does not deliberately disconnect","Ask the agent","wait for it to finish","not a new editor lock","no separate agent-to-human feedback loop","Person closes only the editor tab","Person closes the agent","Person stops ORC-web from the terminal","normal-terminal-shutdown","local-rendering-service"])assert(s.includes(t),"Missing connection decision: "+t);for(const f of ["doc_v1/architecture/react-source-bindings.md","doc_v1/interface/react-components.md"])assert(fs.readFileSync(f,"utf8").includes("mcp/mcp-server.md#agent-and-designer-iteration"),"Missing repeated-turn workflow: "+f);console.log("MC1 local connection and iteration coverage passed")'
  EXPECT: MC1 local connection and iteration coverage passed
  EVIDENCE: Static connection, shared authority, endpoint, lifetime, and repeated-turn checks passed on 2026-10-03; no running MCP connection was tested.

- [x] MC2: The focused read tools return applied-state context, object/tree/token/measurement details, and source with matching revisions, stable owners, instance/shared scope, diagnostic boundaries, and no private draft exposure or design mutation.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),s=["read-tools.md","tools/get_context.md","tools/get_source.md","tools/get_component_source.md","tools/get_node.md","tools/get_tree.md","tools/list_design_tokens.md","tools/get_computed_styles.md"].map(f=>fs.readFileSync("doc_v1/mcp/"+f,"utf8")).join("\n");for(const t of ["Accepted V1 responsibilities","Exact input/output schemas","## get_context","## get_source","same applied state","awaiting autosave is already applied","do not mutate the design","exclude unapplied Code-window typing","frames and loose root objects","without requiring the person to select","Stable editing targets","canonical owner","instance","shared component implementation","instead of inventing an authored file or line number","not a promise","candidate application or a later runtime interaction","Closing the editor tab","not claims that the MCP tools already pass"])assert(s.includes(t),"Missing read decision: "+t);assert(s.includes("HTML/CSS")&&s.includes("React/JSX/TSX")&&s.includes("Tailwind")&&s.includes("Motion"),"Read scope lost rendering/source families");console.log("MC2 applied context and source coverage passed")'
  EXPECT: MC2 applied context and source coverage passed
  EVIDENCE: Static applied-state, revision, source-scope, diagnostic, and draft-exclusion checks passed on 2026-10-03; runtime read behavior remains unverified.

- [x] MC3: Dated protocol/SDK findings and APIs remain research recommendations with real sources, Bun integration, older-client compatibility, error/cancellation behavior, optional-feature scope, and explicit platform checks still needed.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),s=fs.readFileSync("doc_v1/mcp/sdk-and-protocol-research.md","utf8");for(const t of ["Research verified on 2026-10-03","2026-07-28","2.3.0","2.9.0","Recommended protocol target","Recommended application server SDK","fresh MCP server wrapper per HTTP request","must not create a new project service or Undo history","fromJsonSchema","ctx.mcpReq.signal","ctx.mcpReq.notify","stdio","not proof","older MCP clients","isError: true","does not silently undo","not an agreement to add them","TypeScript 6","Fedora and Windows","implementation checks still needed"])assert(s.includes(t),"Missing research boundary: "+t);for(const u of ["https://claude.com/blog/bringing-mcp-2026-07-28-to-claude","https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.3.0","https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio"])assert(s.includes(u),"Missing official source: "+u);assert(fs.readFileSync("backlog/stack-proposal.md","utf8").includes("No exact MCP package pin"),"Research promoted to accepted application pin");console.log("MC3 SDK research and verification boundaries passed")'
  EXPECT: MC3 SDK research and verification boundaries passed
  EVIDENCE: Dated release findings, SDK recommendations, official source links, compatibility, and remaining implementation checks passed static review on 2026-10-03.

- [x] MC4: Active MCP documents are indexed, archived tables remain provisional, links and whitespace pass, and the batch preserves unrelated files.
  CHECK: git diff --check && node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),map={"doc_v1/README.md":["mcp/mcp-server.md","mcp/read-tools.md","mcp/sdk-and-protocol-research.md","MCP backlog"],"doc_v1/architecture/system-architecture.md":["mcp/mcp-server.md","mcp/read-tools.md"],"backlog/README.md":["mcp/mcp-server.md","mcp/read-tools.md","mcp/sdk-and-protocol-research.md"],"backlog/mcp/mcp-server.md":["Provisional","../../doc_v1/mcp/mcp-server.md"],"backlog/mcp/tool-catalog.md":["Provisional","39 candidate public MCP tools","../../doc_v1/mcp/read-tools.md"],"backlog/mcp/command-contracts.md":["Provisional","../../doc_v1/mcp/read-tools.md"],".unlazy/orc-web-coverage-audit.md":["MC1–MC4","Local MCP transport and read responsibilities are accepted"]};for(const [f,terms]of Object.entries(map)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": missing "+t)}console.log("MC4 MCP entry points and provisional inventory passed")'
  EXPECT: No whitespace errors; MCP entry points, local links/anchors, and the pre-edit snapshot comparison pass.
  EVIDENCE: Reviewed the complete batch diff; 58/58 selected static gates, 469 local links/anchors across 48 Markdown files, and git diff --check passed on 2026-10-03. Three files added, 11 existing files changed, no files removed, and 34 files unchanged; all 39 archived tool rows and command tables were preserved. No MCP runtime or platform test, commit, or push occurred.

## Gates: Individual MCP tools and HTML insertion, 2026-10-04

Scope: Give the four agreed tools dedicated contracts and record the complete refined `insert_html` behavior without finalizing its wire schema or the remaining inventory.
These gates check documentation coverage; the actual editor proof is still required.

- [x] MT1: Each agreed tool has a dedicated file, shared read rules remain linked, and context/source ownership survives the split.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),index=fs.readFileSync("doc_v1/mcp/tools/README.md","utf8"),overview=fs.readFileSync("doc_v1/mcp/read-tools.md","utf8");for(const name of fs.readdirSync("doc_v1/mcp/tools").filter(f=>f.endsWith(".md")&&f!=="README.md").map(f=>f.slice(0,-3))){const f="doc_v1/mcp/tools/"+name+".md",s=fs.readFileSync(f,"utf8");assert(s.startsWith("# "+name+"\n"),f);assert(s.includes("Accepted V1"),f);assert(index.includes(name+".md"),f);assert(fs.readFileSync("doc_v1/README.md","utf8").includes("mcp/tools/"+name+".md"),f)}for(const name of ["get_context","get_source","get_component_source","get_node","get_tree","list_design_tokens","get_computed_styles"])assert(overview.includes("tools/"+name+".md"),name);for(const f of ["get_context","get_source","get_component_source","get_node","get_tree","list_design_tokens","get_computed_styles"].map(n=>"doc_v1/mcp/tools/"+n+".md"))assert(fs.readFileSync(f,"utf8").includes("../read-tools.md#shared-read-behavior"),f);console.log("MT1 individual tool organization passed")'
  EXPECT: MT1 individual tool organization passed, with the existing MC2 ownership and applied-read check also passing.
  EVIDENCE: MT1 and the updated MC2 passed on 2026-10-04; reviewed the moved read responsibilities and retained overview links.

- [x] MT2: Frame creation retains chosen geometry, freeform hierarchy, stable identity, one command, and validation before any committed creation.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/create_frame.md","utf8"),assert=require("node:assert/strict");for(const t of ["Expected applied revision","unzoomed document units","not automatically create or link phone","applicable ancestor locks","fresh stable ID","one Undo entry","success does not mean","before a save location exists","unchanged","Draw frame","Redo restores its saved identity","prior session","has not been tested"])assert(s.includes(t),"Missing frame rule: "+t);console.log("MT2 frame contract coverage passed")'
  EXPECT: MT2 frame contract coverage passed.
  EVIDENCE: Static frame-contract coverage passed on 2026-10-04; runtime creation remains untested.

- [x] MT3: HTML insertion covers destinations, meaningful Layers/semantics, inline styling, assets/tokens, compact results, atomic failure, source/history, and the required mixed-layout editor proof.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/insert_html.md","utf8"),assert=require("node:assert/strict");for(const t of ["Append after existing children","Multiple roots are allowed","one root object","no parent-edge constraints","inline CSS","missing Properties control alone","unavailable stylesheets","<style>","Grid remains outside","Base UI/shadcn","Motion","no artificial wrappers","intentionally empty container","heading role","meaningful spaces","formatting ranges","layer-name","ordinary HTML `id`","background image remains part","path-point","stable token binding","Literal values remain literal","fallback","dangling committed records","one Undo step","created root IDs","created-object count","supersedes the earlier","entire insertion","Undo history unchanged","reliable fragment location","get_source","prior session","replace_node_html","not a runnable payload","24 to 32","Save and reopen","not passed tests","not Paper"])assert(s.includes(t),"Missing HTML insertion rule: "+t);console.log("MT3 HTML insertion coverage passed")'
  EXPECT: MT3 HTML insertion coverage passed.
  EVIDENCE: Static coverage and manual review include the original snapshot and all five accepted refinements; the actual mixed-layout MCP/editor test has not been run.

- [x] MT4: Connected entry points and backlog references identify the active individual contracts, archived tables stay provisional, and the reviewed batch passes whitespace and local-link checks.
  CHECK: git diff --check && node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),map={"doc_v1/mcp/mcp-server.md":["tools/README.md","tools/create_frame.md","tools/insert_html.md"],"doc_v1/interface/layers-panel.md":["../mcp/tools/insert_html.md#layers-hierarchy-and-object-kinds"],"backlog/README.md":["mcp/tools/create_frame.md","mcp/tools/insert_html.md","mcp/tools/README.md"],"backlog/mcp/tool-catalog.md":["Provisional","39 candidate public MCP tools","take precedence","get_context.md","get_source.md","create_frame.md","insert_html.md"],"backlog/mcp/command-contracts.md":["Provisional","mcp/tools/README.md"],".unlazy/orc-web-coverage-audit.md":["MT1–MT4","Mixed-layout insertion"]};for(const [f,terms]of Object.entries(map)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": "+t)}console.log("MT4 tool entry points and provisional inventory passed")'
  EXPECT: MT4 passes; local links/anchors and the pre-edit snapshot comparison confirm preserved archival tables and unrelated documents.
  EVIDENCE: Reviewed the batch against its pre-edit snapshot on 2026-10-04: 62/62 selected static checks, 536 local links/anchors across 53 Markdown files, and git diff --check passed; five files added, nine existing files updated, none removed, and 39 existing files unchanged.
  EVIDENCE: All 39 archived tool rows and archived command tables are unchanged; application code, AGENTS, architecture contracts, SDK research, and deferred release schedules were preserved.

## Gates: Component MCP creation and updates, 2026-10-04

Scope: Record the accepted agent-authored React composition workflow in four dedicated tool contracts, reusing ORC-web's component preparation, binding, renderer, and command services.
These gates verify documentation coverage and preservation; the combined MCP/editor proof remains an implementation requirement.

- [x] CT1: Each component tool has its own accepted contract and index entries, with accepted core JSON, remaining schema details, and runtime verification status explicit.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),index=fs.readFileSync("doc_v1/mcp/tools/README.md","utf8"),root=fs.readFileSync("doc_v1/README.md","utf8");for(const n of ["inspect_component_import","import_component","update_component_props","update_component_source"]){const f="doc_v1/mcp/tools/"+n+".md",s=fs.readFileSync(f,"utf8");assert(s.startsWith("# "+n+"\n"),f);assert(s.includes("Accepted V1"),f);assert(s.includes("## Agreed JSON exchange")&&s.includes("remain implementation decisions"),f);assert(s.includes("not been verified")||s.includes("not been implemented or verified"),f);assert(index.includes(n+".md")&&root.includes("mcp/tools/"+n+".md"),f)}assert(index.includes("accepted V1 responsibilities"));const archive=fs.readFileSync("backlog/mcp/tool-catalog.md","utf8");for(const t of ["Provisional","39 candidate public MCP tools","broad responsibilities were reused","accepted application architecture"])assert(archive.includes(t),t);console.log("CT1 dedicated contracts and status boundaries passed")'
  EXPECT: CT1 dedicated contracts and status boundaries passed.
  EVIDENCE: CT1 passed on 2026-10-04; all four dedicated files and index entries preserve accepted responsibilities, open schemas, and unverified implementation status.

- [x] CT2: Inspection supports authored/referenced sources, reports requirements and per-value editing limits, executes no candidate package commands, and requires source freshness before import.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/inspect_component_import.md","utf8"),assert=require("node:assert/strict");for(const t of ["Agent-authored JSX/TSX","Local source","npm package","npx-based workflow","shadcn registry item","entry file and export","required local imports","unrelated installed package","does not need a hand-written manifest","Base UI-flavored shadcn","Radix","Eligibility belongs to each value","does not execute package commands","does not write applied project files","increase the design revision","new inspection","expected project revision","generated source that does not yet exist","not a Ready to place render result"])assert(s.includes(t),"Missing inspection rule: "+t);console.log("CT2 read-only component inspection passed")'
  EXPECT: CT2 read-only component inspection passed.
  EVIDENCE: CT2 passed static coverage on 2026-10-04, including generated-source limits, per-value recognition, no package execution, and inspected-source freshness; actual server behavior remains untested.

- [x] CT3: Import accepts one composed multi-file design after inspection, covers all rendering families and destination rules, validates before atomic placement, preserves portable records, and records the complete editor proof.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/import_component.md","utf8"),assert=require("node:assert/strict");for(const t of ["one Import call","first uses","source-transfer formats","LandingPage.tsx","Tailwind CSS v4","HTML and plain CSS","Base UI-flavored shadcn","Motion for React","SVG","does not require the designer","initial props and local sample data","source still matches the inspection","changed inspected inputs","one new revision","one Undo step","component definition ID","placed instance/root ID","unzoomed canvas position","Free frame","Flex container","same frame","runtime DOM descendant","supported nested source-backed Layers","V1.1","unchanged","remain cached","exact dependency manifest and lockfile","command success is distinct from disk-save success","## Required composition proof","actual ORC-web MCP endpoint","related JSX and CSS","Undo/Redo","Save, confirm Saved, and reopen","not passed implementation tests"])assert(s.includes(t),"Missing composition rule: "+t);console.log("CT3 composed import and required proof passed")'
  EXPECT: CT3 composed import and required proof passed.
  EVIDENCE: CT3 passed static coverage on 2026-10-04; the source bundle, full rendering stack, placement, atomic failure, history/save/export, and combined proof are recorded without claiming a tested MCP/editor workflow.

- [x] CT4: Prop changes target one instance-owned input, validate its contract and bindings, remain atomic, and preserve correct source/identity/history/save behavior.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/update_component_props.md","utf8"),assert=require("node:assert/strict");for(const t of ["one existing component instance","expected applied revision","stable component instance target","types, choices, asset/token rules","does not rewrite a shared default","Other instances retain","unexposed transition expression","not an instance prop","Slots, collection records","Temporary Preview","one invalid input","one Undo step","revalidate any structure","no draft is silently applied","Command success does not establish","initially identical","first remains unchanged","not yet passed"])assert(s.includes(t),"Missing prop rule: "+t);console.log("CT4 instance-prop ownership and validation passed")'
  EXPECT: CT4 instance-prop ownership and validation passed.
  EVIDENCE: CT4 passed static coverage on 2026-10-04; instance ownership, contract validation, atomic input changes, conditional identity checks, draft exclusion, and initially identical-instance verification requirements are recorded.

- [x] CT5: Related source files update together under explicit ownership, Only this retains tested copying limits, existing inputs/bindings remain valid, and failures/history/save/export use existing services.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/update_component_source.md","utf8"),assert=require("node:assert/strict");for(const t of ["Related changes can be submitted together","explicit Only this","All copies","actual local definition path","outer component alone is insufficient","package primitives","Captured module values","shadowed imports","Arbitrary closure","existing instance props, slots, and local collection values","one new revision","one Undo step","either applies together","required property, slot, or collection value","never retarget an old handle","Tailwind styles are rebuilt","SVG remains vector source","No partial source-file update","Undo of Only this","exact dependency records","not a passed ORC-web MCP/editor test"])assert(s.includes(t),"Missing source rule: "+t);console.log("CT5 atomic source updates and copying boundary passed")'
  EXPECT: CT5 atomic source updates and copying boundary passed.
  EVIDENCE: CT5 passed static coverage on 2026-10-04; related-file atomicity, shared/Only this scope, actual nested owners, copying exclusions, required input/binding checks, and rollback/history/portability responsibilities are recorded.

- [x] CT6: Shared import/rendering/source documents link to the dedicated contracts, historical inventory remains provisional, and the complete batch passes static checks without unrelated changes.
  CHECK: git diff --check && node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),map={"doc_v1/import-export/component-import.md":["## MCP creation and updates","inspect_component_import.md","import_component.md","update_component_props.md","update_component_source.md"],"doc_v1/architecture/react-source-bindings.md":["mcp/tools/import_component.md","mcp/tools/update_component_props.md","mcp/tools/update_component_source.md","mcp/tools/inspect_component_import.md"],"doc_v1/import-export/tailwind-components.md":["mcp/tools/import_component.md","mcp/tools/update_component_source.md"],"doc_v1/interface/motion.md":["mcp/tools/import_component.md","mcp/tools/update_component_source.md"],"doc_v1/mcp/tools/insert_html.md":["inspect_component_import.md","import_component.md"],"doc_v1/mcp/mcp-server.md":["tools/inspect_component_import.md","tools/import_component.md","tools/update_component_props.md","tools/update_component_source.md"],"backlog/README.md":["mcp/tools/import_component.md#required-composition-proof","inspection fingerprints"],"backlog/mcp/command-contracts.md":["supported independent source scope","historical"],".unlazy/orc-web-coverage-audit.md":["CT1–CT6","combined component MCP/editor proof remains unverified"]};for(const [f,terms]of Object.entries(map)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": "+t)}console.log("CT6 component tool connections and boundaries passed")'
  EXPECT: CT6 passes; local links/anchors, snapshot diff review, and archive-table preservation pass.
  EVIDENCE: Reviewed the complete batch against its pre-edit snapshot on 2026-10-04: 68/68 selected static documentation gates, 620 local links/anchors across 57 Markdown files, and git diff --check passed.
  EVIDENCE: Four files added, 13 existing files updated, none removed, and 40 existing files unchanged; all 39 archived tool rows and archived command tables were preserved.
  EVIDENCE: Application code, AGENTS, SDK research, runtime architecture, and deferred release schedules were preserved; no MCP runtime/platform test, dependency installation, commit, or push occurred.

## Gates: MCP visual editing and HTML replacement, 2026-10-04

Scope: Record five accepted semantic-editing/replacement tools through existing canonical/source owners, layout rules, HTML import, and command services.
These gates check documentation coverage and preservation; actual MCP/editor and platform verification remains required.

- [x] ET1: Each new tool has a dedicated accepted contract with agreed core JSON where available, remaining schema decisions, and unverified implementation status; all agreed tools are indexed without finalizing the inventory.
  CHECK: node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),index=fs.readFileSync("doc_v1/mcp/tools/README.md","utf8"),root=fs.readFileSync("doc_v1/README.md","utf8"),rows=index.split("\n").filter(l=>l.startsWith("| `")),files=fs.readdirSync("doc_v1/mcp/tools").filter(n=>n.endsWith(".md")&&n!=="README.md");assert.equal(rows.length,files.length);for(const f of files)assert(index.includes("("+f+")")&&root.includes("mcp/tools/"+f),f);for(const n of ["update_styles","set_text","move_nodes","resize_node","replace_node_html"]){const s=fs.readFileSync("doc_v1/mcp/tools/"+n+".md","utf8");assert(s.startsWith("# "+n+"\n"));for(const t of ["Accepted V1",["replace_node_html","update_styles","set_text","move_nodes","resize_node"].includes(n)?"Core JSON request/result fields":"Exact wire schemas"])assert(s.includes(t),n+": "+t);if(["replace_node_html","update_styles","set_text","move_nodes","resize_node"].includes(n))assert(s.includes("## Agreed JSON exchange")&&s.includes("remain implementation decisions"),n+": missing accepted JSON or remaining implementation limits");assert(s.includes("not a verified")||s.includes("not been verified"),n);assert(index.includes(n+".md")&&root.includes("mcp/tools/"+n+".md"),n)}assert(index.includes("does not finalize the V1 count"));console.log("ET1 dedicated editing contracts and status passed")'
  EXPECT: ET1 dedicated editing contracts and status passed.
  EVIDENCE: Passed on 2026-10-04: five dedicated accepted contracts, thirteen current index rows, and explicit open-schema/unverified-runtime boundaries.

- [x] ET2: Style editing reaches the real owner, preserves source scope and variants, validates layout/token conversions, and remains atomic without adding deferred panel controls.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/update_styles.md","utf8"),assert=require("node:assert/strict");for(const t of ["bulk Properties","arbitrary document patches","actual local source owner","responsive, hover, focus","atomic conversion rules","one authoritative layout","unlink/clear","One invalid target or value","one Undo step","history unchanged","disk-save success","not passed application tests"])assert(s.includes(t),t);console.log("ET2 style ownership and atomic validation passed")'
  EXPECT: ET2 style ownership and atomic validation passed.
  EVIDENCE: Passed static coverage on 2026-10-04: real style owners, explicit source scope, Tailwind preservation, token/layout conversion, and whole-call failure are recorded.

- [x] ET3: Text changes retain identity, semantics, and sizing through canonical or supported React owners, with range policy open and failures/history/drafts handled explicitly.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/set_text.md","utf8"),assert=require("node:assert/strict");for(const t of ["initially identical","Unicode","remain text","Empty content","local collection record","explicit All copies","Rich formatting remains within","policy for ranges","Do not shrink the font","one Undo step","history unchanged","private Code draft","save success","not passed MCP implementation tests"])assert(s.includes(t),t);console.log("ET3 text ownership and preservation passed")'
  EXPECT: ET3 text ownership and preservation passed.
  EVIDENCE: Passed static coverage on 2026-10-04: text identity/semantics, ordinary and bound React owners, Unicode/empty content, open range policy, and draft/history boundaries are recorded.

- [x] ET4: Movement uses document coordinates under the current parent, respects Flex/constraints and source bindings, rejects unsafe batches, and preserves the existing human structural workflow.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/move_nodes.md","utf8"),assert=require("node:assert/strict");for(const t of ["unzoomed document units","overlapping target behavior","current parent and structural sibling order","does not silently reparent","parent-controlled positions","Human canvas drops","both-edge relationships","intermediate animated position","match the intended applied revision","one Undo step","reject the entire call","not passed application tests"])assert(s.includes(t),t);console.log("ET4 movement ownership and coordinate boundaries passed")'
  EXPECT: ET4 movement ownership and coordinate boundaries passed.
  EVIDENCE: Passed static coverage on 2026-10-04: document coordinates, current-parent movement, Flex rejection, coupled constraints, reliable bindings, and existing human structural actions are preserved.

- [x] ET5: Resizing honors each axis owner, requires explicit supported mode conversion, preserves layout/animation intent, and rejects the whole call when an axis fails.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/resize_node.md","utf8"),assert=require("node:assert/strict");for(const t of ["unzoomed document units","does not silently convert Fit, Fill","explicitly requested","Both-edge constraints","unresolved same-axis dependency","without reducing its font size","proportional-size","intermediate Motion","one Undo step","If one requested axis fails","save success","not passed application tests"])assert(s.includes(t),t);console.log("ET5 sizing ownership and explicit conversion passed")'
  EXPECT: ET5 sizing ownership and explicit conversion passed.
  EVIDENCE: Passed static coverage on 2026-10-04: per-axis owners, explicit supported mode conversion, layout/animation intent, and whole-call axis rejection are recorded.

- [x] ET6: Ordinary replacement reuses insertion, retains only a compatible root/location, assigns fresh descendants, validates references and locks, and restores exact subtrees through retained history.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/mcp/tools/replace_node_html.md","utf8"),assert=require("node:assert/strict");for(const t of ["reuses","one meaningful replacement root","not an ordinary replacement target","parent and sibling position","incompatible replacement fails","fresh stable IDs","Old descendant targets","required references","metadata/placement","Removed descendant selection","one Undo step","affected descendants","Undo restores the old subtree","recorded new descendant identities","not the previous session","not passed replacement implementation tests"])assert(s.includes(t),t);console.log("ET6 replacement identity and atomic subtree handling passed")'
  EXPECT: ET6 replacement identity and atomic subtree handling passed.
  EVIDENCE: Passed static coverage on 2026-10-04: shared importer, compatible retained root/location, fresh descendants, reference/lock validation, selection, and exact retained-history restoration are recorded.

- [x] ET7: Connected documents point to accepted contracts and focused open work; archived rows, unrelated files, local links, and whitespace remain intact.
  CHECK: git diff --check && node -e 'const fs=require("node:fs"),assert=require("node:assert/strict"),map={"doc_v1/mcp/mcp-server.md":["tools/update_styles.md","tools/set_text.md","tools/move_nodes.md","tools/resize_node.md","tools/replace_node_html.md"],"backlog/mcp/tool-catalog.md":["39 candidate public MCP tools","replace_node_html.md","take precedence"],"backlog/mcp/command-contracts.md":["## Editing-tool implementation decisions","formatting ranges","overlapping ancestor/descendant","metadata/placement precedence","not results"],"doc_v1/mcp/tools/insert_html.md":["replace_node_html.md","fresh descendant IDs"],"doc_v1/interface/workspace-and-canvas.md":["mcp/tools/move_nodes.md","mcp/tools/resize_node.md","Explicit canvas drops"],"doc_v1/interface/properties-panel.md":["mcp/tools/update_styles.md","mcp/tools/set_text.md","bulk human Properties"],"doc_v1/interface/text-editing.md":["mcp/tools/set_text.md","formatting-range policy"],"doc_v1/interface/flex-layout.md":["mcp/tools/update_styles.md","mcp/tools/resize_node.md"],"doc_v1/interface/constraints.md":["mcp/tools/move_nodes.md","mcp/tools/resize_node.md"],"doc_v1/architecture/react-source-bindings.md":["mcp/tools/update_styles.md","mcp/tools/set_text.md","mcp/tools/move_nodes.md","mcp/tools/resize_node.md"],"backlog/README.md":["editing-tool-implementation-decisions","agreed tools"],".unlazy/orc-web-coverage-audit.md":["ET1–ET7","actual MCP/editor proof"]};for(const [f,terms]of Object.entries(map)){const s=fs.readFileSync(f,"utf8");for(const t of terms)assert(s.includes(t),f+": "+t)}console.log("ET7 editing connections and open-work ownership passed")'
  EXPECT: ET7 passes, with snapshot review, archival-table comparison, and local-link checks recorded separately.
  EVIDENCE: Reviewed the complete batch against its pre-edit snapshot on 2026-10-04: 75/75 selected static documentation gates, 711 local links/anchors across 62 Markdown files, and git diff --check passed.
  EVIDENCE: Five files added, 15 existing files updated, none removed, and 42 existing files unchanged; all 39 archived tool rows and archived command tables were preserved.
  EVIDENCE: Existing application/runtime, SDK research, AGENTS, and release schedules were preserved; actual MCP/editor/platform verification remains unrun.

## MCP hierarchy, naming, deletion, and history scope, 2026-10-04

The dedicated [reorder_nodes](doc_v1/mcp/tools/reorder_nodes.md), [rename_nodes](doc_v1/mcp/tools/rename_nodes.md), and [delete_nodes](doc_v1/mcp/tools/delete_nodes.md) contracts record accepted V1 responsibilities through existing hierarchy, source, and command services.
Public MCP [undo/redo tools are scheduled for V1.1](backlog/mcp/undo-redo-v11.md); application history remains V1 for completed human and agent edits.
Exact schemas and actual MCP/editor checks remain open in the dedicated contracts and command backlog.
Verification: 75/75 existing selected static documentation gates, 770 local links/anchors across 66 Markdown files, archival-table preservation, and git diff --check passed on 2026-10-04.
Preservation: Four files added, 12 existing files updated, none removed, and 50 existing files unchanged; all 39 historical tool rows remain intact.
Actual MCP/editor/platform verification remains unrun.

## MCP token scope and visual inspection, 2026-10-04

The initial get_context Tokens scope replaced the proposed separate token-list tool in this batch.
That consolidation was superseded on 2026-10-05 by the dedicated [list_design_tokens contract](doc_v1/mcp/tools/list_design_tokens.md).
The dedicated [update_design_tokens](doc_v1/mcp/tools/update_design_tokens.md) contract owns supported definition actions, preserving V1 categories, explicit references, and application history.
The dedicated [get_screenshot](doc_v1/mcp/tools/get_screenshot.md) contract covers object-to-frame and bounded workspace images through the existing stable-state renderer, including before-autosave inspection and unchanged view/project/history state.
Schemas, crop/state limits, token reference accounting, and actual MCP/editor/platform checks remain open.
Verification: 75/75 existing selected static documentation gates, 809 local links/anchors across 68 Markdown files, archival-table preservation, and git diff --check passed on 2026-10-04.
Preservation: Two files added, 12 existing files updated, none removed, and 54 existing files unchanged; all 39 historical tool rows remain intact.
Actual MCP/editor/platform verification remains unrun.

## MCP export and content attributes, 2026-10-04

The dedicated [export](doc_v1/mcp/tools/export.md) contract reuses the application exporter for complete code/image/PDF output, explicit scope/options, required saving, and complete destination publication.
The dedicated [update_attributes](doc_v1/mcp/tools/update_attributes.md) contract covers supported content attributes and managed-image replacement through real owners, preserving identity, sizing/fitting rules, source scope, and application history.
Schemas, asset transfer/retention, Untitled export prerequisites, directory/multi-file publication, and actual MCP/editor/platform checks remain open.
Verification: 75/75 existing selected static documentation gates, 851 local links/anchors across 70 Markdown files, archival-table preservation, and git diff --check passed on 2026-10-04.
Preservation: Two files added, 11 existing files updated, none removed, and 57 existing files unchanged; all 39 historical tool rows remain intact.
Actual MCP/editor/platform verification remains unrun.

## MCP copying and focused reads, 2026-10-04

[duplicate_nodes](doc_v1/mcp/tools/duplicate_nodes.md) records same-project Copy/Paste behavior with fresh identities and existing sharing boundaries.
[get_context](doc_v1/mcp/tools/get_context.md) adds focused authored values, sizing rules, save status, and optional revision-matched bounds/resolved styles.
[Font agent access](doc_v1/interface/font-management.md#agent-access) corrects the unaccepted `list_fonts` and `import_asset` claims without changing their candidate status.
At that checkpoint the inventory had 21 dedicated contracts.
Those read and font dispositions were superseded by the later 2026-10-05 section recording the agreed read split, assets, settings, and release decisions.
Schemas and actual MCP/editor/platform verification remain open.
Verification: 75/75 selected static documentation gates, 880 local links/anchors across 71 Markdown files, inventory/file agreement, archived-table preservation, and git diff --check passed on 2026-10-04.

## MCP focused reads, assets, settings, and release scope, 2026-10-05

The [active inventory](doc_v1/mcp/tools/README.md) now has 27 dedicated V1 contracts.
[get_context](doc_v1/mcp/tools/get_context.md) retains the compact overview; dedicated object, hierarchy, token, measurement, and source reads follow the [shared read rules](doc_v1/mcp/read-tools.md).
[import_asset](doc_v1/mcp/tools/import_asset.md) registers reusable supported image/SVG/font resources and required font loading for ordinary HTML/CSS and React without placement.
[update_node_settings](doc_v1/mcp/tools/update_node_settings.md) changes own locks or eligible frame Light/Dark/Inherit settings that select existing token values.
Saved human hide/show and MCP visibility mutations are [V1.1](backlog/layer-visibility-v11.md); the researched workflow and persisted representation are preserved.
The [release scope](backlog/mcp/tool-release-scope.md) records standalone project management, fresh validation, font listing, and conditional-style operations outside MCP V1.
MC2 and MT1 now check all focused reads and current tool entry points; I5 checks the visibility release correction without deleting its future workflow.
Verification: 75/75 selected static documentation gates, 27-tool file/index agreement, six new contract coverage checks, and accounting for all 39 historical candidates passed.
Final static review: 1,003 local links/anchors across 79 Markdown files and git diff --check passed.
Preservation: Seven files added, 36 existing files updated, none removed, and 36 existing files unchanged; all 39 archived tool rows and archived command tables remain intact.
Exact schemas and actual MCP/editor/platform verification remain open; no runtime implementation test, commit, push, or merge occurred in this batch.

## MCP core read JSON schemas, 2026-10-05

[get_context](doc_v1/mcp/tools/get_context.md#agreed-json-exchange), [get_tree](doc_v1/mcp/tools/get_tree.md#agreed-json-exchange), and [get_node](doc_v1/mcp/tools/get_node.md#agreed-json-exchange) now record core input/output JSON schemas and concrete argument/result examples.
The [shared JSON rules](doc_v1/mcp/read-tools.md#json-schemas-and-examples) preserve SDK wrapping, one runtime schema authority, applied-state reads, and separate save outcomes.
Tree depth defaults to one, completeness concerns the requested depth, and real parent/child identities survive the bounded projection.
Selection availability and mixed per-value ownership remain explicit rather than being inferred from browser presence or a node-wide label.
Detailed value/diagnostic grammars, response limits/continuation, and production SDK/editor verification remain in the [read implementation decisions](backlog/mcp/command-contracts.md#read-schema-implementation-decisions).
Verification: 45 document JSON/example/negative-case checks and 75/75 selected static documentation gates passed.
Final static review: 1,025 local links/anchors across 79 Markdown files, 27-tool inventory agreement, archived-table preservation, and git diff --check passed.
Ten existing files changed in this batch, 69 remained unchanged, and none were added or removed.
The installed Ajv 6.15.0 checked the schemas' shared Draft 7/2020-12 keywords; this does not certify production SDK validation or the complete 2020-12 dialect.
The inventory remains 27 dedicated contracts; no runtime implementation test, package install, commit, push, or merge occurred in this batch.

## Separate object and component source reads, 2026-10-05

[get_source](doc_v1/mcp/tools/get_source.md#agreed-json-exchange) now has a `nodeId` input and object-code result with relevant per-item owners; it has no component-source input selector.
The separate [get_component_source](doc_v1/mcp/tools/get_component_source.md) contract records its own JSON schemas, definition ID, default entry-file read, and explicit supporting-file requests.
Both preserve applied revisions, actual owners, private-draft exclusion, useful unavailable-source errors, and inspection versus complete export.
Shared source updates and conditional-style guidance now use the actual managed-file read before implementation edits.
MC2 and MT1 include the seventh focused read; the active inventory now has 28 dedicated contracts while the 39 historical candidates remain preserved.
Verification: 49 new source JSON/example/negative-case checks, 45 earlier core-read JSON checks, 75/75 selected static documentation gates, and inventory agreement passed.
Final static review: 1,051 local links/anchors across 80 Markdown files, archived-table preservation, and git diff --check passed.
One dedicated file was added, ten existing files updated, 69 existing files unchanged, and none removed.
The installed Ajv 6.15.0 checked compatible schema keywords; production SDK validation, file resolution, source bindings, and actual MCP/editor behavior remain unverified.
No package install, runtime implementation test, commit, push, or merge occurred in this batch.

## Token, measurement, and frame JSON contracts, 2026-10-05

[list_design_tokens](doc_v1/mcp/tools/list_design_tokens.md#agreed-json-exchange), [get_computed_styles](doc_v1/mcp/tools/get_computed_styles.md#agreed-json-exchange), and [create_frame](doc_v1/mcp/tools/create_frame.md#agreed-json-exchange) now record accepted core JSON schemas and request/result examples.
Registry filters preserve saved values and explicitly incomplete reference counts without enabling deferred value editors.
Measurements request named properties or bounds and distinguish authored values, workspace coordinates, actual frame/viewport dimensions, and unavailable results.
Frame creation records command/project/revision identity, custom size, root position or supported parent placement, and a compact committed result.
Detailed [read validation](backlog/mcp/command-contracts.md#read-schema-implementation-decisions) and [frame-creation decisions](backlog/mcp/command-contracts.md#frame-creation-schema-implementation-decisions) remain implementation work.
Verification: 113 new documentation JSON/example/negative-case checks and 94 earlier read/source checks passed; the inventory still contains 28 dedicated tool contracts and accounts for all 39 historical candidates.
The installed Ajv 6.15.0 checked compatible schema keywords; this does not certify production SDK validation or the complete 2020-12 dialect.
No runtime implementation test, package install, commit, push, or merge occurred in this batch.
Final static review: 75/75 selected documentation gates, 1,066 local links/anchors across 80 Markdown files, archived-table preservation, and git diff --check passed.
Ten existing files changed in this batch, 70 remained unchanged, and none were added or removed.

## HTML insertion and replacement JSON contracts, 2026-10-05

[insert_html](doc_v1/mcp/tools/insert_html.md#agreed-json-exchange) and [replace_node_html](doc_v1/mcp/tools/replace_node_html.md#agreed-json-exchange) now record accepted core input/output schemas and consecutive request/result examples.
Insertion distinguishes parent/index placement from a single positioned workspace root and returns created root IDs plus the canonical object count.
Replacement returns the continuing compatible root ID; its descendants receive fresh identities under the existing ownership and history rules.
Supported grammar, resources, compatibility, placement precedence, and actual endpoint/editor verification remain in the [HTML implementation decisions](backlog/mcp/command-contracts.md#html-schema-implementation-decisions).
ET1 checks the replacement's accepted JSON section and remaining implementation limits alongside the other editing-tool status requirements.
Verification: 105 documentation JSON/example/negative-case checks, 75/75 selected static documentation gates, 28-tool inventory agreement, and accounting for all 39 historical candidates passed.
The installed Ajv 6.15.0 checked compatible schema keywords; production SDK validation, complete 2020-12 dialect support, parser fidelity, and actual editor behavior remain unverified.
Eight existing files changed in this batch, 72 remained unchanged, and none were added or removed; archived candidate and command tables remain intact.
No runtime implementation test, package install, commit, push, or merge occurred in this batch.
Final static review: 1,086 local links/anchors across 80 Markdown files and git diff --check passed.

## Component inspection and import JSON contracts, 2026-10-05

[Inspection](doc_v1/mcp/tools/inspect_component_import.md#agreed-json-exchange) and [Import](doc_v1/mcp/tools/import_component.md#agreed-json-exchange) record accepted basic inline source fields and examples, with a compact committed Import result.
Workspace placement requires coordinates, Free placement requires parent-relative coordinates, and normal Flex placement uses child order without coordinates.
The service must enforce the actual parent layout, inspected-candidate freshness, required inputs, resource preparation, bindings, and initial render before one atomic commit.
Extended source descriptions, dependency/theme/asset formats, inspection reports/fingerprint encoding, and SDK integration remain in the [component-import implementation decisions](backlog/mcp/command-contracts.md#component-import-schema-implementation-decisions).
CT1 now checks the accepted inline JSON and remaining implementation limits while retaining open-schema requirements for the two component update tools.
Verification passed: 67 static JSON/example checks, 75/75 selected documentation gates, and agreement between all 28 dedicated tool files and their index.
All 39 historical candidates and archived command/catalog tables remain accounted for and preserved.
Six existing files changed, 74 remained unchanged, and none were added or removed.
The installed Ajv 6.15.0 checked compatible schema keywords; complete production SDK dialect support and actual MCP/editor behavior remain unverified.
No runtime implementation test, package install, commit, push, or merge occurred.
Final static review: 1,100 local links/anchors across 80 Markdown files and git diff --check passed.

## Component property and source update JSON contracts, 2026-10-05

[Property updates](doc_v1/mcp/tools/update_component_props.md#agreed-json-exchange) and [source updates](doc_v1/mcp/tools/update_component_source.md#agreed-json-exchange) now record accepted core request/result schemas and examples.
Property changes target one instance, distinguish supplied values from explicit override removal, and require actual input-contract validation.
Source changes distinguish changed/removed managed files and explicit All copies/Only this scope, preserving the accepted nested-owner copying boundary and atomic candidate validation.
Only this results require the effective independent definition and continuing instance IDs; the service must check that request-dependent result rule.
Detailed values, resources, managed paths, independent-copy mappings, dependency/asset/entry changes, and SDK integration remain in the [component-update implementation decisions](backlog/mcp/command-contracts.md#component-update-schema-implementation-decisions).
CT1 now checks accepted core JSON and explicit remaining implementation limits in all four component creation/update contracts.
Verification passed: 130 static schema/example/preservation checks, 75/75 selected documentation gates, and 28-tool inventory agreement with all 39 historical candidates accounted for.
Six existing files changed, 74 remained unchanged, and none were added or removed; archived tables are intact.
Inspection, Import, get_source, and get_component_source files remain unchanged in this batch.
The installed Ajv 6.15.0 checked compatible schema keywords; production SDK validation and actual ownership/copying/rendering/history/persistence remain unverified.
No runtime implementation test, package install, commit, push, or merge occurred.
Final static review: 1,114 local links/anchors across 80 Markdown files and git diff --check passed.

## Shared React resource preparation, 2026-10-05

[Shared preparation](doc_v1/import-export/component-import.md#shared-source-and-resource-preparation) and [Tailwind source detection](doc_v1/import-export/tailwind-components.md#stylesheet-entry-and-source-detection) refine the existing Import/update service using normal package manifests, lockfiles, managed assets, loaded stylesheet entries, required source paths, and explicit entry/export changes.
Official documentation supports the underlying build practices; actual ORC service behavior remains unverified.
Extended transfer/requirement encodings stay in the existing component-import and component-update implementation backlog.

- [x] RP1: Shared preparation covers packages, assets, loaded styles and detected source, and preserves the agreed runtime/atomicity boundaries.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),c=fs.readFileSync("doc_v1/import-export/component-import.md","utf8"),t=fs.readFileSync("doc_v1/import-export/tailwind-components.md","utf8");for(const s of ["one supported representation","normal package manifests, lockfiles","does not establish browser/runtime compatibility","prior standalone","registration is optional","presence of a CSS file","stylesheet entry","ignored by default","Required entry/export changes","before one atomic commit","do not yet encode all"])a(c.includes(s),s);for(const s of ["## Stylesheet entry and source detection","complete class names","excluded from automatic detection","@source","editor source","before committing","arbitrary dynamically constructed"])a(t.includes(s),s);for(const n of ["inspect_component_import","import_component","update_component_source","import_asset"])a(fs.readFileSync("doc_v1/mcp/tools/"+n+".md","utf8").includes("component-import.md#shared-source-and-resource-preparation"),n);console.log("RP1 shared resource preparation coverage passed")'
  EXPECT: RP1 shared resource preparation coverage passed.
  EVIDENCE: RP1 passed; 76/76 selected documentation gates, 28-tool inventory agreement, and accounting for all 39 historical candidates passed in this batch.
Seventeen existing JSON blocks stayed unchanged and all seven component schemas compiled with the installed Ajv 6.15.0; complete production SDK dialect support remains unverified.
All 65 existing headings checked across the affected import/Tailwind/component tool documents remain present; source-read and property-update files are unchanged.
Nine existing files changed, 71 remained unchanged, and none were added or removed; archived candidate/command tables are preserved.
Actual source ownership, asset/style preparation, safe copying, atomic commits, and fresh-computer save/reopen remain unverified implementation requirements.
No runtime implementation test, package install, commit, push, or merge occurred.
Final static review: 1,128 local links/anchors across 80 Markdown files and git diff --check passed.

## Style-update JSON contract, 2026-10-05

[update_styles](doc_v1/mcp/tools/update_styles.md#agreed-json-exchange) records one stable target, direct values or registered token references, explicit removal/unlinking, shared-source scope, and compact committed results.
Detailed value grammar, token resolution, and semantic layout-conversion fields remain in the [style implementation decisions](backlog/mcp/command-contracts.md#style-schema-implementation-decisions).

- [x] ST1: Style JSON distinguishes assignment, removal, and unlinking while retaining ownership, scope, conversion, and runtime limits.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),s=fs.readFileSync("doc_v1/mcp/tools/update_styles.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,6);a.deepEqual(b[0].required,["commandId","projectId","expectedRevision","nodeId"]);for(const k of ["styles","unsetStyles","unlinkStyles","scope"])a(b[0].properties[k],k);a.equal(b[0].additionalProperties,false);a.equal(b[1].additionalProperties,false);for(const t of ["one call", "tokenId", "does not mean clearing", "Require explicit", "actual local source owner", "semantic JSON fields still need agreement", "matching revision", "not executed MCP/editor behavior"])a(s.toLowerCase().includes(t.toLowerCase()),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Style-schema implementation decisions"));console.log("ST1 style JSON and ownership boundaries passed")'
  EXPECT: ST1 style JSON and ownership boundaries passed.
  EVIDENCE: ST1 passed; 77/77 selected static documentation gates, 57 schema/example checks, and 28-tool inventory agreement passed.
Sixty-five JSON blocks in the other tool contracts remain unchanged, and all existing style-contract section headings are preserved.
The installed Ajv 6.15.0 compiled both new schemas and checked compatible keywords; detailed property/owner/token/scope validation and production SDK support remain unverified.
Five existing files changed, 75 remained unchanged, and none were added or removed; archived command/catalog tables and all 39 historical candidates are preserved.
Final static review: 1,139 local links/anchors across 80 Markdown files and git diff --check passed.
Actual CSS/source fidelity, shared-mode token resolution, copying, layout conversion, command history, and persistence require implementation verification.

## Text-update JSON contract, 2026-10-05

[set_text](doc_v1/mcp/tools/set_text.md#agreed-json-exchange) records one stable text target, plain-string replacement, empty-value identity retention, explicit shared-source scope, and compact results.
Rich-text representation and uncertain range replacement remain in the [text implementation decisions](backlog/mcp/command-contracts.md#text-schema-implementation-decisions).

- [x] TX1: Text JSON retains stable identity, safe text semantics, explicit shared scope, and the formatting-preservation boundary.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),s=fs.readFileSync("doc_v1/mcp/tools/set_text.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);a.deepEqual(b[0].required,["commandId","projectId","expectedRevision","nodeId","text"]);a.deepEqual(b[0].properties.text,{type:"string"});a.equal(b[0].additionalProperties,false);a.equal(b[1].additionalProperties,false);for(const t of ["One call", "without trimming", "remain text", "text: \"\"", "Require explicit", "whole-value replacement", "reject it", "surrounding formatting", "not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Text-schema implementation decisions"));console.log("TX1 text JSON and preservation boundaries passed")'
  EXPECT: TX1 text JSON and preservation boundaries passed.
  EVIDENCE: TX1 and all 78/78 selected static documentation gates passed; 38 schema/example checks and 28-tool inventory agreement passed.
Both text schemas compiled with the installed Ajv 6.15.0 using compatible keywords; production SDK validation, text serialization, ownership, and formatting behavior remain unverified.
Seventy-one JSON blocks in the other tool contracts remain unchanged, and all existing text-contract section headings are preserved.
Six existing files changed, 74 remained unchanged, and none were added or removed; archived tables and all 39 historical candidates remain intact.
Final static review: 1,151 local links/anchors across 80 Markdown files and git diff --check passed.
Running MCP/editor history, safe copying, exact rendered text/formatting, and save/reopen still require implementation verification.

## Movement JSON contract, 2026-10-05

[move_nodes](doc_v1/mcp/tools/move_nodes.md#agreed-json-exchange) records shared displacement or explicit per-target positions, current-parent coordinates, source scope, and compact results.
Coordinate conversion, shared-owner aliases, and constraint/measurement behavior remain in the [movement implementation decisions](backlog/mcp/command-contracts.md#movement-schema-implementation-decisions).

- [x] MV1: Movement JSON distinguishes the two forms and retains coordinate, overlap, source-scope, and atomicity boundaries.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),s=fs.readFileSync("doc_v1/mcp/tools/move_nodes.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,6);a.equal(b[0].oneOf.length,2);a.equal(b[0].additionalProperties,false);a.equal(b[1].properties.nodeIds.uniqueItems,true);for(const t of ["signed and fractional", "immediate parent", "Reject duplicate IDs and ancestor/descendant pairs", "must not apply the same displacement repeatedly", "conflict at the shared owner", "Require explicit", "not consecutive commands", "not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Movement-schema implementation decisions"));console.log("MV1 movement JSON and ownership boundaries passed")'
  EXPECT: MV1 movement JSON and ownership boundaries passed.
  EVIDENCE: MV1 and all 79/79 selected static documentation gates passed; 52 schema/example checks and 28-tool inventory agreement passed.
Both movement schemas compiled with installed Ajv 6.15.0 using compatible keywords; production SDK behavior, geometry/constraint conversion, and source-owner alias handling remain unverified.
Seventy-five JSON blocks in the other tool contracts remain unchanged, and all existing movement-contract section headings are preserved.
Five existing files changed, 75 remained unchanged, and none were added or removed; archived tables and all 39 historical candidates remain intact.
Final static review: 1,161 local links/anchors across 80 Markdown files and git diff --check passed.
Actual endpoint/editor movement, safe copying, revision-matched measurements, history, and save/reopen still require implementation verification.

## Resize JSON contract, 2026-10-05

[resize_node](doc_v1/mcp/tools/resize_node.md#agreed-json-exchange) records one target, per-axis Fixed/Fit/Fill requests, explicit Fixed conversion, shared-source scope, and compact results.
Limits, coupled geometry, sizing ownership, and browser-layout behavior remain in the [resize implementation decisions](backlog/mcp/command-contracts.md#resize-schema-implementation-decisions).

- [x] RZ1: Resize JSON distinguishes current-Fixed dimensions from explicit mode conversion and preserves ownership and atomicity boundaries.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),s=fs.readFileSync("doc_v1/mcp/tools/resize_node.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);a.deepEqual(b[0].required,["commandId","projectId","expectedRevision","nodeId"]);for(const axis of ["width","height"]){const x=b[0].properties[axis];a(x,axis);a.equal(x.additionalProperties,false);a.equal(x.allOf.length,3)}a.equal(b[0].additionalProperties,false);a.equal(b[1].additionalProperties,false);for(const t of ["already Fixed", "explicitly converts", "Fit and Fill reject", "Both-edge constraints", "scope", "whole call", "not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Resize-schema implementation decisions"));console.log("RZ1 resize JSON and ownership boundaries passed")'
  EXPECT: RZ1 resize JSON and ownership boundaries passed.
  EVIDENCE: RZ1 and all 80/80 selected static documentation gates passed; 38 schema/example checks and 28-tool inventory agreement passed.
Both resize schemas compiled with installed Ajv 6.15.0 using compatible keywords.
Production SDK validation, sizing ownership, coordinate/constraint conversion, candidate rendering, and persistence remain unverified.
Five existing files changed, 75 remained unchanged, and none were added or removed; archived tables and all 39 historical candidates remain intact.
Final static review: 1,172 local links/anchors across 80 Markdown files and git diff --check passed.
Actual endpoint/editor resize behavior, safe copying, browser layout, history, and save/reopen still require implementation verification.

## Reorder JSON contract, 2026-10-05

[reorder_nodes](doc_v1/mcp/tools/reorder_nodes.md#agreed-json-exchange) records explicit destinations, post-removal indices, submitted target order, required Free/workspace positions, source scope, and compact results.
Geometry conversion, explicit Absolute Position transition encoding, shared-owner handling, and runtime verification remain in the [reorder implementation decisions](backlog/mcp/command-contracts.md#reorder-schema-implementation-decisions).

- [x] RO1: Reorder schemas validate the documented exchange and preserve explicit destination, ordering, placement, ownership, and atomicity boundaries.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/reorder_nodes.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);a(i(b[2]));a(o(b[3]));a(i({...b[2],parentId:null}));a(!i({...b[2],nodeIds:["a","a"]}));a(!i({...b[2],index:-1}));const v={...b[2]};delete v.parentId;a(!i(v));for(const t of ["before interpreting `index`","Omitting `index` appends","submitted `nodeIds` order","ancestor/descendant pairs","exactly one corresponding","one Undo step","not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Reorder-schema implementation decisions"));console.log("RO1 reorder JSON and structural boundaries passed")'
  EXPECT: RO1 reorder JSON and structural boundaries passed.
  EVIDENCE: Both schemas compiled with installed Ajv 6.15.0 and 34 positive/negative schema/example checks passed.
All 191 local links/anchors across the four edited contract/index/backlog/audit files passed, with 28-tool index agreement and git diff --check.
These checks validate documentation and core JSON shapes; actual structural ownership, layout conversion, candidate rendering, history, and save/reopen remain unverified.

## Rename JSON contract, 2026-10-05

[rename_nodes](doc_v1/mcp/tools/rename_nodes.md#agreed-json-exchange) records per-target labels, changed-only results, and unchanged revision/history for no-change requests.
Name validation, durable React label metadata, and runtime verification remain in the [rename implementation decisions](backlog/mcp/command-contracts.md#rename-schema-implementation-decisions).

- [x] RN1: Rename schemas accept the normal and no-change examples and preserve label-only ownership and whole-batch validation.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/rename_nodes.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,6);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);for(const n of [2,4])a(i(b[n]));for(const n of [3,5])a(o(b[n]));a(!i({...b[2],renames:[]}));a(!o({...b[3],nodeIds:["a","a"]}));for(const t of ["Reject repeated `nodeId`","Validate every target","No shared-source scope","Return only targets","unchanged applied revision","not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Rename-schema implementation decisions"));console.log("RN1 rename JSON and label boundaries passed")'
  EXPECT: RN1 rename JSON and label boundaries passed.
  EVIDENCE: Both schemas compiled with installed Ajv 6.15.0 and 32 positive/negative schema/example checks passed.
All 189 local links/anchors across the four edited contract/index/backlog/audit files passed, with 28-tool index agreement and git diff --check.
Actual label storage, change detection, lock enforcement, selection continuity, application history, and persistence remain unverified.

## Delete JSON contract, 2026-10-05

The existing [delete_nodes](doc_v1/mcp/tools/delete_nodes.md#agreed-json-exchange) contract now records explicit targets, overlap rejection, shared-source scope, and requested deleted-root results.
Reference reconciliation, subtree locks, shared-owner handling, resource retention, and runtime verification remain in the [delete implementation decisions](backlog/mcp/command-contracts.md#delete-schema-implementation-decisions).

- [x] DL1: Delete schemas validate the documented exchange and preserve owned-subtree removal, shared records, explicit scope, and whole-call failure.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/delete_nodes.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);a(i(b[2]));a(o(b[3]));a(i({...b[2],scope:"only_this"}));a(!i({...b[2],nodeIds:["a","a"]}));a(!o({...b[3],deletedRootIds:[]}));for(const t of ["ancestor/descendant overlap","Missing IDs fail","not enumerated automatically","without deleting its reusable definition","subtree locks","one Undo step","not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Delete-schema implementation decisions"));console.log("DL1 delete JSON and ownership boundaries passed")'
  EXPECT: DL1 delete JSON and ownership boundaries passed.
  EVIDENCE: Both schemas compiled with installed Ajv 6.15.0 and 29 positive/negative schema/example checks passed.
All 196 local links/anchors across the four edited contract/index/backlog/audit files passed, with unchanged 28-tool inventory and git diff --check.
Actual deletion, subtree locks, reference reconciliation, source ownership, rendering, resource retention, selection fallback, history, and persistence remain unverified.

## Copy and attribute JSON contracts, 2026-10-05

The existing [duplicate_nodes](doc_v1/mcp/tools/duplicate_nodes.md#agreed-json-exchange) and [update_attributes](doc_v1/mcp/tools/update_attributes.md#agreed-json-exchange) files now record their agreed JSON exchanges.
[Copy implementation decisions](backlog/mcp/command-contracts.md#copy-schema-implementation-decisions) retain geometry, source-backed destination scope, reference remapping, and fresh-identity verification.
[Attribute implementation decisions](backlog/mcp/command-contracts.md#attribute-schema-implementation-decisions) retain resource/type rules, actual source ownership, staging/retention, and runtime verification.

- [x] CA1: Both tools have valid request/result examples, explicit placement/resource boundaries, compact results, and unverified implementation status.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),j=new Ajv();for(const name of ["duplicate_nodes","update_attributes"]){const s=fs.readFileSync("doc_v1/mcp/tools/"+name+".md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);const i=j.compile(b[0]),o=j.compile(b[1]);a(i(b[2]));a(o(b[3]));a(s.includes("not executed MCP/editor behavior"));if(name==="duplicate_nodes"){a(!i({...b[2],nodeIds:["a","a"]}));const v={...b[2]};delete v.positions;a(!i(v));a(s.includes("Original objects remain"));}else{a(!i({...b[2],attributes:{src:"file.png"}}));a(i({...b[2],attributes:{alt:""}}));a(s.includes("Reject a name appearing in both"));}}console.log("CA1 copy and attribute JSON boundaries passed")'
  EXPECT: CA1 copy and attribute JSON boundaries passed.
  EVIDENCE: Four schemas compiled with installed Ajv 6.15.0; 34 copy and 36 attribute schema/example checks passed.
All 230 local links/anchors across the five edited contract/index/backlog/audit files passed, with preserved 28-tool inventory and git diff --check.
Snapshot comparison preserved existing section headings, all other tool contracts, and the archived catalog.
Actual copying, reference remapping, geometry, attribute eligibility, resource preparation, source ownership, rendering, history, and save/reopen remain unverified.

## Asset registration JSON contract, 2026-10-06

[import_asset](doc_v1/mcp/tools/import_asset.md#agreed-json-exchange) records local-file input, typed metadata results, identical-registration reuse, and no-change revision/history.
Formats/transfers, font declarations/loading, registration equivalence, conflicts, and runtime verification remain in the [asset implementation decisions](backlog/mcp/command-contracts.md#asset-schema-implementation-decisions).

- [x] AS1: Asset schemas validate image/SVG/font result shapes and retain local-file, metadata, reuse, and non-placement boundaries.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/import_asset.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);a(i(b[2]));a(o(b[3]));a(o({...b[3],assetType:"svg",metadata:{mimeType:"image/svg+xml"}}));a(!o({...b[3],assetType:"font",metadata:{mimeType:"font/woff2"}}));a(!i({...b[2],source:{kind:"local",path:""}}));for(const t of ["create no Undo entry","filenames alone","places no object","not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Asset-schema implementation decisions"));console.log("AS1 asset JSON and registration boundaries passed")'
  EXPECT: AS1 asset JSON and registration boundaries passed.
  EVIDENCE: Two schemas compiled with installed Ajv 6.15.0 and 38 positive/negative schema/example checks passed.
The local resource descriptor matches update_attributes; 212 local links/anchors across four edited files, unchanged 28-tool inventory, and git diff --check passed.
Actual file detection, metadata extraction, reuse/conflicts, font loading, managed retention, history, and persistence remain unverified.

## Token-definition JSON contract, 2026-10-06

[update_design_tokens](doc_v1/mcp/tools/update_design_tokens.md#agreed-json-exchange) records one definition operation and compact stable-token results.
Value grammar, reference accounting, CSS projection, and runtime checks remain in the [token implementation decisions](backlog/mcp/command-contracts.md#token-schema-implementation-decisions).

- [x] TK1: Token schemas validate each operation and reject mixed fields, batches, deferred value categories, and mode edits.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/update_design_tokens.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,4);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);a(i(b[2]));a(o(b[3]));const q={commandId:"c",projectId:"p",expectedRevision:0,tokenId:"t"};a(i({...q,operation:"edit_default",value:"24px"}));a(i({...q,operation:"rename",name:"Label"}));a(i({...q,operation:"delete"}));a(!i({...q,operation:"delete",value:"24px"}));a(!i({...b[2],category:"typography"}));a(!i({...b[2],mode:"dark"}));for(const t of ["no action batch","does not enumerate every linked object","not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Token-schema implementation decisions"));console.log("TK1 token JSON and definition boundaries passed")'
  EXPECT: TK1 token JSON and definition boundaries passed.
  EVIDENCE: Two schemas compiled with installed Ajv; 57 positive/negative schema/example checks passed.
Actual token validation, reference accounting, CSS/source preparation, rendering, history, and save/reopen remain unverified.

## Node-settings JSON contract, 2026-10-06

[update_node_settings](doc_v1/mcp/tools/update_node_settings.md#agreed-json-exchange) records one own-lock or frame-mode assignment and no-change revision/history behavior.
Durable metadata, lock enforcement, mode resolution, and runtime checks remain in the [settings implementation decisions](backlog/mcp/command-contracts.md#settings-schema-implementation-decisions).

- [x] NS1: Settings schemas accept lock/mode examples and reject empty, combined, and visibility settings.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/update_node_settings.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,6);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);for(const k of [2,4])a(i(b[k]));for(const k of [3,5])a(o(b[k]));a(i({...b[2],settings:{locked:false}}));for(const settings of [{},{locked:false,designMode:"dark"},{visible:true}])a(!i({...b[2],settings}));for(const t of ["unchanged revision","saved own setting","locked ancestor still protects","not executed MCP/editor behavior"])a(s.includes(t),t);a(fs.readFileSync("backlog/mcp/command-contracts.md","utf8").includes("## Settings-schema implementation decisions"));console.log("NS1 settings JSON and scope boundaries passed")'
  EXPECT: NS1 settings JSON and scope boundaries passed.
  EVIDENCE: Two schemas compiled with installed Ajv; 41 positive/negative schema/example checks passed.
Actual metadata durability, inherited protection, mode resolution, rendering, history, and persistence remain unverified.

## Screenshot JSON contract, 2026-10-06

[get_screenshot](doc_v1/mcp/tools/get_screenshot.md#agreed-json-exchange) records exactly one object or finite workspace region, optional temporary named states, and PNG image delivery with structured metadata.
Crop mapping, state resolution, output limits, and runtime checks remain in the [screenshot implementation decisions](backlog/mcp/command-contracts.md#screenshot-implementation-decisions).

- [x] SC1: Screenshot schemas accept object/region exchanges and reject ambiguous scopes, invalid bounds, duplicate state entries, and non-PNG output metadata.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/get_screenshot.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,6);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);for(const k of [2,4])a(i(b[k]));for(const k of [3,5])a(o(b[k]));a(!i({}));a(!i({...b[2],region:b[4].region}));a(!i({region:{x:0,y:0,width:0,height:1}}));a(!o({...b[3],image:{mimeType:"image/jpeg",width:160,height:48}}));for(const t of ["signed and fractional","temporary capture inputs","do not repeat image bytes","reject excessive captures","not executed MCP/editor behavior"])a(s.includes(t),t);a(!fs.readFileSync("doc_v1/mcp/read-tools.md","utf8").includes("wire schema remains open"));console.log("SC1 screenshot JSON and capture boundaries passed")'
  EXPECT: SC1 screenshot JSON and capture boundaries passed.
  EVIDENCE: Two schemas compiled with installed Ajv; 39 positive/negative schema/example checks passed.
Actual image bytes/dimensions, native MCP delivery, state resolution, crop fidelity, limits, and unchanged design/view/history require runtime verification.

## Export JSON contract, 2026-10-06

[export](doc_v1/mcp/tools/export.md#agreed-json-exchange) records ordered targets, applicable format options, file/directory destinations, and completed output paths/warnings.
Naming, complete publication, and runtime checks remain in the [export implementation decisions](backlog/mcp/command-contracts.md#export-implementation-decisions).

- [x] EX1: Export schemas accept React/PDF exchanges and enforce styling, JPEG background, and destination/combination rules.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tools/export.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,6);const j=new Ajv(),i=j.compile(b[0]),o=j.compile(b[1]);for(const k of [2,4])a(i(b[k]));for(const k of [3,5])a(o(b[k]));a(!i({...b[2],options:{}}));a(!i({...b[4],options:{combine:true}}));a(!i({...b[4],format:"jpeg"}));for(const t of ["ancestor/descendant overlaps","Untitled project must complete its first Save","one target per page","not executed MCP/editor behavior"])a(s.includes(t),t);console.log("EX1 export JSON and publication boundaries passed")'
  EXPECT: EX1 export JSON and publication boundaries passed.
  EVIDENCE: Two schemas compiled with installed Ajv; 60 positive/negative schema/example checks passed.
Actual output contents, portability, save coordination, rendering, directory/multi-file publication, and failure recovery remain unverified.
Full documentation link review passed: 1,267 local links/anchors across 80 Markdown files in doc_v1, backlog, skills, .unlazy, GATES.md, and AGENTS.md.
The 28-tool inventory matches its index, every dedicated tool contract contains a core JSON exchange, and git diff --check passed.

## Shared tool-error contract, 2026-10-06

[Tool errors](doc_v1/mcp/tool-errors.md) records required code/message/next-action fields and optional reliable identity/source context.
Code mapping, source attribution, and runtime SDK delivery remain in the [shared-error implementation decisions](backlog/mcp/command-contracts.md#shared-error-implementation-decisions).

- [x] ER1: The shared payload accepts known or unavailable context and keeps rejection, later-save failure, and SDK delivery distinct.
  CHECK: node -e 'const fs=require("node:fs"),a=require("node:assert/strict"),Ajv=require("ajv"),s=fs.readFileSync("doc_v1/mcp/tool-errors.md","utf8"),b=[...s.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m=>JSON.parse(m[1]));a.equal(b.length,2);const v=new Ajv().compile(b[0]);a(v(b[1]));a(v({code:"NO_PROJECT",message:"No project is open.",nextAction:"Open a project."}));a(!v({...b[1],sourceLocation:{path:"Hero.tsx",column:1}}));a(!v({...b[1],appliedRevision:-1}));for(const t of ["isError: true","Omit success","later autosave failure","transport interruption alone","not passed MCP/editor tests"])a(s.toLowerCase().includes(t.toLowerCase()),t);console.log("ER1 shared error JSON and state boundaries passed")'
  EXPECT: ER1 shared error JSON and state boundaries passed.
  EVIDENCE: The error schema compiled with installed Ajv; 24 positive/negative payload checks passed.
Actual SDK/client delivery, error mapping, source coordinates, and state preservation require runtime verification.

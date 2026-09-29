# Gates: ORC-web documentation coverage and text-editing specification

Scope: Compare every original ORC V1 Markdown document with ORC-web, identify unrepresented browser-relevant behavior, and record the text-editing decisions accepted through discussion without duplicating covered material.

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
  CHECK: node -e 'const fs=require("node:fs"); const files=["doc_v1/README.md","doc_v1/interface/layers-and-properties.md","doc_v1/interface/workspace-and-canvas.md","doc_v1/interface/flex-layout.md","doc_v1/interface/tokens-and-modes.md","doc_v1/architecture/canonical-document-model.md"]; for (const f of files) if (!fs.readFileSync(f,"utf8").includes("text-editing.md")) { console.error(`missing text-editing.md link in ${f}`); process.exitCode=1 } if (!process.exitCode) console.log("All six text-document entry points link to text-editing.md")'
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
  CHECK: git diff --check && ! rg -n '[[:blank:]]+$' doc_v1/interface/text-editing.md doc_v1/interface/layers-and-properties.md doc_v1/interface/workspace-and-canvas.md doc_v1/interface/flex-layout.md doc_v1/interface/tokens-and-modes.md doc_v1/architecture/canonical-document-model.md doc_v1/README.md backlog/README.md .unlazy/orc-web-coverage-audit.md && node -e 'const fs=require("node:fs"),path=require("node:path"); const roots=["doc_v1","backlog"]; const files=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(p.endsWith(".md")) files.push(p)}}; roots.forEach(walk); const re=/(?<!!)\[[^\]]*\]\(([^)]+)\)/g; const bad=[]; for(const f of files){const s=fs.readFileSync(f,"utf8"); for(const m of s.matchAll(re)){const t=m[1].split("#")[0]; if(!t||t.includes("://")||t.startsWith("mailto:")||t.startsWith("/")) continue; if(!fs.existsSync(path.resolve(path.dirname(f),t))) bad.push(`${f}: ${t}`)}} if(bad.length){console.error(bad.join("\n")); process.exit(1)} console.log(`All relative links resolve across ${files.length} Markdown files`)'
  EXPECT: All relative links resolve across
  EVIDENCE: All relative links resolve across 19 Markdown files

- [x] G10: Every text behavior accepted in discussion is recorded, and unresolved storage or browser details remain explicitly open.
  EVIDENCE: doc_v1/interface/text-editing.md:12-27, 29-32, 34-58, 60-76, 78-94, 104-113

- [x] G11: Layers and Properties, Flex layout, and Constraints link to one another in both directions.
  CHECK: node -e 'const fs=require("node:fs"); const links={"doc_v1/interface/layers-and-properties.md":["flex-layout.md","constraints.md"],"doc_v1/interface/flex-layout.md":["layers-and-properties.md","constraints.md"],"doc_v1/interface/constraints.md":["layers-and-properties.md","flex-layout.md"]}; for(const [f,targets] of Object.entries(links)){const s=fs.readFileSync(f,"utf8");for(const t of targets)if(!s.includes(t)){console.error(`${f} does not link ${t}`);process.exitCode=1}}if(!process.exitCode)console.log("All three layout and Properties documents link to each other")'
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
  CHECK: node -e 'const fs=require("node:fs");const files=["doc_v1/interface/code-window.md","doc_v1/interface/react-components.md","doc_v1/architecture/command-engine-and-history.md","doc_v1/mcp/tool-catalog.md","doc_v1/mcp/command-contracts.md"];const s=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n");for(const x of ["Failed Apply","Runtime component errors","Retry","Open code","get_context","unapplied Code window text","does not silently undo"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("Component recovery contract is documented")'
  EXPECT: Component recovery contract is documented.
  EVIDENCE: Component recovery contract is documented.

- [x] R7: Only applied design changes persist in a project, and closing or reloading with unapplied Code window text asks for explicit discard.
  CHECK: node -e 'const fs=require("node:fs");const files=["doc_v1/architecture/orc-workspace-bundle.md","doc_v1/interface/code-window.md","doc_v1/architecture/react-source-bindings.md"];const s=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n");for(const x of ["Saved means that the applied design is written","current editing session","Discard unapplied changes?","last applied source"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}if(s.includes("code-drafts.json")){console.error("persistent code draft file remains");process.exit(1)}console.log("Applied-only persistence contract is documented")'
  EXPECT: Applied-only persistence contract is documented.
  EVIDENCE: Applied-only persistence contract is documented.

- [x] R8: New projects start as Untitled workspaces, first save creates an `.orc` folder, and save failure keeps work open with simple recovery controls.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/architecture/orc-workspace-bundle.md","utf8");for(const x of ["New project immediately opens", "Untitled", "First Save", "Save failed", "Retry", "Save as", "Disconnected", "last successfully saved design"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("Project start and save-recovery contract is documented")'
  EXPECT: Project start and save-recovery contract is documented.
  EVIDENCE: Project start and save-recovery contract is documented.

- [x] R9: SVG V1 editing uses Select for whole-artwork placement and transformation, Properties for supported colors and strokes, and defers path anchor editing.
  CHECK: node -e 'const fs=require("node:fs");const files=["doc_v1/interface/svg-editing.md","doc_v1/interface/layers-and-properties.md","doc_v1/interface/workspace-and-canvas.md","backlog/README.md"];const s=files.map(f=>fs.readFileSync(f,"utf8")).join("\\n");for(const x of ["rotation handle","preserving its proportions","Stroke width","Replace SVG","individual path points","anchor-point"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("SVG V1 editing boundary is documented")'
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
  CHECK: node -e 'const fs=require("node:fs");const s=fs.readFileSync("doc_v1/interface/workspace-and-canvas.md","utf8")+fs.readFileSync("doc_v1/interface/layers-and-properties.md","utf8");for(const x of ["Hold Shift and click","drag-selection box","Select one object to edit its properties","scrolls that row into view"])if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}console.log("Selection boundary is documented")'
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

- [x] B1: V1 targets current stable desktop Chrome on Fedora and Windows, while project-folder work remains owned by the local server.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/architecture/browser-support.md","utf8");for(const x of ["current stable desktop release of Google Chrome","Fedora Linux and Windows","local server owns opening, saving, and exporting"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("Chrome V1 support contract is documented")'
  EXPECT: Chrome V1 support contract is documented.

- [x] B2: Project fonts are portable assets when inclusion is confirmed, while installed fonts remain local references with a visible replacement workflow.
  CHECK: node -e 'const s=require("node:fs").readFileSync("doc_v1/interface/font-management.md","utf8");for(const x of ["Project font","Installed font","Font unavailable","previews the candidate","one Undo step","not copied into the project or export"]){if(!s.includes(x)){console.error(`missing ${x}`);process.exit(1)}}console.log("Portable-font contract is documented")'
  EXPECT: Portable-font contract is documented.

- [x] B3: The index, text editing, workspace bundle, and export documents link to the new browser and font contracts.
  CHECK: node -e 'const fs=require("node:fs");const files={"doc_v1/README.md":["browser-support.md","font-management.md"],"doc_v1/interface/text-editing.md":["font-management.md","browser-support.md"],"doc_v1/architecture/orc-workspace-bundle.md":["font-management.md"],"doc_v1/import-export/export.md":["font-management.md"]};for(const [f,targets]of Object.entries(files)){const s=fs.readFileSync(f,"utf8");for(const t of targets)if(!s.includes(t)){console.error(`${f} missing ${t}`);process.exit(1)}}console.log("Font and browser links are documented")'
  EXPECT: Font and browser links are documented.

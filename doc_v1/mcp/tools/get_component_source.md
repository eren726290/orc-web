# get_component_source

## Status and purpose

Accepted V1 responsibility and core JSON exchange, recorded on 2026-10-05.
`get_component_source` reads the actual applied implementation of one managed component definition.
It has a separate public schema and contract from [get_source](get_source.md), which reads object code, instance usage, and relevant nested-layer excerpts with owner references.
Both reuse the existing source service and active project; this split does not create another backend, editable source authority, or project copy.
Detailed file/location and diagnostic encodings, response limits, and production SDK/error integration remain implementation decisions.
The running ORC-web tool has not been verified.

## Target and requested files

Require the stable component-definition ID, not an instance ID, Layer label, export name, or filesystem path standing in for identity.
The existing [component record](../../architecture/canonical-document-model.md#component-records-and-instances) supplies its definition identity, entry path, and export name.
Use [get_node](get_node.md) and [get_source](get_source.md) to inspect the relevant value's actual owner before choosing the definition or file.
A nested value can belong to a shared local child rather than the outer component.
Do not guess the source owner from the visually selected component root.

Omit `filePaths` to read the entry file only.
Provide `filePaths` to read the explicit set of managed source files instead; the entry is not automatically added when it was not requested.
A request can include the entry and related CSS, local component, declaration, SVG, or local data source when those are part of the managed bundle and supported source workflow.
Paths identify files within that component's managed source bundle, not arbitrary host files or unrelated project components.
Return files once, in requested order, using their known managed paths.
Missing or unavailable files are reported explicitly; do not replace them with generated wrappers or another similarly named file.
Path normalization and supported file grammar remain implementation work before runtime support is claimed.

## Agreed JSON exchange

Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) for schema authority, SDK wrapping, and successful `structuredContent`.
The language field identifies returned text, such as `tsx`, `jsx`, `css`, or `svg`; it does not grant execution or editing support to arbitrary formats.

### Input schema

```json
{
  "type": "object",
  "properties": {
    "componentId": {"type": "string", "minLength": 1},
    "filePaths": {"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}, "uniqueItems": true}
  },
  "required": ["componentId"],
  "additionalProperties": false
}
```

### Output schema

```json
{
  "type": "object",
  "properties": {
    "projectId": {"type": "string", "minLength": 1},
    "appliedRevision": {"type": "integer", "minimum": 0},
    "componentId": {"type": "string", "minLength": 1},
    "entryPath": {"type": "string", "minLength": 1},
    "exportName": {"type": "string", "minLength": 1},
    "files": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {"path": {"type": "string", "minLength": 1}, "language": {"type": "string", "minLength": 1}, "code": {"type": "string"}},
        "required": ["path", "language", "code"],
        "additionalProperties": false
      }
    },
    "complete": {"type": "boolean"},
    "diagnostics": {"type": "array", "items": {"type": "object"}}
  },
  "required": ["projectId", "appliedRevision", "componentId", "entryPath", "exportName", "files", "complete", "diagnostics"],
  "additionalProperties": false
}
```

`entryPath` and `exportName` identify the registered entry even when only a supporting file was requested.
`files[].code` is actual applied authored text, retaining comments, imports, JSX/TSX, Tailwind classes, Motion behavior, and SVG as present in that file.
Reading does not format, compile, convert, install packages, or rewrite source.
`complete` means the requested files were fully returned, not that every transitive dependency was included.
An output limit must be explicit and report false; chunking/continuation and exact byte limits remain open.
Unavailable requested content must never be described as a complete successful read.
If the definition or any explicitly requested file is missing or unsupported, return a useful tool error identifying the known problem rather than silently returning the remaining files as success.

### Request and response examples

Default entry-file arguments:

```json
{"componentId": "component_hero"}
```

Successful structured result:

```json
{
  "projectId": "project_1",
  "appliedRevision": 12,
  "componentId": "component_hero",
  "entryPath": "components/Hero.tsx",
  "exportName": "Hero",
  "files": [
    {
      "path": "components/Hero.tsx",
      "language": "tsx",
      "code": "export function Hero({ title }: { title: string }) {\n  return <h1 className=\"text-5xl font-bold\">{title}</h1>;\n}"
    }
  ],
  "complete": true,
  "diagnostics": []
}
```

Arguments requesting the entry and one supporting stylesheet:

```json
{"componentId": "component_hero", "filePaths": ["components/Hero.tsx", "styles.css"]}
```

The supporting-file example requires both paths to exist in that managed bundle.
It does not promise that every component has a stylesheet named `styles.css`.

## Applied state, diagnostics, and failures

Follow the [shared read rules](../read-tools.md#shared-read-behavior): content and revision describe the same current applied state, including successful edits awaiting autosave.
Exclude private Code drafts, rejected candidates, temporary Preview inputs, open state, and animation progress.
When a known diagnostic exists, identify its affected component/file and candidate-application versus later-runtime meaning.
A rejected candidate's error does not make its text the current applied file.
Missing projects, definitions, files, or reliable source are reported rather than fabricated.
Server-owned reads remain available with the editor tab closed while the active project backend runs.
Reading does not select an object, reveal content, unlock targets, mutate source, increment the revision, or create an Undo entry.

## Later edits and export

Use [update_component_source](update_component_source.md) for implementation edits with explicit shared or supported Only this scope.
Reading the shared definition does not make it independent or authorize an instance-only interpretation of a shared change.
Instance-owned inputs still use [update_component_props](update_component_props.md).
Ordinary HTML/CSS/SVG object code still uses `get_source`.

This is source inspection, not a complete runnable package export.
Required dependencies, aliases, themes, assets, and other resources follow [export](export.md).
The separate public tools can be reconsidered later based on actual use; no merge or second implementation is required for V1.

## Implementation verification still required

- Read the entry by default and explicit related files with matching paths, entry/export identity, requested order, and one applied revision.
- Distinguish two instances sharing a definition, an independent copy, and a nested value owned by a local child; do not confuse instance IDs with definition IDs.
- Preserve authored comments, imports, Tailwind, Motion, and SVG, including related CSS read after a successful atomic source update.
- Check missing definitions/files, unsupported formats, bounded results, and no fallback to generated wrappers or unrelated host files.
- Read after completed edits before autosave, during an unapplied human draft, after a rejected update, and with the editor tab closed.
- Verify unchanged project revision, source, selection, locks, and history, plus source reproduction after save/reopen.

These are required implementation checks, not passed application tests.

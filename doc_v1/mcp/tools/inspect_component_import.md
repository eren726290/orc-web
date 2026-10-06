# inspect_component_import

## Status and purpose

Accepted V1 responsibility, recorded on 2026-10-04.
`inspect_component_import` checks a component candidate before the agent imports it into the active project.
The candidate can be newly written JSX/TSX submitted directly by the agent, including its supporting files.
Together, `inspect_component_import` → [import_component](import_component.md) form the workflow for creating a live React design from scratch, corresponding to [insert_html](insert_html.md) for ordinary HTML/CSS.
It reports usable entries, required source and dependencies, styling and assets, initial-input requirements, and the supported visual editing boundary.
It is read-only and does not establish that the candidate has compiled or rendered successfully.
Core inline-source request fields and examples are accepted below.
Extended source-transfer formats, inspection report schemas, fingerprint encoding, and response limits remain implementation decisions.
The tool has not been verified through a running ORC-web MCP server.

## Agreed JSON exchange

Core inline-source request fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples).
This schema covers the basic agent-authored JSX/TSX and supporting text-file submission.
Dependency descriptions, theme inputs, binary assets, declarations, initial inspection inputs, and local/npm/npx/registry source-transfer variants remain implementation decisions.
Those requirements remain part of the accepted candidate responsibilities below; this minimal schema does not claim to encode every composition.

### Inline input schema

```json
{
  "type": "object",
  "properties": {
    "source": {
      "type": "object",
      "properties": {
        "kind": {
          "const": "inline"
        },
        "entryPath": {
          "type": "string",
          "minLength": 1
        },
        "exportName": {
          "type": "string",
          "minLength": 1
        },
        "files": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "minLength": 1
              },
              "code": {
                "type": "string"
              }
            },
            "required": [
              "path",
              "code"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "kind",
        "entryPath",
        "exportName",
        "files"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "source"
  ],
  "additionalProperties": false
}
```

`entryPath` identifies one submitted file and `exportName` identifies its usable export.
Supporting JSX/TSX and CSS files can be submitted in the same `files` array.
The service must validate distinct supported file paths, entry existence, required imports, and the component contract; JSON shape validation cannot establish them.
A file may have empty text, such as an intentionally empty stylesheet.
The source object has the same basic shape in `import_component`.

### Example request and report

```json
{
  "source": {
    "kind": "inline",
    "entryPath": "Hero.tsx",
    "exportName": "Hero",
    "files": [
      {
        "path": "Hero.tsx",
        "code": "export function Hero({ title }: { title: string }) { return <h1>{title}</h1>; }"
      }
    ]
  }
}
```

```json
{
  "projectId": "project_1",
  "appliedRevision": 15,
  "inspectionFingerprint": "inspected_hero_1",
  "status": "ready_for_preparation",
  "entryPath": "Hero.tsx",
  "exportName": "Hero",
  "inputs": [
    {
      "name": "title",
      "type": "string",
      "required": true
    }
  ],
  "requirements": {
    "packages": [],
    "styleFiles": [],
    "assets": []
  },
  "diagnostics": []
}
```

`ready_for_preparation` means inspection found no known blocking problem in this example.
It does not confirm compilation, a valid render, or a completed placement.
The required `title` is reported as an input; the Import example supplies its value.
The empty package list illustrates this small source submission and does not mean React or the host runtime has no dependency requirements.
The full report must also describe reliably recognized editing capabilities, source-only values, and known limitations under What inspection reports below.
Detailed report schemas, requirement records, diagnostics, fingerprint encoding, and response limits remain implementation decisions.

`inspectionFingerprint` identifies the inspected candidate, independently of the applied project revision.
Import rechecks the inspected source and requirements.
Inputs already covered by inspection must remain unchanged; any changed inspected input requires fresh inspection.
Inspection changes no project revision, applied files, or Undo history and executes no package command.

## Candidate inputs

| Source description | Inspection responsibility |
| --- | --- |
| Agent-authored JSX/TSX files | Read the submitted entry and supporting source, including CSS, asset references, dependency requirements, and any editable declarations. |
| Local source | Read the chosen entry and the supported local files it requires. |
| npm package | Identify the recorded package candidate, usable exports, and required dependencies and styling. |
| npx-based workflow | Identify its origin, required executable command, and requirements available without running that command. |
| shadcn registry item | Read its component files, dependencies, styles, and required theme inputs under the supported registry contract. |

A small component can use one source file; normal compositions can supply several files together.
The source description identifies the intended entry file and export when known.
It also supplies initial props or local sample data and required assets when the component needs them.
The exact representation of file contents, binary assets, local references, and package requirements remains open.

Inspection follows the chosen entry's required local imports and dependency paths.
An unrelated installed package does not determine the candidate's eligibility.
Hooks and utility exports remain supporting code rather than automatic placement choices.
If several usable entries exist, report them so the agent can choose one supplied component or composition.
Do not invent a composition or missing application data merely to make a candidate appear usable.

For source generated by an executable command, some entry and binding details may become available only during preparation.
Report what is known and what still requires preparation rather than claiming to have inspected generated source that does not yet exist.
The [shared import flow](../../import-export/component-import.md#choosing-a-usable-component) owns that distinction.

Use the [shared source and resource preparation rules](../../import-export/component-import.md#shared-source-and-resource-preparation) for package manifests/lockfiles, managed assets, stylesheet entries, Tailwind source detection, and explicit entry/export changes.
Extended resource and dependency encodings remain open; the core JSON above is unchanged.

Inspection identifies known preparation requirements without executing them.

## What inspection reports

The result describes the selected candidate and, where reliably available:

- Its source origin, usable entry/export choices, and required supporting files.
- Package requirements, selected versions where resolved, and any command that Import would execute.
- Required plain CSS or Tailwind v4 source, theme inputs, and assets.
- Supported defaults or supplied initial inputs, and missing required inputs.
- Recognized source-backed layers, exposed instance properties, slots, and local editable data.
- Values that require source editing, unsupported runtime/build requirements, and the known reason for each limitation.
- A source fingerprint or equivalent identity that `import_component` can recheck.

The example below records the core inspection report and fingerprint passed to Import; detailed report schemas remain open.
Keep the result focused on the usable entry and its requirements; do not automatically return every source file or dependency's implementation.
An inspection reference is not a placed component definition or instance ID.

## Recognition and editing boundary

Use the existing [component contract](../../import-export/component-import.md#component-contract) and [accepted binding sources](../../architecture/react-source-bindings.md#accepted-sources-of-bindings).
Reliable recognition can derive controls from supported static JSX, Base UI imports, Base UI-flavored shadcn wrappers, and supported API or render-prop shapes.
An author does not need a hand-written manifest for values the importer can map reliably.
Explicit declarations can describe supported editable inputs when recognition is insufficient.

V1 does not recognize Radix import paths as editable component contracts.
Arbitrary runtime DOM descendants do not become editable Layers merely because the component can render them.
Eligibility belongs to each value: an unsupported computed title can require Edit source while its supported sibling or static spacing remains editable.
Inspection explains a source-only or static path, or a blocking runtime requirement, when no accepted editable contract is available.
It must not invent bindings or promise a Properties control that is outside the existing V1 release scope.

## Read-only behavior and freshness

Inspection does not execute package commands, install the candidate, compile it by running its build, or place an object.
It does not write applied project files, increase the design revision, or add an Undo entry.
Reading source and dependency metadata is distinct from the execution authorized by [import_component](import_component.md).
An inspected result is not a Ready to place render result.

Import must use the same candidate that was inspected.
Changed source files, package versions, registry content, or other inspected inputs require a new inspection rather than silently importing the changed candidate.
The concrete fingerprint representation is still open.
This source-freshness check complements the command engine's expected project revision; they identify different inputs.

## Failures and implementation checks

Report unreadable source, unresolved required metadata, missing entry choices, unsupported requirements, and known input errors without changing the applied design.
Identify a reliable file, export, package, or requirement where available; do not invent a source location.
Inspection failure is not a failed placement and must not leave a partial workspace object.

Verify all accepted source descriptions, supported wrapper recognition, per-value source-only reporting, missing required inputs, and changed-candidate rejection.
Verify that inspection executes no candidate command and changes no applied project files, revision, or history.
The complete composition proof is recorded in [import_component](import_component.md#required-composition-proof); these checks are requirements, not passed MCP tests.

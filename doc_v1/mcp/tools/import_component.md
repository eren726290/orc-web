# import_component

## Status and purpose

Accepted V1 behavior, recorded on 2026-10-04.
`import_component` prepares an inspected React component or composition and places one live instance in the active project.
This includes creating a design from newly written agent-authored JSX/TSX supplied directly through MCP; an existing component, package, or repository is not required.
The full authoring workflow is [inspect_component_import](inspect_component_import.md) → `import_component`, corresponding to [insert_html](insert_html.md) for ordinary HTML/CSS.
Agent-authored JSX/TSX, Tailwind v4 styles, Base UI-flavored shadcn components, Motion, and SVG can arrive together in one composition through one Import call.
Supporting files are prepared with the chosen entry rather than placed as separate workspace objects.

The agent first uses [inspect_component_import](inspect_component_import.md).
The one-call responsibility here is preparation and placement after inspection; it does not remove that read-only step or require a separate import call for every technology.
This tool reuses the existing [component import service](../../import-export/component-import.md), renderer, source-binding resolver, and command engine.
Core JSON request/result fields and inline-source examples are accepted below.
Extended source-transfer formats, package support, and production storage mappings remain implementation decisions.
The complete MCP/editor workflow below has not been implemented or verified.

## Request responsibilities

| Input | Accepted responsibility |
| --- | --- |
| Active project, command identity, and expected revision | Use the existing command requirements and intended applied project state. |
| Inspected candidate | Identify the inspected source and its unchanged fingerprint or equivalent identity. |
| Entry file and export | Choose the usable component or supplied composition to render. |
| Source and supporting files | Supply or identify the accepted JSX/TSX, CSS, local component files, and any necessary declarations. |
| Package and build requirements | Include required dependencies and supported style/theme inputs; preserve exact resolved records on success. |
| Initial inputs and resources | Supply supported props, local sample data, and required assets that are not already provided by accepted defaults. |
| Destination and placement | Identify a valid workspace or container destination and its appropriate position or insertion point. |

The core inline-source field names are recorded below; extended source and resource descriptions remain open.
An inspected candidate can originate from agent-authored files, local source, npm, a supported npx workflow, or a shadcn registry item.
Source passed directly through MCP does not require the designer to create files or press Code Apply.
Required command execution belongs to the accepted Import operation, under the same [import authorization](../../import-export/component-import.md#human-flow) and runtime support policy.
It does not introduce repeated confirmation for ordinary import.

## Agreed JSON exchange

Core inline-source request/result fields and examples accepted on 2026-10-05.
Use the [shared JSON rules](../read-tools.md#json-schemas-and-examples) and existing [command requirements](../../architecture/command-engine-and-history.md#command-requirements).
`projectId` identifies the intended active project.
The basic source shape matches [inspection](inspect_component_import.md#agreed-json-exchange).
Extended dependency/theme/asset/declaration formats and other source descriptions remain implementation decisions; required composition inputs must still be supplied or identified before preparation succeeds.

### Inline input schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "expectedRevision": {
      "type": "integer",
      "minimum": 0
    },
    "inspectionFingerprint": {
      "type": "string",
      "minLength": 1
    },
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
    },
    "parentId": {
      "type": "string",
      "minLength": 1
    },
    "position": {
      "type": "object",
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        }
      },
      "required": [
        "x",
        "y"
      ],
      "additionalProperties": false
    },
    "index": {
      "type": "integer",
      "minimum": 0
    },
    "props": {
      "type": "object"
    }
  },
  "required": [
    "commandId",
    "projectId",
    "expectedRevision",
    "inspectionFingerprint",
    "source"
  ],
  "additionalProperties": false,
  "allOf": [
    {
      "if": {
        "not": {
          "required": [
            "parentId"
          ]
        }
      },
      "then": {
        "required": [
          "position"
        ],
        "not": {
          "required": [
            "index"
          ]
        }
      }
    }
  ]
}
```

`props` supplies supported initial instance inputs; required values are checked against the component contract and accepted defaults.
JSON shape validation does not prove their types, source ownership, or rendering behavior.
The source and all previously inspected requirements must match `inspectionFingerprint`.
File-path validation, export resolution, fingerprint computation, and resource preparation belong to the shared import service.

| Destination | Required placement |
| --- | --- |
| Workspace root | Omit `parentId`; require `position` in unzoomed workspace CSS pixels; omit `index`. |
| Free frame/container | Supply `parentId` and parent-relative `position` in CSS pixels; optional `index` chooses sibling order. |
| Flex container | Supply `parentId`; omit `position`; optional `index` chooses child order, otherwise append. |

Signed and fractional coordinates are allowed under existing placement rules.
`index` is zero-based, with zero before the first child and the current child count after the last.
An omitted index appends; an out-of-range index fails rather than being clamped.
The service reads the destination's actual layout to require Free coordinates or reject coordinates in normal Flex flow.
The schema cannot determine that layout from a stable ID.
Unlike ordinary HTML insertion, a component's Free placement is supplied explicitly in the request rather than inferred from canonical fragment styles.
Supported parent/slot eligibility, locks, stale revisions, and initial render still require service validation before commit.

### Output schema

```json
{
  "type": "object",
  "properties": {
    "commandId": {
      "type": "string",
      "minLength": 1
    },
    "projectId": {
      "type": "string",
      "minLength": 1
    },
    "appliedRevision": {
      "type": "integer",
      "minimum": 0
    },
    "componentId": {
      "type": "string",
      "minLength": 1
    },
    "nodeId": {
      "type": "string",
      "minLength": 1
    }
  },
  "required": [
    "commandId",
    "projectId",
    "appliedRevision",
    "componentId",
    "nodeId"
  ],
  "additionalProperties": false
}
```

`componentId` identifies the saved reusable definition.
`nodeId` identifies the newly placed instance, with descendant reads available through [get_tree](get_tree.md).
The result echoes the accepted command/project identities and identifies the committed applied revision.
It does not confirm a completed disk save.

### Free-frame example

```json
{
  "commandId": "cmd_import_component_1",
  "projectId": "project_1",
  "expectedRevision": 15,
  "inspectionFingerprint": "inspected_hero_1",
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
  },
  "parentId": "frame_1",
  "position": {
    "x": 24,
    "y": 24
  },
  "props": {
    "title": "Build something great"
  }
}
```

```json
{
  "commandId": "cmd_import_component_1",
  "projectId": "project_1",
  "appliedRevision": 16,
  "componentId": "component_hero_1",
  "nodeId": "hero_instance_1"
}
```

This example places the inspected Hero at 24,24 relative to `frame_1`, which must be a valid Free destination.
For workspace placement, omit `parentId` and supply workspace coordinates.
For Flex placement, omit `position` and optionally supply `index`.
Tailwind, Base UI/shadcn, Motion, SVG, and supporting assets remain accepted together through the composed-source workflow below.
The small inline example does not prove that complete workflow or finalize its resource-transfer formats.

## One composed source bundle

An agent asked to build an animated landing page with a signup dialog can supply:

```text
LandingPage.tsx
components/
  Hero.tsx
  SignupDialog.tsx
  ui/button.tsx
styles.css
assets/
  product.webp
```

`LandingPage.tsx` and its chosen export are the placed entry.
The other files supply its component implementation, required styles, and image.
One file is enough for a smaller component.
The file layout above is an illustrative submission, not a prescribed project-directory schema.

The source description retains the imports and dependency requirements actually used by the composition.
Use declared defaults or author/agent-supplied supported initial props and local sample data.
Do not fabricate required providers, external service results, or missing application behavior to make the entry pass rendering.
Editable declarations are needed only where reliable recognition cannot derive the accepted values.

Use the [shared source and resource preparation rules](../../import-export/component-import.md#shared-source-and-resource-preparation) for package manifests/lockfiles, managed assets, stylesheet entries, Tailwind source detection, and explicit entry/export changes.
Extended resource and dependency encodings remain open; the core JSON above is unchanged.

## Rendering technologies in the same import

| Technology | Handling |
| --- | --- |
| React JSX/TSX | Retain the authored source and execute the prepared live component with its accepted inputs. |
| HTML and plain CSS within React | Preserve authored markup and required CSS under the component's supported source and style scope. |
| Tailwind CSS v4 | Compile the accepted source classes and required theme inputs into browser CSS while retaining their authored source. |
| Base UI and Base UI-flavored shadcn | Retain required component source and dependencies, following supported local wrappers and recognized API/composition shapes. |
| Motion for React | Retain animation and interaction behavior in React source; expose settings only when the accepted contract owns them. |
| SVG | Retain inline vector source or referenced assets under the existing supported SVG editing boundary. |

Tailwind supplies CSS; shadcn supplies component source; Motion supplies React behavior.
They do not require separate MCP authoring tools for this composition.
Base UI does not require Tailwind when the selected component uses another supported styling approach.
V1 excludes Radix import paths from editable-component recognition.

The [Tailwind contract](../../import-export/tailwind-components.md) owns complete static class strings, limited visual class edits, preserved unrelated variants, and unsupported configuration boundaries.
The [Motion contract](../../interface/motion.md) owns live animation, Still view, Preview interaction, exposed controls, and stable image/PDF capture.
The [SVG contract](../../interface/svg-editing.md) retains its existing selection and editing limits; importing inline SVG does not add anchor-point editing.
Required theme variables remain rendering inputs without automatically becoming editable Tokens-panel definitions.
That panel integration remains scheduled for [V1.1](../../../backlog/imported-token-management-v11.md).

## Inspection, preparation, and atomic placement

1. Validate the intended project, inspected candidate, usable entry, destination, expected revision, and applicable locks.
2. Confirm that the submitted or referenced source still matches the inspection; changed inspected inputs require another inspection.
3. Prepare required dependencies, styles, theme inputs, and assets through the existing project service.
4. Build JSX/TSX and any required Tailwind CSS, using Bun where supported and Node for executables that explicitly require it.
5. Derive or validate the accepted component contract and supported bindings, and validate initial props, slots, and local data.
6. Check the chosen entry's initial render through the shared local rendering service with the prepared styles and accepted inputs.
7. Revalidate the commit requirements and commit the component record, placed instance, inputs, required managed records, and bindings together as one command, one new revision, and one Undo step.
8. Return the component definition ID, placed instance/root ID, and matching applied revision.

The core success response is recorded in the agreed JSON exchange; SDK/error integration remains open.
Do not automatically return every descendant or the entire source; use [get_tree](get_tree.md) for descendants, [get_node](get_node.md) for details, and [get_source](get_source.md) for applied code.
Preparation success alone does not add a workspace object or create a placement history entry.
The [command lifecycle](../../architecture/command-engine-and-history.md#command-lifecycle) and [local rendering service](../../architecture/system-architecture.md#local-rendering-service) own validation and commit authority.
An initial-render check does not establish correctness of every later interaction.

## Destination and workspace result

At workspace root, place one loose component instance at the supplied unzoomed canvas position.
Inside a Free frame, use the requested position under its existing parent-relative placement rules.
Inside a Flex container, use the requested valid insertion point and existing child-layout rules rather than silently forcing Absolute Position.
The destination must accept the placement under the saved hierarchy and supported component-slot rules.
An arbitrary runtime DOM descendant is not a valid destination merely because it is visible.

Ordinary HTML/CSS objects and React instances can coexist inside the same frame.
[insert_html](insert_html.md) continues to create canonical ordinary layouts; Import retains component source and instance inputs as their authority.
Do not flatten a live React composition into a second ordinary-object tree.
Imported styles preserve their intended design scope without restyling the editor or unrelated frames.

The human import interface's automatic selection and placement preview remain defined in [Component import](../../import-export/component-import.md#placement-and-completion).
MCP uses explicit targets and returned IDs without requiring the person to select each object for the agent.
Browser selection and open Code drafts remain view/session state under their existing contracts.

## Layers, Properties, and later edits

The placed instance has a root Layer and supported nested source-backed Layers:

```text
Landing page
├── Hero
│   ├── Heading
│   ├── Product image
│   └── Signup button
└── Signup dialog
```

The example shows supported authored content, not a promise to expose every generated DOM descendant.
Each editable row needs a stable editor identity and reliable source binding under [React source bindings](../../architecture/react-source-bindings.md#source-backed-layers).
The component remains one selectable object for outer placement while its supported contents remain individually editable.
Canvas and Layers selection address the same layer; Properties and Code follow that layer's supported scope.
The availability of controls follows the existing [Properties release schedule](../../../backlog/properties-panel-v1x.md#v11-properties-controls).

An unsupported value stays source-editable while other supported values remain visually editable.
Source bindings own implementation edits; instance props, supported slots, and local data retain their stated ownership.
Runtime DOM content is never another saved design authority.

- Use [update_component_props](update_component_props.md) for a supported exposed input on one instance, such as a label, variant, or declared animation duration.
- Use [update_component_source](update_component_source.md) to change implementation or related source files, including an unexposed animation.
- Use an accepted style/text operation through a validated binding for supported nested visual values.
- Use the existing explicit Only this or All copies scope for shared values, preserving the accepted local-copying boundary.

An agent resumes from fresh applied state through `get_context` / `get_source` before another edit.
No separate feedback loop or new simultaneous-editing controls are introduced.
The person normally waits for the current agent task to finish, reviews or edits, then can ask the agent to continue.

## Failure, history, and portable source

Failed dependency preparation, compilation, required binding validation, destination validation, or initial rendering leaves the applied design, revision, and Undo history unchanged.
No partial instance, source replacement, or incomplete managed design record is committed.
Identify the known file, component, package, input, or rendering problem so the agent can fix the candidate and resubmit.
A later runtime interaction failure follows the existing [component repair contract](../../interface/code-window.md#runtime-component-errors); it does not silently roll back a successful import.

Successfully prepared dependencies may remain cached after failed placement or Undo.
They are distinct from committed design objects and portable source records.
Undo removes the placed instance and reverses the import's design changes through the command engine; it does not uninstall packages.
Redo restores the accepted instance, references, inputs, and identities through retained session history.

The `.orc` bundle retains required source, styles/theme inputs, managed assets, and exact dependency manifest and lockfile records.
Original local paths or mutable registry tags are not the sole source needed to reopen the design.
Reopening rebuilds from recorded inputs under the [managed dependency contract](../../architecture/orc-workspace-bundle.md#managed-dependencies), and restores the saved design rather than the previous session's Undo stack.
Unsupported or unavailable requirements produce an error without silently substituting another package version.

Successful Import schedules normal autosave; command success is distinct from disk-save success.
Untitled projects can import before a name or save location exists.
React export carries required source, styling, assets, and dependency information under [Export](../../import-export/export.md).
Image/PDF export uses its explicit stable design state rather than transient Preview state or an arbitrary animation frame.

## Required composition proof

Run one agent-authored composition through the actual ORC-web MCP endpoint and Chrome editor on the PC.
Include JSX/TSX, Tailwind v4 with real theme/style inputs, a real Base UI-flavored shadcn component, Motion, SVG, and a managed image or other required asset.
Place it beside ordinary HTML/CSS content in the same frame to exercise both rendering paths.

| Action | Evidence required |
| --- | --- |
| Inspect submitted source | Correct entry, required files/dependencies/styles/assets/inputs, supported layers, and per-value source-only limitations; no package execution or applied mutation. |
| Change an inspected input before Import | Rejection requiring fresh inspection, with no partial instance or revision/history change. |
| Import the unchanged chosen composition once | Complete live placement with correct style scope, root/definition IDs, one revision, and one Undo step; supporting files do not become extra workspace objects. |
| Read context and select a supported nested layer | Reliable descendant identity, matching Layers selection, and applicable Properties without promoting deferred controls into V1. |
| Change a supported gap or radius through Properties | Owning source or input changes, matching applied Code/get_source, and unrelated content preserved. |
| Update one instance's exposed prop through MCP | Only that instance-owned input changes, with bindings and current source consistent. |
| Update related JSX and CSS through MCP | One validated source update, required style rebuild, and no partial application if either file fails. |
| Preview the selected frame | Normal button/dialog and Motion interaction, supported SVG appearance, reachable Exit Preview, and saved defaults unchanged by the session. |
| Undo/Redo completed edits and import | Correct source, instance values, references, binding identities, and whole-placement restoration through retained history. |
| Save, confirm Saved, and reopen | Retained source, assets, styles/theme inputs, exact dependencies, inputs, hierarchy, and stable identities. |
| Submit broken source or an invalid required input | Rejection preserving the working design, source, revision, history, and last valid saved project. |

Check workspace, Free, and Flex placement, locked/stale targets, missing dependencies or styles, and later runtime-error repair.
Check Only this with the accepted local nested-owner pattern and reject unsupported copying before mutation; the source-update contract owns those limits.
Record the actual toolchain/browser versions and evidence on Fedora and Windows.
Earlier source-mapping experiments do not prove this combined MCP/editor workflow.
These are acceptance requirements, not passed implementation tests.

# Code window

## Status

Accepted V1 product behavior.

## Purpose

The Code window lets people inspect and edit code connected to their design.
Code is useful when visual controls are not enough, but unfinished typing must never damage the live design.

## Opening and placement

Code is a top-bar control.
The Code window is closed initially and opens below the canvas when the person clicks Code.
Clicking Code again hides it, subject to the unapplied-change safeguard below.
Opening the window preserves the current selection.
Its height is resizable; custom docking is deferred.
With no selection, the open window shows **Select an object to view its code.**

## Source display and scope

The selected object determines the initial Code view.

| Selection | Initial Code view |
| --- | --- |
| Ordinary object or frame | Its HTML or JSX and relevant CSS. |
| SVG | Its SVG source. |
| React component root | Its JSX usage and instance properties, such as `<Hero title="Welcome" />`. |
| Supported nested React layer | Its owning component source, with the relevant JSX highlighted. |

The header identifies the selected layer, source owner, and editing scope.
For example, selecting a Hero heading shows **Hero → Heading · Component source · All copies**; selecting its instance usage shows **Hero · This instance**.
These are example labels rather than required component names.
Opening or highlighting source preserves the canvas selection.
Highlighting is editor state; the validated source binding identifies the editable target, not its current line number.

**Edit source** from Properties opens the owner of that particular value.
A title supplied through an instance property opens that instance's value; styling owned by the shared implementation opens component source and shows All copies.
The separate **Edit component source** action opens the shared implementation.
Direct edits to that implementation affect all linked instances; Code does not silently make a component independent.
The supported Properties workflow retains its explicit Only this / All copies choice.

## Design and Code synchronization

Design and Code are two views of the same applied design.
A supported Properties adjustment previews live, and completing it updates its owning source or canonical value through the command engine.
An open Code view without a draft reflects that applied change.
Typing in Code remains a draft until explicit Apply validates and renders the candidate.
Successful Apply updates the canvas, Layers, Properties, and applied source together as one command and one Undo step.
Changing selection or a Properties value does not silently apply or merge pending Code.

Ordinary HTML/CSS/SVG objects retain their canonical document authority; React layers retain their authored source and instance-input authority.
A generated selection representation does not create a second editable source authority.
The [source-binding contract](../architecture/react-source-bindings.md) defines supported ownership and per-value source fallbacks.
This workflow does not promise automatic synchronization with an external repository.

## Selected object or frame code

Selecting an ordinary object or frame can show its HTML or JSX and relevant CSS.
People edit a draft, review any validation result, and choose Apply.
Apply updates the selected design scope as one completed command and one Undo step.
Invalid or unfinished code remains in the current Code window session with an explanation and does not alter the canonical document.
Applied design edits validate the selected target's applicable [Layer locks](layers-panel.md#locking); selecting a locked row permits source inspection rather than bypassing its lock.
Copy offers `Copy as Tailwind` for the selected React scope.
React file export offers CSS or Tailwind styling.
Tailwind output generates `className` utilities from the selected design's canonical styles and tokens.

## Draft controls

The current scope offers **Apply**, **Discard changes**, and its appropriate copy action.

| State | Apply and Discard changes | Design |
| --- | --- | --- |
| No changes | Disabled. | Latest applied design. |
| Draft changed | Enabled for an editable scope; show **Unapplied changes**. | Latest applied design. |
| Apply succeeds | Disabled again; clear the pending indicator. | Newly applied design. |
| Apply fails | Keep the draft and show the error; allow correction or discard. | Previous working design. |

**Discard changes** reloads the latest applied code for the current scope without changing the design, document revision, or Undo history.
Locked scopes permit inspection and copying but cannot enable design Apply.
Ctrl+Z while typing uses Code's text history; document Undo follows the [command-engine focus rules](../architecture/command-engine-and-history.md#undo-and-redo).

## Failed Apply

If Apply cannot parse, validate, compile, or render the proposed code, ORC-web identifies the affected object, frame, or component and shows the reason in the Code window.
The message names the affected component or file and gives a concise error.
When the diagnostic identifies an exact location in the authored source for that draft, show the location and highlight that line in the draft.
If no reliable authored-source location is available, show the error but do not guess a line or highlight an unrelated generated-code location.
For example, **Hero.tsx · Line 12: Missing closing tag.**
The applied design remains on the canvas because the failed proposal never becomes a document revision.
The unsuccessful code remains available in the current editing session for correction.

The person can correct the draft in Code or ask an agent to fix the affected applied component.
An agent reads the current applied source and diagnostic through `get_context` or `get_source`, then submits its correction through the existing source mutation.
The agent never receives an unfinished private draft as though it were applied source.

## Selection after Apply

Code Apply keeps stable identities where the editor can prove the selected structure still maps to the existing design.
New elements receive new IDs.
An ambiguous replacement must explain the identity change before it applies.
The resolver validates old bindings against the new applied source before another visual edit can use them.
The Fedora proof of selection through supported commands does not establish identity reconciliation after arbitrary Code Apply.
This remains a production implementation requirement.

| Successful change | Selection result |
| --- | --- |
| Text or styling changes | Keep the same object selected when its identity is verified. |
| Reordering an existing layer | Selection follows that same object when its identity is verified. |
| Deleting the selected layer | Select its nearest surviving design parent whose identity can be verified; otherwise clear selection. |

The workspace root is not a selectable object, so deleting a selected loose object without a surviving design parent clears selection.
If continuity cannot be proved for a replacement, clear the uncertain selection and explain that the person needs to select again.
Do not select a similar-looking element as a substitute.
The canvas outline, Layers highlight, Properties, and Code scope follow the resulting selection together.
This selection update is editor state and adds no separate document revision or Undo entry.
If Apply fails, keep the previous design and selection.

## Shared component source

An imported component instance shows its current use and declared property values.
Editing its implementation is a separate action named Edit component source.
That source belongs to a shared component record rather than one selected instance.

Applying valid shared source updates every instance that refers to that component record.
One Undo restores the prior source and all affected instances.
The Apply flow validates declared properties and slots so an update cannot silently discard an existing instance value.

Selecting a source-backed component layer identifies the source binding that its visual controls use.
A visual edit changes that owned source value through the same command engine as Code Apply.
Code remains the path for valid source changes that do not have a safe visual binding.
An unsupported computed value can remain source-editable without disabling supported controls on sibling layers.
Properties offers **Edit source** for that value and opens the relevant applied source in Code.
Apply still validates existing required instance properties and slots; partial visual support does not permit silently discarding their values.
See [Editable React components](react-components.md), [Motion](motion.md), and [React source bindings](../architecture/react-source-bindings.md).

## Unapplied code

Unapplied code stays in the current editing session until the person applies or discards it.
Changing or clearing selection with unapplied code first asks **Discard unapplied changes?**.
The person can cancel and retain the current selection and draft, or discard the draft and continue to the requested selection.
To keep the edit, they cancel, Apply successfully, and then change selection.
Typing alone does not compile, execute, import, apply, or change the saved design.
Choosing Apply prepares and validates the candidate before committing it; failure leaves the applied design unchanged.
Generated exports and MCP source reads use applied design state and exclude unapplied code.

If a person closes or reloads the editor with unapplied code, ORC-web asks **Discard unapplied changes?**.
Closing the Code window through its top-bar toggle asks the same question when unapplied code is present.
Cancelling keeps the window and draft open; choosing Discard hides the window and clears that draft.
Choosing Discard closes the editing session and reopening shows the last applied source.

Switching between instance and component-source scopes with a draft uses the same discard-or-cancel safeguard.

### Visual edits with a draft

Before previewing or changing a value whose owning source overlaps the open Code draft, ask **Discard unapplied changes?**.
This includes supported visual edits to shared component source, even when requested through another instance.
**Discard** clears the draft, loads the latest applied source, and permits the requested visual edit.
**Cancel** preserves the draft, selection, and Code scope, and cancels the requested visual edit.
To retain the code changes, cancel, finish and Apply the draft successfully, then make the visual adjustment.
Edits with a separate source owner do not require this safeguard.
ORC-web does not silently apply or merge the draft into a visual edit.
Draft protection happens before any live visual preview starts.

### Undo and Redo with a draft

Ctrl+Z while typing in Code follows its text history, as defined in [Command engine and history](../architecture/command-engine-and-history.md#undo-and-redo).
Before document Undo or Redo changes or removes source owned by the open Code draft, ask **Discard unapplied changes?**.
**Discard** clears the draft, performs the requested document Undo or Redo, and refreshes Code from the resulting applied state.
**Cancel** retains the draft, selection, Code scope, design, and history position without performing that Undo or Redo.
Undo or Redo that affects unrelated source proceeds normally and leaves the draft intact.
The history action does not silently apply or merge unfinished Code.

## Copy and export boundaries

[Canvas Copy/Paste](workspace-and-canvas.md#copy-and-paste-inside-the-same-project) copies supported design objects within the project; the actions below copy code text.

| Action | Clipboard contents |
| --- | --- |
| **Copy selection** | Generated code for the latest applied selection, excluding any draft. |
| **Copy component source** | The actual component source currently shown, including unapplied changes when present. |
| **Ctrl+C** inside Code | The highlighted editor text, using normal text-copy behavior. |

Copy never applies code or creates a document Undo entry.
Copy selection remains an applied-state operation even when a component-source draft is open.
Copy component source is an intentional human copy of visible text; it does not expose that draft through MCP reads or generated exports.
Selection output may include necessary import statements, but it does not package the full dependency closure, required styles, themes, assets, or alias configuration.
The actual shared source is distinct from a generated selection wrapper; the wrapper's function name is not a component identity.
Complete project output belongs to [Export](../import-export/export.md), which reads committed design state.
The existing **Copy as Tailwind** option remains available for the selected React scope under the [Tailwind output contract](../import-export/tailwind-components.md).

## Runtime component errors

A component can apply successfully and fail later during Preview interaction or a later render.
For example, opening a menu can reach code that was not exercised during Apply.

ORC-web keeps the rest of the workspace, Layers, Properties, and Code window usable.
The affected component shows an error placeholder in its own bounds with the component name and a clear error summary.
It remains selectable through that placeholder and through Layers.

The placeholder offers **Retry** and **Open code**.
Retry attempts to render the current committed component again and does not change source or repair the error.
Open code opens the current applied source for that component.
The person can fix the source directly or ask an agent to fix it.

A runtime error does not silently undo the committed source or later design edits.
Undo remains available when the person chooses to reverse a relevant completed command.

## Scope for V1

V1 supports selected-object or frame source editing, shared imported-component source editing, and supported source-backed component layers.
It does not promise that every React pattern maps to individual visual Layers.
Component manifests and recognized component definitions remain the reliable source for visual component properties.

## Research basis

The user supplied **Lunagraph Code Editing and Copy/Export Research** and **Lunagraph Code Window — Live Interaction Reference**, observed on 2026-09-16.
These are human-UI observations, not ORC-web specifications or local source-file evidence.
They demonstrated ordinary nested JSX editing, selected-instance changes, inspector-to-code updates, invalid-code recovery, and applied-state persistence.
The follow-up report also found that changing selection or an inspector property silently committed pending JSX; Apply was not Lunagraph's only commit path.
ORC-web retains explicit Apply and the discard-or-cancel safeguard instead.

The reports distinguish generated selection snippets from actual component-file source and show that copied snippets omit required project dependencies.
Shared component-definition mutation, stable identity after structural edits, and external repository synchronization were not proven.
Opening or copying a shared file is not evidence that its edits propagate safely.
The observed Radix-based Button does not change ORC-web's Base UI-only V1 import scope.

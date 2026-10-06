# ORC-web workspace bundle

## Status

Accepted V1 portable project format.

## Goal

An ORC-web project must be portable as one folder that people can copy, back up, version, or archive.
It must keep the canonical design, managed assets, imported component source, and package data needed for rendering together.

## Proposed layout

```text
My design.orc/
├── document.json
├── assets/
├── components/
└── .orc.lock
```

`document.json` stores the schema-versioned canonical document.
`assets/` stores copied images, portable project fonts, and other managed files.
`components/` stores imported component source and exact dependency records.
The bundle also carries the imported-component dependency manifest and lockfile; their exact paths remain an implementation decision.
`.orc.lock` represents the current writable local session and is not portable design content.
The writable-session lock and package dependency lockfile have separate purposes.

## `.orc` format

ORC-web projects are portable folders with the `.orc` suffix.
For example, a project named Dashboard saves as `Dashboard.orc`.
Each bundle identifies itself as an ORC-web project with its own format version.

The suffix gives ORC products one recognizable project name.
It does not guarantee that Electron ORC and ORC-web projects can open in each other.
Desktop conversion is a separate future feature.

## Starting and opening projects

The local server opens one active project at a time.
The welcome screen offers **New project**, **Open project**, and recent projects.

New project immediately opens an empty infinite workspace named **Untitled**.
It does not ask for a project name, folder, frame, device preset, or template before a person or agent can begin work.
Untitled shows **Not saved** until its first successful save.

First Save asks for a project name and folder, then creates the matching `.orc` folder.
After that, applied design changes autosave to that folder.
Open project selects an existing `.orc` folder or a recent project.

Closing an Untitled project that contains applied design changes offers **Save**, **Discard**, or **Cancel**.
Save opens the first-save flow.
Discard closes the Untitled project without creating a project folder.
If unapplied Code window text also exists, ORC-web resolves **Discard unapplied changes?** before the project-close choice.

## Autosave

Completed commands first update the server's active project, revision, and Undo history.
For a project with a save location, applied design commands then autosave `document.json` and related managed files.
Untitled remains Not saved until its first successful save.
Edit success and disk-save success are separate states.
The editor reports Saving, Saved, or Save failed.
Saved means that the applied design is written to the project folder on disk.
The save result identifies the revision written; an older completed write cannot mark a newer unsaved revision as Saved.
Unapplied Code window text stays only in the current editing session and never changes the document revision.
Closing or reloading with unapplied code asks **Discard unapplied changes?** before the editor leaves the session.
Reopening a project shows the last applied source included in its last successful disk save.

If a save cannot finish, the editor shows **Save failed**.
The current workspace stays open and unsaved applied changes remain available in the current session.
Those applied changes and their Undo history remain in the server's active project even when the disk write fails.
The person can choose **Retry** or **Save as** to try the same project folder again or choose another folder.
Saved appears only after the write completes.
Closing while unsaved changes remain offers another save attempt, **Discard**, or **Cancel**.

If the browser loses its connection to the local server, it shows **Disconnected** and keeps the open workspace visible.
After reconnecting to the same running server session, ORC-web reads the server's current applied project and save status before accepting further applied edits.
This includes applied changes that have not reached disk; reconnection does not replace them with an older saved file.
The browser must not silently overwrite a newer applied project state.
After a local server or PC restart, opening a project loads its last successfully saved design.

The server writes a new complete file before replacing a prior valid file.
An interrupted save must preserve the last valid document rather than leave a half-written design file.
Save source, bindings, assets, and dependency records consistently with the document revision that references them.
The last valid saved revision must retain its required managed files if a later save is interrupted.
The exact multi-file replacement and recovery mechanism remains an implementation decision to verify on Fedora and Windows.
The [normal terminal shutdown](system-architecture.md#normal-terminal-shutdown) contract finishes pending saves of applied state before the local server exits.
Save an Untitled project through its first-save flow before stopping; shutdown does not invent a project name or location or save an unapplied Code draft.

## Managed dependencies

An imported component record stores exact source and dependency information inside the bundle.
ORC-web's own dependencies belong to the application installation.
The project carries imported component source, required styles and theme inputs, managed assets, and an exact dependency manifest and lockfile.
These records identify the required direct and transitive package versions rather than resolving a current latest tag on reopen.
Installed packages and compiled output are rebuildable local data; copying them is not required for project portability.
The local server prepares the recorded dependencies for the current computer before rendering affected components.
First opening on a fresh computer may require internet access to download those packages.
An unavailable dependency produces an error without silently substituting a different version or changing saved source.
The exact installation and build-cache locations remain implementation decisions.
The live project must not depend only on a mutable registry tag, a global package cache, or an arbitrary absolute path on the original machine.
External URLs remain explicit external dependencies.
The [Font management](../interface/font-management.md) document defines when a font becomes a portable asset and when it remains a local reference.

## Locking

One local server holds the writable project session.
If another local process has the project open for writing, ORC-web reports that state and avoids concurrent writes.
The exact locking mechanism must work on Fedora and Windows.

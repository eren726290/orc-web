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
`components/` stores imported component source and its recorded dependency closure.
`.orc.lock` represents the current writable local session and is not portable design content.

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

Applied design commands autosave `document.json` and related managed files.
The editor reports Saving, Saved, or Save failed.
Saved means that the applied design is written to the project folder on disk.
Unapplied Code window text stays only in the current editing session and never changes the document revision.
Closing or reloading with unapplied code asks **Discard unapplied changes?** before the editor leaves the session.
Reopening a project shows its last applied source.

If a save cannot finish, the editor shows **Save failed**.
The current workspace stays open and unsaved applied changes remain available in the current session.
The person can choose **Retry** or **Save as** to try the same project folder again or choose another folder.
Saved appears only after the write completes.
Closing while unsaved changes remain offers another save attempt, **Discard**, or **Cancel**.

If the browser loses its connection to the local server, it shows **Disconnected** and keeps the open workspace visible.
After reconnecting, ORC-web reads the server's saved project state before accepting further applied edits.
The browser must not silently overwrite a newer saved project state.
After a local server or PC restart, opening a project loads its last successfully saved design.

The server writes a new complete file before replacing a prior valid file.
An interrupted save must preserve the last valid document rather than leave a half-written design file.

## Managed dependencies

An imported component record stores exact source and dependency information inside the bundle.
The live project must not depend only on a mutable registry tag, a global package cache, or an arbitrary absolute path on the original machine.
External URLs remain explicit external dependencies.
The [Font management](../interface/font-management.md) document defines when a font becomes a portable asset and when it remains a local reference.

## Locking

One local server holds the writable project session.
If another local process has the project open for writing, ORC-web reports that state and avoids concurrent writes.
The exact locking mechanism must work on Fedora and Windows.

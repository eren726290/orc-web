# Component import

## Status

Accepted human import flow with open implementation details.

## Purpose

People add web components to a live ORC-web design from local source, npm packages, npx-based workflows, or shadcn registry links.
After import, a component has a root workspace object plus any accepted source-backed editable layers and declared properties.

## Human flow

1. The person chooses Add, then Import component.
2. They provide a package name, shadcn registry link, npx-based source, or local file or folder.
3. ORC-web inspects the source before changing the document.
4. If the source offers multiple components, the person chooses one.
5. ORC-web shows a preview, editable properties, dependencies, and blocking diagnostics.
6. The person chooses Add to workspace.

Dependency details belong under a collapsed Details section until someone needs them.
Errors must say what blocked the import and what the person can change.

## Inspection before import

Inspection is read-only.
It resolves the candidate component, source files, package versions, declared dependencies, exported components, available manifest, styles, assets, and unsupported requirements.
Inspection does not add a workspace object, write a project file, or change Undo history.

Import uses the inspected result only when the source remains the same.
If the package version, registry content, or local files changed, ORC-web asks for a new inspection rather than importing something different from the preview.

## Component contract

Every imported live component needs a component record and an accepted editable-component contract.
The contract declares source-backed layers and the values that Properties can change, including their types, defaults, choices, asset rules, token compatibility, optional slots, and collection items.
Without a suitable declared contract, the importer may report a static import candidate or reject the candidate as unsupported for editable component import.

The importer may recognize V1 Base UI imports and Base UI-flavored shadcn component shapes as an accepted contract.
V1 does not recognize Radix import paths as editable component contracts.
An imported component's arbitrary runtime DOM is never automatically editable as a Layers tree.
The accepted contract is the reliable visual editing boundary.
See [Editable React components](../interface/react-components.md), [React source bindings](../architecture/react-source-bindings.md), and [Tailwind components](tailwind-components.md).

## Source and dependency storage

The project bundle stores the imported source and exact dependency information needed to reopen the component.
An imported design must not silently change because a package registry later publishes a new version.
Local source paths and registry URLs remain origin information, not the only copy needed to render a saved project.

## Direct runtime policy

Imported components render directly in the ORC-web editor page.
V1 does not sandbox React components in an iframe or worker.
The importer therefore checks whether a candidate needs a runtime feature ORC-web does not support and reports that requirement before import.

The full support policy for lifecycle scripts, native addons, environment variables, network requirements, and other package capabilities remains open.
The initial implementation should support a small clear subset before claiming broad npm compatibility.

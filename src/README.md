# Browser editor

React renders the editor and applied design from the Bun backend.
Selection, gestures, viewport, panel state, and unapplied drafts belong to this browser session.
Completed changes use the shared server command path.
Editor styles use semantic CSS tokens; imported design styles remain separate.

| Folder                                            | Owns                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| [app/](app/README.md)                             | App shell, header, navigation, modal hook, and global editor styles. |
| [projects/](projects/README.md)                   | Dashboard and project folder dialogs.                                |
| [session/](session/README.md)                     | HTTP requests, session client, and its React subscription.           |
| [editor/](editor/README.md)                       | Workspace, toolbar, resizing, and browser view state.                |
| [editor/canvas/](editor/canvas/README.md)         | Canvas interaction and keyboard movement.                            |
| [editor/rendering/](editor/rendering/README.md)   | Native design renderer and rich-text run helpers.                    |
| [editor/layers/](editor/layers/README.md)         | Layers and inline renaming.                                          |
| [editor/properties/](editor/properties/README.md) | Properties fields and temporary previews.                            |
| [editor/layout/](editor/layout/README.md)         | Native ownership, coordinate checks, and shared placement/layout conversions. |
| [editor/code/](editor/code/README.md)             | Code window, HTML importer, and source draft guards.                 |
| [editor/preview/](editor/preview/README.md)       | Selected-frame Preview.                                              |

`main.tsx` is the browser entry point.
`vite-env.d.ts` contains browser build declarations.

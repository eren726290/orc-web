# Local application backend

Bun owns project sessions, command validation, history, saving, imports, and output.
The backend listens on loopback only.
Development forwards application requests through Vite; the built application serves the compiled editor directly.

`start.ts` owns backend startup, serialized requests, and shutdown.

| Folder                            | Owns                                                    |
| --------------------------------- | ------------------------------------------------------- |
| [http/](http/README.md)           | API routes, origin validation, and static file serving. |
| [projects/](projects/README.md)   | Sessions, history, saving, bundles, and locks.          |
| [commands/](commands/README.md)   | Ordinary mutations and atomic batches.                  |
| [source/](source/README.md)       | HTML/SVG source preparation and application.            |
| [rendering/](rendering/README.md) | Background browser lifecycle and render pages.          |
| [types/](types/README.md)         | Backend-only compatibility declarations.                |

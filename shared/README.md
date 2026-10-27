# Shared application contracts

Browser and Bun services share the canonical document and validated message types here.
The server owns applied state; browser view state stays outside the portable document.

| Folder                          | Owns                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| [document/](document/README.md) | Canonical document types, tree helpers, parsing, and validation.   |
| [commands/](commands/README.md) | Validated command envelopes and mutation types.                    |
| [session/](session/README.md)   | Session and folder-listing response contracts.                     |
| [source/](source/README.md)     | HTML serialization and SVG extraction.                             |
| [pen/](pen/README.md)           | Directed pen geometry, SVG output, guards, and the solver adapter. |

`validation.ts` contains the small boundary-validation functions shared by these domains.

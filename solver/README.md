# Pen solver build

`pen/` contains ORC's small Rust adapter for the pinned SolidCraft sketch solver.
It does not add SolidCraft's application, UI, renderer, or project format.
The compiled asset is an editing dependency; ordinary application builds do not require Rust.
`scripts/solver/` owns reproducible build and isolated verification commands.

`upstream/` is an ignored build input extracted from the exact verified upstream archive.
Do not edit upstream sources or use the retained diagnostic checkout as a production build directory.

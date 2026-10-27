# WASM adapter

This crate converts a small numeric request into a fresh SolidCraft sketch.
The solver origin stays separate from user points.
A held solve receives every position from before the requested move.
Requests do not retain mutable sketches across calls or paths.
The TypeScript adapter validates the returned geometry and keeps the caller's previous record on rejection.

Use Rust 1.95.0 with the official `wasm32-unknown-unknown` target.
The dependency source is pinned to SolidCraft `cb857f1fa772359d955d232c5ea0a3e2a3eb3aa4`.
The committed lockfile owns exact registry versions.

## Rebuild

Install Rust 1.95.0 and its official `wasm32-unknown-unknown` target, plus the host linker needed by Cargo's build scripts.
Run `bun run build:pen-solver` from the repository root.
The script downloads and verifies the exact upstream archive, refuses changed build inputs, uses `--locked`, and records the actual compiler, flags, source hashes, binary hash, byte size, and imports in `build.json`.
Do not copy the historical localhost Cargo source replacement into project configuration.
The recorded rebuild used an independent offline verified cache and the normal official target.
The bundled binary lets application builds and numerical/browser checks run without Rust.

## Licenses

`licenses.json` inventories every resolved registry dependency, including compile-only dependencies, with the exact lockfile checksums and selected permissive licenses.
`THIRD-PARTY-NOTICES.txt` contains SolidCraft's MIT notice, the selected MIT dependency notices, the mandatory Unicode notice, and the font build input's OFL notice.
`RUST-LIBRARY-COPYRIGHT.html` retains the compiler distribution's full standard-library notice inventory, which also covers platform-specific portions not linked into this WASM target.
This conservative notice inventory does not assert that every upstream library or font is linked into the binary.
The complete font bytes are absent from the current binary; its notice is retained because the pinned crate embeds it as a build input.
Re-audit this inventory whenever the compiler, upstream revision, Cargo graph, or adapter imports change.

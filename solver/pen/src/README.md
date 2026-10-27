# Solver boundary

The Rust boundary owns request decoding, safe upstream construction, complete pre-move references, and result encoding.
Each loaded WASM instance owns its own exchange buffers.
No pointer supplied by JavaScript is dereferenced by Rust.

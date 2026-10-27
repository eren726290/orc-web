# Measured Worker correction

The owner's full implementation authority covers the smallest implementation change needed to satisfy the existing interaction contract.
The handoff required measuring and reporting the synchronous blocker before choosing a Worker.
That checkpoint is complete; the proposed remedy and its latency tradeoff were presented before this implementation.
Earlier notes treating a separate approval question as mandatory were an overly restrictive interpretation of that authority.
No new product feature, smaller path cap or alternate solver is adopted.

## Scope and safety facts

Use one disposable dedicated Worker per anchor gesture with the identical verified compiled WASM module.
Retain the same guarded solver and pure continuation geometry.
Keep only one numerical request in flight; pointer events update the latest target without queuing intermediate targets.
Validate returned geometry and mount the complete native candidate on the browser thread.
A result can publish a preview only while its exact gesture and motion object remain current.
Return-to-start, cancellation, changed ownership and release invalidate outstanding results and terminate that gesture's Worker.
Release commits only the last complete native-validated preview, with explicit feedback for an unreached target.
The Worker does not make the dense numerical solve faster.
Measure main-thread work, Worker solving, complete solve-to-native-preview latency and pointer-to-second-frame latency separately.

The affected files are shared continuation helpers, browser drag/types/loading lifecycle, the dedicated Worker/client and their feature README, the input scheduler, failure/performance checks and final evidence records.
Existing geometry, saved format, server validation, source, native layout, transforms and history remain authoritative.
Verify fast and large gestures, return-to-start while a solve is pending, cancellation and stale replies, two paths/projects, Worker startup/failure recovery, actual traps, one-command history and pending Undo in both app modes.
Use real browser timing to decide whether first-gesture startup needs preloading; do not introduce a worker pool speculatively.

## References checked

Vite's official worker constructor guidance uses a static `new Worker(new URL(..., import.meta.url), { type: "module" })` expression.
Source: https://github.com/vitejs/vite/blob/main/docs/guide/features.md.
The platform supports structured cloning a compiled stateless `WebAssembly.Module` into a Worker.
Source: https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/Module.
The platform Worker API terminates the gesture's Worker on cancellation or release.
The browser's later Worker-close event is measured separately from input cancellation; its timing is not proof of an immediate interruption inside native numerical code.
Source: https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate.

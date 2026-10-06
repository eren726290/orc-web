# Shared-update lock handling for later V1.x

## Status

Scheduled for a later V1.x release by user decision.
Not scheduled for V1.1.

## Scope

Revisit how object and ancestor locks interact with indirect changes from shared token values and shared component definitions.
Decide the detailed policy before adding special handling for locked uses of shared definitions.
The proposed shared-update behavior was not accepted as a V1 requirement.

V1 retains the existing [direct-edit Lock workflow](../doc_v1/interface/layers-panel.md#locking) and the established token and component ownership rules.
This deferral does not remove basic locking from Layers.

Any future policy must use the existing command engine, validation, and Undo path.
Verify it with shared values used by locked and unlocked objects, including ancestor locks and supported React instances.

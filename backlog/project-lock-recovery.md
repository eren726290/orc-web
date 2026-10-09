# Project lock recovery

Status: implementation follow-up; release unassigned.

## Reproduced failure

Two processes can read the same stale `.orc.lock` before either removes it.
The delayed process can then delete the other process's newly acquired live lock.
Both become writable, violating the accepted [single-writer contract](../doc_v1/architecture/orc-workspace-bundle.md#locking).
The repeatable control and two live owner records are in ignored `artifacts/editor/bundle-lock-probe-result.json`.

## Current correction

Remove automatic stale-lock deletion and refuse an existing lock.
Failed creation of an owned lock must remove its incomplete metadata and report the actual storage error.
Normal project close and graceful server shutdown release their owned locks.
An orphaned lock after a forced process or computer shutdown requires manual recovery after confirming no other writer is active.

## Follow-up

Evaluate safe recovery or an operating-system lock mechanism on both Fedora and Windows before adding automatic reclamation.
Verify simultaneous stale-lock recovery, process crashes, copied bundle locks, permission failures, and release ownership.
Do not use a read-then-delete identity check as proof of atomic ownership.

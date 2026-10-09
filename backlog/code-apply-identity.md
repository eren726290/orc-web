# Code Apply identity reconciliation

Status: required V1 implementation work.
The [Code window contract](../doc_v1/interface/code-window.md#selection-after-apply) requires verified identity continuity and an explanation before an ambiguous replacement applies.

## Reproduced and corrected

Applying the generated frame source with only a trailing HTML comment previously recreated all descendant IDs and expanded equivalent CSS shorthands.
The layout workflow reproduced this through the real Code window before the correction.
Equivalent ordinary source now compares through the real importer and leaves canonical objects, authored CSS, revision, and both history stacks intact.
The comparison retains CSS declaration order because physical and logical edges can conflict.
The browser regression proves that reversing those declarations still changes the rendered position and commits a real command.

## Remaining V1 work

- Verify that parsing the existing source for equivalence cannot block a valid repair when that existing source is unsupported by the importer.
  This is an unverified review concern; reproduce it through Code Apply before choosing a correction.
- Reconcile verified identities through meaningful text/style edits and supported structural changes.
  The existing importer still gives changed descendants fresh IDs while retaining the selected compatible root.
- Preserve nested frame kinds, names, own locks, and supported settings when their existing structure can be verified.
- Explain ambiguous replacements before applying, and clear only uncertain selections according to the accepted contract.
- Verify identity, source bindings, Layers, Properties, exact Undo/Redo, and save/reopen together.
  Keep meaningful CSS-order changes as a negative control for source equivalence.

The ordinary-source equivalence correction does not establish arbitrary Code Apply identity reconciliation or React source binding support.

# Tailwind source workflow beyond V1

## Status

Deferred work beyond the accepted V1 [Tailwind component workflow](../doc_v1/import-export/tailwind-components.md).

## V1 already covers

V1 accepts supported React components with complete static Tailwind classes.
It retains required style and theme inputs, compiles accepted source for browser rendering, supports limited reliable visual edits, and preserves supported Tailwind source in React export.

## Deferred work

- Visually editing dynamically constructed classes and arbitrary template fragments.
- Supporting custom Tailwind plugins and arbitrary project-wide configuration.
- Resolving arbitrary package CSS and application-level style dependencies.
- Importing a whole unknown Tailwind project and promising idiomatic visual edits throughout it.
- Proving how visual edits should rewrite complex variant combinations that do not have one clear owning source value.

These cases remain source-editable only when they render under the supported runtime.
They are not promised as visual Tailwind editing features.

## Research

Tailwind's compiler scans source files for complete class names and generates CSS for the detected utilities.
The official guide says dynamically constructed class names are not detected unless complete class names exist in the scanned source.
Tailwind theme variables also determine which theme-based utility classes exist.

## References

- [Tailwind class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)

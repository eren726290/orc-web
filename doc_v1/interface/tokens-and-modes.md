# Tokens and modes

## Status

Accepted V1 product behavior.

## Tokens

Tokens are named reusable design values.
V1 supports color, spacing, typography, and corner-radius tokens.
Properties lets a person enter a direct value or choose a compatible token.
Changing one token updates every linked value in the document.

A direct value changes only the selected object or frame.
Choosing another compatible token changes only that selected reference.
Editing a token in the Tokens panel changes every value linked to that token, so the panel shows its reference count before the edit.

The Tokens panel lists names, values, categories, references, and available mode values.
People can create a token from a selected direct value.
An imported component can accept a token only through a declared compatible property.
Text uses compatible color and typography tokens through the controls described in [Text editing](text-editing.md).

## Light and Dark

Each token has one default value and may have a Dark override.
The default value is the Light value unless a later token mode adds a separate Light override.
When no Dark override exists, the default value applies in both modes.

| Token | Default value | Dark override |
| --- | --- | --- |
| Background | White | Dark gray |
| Text | Near-black | Near-white |
| Brand | Purple | Optional |
| Card spacing | 16px | Usually omitted |

The Tokens panel has a Light or Dark editing view.
Changing the selected view changes the token value being edited, not the identity of the token.

## Mode inheritance

The workspace has a current design mode.
Loose workspace objects inherit that mode.
A frame inherits its parent mode unless the frame explicitly chooses Light or Dark.
Nested frames may therefore show different modes side by side.

The ORC-web application theme is independent of the design mode.
People can use a dark editor interface while designing a light frame.

## Export

Visual exports use the selected design mode.
React and HTML or CSS export include the token definitions needed to reproduce applicable mode values.

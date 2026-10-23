# Ordinary source serialization

HTML serialization and SVG extraction shared by browser and backend belong here.

`intrinsic-column.ts` owns the versioned native Column projection shared by HTML and React rendering.
Canonical owned Flex Columns use `--orc-intrinsic-column: 1` without a canonical wrapper node.
The projector retains authored declaration order and priorities, replaces display with Grid, and adds the two single-cell tracks.
It rejects competing own Grid declarations, inherited or non-Column flow, wrapping, and unknown versions.
Own Flex shorthand and longhand declaration order and priority determine eligibility.
The generated inner Flex box inherits its parent's layout values and has no editable object identity.
Copied HTML includes that real native structure and requires no layout script.

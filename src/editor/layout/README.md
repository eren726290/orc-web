# Layout ownership

Native ordinary-layout ownership recognition and coordinate checks shared by Properties and canvas placement belong here.
Free and flow placement conversions and atomic frame layout switching also belong here.
frame-layout-validation.ts verifies the native candidate before publishing a layout command.
These helpers derive ownership from the rendered CSS and canonical parent relationship.
Ownership readouts do not save a second layout model or change authored sizing modes.
Layout switches explicitly capture participating children's Fixed Free sizes and Left/Top placement when leaving Flex.
The [projection record](../../../backlog/native-layout-projection.md#ordinary-layout-switching) defines the CSS-owned distinction between normal Free placement and explicit Absolute Position.

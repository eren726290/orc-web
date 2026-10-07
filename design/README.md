# Design references

`desgin_system/` contains the supplied Paper style reference and its accompanying theme, variables, tokens, and preview.
Use these materials as visual inspiration for ORC-web.
ORC-web's accepted features and workflows are defined in [doc_v1](../doc_v1/README.md).

## Using the references

Use mockups only as inspiration for the workspace's rough structure.
Do not reproduce their exact pixels, dimensions, typography, colors, or sample content.
Use `doc_v1` for layout and behavior, `desgin_system/` for visual foundations, and `desgin_blog/` for design reasoning.
Adapt these references into a coherent ORC-web interface.

## Paper style reference

| File | Contents |
| --- | --- |
| [DESIGN.md](desgin_system/DESIGN.md) | Detailed Paper style reference covering colors, typography, spacing, surfaces, components, guidelines, and CSS examples. |
| [tailwind-theme.css](desgin_system/tailwind-theme.css) | Tailwind v4 `@theme` declarations for the supplied colors, fonts, type scale, spacing, radii, and shadows. |
| [css-variables.css](desgin_system/css-variables.css) | CSS `:root` custom properties, including layout values, font weights, named radii, and surfaces. |
| [design-tokens.json](desgin_system/design-tokens.json) | Structured token values, types, descriptions, and extraction metadata. |
| [preview.md](desgin_system/preview.md) | Paper palette, typography, spacing, and guideline overview with an externally hosted reference image. |

The files describe Paper's visual language and are reference material rather than a finalized ORC-web design system.
Their CSS and JSON are not connected to an application build in this checkout.

- [`desgin_blog/`](desgin_blog/README.md) contains reference articles with locally stored images and their image-path convention.
- [`mockup/`](mockup/README.md) identifies the feedback sheet and workspace skeleton and links their accepted layout rules.

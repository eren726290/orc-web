# Design blog

Reference articles are stored as Markdown with local images so agents can read them without browsing.
Each article has its own folder, Markdown file, and `images/` directory.
Use these articles as design inspiration.
ORC-web's accepted requirements remain in [doc_v1](../../doc_v1/README.md).

## Articles

| Article | Images | Covers |
| --- | --- | --- |
| [The making of Cursor's icons](cursor/minoradventures-the-making-of-cursors-icons.md) | 30 PNG + 13 SVG | Icon sizes, outline and filled styles, stroke widths, optical shapes, and consistency rules. |
| [A calmer interface for a product in motion](linear/linear-now-behind-the-latest-design-refresh.md) | 10 WebP, five subjects in two resolutions | Navigation, header bars, borders, and theme tooling. |

## Layout

```text
desgin_blog/
├── README.md
├── linear/
│   ├── linear-now-behind-the-latest-design-refresh.md
│   └── images/                 NN-slug-1x.webp / NN-slug-2x.webp
└── cursor/
    ├── minoradventures-the-making-of-cursors-icons.md
    └── images/                 NN-slug.png
        └── icons/              NN-name.svg
```

## Image convention

- Resolve paths relative to the article's Markdown file, never the repository root or shell working directory.
  `images/01-hero.png` in the Cursor article resolves to `cursor/images/01-hero.png`.
- Keep each article's images in its own `images/` directory.
- Use `NN-slug.ext` names in reading order.
  Keep existing numbers stable when adding images.
- Store individual vector specimens in `images/icons/` as `NN-name.svg`.
- Keep the `Source:` line and `Image index` table in each article.
  Update the index when images change.
- Write accurate alt text for text-only readers.
  Inspect the actual image with an available vision tool before making claims about its pixels.
  Filenames and alt text do not prove visual details.

## Adding an article

1. Capture the article as Markdown and retain its source URL, author attribution, captions, and article content.
2. Remove site navigation and footer content without removing article material.
3. Download referenced images into the article's own `images/` folder.
   Choose a usable format and resolution before saving; removing CDN query parameters can change the returned format or quality.
4. Rewrite image references to local paths and give images descriptive filenames and accurate alt text.
5. Add a `Source:` line and an `Image index` table, then register the article above.
6. Remove temporary backups and check local references before committing.

## Checks before committing

Run from this directory to check embedded image paths against each article's folder:

```sh
python3 - <<'PY'
from pathlib import Path
import re

for article in sorted(Path('.').glob('*/*.md')):
    for target in re.findall(r'!\[[^\]]*\]\(([^)]+)\)', article.read_text()):
        if target.startswith(('http://', 'https://')):
            raise SystemExit(f'Remote image: {article}: {target}')
        if not (article.parent / target).is_file():
            raise SystemExit(f'Missing image: {article}: {target}')
print('All embedded images resolve locally.')
PY
```

Also check image-index entries, README links, and absence of scratch backups.
These checks verify local references, not completeness against live articles.

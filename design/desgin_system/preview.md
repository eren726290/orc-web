# Paper

![](https://images.refero.design/styles/refero.design/image/9f807d73-0143-45d0-b87d-8a6b9df2c598.png)

warm paper notebook under studio lights

Paper uses a warm-paper-studio language: a cream ivory canvas instead of white, calm monochrome typography in a custom display face, and a single cool blue accent that does almost no UI work. The two-tone headline (dark first line, mid-gray continuation) is the signature move — it treats the hero copy as a composition of weights rather than a single block. Surfaces sit flat on the page with one barely-there card shadow, borders are hairline, and the product feels like a printed notebook page under cool studio light. Most of the chromatic energy lives inside the product screenshot; the marketing surface around it stays restrained, near-achromatic, and grid-quiet.

[https://paper.design](https://paper.design/)

## Color Palette

Brand

Copy

Studio Blue

#5d8cd7Brand icon mark, decorative vector accent — cool blue against warm cream is the only chromatic tension in the marketing surface

Copy

Wash Blue

#81adecLighter blue used for soft body accents and nav underlines

Neutrals

Copy

Ink

#181818Primary text, nav active state, filled button background — neutral dark, not chromatic

Copy

Carbon

#222222Near-black used in nav chrome and high-contrast text

Copy

Lava

#434341Near-black emphasis text, slightly softer than full ink for long reads

Copy

Iron

#666666Helper text, metadata, tertiary copy

Copy

Slate

#83837eSubdued heading and link text, warm-gray captions

Copy

Graphite

#909090Secondary body text, the lighter half of the two-tone headline, heading accents

Copy

Pewter

#a8a8a8Icon strokes, low-priority borders, decorative vector fills

Copy

Smoke

#c1c1c0Secondary borders, diagram strokes, muted dividers

Copy

Stone

#d7d7d6Hairline borders, card outlines, surface separators

Copy

Ash Gray

#e3e3e3Card backgrounds in denser sections, soft grouping surface

Copy

Bone Canvas

#efefe4Page background — warm cream instead of white, the signature surface that makes the whole site feel like a notebook page

Copy

Mist

#f3f3f4Subtle alternate band background, soft dividers in long pages

Copy

Paper White

#fcfcf9Primary page canvas and white card surfaces. Do not promote it to the primary CTA color

Copy

Bright Card

#ffffffPure white card surface for highest elevation, code panels, product chrome

## Typography

Type Scale

Minor Third (1.2) from 14px base

display64px · 360 · 1

The quick brown fox jumps

18px18px · 400 · 1.56

The quick brown fox jumps

18px18px · 550 · 1.56

The quick brown fox jumps

18px18px · 400 · 1.56

The quick brown fox jumps

18px18px · 480 · 1.56

The quick brown fox jumps

16px16px · 600 · 1.75

The quick brown fox jumps

14px14px · 500 · 1.29

The quick brown fox jumps

14px14px · 400 · 1.29

The quick brown fox jumps

Show all 14 steps

Fonts

DisplayMatter

Weight360, 400, 480, 500, 550

Sizes14px, 18px, 48px, 64px

Line height1.00, 1.56, 2.00

Letter spacing-1.28px at 64px, -0.96px at 48px, -0.28px at 14px

FallbackSöhne, Inter Tight, or a humanist geometric like Manrope

Display and headline face — custom, wide stance, unusual light-to-medium weights (360 is whisper-thin). Carries the hero, the two-tone headline split, and large pull quotes. Tight tracking on display (-0.0200em at 64px) gives the type a composed, editorial feel

BodyInter

Weight400, 500, 600

Sizes12–36px · 6 values

Line height1.2–2 · 6 values

Letter spacing-0.3–0.1px · 5 values

FallbackInter (native), or system-ui

UI and body face — captions, button labels, nav, metadata, product chrome. Tight negative tracking on small sizes (-0.0100em at 12–14px) keeps dense UI legible

CodePaper Mono

Weight400

Sizes11px, 12px

Line height1.33, 2.55

Letter spacing0.17px at 11px, 0.19px at 12px

FallbackJetBrains Mono, IBM Plex Mono

Code, file paths, version labels, tiny metadata. Loose positive tracking (+0.0150em to +0.0160em) at small sizes gives the mono a calm, terminal-like cadence

## Spacing & Shape

Spacing

| Purpose | Value | Preview |
| --- | --- | --- |
| Density | compact |  |
| Base unit | 4px |  |
| Max width | 1200px |  |
| Section gap | 96px |  |
| Card padding | 32px |  |
| Element gap | 8px |  |

Border Radius

| Element | Value | Preview |
| --- | --- | --- |
| buttons | 4px |  |
| cards | 8px |  |
| largeCards | 12px |  |
| heroPanels | 20px |  |
| imageFrames | 24px |  |

Elevation

Product card, elevated panel

Popover, floating tool palette

## Guidelines

Do

- Use #181818 as the only filled-button background — never introduce a chromatic CTA color
- Split headlines into two visual weights: first line in Ink (#181818), continuation in Slate (#83837e), both at the same Matter display size
- Set the page background to Bone Canvas (#efefe4); reserve #ffffff for elevated cards and product chrome only
- Use 4px radius for buttons and tags, 8px for cards, 12–24px for product frames — never mix these scales on the same surface
- Keep the body in Matter 18px weight 400 at #666666 with 1.75 line-height for editorial calm
- Use the three-layer card shadow only on product screenshots and floating tool panels — marketing cards stay flat with hairline borders
- Limit blue (#5d8cd7) to the brand mark, decorative vectors, and code accents — never as a button fill or large text color

Don't

- Don't add a chromatic accent for CTAs, links, or active states — the action language is neutral dark, period
- Don't use white (#ffffff) as the page background; the cream canvas is the signature and replacing it kills the look
- Don't bold inline keywords inside body copy — the tone is uniform, not emphatic
- Don't apply the card shadow to headings, logos, or icon rows — it belongs only to the product screenshot and floating panels
- Don't set the two-tone headline in two different sizes or two different fonts; the effect comes from identical Matter metrics with different fill colors
- Don't use saturated semantic colors (red/green/yellow) for status — if needed, use Pewter or Iron instead
- Don't add gradients — the system is flat, warm, and achromatic, with the product screenshot providing the only visual richness

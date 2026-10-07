Source: https://www.minoradventures.co/blog/the-making-of-cursors-icons

## Image index

30 process images (`images/`) + 13 inline icon SVGs (`images/icons/`), all stored locally — no browsing needed.

| File | Shows |
|------|-------|
| `images/01-hero.png` | Cursor's new icon system |
| `images/02-final-main.png` | Full icon set grid |
| `images/03-final-filled.png` | Filled icon variants |
| `images/04-final-ui.png` | Icons in Cursor's UI |
| `images/05-final-compose.png` | Composer interface with icons |
| `images/06-final-menu.png` | Context menu with icons |
| `images/07-final-rebus.png` | Icon rebus examples |
| `images/08-codicons-a.png` | Codicons overview |
| `images/09-codicons-b.png` | Codicons detail view |
| `images/10-codicons-c.png` | Codicons in context |
| `images/11-stroke-width.png` | 1px? Too thin. 1.5px? Too thick. 1.25px? Just right. |
| `images/12-optical-shapes.png` | Optical shapes: Square, Circle, Horizontal, and Vertical for both sizes |
| `images/13-stroke-caps.png` | All strokes use round caps |
| `images/14-technical-look-closed-shapes.png` | Open shapes versus closed shapes comparison |
| `images/15-technical-look-slashes.png` | Slashed icons without shadows for a clean, diagram-like appearance |
| `images/16-natural-proportions.png` | Proportions of objects are kept natural to avoid the toy look |
| `images/17-sharp-exploration.png` | Large curves stay round but the stroke caps and small details go sharp |
| `images/18-cuts.png` | Icons showing gaps between overlapping shapes with measurements |
| `images/19-perfection.png` | Going through 156 explorations of a hamburger icon to find the perfect one |
| `images/20-files.png` | Three core Figma files |
| `images/21-files-explorations.png` | Figma Explorations file where everything gets explored |
| `images/22-files-overviews.png` | Figma Overviews file for consistency tracking |
| `images/23-files-icons.png` | Figma Icons file with all the components |
| `images/24-companion.png` | The companion site where the team lives and works with the set |
| `images/25-companion-sidebar.png` | Icon detail view sidebar |
| `images/26-companion-tooltip.png` | Hovering an icon in the grid shows a tooltip with quick actions |
| `images/27-companion-search.png` | Search is super handy when people look for an icon to portray a new concept |
| `images/28-companion-concepts.png` | Concepts page: a table pinning each Cursor concept to its icon |
| `images/29-companion-file-types.png` | File Types page: maps file formats to their icons |
| `images/30-ship-it.png` | Ship it pipeline |

> Icons referenced as `images/icons/NN-<name>.svg` — 01–07 optical-breaks/before, 08–13 stroke-thinning/before.
> Text-only agent: the alt text above is your evidence. To read pixels, pass a path to a vision tool, e.g. `agy -p "describe <path>"` or ModLens.

Jul 30, 2026·16 min read

# The making of Cursor's icons

A year of drawing, testing, and shipping a complete icon system for the world's favourite coding agent.

![Cursor's new icon system](images/01-hero.png)

Earlier this year, Cursor quietly rolled out its new icon set. I designed it, and so I wanted to share the story of how it was made: partly so you can see how much care goes into a thing like this, and partly for newcomers to design who want to learn how it gets done.

The work took about a year and covers 600+ icons in two sizes and two styles, every single exploration and every final icon variant drawn by hand.

![Full icon set grid](images/02-final-main.png)

![Filled icon variants](images/03-final-filled.png)

![Icons in Cursor's UI](images/04-final-ui.png)

![Composer interface with icons](images/05-final-compose.png)

![Context menu with icons](images/06-final-menu.png)

![Icon rebus examples](images/07-final-rebus.png)

Cursor's new icon system

## Growing out of the old set

Last year, Cursor was growing out of the VS Code ecosystem that it was built on, and its icons came along for the ride. The inherited set was [**Codicons**](https://github.com/microsoft/vscode-codicons), the open-source icons VS Code uses, plus custom additions that had accumulated over time in slightly different styles. Codicons were drawn for a different product, in a different era, and the set had drifted since then. When I counted it I got 468 icons; the documentation said 498, and some codepoints led nowhere. None of this is unusual for an inherited set. Sets drift when nobody owns them.

![Codicons overview](images/08-codicons-a.png)

![Codicons detail view](images/09-codicons-b.png)

![Codicons in context](images/10-codicons-c.png)

Being built on the VS Code ecosystem meant inheriting its icon set, [Codicons](https://github.com/microsoft/vscode-codicons)

The bigger issue was **coverage of concepts**. Some of the concepts Cursor kept introducing don't exist in any icon library. Others exist, but never all in the same one: AI agents, parallel and sequential execution, single and parallel threads, different levels of thinking effort, cost and compute, Bugbot and many others. A generic set can stretch for a while, but at some point a product needs its own vocabulary.

So the brief, in practice, was to:

- redraw everything as one system,
- cover the concepts only Cursor has,
- and deliver the result as an icon font that could replace the old one without breaking a single reference.

That last requirement shaped more of the project than it sounds, and I'll come back to it later.

## Two sizes, two styles

### The sizes

The new icons come in two sizes, each on its own grid:

- **16px** is the main size, mostly used at 16px, but can be scaled all the way to 12px while preserving legibility. Stroke weight is 1.25px.
- **24px** is the slightly larger version, with a slightly thicker stroke (1.5px) width and a bit more detail whenever the extra space allows.

Two sizes, with more detail and a thicker stroke at 24px

The reason for two sizes is that a single icon can only stretch so far. The 16px icons are drawn on a 16px grid with a 1.25px stroke, and they hold up from about 12px to 20px. Beyond that, everything scales together: at 32px that 1.25px stroke becomes 2.5px, which is far heavier than anything you'd draw at that size. And the small icons have been simplified for their size, so the extra room stays empty instead of carrying the detail it could.

So from 22px up, the 24px version takes over, drawn on its own grid, with a 1.5px stroke and more detail wherever there's space for it. This is a similar idea to optical sizes in type, where a typeface has separate cuts for Text and Display rather than one drawing scaled up and down.

### Finding 1.25px

The 1.25px stroke took a while to find. At 1px the icons felt too thin next to text. It's hard to say exactly why – they just didn't hold their own. At 1.5px they felt too heavy. At 1.25px a 16px icon sits beside 16px Cursor Gothic, their custom typeface, and looks just right. You follow your eye on decisions like this. At some point the number is a record of a decision the eye already made.

![1px? Too thin. 1.5px? Too thick. 1.25px? Just right.](images/11-stroke-width.png)

1px? Too thin. 1.5px? Too thick. 1.25px? Just right.

A 1.25px stroke also means the icons don't snap to the pixel grid, which goes against the standard advice. Why? Well, these icons render at 12px, 14px, 16px and even 20px, so there is no single grid to snap to, and on modern displays a 1.25px stroke stays crisp anyway. Snapping would mean designing for every single absolute size they're displayed at. That's why I treated them as symbols, closer to small logos or characters in a typeface than to fixed-size bitmaps.

### The styles

Icons come in two styles:

- **Outline** icons are built from strokes.
- **Filled** icons are built from solid shapes with the interior details knocked out, cut directly from the fill.

Not every icon has a filled version, only the ones the product needs, which is normal for a set of this size.

Icons in Outline and Filled style

### The optical shapes

Underneath both sizes sits a system of optical shapes: **Square**, **Circle**, **Horizontal**, and **Vertical**. Each one is sized so that icons built on different shapes still read as the same size – for instance a circle has to be drawn slightly larger than a square to look equally big. Most icons fit one of the four, but not all. Diagonal shapes in particular sit awkwardly in all of them, and then I pick the closest one, usually the circle, and adjust by eye.

![Optical shapes: Square, Circle, Horizontal, and Vertical for both sizes](images/12-optical-shapes.png)

Optical shapes for both sizes

Selected icons grouped by their optical shape

## The construction

The icons in this set are closer to technical drawings than to organic shapes – diagrams with a friendly finish. The construction method is consistent across the set: start with lines that run horizontally, vertically, or at 45°, allow other angles where the concept demands them, then round the corners until the shape follows the idea. A cloud, for example, isn't built from circles. It starts as straight segments that get rounded joins. A fire icon is built the same way, from angled segments with rounded corners. Freeform curves, or curves taken from circles, are extremely rare in the set.

Icons are closer to technical drawings, diagrams with a friendly finish

This construction logic is what makes 600+ icons feel like the work of one hand. It also suits a coding tool: precise and engineered, with the rounded corners and round stroke caps keeping it from turning cold.

![All strokes use round caps](images/13-stroke-caps.png)

All strokes use round caps

### The technical look

The goal of the visual style is to be technical and stripped down, not decorative. So whenever there's a possibility for an icon to be open – could be to show elements are overlapping or just a stylistic choice – closing the shape and keeping things simple and technical is strongly preferred. It also helps keeping things a bit more legible at extremely small sizes.

![Open shapes versus closed shapes comparison](images/14-technical-look-closed-shapes.png)

Closed shapes (right) over open ones (left) to keep things simple and technical

Similarly, when a slash crosses an icon, there's no shadow pretending something sits behind it – just a simple cut through the shape.

![Slashed icons without shadows for a clean, diagram-like appearance](images/15-technical-look-slashes.png)

Slashes cut flat through icons (right), no fake shadows (left)

### Extending the lines

Inspired by the developer aesthetics of mono typefaces and how they extend characters and stems to fill horizontal space, Cursor's icons extend the lines as much as possible whenever possible to give it a distinct look. Not a general rule for every icon and every detail, more of a tendency.

Lines that could be short (gray) are extended (black), borrowing from monospace aesthetics

### Tall things stay tall

Icons aren't forced into a square. A pencil is tall and narrow, a banknote is wide, and they should look that way. Squashing every object into the same box is where the toy look comes from, shapes inflated to fill space they don't need. In a coding tool, objects should look like what they are, not like toys. In Cursor's icon set, if something is tall, it stays tall.

![Proportions of objects are kept natural to avoid the toy look](images/16-natural-proportions.png)

Proportions of objects are kept natural to avoid the toy look and keep things utilitarian

### Following the pointer

Cursor's pointer runs from bottom left to top right, and so does every icon that could go either way: diagonal arrows, flying objects, and any composition where one element sits above another – the smaller object goes to the top right. Slashes run the other way, top left to bottom right, because a slash cancels a direction and should cut against it.

No one reads this off the screen. But without rules like it, a set stops looking like it came from one place.

Icons that could run either way follow Cursor's pointer – slashes run the other way

### Just enough round

Corner rounding on shapes is calibrated to sit between too sharp and too soft. The shapes should feel precise but approachable.

Not too geometric, not too bubbly. Just enough.

### Keeping things consistent

Recurring elements like folders, files, flasks, flags, eyes, arrows, notches or badges are drawn consistently every time they appear. If a folder shows up in ten different icons, it's the same folder. This is being tracked and managed for over 155 elements, objects or visual properties.

Recurring elements are drawn consistently every time they appear

### Go sharp or go no

Early on I also tried to challenge the roundness itself. Once again inspired by type design, I explored a version where the large curves stay round but the stroke caps and small details go sharp. From a normal distance you couldn't tell the difference. Up close it was a quiet mix of sharp and soft. I liked it, but it didn't solve a problem anyone had, so the set stayed traditionally rounded.

![Large curves stay round but the stroke caps and small details go sharp](images/17-sharp-exploration.png)

Inspired by type design, large curves stay round but the stroke caps and small details go sharp

## Optical adjustments

This is the part icon sets usually skip, and the part I enjoy most. Logo designers always make these corrections. Type designers make them reflexively. In icon sets they're rare, mostly because across hundreds of small, intricate icons it's too much work for an effect nobody can really point at.

There's a fair question here: at 16px, can you even see this? Put two versions side by side and the difference is almost impossible to name. But interfaces zoom, the 24px set lives at larger sizes, and the effect works below the level of noticing, the same way a typeface's ink traps do at 10pt. And honestly, some of it is just the standard. It's the inside of the machine: nobody opens it, and it should still be tidy.

### Optical breaks

Where two or more lines meet, the junction reads darker than it should, because the shapes pile up and so the corner clogs optically and creates an optical build-up. So I cut a small notch at the junction, the same way a text face opens up the tight corners of an A. At small sizes like 16px the detail is almost invisible, but if you look closely, you notice why it feels just right.

![At](images/icons/01-at.svg)![Globe](images/icons/05-globe.svg)![Flame](images/icons/03-flame.svg)![Paper Plane](images/icons/06-paperplane.svg)![Git Merge](images/icons/04-git-merge.svg)![Curly Brackets](images/icons/02-brackets-curly.svg)![Strikethrough](images/icons/07-text-strikethrough.svg)

![Before](images/icons/01-at.svg)

Before

Optical breaks open up the tight corners where strokes meet

### Stroke thinning

Similar to optical breaks, in places where too many lines meet, some of the lines go thinner, so there isn't too much visual weight in one spot.

![Asterisk](images/icons/08-asterisk.svg)![Transparent Cube](images/icons/09-cube-transparent.svg)![Cursor Logo](images/icons/10-cursor-logo.svg)![Flask](images/icons/11-flask-slash-circle.svg)![Radio Tower](images/icons/12-radio-tower.svg)![Sparkles](images/icons/13-sparkles.svg)

![Before](images/icons/08-asterisk.svg)

Before

Stroke thinning reduces visual weight where lines converge

### Putting all dots in line

A dot that ends a line, a dot that means "more", and a dot floating alone all need slightly different sizes to look proper, and the set keeps track of which is which.

Each single dot needs a proper size to look just right

### Minding the gap

Sometimes icons have gaps between overlapping shapes, like when a folder has a plus on top, or when two squares sit on top of each other.

My rule for these gaps, or Cuts as I call them, was that they should never be less than 3 grid units (on a 16px grid). At 2.5 or less, shapes start touching and overlapping, merging into one blurry shape. 3+ pixels gives small icons the breathing space they need.

![Icons showing gaps between overlapping shapes with measurements](images/18-cuts.png)

Minimum safe space between elements keeps them from blurring at small sizes

### The pursuit of absolute perfection

Some of the versions I compared while making these calls differ by 0.25px. At 16px, rendered sometimes at 12, that difference shouldn't matter, but the versions just don't feel the same. I kept tinkering with the smallest, tiniest details, version after version after version, until one of them felt _just right_.

![Going through 156 explorations of a hamburger icon to find the perfect one](images/19-perfection.png)

Going through 156 explorations of a hamburger icon to find the perfect one

## Consistency is infrastructure

By this point you can probably tell that drawing each single icon this way takes time. Multiply that by hundreds, and drawing turns out to be only half the job. The other half is keeping the set consistent, and that half runs on infrastructure rather than memory.

I always keep three core Figma files:

![Three core Figma files](images/20-files.png)

### 1\. The Explorations

The private place where each icon or concept gets tens or hundreds of attempts. It looks chaotic from a distance, but it's organised – every concept has its own section and its own row of attempts.

![Figma Explorations file where everything gets explored](images/21-files-explorations.png)

Figma Explorations file where everything gets explored

### 2\. The Overviews

A lookup table for the whole set, where every recurring pattern is lined up and audited. This is the file that answers questions like:

- **Optical shapes.** Which icons follow which optical shape?
- **Cuts and gaps.** Where a smaller shape clips into a bigger one, is the gap optically the same everywhere?
- **Modifiers.** Do the small plus, minus and x badges sit at the same size and position every time?
- **Hinting.** Where a detail is reduced to a single line, is it reduced the same way?
- **Solid styles.** Filled icons are handled in more than one way, and each way has to stay consistent with itself.
- **Dots and notches.** Are the small dots the same size, and do notches appear at the same depth?
- **Perspective and diagonals.** Do the 3D and diagonal icons share one angle?
- **Objects.** Is the folder in one icon the same folder as in the other nine?

![Figma Overviews file for consistency tracking](images/22-files-overviews.png)

In the Figma Overviews file every visual re semantic aspect of the icon set is being kept track of for consistency

That last question is the one that never ends. The set tracks animals, arrows, block arrows, circular arrows, boxes, buildings, charts, diagrams, chevrons, devices, faces, flags, hands, people, smileys, icons with multiples, typography icons, icons with multiple lines, git icons, layout icons, media playback icons, open states, pointers, slashed icons, tools, waves, sound, balls, banknotes, bells, books, brackets, brains, bugs, calendars, clouds, chat bubbles, comment bubbles, consoles, controllers, checks, chips, clocks, compasses, corners, cubes, cylinders, databases, displays, dots, drops, envelopes, eyes, files, folders, flasks, grids, hashes, headphones, hourglasses, issues, locks, magnifying glasses, masks, notes, pluses, minuses, Xs, asterisks, play, pause, stop, record, playback, ellipses, exclamation marks, question marks, windows, tabs, PDFs, pencils, blocks, sparkles, stars, images, shields, seals, servers, speakers, targets, threading, towers, umbrellas, VR headsets, wallets, numbers, and letters from A to Z. Every one of them has to look like itself, everywhere it appears.

When a pattern drifts, the drift becomes visible. It all compounds into a set that feels unified rather than assembled from parts.

### 3\. The Icons

This is the core Figma file with all the final icons, each as a component with two properties: Filled (true or false) and Size (16px or 24px).

![Figma Icons file with all the components](images/23-files-icons.png)

Figma Icons file with all the components

### Leaving the desk

The other part of consistency work happens away from the desk. I mirror the Overviews prototype to my phone, because a phone shows the icon at its absolute size, with no zooming. You need to look at the set somewhere other than the file it was drawn in, on a device where 16px is actually 16px.

## The swap underneath

Earlier I said the new set had to replace the old one without breaking a single reference. Here's what that meant.

The icons ship as two font families called`Cursor Icons 16` and `Cursor Icons 24`, and in an icon font every glyph lives at a Unicode codepoint (for instance`U+0041` for the letter A). The old font had 645 icons at 645 codepoints, referenced throughout the product. If the new font kept the same assignments, the swap could happen automatically: load the new font, and`arrow-up` is still exactly where `arrow-up` always was. So that became the rule. Every old icon was to be remapped to its replacement at the same codepoint, and icons with no replacement were retired deliberately rather than lost.

Managing that mapping across 645 icons needed its own tool, so I built a migration dashboard. Every old icon sat in one of four states: To Be Processed, Processed, Removed, or Coupled to its replacement. The dashboard warned about missing SVGs and duplicate codepoints, and showed the whole set as a grid, coupled icons in green, removed ones in red, with a before-and-after comparison one click away.

Dashboard built to keep track of the migration from the old icon set to the new one

## Beyond the handoff

The delivery isn't just a set of files thrown over the fence. It's a package: the source Figma file, the icon fonts, the exported SVGs, and a companion site where the team lives and works with the set.

![The companion site where the team lives and works with the set](images/24-companion.png)

The companion site where the team lives and works with the set

### Hover, click, copy

The main page shows the full set in a grid, with the usual controls for size, style and search. The more useful part is hover: without clicking anything you get the icon larger, its codepoint, and the quick actions – copy the SVG, download it, or copy the symbol. Most of the time that's all anyone needs.

Clicking opens the detail view, where you can scale the icon up and down to see how it holds at different sizes, and read its tags. The latest font files download from the same place, so the site always serves the current state of the set.

![Icon detail view sidebar](images/25-companion-sidebar.png)

![Hovering an icon in the grid shows a tooltip with quick actions](images/26-companion-tooltip.png)

Icon detail view sidebar

Hovering an icon in the grid shows a tooltip with quick actions

### Finding what you can't name

Search runs on tags as well as names, which matters less for finding a known icon than for the harder case: someone has a new concept and needs to know whether the set already covers it. Searching "search" should surface`magnifying-glass` even though that word isn't in its name. With 1,274 tags across the set, most of those questions get answered without anyone having to scroll through hundreds of icons.

![Search is super handy when people look for an icon to portray a new concept](images/27-companion-search.png)

Search is super handy when people look for an icon to portray a new concept

### _"What's the icon for Bugbot?"_

A table pinning each Cursor concept to its icon. The point of the table is that each "What's the icon for \[X\]?" has exactly one answer, and keeps having exactly one answer as the product grows. Without it, a set slowly develops two icons for the same idea, and at that point it stops being a system.

![Concepts page: a table pinning each Cursor concept to its icon](images/28-companion-concepts.png)

Concepts page: a table pinning each Cursor concept to its icon.

### File types

A separate page maps file formats to their icons, with sample filenames, extension lists, and a color palette. The file type icons were a project of their own, big enough that I'm leaving them out of this article altogether.

![File Types page: maps file formats to their icons](images/29-companion-file-types.png)

File Types page: maps file formats to their icons

### Documentation

The site also hosts the documentation: the design philosophy behind the set (which I already wrote about), and a guide for adding an icon, which brings me to the last part.

## Ship it

A set that can't grow decays, so the last deliverable is the pipeline that keeps the system alive after the drawing is done.

![Ship it pipeline](images/30-ship-it.png)

Here's how an icon gets published:

- **Design the icon** in the master Figma file, in at least one combination: 16 or 24, Outline or Filled (usually starting with 16 Outline).
- **Flatten everything** into single paths, because the font compiler can't handle boolean operations or strokes that haven't been outlined.
- **Publish the Figma library file**, so everyone using it gets the latest updates.
- **Export the SVGs**, individually or in bulk from the dedicated export boards in the Overviews file, and drop them into the repository's correct folders.
- **Run**`ship it`.

That single command replaces a long chain of work. It registers any new SVGs and assigns them their codepoints. It compiles every icon into four fonts, one for each size and style, in each format the product needs. It merges the stylesheets into one. It rewrites the metadata inside each font file so the families are named correctly, because font compilers name things however they like. It regenerates the data the companion site runs on, so every icon, codepoint and tag on the site matches what's actually in the font. It rebuilds the site. It checks that the documentation isn't quoting an icon count from three weeks ago. Then it commits and pushes.

Doing all of that by hand is an afternoon of work, and one of the steps always gets missed. Typing`ship it` takes a second.

The exported SVGs, the icon fonts, the icon data and both sites live in a single repository, so a new icon travels from Figma to shipped in a single step. The system doesn't depend on me remembering anything. It's written down, it's automated, and it's handed over in a state where adding the next icon is routine.

## The work of one hand

The standard I held the whole time is that the icons should not take your attention. Not too friendly, decorative, or trying to impress you with how clever they are. Utilitarian, but never ugly or too boring. Small diagrams that do their work and step back.

You shouldn't notice them, but somewhere below noticing, you should always know – no, _feel_ – they're Cursor's.

That's how a typeface behaves. Nobody reads a paragraph and thinks about the typeface (except the designers), but set the same paragraph in the wrong one and everyone feels it. An icon system earns the same kind of invisibility the same way, through one construction logic, one stroke voice, four optical shapes, and thousands of little corrections that nobody will ever point at (well, except the designers).

An icon set of this kind is mostly decisions. Which of two nearly identical versions is right? Where does a junction need a little air? None of that comes from a rule you can write down precisely enough to follow. Cursor is an AI company, and artificial intelligence touches everything they build. But for the icons, for those hundreds of small decisions, they hired a person to draw each one by hand.

Marek Minor,

Founder & Designer,

Done
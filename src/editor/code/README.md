# Code editing and import

The Code window, HTML importer, and unapplied-source draft guards belong here.
The backend builds html-import.ts for browser-based source preparation.

The ordinary importer reverses only the exact supported `data-orc-layout="intrinsic-column-v1"` structure.
It validates the outer projection and the generated flow box's complete attributes and inline CSS before reading children directly into the canonical parent.
It restores the parent's owned Flex display, including priority, and retains the versioned canonical CSS marker.
Unknown versions and modified generated structures produce an explanatory refusal.
Removing `data-orc-layout` explicitly imports ordinary authored markup, strips only the recognized own canonical Column marker, and retains the inner div as a real object.
Unknown canonical marker versions still refuse instead of opting out implicitly.
Existing browser CSS normalization applies during import; equivalent-source comparison retains the original canonical declarations and identity on unchanged Apply.

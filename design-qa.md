source visual truth path: C:\Users\ROG\AppData\Local\Temp\codex-clipboard-6790f9da-2cf9-4d1d-87d6-be9facba2888.png
implementation screenshot path: C:\Users\ROG\Documents\Codex\2026-06-22\al-1-hero-2-3-4\work\index-blue-hero-1440.png
viewport: 1440x760
state: homepage hero, default desktop state
full-view comparison evidence: C:\Users\ROG\Documents\Codex\2026-06-22\al-1-hero-2-3-4\work\index-blue-qa-comparison.png
focused region comparison evidence: not needed; the requested changes are overall hero composition and whole-index styling, and the full-view comparison keeps typography, navigation, media, CTA, and selected-work strip readable.

**Findings**
- No actionable P0/P1/P2 issues remain.

**Required Fidelity Surfaces**
- Fonts and typography: large black display typography, compact nav labels, and smaller project/index metadata now match the reference hierarchy closely while using system fonts.
- Spacing and layout rhythm: hero uses the same INDEX-like frame, top navigation, two-column hero area, and bottom selected-work strip. No horizontal overflow at 1440px.
- Colors and visual tokens: palette is constrained to white, black, light grey, and blue accent.
- Image quality and asset fidelity: hero uses a project-bound bitmap scene (`hero-index-blue.jpg`) built from local project assets, with a light blue 3D/product-service mood. No visible placeholder boxes.
- Copy and content: portfolio-specific copy is preserved and rewritten cleanly in English; old corrupted text has been removed from the main React file.

**Patches Made**
- Rebuilt the home hero around the supplied reference style.
- Unified Profile, Work, Approach, and Contact sections into the same black/white/grey + blue index system.
- Added project-bound hero asset `public/assets/hero-index-blue.jpg`.
- Verified `npm run build` passes.

final result: passed

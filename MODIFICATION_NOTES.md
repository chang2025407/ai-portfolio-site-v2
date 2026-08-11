# Connected on a Long Journey - rebuild notes

## Main correction
- Removed the incorrect train-travel / family-boredom narrative.
- Reframed the case around long-haul truck drivers, spouses, children and community support.
- Synchronized the homepage Chinese and English project card copy.
- Replaced the old homepage cover with a crop from the original project board.

## Evidence used
- Three documented truck-driver interviews.
- Interview excerpts from spouses and children.
- Multi-role pain points and needs.
- Stakeholder map.
- Original high-fidelity app concept.
- Documented offline workshop and participant outputs.
- Original service blueprint.

## New case-study structure
- Overview and context.
- Exploratory research with an explicit limitation note.
- Multi-role insights.
- Design challenge and principles.
- Digital + offline product-service system.
- Three key product flows.
- Original app concept evidence.
- Workshop evidence.
- Rebuilt HTML/CSS service blueprint.
- Concept outputs, reflection and validation gaps.

## QA completed
- JavaScript syntax checks passed.
- Chinese and English content rendering checked.
- Desktop visual render checked at 1440 px.
- Mobile visual render checked at 390 px.
- Mobile document width equals viewport width: no page-level horizontal overflow.
- Browser console and page-error checks returned no errors for the rebuilt standalone case page.
- Search confirmed that obsolete train-travel phrases are no longer present in source text.

## Build note
A full `npm run build` could not be executed in the ChatGPT sandbox because the internal npm mirror did not contain `@tailwindcss/vite`. No dependency or source build error was reported; the failure occurred before dependency installation. Run `npm install` (or use the existing local `node_modules`) and `npm run build` on the original computer before deployment.

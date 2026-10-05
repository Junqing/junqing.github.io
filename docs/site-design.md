# Production site design and deployment

## Entry points

- `index.html` is the sole application shell and the default GitHub Pages page.
- `refreshed.html` is only a small backward-compatible redirect for old bookmarks. It preserves the query string and hash when JavaScript is enabled. There is no second design or copy of the app.
- `styles.css` is the human-maintained stylesheet: component geometry plus the editorial layout, typography, appearance and responsive rules.
- `site-ui.js` owns Home rendering, page headings, appearance, accessibility enhancements and per-route scroll restoration. It is declarations-only; the trailing `index.html` entry calls `initSiteUI()`.
- `nav.js` still owns `NAV` and all routing. `applyNav()` calls the site presentation hooks explicitly; no runtime monkey-patching of navigation or Home remains.

The preview CSS/JS, shell generator and preview-only tests have been retired.
Edit the production HTML/CSS/JS directly; no snapshot regeneration or build step is required.

## Data and view lifecycle

- Only X-Trans V data is eager. `initRecipePools()` runs from the entry point;
  other Fuji generations and OM load on demand through `loadGen()`.
- Concurrent requests share a promise/script. Failed loads are retryable;
  returning to an active family invalidates an outstanding different request.
- Completion calls the current view renderer with the new schema. Unvisited
  recipe panes are not prebuilt during Home startup.
- Explore rebuilds fresh controls, preventing duplicate options/listeners.
- Fuji correlations are computed from the active generation with unavailable
  values omitted and tags deduplicated. The obsolete `corr-data.js` snapshot is
  removed. OM correlation computation remains separate.
- `recipeIdentity()` / `recipeLabel()` / `resolveRecipe()` distinguish legitimate
  same-name OM recipes by author. Modals and Compare use the selected record or
  metadata identity, not an ambiguous bare name. Original records are unchanged.

## Responsive design

- Warm paper backgrounds and forest-green accents; serif display headings and readable system-font body text. No remote font dependency.
- A photography-led Home with the existing Lightroom photos, camera/recipe/topic counts from real data and entry links into Photography, Camera Settings and Learn.
- Desktop main navigation in the masthead; the same native buttons form a bottom navigation bar at ≤680px, including safe-area padding.
- Scoped, scrollable view tabs and a permanently visible recipe-family control when Camera Settings is active. The selector has its own row on phones, and is hidden elsewhere.
- A single-album Gallery uses the full content width. Multiple albums retain the album filter rail.
- All scrolling stays in `.content-scroll` (`#site-content`) within the fixed viewport/flex layout. Do not add competing scroll containers to `.app`, `main`, or `.content`.
- Light/dark appearance uses `jin-site-theme` in localStorage. A selection saved under the former `jin-refreshed-theme` key is accepted during migration. Storage is optional; denied access does not break the page.
- Keyboard main/view navigation, visible focus outlines, a skip link and reduced-motion rules. Mobile text inputs/selects use 16px type to avoid iPhone input zoom.

## Gallery photo viewer

The viewer still reuses `#recipe-modal`, but `.rmodal.photo-open` has its own
viewport-wide, transparent inner shell and dark backdrop. The 760px limit is
kept only for recipe reading; it no longer restricts landscape photographs.

- `fitPhotoToBox(width, height, maxWidth, maxHeight)` preserves composition and
  aspect ratio, fitting both bounds without cropping.
- `layoutPhotoModal()` reserves safe-area padding, close controls and the actual
  caption height. Portrait width is not inflated to match a landscape, and
  caption width is independent of photo orientation.
- `initGalleryViewer()` responds to window/visual-viewport resize. Image load and
  Previous/Next navigation recalculate the fit; native pinch zoom is not canceled.
- Arrows and Close remain fixed/reachable. Escape and blank-backdrop clicks close
  the viewer. No inline sizing is left on the shared shell when a recipe opens.
- The gallery grid, manifest, image URLs and metadata allowlist are unchanged.

## Fuji visual consistency

`buildFujiVisual(r)` in `recipes-ui.js` is the single Fuji visual standard for:

- Camera Settings recipe cards and their modals;
- X-T50 custom slots C1–C7, both multi-simulation and single-recipe slots.

It emits `.card-img-fp.fuji-visual` with the same dark surface, 120px radar SVG,
80px WB-shift grid, WB label and DR badge. `.cs-recipe-visual` only constrains the
setup panel's outer width; it does not restyle or rescale the graphs. If the
shared graph helper is unavailable, the setup still renders its authored
settings tables/pills instead of leaving all C slots blank.

`customSlotRecipe(name)` resolves X-T50 recipes specifically from X-Trans V,
regardless of the family selected in Camera Settings. `fujiWbMiniGrid(r)` is
Fuji-only and independent of active navigation state. The regular
`wbMiniGrid(r, family)` still guards the OM path.

`openRecipeModal(reference, family)` accepts a recipe record, metadata identity,
or legacy name, and an explicit source family for custom
slots. `makeCard(r, family)`, warmth/punch classifiers and Compare selection
preserve that source family. Selecting a Fuji setup recipe for Compare while OM
is active explicitly switches families and clears mixed-family selections.

OM remains separate: `buildOmVisual()` continues to render OM recipes and the
PEN-F/OM-3 profiles. There is no Fuji/OM field or formula unification.

## X-E5 scenario + FS setup

`MY_CUSTOM_SETUPS["Fujifilm X-E5"]` in `gear.js` uses `type: "fuji-scenarios"`:
seven authored scenario banks, three Auto ISO profiles, a programming/recall
checklist and `filmSlots` pointing to the existing X-Trans V recipes.
`renderFujiScenarioSetup()` in `personal-ui.js` keeps the C-bank recommendations,
physical dial/selector choices and FS image-quality memories explicitly separate.
`makeSetupModeCard()` shares only personal-mode presentation with OM setups.

- FS1: Reggie's Portra; FS2: Kodak Gold 200; FS3: Kodak Tri-X 400.
- `FS RECIPE` must be On. A film-simulation assignment alone is not a full recipe.
- `fujiImageQualitySettings(r)` omits shooting ISO and exposure compensation;
  those appear as separate field guidance, not promises about FS recall.
- High ISO NR -4 is a setup supplement verified against the published recipes,
  not a mutation of the recipe dataset. Reggie's current source specifies no
  fixed compensation; retain the original CCB Weak with Off noted as an optional
  X-Trans V matching adjustment.
- Physical shutter/aperture/focus controls remain manual. C banks can include
  image-quality and FS-dial settings: copy a consistent baseline and verify all
  C/FS combinations instead of assuming complete independence.
- The X-T50 recipe slots, OM camera profiles and X-M5 placeholder are unchanged.
  This X-E5 entry is a planned setup guide; it does not assert ownership by adding
  a new body to `MY_CAMERAS`.

## GitHub Pages

The site remains static and buildless. GitHub Pages serves the committed files
as-is; there is no framework, package.json, bundler, backend, or deployment-time
HTML generator.

- All script, stylesheet and gear-image paths are relative and case-correct.
  This works at `https://junqing.github.io/` and beneath a project subpath.
- Hash routing keeps deep links refreshable without server rewrite rules:
  `#/photography/setup`, `#/photography/learn`, `#/camera/explore/f=OM`.
- All application CSS/JS URLs carry the same `?v=editorial-5` cache revision. `SITE_ASSET_VERSION` in `site-ui.js` applies that revision to every lazy family load too. Bump this constant and all `index.html` asset tags together when deploying code changes, so an old cached renderer cannot be mixed with a newer one.
- Lazy families request relative `recipes-<family>.js` paths with that version query.
- `.nojekyll` stays at the repository root so Jekyll does not omit asset paths.
- Gallery images remain public Lightroom hotlinks; availability still depends
  on the existing public share and Adobe service, as documented in the gallery guide.
- Main-branch deployment remains the repository's existing GitHub Pages setup.
  Local edits/tests do not themselves publish the site; push to the configured
  deployment branch when ready. Do not use the machine's `gh` CLI.

## Checks

```bash
python3 -m http.server 8000
node --test tools/test_*.cjs
python3 -m unittest discover -s tools -p 'test_*.py'
```

The optional `tools/smoke_site.cjs` suite checks the real browser without adding
runtime dependencies to the site. Install Playwright outside the checkout if
needed, and set its module path/browser configuration:

```bash
PLAYWRIGHT_MODULE=/path/to/playwright BROWSER=webkit \
  SITE_URL=http://localhost:8000/ node tools/smoke_site.cjs
# For an existing Chrome/Edge install, use BROWSER=chromium and optionally
# CHROMIUM_EXECUTABLE=/path/to/browser.
```

The gallery generator uses Python's verified HTTPS by default. If that Python
installation's CA store fails certificate verification, an available system
`curl` can perform the same HTTPS-only request with its own verification enabled.
No insecure TLS flags are used; other network errors still abort without changing
the manifest.

Browser checks should cover root and subpath hosting, all recipe families/views,
Back/Forward and hard refresh, the former preview redirect, theme persistence,
mobile filters and safe-area navigation, Learn demos, recipe/photo modals, and
all seven Fuji setup graphs in light/dark appearances before and after visiting OM.

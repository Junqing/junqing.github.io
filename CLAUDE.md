# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is **Jin's personal homepage**, a GitHub Pages site with no build process. It has three top-level sections: **Home** (a landing page introducing the author), **Photography** (Jin's own gallery, gear, custom camera setup, and shooting notes), and **Camera Settings** (a recipe explorer for two distinct camera recipe families — **Fujifilm X-Trans** film simulation recipes and **OM System/Olympus** color-wheel recipes from om-recipes.com). Photography and the recipe explorer are two facets of one site, not two products bolted together — see `docs/superpowers/specs/2026-08-12-layout-reorg-design.md` for the rationale.

The shell lives in `index.html` (served at the site root by GitHub Pages), which loads four hand-written JS modules (`nav.js`, `recipes-ui.js`, `personal-ui.js`, `om-analysis.js`) plus data files: recipe data in per-generation/family files (`recipes-v.js`, `recipes-om.js`, etc.), personal gear/setup data in `gear.js`, and gallery data in `gallery.js`.

**The two recipe families are architecturally separate and must stay that way.** Fuji recipes (`RECIPES_V/IV/III/II/I`) use a film-simulation-based schema; OM recipes (`RECIPES_OM`) use a 12-point color-wheel schema. They share zero field names by design. Do not merge, cross-reference, or generalize the two schemas — when adding recipe-family-aware code, branch explicitly on `activeGen === 'OM'` rather than trying to unify field access.

## Running / Previewing

No build step. Serve locally (required for `gear.js` to load via `<script src>`):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

No package.json, no npm, no bundler.

## Architecture

`index.html` contains inline CSS (`<style>`), inline HTML structure (the shell, header, nav, and empty pane containers), and one small inline `<script>` block — the app's actual entry point. Everything else is split into four modules, each loaded via `<script src>`:

- **`nav.js`** — owns navigation state (`NAV`) and routing. The only place that knows "where am I". Loaded last because it calls into both realms below.
- **`recipes-ui.js`** — the Camera Settings realm: recipe grid, keywords, insights, explore, compare, sidebar facets, and the `S`/`T`/`C` filter-and-tool state.
- **`personal-ui.js`** — the Photography realm: gallery, gear, custom setup, and scenario-notes rendering.
- **`om-analysis.js`** — OM-specific analysis (unchanged by the layout reorg; see its own section below).

Current script load order in `index.html`:

```html
<script src="recipes-v.js"></script>    <!-- recipe data -->
<script src="recipes-iv.js"></script>
<script src="recipes-iii.js"></script>
<script src="recipes-ii.js"></script>
<script src="recipes-i.js"></script>
<script src="corr-data.js"></script>
<script src="om-analysis.js"></script>
<script src="gallery.js"></script>
<script>const $ = id => document.getElementById(id)</script>
<script src="recipes-ui.js"></script>   <!-- realm renderers -->
<script src="personal-ui.js"></script>
<script src="gear.js"></script>
<script src="nav.js"></script>          <!-- router, loaded last -->
<script> … init(), event wiring … </script>
```

**Load-order rule:** every module (and the small `const $` block) is *declarations only* — nothing in a module may touch another module's or another script's globals at parse time, only inside function bodies. Anything that actually needs to run at load time (event listeners, `init()`, the initial `applyHash()` call) lives in `index.html`'s trailing inline `<script>`, which runs after all four modules have parsed. This is what keeps each module usable as a pure, importable library regardless of `<script>` tag order, and is why `nav.js` — which calls into `recipes-ui.js` and `personal-ui.js` — can safely load after them without those two ever needing to call back into `nav.js` at parse time.

**`gear.js`** defines five plain globals:
- `MY_CAMERAS` — camera bodies with specs and `image` field pointing to `images/gear/`. Includes both Fuji bodies and the Olympus PEN-F.
- `MY_LENSES` — lenses with specs and `image` field. Each entry has a `mount` field: `"X"` (Fuji X-mount, 7 lenses) or `"M43"` (Micro Four Thirds, 4 lenses). `renderGear()` splits the Lenses section into X-mount/M43 sub-tabs based on this field.
- `MY_CUSTOM_SLOTS` — C1–C7 custom recipe slots (see below). Fuji-only — `recipe_name` references must match a Fuji `RECIPES_*` entry.
- `MY_RECIPES` — currently empty `[]`; reserved for future use
- `RECIPE_META_PATCHES` — override computed badge labels per recipe. Keys must exactly match `RECIPES[].name`. Supported fields: `warmth_override` (`'warm'|'neutral'|'cool'`), `punch_override` (`'punchy'|'balanced'|'flat'`). Currently empty — add entries here when the formula misfires on a specific recipe. Name-keyed and shared across both recipe families — collision risk between a Fuji and OM recipe sharing an exact name is accepted, not guarded against.

This file is intentionally human-readable and editable directly on GitHub. If it fails to load (e.g. `file://` without a server), all personal tabs show a graceful empty state.

**Data layer** — Recipe data is split into per-generation/family files at the repo root:
- `recipes-v.js` — defines `RECIPES_V` (X-Trans V, ~113 recipes); loaded at page start
- `recipes-iv.js` — defines `RECIPES_IV` (X-Trans IV, ~202 recipes)
- `recipes-iii.js` — defines `RECIPES_III` (X-Trans III, ~47 recipes)
- `recipes-ii.js` — defines `RECIPES_II` (X-Trans II, ~32 recipes)
- `recipes-i.js` — defines `RECIPES_I` (X-Trans I, ~13 recipes)
- `recipes-om.js` — defines `RECIPES_OM` (OM System/Olympus, 66 recipes sourced from om-recipes.com); uses a completely distinct schema, see below

All five Fuji generations (`recipes-v.js` through `recipes-i.js`) load eagerly via `<script src>` in `index.html` and are eagerly pooled: `recipes-ui.js` builds `const RECIPE_POOLS = { V: RECIPES_V, IV: RECIPES_IV, III: RECIPES_III, II: RECIPES_II, I: RECIPES_I }` at parse time. Only **OM** is lazy-loaded, via `loadGen(gen)` (fetches `recipes-<gen.toLowerCase()>.js` and assigns `RECIPE_POOLS[gen] = window['RECIPES_' + gen]` on load), called from `switchGen(gen)` when the user first switches to OM. The active pool is always accessed via `activeRecipes()`, which returns `RECIPE_POOLS[activeGen] || []`.

This was not always true: before the `redesign/layout-reorg` branch, `RECIPES_V` (and every other Fuji generation) was inlined as a `var RECIPES_V = [...]` literal directly in `index.html`'s trailing script block — not loaded via `<script src>` at all — even though `recipes-v.js` existed as an identical standalone file. `recipes-v.js` etc. are the only copies now; the inline duplicates were deleted when the data was extracted into its own `<script src>` tags.

Each **Fuji** recipe object has:
- Camera settings: `film_simulation`, `grain_effect`, `color_chrome_effect`, `color_chrome_fx_blue`, `white_balance`, `wb_shift_red/blue`, `dynamic_range`, `highlight`, `shadow`, `color`, `sharpness`, `clarity`, `iso_max`, `exposure_compensation`
- Metadata: `name`, `filename`, `source_url`, `narrative`
- Classification: `mood_keywords[]`, `scenario_keywords[]`, `color_direction` (legacy, not read by UI), `era_reference`, `film_emulated`

Each **OM** recipe object (`recipes-om.js`) has an entirely different, non-overlapping schema:
- `name`, `author`, `source_url`, `recipe_type` (`"COLOR"` | `"MONO"`)
- `color_wheel` — object with 12 channels (`yellow, orange, orangeRed, red, magenta, violet, blue, blueCyan, cyan, greenCyan, green, yellowGreen`), each `-7..+7`; all `null` for `MONO` recipes
- `contrast`, `sharpness`, `highlights`, `shadows`, `midtones`, `shading_effect`, `exposure_compensation`
- `white_balance` (preset name string), `wb_temperature`, `wb_amber_offset`, `wb_green_offset`
- Monochrome-only (all `null` for `COLOR` recipes): `monochrome_profile`, `monochrome_color`, `monochrome_color_strength`, `film_grain`, `film_hue`, `monochrome_vignetting`
- `mood_keywords[]`, `scenario_keywords[]` — hand-authored, same convention as Fuji

Note the deliberate field-name divergence even where a concept overlaps: OM uses `highlights`/`shadows` (plural), Fuji uses `highlight`/`shadow` (singular); OM has no `film_simulation`, `clarity`, `color`, `color_chrome_effect`, or `grain_effect` at all.

**Badge classification** — two pure functions replace the old `color_direction` badge:
- `recipeWarmth(r)` → `'warm' | 'neutral' | 'cool'` — derived from WB kelvin, WB shift (R−B), film sim bias
- `recipePunch(r)` → `'punchy' | 'balanced' | 'flat'` — derived from Color dial, Clarity, highlight/shadow spread
- Override fields: add `warmth_override` / `punch_override` to `RECIPE_META_PATCHES` in `gear.js`
- Helper maps: `WARMTH_CLASS`, `PUNCH_CLASS`, `warmthClass(r)`, `punchClass(r)`
- B&W sims always return `'neutral'` warmth (WB irrelevant on monochrome)

**State** — a single `S` object holds active filter state (search query + chip selections). Filter sets: `S.f.sim`, `S.f.warmth`, `S.f.punch`, `S.f.mood`, `S.f.scene`, `S.f.era`, plus the OM-only `S.f.type` and `S.f.hue` — note `S.f.dir` no longer exists (replaced by warmth + punch).

`activeGen` (string, default `"V"`) tracks the currently selected recipe family/generation — one of `V`, `IV`, `III`, `II`, `I`, `OM`. `activeRecipes()` returns `RECIPE_POOLS[activeGen] || []`.

A `<select id="gen-select">` dropdown lets the user switch. It lives **inside the Camera Settings `.view-tabs` bar**, not in the global header — it is meaningless in Home and Photography, and having it globally visible previously caused a real bug (changing family while on the Gallery tab re-showed recipe filter sections over a gallery-only sidebar). Its `onchange` calls `navigate(NAV.section, NAV.view, NAV.subview, this.value)` rather than `switchGen()` directly, so the family becomes part of the URL; `navigate()` then calls `switchGen(gen)` only when the family actually changed.

`switchGen(gen)` lazy-loads the file if needed, resets `S` state, clears `exploreBuilt`/`compareBuilt`, and re-renders. It carries a `genRequestSeq` guard so a slow load resolving after a newer switch is discarded, and on failure it resets `NAV.family` back to `activeGen` (otherwise `navigate()`'s change-detection stays permanently true and retries the failed load on every subsequent click).

**Rendering pipeline**:
1. `index.html`'s trailing inline `<script>` wires the section/view/subview tab click listeners (they all call `navigate(...)`) and calls `init()`.
2. `init()` (`index.html`) bootstraps chip filters, sidebar facets, and pre-warms several Camera Settings panes, registers the `hashchange` listener, then calls `applyHash()` to route to whatever the URL says (or Home, on a fresh load).
3. `applyHash()` / `navigate()` (`nav.js`) update `NAV` and call `applyNav()`, which toggles the DOM's `.on` classes and ends by calling `renderCurrentView()`.
4. `renderCurrentView()` (`nav.js`) dispatches on `NAV.view` through the `NAV_RENDER` table (falling back to `renderHome()` when `NAV.section === 'home'`) — see Routing below.
5. Within Camera Settings, each view's render function calls `filtered()` (`() => activeRecipes().filter(matches)`, applying `S`) to get its recipe set.

## Sections and views (current structure)

Top-level navigation is driven entirely by `NAV` (`nav.js`), not by DOM inspection — see Routing below for the full scheme. There is no flat tab bar and no `data-tab` attribute; elements instead carry `data-section`, `data-view`, or `data-subview`, and `applyNav()` toggles `.on` by comparing each element's attribute to the matching `NAV` field.

| Section | `data-section` | Views (`data-view`) | Subviews (`data-subview`) | Render function(s) |
|---|---|---|---|---|
| Home | `home` | — (landing only) | — | `renderHome()` (`nav.js`) |
| Photography | `photography` | Gallery (`gallery`), Gear (`gear`), My Setup (`setup`), Notes (`notes`) | — | `renderGallery()`, `renderGear()`, `renderMyCustomSetup()`, `renderScenarios()` (all `personal-ui.js`, except `renderMyCustomSetup`'s OM delegate `buildOmVisual()` which is in `recipes-ui.js`) |
| Camera Settings | `camera` | Recipes (`recipes`), Insights (`insights`), Explore (`explore`), Compare (`compare`) | Recipes: list (default)/keywords; Insights: settings (default)/directions/correlations | `renderGrid()`/`renderClouds()`, `renderSettingsGuide()`/`renderDirections()`/`renderCorrelations()`, `initExplore()`, `initCompare()`/`renderCompare()` (all `recipes-ui.js`) |

The family picker (`<select id="gen-select">`) lives inside Camera Settings' view-tabs bar only — it has no meaning in Photography or Home, so it is scoped there rather than shown globally.

Tab clicks call `navigate(section, view, subview, family)` directly (`personal-ui.js` wires the listeners); there is no `switchTab()`/`switchInnerTab()` — those functions were removed by the layout reorg. See **Routing** below for the full navigation model.

**OM recipe family scope**: every Camera Settings view now has an OM implementation. Settings Guide, Directions, Correlation, Explore, and Compare each detect `activeGen === 'OM'` early in their render/init function and delegate to the matching `renderOmX()` / `initOmX()` in **`om-analysis.js`**, falling back to the old `.empty` "not available" state only if that file failed to load (each dispatch is wrapped in `typeof fn === 'function'`). Each guard resets its own build-once flag (`settingsBuilt`, `exploreBuilt`, `compareBuilt`) so switching families rebuilds rather than staying stuck.

## Routing

Navigation is hash-based, owned entirely by `nav.js`. There is no `pushState`-based routing: GitHub Pages serves static files with no server-side rewrite rules, so a real path like `/camera/explore` would 404 on refresh or on a pasted deep link. Hash fragments never reach the server, so `#/camera/explore` always serves `index.html` and the client routes from there once it loads.

**Hash scheme** (built/parsed by `navToHash()` / `applyHash()` in `nav.js`):

```
#/                          Home
#/photography               Photography (defaults to Gallery)
#/photography/gallery       Photography ▸ Gallery
#/photography/gear          Photography ▸ Gear
#/photography/setup         Photography ▸ My Setup
#/photography/notes         Photography ▸ Notes
#/camera                    Camera Settings (defaults to Recipes, current family)
#/camera/recipes            Camera Settings ▸ Recipes
#/camera/insights           Camera Settings ▸ Insights
#/camera/explore            Camera Settings ▸ Explore
#/camera/compare            Camera Settings ▸ Compare
#/camera/recipes/keywords   Recipes ▸ Keywords (inner subtab)
#/camera/insights/directions
#/camera/recipes/f=OM       …scoped to a named family
```

Recipes and Insights keep their inner-subtab bars (Recipes has list/keywords; Insights has settings/directions/correlations), so a hash may carry a `view` segment and, optionally, a `subview` segment. The family is tagged with an `f=` prefix rather than encoded positionally, because both the subview and the family segment are optional — a bare `#/camera/recipes/OM` would be ambiguous between "Recipes, family OM" and some future third subview named `OM`. `applyHash()` filters segments starting with `f=` out before positionally destructuring the rest into `[section, view, subview]`.

- `navigate(section, view, subview, family)` (`nav.js`) is the single entry point for all navigation, called both by click handlers (`personal-ui.js`) and by `applyHash()`. It validates each argument against `NAV_VIEWS`/`NAV_SUBVIEWS`/`RECIPE_FAMILIES`, falling back to a default rather than erroring — an unrecognized section falls back to Home, an unrecognized view falls back to its section's first view, and an unrecognized family segment (e.g. `f=ZZ`) is silently ignored, leaving `NAV.family` at whatever it already was.
- A `hashchange` listener (registered once, in `init()`) calls `applyHash()` on every hash change, so browser Back/Forward work.
- **Canonicalising vs. user navigation** (`navCanonicalising` flag in `nav.js`): `navigate()` always writes the resulting hash if it differs from `location.hash`, but *how* it writes matters for the Back button. A plain `location.hash = ...` assignment always **pushes** a new history entry. That's correct when the user actually clicked something. But `applyHash()` also calls `navigate()` to reconcile whatever hash the browser handed it — on first load with no hash, or when correcting an invalid hash like `#/nonsense` back to `#/` — and if that correction pushed a history entry too, the visitor's first Back press (the one meant to leave the site) would instead land on the bad/absent hash and re-correct forward, making Back appear broken. `applyHash()` sets `navCanonicalising = true` before calling `navigate()`; `navigate()` checks that flag and uses `history.replaceState()` instead of a hash assignment when it's set, so canonicalisation never leaves a spurious entry, while genuine user-driven navigation still pushes normally.
- `RECIPE_FAMILIES` (`nav.js`) is the source of truth for valid family ids in routing/validation — see the note under Key functions below.

## GitHub Pages constraints

The site is a static, buildless GitHub Pages deployment with no CNAME (served from `junqing.github.io`, not a custom domain) and no server. That imposes hard constraints on how code and assets may reference each other:

- **Relative paths only.** Every `<script src>`, `loadGen()` fetch path, and image `src` must be relative (e.g. `gallery.js`, `images/gear/x-m5.jpg`), never absolute (`/gallery.js`). An absolute path resolves against the domain root and 404s the moment the site is anything other than the domain's sole top-level app — which it already isn't, once other paths exist on `junqing.github.io`.
- **Case-sensitive filenames.** GitHub Pages serves from a case-sensitive filesystem; macOS (the usual dev machine) is not, by default. A `<script src>` value that differs from the real filename only in case works locally and 404s once deployed. Always match `<script src>`/`loadGen()` paths to the actual on-disk filename exactly.
- **`.nojekyll` is present at the repo root** — required because GitHub Pages runs Jekyll by default, and Jekyll silently skips (does not serve, does not error) any file or directory whose name starts with `_` or `.`. There's no current directory like that in this repo, but `.nojekyll` is cheap insurance against a future one vanishing with no error.
- **No server-side rewrite rules**, which is why routing is hash-based rather than `pushState`-based — see Routing above. `location.hash` never reaches the server, so a hard refresh or a pasted deep link like `#/camera/explore` always resolves to `index.html` first and lets the client route from there; a real path segment would 404 outright.

## om-analysis.js

All OM-specific analysis lives in `om-analysis.js`, loaded early — before `recipes-ui.js`, `personal-ui.js`, `gear.js`, `nav.js`, and `index.html`'s trailing inline `<script>`. `index.html` keeps only thin dispatch lines. The two recipe families stay architecturally separate — no Fuji code path reaches this file.

```html
<script src="om-analysis.js"></script>
<!-- … gallery.js, recipes-ui.js, personal-ui.js, gear.js, nav.js … -->
```

**Load-order rule:** `om-analysis.js` parses before every other module and before `index.html`'s trailing inline script, so nothing in it may touch another module's or index.html's globals at parse time — only inside function bodies. `OM_WHEEL_ORDER` / `OM_WHEEL_ABBR` are therefore *defined here and consumed elsewhere* (`recipes-ui.js` reads them directly; `index.html`'s trailing script keeps a `typeof`-guarded fallback copy in case `om-analysis.js` failed to load), not the reverse.

Exports: `recipeWarmthOm`, `recipePunchOm`, `omHueEmphasis`, `omKelvin`, `OM_DIRECTIONS` / `renderOmDirections()`, `OM_SETTINGS_DATA` / `renderOmSettingsGuide()`, `computeOmCorrelations()` / `renderOmCorrelations(q)`, `TOM` / `initOmExplore()`, `OMC` / `initOmCompare()` / `renderOmCompare()`, and the `resetOmInsightsBuilt` / `resetOmExploreBuilt` / `resetOmCompareBuilt` flag-resetters called from `switchGen()`.

### OM badge formulas

`recipeWarmth(r)` / `recipePunch(r)` in `index.html` dispatch to the OM versions **after** the `RECIPE_META_PATCHES` override check, so overrides keep working for both families. The badge vocabulary is shared by design; only the computation diverges.

- **Warmth** — colour-wheel tilt (warm channels − cool channels), WB amber offset, and WB kelvin *only when known*. `wb_temperature` is null on 47 of 66 recipes; the kelvin term is dropped from the weighted average rather than defaulted to 5200K (defaulting collapsed 59 of 66 into "neutral"). MONO always returns `neutral`. Result: 21 warm / 25 neutral / 20 cool.
- **Punch** — mean absolute wheel push, contrast, and **signed** tonal separation `(highlights − shadows)/2`. The sign matters: on OM, highlights-up/shadows-down is an S-curve that *raises* contrast, the opposite of Fuji's absolute-spread reading. Result: 23 punchy / 25 balanced / 18 flat.

Thresholds are pool percentiles and 13 recipes sit within 0.02 of a cut, so weight changes shift a few recipes across boundaries — the ranking is stable, exact counts are not.

**`shading_effect` is 0 on all 66 OM recipes** — excluded from both formulas and from Explore's similarity metric, still shown in settings tables.

### OM sidebar facets

`initChips()` branches on `activeGen === 'OM'`: it hides Film Simulation and Era (no OM equivalent, would render blank) and shows **Recipe Type** (COLOR/MONO) and **Hue Emphasis** instead. `S.f` gains `type` and `hue` sets; `matches()` gains two OM-guarded conditions.

**Hue Emphasis is deliberately not called "Color Cast."** In OM's Color Creator a positive channel boosts *that hue's saturation* rather than tinting the image, so a recipe can read `warm` on Warmth and `cool` here without contradiction (`"OMTC Warm"`: amber +4, but blue +4 / cyan +5). The sidebar info popover spells this out.

### OM Explore & Compare

Explore (`initOmExplore`) makes the 12-point wheel the primary draggable control — 12 handles, each −7..+7, sharing `buildOmWheelSvg()`'s geometry (viewBox `0 0 260 260`, centre 130,130, `radius = 49.23 + 6.15*v`; `omRadiusToVal()` is the inverse used by the drag handler). State is `TOM`, kept strictly separate from Fuji's `T`. Both the Fuji and OM builds write into `#pane-explore`, so `initExplore()` snapshots the Fuji markup into `fujiExploreHTML` on first use and restores it when switching back.

Compare (`initOmCompare`) has the same three views against OM data. `C.a`/`C.b`/`compareSlots` are **shared** with the Fuji implementation, so `switchGen()` clears them — a Fuji recipe must never end up compared against an OM one.

`renderCharts()` and the `#pane-charts` div still exist in the codebase but are
not reachable from any section or view. Leave them unused rather than removing
them. (`renderSaveSlots()` was named here previously — it no longer exists
anywhere in the code, and was removed before this file was written.)

## Gallery

The Gallery tab shows Jin's own photographs, **hotlinked from public Adobe
Lightroom shared albums** — no image files are committed for the gallery.

- `tools/build_gallery.py` — author-time script. Reads Lightroom's public album
  API server-side and writes `gallery.js`. Python 3 stdlib only.
- `gallery.js` — **generated; never hand-edit.** Defines `GALLERY_ALBUMS` and
  `GALLERY_PHOTOS` as plain globals, like `gear.js`.
- `/gallery` skill — conversational add/remove/refresh of albums.

**Why a build step exists here** despite the "no build" rule: Adobe blocks
browser JS from reading album contents (HTTP 403 cross-origin) while allowing
`<img>` hotlinks. The photo list therefore cannot be fetched at runtime. The
**site** remains buildless — `gallery.js` is a plain `<script src>` global and
GitHub Pages serves everything as-is.

**Privacy:** `photo_from_asset()` uses an allowlist. Lightroom's public API
exposes the camera body `SerialNumber`, the editing machine name, and original
filenames; none are copied into `gallery.js`. Do not convert this to a
blocklist.

**Dependency:** the gallery breaks if the Adobe subscription lapses or a share
is made private. The `/gallery` health check surfaces this. The manifest shape
is hosting-agnostic, so switching to repo-hosted files would change
`build_gallery.py` and the `thumb`/`src` values, not the renderer.

Key functions in `index.html`: `renderGallery()` (guarded by `galleryBuilt`),
`renderGalleryGrid()`, `buildAlbumChips()`, `photoCaption(p)`, and
`openPhotoModal(p)` — which reuses the `#recipe-modal` shell but is **separate
from** `openRecipeModal()`, since that one looks up recipes by name and builds a
recipe card.

## Key functions

### Navigation (`nav.js`)

- `NAV` — `{ section, view, subview, family }`, the single source of truth for location. Nothing else may ask the DOM where it is.
- `RECIPE_FAMILIES` — array of `{ id, label, count }` for all six families, used by `navigate()` for family validation and by `renderHome()` for the Home door stat. **Deliberately not derived from `RECIPE_POOLS`**: `RECIPE_POOLS` only contains whatever families have actually loaded (all five Fuji generations eagerly, OM only after a first visit via `loadGen()`), so a cold load before ever visiting Camera Settings would read a smaller, wrong total. `RECIPE_FAMILIES`'s counts are fixed data — the recipe files are static and committed — so hardcoding them is correct, not a shortcut. **If a `recipes-*.js` file gains or loses entries, update this list.** Verified against the actual files at the time of writing: V 113, IV 202, III 47, II 32, I 13, OM 66 — all six match `RECIPE_FAMILIES` exactly.
- `navigate(section, view, subview, family)` — the single entry point for all navigation. Validates and normalizes each argument, updates `NAV`, calls `applyNav()`, drives `switchGen()` on a family change within Camera Settings, and writes the URL hash (push or replace — see Routing above).
- `applyHash()` — parses `location.hash` and calls `navigate()` with the parsed segments, setting the `navCanonicalising` flag so the resulting hash write replaces rather than pushes.
- `navToHash()` — builds the canonical hash string for the current `NAV` state (the inverse of `applyHash()`'s parsing).
- `applyNav()` — toggles `.on` classes on every `[data-section]`/`[data-view]`/`[data-subview]`/`.pane`/`.inner-pane` element to match `NAV`, shows/hides the sidebar and family picker, and finishes by calling `renderCurrentView()`.
- `renderCurrentView()` — dispatches to `renderHome()` when `NAV.section === 'home'`, otherwise looks up and calls the matching entry in `NAV_RENDER[NAV.view]`.
- `renderHome()` — rebuilds the Home landing page (`#pane-home`) on every visit: bio, a recent-photos strip from `GALLERY_PHOTOS`, and two door cards (Photography photo count, Camera Settings recipe/family count from `RECIPE_FAMILIES`). Degrades gracefully if `gallery.js`/`gear.js`/a recipe file didn't load.

### Recipe cards and modal

- `makeCard(r)` (`recipes-ui.js`) — creates a full expandable recipe card. Delegates to `makeOmCard(r, div)` immediately when `activeGen === 'OM'`; otherwise renders the Fuji-shaped card with fingerprint SVG, settings table, keyword chips, source link, and a badge row `[Film Sim] [DR] [warmth] [punch]` using `warmthClass`/`punchClass`. Card shows expanded when it has class `.open`.
- `makeOmCard(r, div)` (`recipes-ui.js`) — OM-specific card renderer: pill row from `contrast/sharpness/highlights/shadows/midtones/exposure_compensation` plus any non-zero `color_wheel` channels, settings table from the full OM field set (including monochrome fields when present), badges `[recipe_type] [warmth] [punch]`, and a Compare button wired to the shared `onCompareCardClick()`.
- `openRecipeModal(name)` (defined in `index.html`'s trailing script) — looks up recipe by exact `name` in `activeRecipes()`, calls `makeCard(r)`, shows it in the `#recipe-modal` overlay. Called from custom slot sim items and single-slot "View recipe details" buttons.
- `goRecipe(name)` (`recipes-ui.js`) — navigates to Camera Settings ▸ Recipes and filters by exact recipe name.
- `fingerprint(r)` (`recipes-ui.js`) — generates inline SVG radar visual for a recipe's numeric settings (5-axis Fuji radar: `highlight/shadow/color/color_chrome_effect/color_chrome_fx_blue`). Fuji-only — never called when `activeGen === 'OM'`, since `makeCard()` delegates to `makeOmCard()` before reaching it.
- `wbMiniGrid(r)` (`recipes-ui.js`) — Fuji WB-shift diamond grid (reads `wb_shift_red/blue`); returns `''` when `activeGen === 'OM'`.

### Photography realm (`personal-ui.js`)

- `renderCustomSlots()` — renders `MY_CUSTOM_SLOTS` with a C1–C7 sub-tab bar; one pane visible at a time.
- `renderGear()` — reads `MY_CAMERAS` / `MY_LENSES`; prepends `<img class="gear-img">` when `item.image` is set.

### Explore tab functions (`recipes-ui.js`; `docs/explore.md` has the full design)
- `initExplore()` — builds the entire Explore tab once, guarded by `exploreBuilt`. Invoked via `NAV_RENDER.explore` (`nav.js`) when Camera Settings ▸ Explore becomes active.
- `computeSimilarity(t)` — returns `activeRecipes()` sorted by normalized Euclidean distance from `t`. Pure function.
- `recipeToT(r)` — maps a recipe object to the `T` state shape (numeric values, 0/1/2 for CC/grain, etc).
- `buildRadarPane()` — builds the 5-axis draggable radar (HL, SH, COL, CCE, CCB). Zero-centered scale: middle ring = 0, outer = max positive, center = max negative.
- `updateRadarOverlay()` — redraws both polygons (yours + ghost), value pill labels, delta pills, updates legend toggle state.
- `buildWbGrid()` — builds WB shift SVG with gold diamond (yours) + blue crosshair (match) dots, both with value labels.
- `syncExploreControls()` — pushes `T` state into all controls (compact steppers, DR/grain toggles, WB dot positions).
- `expDebounce()` — 80ms debounce; called on every `T` mutation to trigger `renderExploreResults()` + `updateRadarOverlay()`.

## MY_CUSTOM_SLOTS structure

Each slot in `MY_CUSTOM_SLOTS` is either `type: "multi"` or `type: "single"`:

```js
// Multi (C1, C2) — one base config, many film simulations
{
  slot: "C1", camera: "both", name: "...", source_url: "...", type: "multi",
  description: "...", usage: "...", pros: [...], cons: [...],
  base_settings: [["Dynamic Range", "DR400"], ...],
  simulations: [
    { film_sim: "Provia/STD", label: "Universal Provia",
      recipe_name: "Universal Provia",   // must exactly match RECIPES[].name
      character: "..." },
    ...
  ]
}

// Single (C3–C7) — one recipe per slot
{
  slot: "C4", camera: "both", name: "...", source_url: "...", type: "single",
  recipe_name: "Kodachrome 64",          // must exactly match RECIPES[].name; optional
  description: "...", usage: "...", pros: [...], cons: [...],
  settings: [["Film Sim", "Classic Chrome"], ...],
  filter_variants: [...]                 // optional; used by C7 for Acros filter guide
}
```

`recipe_name` must **exactly** match a `name` field in the active generation's recipe array. Browse the Recipes tab to find exact names.

## MY_CUSTOM_SETUPS structure

`MY_CUSTOM_SETUPS` (`gear.js`) is an object keyed by exact `MY_CAMERAS[].name` strings (e.g. `"Fujifilm X-T50"`, `"Olympus PEN-F"`, `"Fujifilm X-M5"`). Each entry has a `type`:
- `"fuji-slots"` — delegates to the unchanged `renderCustomSlots()` (X-T50, uses `MY_CUSTOM_SLOTS`; `personal-ui.js`)
- `"om-dial"` — PEN-F: `modes`/`colorProfiles`/`monoProfiles` rendered by `renderMyCustomSetup()`/`renderSetupCameraPane()` (`personal-ui.js`); each color/mono profile card is built via `buildOmVisual()` (`recipes-ui.js`)
- `"empty"` — placeholder (X-M5, no custom setup yet)

`buildOmVisual(obj)` (`recipes-ui.js`) is the shared OM display standard — 12-point color wheel + WB box + tone rows — used both by real `RECIPES_OM` cards (`makeOmCard()`) and by hand-authored PEN-F profile objects in `MY_CUSTOM_SETUPS`.

## Gear images

Product photos live in `images/gear/` and are committed to the repo. Naming convention: `x-m5.jpg`, `xf35f14.webp`, etc. Reference them in `gear.js` as `image: "images/gear/x-m5.jpg"`.

## Recipe modal

`#recipe-modal` is a fixed overlay (`.rmodal`) that displays a full recipe card when triggered. It:
- Opens via `openRecipeModal(name)` — callable from anywhere
- Closes via ✕ button, clicking the backdrop, or Escape key
- On mobile (≤680px) goes full-screen with no border radius
- Forces `.cexpand` visible so the full card detail shows immediately

## Layout structure

The viewport is locked to `100vh` (`html, body, .app { height: 100vh; overflow: hidden }`). All scrolling happens inside `.content-scroll`.

```
.app (100vh, flex column)
  header (sticky, ~53px)
  main (flex row, flex:1, min-height:0)
    .sidebar (collapsible, desktop only)
    .content (flex column, flex:1)
      .content-sticky  ← tab bar, position:sticky top:0, z-index:100
      .content-scroll  ← overflow-y:auto, holds all panes
        .inner-subtabs ← position:sticky top:0 inside scroll, pill buttons
        .inner-pane    ← padding-top:16px
```

**Do not** add `overflow` or `height` to `.app`/`main`/`.content` without understanding this chain — breaking it will cause sticky tabs to stop working.

## Sidebar

- Desktop: `width:240px`, collapses to `36px` via `.sidebar.collapsed` + chevron button (`#sb-collapse-btn`)
- Mobile (≤680px): `position:fixed`, `width:0` by default, opens as overlay (`.sidebar.open`) with a backdrop (`#sb-overlay`)
- Sidebar content is wrapped in `.sb-inner` (scrollable). The collapse button is a full-width strip pinned to the bottom with a top border.
- Info popovers on filter labels (Warmth, Punch, Mood, Scenario, Era) are wired in `initBadgeFormula()` via `[data-formula]` buttons.

## View toggle (Recipes view)

The **Visual / Cheatsheet** toggle (`#header-view-toggle`) lives in the header, right of the stats pill. `applyNav()` (`nav.js`) shows it only when `NAV.view === 'recipes'` (Camera Settings ▸ Recipes); it is hidden for every other view. Cheatsheet mode adds `.cheatsheet` to `#grid`, which hides `.card-img-fp`, `.cpills`, `.cnarr` and forces `.cexpand` visible.

## Responsive breakpoints

- `≤1024px` — tablet: sidebar narrows to 200px, tabs scroll horizontally
- `≤680px` — phone: sidebar becomes a fixed overlay opened by `.mob-filter-btn`; single-column layouts

## Key conventions

- All DOM queries use `const $ = id => document.getElementById(id)` (defined in `index.html`'s first inline `<script>` block, before `recipes-ui.js`/`personal-ui.js` load, since both modules use `$` at call time).
- Filter logic lives entirely in `matches(r)` (`recipes-ui.js`).
- `filtered()` is `() => activeRecipes().filter(matches)` (`recipes-ui.js`) — called fresh on every render.
- Build-once flags (`galleryBuilt`, `gearBuilt`, `mySetupBuilt` in `personal-ui.js`; `settingsBuilt`, `exploreBuilt`, `compareBuilt` in `recipes-ui.js`) prevent re-rendering a view's DOM on every visit; `switchGen()` resets the Camera Settings ones so switching families rebuilds.
- **User data lives in `gear.js`**, not in `index.html`.
- Adding a new view: add a `<div class="tab" data-view="...">` inside the right section's `.view-tabs` bar, an entry in `NAV_VIEWS[section]` (`nav.js`), a `.pane pane-no-subtabs` div (or a `.pane` with `.inner-subtabs`/`.inner-pane`s if it needs subviews), a `renderXxx()` function in `recipes-ui.js` or `personal-ui.js`, and a matching entry in `NAV_RENDER` (`nav.js`). There is no `switchTab()`/`switchInnerTab()` to add a case to — `navigate()` and `NAV_RENDER` replace both.
- Adding a new filter facet: chip container in sidebar + key in `S` + `buildChips()` call in `initChips()` + condition in `matches()` (all `recipes-ui.js`).
- Adding a new recipe family/generation: create `recipes-<gen>.js` defining `var RECIPES_<GEN> = [...]`, add `<option value="<GEN>">` to `#gen-select`, add a `{ id, label, count }` entry to `RECIPE_FAMILIES` (`nav.js`), and leave it out of the eager `RECIPE_POOLS` literal (`recipes-ui.js`) so `loadGen()`'s existing lazy-load path picks it up unchanged. If the new family's schema diverges from Fuji's (as OM's does), branch on `activeGen === '<GEN>'` in `makeCard()`/`fingerprint()`/`wbMiniGrid()` and add "not available" guards to any Fuji-shaped analysis view rather than trying to make one schema fit both.
- Sidebar filter sections are collapsible — `.sb-section` divs with a `.chips` child get a ▾/▸ toggle via `initCollapsibleFilters()`. Sections without `.chips` (e.g. Search) must have class `no-collapse` on their `.sb-label` to suppress the chevron CSS.

## Skills

Skills live in `.claude/skills/` (invocable by Claude Code) and are mirrored as docs in `docs/skills/`. Both are committed to the repo.

- **`/sync-recipes`** — Fetch fujixweekly.com recipe lists for a chosen X-Trans generation, diff against the relevant `recipes-[gen].js` file, and produce a ready-to-paste JS patch for new or changed recipes.
- **`/update-harness`** — Audit `index.html`, `gear.js`, and all `docs/` files, then rewrite stale sections of `CLAUDE.md` to reflect the current architecture, functions, CSS conventions, and data shape.
- **`/gallery`** — Review the photo gallery and add or remove Lightroom albums through conversation. Regenerates `gallery.js`.

## What NOT to commit

`.gitignore` blocks these — do not force-add them:
- `.claude/settings.local.json` — machine-local Claude Code settings (may contain personal permissions)
- `PLAN-*.md` — local planning documents
- `.superpowers/` — SDD scratch (task ledgers, briefs, review packages) for this Claude Code workflow
- `__pycache__/` — Python bytecode from `tools/`

Note: `.claude/settings.json` (shared plugin config) and `.claude/skills/` **are** committed — only
`settings.local.json` is ignored.

Note: `recipes-v.js`, `recipes-iv.js`, `recipes-iii.js`, `recipes-ii.js`, `recipes-i.js`, `recipes-om.js`, `corr-data.js`, `om-analysis.js`, `gallery.js`, `nav.js`, `recipes-ui.js`, and `personal-ui.js` are **committed** to the repo — they are not gitignored. Do not add them to `.gitignore`. `gallery.js` is generated by `tools/build_gallery.py`; commit it, but never hand-edit it.

## Git / PR workflow

- Remote: `github.com:Junqing/junqing.github.io`
- Git identity: set in local git config (not committed)
- **Do not use the `gh` CLI on this machine** — it is authenticated to a different GitHub account. Push branches with plain `git` and let Jin open the PR.
- Main branch deploys automatically to GitHub Pages

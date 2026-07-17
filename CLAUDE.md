# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a GitHub Pages site hosting a **Fujifilm X-Trans Recipe Explorer** — a single-file SPA with no build process. The main application lives in `index.html` (served at the site root by GitHub Pages), with recipe data in per-generation files (`recipes-v.js`, etc.) and personal gear data in `gear.js`.

## Running / Previewing

No build step. Serve locally (required for `gear.js` to load via `<script src>`):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

No package.json, no npm, no bundler.

## Architecture

`index.html` contains inline CSS (`<style>`), inline HTML structure, and inline `<script>` — one file for the core app. It loads external files in this order:

```html
<script src="recipes-v.js"></script>  <!-- active generation loaded first; others lazy-loaded -->
<script src="gear.js"></script>       <!-- loaded before the main inline script -->
```

**`gear.js`** defines five plain globals:
- `MY_CAMERAS` — camera bodies with specs and `image` field pointing to `images/gear/`
- `MY_LENSES` — lenses with specs and `image` field
- `MY_CUSTOM_SLOTS` — C1–C7 custom recipe slots (see below)
- `MY_RECIPES` — currently empty `[]`; reserved for future use
- `RECIPE_META_PATCHES` — override computed badge labels per recipe. Keys must exactly match `RECIPES[].name`. Supported fields: `warmth_override` (`'warm'|'neutral'|'cool'`), `punch_override` (`'punchy'|'balanced'|'flat'`). Currently empty — add entries here when the formula misfires on a specific recipe.

This file is intentionally human-readable and editable directly on GitHub. If it fails to load (e.g. `file://` without a server), all personal tabs show a graceful empty state.

**Data layer** — Recipe data is split into per-generation files at the repo root:
- `recipes-v.js` — defines `RECIPES_V` (X-Trans V, ~113 recipes); loaded at page start
- `recipes-iv.js` — defines `RECIPES_IV` (X-Trans IV, ~202 recipes)
- `recipes-iii.js` — defines `RECIPES_III` (X-Trans III, ~47 recipes)
- `recipes-ii.js` — defines `RECIPES_II` (X-Trans II, ~32 recipes)
- `recipes-i.js` — defines `RECIPES_I` (X-Trans I, ~13 recipes)

Generation files II–IV are lazy-loaded on first switch via `loadGen(gen)`. The active pool is always accessed via `activeRecipes()` (returns `window['RECIPES_' + activeGen]`).

Each recipe object has:
- Camera settings: `film_simulation`, `grain_effect`, `color_chrome_effect`, `color_chrome_fx_blue`, `white_balance`, `wb_shift_red/blue`, `dynamic_range`, `highlight`, `shadow`, `color`, `sharpness`, `clarity`, `iso_max`, `exposure_compensation`
- Metadata: `name`, `filename`, `source_url`, `narrative`
- Classification: `mood_keywords[]`, `scenario_keywords[]`, `color_direction` (legacy, not read by UI), `era_reference`, `film_emulated`

**Badge classification** — two pure functions replace the old `color_direction` badge:
- `recipeWarmth(r)` → `'warm' | 'neutral' | 'cool'` — derived from WB kelvin, WB shift (R−B), film sim bias
- `recipePunch(r)` → `'punchy' | 'balanced' | 'flat'` — derived from Color dial, Clarity, highlight/shadow spread
- Override fields: add `warmth_override` / `punch_override` to `RECIPE_META_PATCHES` in `gear.js`
- Helper maps: `WARMTH_CLASS`, `PUNCH_CLASS`, `warmthClass(r)`, `punchClass(r)`
- B&W sims always return `'neutral'` warmth (WB irrelevant on monochrome)

**State** — a single `S` object holds active filter state (search query + chip selections). Filter sets: `S.f.sim`, `S.f.warmth`, `S.f.punch`, `S.f.mood`, `S.f.scene`, `S.f.era` — note `S.f.dir` no longer exists (replaced by warmth + punch).

`activeGen` (string, default `"V"`) tracks the currently selected X-Trans generation. `activeRecipes()` returns `window['RECIPES_' + activeGen] || []`. A `<select id="gen-select">` dropdown in the header lets the user switch generations; switching calls `switchGen(gen)` which lazy-loads the file if needed, resets `S` state, clears `exploreBuilt`, and re-renders.

**Rendering pipeline**:
1. `init()` bootstraps chip filters and tab listeners, calls `render()`
2. `render()` calls `filtered()` (applies `S` to `activeRecipes()`), delegates to active tab's render function
3. Each tab has its own render function (see tab list below)

## Tabs (current order)

| Tab label | `data-tab` | Render function | Notes |
|-----------|-----------|-----------------|-------|
| My Recipes | `myrecipes` | `renderMyRecipes()` | Calls `renderCustomSlots()` first |
| My Gear | `gear` | `renderGear()` | |
| Recipes | `grid` | `renderGrid()` | Formerly "Grid" |
| Settings Guide | `settings` | `renderSettingsGuide()` | |
| Keywords | `clouds` | `renderClouds()` | |
| Directions | `directions` | `renderDirections()` | |
| Correlation | `correlations` | `renderCorrelations()` | |
| Explore | `explore` | `initExplore()` | See `docs/explore.md` for full design |

Charts tab and `renderCharts()` / `renderSaveSlots()` still exist in the codebase but are not in the tab bar. Do not remove the code — just leave it unused.

## Key functions

- `makeCard(r)` — creates a full expandable recipe card with fingerprint SVG, settings table, keyword chips, source link. Badge row shows `[Film Sim] [DR] [warmth] [punch]` using `warmthClass`/`punchClass`. Card shows expanded when it has class `.open`.
- `openRecipeModal(name)` — looks up recipe by exact `name` in `activeRecipes()`, calls `makeCard(r)`, shows it in the `#recipe-modal` overlay. Called from custom slot sim items and single-slot "View recipe details" buttons.
- `goRecipe(name)` — switches to Recipes tab and filters by exact recipe name.
- `fingerprint(r)` — generates inline SVG radar visual for a recipe's numeric settings.
- `renderCustomSlots()` — renders `MY_CUSTOM_SLOTS` with a C1–C7 sub-tab bar; one pane visible at a time.
- `renderGear()` — reads `MY_CAMERAS` / `MY_LENSES`; prepends `<img class="gear-img">` when `item.image` is set.

### Explore tab functions (`docs/explore.md` has the full design)
- `initExplore()` — builds the entire Explore tab once, guarded by `exploreBuilt`. Called by `switchTab('explore')`.
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

## View toggle (Recipes tab)

The **Visual / Cheatsheet** toggle (`#tabs-end-toggle`) lives in the right end of the main tab bar. It is shown/hidden by `switchTab()` — only visible when the Recipes tab is active. Cheatsheet mode adds `.cheatsheet` to `#grid`, which hides `.card-img-fp`, `.cpills`, `.cnarr` and forces `.cexpand` visible.

## Responsive breakpoints

- `≤1024px` — tablet: sidebar narrows to 200px, tabs scroll horizontally
- `≤680px` — phone: sidebar becomes a fixed overlay opened by `.mob-filter-btn`; single-column layouts

## Key conventions

- All DOM queries use `const $ = id => document.getElementById(id)`.
- Filter logic lives entirely in `matches(r)`.
- `filtered()` is `() => activeRecipes().filter(matches)` — called fresh on every render.
- Build-once flags (`gearBuilt`, `myRecipesBuilt`) prevent re-rendering personal tabs on every switch.
- **User data lives in `gear.js`**, not in `index.html`.
- Adding a new tab: HTML pane div + tab entry in `.tabs` + `renderXxx()` function + case in `switchTab()`. If the tab has no inner-subtabs, add class `pane-no-subtabs` for correct top padding.
- Adding a new filter facet: chip container in sidebar + key in `S` + `buildChips()` call in `initChips()` + condition in `matches()`.
- Sidebar filter sections are collapsible — `.sb-section` divs with a `.chips` child get a ▾/▸ toggle via `initCollapsibleFilters()`. Sections without `.chips` (e.g. Search) must have class `no-collapse` on their `.sb-label` to suppress the chevron CSS.

## Skills

Skills live in `.claude/skills/` (invocable by Claude Code) and are mirrored as docs in `docs/skills/`. Both are committed to the repo.

- **`/sync-recipes`** — Fetch fujixweekly.com recipe lists for a chosen X-Trans generation, diff against the relevant `recipes-[gen].js` file, and produce a ready-to-paste JS patch for new or changed recipes.
- **`/update-harness`** — Audit `index.html`, `gear.js`, and all `docs/` files, then rewrite stale sections of `CLAUDE.md` to reflect the current architecture, functions, CSS conventions, and data shape.

## What NOT to commit

`.gitignore` blocks these — do not force-add them:
- `.claude/` — Claude Code local settings (may contain personal permissions)
- `PLAN-*.md` — local planning documents

Note: `recipes-v.js`, `recipes-iv.js`, `recipes-iii.js`, `recipes-ii.js`, and `recipes-i.js` are **committed** to the repo — they are not gitignored. Do not add them to `.gitignore`.

## Git / PR workflow

- Remote: `github.com:Junqing/junqing.github.io`
- Git identity: set in local git config (not committed)
- PRs created with `gh pr create`; always include a test plan checklist in the body
- Main branch deploys automatically to GitHub Pages
- `feature/keyword-tags-revision` — PR open: two computed badge system (warmth/punch), collapsible sidebar filters, Settings Guide formula section

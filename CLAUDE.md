# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a GitHub Pages site hosting a recipe explorer for two distinct camera recipe families — **Fujifilm X-Trans** (film simulation recipes) and **OM System/Olympus** (color-wheel recipes from om-recipes.com) — as a single-file SPA with no build process. The main application lives in `index.html` (served at the site root by GitHub Pages), with recipe data in per-generation/family files (`recipes-v.js`, `recipes-om.js`, etc.) and personal gear data in `gear.js`.

**The two recipe families are architecturally separate and must stay that way.** Fuji recipes (`RECIPES_V/IV/III/II/I`) use a film-simulation-based schema; OM recipes (`RECIPES_OM`) use a 12-point color-wheel schema. They share zero field names by design. Do not merge, cross-reference, or generalize the two schemas — when adding recipe-family-aware code, branch explicitly on `activeGen === 'OM'` rather than trying to unify field access.

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

Generation files II–IV and OM are lazy-loaded on first switch via `loadGen(gen)` (fetches `recipes-<gen.toLowerCase()>.js`, e.g. `recipes-om.js` for `gen === 'OM'`). The active pool is always accessed via `activeRecipes()`, which returns `RECIPE_POOLS[activeGen] || []` (`RECIPE_POOLS` is populated eagerly for V and lazily for everything else).

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

**State** — a single `S` object holds active filter state (search query + chip selections). Filter sets: `S.f.sim`, `S.f.warmth`, `S.f.punch`, `S.f.mood`, `S.f.scene`, `S.f.era` — note `S.f.dir` no longer exists (replaced by warmth + punch).

`activeGen` (string, default `"V"`) tracks the currently selected recipe family/generation — one of `V`, `IV`, `III`, `II`, `I`, `OM`. `activeRecipes()` returns `RECIPE_POOLS[activeGen] || []`. A `<select id="gen-select">` dropdown in the header (labeled "Recipe family") lets the user switch; switching calls `switchGen(gen)` which lazy-loads the file if needed, resets `S` state, clears `exploreBuilt`, and re-renders.

**Rendering pipeline**:
1. `init()` bootstraps chip filters and tab listeners, calls `render()`
2. `render()` calls `filtered()` (applies `S` to `activeRecipes()`), delegates to active tab's render function
3. Each tab has its own render function (see tab list below)

## Tabs (current structure)

Top-level tabs live in `.tabs` (`data-tab` on each `.tab` div); most contain **inner-subtabs** (pill buttons, `.inner-subtab`/`.inner-pane`, wired via `switchInnerTab(innerPaneId)`) rather than being flat single-pane tabs.

| Top-level tab | `data-tab` | Inner subtabs (`data-inner`) | Render function(s) |
|---|---|---|---|
| My | `my` | My Recipes (`inner-my-recipes`), My Gear (`inner-my-gear`), Scenario Cases (`inner-my-scenarios`) | `renderMyRecipes()` + `renderCustomSlots()`, `renderGear()`, `renderScenarios()` |
| Recipes | `grid` | Recipes (`inner-recipes-list`), Keywords (`inner-recipes-keywords`) | `renderGrid()`, `renderClouds()` |
| Insights | `insights` | Settings Guide (`inner-insights-settings`), Directions (`inner-insights-directions`), Correlation (`inner-insights-correlations`) | `renderSettingsGuide()`, `renderDirections()`, `renderCorrelations()` |
| Explore | `explore` | — (`pane-no-subtabs`) | `initExplore()`; see `docs/explore.md` |
| Compare | `compare` | — (`pane-no-subtabs`) | `initCompare()` / `renderCompare()` |

Tab switching goes through `switchTab(id, innerPaneId)` (`index.html`), which toggles `.on` classes on `.tab`/`.pane` and dispatches to the relevant render/init call; `switchInnerTab(innerPaneId)` does the same for inner panes within the active tab.

**OM recipe family scope**: when `activeGen === 'OM'`, only the Recipes grid (with OM-appropriate cards/badges) and My Gear are fully functional. Settings Guide, Directions, Correlation, Explore, and Compare all detect `activeGen === 'OM'` early in their render/init functions and show a `.empty` "not available for the OM recipe family yet" state instead of attempting to render Fuji-shaped analysis against OM data. Each of these guards resets its own build-once flag (`settingsBuilt`, `exploreBuilt`, `compareBuilt`) so switching back to a Fuji generation rebuilds normally rather than staying stuck on the empty state.

Charts tab and `renderCharts()` / `renderSaveSlots()` still exist in the codebase but are not in the tab bar. Do not remove the code — just leave it unused.

## Key functions

- `makeCard(r)` — creates a full expandable recipe card. Delegates to `makeOmCard(r, div)` immediately when `activeGen === 'OM'`; otherwise renders the Fuji-shaped card with fingerprint SVG, settings table, keyword chips, source link, and a badge row `[Film Sim] [DR] [warmth] [punch]` using `warmthClass`/`punchClass`. Card shows expanded when it has class `.open`.
- `makeOmCard(r, div)` — OM-specific card renderer: pill row from `contrast/sharpness/highlights/shadows/midtones/exposure_compensation` plus any non-zero `color_wheel` channels, settings table from the full OM field set (including monochrome fields when present), badges `[recipe_type] [warmth] [punch]`. No Compare button (Compare is Fuji-only for now).
- `openRecipeModal(name)` — looks up recipe by exact `name` in `activeRecipes()`, calls `makeCard(r)`, shows it in the `#recipe-modal` overlay. Called from custom slot sim items and single-slot "View recipe details" buttons.
- `goRecipe(name)` — switches to Recipes tab and filters by exact recipe name.
- `fingerprint(r)` — generates inline SVG radar visual for a recipe's numeric settings. Early-returns a simplified neutral SVG (just "OM" + `recipe_type` text) when `activeGen === 'OM'`, since the 5-axis Fuji radar axes (`highlight/shadow/color/color_chrome_effect/color_chrome_fx_blue`) don't exist on OM recipes.
- `wbMiniGrid(r)` — Fuji WB-shift diamond grid (reads `wb_shift_red/blue`); returns `''` when `activeGen === 'OM'`.
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
- Adding a new tab: HTML pane div + tab entry in `.tabs` + `renderXxx()` function + case in `switchTab()`. If the tab has no inner-subtabs, add class `pane-no-subtabs` for correct top padding. If the tab has inner-subtabs, wire them through `switchInnerTab()` instead (see current tabs for the pattern).
- Adding a new filter facet: chip container in sidebar + key in `S` + `buildChips()` call in `initChips()` + condition in `matches()`.
- Adding a new recipe family/generation: create `recipes-<gen>.js` defining `var RECIPES_<GEN> = [...]`, add `<option value="<GEN>">` to `#gen-select`, and leave it out of the eager `RECIPE_POOLS` literal so `loadGen()`'s existing lazy-load path picks it up unchanged. If the new family's schema diverges from Fuji's (as OM's does), branch on `activeGen === '<GEN>'` in `makeCard()`/`fingerprint()`/`wbMiniGrid()` and add "not available" guards to any Fuji-shaped analysis tab rather than trying to make one schema fit both.
- Sidebar filter sections are collapsible — `.sb-section` divs with a `.chips` child get a ▾/▸ toggle via `initCollapsibleFilters()`. Sections without `.chips` (e.g. Search) must have class `no-collapse` on their `.sb-label` to suppress the chevron CSS.

## Skills

Skills live in `.claude/skills/` (invocable by Claude Code) and are mirrored as docs in `docs/skills/`. Both are committed to the repo.

- **`/sync-recipes`** — Fetch fujixweekly.com recipe lists for a chosen X-Trans generation, diff against the relevant `recipes-[gen].js` file, and produce a ready-to-paste JS patch for new or changed recipes.
- **`/update-harness`** — Audit `index.html`, `gear.js`, and all `docs/` files, then rewrite stale sections of `CLAUDE.md` to reflect the current architecture, functions, CSS conventions, and data shape.

## What NOT to commit

`.gitignore` blocks these — do not force-add them:
- `.claude/` — Claude Code local settings (may contain personal permissions)
- `PLAN-*.md` — local planning documents

Note: `recipes-v.js`, `recipes-iv.js`, `recipes-iii.js`, `recipes-ii.js`, `recipes-i.js`, and `recipes-om.js` are **committed** to the repo — they are not gitignored. Do not add them to `.gitignore`.

## Git / PR workflow

- Remote: `github.com:Junqing/junqing.github.io`
- Git identity: set in local git config (not committed)
- PRs created with `gh pr create`; always include a test plan checklist in the body
- Main branch deploys automatically to GitHub Pages
- `feature/keyword-tags-revision` — PR open: two computed badge system (warmth/punch), collapsible sidebar filters, Settings Guide formula section

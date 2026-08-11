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

**State** — a single `S` object holds active filter state (search query + chip selections). Filter sets: `S.f.sim`, `S.f.warmth`, `S.f.punch`, `S.f.mood`, `S.f.scene`, `S.f.era`, plus the OM-only `S.f.type` and `S.f.hue` — note `S.f.dir` no longer exists (replaced by warmth + punch).

`activeGen` (string, default `"V"`) tracks the currently selected recipe family/generation — one of `V`, `IV`, `III`, `II`, `I`, `OM`. `activeRecipes()` returns `RECIPE_POOLS[activeGen] || []`. A `<select id="gen-select">` dropdown in the header (labeled "Recipe family") lets the user switch; switching calls `switchGen(gen)` which lazy-loads the file if needed, resets `S` state, clears `exploreBuilt`, and re-renders.

**Rendering pipeline**:
1. `init()` bootstraps chip filters and tab listeners, calls `render()`
2. `render()` calls `filtered()` (applies `S` to `activeRecipes()`), delegates to active tab's render function
3. Each tab has its own render function (see tab list below)

## Tabs (current structure)

Top-level tabs live in `.tabs` (`data-tab` on each `.tab` div); most contain **inner-subtabs** (pill buttons, `.inner-subtab`/`.inner-pane`, wired via `switchInnerTab(innerPaneId)`) rather than being flat single-pane tabs.

| Top-level tab | `data-tab` | Inner subtabs (`data-inner`) | Render function(s) |
|---|---|---|---|
| My | `my` | My Custom Setup (`inner-my-setup`), My Gear (`inner-my-gear`), Scenario Cases (`inner-my-scenarios`) | `renderMyCustomSetup()` (dispatches to `renderCustomSlots()` for X-T50, or renders PEN-F modes/profiles via `buildOmVisual()`, or an empty state for X-M5), `renderGear()`, `renderScenarios()` |
| Recipes | `grid` | Recipes (`inner-recipes-list`), Keywords (`inner-recipes-keywords`) | `renderGrid()`, `renderClouds()` |
| Insights | `insights` | Settings Guide (`inner-insights-settings`), Directions (`inner-insights-directions`), Correlation (`inner-insights-correlations`) | `renderSettingsGuide()`, `renderDirections()`, `renderCorrelations()` |
| Explore | `explore` | — (`pane-no-subtabs`) | `initExplore()`; see `docs/explore.md` |
| Compare | `compare` | — (`pane-no-subtabs`) | `initCompare()` / `renderCompare()` |

Tab switching goes through `switchTab(id, innerPaneId)` (`index.html`), which toggles `.on` classes on `.tab`/`.pane` and dispatches to the relevant render/init call; `switchInnerTab(innerPaneId)` does the same for inner panes within the active tab.

**OM recipe family scope**: every tab now has an OM implementation. Settings Guide, Directions, Correlation, Explore, and Compare each detect `activeGen === 'OM'` early in their render/init function and delegate to the matching `renderOmX()` / `initOmX()` in **`om-analysis.js`**, falling back to the old `.empty` "not available" state only if that file failed to load (each dispatch is wrapped in `typeof fn === 'function'`). Each guard resets its own build-once flag (`settingsBuilt`, `exploreBuilt`, `compareBuilt`) so switching families rebuilds rather than staying stuck.

## om-analysis.js

All OM-specific analysis lives in `om-analysis.js`, loaded **before** `gear.js` and before the inline script. `index.html` keeps only thin dispatch lines. The two recipe families stay architecturally separate — no Fuji code path reaches this file.

```html
<script src="om-analysis.js"></script>
<script src="gear.js"></script>
```

**Load-order rule:** `om-analysis.js` parses before `index.html`'s inline script, so nothing in it may touch an index.html global at parse time — only inside function bodies. `OM_WHEEL_ORDER` / `OM_WHEEL_ABBR` are therefore *defined here and consumed by index.html* (which keeps `typeof`-guarded fallback copies), not the reverse.

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

Charts tab and `renderCharts()` / `renderSaveSlots()` still exist in the codebase but are not in the tab bar. Do not remove the code — just leave it unused.

## Key functions

- `makeCard(r)` — creates a full expandable recipe card. Delegates to `makeOmCard(r, div)` immediately when `activeGen === 'OM'`; otherwise renders the Fuji-shaped card with fingerprint SVG, settings table, keyword chips, source link, and a badge row `[Film Sim] [DR] [warmth] [punch]` using `warmthClass`/`punchClass`. Card shows expanded when it has class `.open`.
- `makeOmCard(r, div)` — OM-specific card renderer: pill row from `contrast/sharpness/highlights/shadows/midtones/exposure_compensation` plus any non-zero `color_wheel` channels, settings table from the full OM field set (including monochrome fields when present), badges `[recipe_type] [warmth] [punch]`, and a Compare button wired to the shared `onCompareCardClick()`.
- `openRecipeModal(name)` — looks up recipe by exact `name` in `activeRecipes()`, calls `makeCard(r)`, shows it in the `#recipe-modal` overlay. Called from custom slot sim items and single-slot "View recipe details" buttons.
- `goRecipe(name)` — switches to Recipes tab and filters by exact recipe name.
- `fingerprint(r)` — generates inline SVG radar visual for a recipe's numeric settings (5-axis Fuji radar: `highlight/shadow/color/color_chrome_effect/color_chrome_fx_blue`). Fuji-only — never called when `activeGen === 'OM'`, since `makeCard()` delegates to `makeOmCard()` before reaching it.
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

## MY_CUSTOM_SETUPS structure

`MY_CUSTOM_SETUPS` (`gear.js`) is an object keyed by exact `MY_CAMERAS[].name` strings (e.g. `"Fujifilm X-T50"`, `"Olympus PEN-F"`, `"Fujifilm X-M5"`). Each entry has a `type`:
- `"fuji-slots"` — delegates to the unchanged `renderCustomSlots()` (X-T50, uses `MY_CUSTOM_SLOTS`)
- `"om-dial"` — PEN-F: `modes`/`colorProfiles`/`monoProfiles` rendered by `renderMyCustomSetup()`/`renderSetupCameraPane()` (`index.html`); each color/mono profile card is built via `buildOmVisual()`
- `"empty"` — placeholder (X-M5, no custom setup yet)

`buildOmVisual(obj)` (`index.html`) is the shared OM display standard — 12-point color wheel + WB box + tone rows — used both by real `RECIPES_OM` cards (`makeOmCard()`) and by hand-authored PEN-F profile objects in `MY_CUSTOM_SETUPS`.

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
- Build-once flags (`gearBuilt`, `mySetupBuilt`) prevent re-rendering personal tabs on every switch.
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
- `.claude/settings.local.json` — machine-local Claude Code settings (may contain personal permissions)
- `PLAN-*.md` — local planning documents

Note: `.claude/settings.json` (shared plugin config) and `.claude/skills/` **are** committed — only
`settings.local.json` is ignored.

Note: `recipes-v.js`, `recipes-iv.js`, `recipes-iii.js`, `recipes-ii.js`, `recipes-i.js`, `recipes-om.js`, and `om-analysis.js` are **committed** to the repo — they are not gitignored. Do not add them to `.gitignore`.

## Git / PR workflow

- Remote: `github.com:Junqing/junqing.github.io`
- Git identity: set in local git config (not committed)
- **Do not use the `gh` CLI on this machine** — it is authenticated to a different GitHub account. Push branches with plain `git` and let Jin open the PR.
- Main branch deploys automatically to GitHub Pages
- `feature/keyword-tags-revision` — PR open: two computed badge system (warmth/punch), collapsible sidebar filters, Settings Guide formula section

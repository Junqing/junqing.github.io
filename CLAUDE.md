# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a GitHub Pages site hosting a **Fujifilm X-Trans V Recipe Explorer** — a single-file SPA with no build process. The main application lives in `index.html` (served at the site root by GitHub Pages), with personal gear and recipe data in the companion file `gear.js`.

## Running / Previewing

No build step. Serve locally (required for `gear.js` to load via `<script src>`):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

No package.json, no npm, no bundler.

## Architecture

`index.html` contains inline CSS (`<style>`), inline HTML structure, and inline `<script>` — one file for the core app. It loads one external file:

```html
<script src="gear.js"></script>   <!-- loaded before the main inline script -->
```

**`gear.js`** defines four plain globals:
- `MY_CAMERAS` — camera bodies with specs and `image` field pointing to `images/gear/`
- `MY_LENSES` — lenses with specs and `image` field
- `MY_CUSTOM_SLOTS` — C1–C7 custom recipe slots (see below)
- `MY_RECIPES` — currently empty `[]`; reserved for future use

This file is intentionally human-readable and editable directly on GitHub. If it fails to load (e.g. `file://` without a server), all personal tabs show a graceful empty state.

**Data layer** — `RECIPES` (~line 490): a large hardcoded JSON array of ~109 recipes. Each recipe object has:
- Camera settings: `film_simulation`, `grain_effect`, `color_chrome_effect`, `color_chrome_fx_blue`, `white_balance`, `wb_shift_red/blue`, `dynamic_range`, `highlight`, `shadow`, `color`, `sharpness`, `clarity`, `iso_max`, `exposure_compensation`
- Metadata: `name`, `filename`, `source_url`, `hero_image`, `gallery_images`, `narrative`
- Classification: `mood_keywords[]`, `scenario_keywords[]`, `color_direction`, `era_reference`, `film_emulated`

**State** — a single `S` object holds active filter state (search query + chip selections).

**Rendering pipeline**:
1. `init()` bootstraps chip filters and tab listeners, calls `render()`
2. `render()` calls `filtered()` (applies `S` to `RECIPES`), delegates to active tab's render function
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

Charts tab and `renderCharts()` / `renderSaveSlots()` still exist in the codebase but are not in the tab bar. Do not remove the code — just leave it unused.

## Key functions

- `makeCard(r)` — creates a full expandable recipe card with hero image, fingerprint SVG, gallery strip, settings table, keyword chips, source link. Card shows expanded when it has class `.open`.
- `openLightbox(imgs, idx)` — full-screen image viewer with prev/next and keyboard nav.
- `openRecipeModal(name)` — looks up recipe by exact `name` in `RECIPES`, calls `makeCard(r)`, shows it in the `#recipe-modal` overlay. Called from custom slot sim items and single-slot "View sample images" buttons.
- `goRecipe(name)` — switches to Recipes tab and filters by exact recipe name.
- `fingerprint(r)` — generates inline SVG radar visual for a recipe's numeric settings.
- `renderCustomSlots()` — renders `MY_CUSTOM_SLOTS` with a C1–C7 sub-tab bar; one pane visible at a time.
- `renderGear()` — reads `MY_CAMERAS` / `MY_LENSES`; prepends `<img class="gear-img">` when `item.image` is set.

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

`recipe_name` must **exactly** match a `name` field in the `RECIPES` array. Browse the Recipes tab to find exact names.

## Gear images

Product photos live in `images/gear/` and are committed to the repo. Naming convention: `x-m5.jpg`, `xf35f14.webp`, etc. Reference them in `gear.js` as `image: "images/gear/x-m5.jpg"`.

## Recipe modal

`#recipe-modal` is a fixed overlay (`.rmodal`) that displays a full recipe card when triggered. It:
- Opens via `openRecipeModal(name)` — callable from anywhere
- Closes via ✕ button, clicking the backdrop, or Escape key
- On mobile (≤680px) goes full-screen with no border radius
- Forces `.cexpand` visible so the full card detail shows immediately

## Responsive breakpoints

- `≤1024px` — tablet: sidebar narrows, tabs scroll horizontally
- `≤680px` — phone: sidebar collapses behind a "Filters" toggle button (`.mob-filter-btn`); single-column layouts

## Key conventions

- All DOM queries use `const $ = id => document.getElementById(id)`.
- Filter logic lives entirely in `matches(r)`.
- `filtered()` is `() => RECIPES.filter(matches)` — called fresh on every render.
- Build-once flags (`gearBuilt`, `myRecipesBuilt`) prevent re-rendering personal tabs on every switch.
- **User data lives in `gear.js`**, not in `index.html`.
- Adding a new tab: HTML pane div + tab entry in `.tabs` + `renderXxx()` function + case in `switchTab()`.
- Adding a new filter facet: chip container in sidebar + key in `S` + `buildChips()` call in `initChips()` + condition in `matches()`.

## What NOT to commit

`.gitignore` blocks these — do not force-add them:
- `.claude/` — Claude Code local settings (may contain personal permissions)
- `PLAN-*.md` — local planning documents

## Git / PR workflow

- Branch: `feature/gear-recipes-responsive` (active working branch)
- Remote: `github.com:Junqing/junqing.github.io`
- Git identity: set in local git config (not committed)
- PRs created with `gh pr create`; always include a test plan checklist in the body
- Main branch deploys automatically to GitHub Pages

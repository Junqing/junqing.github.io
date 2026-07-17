# Multi-Generation X-Trans Recipe Explorer — Design Spec

Date: 2026-07-17
Branch: expand-x-trans-models

## Overview

Expand the app from X-Trans V only to support all five X-Trans generations (I–V). Each generation has its own isolated recipe pool. The active generation is selected via a header dropdown. All recipe-dependent tabs (Recipes, Explore, Keywords, Directions, Correlations, Settings Guide) scope to the active generation.

---

## 1. Data Files

Five separate JS files, one per generation:

```
recipes-i.js    → global RECIPES_I   = [...]
recipes-ii.js   → global RECIPES_II  = [...]
recipes-iii.js  → global RECIPES_III = [...]
recipes-iv.js   → global RECIPES_IV  = [...]
recipes-v.js    → global RECIPES_V   = [...]
```

- The current inline `RECIPES` array in `index.html` moves to `recipes-v.js` verbatim.
- `index.html` removes the inline array entirely.
- Each file is a standalone script that assigns a named global when executed.
- Files are loaded lazily — injected as `<script>` tags on first access.
- `/sync-recipes` targets individual files (e.g. "sync IV" → reads/writes `recipes-iv.js`).

**Field compatibility:** Older generations lack some settings (e.g. no Clarity on X-Trans I/II, no Color Chrome FX Blue on X-Trans I–III). Missing fields are set to `null`. The card table already skips null rows.

---

## 2. Generation State & Active Pool

### New state

```js
let activeGen = "V";  // "I" | "II" | "III" | "IV" | "V"
```

### Active pool helper

```js
function activeRecipes() {
  return window['RECIPES_' + activeGen] || [];
}
```

Replaces every current reference to `RECIPES` in:
- `filtered()` → `activeRecipes().filter(matches)`
- `initChips()` → reads from `activeRecipes()`
- Explore seed dropdown
- Directions, Correlations, Keywords render functions
- Any other tab that iterates the recipe pool

### Switching generation

1. Set `activeGen` to new value
2. Check if `window['RECIPES_' + gen]` is already defined
   - If yes: skip to step 4
   - If no: inject `<script src="recipes-[gen].js">`, disable dropdown during load, wait for `onload`
3. Re-enable dropdown
4. Clear `S` filter state (reset search + all chip sets)
5. Clear `exploreBuilt` flag so Explore rebuilds with the new pool
6. Clear `gearBuilt` and `myRecipesBuilt` are NOT cleared — those tabs are generation-agnostic
7. Call `initChips()` then `render()`

### Generation-agnostic tabs

`myrecipes` and `gear` tabs read `MY_CUSTOM_SLOTS`, `MY_CAMERAS`, `MY_LENSES` from `gear.js` — unaffected by generation switching.

---

## 3. Header & UI

### Title change

`"Fujifilm X-Trans V Recipe Explorer"` → `"Fujifilm X-Trans Recipe Explorer"`

Applies to:
- `<title>` tag
- `<h1>` in the header

### Generation dropdown

Placed in the header, right side, alongside the title:

```
[Fujifilm X-Trans Recipe Explorer]        [Generation: V ▾]
```

- `<select id="gen-select">` with options for I, II, III, IV, V
- Default selected: V
- On `change` event: triggers lazy-load + switch flow
- During first-time load: `disabled` attribute + brief label change to "Loading…"
- After load: re-enabled, label reflects active gen

### Responsive

On mobile (≤680px): dropdown stays in the header but may wrap below the title if space is tight — no special mobile layout required beyond natural flow.

---

## 4. Scope Boundaries

| Tab | Scoped to activeGen? |
|-----|---------------------|
| Recipes (grid) | Yes |
| My Recipes | No (gear.js data) |
| My Gear | No (gear.js data) |
| Settings Guide | Yes (counts, era list) |
| Keywords | Yes |
| Directions | Yes |
| Correlation | Yes |
| Explore | Yes (seed dropdown + similarity pool) |

---

## 5. sync-recipes Integration

`/sync-recipes` updated to:
- Ask which generation to sync
- Read from `recipes-[gen].js` instead of inline `RECIPES` in `index.html`
- Write patch back to `recipes-[gen].js`
- No longer touches `index.html` for recipe data

---

## 6. Out of Scope

- No cross-generation search or filtering
- No merging of pools for any view
- No migration of My Custom Slots data to per-generation structure
- No changes to gear.js globals (MY_CAMERAS, MY_LENSES, MY_CUSTOM_SLOTS)

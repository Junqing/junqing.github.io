# Recipe Badge Formula — Design Spec

**Date:** 2026-07-16
**Branch:** feature/keyword-tags-revision

## Context

The current `color_direction` badge on each recipe card (e.g. "muted", "warm") is a single hardcoded label assigned when the recipe data was originally generated. It is not derived from the camera settings and contains inaccuracies — e.g. *1970s Summer* was labelled "muted" despite being one of the warmer recipes in the dataset. The fujixweekly site owner flagged this directly.

This design replaces the single editorial badge with two computed badges derived entirely from objective camera settings, adds a formula explanation to the Settings Guide tab, updates the sidebar filters to match, and makes filter sections collapsible.

---

## 1. Formula

Two pure functions replace `color_direction` as the source of recipe classification:

### `recipeWarmth(r)` → `'warm' | 'neutral' | 'cool'`

```
wbK       = kelvin(r.white_balance)   // see mapping table below
wbNorm    = (wbK − 5200) / 2300       // normalized: −1 (tungsten) to +1 (shade)
shiftNorm = (wb_shift_red − wb_shift_blue) / 9   // −1 to +1
filmBias  = +0.15 for warm sims | −0.15 for cool sims | 0 otherwise

warmthScore = wbNorm × 0.5 + shiftNorm × 0.5 + filmBias

warm    if warmthScore > 0.35
cool    if warmthScore < −0.20
neutral otherwise
```

**B&W short-circuit:** if `film_simulation` is a B&W sim (Acros, Monochrome, variants) or `r.color === null`, return `'neutral'` directly — WB shift has no visible effect on monochrome output.

**WB kelvin mapping:**

| White Balance value | Kelvin |
|---|---|
| `NNNNK` (literal) | parsed directly |
| Daylight | 5200 |
| Cloudy | 6000 |
| Shade | 7500 |
| Auto / Auto Ambience Priority | 5200 |
| Auto White Priority | 5000 |
| Fluorescent 1/2/3 | 4000 |
| Tungsten/Incandescent | 3200 |
| Unknown | 5200 (fallback) |

**Warm film sims (filmBias = +0.15):** Nostalgic Neg., Classic Chrome, Eterna, Eterna/Cinema, PRO Neg. Hi, PRO Neg. Std, Sepia

**Cool film sims (filmBias = −0.15):** Eterna Bleach Bypass, Velvia

### `recipePunch(r)` → `'punchy' | 'balanced' | 'flat'`

```
colorVal   = r.color (treat as 0 for B&W)
punchScore = colorVal × 0.5 + clarity × 0.25 − (|highlight| + |shadow|) × 0.1

punchy   if punchScore > 1.2
flat     if punchScore < −0.5
balanced otherwise
```

### Manual overrides

`RECIPE_META_PATCHES` in `gear.js` may include `warmth_override` and/or `punch_override` fields on any entry. When present, these take precedence over the computed value. The existing `color_direction` field in `RECIPES` is retained as a legacy field but is no longer read by render or filter code.

---

## 2. Badge rendering

### `makeCard(r)` — `index.html:889`

Replace:
```js
<span class="badge ${bc(r.color_direction)}">${r.color_direction}</span>
```

With:
```js
<span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span>
<span class="badge ${punchClass(r)}">${recipePunch(r)}</span>
```

Badge row reads: `[Film Sim] [DR400] [warm] [flat]`

### Helper functions (replace `bc()` / `BADGE_CLS`)

```js
function recipeWarmth(r) { /* formula above, respects warmth_override */ }
function recipePunch(r)  { /* formula above, respects punch_override  */ }

const WARMTH_CLASS = { warm: 'b-warm', neutral: 'b-neutral', cool: 'b-cool' };
const PUNCH_CLASS  = { punchy: 'b-punchy', balanced: 'b-neutral', flat: 'b-flat' };

function warmthClass(r) { return WARMTH_CLASS[recipeWarmth(r)]; }
function punchClass(r)  { return PUNCH_CLASS[recipePunch(r)]; }
```

`BADGE_CLS` and `bc()` are removed.

### New CSS class

`.b-flat` — same style as `.b-muted` (dark grey). `.b-punchy` already exists.

### Other render sites using `color_direction`

Same two-badge swap applied at:
- `index.html:2564`, `2586`, `2988` — compare views
- `index.html:2211`, `2247` — `renderMyRecipes()`

---

## 3. Sidebar filters

### State

`S.f.dir` (Set) is replaced by two new Sets:
```js
S.f.warmth = new Set()   // 'warm' | 'neutral' | 'cool'
S.f.punch  = new Set()   // 'punchy' | 'balanced' | 'flat'
```

### `matches(r)` — `index.html:721`

Replace the `color_direction` check:
```js
if (S.f.dir.size && !S.f.dir.has(r.color_direction)) return false
```

With:
```js
if (S.f.warmth.size && !S.f.warmth.has(recipeWarmth(r))) return false
if (S.f.punch.size  && !S.f.punch.has(recipePunch(r)))   return false
```

### Sidebar HTML

Replace the single "Direction" chip group with two groups:

```
▾ Warmth
  [warm]  [neutral]  [cool]

▾ Punch
  [punchy]  [balanced]  [flat]
```

`buildChips()` / `initChips()` wired up for both new groups.

### `renderDirections()`

The `DIRECTIONS` predicate list (`index.html:1094–1119`) currently matches against `r.color_direction`. Each existing predicate (e.g. "Warm", "Muted", "Punchy") is remapped to check `recipeWarmth(r)` or `recipePunch(r)` as appropriate — no new direction groupings are added. Compound directions like "Warm & Muted" become `recipeWarmth(r) === 'warm' && recipePunch(r) === 'flat'`.

---

## 4. Collapsible filter sections

### Mechanism

A module-level `Set` tracks collapsed sections:
```js
const collapsedFilters = new Set()  // stores section keys e.g. 'warmth', 'punch', 'sim'
```

Each filter group header becomes a `<button class="filter-hd">` with a CSS-only chevron span:
```html
<button class="filter-hd" data-section="warmth">
  Warmth <span class="chevron"></span>
</button>
<div class="filter-body" id="filter-warmth">
  <!-- chips -->
</div>
```

Clicking toggles the key in `collapsedFilters`, toggles a `.collapsed` class on the `filter-body`, and flips the chevron via CSS (`.collapsed .chevron::before { content: '▸' }` vs `'▾'`).

All sections start expanded. State is in-memory per session — no persistence.

### CSS additions

```css
.filter-hd { /* header button styles, no border, matches existing sidebar aesthetic */ }
.filter-body.collapsed { display: none; }
.chevron::before { content: '▾'; }
.collapsed + .filter-body .chevron::before { /* not needed — class is on filter-body */ }
.filter-hd .chevron { float: right; }
```

---

## 5. Settings Guide — formula explanation

A new subsection in `renderSettingsGuide()` titled **"How recipe badges are scored"**, added after the existing settings reference content.

Content covers:

**Warmth badge** (warm / neutral / cool)
Explanation of WB kelvin scale, WB shift (R−B), and film sim bias. Notes that B&W simulations always score neutral. Includes the warm/cool film sim lists.

**Saturation & contrast badge** (punchy / balanced / flat)
Explanation of Color dial, Clarity dial, and Highlight/Shadow spread interaction.

**Reference table** — all film sims categorised as warm-biased, cool-biased, or neutral.

The formula thresholds (0.35, −0.20, 1.2, −0.5) are shown alongside plain-language descriptions so a user can mentally estimate a badge before the page renders it.

---

## 6. Files changed

| File | Change |
|---|---|
| `index.html` | Add `recipeWarmth()`, `recipePunch()`, `warmthClass()`, `punchClass()`; remove `bc()`, `BADGE_CLS`; update `makeCard()`, compare views, `renderMyRecipes()`, `matches()`, `initChips()`, `buildChips()`, sidebar HTML, `renderDirections()`, `renderSettingsGuide()`; add collapsible filter CSS and JS |
| `gear.js` | `RECIPE_META_PATCHES` entries may now include `warmth_override` / `punch_override`; existing `color_direction` entries (e.g. from earlier corrections) are harmless — `bc()` is gone so they are simply ignored by the app |

---

## 7. Verification

1. `python3 -m http.server 8000` → open http://localhost:8000/
2. Recipes tab: *1970s Summer* shows `[warm]` + `[flat]` chips; *Fujicolor Super HG v2* shows `[neutral]` + `[punchy]`
3. Recipes tab: *Acros Negative* shows `[neutral]` + `[balanced]` (B&W short-circuit)
4. Sidebar: "Warmth" and "Punch" filter groups present; clicking a chip filters recipes correctly; clicking section header collapses/expands the chip group
5. Settings Guide tab: "How recipe badges are scored" section present with formula explanation and film sim reference table
6. Compare view: both badges render for each compared recipe
7. My Recipes tab: badges render correctly on custom slot recipe cards

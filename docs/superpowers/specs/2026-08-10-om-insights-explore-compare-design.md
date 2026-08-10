# OM Insights, Explore, Compare + OM Badge Formulas — Design

**Date:** 2026-08-10
**Branch:** `om-insights-explore-compare`

## Goal

Bring the OM System/Olympus recipe family to feature parity with Fuji across the Insights (3 subtabs), Explore, and Compare tabs, and give OM its own warmth/punch badge calculation. The badge *types* stay identical across families (`warm|neutral|cool`, `punchy|balanced|flat`) — only the computation diverges.

Today these tabs all detect `activeGen === 'OM'` and render a "not available for the OM recipe family yet" empty state. `recipeWarmth()`/`recipePunch()` read Fuji-only fields (`film_simulation`, `wb_shift_red/blue`, `color`, `clarity`), so every OM recipe currently falls through to `neutral`/`balanced`.

## Architecture

All OM-specific analysis code lives in a new **`om-analysis.js`**, loaded in `index.html` alongside `gear.js`:

```html
<script src="recipes-v.js"></script>
<script src="om-analysis.js"></script>   <!-- new -->
<script src="gear.js"></script>
```

`index.html` keeps only thin dispatch at the top of each render function:

```js
function renderDirections() {
  if (activeGen === 'OM') return renderOmDirections()
  ...existing Fuji code unchanged...
}
```

This honors the standing rule in `CLAUDE.md` — the two recipe families stay architecturally separate — and stops `index.html` (already ~4500 lines) from growing past readability.

`om-analysis.js` exports these plain globals:

| Symbol | Purpose |
|---|---|
| `recipeWarmthOm(r)` / `recipePunchOm(r)` | OM badge calculation |
| `omHueEmphasis(r)` | derived sidebar facet |
| `OM_DIRECTIONS` / `renderOmDirections()` | Insights → Directions |
| `OM_SETTINGS_DATA` / `renderOmSettingsGuide()` | Insights → Settings Guide |
| `renderOmCorrelations(filterQ)` | Insights → Correlation |
| `initOmExplore()` | Explore tab |
| `initOmCompare()` / `renderOmCompare()` | Compare tab |

It depends on `buildOmVisual()`, `buildOmWheelSvg()`, `buildOmWbBox()`, `OM_WHEEL_ORDER`, `OM_WHEEL_ABBR`, `clamp()`, and `openRecipeModal()` — all already defined in `index.html`. Load order matters only at call time, not parse time, so a plain `<script>` tag is sufficient.

Graceful degradation: if `om-analysis.js` fails to load, each dispatch point falls back to the existing empty state via `typeof renderOmX === 'function'` guards.

## Badge formulas

Both formulas were calibrated against all 66 OM recipes and scored against the hand-authored `mood_keywords` (recipes declaring `warm` or `cool`, n=23) as ground truth.

**Baseline for comparison:** the existing Fuji formula agrees with its own declared moods 52% of the time (36/69 on X-Trans V). That is the bar, not 100% — these badges are heuristics.

### Warmth

The naive port scored 59/66 recipes as `neutral`, making the filter useless. Root cause: `wb_temperature` is null on 47 of 66 recipes and most `white_balance` values are `"Auto"` or `"Custom WB 1"`, so treating unknown WB as 5200K pinned the WB term to zero for 71% of the pool.

Fix: drop the WB term out of the weighted average entirely when temperature is unknown, rather than substituting a default.

```
warmthOm(r):
  if recipe_type == 'MONO' or no color_wheel: return 'neutral'

  tilt = (mean[yellow, orange, orangeRed, red]
        - mean[blue, blueCyan, cyan]) / 7
  amb  = (wb_amber_offset ?? 0) / 7
  k    = wb_temperature
         else kelvin parsed from white_balance preset
         else NULL

  num = 0.30*amb + 0.50*tilt
  den = 0.80
  if k != NULL:                      # only 19/66 recipes
      num += 0.20 * (k - 5200) / 2300
      den += 0.20
  score = num / den

  score > 0.187 -> 'warm'
  score < 0.009 -> 'cool'
  else             'neutral'
```

Thresholds are the 68th/32nd percentile of the actual OM pool. Result: **warm 21 / neutral 25 / cool 20**, 61% agreement with declared moods, 2 inversions (predicted warm where declared cool, or vice versa).

The thresholds were derived on the COLOR-only pool but are applied to all 66 recipes, and 13 recipes sit within 0.02 of a cut — several (`Default - 1`, `Default - 3`, `Velvia 50`) score exactly 0.0000. Small changes to the weights will therefore move a handful of recipes across a boundary; the ranking is stable, the exact bucket counts are not.

WB preset → kelvin mapping, OM-specific (do not reuse Fuji's `wbKelvin()`):

| Preset | Kelvin |
|---|---|
| `"5300K (Fine Weather)"` | 5300 |
| `"6000K (Cloudy)"` | 6000 |
| anything matching `/(\d{4,5})K/` | parsed |
| `"Auto"`, `"Auto (Keep Warm Color Off)"`, `"Custom WB 1"` | `NULL` |

### Punch

The first draft carried over Fuji's *absolute* spread penalty, `−(|highlights| + |shadows|)/2`. Validation showed this is **inverted for OM**: highlights up with shadows down is an S-curve that increases contrast, not a flattening. Measured across the COLOR pool, signed separation `(highlights − shadows)/2` averages **+0.98** on recipes declaring high-contrast/dramatic/punchy and **−0.96** on those declaring soft/faded/muted — a clean split that the absolute-spread term punished in the wrong direction. All three MONO recipes declare `high-contrast`/`dramatic`, yet the spread version scored two of them `flat`.

Fixed formula uses signed separation:

```
punchOm(r):
  sep = ((highlights ?? 0) - (shadows ?? 0)) / 2

  if recipe_type == 'MONO' or no color_wheel:
      score = contrast*1.62 + sep*0.25       # 1.62 = 0.9*1.8, compensates
                                             # for the absent wheel term
  else:
      wheelMag = mean(|v|) over all 12 channels
      score    = wheelMag*0.9 + contrast*0.5 + sep*0.25

  score > 2.17 -> 'punchy'
  score < 1.05 -> 'flat'
  else            'balanced'
```

`wheelMag` stands in for Fuji's Color dial (how hard the grade pushes any hue), `contrast` stands in for Clarity, and `sep` captures the tone-curve S. Thresholds are the 68th/32nd percentile of the OM pool.

Result: **punchy 23 / balanced 25 / flat 18**, 57% agreement with declared moods and 3 inversions — versus 48% and 7 inversions for the absolute-spread version.

### Wiring

`recipeWarmth(r)` and `recipePunch(r)` in `index.html` gain a dispatch line at the top, *after* the `RECIPE_META_PATCHES` override check so overrides keep working for both families:

```js
function recipeWarmth(r) {
  if (RECIPE_META_PATCHES[r.name]?.warmth_override) return ...
  if (activeGen === 'OM') return recipeWarmthOm(r)
  ...existing Fuji body...
}
```

`WARMTH_CLASS` / `PUNCH_CLASS` / `warmthClass()` / `punchClass()` are unchanged — the badge vocabulary is shared by design.

**Note on `shading_effect`:** this field is `0` on all 66 OM recipes. It is excluded from every formula and from Explore's similarity metric, but still displayed in card settings tables where present.

## Insights tab

### Settings Guide — `renderOmSettingsGuide()`

Hand-authored `OM_SETTINGS_DATA`, same shape as Fuji's `SETTINGS_DATA` (`section` → `items[]` with `name`, `subtitle`, `icon`, `range`, `desc`, `spectrum`, `effects[]`, `tip`, `visual`). It reuses `buildSgCard()` from `index.html` unchanged, so no new CSS is needed.

Sections:

1. **Color Creator** — the 12-point wheel: what each channel does, that positive boosts that hue's saturation rather than tinting the image, and the practical warm/cool/green/magenta groupings.
2. **Tone** — Contrast (−2..+2), Sharpness (−2..+2), Highlights (−6..+4), Shadows (−6..+4), Midtones (−3..+6). Each entry notes the actual observed range in this collection, not the camera's theoretical range.
3. **White Balance** — presets, custom kelvin, and the amber/green offset box.
4. **Monochrome** — mono profiles 1–3, film grain (Off/Low/Standard/High), film hue (Normal/Sepia/Blue/Purple/Green), color filters (Red/Orange/Yellow/Green), and mono vignetting.

Guard `omSettingsBuilt` mirrors Fuji's `settingsBuilt` and resets when switching away from OM.

### Directions — `renderOmDirections()`

Hand-authored `OM_DIRECTIONS`, same object shape as Fuji's `DIRECTIONS` (`name`, `color`, `desc`, `traits[]`, `match(r)`), reusing the existing `.dir-card` CSS and the `goRecipe()` click handler.

Families match on wheel shape plus mood/scenario keywords:

| Family | Matches on |
|---|---|
| Teal & Orange | warm channels up **and** cyan/blueCyan up |
| Faded Pastel | low `wheelMag`, negative tonal separation (`highlights − shadows < 0`) |
| Kodachrome-like | red/orangeRed strong, high contrast, name or keyword match |
| Warm Analog | warm tilt positive, `nostalgic`/`vintage`/`retro`/`analog` keywords |
| Cool Cinematic | cool tilt, `cinematic`/`moody`/`gritty` keywords |
| Vivid Punch | `punchOm(r) === 'punchy'` |
| Monochrome | `recipe_type === 'MONO'` |

A recipe may appear in more than one family, exactly as in the Fuji version.

### Correlation — `renderOmCorrelations(filterQ)`

Computed **live** from `RECIPES_OM` at render time — no precomputed blob. 66 recipes is small enough that the computation is instant, and it means the tab never goes stale when recipes are added.

For each keyword (union of `mood_keywords` and `scenario_keywords`), compute the mean of each numeric field across recipes carrying that keyword, minus the global mean:

- Numeric fields: `contrast`, `sharpness`, `highlights`, `shadows`, `midtones`, plus derived `wheelMag`
- Reuses the existing `.corr-card` / `.delta-row` / `.delta-bar` CSS
- The Fuji version's `dr` pill row (Dynamic Range distribution) is replaced with a **recipe-type** pill row (COLOR / MONO counts)

**Sample-size guard:** keywords appearing on fewer than 3 recipes are excluded, and each card shows its `n` so thin samples are visible rather than hidden. This is the one place where OM's small pool genuinely risks presenting noise as signal.

## Explore tab — `initOmExplore()`

The 12-point color wheel becomes the primary draggable control, mirroring the role Fuji's 5-axis radar plays.

```
┌─ Start from: [search…]   Type: [any | COLOR | MONO] ─┐
│                                                      │
│   WB box (drag)          12-point wheel (drag)       │
│   ┌────────┐                  ╱╲  ╱╲                 │
│   │   ✦    │                ─ ◆ ─ ◆ ─   yours (gold) │
│   │        │                  ╲╱  ╲╱     match (blue) │
│   └────────┘                                         │
│   A+2 G−1               12 draggable handles          │
│                                                      │
│  Contrast − 0 +     Sharpness − 0 +                  │
│  Highlights − 0 +   Shadows − 0 +   Midtones − 0 +   │
│  Exposure − 0 +                                      │
│                                                      │
│  Top 6 matches ───────────────────────────────────   │
└──────────────────────────────────────────────────────┘
```

**State object `TOM`** (separate from Fuji's `T`, never merged):

```js
const TOM = {
  seedName: null,
  type_filter: '',            // '' | 'COLOR' | 'MONO'
  color_wheel: { yellow:0, orange:0, ..., yellowGreen:0 },   // each −7..+7
  contrast: 0, sharpness: 0,
  highlights: 0, shadows: 0, midtones: 0,
  exposure_compensation: 0,
  wb_amber_offset: 0, wb_green_offset: 0,
}
```

**Wheel interaction:** reuses `buildOmWheelSvg()` geometry (`viewBox="0 0 260 260"`, centre 130,130, `radiusFor(v) = clamp(49.23 + 6.15*v, 8, 130)`). Each of the 12 handles projects the pointer position onto its spoke vector, inverts `radiusFor` to get a value, clamps to −7..+7, snaps to integer. The closest match draws as a blue dashed ghost polygon behind the gold one, same layering as the Fuji radar.

**WB box interaction:** drag the dot inside `buildOmWbBox()`'s 150×150 viewBox; maps back to `wb_amber_offset` / `wb_green_offset` at 7px per unit.

**Similarity metric** — normalized Euclidean, every term scaled to 0..1 so each contributes comparably:

| Term | Normalization |
|---|---|
| 12 wheel channels | `/14` each (range −7..+7) |
| `contrast`, `sharpness` | `/4` each (−2..+2) |
| `highlights`, `shadows` | `/10` each (−6..+4) |
| `midtones` | `/9` (−3..+6) |
| `exposure_compensation` | `/12` (−7..+5) |
| `wb_amber_offset`, `wb_green_offset` | `/14` each |

`shading_effect` is excluded (constant 0). The type filter applies before sorting. MONO recipes are excluded when any wheel channel is non-zero in `TOM`, since wheel distance is meaningless against a null wheel.

Results reuse the existing `.exp-result` card CSS, showing a mini wheel via `buildOmWheelSvg()`, the recipe name, warmth/punch badges, and diff badges for the fields that differ. Click opens `openRecipeModal(name)`.

Debounce: reuse the 80ms pattern from `expDebounce()` with a separate `omExpDebounce()`.

## Compare tab — `initOmCompare()` / `renderOmCompare()`

Same three views as Fuji, same `.cmp-*` CSS, same two-select header + swap/clear controls.

| View | OM implementation |
|---|---|
| **Side-by-side** | Two columns, each a full `buildOmVisual(r)` (wheel + WB box + tone rows) plus the OM settings table and keyword chips |
| **Row diff** | Delta table over all 12 wheel channels + `contrast`, `sharpness`, `highlights`, `shadows`, `midtones`, `exposure_compensation`, `wb_amber_offset`, `wb_green_offset`. Rows where both values are equal are dimmed; non-zero deltas get a signed colored pill |
| **Overlay** | One wheel SVG, two polygons superimposed — A in solid gold, B in dashed blue — with delta pills at channels where they diverge by ≥2 |

The Compare button is added to `makeOmCard()`, which currently omits it (Compare was Fuji-only). `compareSlots` / `C.a` / `C.b` state is shared, but `switchGen()` must clear `C.a`/`C.b`/`compareSlots` so a Fuji recipe can never end up compared against an OM recipe.

## Sidebar

`initChips()` gains an OM branch. Sections that would render empty are hidden rather than shown blank.

| Fuji sidebar | OM sidebar |
|---|---|
| Search | Search |
| Film Simulation | **Recipe Type** (COLOR / MONO) |
| Warmth | **Hue Emphasis** (warm / cool / green / magenta / neutral) |
| Punch | Warmth |
| Mood | Punch |
| Scenario | Mood |
| Era | Scenario |

`S.f` gains `type` and `hue` sets. `matches(r)` gains two conditions, both guarded on `activeGen === 'OM'` so Fuji filtering is untouched.

### Hue Emphasis — naming rationale

This facet groups recipes by which hue family the wheel pushes hardest:

```
omHueEmphasis(r):
  if MONO: return null                    # excluded from the facet
  warm    = mean[yellow, orange, orangeRed, red]
  cool    = mean[blue, blueCyan, cyan]
  green   = mean[greenCyan, green, yellowGreen]
  magenta = mean[magenta, violet, red]
  winner  = argmax of the four
  return winner value <= 0.5 ? 'neutral' : winner
```

Distribution: neutral 22, warm 18, cool 16, magenta 4, green 3, mono 3.

It is deliberately **not** called "Color Cast." In OM's Color Creator, pushing a channel positive boosts *that hue's saturation* — it does not tint the image. So `"OMTC Warm"` (declared warm, amber +4) has `blue +4 / cyan +5` and computes as `cool` emphasis. Labeling that "cool cast" would read as a direct contradiction of its `warm` Warmth badge sitting two rows above it in the same sidebar. "Hue Emphasis" describes what is actually measured and coexists with Warmth without implying a conflict.

The sidebar info popover for this facet must state the distinction explicitly.

## Files

| File | Action | Responsibility |
|---|---|---|
| `om-analysis.js` | **Create** | All OM analysis: badge formulas, Directions, Settings Guide, Correlation, Explore, Compare |
| `index.html` | Modify | `<script>` tag; dispatch lines in `recipeWarmth`/`recipePunch`/`renderDirections`/`renderCorrelations`/`renderSettingsGuide`/`initExplore`/`initCompare`/`renderCompare`; OM branch in `initChips()`/`matches()`; sidebar section visibility; Compare button in `makeOmCard()`; clear compare state in `switchGen()` |
| `CLAUDE.md` | Modify | Document `om-analysis.js`, the OM badge formulas, and the OM sidebar facets |

No changes to `recipes-om.js`, `gear.js`, or any Fuji recipe file.

## Verification

No test framework exists in this repo. Manual browser testing via `python3 -m http.server 8000`:

- [x] Switch to OM: badges show a real spread (21 warm / 25 neutral / 20 cool; 23 punchy / 25 balanced / 18 flat), not all-neutral
- [x] Fuji badge distribution byte-identical to `main` (verified: warm 43 / neutral 63 / cool 7; balanced 66 / flat 35 / punchy 12 on X-Trans V)
- [x] All 7 OM_DIRECTIONS families non-empty (20 / 15 / 7 / 8 / 6 / 21 / 3)
- [x] 33 correlation keywords survive the n≥3 filter
- [x] Seeding Explore from a recipe ranks that recipe as its own top match; mono excluded once a wheel channel is active
- [x] `om-analysis.js` executes standalone (no parse-time dependency on index.html globals)
- [ ] Switch back to a Fuji generation: badge distribution is byte-identical to `main` (regression check on the dispatch)
- [ ] Insights → all three subtabs render OM content; Correlation cards show `n` and exclude keywords with n<3
- [ ] Explore → all 12 wheel handles drag and snap to integers; WB dot drags; steppers work; results update live; ghost polygon tracks the top match
- [ ] Compare → all three views render; Compare button appears on OM cards; switching generation clears both slots
- [ ] Sidebar → OM shows Recipe Type + Hue Emphasis, hides Film Simulation + Era; Fuji sidebar unchanged
- [ ] Rename `om-analysis.js` temporarily to confirm every tab falls back to its empty state instead of throwing
- [ ] Mobile (≤680px): wheel drag works by touch, layouts stack

## Out of scope

- The Charts tab and `renderCharts()` / `renderSaveSlots()` remain unused dead code (per `CLAUDE.md`) — untouched.
- `MY_CUSTOM_SETUPS` / PEN-F panes — untouched.
- No precomputed correlation blob for OM; if the OM pool grows past a few hundred recipes, revisit.
- Cross-family comparison (a Fuji recipe vs an OM recipe) is explicitly not supported.

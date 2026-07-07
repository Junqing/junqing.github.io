# Explore Tab — Design Reference

This document describes the approved visual design for the Explore tab rework. It supersedes the original slider-based implementation and the first radar iteration.

## Overview

The Explore tab is a recipe parameter tweaker with real-time similarity search. The user adjusts parameters visually and sees the closest matching recipes update live. There are no sliders — all interaction is through the radar, WB grid, and compact controls.

## Layout (top to bottom)

### 1. Header row
- **Start From** — searchable text input (typeahead) to seed all controls from an existing recipe
- **Film Sim** — dropdown (`— any —` default + all film simulations). When set, similarity search filters to recipes with that simulation only. Does not affect the radar display.

### 2. WB + Radar row (side by side, stacks on mobile)

#### White Balance (left column, fixed 160px)
- **WB mode dropdown** — all Fujifilm presets: Auto, Daylight, Shade, Fluorescent 1/2/3, Incandescent, Underwater, 2500K–10000K
- **Match indicator pill** — small row below dropdown showing the closest recipe's WB mode (e.g. "Match: Fluorescent 1") with a dashed blue dot icon
- **WB shift grid** — 160×160px SVG, viewBox="-9 -9 18 18":
  - Grid lines every 3 units; center axes slightly brighter
  - Axis labels: R− (left), R+ (right), B+ (top), B− (bottom)
  - Tick values at ±3, ±6 on both axes (very subtle)
  - **Your dot** — small gold diamond (4-point polygon)
  - **Match dot** — hairline crosshair + tiny open circle + value pill (`R−3 B−4`), all in blue, thin stroke
  - Both dots have a small pill label showing their R/B values
- **Legend** — "Yours" (gold diamond icon) / "Match" (blue crosshair icon)

#### Color & Tone Radar (right, fills remaining width)
5 axes, pentagon shape. Draggable diamond handles.

**Axes:** HL, SH, COL, CCE (Color Chrome Effect), CCB (CC FX Blue)

**Scale:** Symmetric zero-centered.
```
extent = max(abs(axis.lo), abs(axis.hi))
ratio  = clamp((value + extent) / (2 * extent), 0, 1)
```
- `ratio = 0.5` → middle ring = **0 neutral** for every axis
- `ratio = 1.0` → outer ring = maximum positive value
- `ratio = 0.0` → center = maximum negative value
- A recipe with all-zero values draws a perfect regular pentagon on the middle ring

**Axis ranges:**
| Axis | lo  | hi | extent | step |
|------|-----|----|--------|------|
| HL   | −2  | +4 | 4      | 0.5  |
| SH   | −2  | +4 | 4      | 0.5  |
| COL  | −4  | +4 | 4      | 1    |
| CCE  | 0   | 2  | 2      | 1    |
| CCB  | 0   | 2  | 2      | 1    |

CCE and CCB are stored and displayed as 0/1/2 (not Off/Weak/Strong).

**Visual layers (back to front):**
1. Grid rings: inner (0.25R), middle (0.5R = zero reference, brighter), outer (0.75R), max (1.0R)
2. Spokes
3. Ghost polygon — closest matching recipe, blue fill `rgba(91,154,240,.08)`, dashed blue stroke `#5b9af0`, `stroke-dasharray="5,3"`
4. Your polygon — gold fill `rgba(212,168,67,.15)`, solid gold stroke `#d4a843`, `stroke-width=2.2`
5. Diamond handles — gold filled, dark border, `cursor:grab`
6. Axis name labels — far outside ring, muted `#5e5e6e`
7. Value pill labels — gold bordered pill beside each handle showing current value (numeric: `+2`, `0`, `2`)
8. Delta pills — appear where shapes diverge (|diff| ≥ step*0.5); pill with semi-transparent colored background; green `#4caf7d` = recipe is higher, blue `#5b9af0` = recipe is lower

**Legend (below radar):** Two pill-shaped toggle buttons — "Yours" and "Closest match". Clicking either fades that polygon to near-invisible (opacity 0.1), dims the legend button. Click again to restore. Both are active by default.

**Drag interaction:** Each diamond handle projects the mouse position onto its axis vector, snaps to valid step, updates T state, calls debounced similarity recompute (~80ms).

### 3. Compact controls (full width, 2-column grid)

All show a colored diff badge on the right: the delta between your value and the closest match's value.

| Control     | Type            | Range / Options           | Diff badge |
|-------------|-----------------|---------------------------|-----------|
| Sharpness   | − value + stepper | −4 to +4, step 1          | colored pill |
| Clarity     | − value + stepper | −5 to +5, step 1          | colored pill |
| ISO NR      | − value + stepper | −4 to +4, step 1 (default 0) | colored pill |
| Dyn Range   | 3-button toggle | 100 / 200 / 400           | match value |
| Grain       | 3-button toggle | Off / Wk / Str (→ 0/1/2) | match value |
| Grain Size  | 2-button toggle | S / L                     | match value |

Active selection is highlighted with the gold accent background and black text.

### 4. Similarity results (full width)

Top 6 recipes by normalized Euclidean distance, updated on every T change (debounced).

Each result card:
- Mini fingerprint SVG (existing `fingerprint()` function)
- Recipe name + film simulation badge
- Diff badges: only params that differ from T (axis name + signed delta)
- WB mode shown as a diff badge if it differs
- Click → opens `#recipe-modal`

The closest result (#1) is the ghost shape in the radar and WB grid.

## State object T

```js
T = {
  seedName: null,          // name of loaded recipe, or null
  film_sim_filter: '',     // '' = any, otherwise exact film sim string
  // radar axes
  highlight: 0,
  shadow: 0,
  color: 0,
  color_chrome_effect: 0,  // 0/1/2
  color_chrome_fx_blue: 0, // 0/1/2
  // compact controls
  sharpness: 0,
  clarity: 0,
  high_iso_nr: 0,
  dynamic_range: 100,      // 100/200/400
  grain_effect: 0,         // 0/1/2
  grain_size: 'S',         // 'S'/'L'
  // WB
  white_balance: 'Daylight',
  wb_shift_red: 0,
  wb_shift_blue: 0,
}
```

## Similarity algorithm

Normalized Euclidean distance across all numeric params. Each param normalized by its extent so all axes contribute equally. WB shift normalized over −9..9 (÷18 per axis). Grain size is categorical (exact match = 0, mismatch = 0.5 contribution). Film sim filter applied before sorting — recipes not matching the selected sim are excluded entirely.

## Existing code reused

- `fingerprint(r)` — mini SVG in result cards (unchanged)
- `openRecipeModal(name)` — result card click handler
- `recipeToT(r)` — maps recipe fields to T numeric values (needs updating for new params)
- `computeSimilarity(t)` — needs updating for new params and film sim filter
- `expDebounce()` — 80ms debounce on all T mutations
- `syncExploreControls()` — needs updating for new controls
- `initExplore()` / `exploreBuilt` guard — existing pattern

## What changes from the previous implementation

- **Remove** slider pane (`buildSliderPane`, `#exp-pane-sliders`, Sliders sub-tab, `#exp-overlay-svg`)
- **Remove** `exp-subtabs` sub-tab bar entirely — single view now
- **Rework** `buildRadarPane` — new scale (symmetric zero-centered), diamond handles, 5 axes
- **Rework** `updateRadarOverlay` — new scale formula, value pills, delta pills, legend toggles
- **Add** `buildWbGrid` enhancements — match dot with value label, WB mode dropdown + match indicator
- **Add** film sim filter selector wired to T + computeSimilarity
- **Add** compact controls for sharpness, clarity, ISO NR, DR, grain strength, grain size
- **Update** `T_PARAMS` / `T` to include all new params
- **Update** `recipeToT` to map grain fields
- **Update** `computeSimilarity` to include grain + film sim filter

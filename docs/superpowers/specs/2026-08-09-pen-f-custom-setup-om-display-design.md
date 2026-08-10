# PEN-F Custom Setup + OM Display Standard — Design Spec

Date: 2026-08-09
Branch: pen-f-personal-setup

## Overview

Two related changes:

1. Establish a new shared rendering standard for OM (Olympus/OM System) color data — a 12-point color wheel + white balance box + tone rows — matching the official om-recipes.com layout, reverse-engineered from the server-rendered HTML of `https://om-recipes.com/recipes/peter-turner_night-market`. This supersedes the current `omColorWheel()`/`fingerprint()` OM branch.
2. Replace the "My Recipes" inner-subtab with a camera-aware "My Custom Setup" subtab. It gets a camera selector (Fujifilm X-T50 / Olympus PEN-F / Fujifilm X-M5). X-T50 reuses the existing C1–C7 slot system unchanged. PEN-F gets new content sourced from the user's Obsidian note (`PEN-F Setup v2.md`): 4 shooting-situation modes (C1–C4) and 6 creative dial profiles (COLOR 1–3, MONO 1–3), with the color/mono profiles rendered through the new OM display standard. X-M5 is an empty placeholder for the user to fill in later.

---

## 1. OM Display Standard

### Source of truth

Extracted via plain `curl` (no client-side JS execution) against om-recipes.com's server-rendered recipe page. Confirmed structure, in top-to-bottom visual order:

1. **Sh/Mid/Hi header row** — three values (`Sh: -3`, `Mid: 0`, `Hi: -2`) above the wheel, left/center/right aligned.
2. **12-point color wheel** — `280×280` SVG on a dark rounded card:
   - Fixed rainbow-colored outer ring (12 line segments, one per hue channel, always the same colors regardless of recipe — these are reference hues, not data).
   - A white/gray inner polygon whose 12 vertices encode the recipe's actual per-channel push value.
   - Numeric value labels around the ring.
   - Radius formula derived from the one sample (`Night Market`, values -2..+3): control-point radius `r(v) = 49.23 + 6.15·v` (i.e. center ring ~49px = value 0, each unit of push = ~6.15px). This is a linear fit from a single data point set, not confirmed against multiple recipes, but it's the same formula for all 12 channels and degrades gracefully (clamped) for extreme values — acceptable given the "static/stylized" scope decision.
   - **Wheel order and reference hues** (12 o'clock start, clockwise), read directly from the sample SVG's stroke colors:
     ```
     yellow #FCF750, orange #DBA12A, orangeRed #CC1210, red #CD076B,
     magenta #970AA0, violet #7710E8, blue #3054E0, blueCyan #5392EB,
     cyan #83E7EB, greenCyan #87EE77, green #9DEE3A, yellowGreen #CBEE3A
     ```
     Note this is a straight positional match to `OM_WHEEL_ORDER` already in `index.html` — no remapping needed for real `RECIPES_OM` data.
3. **White Balance box** — `150×150` SVG, dark rounded box, 4px colored edge bars (green top, magenta bottom, amber right, blue left), a dot positioned inside by amber/green offset, crosshair lines through the dot, and a text line above showing the WB preset name + amber/green offsets (e.g. `Auto (Keep Warm Color Off)  A.2  G.1`).
4. **Tone/exposure rows** below the WB box — Shading Effect, Sharpness, Contrast, Exposure Comp — each shown as a label + value + a disabled `<input type="range">` styled slider.

Per user decision: the Sh/Mid/Hi curve visual is **not** present as a separate curve graphic in the actual source (the "curve" observed earlier was a mis-read of the wheel's own guide lines) — the Sh/Mid/Hi values are just the header row above the wheel. No curve math needed.

### Implementation

Replace `omColorWheel(r)` (`index.html:1217`) with `buildOmVisual(obj)` — a schema-driven function, not recipe-object-specific, so it can render both real `RECIPES_OM` entries and hand-authored PEN-F profile objects that share the same field shape:

```js
function buildOmVisual(obj) {
  // obj: { color_wheel, recipe_type, contrast, sharpness, highlights, shadows, midtones,
  //        shading_effect, exposure_compensation, white_balance, wb_amber_offset, wb_green_offset,
  //        monochrome_profile, monochrome_color, ... }
  // Returns an HTML string: Sh/Mid/Hi row + wheel/mono-placeholder + WB box + tone rows.
}
```

- MONO-type objects (`recipe_type === 'MONO'` or no `color_wheel`) render the existing compact "MONO" placeholder circle instead of the wheel — unchanged behavior from `omColorWheel()`.
- `makeOmCard()` (`index.html:1242`) calls `buildOmVisual(r)` instead of building its own `imgHtml` from `omColorWheel(r)` + a separate WB row — the WB box replaces the old ad-hoc `wbMode` div.
- `fingerprint()`'s OM early-return branch (`index.html:1086-1089`) is deleted — OM recipes never call `fingerprint()` once `makeOmCard()` fully owns its own visual via `buildOmVisual()`.
- CSS: new minimal classes for the wheel card, WB box card, and slider rows — modeled on existing `.card-img-fp`/`.card-drwb` sizing conventions so cards don't change overall dimensions.

This function takes a plain data object, not necessarily a `RECIPES_OM` array entry — this is what lets PEN-F's COLOR/MONO profiles (defined in `gear.js`, not `recipes-om.js`) reuse it directly.

---

## 2. "My Custom Setup" Tab

### Structural changes

- `index.html:728` — tab button label `"My Recipes"` → `"My Custom Setup"`, `data-inner` `inner-my-recipes` → `inner-my-setup`.
- `index.html:732` — pane id `inner-my-recipes` → `inner-my-setup`; sec-title/desc updated generically (drop the C1–C7-specific copy since content now varies by camera).
- `index.html:1638` — `switchInnerTab(innerPaneId || 'inner-my-recipes')` → `'inner-my-setup'`.
- Rename `renderMyRecipes()` → `renderMyCustomSetup()` (keeps the `myRecipesBuilt` build-once guard, renamed to `mySetupBuilt`).

### Camera selector

A pill tab-bar (reuses `.cs-subtabs`/`.cs-subtab` CSS, same pattern as the existing C1–C7 slot tabs) with three buttons: **Fujifilm X-T50**, **Olympus PEN-F**, **Fujifilm X-M5**. Clicking swaps which camera's setup pane is visible (same active/inactive toggle mechanic already used in `renderCustomSlots()`).

### Data shape (`gear.js`)

New top-level export, alongside (not replacing) `MY_CUSTOM_SLOTS`:

```js
const MY_CUSTOM_SETUPS = {
  "Fujifilm X-T50": { type: "fuji-slots" },      // renders existing MY_CUSTOM_SLOTS via renderCustomSlots()
  "Olympus PEN-F":  { type: "om-dial", modes: [...], colorProfiles: [...], monoProfiles: [...] },
  "Fujifilm X-M5":  { type: "empty" },
};
```

`MY_CUSTOM_SLOTS` stays as-is (still X-T50/Fuji-shaped, still consumed by `renderCustomSlots()`) — `MY_CUSTOM_SETUPS["Fujifilm X-T50"]` just points at it by type, no data duplication.

### PEN-F content shape

**Modes** (`C1`–`C4`, body/AF/exposure settings — no color data, no OM visual):

```js
modes: [
  {
    slot: "C1", name: "Street",
    purpose: ["General walkaround", "Street photography", "Discreet shooting", "Everyday scenes"],
    settings: [["Exposure mode","M + Auto ISO"], ["Shutter speed","1/250"], ["Aperture","f/4"],
               ["Auto ISO ceiling","ISO 3200"], ["AF mode","S-AF"], ["AF area","Small / Single"],
               ["Face/Eye Priority","Off"], ["Drive mode","Single"], ["Shutter","Silent"],
               ["Stabilization","S-IS AUTO"], ["Metering","ESP"]],
    why: ["1/250 is fast enough for normal pedestrian movement.", "f/4 gives useful depth of field.",
          "Small AF lets you choose the subject instead of having face detection grab random people.",
          "Silent shutter makes this the default discreet walkaround mode."],
    shortcut: "C1 = normal life moving slowly",
  },
  // C2 Action, C3 People, C4 Night/Low Light — same shape, from the Obsidian note verbatim
]
```

**Color profiles** (`COLOR 1`–`3`) and **mono profiles** (`MONO 1`–`3`) — OM-schema objects (reusing the exact field names `RECIPES_OM` uses) plus descriptive fields, so `buildOmVisual()` can render them directly:

```js
colorProfiles: [
  {
    id: "COLOR 1", name: "Soft Negative", role: "Portra-ish / warm negative / everyday color",
    best_for: ["People", "Travel", "Everyday photography", "Soft daylight", "Skin tones"],
    recipe_type: "COLOR",
    color_wheel: { yellow:-1, orange:1, orangeRed:1, red:0, magenta:-1, violet:-1, blue:-1, blueCyan:-1, cyan:-2, greenCyan:-2, green:-2, yellowGreen:-2 },
    shadows: -1, midtones: 2, highlights: -1, contrast: -1, sharpness: -1,
    white_balance: "Auto", wb_amber_offset: null, wb_green_offset: null, // "Keep Warm Color: Off" noted in character text
    character: ["Warm colors remain alive.", "Greens and blues are restrained.", "Contrast is slightly softer.",
                "Intended as a Portra-like role rather than an exact Portra reproduction."],
    good_combos: ["C3 People + COLOR 1", "C1 Street + COLOR 1 for warmer everyday scenes"],
    shortcut: "COLOR 1 = Soft",
  },
  // COLOR 2 Reportage, COLOR 3 Punchy Slide — same shape
],
monoProfiles: [
  {
    id: "MONO 1", name: "Clean", role: "Neutral / clean / fine monochrome",
    best_for: ["Portraits", "Quiet scenes", "Architecture", "Timeless everyday photography", "Situations where grain would be distracting"],
    recipe_type: "MONO",
    monochrome_profile: "None", monochrome_color: null, monochrome_color_strength: 0,
    film_grain: "Off/Low", monochrome_vignetting: null,
    shadows: 0, midtones: 0, highlights: 0, contrast: 0, sharpness: 0,
    character: ["Clean tonal rendering.", "Minimal stylistic intervention.", "Useful as the neutral B&W baseline."],
    good_combos: ["C3 People + MONO 1", "C1 Street + MONO 1 for quieter B&W"],
    shortcut: "MONO 1 = Clean",
  },
  // MONO 2 Tri-X Street, MONO 3 Drama — same shape
]
```

**Channel mapping** (Obsidian note wheel names → app schema): both are the same 12-position Olympus Color Creator dial in the same rotational order starting at Yellow, so the mapping is purely positional (index-for-index), not semantic:

| Position | Obsidian note | App schema |
|---|---|---|
| 0 | Yellow | `yellow` |
| 1 | Orange | `orange` |
| 2 | Red | `orangeRed` |
| 3 | Pink | `red` |
| 4 | Magenta | `magenta` |
| 5 | Pink-Purple | `violet` |
| 6 | Blue-Purple | `blue` |
| 7 | Blue | `blueCyan` |
| 8 | Aqua | `cyan` |
| 9 | Green | `greenCyan` |
| 10 | Lime | `green` |
| 11 | Yellow-Green | `yellowGreen` |

This mapping is applied once while authoring the `color_wheel` objects above — not a runtime transform.

Global Consistency section (Auto WB default, Keep Warm Color Off, RAW+JPEG while refining) becomes a short note rendered above the color/mono profile grid, not per-profile data.

"Potential future om-3" footer section is excluded — out of scope, speculative notes.

### Render function

`renderMyCustomSetup()`:
1. Builds the camera pill tab-bar from `Object.keys(MY_CUSTOM_SETUPS)`.
2. For the active camera, dispatches on `.type`:
   - `"fuji-slots"` → calls existing `renderCustomSlots()` into the pane (unchanged function/output).
   - `"om-dial"` → renders: Modes section (simple cards: purpose/settings-pills/why-list/shortcut tagline, no OM visual) + Color Profiles section (cards using `buildOmVisual()` + role/best-for/character/combos) + Mono Profiles section (same, mono variant).
   - `"empty"` → renders a `.empty` "No custom setup yet for this camera" state, matching the existing empty-state convention used elsewhere (e.g. `renderGear()`).

---

## 3. Explore / Compare

No functional change in this pass — both remain Fuji-only, guarded by their existing `activeGen === 'OM'` empty-state checks. `buildOmVisual()` is written as a standalone function specifically so a future Explore/Compare OM pass can call it without touching this pass's code.

---

## Testing

- Serve locally, open My tab → My Custom Setup subtab.
- Confirm camera pill bar shows X-T50 / PEN-F / X-M5; X-T50 pane renders identically to the old "My Recipes" content (C1–C7 slots, unchanged).
- Confirm PEN-F pane shows C1–C4 mode cards (settings/why/shortcut) and COLOR 1–3 / MONO 1–3 profile cards, each with a working 12-point wheel or MONO placeholder, WB box, and tone rows matching the om-recipes.com visual style.
- Confirm X-M5 pane shows a clean empty state.
- Switch to Recipes tab, select OM System generation, spot-check that `makeOmCard()` still renders correctly using `buildOmVisual()` (no regression vs. the old `omColorWheel()` look, ideally closer to the real om-recipes.com layout).
- Confirm Explore/Compare still show their existing "not available for OM" empty states — untouched.

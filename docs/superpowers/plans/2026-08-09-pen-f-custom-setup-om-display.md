# PEN-F Custom Setup + OM Display Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a shared `buildOmVisual()` rendering standard for OM color data (12-point wheel + WB box + tone rows, matching om-recipes.com), and replace the "My Recipes" inner-subtab with a camera-aware "My Custom Setup" subtab that adds PEN-F content (4 shooting modes + 6 creative-dial profiles) authored from the user's Obsidian note, leaving X-M5 as an empty placeholder.

**Architecture:** Single-file SPA, no build step — all changes land in `index.html` (functions/CSS/HTML) and `gear.js` (new `MY_CUSTOM_SETUPS` data). `buildOmVisual(obj)` is a pure, schema-driven function (not recipe-object-specific) so both real `RECIPES_OM` entries and hand-authored PEN-F profile objects can render through it identically.

**Tech Stack:** Vanilla JS, inline SVG, no dependencies. Verification is manual browser testing via `python3 -m http.server 8000` (no automated test framework exists in this repo).

## Global Constraints

- No build step, no package.json/npm/bundler — every change must work by editing `index.html`/`gear.js` directly and reloading the browser.
- `MY_CUSTOM_SLOTS` (`gear.js:259-569`) stays exactly as-is — `MY_CUSTOM_SETUPS["Fujifilm X-T50"]` points at it by type, no data duplication, and `renderCustomSlots()` (`index.html:2390+`) is reused unchanged for the X-T50 pane.
- Fuji and OM recipe schemas remain architecturally separate — do not merge or cross-reference field names between them (per `CLAUDE.md`).
- The 12-point wheel SVG uses `viewBox="0 0 260 260"` (raw-markup-confirmed from om-recipes.com's actual wheel element), not the `280×280` figure written in the spec doc — that dimension belongs to a separate decorative wrapper card, not the wheel itself.
- Wheel reference hues (fixed, not data-driven) are the om-recipes.com official values: `yellow #FCF750, orange #DBA12A, orangeRed #CC1210, red #CD076B, magenta #970AA0, violet #7710E8, blue #3054E0, blueCyan #5392EB, cyan #83E7EB, greenCyan #87EE77, green #9DEE3A, yellowGreen #CBEE3A` — not the current `OM_WHEEL_HUE` approximations.
- `OM_WHEEL_ORDER`/`OM_WHEEL_ABBR` (`index.html:1210-1211`) remain valid and reusable as-is — do not change their key order or abbreviations.
- The Obsidian note's 12-point wheel naming maps positionally (not semantically) to the app schema: `Yellow→yellow, Orange→orange, Red→orangeRed, Pink→red, Magenta→magenta, Pink-Purple→violet, Blue-Purple→blue, Blue→blueCyan, Aqua→cyan, Green→greenCyan, Lime→green, Yellow-Green→yellowGreen`. This mapping is applied once while authoring `gear.js` data — never a runtime transform.
- MONO-type objects (`recipe_type === 'MONO'` or no `color_wheel`) render the existing compact "MONO" placeholder circle instead of the wheel — unchanged visual behavior from the current `omColorWheel()`.
- Explore and Compare tabs get no functional OM changes in this pass — they keep their existing `activeGen === 'OM'` empty-state guards untouched. `buildOmVisual()` is written standalone specifically so a future pass can call it from those tabs without touching this pass's code.
- "Potential future om-3" section of the Obsidian note (speculative C5/COLOR4/MONO4) is out of scope — do not implement it.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify | New `buildOmVisual()` function + CSS; `makeOmCard()` rewire; `fingerprint()` OM-branch removal; My tab HTML rename; `renderMyCustomSetup()` replacing `renderMyRecipes()`; `switchTab()`/`switchInnerTab()` default updates |
| `gear.js` | Modify | New `MY_CUSTOM_SETUPS` top-level object (X-T50 pointer + full PEN-F `modes`/`colorProfiles`/`monoProfiles` data + X-M5 empty placeholder), inserted after `MY_CUSTOM_SLOTS` (line 569), before `MY_SCENARIOS` |

---

### Task 1: `buildOmVisual()` — shared OM display standard

**Files:**
- Modify: `index.html:1217-1240` (replace `omColorWheel(r)` with `buildOmVisual(obj)`)
- Modify: `index.html` `<style>` block, insert new CSS after line 449 (`@media(max-width:520px){.cs-pc-wrap{grid-template-columns:1fr}}`)

**Interfaces:**
- Produces: `buildOmVisual(obj)` — takes a plain object with fields `{ color_wheel, recipe_type, contrast, sharpness, highlights, shadows, midtones, shading_effect, exposure_compensation, white_balance, wb_amber_offset, wb_green_offset, monochrome_profile, monochrome_color }`. Returns one HTML string containing: Sh/Mid/Hi header row, wheel SVG (or MONO placeholder), WB box SVG, tone/exposure slider rows. Called by `makeOmCard()` (Task 2) and by PEN-F profile card rendering (Task 6).

- [ ] **Step 1: Add CSS for the new OM visual card**

Insert after `index.html:449` (right after `@media(max-width:520px){.cs-pc-wrap{grid-template-columns:1fr}}`):

```css

/* ─── OM Display Standard ─── */
.omv{display:flex;flex-direction:column;gap:10px;align-items:center;padding:10px;background:var(--surf2);border-radius:var(--r);width:100%;box-sizing:border-box}
.omv-shmidhi{display:flex;justify-content:space-between;width:100%;max-width:220px;font-size:10px;color:var(--text2);font-weight:600}
.omv-shmidhi span strong{color:var(--text);font-weight:700}
.omv-wheel-wrap{display:flex;justify-content:center}
.omv-wb-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
.omv-wb-label{font-size:10px;color:var(--text2);text-align:center}
.omv-tones{display:flex;flex-direction:column;gap:5px;width:100%;max-width:220px}
.omv-tone-row{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text2)}
.omv-tone-row span{flex-shrink:0;width:74px}
.omv-tone-row strong{flex-shrink:0;width:28px;text-align:right;color:var(--text)}
.omv-tone-row input[type=range]{flex:1;pointer-events:none;accent-color:var(--accent2)}
```

- [ ] **Step 2: Replace `omColorWheel(r)` with `buildOmVisual(obj)`**

Replace the entire function at `index.html:1217-1240` (from `function omColorWheel(r) {` through its closing `}`) with:

```js
function buildOmVisual(obj) {
  const cw = obj.color_wheel
  const isMono = !cw || obj.recipe_type === 'MONO'
  const wheelHtml = isMono
    ? `<svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r="44" fill="none" stroke="#3e3e50" stroke-width="1"/><circle cx="70" cy="70" r="22" fill="#34343c"/><text x="70" y="67" text-anchor="middle" font-size="11" font-weight="700" fill="#9a9aaa" font-family="Inter,sans-serif">MONO</text><text x="70" y="81" text-anchor="middle" font-size="8" fill="#6a6a78" font-family="Inter,sans-serif">${(obj.monochrome_color||obj.monochrome_profile||'').slice(0,14)}</text></svg>`
    : buildOmWheelSvg(cw)
  const wbHtml = buildOmWbBox(obj)
  const toneRows = [
    ['Shading Effect', obj.shading_effect],
    ['Sharpness', obj.sharpness],
    ['Contrast', obj.contrast],
    ['Exposure Comp', obj.exposure_compensation],
  ].map(([label, v]) => {
    const val = v == null ? 0 : v
    const disp = val > 0 ? '+' + val : '' + val
    return `<div class="omv-tone-row"><span>${label}</span><input type="range" min="-6" max="6" value="${clamp(val,-6,6)}" disabled><strong>${disp}</strong></div>`
  }).join('')
  const sh = obj.shadows ?? 0, mid = obj.midtones ?? 0, hi = obj.highlights ?? 0
  const fmt = v => v > 0 ? '+' + v : '' + v
  return `<div class="omv">
    <div class="omv-shmidhi"><span>Sh: <strong>${fmt(sh)}</strong></span><span>Mid: <strong>${fmt(mid)}</strong></span><span>Hi: <strong>${fmt(hi)}</strong></span></div>
    <div class="omv-wheel-wrap">${wheelHtml}</div>
    <div class="omv-wb-wrap">${wbHtml}</div>
    <div class="omv-tones">${toneRows}</div>
  </div>`
}

function buildOmWheelSvg(cw) {
  const N = OM_WHEEL_ORDER.length, cx = 130, cy = 130
  const OM_WHEEL_REF_HUE = { yellow:'#FCF750', orange:'#DBA12A', orangeRed:'#CC1210', red:'#CD076B', magenta:'#970AA0', violet:'#7710E8', blue:'#3054E0', blueCyan:'#5392EB', cyan:'#83E7EB', greenCyan:'#87EE77', green:'#9DEE3A', yellowGreen:'#CBEE3A' }
  const radiusFor = v => clamp(49.23 + 6.15 * (v ?? 0), 8, 130)
  const ringPts = OM_WHEEL_ORDER.map((k, i) => {
    const ang = (2 * Math.PI * i / N) - Math.PI / 2
    return { x: cx + 118 * Math.cos(ang), y: cy + 118 * Math.sin(ang), k, ang }
  })
  const outerSegs = ringPts.map((p, i) => {
    const next = ringPts[(i + 1) % N]
    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${next.x.toFixed(1)}" y2="${next.y.toFixed(1)}" stroke="${OM_WHEEL_REF_HUE[p.k]}" stroke-width="4"/>`
  }).join('')
  const dataPts = OM_WHEEL_ORDER.map((k, i) => {
    const v = cw[k] ?? 0
    const ang = (2 * Math.PI * i / N) - Math.PI / 2
    const r = radiusFor(v)
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), v, k, ang }
  })
  const poly = dataPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const labels = dataPts.map(p => {
    const lx = cx + (radiusFor(p.v) + 12) * Math.cos(p.ang)
    const ly = cy + (radiusFor(p.v) + 12) * Math.sin(p.ang)
    const disp = p.v > 0 ? '+' + p.v : '' + p.v
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#b8b8d0" font-family="Inter,sans-serif">${disp}</text>`
  }).join('')
  const guideRing = `<circle cx="${cx}" cy="${cy}" r="49.23" fill="none" stroke="#3e3e50" stroke-width="1"/>`
  return `<svg width="140" height="140" viewBox="0 0 260 260">${outerSegs}${guideRing}<polygon points="${poly}" fill="#ffffff" fill-opacity=".08" stroke="#ffffff" stroke-opacity=".4" stroke-width="1.5"/>${labels}</svg>`
}

function buildOmWbBox(obj) {
  const amber = clamp(obj.wb_amber_offset ?? 0, -7, 7)
  const green = clamp(obj.wb_green_offset ?? 0, -7, 7)
  const dotX = 75 + amber * 7
  const dotY = 75 - green * 7
  const svg = `<svg width="90" height="90" viewBox="0 0 150 150">
    <rect x="4" y="4" width="142" height="142" rx="10" fill="#131318" stroke="#2e2e34" stroke-width="1"/>
    <rect x="4" y="4" width="142" height="4" fill="#4caf81"/>
    <rect x="4" y="142" width="142" height="4" fill="#d84ad0"/>
    <rect x="142" y="4" width="4" height="142" fill="#e8934a"/>
    <rect x="4" y="4" width="4" height="142" fill="#3054E0"/>
    <line x1="${(dotX-10).toFixed(1)}" y1="${dotY.toFixed(1)}" x2="${(dotX+10).toFixed(1)}" y2="${dotY.toFixed(1)}" stroke="#585868" stroke-width="1"/>
    <line x1="${dotX.toFixed(1)}" y1="${(dotY-10).toFixed(1)}" x2="${dotX.toFixed(1)}" y2="${(dotY+10).toFixed(1)}" stroke="#585868" stroke-width="1"/>
    <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="5" fill="#e8c05a" stroke="#0d0d0f" stroke-width="1"/>
  </svg>`
  const ampStr = amber >= 0 ? 'A.' + amber : 'A' + amber
  const grnStr = green >= 0 ? 'G.' + green : 'G' + green
  return `${svg}<div class="omv-wb-label">${obj.white_balance || 'Auto'} &nbsp; ${ampStr} &nbsp; ${grnStr}</div>`
}
```

- [ ] **Step 3: Manual verification — serve and check wheel/WB render**

Run: `cd /Users/juqq/workspace/workspace_jq/junqing.github.io && python3 -m http.server 8000`

Open `http://localhost:8000/`, in the browser devtools console run:

```js
document.body.insertAdjacentHTML('beforeend', buildOmVisual({color_wheel:{yellow:-3,orange:0,orangeRed:0,red:1,magenta:-2,violet:-1,blue:-2,blueCyan:-1,cyan:-3,greenCyan:-2,green:-4,yellowGreen:-4},recipe_type:'COLOR',contrast:0,sharpness:0,highlights:-2,shadows:-6,midtones:2,shading_effect:0,exposure_compensation:0,white_balance:'Custom WB 1',wb_amber_offset:1,wb_green_offset:0}))
```

Expected: a wheel with a 12-segment rainbow ring, an inner white polygon distorted toward the pulled-down (negative) channels, a WB box with colored edges and a dot offset right of center, and 4 tone rows below with disabled sliders showing `0 / 0 / 0 / 0`. Remove the test node afterward (refresh page).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add buildOmVisual() shared OM display standard"
```

---

### Task 2: Rewire `makeOmCard()` and remove `fingerprint()`'s OM branch

**Files:**
- Modify: `index.html:1086-1089` (delete `fingerprint()`'s OM early-return)
- Modify: `index.html:1242-1245` (rewire `makeOmCard()`'s `imgHtml`)

**Interfaces:**
- Consumes: `buildOmVisual(obj)` from Task 1.
- Produces: `makeOmCard(r, div)` unchanged signature, now delegates its visual area to `buildOmVisual(r)`.

- [ ] **Step 1: Delete `fingerprint()`'s OM early-return**

In `index.html`, remove lines 1087-1089 (the `if (activeGen === 'OM') { return ... }` block) from inside `fingerprint(r)`, so the function starts directly with:

```js
function fingerprint(r) {
  const ccMap={'Off':0,'Weak':1,'Strong':2}
```

This is safe: all 4 call sites of `fingerprint()` reachable at runtime while `activeGen === 'OM'` — `renderMyRecipes()`'s `MY_RECIPES`-driven cards (Fuji-only, `MY_RECIPES` currently empty), `renderCompareSideBySide()` (gated behind `initCompare()`/`renderCompare()`'s own `activeGen === 'OM'` empty-state checks at lines 3013/3128), and `renderExploreResults()` (only invoked once `initExplore()` builds its controls, which it never does when `activeGen === 'OM'`, per its own guard at line 4228) — never call `fingerprint()` while OM is active.

- [ ] **Step 2: Rewire `makeOmCard()`'s image area**

Replace `index.html:1243-1245`:

```js
function makeOmCard(r, div) {
  const wbMode = r.white_balance
    ? `<div class="mr-detail-row"><span class="mr-detail-label">WB</span><span class="mr-detail-val">${r.white_balance}</span></div>` : ''
  const imgHtml=`<div class="card-img-fp"><div class="card-fp-inner">${omColorWheel(r)}</div><div class="card-drwb">${wbMode}</div></div>`
```

with:

```js
function makeOmCard(r, div) {
  const imgHtml=`<div class="card-img-fp" style="height:auto;flex-direction:column">${buildOmVisual(r)}</div>`
```

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8000`, open the app, switch the "Recipe family" dropdown to "OM System", open the Recipes tab.

Expected: OM recipe cards render the new wheel/WB/tone-row visual in place of the old bloom-wheel + ad-hoc WB text row, with no console errors. Expand a card and confirm the settings table below still lists all OM fields unchanged.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: rewire makeOmCard() through buildOmVisual(), drop fingerprint() OM branch"
```

---

### Task 3: Rename "My Recipes" → "My Custom Setup" (HTML + dispatch)

**Files:**
- Modify: `index.html:728` (tab button)
- Modify: `index.html:732-738` (pane id + copy)
- Modify: `index.html:1638` (`switchTab` dispatch)

**Interfaces:**
- Produces: pane id `inner-my-setup` (was `inner-my-recipes`), container ids `custom-setup-body` (was `custom-slots-body`) — consumed by Task 5's `renderMyCustomSetup()`.

- [ ] **Step 1: Rename tab button and pane**

Replace `index.html:725-738`:

```html
  <!-- MY (merged My Recipes + My Gear) -->
  <div class="pane" id="pane-my">
    <div class="inner-subtabs">
      <button class="inner-subtab on" data-inner="inner-my-recipes">My Recipes</button>
      <button class="inner-subtab" data-inner="inner-my-gear">My Gear</button>
      <button class="inner-subtab" data-inner="inner-my-scenarios">Scenario Cases</button>
    </div>
    <div class="inner-pane on" id="inner-my-recipes">
      <div class="sec-title">My Custom Slots</div>
      <div class="sec-desc">C1–C7 settings saved on your cameras — single recipes and multi-simulation sets with full settings, usage notes, and a filter guide for C7.</div>
      <div id="custom-slots-body"></div>
      <div class="mr-grid" id="myrecipes-body"></div>
    </div>
```

with:

```html
  <!-- MY (merged My Custom Setup + My Gear) -->
  <div class="pane" id="pane-my">
    <div class="inner-subtabs">
      <button class="inner-subtab on" data-inner="inner-my-setup">My Custom Setup</button>
      <button class="inner-subtab" data-inner="inner-my-gear">My Gear</button>
      <button class="inner-subtab" data-inner="inner-my-scenarios">Scenario Cases</button>
    </div>
    <div class="inner-pane on" id="inner-my-setup">
      <div class="sec-title">My Custom Setup</div>
      <div class="sec-desc">Your personal camera setups — custom slots, shooting modes, and creative profiles. Pick a camera below.</div>
      <div id="custom-setup-body"></div>
    </div>
```

- [ ] **Step 2: Update `switchTab()` default inner pane**

In `index.html:1638`, replace:

```js
  if(id==='my') { switchInnerTab(innerPaneId || 'inner-my-recipes'); renderMyRecipes(); }
```

with:

```js
  if(id==='my') { switchInnerTab(innerPaneId || 'inner-my-setup'); renderMyCustomSetup(); }
```

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8000`, open the app, click the "My" tab.

Expected: tab bar shows "My Custom Setup" / "My Gear" / "Scenario Cases"; clicking "My Custom Setup" shows the (currently empty, pending Task 5) `#custom-setup-body` container with no console errors about missing `renderMyRecipes`/`renderMyCustomSetup` yet (function is defined in Task 5 — this task alone will show a blank pane, which is expected until Task 5 lands).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: rename My Recipes tab to My Custom Setup"
```

---

### Task 4: Author `MY_CUSTOM_SETUPS` PEN-F data in `gear.js`

**Files:**
- Modify: `gear.js`, insert after line 569 (end of `MY_CUSTOM_SLOTS`), before line 575 (`const MY_SCENARIOS`)

**Interfaces:**
- Produces: `MY_CUSTOM_SETUPS` — object keyed by exact camera name strings matching `MY_CAMERAS[].name` (`"Fujifilm X-T50"`, `"Olympus PEN-F"`, `"Fujifilm X-M5"`). `"Fujifilm X-T50"` → `{ type: "fuji-slots" }`. `"Olympus PEN-F"` → `{ type: "om-dial", modes: [...], colorProfiles: [...], monoProfiles: [...] }`. `"Fujifilm X-M5"` → `{ type: "empty" }`. Consumed by `renderMyCustomSetup()` in Task 5.

- [ ] **Step 1: Insert `MY_CUSTOM_SETUPS` into `gear.js`**

Insert immediately after `gear.js:569` (the `];` closing `MY_CUSTOM_SLOTS`), before the blank line preceding `const MY_SCENARIOS`:

```js

// ─── My Custom Setup (camera-aware) ───
// "fuji-slots" cameras render MY_CUSTOM_SLOTS via renderCustomSlots() unchanged.
// "om-dial" cameras render shooting modes + creative color/mono profiles via buildOmVisual().
// "empty" cameras show a placeholder until the user fills in real data.
const MY_CUSTOM_SETUPS = {
  "Fujifilm X-T50": { type: "fuji-slots" },
  "Olympus PEN-F": {
    type: "om-dial",
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
      {
        slot: "C2", name: "Action",
        purpose: ["Cyclists", "Kids", "Dogs", "Running people", "Events", "General movement"],
        settings: [["Exposure mode","M + Auto ISO"], ["Shutter speed","1/1000"], ["Aperture","f/2.8–f/4"],
                   ["Auto ISO ceiling","ISO 6400"], ["AF mode","C-AF"], ["AF area","Group"],
                   ["Face/Eye Priority","Off"], ["Drive mode","Sequential L"], ["Shutter","Mechanical"],
                   ["Stabilization","S-IS AUTO"], ["Metering","ESP"]],
        why: ["1/1000 freezes most casual action.", "C-AF tracks moving subjects.",
              "Sequential L is preferable to Sequential H when you want AF to continue updating between frames."],
        shortcut: "C2 = things moving quickly",
      },
      {
        slot: "C3", name: "People",
        purpose: ["Portraits", "Friends and family", "Environmental portraits", "People encountered while walking around"],
        settings: [["Exposure mode","A"], ["Aperture","f/1.8–f/2.8"], ["Auto ISO ceiling","ISO 3200"],
                   ["AF mode","S-AF"], ["AF area","All Targets"], ["Face/Eye Priority","On"],
                   ["Eye priority","Nearest eye"], ["Drive mode","Single"], ["Shutter","Mechanical"],
                   ["Stabilization","S-IS AUTO"], ["Metering","ESP"]],
        why: ["Aperture priority makes depth of field the primary decision.",
              "Face/Eye AF lets the camera handle focus placement.",
              "All Targets gives face detection the whole frame to work with."],
        shortcut: "C3 = the human face matters",
      },
      {
        slot: "C4", name: "Night / Low Light",
        purpose: ["Evening streets", "Cafés", "Restaurants", "Museums", "Interiors", "Night walkaround", "Low-light events"],
        settings: [["Exposure mode","M + Auto ISO"], ["Shutter speed","1/125"], ["Aperture","Wide open, typically f/1.8–f/2.8"],
                   ["Auto ISO ceiling","ISO 6400"], ["AF mode","S-AF"], ["AF area","Small / Single"],
                   ["Face/Eye Priority","On"], ["Drive mode","Single"], ["Shutter","Mechanical"],
                   ["Stabilization","S-IS AUTO"], ["Metering","ESP"]],
        why: ["For people: stay around 1/125–1/250.", "For static subjects: lower to 1/60, 1/30, or slower when stabilization allows.",
              "Let Auto ISO absorb most lighting changes."],
        shortcut: "C4 = the light has disappeared",
      },
    ],
    colorProfiles: [
      {
        id: "COLOR 1", name: "Soft Negative", role: "Portra-ish / warm negative / everyday color",
        best_for: ["People", "Travel", "Everyday photography", "Soft daylight", "Skin tones"],
        recipe_type: "COLOR",
        color_wheel: { yellow:-1, orange:1, orangeRed:1, red:0, magenta:-1, violet:-1, blue:-1, blueCyan:-1, cyan:-2, greenCyan:-2, green:-2, yellowGreen:-2 },
        shadows: -1, midtones: 2, highlights: -1, contrast: -1, sharpness: -1,
        white_balance: "Auto", wb_amber_offset: null, wb_green_offset: null,
        character: ["Warm colors remain alive.", "Greens and blues are restrained.", "Contrast is slightly softer.",
                    "Intended as a Portra-like role rather than an exact Portra reproduction."],
        good_combos: ["C3 People + COLOR 1", "C1 Street + COLOR 1 for warmer everyday scenes"],
        shortcut: "COLOR 1 = Soft",
      },
      {
        id: "COLOR 2", name: "Reportage", role: "Classic-Chrome-ish / documentary / muted street color",
        best_for: ["Street", "Architecture", "Trains", "Cafés", "Rainy weather", "Urban scenes", "Documentary photography"],
        recipe_type: "COLOR",
        color_wheel: { yellow:-2, orange:0, orangeRed:0, red:-2, magenta:-2, violet:-2, blue:-2, blueCyan:-2, cyan:-3, greenCyan:-3, green:-3, yellowGreen:-3 },
        shadows: 4, midtones: 0, highlights: -1, contrast: 1, sharpness: -1,
        white_balance: "Auto", wb_amber_offset: null, wb_green_offset: null,
        character: ["Most colors are desaturated.", "Reds and oranges retain more presence.",
                    "Stronger shadow character.", "Designed as a documentary / reportage look."],
        good_combos: ["C1 Street + COLOR 2", "C4 Night + COLOR 2"],
        shortcut: "COLOR 2 = Muted",
      },
      {
        id: "COLOR 3", name: "Punchy Slide", role: "Vivid slide-film style / colorful daylight",
        best_for: ["Summer", "Blue skies", "Flowers", "Seaside", "Colorful buildings", "Travel", "Strong sunlight", "Landscapes"],
        recipe_type: "COLOR",
        color_wheel: { yellow:1, orange:3, orangeRed:5, red:5, magenta:5, violet:5, blue:4, blueCyan:4, cyan:4, greenCyan:2, green:1, yellowGreen:0 },
        shadows: -4, midtones: 0, highlights: 4, contrast: 0, sharpness: -1,
        white_balance: "Auto", wb_amber_offset: null, wb_green_offset: null,
        character: ["Strong color separation.", "Punchy reds, blues and magentas.",
                    "Bright, energetic daylight rendering.", "Think slide film rather than negative film.",
                    "If it feels too intense: reduce the +5 values to roughly +3 before changing the rest of the recipe."],
        good_combos: ["C1 Street + COLOR 3 on sunny days", "C3 People + COLOR 3 for colorful environmental portraits"],
        shortcut: "COLOR 3 = Punch",
      },
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
      {
        id: "MONO 2", name: "Tri-X Street", role: "Classic B&W film / reportage / street",
        best_for: ["Street", "People", "Night", "Documentary work", "Gritty urban scenes"],
        recipe_type: "MONO",
        monochrome_profile: "Factory Mono 2", monochrome_color: "Yellow", monochrome_color_strength: 1,
        film_grain: "Medium", monochrome_vignetting: "Dark 1",
        shadows: 0, midtones: 0, highlights: 0, contrast: 0, sharpness: 0,
        character: ["Classic black-and-white film feel.", "Medium grain adds texture without overwhelming the image.",
                    "Yellow filtration gives gentle separation and remains usable with people.",
                    "Contrast and Highlight/Shadow kept at factory initially."],
        good_combos: ["C1 Street + MONO 2", "C4 Night + MONO 2", "C3 People + MONO 2 for grittier portraits"],
        shortcut: "MONO 2 = Film",
      },
      {
        id: "MONO 3", name: "Drama", role: "Dramatic / infrared-inspired / graphic B&W",
        best_for: ["Buildings", "Clouds", "Strong skies", "Hard sunlight", "Graphic compositions", "Deep shadows", "Architectural scenes"],
        recipe_type: "MONO",
        monochrome_profile: "Mono 3", monochrome_color: "Red", monochrome_color_strength: 2,
        film_grain: "Low", monochrome_vignetting: "Dark 1",
        shadows: 0, midtones: 0, highlights: 0, contrast: 1, sharpness: 0,
        character: ["Darker blue skies.", "Stronger cloud separation.", "More graphic contrast.",
                    "Designed to be deliberately dramatic rather than general purpose."],
        good_combos: ["C1 Street + MONO 3 for architecture", "C4 Night + MONO 3 for graphic night scenes"],
        shortcut: "MONO 3 = Drama",
      },
    ],
  },
  "Fujifilm X-M5": { type: "empty" },
};
```

- [ ] **Step 2: Verify syntax loads cleanly**

Run: `node -e "$(cat gear.js); console.log(Object.keys(MY_CUSTOM_SETUPS)); console.log(MY_CUSTOM_SETUPS['Olympus PEN-F'].modes.length, MY_CUSTOM_SETUPS['Olympus PEN-F'].colorProfiles.length, MY_CUSTOM_SETUPS['Olympus PEN-F'].monoProfiles.length)"`

Expected: `[ 'Fujifilm X-T50', 'Olympus PEN-F', 'Fujifilm X-M5' ]` followed by `4 3 3`.

- [ ] **Step 3: Commit**

```bash
git add gear.js
git commit -m "feat: add MY_CUSTOM_SETUPS with PEN-F modes and creative profiles"
```

---

### Task 5: `renderMyCustomSetup()` — camera selector + dispatch

**Files:**
- Modify: `index.html:2679-2683` region — rename `renderMyRecipes()`/`myRecipesBuilt` and rebuild its body
- Modify: `index.html` `<style>` block, insert PEN-F card CSS after Task 1's new CSS block

**Interfaces:**
- Consumes: `MY_CUSTOM_SETUPS` (Task 4), `renderCustomSlots()` (unchanged, `index.html:2390+`), `buildOmVisual()` (Task 1).
- Produces: `renderMyCustomSetup()` — replaces `renderMyRecipes()`, called from `switchTab()` (Task 3). Build-once guard `mySetupBuilt` (was `myRecipesBuilt`). Also tracks `activeSetupCamera` (module-level string, default `"Fujifilm X-T50"`) so re-switching the "My" tab doesn't reset which camera pane is showing.

- [ ] **Step 1: Add CSS for PEN-F mode/profile cards**

Insert directly after the CSS block added in Task 1 Step 1 (after `.omv-tone-row input[type=range]{...}`):

```css
.pfm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-bottom:20px}
.pfm-card{background:var(--surf);border:1px solid var(--border);border-radius:var(--r2);padding:12px 14px}
.pfm-head{display:flex;align-items:baseline;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.pfm-slot{padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:rgba(212,168,67,.18);color:var(--accent2)}
.pfm-name{font-size:13px;font-weight:700;color:var(--text)}
.pfm-role{font-size:11px;color:var(--text2);margin-bottom:8px;font-style:italic}
.pfm-shortcut{font-size:11px;font-weight:700;color:var(--accent2);margin-top:8px}
.pfm-list{margin:0 0 8px;padding-left:14px;list-style:disc}
.pfm-list li{font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:2px}
.pfm-consistency{background:rgba(212,168,67,.09);border:1px solid rgba(212,168,67,.28);border-left:3px solid var(--accent2);border-radius:var(--r);padding:9px 12px;font-size:12px;color:var(--text);line-height:1.6;margin-bottom:16px}
```

- [ ] **Step 2: Replace `renderMyRecipes()` with `renderMyCustomSetup()`**

Replace `index.html:2679` (`let myRecipesBuilt = false`) through the end of the existing `renderMyRecipes()` function body (ending where `renderScenarios()` begins at line 2816) with:

```js
let mySetupBuilt = false
let activeSetupCamera = 'Fujifilm X-T50'

function renderMyCustomSetup() {
  const wrap = $('custom-setup-body')
  if (!wrap) return
  const cams = (typeof MY_CUSTOM_SETUPS !== 'undefined') ? MY_CUSTOM_SETUPS : {}
  const camNames = Object.keys(cams)
  if (!camNames.includes(activeSetupCamera)) activeSetupCamera = camNames[0]

  if (!mySetupBuilt) {
    mySetupBuilt = true
    wrap.innerHTML = `<div class="cs-subtabs" id="setup-cam-tabs"></div><div id="setup-cam-pane"></div>`
    const tabBar = $('setup-cam-tabs')
    camNames.forEach(name => {
      const tab = document.createElement('button')
      tab.className = 'cs-subtab' + (name === activeSetupCamera ? ' active' : '')
      tab.innerHTML = `<span class="cs-subtab-name">${name}</span>`
      tab.addEventListener('click', () => {
        activeSetupCamera = name
        tabBar.querySelectorAll('.cs-subtab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        renderSetupCameraPane(name)
      })
      tabBar.appendChild(tab)
    })
  }
  renderSetupCameraPane(activeSetupCamera)
}

function renderSetupCameraPane(camName) {
  const pane = $('setup-cam-pane')
  if (!pane) return
  const setup = MY_CUSTOM_SETUPS[camName]
  pane.innerHTML = ''
  if (!setup || setup.type === 'empty') {
    pane.innerHTML = '<div class="empty"><div class="big">📷</div><p>No custom setup yet for this camera. Edit <strong>gear.js</strong> on GitHub to add one.</p></div>'
    return
  }
  if (setup.type === 'fuji-slots') {
    pane.innerHTML = '<div id="custom-slots-body"></div>'
    renderCustomSlots()
    return
  }
  if (setup.type === 'om-dial') {
    pane.innerHTML = `
      <div class="pfm-consistency"><strong>Global Consistency:</strong> Use Auto WB as the default. Keep Warm Color: Off. Avoid storing radically different WB shifts inside individual C modes unless intentional. Shoot RAW+JPEG while refining profiles. The goal is that COLOR 1 always looks like COLOR 1 regardless of whether you are currently using C1, C2, C3 or C4.</div>
      <div class="sec-title">Shooting Modes</div>
      <div class="pfm-grid" id="setup-modes-grid"></div>
      <div class="sec-title">Color Profiles</div>
      <div class="pfm-grid" id="setup-color-grid"></div>
      <div class="sec-title">Mono Profiles</div>
      <div class="pfm-grid" id="setup-mono-grid"></div>`
    const modesGrid = $('setup-modes-grid')
    setup.modes.forEach(m => {
      const settingsRows = m.settings.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
      const card = document.createElement('div')
      card.className = 'pfm-card'
      card.innerHTML = `
        <div class="pfm-head"><span class="pfm-slot">${m.slot}</span><span class="pfm-name">${m.name}</span></div>
        <ul class="pfm-list">${m.purpose.map(p=>`<li>${p}</li>`).join('')}</ul>
        <table class="stbl"><tbody>${settingsRows}</tbody></table>
        <ul class="pfm-list">${m.why.map(w=>`<li>${w}</li>`).join('')}</ul>
        <div class="pfm-shortcut">${m.shortcut}</div>`
      modesGrid.appendChild(card)
    })
    const colorGrid = $('setup-color-grid')
    setup.colorProfiles.forEach(p => {
      const card = document.createElement('div')
      card.className = 'pfm-card'
      card.innerHTML = `
        <div class="pfm-head"><span class="pfm-slot">${p.id}</span><span class="pfm-name">${p.name}</span></div>
        <div class="pfm-role">${p.role}</div>
        ${buildOmVisual(p)}
        <ul class="pfm-list">${p.character.map(c=>`<li>${c}</li>`).join('')}</ul>
        <ul class="pfm-list">${p.good_combos.map(c=>`<li>${c}</li>`).join('')}</ul>
        <div class="pfm-shortcut">${p.shortcut}</div>`
      colorGrid.appendChild(card)
    })
    const monoGrid = $('setup-mono-grid')
    setup.monoProfiles.forEach(p => {
      const card = document.createElement('div')
      card.className = 'pfm-card'
      card.innerHTML = `
        <div class="pfm-head"><span class="pfm-slot">${p.id}</span><span class="pfm-name">${p.name}</span></div>
        <div class="pfm-role">${p.role}</div>
        ${buildOmVisual(p)}
        <ul class="pfm-list">${p.character.map(c=>`<li>${c}</li>`).join('')}</ul>
        <ul class="pfm-list">${p.good_combos.map(c=>`<li>${c}</li>`).join('')}</ul>
        <div class="pfm-shortcut">${p.shortcut}</div>`
      monoGrid.appendChild(card)
    })
    return
  }
}
```

- [ ] **Step 2b: Delete now-superseded per-recipe-card logic**

Confirm the old `renderMyRecipes()` body's `MY_RECIPES`-lookup card-building code (the block using `byName`, `heroFp`, `mr-card`, etc., originally spanning through line 2815) is entirely removed by the Step 2 replacement — it depended on the now-removed `myrecipes-body` container and `MY_RECIPES` array, which stays defined in `gear.js` but is no longer rendered anywhere. This is intentional: `MY_RECIPES` was already empty (`[]`) and reserved for future use per `CLAUDE.md`; no functional loss since the array has never had entries.

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8000`, open the app, click "My" → "My Custom Setup".

Expected: pill tab bar shows "Fujifilm X-T50" / "Olympus PEN-F" / "Fujifilm X-M5". X-T50 pane renders the C1-C7 slot tabs identically to the old "My Recipes" view. PEN-F pane shows the Global Consistency note, 4 mode cards (Street/Action/People/Night with settings tables and why-lists), 3 color profile cards and 3 mono profile cards each with a working wheel/MONO-placeholder + WB box + tone rows. X-M5 pane shows the empty-state message. No console errors when switching between camera tabs repeatedly.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add camera-aware My Custom Setup with PEN-F modes and profiles"
```

---

### Task 6: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (Tabs table, "My Custom Setup" description, gear.js description)

**Interfaces:**
- None — documentation only.

- [ ] **Step 1: Update the Tabs table row for "My"**

In `CLAUDE.md`'s Tabs section, change the "My" row's inner-subtabs column from `My Recipes (inner-my-recipes)` to `My Custom Setup (inner-my-setup)`, and its render-function column from `renderMyRecipes()` + `renderCustomSlots()` to `renderMyCustomSetup()` (dispatches to `renderCustomSlots()` for X-T50, or renders PEN-F modes/profiles via `buildOmVisual()`, or an empty state for X-M5).

- [ ] **Step 2: Add a short section documenting `MY_CUSTOM_SETUPS` and `buildOmVisual()`**

Add a new subsection near the existing `MY_CUSTOM_SLOTS` documentation describing: `MY_CUSTOM_SETUPS` object keyed by exact `MY_CAMERAS[].name` strings, `type: "fuji-slots" | "om-dial" | "empty"`, and that `buildOmVisual(obj)` (`index.html`) is the shared OM display standard (wheel + WB box + tone rows) used by both real `RECIPES_OM` cards (`makeOmCard()`) and PEN-F profile objects in `MY_CUSTOM_SETUPS`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document MY_CUSTOM_SETUPS and buildOmVisual() in CLAUDE.md"
```

---

## Testing (final end-to-end pass)

- Serve locally, open My tab → My Custom Setup subtab.
- Confirm camera pill bar shows X-T50 / PEN-F / X-M5; X-T50 pane renders identically to the old "My Recipes" content (C1–C7 slots, unchanged).
- Confirm PEN-F pane shows C1–C4 mode cards (settings/why/shortcut) and COLOR 1–3 / MONO 1–3 profile cards, each with a working 12-point wheel or MONO placeholder, WB box, and tone rows matching the om-recipes.com visual style.
- Confirm X-M5 pane shows a clean empty state.
- Switch to Recipes tab, select OM System generation, spot-check that `makeOmCard()` still renders correctly using `buildOmVisual()`.
- Confirm Explore/Compare still show their existing "not available for OM" empty states — untouched.
- Confirm switching between Fuji generations and back to OM, and repeatedly re-entering the My tab, doesn't throw console errors or duplicate DOM nodes (build-once guards `mySetupBuilt` working correctly).

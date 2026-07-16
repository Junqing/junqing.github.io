# Recipe Badge Formula Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `color_direction` badge on each recipe card with two computed badges (warmth and punch) derived from camera settings, update sidebar filters to match, make filter sections collapsible, and add a formula explanation to the Settings Guide.

**Architecture:** Two pure JS functions (`recipeWarmth`, `recipePunch`) compute labels from objective settings fields. All render sites (card, compare, My Recipes) call these functions instead of reading `r.color_direction`. The sidebar gains two new filter groups replacing the old "Color Direction" group, with collapsible headers across all filter sections. `RECIPE_META_PATCHES` in `gear.js` supports override fields for edge-case corrections.

**Tech Stack:** Vanilla JS/HTML/CSS, no build step. Single file `index.html` + data file `gear.js`. Serve with `python3 -m http.server 8000`.

## Global Constraints

- No build step — all changes are to `index.html` and `gear.js` directly
- No npm, no bundler, no external libraries
- `color_direction` field stays in `RECIPES` data (untouched) — render code stops reading it
- `RECIPE_META_PATCHES` keys must exactly match `RECIPES[].name`
- Verify with: `python3 -m http.server 8000` then open http://localhost:8000/

---

### Task 1: Add `recipeWarmth()` and `recipePunch()` functions, remove `bc()` / `BADGE_CLS`

**Files:**
- Modify: `index.html` (around line 708 — the `BADGE_CLS` / `bc` / `dc` / `DIR_COLOR` block)

**Interfaces:**
- Produces:
  - `recipeWarmth(r)` → `'warm' | 'neutral' | 'cool'` (string)
  - `recipePunch(r)` → `'punchy' | 'balanced' | 'flat'` (string)
  - `warmthClass(r)` → CSS class string (`'b-warm' | 'b-neutral' | 'b-cool'`)
  - `punchClass(r)` → CSS class string (`'b-punchy' | 'b-neutral' | 'b-flat'`)

- [ ] **Step 1: Open `index.html` and locate the BADGE_CLS block (~line 708)**

  The current block looks like:
  ```js
  const DIR_COLOR = {warm:'#e07842', ...}
  const BADGE_CLS = {warm:'b-warm', ...}
  const dc  = d => DIR_COLOR[d]||'#9a9aaa'
  const bc  = d => BADGE_CLS[d]||'b-default'
  ```

- [ ] **Step 2: Replace that block with the new formula functions**

  Replace the entire block (lines containing `DIR_COLOR`, `BADGE_CLS`, `dc`, `bc`) with:

  ```js
  const DIR_COLOR = {warm:'#e07842','warm-neutral':'#d4a843',cool:'#5b9af0','cool-neutral':'#4db8aa',neutral:'#9a9aaa','high-contrast':'#e05c5c',muted:'#6e6e80',punchy:'#e05c5c',desaturated:'#7a7a8a'}
  const dc = d => DIR_COLOR[d]||'#9a9aaa'

  const BW_SIMS = new Set(['Acros','Acros+R','Acros+Ye','Acros+G','Monochrome','Monochrome+R','Monochrome+Ye','Monochrome+G','Sepia'])
  const WARM_SIMS = new Set(['Nostalgic Neg.','Classic Chrome','Eterna','Eterna/Cinema','PRO Neg. Hi','PRO Neg. Std','Sepia'])
  const COOL_SIMS = new Set(['Eterna Bleach Bypass','Velvia/Vivid'])

  function wbKelvin(wb) {
    if (!wb) return 5200
    const m = wb.match(/(\d{4,5})K/)
    if (m) return parseInt(m[1])
    if (wb === 'Daylight') return 5200
    if (wb === 'Cloudy') return 6000
    if (wb === 'Shade') return 7500
    if (/Auto White Priority/.test(wb)) return 5000
    if (/Auto/.test(wb)) return 5200
    if (/Fluorescent/.test(wb)) return 4000
    if (/Tungsten|Incandescent/.test(wb)) return 3200
    return 5200
  }

  function recipeWarmth(r) {
    if (typeof RECIPE_META_PATCHES !== 'undefined' && RECIPE_META_PATCHES[r.name]?.warmth_override) {
      return RECIPE_META_PATCHES[r.name].warmth_override
    }
    if (BW_SIMS.has(r.film_simulation) || r.color === null || r.color === undefined) return 'neutral'
    const wbNorm    = (wbKelvin(r.white_balance) - 5200) / 2300
    const shiftNorm = ((parseInt(r.wb_shift_red) || 0) - (parseInt(r.wb_shift_blue) || 0)) / 9
    const filmBias  = WARM_SIMS.has(r.film_simulation) ? 0.15 : COOL_SIMS.has(r.film_simulation) ? -0.15 : 0
    const score     = wbNorm * 0.5 + shiftNorm * 0.5 + filmBias
    if (score > 0.35)  return 'warm'
    if (score < -0.20) return 'cool'
    return 'neutral'
  }

  function recipePunch(r) {
    if (typeof RECIPE_META_PATCHES !== 'undefined' && RECIPE_META_PATCHES[r.name]?.punch_override) {
      return RECIPE_META_PATCHES[r.name].punch_override
    }
    const colorVal = (BW_SIMS.has(r.film_simulation) || r.color === null || r.color === undefined) ? 0 : (r.color || 0)
    const score = colorVal * 0.5 + (r.clarity || 0) * 0.25 - (Math.abs(r.highlight || 0) + Math.abs(r.shadow || 0)) * 0.1
    if (score > 1.2)  return 'punchy'
    if (score < -0.5) return 'flat'
    return 'balanced'
  }

  const WARMTH_CLASS = { warm: 'b-warm', neutral: 'b-neutral', cool: 'b-cool' }
  const PUNCH_CLASS  = { punchy: 'b-punchy', balanced: 'b-neutral', flat: 'b-flat' }
  function warmthClass(r) { return WARMTH_CLASS[recipeWarmth(r)] }
  function punchClass(r)  { return PUNCH_CLASS[recipePunch(r)] }
  ```

  Note: `DIR_COLOR` and `dc` are kept — `renderDirections()` still uses `dc()` for card border colors.
  `BADGE_CLS` and `bc` are removed entirely.

- [ ] **Step 3: Verify no other call sites reference `bc(` or `BADGE_CLS`**

  Run:
  ```bash
  grep -n "bc(\|BADGE_CLS" index.html
  ```
  Expected: no results (we'll fix remaining call sites in Tasks 2 and 3).

- [ ] **Step 4: Start server and open browser console, confirm no JS errors on load**

  ```bash
  python3 -m http.server 8000
  ```
  Open http://localhost:8000/, open DevTools console. Expected: no `bc is not defined` or `BADGE_CLS is not defined` errors yet (those come from render call sites we haven't updated).

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add recipeWarmth/recipePunch formula functions, remove BADGE_CLS/bc"
  ```

---

### Task 2: Add `.b-flat` CSS class, update `makeCard()` badge row

**Files:**
- Modify: `index.html` (CSS ~line 76, `makeCard` ~line 889)

**Interfaces:**
- Consumes: `recipeWarmth(r)`, `recipePunch(r)`, `warmthClass(r)`, `punchClass(r)` from Task 1
- Produces: recipe cards show `[Film Sim] [DR] [warm|neutral|cool] [punchy|balanced|flat]`

- [ ] **Step 1: Add `.b-flat` CSS class after `.b-muted` (~line 76)**

  Current CSS around line 76:
  ```css
  .b-muted{background:rgba(100,100,120,.18);color:var(--text3)}
  .b-punchy{background:rgba(224,92,92,.14);color:var(--red)}
  ```

  Add `.b-flat` on a new line after `.b-muted`:
  ```css
  .b-muted{background:rgba(100,100,120,.18);color:var(--text3)}
  .b-flat{background:rgba(100,100,120,.18);color:var(--text3)}
  .b-punchy{background:rgba(224,92,92,.14);color:var(--red)}
  ```

- [ ] **Step 2: Update the badge row in `makeCard()` (~line 890)**

  Find this line:
  ```js
      ${r.color_direction?`<span class="badge ${bc(r.color_direction)}">${r.color_direction}</span>`:''}
  ```

  Replace with:
  ```js
      <span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span>
      <span class="badge ${punchClass(r)}">${recipePunch(r)}</span>
  ```

- [ ] **Step 3: Verify in browser**

  Reload http://localhost:8000/, go to Recipes tab, expand any recipe card.
  - *1970s Summer* badge row should show: `[Nostalgic Neg.] [DR400] [warm] [flat]`
  - *Fujicolor Super HG v2* should show: `[Classic Negative] [DR400] [neutral] [punchy]`
  - *Acros Negative* should show: `[Acros] [DR400] [neutral] [balanced]`
  - No `bc is not defined` errors in console.

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat: replace color_direction badge with two computed warmth/punch badges in makeCard"
  ```

---

### Task 3: Update remaining `bc()` / `color_direction` render sites

**Files:**
- Modify: `index.html` (compare views ~lines 2565, 2587, 2989; `renderMyRecipes` ~lines 2212–2213)

**Interfaces:**
- Consumes: `recipeWarmth(r)`, `recipePunch(r)`, `warmthClass(r)`, `punchClass(r)` from Task 1

- [ ] **Step 1: Confirm all remaining `bc(` and `color_direction` render sites**

  ```bash
  grep -n "bc(\|color_direction" index.html | grep -v "//\|RECIPES\|CORR\|DIRECTIONS\|PATCHES\|r\.color_direction\b.*=\|\"color_direction\""
  ```
  Expected to see: lines ~2213, ~2565, ~2587, ~2989–2990.

- [ ] **Step 2: Update `renderMyRecipes()` badge line (~line 2212–2213)**

  Find:
  ```js
      badges.innerHTML = `<span class="badge b-sim">${r.film_simulation||''}</span>`
      if (r.color_direction) badges.innerHTML += `<span class="badge ${bc(r.color_direction)}">${r.color_direction}</span>`
  ```

  Replace with:
  ```js
      badges.innerHTML = `<span class="badge b-sim">${r.film_simulation||''}</span><span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span><span class="badge ${punchClass(r)}">${recipePunch(r)}</span>`
  ```

- [ ] **Step 3: Update compare header badge (~line 2565)**

  Find:
  ```js
    div.innerHTML = `<span class="cmp-sim-name">${r.name}</span><span class="badge b-sim" style="flex-shrink:0">${r.film_simulation||'?'}</span>${r.color_direction?`<span class="badge ${bc(r.color_direction)}" style="flex-shrink:0">${r.color_direction}</span>`:''}`
  ```

  Replace with:
  ```js
    div.innerHTML = `<span class="cmp-sim-name">${r.name}</span><span class="badge b-sim" style="flex-shrink:0">${r.film_simulation||'?'}</span><span class="badge ${warmthClass(r)}" style="flex-shrink:0">${recipeWarmth(r)}</span><span class="badge ${punchClass(r)}" style="flex-shrink:0">${recipePunch(r)}</span>`
  ```

- [ ] **Step 4: Update compare badges block (~line 2587)**

  Find:
  ```js
      badges.innerHTML = `<span class="badge b-sim">${r.film_simulation||'?'}</span>${r.color_direction?`<span class="badge ${bc(r.color_direction)}">${r.color_direction}</span>`:''}`
  ```

  Replace with:
  ```js
      badges.innerHTML = `<span class="badge b-sim">${r.film_simulation||'?'}</span><span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span><span class="badge ${punchClass(r)}">${recipePunch(r)}</span>`
  ```

- [ ] **Step 5: Update compare modal badge block (~lines 2989–2990)**

  Find:
  ```js
            <span class="badge b-sim">${r.film_simulation||'?'}</span>
            ${r.color_direction?`<span class="badge ${bc(r.color_direction)}">${r.color_direction}</span>`:''}
  ```

  Replace with:
  ```js
            <span class="badge b-sim">${r.film_simulation||'?'}</span>
            <span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span>
            <span class="badge ${punchClass(r)}">${recipePunch(r)}</span>
  ```

- [ ] **Step 6: Confirm no `bc(` references remain**

  ```bash
  grep -n "bc(" index.html
  ```
  Expected: no results.

- [ ] **Step 7: Verify in browser**

  - My Recipes tab: custom slot cards show two computed badges
  - Compare tab: pick two recipes, both show warmth + punch badges in header and side-by-side view
  - No console errors

- [ ] **Step 8: Commit**

  ```bash
  git add index.html
  git commit -m "feat: update compare and My Recipes badge render sites to use computed warmth/punch"
  ```

---

### Task 4: Update sidebar filters (replace Direction with Warmth + Punch)

**Files:**
- Modify: `index.html` (sidebar HTML ~lines 475–478; state ~line 696; `matches()` ~line 722; `initChips()` ~line 751)

**Interfaces:**
- Consumes: `recipeWarmth(r)`, `recipePunch(r)` from Task 1
- Produces: `S.f.warmth` (Set), `S.f.punch` (Set) in filter state; sidebar shows Warmth and Punch chip groups

- [ ] **Step 1: Update state definition (~line 696)**

  Find:
  ```js
    f: { sim: new Set(), dir: new Set(), mood: new Set(), scene: new Set(), era: new Set() },
  ```

  Replace with:
  ```js
    f: { sim: new Set(), warmth: new Set(), punch: new Set(), mood: new Set(), scene: new Set(), era: new Set() },
  ```

- [ ] **Step 2: Update `matches()` (~line 722)**

  Find:
  ```js
    if(S.f.dir.size && !S.f.dir.has(r.color_direction)) return false
  ```

  Replace with:
  ```js
    if(S.f.warmth.size && !S.f.warmth.has(recipeWarmth(r))) return false
    if(S.f.punch.size  && !S.f.punch.has(recipePunch(r)))   return false
  ```

- [ ] **Step 3: Update sidebar HTML (~lines 475–478)**

  Find:
  ```html
    <div class="sb-section">
      <div class="sb-label">Color Direction</div>
      <div class="chips" id="f-dir"></div>
    </div>
  ```

  Replace with:
  ```html
    <div class="sb-section">
      <div class="sb-label">Warmth</div>
      <div class="chips" id="f-warmth"></div>
    </div>
    <div class="sb-section">
      <div class="sb-label">Punch</div>
      <div class="chips" id="f-punch"></div>
    </div>
  ```

- [ ] **Step 4: Update `initChips()` (~line 752)**

  Find:
  ```js
    buildChips('f-dir',[...new Set(RECIPES.map(r=>r.color_direction).filter(Boolean))].sort(),'dir')
  ```

  Replace with:
  ```js
    buildChips('f-warmth', ['warm', 'neutral', 'cool'], 'warmth')
    buildChips('f-punch',  ['punchy', 'balanced', 'flat'], 'punch')
  ```

  Note: warmth and punch chips use fixed value lists (not derived from RECIPES) since the labels are a closed enum.

- [ ] **Step 5: Verify in browser**

  Reload, go to Recipes tab. Sidebar should show "Warmth" section with `[warm] [neutral] [cool]` chips and "Punch" section with `[punchy] [balanced] [flat]` chips. Click "warm" — grid should filter to only warm recipes. Click "flat" — should further narrow. "Clear all filters" should reset both.

- [ ] **Step 6: Commit**

  ```bash
  git add index.html
  git commit -m "feat: replace Color Direction sidebar filter with Warmth and Punch filter groups"
  ```

---

### Task 5: Make sidebar filter sections collapsible

**Files:**
- Modify: `index.html` (CSS ~line 34; sidebar HTML ~lines 466–491; JS after `initChips`)

**Interfaces:**
- Produces: all filter section headers are clickable toggles with ▾/▸ chevron; body collapses/expands

- [ ] **Step 1: Add CSS for collapsible filter headers (~after line 44)**

  After the `.clear-btn:hover` rule, add:
  ```css
  .sb-label{cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none}
  .sb-label::after{content:'▾';font-size:9px;color:var(--text3);transition:transform .15s}
  .sb-section.collapsed .sb-label::after{content:'▸'}
  .sb-section.collapsed .chips{display:none}
  ```

  Note: The existing `.sb-label` rule at line 35 sets font/color — add `cursor`, `display:flex`, and the pseudo-element in the same selector or as an override after it.

- [ ] **Step 2: Add collapse toggle JS after `initChips()` call**

  After the `initChips()` function definition (before the `$('q').addEventListener` line), add:

  ```js
  function initCollapsibleFilters() {
    document.querySelectorAll('.sidebar .sb-section').forEach(section => {
      const label = section.querySelector('.sb-label')
      if (!label) return
      label.addEventListener('click', () => {
        section.classList.toggle('collapsed')
      })
    })
  }
  ```

  Then find the `init()` function (or wherever `initChips()` is called) and add `initCollapsibleFilters()` right after the `initChips()` call.

- [ ] **Step 3: Add `initCollapsibleFilters()` call after `initChips()` at line ~3736**

  Find the call at line ~3736:
  ```js
    initChips()
  ```

  Replace with:
  ```js
    initChips()
    initCollapsibleFilters()
  ```

- [ ] **Step 4: Verify in browser**

  Reload. Click any sidebar section label (e.g. "Film Simulation") — chip group should collapse with ▸ chevron. Click again — expands with ▾. Clicking chips inside expanded sections should still filter correctly.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: make sidebar filter sections collapsible with chevron toggle"
  ```

---

### Task 6: Update `renderDirections()` predicates

**Files:**
- Modify: `index.html` (DIRECTIONS array ~lines 1094–1119)

**Interfaces:**
- Consumes: `recipeWarmth(r)`, `recipePunch(r)` from Task 1

- [ ] **Step 1: Update each `match` predicate in DIRECTIONS to use computed functions**

  Find the `DIRECTIONS` array (~line 1095) and replace the `match` fields as follows:

  **Warm Analog Negative:**
  ```js
  match: r => ['Classic Negative','Nostalgic Neg.'].includes(r.film_simulation) && recipeWarmth(r) === 'warm'
  ```

  **Kodak Portrait / Color Negative** (no `color_direction` used — unchanged):
  ```js
  match: r => r.film_simulation === 'Classic Chrome' && (r.film_emulated||'').match(/kodak/i) && !(r.film_emulated||'').match(/chrome|chrome64|kodachrome/i)
  ```

  **Kodachrome / Slide Positive** (no `color_direction` used — unchanged):
  ```js
  match: r => r.film_simulation === 'Classic Chrome' && (r.film_emulated||'').match(/kodachrome/i)
  ```

  **Punchy Slide / Velvia:**
  ```js
  match: r => r.film_simulation === 'Velvia/Vivid' || recipePunch(r) === 'punchy'
  ```

  **Cool Cinematic / Eterna:**
  ```js
  match: r => (r.film_simulation||'').includes('Eterna') || (recipeWarmth(r) === 'cool' && (r.scenario_keywords||[]).some(s => ['street','urban','documentary','city'].includes(s)))
  ```

  **Vintage Faded / Expired Film** (no `color_direction` used — unchanged):
  ```js
  match: r => ['expired-film','vintage','1960s','1970s','1980s'].includes(r.era_reference) || (r.mood_keywords||[]).some(m => ['faded','dreamy','nostalgic'].includes(m))
  ```

  **Low-Light / Night** (no `color_direction` used — unchanged):
  ```js
  match: r => (r.scenario_keywords||[]).some(s => ['night','fluorescent','low-light','indoor'].includes(s))
  ```

  **Classic B&W** (no `color_direction` used — unchanged):
  ```js
  match: r => (r.film_simulation||'').match(/acros|monochrome/i)
  ```

  Also update the `traits` description strings for Warm Analog Negative and Cool Cinematic / Eterna to remove references to `color_direction` values:

  **Warm Analog Negative traits:**
  ```js
  traits: ['Classic Neg / Nostalgic Neg', 'warm WB + shift', 'Color +1 to +3', 'Shadow −1 to −2']
  ```

  **Cool Cinematic / Eterna traits:**
  ```js
  traits: ['Eterna / Eterna BB', 'cool or desaturated', 'filmic', 'street / documentary']
  ```

- [ ] **Step 2: Verify in browser**

  Go to Directions tab. All 8 direction cards should show recipes. Confirm:
  - "Warm Analog Negative" includes *1970s Summer* (now computed warm)
  - "Punchy Slide / Velvia" includes Velvia recipes and any high-punch non-Velvia recipes
  - "Cool Cinematic / Eterna" shows Eterna-based recipes

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: update Directions predicates to use recipeWarmth/recipePunch instead of color_direction"
  ```

---

### Task 7: Add formula explanation to Settings Guide

**Files:**
- Modify: `index.html` (`renderSettingsGuide()` ~line 1768)

**Interfaces:**
- Produces: a new section at the end of the Settings Guide tab titled "How recipe badges are scored"

- [ ] **Step 1: Add the new section at the end of `renderSettingsGuide()`**

  Find the end of `renderSettingsGuide()` — the last line before the closing `}`:
  ```js
    container.appendChild(secDiv)
  })
  ```
  Just before the closing `}`, append:

  ```js
  // Badge formula explanation section
  const badgeSection = document.createElement('div')
  badgeSection.innerHTML = `<div class="sg-section-title">How recipe badges are scored</div>`
  const badgeContent = document.createElement('div')
  badgeContent.style.cssText = 'display:flex;flex-direction:column;gap:18px;max-width:720px'
  badgeContent.innerHTML = `
    <div>
      <div style="font-weight:600;color:var(--text);margin-bottom:6px">Warmth badge &nbsp;<span class="badge b-warm">warm</span> <span class="badge b-neutral">neutral</span> <span class="badge b-cool">cool</span></div>
      <p style="color:var(--text2);font-size:13px;line-height:1.6;margin:0 0 8px">Derived from three inputs: <strong>white balance kelvin value</strong>, <strong>WB shift (Red minus Blue)</strong>, and a small <strong>film simulation adjustment</strong>. Higher kelvin (6500K+) and red-dominant shifts push toward warm; lower kelvin and blue-dominant shifts push toward cool. B&W simulations always score neutral — WB shift has no visible effect on a monochrome image.</p>
      <p style="color:var(--text2);font-size:13px;line-height:1.6;margin:0 0 8px"><em>Formula: warmthScore = (kelvin − 5200)/2300 × 0.5 + (R shift − B shift)/9 × 0.5 + filmBias</em><br>Warm if score &gt; 0.35 · Cool if score &lt; −0.20 · Neutral otherwise</p>
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:4px">
        <div>
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--text3);margin-bottom:4px">Warm-biased film sims (+0.15)</div>
          <div style="font-size:12px;color:var(--text2)">Nostalgic Neg. · Classic Chrome · Eterna · Eterna/Cinema · PRO Neg. Hi · PRO Neg. Std · Sepia</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--text3);margin-bottom:4px">Cool-biased film sims (−0.15)</div>
          <div style="font-size:12px;color:var(--text2)">Eterna Bleach Bypass · Velvia/Vivid</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--text3);margin-bottom:4px">Always neutral</div>
          <div style="font-size:12px;color:var(--text2)">Acros · Monochrome (all variants) · Sepia</div>
        </div>
      </div>
    </div>
    <div>
      <div style="font-weight:600;color:var(--text);margin-bottom:6px">Punch badge &nbsp;<span class="badge b-punchy">punchy</span> <span class="badge b-neutral">balanced</span> <span class="badge b-flat">flat</span></div>
      <p style="color:var(--text2);font-size:13px;line-height:1.6;margin:0 0 8px">Derived from the <strong>Color dial</strong>, <strong>Clarity dial</strong>, and the spread of <strong>Highlight/Shadow</strong> adjustments. High color and high clarity push toward punchy. Low color, low clarity, and wide highlight/shadow spread (rolled-off tones) push toward flat. Everything in between is balanced.</p>
      <p style="color:var(--text2);font-size:13px;line-height:1.6;margin:0"><em>Formula: punchScore = Color × 0.5 + Clarity × 0.25 − (|Highlight| + |Shadow|) × 0.1</em><br>Punchy if score &gt; 1.2 · Flat if score &lt; −0.5 · Balanced otherwise</p>
    </div>
    <div style="font-size:12px;color:var(--text3);border-top:1px solid var(--border);padding-top:12px">
      These badges are computed automatically from each recipe's camera settings — no editorial labels. To override a specific recipe, add a <code>warmth_override</code> or <code>punch_override</code> field to its entry in <code>RECIPE_META_PATCHES</code> in gear.js.
    </div>
  `
  badgeSection.appendChild(badgeContent)
  container.appendChild(badgeSection)
  ```

- [ ] **Step 2: Verify in browser**

  Go to Settings Guide tab. Scroll to the bottom. A "How recipe badges are scored" section should appear with warmth and punch explanations, the formula text, film sim lists, and the override note.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add badge formula explanation section to Settings Guide"
  ```

---

### Task 8: Update `gear.js` — clean up old overrides, document new fields

**Files:**
- Modify: `gear.js` (`RECIPE_META_PATCHES` block at end of file)

- [ ] **Step 1: Remove `color_direction` override keys, add new override keys**

  The current `RECIPE_META_PATCHES` has `color_direction` keys from the earlier patch. Replace the whole block:

  ```js
  const RECIPE_META_PATCHES = {
    // Example format — add entries here to override computed badges for specific recipes:
    // "Recipe Name": { warmth_override: "warm", punch_override: "flat" }
    //
    // warmth_override: "warm" | "neutral" | "cool"
    // punch_override:  "punchy" | "balanced" | "flat"
  };
  ```

  The two earlier manual overrides (*1970s Summer* and *Fujicolor Super HG v2*) are no longer needed — the formula now computes them correctly. Remove them.

- [ ] **Step 2: Verify in browser**

  Reload. *1970s Summer* should still show `[warm]` (from formula). *Fujicolor Super HG v2* should show `[neutral]`. No console errors.

- [ ] **Step 3: Commit**

  ```bash
  git add gear.js
  git commit -m "chore: clean up RECIPE_META_PATCHES, document warmth_override/punch_override fields"
  ```

---

## Final verification checklist

Run `python3 -m http.server 8000` and confirm:

- [ ] Recipes tab: *1970s Summer* shows `[Nostalgic Neg.] [DR400] [warm] [flat]`
- [ ] Recipes tab: *Fujicolor Super HG v2* shows `[Classic Negative] [DR400] [neutral] [punchy]`
- [ ] Recipes tab: *Acros Negative* shows `[Acros] [DR400] [neutral] [balanced]`
- [ ] Sidebar: "Warmth" chips `[warm] [neutral] [cool]` filter correctly; "Color Direction" is gone
- [ ] Sidebar: "Punch" chips `[punchy] [balanced] [flat]` filter correctly
- [ ] Sidebar: clicking any section label (Film Simulation, Warmth, Punch, Mood, Scenario, Era) collapses/expands the chip group with ▾/▸ chevron
- [ ] Directions tab: all 8 direction cards show non-zero recipe counts
- [ ] Settings Guide tab: "How recipe badges are scored" section present at bottom with formula text and film sim reference lists
- [ ] Compare tab: both compared recipes show warmth + punch badges
- [ ] My Recipes tab: custom slot recipe badges show warmth + punch
- [ ] No JS console errors on any tab
- [ ] `grep -n "bc(\|BADGE_CLS\|S\.f\.dir\|f-dir\|color_direction" index.html` — no render-path references remain (data fields in RECIPES and CORR are fine)

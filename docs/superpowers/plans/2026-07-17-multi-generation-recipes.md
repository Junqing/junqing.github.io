# Multi-Generation X-Trans Recipe Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the app to support X-Trans I–V recipe pools, each in its own lazy-loaded JS file, switchable via a header dropdown, with all recipe-dependent tabs scoped to the active generation.

**Architecture:** Five standalone data files (`recipes-i.js` … `recipes-v.js`) each define a global (`RECIPES_I` … `RECIPES_V`). The app loads them lazily on first switch. A new `activeGen` state variable and `activeRecipes()` helper replace every direct reference to `RECIPES` throughout `index.html`. A `<select>` in the header triggers the load + reset + re-render cycle.

**Tech Stack:** Vanilla JS, no build step. Single-file SPA in `index.html`. Data files are plain `.js` globals loaded via `<script>` injection.

## Global Constraints

- No build step, no npm, no bundler — plain JS only
- `index.html` must remain a single file (no imports, no ES modules)
- Data files must be valid JS that can be loaded via `<script src>` injection
- Each `recipes-[gen].js` file must define exactly one global: `RECIPES_I`, `RECIPES_II`, `RECIPES_III`, `RECIPES_IV`, `RECIPES_V`
- `color_direction` field must NOT be added to any new recipes (legacy field)
- Never delete or reorder existing recipes — only append new ones
- Default active generation on load: `"V"` (existing recipes, no load delay)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `recipes-v.js` | **Create** | X-Trans V recipe pool (moved from `index.html`) |
| `recipes-iv.js` | **Create** | X-Trans IV recipe pool (populated via `/sync-recipes`) |
| `recipes-iii.js` | **Create** | X-Trans III recipe pool (populated via `/sync-recipes`) |
| `recipes-ii.js` | **Create** | X-Trans II recipe pool (populated via `/sync-recipes`) |
| `recipes-i.js` | **Create** | X-Trans I recipe pool (populated via `/sync-recipes`) |
| `index.html` | **Modify** | Remove inline RECIPES array; add activeGen state, activeRecipes(), generation loader, header dropdown, update all RECIPES references |

---

### Task 1: Extract RECIPES_V into recipes-v.js

**Files:**
- Create: `recipes-v.js`
- Modify: `index.html` (line 804 — remove inline RECIPES array, add `<script src="recipes-v.js">`)

**Interfaces:**
- Produces: global `RECIPES_V` — same array currently at `index.html:804`, unchanged

- [ ] **Step 1: Extract the RECIPES array from index.html into recipes-v.js**

The current line 804 of `index.html` is:
```
const RECIPES = [{ ... }];
```

Create `recipes-v.js` at the repo root with:
```js
const RECIPES_V = [/* paste the full array content here verbatim */];
```

To extract precisely, run:
```bash
python3 -c "
import re
with open('index.html') as f:
    content = f.read()
m = re.search(r'const RECIPES = (\[.*?\]);', content, re.DOTALL)
print('const RECIPES_V = ' + m.group(1) + ';')
" > recipes-v.js
```

Verify the file starts with `const RECIPES_V = [{` and ends with `}];`.

- [ ] **Step 2: Verify recipes-v.js is valid JS**

```bash
node -e "$(cat recipes-v.js); console.log('Count:', RECIPES_V.length)"
```

Expected output: `Count: 111` (or however many recipes exist — any positive number).

- [ ] **Step 3: Add script tag for recipes-v.js in index.html, before gear.js**

In `index.html`, find the existing `<script src="gear.js">` tag. Add the new tag **before** it:

```html
<script src="recipes-v.js"></script>
<script src="gear.js"></script>
```

- [ ] **Step 4: Remove the inline RECIPES array from index.html**

Remove line 804 entirely (the `const RECIPES = [...]` line). The line immediately following it (`if (typeof RECIPE_META_PATCHES...`) must remain.

After removal, line 804 should be:
```
if (typeof RECIPE_META_PATCHES !== 'undefined') RECIPES.forEach(r => Object.assign(r, RECIPE_META_PATCHES[r.name] || {}));
```

- [ ] **Step 5: Verify the app still works**

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` — recipes should load exactly as before. Check the stats pill shows the same total count as before.

- [ ] **Step 6: Commit**

```bash
git add recipes-v.js index.html
git commit -m "refactor: move X-Trans V recipes to recipes-v.js"
```

---

### Task 2: Create placeholder files for generations I–IV

**Files:**
- Create: `recipes-i.js`, `recipes-ii.js`, `recipes-iii.js`, `recipes-iv.js`

**Interfaces:**
- Produces: globals `RECIPES_I`, `RECIPES_II`, `RECIPES_III`, `RECIPES_IV` — each an empty array for now, to be populated by `/sync-recipes` in a later task

- [ ] **Step 1: Create recipes-iv.js**

```js
const RECIPES_IV = [];
```

- [ ] **Step 2: Create recipes-iii.js**

```js
const RECIPES_III = [];
```

- [ ] **Step 3: Create recipes-ii.js**

```js
const RECIPES_II = [];
```

- [ ] **Step 4: Create recipes-i.js**

```js
const RECIPES_I = [];
```

- [ ] **Step 5: Verify each is valid JS**

```bash
node -e "$(cat recipes-iv.js); console.log(RECIPES_IV.length)"
node -e "$(cat recipes-iii.js); console.log(RECIPES_III.length)"
node -e "$(cat recipes-ii.js); console.log(RECIPES_II.length)"
node -e "$(cat recipes-i.js); console.log(RECIPES_I.length)"
```

Each should print `0`.

- [ ] **Step 6: Commit**

```bash
git add recipes-i.js recipes-ii.js recipes-iii.js recipes-iv.js
git commit -m "feat: add empty recipe pool files for X-Trans I–IV"
```

---

### Task 3: Add generation state and activeRecipes() helper

**Files:**
- Modify: `index.html` — STATE section (around line 811)

**Interfaces:**
- Consumes: globals `RECIPES_I` … `RECIPES_V` (defined in task 1 & 2)
- Produces:
  - `let activeGen` — string `"I"|"II"|"III"|"IV"|"V"`
  - `function activeRecipes()` — returns the active pool array

- [ ] **Step 1: Add activeGen and activeRecipes to the STATE section**

Find the STATE section in `index.html` (around line 811):
```js
const S = {
  q: '',
  f: { sim: new Set(), warmth: new Set(), punch: new Set(), mood: new Set(), scene: new Set(), era: new Set() },
  chartFilter: null,
}
```

Add directly before the `const S = {` line:
```js
let activeGen = 'V'
function activeRecipes() { return window['RECIPES_' + activeGen] || [] }
```

- [ ] **Step 2: Verify in browser console**

Open `http://localhost:8000/`. In the browser console:
```js
activeGen        // → "V"
activeRecipes().length  // → same count as before
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add activeGen state and activeRecipes() helper"
```

---

### Task 4: Replace all RECIPES references with activeRecipes()

**Files:**
- Modify: `index.html` — all locations where `RECIPES` is referenced directly (see list below)

**Interfaces:**
- Consumes: `activeRecipes()` from Task 3
- Produces: every recipe-dependent function now reads from `activeRecipes()` instead of the removed `RECIPES` constant

The following locations in `index.html` reference `RECIPES` directly and must be updated. Search for each pattern and replace:

| Location (approx line) | Current | Replace with |
|------------------------|---------|--------------|
| `filtered()` ~898 | `RECIPES.filter(matches)` | `activeRecipes().filter(matches)` |
| `initChips()` ~916 | `RECIPES.map(r=>r.film_simulation` | `activeRecipes().map(r=>r.film_simulation` |
| `initChips()` ~921 | `RECIPES.map(r=>r.era_reference` | `activeRecipes().map(r=>r.era_reference` |
| `openRecipeModal` ~958 | `RECIPES.find(x => x.name === recipeName)` | `activeRecipes().find(x => x.name === recipeName)` |
| `renderGrid()` ~1123 | `RECIPES.length` (×2) | `activeRecipes().length` |
| `renderCharts()` ~1138–1156 | `RECIPES` (×5) | `activeRecipes()` |
| `renderDirections()` ~1260–1261 | `RECIPES` (×2) | `activeRecipes()` |
| `renderClouds()` ~1270 | `RECIPES.map(r=>r.era_reference` | `activeRecipes().map(r=>r.era_reference` |
| `renderDirections()` ~1323 | `RECIPES.filter(d.match)` | `activeRecipes().filter(d.match)` |
| `renderSettingsGuide()` ~1984–2018 | `RECIPES` (×8) | `activeRecipes()` |
| `renderMyRecipes()` ~2258, 2341 | `RECIPES.find(` (×2) | `activeRecipes().find(` |
| Explore `byName` ~2451 | `RECIPES.map(r => [r.name, r])` | `activeRecipes().map(r => [r.name, r])` |
| Explore `pool` ~2638 | `let pool = RECIPES` | `let pool = activeRecipes()` |
| Explore find ~2667 | `RECIPES.find(` | `activeRecipes().find(` |
| Explore sortedNames ~2727 | `RECIPES.map(r => r.name)` | `activeRecipes().map(r => r.name)` |
| Compare ~2801, 2805 | `RECIPES.find(` (×2) | `activeRecipes().find(` |
| Explore seed input ~3930 | `RECIPES.filter(` | `activeRecipes().filter(` |
| Explore sims ~3966 | `RECIPES.map(r => r.film_simulation` | `activeRecipes().map(r => r.film_simulation` |
| Explore wbVals ~3985 | `RECIPES.map(r => r.white_balance` | `activeRecipes().map(r => r.white_balance` |
| `init()` ~4085–4088 | `RECIPES` (×4) | `activeRecipes()` |
| `RECIPE_META_PATCHES` apply ~805 | `RECIPES.forEach(` | `activeRecipes().forEach(` |

- [ ] **Step 1: Do a global search to find every remaining RECIPES reference**

```bash
grep -n '\bRECIPES\b' index.html | grep -v 'RECIPES_\|RECIPE_META_PATCHES\|MY_RECIPES\|source_url\|narrative\|mood_key\|scenario'
```

This shows every line that still uses bare `RECIPES`. Replace each one.

- [ ] **Step 2: Apply all replacements**

Use Edit tool with `replace_all: false` for each unique occurrence (use enough surrounding context to target each one precisely). Work through the list above.

For the `RECIPE_META_PATCHES` apply line (~805), change:
```js
if (typeof RECIPE_META_PATCHES !== 'undefined') RECIPES.forEach(r => Object.assign(r, RECIPE_META_PATCHES[r.name] || {}));
```
to:
```js
if (typeof RECIPE_META_PATCHES !== 'undefined') activeRecipes().forEach(r => Object.assign(r, RECIPE_META_PATCHES[r.name] || {}));
```

- [ ] **Step 3: Verify no bare RECIPES references remain (except RECIPES_ and MY_RECIPES)**

```bash
grep -n '\bRECIPES\b' index.html | grep -v 'RECIPES_\|RECIPE_META_PATCHES\|MY_RECIPES'
```

Expected: no output.

- [ ] **Step 4: Verify app still works in browser**

Open `http://localhost:8000/`. Check:
- Recipe count in stats pill matches before
- Filters work (click a film sim chip, count updates)
- Explore tab loads without errors
- Compare tab loads without errors

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: replace RECIPES with activeRecipes() throughout"
```

---

### Task 5: Add lazy-load function for generation switching

**Files:**
- Modify: `index.html` — add `loadGen(gen)` function and `switchGen(gen)` function

**Interfaces:**
- Consumes: `activeGen`, `activeRecipes()`, `initChips()`, `render()`, `exploreBuilt`, `S`
- Produces:
  - `function loadGen(gen)` — returns Promise, resolves when `RECIPES_[gen]` global is available
  - `function switchGen(gen)` — public entry point for generation switching

- [ ] **Step 1: Add loadGen and switchGen after the STATE section**

After the `activeGen` / `activeRecipes()` lines added in Task 3, add:

```js
function loadGen(gen) {
  const globalName = 'RECIPES_' + gen
  if (window[globalName]) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'recipes-' + gen.toLowerCase() + '.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load recipes-' + gen.toLowerCase() + '.js'))
    document.head.appendChild(s)
  })
}

function switchGen(gen) {
  const sel = document.getElementById('gen-select')
  if (sel) { sel.disabled = true; sel.value = gen }
  loadGen(gen).then(() => {
    activeGen = gen
    S.q = ''
    S.f.sim.clear(); S.f.warmth.clear(); S.f.punch.clear()
    S.f.mood.clear(); S.f.scene.clear(); S.f.era.clear()
    exploreBuilt = false
    if (document.getElementById('q')) document.getElementById('q').value = ''
    initChips()
    render()
    if (sel) sel.disabled = false
  }).catch(err => {
    console.error(err)
    if (sel) { sel.disabled = false; sel.value = activeGen }
  })
}
```

- [ ] **Step 2: Verify switchGen works in browser console**

Open `http://localhost:8000/`. In browser console:
```js
switchGen('IV')
// → sel disabled briefly, then re-enabled; activeGen === 'IV'
// → stats pill shows 0 recipes (RECIPES_IV is empty)
activeGen  // → "IV"
switchGen('V')
// → stats pill restores original count
activeGen  // → "V"
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add lazy-load generation switcher (loadGen/switchGen)"
```

---

### Task 6: Add generation dropdown to the header

**Files:**
- Modify: `index.html` — header HTML and header CSS

**Interfaces:**
- Consumes: `switchGen(gen)` from Task 5
- Produces: `<select id="gen-select">` in the header right section, wired to `switchGen`

- [ ] **Step 1: Add the dropdown HTML to the header**

Find the header in `index.html`:
```html
<header>
  <h1>Fujifilm X-Trans V <span>Recipe Explorer</span></h1>
  <div class="header-right">
```

Replace with:
```html
<header>
  <h1>Fujifilm X-Trans <span>Recipe Explorer</span></h1>
  <div class="header-right">
    <select id="gen-select" class="gen-select" onchange="switchGen(this.value)" title="X-Trans generation">
      <option value="V" selected>X-Trans V</option>
      <option value="IV">X-Trans IV</option>
      <option value="III">X-Trans III</option>
      <option value="II">X-Trans II</option>
      <option value="I">X-Trans I</option>
    </select>
```

- [ ] **Step 2: Update the <title> tag**

Find:
```html
<title>Fujifilm X-Trans V Recipe Explorer</title>
```
Replace with:
```html
<title>Fujifilm X-Trans Recipe Explorer</title>
```

- [ ] **Step 3: Add CSS for the dropdown**

Find the existing `<style>` block in `index.html`. Add these rules near the header styles:

```css
.gen-select {
  appearance: none;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text1);
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  padding: 4px 24px 4px 8px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpolyline points='2,3.5 5,6.5 8,3.5' fill='none' stroke='%239a9aaa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
}
.gen-select:disabled { opacity: 0.5; cursor: not-allowed; }
.gen-select:hover:not(:disabled) { border-color: var(--accent); }
@media(max-width:680px) { .gen-select { font-size: 11px; } }
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8000/`. Check:
- Header reads "Fujifilm X-Trans Recipe Explorer" (no V)
- Dropdown shows "X-Trans V" selected by default
- Switching to "X-Trans IV" shows 0 recipes (empty pool)
- Switching back to "X-Trans V" restores the full list
- Page title in browser tab has no V

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add X-Trans generation dropdown to header"
```

---

### Task 7: Populate X-Trans IV recipes via /sync-recipes

**Files:**
- Modify: `recipes-iv.js` — replace empty array with fetched recipes

**Interfaces:**
- Consumes: live fujixweekly.com at `https://fujixweekly.com/fujifilm-x-trans-iv-recipes/`
- Produces: `RECIPES_IV` array populated with all X-Trans IV recipes

- [ ] **Step 1: Run /sync-recipes for X-Trans IV**

Invoke the `/sync-recipes` skill. When asked which generation, choose **IV**. The skill will:
- Fetch the index page at `https://fujixweekly.com/fujifilm-x-trans-iv-recipes/`
- Fetch individual recipe pages
- Output a JS patch

- [ ] **Step 2: Apply the patch to recipes-iv.js**

The skill will either apply automatically or provide a patch to paste. The final file must look like:
```js
const RECIPES_IV = [
  { "name": "...", "film_simulation": "...", ... },
  ...
];
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:8000/`. Switch dropdown to "X-Trans IV". Stats pill should show a positive recipe count. Browse a few cards to spot-check settings.

- [ ] **Step 4: Check warmth/punch badges for obvious misfires**

Scan a sample of 10–15 recipe cards in X-Trans IV. If any warmth/punch badge looks wrong (e.g. a warm WB recipe showing "cool"), add an override to `RECIPE_META_PATCHES` in `gear.js`.

- [ ] **Step 5: Commit**

```bash
git add recipes-iv.js gear.js
git commit -m "feat: add X-Trans IV recipes"
```

---

### Task 8: Populate X-Trans III recipes via /sync-recipes

**Files:**
- Modify: `recipes-iii.js`

Same procedure as Task 7, targeting `https://fujixweekly.com/fujifilm-x-trans-iii-recipes/` and writing to `recipes-iii.js` / `RECIPES_III`.

- [ ] **Step 1: Run /sync-recipes for X-Trans III**
- [ ] **Step 2: Apply patch to recipes-iii.js**
- [ ] **Step 3: Verify in browser (switch to X-Trans III, check count and spot-check cards)**
- [ ] **Step 4: Check warmth/punch badges; add overrides to RECIPE_META_PATCHES in gear.js if needed**
- [ ] **Step 5: Commit**

```bash
git add recipes-iii.js gear.js
git commit -m "feat: add X-Trans III recipes"
```

---

### Task 9: Populate X-Trans II recipes via /sync-recipes

**Files:**
- Modify: `recipes-ii.js`

Same procedure, targeting `https://fujixweekly.com/fujifilm-x-trans-ii-recipes/` → `RECIPES_II`.

Note: X-Trans II cameras lack Clarity dial — those recipes will have `"clarity": null`. Verify the card table skips null rows correctly.

- [ ] **Step 1: Run /sync-recipes for X-Trans II**
- [ ] **Step 2: Apply patch to recipes-ii.js**
- [ ] **Step 3: Verify in browser; check that cards with null Clarity don't show a broken row**
- [ ] **Step 4: Check warmth/punch badges; add overrides if needed**
- [ ] **Step 5: Commit**

```bash
git add recipes-ii.js gear.js
git commit -m "feat: add X-Trans II recipes"
```

---

### Task 10: Populate X-Trans I recipes via /sync-recipes

**Files:**
- Modify: `recipes-i.js`

Same procedure, targeting `https://fujixweekly.com/fujifilm-x-trans-i-recipes/` → `RECIPES_I`.

Note: X-Trans I cameras lack Clarity and Color Chrome Effect — those fields will be `null`.

- [ ] **Step 1: Run /sync-recipes for X-Trans I**
- [ ] **Step 2: Apply patch to recipes-i.js**
- [ ] **Step 3: Verify in browser; check null fields render cleanly**
- [ ] **Step 4: Check warmth/punch badges; add overrides if needed**
- [ ] **Step 5: Commit**

```bash
git add recipes-i.js gear.js
git commit -m "feat: add X-Trans I recipes"
```

---

### Task 11: Update CLAUDE.md and sync-recipes skill docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/sync-recipes/SKILL.md`

- [ ] **Step 1: Update CLAUDE.md**

In `CLAUDE.md`, find the Architecture section. Update:

1. The data layer description — note that `RECIPES` no longer exists inline; it's now `RECIPES_V` in `recipes-v.js`, with `activeRecipes()` returning the active pool.
2. The State section — add `activeGen` and `activeRecipes()`.
3. The `<script>` load order — add `recipes-[gen].js` before `gear.js`.
4. The "What NOT to commit" section — add `recipes-iv.js`, `recipes-iii.js`, `recipes-ii.js`, `recipes-i.js` are NOT gitignored (they are committed).

- [ ] **Step 2: Update /sync-recipes SKILL.md**

In `.claude/skills/sync-recipes/SKILL.md`, update Step 2 to say:

> Read the relevant `recipes-[gen].js` file (e.g. `recipes-iv.js` for X-Trans IV) rather than reading `RECIPES` from `index.html`. Build the in-memory map from `RECIPES_[GEN]`.

And Step 6/7 to say:

> Write the patch back to `recipes-[gen].js`. Do not modify `index.html`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md .claude/skills/sync-recipes/SKILL.md
git commit -m "docs: update CLAUDE.md and sync-recipes skill for multi-gen architecture"
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Five recipe files, one per generation | Tasks 1, 2 |
| Current RECIPES moved to recipes-v.js | Task 1 |
| Lazy-load on first switch | Task 5 |
| activeGen state + activeRecipes() helper | Task 3 |
| All RECIPES refs replaced | Task 4 |
| Generation dropdown in header | Task 6 |
| Header title drops "V" | Task 6 |
| `<title>` drops "V" | Task 6 |
| Reset S state on switch | Task 5 |
| exploreBuilt cleared on switch | Task 5 |
| gearBuilt / myRecipesBuilt NOT cleared | Task 5 (not touched) |
| Dropdown disabled during load | Task 5 |
| X-Trans IV recipes populated | Task 7 |
| X-Trans III recipes populated | Task 8 |
| X-Trans II recipes populated | Task 9 |
| X-Trans I recipes populated | Task 10 |
| /sync-recipes updated to target recipe files | Task 11 |
| CLAUDE.md updated | Task 11 |

All spec requirements covered.

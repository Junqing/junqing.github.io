# Compare Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Compare tab that lets users pick two recipes and examine their differences through Side-by-side, Row diff, and Overlay views, with a Compare button on recipe cards throughout the app.

**Architecture:** All code lives in `index.html` (single-file SPA, no build step). Module-level state `C` and `compareSlots` drive the tab. `initCompare()` builds the shell once; `renderCompare()` replaces only `#cmp-content` on each change. Three view functions render into that div.

**Tech Stack:** Vanilla JS, SVG, inline CSS — no frameworks, no npm.

## Global Constraints

- Single file: all changes are to `index.html`
- No build step — test by serving with `python3 -m http.server 8000` and opening `http://localhost:8000`
- All new CSS classes prefixed `cmp-`
- Follow existing patterns: `const $ = id => document.getElementById(id)`, build-once guards, `pane`/`pane.on` tab switching
- Reuse without modification: `fingerprint(r)`, `wbMiniGrid(r)`, `recipeToT(r)`, `computeSimilarity(t)`, `bc(dir)`, `dc(dir)`, `openRecipeModal(name)`, `tNorm(p, v)`, `T_PARAMS`, `diamondPoints(cx, cy, s)`
- Mobile breakpoint: `≤680px`

---

## File map

**Modify only:** `index.html`

Sections touched in order:
1. CSS `<style>` block — add `cmp-*` styles
2. Tab bar HTML — add Compare tab button after Explore
3. Panes HTML — add `<div class="pane" id="pane-compare">`
4. `switchTab()` — add `if(id==='compare') initCompare()` case
5. After `renderGrid()` — add Compare button injection into `makeCard()` and `renderExploreResults()`
6. After `initExplore()` — add Compare state, `initCompare()`, `renderCompare()`, and the three view functions

---

### Task 1: CSS for Compare tab

**Files:**
- Modify: `index.html` — inside `<style>` block, after the last Explore CSS rule (after `.exp-kw{...}` around line 394)

**Interfaces:**
- Produces: CSS classes used by all subsequent tasks

- [ ] **Step 1: Add CSS**

Find the line `.exp-kw{font-size:10px;padding:1px 5px;border-radius:3px;background:var(--surf2);color:var(--text3)}` and insert after it:

```css
/* ─── Compare Tab ─── */
.cmp-header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.cmp-select-wrap{display:flex;flex-direction:column;gap:3px;flex:1;min-width:160px}
.cmp-select-label{font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.cmp-select-label.a{color:#d4a843}.cmp-select-label.b{color:#5b9af0}
.cmp-select{background:var(--surf2);border:1px solid var(--border);color:var(--text);border-radius:var(--r);padding:5px 10px;font-size:12px;width:100%}
.cmp-select.a{border-color:rgba(212,168,67,.4)}.cmp-select.b{border-color:rgba(91,154,240,.4)}
.cmp-btn{padding:5px 12px;border-radius:var(--r);border:1px solid var(--border);background:var(--surf2);color:var(--text2);font-size:12px;cursor:pointer}
.cmp-btn:hover{border-color:var(--accent);color:var(--text)}
.cmp-subtabs{display:flex;gap:4px;margin-bottom:14px}
.cmp-subtab{padding:4px 12px;border-radius:5px;font-size:11px;font-weight:600;border:1px solid var(--border);background:var(--surf2);color:var(--text2);cursor:pointer}
.cmp-subtab.on{background:var(--accent2);border-color:var(--accent2);color:#000}
.cmp-empty{text-align:center;padding:40px 20px;color:var(--text3);font-size:13px}
.cmp-layout{display:flex;gap:0;align-items:flex-start}
.cmp-col{flex:1;min-width:0;padding:0 12px}
.cmp-col:first-child{padding-left:0;border-right:1px solid var(--border)}
.cmp-col:last-child{padding-right:0;border-left:1px solid var(--border)}
.cmp-col-title{font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px}
.cmp-col-badges{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.cmp-diff-strip{width:80px;flex-shrink:0;display:flex;flex-direction:column;gap:4px;padding:0 6px;padding-top:4px}
.cmp-diff-badge{font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;text-align:center;white-space:nowrap}
.cmp-diff-badge.a{background:rgba(212,168,67,.15);color:#d4a843}
.cmp-diff-badge.b{background:rgba(91,154,240,.15);color:#5b9af0}
.cmp-diff-label{font-size:9px;color:var(--text3);text-align:center;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.3px}
.cmp-section-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin:10px 0 5px}
.cmp-kw-a{background:rgba(212,168,67,.15);color:#d4a843;border:1px solid rgba(212,168,67,.3)}
.cmp-kw-b{background:rgba(91,154,240,.15);color:#5b9af0;border:1px solid rgba(91,154,240,.3)}
.cmp-kw-shared{background:var(--surf2);color:var(--text3);border:1px solid var(--border)}
.cmp-kw{font-size:10px;padding:2px 7px;border-radius:99px;display:inline-block;margin:2px}
.cmp-top3{display:flex;flex-direction:column;gap:4px}
.cmp-sim-card{padding:5px 8px;background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);cursor:pointer;font-size:11px;display:flex;align-items:center;gap:6px}
.cmp-sim-card:hover{border-color:var(--accent)}
.cmp-sim-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;color:var(--text)}
.cmp-row-table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
.cmp-row-table td{padding:4px 6px;border-bottom:1px solid var(--border)}
.cmp-row-table td:first-child{color:var(--text3);width:30%;font-weight:600}
.cmp-row-table td:last-child{text-align:right}
.cmp-row-table td.cmp-diff-cell{text-align:center;font-weight:700}
.cmp-row-table tr.match td{opacity:.35}
.cmp-row-table tr.diff td:first-child,.cmp-row-table tr.diff .cmp-diff-cell{color:var(--text)}
.cmp-kw-row{display:flex;gap:6px;align-items:flex-start}
.cmp-kw-col{flex:1;min-width:0}
.cmp-overlay-top{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
.cmp-overlay-radar{flex:1;min-width:220px}
.cmp-overlay-wb{flex-shrink:0}
.cmp-overlay-legend{display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.cmp-overlay-legend-btn{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:5px;font-size:10px;font-weight:600;border:1px solid transparent}
.cmp-overlay-legend-a{background:rgba(212,168,67,.12);color:#d4a843;border-color:rgba(212,168,67,.35)}
.cmp-overlay-legend-b{background:rgba(91,154,240,.1);color:#5b9af0;border-color:rgba(91,154,240,.3)}
.cmp-overlay-swatch{width:16px;height:2px;border-radius:1px;flex-shrink:0}
.cmp-overlay-swatch-dash{width:16px;height:0;border-top:2px dashed #5b9af0;flex-shrink:0}
.cmp-top3-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.cmp-card-btn{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;border:1px solid var(--border);background:var(--surf2);color:var(--text2);cursor:pointer;margin-top:4px;transition:background .1s,border-color .1s}
.cmp-card-btn.slot-a{background:rgba(212,168,67,.15);color:#d4a843;border-color:rgba(212,168,67,.5)}
.cmp-card-btn.slot-b{background:rgba(91,154,240,.15);color:#5b9af0;border-color:rgba(91,154,240,.5)}
@media(max-width:680px){
  .cmp-layout{flex-direction:column}
  .cmp-col:first-child{border-right:none;border-bottom:1px solid var(--border);padding:0 0 12px}
  .cmp-col:last-child{border-left:none;padding:12px 0 0}
  .cmp-diff-strip{width:100%;flex-direction:row;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
  .cmp-top3-grid{grid-template-columns:1fr}
  .cmp-overlay-top{flex-direction:column}
}
```

- [ ] **Step 2: Verify in browser**

Serve: `python3 -m http.server 8000`  
Open: `http://localhost:8000`  
Expected: no visible change yet, no console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(compare): add CSS for compare tab"
```

---

### Task 2: Tab button + pane HTML

**Files:**
- Modify: `index.html` — tab bar (around line 465) and panes section (around line 544)

**Interfaces:**
- Consumes: CSS from Task 1
- Produces: `pane-compare` div; tab button `data-tab="compare"`

- [ ] **Step 1: Add tab button**

Find:
```html
    <div class="tab" data-tab="explore">Explore</div>
```
Insert after it:
```html
    <div class="tab" data-tab="compare">Compare</div>
```

- [ ] **Step 2: Add pane**

Find `<div class="pane" id="pane-explore">` and the closing `</div>` for that pane. Insert a new pane after it:

```html
  <!-- COMPARE -->
  <div class="pane" id="pane-compare">
    <div id="cmp-shell"></div>
  </div>
```

- [ ] **Step 3: Wire switchTab**

Find:
```javascript
  if(id==='explore') initExplore()
```
Add after it:
```javascript
  if(id==='compare') initCompare()
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:8000`, click the Compare tab.  
Expected: tab switches, blank pane shows with no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(compare): add tab button and pane shell"
```

---

### Task 3: Compare state + initCompare() shell

**Files:**
- Modify: `index.html` — after `let exploreBuilt = false` (around line 2416)

**Interfaces:**
- Consumes: `switchTab()` from Task 2
- Produces:
  - `const C = { a: null, b: null, view: 'sidebyside' }` — global state
  - `let compareSlots = [null, null]` — card button queue
  - `let compareBuilt = false`
  - `function initCompare()` — builds shell once, wires dropdowns + subtabs + swap + clear
  - `function renderCompare()` — replaces `#cmp-content`, delegates to view functions (stubs for now)
  - `function updateCompareCardButtons()` — refreshes `.cmp-card-btn` labels across all rendered cards

- [ ] **Step 1: Add state and initCompare**

After `let exploreBuilt = false` (line ~2416), insert:

```javascript
// ══════════════════════════════════════════
// COMPARE TAB
// ══════════════════════════════════════════
const C = { a: null, b: null, view: 'sidebyside' }
let compareSlots = [null, null]
let compareBuilt = false

function updateCompareCardButtons() {
  document.querySelectorAll('.cmp-card-btn').forEach(btn => {
    const name = btn.dataset.recipe
    if (compareSlots[0] && compareSlots[0].name === name) {
      btn.textContent = 'A ✕'; btn.className = 'cmp-card-btn slot-a'
    } else if (compareSlots[1] && compareSlots[1].name === name) {
      btn.textContent = 'B ✕'; btn.className = 'cmp-card-btn slot-b'
    } else {
      btn.textContent = 'Compare'; btn.className = 'cmp-card-btn'
    }
  })
}

function onCompareCardClick(r) {
  const idxA = compareSlots.findIndex(s => s && s.name === r.name)
  if (idxA !== -1) {
    compareSlots[idxA] = null
    updateCompareCardButtons()
    return
  }
  if (!compareSlots[0]) {
    compareSlots[0] = r
    updateCompareCardButtons()
    return
  }
  compareSlots[1] = r
  C.a = compareSlots[0]; C.b = compareSlots[1]
  compareSlots = [null, null]
  updateCompareCardButtons()
  switchTab('compare')
}

function initCompare() {
  if (compareBuilt) { renderCompare(); return }
  compareBuilt = true

  const shell = document.getElementById('cmp-shell')
  shell.innerHTML = ''

  // Header: two selects + swap + clear
  const header = document.createElement('div')
  header.className = 'cmp-header'

  const sortedNames = RECIPES.map(r => r.name).slice().sort()

  function makeSelect(cls, label) {
    const wrap = document.createElement('div')
    wrap.className = 'cmp-select-wrap'
    const lbl = document.createElement('div')
    lbl.className = 'cmp-select-label ' + cls
    lbl.textContent = 'Recipe ' + label.toUpperCase()
    const sel = document.createElement('select')
    sel.className = 'cmp-select ' + cls
    sel.id = 'cmp-sel-' + cls
    const empty = document.createElement('option')
    empty.value = ''; empty.textContent = '— choose —'
    sel.appendChild(empty)
    sortedNames.forEach(name => {
      const opt = document.createElement('option')
      opt.value = name; opt.textContent = name
      sel.appendChild(opt)
    })
    wrap.appendChild(lbl); wrap.appendChild(sel)
    return wrap
  }

  const wrapA = makeSelect('a', 'a')
  const wrapB = makeSelect('b', 'b')

  const swapBtn = document.createElement('button')
  swapBtn.className = 'cmp-btn'; swapBtn.textContent = '⇄ Swap'
  swapBtn.addEventListener('click', () => {
    const tmp = C.a; C.a = C.b; C.b = tmp
    syncCmpSelects(); renderCompare()
  })

  const clearBtn = document.createElement('button')
  clearBtn.className = 'cmp-btn'; clearBtn.textContent = 'Clear'
  clearBtn.addEventListener('click', () => {
    C.a = null; C.b = null
    compareSlots = [null, null]
    updateCompareCardButtons()
    syncCmpSelects(); renderCompare()
  })

  header.appendChild(wrapA); header.appendChild(wrapB)
  header.appendChild(swapBtn); header.appendChild(clearBtn)

  document.getElementById('cmp-sel-a').addEventListener('change', e => {
    C.a = RECIPES.find(r => r.name === e.target.value) || null
    renderCompare()
  })
  document.getElementById('cmp-sel-b').addEventListener('change', e => {
    C.b = RECIPES.find(r => r.name === e.target.value) || null
    renderCompare()
  })

  // Subtabs
  const subtabs = document.createElement('div')
  subtabs.className = 'cmp-subtabs'
  const views = [
    { id: 'sidebyside', label: 'Side-by-side' },
    { id: 'rowdiff',    label: 'Row diff' },
    { id: 'overlay',   label: 'Overlay' },
  ]
  views.forEach(v => {
    const btn = document.createElement('button')
    btn.className = 'cmp-subtab' + (C.view === v.id ? ' on' : '')
    btn.textContent = v.label
    btn.dataset.view = v.id
    btn.addEventListener('click', () => {
      C.view = v.id
      subtabs.querySelectorAll('.cmp-subtab').forEach(b => b.classList.toggle('on', b.dataset.view === v.id))
      renderCompare()
    })
    subtabs.appendChild(btn)
  })

  // Content area
  const content = document.createElement('div')
  content.id = 'cmp-content'

  shell.appendChild(header)
  shell.appendChild(subtabs)
  shell.appendChild(content)

  syncCmpSelects()
  renderCompare()
}

function syncCmpSelects() {
  const selA = document.getElementById('cmp-sel-a')
  const selB = document.getElementById('cmp-sel-b')
  if (selA) selA.value = C.a ? C.a.name : ''
  if (selB) selB.value = C.b ? C.b.name : ''
}

function renderCompare() {
  const content = document.getElementById('cmp-content')
  if (!content) return
  content.innerHTML = ''
  if (!C.a || !C.b) {
    content.innerHTML = '<div class="cmp-empty">Select two recipes above to compare them.</div>'
    return
  }
  if (C.view === 'sidebyside') renderCompareSideBySide(content)
  else if (C.view === 'rowdiff') renderCompareRowDiff(content)
  else renderCompareOverlay(content)
}

function cmpTop3(r) {
  return computeSimilarity(recipeToT(r)).filter(s => s.name !== r.name).slice(0, 3)
}

function cmpSimCard(r) {
  const div = document.createElement('div')
  div.className = 'cmp-sim-card'
  div.innerHTML = `<span class="cmp-sim-name">${r.name}</span><span class="badge b-sim" style="flex-shrink:0">${r.film_simulation||'?'}</span>${r.color_direction?`<span class="badge ${bc(r.color_direction)}" style="flex-shrink:0">${r.color_direction}</span>`:''}`
  div.addEventListener('click', () => openRecipeModal(r.name))
  return div
}

function renderCompareSideBySide(container) { container.innerHTML = '<div class="cmp-empty" style="color:var(--text3);font-size:11px">Side-by-side view — coming in next task</div>' }
function renderCompareRowDiff(container)    { container.innerHTML = '<div class="cmp-empty" style="color:var(--text3);font-size:11px">Row diff view — coming in next task</div>' }
function renderCompareOverlay(container)    { container.innerHTML = '<div class="cmp-empty" style="color:var(--text3);font-size:11px">Overlay view — coming in next task</div>' }
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8000`, click Compare tab.  
Expected: two dropdowns, swap/clear buttons, subtab pills visible. Selecting two recipes shows the "coming in next task" placeholder. No console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(compare): add state, initCompare shell, renderCompare dispatcher"
```

---

### Task 4: Compare button on recipe cards

**Files:**
- Modify: `index.html` — `makeCard()` (around line 844) and `renderExploreResults()` (around line 2420)

**Interfaces:**
- Consumes: `onCompareCardClick(r)`, `updateCompareCardButtons()` from Task 3
- Produces: `.cmp-card-btn` button appended to each `.card` and each `.exp-result-card`

- [ ] **Step 1: Add button to makeCard()**

In `makeCard(r)`, find where the card's click listener is wired (around line 893):
```javascript
  div.addEventListener('click',e=>{
```

Insert before that line:

```javascript
  // Compare button
  const cmpBtn = document.createElement('button')
  cmpBtn.className = 'cmp-card-btn'
  cmpBtn.dataset.recipe = r.name
  cmpBtn.textContent = 'Compare'
  if (compareSlots[0] && compareSlots[0].name === r.name) { cmpBtn.textContent = 'A ✕'; cmpBtn.className = 'cmp-card-btn slot-a' }
  if (compareSlots[1] && compareSlots[1].name === r.name) { cmpBtn.textContent = 'B ✕'; cmpBtn.className = 'cmp-card-btn slot-b' }
  cmpBtn.style.cssText = 'margin:4px 12px 8px;display:block'
  cmpBtn.addEventListener('click', e => { e.stopPropagation(); onCompareCardClick(r) })
  div.appendChild(cmpBtn)
```

- [ ] **Step 2: Add button to renderExploreResults()**

In `renderExploreResults()`, after:
```javascript
    card.addEventListener('click', () => openRecipeModal(r.name))
```
Insert:
```javascript
    const expCmpBtn = document.createElement('button')
    expCmpBtn.className = 'cmp-card-btn'
    expCmpBtn.dataset.recipe = r.name
    expCmpBtn.textContent = 'Compare'
    if (compareSlots[0] && compareSlots[0].name === r.name) { expCmpBtn.textContent = 'A ✕'; expCmpBtn.className = 'cmp-card-btn slot-a' }
    if (compareSlots[1] && compareSlots[1].name === r.name) { expCmpBtn.textContent = 'B ✕'; expCmpBtn.className = 'cmp-card-btn slot-b' }
    expCmpBtn.style.cssText = 'margin-top:4px;display:block'
    expCmpBtn.addEventListener('click', e => { e.stopPropagation(); onCompareCardClick(r) })
    card.querySelector('.exp-result-info').appendChild(expCmpBtn)
```

- [ ] **Step 3: Verify in browser**

Open Recipes tab. Each card should show a small "Compare" button.  
Click "Compare" on Card 1 — button shows "A ✕".  
Click "Compare" on Card 2 — app switches to Compare tab, both recipe selects populated.  
Click "A ✕" on any card — button resets to "Compare".

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(compare): add Compare button to recipe cards and explore results"
```

---

### Task 5: Side-by-side view

**Files:**
- Modify: `index.html` — replace `renderCompareSideBySide` stub

**Interfaces:**
- Consumes: `C.a`, `C.b`, `fingerprint(r)`, `wbMiniGrid(r)`, `recipeToT(r)`, `tNorm(p,v)`, `T_PARAMS`, `bc(dir)`, `cmpTop3(r)`, `cmpSimCard(r)`
- Produces: fully rendered side-by-side layout in `container`

- [ ] **Step 1: Replace stub with full implementation**

Replace:
```javascript
function renderCompareSideBySide(container) { container.innerHTML = '<div class="cmp-empty" style="color:var(--text3);font-size:11px">Side-by-side view — coming in next task</div>' }
```

With:

```javascript
function renderCompareSideBySide(container) {
  const ta = recipeToT(C.a), tb = recipeToT(C.b)
  const kwA = new Set([...(C.a.mood_keywords||[]), ...(C.a.scenario_keywords||[])])
  const kwB = new Set([...(C.b.mood_keywords||[]), ...(C.b.scenario_keywords||[])])
  const allKw = [...new Set([...kwA, ...kwB])]

  function makeCol(r, t, label) {
    const col = document.createElement('div')
    col.className = 'cmp-col'

    // Title + badges
    const title = document.createElement('div')
    title.className = 'cmp-col-title'
    title.textContent = r.name
    col.appendChild(title)
    const badges = document.createElement('div')
    badges.className = 'cmp-col-badges'
    badges.innerHTML = `<span class="badge b-sim">${r.film_simulation||'?'}</span>${r.color_direction?`<span class="badge ${bc(r.color_direction)}">${r.color_direction}</span>`:''}`
    col.appendChild(badges)

    // Radar
    const fpWrap = document.createElement('div')
    fpWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:8px'
    fpWrap.innerHTML = fingerprint(r)
    col.appendChild(fpWrap)

    // WB grid
    const wbSl = document.createElement('div')
    wbSl.className = 'cmp-section-label'
    wbSl.textContent = 'WB Shift'
    col.appendChild(wbSl)
    const wbWrap = document.createElement('div')
    wbWrap.style.cssText = 'display:flex;justify-content:center;margin-bottom:8px'
    wbWrap.innerHTML = wbMiniGrid(r)
    col.appendChild(wbWrap)

    // Param pills
    const paramSl = document.createElement('div')
    paramSl.className = 'cmp-section-label'
    paramSl.textContent = 'Settings'
    col.appendChild(paramSl)
    const pills = document.createElement('div')
    pills.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px'
    ;[
      ['DR', r.dynamic_range],
      ['Grain', r.grain_effect],
      ['SHP', r.sharpness != null ? (r.sharpness > 0 ? '+' : '') + r.sharpness : null],
      ['CL',  r.clarity   != null ? (r.clarity   > 0 ? '+' : '') + r.clarity   : null],
      ['ISO', r.iso_max ? 'up to ' + r.iso_max : null],
      ['EV',  r.exposure_compensation],
    ].filter(([, v]) => v != null && v !== '' && v !== 'N/A').forEach(([k, v]) => {
      const sp = document.createElement('span')
      sp.className = 'cs-pill'
      sp.innerHTML = `<strong>${k}</strong> ${v}`
      pills.appendChild(sp)
    })
    col.appendChild(pills)

    // Keywords
    const kwSl = document.createElement('div')
    kwSl.className = 'cmp-section-label'
    kwSl.textContent = 'Keywords'
    col.appendChild(kwSl)
    const kwWrap = document.createElement('div')
    kwWrap.style.cssText = 'margin-bottom:10px'
    const myKw = label === 'a' ? kwA : kwB
    const otherKw = label === 'a' ? kwB : kwA
    allKw.forEach(k => {
      if (!myKw.has(k)) return
      const sp = document.createElement('span')
      sp.className = 'cmp-kw ' + (otherKw.has(k) ? 'cmp-kw-shared' : ('cmp-kw-' + label))
      sp.textContent = k
      kwWrap.appendChild(sp)
    })
    col.appendChild(kwWrap)

    // Top 3 similar
    const simSl = document.createElement('div')
    simSl.className = 'cmp-section-label'
    simSl.textContent = 'Top 3 similar'
    col.appendChild(simSl)
    const top3 = document.createElement('div')
    top3.className = 'cmp-top3'
    cmpTop3(r).forEach(s => top3.appendChild(cmpSimCard(s)))
    col.appendChild(top3)

    return col
  }

  function makeDiffStrip() {
    const strip = document.createElement('div')
    strip.className = 'cmp-diff-strip'
    const lbl = document.createElement('div')
    lbl.className = 'cmp-diff-label'
    lbl.textContent = 'Diff'
    strip.appendChild(lbl)

    T_PARAMS.forEach(p => {
      const na = tNorm(p, ta[p.key]), nb = tNorm(p, tb[p.key])
      if (Math.abs(na - nb) < 0.05) return
      const diff = ta[p.key] - tb[p.key]
      const badge = document.createElement('div')
      badge.className = 'cmp-diff-badge ' + (diff > 0 ? 'a' : 'b')
      badge.textContent = p.label + ' ' + (diff > 0 ? '+' : '') + (Math.round(diff * 10) / 10)
      strip.appendChild(badge)
    })
    const dR = ta.wb_shift_red - tb.wb_shift_red
    const dB = ta.wb_shift_blue - tb.wb_shift_blue
    if (Math.abs(dR) >= 1) {
      const b = document.createElement('div')
      b.className = 'cmp-diff-badge ' + (dR > 0 ? 'a' : 'b')
      b.textContent = 'WB R ' + (dR > 0 ? '+' : '') + dR
      strip.appendChild(b)
    }
    if (Math.abs(dB) >= 1) {
      const b = document.createElement('div')
      b.className = 'cmp-diff-badge ' + (dB > 0 ? 'a' : 'b')
      b.textContent = 'WB B ' + (dB > 0 ? '+' : '') + dB
      strip.appendChild(b)
    }
    if (ta.white_balance !== tb.white_balance) {
      const b = document.createElement('div')
      b.className = 'cmp-diff-badge b'
      b.textContent = 'WB mode'
      strip.appendChild(b)
    }
    if (ta.grain_size !== tb.grain_size) {
      const b = document.createElement('div')
      b.className = 'cmp-diff-badge b'
      b.textContent = 'Grain size'
      strip.appendChild(b)
    }
    return strip
  }

  const layout = document.createElement('div')
  layout.className = 'cmp-layout'
  layout.appendChild(makeCol(C.a, ta, 'a'))
  layout.appendChild(makeDiffStrip())
  layout.appendChild(makeCol(C.b, tb, 'b'))
  container.appendChild(layout)
}
```

- [ ] **Step 2: Verify in browser**

Select two recipes on the Compare tab. Switch to Side-by-side.  
Expected: two columns with radar, WB grid, settings pills, coloured keywords, top-3 similar. Centre strip shows diff badges. Mobile: columns stack vertically.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(compare): implement side-by-side view"
```

---

### Task 6: Row diff view

**Files:**
- Modify: `index.html` — replace `renderCompareRowDiff` stub

**Interfaces:**
- Consumes: `C.a`, `C.b`, `recipeToT(r)`, `T_PARAMS`, `bc(dir)`
- Produces: fully rendered row diff table in `container`

- [ ] **Step 1: Replace stub**

Replace:
```javascript
function renderCompareRowDiff(container)    { container.innerHTML = '<div class="cmp-empty" style="color:var(--text3);font-size:11px">Row diff view — coming in next task</div>' }
```

With:

```javascript
function renderCompareRowDiff(container) {
  const ta = recipeToT(C.a), tb = recipeToT(C.b)
  const ccLbl = ['Off', 'Weak', 'Strong']

  function addRow(tbl, label, va, vb) {
    const match = String(va) === String(vb)
    const tr = document.createElement('tr')
    tr.className = match ? 'match' : 'diff'
    let diffHtml = '='
    if (!match) {
      const na = parseFloat(va), nb = parseFloat(vb)
      if (!isNaN(na) && !isNaN(nb)) {
        const d = na - nb
        diffHtml = `<span style="color:${d > 0 ? '#d4a843' : '#5b9af0'};font-weight:700">${d > 0 ? '▲' : '▼'}</span>`
      } else {
        diffHtml = '≠'
      }
    }
    tr.innerHTML = `<td>${label}</td><td style="color:${match?'':'#d4a843'}">${va ?? '—'}</td><td class="cmp-diff-cell">${diffHtml}</td><td style="color:${match?'':'#5b9af0'};text-align:right">${vb ?? '—'}</td>`
    tbl.appendChild(tr)
  }

  const tbl = document.createElement('table')
  tbl.className = 'cmp-row-table'
  // Header
  const thead = document.createElement('thead')
  thead.innerHTML = `<tr><th style="text-align:left;padding:4px 6px;font-size:10px;color:var(--text3)">Param</th><th style="color:#d4a843;padding:4px 6px;font-size:10px">A</th><th style="padding:4px 6px;font-size:10px;color:var(--text3)"></th><th style="color:#5b9af0;padding:4px 6px;font-size:10px;text-align:right">B</th></tr>`
  tbl.appendChild(thead)

  const tbody = document.createElement('tbody')
  addRow(tbody, 'Film Sim',    C.a.film_simulation,   C.b.film_simulation)
  addRow(tbody, 'WB Mode',     ta.white_balance,       tb.white_balance)
  addRow(tbody, 'DR',          C.a.dynamic_range,      C.b.dynamic_range)
  addRow(tbody, 'Grain',       C.a.grain_effect,       C.b.grain_effect)
  addRow(tbody, 'Grain Size',  ta.grain_size,          tb.grain_size)
  addRow(tbody, 'HL',          ta.highlight,           tb.highlight)
  addRow(tbody, 'SH',          ta.shadow,              tb.shadow)
  addRow(tbody, 'COL',         ta.color,               tb.color)
  addRow(tbody, 'CCE',         ccLbl[ta.color_chrome_effect],  ccLbl[tb.color_chrome_effect])
  addRow(tbody, 'CCB',         ccLbl[ta.color_chrome_fx_blue], ccLbl[tb.color_chrome_fx_blue])
  addRow(tbody, 'SHP',         ta.sharpness,           tb.sharpness)
  addRow(tbody, 'CL',          ta.clarity,             tb.clarity)
  addRow(tbody, 'NR',          ta.high_iso_nr,         tb.high_iso_nr)
  addRow(tbody, 'WB R',        ta.wb_shift_red,        tb.wb_shift_red)
  addRow(tbody, 'WB B',        ta.wb_shift_blue,       tb.wb_shift_blue)
  tbl.appendChild(tbody)
  container.appendChild(tbl)

  // Keyword clouds
  const kwA = new Set([...(C.a.mood_keywords||[]), ...(C.a.scenario_keywords||[])])
  const kwB = new Set([...(C.b.mood_keywords||[]), ...(C.b.scenario_keywords||[])])
  const allKw = [...new Set([...kwA, ...kwB])]

  const kwSl = document.createElement('div')
  kwSl.className = 'cmp-section-label'
  kwSl.textContent = 'Keywords'
  container.appendChild(kwSl)

  const kwRow = document.createElement('div')
  kwRow.className = 'cmp-kw-row'

  function makeKwCol(label, mySet, otherSet) {
    const col = document.createElement('div')
    col.className = 'cmp-kw-col'
    const hdr = document.createElement('div')
    hdr.style.cssText = `font-size:10px;font-weight:700;color:${label==='a'?'#d4a843':'#5b9af0'};margin-bottom:4px`
    hdr.textContent = 'Recipe ' + label.toUpperCase()
    col.appendChild(hdr)
    allKw.forEach(k => {
      if (!mySet.has(k)) return
      const sp = document.createElement('span')
      sp.className = 'cmp-kw ' + (otherSet.has(k) ? 'cmp-kw-shared' : 'cmp-kw-' + label)
      sp.textContent = k
      col.appendChild(sp)
    })
    return col
  }

  kwRow.appendChild(makeKwCol('a', kwA, kwB))
  kwRow.appendChild(makeKwCol('b', kwB, kwA))
  container.appendChild(kwRow)
}
```

- [ ] **Step 2: Verify in browser**

Select two recipes, switch to Row diff.  
Expected: table with all params, matching rows dimmed, differing rows highlighted with ▲/▼ in gold/blue. Keyword clouds below.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(compare): implement row diff view"
```

---

### Task 7: Overlay view

**Files:**
- Modify: `index.html` — replace `renderCompareOverlay` stub

**Interfaces:**
- Consumes: `C.a`, `C.b`, `recipeToT(r)`, `tNorm(p,v)`, `T_PARAMS`, `diamondPoints(cx,cy,s)`, `bc(dir)`, `cmpTop3(r)`, `cmpSimCard(r)`
- Produces: fully rendered overlay layout (shared radar + WB grid + keyword cloud + top-3 grid) in `container`

- [ ] **Step 1: Replace stub**

Replace:
```javascript
function renderCompareOverlay(container)    { container.innerHTML = '<div class="cmp-empty" style="color:var(--text3);font-size:11px">Overlay view — coming in next task</div>' }
```

With:

```javascript
function renderCompareOverlay(container) {
  const ta = recipeToT(C.a), tb = recipeToT(C.b)
  const N = 5, cx = 130, cy = 125, R = 80
  const AXES = T_PARAMS.slice(0, 5)
  const ccLbl = ['Off', 'Weak', 'Strong']

  function ang(i) { return (2 * Math.PI * i / N) - Math.PI / 2 }
  function unitVec(i) { return [Math.cos(ang(i)), Math.sin(ang(i))] }
  function axisPoint(val, p, i) {
    const r = tNorm(p, val) * R
    const [ux, uy] = unitVec(i)
    return [cx + r * ux, cy + r * uy]
  }

  // Legend
  const legend = document.createElement('div')
  legend.className = 'cmp-overlay-legend'
  legend.innerHTML = `
    <span class="cmp-overlay-legend-btn cmp-overlay-legend-a">
      <span class="cmp-overlay-swatch" style="background:#d4a843"></span>${C.a.name}
    </span>
    <span class="cmp-overlay-legend-btn cmp-overlay-legend-b">
      <span class="cmp-overlay-swatch-dash"></span>${C.b.name}
    </span>`
  container.appendChild(legend)

  const topRow = document.createElement('div')
  topRow.className = 'cmp-overlay-top'

  // Radar SVG
  const radarWrap = document.createElement('div')
  radarWrap.className = 'cmp-overlay-radar'

  let svgHtml = ''
  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0]
  rings.forEach(frac => {
    const pts = AXES.map((_, i) => { const [ux, uy] = unitVec(i); return `${cx + R * frac * ux},${cy + R * frac * uy}` }).join(' ')
    svgHtml += `<polygon points="${pts}" fill="none" stroke="${frac === 0.5 ? '#3a3a42' : '#2a2a30'}" stroke-width="${frac === 0.5 ? '1.2' : '0.8'}"/>`
  })
  // Spokes
  AXES.forEach((_, i) => {
    const [ux, uy] = unitVec(i)
    svgHtml += `<line x1="${cx}" y1="${cy}" x2="${cx + R * ux}" y2="${cy + R * uy}" stroke="#2a2a30" stroke-width="0.8"/>`
  })
  // Recipe A polygon (gold solid)
  const ptsA = AXES.map((p, i) => axisPoint(ta[p.key] ?? 0, p, i).join(',')).join(' ')
  svgHtml += `<polygon points="${ptsA}" fill="rgba(212,168,67,.15)" stroke="#d4a843" stroke-width="2.2"/>`
  // Recipe B polygon (blue dashed)
  const ptsB = AXES.map((p, i) => axisPoint(tb[p.key] ?? 0, p, i).join(',')).join(' ')
  svgHtml += `<polygon points="${ptsB}" fill="rgba(91,154,240,.08)" stroke="#5b9af0" stroke-width="1.6" stroke-dasharray="5,3"/>`
  // Axis labels with both values
  const labelNames = ['HL', 'SH', 'COL', 'CCE', 'CCB']
  const labelOffsets = [[0, -15], [18, -8], [12, 12], [-12, 12], [-18, -8]]
  AXES.forEach((p, i) => {
    const [ux, uy] = unitVec(i)
    const lx = cx + (R + 20) * ux + labelOffsets[i][0]
    const ly = cy + (R + 20) * uy + labelOffsets[i][1]
    const va = p.key === 'color_chrome_effect' || p.key === 'color_chrome_fx_blue' ? ccLbl[ta[p.key]] : (ta[p.key] > 0 ? '+' : '') + ta[p.key]
    const vb = p.key === 'color_chrome_effect' || p.key === 'color_chrome_fx_blue' ? ccLbl[tb[p.key]] : (tb[p.key] > 0 ? '+' : '') + tb[p.key]
    const lw = 52
    svgHtml += `<rect x="${lx - lw/2}" y="${ly - 18}" width="${lw}" height="22" rx="4" fill="#1a1a22" stroke="#3a3a4a" stroke-width="0.6"/>`
    svgHtml += `<text x="${lx}" y="${ly - 8}" text-anchor="middle" font-size="8" font-weight="700" fill="#c0c0d0" font-family="Inter,sans-serif">${labelNames[i]}</text>`
    svgHtml += `<text x="${lx}" y="${ly + 1}" text-anchor="middle" font-size="7" fill="#d4a843" font-family="Inter,sans-serif">${va}</text>`
    svgHtml += `<text x="${lx}" y="${ly + 9}" text-anchor="middle" font-size="7" fill="#5b9af0" font-family="Inter,sans-serif">${vb}</text>`
  })

  radarWrap.innerHTML = `<svg viewBox="0 0 260 230" style="width:100%;max-width:280px;overflow:visible">${svgHtml}</svg>`
  topRow.appendChild(radarWrap)

  // WB grid with two dots
  const wbWrap = document.createElement('div')
  wbWrap.className = 'cmp-overlay-wb'
  const rA = ta.wb_shift_red, bA = -ta.wb_shift_blue
  const rB = tb.wb_shift_red, bB = -tb.wb_shift_blue
  let wbSvg = ''
  for (let i = -6; i <= 6; i += 3) {
    const thick = i === 0
    wbSvg += `<line x1="${i}" y1="-9" x2="${i}" y2="9" stroke="${thick?'#333340':'#242428'}" stroke-width="${thick?.6:.3}"/>`
    wbSvg += `<line x1="-9" y1="${i}" x2="9" y2="${i}" stroke="${thick?'#333340':'#242428'}" stroke-width="${thick?.6:.3}"/>`
  }
  wbSvg += `<rect x="-9" y="-9" width="18" height="18" fill="none" stroke="#2e2e34" stroke-width=".6"/>`
  wbSvg += `<text x="-9.4" y=".7" font-size="1.7" fill="#5e5e6e" text-anchor="end" font-family="Inter,sans-serif">R−</text>`
  wbSvg += `<text x="9.4" y=".7" font-size="1.7" fill="#5e5e6e" text-anchor="start" font-family="Inter,sans-serif">R+</text>`
  wbSvg += `<text x="0" y="-9.6" font-size="1.7" fill="#5e5e6e" text-anchor="middle" font-family="Inter,sans-serif">B+</text>`
  wbSvg += `<text x="0" y="10.8" font-size="1.7" fill="#5e5e6e" text-anchor="middle" font-family="Inter,sans-serif">B−</text>`
  // Recipe B dot (blue crosshair+circle) — drawn first so A is on top
  wbSvg += `<line x1="${rB-1.4}" y1="${bB}" x2="${rB+1.4}" y2="${bB}" stroke="#5b9af0" stroke-width=".3"/>`
  wbSvg += `<line x1="${rB}" y1="${bB-1.4}" x2="${rB}" y2="${bB+1.4}" stroke="#5b9af0" stroke-width=".3"/>`
  wbSvg += `<circle cx="${rB}" cy="${bB}" r=".6" fill="rgba(91,154,240,.2)" stroke="#5b9af0" stroke-width=".3"/>`
  // Recipe A dot (gold diamond)
  wbSvg += `<polygon points="${diamondPoints(rA, bA, 1.1)}" fill="#d4a843" stroke="#0d0d0f" stroke-width=".3"/>`
  // Value labels outside
  const txtA = `A: R${rA>=0?'+':''}${rA} B${ta.wb_shift_blue>=0?'+':''}${ta.wb_shift_blue}`
  const txtB = `B: R${rB>=0?'+':''}${rB} B${tb.wb_shift_blue>=0?'+':''}${tb.wb_shift_blue}`
  wbWrap.innerHTML = `<svg viewBox="-11 -11 22 22" style="width:120px;display:block;border-radius:var(--r);background:var(--surf2);border:1px solid var(--border)">${wbSvg}</svg>`
  wbWrap.innerHTML += `<div style="font-size:10px;color:#d4a843;margin-top:3px">${txtA}</div>`
  wbWrap.innerHTML += `<div style="font-size:10px;color:#5b9af0">${txtB}</div>`
  topRow.appendChild(wbWrap)
  container.appendChild(topRow)

  // Keyword cloud
  const kwA = new Set([...(C.a.mood_keywords||[]), ...(C.a.scenario_keywords||[])])
  const kwB = new Set([...(C.b.mood_keywords||[]), ...(C.b.scenario_keywords||[])])
  const allKw = [...new Set([...kwA, ...kwB])]

  const kwSl = document.createElement('div')
  kwSl.className = 'cmp-section-label'
  kwSl.textContent = 'Keywords'
  container.appendChild(kwSl)

  const kwCloud = document.createElement('div')
  kwCloud.style.cssText = 'margin-bottom:14px'
  allKw.forEach(k => {
    const inA = kwA.has(k), inB = kwB.has(k)
    const sp = document.createElement('span')
    if (inA && inB) {
      sp.className = 'cmp-kw'
      sp.style.cssText = 'background:linear-gradient(90deg,rgba(212,168,67,.15) 50%,rgba(91,154,240,.15) 50%);border:1px solid rgba(150,150,200,.3);color:var(--text2)'
    } else {
      sp.className = 'cmp-kw cmp-kw-' + (inA ? 'a' : 'b')
    }
    sp.textContent = k
    kwCloud.appendChild(sp)
  })
  container.appendChild(kwCloud)

  // Top-3 grid
  const top3Sl = document.createElement('div')
  top3Sl.className = 'cmp-section-label'
  top3Sl.textContent = 'Top 3 similar'
  container.appendChild(top3Sl)

  const top3Grid = document.createElement('div')
  top3Grid.className = 'cmp-top3-grid'

  function makeTop3Col(r, label, color) {
    const col = document.createElement('div')
    const hdr = document.createElement('div')
    hdr.style.cssText = `font-size:10px;font-weight:700;color:${color};margin-bottom:5px`
    hdr.textContent = r.name
    col.appendChild(hdr)
    const list = document.createElement('div')
    list.className = 'cmp-top3'
    cmpTop3(r).forEach(s => list.appendChild(cmpSimCard(s)))
    col.appendChild(list)
    return col
  }

  top3Grid.appendChild(makeTop3Col(C.a, 'a', '#d4a843'))
  top3Grid.appendChild(makeTop3Col(C.b, 'b', '#5b9af0'))
  container.appendChild(top3Grid)
}
```

- [ ] **Step 2: Verify in browser**

Select two recipes, switch to Overlay.  
Expected: single radar with two polygons (gold solid + blue dashed), axis labels showing both values, WB grid with two dots, merged keyword cloud, two-column top-3 grid. Mobile: stacks to single column.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(compare): implement overlay view"
```

---

## Self-review

**Spec coverage:**
- Entry points (card button + dropdowns + swap + clear) — Task 3 + Task 4 ✓
- Shell built once, content replaced — Task 3 ✓
- Three subtab views — Tasks 5, 6, 7 ✓
- Side-by-side: radar, WB, pills, keywords, top-3, diff strip — Task 5 ✓
- Row diff: table with categorical + numeric + WB rows, keyword clouds — Task 6 ✓
- Overlay: shared radar with both polygons, axis labels with both values, WB with two dots, merged cloud, top-3 grid — Task 7 ✓
- Mobile stacking — CSS Task 1 + Task 5 notes ✓
- Filter own name from top-3 — `cmpTop3()` in Task 3 ✓

**Placeholder scan:** None found.

**Type consistency:**
- `C.a`, `C.b` are recipe objects throughout — consistent ✓
- `recipeToT(r)` return shape matches `T_PARAMS` keys — consistent with existing code ✓
- `compareSlots` is `[null, null]` — checked with `compareSlots[0]` / `compareSlots[1]` consistently ✓
- `cmpTop3(r)` returns array of recipe objects — `cmpSimCard(s)` consumes `s.name`, `s.film_simulation`, `s.color_direction` — all valid recipe fields ✓

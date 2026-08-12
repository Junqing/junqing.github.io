# Layout Reorganisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the site into a personal homepage with two realms, extract the inline JS in `index.html` into focused modules, and add hash routing — while keeping it a working, buildless GitHub Pages site at every stage.

**Architecture:** Extraction, not abstraction. Render functions move between files unchanged. `nav.js` becomes the single source of truth for location. Hash routing is required, not preferred: GitHub Pages has no rewrite rules, so `pushState` paths would 404 on refresh.

**Tech Stack:** Vanilla JS, plain `<script src>` globals. No npm, no bundler, no build step, no framework, no TypeScript. Python 3 stdlib only for any tooling.

**Spec:** `docs/superpowers/specs/2026-08-12-layout-reorg-design.md`

## Global Constraints

- **No npm, bundler, package.json, framework, or build step.** The site stays buildless.
- **All asset paths stay relative** (`gallery.js`, never `/gallery.js`). No CNAME, so absolute paths resolve to the domain root and 404.
- **Filenames are case-sensitive on Pages, not on macOS.** A casing slip works locally and 404s live.
- **Routing must be hash-based.** No `history.pushState` paths.
- **Parse-time rule:** no module may touch another module's globals at parse time — only inside function bodies.
- **`NAV` is the only source of truth for location.** After Task 3, nothing calls `document.querySelector('.tab.on')`.
- **Do not rewrite render logic.** Functions move verbatim. Behaviour changes only where a task explicitly says so.
- **Do not change** either recipe family's schema, `gear.js`, `gallery.js`, `tools/`, or the gallery build pipeline.
- **Do not use the `gh` CLI** — it is authenticated to a different GitHub account.
- **Every stage must leave the site working.** A regression must bisect to one commit.

## Verified facts this plan depends on

Established by inspection on 2026-08-12 — do not re-derive:

- `index.html` is 4789 lines: CSS at 7–603, markup at 604–904, one `<script>` block at 905–4782.
- **Lines 909–913 inline all five Fuji generations** (`RECIPES_V/IV/III/II/I`), totalling ~386KB. Each is **byte-identical** to its standalone `recipes-*.js` file (113/202/47/32/13 recipes respectively — verified by parsing both and comparing).
- `RECIPE_POOLS` (line 920) is populated eagerly from all five, so `loadGen()`'s lazy path only ever fires for OM. CLAUDE.md's description of lazy-loading II–IV is wrong.
- `const CORR` (line 914, ~12KB) is correlation data consumed only by `renderCorrelations()` and `buildInsight()`.
- Exactly two places read navigation state from the DOM: `index.html:1087` (`syncSidebarFacets`) and `index.html:1145` (the `clear-btn` handler).
- The site has **no `.nojekyll`** and **no CNAME**. All current asset paths are relative.

## File Structure

| File | Responsibility |
|---|---|
| `index.html` | **Modify.** Shell: CSS, header, nav, empty pane containers, `<script src>` tags. Target ~700 lines. |
| `recipes-ui.js` | **Create.** Camera Settings realm: grid, keywords, insights, explore, compare, sidebar facets, `S`/`T`/`C` state. |
| `personal-ui.js` | **Create.** Photography realm: gallery, gear, setup, notes. |
| `nav.js` | **Create.** `NAV` state, `navigate()`, hash routing. Loads last. |
| `corr-data.js` | **Create.** The `CORR` constant, extracted as data. |
| `.nojekyll` | **Create.** Empty file. Stops Jekyll skipping `_`/`.` paths. |
| `_smoke.html` | **Create, then delete before merge.** Asserts every global survived extraction. |
| `CLAUDE.md` | **Modify.** Document the new structure; correct the lazy-loading claim. |

Tasks are ordered so each leaves a working site. Tasks 1–2 change no behaviour at all, which makes them verifiable by "nothing changed".

---

## Task 1: Extract data blocks and add .nojekyll

**Files:**
- Modify: `index.html` — delete lines 909–914, add `<script src>` tags
- Create: `corr-data.js`
- Create: `.nojekyll`
- Create: `_smoke.html`

**Interfaces:**
- Consumes: nothing
- Produces: `RECIPES_V/IV/III/II/I` and `CORR` as external globals; `_smoke.html` as a verification harness for later tasks

This task removes ~398KB from `index.html` with zero behaviour change. The
recipe arrays already exist as standalone files; only `CORR` is new.

- [ ] **Step 1: Confirm the inline copies are still identical**

Do not skip this — Task 1 deletes the inline copies.

```bash
python3 - <<'PY'
import re, json
h = open('index.html').read()
ok = True
for gen, fn in [('V','recipes-v.js'),('IV','recipes-iv.js'),('III','recipes-iii.js'),
                ('II','recipes-ii.js'),('I','recipes-i.js')]:
    mi = re.search(r'^var RECIPES_%s = (\[.*?\]);$' % gen, h, re.M|re.S)
    mf = re.search(r'var RECIPES_%s\s*=\s*(\[.*\]);?\s*$' % gen, open(fn).read(), re.S)
    same = mi and mf and json.loads(mi.group(1)) == json.loads(mf.group(1))
    ok &= bool(same)
    print(f"{gen:4} identical={bool(same)}")
print("SAFE TO DELETE" if ok else "STOP — MISMATCH")
PY
```

Expected: all five `identical=True`, then `SAFE TO DELETE`. If any says False, STOP and report.

- [ ] **Step 2: Extract CORR to its own file**

```bash
python3 - <<'PY'
import re
h = open('index.html').read()
m = re.search(r'^const CORR = (\{.*?\});$', h, re.M|re.S)
assert m, "CORR not found"
open('corr-data.js','w').write("// Correlation data consumed by renderCorrelations().\nconst CORR = " + m.group(1) + ";\n")
print("wrote corr-data.js:", len(m.group(1)), "bytes")
PY
node --check corr-data.js && echo "corr-data.js parses"
```

- [ ] **Step 3: Delete the six inline data lines**

In `index.html`, delete lines 909–914 — the five `var RECIPES_*` lines and the
`const CORR` line. Delete only those; line 908 and line 915 must survive.

Verify:
```bash
grep -c '^var RECIPES_' index.html    # expect 0
grep -c '^const CORR = {' index.html  # expect 0
```

- [ ] **Step 4: Add the script tags**

In `index.html`, in the existing `<script src>` block (currently
`om-analysis.js`, `gear.js`, `gallery.js`), put the data files FIRST — they must
parse before the inline script that reads them:

```html
<script src="recipes-v.js"></script>
<script src="recipes-iv.js"></script>
<script src="recipes-iii.js"></script>
<script src="recipes-ii.js"></script>
<script src="recipes-i.js"></script>
<script src="corr-data.js"></script>
<script src="om-analysis.js"></script>
<script src="gear.js"></script>
<script src="gallery.js"></script>
```

- [ ] **Step 5: Create .nojekyll**

```bash
touch .nojekyll
```

Empty file. Without it, Jekyll silently skips any path beginning with `_` or `.`.

- [ ] **Step 6: Create the smoke-check page**

Create `_smoke.html`. It loads every module in the same order as `index.html`
and asserts the globals exist. Note this file starts with `_`, which is exactly
why Step 5 matters.

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>smoke</title></head>
<body>
<pre id="out">running…</pre>
<script src="recipes-v.js"></script>
<script src="recipes-iv.js"></script>
<script src="recipes-iii.js"></script>
<script src="recipes-ii.js"></script>
<script src="recipes-i.js"></script>
<script src="corr-data.js"></script>
<script src="om-analysis.js"></script>
<script src="gear.js"></script>
<script src="gallery.js"></script>
<script>
const EXPECT = [
  ['RECIPES_V', 113], ['RECIPES_IV', 202], ['RECIPES_III', 47],
  ['RECIPES_II', 32], ['RECIPES_I', 13],
]
const lines = []
let fail = 0
EXPECT.forEach(([name, count]) => {
  const v = window[name]
  const ok = Array.isArray(v) && v.length === count
  if (!ok) fail++
  lines.push(`${ok ? 'OK  ' : 'FAIL'} ${name} = ${Array.isArray(v) ? v.length : typeof v} (want ${count})`)
})
;['CORR', 'MY_CAMERAS', 'MY_LENSES', 'GALLERY_PHOTOS', 'GALLERY_ALBUMS'].forEach(n => {
  const ok = typeof window[n] !== 'undefined'
  if (!ok) fail++
  lines.push(`${ok ? 'OK  ' : 'FAIL'} ${n} defined`)
})
lines.push('', fail ? `${fail} FAILURES` : 'ALL PASS')
document.getElementById('out').textContent = lines.join('\n')
</script>
</body></html>
```

- [ ] **Step 7: Verify the site still works**

```bash
python3 -m http.server 8000 --bind 127.0.0.1 &
sleep 1
for f in / index.html recipes-v.js recipes-iv.js recipes-iii.js recipes-ii.js \
         recipes-i.js corr-data.js om-analysis.js gear.js gallery.js _smoke.html; do
  printf "%-20s %s\n" "$f" "$(curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/$f)"
done
```

Expected: every path returns 200.

Then confirm the extraction did not lose data:
```bash
python3 -c "
import re
h=open('index.html').read()
print('index.html lines:', h.count(chr(10))+1)
print('no inline recipe data:', 'var RECIPES_' not in h)
"
```

State honestly whether you could open `_smoke.html` in a browser. If not, say so.

- [ ] **Step 8: Commit**

```bash
git add index.html corr-data.js .nojekyll _smoke.html
git commit -m "refactor: extract inline recipe and correlation data

index.html inlined all five Fuji generations plus the correlation
table — ~398KB, byte-identical to the standalone recipes-*.js files
that already existed. Every visitor downloaded all of it on first
paint, and RECIPE_POOLS was populated eagerly, so loadGen()'s lazy
path only ever fired for OM.

Also adds .nojekyll: without it Jekyll silently skips any path
starting with _ or . , which would swallow _smoke.html."
```

---

## Task 2: Extract renderers into recipes-ui.js and personal-ui.js

**Files:**
- Create: `recipes-ui.js`
- Create: `personal-ui.js`
- Modify: `index.html` — remove the moved functions, add two `<script src>` tags
- Modify: `_smoke.html` — assert the moved functions exist

**Interfaces:**
- Consumes: data globals from Task 1
- Produces: all render functions as globals, unchanged in behaviour

**This is a pure move. Do not change any function body.** Behaviour after this
task must be identical: same six tabs, same layout, same everything.

**Move to `personal-ui.js`** (Photography realm) — these functions and their
module-level state, in this order:

```
galleryBuilt, galleryAlbumFilter, galleryPhotos, photoCaption, openPhotoModal,
renderGalleryGrid, GAL_GAP, GAL_TARGET_H, GAL_PHONE_BP, layoutGallery,
galResizeT + its resize listener, renderGallery, buildAlbumChips,
gearBuilt, renderGear, renderCustomSlots, mySetupBuilt, activeSetupCamera,
renderMyCustomSetup, renderSetupCameraPane, scenariosBuilt, renderScenarios
```

**Move to `recipes-ui.js`** (Camera Settings realm) — everything else that is a
renderer or recipe-domain helper:

```
activeGen, RECIPE_POOLS, activeRecipes, S, loadGen, switchGen,
pn, clamp, DIR_COLOR, dc, BW_SIMS, WARM_SIMS, COOL_SIMS, wbKelvin,
recipeWarmth, recipePunch, WARMTH_CLASS, PUNCH_CLASS, warmthClass, punchClass,
matches, filtered, buildChips, syncSidebarFacets, initChips,
initCollapsibleFilters, wbMiniGrid, fingerprint, makeCard, buildOmVisual,
buildOmWheelSvg, buildOmWbBox, makeOmCard, renderGrid, renderCharts, countBy,
buildBarChart, buildHistCard, drawParallel, renderClouds, buildCloud,
renderDirections, goRecipe, renderCorrelations, buildInsight, syncChips,
render, SIM_CHARACTER, settingsBuilt, SETTINGS_DATA, buildSgCard,
renderSettingsGuide, T, T_PARAMS, tNorm, recipeToT, computeSimilarity,
seedRecipe, exploreBuilt, C, compareSlots, compareBuilt,
updateCompareCardButtons, onCompareCardClick, initCompare, syncCmpSelects,
renderCompare, cmpTop3, cmpSimCard, renderCompareSideBySide,
renderCompareRowDiff, renderCompareOverlay, yoursVisible, matchVisible,
_expOverlayTimer, renderExploreResults, svgPill, updateRadarOverlay,
updateExploreViews, buildRadarPane, syncExploreControls, diamondPoints,
buildWbGrid, pillSvg, updateWbDot, _expTimer, expDebounce, buildSliderPane,
buildCompactControls, syncCompactDiffs, fujiExploreHTML, initExplore,
warmthFormulaHTML, punchFormulaHTML, initBadgeFormula
```

**Stays in `index.html`** for now (moves in Task 3):
```
switchTab, switchInnerTab, init, the recipe-modal IIFE, the sidebar-collapse
IIFE, the other two IIFEs, and the $ helper
```

**`const $ = id => document.getElementById(id)` must be defined in index.html
BEFORE the module script tags**, because every moved function uses it. Move it
to its own tiny `<script>` block above the `<script src>` tags, or duplicate the
one-liner at the top of each module — prefer the former.

- [ ] **Step 1: Move the personal-ui.js functions**

Cut each listed function from `index.html` and paste into `personal-ui.js`,
preserving order and comments. Start the file with:

```js
// Photography realm: gallery, gear, custom setup, scenario notes.
// Parse-time rule: nothing here may touch another module's globals at parse
// time — only inside function bodies.
```

- [ ] **Step 2: Move the recipes-ui.js functions**

Same process. Start the file with:

```js
// Camera Settings realm: recipe grid, keywords, insights, explore, compare.
// Owns activeGen and the S / T / C filter+tool state.
// Parse-time rule: nothing here may touch another module's globals at parse
// time — only inside function bodies.
```

- [ ] **Step 3: Add the script tags**

After `gallery.js`, before the inline `<script>`:

```html
<script src="recipes-ui.js"></script>
<script src="personal-ui.js"></script>
```

- [ ] **Step 4: Verify nothing was lost or duplicated**

```bash
python3 - <<'PY'
import re
names = set()
dupes = []
for f in ['index.html','recipes-ui.js','personal-ui.js']:
    src = open(f).read()
    if f.endswith('.html'):
        src = '\n'.join(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', src, re.S))
    for m in re.finditer(r'^function (\w+)', src, re.M):
        n = m.group(1)
        if n in names: dupes.append(n)
        names.add(n)
print("total functions:", len(names))
print("DUPLICATES:", dupes or "none")
PY
```

Expected: no duplicates. A duplicate means a function was copied instead of moved — the later definition silently wins and the earlier one is dead.

- [ ] **Step 5: Verify every module parses**

```bash
node --check recipes-ui.js && node --check personal-ui.js && echo "modules parse"
python3 - <<'PY'
import re
src = open('index.html').read()
blocks = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', src, re.S)
open('/tmp/inline.js','w').write('\n;\n'.join(blocks))
print("inline blocks:", len(blocks))
PY
node --check /tmp/inline.js && echo "inline parses"
```

- [ ] **Step 6: Extend the smoke page**

Add to `_smoke.html`: the two new `<script src>` tags (after `gallery.js`), and
this assertion block before the summary lines:

```js
;['renderGrid','renderClouds','renderSettingsGuide','initExplore','initCompare',
  'renderGallery','renderGear','renderMyCustomSetup','renderScenarios',
  'activeRecipes','matches','switchGen','layoutGallery'].forEach(n => {
  const ok = typeof window[n] === 'function'
  if (!ok) fail++
  lines.push(`${ok ? 'OK  ' : 'FAIL'} ${n}() callable`)
})
```

- [ ] **Step 7: Verify the site is unchanged**

Serve and curl every path for 200, as in Task 1 Step 7, plus the two new
modules. Then state honestly whether you could verify in a browser. If you can,
check that all six tabs still work exactly as before. If you cannot, say so —
do not claim visual verification you did not perform.

- [ ] **Step 8: Commit**

```bash
git add index.html recipes-ui.js personal-ui.js _smoke.html
git commit -m "refactor: split renderers into recipes-ui.js and personal-ui.js

Pure move — no function body changed and no behaviour differs. Splits
by realm so the two halves of the app stop sharing one 4800-line file."
```

---

## Task 3: Introduce nav.js and NAV state

**Files:**
- Create: `nav.js`
- Modify: `index.html` — remove `switchTab`/`switchInnerTab`, add `<script src>`
- Modify: `recipes-ui.js` — `syncSidebarFacets` reads `NAV`, not the DOM
- Modify: `personal-ui.js` — the `clear-btn` handler reads `NAV`, not the DOM

**Interfaces:**
- Consumes: render functions from Task 2
- Produces:
  - `NAV = { section, view, family }`
  - `navigate(section, view, subview, family)` — single entry point
  - `renderCurrentView()` — dispatches to the right render function

**Still six flat tabs after this task.** Only the state plumbing changes, so
this is again verifiable by "nothing changed".

- [ ] **Step 1: Write nav.js**

```js
// Navigation state and dispatch. THE single source of truth for location —
// nothing anywhere may ask the DOM where it is.
//
// Loads last: it calls into recipes-ui.js and personal-ui.js.

const NAV = { section: 'home', view: null, subview: null, family: 'V' }

// section -> its views, first is the default
const NAV_VIEWS = {
  home:        [],
  photography: ['gallery', 'gear', 'setup', 'notes'],
  camera:      ['recipes', 'insights', 'explore', 'compare'],
}

// Two Camera Settings views keep an inner subtab bar. Flattening these into
// top-level views would put six items in the Camera Settings bar and bury the
// distinction between "a recipe list" and "a way of reading recipe data".
// First entry is the default.
const NAV_SUBVIEWS = {
  recipes:  ['list', 'keywords'],
  insights: ['settings', 'directions', 'correlations'],
}

// view -> the function that renders it. Views with subviews dispatch on
// NAV.subview.
const NAV_RENDER = {
  gallery:  () => renderGallery(),
  gear:     () => renderGear(),
  setup:    () => renderMyCustomSetup(),
  notes:    () => renderScenarios(),
  explore:  () => initExplore(),
  compare:  () => initCompare(),
  recipes:  () => NAV.subview === 'keywords' ? renderClouds() : renderGrid(),
  insights: () => {
    if (NAV.subview === 'directions')   return renderDirections()
    if (NAV.subview === 'correlations') return renderCorrelations()
    return renderSettingsGuide()
  },
}

function renderCurrentView() {
  const fn = NAV_RENDER[NAV.view]
  if (fn) fn()
}

function navigate(section, view, subview, family) {
  if (!NAV_VIEWS[section]) section = 'home'
  const views = NAV_VIEWS[section]
  if (!views.includes(view)) view = views[0] || null
  const subs = NAV_SUBVIEWS[view]
  if (subs) { if (!subs.includes(subview)) subview = subs[0] }
  else subview = null
  NAV.section = section
  NAV.view = view
  NAV.subview = subview
  if (family && typeof RECIPE_POOLS === 'object' && RECIPE_POOLS.hasOwnProperty(family)) {
    NAV.family = family
  }
  applyNav()
}

// Toggles DOM classes to match NAV. Reads NAV; never the reverse.
function applyNav() {
  document.querySelectorAll('[data-section]').forEach(el =>
    el.classList.toggle('on', el.dataset.section === NAV.section))
  document.querySelectorAll('[data-view]').forEach(el =>
    el.classList.toggle('on', el.dataset.view === NAV.view))
  document.querySelectorAll('[data-subview]').forEach(el =>
    el.classList.toggle('on', el.dataset.subview === NAV.subview))
  document.querySelectorAll('.pane').forEach(p =>
    p.classList.toggle('on', p.id === 'pane-' + (NAV.view || NAV.section)))
  document.querySelectorAll('.inner-pane').forEach(p =>
    p.classList.toggle('on', p.id === 'inner-' + NAV.view + '-' + NAV.subview))
  renderCurrentView()
}
```

- [ ] **Step 2: Replace the two DOM-state reads**

In `recipes-ui.js`, `syncSidebarFacets()` currently opens with:

```js
const isGal = document.querySelector('.tab.on')?.dataset.tab === 'gallery'
```

Replace with:

```js
const isGal = NAV.section === 'photography'
```

In `personal-ui.js`, the `clear-btn` handler currently has:

```js
const onGallery = document.querySelector('.tab.on')?.dataset.tab === 'gallery'
```

Replace with:

```js
const onGallery = NAV.view === 'gallery'
```

- [ ] **Step 3: Verify no DOM-state reads remain**

```bash
grep -rn "querySelector('\.tab\.on')" index.html recipes-ui.js personal-ui.js nav.js \
  && echo "STILL PRESENT — fix before continuing" || echo "clean"
```

Expected: `clean`.

- [ ] **Step 4: Point the old tab handlers at navigate()**

Keep the existing six tabs working by mapping each to the new model. In
`index.html`, replace the `switchTab`/`switchInnerTab` bodies with thin
delegations — for this task only, tab `my` maps to `photography/setup`,
`gallery` to `photography/gallery`, `grid` to `camera/recipes`, `insights` to
`camera/insights`, `explore` to `camera/explore`, `compare` to `camera/compare`.

- [ ] **Step 5: Verify and commit**

Parse-check every module, curl every path for 200, extend `_smoke.html` to
assert `NAV` and `navigate` exist. State browser-verification honestly.

```bash
git add index.html nav.js recipes-ui.js personal-ui.js _smoke.html
git commit -m "refactor: add nav.js with NAV as the single source of location

Two places read the active tab from the DOM via querySelector('.tab.on').
That pattern is what makes a later router swap a hunt rather than a
one-file change. NAV now owns location; the DOM reflects it."
```

---

## Task 4: Apply the new information architecture

**Files:**
- Modify: `index.html` — header, nav markup, pane containers, landing page, CSS
- Modify: `nav.js` — landing page render
- Modify: `recipes-ui.js` — `gen-select` moves into the Camera Settings pane

**Interfaces:**
- Consumes: `navigate()` from Task 3
- Produces: `renderHome()`

- [ ] **Step 1: Retitle and restructure the header**

Change the `<h1>` from `Fujifilm X-Trans <span>Recipe Explorer</span>` to `Jin`.

Replace the six-tab `.tabs` block with three sections:

```html
<div class="tabs">
  <div class="tab" data-section="home">Home</div>
  <div class="tab" data-section="photography">Photography</div>
  <div class="tab" data-section="camera">Camera Settings</div>
</div>
```

- [ ] **Step 2: Move gen-select out of the global header**

Cut the `<select id="gen-select">` block from `<header>` and place it inside the
Camera Settings pane, above its view subtabs. It must not be present in the DOM
of any other section.

- [ ] **Step 3: Add the two realms' subtab bars**

Photography: Gallery / Gear / My Setup / Notes, using `data-view` values
`gallery` / `gear` / `setup` / `notes`.

Camera Settings: Recipes / Insights / Explore / Compare, using `data-view`
values `recipes` / `insights` / `explore` / `compare`.

Both wired through `navigate()`.

- [ ] **Step 4: Build the landing page**

Add `#pane-home` and `renderHome()` in `nav.js`:

- Heading: `Jin`
- Bio, verbatim: `Techie by day, hobby photographer and guitarist.`
- A strip of the 6 most recent photos from `GALLERY_PHOTOS` (guard for the
  file being absent), each linking to `#/photography/gallery`
- Two door cards: **Photography** (`gear + my setup`) and **Camera Settings**
  (photo count from `GALLERY_PHOTOS.length`, recipe total from summing
  `RECIPE_POOLS`), linking to `#/photography` and `#/camera`

Guard every data reference with `typeof X !== 'undefined'` so a missing data
file degrades to an empty state rather than a blank page.

- [ ] **Step 5: Verify and commit**

Confirm `gen-select` exists only inside the Camera Settings pane:

```bash
python3 -c "
import re
h = open('index.html').read()
i = h.index('gen-select')
print('gen-select appears', h.count('id=\"gen-select\"'), 'time(s)')
"
```

Serve, curl for 200, state browser verification honestly.

```bash
git add index.html nav.js recipes-ui.js
git commit -m "feat: three-section IA with a landing page

Six flat tabs become Home / Photography / Camera Settings. The family
picker moves inside Camera Settings, where it is the only place it means
anything — it was previously in the global header, visible on tabs it
did not apply to, which had already caused one real bug."
```

---

## Task 5: Hash routing

**Files:**
- Modify: `nav.js`

**Interfaces:**
- Consumes: `navigate()` / `NAV` from Tasks 3–4
- Produces: deep-linkable URLs, working back/forward

- [ ] **Step 1: Add hash parse and write**

In `nav.js`:

```js
// Hash routing, not pushState: GitHub Pages serves static files with no
// rewrite rules, so a real path would 404 on refresh or deep link.
function navToHash() {
  const parts = ['#', NAV.section]
  if (NAV.view) parts.push(NAV.view)
  if (NAV.subview) parts.push(NAV.subview)
  if (NAV.section === 'camera' && NAV.family !== 'V') parts.push('f=' + NAV.family)
  return parts.join('/').replace('#/home', '#/')
}

// Family is tagged `f=` rather than positional: without it, #/camera/recipes/OM
// is ambiguous — OM could be a subview or a family, and both are optional.
function applyHash() {
  const raw = location.hash.replace(/^#\/?/, '')
  const segs = raw.split('/').filter(Boolean)
  const fam = segs.find(s => s.startsWith('f='))
  const rest = segs.filter(s => !s.startsWith('f='))
  const [section, view, subview] = rest
  navigate(section || 'home', view, subview, fam && fam.slice(2))
}
```

Have `navigate()` write `location.hash = navToHash()` at the end, guarded so it
does not recurse when the change came from a `hashchange`.

- [ ] **Step 2: Wire the listener and initial load**

```js
window.addEventListener('hashchange', applyHash)
document.addEventListener('DOMContentLoaded', () => {
  if (location.hash) applyHash(); else navigate('home')
})
```

- [ ] **Step 3: Verify the fallbacks**

Confirm by reading the code and, if a browser is available, by testing:

- `#/nonsense` → falls back to Home, not a blank pane
- `#/camera/nosuchview` → falls back to `camera`'s first view (`recipes`)
- `#/camera/recipes/ZZ` → unknown family falls back to the current one
- `#/` → Home

- [ ] **Step 4: Commit**

```bash
git add nav.js
git commit -m "feat: hash routing with deep links and back/forward"
```

---

## Task 6: Documentation and cleanup

**Files:**
- Modify: `CLAUDE.md`
- Delete: `_smoke.html`

- [ ] **Step 1: Rewrite the affected CLAUDE.md sections**

Update: the Overview (site is a personal homepage, not a recipe explorer), the
Architecture file list (four new modules), the tab table (three sections and
their views), Key functions (`NAV`, `navigate`, `renderCurrentView`), and the
routing scheme.

**Correct two now-wrong claims:**
- CLAUDE.md says generations II–IV are lazy-loaded via `loadGen()`. They were
  inlined in `index.html` and eagerly pooled; only OM ever took the lazy path.
  After Task 1 all six load via `<script src>`.
- CLAUDE.md's tab table and `switchTab()` description are superseded.

**Add the GitHub Pages constraints** as a section: relative paths only, no
CNAME, case-sensitive filenames, `.nojekyll` present and why, hash routing
required because there are no rewrite rules.

- [ ] **Step 2: Delete the smoke page**

```bash
git rm _smoke.html
```

It served its purpose during extraction; keeping it means maintaining it.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document the three-section IA, modules, and Pages constraints"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Home / Photography / Camera Settings IA | 4 |
| Landing: bio, photo strip, two doors | 4 |
| `gen-select` scoped to Camera Settings | 4 |
| `<h1>` retitled to "Jin" | 4 |
| `nav.js` owns location; `NAV` single source of truth | 3 |
| Remove both `querySelector('.tab.on')` reads | 3 |
| `recipes-ui.js` / `personal-ui.js` split | 2 |
| `RECIPES_V` (and all generations) leave index.html | 1 |
| `.nojekyll` added | 1 |
| Relative paths only | Global constraint; checked in 1, 2 |
| Hash routing, fallbacks | 5 |
| Staged so each commit leaves a working site | Task order |
| `_smoke.html` created then deleted | 1, 6 |
| CLAUDE.md updated, lazy-load claim corrected | 6 |

No spec requirement is unassigned.

**Placeholder scan:** No TBD/TODO. Every code step carries real code. Task 2's
move lists name every symbol explicitly rather than saying "and the rest".

**Type consistency:** `NAV` has `{section, view, subview, family}` in Tasks 3–5.
`navigate(section, view, subview, family)` keeps that argument order throughout
(verified: every call site in the plan matches). `NAV_VIEWS` keys
(`home`/`photography`/`camera`) match the `data-section` values in Task 4 and
the hash segments in Task 5. `NAV_RENDER` keys match `NAV_VIEWS` values exactly
(verified programmatically). `NAV_SUBVIEWS` keys are a subset of `NAV_VIEWS`
values.

**Gap caught during self-review:** the first draft flattened `NAV` to
section/view only, which would have silently dropped three existing views —
Recipes ▸ Keywords, Insights ▸ Directions, and Insights ▸ Correlation. All 83
top-level functions in `index.html` were then checked against Task 2's move
lists programmatically; none is unaccounted for.

**Known risk, stated plainly:** Task 2 is a ~3000-line mechanical move and there
is no browser automation in the working environment. Step 4's duplicate-function
check and `_smoke.html` catch the common failure modes (function left behind,
copied instead of moved, load-order break), but neither proves the UI renders.
The staging exists so that a regression bisects to one commit; a human must open
a browser before merge.

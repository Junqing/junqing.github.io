# Layout Reorganisation — Design

**Date:** 2026-08-12
**Status:** Approved, ready for implementation planning
**Branch:** `redesign/layout-reorg`

## Summary

Restructure the site from six flat tabs into a personal homepage with two
realms, extract the ~3900 lines of inline JS in `index.html` into focused
modules, and add hash-based routing.

The site becomes **"Jin"** — a personal homepage where photography is one facet
and the recipe explorer is a project within it — rather than a recipe tool with
an author section bolted on.

## Goals

- A landing page that introduces the author to a first-time visitor
- One clear home for camera colour work, scoped by sensor family
- One clear home for the author's own material
- Clean module boundaries, so a later port to a real web app is a contained
  change rather than a rewrite
- Deep-linkable URLs

## Non-goals

Deliberately excluded to avoid overengineering a prototype:

- No framework, component library, bundler, npm, or build step
- No TypeScript
- No server, no API, no database
- No rewriting of render logic — functions move between files unchanged
- No guitar section yet (the bio mentions it; structure leaves room)
- No changes to either recipe family's schema or to the gallery pipeline

## Information architecture

```
┌───────────────────────────────────────────────────────┐
│  Jin              [Home] [Photography] [Camera Settings]
└───────────────────────────────────────────────────────┘

HOME  (landing, root)
  "Jin — techie by day, hobby photographer and guitarist"
  [ 6 recent photos → ]
  ┌──────────────────┬────────────────────┐
  │ Photography      │ Camera Settings    │
  │ gear + my setup  │ 473 recipes,       │
  │                  │ 6 families         │
  └──────────────────┴────────────────────┘

PHOTOGRAPHY               CAMERA SETTINGS
  Gallery                   [X-Trans V ▾]   ← family picker lives HERE
  Gear                      Recipes
  My Setup                  Insights
  Notes                     Explore
                            Compare
```

### Migration map

| Today | Becomes |
|---|---|
| `My` ▸ My Custom Setup | Photography ▸ My Setup |
| `My` ▸ My Gear | Photography ▸ Gear |
| `My` ▸ Scenario Cases | Photography ▸ Notes |
| `Gallery` | Photography ▸ Gallery |
| `Recipes` / `Insights` / `Explore` / `Compare` | Camera Settings (internals unchanged) |
| `gen-select` in the global header | Inside Camera Settings only |
| `<h1>` "Fujifilm X-Trans Recipe Explorer" | "Jin" |

### Accepted trade-off

Recipes moves from one click to two (Camera Settings → Recipes). This is the
cost of a landing page and was accepted explicitly. The Camera Settings door
opens directly on Recipes rather than an intermediate index, which keeps it to
two clicks rather than three.

### Why the family picker moves

`gen-select` is currently in the global header, visible on every tab, but it
only means anything for the four recipe tabs. This already produced a real bug:
changing family while on the Gallery tab called `switchGen()` → `initChips()`,
which re-showed recipe filter sections over a gallery-only sidebar (fixed in
`ae58df5` by adding `syncSidebarFacets()`).

Scoping the picker to the Camera Settings realm removes that class of bug
structurally rather than by patching, and lets `syncSidebarFacets()` simplify.

## Module boundaries

The discipline is **extraction, not abstraction**. Code moves into files with
clear seams; it is not redesigned on the way.

```
index.html        Shell only: CSS, header, nav, empty pane containers,
                  <script src> tags. Target ~700 lines.

nav.js       NEW  Owns navigation state and routing. The ONLY place that
                  knows "where am I".

recipes-ui.js NEW Camera Settings realm: renderGrid, renderClouds, Insights,
                  Explore, Compare, sidebar facets, and the S / T / C state.

personal-ui.js NEW Photography realm: gallery, gear, setup, notes rendering.

om-analysis.js    Unchanged — already a clean module.
gear.js           Unchanged — author data.
gallery.js        Unchanged — generated data.
recipes-*.js      Unchanged — recipe data.
```

### The rule that matters most

`NAV` is the single source of truth for location:

```js
const NAV = { section: 'home', view: null, family: 'V' }
```

Nothing may ask the DOM where it is. Two places currently do
(`index.html:1087` and `index.html:1145` both call
`document.querySelector('.tab.on')?.dataset.tab`); both are removed.

This is the boundary that makes a later router swap a one-file change instead
of a hunt through 4789 lines.

### Recipe data must leave index.html

`RECIPES_V` is currently **inlined in `index.html`**, not loaded via
`<script src>`, even though `recipes-v.js` exists as a standalone file and
`CLAUDE.md` documents it as being loaded that way. The inline copy is why
`index.html` carries ~567KB in one `<script>` block — most of it data, not code.

The extraction loads `recipes-v.js` via `<script src>` like every other
generation, and deletes the inline copy. This is a prerequisite for the
~700-line target, and it also means the browser can cache recipe data
separately from application code.

Verify the two copies are identical before deleting the inline one.

## Load order

`om-analysis.js`'s existing rule now binds every module: **nothing may touch
another module's globals at parse time — only inside function bodies.**

```html
<script src="recipes-v.js"></script>    <!-- data first -->
<script src="om-analysis.js"></script>
<script src="gear.js"></script>
<script src="gallery.js"></script>
<script src="recipes-ui.js"></script>   <!-- realm renderers -->
<script src="personal-ui.js"></script>
<script src="nav.js"></script>          <!-- router last; calls into the above -->
```

`nav.js` loads last because it calls into both realms. Its `init()` runs on
`DOMContentLoaded`, by which point every module has parsed.

## Routing

Hash-based, because GitHub Pages serves static files with no rewrite rules —
`history.pushState` paths would 404 on refresh or deep link.

```
#/                        Home
#/photography             Photography (defaults to Gallery)
#/photography/gallery     Photography ▸ Gallery
#/photography/gear        Photography ▸ Gear
#/photography/setup       Photography ▸ My Setup
#/photography/notes       Photography ▸ Notes
#/camera                  Camera Settings (defaults to Recipes, current family)
#/camera/recipes          Camera Settings ▸ Recipes
#/camera/insights         Camera Settings ▸ Insights
#/camera/explore          Camera Settings ▸ Explore
#/camera/compare          Camera Settings ▸ Compare
#/camera/recipes/OM       …scoped to a named family
```

- `navigate(section, view, family)` is the single entry point; it updates `NAV`,
  renders, and writes the hash.
- A `hashchange` listener parses the hash and applies it, so browser back and
  forward work.
- An unrecognised hash falls back to Home rather than rendering a blank pane.
- A family segment that names an unknown generation falls back to the current
  family rather than erroring.

## GitHub Pages correctness

The site must keep working as a static, buildless GitHub Pages deployment.
Verified constraints:

| Constraint | Status / action |
|---|---|
| No CNAME — served from a project path | Every asset path must stay **relative** (`gallery.js`, not `/gallery.js`). An absolute path resolves to the domain root and 404s. |
| No `.nojekyll`, so Jekyll processes the site | **Add `.nojekyll`.** Jekyll silently skips files and directories whose names begin with `_` or `.`; a future `_partials/` or similar would vanish with no error. Cheap insurance. |
| Pages is case-sensitive; macOS is not | All current `<script src>` values match their real filenames exactly. New modules must too — a casing slip works locally and 404s live. |
| No server-side rewrites | Routing must be hash-based. Confirmed above. |
| `loadGen()` fetches `recipes-<gen>.js` at runtime | Relative path, unchanged by this work. Must stay relative. |
| Hard refresh on a deep link | Hash fragments are not sent to the server, so `#/camera/explore` serves `index.html` and the client routes. Works by construction. |

## Staged delivery

The extraction is a ~3000-line mechanical move, and mechanical moves are where
subtle breakage hides. Each stage must leave the site working, so a regression
bisects to one commit rather than hiding in a single large diff.

1. **Extract with no behaviour change.** Move renderers into `recipes-ui.js` and
   `personal-ui.js`; move `RECIPES_V` out to its `<script src>`. Tabs, layout,
   and behaviour stay exactly as they are today. Verifiable by "nothing changed".
2. **Introduce `nav.js` and `NAV`.** Replace the two `querySelector('.tab.on')`
   reads. Still six flat tabs. Verifiable by "nothing changed".
3. **Apply the new IA.** Three top-level sections, panes re-parented, landing
   page added, `gen-select` moved into Camera Settings, `<h1>` retitled.
4. **Add hash routing.** `navigate()` writes the hash; `hashchange` reads it.

## Verification

There is no test framework and no browser automation in the working
environment. Verification is therefore explicit and staged, and any claim about
visual behaviour must say plainly that it was not observed.

**Automated (must pass at every stage):**

- Every module parses: extract each `<script>` block and `node --check` it.
- `_smoke.html` — a temporary page that loads all modules in order and asserts
  every expected global and render function exists and is callable. This catches
  the classic extraction failures: a function left behind, a load-order break, a
  name typo'd during the move. Deleted before merge.
- Serve locally and `curl` every module path, asserting HTTP 200 — catches a
  casing or path error that would 404 on Pages.
- `grep` that no `<script src>` or `loadGen` path is absolute.

**Manual (human, in a browser):**

1. Each of the three sections loads and renders.
2. Every view within both realms renders.
3. The family picker switches generations, and only appears in Camera Settings.
4. Deep link: paste `#/camera/explore` into a fresh tab — it lands there.
5. Browser back and forward move through visited views.
6. An unknown hash (`#/nonsense`) falls back to Home.
7. Mobile ≤680px: nav is usable, gallery is one photo per row.
8. Sidebar filters still work in Camera Settings and are absent in Photography.

## Open items

None. The bio wording is "Jin — techie by day, hobby photographer and
guitarist"; guitar gets no section in this pass.

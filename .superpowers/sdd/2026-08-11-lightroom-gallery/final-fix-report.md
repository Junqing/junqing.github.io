# Sidebar facet visibility fix — final report

## Summary

Extracted `syncSidebarFacets()` (index.html, defined just above `initChips()`) as the single
source of truth for `.sb-section` display. It reads `.tab.on`'s `data-tab` (Gallery vs. recipe
tab) and `activeGen` (OM vs. Fuji), and sets display on `sb-sec-album`, `sb-sec-sim`,
`sb-sec-era`, `sb-sec-type`, `sb-sec-hue` explicitly; every other `.sb-section` is hidden on
Gallery and shown otherwise.

`initChips()` no longer touches visibility at all — it only builds chip DOM (`buildChips(...)`
calls), per the constraint that chip content generation and visibility must be decoupled.

Call sites:
- `switchGen()` (index.html ~959): calls `initChips()` then `syncSidebarFacets()` after loading
  a new generation — this is the fix for Finding 1 (gen-switch no longer bypasses the
  Gallery-tab sidebar state).
- `switchTab()` (index.html ~1817-1818): replaced the old inline `isGal` block (which duplicated
  visibility logic and was the second copy causing Finding 2) with a call to `initChips()` (recipe
  tabs only) followed by `syncSidebarFacets()` (always, so Gallery's sidebar state is set too).
- `init()` (index.html ~4691): added `syncSidebarFacets()` after the existing `initChips()` call
  so the very first render (page load, Recipes/V) sets sidebar visibility through the same owner
  rather than relying on the static `style="display:none"` HTML defaults alone.

No changes to matches(), activeRecipes(), makeCard(), makeOmCard(), fingerprint(), recipes-*.js,
gallery.js, or tools/.

## Verification (code trace only — no browser automation available in this environment)

1. **Load page, defaults to Recipes tab (`id="grid"`), gen V.**
   `init()` → `initChips()` builds sim/era/warmth/punch/mood/scene chips (isOm=false branch) →
   `syncSidebarFacets()`: `.tab.on` is `[data-tab="grid"]` (static HTML `class="tab on"`) so
   `isGal=false`; `activeGen==='V'` so `isOm=false`. Result: `sb-sec-sim`/`sb-sec-era` shown,
   `sb-sec-type`/`sb-sec-hue` hidden, `sb-sec-album` hidden. Matches expected. **Traced, not run.**

2. **Switch to Gallery tab.**
   Tab click → `switchTab('gallery')`. `.tab.on` class is reassigned to the Gallery tab
   *before* `syncSidebarFacets()` runs (classList toggle happens at the top of `switchTab`,
   `syncSidebarFacets()` is called later in the same function body) → `isGal=true`. Function
   skips `initChips()` (guarded by `if (!isGal)`), calls `syncSidebarFacets()`: album shown, sim/
   era/type/hue explicitly hidden via the `!isGal && ...` guards, and the fallback loop hides
   every other non-owned `.sb-section` (Search stays technically owned-by-fallback logic but its
   `sec.style.display = isGal ? 'none' : ''` — wait: Search, Warmth, Punch, Mood, Scenario are
   NOT in `OWNED`, so they get `display:'none'` when `isGal`. Only `sb-sec-album` (owned, shown)
   remains visible.) Result: only Album visible. **Traced, not run.**

3. **While on Gallery, switch gen dropdown V→OM (the bug repro).**
   `switchGen('OM')` loads `recipes-om.js`, sets `activeGen='OM'`, calls `initChips()` (still
   builds OM-shaped chips even though hidden — harmless), then `syncSidebarFacets()`. At this
   point `.tab.on` is still the Gallery tab (switchGen never touches `.tab` classes), so
   `isGal=true` overrides `isOm=true` in every `show(...)` call (`!isGal && ...` forces
   sim/era/type/hue all hidden regardless of OM state), and album stays shown. Result: Album
   remains the only visible facet — Finding 1 is fixed. **Traced, not run.**

4. **Switch back to Recipes tab while gen=OM.**
   `switchTab('grid')` → `.tab.on` reassigned to `grid` → `isGal=false`. `initChips()` runs
   (isOm=true branch: builds `f-type`/`f-hue` chips). `syncSidebarFacets()`: `isGal=false`,
   `isOm=true` → `sb-sec-type`/`sb-sec-hue` shown, `sb-sec-sim`/`sb-sec-era` hidden, `sb-sec-album`
   hidden. **Traced, not run.**

5. **Switch gen OM→V while on Recipes tab.**
   `switchGen('V')` → `initChips()` (isOm=false branch: builds sim/era chips) →
   `syncSidebarFacets()`: `.tab.on` still `grid` so `isGal=false`; `activeGen='V'` so `isOm=false`
   → sim/era shown, type/hue hidden. **Traced, not run.**

6. **Chips have content, not just visibility, in each case.**
   `initChips()` is unchanged in its chip-building responsibility — only the visibility `show(...)`
   calls were removed from it, all `buildChips('f-sim', ...)`, `buildChips('f-type', ...)`, etc.
   calls remain intact and still run whenever `initChips()` is invoked (init, switchGen, and
   switchTab-for-non-Gallery). Since every scenario above that ends with a visible recipe facet
   also passed through `initChips()` in the same call chain, those chips are populated, not just
   unhidden. Gallery's `f-album` chip population is handled by `renderGallery()`/gallery.js
   (untouched by this change) — out of scope per constraints. **Traced, not run.**

## Honesty note

All six scenarios were verified by static code reading (grep + Read of index.html around lines
916, 939-968, 1077-1105, 1810-1826, 4679-4691) and a Node.js syntax check of the extracted inline
`<script>` block (`node --check` on the extracted script — passed). No browser, headless or
otherwise, was used; nothing here is a claim of visual/runtime verification.

## Concerns

- `syncSidebarFacets()` reads `.tab.on` from the DOM rather than a JS state variable — this
  matches the existing house pattern (`clear-btn`'s handler already does the same lookup at
  index.html:1128) but means it's load-order-dependent on the `.tab` classList already being
  correct at call time. In both `switchTab()` and `switchGen()`/`init()` this holds today; a
  future caller invoking `syncSidebarFacets()` before the tab classList settles would silently
  read stale state.

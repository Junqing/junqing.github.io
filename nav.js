// Navigation state and dispatch. THE single source of truth for location —
// nothing anywhere may ask the DOM where it is.
//
// Loads last: it calls into recipes-ui.js and personal-ui.js.

// family is not yet wired to switchGen() — nothing calls navigate(..., family)
// on a generation switch, so this stays at its initial value regardless of
// which recipe family is active. Nothing reads NAV.family yet either, so
// it's currently dead, but a future task must not assume it tracks reality
// until switchGen() is taught to update it.
const NAV = { section: 'home', view: null, subview: null, family: 'V' }

// Declared totals for the Home door stat — deliberately NOT derived from
// RECIPE_POOLS. RECIPE_POOLS only contains whatever families have been
// loaded so far (V/IV/III/II/I are eager, OM is lazy via loadGen()), so a
// cold load with no prior navigation would read "407 recipes · 5 families"
// instead of the true "473 recipes · 6 families" until the user happened to
// visit OM. These counts are fixed data — recipes-*.js files are static and
// committed — so hardcoding them here is correct, not a shortcut: it needs
// no runtime probing and stays right even if load order changes. Update
// this list (and only this list) if a recipe family file gains/loses
// entries or a new family is added.
const RECIPE_FAMILIES = [
  { id: 'V',   label: 'X-Trans V',   count: 113 },
  { id: 'IV',  label: 'X-Trans IV',  count: 202 },
  { id: 'III', label: 'X-Trans III', count: 47 },
  { id: 'II',  label: 'X-Trans II',  count: 32 },
  { id: 'I',   label: 'X-Trans I',   count: 13 },
  { id: 'OM',  label: 'OM System',   count: 66 },
]

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
    if (NAV.subview === 'correlations') {
      // Old switchInnerTab passed $('corr-q').value so a typed filter
      // survived a tab-away-and-back; a bare call defaults to unfiltered,
      // matching renderCorrelations()'s own (filterQ||'') fallback.
      const q = document.getElementById('corr-q')
      return renderCorrelations(q ? q.value : undefined)
    }
    return renderSettingsGuide()
  },
}

function renderCurrentView() {
  if (NAV.section === 'home') {
    if (typeof renderHome === 'function') renderHome()
    return
  }
  const fn = NAV_RENDER[NAV.view]
  if (fn) fn()
}

// Landing page. Rebuilds #pane-home's full content on every entry — cheap,
// and keeps the recent-photos strip and door-card stats current even if
// GALLERY_PHOTOS or a lazily-loaded recipe family changed since last visit.
// Guards every external data reference so a missing gallery.js/gear.js/
// recipes-*.js degrades to a smaller home page, never a blank one.
function renderHome() {
  const pane = document.getElementById('pane-home')
  if (!pane) return

  const photos = typeof GALLERY_PHOTOS !== 'undefined' ? GALLERY_PHOTOS : []
  const recent = [...photos].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6)

  const photoCount = photos.length
  const recipeCount = RECIPE_FAMILIES.reduce((sum, f) => sum + f.count, 0)
  const familyCount = RECIPE_FAMILIES.length

  const photoStripHtml = recent.length
    ? `<div class="home-section-label">Recent photos</div>
       <div class="home-photo-strip" id="home-photo-strip">${
         recent.map(p => `<img src="${p.thumb}" alt="${p.camera || ''}">`).join('')
       }</div>`
    : ''

  pane.innerHTML = `
    <div class="home-hero">
      <h2 class="home-name">Jin</h2>
      <p class="home-bio">Techie by day, hobby photographer and guitarist.</p>
    </div>
    ${photoStripHtml}
    <div class="home-doors">
      <div class="home-door" id="home-door-photography">
        <h3>Photography</h3>
        <p>gear + my setup</p>
        <div class="home-door-stat">${photoCount} photo${photoCount === 1 ? '' : 's'}</div>
      </div>
      <div class="home-door" id="home-door-camera">
        <h3>Camera Settings</h3>
        <div class="home-door-stat">${recipeCount} recipes · ${familyCount} families</div>
      </div>
    </div>`

  const strip = document.getElementById('home-photo-strip')
  if (strip) strip.addEventListener('click', () => navigate('photography', 'gallery'))
  const doorPhotography = document.getElementById('home-door-photography')
  if (doorPhotography) doorPhotography.addEventListener('click', () => navigate('photography'))
  const doorCamera = document.getElementById('home-door-camera')
  if (doorCamera) doorCamera.addEventListener('click', () => navigate('camera'))
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

  // Recipe/OM sidebar facets only mean anything in Camera Settings; the
  // Gallery view keeps its own album-only facet. Both are handled inside
  // syncSidebarFacets() (recipes-ui.js), keyed off NAV.view/activeGen — this
  // just decides whether the sidebar aisle is present at all. Gear/Setup/
  // Notes/Home have no facets, so the sidebar (and its mobile toggle) is
  // hidden outright rather than showing stale recipe chips next to gear specs.
  const sidebarRelevant = NAV.section === 'camera' || NAV.view === 'gallery'
  const sidebar = document.getElementById('sidebar')
  if (sidebar) sidebar.style.display = sidebarRelevant ? '' : 'none'
  const mobFilterBtn = document.getElementById('mob-filter-btn')
  if (mobFilterBtn) mobFilterBtn.style.display = sidebarRelevant ? '' : 'none'
  if (typeof syncSidebarFacets === 'function') syncSidebarFacets()
  if (NAV.section === 'camera' && typeof initChips === 'function') initChips()

  // Visual/Cheatsheet toggle only applies to the recipe grid.
  const viewToggle = document.getElementById('header-view-toggle')
  if (viewToggle) viewToggle.style.display = NAV.view === 'recipes' ? 'flex' : 'none'

  // renderGallery()/layoutGallery() are idempotent past the first build, but
  // the justified-row layout pass must re-run on every entry — the pane has
  // zero width while its .pane lacked '.on', so any layout computed while
  // hidden is wrong.
  if (NAV.view === 'gallery' && typeof layoutGallery === 'function') layoutGallery()

  renderCurrentView()
}

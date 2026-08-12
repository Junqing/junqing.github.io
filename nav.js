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

// Site presentation: Home, page headings, appearance, and scroll restoration.
// Declarations only; index.html calls initSiteUI() after every module has parsed.
// Bump this and index.html's ?v= tags together whenever deployed JS/CSS changes.
const SITE_ASSET_VERSION = 'editorial-5'
const SITE_VIEW_COPY = {
  gallery: { title: 'Collected moments.', description: 'A personal photo journal. Places, people, and the light in between.' },
  gear: { title: 'The tools behind the frame.', description: 'The cameras and lenses in my kit. Different tools, the same curiosity.' },
  setup: { title: 'My camera setup.', description: 'Custom slots, shooting modes, and creative profiles — ready when the light is.' },
  notes: { title: 'Notes from the field.', description: 'Real situations, useful settings, and things to remember for the next shoot.' },
  learn: { title: 'Learn. Try. Repeat.', description: 'Practical field guides and visual experiments. Open a topic and make it your own.' },
  recipes: { title: 'Find your next look.', description: 'Explore film simulations and creative profiles. Filter by feeling, then look at the details.' },
  insights: { title: 'Understand the settings.', description: 'Look beneath a recipe. See the patterns, relationships, and choices that shape a photograph.' },
  explore: { title: 'Build your own look.', description: 'Move a dial, follow your curiosity, and discover the recipes closest to your idea.' },
  compare: { title: 'A closer look, side by side.', description: 'Compare two recipes and see where their settings — and their character — diverge.' },
}
let siteUIReady = false

function siteEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
}

function renderHome() {
  const pane = document.getElementById('pane-home')
  if (!pane) return
  const photos = typeof GALLERY_PHOTOS !== 'undefined' ? GALLERY_PHOTOS : []
  const recent = [...photos].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4)
  const cover = photos.find(photo => photo.w > photo.h) || photos[0]
  const cameraCount = typeof MY_CAMERAS !== 'undefined' ? MY_CAMERAS.length : 0
  const recipeCount = typeof RECIPE_FAMILIES !== 'undefined' ? RECIPE_FAMILIES.reduce((sum, family) => sum + family.count, 0) : 0
  const topicCount = typeof LEARN_TOPICS !== 'undefined' ? LEARN_TOPICS.length : 0
  const frame = cover ? `<img src="${siteEscape(cover.src || cover.thumb)}" alt="Photograph from Jin’s gallery${cover.camera ? ' · ' + siteEscape(cover.camera) : ''}" fetchpriority="high">` : ''
  pane.innerHTML = `
    <section class="site-hero">
      <div class="site-hero-copy">
        <p class="site-eyebrow"><span class="site-status-dot" aria-hidden="true"></span> A personal collection</p>
        <h1>Chasing light.<br><em>Keeping notes.</em></h1>
        <p class="site-hero-bio">Techie by day, hobby photographer and guitarist. This is where I keep the photographs, the camera experiments, and the things I learn along the way.</p>
        <div class="site-hero-actions">
          <a class="site-button site-button-primary" href="#/photography/gallery">Explore the gallery <span aria-hidden="true">↗</span></a>
          <a class="site-text-link" href="#/camera/recipes">Find a recipe <span aria-hidden="true">→</span></a>
        </div>
        <div class="site-hero-footnote"><span class="site-line" aria-hidden="true"></span> Photographs, not perfection.</div>
      </div>
      <figure class="site-cover${cover ? '' : ' image-unavailable'}">
        <a href="#/photography/gallery" aria-label="Open Jin’s photo gallery">${frame}<span class="site-image-fallback">A frame is waiting to be found.</span></a>
        <figcaption><span>From the gallery</span><span>${siteEscape(cover ? cover.camera || '© Jin Qian' : '© Jin Qian')} <span aria-hidden="true">↗</span></span></figcaption>
      </figure>
    </section>

    <section class="site-index" aria-label="Explore the collection">
      <a class="site-index-card" href="#/photography/gallery">
        <div class="site-card-top"><span class="site-eyebrow">01 / Photography</span><span class="site-arrow" aria-hidden="true">↗</span></div>
        <h2>Look a little closer.</h2><p>The photographs, the kit, and the setups behind the frame.</p>
        <div class="site-card-foot">${photos.length} photographs <span>·</span> ${cameraCount} cameras</div>
      </a>
      <a class="site-index-card site-index-green" href="#/camera/recipes">
        <div class="site-card-top"><span class="site-eyebrow">02 / Camera settings</span><span class="site-arrow" aria-hidden="true">↗</span></div>
        <h2>A feeling, in the dials.</h2><p>Find a recipe, explore its character, and make it yours.</p>
        <div class="site-card-foot">${recipeCount} recipes <span>·</span> Fujifilm &amp; OM</div>
      </a>
      <a class="site-index-card" href="#/photography/learn">
        <div class="site-card-top"><span class="site-eyebrow">03 / Field guides</span><span class="site-arrow" aria-hidden="true">↗</span></div>
        <h2>Keep experimenting.</h2><p>Exposure, metering, and creative techniques. Learn by doing.</p>
        <div class="site-card-foot">${topicCount} learning topics <span>·</span> Practical &amp; visual</div>
      </a>
    </section>

    ${recent.length ? `<section class="site-recent">
      <div class="site-section-heading"><div><p class="site-eyebrow">The photo journal</p><h2>A few recent frames.</h2></div><a class="site-text-link" href="#/photography/gallery">View all ${photos.length} <span aria-hidden="true">↗</span></a></div>
      <div class="site-photo-grid">${recent.map(photo => `<a class="site-photo" href="#/photography/gallery" aria-label="Browse the gallery${photo.date ? ', photograph from ' + siteEscape(photo.date) : ''}"><img src="${siteEscape(photo.thumb)}" alt="${siteEscape(typeof photoCaption === 'function' ? photoCaption(photo) || 'Photograph by Jin' : 'Photograph by Jin')}" loading="lazy"><span class="site-photo-caption">${siteEscape(photo.camera || '© Jin Qian')}<span>${siteEscape(photo.date || '')}</span></span></a>`).join('')}</div>
    </section>` : ''}
    <div class="site-home-signoff"><span>Made of photographs and curiosity.</span><span>© Jin Qian</span></div>`
  pane.querySelectorAll('img').forEach(image => {
    image.addEventListener('error', () => image.closest('.site-cover, .site-photo').classList.add('image-unavailable'))
  })
}

function syncSiteShell() {
  const copy = SITE_VIEW_COPY[NAV.view]
  const camera = NAV.section === 'camera'
  const labels = { photography: 'Photography', camera: 'Camera Settings', home: 'Home' }
  const viewNames = { gallery: 'Gallery', gear: 'Gear', setup: 'My Setup', notes: 'Notes', learn: 'Learn', recipes: 'Recipes', insights: 'Insights', explore: 'Explore', compare: 'Compare' }
  document.getElementById('site-page-intro').hidden = !copy
  document.getElementById('site-page-kicker').textContent = labels[NAV.section] + (viewNames[NAV.view] ? ' / ' + viewNames[NAV.view] : '')
  document.getElementById('site-page-title').textContent = copy ? copy.title : ''
  document.getElementById('site-page-description').textContent = copy ? copy.description : ''
  document.getElementById('site-recipe-status').hidden = !camera
  document.getElementById('site-family-row').hidden = !camera
  document.querySelectorAll('.tab[data-section], .tab[data-view], .inner-subtab[data-subview]').forEach(button => {
    const active = button.dataset.section ? button.dataset.section === NAV.section : button.dataset.view ? button.dataset.view === NAV.view : button.dataset.subview === NAV.subview
    if (active) button.setAttribute('aria-current', 'page')
    else button.removeAttribute('aria-current')
  })
  const currentViewButton = NAV.view && document.querySelector('.view-tabs .tab[data-view="' + NAV.view + '"]')
  if (currentViewButton) currentViewButton.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  const title = viewNames[NAV.view] || 'Home'
  document.title = 'Jin — ' + title + ' · Photography & Field Notes'
}

function setSiteTheme(theme) {
  const dark = theme === 'dark'
  document.body.dataset.siteTheme = dark ? 'dark' : 'light'
  const button = document.getElementById('site-theme')
  button.setAttribute('aria-pressed', String(dark))
  button.setAttribute('aria-label', dark ? 'Switch to light appearance' : 'Switch to dark appearance')
  document.getElementById('site-theme-color').content = dark ? '#142321' : '#f5f3ec'
  try { localStorage.setItem('jin-site-theme', dark ? 'dark' : 'light') } catch (_) { /* private browsing may deny storage */ }
}

// Routing remains owned by nav.js; these hooks only save/restore presentation.
let siteLastRoute = null
const siteScrollPositions = new Map()
function siteRouteKey() {
  return [NAV.section, NAV.view, NAV.subview, NAV.section === 'camera' ? NAV.family : ''].join('/')
}
function prepareSiteNavigation() {
  const scroll = document.getElementById('site-content')
  const key = siteRouteKey()
  if (key !== siteLastRoute && siteLastRoute) siteScrollPositions.set(siteLastRoute, scroll.scrollTop)
  document.body.dataset.siteSection = NAV.section
}
function restoreSiteScroll() {
  const key = siteRouteKey()
  if (key !== siteLastRoute) document.getElementById('site-content').scrollTop = siteScrollPositions.get(key) || 0
  siteLastRoute = key
}

function initSiteUI() {
  if (siteUIReady) return
  siteUIReady = true
  let theme = 'light'
  // Keep an appearance chosen during the design preview without requiring it.
  try { theme = localStorage.getItem('jin-site-theme') || localStorage.getItem('jin-refreshed-theme') || 'light' } catch (_) { /* storage is optional */ }
  setSiteTheme(theme)
  document.getElementById('site-theme').addEventListener('click', () => setSiteTheme(document.body.dataset.siteTheme === 'dark' ? 'light' : 'dark'))
  document.querySelector('.site-skip').addEventListener('click', event => {
    event.preventDefault()
    document.getElementById('site-content').focus()
  })
  document.getElementById('q').setAttribute('aria-label', 'Search recipes')
  document.getElementById('gen-select').setAttribute('aria-label', 'Recipe family')
  document.getElementById('vtog-visual').setAttribute('aria-label', 'Visual recipe cards')
  document.getElementById('vtog-cheatsheet').setAttribute('aria-label', 'Recipe cheatsheet')
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return
    document.getElementById('stats-expanded').classList.remove('open')
    document.getElementById('stats-pill').setAttribute('aria-expanded', 'false')
    if (typeof closeMobileSidebar === 'function') closeMobileSidebar()
  })
}

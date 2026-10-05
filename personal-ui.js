// Photography realm: gallery, gear, custom setup, scenario notes, learning topics.
// Parse-time rule: nothing here may touch another module's globals at parse
// time — only inside function bodies.

// ══════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════
let galleryBuilt = false
let galleryAlbumFilter = new Set()

function galleryPhotos() {
  const all = (typeof GALLERY_PHOTOS !== 'undefined') ? GALLERY_PHOTOS : []
  if (!galleryAlbumFilter.size) return all
  return all.filter(p => galleryAlbumFilter.has(p.album))
}

function photoCaption(p) {
  return [p.camera, p.lens, p.aperture, p.shutter, p.iso && ('ISO ' + p.iso)]
    .filter(Boolean).join(' · ')
}

// Photos cannot go through openRecipeModal() — that looks up a recipe by name
// and builds a recipe card. This reuses the same modal shell only.
let photoModalPhotos = []
let photoModalIndex = -1

function renderPhotoModal() {
  const p = photoModalPhotos[photoModalIndex]
  if (!p) return

  const modal = $('recipe-modal')
  const body  = $('rmodal-body')
  body.innerHTML = ''

  const stage = document.createElement('div')
  stage.className = 'gal-photo-stage'
  const img = document.createElement('img')
  img.className = 'gal-photo'
  img.src = p.src
  img.alt = photoCaption(p) || 'Photograph'
  if (p.w && p.h) img.style.aspectRatio = p.w + ' / ' + p.h
  stage.appendChild(img)

  if (photoModalPhotos.length > 1) {
    ;[['prev', 'Previous photo', -1, '‹'], ['next', 'Next photo', 1, '›']].forEach(([side, label, delta, glyph]) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'gal-nav gal-nav-' + side
      button.setAttribute('aria-label', label)
      button.textContent = glyph
      button.addEventListener('click', () => navigatePhotoModal(delta))
      stage.appendChild(button)
    })
  }

  const meta = document.createElement('div')
  meta.className = 'gal-meta'
  meta.textContent = [photoCaption(p), (photoModalIndex + 1) + ' / ' + photoModalPhotos.length]
    .filter(Boolean).join(' · ')
  body.appendChild(stage)
  body.appendChild(meta)
  modal.classList.add('photo-open', 'open')
  modal.setAttribute('aria-label', 'Photo viewer')
  modal.scrollTop = 0
  layoutPhotoModal()
  img.addEventListener('load', layoutPhotoModal)
}

// Fit to BOTH viewport bounds while keeping the original composition. This
// applies to photos only; recipe dialogs keep their independent reading width.
function fitPhotoToBox(width, height, maxWidth, maxHeight) {
  if (![width, height, maxWidth, maxHeight].every(value => Number.isFinite(value) && value > 0)) return null
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return { width: width * scale, height: height * scale }
}

function layoutPhotoModal() {
  const modal = $('recipe-modal')
  if (!modal || !modal.classList.contains('photo-open') || !modal.classList.contains('open')) return
  const stage = modal.querySelector('.gal-photo-stage')
  const image = modal.querySelector('.gal-photo')
  const caption = modal.querySelector('.gal-meta')
  if (!stage || !image || !caption) return
  const viewport = window.visualViewport
  // Do not resize the photo to cancel a user's native pinch zoom.
  if (viewport && Math.abs(viewport.scale - 1) > 0.01) return
  const viewportWidth = Math.min(window.innerWidth, viewport ? viewport.width : window.innerWidth)
  const viewportHeight = Math.min(window.innerHeight, viewport ? viewport.height : window.innerHeight)
  const style = window.getComputedStyle(modal)
  const paddingX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
  const paddingY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
  const maxWidth = Math.max(1, Math.min(stage.clientWidth || viewportWidth, viewportWidth - paddingX))
  // Caption width is independent of portrait width: long metadata must not
  // shrink a portrait repeatedly by wrapping to more and more lines.
  const maxHeight = Math.max(1, viewportHeight - paddingY - caption.getBoundingClientRect().height)
  const photo = photoModalPhotos[photoModalIndex] || {}
  let width = Number(photo.w), height = Number(photo.h)
  if (![width, height].every(value => Number.isFinite(value) && value > 0)) {
    width = image.naturalWidth || 3
    height = image.naturalHeight || 2
  }
  const size = fitPhotoToBox(width, height, maxWidth, maxHeight)
  if (!size) return
  image.style.width = size.width + 'px'
  image.style.height = size.height + 'px'
  stage.style.height = size.height + 'px'
}

let galleryViewerReady = false
function initGalleryViewer() {
  if (galleryViewerReady) return
  galleryViewerReady = true
  let resizeFrame = null
  const resize = () => {
    if (resizeFrame != null) cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => { resizeFrame = null; layoutPhotoModal() })
  }
  window.addEventListener('resize', resize)
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize)
}

function navigatePhotoModal(delta) {
  if (photoModalPhotos.length < 2) return
  photoModalIndex = (photoModalIndex + delta + photoModalPhotos.length) % photoModalPhotos.length
  renderPhotoModal()
}

function openPhotoModal(p) {
  photoModalPhotos = galleryPhotos()
  photoModalIndex = photoModalPhotos.indexOf(p)
  if (photoModalIndex < 0) return
  renderPhotoModal()
}

function renderGalleryGrid() {
  const grid = $('gal-grid')
  if (!grid) return
  grid.innerHTML = ''
  const photos = galleryPhotos()
  const countEl = $('gal-count')
  if (countEl) countEl.textContent = photos.length + ' photo' + (photos.length === 1 ? '' : 's')

  photos.forEach(p => {
    const cell = document.createElement('div')
    cell.className = 'gal-item'
    cell.dataset.ar = (p.w && p.h) ? (p.w / p.h) : 1.5
    const img = document.createElement('img')
    img.loading = 'lazy'
    img.alt = photoCaption(p) || 'Photograph'
    img.src = p.thumb
    img.addEventListener('load', () => img.classList.add('loaded'))
    img.addEventListener('error', () => {
      // Keep the cell's computed size — clearing it would collapse the row and
      // reflow every neighbour. Just show the placeholder in place.
      cell.classList.add('dead')
      cell.textContent = 'unavailable'
    })
    cell.appendChild(img)
    cell.addEventListener('click', () => {
      if (!cell.classList.contains('dead')) openPhotoModal(p)
    })
    grid.appendChild(cell)
  })
  layoutGallery()
}

const GAL_GAP = 10
const GAL_TARGET_H = 200   // desktop row height before justification
const GAL_PHONE_BP = 680   // below this, one photo per row

// Justified rows, Flickr-style: each row is scaled so its widths sum to exactly
// the container width. The final short row keeps the target height instead of
// stretching — 1-2 leftover photos blown up full width look absurd.
//
// On phones every photo gets its own full-width row. Scaling by a target
// height instead would pack 2-3 portraits side by side (they are narrow), and
// a 118px-wide photo is not worth looking at.
function layoutGallery() {
  const grid = $('gal-grid')
  if (!grid) return
  const cells = [...grid.children]
  if (!cells.length) return

  const containerW = grid.clientWidth
  // A hidden pane has zero width; laying out now would size every cell to 0.
  // applyNav() calls us again on entry, so bail rather than poison the DOM.
  if (containerW <= 0) return

  // Widths are floored to whole pixels, so a justified row hands the remainder
  // to its final cell — otherwise rows land a few px short and the right edge
  // goes ragged. `justify` is false for the trailing short row, which keeps its
  // natural widths and stops early instead of stretching to fill.
  const apply = (row, h, justify) => {
    h = Math.floor(h)
    let used = 0
    row.forEach((c, i) => {
      const last = i === row.length - 1
      const w = (justify && last) ? containerW - used - GAL_GAP * (row.length - 1)
                                  : Math.floor(parseFloat(c.dataset.ar) * h)
      used += w
      c.style.width  = w + 'px'
      c.style.height = h + 'px'
    })
  }

  if (window.innerWidth <= GAL_PHONE_BP) {
    cells.forEach(c => {
      c.style.width  = containerW + 'px'
      c.style.height = Math.round(containerW / parseFloat(c.dataset.ar)) + 'px'
    })
    return
  }

  let row = [], sumAr = 0
  cells.forEach(cell => {
    row.push(cell)
    sumAr += parseFloat(cell.dataset.ar)
    if (sumAr * GAL_TARGET_H + GAL_GAP * (row.length - 1) >= containerW) {
      apply(row, (containerW - GAL_GAP * (row.length - 1)) / sumAr, true)
      row = []; sumAr = 0
    }
  })
  if (row.length) apply(row, GAL_TARGET_H, false)
}

let galResizeT = null

function renderGallery() {
  if (galleryBuilt) return
  galleryBuilt = true
  const container = $('gallery-body')
  container.innerHTML = ''

  const photos = (typeof GALLERY_PHOTOS !== 'undefined') ? GALLERY_PHOTOS : []
  if (!photos.length) {
    container.innerHTML = '<div class="empty"><div class="big">🖼️</div>' +
      '<p>No gallery data yet. Run <strong>python3 tools/build_gallery.py</strong> ' +
      'or use Pi\'s <strong>/skill:gallery</strong> workflow to add a Lightroom album.</p></div>'
    return
  }

  const wrap = document.createElement('div')
  wrap.innerHTML = '<div class="gal-count" id="gal-count"></div>' +
                   '<div class="gal-grid" id="gal-grid"></div>' +
                   '<div class="gal-credit">© Jin Qian</div>'
  container.appendChild(wrap)
  renderGalleryGrid()
  buildAlbumChips()
}

function buildAlbumChips() {
  const el = $('f-album')
  if (!el) return
  el.innerHTML = ''
  const albums = (typeof GALLERY_ALBUMS !== 'undefined') ? GALLERY_ALBUMS : []
  albums.forEach(a => {
    const c = document.createElement('div')
    c.className = 'chip'
    c.textContent = a.label + ' (' + a.count + ')'
    c.addEventListener('click', () => {
      galleryAlbumFilter.has(a.id) ? galleryAlbumFilter.delete(a.id)
                                   : galleryAlbumFilter.add(a.id)
      c.classList.toggle('on')
      renderGalleryGrid()
    })
    el.appendChild(c)
  })
}

// ══════════════════════════════════════════
// MY GEAR
// ══════════════════════════════════════════
let gearBuilt = false
function renderGear() {
  if (gearBuilt) return
  gearBuilt = true
  const container = $('gear-body')
  container.innerHTML = ''

  // Guard: gear.js not loaded or empty
  const cameras = (typeof MY_CAMERAS !== 'undefined') ? MY_CAMERAS : []
  const lenses  = (typeof MY_LENSES  !== 'undefined') ? MY_LENSES  : []

  if (!cameras.length && !lenses.length) {
    container.innerHTML = '<div class="empty"><div class="big">📷</div><p>No gear data yet. Edit <strong>gear.js</strong> on GitHub to add your cameras and lenses.</p></div>'
    return
  }

  function makeSection(title, items, iconDefault, renderCard) {
    const sec = document.createElement('div')
    const titleEl = document.createElement('div')
    titleEl.className = 'sg-section-title'
    titleEl.textContent = title
    sec.appendChild(titleEl)
    const cards = document.createElement('div')
    cards.className = 'gear-cards'
    items.forEach(item => cards.appendChild(renderCard(item, iconDefault)))
    sec.appendChild(cards)
    return sec
  }

  function makeGearCard(item, iconDefault) {
    const card = document.createElement('div')
    card.className = 'gear-card'
    if (item.image) {
      const img = document.createElement('img')
      img.className = 'gear-img'
      img.src = item.image
      img.alt = item.name
      card.appendChild(img)
      if (item.image_credit) {
        const credit = document.createElement('div')
        credit.className = 'gear-img-credit'
        credit.textContent = item.image_credit
        card.appendChild(credit)
      }
    }
    const head = document.createElement('div')
    head.className = 'gear-card-head'
    const iconEl = document.createElement('div')
    iconEl.className = 'gear-icon'
    iconEl.textContent = item.icon || iconDefault
    const info = document.createElement('div')
    info.innerHTML = `<div class="gear-name">${item.name}</div><div class="gear-sub">${item.subtitle || ''}</div>`
    head.appendChild(iconEl)
    head.appendChild(info)
    card.appendChild(head)

    const body = document.createElement('div')
    body.className = 'gear-body'
    // Build spec table from item.specs (array of [label, value] pairs)
    const specs = item.specs || []
    if (specs.length) {
      const tbl = document.createElement('table')
      tbl.className = 'stbl'
      specs.forEach(([lbl, val]) => {
        const tr = document.createElement('tr')
        tr.innerHTML = `<td>${lbl}</td><td>${val}</td>`
        tbl.appendChild(tr)
      })
      body.appendChild(tbl)
    }
    if (item.notes) {
      const notesEl = document.createElement('div')
      notesEl.className = 'gear-notes'
      notesEl.textContent = item.notes
      body.appendChild(notesEl)
    }
    card.appendChild(body)
    return card
  }

  function makeLensSection(items) {
    const sec = document.createElement('div')
    const titleEl = document.createElement('div')
    titleEl.className = 'sg-section-title'
    titleEl.textContent = 'Lenses'
    sec.appendChild(titleEl)

    const mounts = [
      { key: 'X',   label: 'X-mount' },
      { key: 'M43', label: 'M43' },
    ].filter(m => items.some(l => l.mount === m.key))

    const tabBar = document.createElement('div')
    tabBar.className = 'gear-mount-tabs'
    const cards = document.createElement('div')
    cards.className = 'gear-cards'

    function showMount(key) {
      tabBar.querySelectorAll('.gear-mount-tab').forEach(t => t.classList.toggle('active', t.dataset.mount === key))
      cards.innerHTML = ''
      items.filter(l => l.mount === key).forEach(item => cards.appendChild(makeGearCard(item, '🔭')))
    }

    mounts.forEach(m => {
      const tab = document.createElement('button')
      tab.className = 'gear-mount-tab'
      tab.dataset.mount = m.key
      tab.textContent = m.label
      tab.addEventListener('click', () => showMount(m.key))
      tabBar.appendChild(tab)
    })

    sec.appendChild(tabBar)
    sec.appendChild(cards)
    if (mounts.length) showMount(mounts[0].key)
    return sec
  }

  if (cameras.length) container.appendChild(makeSection('Cameras', cameras, '📷', makeGearCard))
  if (lenses.length)  container.appendChild(makeLensSection(lenses))
}

// ══════════════════════════════════════════
// CUSTOM SLOTS
// ══════════════════════════════════════════
// X-T50 C slots belong to X-Trans V, not the current Camera Settings pool.
function customSlotRecipe(name) {
  const pool = typeof RECIPE_POOLS !== 'undefined' ? RECIPE_POOLS.V || [] : typeof RECIPES_V !== 'undefined' ? RECIPES_V : []
  return pool.find(recipe => recipe.name === name) || null
}

let activeCustomSlot = null
function renderCustomSlots() {
  const wrap = $('custom-slots-body')
  if (!wrap) return
  const slots = (typeof MY_CUSTOM_SLOTS !== 'undefined') ? MY_CUSTOM_SLOTS : []
  if (!slots.length) return
  if (!slots.some(slot => slot.slot === activeCustomSlot)) activeCustomSlot = slots[0].slot

  const tabBar   = document.createElement('div')
  tabBar.className = 'cs-subtabs'
  const paneWrap = document.createElement('div')

  slots.forEach((slot, idx) => {
    // ── tab button
    const tab = document.createElement('button')
    tab.className = 'cs-subtab' + (slot.slot === activeCustomSlot ? ' active' : '')
    tab.innerHTML = `<span class="cs-subtab-slot">${slot.slot}</span><span class="cs-subtab-name">${slot.name}</span>`
    tab.addEventListener('click', () => {
      activeCustomSlot = slot.slot
      tabBar.querySelectorAll('.cs-subtab').forEach(t => t.classList.remove('active'))
      paneWrap.querySelectorAll('.cs-slot-pane').forEach(p => p.classList.remove('active'))
      tab.classList.add('active')
      paneWrap.querySelectorAll('.cs-slot-pane')[idx].classList.add('active')
    })
    tabBar.appendChild(tab)

    // ── pane
    const pane = document.createElement('div')
    pane.className = 'cs-slot-pane cs-card' + (slot.slot === activeCustomSlot ? ' active' : '')

    // head
    const head = document.createElement('div')
    head.className = 'cs-head'
    const badge = document.createElement('span')
    badge.className = 'cs-slot'
    badge.textContent = slot.slot
    head.appendChild(badge)
    const nameEl = document.createElement('span')
    nameEl.className = 'cs-name'
    nameEl.textContent = slot.name
    head.appendChild(nameEl)
    if (slot.camera && slot.camera !== 'both') {
      const cam = document.createElement('span')
      cam.className = 'cs-cam'
      cam.textContent = slot.camera
      head.appendChild(cam)
    }
    if (slot.source_url) {
      const lnk = document.createElement('a')
      lnk.className = 'cs-link'
      lnk.href = slot.source_url
      lnk.target = '_blank'
      lnk.textContent = 'FujiXWeekly ↗'
      head.appendChild(lnk)
    }
    pane.appendChild(head)

    const body = document.createElement('div')
    body.className = 'cs-body'

    // ── usage bar
    if (slot.usage) {
      const u = document.createElement('div')
      u.className = 'cs-usage-bar'
      u.innerHTML = `<strong>When to use</strong>${slot.usage}`
      body.appendChild(u)
    }

    // ── description
    if (slot.description) {
      const desc = document.createElement('div')
      desc.className = 'cs-desc'
      desc.textContent = slot.description
      body.appendChild(desc)
    }

    // ── pros & cons
    if ((slot.pros && slot.pros.length) || (slot.cons && slot.cons.length)) {
      const pcWrap = document.createElement('div')
      pcWrap.className = 'cs-pc-wrap'
      if (slot.pros && slot.pros.length) {
        const col = document.createElement('div')
        col.className = 'cs-pc-col cs-pros'
        col.innerHTML = '<div class="cs-pc-label cs-pc-label-pros">Pros</div>'
        const ul = document.createElement('ul')
        ul.className = 'cs-pc-list'
        slot.pros.forEach(p => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li) })
        col.appendChild(ul)
        pcWrap.appendChild(col)
      }
      if (slot.cons && slot.cons.length) {
        const col = document.createElement('div')
        col.className = 'cs-pc-col cs-cons'
        col.innerHTML = '<div class="cs-pc-label cs-pc-label-cons">Cons</div>'
        const ul = document.createElement('ul')
        ul.className = 'cs-pc-list'
        slot.cons.forEach(c => { const li = document.createElement('li'); li.textContent = c; ul.appendChild(li) })
        col.appendChild(ul)
        pcWrap.appendChild(col)
      }
      body.appendChild(pcWrap)
    }

    // ── settings / simulations
    if (slot.type === 'multi') {
      const bl = document.createElement('div')
      bl.className = 'cs-sublabel'
      bl.textContent = 'Base Settings'
      body.appendChild(bl)

      // Derive a representative recipe from the first sim that has one
      const baseSimRecipe = (slot.simulations || []).map(s => s.recipe_name ? customSlotRecipe(s.recipe_name) : null).find(Boolean) || null

      if (baseSimRecipe && typeof buildFujiVisual === 'function') {
        const visual = document.createElement('div')
        visual.className = 'cs-recipe-visual'
        visual.innerHTML = buildFujiVisual(baseSimRecipe)
        body.appendChild(visual)
        // Extra params as pills
        const extraRows = [
          ['Grain', baseSimRecipe.grain_effect],
          ['Sharpness', baseSimRecipe.sharpness != null ? (baseSimRecipe.sharpness > 0 ? '+' : '') + baseSimRecipe.sharpness : null],
          ['Clarity',   baseSimRecipe.clarity   != null ? (baseSimRecipe.clarity   > 0 ? '+' : '') + baseSimRecipe.clarity   : null],
          ['ISO Max', baseSimRecipe.iso_max ? 'Auto up to ' + baseSimRecipe.iso_max : null],
          ['Exposure', baseSimRecipe.exposure_compensation],
        ].filter(([, v]) => v != null && v !== '' && v !== 'N/A')
        if (extraRows.length) {
          const extraPills = document.createElement('div')
          extraPills.className = 'cs-pills'
          extraRows.forEach(([lbl, val]) => {
            const sp = document.createElement('span')
            sp.className = 'cs-pill'
            sp.innerHTML = `<strong>${lbl}</strong> ${val}`
            extraPills.appendChild(sp)
          })
          body.appendChild(extraPills)
        }
      } else {
        const pills = document.createElement('div')
        pills.className = 'cs-pills'
        slot.base_settings.forEach(([lbl, val]) => {
          const p = document.createElement('span')
          p.className = 'cs-pill'
          p.innerHTML = `<strong>${lbl}</strong> ${val}`
          pills.appendChild(p)
        })
        body.appendChild(pills)
      }

      const sl = document.createElement('div')
      sl.className = 'cs-sublabel'
      sl.textContent = 'Simulations — rotate film dial or change in menu'
      body.appendChild(sl)
      const simGrid = document.createElement('div')
      simGrid.className = 'cs-sim-grid'
      slot.simulations.forEach(sim => {
        const item = document.createElement('div')
        item.className = 'cs-sim-item'
        item.innerHTML = `<div class="cs-sim-fs">${sim.film_sim}</div><div class="cs-sim-label">${sim.label}</div><div class="cs-sim-char">${sim.character}</div>`
        if (sim.recipe_name) {
          item.style.cursor = 'pointer'
          item.title = 'View recipe details'
          const hint = document.createElement('div')
          hint.style.cssText = 'font-size:10px;color:var(--accent);margin-top:5px'
          hint.textContent = 'View recipe →'
          item.appendChild(hint)
          item.addEventListener('click', () => openRecipeModal(sim.recipe_name, 'V'))
        }
        simGrid.appendChild(item)
      })
      body.appendChild(simGrid)
    } else {
      // Radar + DR/WB for single-type slot
      const slotRecipe = slot.recipe_name ? customSlotRecipe(slot.recipe_name) : null
      if (slotRecipe && typeof buildFujiVisual === 'function') {
        const visual = document.createElement('div')
        visual.className = 'cs-recipe-visual'
        visual.innerHTML = buildFujiVisual(slotRecipe)
        body.appendChild(visual)

        // Remaining recipe params as compact pills
        const extraRows = [
          ['Film Sim', slotRecipe.film_simulation],
          ['Grain', slotRecipe.grain_effect],
          ['Sharpness', slotRecipe.sharpness != null ? (slotRecipe.sharpness > 0 ? '+' : '') + slotRecipe.sharpness : null],
          ['Clarity',   slotRecipe.clarity   != null ? (slotRecipe.clarity   > 0 ? '+' : '') + slotRecipe.clarity   : null],
          ['ISO Max', slotRecipe.iso_max ? 'Auto up to ' + slotRecipe.iso_max : null],
          ['Exposure', slotRecipe.exposure_compensation],
        ].filter(([, v]) => v != null && v !== '' && v !== 'N/A')
        if (extraRows.length) {
          const extraPills = document.createElement('div')
          extraPills.className = 'cs-pills'
          extraRows.forEach(([lbl, val]) => {
            const sp = document.createElement('span')
            sp.className = 'cs-pill'
            sp.innerHTML = `<strong>${lbl}</strong> ${val}`
            extraPills.appendChild(sp)
          })
          body.appendChild(extraPills)
        }
      } else if (slot.settings) {
        // Fallback to table if recipe not found
        const tbl = document.createElement('table')
        tbl.className = 'stbl'
        slot.settings.forEach(([lbl, val]) => {
          const tr = document.createElement('tr')
          tr.innerHTML = `<td>${lbl}</td><td>${val}</td>`
          tbl.appendChild(tr)
        })
        body.appendChild(tbl)
      }
      if (slot.recipe_name) {
        const btn = document.createElement('button')
        btn.style.cssText = 'margin-top:10px;font-size:11px;color:var(--accent);background:none;border:1px solid var(--accent);border-radius:var(--r);padding:4px 10px;cursor:pointer;display:block'
        btn.textContent = 'View recipe details →'
        btn.addEventListener('click', () => openRecipeModal(slot.recipe_name, 'V'))
        body.appendChild(btn)
      }
      if (slot.filter_variants) {
        const fl = document.createElement('div')
        fl.className = 'cs-sublabel'
        fl.style.marginTop = '12px'
        fl.textContent = 'Acros Filter Guide — which to choose'
        body.appendChild(fl)
        const tbl = document.createElement('table')
        tbl.className = 'cs-filter-tbl'
        tbl.innerHTML = '<tr><th>Filter</th><th>Effect</th><th>Best For</th></tr>'
        slot.filter_variants.forEach(fv => {
          const tr = document.createElement('tr')
          if (fv.active) tr.className = 'cs-filter-active'
          tr.innerHTML = `<td>${fv.filter}</td><td>${fv.summary}</td><td>${fv.best_for}</td>`
          tbl.appendChild(tr)
        })
        body.appendChild(tbl)
      }
    }

    pane.appendChild(body)
    paneWrap.appendChild(pane)
  })

  wrap.appendChild(tabBar)
  wrap.appendChild(paneWrap)
}

// ══════════════════════════════════════════
// MY RECIPES
// ══════════════════════════════════════════
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
  const setup = typeof MY_CUSTOM_SETUPS !== 'undefined' ? MY_CUSTOM_SETUPS[camName] : null
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
  if (setup.type === 'fuji-scenarios') {
    renderFujiScenarioSetup(pane, setup)
    return
  }
  if (setup.type === 'om-dial') {
    pane.innerHTML = `
      <div class="pfm-consistency">${setup.intro || '<strong>Global Consistency:</strong> Use Auto WB as the default. Keep Warm Color: Off. Avoid storing radically different WB shifts inside individual C modes unless intentional. Shoot RAW+JPEG while refining profiles. The goal is that COLOR 1 always looks like COLOR 1 regardless of whether you are currently using C1, C2, C3 or C4.'}</div>
      ${setup.instructions ? `<details class="setup-guide"><summary>How to save and recall this setup</summary><ol>${setup.instructions.map(s => `<li>${s}</li>`).join('')}</ol>${setup.source_url ? `<a href="${setup.source_url}" target="_blank" rel="noopener noreferrer">${setup.source_label || 'Camera manual'} ↗</a>` : ''}</details>` : ''}
      <div class="sec-title">Shooting Modes</div>
      <div class="pfm-grid" id="setup-modes-grid"></div>
      <div class="sec-title">Color Profiles</div>
      <div class="pfm-grid" id="setup-color-grid"></div>
      <div class="sec-title">Mono Profiles</div>
      <div class="pfm-grid" id="setup-mono-grid"></div>`
    const modesGrid = $('setup-modes-grid')
    setup.modes.forEach(mode => modesGrid.appendChild(makeSetupModeCard(mode)))
    const colorGrid = $('setup-color-grid')
    setup.colorProfiles.forEach(p => {
      const card = document.createElement('div')
      card.className = 'pfm-card'
      card.innerHTML = `
        <div class="pfm-head"><span class="pfm-slot">${p.id}</span><span class="pfm-name">${p.name}</span></div>
        <div class="pfm-role">${p.role}</div>
        ${buildOmVisual(p)}
        <ul class="pfm-list">${p.best_for.map(b=>`<li>${b}</li>`).join('')}</ul>
        <ul class="pfm-list">${p.character.map(c=>`<li>${c}</li>`).join('')}</ul>
        <ul class="pfm-list">${p.good_combos.map(c=>`<li>${c}</li>`).join('')}</ul>
        <div class="pfm-shortcut">${p.shortcut}</div>`
      colorGrid.appendChild(card)
    })
    const monoGrid = $('setup-mono-grid')
    setup.monoProfiles.forEach(p => {
      const monoSettings = [
        ['Base profile', p.monochrome_profile], ['Color filter', p.monochrome_color],
        ['Filter strength', p.monochrome_color_strength], ['Film grain', p.film_grain],
        ['Vignetting', p.monochrome_vignetting],
      ].filter(([, value]) => value != null)
      const card = document.createElement('div')
      card.className = 'pfm-card'
      card.innerHTML = `
        <div class="pfm-head"><span class="pfm-slot">${p.id}</span><span class="pfm-name">${p.name}</span></div>
        <div class="pfm-role">${p.role}</div>
        ${buildOmVisual(p)}
        <ul class="pfm-list">${p.best_for.map(b=>`<li>${b}</li>`).join('')}</ul>
        <ul class="pfm-list">${p.character.map(c=>`<li>${c}</li>`).join('')}</ul>
        <ul class="pfm-list">${p.good_combos.map(c=>`<li>${c}</li>`).join('')}</ul>
        <table class="stbl"><tbody>${monoSettings.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table>
        <div class="pfm-shortcut">${p.shortcut}</div>`
      monoGrid.appendChild(card)
    })
    return
  }
}

// Personal shooting-mode cards share layout, not Fuji/OM recipe schemas.
function makeSetupModeCard(mode, open = false) {
  const manual = mode.manual_settings
  const card = document.createElement(manual ? 'details' : 'div')
  card.className = 'pfm-card' + (manual ? ' setup-scenario-bank' : '')
  card.dataset.setupSlot = mode.slot
  if (manual) card.open = open
  const rows = settings => settings.map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')
  const heading = `<div class="pfm-head"><span class="pfm-slot">${mode.slot}</span><span class="pfm-name">${mode.name}</span></div>`
  const content = `
    <ul class="pfm-list">${mode.purpose.map(text => `<li>${text}</li>`).join('')}</ul>
    ${manual ? `<h4 class="setup-card-label">Physical controls — set by hand</h4><table class="stbl setup-manual-settings"><tbody>${rows(manual)}</tbody></table><h4 class="setup-card-label">Menu settings — save / verify in this C bank</h4>` : ''}
    <table class="stbl"><tbody>${rows(mode.settings)}</tbody></table>
    <ul class="pfm-list">${mode.why.map(text => `<li>${text}</li>`).join('')}</ul>
    <div class="pfm-shortcut">${mode.shortcut}</div>`
  card.innerHTML = manual ? `<summary>${heading}<span class="setup-bank-hint">${mode.shortcut}</span></summary><div class="setup-bank-body">${content}</div>` : heading + content
  return card
}

function renderFujiScenarioSetup(pane, setup) {
  pane.innerHTML = `
    <div class="pfm-consistency">${setup.intro}</div>
    <div class="learn-callout setup-control-note"><strong>What a C bank does not automate:</strong> ${setup.control_note}</div>
    <div class="setup-workflow" aria-label="X-E5 shooting workflow">
      <span><strong>1. C1–C7</strong>Choose the scenario</span><span aria-hidden="true">→</span>
      <span><strong>2. Physical controls</strong>Set shutter, aperture, S/C/M</span><span aria-hidden="true">→</span>
      <span><strong>3. FS1–FS3</strong>Choose the look · FS RECIPE ON</span>
    </div>
    <details class="setup-guide"><summary>Program the X-E5: baseline, Auto ISO, and recall checks</summary>
      <h4 class="setup-card-label">Shared baseline</h4>
      <table class="stbl"><tbody>${setup.baseline.map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')}</tbody></table>
      <h4 class="setup-card-label">Auto ISO profiles</h4>
      <div class="setup-iso-profiles">${setup.autoIso.map(profile => `<div><strong>${profile.id} · ${profile.name}</strong><p>Base ${profile.base} · Max ${profile.ceiling} · Minimum shutter preference ${profile.min_shutter}</p></div>`).join('')}</div>
      <p>${setup.auto_iso_note}</p>
      <ol>${setup.instructions.map(text => `<li>${text}</li>`).join('')}</ol>
      <div class="learn-sources">${setup.sources.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</div>
    </details>
    <div class="setup-jump-links"><button type="button" data-setup-jump="setup-modes-section">C1–C7 Scenarios ↓</button><button type="button" data-setup-jump="setup-fs-section">FS1–FS3 Recipes ↓</button></div>
    <section id="setup-modes-section"><div class="sec-title">C1–C7 · Scenario Banks</div>
      <p class="sec-desc">Expand a bank to see the physical controls and the menu settings separately. These are suggested starting points; confirm the available save/recall options in EDIT/CHECK.</p>
      <div class="pfm-grid" id="setup-modes-grid"></div>
    </section>
    <section id="setup-fs-section"><div class="sec-title">FS1–FS3 · Recipe Dial</div>
      <p class="sec-desc">Store the image-quality controls with FS RECIPE enabled. ISO selection, exposure compensation and physical focus/exposure controls are separate shooting decisions, not automatic FS recalls.</p>
      <div class="pfm-grid setup-fs-grid" id="setup-fs-grid"></div>
    </section>`
  const modes = pane.querySelector('#setup-modes-grid')
  setup.modes.forEach((mode, index) => modes.appendChild(makeSetupModeCard(mode, index === 0)))
  const recipes = pane.querySelector('#setup-fs-grid')
  setup.filmSlots.forEach(slot => {
    const recipe = customSlotRecipe(slot.recipe_name)
    const card = document.createElement('article')
    card.className = 'pfm-card setup-fs-card'
    card.dataset.fsSlot = slot.id
    if (!recipe || typeof fujiImageQualitySettings !== 'function') {
      card.innerHTML = `<div class="pfm-head"><span class="pfm-slot">${slot.id}</span><span class="pfm-name">${slot.recipe_name}</span></div><p>Recipe data is unavailable. Reload the page to load the X-Trans V settings.</p>`
      recipes.appendChild(card)
      return
    }
    const settings = [...fujiImageQualitySettings(recipe), ...(slot.image_quality_extras || [])]
    const display = value => typeof value === 'number' && value > 0 ? '+' + value : value
    card.innerHTML = `
      <div class="pfm-head"><span class="pfm-slot">${slot.id}</span><span class="pfm-name">${recipe.name}</span></div>
      <div class="pfm-role">${slot.role}</div>
      ${typeof buildFujiVisual === 'function' ? buildFujiVisual(recipe) : ''}
      <h4 class="setup-card-label">Image-quality settings for this FS position</h4>
      <table class="stbl setup-fs-quality"><tbody>${settings.map(([key, value]) => `<tr><td>${key}</td><td>${display(value)}</td></tr>`).join('')}</tbody></table>
      <div class="setup-recipe-guidance"><strong>Outside FS memory — ISO &amp; exposure</strong><p>${slot.iso_guidance}</p><p>${slot.exposure_guidance}</p></div>
      <ul class="pfm-list">${slot.best_for.map(text => `<li>${text}</li>`).join('')}</ul>
      <ul class="pfm-list">${slot.notes.map(text => `<li>${text}</li>`).join('')}</ul>
      <div class="setup-fs-actions"><button type="button">View recipe details →</button><a href="${recipe.source_url}" target="_blank" rel="noopener noreferrer">Recipe source ↗</a>${slot.extra_source_url ? `<a href="${slot.extra_source_url}" target="_blank" rel="noopener noreferrer">X-Trans V note ↗</a>` : ''}</div>`
    card.querySelector('button').addEventListener('click', () => openRecipeModal(slot.recipe_name, 'V'))
    recipes.appendChild(card)
  })
  pane.querySelectorAll('[data-setup-jump]').forEach(button => button.addEventListener('click', () => {
    pane.querySelector('#' + button.dataset.setupJump).scrollIntoView({ block: 'start' })
  }))
}

let scenariosBuilt = false
function renderScenarios() {
  if (scenariosBuilt) return
  scenariosBuilt = true
  const container = $('scenarios-body')
  const list = (typeof MY_SCENARIOS !== 'undefined') ? MY_SCENARIOS : []
  if (!list.length) {
    container.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:20px 0">No scenario cases yet — add entries to <code>MY_SCENARIOS</code> in gear.js.</div>'
    return
  }
  const ul = document.createElement('div')
  ul.className = 'sc-list'
  list.forEach(sc => {
    const item = document.createElement('div')
    item.className = 'sc-item'

    const tagsHtml = (sc.tags||[]).map(t=>`<span class="sc-tag">${t}</span>`).join('')
    item.innerHTML = `
      <div class="sc-header">
        <span class="sc-chevron">▶</span>
        <span class="sc-title">${sc.title}</span>
        <span class="sc-date">${sc.date || ''}</span>
      </div>
      <div class="sc-body">
        ${tagsHtml ? `<div class="sc-tags" style="margin-bottom:10px">${tagsHtml}</div>` : ''}
        <div class="sc-bg">${sc.background}</div>

        <div class="sc-section-label">Recipe recommendations</div>
        ${(sc.recommendations||[]).map(r => `
          <div class="sc-rec">
            <div class="sc-rec-header">
              <span class="sc-slot">${r.slot}</span>
              <span class="sc-recipe-name">${r.recipe}</span>
              <span class="sc-label">— ${r.label}</span>
            </div>
            <div class="sc-reason">${r.reason}</div>
          </div>`).join('')}

        <div class="sc-section-label">Settings to watch</div>
        ${(sc.settings_to_watch||[]).map(w => `
          <div class="sc-watch-row">
            <span class="sc-watch-dial">${w.dial}</span>
            <span class="sc-watch-note">${w.note}</span>
          </div>`).join('')}

        ${sc.skip && sc.skip.length ? `
        <div class="sc-section-label">Skip for this scenario</div>
        <div class="sc-skip">${sc.skip.join('<br>')}</div>` : ''}
      </div>`

    item.querySelector('.sc-header').addEventListener('click', () => item.classList.toggle('open'))
    ul.appendChild(item)
  })
  container.appendChild(ul)
}

// ══════════════════════════════════════════
// LEARN
// ══════════════════════════════════════════
let learnBuilt = false
function renderLearn() {
  const container = $('learn-body')
  if (!container || learnBuilt) return
  const topics = typeof LEARN_TOPICS !== 'undefined' ? LEARN_TOPICS : []
  if (!topics.length) {
    container.innerHTML = '<div class="empty"><p>No learning topics yet. Add a topic in <strong>learn.js</strong>.</p></div>'
    return
  }
  learnBuilt = true
  container.innerHTML = ''
  topics.forEach((topic, index) => {
    const disclosure = document.createElement('details')
    disclosure.className = 'learn-topic'
    disclosure.id = 'learn-' + topic.id
    disclosure.open = index === 0
    disclosure.innerHTML = `
      <summary><span class="learn-topic-heading"><strong>${topic.title}</strong><span>${topic.subtitle || ''}</span></span><span class="learn-topic-tags">${(topic.tags || []).map(t => `<span class="sc-tag">${t}</span>`).join('')}</span></summary>
      <div class="learn-topic-body">${topic.body}</div>`
    container.appendChild(disclosure)
    if (topic.scenarios) renderExposureScenarios(disclosure, topic.scenarios)
    if (topic.demo === 'multiple-exposure') initMultiExposureDemo(disclosure)
    if (topic.demo === 'metering') initMeteringDemo(disclosure)
  })
}

// Author-edited teaching suggestions, separate from MY_CUSTOM_SETUPS and both
// recipe schemas. Native disclosures keep a long field guide easy to scan.
function renderExposureScenarios(topic, scenarios) {
  const container = topic.querySelector('[data-exposure-scenarios]')
  if (!container) return
  container.innerHTML = ''
  scenarios.forEach(scenario => {
    const card = document.createElement('details')
    card.className = 'learn-scenario'
    card.dataset.exposureScenario = scenario.id
    const settings = [
      ['Exposure mode', scenario.mode], ['Aperture', scenario.aperture],
      ['Shutter speed', scenario.shutter], ['ISO', scenario.iso],
      ['AF mode (Fuji names)', scenario.af], ['AF area / detection', scenario.area],
      ['Drive mode', scenario.drive], ['Other settings', scenario.extras],
    ]
    card.innerHTML = `
      <summary><span class="learn-scenario-heading"><strong>${scenario.title}</strong><span>${scenario.intent}</span><span class="learn-scenario-preview">${scenario.aperture} · ${scenario.shutter}</span></span></summary>
      <div class="learn-scenario-body">
        <dl class="learn-settings">${settings.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('')}</dl>
        <h4>Adjust in the field</h4>
        <ul>${scenario.adjust.map(tip => `<li>${tip}</li>`).join('')}</ul>
      </div>`
    container.appendChild(card)
  })
}

// Deliberately simple channel arithmetic for a teaching illustration, not a
// camera/RAW pipeline. Kept pure so the four operations can be tested alone.
function blendExposureValue(a, b, mode) {
  if (mode === 'additive') return Math.min(255, a + b)
  if (mode === 'bright') return Math.max(a, b)
  if (mode === 'dark') return Math.min(a, b)
  return (a + b) / 2
}

function initMultiExposureDemo(topic) {
  const demo = topic.querySelector('[data-multi-exposure-demo]')
  if (!demo) return
  const canvases = ['a', 'b', 'result'].map(frame => demo.querySelector(`[data-frame="${frame}"]`))
  const contexts = canvases.map(canvas => canvas.getContext('2d'))
  if (contexts.some(ctx => !ctx)) return
  const [portrait, texture, combined] = contexts
  const { width, height } = canvases[0]

  // Same subject and second frame, two first-frame backgrounds. Always draw
  // from source pixels so toggling scenes/exposure never compounds dimming.
  const portraits = {}
  for (const background of ['clean', 'textured']) {
    portrait.fillStyle = '#e6ebf2'
    if (background === 'textured') {
      const wall = portrait.createLinearGradient(0, 0, width, height)
      wall.addColorStop(0, '#334a55')
      wall.addColorStop(0.6, '#957c69')
      wall.addColorStop(1, '#496060')
      portrait.fillStyle = wall
    }
    portrait.fillRect(0, 0, width, height)
    if (background === 'textured') {
      // Uneven wall tones, mortar lines, a lit patch and a deep shadow. The
      // second exposure can now compete with areas outside the silhouette.
      for (let row = 0; row < 6; row++) {
        for (let brick = 0; brick < 5; brick++) {
          const x = brick * 85 - (row % 2 ? 40 : 0)
          portrait.fillStyle = (row + brick) % 3 === 0 ? 'rgba(20,35,44,.22)' : 'rgba(225,184,137,.10)'
          portrait.fillRect(x + 2, row * 40 + 2, 81, 36)
        }
      }
      portrait.fillStyle = '#cac6b3'
      portrait.fillRect(275, 18, 66, 110)
      portrait.fillStyle = '#67706a'
      portrait.fillRect(305, 18, 5, 110)
      portrait.fillRect(275, 69, 66, 5)
      portrait.fillStyle = 'rgba(10,25,30,.65)'
      portrait.beginPath()
      portrait.moveTo(0, 100)
      portrait.lineTo(108, height)
      portrait.lineTo(0, height)
      portrait.fill()
    }
    portrait.fillStyle = '#1e2730'
    portrait.beginPath()
    portrait.ellipse(180, 86, 42, 55, 0, 0, Math.PI * 2)
    portrait.fill()
    portrait.fillRect(160, 124, 40, 35)
    portrait.beginPath()
    portrait.ellipse(180, 244, 103, 100, 0, 0, Math.PI * 2)
    portrait.fill()
    portraits[background] = portrait.getImageData(0, 0, width, height)
  }

  texture.fillStyle = '#122420'
  texture.fillRect(0, 0, width, height)
  texture.strokeStyle = '#b89854'
  texture.lineWidth = 3
  for (let branch = 0; branch < 3; branch++) {
    const x = 60 + branch * 110
    texture.beginPath()
    texture.moveTo(x - 30, height)
    texture.quadraticCurveTo(x + 25, 130, x, 10)
    texture.stroke()
    for (let leaf = 0; leaf < 6; leaf++) {
      const y = 30 + leaf * 32
      const side = leaf % 2 ? 1 : -1
      texture.fillStyle = leaf % 2 ? '#c2a660' : '#80b898'
      texture.beginPath()
      texture.ellipse(x + side * 22, y, 27, 11, side * -0.6, 0, Math.PI * 2)
      texture.fill()
    }
  }
  const originalB = texture.getImageData(0, 0, width, height)
  const frameA = portrait.createImageData(width, height)
  const frameB = texture.createImageData(width, height)
  const result = combined.createImageData(width, height)
  const modeControl = demo.querySelector('[data-blend-mode]')
  const evControl = demo.querySelector('[data-blend-ev]')
  const backgroundControl = demo.querySelector('[data-blend-background]')
  const explanations = {
    average: 'Average: both frames remain visible as a softer overlap. The simple mean here lowers each layer’s contribution; the camera optimizes the final exposure.',
    additive: 'Additive: light accumulates and bright overlaps can turn white. Try −1 EV per frame for these two layers to reduce clipping.',
    bright: 'Bright: the light background survives, while bright leaves can fill the darker silhouette. Brighter detail wins at each location.',
    dark: 'Dark: the dark silhouette survives, while the darker botanical background replaces much of the light background. Darker detail wins at each location.',
  }
  const texturedExplanations = {
    average: 'Average with a textured background: the wall and leaves both remain in the overlap, so the scene is busier and less clearly shaped by the silhouette.',
    additive: 'Additive with a textured background: wall tones also contribute light, not just the person and leaves. Bright patches can wash out; try −1 EV per frame.',
    bright: 'Bright with a textured background: leaves can appear in darker wall patches as well as inside the person. The lit window tends to survive. Brightness, not a subject mask, decides where texture appears.',
    dark: 'Dark with a textured background: dark mortar and wall shadows compete with the botanical pattern, while the silhouette stays dark. The result can be graphic, but less cleanly separated.',
  }
  function update() {
    const mode = modeControl.value
    const ev = Number(evControl.value)
    const background = backgroundControl.value
    const originalA = portraits[background]
    const scale = Math.pow(2, ev)
    for (let i = 0; i < result.data.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) {
        const a = originalA.data[i + channel] * scale
        const b = originalB.data[i + channel] * scale
        frameA.data[i + channel] = a
        frameB.data[i + channel] = b
        result.data[i + channel] = blendExposureValue(a, b, mode)
      }
      frameA.data[i + 3] = frameB.data[i + 3] = result.data[i + 3] = 255
    }
    portrait.putImageData(frameA, 0, 0)
    texture.putImageData(frameB, 0, 0)
    combined.putImageData(result, 0, 0)
    const name = modeControl.selectedOptions[0].textContent
    demo.querySelector('[data-blend-name]').textContent = name
    demo.querySelector('[data-blend-ev-label]').textContent = (ev < 0 ? '−' + Math.abs(ev) : ev) + ' EV'
    const backgroundName = background === 'textured' ? 'colored / textured background' : 'clean background'
    const explanation = (background === 'textured' ? texturedExplanations : explanations)[mode]
    demo.querySelector('[data-blend-background-name]').textContent = backgroundName
    demo.querySelector('[data-blend-explanation]').textContent = explanation
    canvases[0].setAttribute('aria-label', 'Frame A: dark portrait silhouette on a ' + backgroundName + ', at ' + ev + ' EV.')
    canvases[2].setAttribute('aria-label', name + ' blend with a ' + backgroundName + ' at ' + ev + ' EV per frame. ' + explanation)
  }
  modeControl.addEventListener('change', update)
  evControl.addEventListener('input', update)
  backgroundControl.addEventListener('change', update)
  update()
}

// Three invented tone zones and explicit teaching weights, not Multi/ESP
// algorithms. Treat brightness as linear light; compensation is in stops.
function meteringDemoReading(scene, mode, target) {
  if (mode === 'spot') return scene[target]
  if (mode === 'center') return 0.70 * scene.subject + 0.20 * scene.background + 0.10 * scene.shadow
  return 0.20 * scene.subject + 0.65 * scene.background + 0.15 * scene.shadow
}

function meteringDemoExposure(reading, compensation) {
  return Math.log2(0.18 / Math.max(reading, 0.000001)) + compensation
}

function drawMeteringScene(ctx, scene, gain) {
  // Approximate a display transfer so linear 18% is shown as a mid-grey,
  // rather than confusing it with an 18%-of-255 dark display value.
  const tone = value => {
    const grey = Math.round(255 * Math.pow(Math.min(1, Math.max(0, value * gain)), 1 / 2.2))
    return `rgb(${grey},${grey},${grey})`
  }
  ctx.fillStyle = tone(scene.background)
  ctx.fillRect(0, 0, 360, 240)
  ctx.fillStyle = tone(scene.shadow)
  ctx.fillRect(12, 175, 74, 53)
  ctx.fillStyle = tone(scene.subject)
  ctx.beginPath()
  ctx.ellipse(180, 90, 32, 42, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(166, 119, 28, 25)
  ctx.beginPath()
  ctx.ellipse(180, 244, 77, 107, 0, 0, Math.PI * 2)
  ctx.fill()
}

function initMeteringDemo(topic) {
  const demo = topic.querySelector('[data-metering-demo]')
  if (!demo || typeof METERING_DEMO_SCENES === 'undefined') return
  const mapCanvas = demo.querySelector('[data-metering-frame="map"]')
  const resultCanvas = demo.querySelector('[data-metering-frame="result"]')
  const map = mapCanvas.getContext('2d')
  const result = resultCanvas.getContext('2d')
  if (!map || !result) return
  const sceneControl = demo.querySelector('[data-metering-scene]')
  const modeControl = demo.querySelector('[data-metering-mode]')
  const targetControl = demo.querySelector('[data-metering-target]')
  const compControl = demo.querySelector('[data-metering-comp]')
  const targetNames = { subject: 'person', background: 'background', shadow: 'shadow patch' }
  const targetPositions = { subject: [180, 90], background: [292, 78], shadow: [49, 201] }
  const formatEV = value => (value < -0.05 ? '−' : value > 0.05 ? '+' : '') + Math.abs(value).toFixed(1) + ' EV'

  function update() {
    const scene = METERING_DEMO_SCENES[sceneControl.value]
    const mode = modeControl.value
    const target = targetControl.value
    const compensation = Number(compControl.value)
    targetControl.disabled = mode !== 'spot'
    const reading = meteringDemoReading(scene, mode, target)
    const exposure = meteringDemoExposure(reading, compensation)
    const gain = Math.pow(2, exposure)
    drawMeteringScene(map, scene, 1)
    drawMeteringScene(result, scene, gain)
    // Only the input view gets a gold region; it is not burned into the result.
    map.strokeStyle = '#e8c05a'
    map.lineWidth = 3
    if (mode === 'spot') {
      const [x, y] = targetPositions[target]
      map.beginPath()
      map.arc(x, y, 18, 0, Math.PI * 2)
      map.stroke()
    } else {
      map.setLineDash(mode === 'center' ? [7, 5] : [])
      map.strokeRect(...(mode === 'center' ? [112, 35, 136, 202] : [5, 5, 350, 230]))
      map.setLineDash([])
    }
    const region = mode === 'spot' ? targetNames[target] : mode === 'center' ? 'center has extra weight' : 'entire frame'
    const modeDescription = mode === 'spot'
      ? 'Spot meters the ' + targetNames[target] + ' and places that sampled tone near a midtone before compensation.'
      : mode === 'center'
        ? 'Center-weighted gives the centered person most of the influence, while still considering the background.'
        : 'Whole-frame average is strongly influenced by the large background. This is not a prediction of Multi/ESP.'
    const clipped = ['subject', 'background', 'shadow'].filter(key => scene[key] * gain > 1)
    const warning = clipped.length ? ' Clipping in this illustration: ' + clipped.map(key => targetNames[key]).join(', ') + '.' : ''
    const explanation = modeDescription + ' ' + scene.tip + warning
    demo.querySelector('[data-metering-region]').textContent = region
    demo.querySelector('[data-metering-comp-label]').textContent = formatEV(compensation)
    demo.querySelector('[data-metering-adjustment]').textContent = formatEV(exposure) + ' total model adjustment'
    demo.querySelector('[data-metering-explanation]').textContent = explanation
    mapCanvas.setAttribute('aria-label', scene.label + '. Metering region: ' + region + '. The scene has a person, a background and a shadow patch.')
    resultCanvas.setAttribute('aria-label', scene.label + ' with ' + formatEV(exposure) + ' total model adjustment. ' + explanation)
  }
  ;[sceneControl, modeControl, targetControl].forEach(control => control.addEventListener('change', update))
  compControl.addEventListener('input', update)
  update()
}
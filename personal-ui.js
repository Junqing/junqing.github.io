// Photography realm: gallery, gear, custom setup, scenario notes.
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
function openPhotoModal(p) {
  const modal = $('recipe-modal')
  const body  = $('rmodal-body')
  body.innerHTML = ''
  const img = document.createElement('img')
  img.className = 'gal-photo'
  img.src = p.src
  img.alt = photoCaption(p) || 'Photograph'
  if (p.w && p.h) img.style.aspectRatio = p.w + ' / ' + p.h
  const meta = document.createElement('div')
  meta.className = 'gal-meta'
  meta.textContent = photoCaption(p) || ''
  body.appendChild(img)
  body.appendChild(meta)
  modal.classList.add('open')
  modal.scrollTop = 0
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
      'or use the <strong>/gallery</strong> skill to add a Lightroom album.</p></div>'
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
function renderCustomSlots() {
  const wrap = $('custom-slots-body')
  if (!wrap) return
  const slots = (typeof MY_CUSTOM_SLOTS !== 'undefined') ? MY_CUSTOM_SLOTS : []
  if (!slots.length) return

  const tabBar   = document.createElement('div')
  tabBar.className = 'cs-subtabs'
  const paneWrap = document.createElement('div')

  slots.forEach((slot, idx) => {
    // ── tab button
    const tab = document.createElement('button')
    tab.className = 'cs-subtab' + (idx === 0 ? ' active' : '')
    tab.innerHTML = `<span class="cs-subtab-slot">${slot.slot}</span><span class="cs-subtab-name">${slot.name}</span>`
    tab.addEventListener('click', () => {
      tabBar.querySelectorAll('.cs-subtab').forEach(t => t.classList.remove('active'))
      paneWrap.querySelectorAll('.cs-slot-pane').forEach(p => p.classList.remove('active'))
      tab.classList.add('active')
      paneWrap.querySelectorAll('.cs-slot-pane')[idx].classList.add('active')
    })
    tabBar.appendChild(tab)

    // ── pane
    const pane = document.createElement('div')
    pane.className = 'cs-slot-pane cs-card' + (idx === 0 ? ' active' : '')

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
      const baseSimRecipe = (slot.simulations || []).map(s => s.recipe_name ? activeRecipes().find(rx => rx.name === s.recipe_name) : null).find(Boolean) || null

      if (baseSimRecipe) {
        const vizRow = document.createElement('div')
        vizRow.className = 'mr-viz-row'
        const fp = document.createElement('div')
        fp.className = 'mr-fp'
        fp.innerHTML = fingerprint(baseSimRecipe)
        vizRow.appendChild(fp)
        const detailCol = document.createElement('div')
        detailCol.className = 'mr-detail-col'
        if (baseSimRecipe.white_balance) {
          const wbRow = document.createElement('div')
          wbRow.className = 'mr-detail-row'
          wbRow.innerHTML = `<span class="mr-detail-label">WB</span><span class="mr-detail-val">${baseSimRecipe.white_balance}</span>`
          detailCol.appendChild(wbRow)
        }
        const wbWrap = document.createElement('div')
        wbWrap.innerHTML = wbMiniGrid(baseSimRecipe)
        detailCol.appendChild(wbWrap)
        if (baseSimRecipe.dynamic_range && baseSimRecipe.dynamic_range !== 'N/A') {
          const drRow = document.createElement('div')
          drRow.className = 'mr-detail-row'
          drRow.innerHTML = `<span class="badge b-dr">${baseSimRecipe.dynamic_range}</span>`
          detailCol.appendChild(drRow)
        }
        vizRow.appendChild(detailCol)
        body.appendChild(vizRow)
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
          hint.textContent = 'View samples →'
          item.appendChild(hint)
          item.addEventListener('click', () => openRecipeModal(sim.recipe_name))
        }
        simGrid.appendChild(item)
      })
      body.appendChild(simGrid)
    } else {
      // Radar + DR/WB for single-type slot
      const slotRecipe = slot.recipe_name ? activeRecipes().find(rx => rx.name === slot.recipe_name) : null
      if (slotRecipe) {
        const vizRow = document.createElement('div')
        vizRow.className = 'mr-viz-row'

        const fp = document.createElement('div')
        fp.className = 'mr-fp'
        fp.innerHTML = fingerprint(slotRecipe)
        vizRow.appendChild(fp)

        const detailCol = document.createElement('div')
        detailCol.className = 'mr-detail-col'
        if (slotRecipe.white_balance) {
          const wbRow = document.createElement('div')
          wbRow.className = 'mr-detail-row'
          wbRow.innerHTML = `<span class="mr-detail-label">WB</span><span class="mr-detail-val">${slotRecipe.white_balance}</span>`
          detailCol.appendChild(wbRow)
        }
        const wbWrap = document.createElement('div')
        wbWrap.innerHTML = wbMiniGrid(slotRecipe)
        detailCol.appendChild(wbWrap)
        if (slotRecipe.dynamic_range && slotRecipe.dynamic_range !== 'N/A') {
          const drRow = document.createElement('div')
          drRow.className = 'mr-detail-row'
          drRow.innerHTML = `<span class="badge b-dr">${slotRecipe.dynamic_range}</span>`
          detailCol.appendChild(drRow)
        }
        vizRow.appendChild(detailCol)
        body.appendChild(vizRow)

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
        btn.addEventListener('click', () => openRecipeModal(slot.recipe_name))
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
  const setup = MY_CUSTOM_SETUPS[camName]
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
  if (setup.type === 'om-dial') {
    pane.innerHTML = `
      <div class="pfm-consistency"><strong>Global Consistency:</strong> Use Auto WB as the default. Keep Warm Color: Off. Avoid storing radically different WB shifts inside individual C modes unless intentional. Shoot RAW+JPEG while refining profiles. The goal is that COLOR 1 always looks like COLOR 1 regardless of whether you are currently using C1, C2, C3 or C4.</div>
      <div class="sec-title">Shooting Modes</div>
      <div class="pfm-grid" id="setup-modes-grid"></div>
      <div class="sec-title">Color Profiles</div>
      <div class="pfm-grid" id="setup-color-grid"></div>
      <div class="sec-title">Mono Profiles</div>
      <div class="pfm-grid" id="setup-mono-grid"></div>`
    const modesGrid = $('setup-modes-grid')
    setup.modes.forEach(m => {
      const settingsRows = m.settings.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
      const card = document.createElement('div')
      card.className = 'pfm-card'
      card.innerHTML = `
        <div class="pfm-head"><span class="pfm-slot">${m.slot}</span><span class="pfm-name">${m.name}</span></div>
        <ul class="pfm-list">${m.purpose.map(p=>`<li>${p}</li>`).join('')}</ul>
        <table class="stbl"><tbody>${settingsRows}</tbody></table>
        <ul class="pfm-list">${m.why.map(w=>`<li>${w}</li>`).join('')}</ul>
        <div class="pfm-shortcut">${m.shortcut}</div>`
      modesGrid.appendChild(card)
    })
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
      monoGrid.appendChild(card)
    })
    return
  }
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
// Camera Settings realm: recipe grid, keywords, insights, explore, compare.
// Owns activeGen and the S / T / C filter+tool state.
// Parse-time rule: nothing here may touch another module's globals at parse
// time — only inside function bodies.


// ══════════════════════════════════════════
// DATA
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let activeGen = 'V'
const RECIPE_POOLS = { V: RECIPES_V, IV: RECIPES_IV, III: RECIPES_III, II: RECIPES_II, I: RECIPES_I }
function activeRecipes() { return RECIPE_POOLS[activeGen] || [] }

const S = {
  q: '',
  f: { sim: new Set(), warmth: new Set(), punch: new Set(), mood: new Set(), scene: new Set(), era: new Set(),
       type: new Set(), hue: new Set() },
  chartFilter: null,  // {field, value} for histogram clicks
}

function loadGen(gen) {
  if (RECIPE_POOLS[gen]) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'recipes-' + gen.toLowerCase() + '.js'
    s.onload = () => { RECIPE_POOLS[gen] = window['RECIPES_' + gen] || []; resolve() }
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
    S.f.type.clear(); S.f.hue.clear()
    exploreBuilt = false
    compareBuilt = false
    // Compare state is shared between families — a Fuji recipe must never end
    // up compared against an OM one.
    C.a = null; C.b = null; compareSlots = [null, null]
    settingsBuilt = false
    if (typeof resetOmInsightsBuilt === 'function') resetOmInsightsBuilt()
    if (typeof resetOmExploreBuilt === 'function') resetOmExploreBuilt()
    if (typeof resetOmCompareBuilt === 'function') resetOmCompareBuilt()
    if (document.getElementById('q')) document.getElementById('q').value = ''
    initChips()
    syncSidebarFacets()
    render()
    $('s-total').textContent=activeRecipes().length
    $('s-total-x').textContent=activeRecipes().length
    $('s-sims').textContent=new Set(activeRecipes().map(r=>r.film_simulation).filter(Boolean)).size
    if (sel) sel.disabled = false
  }).catch(err => {
    console.error(err)
    if (sel) { sel.disabled = false; sel.value = activeGen }
  })
}
const pn = v => { if(v==null||String(v).trim()===''||v==='N/A') return null; const n=parseFloat(String(v)); return isNaN(n)?null:n }
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v))

const DIR_COLOR = {warm:'#e07842','warm-neutral':'#d4a843',cool:'#5b9af0','cool-neutral':'#4db8aa',neutral:'#9a9aaa','high-contrast':'#e05c5c',muted:'#6e6e80',punchy:'#e05c5c',desaturated:'#7a7a8a'}
const dc = d => DIR_COLOR[d]||'#9a9aaa'

const BW_SIMS = new Set(['Acros','Acros+R','Acros+Ye','Acros+G','Monochrome','Monochrome+R','Monochrome+Ye','Monochrome+G','Sepia'])
const WARM_SIMS = new Set(['Nostalgic Neg.','Classic Chrome','Eterna','Eterna/Cinema','PRO Neg. Hi','PRO Neg. Std','Sepia'])
const COOL_SIMS = new Set(['Eterna Bleach Bypass','Velvia/Vivid'])

function wbKelvin(wb) {
  if (!wb) return 5200
  const m = wb.match(/(\d{4,5})K/)
  if (m) return parseInt(m[1])
  if (wb === 'Daylight') return 5200
  if (wb === 'Cloudy') return 6000
  if (wb === 'Shade') return 7500
  if (/Auto White Priority/.test(wb)) return 5000
  if (/Auto/.test(wb)) return 5200
  if (wb === 'Fluorescent 3') return 6500
  if (/Fluorescent/.test(wb)) return 4000
  if (/Tungsten|Incandescent/.test(wb)) return 3200
  return 5200
}

function recipeWarmth(r) {
  if (typeof RECIPE_META_PATCHES !== 'undefined' && RECIPE_META_PATCHES[r.name]?.warmth_override) {
    return RECIPE_META_PATCHES[r.name].warmth_override
  }
  if (activeGen === 'OM') return typeof recipeWarmthOm === 'function' ? recipeWarmthOm(r) : 'neutral'
  if (BW_SIMS.has(r.film_simulation) || r.color === null || r.color === undefined) return 'neutral'
  const wbNorm    = (wbKelvin(r.white_balance) - 5200) / 2300
  const shiftNorm = ((parseInt(r.wb_shift_red) || 0) - (parseInt(r.wb_shift_blue) || 0)) / 9
  const filmBias  = WARM_SIMS.has(r.film_simulation) ? 0.15 : COOL_SIMS.has(r.film_simulation) ? -0.15 : 0
  const score     = wbNorm * 0.5 + shiftNorm * 0.5 + filmBias
  if (score > 0.35)  return 'warm'
  if (score < -0.20) return 'cool'
  return 'neutral'
}

function recipePunch(r) {
  if (typeof RECIPE_META_PATCHES !== 'undefined' && RECIPE_META_PATCHES[r.name]?.punch_override) {
    return RECIPE_META_PATCHES[r.name].punch_override
  }
  if (activeGen === 'OM') return typeof recipePunchOm === 'function' ? recipePunchOm(r) : 'balanced'
  const colorVal = (BW_SIMS.has(r.film_simulation) || r.color === null || r.color === undefined) ? 0 : (r.color || 0)
  const score = colorVal * 0.5 + (r.clarity || 0) * 0.25 - (Math.abs(r.highlight || 0) + Math.abs(r.shadow || 0)) * 0.1
  if (score > 1.2)  return 'punchy'
  if (score < -0.5) return 'flat'
  return 'balanced'
}

const WARMTH_CLASS = { warm: 'b-warm', neutral: 'b-neutral', cool: 'b-cool' }
const PUNCH_CLASS  = { punchy: 'b-punchy', balanced: 'b-neutral', flat: 'b-flat' }
function warmthClass(r) { return WARMTH_CLASS[recipeWarmth(r)] }
function punchClass(r)  { return PUNCH_CLASS[recipePunch(r)] }

// ══════════════════════════════════════════
// FILTER
// ══════════════════════════════════════════
function matches(r) {
  if(S.q){
    const q=S.q.toLowerCase()
    const h=[r.name,r.film_simulation,r.film_emulated,r.narrative,...(r.mood_keywords||[]),...(r.scenario_keywords||[])].join(' ').toLowerCase()
    if(!h.includes(q)) return false
  }
  if(activeGen === 'OM'){
    if(S.f.type.size && !S.f.type.has(r.recipe_type||'COLOR')) return false
    if(S.f.hue.size){
      const h = typeof omHueEmphasis === 'function' ? omHueEmphasis(r) : null
      if(!h || !S.f.hue.has(h)) return false
    }
  }
  if(S.f.sim.size && !S.f.sim.has(r.film_simulation)) return false
  if(S.f.warmth.size && !S.f.warmth.has(recipeWarmth(r))) return false
  if(S.f.punch.size  && !S.f.punch.has(recipePunch(r)))   return false
  if(S.f.era.size && !S.f.era.has(r.era_reference)) return false
  if(S.f.mood.size && !([...S.f.mood].some(m=>(r.mood_keywords||[]).includes(m)))) return false
  if(S.f.scene.size && !([...S.f.scene].some(s=>(r.scenario_keywords||[]).includes(s)))) return false
  if(S.chartFilter){
    const {field,value} = S.chartFilter
    const v = pn(r[field])
    if(v !== value) return false
  }
  return true
}
const filtered = () => activeRecipes().filter(matches)

// ══════════════════════════════════════════
// FILTER CHIPS
// ══════════════════════════════════════════
function buildChips(containerId, values, filterKey) {
  const el=$(containerId); el.innerHTML=''
  values.forEach(v=>{
    const c=document.createElement('div'); c.className='chip'; c.textContent=v; c.dataset.v=v
    c.addEventListener('click',()=>{
      S.f[filterKey].has(v)?S.f[filterKey].delete(v):S.f[filterKey].add(v)
      c.classList.toggle('on'); render()
    })
    el.appendChild(c)
  })
}

// Single source of truth for sidebar facet visibility — reads the active tab
// and activeGen, owns every .sb-section's display. initChips() only builds
// chip contents; it must not also decide visibility (that duplication is what
// let the Gallery-only sidebar reappear stacked with Fuji/OM facets after a
// gen switch — see switchGen()/applyNav()).
function syncSidebarFacets() {
  // applyNav() (nav.js) already hides the whole sidebar for Photography's
  // Gear/Setup/Notes views and for Home — this function only runs (and only
  // needs to distinguish) Camera Settings' recipe facets from Gallery's
  // album-only facet.
  const isGal = NAV.view === 'gallery'
  const isOm  = activeGen === 'OM'
  const show = (id, on) => { const el=$(id); if(el) el.style.display = on ? '' : 'none' }
  show('sb-sec-album', isGal)
  show('sb-sec-sim',  !isGal && !isOm)
  show('sb-sec-era',  !isGal && !isOm)
  show('sb-sec-type', !isGal &&  isOm)
  show('sb-sec-hue',  !isGal &&  isOm)
  const OWNED = new Set(['sb-sec-album','sb-sec-sim','sb-sec-era','sb-sec-type','sb-sec-hue'])
  document.querySelectorAll('.sidebar .sb-section').forEach(sec => {
    if (OWNED.has(sec.id)) return
    sec.style.display = isGal ? 'none' : ''
  })
}

function initChips() {
  const isOm = activeGen === 'OM'

  if (isOm) {
    buildChips('f-type', [...new Set(activeRecipes().map(r=>r.recipe_type||'COLOR'))].sort(), 'type')
    const hues = [...new Set(activeRecipes()
      .map(r => typeof omHueEmphasis === 'function' ? omHueEmphasis(r) : null)
      .filter(Boolean))]
    const order = ['warm','cool','green','magenta','neutral']
    buildChips('f-hue', hues.sort((a,b)=>order.indexOf(a)-order.indexOf(b)), 'hue')
  } else {
    buildChips('f-sim',[...new Set(activeRecipes().map(r=>r.film_simulation).filter(Boolean))].sort(),'sim')
    const eras=[...new Set(activeRecipes().map(r=>r.era_reference).filter(e=>e&&e!=='none'))].sort()
    buildChips('f-era',eras,'era')
  }

  buildChips('f-warmth', ['warm', 'neutral', 'cool'], 'warmth')
  buildChips('f-punch',  ['punchy', 'balanced', 'flat'], 'punch')
  buildChips('f-mood',[...new Set(activeRecipes().flatMap(r=>r.mood_keywords||[]))].sort(),'mood')
  buildChips('f-scene',[...new Set(activeRecipes().flatMap(r=>r.scenario_keywords||[]))].sort(),'scene')
}

function initCollapsibleFilters() {
  document.querySelectorAll('.sidebar .sb-section').forEach(section => {
    const label = section.querySelector('.sb-label')
    if (!label) return
    if (!section.querySelector('.chips')) return
    section.classList.add('collapsed')
    label.addEventListener('click', () => {
      section.classList.toggle('collapsed')
    })
  })
}

// ══════════════════════════════════════════
// RECIPE FINGERPRINT SVG
// ══════════════════════════════════════════
function wbMiniGrid(r) {
  if (activeGen === 'OM') return ''
  const rx = pn(r.wb_shift_red)  ?? 0
  const ry = -(pn(r.wb_shift_blue) ?? 0)
  let html = ''
  for (let i = -6; i <= 6; i += 3) {
    const thick = i === 0
    html += `<line x1="${i}" y1="-9" x2="${i}" y2="9" stroke="${thick?'#333340':'#242428'}" stroke-width="${thick?.6:.3}"/>`
    html += `<line x1="-9" y1="${i}" x2="9" y2="${i}" stroke="${thick?'#333340':'#242428'}" stroke-width="${thick?.6:.3}"/>`
  }
  html += `<rect x="-9" y="-9" width="18" height="18" fill="none" stroke="#2e2e34" stroke-width=".6"/>`
  html += `<text x="-9.4" y=".7" font-size="2.2" fill="#7a7a90" text-anchor="end" font-family="Inter,sans-serif">R−</text>`
  html += `<text x="9.4"  y=".7" font-size="2.2" fill="#7a7a90" text-anchor="start" font-family="Inter,sans-serif">R+</text>`
  html += `<text x="0" y="-9.6" font-size="2.2" fill="#7a7a90" text-anchor="middle" font-family="Inter,sans-serif">B+</text>`
  html += `<text x="0" y="11.2" font-size="2.2" fill="#7a7a90" text-anchor="middle" font-family="Inter,sans-serif">B−</text>`
  html += `<polygon points="${diamondPoints(rx, ry, 1.1)}" fill="#d4a843" stroke="#0d0d0f" stroke-width=".3"/>`
  const rVal = pn(r.wb_shift_red)  ?? 0
  const bVal = pn(r.wb_shift_blue) ?? 0
  const rLabel = (rVal >= 0 ? 'R+' : 'R') + rVal
  const bLabel = (bVal >= 0 ? 'B+' : 'B') + bVal
  const svg = `<svg class="mr-wb-svg" viewBox="-11 -11 22 22" style="width:100%;max-width:120px;display:block;border-radius:var(--r);background:#131318;border:1px solid #3a3a46">${html}</svg>`
  const label = `<div class="mr-wb-label"><svg width="8" height="8" viewBox="0 0 10 10"><polygon points="5,1 9,5 5,9 1,5" fill="#d4a843"/></svg><span style="color:#e8c05a;font-weight:600;font-size:11px">${rLabel} ${bLabel}</span></div>`
  return svg + label
}
function fingerprint(r) {
  const ccMap={'Off':0,'Weak':1,'Strong':2}
  const ccLbl=['Off','Weak','Strong']
  const axes=[
    {l:'HL', v:pn(r.highlight)??0,                    lo:-2,hi:4, fmt:v=>v>0?'+'+v:''+v},
    {l:'SH', v:pn(r.shadow)??0,                       lo:-2,hi:4, fmt:v=>v>0?'+'+v:''+v},
    {l:'COL',v:pn(r.color)??0,                        lo:-4,hi:4, fmt:v=>v>0?'+'+v:''+v},
    {l:'CCE',v:ccMap[r.color_chrome_effect]??0,        lo:0, hi:2, fmt:v=>ccLbl[v]},
    {l:'CCB',v:ccMap[r.color_chrome_fx_blue]??0,       lo:0, hi:2, fmt:v=>ccLbl[v]},
  ]
  const N=axes.length,cx=60,cy=60,R=38
  const pts=axes.map((a,i)=>{
    const ang=(2*Math.PI*i/N)-Math.PI/2
    const extent=Math.max(Math.abs(a.lo),Math.abs(a.hi))
    const ratio=clamp((a.v+extent)/(2*extent),0,1)
    return [cx+R*ratio*Math.cos(ang),cy+R*ratio*Math.sin(ang)]
  })
  const poly=pts.map(p=>p.join(',')).join(' ')
  const grids=[.25,.5,.75,1].map(t=>{
    const gp=axes.map((_,i)=>{const a=(2*Math.PI*i/N)-Math.PI/2;return [cx+R*t*Math.cos(a),cy+R*t*Math.sin(a)]})
    return `<polygon points="${gp.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${t===.5?'#585868':'#3e3e50'}" stroke-width="${t===.5?'1':'.8'}"/>`
  }).join('')
  const spokes=axes.map((_,i)=>{const a=(2*Math.PI*i/N)-Math.PI/2;return `<line x1="${cx}" y1="${cy}" x2="${cx+R*Math.cos(a)}" y2="${cy+R*Math.sin(a)}" stroke="#2a2a30" stroke-width=".8"/>`}).join('')
  const labels=axes.map((a,i)=>{
    const ang=(2*Math.PI*i/N)-Math.PI/2
    const uy=Math.sin(ang)
    const lx=cx+(R+22)*Math.cos(ang), ly=cy+(R+22)*uy
    const lw=a.l.length*5+6
    const valStr=a.fmt(a.v)
    const vw=valStr.length*4.5+6
    // Place value pill toward the outside radially: below if upper half, above if lower half
    const vyOff = uy <= 0 ? 8 : -16
    const vy = ly + vyOff
    return `<rect x="${lx-lw/2}" y="${ly-7}" width="${lw}" height="13" rx="3" fill="#1e1e28" stroke="#44445a" stroke-width=".7"/>` +
           `<text x="${lx}" y="${ly+1}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="700" fill="#dcdcec" font-family="Inter,sans-serif">${a.l}</text>` +
           `<rect x="${lx-vw/2}" y="${vy}" width="${vw}" height="11" rx="2.5" fill="#13131a" stroke="#36364a" stroke-width=".6"/>` +
           `<text x="${lx}" y="${vy+6.5}" text-anchor="middle" dominant-baseline="middle" font-size="8" font-weight="600" fill="#b8b8d0" font-family="Inter,sans-serif">${valStr}</text>`
  }).join('')
  const col=dc(r.color_direction)
  return `<svg width="120" height="120" viewBox="0 0 120 120" overflow="visible">${grids}${spokes}<polygon points="${poly}" fill="${col}" fill-opacity=".25" stroke="${col}" stroke-width="1.5"/>${labels}</svg>`
}

// ══════════════════════════════════════════
// RECIPE CARD
// ══════════════════════════════════════════
function makeCard(r) {
  const div=document.createElement('div'); div.className='card'
  if (activeGen === 'OM') return makeOmCard(r, div)
  const drBadge = r.dynamic_range && r.dynamic_range !== 'N/A'
    ? `<div class="mr-detail-row"><span class="badge b-dr">${r.dynamic_range}</span></div>` : ''
  const wbMode = r.white_balance
    ? `<div class="mr-detail-row"><span class="mr-detail-label">WB</span><span class="mr-detail-val">${r.white_balance}</span></div>` : ''
  const imgHtml=`<div class="card-img-fp"><div class="card-fp-inner">${fingerprint(r)}</div><div class="card-drwb">${wbMode}${wbMiniGrid(r)}${drBadge}</div></div>`

  function pill(lbl, val) {
    if (val == null || val === '' || val === 'N/A') return ''
    return `<span class="cpill"><span class="cpill-lbl">${lbl}</span><span class="cpill-val">${val}</span></span>`
  }
  function signedVal(v) { return v == null ? null : (v > 0 ? '+' + v : '' + v) }

  const pillsHtml = [
    pill('Grain', r.grain_effect),
    pill('CCE', r.color_chrome_effect),
    pill('CCB', r.color_chrome_fx_blue),
    pill('HL',  signedVal(r.highlight)),
    pill('SH',  signedVal(r.shadow)),
    pill('COL', signedVal(r.color)),
    pill('SHP', signedVal(r.sharpness)),
    pill('CL',  signedVal(r.clarity)),
    r.iso_max ? pill('ISO', r.iso_max) : '',
    r.exposure_compensation ? pill('EV', r.exposure_compensation) : '',
  ].join('')

  const moodK=(r.mood_keywords||[]).map(k=>`<span class="kw">${k}</span>`).join('')
  const scenK=(r.scenario_keywords||[]).map(k=>`<span class="kw">${k}</span>`).join('')

  const settings=[
    ['Film Sim',r.film_simulation],['Grain',r.grain_effect],
    ['Color Chrome',r.color_chrome_effect],['CC FX Blue',r.color_chrome_fx_blue],
    ['White Balance',r.white_balance],
    ['WB Shift',(r.wb_shift_red||r.wb_shift_blue)?`R:${r.wb_shift_red||0} / B:${r.wb_shift_blue||0}`:null],
    ['Dynamic Range',r.dynamic_range],['Highlight',r.highlight],['Shadow',r.shadow],
    ['Color',r.color],['Sharpness',r.sharpness],['Clarity',r.clarity],
    ['ISO',r.iso_max?`Auto up to ${r.iso_max}`:null],['Exposure',r.exposure_compensation],
  ].filter(([,v])=>v!=null&&v!=='N/A'&&v!=='')
   .map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')

  div.innerHTML=`${imgHtml}
<div class="cbody">
  <div class="ctitle-row">
    <span class="ctitle">${r.name}</span>
    ${r.source_url?`<a href="${r.source_url}" target="_blank" class="src-btn" title="See photo examples on fujixweekly.com"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2H2a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V6"/><polyline points="6.5 1 9 1 9 3.5"/><line x1="5" y1="5" x2="9" y2="1"/></svg>fujixweekly</a>`:''}
  </div>
  <div class="cnarr">${r.narrative||''}</div>
  <div class="cbadges">
    <span class="badge b-sim">${r.film_simulation||'?'}</span>
    ${r.dynamic_range&&r.dynamic_range!=='N/A'?`<span class="badge b-dr">${r.dynamic_range}</span>`:''}
    <span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span>
    <span class="badge ${punchClass(r)}">${recipePunch(r)}</span>
  </div>
</div>
<div class="cpills">${pillsHtml}</div>
<div class="cexpand">
  <table class="stbl"><tbody>${settings}</tbody></table>
  ${moodK||scenK?`<div class="kwrow">${moodK}${scenK}</div>`:''}
</div>`

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

  return div
}

// OM-only: 12-point color wheel "bloom" — each spoke is a hue channel colored to match,
// dot position/size encodes the -7..+7 push (middle ring = 0, outer edge = +7, center = -7).
// Mirrors the real Olympus Color Creator dial layout. Independent of fingerprint() (Fuji-only).
function buildOmVisual(obj) {
  const cw = obj.color_wheel
  const isMono = !cw || obj.recipe_type === 'MONO'
  const wheelHtml = isMono
    ? `<svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r="44" fill="none" stroke="#3e3e50" stroke-width="1"/><circle cx="70" cy="70" r="22" fill="#34343c"/><text x="70" y="67" text-anchor="middle" font-size="11" font-weight="700" fill="#9a9aaa" font-family="Inter,sans-serif">MONO</text><text x="70" y="81" text-anchor="middle" font-size="8" fill="#6a6a78" font-family="Inter,sans-serif">${(obj.monochrome_color||obj.monochrome_profile||'').slice(0,14)}</text></svg>`
    : buildOmWheelSvg(cw)
  const wbHtml = buildOmWbBox(obj)
  const toneRows = [
    ['Shading Effect', obj.shading_effect],
    ['Sharpness', obj.sharpness],
    ['Contrast', obj.contrast],
    ['Exposure Comp', obj.exposure_compensation],
  ].map(([label, v]) => {
    const val = v == null ? 0 : v
    const disp = val > 0 ? '+' + val : '' + val
    return `<div class="omv-tone-row"><span>${label}</span><input type="range" min="-6" max="6" value="${clamp(val,-6,6)}" disabled><strong>${disp}</strong></div>`
  }).join('')
  const sh = obj.shadows ?? 0, mid = obj.midtones ?? 0, hi = obj.highlights ?? 0
  const fmt = v => v > 0 ? '+' + v : '' + v
  return `<div class="omv">
    <div class="omv-shmidhi"><span>Sh: <strong>${fmt(sh)}</strong></span><span>Mid: <strong>${fmt(mid)}</strong></span><span>Hi: <strong>${fmt(hi)}</strong></span></div>
    <div class="omv-wheel-wrap">${wheelHtml}</div>
    <div class="omv-wb-wrap">${wbHtml}</div>
    <div class="omv-tones">${toneRows}</div>
  </div>`
}

function buildOmWheelSvg(cw) {
  const N = OM_WHEEL_ORDER.length, cx = 130, cy = 130
  const OM_WHEEL_REF_HUE = { yellow:'#FCF750', orange:'#DBA12A', orangeRed:'#CC1210', red:'#CD076B', magenta:'#970AA0', violet:'#7710E8', blue:'#3054E0', blueCyan:'#5392EB', cyan:'#83E7EB', greenCyan:'#87EE77', green:'#9DEE3A', yellowGreen:'#CBEE3A' }
  const radiusFor = v => clamp(49.23 + 6.15 * (v ?? 0), 8, 130)
  const ringPts = OM_WHEEL_ORDER.map((k, i) => {
    const ang = (2 * Math.PI * i / N) - Math.PI / 2
    return { x: cx + 118 * Math.cos(ang), y: cy + 118 * Math.sin(ang), k, ang }
  })
  const outerSegs = ringPts.map((p, i) => {
    const next = ringPts[(i + 1) % N]
    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${next.x.toFixed(1)}" y2="${next.y.toFixed(1)}" stroke="${OM_WHEEL_REF_HUE[p.k]}" stroke-width="4"/>`
  }).join('')
  const dataPts = OM_WHEEL_ORDER.map((k, i) => {
    const v = cw[k] ?? 0
    const ang = (2 * Math.PI * i / N) - Math.PI / 2
    const r = radiusFor(v)
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), v, k, ang }
  })
  const poly = dataPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const labels = dataPts.map(p => {
    const lx = cx + (radiusFor(p.v) + 12) * Math.cos(p.ang)
    const ly = cy + (radiusFor(p.v) + 12) * Math.sin(p.ang)
    const disp = p.v > 0 ? '+' + p.v : '' + p.v
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#b8b8d0" font-family="Inter,sans-serif">${disp}</text>`
  }).join('')
  const guideRing = `<circle cx="${cx}" cy="${cy}" r="49.23" fill="none" stroke="#3e3e50" stroke-width="1"/>`
  return `<svg width="140" height="140" viewBox="0 0 260 260">${outerSegs}${guideRing}<polygon points="${poly}" fill="#ffffff" fill-opacity=".08" stroke="#ffffff" stroke-opacity=".4" stroke-width="1.5"/>${labels}</svg>`
}

function buildOmWbBox(obj) {
  const amber = clamp(obj.wb_amber_offset ?? 0, -7, 7)
  const green = clamp(obj.wb_green_offset ?? 0, -7, 7)
  const dotX = 75 + amber * 7
  const dotY = 75 - green * 7
  const svg = `<svg width="90" height="90" viewBox="0 0 150 150">
    <rect x="4" y="4" width="142" height="142" rx="10" fill="#131318" stroke="#2e2e34" stroke-width="1"/>
    <rect x="4" y="4" width="142" height="4" fill="#4caf81"/>
    <rect x="4" y="142" width="142" height="4" fill="#d84ad0"/>
    <rect x="142" y="4" width="4" height="142" fill="#e8934a"/>
    <rect x="4" y="4" width="4" height="142" fill="#3054E0"/>
    <line x1="${(dotX-10).toFixed(1)}" y1="${dotY.toFixed(1)}" x2="${(dotX+10).toFixed(1)}" y2="${dotY.toFixed(1)}" stroke="#585868" stroke-width="1"/>
    <line x1="${dotX.toFixed(1)}" y1="${(dotY-10).toFixed(1)}" x2="${dotX.toFixed(1)}" y2="${(dotY+10).toFixed(1)}" stroke="#585868" stroke-width="1"/>
    <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="5" fill="#e8c05a" stroke="#0d0d0f" stroke-width="1"/>
  </svg>`
  const ampStr = amber >= 0 ? 'A.' + amber : 'A' + amber
  const grnStr = green >= 0 ? 'G.' + green : 'G' + green
  return `${svg}<div class="omv-wb-label">${obj.white_balance || 'Auto'} &nbsp; ${ampStr} &nbsp; ${grnStr}</div>`
}

function makeOmCard(r, div) {
  const imgHtml=`<div class="card-img-fp" style="height:auto;flex-direction:column">${buildOmVisual(r)}</div>`

  function pill(lbl, val) {
    if (val == null || val === '' || val === 'N/A') return ''
    return `<span class="cpill"><span class="cpill-lbl">${lbl}</span><span class="cpill-val">${val}</span></span>`
  }
  function signedVal(v) { return v == null ? null : (v > 0 ? '+' + v : '' + v) }

  const wheelPills = r.color_wheel
    ? Object.entries(r.color_wheel).filter(([,v]) => v != null && v !== 0)
        .map(([k,v]) => pill(OM_WHEEL_ABBR[k]||k, signedVal(v))).join('')
    : ''

  const pillsHtml = [
    pill('Contrast', signedVal(r.contrast)),
    pill('SHP', signedVal(r.sharpness)),
    pill('HL', signedVal(r.highlights)),
    pill('SH', signedVal(r.shadows)),
    pill('MID', signedVal(r.midtones)),
    r.exposure_compensation ? pill('EV', signedVal(r.exposure_compensation)) : '',
    wheelPills,
  ].join('')

  const moodK=(r.mood_keywords||[]).map(k=>`<span class="kw">${k}</span>`).join('')
  const scenK=(r.scenario_keywords||[]).map(k=>`<span class="kw">${k}</span>`).join('')

  const settings=[
    ['Type', r.recipe_type], ['Author', r.author],
    ['White Balance', r.white_balance], ['WB Temp', r.wb_temperature?`${r.wb_temperature}K`:null],
    ['WB Amber', signedVal(r.wb_amber_offset)], ['WB Green', signedVal(r.wb_green_offset)],
    ['Contrast', signedVal(r.contrast)], ['Sharpness', signedVal(r.sharpness)],
    ['Highlights', signedVal(r.highlights)], ['Shadows', signedVal(r.shadows)], ['Midtones', signedVal(r.midtones)],
    ['Shading Effect', signedVal(r.shading_effect)], ['Exposure', signedVal(r.exposure_compensation)],
    ['Monochrome Profile', r.monochrome_profile], ['Monochrome Color', r.monochrome_color],
    ['Color Strength', r.monochrome_color_strength], ['Film Grain', r.film_grain],
    ['Film Hue', r.film_hue], ['Vignetting', signedVal(r.monochrome_vignetting)],
  ].filter(([,v])=>v!=null&&v!=='N/A'&&v!=='')
   .map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('')

  div.innerHTML=`${imgHtml}
<div class="cbody">
  <div class="ctitle-row">
    <span class="ctitle">${r.name}</span>
    ${r.source_url?`<a href="${r.source_url}" target="_blank" class="src-btn" title="See this recipe on om-recipes.com"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2H2a1 1 0 00-1 1v5a1 1 0 001 1h5a1 1 0 001-1V6"/><polyline points="6.5 1 9 1 9 3.5"/><line x1="5" y1="5" x2="9" y2="1"/></svg>om-recipes</a>`:''}
  </div>
  <div class="cnarr">${r.author?'by '+r.author:''}</div>
  <div class="cbadges">
    <span class="badge b-sim">${r.recipe_type||'?'}</span>
    <span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span>
    <span class="badge ${punchClass(r)}">${recipePunch(r)}</span>
  </div>
</div>
<div class="cpills">${pillsHtml}</div>
<div class="cexpand">
  <table class="stbl"><tbody>${settings}</tbody></table>
  ${moodK||scenK?`<div class="kwrow">${moodK}${scenK}</div>`:''}
</div>`

  const cmpBtn = document.createElement('button')
  cmpBtn.className = 'cmp-card-btn'
  cmpBtn.dataset.recipe = r.name
  cmpBtn.textContent = 'Compare'
  if (compareSlots[0] && compareSlots[0].name === r.name) { cmpBtn.textContent = 'A ✕'; cmpBtn.className = 'cmp-card-btn slot-a' }
  if (compareSlots[1] && compareSlots[1].name === r.name) { cmpBtn.textContent = 'B ✕'; cmpBtn.className = 'cmp-card-btn slot-b' }
  cmpBtn.style.cssText = 'margin:4px 12px 8px;display:block'
  cmpBtn.addEventListener('click', e => { e.stopPropagation(); onCompareCardClick(r) })
  div.appendChild(cmpBtn)

  return div
}

// ══════════════════════════════════════════
// RENDER GRID
// ══════════════════════════════════════════
function renderGrid() {
  const fr=filtered()
  $('s-show').textContent=fr.length
  $('s-show-x').textContent=fr.length
  $('rcount').innerHTML=`Showing <strong>${fr.length}</strong> of <strong>${activeRecipes().length}</strong> recipes`
  const grid=$('grid'); grid.innerHTML=''
  $('empty').style.display=fr.length?'none':'block'
  fr.forEach(r=>grid.appendChild(makeCard(r)))
}

// ══════════════════════════════════════════
// CHARTS
// ══════════════════════════════════════════
let chartsBuilt=false
function renderCharts() {
  if(chartsBuilt) { drawParallel(); return }
  chartsBuilt=true

  // Film sim bar
  buildBarChart('ch-sim', countBy(activeRecipes(),'film_simulation'), ()=>'var(--accent)', (lbl)=>{
    S.f.sim.has(lbl)?S.f.sim.delete(lbl):S.f.sim.add(lbl)
    syncChips(); render()
  })

  // DR bar
  buildBarChart('ch-dr', countBy(activeRecipes(),'dynamic_range').filter(d=>d.l!=='N/A'&&d.l!==''), l=>l.l==='DR400'?'var(--blue)':l.l==='DR200'?'var(--teal)':'var(--text3)', ()=>{})

  // Histograms — skip high_iso_nr (constant)
  const hw=$('hist-wrap'); hw.innerHTML=''
  const hfields=[
    {key:'highlight',label:'Highlight',color:'#e8c05a'},
    {key:'shadow',label:'Shadow',color:'#5b9af0'},
    {key:'color',label:'Color',color:'#4caf7d'},
    {key:'sharpness',label:'Sharpness',color:'#9b7fe8'},
    {key:'clarity',label:'Clarity',color:'#4db8aa'},
  ]
  hfields.forEach(f=>{
    const vals=activeRecipes().map(r=>pn(r[f.key])).filter(v=>v!==null)
    if(!vals.length) return
    buildHistCard(hw,f,vals)
  })

  drawParallel()
}

function countBy(arr, key) {
  const m={}
  arr.forEach(r=>{const v=r[key];if(v&&v!=='N/A') m[v]=(m[v]||0)+1})
  return Object.entries(m).map(([l,c])=>({l,c})).sort((a,b)=>b.c-a.c)
}

function buildBarChart(containerId, data, colorFn, onClick) {
  const el=$(containerId); if(!el) return
  const max=Math.max(...data.map(d=>d.c),1)
  el.innerHTML=data.map(d=>{
    const pct=Math.round((d.c/max)*100)
    const col=colorFn(d)
    return `<div class="bar-row" data-lbl="${d.l}">
      <div class="bar-lbl" title="${d.l}">${d.l}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${col}">${d.c}</div></div>
    </div>`
  }).join('')
  el.querySelectorAll('.bar-row').forEach(row=>{
    row.addEventListener('click',()=>{
      onClick(row.dataset.lbl)
    })
  })
}

function buildHistCard(container, field, vals) {
  const buckets={}
  vals.forEach(v=>{const b=Math.round(v*2)/2; buckets[b]=(buckets[b]||0)+1})
  const keys=Object.keys(buckets).map(Number).sort((a,b)=>a-b)
  const maxC=Math.max(...keys.map(k=>buckets[k]))

  const card=document.createElement('div'); card.className='hist-card'
  const cols=keys.map(k=>{
    const h=Math.max(4,Math.round((buckets[k]/maxC)*62))
    const active=S.chartFilter&&S.chartFilter.field===field.key&&S.chartFilter.value===k
    const dimmed=S.chartFilter&&S.chartFilter.field===field.key&&S.chartFilter.value!==k
    return `<div class="hcol" data-field="${field.key}" data-val="${k}" title="${field.label} = ${k}: ${buckets[k]} recipes">
      <div class="hbar${active?' active':''}${dimmed?' dimmed':''}" style="height:${h}px;background:${field.color}"></div>
      <div class="hlbl">${k>=0?'+':''||''}${k}</div>
    </div>`
  }).join('')

  card.innerHTML=`<h3>${field.label}</h3><div class="hist-inner">${cols}</div>`
  card.querySelectorAll('.hcol').forEach(col=>{
    col.addEventListener('click',e=>{
      e.stopPropagation()
      const f=col.dataset.field, v=parseFloat(col.dataset.val)
      if(S.chartFilter&&S.chartFilter.field===f&&S.chartFilter.value===v){
        S.chartFilter=null
      } else {
        S.chartFilter={field:f,value:v}
      }
      render()
      navigate('camera', 'recipes')
    })
  })

  container.appendChild(card)
}

function drawParallel() {
  const canvas=$('pcoords'); if(!canvas||!canvas.offsetParent) return
  const W=canvas.offsetWidth||800
  canvas.width=W; canvas.height=260
  const ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,W,260)
  const axes=[
    {key:'highlight',label:'Highlight',lo:-2,hi:4},
    {key:'shadow',label:'Shadow',lo:-2,hi:4},
    {key:'color',label:'Color',lo:-4,hi:4},
    {key:'sharpness',label:'Sharpness',lo:-4,hi:3},
    {key:'clarity',label:'Clarity',lo:-5,hi:5},
  ]
  const PAD=44,TOP=36,BOT=228
  const axX=axes.map((_,i)=>PAD+i*((W-PAD*2)/(axes.length-1)))
  ctx.strokeStyle='#2a2a30'; ctx.lineWidth=1
  axes.forEach((a,i)=>{
    ctx.beginPath();ctx.moveTo(axX[i],TOP);ctx.lineTo(axX[i],BOT);ctx.stroke()
    ctx.fillStyle='#9a9aaa';ctx.font='10px Inter,system-ui';ctx.textAlign='center'
    ctx.fillText(a.label,axX[i],TOP-10)
    ctx.fillStyle='#5e5e6e';ctx.font='9px Inter,system-ui'
    ctx.fillText(a.lo,axX[i],BOT+12);ctx.fillText(a.hi,axX[i],TOP+6)
  })
  const fr=new Set(filtered().map(r=>r.filename))
  function draw(arr,alpha){
    arr.forEach(r=>{
      const pts=axes.map((a,i)=>{
        const v=pn(r[a.key]);if(v===null)return null
        const ratio=(v-a.lo)/(a.hi-a.lo)
        return [axX[i],TOP+(1-ratio)*(BOT-TOP)]
      });if(pts.some(p=>!p))return
      const col=dc(r.color_direction)||'#9a9aaa'
      ctx.strokeStyle=col+(Math.round(alpha*255).toString(16).padStart(2,'0'))
      ctx.lineWidth=fr.has(r.filename)?1.5:1
      ctx.beginPath();pts.forEach((p,i)=>i===0?ctx.moveTo(...p):ctx.lineTo(...p));ctx.stroke()
    })
  }
  draw(activeRecipes(),0.06)
  draw(activeRecipes().filter(r=>fr.has(r.filename)),0.65)
}

// ══════════════════════════════════════════
// CLOUDS
// ══════════════════════════════════════════
function renderClouds() {
  buildCloud('cld-mood',activeRecipes().flatMap(r=>r.mood_keywords||[]),'mood')
  buildCloud('cld-scene',activeRecipes().flatMap(r=>r.scenario_keywords||[]),'scene')
  buildCloud('cld-era',activeRecipes().map(r=>r.era_reference).filter(e=>e&&e!=='none'),'era')
}

function buildCloud(id,words,fk){
  const el=$(id); const freq={}
  words.forEach(w=>{freq[w]=(freq[w]||0)+1})
  const maxF=Math.max(...Object.values(freq),1)
  el.innerHTML=Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([w,f])=>{
    const sz=11+Math.round((f/maxF)*15)
    return `<span class="cword" data-w="${w}" data-fk="${fk}" style="font-size:${sz}px">${w} <small>${f}</small></span>`
  }).join('')
  el.querySelectorAll('.cword').forEach(c=>{
    c.addEventListener('click',()=>{
      const w=c.dataset.w,fk=c.dataset.fk
      S.f[fk].has(w)?S.f[fk].delete(w):S.f[fk].add(w)
      c.classList.toggle('on'); render()
    })
  })
}

// ══════════════════════════════════════════
// DIRECTIONS
// ══════════════════════════════════════════
const DIRECTIONS=[
  {name:'Warm Analog Negative',color:'#e07842',desc:'The dominant aesthetic: Classic Negative or Nostalgic Neg. with warm pushes, rolled-off shadows, moderate clarity. The all-day workhorse of film-sim recipes.',
   traits:['Classic Neg / Nostalgic Neg','warm WB + shift','Color +1 to +3','Shadow −1 to −2'],
   match:r=>['Classic Negative','Nostalgic Neg.'].includes(r.film_simulation)&&recipeWarmth(r)==='warm'},
  {name:'Kodak Portrait / Color Negative',color:'#d4a843',desc:'Recipes emulating Kodak color negative films — Portra, Ultramax, Gold, Royal Gold. Classic Chrome base with neutral-warm tones, lifted blacks, controlled highlights.',
   traits:['Classic Chrome base','Portra / Ultramax / Gold emulation','neutral–warm'],
   match:r=>r.film_simulation==='Classic Chrome'&&(r.film_emulated||'').match(/kodak/i)&&!(r.film_emulated||'').match(/chrome|chrome64|kodachrome/i)},
  {name:'Kodachrome / Slide Positive',color:'#c8a030',desc:'Kodachrome emulations: vivid, sharp, high clarity. Characteristic blue-deficient WB shift, strong Color Chrome. The "postcard" look.',
   traits:['Classic Chrome','Kodachrome 25/64','warm-neutral','Clarity +2 to +4','WB shift warm'],
   match:r=>r.film_simulation==='Classic Chrome'&&(r.film_emulated||'').match(/kodachrome/i)},
  {name:'Punchy Slide / Velvia',color:'#e05c5c',desc:'Velvia-based or high-saturation recipes. Vivid color, high contrast, higher sharpness. Built for saturated outdoor scenes — landscape, nature, golden hour.',
   traits:['Velvia/Vivid','punchy / high-contrast','Color +3 to +4','landscape / nature'],
   match:r=>r.film_simulation==='Velvia/Vivid'||recipePunch(r)==='punchy'},
  {name:'Cool Cinematic / Eterna',color:'#5b9af0',desc:'Eterna Cinema or Eterna Bleach Bypass base. Low saturation, cool or cool-neutral cast, filmic highlight rolloff. Street photography and documentary staple.',
   traits:['Eterna / Eterna BB','cool or desaturated','filmic','street / documentary'],
   match:r=>(r.film_simulation||'').includes('Eterna')||(recipeWarmth(r)==='cool'&&(r.scenario_keywords||[]).some(s=>['street','urban','documentary','city'].includes(s)))},
  {name:'Vintage Faded / Expired Film',color:'#9b7fe8',desc:'Recipes chasing expired or old consumer film — faded palette, lifted blacks, warm color shift. 1960s–1980s era references are common. Nostalgic and dreamy.',
   traits:['1960s / 1970s / expired-film era','faded / muted','lifted shadows','nostalgic / dreamy'],
   match:r=>['expired-film','vintage','1960s','1970s','1980s'].includes(r.era_reference)||(r.mood_keywords||[]).some(m=>['faded','dreamy','nostalgic'].includes(m))},
  {name:'Low-Light / Night',color:'#4db8aa',desc:'Tuned for high ISO, artificial or fluorescent light. CineStill 800T and Natura 1600 live here. Often strong grain, pushed shadow.',
   traits:['ISO 6400+','night / fluorescent / indoor','gritty / cinematic'],
   match:r=>(r.scenario_keywords||[]).some(s=>['night','fluorescent','low-light','indoor'].includes(s))},
  {name:'Classic B&W',color:'#c0c0d0',desc:'Acros or Monochrome base. Tonal contrast over color. Split into Soft Tone (portrait) and Hard Tone (landscape/street) flavors in the collection.',
   traits:['Acros / Monochrome','desaturated / B&W','stark / dramatic'],
   match:r=>(r.film_simulation||'').match(/acros|monochrome/i)},
]

function renderDirections(){
  const grid=$('dir-grid'); grid.innerHTML=''
  if (activeGen === 'OM') {
    if (typeof renderOmDirections === 'function') return renderOmDirections()
    grid.innerHTML='<div class="empty">Directions analysis is not available for the OM recipe family yet.</div>'; return
  }
  DIRECTIONS.forEach(d=>{
    const members=activeRecipes().filter(d.match)
    const card=document.createElement('div'); card.className='dir-card'; card.style.borderLeftColor=d.color
    const links=members.slice(0,8).map(r=>`<span class="dir-link" data-name="${r.name}">${r.name}</span>`).join(', ')+(members.length>8?` +${members.length-8} more`:'')
    card.innerHTML=`<h4>${d.name}</h4><div class="dir-desc">${d.desc}</div>
    <div class="dir-traits">${d.traits.map(t=>`<span class="dir-trait">${t}</span>`).join('')}</div>
    <div class="dir-recipes"><strong style="color:var(--text2)">${members.length} recipes:</strong> ${links||'<em style="color:var(--text3)">none matched</em>'}</div>`
    grid.appendChild(card)
    card.querySelectorAll('.dir-link[data-name]').forEach(el => {
      el.addEventListener('click', () => goRecipe(el.dataset.name))
    })
  })
}
function goRecipe(name){navigate('camera', 'recipes');$('q').value=name;S.q=name;render()}

// ══════════════════════════════════════════
// CORRELATIONS
// ══════════════════════════════════════════
const FIELD_LABEL={highlight:'Highlight',shadow:'Shadow',color:'Color',sharpness:'Sharpness',clarity:'Clarity'}
const FIELD_COLOR_POS={highlight:'#e8c05a',shadow:'#e07842',color:'#4caf7d',sharpness:'#9b7fe8',clarity:'#4db8aa'}
const FIELD_COLOR_NEG={highlight:'#5b9af0',shadow:'#5b9af0',color:'#5b9af0',sharpness:'#5b9af0',clarity:'#5b9af0'}

function renderCorrelations(filterQ) {
  const grid=$('corr-grid'); grid.innerHTML=''
  if (activeGen === 'OM') {
    if (typeof renderOmCorrelations === 'function') return renderOmCorrelations(filterQ)
    grid.innerHTML='<div class="empty">Correlation analysis is not available for the OM recipe family yet.</div>'; return
  }
  const entries=Object.entries(CORR.correlations)
  const fq=(filterQ||'').toLowerCase()
  const shown=entries.filter(([kw])=>!fq||kw.includes(fq))

  // Max delta magnitude for scale
  let maxDelta=0
  entries.forEach(([,d])=>Object.values(d.deltas||{}).forEach(v=>{if(Math.abs(v)>maxDelta) maxDelta=Math.abs(v)}))
  maxDelta=Math.max(maxDelta,0.1)

  shown.forEach(([kw,data])=>{
    const card=document.createElement('div'); card.className='corr-card'
    const deltas=data.deltas||{}
    const fields=CORR.numeric_fields||['highlight','shadow','color','sharpness','clarity']

    // Insight: find strongest signal
    const strongest=fields.filter(f=>deltas[f]!=null).sort((a,b)=>Math.abs(deltas[b])-Math.abs(deltas[a]))[0]
    const insight=strongest?buildInsight(kw,strongest,deltas[strongest],data.means[strongest]):''

    const deltaRows=fields.map(f=>{
      const d=deltas[f]
      if(d==null) return ''
      const pct=Math.round(Math.abs(d)/maxDelta*46)
      const pos=d>0
      const barStyle=pos
        ?`left:50%;width:${pct}%;background:${FIELD_COLOR_POS[f]||'var(--orange)'}`
        :`right:50%;width:${pct}%;background:${FIELD_COLOR_NEG[f]||'var(--blue)'}`
      const sign=d>0?'+':''
      return `<div class="delta-row">
        <div class="delta-lbl">${FIELD_LABEL[f]||f}</div>
        <div class="delta-track">
          <div class="delta-center"></div>
          <div class="delta-bar ${pos?'delta-pos':'delta-neg'}" style="${barStyle}"></div>
        </div>
        <div class="delta-val" style="color:${pos?'var(--orange)':'var(--blue)'}">${sign}${d.toFixed(1)}</div>
      </div>`
    }).join('')

    const drPills=Object.entries(data.dr||{}).sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([k,v])=>`<span class="dr-pill">${k}: ${v}</span>`).join('')

    card.innerHTML=`
      <div class="corr-header">
        <div class="corr-kw">${kw}</div>
        <div class="corr-n">${data.count} recipes</div>
      </div>
      <div class="corr-sims">Often: ${(data.top_sims||[]).join(' · ')}</div>
      <div class="delta-bars">${deltaRows}</div>
      ${insight?`<div style="font-size:10px;color:var(--text3);margin-top:8px;font-style:italic;line-height:1.4">${insight}</div>`:''}
      <div class="dr-pills">${drPills}</div>`

    card.addEventListener('click',()=>{
      navigate('camera', 'recipes', 'keywords')
    })
    grid.appendChild(card)
  })

  if(!shown.length) grid.innerHTML='<div style="color:var(--text3);font-size:13px;padding:20px">No keywords matched.</div>'
}

function buildInsight(kw, field, delta, mean) {
  const sign=delta>0?'higher':'lower'
  const mag=Math.abs(delta)
  const desc={
    highlight: delta>0?'brighter highlight rolloff (lifted tones)':'crushed highlights (more contrast in highs)',
    shadow: delta>0?'lifted shadow floor (details in dark areas)':'deeper shadows / crushed blacks',
    color: delta>0?'pushed color saturation':'desaturated / muted color palette',
    sharpness: delta>0?'sharper rendering':'softer rendering (less edge accentuation)',
    clarity: delta>0?'higher local contrast / texture clarity':'reduced micro-contrast (smoother, creamier)',
  }
  if(mag<0.2) return ''
  return `<strong>${FIELD_LABEL[field]}</strong> is ${sign} than average (${delta>0?'+':''}${delta.toFixed(1)}): ${desc[field]||''}`
}

function syncChips(){
  document.querySelectorAll('.chip').forEach(c=>{
    const id=c.closest('.chips').id
    const fk=id.replace('f-','')
    c.classList.toggle('on',S.f[fk]?.has(c.dataset.v))
  })
}

// ══════════════════════════════════════════
// MASTER RENDER
// ══════════════════════════════════════════
function render(){
  renderGrid()
  // sync clouds active state
  document.querySelectorAll('.cword').forEach(c=>{
    const fk=c.dataset.fk; c.classList.toggle('on',S.f[fk]?.has(c.dataset.w))
  })
  syncChips()
  // refresh hist active state
  if(chartsBuilt){
    document.querySelectorAll('.hcol').forEach(c=>{
      const f=c.dataset.field,v=parseFloat(c.dataset.val)
      const isActive=S.chartFilter&&S.chartFilter.field===f&&S.chartFilter.value===v
      const isDimmed=S.chartFilter&&S.chartFilter.field===f&&!isActive
      c.querySelector('.hbar').classList.toggle('active',isActive)
      c.querySelector('.hbar').classList.toggle('dimmed',isDimmed)
    })
    requestAnimationFrame(drawParallel)
  }
}

// ══════════════════════════════════════════
// SAVE SLOTS
// ══════════════════════════════════════════

// Descriptions of what each film simulation contributes when you swap it in
const SIM_CHARACTER = {
  'Classic Negative':   'Faded greens, lifted shadows, distinctive teal/orange split — the most "filmic" of the negative sims',
  'Nostalgic Neg.':     'Warm magenta-leaning highlights, softer contrast than Classic Neg — portrait-flattering, golden-hour ready',
  'Classic Chrome':     'Desaturated, documentary, subdued reds/greens — closest to a pro color negative look',
  'Reala Ace':          'Neutral-leaning with accurate color rendition — clean, versatile, closest to "correct"',
  'PRO Neg. Hi':        'Higher contrast than Std, fine skin tones, slight highlight compression — portrait workhorse',
  'PRO Neg. Std':       'Flat, low-saturation base — maximum editing headroom, clean documentary',
  'Astia/Soft':         'Pastel-soft, gentle on skin tones, slightly pink-biased highlights',
  'Eterna/Cinema':      'Very low saturation, filmic highlight rolloff — the cinematic flat look',
  'Eterna Bleach Bypass': 'Desaturated, high-contrast silver-retention look — gritty and dramatic',
  'Velvia/Vivid':       'Punchy, oversaturated, high contrast — landscape and nature specialist',
  'Provia/STD':         'Neutral starting point, no strong character — clean base for all subjects',
  'Provia/Standard':    'Neutral starting point, no strong character — clean base for all subjects',
  'Acros':              'True B&W with grain simulation — superior tonal separation and sharpness',
  'Monochrome':         'Flat B&W, less contrast than Acros — good base for custom toning in post',
  'Sepia':              'Monochrome with warm brown tint — vintage print aesthetic',
}

// ══════════════════════════════════════════
// SETTINGS GUIDE
// ══════════════════════════════════════════
let settingsBuilt = false

const SETTINGS_DATA = [
  {
    section: 'Film Simulation',
    items: [
      {
        name: 'Film Simulation',
        subtitle: 'Base color science — the biggest single decision',
        icon: '🎞',
        iconBg: 'rgba(212,168,67,.18)',
        range: 'Fixed presets — no numeric scale',
        desc: 'Film Simulation is the foundation. Every other dial tweaks around this base; swapping the sim changes the entire color matrix, tone response, and shadow/highlight behavior. No other setting has this much leverage.',
        spectrum: null,
        spectrumLabel: null,
        effects: [
          { dir: 'up', label: 'Warmer / more contrasty sims', text: '<strong>Velvia, Eterna Vivid</strong> — saturated, punchy, elevated contrast. Colors pop but skin can go orange fast.' },
          { dir: 'up', label: 'Balanced sims', text: '<strong>Provia/Standard, PRO Neg. Hi/Std</strong> — accurate color, predictable tones. Excellent starting points for most shooting.' },
          { dir: 'down', label: 'Cinematic / desaturated sims', text: '<strong>Classic Chrome, Classic Negative, Nostalgic Neg.</strong> — lifted blacks, faded look, distinctive color splits. Filmic by default.' },
          { dir: 'down', label: 'Monochrome sims', text: '<strong>Acros, Monochrome</strong> — black and white at capture. Acros has built-in micro-contrast boost; use Yellow/Red/Green filter to shift luminosity.' },
        ],
        tip: 'In this recipe set, <strong>Classic Negative and Nostalgic Neg.</strong> are the most popular (cinematic, negative-film look). <strong>Velvia</strong> appears rarely — its saturation is extreme and leaves little room on the other dials.',
        presets: [],
        visual: {
          stops: [
            { label: 'Velvia', color: '#c0341a' },
            { label: 'Eterna Vivid', color: '#a83220' },
            { label: 'Provia', color: '#7a8a6a' },
            { label: 'Classic Chrome', color: '#4a6070' },
            { label: 'Classic Neg.', color: '#3d5a48' },
            { label: 'Acros', color: '#2a2a2a' },
          ]
        }
      }
    ]
  },
  {
    section: 'Color & Tone',
    items: [
      {
        name: 'Color',
        subtitle: 'Overall color saturation',
        icon: '🌈',
        iconBg: 'rgba(155,127,232,.18)',
        range: '−4 to +4 (0 = neutral)',
        desc: 'Scales the saturation of the entire image uniformly. Works multiplicatively with the film sim\'s built-in saturation — pushing Color on Velvia gives extreme results, while pushing it on Classic Chrome adds moderate punch.',
        spectrum: [
          { label: '−4', color: '#3a3a4a' },
          { label: '−2', color: '#555570' },
          { label: '0', color: '#6a7a8a' },
          { label: '+2', color: '#8a5a2a' },
          { label: '+4', color: '#c04010' },
        ],
        effects: [
          { dir: 'up', label: 'Higher (+2 to +4)', text: '<strong>Richer, more vivid colors.</strong> Greens deepen, blues intensify. Risky above +2 — skin can shift orange-red, and overcast skies look unnatural.' },
          { dir: 'down', label: 'Lower (−2 to −4)', text: '<strong>Muted, filmic, desaturated.</strong> Reduces color intensity without going B&W. Combined with Classic Chrome or Classic Negative gives a bleach-bypass-adjacent look.' },
        ],
        tip: 'Most recipes in this set cluster around <strong>+2</strong>. Recipes going −2 or lower are usually paired with desaturated sims (Classic Chrome, Classic Neg.) to double down on the muted aesthetic.',
        visual: {
          stops: [
            { label: '−4', color: '#4a4a5a', textLabel: '−4' },
            { label: '−2', color: '#6a6a7a', textLabel: '−2' },
            { label: '0', color: '#7a8898', textLabel: '0' },
            { label: '+2', color: '#a06840', textLabel: '+2' },
            { label: '+4', color: '#c04828', textLabel: '+4' },
          ]
        }
      },
      {
        name: 'Highlight',
        subtitle: 'Bright area tone compression / expansion',
        icon: '☀',
        iconBg: 'rgba(224,200,80,.18)',
        range: '−2 to +4 (step 0.5)',
        desc: 'Controls how the camera handles the upper tonal range (roughly the top 2 stops of the histogram). Negative values compress highlights — rolling them off gently to retain detail. Positive values boost brightness in that zone, making highlights punchier at the cost of blowout risk.',
        effects: [
          { dir: 'down', label: 'Negative (−0.5 to −2)', text: '<strong>Compressed, filmy highlights.</strong> Clouds stay white with detail. Skies don\'t blow. The "Fuji look" that makes JPEGs usable in bright sun.' },
          { dir: 'up', label: 'Positive (+1 to +4)', text: '<strong>Brighter, more luminous highlights.</strong> Useful for high-key portraits, intentional glow, or when shooting in flat/overcast light that needs lifting.' },
        ],
        tip: '<strong>−1 to −1.5</strong> is the most common setting across this recipe set. Going below −2 can make highlights look compressed and "flat" rather than naturally roll-off.',
        visual: {
          stops: [
            { label: '−2', color: '#3a4050', textLabel: '−2 compressed' },
            { label: '−1', color: '#566070', textLabel: '−1' },
            { label: '0', color: '#8090a0', textLabel: '0' },
            { label: '+2', color: '#c0d0e0', textLabel: '+2 boosted' },
          ]
        }
      },
      {
        name: 'Shadow',
        subtitle: 'Dark area lift / crush',
        icon: '🌑',
        iconBg: 'rgba(60,60,90,.5)',
        range: '−2 to +4 (step 0.5)',
        desc: 'Controls the lower tonal range (roughly the bottom 1–2 stops). Negative values crush blacks — deepening shadows, increasing apparent contrast. Positive values lift shadows, reducing contrast and revealing more detail in dark areas.',
        effects: [
          { dir: 'down', label: 'Negative (−0.5 to −2)', text: '<strong>Deep, crushed blacks.</strong> Increases perceived contrast dramatically. Creates the inky shadow look common in street and moody photography.' },
          { dir: 'up', label: 'Positive (+1 to +4)', text: '<strong>Lifted, open shadows.</strong> Reduces harsh contrast. Useful for portraits in backlit or high-contrast situations where you want face detail in shade.' },
        ],
        tip: 'Shadow and Highlight work as a pair. The classic "Fuji film" curve is <strong>Highlight −1 / Shadow −1</strong> — mild compression at both ends for a natural S-curve with soft roll-off.',
        visual: {
          stops: [
            { label: '−2', color: '#080810', textLabel: '−2 crushed' },
            { label: '−1', color: '#1a1a28', textLabel: '−1' },
            { label: '0', color: '#3a3a50', textLabel: '0' },
            { label: '+2', color: '#707090', textLabel: '+2 lifted' },
          ]
        }
      },
      {
        name: 'Clarity',
        subtitle: 'Mid-tone contrast / micro-contrast',
        icon: '🔬',
        iconBg: 'rgba(75,184,170,.15)',
        range: '−5 to +5',
        desc: 'Clarity adds or removes contrast specifically in the mid-tone frequencies — the edges between tones that give an image "pop" or "texture". It\'s distinct from Sharpness: Sharpness affects edge definition, Clarity affects the sense of three-dimensionality and subject separation.',
        effects: [
          { dir: 'up', label: 'Positive (+2 to +5)', text: '<strong>Punchy, textured, "HDR-adjacent" look.</strong> Landscapes and architecture gain presence. Can make skin look rough or unflattering on close portraits.' },
          { dir: 'down', label: 'Negative (−2 to −5)', text: '<strong>Soft, glowing, cinematic.</strong> Reduces micro-contrast across the frame. Flatters skin. Combined with negative Sharpness creates the smooth, analog-negative look common in film simulations.' },
        ],
        tip: 'The vast majority of recipes in this set use <strong>−2 to −4</strong> Clarity. Negative Clarity is a signature of the "Fuji film" aesthetic — it\'s what creates that smooth rendering.',
        visual: {
          stops: [
            { label: '−4', color: '#5a6878', textLabel: '−4 soft' },
            { label: '−2', color: '#687888', textLabel: '−2' },
            { label: '0', color: '#788898', textLabel: '0' },
            { label: '+2', color: '#8898a8', textLabel: '+2 textured' },
            { label: '+4', color: '#a0b0c0', textLabel: '+4 crisp' },
          ]
        }
      }
    ]
  },
  {
    section: 'Texture & Sharpness',
    items: [
      {
        name: 'Sharpness',
        subtitle: 'Edge contrast (aliasing-based sharpening)',
        icon: '🔪',
        iconBg: 'rgba(224,92,92,.15)',
        range: '−4 to +4',
        desc: 'Applies in-camera sharpening to edges. This is standard unsharp masking — it increases edge contrast by boosting the light side and darkening the dark side of every edge boundary. Positive values give crisp, defined edges. Negative values smooth them out for a softer, more analog character.',
        effects: [
          { dir: 'up', label: 'Positive (+1 to +4)', text: '<strong>Crisp, defined edges.</strong> Good for architecture, product, detailed landscapes. Can make hair or foliage look harsh or artificially sharpened at high values.' },
          { dir: 'down', label: 'Negative (−2 to −4)', text: '<strong>Smooth, film-like rendering.</strong> Edges are gentle. Combined with negative Clarity, this creates the hallmark smooth-yet-detailed look of classic film negatives.' },
        ],
        tip: 'Most recipes set Sharpness to <strong>−2 or lower</strong>. Unlike Lightroom sharpening, you can\'t undo in-camera sharpening in post — so erring negative is safer when shooting JPEG-only.',
        visual: {
          stops: [
            { label: '−4', color: '#6a7a8a', textLabel: '−4 soft' },
            { label: '−2', color: '#7a8a9a', textLabel: '−2' },
            { label: '0', color: '#8a9aaa', textLabel: '0' },
            { label: '+2', color: '#9aabba', textLabel: '+2 sharp' },
          ]
        }
      },
      {
        name: 'Grain Effect',
        subtitle: 'Simulated film grain',
        icon: '✦',
        iconBg: 'rgba(154,154,170,.15)',
        range: 'Off / Weak / Strong  ×  Small / Large',
        desc: 'Adds randomized luminance noise to simulate film grain. Two independent axes: amount (Weak/Strong) and size (Small/Large). Small grain is fine and regular like ISO 100–400 film. Large grain is chunky like pushed Tri-X or fast color negative. Grain is baked in — can\'t be removed in post from a JPEG.',
        effects: [
          { dir: 'up', label: 'Strong + Large', text: '<strong>Cinematic, reportage, pushed-film look.</strong> Very visible, aggressive texture. Best for B&W or high-contrast color. Adds energy and rawness.' },
          { dir: 'down', label: 'Weak + Small', text: '<strong>Subtle film texture without distraction.</strong> The "sweet spot" for most color film recipes — adds analog character without dominating the image.' },
        ],
        tip: 'Grain is most noticeable in smooth areas (skies, skin, out-of-focus backgrounds). Strong grain in shadows on a low-contrast film sim like Classic Chrome looks convincingly like real ISO 800 film.',
        visual: {
          stops: [
            { label: 'Off', color: '#4a5060', textLabel: 'Off' },
            { label: 'Weak S', color: '#525868', textLabel: 'Weak Sm' },
            { label: 'Weak L', color: '#5a6070', textLabel: 'Weak Lg' },
            { label: 'Strong S', color: '#626870', textLabel: 'Strong Sm' },
            { label: 'Strong L', color: '#6a7078', textLabel: 'Strong Lg' },
          ]
        }
      },
      {
        name: 'High ISO NR',
        subtitle: 'Noise reduction in high-ISO files',
        icon: '🌃',
        iconBg: 'rgba(91,154,240,.15)',
        range: '−4 to +4',
        desc: 'Controls how aggressively the camera applies chroma and luminance noise reduction to high-ISO files. The camera adjusts NR strength relative to ISO regardless of this setting — High ISO NR shifts the aggressiveness of that curve.',
        effects: [
          { dir: 'up', label: 'Positive (+1 to +4)', text: '<strong>Smeared, smooth, plastic-looking images at high ISO.</strong> Fine detail is lost. Colors in shadow become uniform blobs. Rarely desirable.' },
          { dir: 'down', label: 'Negative (−2 to −4)', text: '<strong>Gritty, noisy, film-like.</strong> Preserves micro-detail and grain structure. At −4, the camera applies almost no NR — what you see is the raw sensor noise.' },
        ],
        tip: 'Almost every recipe in this set uses <strong>−4</strong>. Fuji\'s Grain Effect adds back synthetic grain, so the combination of −4 NR + Grain gives: real sensor texture + analog-shaped grain on top. Using +2 NR with Grain enabled is contradictory — you\'d be erasing real noise then painting fake noise back.',
        visual: {
          stops: [
            { label: '−4 raw', color: '#3a3a4a', textLabel: '−4 raw noise' },
            { label: '−2', color: '#485060', textLabel: '−2' },
            { label: '0', color: '#607080', textLabel: '0' },
            { label: '+2', color: '#8090a0', textLabel: '+2 smoothed' },
            { label: '+4 smooth', color: '#a0b0c0', textLabel: '+4 plastic' },
          ]
        }
      }
    ]
  },
  {
    section: 'Color Chrome Effects',
    items: [
      {
        name: 'Color Chrome Effect',
        subtitle: 'Richness / depth in saturated colors',
        icon: '🎨',
        iconBg: 'rgba(224,120,66,.18)',
        range: 'Off / Weak / Strong',
        desc: 'A Fujifilm-exclusive algorithm that adds tonal gradation and saturation depth specifically in highly saturated areas. Unlike the Color dial (which scales all colors), Color Chrome Effect targets only colors that are already very saturated and adds subtle tonal variation within them — so red roses don\'t go flat-red, they show variation from coral to deep crimson.',
        effects: [
          { dir: 'up', label: 'Strong', text: '<strong>Rich, deep, chromatic saturation in already-vivid areas.</strong> Reds, oranges, and yellows gain the most. Film-like richness in foliage, fabric, and autumn colors. Can shift hue slightly in extreme cases.' },
          { dir: 'down', label: 'Off', text: '<strong>Flat, uniform saturation.</strong> Vivid colors look painted-on rather than having depth. Noticeable in red subjects and deep-green foliage.' },
        ],
        tip: 'Strong is used in the majority of recipes regardless of film sim. Think of it as the "depth pass" — it\'s subtle in isolation but you\'ll notice flatness immediately when you turn it off.',
        visual: {
          stops: [
            { label: 'Off', color: '#c04828', textLabel: 'Off — flat red' },
            { label: 'Weak', color: '#a84030', textLabel: 'Weak' },
            { label: 'Strong', color: '#902830', textLabel: 'Strong — deep' },
          ]
        }
      },
      {
        name: 'Color Chrome FX Blue',
        subtitle: 'Saturation depth specifically in blues',
        icon: '🌊',
        iconBg: 'rgba(91,154,240,.18)',
        range: 'Off / Weak / Strong',
        desc: 'Same algorithm as Color Chrome Effect but isolated to blues and blue-adjacent cyans. Independently controllable so you can have deep, chromatic blues while keeping reds and greens at a different level. Critical for sky and ocean photography.',
        effects: [
          { dir: 'up', label: 'Strong', text: '<strong>Deep, saturated blues with internal variation.</strong> Sky goes from flat cyan-blue to rich, gradient-looking blue. Ocean and water scenes gain depth. Blue shadows in shade look more "Velvia-like".' },
          { dir: 'down', label: 'Off', text: '<strong>Flat, uniform blue.</strong> Clear skies look like a color fill. Fine if you want a clean, graphic look or are shooting under overcast where there\'s no blue to speak of.' },
        ],
        tip: 'In this recipe set, recipes with Weak or Strong CCFXBlue tend to be landscape/travel-oriented. Portrait-focused recipes more often use Off or Weak since strong blue can shift the color of blue veins in skin.',
        visual: {
          stops: [
            { label: 'Off', color: '#4488cc', textLabel: 'Off — flat' },
            { label: 'Weak', color: '#3366aa', textLabel: 'Weak' },
            { label: 'Strong', color: '#1a4488', textLabel: 'Strong — deep' },
          ]
        }
      }
    ]
  },
  {
    section: 'White Balance & WB Shift',
    items: [
      {
        name: 'White Balance',
        subtitle: 'Base color temperature of the image',
        icon: '🌡',
        iconBg: 'rgba(212,168,67,.18)',
        range: 'Auto / Daylight / Shade / Kelvin / Fluorescent 1–3 / Incandescent / Underwater',
        desc: 'Sets the global color temperature interpretation. Auto reads the scene; fixed presets apply a constant shift. Many creative recipes intentionally use "wrong" white balance — Incandescent under daylight gives a strong blue cast; Daylight under tungsten gives amber warmth.',
        effects: [
          { dir: 'up', label: 'Warmer settings (Shade, Incandescent in daylight)', text: '<strong>Golden/amber cast.</strong> Shade (~6500K) warms everything up — makes portraits look "golden hour" even at noon. Incandescent under natural light gives a strong warm amber film look.' },
          { dir: 'down', label: 'Cooler settings (Daylight, Kelvin low, Fluorescent)', text: '<strong>Blue/cyan cast.</strong> Daylight under tungsten light produces cold, moody blues. Fluorescent modes under actual daylight can give a green-tinted, gritty urban feel.' },
        ],
        tip: 'WB is the coarsest color tool. Use it for intentional creative direction; the WB Shift dials then fine-tune within that.',
        visual: {
          stops: [
            { label: 'Tungsten ~3200K', color: '#c07030', textLabel: 'warm' },
            { label: 'Daylight ~5500K', color: '#a09060', textLabel: 'daylight' },
            { label: 'Shade ~6500K', color: '#8090a0', textLabel: 'shade' },
            { label: 'Fluorescent ~7000K', color: '#607090', textLabel: 'cool' },
          ]
        }
      },
      {
        name: 'WB Shift (Red / Blue)',
        subtitle: 'Fine color tint on top of white balance',
        icon: '↔',
        iconBg: 'rgba(224,120,150,.18)',
        range: 'R: −9 to +9  /  B: −9 to +9',
        desc: 'Two-axis color tint shift applied on top of the base white balance. Red axis pushes warm/cool (magenta shift in red); Blue axis pushes yellow-blue. The two axes are complementary (not exactly the same as a Lightroom Tint dial) and can be combined to hit specific emulsion-like color bias without changing the base WB.',
        effects: [
          { dir: 'up', label: 'R positive (+3 to +9)', text: '<strong>Warm, reddish, sunset-like.</strong> Skin picks up warmth. Shadows shift toward amber. Most "golden hour" recipes use R+3 to +5 combined with a warm WB.' },
          { dir: 'down', label: 'R negative (−3 to −9)', text: '<strong>Cool, teal, cinematic.</strong> Removes red warmth. Combined with blue shadows, creates the teal-and-orange look if Color Chrome is also active.' },
          { dir: 'up', label: 'B positive (+3 to +9)', text: '<strong>Blue, cold, frosty.</strong> Skies go deeper blue. Shadows shift toward blue-purple. Used in "moonlight" and cold-weather recipes.' },
          { dir: 'down', label: 'B negative (−3 to −9)', text: '<strong>Yellow/green tint.</strong> Classic expired film look, or the yellow-tinted quality of old 1970s prints. Often combined with R positive to get an amber-yellow overall cast.' },
        ],
        tip: 'The combination <strong>R+3 / B−4</strong> is essentially a "Kodak Ultramax" approximation — pushes the yellow-amber warmth of that emulsion. <strong>R−3 / B+3</strong> mimics the cooler, slightly blue-shadows look of Kodak Portra in shade.',
        visual: {
          stops: [
            { label: 'R−9 B+9', color: '#203888', textLabel: 'very cool' },
            { label: 'R−3 B+3', color: '#3a5890', textLabel: 'cool' },
            { label: 'R0 B0', color: '#607080', textLabel: 'neutral' },
            { label: 'R+3 B−3', color: '#907040', textLabel: 'warm' },
            { label: 'R+6 B−6', color: '#b06020', textLabel: 'very warm' },
          ]
        }
      }
    ]
  },
  {
    section: 'Exposure & Dynamic Range',
    items: [
      {
        name: 'Dynamic Range',
        subtitle: 'In-camera highlight recovery via ISO boost',
        icon: '📊',
        iconBg: 'rgba(76,175,125,.18)',
        range: 'DR100 / DR200 / DR400 / Auto',
        desc: 'Fujifilm\'s Dynamic Range expansion works by underexposing the sensor by 1 stop (DR200) or 2 stops (DR400) then pushing midtones in the JPEG processing to compensate — net result is preserved highlights that would otherwise clip. DR400 requires a minimum ISO of 800 (the camera enforces this automatically).',
        effects: [
          { dir: 'up', label: 'DR400', text: '<strong>Maximum highlight retention.</strong> Effectively gives 2 extra stops of headroom above middle grey. Critical for backlit subjects, shooting toward windows, high-contrast midday sun. The trade-off: shadows and midtones may look slightly "lifted" or milky since the underexposed base requires more JPEG processing.' },
          { dir: 'down', label: 'DR100 (off)', text: '<strong>Full exposure, no recovery.</strong> Cleanest tonal rendering at low ISO. Correct choice for flat/overcast light, studio, or whenever the scene has no extreme highlights.' },
        ],
        tip: 'DR400 is the default in most recipes here — it\'s a safety net, not a look. Switching from DR400 to DR100 in the same recipe will noticeably "deepen" the image (less lifted shadows, richer blacks) at the cost of highlight risk.',
        visual: {
          stops: [
            { label: 'DR100', color: '#2a3a4a', textLabel: 'DR100 — full exp.' },
            { label: 'DR200', color: '#3a5060', textLabel: 'DR200 +1 stop' },
            { label: 'DR400', color: '#506878', textLabel: 'DR400 +2 stops' },
          ]
        }
      },
      {
        name: 'ISO',
        subtitle: 'Sensor sensitivity — base noise floor',
        icon: '⚡',
        iconBg: 'rgba(224,200,80,.15)',
        range: '160–12800 (X-Trans V base: ISO 125 or 160 depending on sim)',
        desc: 'ISO controls the amplification of the sensor signal. Higher ISO = more noise, more grain, less shadow detail. Recipes specify ISO Max (Auto, where the camera won\'t exceed that value) rather than a fixed ISO — because DR400 forces a minimum of ISO 800 regardless of this setting.',
        effects: [
          { dir: 'up', label: 'ISO 3200–12800 max', text: '<strong>Usable in very low light but with visible grain/noise.</strong> X-Trans V handles ISO 3200 well in color; 6400+ starts showing chroma noise that High ISO NR at −4 will leave in (intentionally).' },
          { dir: 'down', label: 'ISO 400–800 max', text: '<strong>Cleaner files, confined to bright-light shooting.</strong> Appropriate if the recipe is designed for outdoor/sunny use and you want the cleanest color saturation.' },
        ],
        tip: 'Most recipes set Auto ISO Max to <strong>6400</strong> — a practical ceiling where X-Trans V still looks good at −4 NR. If you\'re shooting indoor low-light and the recipe tops out at 3200, you\'ll get underexposure. Bump the ceiling when needed; it doesn\'t change the look, just the low-light behavior.',
        visual: {
          stops: [
            { label: '160', color: '#4a5870', textLabel: 'ISO 160 clean' },
            { label: '800', color: '#506070', textLabel: 'ISO 800' },
            { label: '3200', color: '#486070', textLabel: 'ISO 3200' },
            { label: '6400', color: '#405868', textLabel: 'ISO 6400' },
            { label: '12800', color: '#384850', textLabel: 'ISO 12800 noisy' },
          ]
        }
      },
      {
        name: 'Exposure Compensation',
        subtitle: 'Overall brightness offset from metering',
        icon: '+/−',
        iconBg: 'rgba(212,168,67,.12)',
        range: 'Typically −1 to +1 (range per recipe is a recommendation, not a lock)',
        desc: 'Not a fixed camera setting — it\'s a recommended operating range in each recipe. Recipes that are designed for overexposed-film aesthetics recommend +1/3 to +2/3. Recipes for moody/dark work recommend −1/3 to −2/3. The film simulation and tonal settings are calibrated around this expected offset.',
        effects: [
          { dir: 'up', label: 'Positive (+1/3 to +1)', text: '<strong>Brighter exposure, lifted midtones, more detail in shadows.</strong> Mimics the "expose to the right" philosophy of color negative film — err on the side of overexposure for latitude.' },
          { dir: 'down', label: 'Negative (−1/3 to −1)', text: '<strong>Darker, moodier, richer shadows.</strong> Typical for urban/night recipes where pure black in shadows is desirable. Also reduces the risk of highlight blowout in contrasty scenes.' },
        ],
        tip: 'Treat recipe EC ranges as a starting guide, not a hard rule. Your actual scene metering matters more. The range tells you the designer\'s intent — "I calibrated this at +1/3" means overexposing slightly was expected when the recipe was built.',
        visual: {
          stops: [
            { label: '−1', color: '#1a2030', textLabel: '−1 dark' },
            { label: '−1/3', color: '#2a3040', textLabel: '−1/3' },
            { label: '0', color: '#485060', textLabel: '0 metered' },
            { label: '+1/3', color: '#687888', textLabel: '+1/3' },
            { label: '+1', color: '#8090a0', textLabel: '+1 bright' },
          ]
        }
      }
    ]
  }
]

function buildSgCard(item) {
  const div = document.createElement('div')
  div.className = 'sg-card'

  // Visual gradient
  let visualHtml = ''
  if (item.visual && item.visual.stops) {
    const w = 100 / item.visual.stops.length
    const stopsHtml = item.visual.stops.map(s =>
      `<div class="sg-spectrum-stop" style="background:${s.color};flex:1">${s.label}</div>`
    ).join('')
    visualHtml = `
      <div class="sg-visual">
        <div style="display:flex;width:100%;height:100%">${stopsHtml}</div>
      </div>`
  }

  // Effects
  const effectsHtml = item.effects.map(e => `
    <div class="sg-effect-row">
      <div class="sg-effect-dir ${e.dir}">${e.dir === 'up' ? '▲' : '▼'}</div>
      <div class="sg-effect-text">${e.text}</div>
    </div>`
  ).join('')

  // Recipe usage stats
  let usageHtml = ''
  if (item.name === 'Color') {
    const buckets = {'-4 to -2': 0, '-1 to -0.5': 0, '0': 0, '+0.5 to +1': 0, '+2 to +4': 0}
    activeRecipes().forEach(r => {
      const v = parseFloat(r.color)
      if (!isNaN(v)) {
        if (v <= -2) buckets['-4 to -2']++
        else if (v < 0) buckets['-1 to -0.5']++
        else if (v === 0) buckets['0']++
        else if (v <= 1) buckets['+0.5 to +1']++
        else buckets['+2 to +4']++
      }
    })
    const total = activeRecipes().length
    const parts = Object.entries(buckets).map(([k,v]) =>
      `<span class="sg-preset ${v > 20 ? 'hi' : v > 10 ? 'neu' : 'lo'}">${k}: ${v} recipes (${Math.round(v/total*100)}%)</span>`
    ).join('')
    usageHtml = `<div class="sg-recipes-note"><strong>Distribution across ${total} recipes:</strong><div class="sg-presets" style="margin-top:5px">${parts}</div></div>`
  } else if (item.name === 'Dynamic Range') {
    const drCounts = {}
    activeRecipes().forEach(r => { const v = r.dynamic_range||'?'; drCounts[v] = (drCounts[v]||0)+1 })
    const total = activeRecipes().length
    const parts = Object.entries(drCounts).sort((a,b)=>b[1]-a[1]).map(([k,v]) =>
      `<span class="sg-preset ${k==='DR400'?'hi':k==='DR100'?'lo':'neu'}">${k}: ${v} (${Math.round(v/total*100)}%)</span>`
    ).join('')
    usageHtml = `<div class="sg-recipes-note"><strong>In this recipe set:</strong><div class="sg-presets" style="margin-top:5px">${parts}</div></div>`
  } else if (item.name === 'High ISO NR') {
    const nrCounts = {}
    activeRecipes().forEach(r => { const v = String(r.high_iso_nr||'?'); nrCounts[v] = (nrCounts[v]||0)+1 })
    const total = activeRecipes().length
    const parts = Object.entries(nrCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v]) =>
      `<span class="sg-preset ${parseFloat(k)<0?'lo':'hi'}">${k}: ${v} recipes</span>`
    ).join('')
    usageHtml = `<div class="sg-recipes-note"><strong>In this recipe set:</strong><div class="sg-presets" style="margin-top:5px">${parts}</div></div>`
  } else if (item.name === 'Sharpness') {
    const sh = {}
    activeRecipes().forEach(r => { const v = String(r.sharpness??'?'); sh[v] = (sh[v]||0)+1 })
    const total = activeRecipes().length
    const parts = Object.entries(sh).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v]) =>
      `<span class="sg-preset ${parseFloat(k)<0?'lo':parseFloat(k)>0?'hi':'neu'}">${k>0?'+':''}${k}: ${v}</span>`
    ).join('')
    usageHtml = `<div class="sg-recipes-note"><strong>In this recipe set:</strong><div class="sg-presets" style="margin-top:5px">${parts}</div></div>`
  }

  div.innerHTML = `
    <div class="sg-card-head">
      <div class="sg-icon" style="background:${item.iconBg}">${item.icon}</div>
      <div>
        <div class="sg-name">${item.name}</div>
        <div class="sg-subtitle">${item.subtitle}</div>
        <div class="sg-range">${item.range}</div>
      </div>
    </div>
    <div class="sg-body">
      <div class="sg-desc">${item.desc}</div>
      ${visualHtml}
      <div class="sg-effects">${effectsHtml}</div>
      <div class="sg-tip"><strong>In context:</strong> ${item.tip}</div>
      ${usageHtml}
    </div>`

  return div
}

function renderSettingsGuide() {
  const container = $('sg-grid')
  if (activeGen === 'OM') {
    settingsBuilt = false
    if (typeof renderOmSettingsGuide === 'function') return renderOmSettingsGuide()
    container.innerHTML = '<div class="empty">Settings Guide is not available for the OM recipe family yet.</div>'; return
  }
  if (settingsBuilt) return
  settingsBuilt = true

  container.innerHTML = ''

  SETTINGS_DATA.forEach(section => {
    const secDiv = document.createElement('div')

    const cardsDiv = document.createElement('div')
    cardsDiv.className = 'sg-cards'
    section.items.forEach(item => cardsDiv.appendChild(buildSgCard(item)))

    secDiv.innerHTML = `<div class="sg-section-title">${section.section}</div>`
    secDiv.appendChild(cardsDiv)
    container.appendChild(secDiv)
  })

}

// ══════════════════════════════════════════
// EXPLORE TAB
// ══════════════════════════════════════════

const T = {
  seedName: null,
  film_sim_filter: '',
  highlight: 0, shadow: 0,
  color: 0,
  color_chrome_effect: 0,
  color_chrome_fx_blue: 0,
  sharpness: 0, clarity: 0, high_iso_nr: 0,
  dynamic_range: 100,
  grain_effect: 0,
  grain_size: 'S',
  white_balance: 'Daylight',
  wb_shift_red: 0, wb_shift_blue: 0,
}

const T_PARAMS = [
  {key:'highlight',            label:'HL',  lo:-2, hi:4,   step:0.5},
  {key:'shadow',               label:'SH',  lo:-2, hi:4,   step:0.5},
  {key:'color',                label:'COL', lo:-4, hi:4,   step:1  },
  {key:'color_chrome_effect',  label:'CCE', lo:0,  hi:2,   step:1  },
  {key:'color_chrome_fx_blue', label:'CCB', lo:0,  hi:2,   step:1  },
  {key:'sharpness',            label:'SHP', lo:-4, hi:4,   step:1  },
  {key:'clarity',              label:'CL',  lo:-5, hi:5,   step:1  },
  {key:'high_iso_nr',          label:'NR',  lo:-4, hi:4,   step:1  },
  {key:'dynamic_range',        label:'DR',  lo:100,hi:400, step:100},
]

function tNorm(p, v) {
  const extent = Math.max(Math.abs(p.lo), Math.abs(p.hi))
  return clamp((v + extent) / (2 * extent), 0, 1)
}

function recipeToT(r) {
  const ccMap = {'Off':0,'Weak':1,'Strong':2}
  const drMap = {'DR100':100,'DR200':200,'DR400':400}
  const ge = r.grain_effect || 'Off'
  const geStr = ge.split(',')[0].trim()
  const geSize = ge.includes('Large') ? 'L' : 'S'
  return {
    seedName: r.name,
    film_sim_filter: '',
    highlight:            pn(r.highlight) ?? 0,
    shadow:               pn(r.shadow)    ?? 0,
    color:                pn(r.color)     ?? 0,
    color_chrome_effect:  ccMap[r.color_chrome_effect]  ?? 0,
    color_chrome_fx_blue: ccMap[r.color_chrome_fx_blue] ?? 0,
    sharpness:            pn(r.sharpness) ?? 0,
    clarity:              pn(r.clarity)   ?? 0,
    high_iso_nr:          pn(r.high_iso_nr) ?? 0,
    dynamic_range:        drMap[r.dynamic_range] ?? (pn(r.dynamic_range) ?? 100),
    grain_effect:         ccMap[geStr] ?? 0,
    grain_size:           geSize,
    white_balance:        r.white_balance || 'Daylight',
    wb_shift_red:         pn(r.wb_shift_red)  ?? 0,
    wb_shift_blue:        pn(r.wb_shift_blue) ?? 0,
  }
}

function computeSimilarity(t) {
  let pool = activeRecipes()
  if (t.film_sim_filter) pool = pool.filter(r => r.film_simulation === t.film_sim_filter)
  return pool.map(r => {
    const rt = recipeToT(r)
    let sum = 0
    T_PARAMS.forEach(p => {
      const d = tNorm(p, t[p.key]) - tNorm(p, rt[p.key])
      sum += d * d
    })
    const dR = (t.wb_shift_red  - rt.wb_shift_red)  / 18
    const dB = (t.wb_shift_blue - rt.wb_shift_blue) / 18
    sum += dR * dR + dB * dB
    const gs = t.grain_size !== rt.grain_size ? 0.25 : 0
    sum += gs
    return { r, dist: Math.sqrt(sum) }
  }).sort((a, b) => a.dist - b.dist).map(x => x.r)
}

function seedRecipe(name) {
  if (!name) {
    Object.assign(T, {
      seedName:null, film_sim_filter:'',
      highlight:0, shadow:0, color:0,
      color_chrome_effect:0, color_chrome_fx_blue:0,
      sharpness:0, clarity:0, high_iso_nr:0, dynamic_range:100,
      grain_effect:0, grain_size:'S',
      white_balance:'Daylight', wb_shift_red:0, wb_shift_blue:0,
    })
  } else {
    const r = activeRecipes().find(x => x.name === name)
    if (r) Object.assign(T, recipeToT(r))
  }
  syncExploreControls()
  renderExploreResults()
  updateExploreViews()
}

let exploreBuilt = false

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
  navigate('camera', 'compare')
}

function initCompare() {
  if (activeGen === 'OM') {
    compareBuilt = false
    if (typeof initOmCompare === 'function') return initOmCompare()
    const shell = document.getElementById('cmp-shell')
    if (shell) shell.innerHTML = '<div class="cmp-empty">Compare is not available for the OM recipe family yet.</div>'
    return
  }
  if (compareBuilt) { syncCmpSelects(); renderCompare(); return }
  compareBuilt = true

  const shell = document.getElementById('cmp-shell')
  shell.innerHTML = ''

  // Header: two selects + swap + clear
  const header = document.createElement('div')
  header.className = 'cmp-header'

  const sortedNames = activeRecipes().map(r => r.name).slice().sort()

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
    if (!C.a || !C.b) return
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

  document.getElementById('cmp-sel-a').addEventListener('change', e => {
    C.a = activeRecipes().find(r => r.name === e.target.value) || null
    renderCompare()
  })
  document.getElementById('cmp-sel-b').addEventListener('change', e => {
    C.b = activeRecipes().find(r => r.name === e.target.value) || null
    renderCompare()
  })
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
  // OM owns a different shell (#omcmp-content), so dispatch before touching Fuji nodes.
  if (activeGen === 'OM') {
    if (typeof renderOmCompare === 'function') return renderOmCompare()
  }
  const content = document.getElementById('cmp-content')
  if (!content) return
  content.innerHTML = ''
  if (activeGen === 'OM') {
    content.innerHTML = '<div class="cmp-empty">Compare is not available for the OM recipe family yet.</div>'
    return
  }
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
  div.innerHTML = `<span class="cmp-sim-name">${r.name}</span><span class="badge b-sim" style="flex-shrink:0">${r.film_simulation||'?'}</span><span class="badge ${warmthClass(r)}" style="flex-shrink:0">${recipeWarmth(r)}</span><span class="badge ${punchClass(r)}" style="flex-shrink:0">${recipePunch(r)}</span>`
  div.addEventListener('click', () => openRecipeModal(r.name))
  return div
}

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
    badges.innerHTML = `<span class="badge b-sim">${r.film_simulation||'?'}</span><span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span><span class="badge ${punchClass(r)}">${recipePunch(r)}</span>`
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
  const thead = document.createElement('thead')
  thead.innerHTML = `<tr><th style="text-align:left;padding:4px 6px;font-size:10px;color:var(--text3)">Param</th><th style="color:#d4a843;padding:4px 6px;font-size:10px">A</th><th style="padding:4px 6px;font-size:10px;color:var(--text3)"></th><th style="color:#5b9af0;padding:4px 6px;font-size:10px;text-align:right">B</th></tr>`
  tbl.appendChild(thead)

  const tbody = document.createElement('tbody')
  addRow(tbody, 'Film Sim',    C.a.film_simulation,   C.b.film_simulation)
  addRow(tbody, 'WB Mode',     ta.white_balance,       tb.white_balance)
  addRow(tbody, 'DR',          ta.dynamic_range,       tb.dynamic_range)
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

let yoursVisible = true, matchVisible = true

let _expOverlayTimer = null
function renderExploreResults() {
  const list = document.getElementById('exp-results-list')
  if (!list) return
  const top6 = computeSimilarity(T).slice(0, 6)
  list.innerHTML = ''
  top6.forEach(r => {
    const rt = recipeToT(r)
    const card = document.createElement('div')
    card.className = 'exp-result-card'
    // Diff badges — only params that differ
    const diffBadges = T_PARAMS.filter(p => {
      return Math.abs(T[p.key] - rt[p.key]) >= p.step * 0.5
    }).map(p => {
      const d = rt[p.key] - T[p.key]
      const cls = d > 0 ? 'pos' : 'neg'
      const sign = d > 0 ? '+' : ''
      return `<span class="exp-delta ${cls}">${p.label} ${sign}${d}</span>`
    }).join('')
    const wbDiffs = []
    const dR = rt.wb_shift_red  - T.wb_shift_red
    const dB = rt.wb_shift_blue - T.wb_shift_blue
    if (Math.abs(dR) >= 1) wbDiffs.push(`<span class="exp-delta ${dR>0?'pos':'neg'}">WB R ${dR>0?'+':''}${dR}</span>`)
    if (Math.abs(dB) >= 1) wbDiffs.push(`<span class="exp-delta ${dB>0?'pos':'neg'}">WB B ${dB>0?'+':''}${dB}</span>`)
    if (rt.white_balance && rt.white_balance !== T.white_balance) {
      wbDiffs.push(`<span class="exp-delta neg">WB ${rt.white_balance}</span>`)
    }
    let grainSizeDiff = ''
    if (rt.grain_size !== T.grain_size) {
      grainSizeDiff = `<span class="exp-delta neg">Grain Size ${rt.grain_size}</span>`
    }
    const allDiffs = diffBadges + wbDiffs.join('') + grainSizeDiff

    const kws = [...(r.mood_keywords||[]).slice(0,3), ...(r.scenario_keywords||[]).slice(0,2)]
      .map(k=>`<span class="exp-kw">${k}</span>`).join('')

    card.innerHTML = `
      <div class="exp-mini-fp">${fingerprint(r)}</div>
      <div class="exp-result-info">
        <div class="exp-result-name">${r.name}</div>
        <div class="exp-result-badges">
          <span class="badge b-sim">${r.film_simulation||'?'}</span>
          <span class="badge ${warmthClass(r)}">${recipeWarmth(r)}</span>
          <span class="badge ${punchClass(r)}">${recipePunch(r)}</span>
        </div>
        ${allDiffs?`<div class="exp-diff-row">${allDiffs}</div>`:''}
        ${kws?`<div class="exp-kws">${kws}</div>`:''}
      </div>`
    card.addEventListener('click', () => openRecipeModal(r.name))
    const expCmpBtn = document.createElement('button')
    expCmpBtn.className = 'cmp-card-btn'
    expCmpBtn.dataset.recipe = r.name
    expCmpBtn.textContent = 'Compare'
    if (compareSlots[0] && compareSlots[0].name === r.name) { expCmpBtn.textContent = 'A ✕'; expCmpBtn.className = 'cmp-card-btn slot-a' }
    if (compareSlots[1] && compareSlots[1].name === r.name) { expCmpBtn.textContent = 'B ✕'; expCmpBtn.className = 'cmp-card-btn slot-b' }
    expCmpBtn.style.cssText = 'margin-top:4px;display:block'
    expCmpBtn.addEventListener('click', e => { e.stopPropagation(); onCompareCardClick(r) })
    card.querySelector('.exp-result-info').appendChild(expCmpBtn)
    list.appendChild(card)
  })
  // Update overlay to show closest match
  clearTimeout(_expOverlayTimer)
  _expOverlayTimer = setTimeout(updateRadarOverlay, 0)
}
function svgPill(x, y, text, strokeColor, bgColor, textColor) {
  const w = Math.max(text.length * 5.5 + 8, 22)
  return `<rect x="${x - w/2}" y="${y}" width="${w}" height="14" rx="4" fill="${bgColor}" stroke="${strokeColor}" stroke-width="1"/>` +
         `<text x="${x}" y="${y + 10}" text-anchor="middle" font-size="9" fill="${textColor}" font-family="Inter,sans-serif" font-weight="700">${text}</text>`
}

function updateRadarOverlay() {
  const svg = document.getElementById('exp-radar-svg')
  if (!svg) return

  const N = 5
  const cx = 130, cy = 125, R = 80
  const AXES = T_PARAMS.slice(0, 5)

  function ang(i) { return (2 * Math.PI * i / N) - Math.PI / 2 }
  function unitVec(i) { return [Math.cos(ang(i)), Math.sin(ang(i))] }
  function axisPoint(val, p, i) {
    const r = tNorm(p, val) * R
    const [ux, uy] = unitVec(i)
    return [cx + r * ux, cy + r * uy]
  }

  const closest = computeSimilarity(T)[0]
  const rt = closest ? recipeToT(closest) : null

  // Build dynamic layer HTML
  let html = ''

  // Ghost polygon — closest match
  if (rt) {
    const gpts = AXES.map((p, i) => axisPoint(rt[p.key] ?? 0, p, i).join(',')).join(' ')
    html += `<polygon id="exp-radar-match" points="${gpts}" fill="rgba(91,154,240,.08)" stroke="#5b9af0" stroke-width="1.6" stroke-dasharray="5,3"/>`
  }

  // Your polygon
  const tpts = AXES.map((p, i) => axisPoint(T[p.key] ?? 0, p, i).join(',')).join(' ')
  html += `<polygon id="exp-radar-yours" points="${tpts}" fill="rgba(212,168,67,.15)" stroke="#d4a843" stroke-width="2.2"/>`

  // Diamond handles + value pills
  AXES.forEach((p, i) => {
    const [hx, hy] = axisPoint(T[p.key] ?? 0, p, i)
    const s = 4
    const dpts = `${hx},${hy-s} ${hx+s},${hy} ${hx},${hy+s} ${hx-s},${hy}`
    html += `<polygon class="radar-handle" data-idx="${i}" points="${dpts}" fill="#d4a843" stroke="#0d0d0f" stroke-width="1.2" style="cursor:grab"/>`
    // Value pill beside handle
    const [ux, uy] = unitVec(i)
    const px = hx + ux * 8, py = hy + uy * 8
    const val = T[p.key]
    const valTxt = (val > 0 ? '+' : '') + val
    html += svgPill(px, py - 7, valTxt, '#d4a843', '#1c1c20', '#e8c05a')
  })

  // Delta pills — placed below the label group for each axis
  const labelOffsets2 = [[0,-15],[18,-8],[12,12],[-12,12],[-18,-8]]
  if (rt) {
    AXES.forEach((p, i) => {
      const diff = (rt[p.key] ?? 0) - (T[p.key] ?? 0)
      if (Math.abs(diff) < p.step * 0.5) return
      const [ux, uy] = unitVec(i)
      const lx = cx + (R + 20) * ux + labelOffsets2[i][0]
      const ly = cy + (R + 20) * uy + labelOffsets2[i][1]
      const px = lx
      const py = ly + 14
      const color = diff > 0 ? '#4caf7d' : '#5b9af0'
      const bgAlpha = diff > 0 ? 'rgba(76,175,125,.2)' : 'rgba(91,154,240,.18)'
      const stroke = diff > 0 ? 'rgba(76,175,125,.4)' : 'rgba(91,154,240,.4)'
      const sign = diff > 0 ? '+' : ''
      html += `<rect x="${px-12}" y="${py-7}" width="24" height="14" rx="4" fill="${bgAlpha}" stroke="${stroke}" stroke-width=".8"/>`
      html += `<text x="${px}" y="${py+3}" text-anchor="middle" font-size="9" fill="${color}" font-family="Inter,sans-serif" font-weight="700">${sign}${Math.round(diff*10)/10}</text>`
    })
  }

  const dyn = document.getElementById('exp-radar-dyn')
  if (dyn) dyn.innerHTML = html
  const yoursPoly = document.getElementById('exp-radar-yours')
  const matchPoly = document.getElementById('exp-radar-match')
  if (yoursPoly) yoursPoly.style.opacity = yoursVisible ? '1' : '0.1'
  if (matchPoly) matchPoly.style.opacity = matchVisible ? '1' : '0.1'
}
function updateExploreViews() { syncExploreControls(); updateRadarOverlay() }

function buildRadarPane() {
  const svg = document.getElementById('exp-radar-svg')
  if (!svg) return

  const N = 5
  const cx = 130, cy = 125, R = 80
  const AXES = T_PARAMS.slice(0, 5)  // HL, SH, COL, CCE, CCB

  function ang(i) { return (2 * Math.PI * i / N) - Math.PI / 2 }
  function unitVec(i) { return [Math.cos(ang(i)), Math.sin(ang(i))] }
  function axisPoint(val, p, i) {
    const r = tNorm(p, val) * R
    const [ux, uy] = unitVec(i)
    return [cx + r * ux, cy + r * uy]
  }

  // Static structure (grid + spokes) — drawn once
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.id = 'exp-radar-static'
  const rings = [0.25, 0.5, 0.75, 1.0]
  rings.forEach(frac => {
    const pts = AXES.map((_, i) => {
      const [ux, uy] = unitVec(i)
      return `${cx + R * frac * ux},${cy + R * frac * uy}`
    }).join(' ')
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    poly.setAttribute('points', pts)
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', frac === 0.5 ? '#3a3a42' : '#2a2a30')
    poly.setAttribute('stroke-width', frac === 0.5 ? '1.2' : '0.8')
    g.appendChild(poly)
  })
  AXES.forEach((_, i) => {
    const [ux, uy] = unitVec(i)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', cx); line.setAttribute('y1', cy)
    line.setAttribute('x2', cx + R * ux); line.setAttribute('y2', cy + R * uy)
    line.setAttribute('stroke', '#2a2a30'); line.setAttribute('stroke-width', '0.8')
    g.appendChild(line)
  })
  svg.appendChild(g)

  // Dynamic layer (polygons + handles + pills) — replaced by updateRadarOverlay
  const dyn = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  dyn.id = 'exp-radar-dyn'
  svg.appendChild(dyn)

  // Axis name labels + +/- buttons with background pill (outside ring)
  const labelNames = ['HL','SH','COL','CCE','CCB']
  const labelOffsets = [[0,-15],[18,-8],[12,12],[-12,12],[-18,-8]]
  AXES.forEach((p, i) => {
    const [ux, uy] = unitVec(i)
    const lx = cx + (R + 20) * ux + labelOffsets[i][0]
    const ly = cy + (R + 20) * uy + labelOffsets[i][1]

    // Group for hit area styling
    const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // Background pill behind the whole label+buttons row
    const pillW = 46, pillH = 16
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('x', lx - pillW/2); bg.setAttribute('y', ly - 11)
    bg.setAttribute('width', pillW); bg.setAttribute('height', pillH)
    bg.setAttribute('rx', '5')
    bg.setAttribute('fill', '#1a1a20')
    bg.setAttribute('stroke', '#3a3a4a')
    bg.setAttribute('stroke-width', '0.8')
    grp.appendChild(bg)

    // − button
    const btnMinus = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    btnMinus.setAttribute('x', lx - 15); btnMinus.setAttribute('y', ly)
    btnMinus.setAttribute('text-anchor', 'middle')
    btnMinus.setAttribute('font-size', '12')
    btnMinus.setAttribute('fill', '#8a8a9a')
    btnMinus.setAttribute('font-family', 'Inter,sans-serif')
    btnMinus.setAttribute('font-weight', '700')
    btnMinus.style.cursor = 'pointer'
    btnMinus.textContent = '−'
    btnMinus.addEventListener('click', () => {
      T[p.key] = Math.max(p.lo, Math.round((T[p.key] - p.step) / p.step) * p.step)
      syncExploreControls(); expDebounce()
    })
    grp.appendChild(btnMinus)

    // Label
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    t.setAttribute('x', lx); t.setAttribute('y', ly)
    t.setAttribute('text-anchor', 'middle')
    t.setAttribute('dominant-baseline', 'auto')
    t.setAttribute('font-size', '9')
    t.setAttribute('fill', '#c0c0d0')
    t.setAttribute('font-family', 'Inter,sans-serif')
    t.setAttribute('font-weight', '700')
    t.setAttribute('letter-spacing', '0.3')
    t.textContent = labelNames[i]
    grp.appendChild(t)

    // + button
    const btnPlus = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    btnPlus.setAttribute('x', lx + 15); btnPlus.setAttribute('y', ly)
    btnPlus.setAttribute('text-anchor', 'middle')
    btnPlus.setAttribute('font-size', '12')
    btnPlus.setAttribute('fill', '#8a8a9a')
    btnPlus.setAttribute('font-family', 'Inter,sans-serif')
    btnPlus.setAttribute('font-weight', '700')
    btnPlus.style.cursor = 'pointer'
    btnPlus.textContent = '+'
    btnPlus.addEventListener('click', () => {
      T[p.key] = Math.min(p.hi, Math.round((T[p.key] + p.step) / p.step) * p.step)
      syncExploreControls(); expDebounce()
    })
    grp.appendChild(btnPlus)

    svg.appendChild(grp)
  })

  // Legend toggle buttons — wired to HTML elements above the SVG
  yoursVisible = true
  matchVisible = true
  const legendYoursBtn = document.getElementById('exp-legend-yours-btn')
  const legendMatchBtn = document.getElementById('exp-legend-match-btn')
  if (legendYoursBtn) {
    legendYoursBtn.addEventListener('click', () => {
      yoursVisible = !yoursVisible
      const poly = document.getElementById('exp-radar-yours')
      if (poly) poly.style.opacity = yoursVisible ? '1' : '0.1'
      legendYoursBtn.classList.toggle('dimmed', !yoursVisible)
    })
  }
  if (legendMatchBtn) {
    legendMatchBtn.addEventListener('click', () => {
      matchVisible = !matchVisible
      const poly = document.getElementById('exp-radar-match')
      if (poly) poly.style.opacity = matchVisible ? '1' : '0.1'
      legendMatchBtn.classList.toggle('dimmed', !matchVisible)
    })
  }

  // Draw initial state
  updateRadarOverlay()

  // Wire drag events on handles (delegated — handles added by updateRadarOverlay)
  let activeHandle = null
  svg.addEventListener('mousedown', e => {
    const h = e.target.closest('.radar-handle')
    if (h) { activeHandle = h; e.preventDefault() }
  })
  document.addEventListener('mouseup', () => { activeHandle = null })
  document.addEventListener('mousemove', e => {
    if (!activeHandle) return
    const i = parseInt(activeHandle.dataset.idx)
    const p = AXES[i]
    const rect = svg.getBoundingClientRect()
    const scaleX = 260 / rect.width, scaleY = 250 / rect.height
    const mx = (e.clientX - rect.left) * scaleX - cx
    const my = (e.clientY - rect.top)  * scaleY - cy
    const [ux, uy] = unitVec(i)
    const proj = clamp((mx * ux + my * uy) / R, 0, 1)
    const extent = Math.max(Math.abs(p.lo), Math.abs(p.hi))
    const rawVal = clamp(proj * 2 * extent - extent, p.lo, p.hi)
    T[p.key] = Math.round(rawVal / p.step) * p.step
    syncExploreControls()
    expDebounce()
  })
  svg.addEventListener('touchstart', e => {
    const h = e.target.closest('.radar-handle')
    if (h) { activeHandle = h; e.preventDefault() }
  }, {passive:false})
  document.addEventListener('touchend', () => { activeHandle = null })
  document.addEventListener('touchmove', e => {
    if (!activeHandle) return
    const i = parseInt(activeHandle.dataset.idx)
    const p = AXES[i]
    const t2 = e.touches[0]
    const rect = svg.getBoundingClientRect()
    const scaleX = 260 / rect.width, scaleY = 250 / rect.height
    const mx = (t2.clientX - rect.left) * scaleX - cx
    const my = (t2.clientY - rect.top)  * scaleY - cy
    const [ux, uy] = unitVec(i)
    const proj = clamp((mx * ux + my * uy) / R, 0, 1)
    const extent = Math.max(Math.abs(p.lo), Math.abs(p.hi))
    const rawVal = clamp(proj * 2 * extent - extent, p.lo, p.hi)
    T[p.key] = Math.round(rawVal / p.step) * p.step
    syncExploreControls()
    expDebounce()
  }, {passive:false})
}

function syncExploreControls() {
  // Film sim filter
  const filmSimSel = document.getElementById('exp-film-sim')
  if (filmSimSel && filmSimSel.value !== T.film_sim_filter) filmSimSel.value = T.film_sim_filter
  // WB
  const wbMode = document.getElementById('exp-wb-mode')
  if (wbMode && wbMode.value !== T.white_balance) wbMode.value = T.white_balance
  updateWbDot()
  // Compact controls (steppers)
  ;['sharpness','clarity','high_iso_nr'].forEach(key => {
    const el = document.getElementById('exp-sv-' + key)
    if (el) el.textContent = T[key]
  })
  // Compact controls (toggles)
  ;['100','200','400'].forEach(v => {
    const btn = document.querySelector(`#exp-dr-group [data-val="${v}"]`)
    if (btn) btn.classList.toggle('on', T.dynamic_range === parseInt(v))
  })
  ;['0','1','2'].forEach(v => {
    const btn = document.querySelector(`#exp-grain-group [data-val="${v}"]`)
    if (btn) btn.classList.toggle('on', T.grain_effect === parseInt(v))
  })
  ;['S','L'].forEach(v => {
    const btn = document.querySelector(`#exp-gs-group [data-val="${v}"]`)
    if (btn) btn.classList.toggle('on', T.grain_size === v)
  })
  syncCompactDiffs()
}

function diamondPoints(cx, cy, s) {
  return `${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}`
}

function buildWbGrid() {
  const svg = document.getElementById('exp-wb-svg')
  if (!svg) return

  let html = ''
  // Grid lines every 3 units
  for (let i = -6; i <= 6; i += 3) {
    const thick = i === 0
    html += `<line x1="${i}" y1="-9" x2="${i}" y2="9" stroke="${thick?'#333340':'#242428'}" stroke-width="${thick?.6:.3}"/>`
    html += `<line x1="-9" y1="${i}" x2="9" y2="${i}" stroke="${thick?'#333340':'#242428'}" stroke-width="${thick?.6:.3}"/>`
  }
  html += `<rect x="-9" y="-9" width="18" height="18" fill="none" stroke="#2e2e34" stroke-width=".6"/>`
  // Axis labels
  html += `<text x="-9.4" y=".7" font-size="1.7" fill="#5e5e6e" text-anchor="end" font-family="Inter,sans-serif">R−</text>`
  html += `<text x="9.4"  y=".7" font-size="1.7" fill="#5e5e6e" text-anchor="start" font-family="Inter,sans-serif">R+</text>`
  html += `<text x="0" y="-9.6" font-size="1.7" fill="#5e5e6e" text-anchor="middle" font-family="Inter,sans-serif">B+</text>`
  html += `<text x="0" y="10.8" font-size="1.7" fill="#5e5e6e" text-anchor="middle" font-family="Inter,sans-serif">B−</text>`
  // Tick values
  html += `<text x="-6" y="1.3" font-size="1.3" fill="#2e2e34" text-anchor="middle" font-family="Inter,sans-serif">−6</text>`
  html += `<text x="-3" y="1.3" font-size="1.3" fill="#2e2e34" text-anchor="middle" font-family="Inter,sans-serif">−3</text>`
  html += `<text x="3"  y="1.3" font-size="1.3" fill="#2e2e34" text-anchor="middle" font-family="Inter,sans-serif">+3</text>`
  html += `<text x="6"  y="1.3" font-size="1.3" fill="#2e2e34" text-anchor="middle" font-family="Inter,sans-serif">+6</text>`
  html += `<text x=".8" y="-5.7" font-size="1.3" fill="#2e2e34" font-family="Inter,sans-serif">+6</text>`
  html += `<text x=".8" y="-2.7" font-size="1.3" fill="#2e2e34" font-family="Inter,sans-serif">+3</text>`
  html += `<text x=".8" y="4.3"  font-size="1.3" fill="#2e2e34" font-family="Inter,sans-serif">−3</text>`
  html += `<text x=".8" y="7.3"  font-size="1.3" fill="#2e2e34" font-family="Inter,sans-serif">−6</text>`

  // Match dot group (hairline crosshair + open circle + value pill) — updated by updateWbDot
  html += `<g id="exp-wb-match-g" opacity="0"></g>`

  // Your dot — gold diamond
  html += `<polygon id="exp-wb-dot" points="${diamondPoints(T.wb_shift_red, -T.wb_shift_blue, 1.1)}" fill="#d4a843" stroke="#0d0d0f" stroke-width=".3" style="cursor:crosshair"/>`

  svg.innerHTML = html

  // Wire WB mode select
  const modeSelect = document.getElementById('exp-wb-mode')
  if (modeSelect) {
    modeSelect.value = T.white_balance
    modeSelect.addEventListener('change', () => {
      T.white_balance = modeSelect.value
      expDebounce()
    })
  }

  // Drag handlers
  function svgCoords(e) {
    const rect = svg.getBoundingClientRect()
    const scaleX = 18 / rect.width, scaleY = 18 / rect.height
    const rx = clamp(Math.round((e.clientX - rect.left) * scaleX - 9), -9, 9)
    const ry = clamp(Math.round((e.clientY - rect.top)  * scaleY - 9), -9, 9)
    return { r: rx, b: -ry }
  }
  let dragging = false
  svg.addEventListener('mousedown', e => {
    dragging = true
    const {r, b} = svgCoords(e)
    T.wb_shift_red = r; T.wb_shift_blue = b
    updateWbDot(); renderExploreResults()
  })
  svg.addEventListener('mousemove', e => {
    if (!dragging) return
    const {r, b} = svgCoords(e)
    T.wb_shift_red = r; T.wb_shift_blue = b
    updateWbDot(); expDebounce()
  })
  document.addEventListener('mouseup', () => { dragging = false })
  svg.addEventListener('touchstart', e => {
    e.preventDefault()
    const {r, b} = svgCoords(e.touches[0])
    T.wb_shift_red = r; T.wb_shift_blue = b
    updateWbDot(); renderExploreResults()
  }, {passive:false})
  svg.addEventListener('touchmove', e => {
    e.preventDefault()
    const {r, b} = svgCoords(e.touches[0])
    T.wb_shift_red = r; T.wb_shift_blue = b
    updateWbDot(); expDebounce()
  }, {passive:false})

  updateWbDot()
}

function pillSvg(x, y, text, strokeColor, bgColor, textColor) {
  const w = text.length * 1.1 + 2
  const cx = clamp(x, -8.8, 9 - w)
  return `<rect x="${cx}" y="${y}" width="${w}" height="2.6" rx=".8" fill="${bgColor}" stroke="${strokeColor}" stroke-width=".3"/>` +
         `<text x="${cx + w/2}" y="${y + 1.9}" font-size="1.5" fill="${textColor}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600">${text}</text>`
}

function updateWbDot() {
  const dot = document.getElementById('exp-wb-dot')
  if (dot) dot.setAttribute('points', diamondPoints(T.wb_shift_red, -T.wb_shift_blue, 1.1))

  // Your value — written to HTML outside the SVG
  const rLabel = (T.wb_shift_red >= 0 ? 'R+' : 'R') + T.wb_shift_red
  const bLabel = (T.wb_shift_blue >= 0 ? 'B+' : 'B') + T.wb_shift_blue
  const yoursTxt = document.getElementById('exp-wb-yours-txt')
  if (yoursTxt) yoursTxt.textContent = rLabel + ' ' + bLabel

  // Match dot + match value in HTML
  const closest = computeSimilarity(T)[0]
  const matchG = document.getElementById('exp-wb-match-g')
  if (matchG && closest) {
    const rt = recipeToT(closest)
    const mx = rt.wb_shift_red, my = -rt.wb_shift_blue
    matchG.innerHTML =
      `<line x1="${mx-1.4}" y1="${my}" x2="${mx+1.4}" y2="${my}" stroke="#5b9af0" stroke-width=".25" opacity=".7"/>` +
      `<line x1="${mx}" y1="${my-1.4}" x2="${mx}" y2="${my+1.4}" stroke="#5b9af0" stroke-width=".25" opacity=".7"/>` +
      `<circle cx="${mx}" cy="${my}" r=".55" fill="rgba(91,154,240,.15)" stroke="#5b9af0" stroke-width=".3"/>`
    matchG.setAttribute('opacity', '1')
    const rL = (rt.wb_shift_red >= 0 ? 'R+' : 'R') + rt.wb_shift_red
    const bL = (rt.wb_shift_blue >= 0 ? 'B+' : 'B') + rt.wb_shift_blue
    const matchTxt = document.getElementById('exp-wb-match-txt')
    if (matchTxt) matchTxt.textContent = rL + ' ' + bL
  }

  // WB match mode indicator
  const matchMode = document.getElementById('exp-wb-match-mode')
  if (matchMode && closest) {
    const rt = recipeToT(closest)
    matchMode.textContent = rt.white_balance || '—'
  }
}

let _expTimer = null
function expDebounce() {
  clearTimeout(_expTimer)
  _expTimer = setTimeout(() => { renderExploreResults(); updateExploreViews() }, 80)
}

function buildSliderPane() {
  const pane = document.getElementById('exp-pane-sliders')
  if (!pane) return

  const tonal  = T_PARAMS.filter(p => ['highlight','shadow'].includes(p.key))
  const style  = T_PARAMS.filter(p => !['highlight','shadow'].includes(p.key))

  function makeGroup(title, params) {
    const g = document.createElement('div')
    g.className = 'slider-group'
    g.innerHTML = `<div class="slider-group-title">${title}</div>`
    params.forEach(p => {
      const row = document.createElement('div')
      row.className = 'slider-row'
      const dotColor = n => n < 0.33 ? 'var(--blue)' : n < 0.67 ? 'var(--teal)' : 'var(--accent)'
      row.innerHTML = `
        <span class="slider-dot" id="exp-dot-${p.key}" style="background:${dotColor(p.norm(T[p.key]))}"></span>
        <span class="slider-label">${p.label}</span>
        <input type="range" class="exp-range" id="exp-sl-${p.key}"
          min="${p.min}" max="${p.max}" step="${p.step}" value="${T[p.key]}">
        <span class="slider-val" id="exp-slv-${p.key}">${T[p.key]}</span>`
      const inp = row.querySelector('input')
      inp.addEventListener('input', () => {
        T[p.key] = parseFloat(inp.value)
        document.getElementById('exp-slv-' + p.key).textContent = T[p.key]
        const dot = document.getElementById('exp-dot-' + p.key)
        if (dot) dot.style.background = dotColor(p.norm(T[p.key]))
        expDebounce()
      })
      g.appendChild(row)
    })
    return g
  }

  const sliders = document.createElement('div')
  sliders.className = 'exp-sliders'
  sliders.appendChild(makeGroup('Tonal', tonal))
  sliders.appendChild(makeGroup('Style', style))
  pane.appendChild(sliders)

  // Radar overlay for Sliders sub-tab
  const owrap = document.createElement('div')
  owrap.className = 'exp-overlay-wrap'
  owrap.innerHTML = '<div class="exp-overlay-title">Shape vs closest match</div>'
  const svgWrap = document.createElement('div')
  svgWrap.className = 'exp-radar-wrap'
  svgWrap.innerHTML = '<svg id="exp-overlay-svg" class="exp-radar-svg" width="220" height="220" viewBox="0 0 80 80"></svg>'
  owrap.appendChild(svgWrap)
  pane.appendChild(owrap)
}

function buildCompactControls() {
  const container = document.getElementById('exp-compact-controls')
  if (!container) return
  container.innerHTML = ''

  const title = document.createElement('div')
  title.className = 'exp-compact-title'
  title.textContent = 'Detail & Range'
  container.appendChild(title)

  const grid = document.createElement('div')
  grid.className = 'exp-compact-grid'
  container.appendChild(grid)

  // Stepper controls for SHP, CL, NR (T_PARAMS entries 5,6,7)
  const stepperKeys = ['sharpness','clarity','high_iso_nr']
  const stepperLabels = {'sharpness':'Sharpness','clarity':'Clarity','high_iso_nr':'ISO NR'}
  stepperKeys.forEach(key => {
    const p = T_PARAMS.find(x => x.key === key)
    const row = document.createElement('div')
    row.className = 'exp-compact-row'
    row.innerHTML = `
      <span class="exp-compact-lbl">${stepperLabels[key]}</span>
      <button class="exp-stepper-btn" data-key="${key}" data-dir="-1">−</button>
      <span class="exp-stepper-val" id="exp-sv-${key}">${T[key]}</span>
      <button class="exp-stepper-btn" data-key="${key}" data-dir="1">+</button>
      <span class="exp-diff-pill neut" id="exp-dp-${key}"></span>`
    grid.appendChild(row)
    row.querySelectorAll('.exp-stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = parseInt(btn.dataset.dir)
        T[key] = clamp(T[key] + dir * p.step, p.lo, p.hi)
        document.getElementById('exp-sv-' + key).textContent = T[key]
        syncCompactDiffs()
        expDebounce()
      })
    })
  })

  // Dynamic Range toggle
  const drRow = document.createElement('div')
  drRow.className = 'exp-compact-row'
  drRow.innerHTML = `
    <span class="exp-compact-lbl">Dyn Range</span>
    <div class="exp-toggle-group" id="exp-dr-group">
      <button class="exp-toggle-btn${T.dynamic_range===100?' on':''}" data-val="100">100</button>
      <button class="exp-toggle-btn${T.dynamic_range===200?' on':''}" data-val="200">200</button>
      <button class="exp-toggle-btn${T.dynamic_range===400?' on':''}" data-val="400">400</button>
    </div>
    <span class="exp-diff-pill neut" id="exp-dp-dynamic_range"></span>`
  grid.appendChild(drRow)
  drRow.querySelectorAll('.exp-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      T.dynamic_range = parseInt(btn.dataset.val)
      drRow.querySelectorAll('.exp-toggle-btn').forEach(b => b.classList.toggle('on', b === btn))
      syncCompactDiffs()
      expDebounce()
    })
  })

  // Grain strength toggle
  const grainRow = document.createElement('div')
  grainRow.className = 'exp-compact-row'
  grainRow.innerHTML = `
    <span class="exp-compact-lbl">Grain</span>
    <div class="exp-toggle-group" id="exp-grain-group">
      <button class="exp-toggle-btn${T.grain_effect===0?' on':''}" data-val="0">Off</button>
      <button class="exp-toggle-btn${T.grain_effect===1?' on':''}" data-val="1">Wk</button>
      <button class="exp-toggle-btn${T.grain_effect===2?' on':''}" data-val="2">Str</button>
    </div>
    <span class="exp-diff-pill neut" id="exp-dp-grain_effect"></span>`
  grid.appendChild(grainRow)
  grainRow.querySelectorAll('.exp-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      T.grain_effect = parseInt(btn.dataset.val)
      grainRow.querySelectorAll('.exp-toggle-btn').forEach(b => b.classList.toggle('on', b === btn))
      syncCompactDiffs()
      expDebounce()
    })
  })

  // Grain size toggle
  const gsRow = document.createElement('div')
  gsRow.className = 'exp-compact-row'
  gsRow.innerHTML = `
    <span class="exp-compact-lbl">Grain Size</span>
    <div class="exp-toggle-group" id="exp-gs-group">
      <button class="exp-toggle-btn${T.grain_size==='S'?' on':''}" data-val="S">S</button>
      <button class="exp-toggle-btn${T.grain_size==='L'?' on':''}" data-val="L">L</button>
    </div>
    <span class="exp-diff-pill neut" id="exp-dp-grain_size"></span>`
  grid.appendChild(gsRow)
  gsRow.querySelectorAll('.exp-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      T.grain_size = btn.dataset.val
      gsRow.querySelectorAll('.exp-toggle-btn').forEach(b => b.classList.toggle('on', b === btn))
      syncCompactDiffs()
      expDebounce()
    })
  })

  syncCompactDiffs()
}

function syncCompactDiffs() {
  const closest = computeSimilarity(T)[0]
  if (!closest) return
  const rt = recipeToT(closest)

  // Stepper diffs
  ;['sharpness','clarity','high_iso_nr'].forEach(key => {
    const pill = document.getElementById('exp-dp-' + key)
    const valEl = document.getElementById('exp-sv-' + key)
    if (valEl) valEl.textContent = T[key]
    if (!pill) return
    const diff = rt[key] - T[key]
    if (Math.abs(diff) < 0.5) {
      pill.textContent = '='; pill.className = 'exp-diff-pill neut'
    } else {
      pill.textContent = (diff > 0 ? '+' : '') + diff
      pill.className = 'exp-diff-pill ' + (diff > 0 ? 'pos' : 'neg')
    }
  })

  // DR diff
  const drPill = document.getElementById('exp-dp-dynamic_range')
  if (drPill) {
    drPill.textContent = rt.dynamic_range !== T.dynamic_range ? rt.dynamic_range : '='
    drPill.className = 'exp-diff-pill ' + (rt.dynamic_range !== T.dynamic_range ? 'neg' : 'neut')
  }

  // Grain diff
  const gPill = document.getElementById('exp-dp-grain_effect')
  if (gPill) {
    const gDiff = rt.grain_effect - T.grain_effect
    gPill.textContent = gDiff !== 0 ? (['Off','Wk','Str'][rt.grain_effect] || rt.grain_effect) : '='
    gPill.className = 'exp-diff-pill ' + (gDiff !== 0 ? 'neg' : 'neut')
  }

  // Grain size diff
  const gsPill = document.getElementById('exp-dp-grain_size')
  if (gsPill) {
    gsPill.textContent = rt.grain_size !== T.grain_size ? rt.grain_size : '='
    gsPill.className = 'exp-diff-pill ' + (rt.grain_size !== T.grain_size ? 'neg' : 'neut')
  }
}

// Both the Fuji and OM Explore builds write into #pane-explore, so the original
// Fuji markup is snapshotted on first use and restored when switching back.
let fujiExploreHTML = null

function initExplore() {
  const pane = $('pane-explore')
  if (pane && fujiExploreHTML === null) fujiExploreHTML = pane.innerHTML
  if (activeGen === 'OM') {
    exploreBuilt = false
    if (typeof initOmExplore === 'function') return initOmExplore()
    if (pane) pane.innerHTML = '<div class="sec-title">Explore</div><div class="empty">Explore is not available for the OM recipe family yet.</div>'
    return
  }
  if (exploreBuilt) return
  // Restore Fuji markup if an OM build (or the empty state) replaced it.
  if (pane && !document.getElementById('exp-seed-input') && fujiExploreHTML !== null) {
    pane.innerHTML = fujiExploreHTML
  }

  // Seed picker
  const seedInput = document.getElementById('exp-seed-input')
  const seedDropdown = document.getElementById('exp-seed-dropdown')
  if (seedInput && seedDropdown) {
    function showDropdown(query) {
      const q = query.trim().toLowerCase()
      const matches = activeRecipes().filter(r => r.name.toLowerCase().includes(q)).slice(0, 12)
      seedDropdown.innerHTML = ''
      const neutral = document.createElement('div')
      neutral.textContent = '— neutral —'
      neutral.style.cssText = 'padding:6px 10px;font-size:13px;cursor:pointer;color:var(--text2)'
      neutral.addEventListener('mousedown', e => {
        e.preventDefault()
        seedRecipe(null)
        seedInput.value = ''
        seedDropdown.style.display = 'none'
      })
      seedDropdown.appendChild(neutral)
      matches.forEach(r => {
        const opt = document.createElement('div')
        opt.textContent = r.name
        opt.style.cssText = 'padding:6px 10px;font-size:13px;cursor:pointer;color:var(--text)'
        opt.addEventListener('mouseover', () => opt.style.background = 'var(--surf3)')
        opt.addEventListener('mouseout', () => opt.style.background = '')
        opt.addEventListener('mousedown', e => {
          e.preventDefault()
          seedRecipe(r.name)
          seedInput.value = r.name
          seedDropdown.style.display = 'none'
        })
        seedDropdown.appendChild(opt)
      })
      seedDropdown.style.display = (matches.length > 0 || q === '') ? 'block' : 'none'
    }
    seedInput.addEventListener('focus', () => showDropdown(seedInput.value))
    seedInput.addEventListener('input', () => showDropdown(seedInput.value))
    seedInput.addEventListener('blur', () => setTimeout(() => { seedDropdown.style.display = 'none' }, 150))
  }

  // Film sim filter — populate options from dataset
  const filmSimSel = document.getElementById('exp-film-sim')
  if (filmSimSel) {
    const sims = [...new Set(activeRecipes().map(r => r.film_simulation).filter(Boolean))].sort()
    sims.forEach(s => {
      const opt = document.createElement('option')
      opt.value = s; opt.textContent = s
      filmSimSel.appendChild(opt)
    })
    filmSimSel.addEventListener('change', () => {
      T.film_sim_filter = filmSimSel.value
      renderExploreResults()
      updateRadarOverlay()
      updateWbDot()
      syncCompactDiffs()
    })
  }

  // WB mode dropdown — populate from dataset
  const wbSel = document.getElementById('exp-wb-mode')
  if (wbSel) {
    wbSel.innerHTML = ''
    const wbVals = [...new Set(activeRecipes().map(r => r.white_balance).filter(Boolean))].sort()
    wbVals.forEach(v => {
      const opt = document.createElement('option')
      opt.value = v; opt.textContent = v
      wbSel.appendChild(opt)
    })
    wbSel.value = T.white_balance
  }

  // WB grid
  buildWbGrid()

  // Compact controls
  buildCompactControls()

  // Radar
  buildRadarPane()

  exploreBuilt = true
  renderExploreResults()
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
function warmthFormulaHTML() {
  if (activeGen === 'OM') return `<div>
    <div style="font-weight:600;color:var(--text);margin-bottom:6px">Warmth &nbsp;<span class="badge b-warm">warm</span> <span class="badge b-neutral">neutral</span> <span class="badge b-cool">cool</span></div>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 6px">Derived from the <strong>colour wheel tilt</strong> (warm channels minus cool channels), the <strong>WB amber offset</strong>, and <strong>WB kelvin</strong> where it is known. Monochrome recipes always score neutral.</p>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 8px"><em>tilt = (mean[Y,O,OR,R] − mean[B,BC,C]) / 7<br>Score = (0.30×amber/7 + 0.50×tilt) / 0.80</em><br>Warm &gt;0.187 · Cool &lt;0.009 · Neutral otherwise</p>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0">Only 19 of 66 recipes state a WB temperature. When it is unknown the kelvin term is <strong>dropped from the average</strong> rather than assumed neutral — assuming a default collapsed 59 of 66 recipes into "neutral".</p>
  </div>`
  return `<div>
    <div style="font-weight:600;color:var(--text);margin-bottom:6px">Warmth &nbsp;<span class="badge b-warm">warm</span> <span class="badge b-neutral">neutral</span> <span class="badge b-cool">cool</span></div>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 6px">Derived from <strong>WB kelvin</strong>, <strong>WB shift (R−B)</strong>, and a small <strong>film sim adjustment</strong>. Higher kelvin and red-dominant shifts push warm; lower kelvin and blue-dominant shifts push cool. B&W sims always score neutral.</p>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 8px"><em>Score = (kelvin−5200)/2300×0.5 + (R−B)/9×0.5 + filmBias</em><br>Warm &gt;0.35 · Cool &lt;−0.20 · Neutral otherwise</p>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:3px">Warm-biased (+0.15)</div><div style="font-size:11px;color:var(--text2)">Nostalgic Neg. · Classic Chrome · Eterna · Eterna/Cinema · PRO Neg. Hi · PRO Neg. Std</div></div>
      <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:3px">Cool-biased (−0.15)</div><div style="font-size:11px;color:var(--text2)">Eterna Bleach Bypass · Velvia/Vivid</div></div>
      <div><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:3px">Always neutral</div><div style="font-size:11px;color:var(--text2)">Acros · Monochrome · Sepia</div></div>
    </div>
  </div>`
}

function punchFormulaHTML() {
  if (activeGen === 'OM') return `<div>
    <div style="font-weight:600;color:var(--text);margin-bottom:6px">Punch &nbsp;<span class="badge b-punchy">punchy</span> <span class="badge b-neutral">balanced</span> <span class="badge b-flat">flat</span></div>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 6px">Derived from the <strong>mean absolute colour-wheel push</strong>, the <strong>Contrast dial</strong>, and the <strong>signed tonal separation</strong> between highlights and shadows.</p>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 8px"><em>sep = (Highlights − Shadows) / 2<br>Score = wheelMag×0.9 + Contrast×0.5 + sep×0.25</em><br>Punchy &gt;2.17 · Flat &lt;1.05 · Balanced otherwise</p>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0">Separation is <strong>signed, not absolute</strong>: on OM, highlights up with shadows down is an S-curve that raises contrast. Recipes tagged high-contrast average +0.98 here; those tagged soft or faded average −0.96.</p>
  </div>`
  return `<div>
    <div style="font-weight:600;color:var(--text);margin-bottom:6px">Punch &nbsp;<span class="badge b-punchy">punchy</span> <span class="badge b-neutral">balanced</span> <span class="badge b-flat">flat</span></div>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0 0 6px">Derived from the <strong>Color dial</strong>, <strong>Clarity dial</strong>, and <strong>Highlight/Shadow spread</strong>. High color + clarity → punchy. Low color, low clarity, wide tonal roll-off → flat.</p>
    <p style="color:var(--text2);font-size:12px;line-height:1.6;margin:0"><em>Score = Color×0.5 + Clarity×0.25 − (|HL|+|SH|)×0.1</em><br>Punchy &gt;1.2 · Flat &lt;−0.5 · Balanced otherwise</p>
  </div>`
}

function initBadgeFormula() {
  // Collapsible above the Recipes grid
  const listPane = $('inner-recipes-list')
  if (listPane) {
    const details = document.createElement('details')
    details.className = 'badge-formula-details'
    details.innerHTML = `<summary>How badges are scored</summary><div class="bfd-body">${warmthFormulaHTML()}${punchFormulaHTML()}<div style="font-size:11px;color:var(--text3);border-top:1px solid var(--border);padding-top:10px">Computed automatically from camera settings. Override a recipe via <code>RECIPE_META_PATCHES</code> in gear.js.</div></div>`
    listPane.insertBefore(details, listPane.firstChild)
  }

  // Sidebar info popovers
  let activePopover = null
  function closePopover() { if (activePopover) { activePopover.remove(); activePopover = null } }

  function keywordInfoHTML(type) {
    if (type === 'mood') return `<h4>Mood Keywords</h4>
<p>Descriptive adjectives for the <em>emotional tone</em> of the recipe — how the final image feels. Examples: vintage, cinematic, dreamy, punchy, muted, ethereal.</p>
<p>Assigned by the recipe author based on intended aesthetic. Selecting multiple moods shows recipes that match <em>any</em> of them.</p>`
    if (type === 'scenario') return `<h4>Scenario Keywords</h4>
<p>The <em>shooting situations</em> the recipe is built for. Examples: street, portrait, landscape, golden hour, indoor, travel.</p>
<p>Based on author recommendations and the recipe's tonal characteristics. A recipe can suit multiple scenarios.</p>`
    if (type === 'hue') return `<h4>Hue Emphasis</h4>
<p>Which hue family the 12-point colour wheel pushes hardest — the mean of the warm (Y/O/OR/R), cool (B/BC/C), green (GC/G/YG) and magenta (M/V/R) groups, with the winner taken. "Neutral" means no group exceeds +0.5.</p>
<p><strong>This is not a colour cast.</strong> In OM's Color Creator a positive channel boosts <em>that hue's saturation</em> — it does not tint the image. A recipe can be <span class="badge b-warm">warm</span> on Warmth while showing <em>cool</em> emphasis here: "OMTC Warm" runs Amber +4 (genuinely warm) yet pushes Blue +4 and Cyan +5 (cool emphasis). Both readings are true at once.</p>
<p>Monochrome recipes have no wheel and are excluded from this filter.</p>`
    if (type === 'era') return `<h4>Era / Film Reference</h4>
<p>The <em>decade or photographic era</em> the recipe evokes — either explicitly referenced by the author or implied by the film emulated. Examples: 1960s, 1970s, 1990s.</p>
<p>Also covers the film stock being emulated (e.g. Kodachrome 64, Velvia 50). Blank if no clear era reference exists.</p>`
    return ''
  }

  document.querySelectorAll('.sb-info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      if (activePopover) { closePopover(); return }
      const f = btn.dataset.formula
      const pop = document.createElement('div')
      pop.className = 'formula-popover'
      const body = f === 'warmth' ? warmthFormulaHTML()
                 : f === 'punch'  ? punchFormulaHTML()
                 : keywordInfoHTML(f)
      pop.innerHTML = `<button class="formula-popover-close" aria-label="Close">✕</button>${body}`
      document.body.appendChild(pop)
      activePopover = pop
      const rect = btn.getBoundingClientRect()
      const pw = 320
      let left = rect.left
      if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8
      pop.style.top = (rect.bottom + 6) + 'px'
      pop.style.left = Math.max(8, left) + 'px'
      pop.querySelector('.formula-popover-close').addEventListener('click', closePopover)
    })
  })
  document.addEventListener('click', closePopover)
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover() })
}
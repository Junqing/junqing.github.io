// ══════════════════════════════════════════════════════════════════════════
// OM System / Olympus — analysis layer
//
// Everything in this file is OM-only. The Fuji recipe family never reaches
// any of it. Loaded by index.html alongside gear.js; each entry point is
// called from a `if (activeGen === 'OM')` dispatch line in index.html and
// guarded there by `typeof fn === 'function'`, so if this file fails to load
// every tab falls back to its "not available" empty state.
//
// This file is loaded BEFORE index.html's inline script, so nothing here may
// touch an index.html global at parse time — only inside function bodies, which
// run later. OM_WHEEL_ORDER / OM_WHEEL_ABBR are therefore defined here and
// consumed by index.html rather than the other way round.
//
// Depends on these globals from index.html (all call-time only):
//   buildOmVisual, buildOmWheelSvg, buildOmWbBox, clamp, openRecipeModal,
//   activeRecipes, goRecipe, buildSgCard, switchTab, switchInnerTab,
//   activeGen, C, compareSlots, updateCompareCardButtons,
//   WARMTH_CLASS, PUNCH_CLASS
// ══════════════════════════════════════════════════════════════════════════

// ─── wheel vocabulary ─────────────────────────────────────────────────────
// Canonical channel order and abbreviations for the 12-point colour wheel.
// index.html reads these; they live here so this file has no parse-time
// dependency on load order.
var OM_WHEEL_ABBR = { yellow:'Y', orange:'O', orangeRed:'OR', red:'R', magenta:'M', violet:'V', blue:'B', blueCyan:'BC', cyan:'C', greenCyan:'GC', green:'G', yellowGreen:'YG' }
var OM_WHEEL_ORDER = ['yellow','orange','orangeRed','red','magenta','violet','blue','blueCyan','cyan','greenCyan','green','yellowGreen']

// ─── shared helpers ───────────────────────────────────────────────────────

const OM_WARM_CH  = ['yellow', 'orange', 'orangeRed', 'red']
const OM_COOL_CH  = ['blue', 'blueCyan', 'cyan']
const OM_GREEN_CH = ['greenCyan', 'green', 'yellowGreen']
const OM_MAG_CH   = ['magenta', 'violet', 'red']

const omMean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
const omIsMono = r => r.recipe_type === 'MONO' || !r.color_wheel
const omCh = (r, keys) => omMean(keys.map(k => r.color_wheel[k] || 0))

// Mean absolute push across all 12 channels — OM's analogue of Fuji's Color dial.
const omWheelMag = r => omIsMono(r) ? 0 : omMean(OM_WHEEL_ORDER.map(k => Math.abs(r.color_wheel[k] || 0)))

// Signed tonal separation. Highlights up + shadows down is an S-curve that
// RAISES contrast, so this is deliberately signed, not an absolute spread.
const omToneSep = r => (((r.highlights || 0) - (r.shadows || 0)) / 2)

// OM-specific. Returns null — not a default — when the temperature is genuinely
// unknown, so recipeWarmthOm can drop the term instead of pretending it's 5200K.
// 47 of 66 recipes have a null wb_temperature and an "Auto"/"Custom WB" preset.
function omKelvin(r) {
  if (r.wb_temperature) return r.wb_temperature
  const w = r.white_balance || ''
  const m = w.match(/(\d{4,5})K/)
  if (m) return parseInt(m[1])
  if (/Cloudy/.test(w)) return 6000
  if (/Shade/.test(w))  return 7500
  return null
}

// ─── badges ───────────────────────────────────────────────────────────────
// Same vocabulary as Fuji ('warm|neutral|cool', 'punchy|balanced|flat'),
// different computation. Thresholds are the 32nd/68th percentile of the
// actual OM pool — see the design spec for the calibration data.

function recipeWarmthOm(r) {
  if (omIsMono(r)) return 'neutral'

  const tilt = (omCh(r, OM_WARM_CH) - omCh(r, OM_COOL_CH)) / 7
  const amb  = (r.wb_amber_offset || 0) / 7
  const k    = omKelvin(r)

  let num = 0.30 * amb + 0.50 * tilt
  let den = 0.80
  if (k != null) {
    num += 0.20 * (k - 5200) / 2300
    den += 0.20
  }
  const score = num / den

  if (score > 0.187) return 'warm'
  if (score < 0.009) return 'cool'
  return 'neutral'
}

function recipePunchOm(r) {
  const sep = omToneSep(r)
  // Mono has no wheel term, so contrast is scaled up to keep the score on the
  // same range as the color path and share one pair of thresholds.
  const score = omIsMono(r)
    ? (r.contrast || 0) * 1.62 + sep * 0.25
    : omWheelMag(r) * 0.9 + (r.contrast || 0) * 0.5 + sep * 0.25

  if (score > 2.17) return 'punchy'
  if (score < 1.05) return 'flat'
  return 'balanced'
}

// Which hue family the wheel pushes hardest. NOT a colour cast: in OM's Color
// Creator a positive channel boosts THAT HUE'S SATURATION rather than tinting
// the image, so a recipe can read 'warm' on the Warmth badge and 'cool' here
// without contradiction. Named "Hue Emphasis" in the UI for exactly that reason.
function omHueEmphasis(r) {
  if (omIsMono(r)) return null
  const scores = [
    ['warm',    omCh(r, OM_WARM_CH)],
    ['cool',    omCh(r, OM_COOL_CH)],
    ['green',   omCh(r, OM_GREEN_CH)],
    ['magenta', omCh(r, OM_MAG_CH)],
  ].sort((a, b) => b[1] - a[1])
  return scores[0][1] <= 0.5 ? 'neutral' : scores[0][0]
}

// ══════════════════════════════════════════
// INSIGHTS — DIRECTIONS
// ══════════════════════════════════════════

const OM_DIRECTIONS = [
  {
    name: 'Teal & Orange', color: '#e07842',
    desc: 'The modern cinematic split — warm channels pushed for skin and light, cyan/blue pushed for shade and sky. The most recognisable look in the collection.',
    traits: ['warm channels up', 'cyan / blue up', 'cinematic split'],
    match: r => !omIsMono(r) && omCh(r, OM_WARM_CH) >= 1 && omCh(r, OM_COOL_CH) >= 1,
  },
  {
    name: 'Faded Pastel', color: '#9b7fe8',
    desc: 'Gentle wheel pushes with a compressed or inverted tone curve — highlights pulled down, shadows lifted. Soft, airy, low-commitment colour.',
    traits: ['low wheel magnitude', 'lifted shadows', 'soft / faded'],
    match: r => !omIsMono(r) && omWheelMag(r) < 1.6 && omToneSep(r) < 0,
  },
  {
    name: 'Kodachrome-like', color: '#c8a030',
    desc: 'Strong reds and orange-reds with elevated contrast — the slide-film postcard look. Saturated without going universally vivid.',
    traits: ['red / orangeRed strong', 'contrast +1 or more', 'slide film'],
    match: r => !omIsMono(r) &&
      omMean([r.color_wheel.red || 0, r.color_wheel.orangeRed || 0]) >= 2 &&
      (r.contrast || 0) >= 1,
  },
  {
    name: 'Warm Analog', color: '#d4a843',
    desc: 'Warm-tilted grades chasing consumer colour negative film — Gold, Portra, Superia. Nostalgic rather than punchy.',
    traits: ['warm tilt', 'nostalgic / vintage / analog', 'negative film'],
    match: r => !omIsMono(r) && recipeWarmthOm(r) === 'warm' &&
      (r.mood_keywords || []).some(m => ['nostalgic', 'vintage', 'retro', 'analog', 'filmic'].includes(m)),
  },
  {
    name: 'Cool Cinematic', color: '#5b9af0',
    desc: 'Cool-tilted, atmospheric grades. Blue and cyan carry the image; often paired with a moody or gritty keyword set.',
    traits: ['cool tilt', 'cinematic / moody / gritty', 'atmospheric'],
    match: r => !omIsMono(r) && recipeWarmthOm(r) === 'cool' &&
      (r.mood_keywords || []).some(m => ['cinematic', 'moody', 'gritty', 'cool', 'stark'].includes(m)),
  },
  {
    name: 'Vivid Punch', color: '#e05c5c',
    desc: 'Aggressive wheel pushes across many channels, usually with positive contrast. Built for saturated outdoor light.',
    traits: ['high wheel magnitude', 'contrast up', 'landscape / nature'],
    match: r => !omIsMono(r) && recipePunchOm(r) === 'punchy',
  },
  {
    name: 'Monochrome', color: '#c0c0d0',
    desc: 'Mono profiles with colour filters and optional film grain. Tonal separation replaces colour entirely — all three here run a hard S-curve.',
    traits: ['Monochrome Profile 2 / 3', 'red or orange filter', 'high contrast'],
    match: r => omIsMono(r),
  },
]

let omDirectionsBuilt = false

function renderOmDirections() {
  const grid = document.getElementById('dir-grid')
  if (!grid) return
  grid.innerHTML = ''
  const pool = activeRecipes()

  OM_DIRECTIONS.forEach(d => {
    const members = pool.filter(d.match)
    const card = document.createElement('div')
    card.className = 'dir-card'
    card.style.borderLeftColor = d.color
    const links = members.slice(0, 8).map(r => `<span class="dir-link" data-name="${r.name}">${r.name}</span>`).join(', ')
      + (members.length > 8 ? ` +${members.length - 8} more` : '')
    card.innerHTML = `<h4>${d.name}</h4><div class="dir-desc">${d.desc}</div>
    <div class="dir-traits">${d.traits.map(t => `<span class="dir-trait">${t}</span>`).join('')}</div>
    <div class="dir-recipes"><strong style="color:var(--text2)">${members.length} recipes:</strong> ${links || '<em style="color:var(--text3)">none matched</em>'}</div>`
    grid.appendChild(card)
    card.querySelectorAll('.dir-link[data-name]').forEach(el => {
      el.addEventListener('click', () => goRecipe(el.dataset.name))
    })
  })
  omDirectionsBuilt = true
}

// ══════════════════════════════════════════
// INSIGHTS — CORRELATION
// ══════════════════════════════════════════
// Computed live from RECIPES_OM rather than from a precomputed blob. 66 recipes
// is instant, and the tab can never go stale as recipes are added.

const OM_CORR_FIELDS = ['contrast', 'sharpness', 'highlights', 'shadows', 'midtones', 'wheelMag']
const OM_FIELD_LABEL = {
  contrast: 'Contrast', sharpness: 'Sharpness', highlights: 'Highlights',
  shadows: 'Shadows', midtones: 'Midtones', wheelMag: 'Wheel push',
}
const OM_FIELD_COLOR_POS = {
  contrast: '#e05c5c', sharpness: '#9b7fe8', highlights: '#e8c05a',
  shadows: '#e07842', midtones: '#4db8aa', wheelMag: '#4caf7d',
}

// Keywords carried by fewer than this many recipes are dropped — with a pool of
// 66 their deltas are noise, and presenting noise as signal is worse than a gap.
const OM_CORR_MIN_N = 3

function omFieldVal(r, f) {
  return f === 'wheelMag' ? omWheelMag(r) : (r[f] ?? 0)
}

function computeOmCorrelations() {
  const pool = activeRecipes()
  if (!pool.length) return { entries: [], maxDelta: 0.1 }

  const globalMeans = {}
  OM_CORR_FIELDS.forEach(f => { globalMeans[f] = omMean(pool.map(r => omFieldVal(r, f))) })

  const byKw = {}
  pool.forEach(r => {
    const kws = new Set([...(r.mood_keywords || []), ...(r.scenario_keywords || [])])
    kws.forEach(k => { (byKw[k] = byKw[k] || []).push(r) })
  })

  let maxDelta = 0
  const entries = Object.entries(byKw)
    .filter(([, rs]) => rs.length >= OM_CORR_MIN_N)
    .map(([kw, rs]) => {
      const deltas = {}, means = {}
      OM_CORR_FIELDS.forEach(f => {
        means[f]  = omMean(rs.map(r => omFieldVal(r, f)))
        deltas[f] = means[f] - globalMeans[f]
        if (Math.abs(deltas[f]) > maxDelta) maxDelta = Math.abs(deltas[f])
      })
      const types = {}
      rs.forEach(r => { const t = r.recipe_type || 'COLOR'; types[t] = (types[t] || 0) + 1 })
      return { kw, count: rs.length, deltas, means, types }
    })
    .sort((a, b) => b.count - a.count)

  return { entries, maxDelta: Math.max(maxDelta, 0.1) }
}

function omBuildInsight(field, delta) {
  const mag = Math.abs(delta)
  if (mag < 0.2) return ''
  const sign = delta > 0 ? 'higher' : 'lower'
  const desc = {
    contrast:   delta > 0 ? 'firmer tone curve' : 'softer, flatter tone curve',
    sharpness:  delta > 0 ? 'sharper rendering' : 'softer rendering',
    highlights: delta > 0 ? 'brighter highlights (more separation up top)' : 'pulled-down highlights',
    shadows:    delta > 0 ? 'lifted shadow floor' : 'deeper, denser shadows',
    midtones:   delta > 0 ? 'lifted midtones' : 'dropped midtones',
    wheelMag:   delta > 0 ? 'a more aggressive colour grade' : 'a restrained, near-neutral grade',
  }[field] || ''
  return `<strong>${OM_FIELD_LABEL[field]}</strong> is ${sign} than average (${delta > 0 ? '+' : ''}${delta.toFixed(1)}): ${desc}`
}

function renderOmCorrelations(filterQ) {
  const grid = document.getElementById('corr-grid')
  if (!grid) return
  grid.innerHTML = ''

  const { entries, maxDelta } = computeOmCorrelations()
  const fq = (filterQ || '').toLowerCase()
  const shown = entries.filter(e => !fq || e.kw.includes(fq))

  if (!shown.length) {
    grid.innerHTML = `<div class="empty">No keywords with ${OM_CORR_MIN_N}+ recipes match that search.</div>`
    return
  }

  shown.forEach(({ kw, count, deltas, types }) => {
    const card = document.createElement('div')
    card.className = 'corr-card'

    const strongest = OM_CORR_FIELDS.filter(f => deltas[f] != null)
      .sort((a, b) => Math.abs(deltas[b]) - Math.abs(deltas[a]))[0]
    const insight = strongest ? omBuildInsight(strongest, deltas[strongest]) : ''

    const deltaRows = OM_CORR_FIELDS.map(f => {
      const d = deltas[f]
      if (d == null) return ''
      const pct = Math.round(Math.abs(d) / maxDelta * 46)
      const pos = d > 0
      const barStyle = pos
        ? `left:50%;width:${pct}%;background:${OM_FIELD_COLOR_POS[f]}`
        : `right:50%;width:${pct}%;background:#5b9af0`
      return `<div class="delta-row">
        <div class="delta-lbl">${OM_FIELD_LABEL[f]}</div>
        <div class="delta-track">
          <div class="delta-center"></div>
          <div class="delta-bar ${pos ? 'delta-pos' : 'delta-neg'}" style="${barStyle}"></div>
        </div>
        <div class="delta-val" style="color:${pos ? 'var(--orange)' : 'var(--blue)'}">${pos ? '+' : ''}${d.toFixed(1)}</div>
      </div>`
    }).join('')

    const typePills = Object.entries(types).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `<span class="dr-pill">${k}: ${v}</span>`).join('')

    card.innerHTML = `
      <div class="corr-header">
        <div class="corr-kw">${kw}</div>
        <div class="corr-n">n = ${count}</div>
      </div>
      <div class="delta-bars">${deltaRows}</div>
      ${insight ? `<div style="font-size:10px;color:var(--text3);margin-top:8px;font-style:italic;line-height:1.4">${insight}</div>` : ''}
      <div class="dr-pills">${typePills}</div>`

    card.addEventListener('click', () => {
      switchTab('grid')
      switchInnerTab('inner-recipes-keywords')
    })
    grid.appendChild(card)
  })
}

// ══════════════════════════════════════════
// INSIGHTS — SETTINGS GUIDE
// ══════════════════════════════════════════
// Same item shape as Fuji's SETTINGS_DATA so buildSgCard() renders it unchanged.
// Ranges quoted are what actually appears across the 66 recipes, not the
// camera's theoretical limits.

const OM_SETTINGS_DATA = [
  {
    section: 'Color Creator',
    items: [
      {
        name: '12-Point Color Wheel',
        subtitle: 'The defining OM control — per-hue saturation',
        icon: '🎨',
        iconBg: 'rgba(212,168,67,.18)',
        range: 'Each channel −7 to +7 (0 = untouched); −5 to +5 in this collection',
        desc: 'Twelve independent hue channels, each raising or lowering the saturation of <em>that hue only</em>. This is the single most important thing to understand about OM recipes: a positive value does <strong>not</strong> tint the image toward that colour — it makes pixels already in that hue more or less vivid. Pushing Blue +5 makes existing blues richer; it does not add a blue cast.',
        spectrum: [
          { label: 'Y',  color: '#FCF750' },
          { label: 'O',  color: '#DBA12A' },
          { label: 'R',  color: '#CD076B' },
          { label: 'V',  color: '#7710E8' },
          { label: 'B',  color: '#3054E0' },
          { label: 'C',  color: '#83E7EB' },
          { label: 'G',  color: '#9DEE3A' },
        ],
        spectrumLabel: 'The 12 channels run clockwise from Yellow',
        effects: [
          { dir: 'up',   label: 'Warm channels up', text: '<strong>Yellow, Orange, OrangeRed, Red</strong> — richer skin, foliage in autumn, golden light. The fastest route to a warm-looking grade.' },
          { dir: 'up',   label: 'Cool channels up', text: '<strong>Blue, BlueCyan, Cyan</strong> — deeper sky, richer shade and water. Combined with warm channels up, this produces the teal-and-orange split.' },
          { dir: 'down', label: 'Selective pull-down', text: 'Dropping <strong>Green / YellowGreen</strong> is the classic trick for taming electric foliage without touching anything else.' },
          { dir: 'down', label: 'Global pull-down', text: 'Pulling most channels negative yields the faded, desaturated pastel look — much gentler than dropping saturation globally.' },
        ],
        tip: 'The wheel dominates the <strong>punch</strong> badge on this site: mean absolute push across all 12 channels is the largest term in the formula. A recipe with a flat wheel reads "flat" almost regardless of its tone curve.',
        presets: [],
      },
    ],
  },
  {
    section: 'Tone',
    items: [
      {
        name: 'Contrast',
        subtitle: 'Global tone curve firmness',
        icon: '◐',
        iconBg: 'rgba(224,92,92,.18)',
        range: '−2 to +2 in this collection',
        desc: 'A narrow dial with real leverage. Because the range is only ±2, a single step is a visible change — unlike the Fuji Color dial where ±4 gives finer gradations.',
        spectrum: [
          { label: '−2', color: '#4a4a58' },
          { label: '−1', color: '#5e5e70' },
          { label: '0',  color: '#7a7a8a' },
          { label: '+1', color: '#a85a3a' },
          { label: '+2', color: '#c04010' },
        ],
        effects: [
          { dir: 'up',   label: 'Positive', text: 'Firmer blacks, brighter whites. Pairs naturally with a wide highlight/shadow separation for a hard S-curve.' },
          { dir: 'down', label: 'Negative', text: 'Flatter, more editable, more filmic. Common in the faded and pastel recipes.' },
        ],
        tip: 'Contrast and the highlight/shadow separation work together. Contrast +2 with Highlights +3 / Shadows −4 is a genuinely hard curve — that combination is what all three monochrome recipes here use.',
        presets: [],
      },
      {
        name: 'Highlights / Midtones / Shadows',
        subtitle: 'Three-band tone curve',
        icon: '📈',
        iconBg: 'rgba(232,192,90,.18)',
        range: 'Highlights −6..+4 · Shadows −6..+4 · Midtones −3..+6',
        desc: 'Three independent handles on the tone curve. The key insight is that <strong>Highlights up with Shadows down widens the curve</strong> — it increases contrast rather than flattening the image. This is the opposite of how an absolute "spread" reads on Fuji.',
        spectrum: null,
        effects: [
          { dir: 'up',   label: 'Highlights + / Shadows −', text: 'A hard S-curve. Measured across this collection, recipes tagged high-contrast or dramatic average <strong>+0.98</strong> separation.' },
          { dir: 'down', label: 'Highlights − / Shadows +', text: 'A compressed, lifted curve — the faded look. Recipes tagged soft or faded average <strong>−0.96</strong> separation.' },
          { dir: 'up',   label: 'Midtones', text: 'Shifts the body of the image up or down without touching either end. Useful for exposure feel without clipping.' },
        ],
        tip: 'The <strong>punch</strong> badge uses signed separation, <code>(Highlights − Shadows) / 2</code>, precisely because of this. An earlier draft used an absolute spread and scored every monochrome recipe here as "flat" despite all three being explicitly high-contrast.',
        presets: [],
      },
      {
        name: 'Sharpness',
        subtitle: 'Edge accentuation',
        icon: '🔪',
        iconBg: 'rgba(155,127,232,.18)',
        range: '−2 to +2 in this collection',
        desc: 'Straightforward edge accentuation. Most recipes here sit at 0 or slightly negative — softening is more common than sharpening, since it reads as more filmic.',
        spectrum: null,
        effects: [
          { dir: 'up',   label: 'Positive', text: 'Crisper detail. Can look digital on skin at +2.' },
          { dir: 'down', label: 'Negative', text: 'Softer, more analog. Pairs well with film grain on the monochrome profiles.' },
        ],
        tip: 'Sharpness does not feed either badge on this site — it is a rendering preference rather than a look-defining choice.',
        presets: [],
      },
    ],
  },
  {
    section: 'White Balance',
    items: [
      {
        name: 'WB Preset & Custom Kelvin',
        subtitle: 'The base colour temperature',
        icon: '🌡',
        iconBg: 'rgba(91,154,240,.18)',
        range: 'Auto · Custom WB · 5300K (Fine Weather) · 6000K (Cloudy) · 4200–7500K custom',
        desc: 'Most recipes in this collection specify <strong>Auto</strong> or <strong>Custom WB 1</strong> without a stated temperature — only 19 of 66 carry an explicit kelvin value. That matters for how the site scores warmth.',
        spectrum: [
          { label: '4200K', color: '#7a9ad0' },
          { label: '5300K', color: '#b8b8c0' },
          { label: '6000K', color: '#d8b888' },
          { label: '7500K', color: '#e09850' },
        ],
        effects: [
          { dir: 'up',   label: 'Higher kelvin', text: 'Warmer rendering — the camera compensates for cool light by adding amber.' },
          { dir: 'down', label: 'Lower kelvin', text: 'Cooler rendering. 4200K is the coolest custom value in this collection.' },
        ],
        tip: 'Because temperature is unknown for 71% of these recipes, the <strong>warmth</strong> badge drops the kelvin term out of its weighted average entirely when it is missing, rather than assuming a neutral 5200K. Assuming a default is what collapsed an earlier draft into 59-of-66 "neutral".',
        presets: [],
      },
      {
        name: 'Amber / Green Offset',
        subtitle: 'Two-axis WB fine tuning',
        icon: '🎯',
        iconBg: 'rgba(76,175,125,.18)',
        range: 'Amber −5..+7 · Green −5..+7 in this collection',
        desc: 'A two-axis offset applied on top of whatever WB mode is selected. Amber runs warm/blue, Green runs green/magenta. Unlike the colour wheel, this <em>does</em> tint the whole image.',
        spectrum: null,
        effects: [
          { dir: 'up',   label: 'Amber positive', text: 'Warms globally. This is the most direct warm control OM offers and the second-largest term in the warmth badge.' },
          { dir: 'down', label: 'Green axis', text: 'Positive pushes green, negative pushes magenta. Small values (±2) are typical; larger ones read as a deliberate cross-process effect.' },
        ],
        tip: 'Amber offset and the colour wheel can disagree — "OMTC Warm" runs Amber +4 (genuinely warm) while pushing Blue +4 / Cyan +5 (cool <em>emphasis</em>). Both are true at once, which is why the sidebar facet is called Hue Emphasis rather than Colour Cast.',
        presets: [],
      },
    ],
  },
  {
    section: 'Monochrome',
    items: [
      {
        name: 'Mono Profile & Colour Filter',
        subtitle: 'Black-and-white rendering',
        icon: '⬛',
        iconBg: 'rgba(192,192,208,.18)',
        range: 'Profiles 1–3 · Red / Orange / Yellow / Green filter · strength 0–3',
        desc: 'Monochrome profiles replace the colour wheel entirely. The colour filter works like a physical filter on a film camera: it lightens its own hue and darkens the complement.',
        spectrum: null,
        effects: [
          { dir: 'up',   label: 'Red filter', text: 'Dramatically darkens blue sky, lightens skin. The strongest, most theatrical option — both "Ode to Ansel" and "Sydney Grain" use it.' },
          { dir: 'up',   label: 'Orange filter', text: 'A gentler version of red. Good general-purpose landscape and portrait choice.' },
          { dir: 'down', label: 'Filter strength', text: 'Scales the effect 0–3. Strength 0 means the filter is selected but inactive.' },
        ],
        tip: 'All three monochrome recipes in this collection run a hard S-curve — Highlights +3 or +4 against Shadows −4 or −5. Mono here is about tonal separation, not flat grey.',
        presets: [],
      },
      {
        name: 'Film Grain & Hue',
        subtitle: 'Texture and toning',
        icon: '🎞',
        iconBg: 'rgba(224,120,66,.18)',
        range: 'Grain Off / Low / Standard / High · Hue Normal / Sepia / Blue / Purple / Green',
        desc: 'Film grain adds texture at capture; film hue tones the monochrome image. Only "Sydney Grain" uses High grain in this collection — the rest leave it Off.',
        spectrum: null,
        effects: [
          { dir: 'up',   label: 'Higher grain', text: 'More texture, more analog. Reads strongest in flat midtone areas like sky.' },
          { dir: 'up',   label: 'Film hue', text: 'Tones the whole monochrome image. Every recipe here uses Normal — sepia and blue toning are unexplored territory in this collection.' },
        ],
        tip: 'Grain pairs naturally with negative sharpness. Sharpening a grainy image accentuates the grain itself rather than real detail.',
        presets: [],
      },
    ],
  },
]

let omSettingsBuilt = false

function renderOmSettingsGuide() {
  const container = document.getElementById('sg-grid')
  if (!container) return
  if (omSettingsBuilt) return
  omSettingsBuilt = true
  container.innerHTML = ''

  OM_SETTINGS_DATA.forEach(section => {
    const secDiv = document.createElement('div')
    const cardsDiv = document.createElement('div')
    cardsDiv.className = 'sg-cards'
    section.items.forEach(item => cardsDiv.appendChild(buildSgCard(item)))
    secDiv.innerHTML = `<div class="sg-section-title">${section.section}</div>`
    secDiv.appendChild(cardsDiv)
    container.appendChild(secDiv)
  })
}

function resetOmInsightsBuilt() {
  omSettingsBuilt = false
  omDirectionsBuilt = false
}

// ══════════════════════════════════════════
// EXPLORE
// ══════════════════════════════════════════
// The 12-point wheel is the primary draggable control, playing the role Fuji's
// 5-axis radar plays. Geometry is shared with buildOmWheelSvg() in index.html:
// viewBox 0 0 260 260, centre (130,130), radius = 49.23 + 6.15*v.

const OM_WHEEL_REF_HUE = {
  yellow:'#FCF750', orange:'#DBA12A', orangeRed:'#CC1210', red:'#CD076B',
  magenta:'#970AA0', violet:'#7710E8', blue:'#3054E0', blueCyan:'#5392EB',
  cyan:'#83E7EB', greenCyan:'#87EE77', green:'#9DEE3A', yellowGreen:'#CBEE3A',
}

const OM_WHEEL_LABEL = {
  yellow:'Yellow', orange:'Orange', orangeRed:'Orange-Red', red:'Red',
  magenta:'Magenta', violet:'Violet', blue:'Blue', blueCyan:'Blue-Cyan',
  cyan:'Cyan', greenCyan:'Green-Cyan', green:'Green', yellowGreen:'Yellow-Green',
}

// Tone params: [key, label, lo, hi]. Ranges are what the camera allows, which
// is wider than what this collection happens to use.
const OM_TONE_PARAMS = [
  ['contrast',              'Contrast',   -2, 2],
  ['sharpness',             'Sharpness',  -2, 2],
  ['highlights',            'Highlights', -7, 7],
  ['shadows',               'Shadows',    -7, 7],
  ['midtones',              'Midtones',   -7, 7],
  ['exposure_compensation', 'Exposure',   -7, 7],
]

// Similarity normalisation divisors — every term scaled to roughly 0..1 so each
// contributes comparably. shading_effect is excluded: it is 0 on all 66 recipes.
const OM_SIM_DIV = {
  contrast: 4, sharpness: 4, highlights: 10, shadows: 10,
  midtones: 9, exposure_compensation: 12,
  wb_amber_offset: 14, wb_green_offset: 14,
}

const TOM = {
  seedName: null,
  type_filter: '',
  color_wheel: {},
  contrast: 0, sharpness: 0,
  highlights: 0, shadows: 0, midtones: 0,
  exposure_compensation: 0,
  wb_amber_offset: 0, wb_green_offset: 0,
}
OM_WHEEL_ORDER.forEach(k => { TOM.color_wheel[k] = 0 })

let omExploreBuilt = false
let omExpTimer = null
let omExpShowYours = true
let omExpShowMatch = true

function omExpDebounce() {
  clearTimeout(omExpTimer)
  omExpTimer = setTimeout(() => {
    renderOmExploreResults()
    updateOmWheelOverlay()
    updateOmWbDot()
  }, 80)
}

function omRecipeToTom(r) {
  const cw = {}
  OM_WHEEL_ORDER.forEach(k => { cw[k] = (r.color_wheel && r.color_wheel[k]) || 0 })
  return {
    seedName: r.name,
    type_filter: TOM.type_filter,
    color_wheel: cw,
    contrast: r.contrast ?? 0,
    sharpness: r.sharpness ?? 0,
    highlights: r.highlights ?? 0,
    shadows: r.shadows ?? 0,
    midtones: r.midtones ?? 0,
    exposure_compensation: r.exposure_compensation ?? 0,
    wb_amber_offset: r.wb_amber_offset ?? 0,
    wb_green_offset: r.wb_green_offset ?? 0,
  }
}

function computeOmSimilarity(t) {
  let pool = activeRecipes()
  if (t.type_filter) pool = pool.filter(r => (r.recipe_type || 'COLOR') === t.type_filter)

  // Wheel distance is meaningless against a null wheel, so once the user has
  // pushed any channel we stop offering mono recipes as matches.
  const wheelActive = OM_WHEEL_ORDER.some(k => (t.color_wheel[k] || 0) !== 0)
  if (wheelActive && !t.type_filter) pool = pool.filter(r => !omIsMono(r))

  return pool.map(r => {
    const rt = omRecipeToTom(r)
    let sum = 0
    if (!omIsMono(r)) {
      OM_WHEEL_ORDER.forEach(k => {
        const d = ((t.color_wheel[k] || 0) - (rt.color_wheel[k] || 0)) / 14
        sum += d * d
      })
    }
    Object.keys(OM_SIM_DIV).forEach(k => {
      const d = ((t[k] || 0) - (rt[k] || 0)) / OM_SIM_DIV[k]
      sum += d * d
    })
    return { r, dist: Math.sqrt(sum) }
  }).sort((a, b) => a.dist - b.dist).map(x => x.r)
}

function omSeedRecipe(name) {
  if (!name) {
    OM_WHEEL_ORDER.forEach(k => { TOM.color_wheel[k] = 0 })
    Object.assign(TOM, {
      seedName: null,
      contrast: 0, sharpness: 0, highlights: 0, shadows: 0, midtones: 0,
      exposure_compensation: 0, wb_amber_offset: 0, wb_green_offset: 0,
    })
  } else {
    const r = activeRecipes().find(x => x.name === name)
    if (r) {
      const t = omRecipeToTom(r)
      OM_WHEEL_ORDER.forEach(k => { TOM.color_wheel[k] = t.color_wheel[k] })
      Object.assign(TOM, {
        seedName: t.seedName,
        contrast: t.contrast, sharpness: t.sharpness,
        highlights: t.highlights, shadows: t.shadows, midtones: t.midtones,
        exposure_compensation: t.exposure_compensation,
        wb_amber_offset: t.wb_amber_offset, wb_green_offset: t.wb_green_offset,
      })
    }
  }
  syncOmExploreControls()
  renderOmExploreResults()
  updateOmWheelOverlay()
  updateOmWbDot()
}

// ─── wheel geometry (shared with buildOmWheelSvg) ─────────────────────────

const OM_WHEEL_CX = 130, OM_WHEEL_CY = 130
const omWheelRadius = v => clamp(49.23 + 6.15 * (v ?? 0), 8, 130)
const omWheelAngle  = i => (2 * Math.PI * i / OM_WHEEL_ORDER.length) - Math.PI / 2
const omWheelPoint  = (i, v) => ({
  x: OM_WHEEL_CX + omWheelRadius(v) * Math.cos(omWheelAngle(i)),
  y: OM_WHEEL_CY + omWheelRadius(v) * Math.sin(omWheelAngle(i)),
})
// Inverse of omWheelRadius, for turning a drag position back into a value.
const omRadiusToVal = r => clamp(Math.round((r - 49.23) / 6.15), -7, 7)

function buildOmWheelPane() {
  const svg = document.getElementById('omexp-wheel-svg')
  if (!svg) return
  const N = OM_WHEEL_ORDER.length

  const ringPts = OM_WHEEL_ORDER.map((k, i) => {
    const ang = omWheelAngle(i)
    return { x: OM_WHEEL_CX + 118 * Math.cos(ang), y: OM_WHEEL_CY + 118 * Math.sin(ang), k }
  })
  const outerSegs = ringPts.map((p, i) => {
    const next = ringPts[(i + 1) % N]
    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${next.x.toFixed(1)}" y2="${next.y.toFixed(1)}" stroke="${OM_WHEEL_REF_HUE[p.k]}" stroke-width="4"/>`
  }).join('')

  const spokes = OM_WHEEL_ORDER.map((k, i) => {
    const ang = omWheelAngle(i)
    return `<line x1="${OM_WHEEL_CX}" y1="${OM_WHEEL_CY}" x2="${(OM_WHEEL_CX + 112 * Math.cos(ang)).toFixed(1)}" y2="${(OM_WHEEL_CY + 112 * Math.sin(ang)).toFixed(1)}" stroke="#2e2e38" stroke-width="1"/>`
  }).join('')

  const rings = [
    `<circle cx="${OM_WHEEL_CX}" cy="${OM_WHEEL_CY}" r="${omWheelRadius(-7).toFixed(1)}" fill="none" stroke="#26262e" stroke-width="1"/>`,
    `<circle cx="${OM_WHEEL_CX}" cy="${OM_WHEEL_CY}" r="49.23" fill="none" stroke="#3e3e50" stroke-width="1.4"/>`,
    `<circle cx="${OM_WHEEL_CX}" cy="${OM_WHEEL_CY}" r="${omWheelRadius(7).toFixed(1)}" fill="none" stroke="#26262e" stroke-width="1"/>`,
  ].join('')

  const chLabels = OM_WHEEL_ORDER.map((k, i) => {
    const ang = omWheelAngle(i)
    const lx = OM_WHEEL_CX + 132 * Math.cos(ang)
    const ly = OM_WHEEL_CY + 132 * Math.sin(ang)
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#5e5e6e" font-family="Inter,sans-serif">${OM_WHEEL_ABBR[k]}</text>`
  }).join('')

  svg.innerHTML = `${outerSegs}${spokes}${rings}${chLabels}
    <polygon id="omexp-ghost" points="" fill="rgba(91,154,240,.08)" stroke="#5b9af0" stroke-width="1.6" stroke-dasharray="5,3"/>
    <polygon id="omexp-yours" points="" fill="rgba(212,168,67,.15)" stroke="#d4a843" stroke-width="2.2"/>
    <g id="omexp-handles"></g>
    <g id="omexp-vlabels"></g>`

  updateOmWheelOverlay()
  wireOmWheelDrag(svg)
}

function updateOmWheelOverlay() {
  const yours = document.getElementById('omexp-yours')
  const ghost = document.getElementById('omexp-ghost')
  const handles = document.getElementById('omexp-handles')
  const vlabels = document.getElementById('omexp-vlabels')
  if (!yours || !handles) return

  const pts = OM_WHEEL_ORDER.map((k, i) => omWheelPoint(i, TOM.color_wheel[k]))
  yours.setAttribute('points', pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
  yours.style.opacity = omExpShowYours ? '1' : '.1'

  const match = computeOmSimilarity(TOM)[0]
  if (ghost) {
    if (match && !omIsMono(match)) {
      const gp = OM_WHEEL_ORDER.map((k, i) => omWheelPoint(i, match.color_wheel[k] || 0))
      ghost.setAttribute('points', gp.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '))
      ghost.style.opacity = omExpShowMatch ? '1' : '.1'
    } else {
      ghost.setAttribute('points', '')
    }
  }

  handles.innerHTML = OM_WHEEL_ORDER.map((k, i) => {
    const p = pts[i]
    const d = 4.5
    const poly = `${p.x},${p.y - d} ${p.x + d},${p.y} ${p.x},${p.y + d} ${p.x - d},${p.y}`
    return `<polygon class="omexp-handle" data-ch="${k}" points="${poly}" fill="#d4a843" stroke="#0d0d0f" stroke-width=".8" style="cursor:grab"/>`
  }).join('')

  vlabels.innerHTML = OM_WHEEL_ORDER.map((k, i) => {
    const v = TOM.color_wheel[k] || 0
    if (v === 0) return ''
    const ang = omWheelAngle(i)
    const r = omWheelRadius(v) + 13
    const lx = OM_WHEEL_CX + r * Math.cos(ang)
    const ly = OM_WHEEL_CY + r * Math.sin(ang)
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="700" fill="#e8c05a" font-family="Inter,sans-serif">${v > 0 ? '+' + v : v}</text>`
  }).join('')

  const matchLbl = document.getElementById('omexp-match-name')
  if (matchLbl) matchLbl.textContent = match ? match.name : '—'
}

function wireOmWheelDrag(svg) {
  let dragCh = null

  const pointFromEvent = e => {
    const pt = svg.createSVGPoint()
    const src = e.touches ? e.touches[0] : e
    pt.x = src.clientX; pt.y = src.clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  const applyDrag = e => {
    if (!dragCh) return
    e.preventDefault()
    const loc = pointFromEvent(e)
    const i = OM_WHEEL_ORDER.indexOf(dragCh)
    const ang = omWheelAngle(i)
    // Project the pointer onto this channel's spoke, then invert the radius map.
    const proj = (loc.x - OM_WHEEL_CX) * Math.cos(ang) + (loc.y - OM_WHEEL_CY) * Math.sin(ang)
    const val = omRadiusToVal(proj)
    if (val !== TOM.color_wheel[dragCh]) {
      TOM.color_wheel[dragCh] = val
      TOM.seedName = null
      updateOmWheelOverlay()
      omExpDebounce()
    }
  }

  const start = e => {
    const t = e.target
    if (!t.classList || !t.classList.contains('omexp-handle')) return
    dragCh = t.dataset.ch
    e.preventDefault()
  }
  const end = () => { dragCh = null }

  svg.addEventListener('mousedown', start)
  svg.addEventListener('touchstart', start, { passive: false })
  window.addEventListener('mousemove', applyDrag)
  window.addEventListener('touchmove', applyDrag, { passive: false })
  window.addEventListener('mouseup', end)
  window.addEventListener('touchend', end)
}

// ─── WB box ───────────────────────────────────────────────────────────────

function buildOmWbPane() {
  const svg = document.getElementById('omexp-wb-svg')
  if (!svg) return
  svg.innerHTML = `
    <rect x="4" y="4" width="142" height="142" rx="10" fill="#131318" stroke="#2e2e34" stroke-width="1"/>
    <rect x="4" y="4" width="142" height="4" fill="#4caf81"/>
    <rect x="4" y="142" width="142" height="4" fill="#d84ad0"/>
    <rect x="142" y="4" width="4" height="142" fill="#e8934a"/>
    <rect x="4" y="4" width="4" height="142" fill="#3054E0"/>
    <line x1="75" y1="12" x2="75" y2="138" stroke="#26262e" stroke-width="1"/>
    <line x1="12" y1="75" x2="138" y2="75" stroke="#26262e" stroke-width="1"/>
    <g id="omexp-wb-match"></g>
    <polygon id="omexp-wb-dot" points="" fill="#d4a843" stroke="#0d0d0f" stroke-width=".8" style="cursor:grab"/>`
  updateOmWbDot()
  wireOmWbDrag(svg)
}

function updateOmWbDot() {
  const dot = document.getElementById('omexp-wb-dot')
  if (!dot) return
  const x = 75 + clamp(TOM.wb_amber_offset, -7, 7) * 7
  const y = 75 - clamp(TOM.wb_green_offset, -7, 7) * 7
  const d = 5
  dot.setAttribute('points', `${x},${y - d} ${x + d},${y} ${x},${y + d} ${x - d},${y}`)

  const g = document.getElementById('omexp-wb-match')
  const match = computeOmSimilarity(TOM)[0]
  if (g) {
    if (match) {
      const mx = 75 + clamp(match.wb_amber_offset ?? 0, -7, 7) * 7
      const my = 75 - clamp(match.wb_green_offset ?? 0, -7, 7) * 7
      g.innerHTML = `<line x1="${mx - 8}" y1="${my}" x2="${mx + 8}" y2="${my}" stroke="#5b9af0" stroke-width=".9"/>
        <line x1="${mx}" y1="${my - 8}" x2="${mx}" y2="${my + 8}" stroke="#5b9af0" stroke-width=".9"/>
        <circle cx="${mx}" cy="${my}" r="3" fill="none" stroke="#5b9af0" stroke-width=".8"/>`
      g.style.opacity = omExpShowMatch ? '1' : '.1'
    } else g.innerHTML = ''
  }

  const lbl = document.getElementById('omexp-wb-vals')
  if (lbl) {
    const a = TOM.wb_amber_offset, gr = TOM.wb_green_offset
    lbl.textContent = `A${a >= 0 ? '+' : ''}${a}  G${gr >= 0 ? '+' : ''}${gr}`
  }
}

function wireOmWbDrag(svg) {
  let dragging = false
  const move = e => {
    if (!dragging) return
    e.preventDefault()
    const pt = svg.createSVGPoint()
    const src = e.touches ? e.touches[0] : e
    pt.x = src.clientX; pt.y = src.clientY
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse())
    const a = clamp(Math.round((loc.x - 75) / 7), -7, 7)
    const g = clamp(Math.round((75 - loc.y) / 7), -7, 7)
    if (a !== TOM.wb_amber_offset || g !== TOM.wb_green_offset) {
      TOM.wb_amber_offset = a
      TOM.wb_green_offset = g
      TOM.seedName = null
      updateOmWbDot()
      omExpDebounce()
    }
  }
  const start = e => { dragging = true; move(e) }
  const end = () => { dragging = false }
  svg.addEventListener('mousedown', start)
  svg.addEventListener('touchstart', start, { passive: false })
  window.addEventListener('mousemove', move)
  window.addEventListener('touchmove', move, { passive: false })
  window.addEventListener('mouseup', end)
  window.addEventListener('touchend', end)
}

// ─── tone steppers ────────────────────────────────────────────────────────

function buildOmSteppers() {
  const wrap = document.getElementById('omexp-steppers')
  if (!wrap) return
  wrap.innerHTML = `<div class="exp-compact-title">Tone</div>
    <div class="exp-compact-grid">${OM_TONE_PARAMS.map(([key, label, lo, hi]) => `
      <div class="exp-compact-row" data-key="${key}">
        <span class="exp-compact-lbl">${label}</span>
        <button class="exp-stepper-btn" data-dir="-1">−</button>
        <span class="exp-stepper-val" id="omexp-sv-${key}">${TOM[key]}</span>
        <button class="exp-stepper-btn" data-dir="1">+</button>
        <span class="exp-diff-pill neut" id="omexp-dp-${key}"></span>
      </div>`).join('')}</div>`

  wrap.querySelectorAll('.exp-compact-row').forEach(row => {
    const key = row.dataset.key
    const [, , lo, hi] = OM_TONE_PARAMS.find(p => p[0] === key)
    row.querySelectorAll('.exp-stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        TOM[key] = clamp(TOM[key] + parseInt(btn.dataset.dir), lo, hi)
        TOM.seedName = null
        document.getElementById('omexp-sv-' + key).textContent = TOM[key]
        omExpDebounce()
      })
    })
  })
}

function syncOmExploreControls() {
  OM_TONE_PARAMS.forEach(([key]) => {
    const el = document.getElementById('omexp-sv-' + key)
    if (el) el.textContent = TOM[key]
  })
  updateOmWheelOverlay()
  updateOmWbDot()
  const seedInput = document.getElementById('omexp-seed-input')
  if (seedInput && TOM.seedName) seedInput.value = TOM.seedName
}

// ─── results ──────────────────────────────────────────────────────────────

function renderOmExploreResults() {
  const list = document.getElementById('omexp-results-list')
  if (!list) return
  const results = computeOmSimilarity(TOM).slice(0, 6)

  if (!results.length) {
    list.innerHTML = '<div class="empty">No recipes match that filter.</div>'
    return
  }

  list.innerHTML = ''
  results.forEach(r => {
    const card = document.createElement('div')
    card.className = 'exp-result-card'

    const diffs = []
    OM_TONE_PARAMS.forEach(([key, label]) => {
      const d = (r[key] ?? 0) - TOM[key]
      if (d !== 0) diffs.push(`<span class="exp-diff-pill ${d > 0 ? 'pos' : 'neg'}">${label} ${d > 0 ? '+' : ''}${d}</span>`)
    })
    if (!omIsMono(r)) {
      OM_WHEEL_ORDER.forEach(k => {
        const d = (r.color_wheel[k] || 0) - (TOM.color_wheel[k] || 0)
        if (Math.abs(d) >= 3) diffs.push(`<span class="exp-diff-pill ${d > 0 ? 'pos' : 'neg'}">${OM_WHEEL_ABBR[k]} ${d > 0 ? '+' : ''}${d}</span>`)
      })
    }

    const mini = omIsMono(r)
      ? `<svg width="52" height="52" viewBox="0 0 140 140"><circle cx="70" cy="70" r="44" fill="none" stroke="#3e3e50" stroke-width="2"/><text x="70" y="76" text-anchor="middle" font-size="20" font-weight="700" fill="#9a9aaa" font-family="Inter,sans-serif">M</text></svg>`
      : buildOmWheelSvg(r.color_wheel).replace('width="140" height="140"', 'width="52" height="52"')

    card.innerHTML = `<div class="exp-mini-fp">${mini}</div>
      <div class="exp-result-info">
        <div class="exp-result-name">${r.name}</div>
        <div class="exp-result-badges">
          <span class="badge b-sim">${r.recipe_type || 'COLOR'}</span>
          <span class="badge ${WARMTH_CLASS[recipeWarmthOm(r)]}">${recipeWarmthOm(r)}</span>
          <span class="badge ${PUNCH_CLASS[recipePunchOm(r)]}">${recipePunchOm(r)}</span>
        </div>
        <div class="exp-result-badges">${diffs.slice(0, 6).join('')}</div>
      </div>`
    card.addEventListener('click', () => openRecipeModal(r.name))
    list.appendChild(card)
  })
}

// ─── build ────────────────────────────────────────────────────────────────

function initOmExplore() {
  const pane = document.getElementById('pane-explore')
  if (!pane) return
  if (omExploreBuilt) { syncOmExploreControls(); renderOmExploreResults(); return }
  omExploreBuilt = true

  pane.innerHTML = `
    <div class="sec-title">Explore — OM</div>
    <div class="exp-layout">
      <div class="exp-header">
        <div class="exp-seed" style="position:relative">
          <label>Start From</label>
          <input type="text" id="omexp-seed-input" placeholder="Search recipes..." autocomplete="off"
            style="background:var(--surf2);border:1px solid var(--border);color:var(--text);border-radius:var(--r);padding:6px 10px;font-size:13px;width:100%">
          <div id="omexp-seed-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:50;background:var(--surf2);border:1px solid var(--border);border-radius:var(--r);max-height:200px;overflow-y:auto;"></div>
        </div>
        <div class="exp-seed" style="flex:0 0 150px">
          <label>Recipe Type</label>
          <select id="omexp-type" style="background:var(--surf2);border:1px solid var(--border);color:var(--text);border-radius:var(--r);padding:6px 10px;font-size:13px;width:100%">
            <option value="">— any —</option>
            <option value="COLOR">COLOR</option>
            <option value="MONO">MONO</option>
          </select>
        </div>
      </div>

      <div class="exp-row2">
        <div class="exp-wb-col">
          <div class="exp-col-label">White Balance Offset</div>
          <svg id="omexp-wb-svg" class="exp-wb-grid" width="160" height="160" viewBox="0 0 150 150"></svg>
          <div class="exp-wb-values"><span id="omexp-wb-vals" style="color:#e8c05a;font-weight:600">A+0  G+0</span></div>
          <div class="exp-wb-match-row"><span class="exp-wb-match-icon"></span><span style="font-size:10px;color:var(--text3)">Closest:</span><span id="omexp-match-name" style="font-size:10px;color:#5b9af0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">—</span></div>
        </div>

        <div class="exp-radar-col">
          <div class="exp-radar-legend-row">
            <span id="omexp-legend-yours" class="exp-legend-btn exp-legend-yours-btn"><span class="exp-legend-swatch" style="background:#d4a843"></span>Yours</span>
            <span id="omexp-legend-match" class="exp-legend-btn exp-legend-match-btn"><span class="exp-legend-swatch-dash"></span>Closest match</span>
          </div>
          <svg id="omexp-wheel-svg" viewBox="0 0 260 260" style="width:100%;max-width:300px;overflow:visible" aria-label="12-point colour wheel"></svg>
          <p class="exp-radar-hint">Drag any of the 12 handles to push that hue’s saturation (−7 to +7)</p>
        </div>
      </div>

      <div id="omexp-steppers" class="exp-compact"></div>

      <div class="exp-results">
        <div class="exp-results-title">Closest matches</div>
        <div id="omexp-results-list"></div>
      </div>
    </div>`

  buildOmWheelPane()
  buildOmWbPane()
  buildOmSteppers()

  // seed typeahead
  const seedInput = document.getElementById('omexp-seed-input')
  const seedDropdown = document.getElementById('omexp-seed-dropdown')
  function showDropdown(query) {
    const q = query.trim().toLowerCase()
    const matches = activeRecipes().filter(r => r.name.toLowerCase().includes(q)).slice(0, 12)
    seedDropdown.innerHTML = ''
    const neutral = document.createElement('div')
    neutral.textContent = '— neutral —'
    neutral.style.cssText = 'padding:6px 10px;font-size:13px;cursor:pointer;color:var(--text2)'
    neutral.addEventListener('mousedown', e => {
      e.preventDefault(); omSeedRecipe(null); seedInput.value = ''; seedDropdown.style.display = 'none'
    })
    seedDropdown.appendChild(neutral)
    matches.forEach(r => {
      const opt = document.createElement('div')
      opt.textContent = r.name
      opt.style.cssText = 'padding:6px 10px;font-size:13px;cursor:pointer;color:var(--text)'
      opt.addEventListener('mouseover', () => opt.style.background = 'var(--surf3)')
      opt.addEventListener('mouseout', () => opt.style.background = '')
      opt.addEventListener('mousedown', e => {
        e.preventDefault(); omSeedRecipe(r.name); seedInput.value = r.name; seedDropdown.style.display = 'none'
      })
      seedDropdown.appendChild(opt)
    })
    seedDropdown.style.display = 'block'
  }
  seedInput.addEventListener('focus', () => showDropdown(seedInput.value))
  seedInput.addEventListener('input', () => showDropdown(seedInput.value))
  seedInput.addEventListener('blur', () => setTimeout(() => { seedDropdown.style.display = 'none' }, 150))

  document.getElementById('omexp-type').addEventListener('change', e => {
    TOM.type_filter = e.target.value
    renderOmExploreResults(); updateOmWheelOverlay(); updateOmWbDot()
  })

  document.getElementById('omexp-legend-yours').addEventListener('click', function () {
    omExpShowYours = !omExpShowYours
    this.classList.toggle('dimmed', !omExpShowYours)
    updateOmWheelOverlay()
  })
  document.getElementById('omexp-legend-match').addEventListener('click', function () {
    omExpShowMatch = !omExpShowMatch
    this.classList.toggle('dimmed', !omExpShowMatch)
    updateOmWheelOverlay(); updateOmWbDot()
  })

  renderOmExploreResults()
}

function resetOmExploreBuilt() { omExploreBuilt = false }

// ══════════════════════════════════════════
// COMPARE
// ══════════════════════════════════════════
// Three views, same .cmp-* CSS as Fuji. Compare state (C.a / C.b) is shared
// with the Fuji implementation, so switchGen() must clear it — a Fuji recipe
// must never end up compared against an OM one.

let omCompareBuilt = false
const OMC = { view: 'sidebyside' }

// [key, label] for the row-diff table. Wheel channels are appended below.
const OM_CMP_FIELDS = [
  ['contrast', 'Contrast'], ['sharpness', 'Sharpness'],
  ['highlights', 'Highlights'], ['shadows', 'Shadows'], ['midtones', 'Midtones'],
  ['exposure_compensation', 'Exposure'],
  ['wb_amber_offset', 'WB Amber'], ['wb_green_offset', 'WB Green'],
]

const omSigned = v => v == null ? '—' : (v > 0 ? '+' + v : '' + v)

function initOmCompare() {
  const shell = document.getElementById('cmp-shell')
  if (!shell) return
  if (omCompareBuilt) { syncOmCmpSelects(); renderOmCompare(); return }
  omCompareBuilt = true

  shell.innerHTML = ''

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
    sel.id = 'omcmp-sel-' + cls
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

  const swapBtn = document.createElement('button')
  swapBtn.className = 'cmp-btn'; swapBtn.textContent = '⇄ Swap'
  swapBtn.addEventListener('click', () => {
    if (!C.a || !C.b) return
    const tmp = C.a; C.a = C.b; C.b = tmp
    syncOmCmpSelects(); renderOmCompare()
  })

  const clearBtn = document.createElement('button')
  clearBtn.className = 'cmp-btn'; clearBtn.textContent = 'Clear'
  clearBtn.addEventListener('click', () => {
    C.a = null; C.b = null
    compareSlots = [null, null]
    updateCompareCardButtons()
    syncOmCmpSelects(); renderOmCompare()
  })

  header.appendChild(makeSelect('a', 'a'))
  header.appendChild(makeSelect('b', 'b'))
  header.appendChild(swapBtn); header.appendChild(clearBtn)

  const subtabs = document.createElement('div')
  subtabs.className = 'cmp-subtabs'
  ;[
    { id: 'sidebyside', label: 'Side-by-side' },
    { id: 'rowdiff',    label: 'Row diff' },
    { id: 'overlay',    label: 'Overlay' },
  ].forEach(v => {
    const btn = document.createElement('button')
    btn.className = 'cmp-subtab' + (OMC.view === v.id ? ' on' : '')
    btn.textContent = v.label
    btn.dataset.view = v.id
    btn.addEventListener('click', () => {
      OMC.view = v.id
      subtabs.querySelectorAll('.cmp-subtab').forEach(b => b.classList.toggle('on', b.dataset.view === v.id))
      renderOmCompare()
    })
    subtabs.appendChild(btn)
  })

  const content = document.createElement('div')
  content.id = 'omcmp-content'

  shell.appendChild(header)
  document.getElementById('omcmp-sel-a').addEventListener('change', e => {
    C.a = activeRecipes().find(r => r.name === e.target.value) || null
    renderOmCompare()
  })
  document.getElementById('omcmp-sel-b').addEventListener('change', e => {
    C.b = activeRecipes().find(r => r.name === e.target.value) || null
    renderOmCompare()
  })
  shell.appendChild(subtabs)
  shell.appendChild(content)

  syncOmCmpSelects()
  renderOmCompare()
}

function syncOmCmpSelects() {
  const selA = document.getElementById('omcmp-sel-a')
  const selB = document.getElementById('omcmp-sel-b')
  if (selA) selA.value = C.a ? C.a.name : ''
  if (selB) selB.value = C.b ? C.b.name : ''
}

function renderOmCompare() {
  const content = document.getElementById('omcmp-content')
  if (!content) return
  content.innerHTML = ''
  if (!C.a || !C.b) {
    content.innerHTML = '<div class="cmp-empty">Select two recipes above to compare them.</div>'
    return
  }
  if (OMC.view === 'sidebyside') renderOmCmpSideBySide(content)
  else if (OMC.view === 'rowdiff') renderOmCmpRowDiff(content)
  else renderOmCmpOverlay(content)
}

function renderOmCmpSideBySide(container) {
  const kwA = new Set([...(C.a.mood_keywords || []), ...(C.a.scenario_keywords || [])])
  const kwB = new Set([...(C.b.mood_keywords || []), ...(C.b.scenario_keywords || [])])
  const allKw = [...new Set([...kwA, ...kwB])]

  function makeCol(r) {
    const col = document.createElement('div')
    col.className = 'cmp-col'

    const title = document.createElement('div')
    title.className = 'cmp-col-title'
    title.textContent = r.name
    col.appendChild(title)

    const badges = document.createElement('div')
    badges.className = 'cmp-col-badges'
    badges.innerHTML = `<span class="badge b-sim">${r.recipe_type || 'COLOR'}</span>
      <span class="badge ${WARMTH_CLASS[recipeWarmthOm(r)]}">${recipeWarmthOm(r)}</span>
      <span class="badge ${PUNCH_CLASS[recipePunchOm(r)]}">${recipePunchOm(r)}</span>`
    col.appendChild(badges)

    const vis = document.createElement('div')
    vis.style.cssText = 'display:flex;justify-content:center;margin-bottom:8px'
    vis.innerHTML = buildOmVisual(r)
    col.appendChild(vis)

    const secLbl = document.createElement('div')
    secLbl.className = 'cmp-section-label'
    secLbl.textContent = 'Settings'
    col.appendChild(secLbl)

    const rows = [
      ['Author', r.author], ['White Balance', r.white_balance],
      ['WB Temp', r.wb_temperature ? r.wb_temperature + 'K' : null],
      ['WB Amber', omSigned(r.wb_amber_offset)], ['WB Green', omSigned(r.wb_green_offset)],
      ['Contrast', omSigned(r.contrast)], ['Sharpness', omSigned(r.sharpness)],
      ['Highlights', omSigned(r.highlights)], ['Shadows', omSigned(r.shadows)],
      ['Midtones', omSigned(r.midtones)], ['Exposure', omSigned(r.exposure_compensation)],
      ['Mono Profile', r.monochrome_profile], ['Mono Color', r.monochrome_color],
      ['Film Grain', r.film_grain],
    ].filter(([, v]) => v != null && v !== '' && v !== '—')
    const tbl = document.createElement('table')
    tbl.className = 'stbl'
    tbl.innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
    col.appendChild(tbl)

    const kwLbl = document.createElement('div')
    kwLbl.className = 'cmp-section-label'
    kwLbl.textContent = 'Keywords'
    col.appendChild(kwLbl)
    const own = new Set([...(r.mood_keywords || []), ...(r.scenario_keywords || [])])
    const other = r === C.a ? kwB : kwA
    const kwWrap = document.createElement('div')
    kwWrap.innerHTML = allKw.filter(k => own.has(k)).map(k => {
      const cls = other.has(k) ? 'cmp-kw-shared' : (r === C.a ? 'cmp-kw-a' : 'cmp-kw-b')
      return `<span class="cmp-kw ${cls}">${k}</span>`
    }).join('')
    col.appendChild(kwWrap)

    return col
  }

  const layout = document.createElement('div')
  layout.className = 'cmp-layout'
  layout.appendChild(makeCol(C.a))
  layout.appendChild(makeCol(C.b))
  container.appendChild(layout)
}

function renderOmCmpRowDiff(container) {
  const fields = [
    ...OM_CMP_FIELDS,
    ...OM_WHEEL_ORDER.map(k => ['wheel:' + k, OM_WHEEL_LABEL[k]]),
  ]

  const rows = fields.map(([key, label]) => {
    let va, vb
    if (key.startsWith('wheel:')) {
      const ch = key.slice(6)
      va = omIsMono(C.a) ? null : (C.a.color_wheel[ch] || 0)
      vb = omIsMono(C.b) ? null : (C.b.color_wheel[ch] || 0)
    } else {
      va = C.a[key] ?? 0
      vb = C.b[key] ?? 0
    }
    const both = va != null && vb != null
    const d = both ? vb - va : null
    const same = both && d === 0
    const dCell = !both ? '—'
      : d === 0 ? '·'
      : `<span class="cmp-diff-badge ${d > 0 ? 'b' : 'a'}">${d > 0 ? '+' : ''}${d}</span>`
    return `<tr class="${same ? 'match' : 'diff'}">
      <td>${label}</td>
      <td style="text-align:right;color:#d4a843">${va == null ? '—' : omSigned(va)}</td>
      <td class="cmp-diff-cell">${dCell}</td>
      <td style="text-align:right;color:#5b9af0">${vb == null ? '—' : omSigned(vb)}</td>
    </tr>`
  }).join('')

  const wrap = document.createElement('div')
  wrap.innerHTML = `<table class="cmp-row-table">
    <tr>
      <td style="font-weight:700;color:var(--text3)">Setting</td>
      <td style="text-align:right;font-weight:700;color:#d4a843">${C.a.name}</td>
      <td class="cmp-diff-cell" style="color:var(--text3)">Δ</td>
      <td style="text-align:right;font-weight:700;color:#5b9af0">${C.b.name}</td>
    </tr>
    ${rows}
  </table>`
  container.appendChild(wrap)
}

function renderOmCmpOverlay(container) {
  if (omIsMono(C.a) && omIsMono(C.b)) {
    container.innerHTML = '<div class="cmp-empty">Both recipes are monochrome — there is no colour wheel to overlay. Try the Row diff view.</div>'
    return
  }

  const N = OM_WHEEL_ORDER.length
  const ringPts = OM_WHEEL_ORDER.map((k, i) => {
    const ang = omWheelAngle(i)
    return { x: OM_WHEEL_CX + 118 * Math.cos(ang), y: OM_WHEEL_CY + 118 * Math.sin(ang), k }
  })
  const outerSegs = ringPts.map((p, i) => {
    const next = ringPts[(i + 1) % N]
    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${next.x.toFixed(1)}" y2="${next.y.toFixed(1)}" stroke="${OM_WHEEL_REF_HUE[p.k]}" stroke-width="4"/>`
  }).join('')

  const polyFor = r => omIsMono(r) ? null
    : OM_WHEEL_ORDER.map((k, i) => {
        const p = omWheelPoint(i, r.color_wheel[k] || 0)
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
      }).join(' ')

  const pa = polyFor(C.a), pb = polyFor(C.b)

  // Delta pills only where the two diverge meaningfully.
  const deltaLabels = (!pa || !pb) ? '' : OM_WHEEL_ORDER.map((k, i) => {
    const d = (C.b.color_wheel[k] || 0) - (C.a.color_wheel[k] || 0)
    if (Math.abs(d) < 2) return ''
    const ang = omWheelAngle(i)
    const r = Math.max(omWheelRadius(C.a.color_wheel[k] || 0), omWheelRadius(C.b.color_wheel[k] || 0)) + 14
    const lx = OM_WHEEL_CX + r * Math.cos(ang)
    const ly = OM_WHEEL_CY + r * Math.sin(ang)
    const col = d > 0 ? '#5b9af0' : '#d4a843'
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="700" fill="${col}" font-family="Inter,sans-serif">${d > 0 ? '+' : ''}${d}</text>`
  }).join('')

  const chLabels = OM_WHEEL_ORDER.map((k, i) => {
    const ang = omWheelAngle(i)
    const lx = OM_WHEEL_CX + 134 * Math.cos(ang)
    const ly = OM_WHEEL_CY + 134 * Math.sin(ang)
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#5e5e6e" font-family="Inter,sans-serif">${OM_WHEEL_ABBR[k]}</text>`
  }).join('')

  const monoNote = (omIsMono(C.a) || omIsMono(C.b))
    ? `<div class="cmp-empty" style="padding:8px">${omIsMono(C.a) ? C.a.name : C.b.name} is monochrome — only one wheel is shown.</div>` : ''

  const wrap = document.createElement('div')
  wrap.innerHTML = `
    <div class="cmp-header" style="justify-content:center;gap:16px">
      <span class="cmp-kw cmp-kw-a">${C.a.name}</span>
      <span class="cmp-kw cmp-kw-b">${C.b.name}</span>
    </div>
    ${monoNote}
    <div style="display:flex;justify-content:center">
      <svg viewBox="0 0 260 260" style="width:100%;max-width:340px;overflow:visible">
        ${outerSegs}
        <circle cx="${OM_WHEEL_CX}" cy="${OM_WHEEL_CY}" r="49.23" fill="none" stroke="#3e3e50" stroke-width="1.4"/>
        ${chLabels}
        ${pa ? `<polygon points="${pa}" fill="rgba(212,168,67,.15)" stroke="#d4a843" stroke-width="2.2"/>` : ''}
        ${pb ? `<polygon points="${pb}" fill="rgba(91,154,240,.08)" stroke="#5b9af0" stroke-width="1.8" stroke-dasharray="5,3"/>` : ''}
        ${deltaLabels}
      </svg>
    </div>
    <p class="exp-radar-hint">Gold = ${C.a.name} · Blue dashed = ${C.b.name}. Numbers mark channels differing by 2 or more.</p>`
  container.appendChild(wrap)
}

function resetOmCompareBuilt() { omCompareBuilt = false }

// Dependency-free regression checks: node --test tools/test_*.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

function recipeContext() {
  const context = vm.createContext({ RECIPES_V: [], RECIPES_IV: [], RECIPES_III: [], RECIPES_II: [], RECIPES_I: [] })
  vm.runInContext(read('recipes-ui.js'), context)
  vm.runInContext(read('personal-ui.js'), context)
  return context
}
const recipe = {
  name: 'Test Fuji', film_simulation: 'Classic Chrome', color_direction: 'warm',
  highlight: -1, shadow: 2, color: 1, clarity: 0,
  color_chrome_effect: 'Weak', color_chrome_fx_blue: 'Strong',
  white_balance: 'Daylight', wb_shift_red: 2, wb_shift_blue: -3, dynamic_range: 'DR200',
}

test('Main entry is the production editorial site, not a preview', () => {
  const html = read('index.html')
  assert.match(html, /href="styles\.css\?v=/)
  assert.match(html, /src="site-ui\.js\?v=/)
  assert.match(html, /initSiteUI\(\)/)
  assert.match(html, /class="site-masthead"/)
  assert.equal(/preview|Original ↗|refreshed\.css|refreshed\.js/i.test(html), false)
  assert.equal([...html.matchAll(/<button[^>]+class="tab"[^>]+data-section=/g)].length, 3)
  assert.equal([...html.matchAll(/<button[^>]+class="tab"[^>]+data-view=/g)].length, 9)
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  assert.equal(ids.length, new Set(ids).size)
  for (const id of ['site-theme', 'site-content', 'site-page-title', 'site-family-row', 'recipe-modal', 'custom-setup-body']) assert.ok(ids.includes(id), id)
})

test('Local page resources are case-correct, relative and available for GitHub Pages subpaths', () => {
  const html = read('index.html')
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')))
  for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)) {
    assert.equal(match[1].startsWith('/'), false, match[1])
    const pieces = match[1].split('?')[0].split('/')
    let directory = root
    for (const piece of pieces) {
      assert.ok(fs.readdirSync(directory).includes(piece), match[1])
      directory = path.join(directory, piece)
    }
  }
  const gear = vm.createContext({})
  vm.runInContext(read('gear.js'), gear)
  for (const item of vm.runInContext('[...MY_CAMERAS, ...MY_LENSES]', gear)) {
    if (!item.image) continue
    assert.equal(item.image.startsWith('/'), false)
    let directory = root
    for (const piece of item.image.split('/')) {
      assert.ok(fs.readdirSync(directory).includes(piece), item.image)
      directory = path.join(directory, piece)
    }
  }
  assert.match(read('nav.js'), /location\.hash/)
  assert.match(read('recipes-ui.js'), /script\.src = 'recipes-' \+ gen\.toLowerCase\(\) \+ '\.js'/)
})

test('Former preview bookmarks redirect to the sole production entry preserving the hash', () => {
  const html = read('refreshed.html')
  assert.match(html, /location\.replace\('index\.html' \+ location\.search \+ location\.hash\)/)
  assert.equal(html.includes('src="recipes-'), false)
  for (const file of ['refreshed-base.css', 'refreshed.css', 'refreshed.js', 'tools/build_refreshed_preview.py']) assert.equal(fs.existsSync(path.join(root, file)), false, file)
})

test('Site UI is declarations-only and navigation is not monkey-patched', () => {
  const context = vm.createContext({})
  assert.doesNotThrow(() => vm.runInContext(read('site-ui.js'), context))
  assert.equal(context.siteEscape('<"x" & \'y\'>'), '&lt;&quot;x&quot; &amp; &#39;y&#39;&gt;')
  assert.equal(/applyNav\s*=|renderHome\s*=/.test(read('site-ui.js')), false)
  assert.match(read('nav.js'), /prepareSiteNavigation\(\)/)
  assert.match(read('nav.js'), /syncSiteShell\(\)/)
  assert.match(read('styles.css'), /env\(safe-area-inset-bottom\)/)
  assert.match(read('styles.css'), /prefers-reduced-motion/)
})

test('Fuji visual is identical regardless of which Camera Settings family is active', () => {
  const context = recipeContext()
  const first = context.buildFujiVisual(recipe)
  vm.runInContext("activeGen = 'OM'", context)
  assert.equal(context.buildFujiVisual(recipe), first)
  assert.match(first, /card-img-fp fuji-visual/)
  assert.match(first, /card-fp-inner/)
  assert.match(first, /card-drwb/)
  assert.match(first, /mr-wb-svg/)
  assert.match(first, /DR200/)
  assert.equal(context.recipeWarmth(recipe, 'V'), 'warm')
})

test('X-T50 custom slots always resolve their recipes from X-Trans V', () => {
  const context = recipeContext()
  context.testRecipe = recipe
  vm.runInContext("RECIPE_POOLS.V = [testRecipe]; RECIPE_POOLS.OM = [{name: 'Test Fuji', recipe_type: 'MONO'}]; activeGen = 'OM'", context)
  assert.equal(context.customSlotRecipe('Test Fuji'), recipe)
  assert.equal(context.customSlotRecipe('Missing'), null)
  const code = read('personal-ui.js')
  assert.match(code, /buildFujiVisual\(baseSimRecipe\)/)
  assert.match(code, /buildFujiVisual\(slotRecipe\)/)
  assert.match(code, /openRecipeModal\(slot\.recipe_name, 'V'\)/)
  assert.match(read('recipes-ui.js'), /const imgHtml=buildFujiVisual\(r\)/)
})

test('Every application asset uses the same cache revision, including lazy OM loading', () => {
  const context = vm.createContext({})
  vm.runInContext(read('site-ui.js'), context)
  const version = vm.runInContext('SITE_ASSET_VERSION', context)
  const assets = [...read('index.html').matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)]
  assert.equal(assets.length, 10) // V + core modules/data; other families are lazy
  assets.forEach(match => assert.equal(new URL(match[1], 'https://example.com/site/').searchParams.get('v'), version, match[1]))
  assert.match(read('recipes-ui.js'), /encodeURIComponent\(SITE_ASSET_VERSION\)/)
})

test('X-T50 retains all seven settings panes when the shared graph helper is unavailable', () => {
  const context = recipeContext()
  vm.runInContext(read('gear.js'), context)
  context.testRecipe = recipe
  vm.runInContext("RECIPE_POOLS.V = [{...testRecipe, name: 'Standard Film (X-T50 Film Dial)'}, {...testRecipe, name: 'Kodachrome 64'}]; buildFujiVisual = undefined", context)
  const element = tag => ({ tag, children: [], style: {}, innerHTML: '', appendChild(child) { this.children.push(child) }, addEventListener() {} })
  const wrap = element('div')
  context.document = { createElement: element }
  context.$ = () => wrap
  assert.doesNotThrow(() => context.renderCustomSlots())
  assert.equal(wrap.children[0].children.length, 7)
  const panes = wrap.children[1].children
  assert.equal(panes.length, 7)
  assert.equal(panes.filter(pane => pane.className.includes(' active')).length, 1)
  const body = panes[3].children[1]
  assert.ok(body.children.some(child => child.tag === 'table' && child.className === 'stbl'))
})

test('X-E5 separates seven scenario banks from the three requested FS recipes', () => {
  const context = recipeContext()
  vm.runInContext(read('gear.js'), context)
  const setup = vm.runInContext('MY_CUSTOM_SETUPS["Fujifilm X-E5"]', context)
  assert.ok(setup)
  assert.equal(setup.type, 'fuji-scenarios')
  assert.deepEqual(Array.from(setup.modes, mode => mode.slot), ['C1','C2','C3','C4','C5','C6','C7'])
  assert.deepEqual(Array.from(setup.filmSlots, slot => slot.id), ['FS1','FS2','FS3'])
  assert.deepEqual(Array.from(setup.filmSlots, slot => slot.recipe_name), ["Reggie's Portra", 'Kodak Gold 200', 'Kodak Tri-X 400'])
  for (const mode of setup.modes) {
    assert.ok(mode.settings.length >= 5)
    assert.ok(mode.manual_settings.some(([key]) => key === 'Shutter dial'))
    assert.ok(mode.manual_settings.some(([key]) => key === 'Focus selector'))
  }
  assert.equal(vm.runInContext('MY_CUSTOM_SETUPS["Fujifilm X-M5"].type', context), 'empty')
  assert.equal(vm.runInContext('MY_CUSTOM_SETUPS["Fujifilm X-T50"].type', context), 'fuji-slots')
})

test('X-E5 guide includes FS recipe activation, manual control caveats and safe recall checks', () => {
  const context = recipeContext()
  vm.runInContext(read('gear.js'), context)
  const setup = vm.runInContext('MY_CUSTOM_SETUPS["Fujifilm X-E5"]', context)
  assert.ok(setup)
  const text = JSON.stringify(setup)
  for (const phrase of ['FS RECIPE', 'ON', 'AUTO UPDATE CUSTOM SETTING', 'DISABLE', 'EDIT/CHECK', 'JPEG', 'DR400', '500', '1600', 'Focus selector']) assert.ok(text.includes(phrase), phrase)
  assert.match(setup.control_note, /physical/)
  assert.equal(setup.autoIso.length, 3)
  setup.autoIso.forEach(profile => assert.equal(profile.base, 125))
  assert.equal(setup.filmSlots[0].exposure_guidance, 'Judge each exposure individually; Reggie does not prescribe a fixed compensation.')
})

test('FS recipe quality settings exclude shooting ISO and exposure compensation', () => {
  const context = recipeContext()
  const before = JSON.stringify(recipe)
  const rows = context.fujiImageQualitySettings({ ...recipe, iso_max: '6400', exposure_compensation: '+1' })
  assert.ok(rows.some(([label]) => label === 'Film Sim'))
  assert.ok(rows.some(([label]) => label === 'WB Shift'))
  assert.equal(rows.some(([label]) => label === 'ISO' || label === 'Exposure'), false)
  assert.equal(JSON.stringify(recipe), before)
})

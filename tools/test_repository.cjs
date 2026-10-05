// Repository/data invariants, no packages or network requests.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const read = name => fs.readFileSync(path.join(root, name), 'utf8')
const context = vm.createContext({})
for (const file of ['recipes-v.js','recipes-iv.js','recipes-iii.js','recipes-ii.js','recipes-i.js','recipes-om.js','gear.js','gallery.js','nav.js']) vm.runInContext(read(file), context)
const get = expression => vm.runInContext(expression, context)

test('Family totals match all data files; Fuji names and OM name/author pairs are unique', () => {
  for (const family of get('RECIPE_FAMILIES')) {
    const recipes = get('RECIPES_' + family.id)
    assert.equal(recipes.length, family.count, family.id)
    const keys = recipes.map(recipe => family.id === 'OM' ? JSON.stringify([recipe.name, recipe.author || '']) : recipe.name)
    assert.equal(new Set(keys).size, recipes.length, family.id)
  }
})

test('Every X-T50/X-E5 recipe reference resolves in X-Trans V', () => {
  const names = new Set(get('RECIPES_V').map(recipe => recipe.name))
  for (const slot of get('MY_CUSTOM_SLOTS')) {
    if (slot.recipe_name) assert.ok(names.has(slot.recipe_name), slot.recipe_name)
    for (const simulation of slot.simulations || []) if (simulation.recipe_name) assert.ok(names.has(simulation.recipe_name), simulation.recipe_name)
  }
  for (const slot of get('MY_CUSTOM_SETUPS["Fujifilm X-E5"].filmSlots')) assert.ok(names.has(slot.recipe_name), slot.recipe_name)
})

test('Gallery counts/references agree and its allowlist contains no private identifiers', () => {
  const albums = get('GALLERY_ALBUMS'), photos = get('GALLERY_PHOTOS')
  for (const album of albums) assert.equal(photos.filter(photo => photo.album === album.id).length, album.count)
  assert.ok(photos.every(photo => albums.some(album => album.id === photo.album)))
  assert.equal(/SerialNumber|MacBook|DSCF|sha256|importedBy|CreatorTool/.test(read('gallery.js')), false)
})

test('Only V data loads eagerly; stale correlation and slider artifacts are retired', () => {
  const html = read('index.html')
  const dataScripts = [...html.matchAll(/src="(recipes-(?:v|iv|iii|ii|i|om)\.js)[^"]*"/g)].map(match => match[1])
  assert.deepEqual(dataScripts, ['recipes-v.js'])
  assert.equal(fs.existsSync(path.join(root, 'corr-data.js')), false)
  const code = read('recipes-ui.js')
  assert.equal(/function (buildSliderPane|pillSvg)\(/.test(code), false)
  assert.equal(code.includes('SIM_CHARACTER'), false)
  assert.ok(code.includes('function renderCharts('), 'Intentional standby charts must be retained')
})

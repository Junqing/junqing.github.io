// No dependencies: node --test tools/test_recipe_lifecycle.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const source = fs.readFileSync(path.join(__dirname, '..', 'recipes-ui.js'), 'utf8')

function harness() {
  const scripts = [], elements = new Map(), renders = [], errors = []
  const element = id => {
    if (!elements.has(id)) elements.set(id, { disabled: false, value: '', textContent: '', innerHTML: '', style: {} })
    return elements.get(id)
  }
  const context = vm.createContext({
    RECIPES_V: [{ name: 'Fuji fixture', film_simulation: 'Classic Chrome' }],
    RECIPES_IV: [], RECIPES_III: [], RECIPES_II: [], RECIPES_I: [],
    NAV: { section: 'camera', view: 'explore', family: 'V' },
    document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null, createElement: () => ({ remove() {} }), head: { appendChild(script) { scripts.push(script) } } },
    console: { error(error) { errors.push(error) } },
    location: { hash: '#/camera/explore' }, history: { replaceState() {} },
  })
  context.window = context
  context.$ = element
  vm.runInContext(source, context)
  if (context.initRecipePools) context.initRecipePools()
  context.initChips = () => {}
  context.syncSidebarFacets = () => {}
  context.render = () => {}
  context.updateBadgeFormula = () => {}
  context.renderCurrentView = () => renders.push(vm.runInContext('activeGen', context))
  const active = () => vm.runInContext('activeGen', context)
  return { context, scripts, elements, renders, errors, active }
}

test('Recipe UI parses without reading another script’s globals at load time', () => {
  assert.doesNotThrow(() => vm.runInContext(source, vm.createContext({})))
})

test('Concurrent requests for the same lazy family share one script and promise', async () => {
  const h = harness()
  const first = h.context.loadGen('OM'), second = h.context.loadGen('OM')
  assert.equal(h.scripts.length, 1)
  assert.equal(first, second)
  h.context.RECIPES_OM = [{ name: 'OM fixture', recipe_type: 'COLOR' }]
  h.scripts[0].onload()
  await Promise.all([first, second])
  assert.equal(vm.runInContext('RECIPE_POOLS.OM.length', h.context), 1)
})

test('A completed slow family switch rebuilds the current view using the new schema', async () => {
  const h = harness()
  h.context.NAV.family = 'OM'
  const switching = h.context.switchGen('OM')
  h.context.RECIPES_OM = []
  h.scripts[0].onload()
  await switching
  assert.equal(h.active(), 'OM')
  assert.deepEqual(h.renders, ['OM'])
  assert.equal(h.elements.get('gen-select').disabled, false)
})

test('Returning to the already-active family cancels an in-flight different family', async () => {
  const h = harness()
  h.context.NAV.family = 'OM'
  const switching = h.context.switchGen('OM')
  h.context.NAV.family = 'V'
  await h.context.switchGen('V')
  h.context.RECIPES_OM = []
  h.scripts[0].onload()
  await switching
  assert.equal(h.active(), 'V')
  assert.equal(h.context.NAV.family, 'V')
  assert.equal(h.elements.get('gen-select').disabled, false)
})

test('Failed lazy loads can be retried and do not leave a disabled picker', async () => {
  const h = harness()
  h.context.NAV.family = 'OM'
  const switching = h.context.switchGen('OM')
  h.scripts[0].onerror()
  await switching
  assert.equal(h.active(), 'V')
  assert.equal(h.context.NAV.family, 'V')
  assert.equal(h.elements.get('gen-select').disabled, false)
  const retry = h.context.loadGen('OM')
  assert.equal(h.scripts.length, 2)
  h.context.RECIPES_OM = []
  h.scripts[1].onload()
  await retry
})

test('Fuji correlations use current input, deduplicate tags and omit unavailable axes', () => {
  const h = harness()
  const recipes = [
    { name: 'A', highlight: 1, color: 2, film_simulation: 'Classic Chrome', dynamic_range: 'DR100', mood_keywords: ['portrait'], scenario_keywords: ['portrait'] },
    { name: 'B', highlight: -1, color: 0, film_simulation: 'Classic Chrome', dynamic_range: 'DR200', mood_keywords: ['portrait'] },
    { name: 'C', highlight: 3, color: 4, film_simulation: 'Velvia', dynamic_range: 'DR100', mood_keywords: ['landscape'] },
  ]
  const before = JSON.stringify(recipes)
  const result = h.context.computeFujiCorrelations(recipes)
  assert.equal(result.correlations.portrait.count, 2)
  assert.equal(result.correlations.portrait.deltas.highlight, -1)
  assert.equal(result.global_means.color, 2)
  assert.equal(result.numeric_fields.includes('clarity'), false)
  assert.equal(JSON.stringify(recipes), before)
})

test('Same-name OM variants retain distinct identity and resolve the chosen author', () => {
  const h = harness()
  const a = { name: 'Kodachrome 64', author: 'Author A', contrast: -1 }
  const b = { name: 'Kodachrome 64', author: 'Author B', contrast: 2 }
  h.context.variants = [a,b]
  vm.runInContext("RECIPE_POOLS.OM = variants; activeGen = 'OM'", h.context)
  const keyA = h.context.recipeIdentity(a), keyB = h.context.recipeIdentity(b)
  assert.notEqual(keyA, keyB)
  assert.equal(h.context.resolveRecipe(keyB), b)
  assert.equal(h.context.resolveRecipe(b), b)
  assert.match(h.context.recipeLabel(b), /Author B/)
  h.context.onCompareCardClick(a)
  h.context.navigate = () => {}
  h.context.onCompareCardClick(b)
  assert.equal(vm.runInContext('C.a', h.context), a)
  assert.equal(vm.runInContext('C.b', h.context), b)
})

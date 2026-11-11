// Current personal kit and recipe assignments; no packages/network needed.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
function load() {
  const context = vm.createContext({})
  for (const file of ['recipes-v.js', 'gear.js', 'personal-ui.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context)
  }
  return context
}
const get = (context, expression) => vm.runInContext(expression, context)
const customNames = ['Kodak Portra 400 v2', 'Kodachrome 64', 'Kodak Gold 200', 'Pacific Blues']
const filmNames = ["Reggie's Portra", 'Reggies Superia', 'Kodak Tri-X 400']

test('Current kit replaces X-T50 and adds the fixed-lens X70 and three lenses', () => {
  const context = load()
  const cameras = get(context, 'MY_CAMERAS')
  assert.equal(cameras.length, 5)
  assert.equal(cameras.some(camera => camera.name === 'Fujifilm X-T50'), false)
  for (const name of ['Fujifilm X-E5', 'Fujifilm X70', 'OM System OM-3']) {
    assert.equal(cameras.filter(camera => camera.name === name).length, 1)
  }
  const x70 = cameras.find(camera => camera.name === 'Fujifilm X70')
  assert.match(JSON.stringify(x70.specs), /X-Trans CMOS II/)
  assert.match(JSON.stringify(x70.specs), /Fixed/)
  const lenses = get(context, 'MY_LENSES')
  assert.equal(lenses.filter(lens => lens.mount === 'X').length, 8)
  assert.equal(lenses.filter(lens => lens.mount === 'M43').length, 6)
  for (const [name, mount] of [
    ['XF 50mm f/2 R WR', 'X'],
    ['M.Zuiko Digital ED 12-45mm f/4.0 PRO', 'M43'],
    ['Lumix G Vario 14-140mm f/3.5-5.6 II ASPH. POWER O.I.S.', 'M43'],
  ]) assert.equal(lenses.find(lens => lens.name === name)?.mount, mount)
  for (const item of [...cameras, ...lenses]) {
    if (!item.image) continue
    assert.ok(item.image.startsWith('images/gear/'), item.name)
    assert.ok(fs.statSync(path.join(root, item.image)).size > 0, item.name)
  }
  for (const name of ['Fujifilm X-E5', 'Fujifilm X70']) assert.ok(cameras.find(camera => camera.name === name).image)
})

test('Only owned cameras appear in My Setup; X-E5 records C1-C4 and FS1-FS3', () => {
  const context = load()
  const setups = get(context, 'MY_CUSTOM_SETUPS')
  assert.deepEqual(Object.keys(setups).sort(), Array.from(get(context, 'MY_CAMERAS'), camera => camera.name).sort())
  assert.equal(setups['Fujifilm X70'].type, 'empty')
  assert.equal(get(context, 'activeSetupCamera'), 'Fujifilm X-E5')
  const setup = setups['Fujifilm X-E5']
  assert.equal(setup.type, 'fuji-recipes')
  assert.deepEqual(Array.from(setup.recipeSlots, slot => slot.id), ['C1', 'C2', 'C3', 'C4'])
  assert.deepEqual(Array.from(setup.recipeSlots, slot => slot.recipe_name), customNames)
  assert.deepEqual(Array.from(setup.filmSlots, slot => slot.id), ['FS1', 'FS2', 'FS3'])
  assert.deepEqual(Array.from(setup.filmSlots, slot => slot.recipe_name), filmNames)
  for (const slot of [...setup.recipeSlots, ...setup.filmSlots]) {
    assert.ok(context.customSlotRecipe(slot.recipe_name), slot.recipe_name)
  }
  assert.match(setup.control_note, /physical/)
  assert.match(setup.instructions.join(' '), /FS RECIPE/)
  assert.match(setup.instructions.join(' '), /Classic Negative/)
  assert.equal(/planned|starter|scenario/i.test(setup.intro), false)
})

function renderingContext() {
  const context = load()
  const elements = new Map()
  function element(tag) {
    return { tag, children: [], dataset: {}, innerHTML: '', appendChild(child) { this.children.push(child) },
      addEventListener() {}, querySelector(selector) {
        if (selector === 'button') return this.button ||= { addEventListener(event, handler) { this.handler = handler } }
        if (!elements.has(selector)) elements.set(selector, element('div'))
        return elements.get(selector)
      } }
  }
  context.document = { createElement: element }
  const pane = element('div')
  context.$ = () => pane
  return { context, pane }
}

test('X-E5 renders all seven recipe cards and opens them in V even after visiting OM', () => {
  const { context, pane } = renderingContext()
  // Simulate the real shared pool with OM active; lookups must still use V.
  context.RECIPE_POOLS = { V: get(context, 'RECIPES_V'), OM: [] }
  context.activeGen = 'OM'
  context.fujiImageQualitySettings = recipe => [['Film Sim', recipe.film_simulation], ['WB', recipe.white_balance]]
  context.buildFujiVisual = recipe => `<svg>${recipe.name}</svg>`
  const opened = []
  context.openRecipeModal = (...args) => opened.push(args)
  context.renderSetupCameraPane('Fujifilm X-E5')
  assert.match(pane.innerHTML, /C1–C4/)
  assert.match(pane.innerHTML, /FS1–FS3/)
  assert.equal(/Scenario Banks|C1–C7/.test(pane.innerHTML), false)
  const customCards = pane.querySelector('#setup-recipes-grid').children
  const filmCards = pane.querySelector('#setup-fs-grid').children
  assert.equal(customCards.length, 4)
  assert.equal(filmCards.length, 3)
  for (const [index, card] of [...customCards, ...filmCards].entries()) {
    const name = [...customNames, ...filmNames][index]
    assert.ok(card.innerHTML.includes(name))
    assert.match(card.innerHTML, /Image-quality settings/)
    assert.match(card.innerHTML, /ISO &amp; exposure/)
    card.querySelector('button').handler()
    assert.deepEqual(opened[index], [name, 'V'])
  }
})

test('Missing graph helper or recipe data does not blank the assigned slots', () => {
  const { context, pane } = renderingContext()
  context.fujiImageQualitySettings = recipe => [['Film Sim', recipe.film_simulation]]
  context.renderSetupCameraPane('Fujifilm X-E5')
  assert.match(pane.querySelector('#setup-recipes-grid').children[0].innerHTML, /<table/)
  context.customSlotRecipe = () => null
  context.renderSetupCameraPane('Fujifilm X-E5')
  assert.match(pane.querySelector('#setup-fs-grid').children.at(-1).innerHTML, /Recipe data is unavailable/)
})

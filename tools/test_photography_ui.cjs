// No dependencies or build step: node --test tools/test_photography_ui.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const source = file => fs.readFileSync(path.join(root, file), 'utf8')

function load(...files) {
  const context = vm.createContext({})
  files.forEach(file => vm.runInContext(source(file), context, { filename: file }))
  return context
}
const evaluate = (context, expression) => vm.runInContext(expression, context)

// Simple routing DOM stub. Full canvas and native disclosure behavior are
// browser smoke checks, not simulated here.
function navigationContext() {
  const context = load('nav.js')
  const elements = new Map()
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, style: {}, dataset: {},
      classList: { toggle(name, value) { this[name] = value } },
    })
    return elements.get(id)
  }
  const panes = ['home', 'gallery', 'gear', 'setup', 'notes', 'learn', 'recipes'].map(view => element('pane-' + view))
  context.document = {
    getElementById: element,
    querySelectorAll: selector => selector === '.pane' ? panes : [],
  }
  context.location = { hash: '#/' }
  context.history = { replaceState(_state, _title, hash) { context.location.hash = hash } }
  context.renderLearn = () => { context.learnRenders = (context.learnRenders || 0) + 1 }
  context.renderGear = () => {}
  return { context, element }
}

test('Photography data and renderers do not depend on other globals at parse time', () => {
  for (const file of ['gear.js', 'learn.js', 'personal-ui.js', 'nav.js']) {
    assert.doesNotThrow(() => load(file))
  }
})

test('OM-3 has a real local gear image and its own complete setup', () => {
  const context = load('gear.js', 'om-analysis.js')
  const camera = evaluate(context, 'MY_CAMERAS.find(c => c.name === "OM System OM-3")')
  const setup = evaluate(context, 'MY_CUSTOM_SETUPS["OM System OM-3"]')
  assert.ok(camera)
  assert.ok(camera.image.startsWith('images/gear/'))
  assert.ok(fs.statSync(path.join(root, camera.image)).size > 0)
  assert.equal(setup.type, 'om-dial')
  assert.match(setup.intro, /starter setup/)
  assert.deepEqual(Array.from(setup.modes, mode => mode.slot), ['C1', 'C2', 'C3', 'C4', 'C5'])
  assert.equal(setup.colorProfiles.length, 4)
  assert.equal(setup.monoProfiles.length, 4)
  const wheelKeys = evaluate(context, 'OM_WHEEL_ORDER')
  for (const profile of setup.colorProfiles) {
    assert.deepEqual(Object.keys(profile.color_wheel).sort(), Array.from(wheelKeys).sort())
    // OM-3's on-camera saturation adjustments are ±5 (manual p. 229),
    // even though the separate recipe explorer's schema allows ±7.
    Object.values(profile.color_wheel).forEach(value => assert.ok(value >= -5 && value <= 5))
    assert.equal(profile.recipe_type, 'COLOR')
    assert.equal('film_simulation' in profile, false)
  }
  setup.monoProfiles.forEach(profile => assert.equal(profile.recipe_type, 'MONO'))
  assert.equal(evaluate(context, 'MY_CUSTOM_SETUPS["Olympus PEN-F"].modes.length'), 4)
  assert.equal(evaluate(context, 'MY_CUSTOM_SETUPS["Fujifilm X-T50"].type'), 'fuji-slots')
  assert.equal(evaluate(context, 'MY_CUSTOM_SETUPS["Fujifilm X-M5"].type'), 'empty')
})

test('Learning topics are uniquely identified and contain verified model guidance', () => {
  const context = load('learn.js')
  const topics = evaluate(context, 'LEARN_TOPICS')
  assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length)
  assert.equal(topics[0].title, 'Multi-Exposure (Fujifilm)')
  const body = topics[0].body
  for (const mode of ['AVERAGE', 'ADDITIVE', 'BRIGHT', 'DARK']) assert.ok(body.includes(mode))
  for (const model of ['x-t50', 'x-m5']) assert.ok(body.includes(`/manual/${model}/taking_photo/multi-exp/`))
  assert.match(body, /up to nine exposures/)
  assert.match(body, /Conceptual illustration/)
})

test('All four conceptual blend operations and clipping behave as labeled', () => {
  const context = load('personal-ui.js')
  const blend = (a, b, mode) => context.blendExposureValue(a, b, mode)
  assert.equal(blend(80, 120, 'average'), 100)
  assert.equal(blend(80, 120, 'additive'), 200)
  assert.equal(blend(180, 120, 'additive'), 255)
  assert.equal(blend(80, 120, 'bright'), 120)
  assert.equal(blend(80, 120, 'dark'), 80)
  assert.equal(blend(0, 0, 'additive'), 0)
  assert.equal(blend(255, 255, 'average'), 255)
  // Equal layers at -1 EV avoid additive clipping.
  assert.equal(blend(180 / 2, 120 / 2, 'additive'), 150)
})

test('Learn route dispatches and hides recipe-only controls', () => {
  const { context, element } = navigationContext()
  evaluate(context, "navigate('photography', 'learn')")
  assert.equal(context.location.hash, '#/photography/learn')
  assert.equal(context.learnRenders, 1)
  assert.equal(element('pane-learn').classList.on, true)
  assert.equal(element('pane-gear').classList.on, false)
  for (const id of ['sidebar', 'mob-filter-btn', 'header-view-toggle']) {
    assert.equal(element(id).style.display, 'none')
  }
  evaluate(context, "navigate('photography', 'gear')")
  assert.equal(element('pane-learn').classList.on, false)
  context.location.hash = '#/photography/learn'
  evaluate(context, 'applyHash()')
  assert.equal(context.learnRenders, 2)
  assert.equal(context.location.hash, '#/photography/learn')
})

test('Learn has a matching tab, pane, renderer, and relative data script', () => {
  const html = source('index.html')
  assert.match(html, /data-view="learn">Learn/)
  assert.match(html, /id="pane-learn"/)
  assert.match(html, /id="learn-body"/)
  assert.match(html, /<script src="learn\.js(?:\?v=[^"]+)?"><\/script>/)
  assert.ok(html.indexOf('src="learn.js') < html.indexOf('src="personal-ui.js'))
  const context = load('nav.js')
  assert.ok(evaluate(context, 'NAV_VIEWS.photography.includes("learn")'))
  assert.equal(evaluate(context, 'typeof NAV_RENDER.learn'), 'function')
})

test('Missing personal data degrades gracefully', () => {
  const context = load('personal-ui.js')
  const container = { innerHTML: '' }
  context.$ = () => container
  context.renderLearn()
  assert.match(container.innerHTML, /No learning topics yet/)
  context.renderSetupCameraPane('OM System OM-3')
  assert.match(container.innerHTML, /No custom setup yet/)
})

test('Multiple exposure retains the clean scene and offers a textured-background alternative', () => {
  const context = load('learn.js')
  const body = evaluate(context, 'LEARN_TOPICS[0].body')
  assert.match(body, /data-blend-background/)
  assert.match(body, /value="clean"/)
  assert.match(body, /value="textured"/)
  assert.match(body, /does not have to be white/)
})

test('Metering is a separate topic with model-specific guidance and a scoped demo', () => {
  const context = load('learn.js')
  const topic = evaluate(context, 'LEARN_TOPICS.find(t => t.id === "metering")')
  assert.ok(topic)
  assert.equal(topic.title, 'Metering')
  assert.equal(topic.demo, 'metering')
  for (const text of ['PHOTOMETRY', 'INTERLOCK SPOT AE', 'FACE/EYE', 'ESP', 'Spot Hi', 'Spot SH', 'Auto ISO']) {
    assert.ok(topic.body.includes(text), text)
  }
  assert.match(topic.body, /data-metering-demo/)
  assert.match(topic.body, /data-metering-comp/)
  assert.match(topic.body, /not a camera simulator/)
  for (const model of ['x-t50', 'x-m5']) assert.ok(topic.body.includes(`/manual/${model}/taking_photo/photometry/`))
})

test('Conceptual metering uses the selected area and compensation moves exposure by stops', () => {
  const context = load('learn.js', 'personal-ui.js')
  const scene = evaluate(context, 'METERING_DEMO_SCENES.backlit')
  const read = (mode, target = 'subject') => context.meteringDemoReading(scene, mode, target)
  assert.equal(read('spot', 'subject'), scene.subject)
  assert.equal(read('spot', 'background'), scene.background)
  assert.equal(read('spot', 'shadow'), scene.shadow)
  assert.ok(read('average') > read('center'))
  assert.ok(read('center') > read('spot'))
  const ev = context.meteringDemoExposure(read('spot'), 0)
  const gain = Math.pow(2, ev)
  assert.ok(Math.abs(scene.subject * gain - 0.18) < 1e-12)
  assert.equal(context.meteringDemoExposure(read('spot'), 1) - ev, 1)
  assert.equal(context.meteringDemoExposure(read('spot'), -1) - ev, -1)
  assert.ok(context.meteringDemoExposure(read('spot', 'shadow'), 0) > ev)
  assert.ok(Number.isFinite(context.meteringDemoExposure(0, 0)))
  assert.ok(evaluate(context, 'METERING_DEMO_SCENES.snow.background') > 0.18)
  assert.ok(evaluate(context, 'METERING_DEMO_SCENES.night.background') < 0.18)
})

test('Exposure scenario lesson covers the requested situations with complete starting settings', () => {
  const context = load('learn.js')
  const topic = evaluate(context, 'LEARN_TOPICS.find(t => t.id === "exposure-scenarios")')
  assert.ok(topic)
  assert.equal(topic.title, 'Exposure for Scenarios')
  assert.match(topic.body, /starting points/)
  assert.match(topic.body, /data-exposure-scenarios/)
  const scenarios = topic.scenarios
  assert.ok(scenarios.length >= 10)
  assert.equal(new Set(scenarios.map(s => s.id)).size, scenarios.length)
  for (const id of ['street', 'portraits', 'kids-pets', 'sports', 'night-people', 'landscape', 'panning']) {
    assert.ok(scenarios.some(s => s.id === id), id)
  }
  for (const scenario of scenarios) {
    for (const key of ['id', 'title', 'intent', 'mode', 'aperture', 'shutter', 'iso', 'af', 'area', 'drive', 'extras']) {
      assert.equal(typeof scenario[key], 'string', scenario.id + ': ' + key)
      assert.ok(scenario[key].length, scenario.id + ': ' + key)
    }
    assert.ok(scenario.adjust.length >= 2, scenario.id)
  }
  assert.equal(evaluate(context, 'typeof LEARN_TOPICS[0].body'), 'string')
  assert.equal(evaluate(context, 'LEARN_TOPICS[1].id'), 'metering')
})

test('Exposure guide explains body differences, motion blur, and Auto ISO limits', () => {
  const context = load('learn.js')
  const topic = evaluate(context, 'LEARN_TOPICS.find(t => t.id === "exposure-scenarios")')
  assert.ok(topic)
  const text = topic.body + JSON.stringify(topic.scenarios)
  for (const phrase of ['AF-S', 'AF-C', 'S-AF', 'C-AF', 'X-M5', 'no IBIS', '6400', '12800', 'DR200', 'DR400', 'diffraction', 'banding', 'ND filter']) {
    assert.ok(text.includes(phrase), phrase)
  }
  assert.match(text, /IBIS.*moving subject/)
  assert.match(text, /ceiling.*not.*target/)
})

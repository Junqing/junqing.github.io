// Verified publisher refresh: node --test tools/test_recipe_sync.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const context = vm.createContext({})
for (const file of ['recipes-v.js', 'recipes-iv.js', 'recipes-ii.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context)
}
const get = expression => vm.runInContext(expression, context)
const find = (gen, name) => get(`RECIPES_${gen}`).find(recipe => recipe.name === name)
const additionsV = ['Retro Slide', 'KinaColor 26', 'Astia Azure', 'CineStill 800T v2', 'Atlantic Sunrise', 'AgfaChrome RSX II 200 Expired']
const additionsIV = ['KinaColor 26', 'Astia Azure', 'Atlantic Sunrise', 'AgfaChrome RSX II 200 Expired', 'Kodak Portra 160 (X-T3/X-T30)', 'Verano Tostado']

test('Reviewed additions append to V/IV without renaming the older Portra 160 recipe', () => {
  assert.equal(get('RECIPES_V.length'), 119)
  assert.equal(get('RECIPES_IV.length'), 208)
  assert.equal(get('RECIPES_II.length'), 32)
  assert.deepEqual(Array.from(get('RECIPES_V.slice(-6)'), recipe => recipe.name), additionsV)
  assert.deepEqual(Array.from(get('RECIPES_IV.slice(-6)'), recipe => recipe.name), additionsIV)
  assert.match(find('IV', 'Kodak Portra 160').source_url, /2023\/10\/15/)
  assert.match(find('IV', 'Kodak Portra 160 (X-T3/X-T30)').source_url, /2020\/04\/03/)
})

test('Compatible IV versions follow explicit source settings, not a blanket CCB conversion', () => {
  assert.equal(find('V', 'KinaColor 26').color_chrome_fx_blue, 'Weak')
  assert.equal(find('IV', 'KinaColor 26').color_chrome_fx_blue, 'Strong')
  for (const name of ['Astia Azure', 'Atlantic Sunrise', 'AgfaChrome RSX II 200 Expired']) {
    for (const field of ['film_simulation', 'color_chrome_fx_blue', 'white_balance', 'highlight', 'shadow', 'color', 'clarity']) {
      assert.equal(find('V', name)[field], find('IV', name)[field], name + ': ' + field)
    }
  }
  assert.equal(find('IV', 'Retro Slide'), undefined)
  assert.equal(find('IV', 'CineStill 800T v2'), undefined)
})

test('Seven reviewed IV records contain the published corrections and missing ISO values', () => {
  assert.equal(find('IV', 'Kodak Portra 800 v3').shadow, -0.5)
  assert.equal(find('IV', 'Scanned Superia').dynamic_range, 'DR-P Auto')
  assert.equal(find('IV', 'Pulled Fujicolor Superia').dynamic_range, 'DR-P Strong')
  for (const name of ['Scanned Superia', 'Pulled Fujicolor Superia']) {
    assert.equal(find('IV', name).highlight, null)
    assert.equal(find('IV', name).shadow, null)
  }
  for (const [name, iso] of [['Kodak Tri-X 400', '12800'], ['Moody Monochrome', '3200'],
                           ['Kodacolor II 126', '6400'], ['Ilford HP5 Plus 400 Push Process', '51200']]) {
    assert.equal(find('IV', name).iso_max, iso)
  }
  assert.equal(find('IV', 'Ilford HP5 Plus 400 Push Process').dynamic_range, null)
})

test('New unknowns remain null and explicit prose exceptions in existing recipes are preserved', () => {
  const portra = find('IV', 'Kodak Portra 160 (X-T3/X-T30)')
  assert.equal(portra.clarity, null)
  assert.equal(portra.color_chrome_fx_blue, null)
  assert.equal(find('IV', 'Verano Tostado').exposure_compensation, null)
  assert.equal(find('II', 'Astia').iso_max, '3200', 'Published APS-C allowance applies to X70')
  for (const name of ['Acros Negative', 'Eterna Film']) assert.equal(find('V', name).iso_max, '12800')
  for (const name of ['Acros Negative', 'B&W Negative', 'B&W Sepia']) assert.equal(find('V', name).color, null)
})

test('New records use only the Fuji schema, source links and finite on-camera numeric values', () => {
  for (const [gen, names] of [['V', additionsV], ['IV', additionsIV]]) {
    for (const name of names) {
      const recipe = find(gen, name)
      assert.match(recipe.source_url, /^https:\/\/fujixweekly\.com\/\d{4}\/\d{2}\/\d{2}\//)
      assert.equal(Object.hasOwn(recipe, 'color_direction'), false)
      for (const field of ['color_wheel', 'recipe_type', 'highlights', 'shadows', 'wb_amber_offset']) {
        assert.equal(Object.hasOwn(recipe, field), false, name + ': ' + field)
      }
      for (const field of ['highlight', 'shadow', 'color', 'sharpness', 'clarity']) {
        const value = recipe[field]
        assert.ok(value === null || (Number.isFinite(value) && value >= -5 && value <= 5), name + ': ' + field)
      }
      assert.ok(Math.abs(Number(recipe.wb_shift_red)) <= 9)
      assert.ok(Math.abs(Number(recipe.wb_shift_blue)) <= 9)
      assert.match(recipe.iso_max, /^\d+$/)
    }
  }
})

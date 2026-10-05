// No dependencies: node --test tools/test_photo_viewer.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const context = vm.createContext({})
vm.runInContext(fs.readFileSync(path.join(root, 'personal-ui.js'), 'utf8'), context)

function fit(w, h, maxW, maxH) {
  assert.equal(typeof context.fitPhotoToBox, 'function')
  return context.fitPhotoToBox(w, h, maxW, maxH)
}

test('Desktop landscape grows beyond the recipe-dialog limit without inflating portrait width', () => {
  const landscape = fit(6000, 4000, 1864, 970)
  const portrait = fit(4000, 6000, 1864, 970)
  assert.ok(landscape.width > 1400)
  assert.ok(portrait.width < 700)
  assert.ok(Math.abs(landscape.height - 970) < 1e-9)
  assert.ok(Math.abs(portrait.height - 970) < 1e-9)
  assert.ok(landscape.width > 2 * portrait.width)
})

test('Landscape, portrait, square and panorama fit both bounds without changing aspect ratio', () => {
  for (const [w, h] of [[6000,4000],[4000,6000],[4000,4000],[10000,2000]]) {
    for (const [maxW, maxH] of [[1864,970],[1384,790],[366,700],[296,560],[800,240]]) {
      const size = fit(w, h, maxW, maxH)
      assert.ok(size.width <= maxW + 1e-9)
      assert.ok(size.height <= maxH + 1e-9)
      assert.ok(Math.abs(size.width / size.height - w / h) < 1e-9)
      assert.ok(Math.abs(size.width - maxW) < 1e-9 || Math.abs(size.height - maxH) < 1e-9)
    }
  }
})

test('Invalid dimensions do not produce NaN CSS sizes', () => {
  for (const args of [[0,100,500,500],[100,0,500,500],[100,100,0,500],[Infinity,100,500,500],[100,NaN,500,500]]) {
    assert.equal(fit(...args), null)
  }
})

test('Viewport-sized photo layout is scoped to photo-open and leaves recipe sizing intact', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8')
  assert.match(css, /\.rmodal-inner\{[^}]*max-width:760px/)
  assert.match(css, /\.rmodal\.photo-open \.rmodal-inner\{[^}]*max-width:none/)
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  assert.match(html, /initGalleryViewer\(\)/)
  assert.match(html, /gal-photo-stage/)
})

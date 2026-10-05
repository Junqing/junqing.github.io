// Optional, deterministic browser regression suite (not a runtime dependency).
// SITE_URL=http://localhost:8000/ PLAYWRIGHT_MODULE=/tmp/.../playwright
// CHROMIUM_EXECUTABLE=/path/to/browser BROWSER=chromium node tools/smoke_site.cjs
const assert = require('node:assert/strict')
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const engineName = process.env.BROWSER || 'chromium'
const base = process.env.SITE_URL || 'http://localhost:8000/'
const image = (w,h) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#456657"/></svg>`)

;(async () => {
  const browser = await playwright[engineName].launch({ headless: true, ...(engineName === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const errors = [], missing = [], requests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => requests.push(request.url()))
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()) })
    await page.goto(base)
    assert.equal(await page.locator('#grid .card').count(), 0, 'Home should not build unvisited recipe cards')
    assert.equal(requests.some(url => /recipes-(iv|iii|ii|i|om)\.js/.test(url)), false, 'Only V data should load at startup')
    const families = await page.evaluate(() => RECIPE_FAMILIES.map(({ id, count }) => ({ id, count })))
    for (const family of families) {
      for (const [view, subview] of [['recipes','list'],['recipes','keywords'],['insights','settings'],['insights','directions'],['insights','correlations'],['explore',null],['compare',null]]) {
        await page.evaluate(args => navigate('camera', args.view, args.subview, args.family), { view, subview, family: family.id })
        await page.waitForFunction(gen => activeGen === gen && !familySwitchPending(), family.id)
        assert.equal(await page.locator('#pane-' + view).isVisible(), true)
        if (view === 'recipes' && subview === 'list') assert.equal(await page.locator('#grid .card').count(), family.count)
        if (view === 'explore') {
          assert.equal(await page.locator(family.id === 'OM' ? '#omexp-wheel-svg' : '#exp-radar-svg').isVisible(), true)
          if (family.id !== 'OM') {
            const options = await page.locator('#exp-film-sim option').evaluateAll(options => options.map(option => option.value))
            assert.equal(options.length, new Set(options).size, 'No duplicate film simulation options')
          }
        }
        if (view === 'insights' && subview === 'correlations' && family.id !== 'OM') {
          const counts = await page.locator('.corr-n').allTextContents()
          counts.forEach(text => assert.ok(parseInt(text) <= family.count))
        }
        assert.equal(await page.locator('.content-scroll').evaluate(node => node.scrollWidth <= node.clientWidth + 1), true)
      }
    }
    // Legitimate duplicate OM names must select the exact author/record.
    await page.evaluate(() => navigate('camera','recipes','list','OM'))
    await page.waitForFunction(() => activeGen === 'OM')
    const variants = await page.evaluate(() => activeRecipes().filter(recipe => recipe.name === 'Kodachrome 64').map(recipe => ({ key: recipeIdentity(recipe), author: recipe.author, contrast: recipe.contrast })))
    for (const variant of variants) {
      await page.evaluate(key => openRecipeModal(key, 'OM'), variant.key)
      assert.equal(await page.locator('#recipe-modal .cnarr').textContent(), 'by ' + variant.author)
      await page.keyboard.press('Escape')
    }
    const firstCard = page.locator('#grid .card').filter({ has: page.locator('.ctitle').filter({ hasText: /^Kodachrome 64$/ }) }).filter({ has: page.getByText('by ' + variants[0].author, { exact: true }) })
    const secondCard = page.locator('#grid .card').filter({ has: page.locator('.ctitle').filter({ hasText: /^Kodachrome 64$/ }) }).filter({ has: page.getByText('by ' + variants[1].author, { exact: true }) })
    await firstCard.getByRole('button', { name: 'View details', exact: true }).click()
    assert.equal(await page.locator('#recipe-modal .cnarr').textContent(), 'by ' + variants[0].author)
    await page.keyboard.press('Escape')
    await firstCard.locator('.cmp-card-btn').click()
    assert.equal(await secondCard.locator('.cmp-card-btn').textContent(), 'Compare')
    await secondCard.locator('.cmp-card-btn').click()
    assert.equal(await page.evaluate(() => C.a.author), variants[0].author)
    assert.equal(await page.evaluate(() => C.b.author), variants[1].author)
    await page.evaluate(() => navigate('camera','explore',null,'OM'))
    await page.locator('#omexp-seed-input').fill('Kodachrome 64')
    await page.locator('#omexp-seed-dropdown').getByText('Kodachrome 64 — ' + variants[1].author, { exact: true }).click()
    assert.equal(await page.evaluate(() => TOM.contrast), variants[1].contrast)
    await page.evaluate(() => navigate('camera','recipes','list','V'))
    await page.waitForFunction(() => activeGen === 'V')
    await page.locator('#q').fill('Kodachrome 64')
    assert.ok(await page.locator('#grid .card').count() >= 1)
    await page.getByRole('button', { name: 'Recipe cheatsheet' }).click()
    assert.match(await page.locator('#grid').getAttribute('class'), /cheatsheet/)
    await page.getByRole('button', { name: 'Visual recipe cards' }).click()
    await page.locator('#clear-btn').click()
    for (const width of [1440,768,390,320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const view of ['gallery','gear','setup','notes','learn']) {
        await page.evaluate(view => navigate('photography',view), view)
        assert.equal(await page.locator('.content-scroll').evaluate(node => node.scrollWidth <= node.clientWidth + 1), true)
      }
      await page.evaluate(() => navigate('photography','setup'))
      await page.getByRole('button', { name: 'Fujifilm X-T50', exact: true }).click()
      assert.equal(await page.locator('.cs-slot-pane').count(), 7)
      await page.getByRole('button', { name: 'Fujifilm X-E5', exact: true }).click()
      assert.equal(await page.locator('.setup-scenario-bank').count(), 7)
      assert.equal(await page.locator('.setup-fs-card').count(), 3)
      await page.getByRole('button', { name: 'OM System OM-3', exact: true }).click()
      assert.equal(await page.locator('#setup-modes-grid .pfm-card').count(), 5)
      await page.getByRole('button', { name: 'Fujifilm X-M5', exact: true }).click()
      assert.match(await page.locator('#setup-cam-pane').textContent(), /No custom setup yet/)
    }
    await page.evaluate(() => navigate('photography','learn'))
    assert.equal(await page.locator('.learn-topic').count(), 3)
    await page.locator('[data-blend-background]').selectOption('textured')
    await page.locator('[data-blend-mode]').selectOption('bright')
    await page.locator('#learn-metering > summary').click()
    await page.locator('[data-metering-mode]').selectOption('spot')
    assert.equal(await page.locator('[data-metering-target]').isDisabled(), false)
    await page.setViewportSize({ width: 1920, height: 1080 })
    const photos = [
      { w: 6000, h: 4000, src: image(6000,4000), camera: 'Landscape' },
      { w: 4000, h: 6000, src: image(4000,6000), camera: 'Portrait' },
    ]
    await page.evaluate(photos => { GALLERY_PHOTOS = photos; openPhotoModal(photos[0]) }, photos)
    await page.waitForFunction(() => document.querySelector('.gal-photo').complete)
    assert.ok((await page.locator('.gal-photo').boundingBox()).width > 1400)
    await page.keyboard.press('ArrowRight')
    assert.ok((await page.locator('.gal-photo').boundingBox()).width < 700)
    await page.evaluate(() => openRecipeModal(activeRecipes()[0].name))
    assert.ok((await page.locator('.rmodal-inner').boundingBox()).width <= 761)
    await page.keyboard.press('Escape')
    // Cold/deferred loads must rebuild the chosen view, not a hidden grid.
    for (const view of ['explore','insights','compare']) {
      const cold = await browser.newPage()
      cold.on('pageerror', error => errors.push(error.message))
      await cold.route('**/recipes-om.js*', async route => { await new Promise(resolve => setTimeout(resolve, 350)); await route.continue() })
      await cold.goto(base + '#/camera/' + view + '/f=OM')
      await cold.waitForFunction(() => activeGen === 'OM' && !familySwitchPending())
      const built = await cold.evaluate(view => view === 'explore' ? omExploreBuilt : view === 'compare' ? omCompareBuilt : omSettingsBuilt, view)
      assert.equal(built, true, 'Deferred OM ' + view + ' must use OM controls')
      assert.match(await cold.locator('.bfd-body').textContent(), /colour wheel tilt/)
      await cold.close()
    }
    const cancel = await browser.newPage()
    cancel.on('pageerror', error => errors.push(error.message))
    let omRequests = 0
    await cancel.route('**/recipes-om.js*', async route => { omRequests++; await new Promise(resolve => setTimeout(resolve, 500)); await route.continue() })
    await cancel.goto(base + '#/camera/recipes')
    await cancel.evaluate(() => navigate('camera','recipes',null,'OM'))
    await cancel.waitForTimeout(80)
    await cancel.evaluate(() => navigate('camera','recipes',null,'V'))
    await cancel.waitForTimeout(650)
    assert.equal(await cancel.evaluate(() => activeGen === 'V' && NAV.family === 'V'), true)
    assert.equal(omRequests, 1, 'Hashchange must not duplicate the lazy script request')
    await cancel.close()
    assert.deepEqual(errors, [])
    assert.deepEqual(missing, [])
    console.log('PASS ' + engineName + ': all six families/views, lazy startup, exact counts, no duplicate Explore options, current-family correlations, search/cheatsheet, all setups, Learn demos, viewer isolation, desktop/tablet/mobile and local assets.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exit(1) })

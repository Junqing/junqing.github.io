# Lightroom Cloud Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-level Gallery tab showing Jin's photographs, hotlinked from publicly-shared Adobe Lightroom albums with per-photo shooting settings, without committing any image files.

**Architecture:** A Python script reads Lightroom's public album API server-side (the browser cannot — Adobe returns 403 cross-origin) and writes `gallery.js`, a plain-globals data file in the same style as `gear.js`. `index.html` gains a sixth tab that renders it. A `/gallery` Claude skill drives the script conversationally.

**Tech Stack:** Python 3 standard library only (`urllib`, `json`, `argparse`) — no pip installs. Vanilla JS, no framework. No build tooling for the site itself.

**Spec:** `docs/superpowers/specs/2026-08-11-lightroom-gallery-design.md`

## Global Constraints

- **No npm, no bundler, no package.json.** The site remains buildless; `gallery.js` is a plain `<script src>` global.
- **Python 3 standard library only.** No `requests`, no pip installs.
- **Never commit image files** for the gallery. Photos are hotlinked.
- **Allowlist, never blocklist,** when copying fields from the Lightroom API.
- **These fields must never appear in `gallery.js`:** `SerialNumber`, `device`, `fileName`, `sha256`, `originalDigest`, `importedBy`, `CreatorTool`.
- **Do not modify recipe code paths:** `matches()`, `activeRecipes()`, `makeCard()`, `makeOmCard()`, `fingerprint()`, `switchGen()`'s recipe logic, or any `recipes-*.js` file.
- **The two recipe families stay separate** — the Gallery is a third thing and must not touch either.
- **API responses are prefixed with `while (1) {}`** (XSSI protection). This must be stripped before `json.loads`.
- **Lightroom stores exposure values as `[numerator, denominator]` rationals.** Convert at build time.
- **Base URL for all API calls:** `https://lightroom.adobe.com/v2c/spaces/<SPACE_ID>/`
- **Known-good test album:** space `4679d64af9bd4c5f834bb13ca74aef75`, label `Kat × Art`, 100 photos, all Fujifilm X-M5 + XF23mmF2.8 R WR.

---

## File Structure

| File | Responsibility |
|---|---|
| `tools/build_gallery.py` | **Create.** Fetch albums, allowlist fields, write `gallery.js`. The only file that talks to Adobe. Underscore, not hyphen — the test imports it as a module. |
| `gallery.js` | **Generated.** `GALLERY_ALBUMS` + `GALLERY_PHOTOS` globals. Never hand-edited. |
| `index.html` | **Modify.** Script tag, tab, pane, sidebar section, CSS, `renderGallery()`, `openPhotoModal()`, `switchTab()` dispatch, `initChips()` guard. |
| `.claude/skills/gallery/SKILL.md` | **Create.** Invocable `/gallery` skill. |
| `docs/skills/gallery.md` | **Create.** Human-readable mirror, per repo convention. |
| `CLAUDE.md` | **Modify.** Document the Gallery tab and the build-step exception. |

Tasks are ordered so each produces something independently verifiable: the script works before the UI consumes it, and the UI works before the skill automates it.

---

## Task 1: Build script — fetch and transform

**Files:**
- Create: `tools/build_gallery.py`
- Create: `tools/test_build_gallery.py`

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `strip_xssi(text: str) -> str`
  - `rational(v) -> float` — accepts `[num, den]` or a plain number
  - `fmt_shutter(exposure_time) -> str` — `[1,80]` → `"1/80"`
  - `fmt_aperture(fnumber) -> str` — `[56,10]` → `"f/5.6"`
  - `tidy_lens(name: str) -> str` — `"XF23mmF2.8 R WR"` → `"XF23mm f/2.8 R WR"`
  - `photo_from_asset(asset: dict, space_id: str, album_id: str) -> dict`
  - `ALBUMS: list[dict]` — module-level album declarations

There is no test framework in this repo. These tests use Python's built-in
`unittest`, run directly with `python3`. They cover the pure transform
functions only — the network layer is exercised manually in Task 2.

- [ ] **Step 1: Write the failing test**

Create `tools/test_build_gallery.py`:

```python
import unittest
import build_gallery as bg


class TestTransforms(unittest.TestCase):
    def test_strip_xssi_removes_prefix(self):
        self.assertEqual(bg.strip_xssi('while (1) {}{"a":1}'), '{"a":1}')

    def test_strip_xssi_passes_clean_json_through(self):
        self.assertEqual(bg.strip_xssi('{"a":1}'), '{"a":1}')

    def test_rational_from_pair(self):
        self.assertAlmostEqual(bg.rational([56, 10]), 5.6)

    def test_rational_from_plain_number(self):
        self.assertAlmostEqual(bg.rational(35), 35.0)

    def test_fmt_shutter_fast(self):
        self.assertEqual(bg.fmt_shutter([1, 80]), '1/80')

    def test_fmt_shutter_long_exposure(self):
        self.assertEqual(bg.fmt_shutter([2, 1]), '2s')

    def test_fmt_aperture(self):
        self.assertEqual(bg.fmt_aperture([56, 10]), 'f/5.6')

    def test_fmt_aperture_whole_stop(self):
        self.assertEqual(bg.fmt_aperture([80, 10]), 'f/8')

    def test_tidy_lens_inserts_space_and_lowercases_f(self):
        self.assertEqual(bg.tidy_lens('XF23mmF2.8 R WR'), 'XF23mm f/2.8 R WR')

    def test_tidy_lens_leaves_clean_names_alone(self):
        self.assertEqual(bg.tidy_lens('M.Zuiko 17mm f/1.8'), 'M.Zuiko 17mm f/1.8')


class TestPhotoFromAsset(unittest.TestCase):
    def setUp(self):
        self.asset = {
            "id": "06a25c299da14a7fa0fdac1cfa1afaf6",
            "links": {
                "/rels/rendition_type/thumbnail2x": {"href": "assets/A/revisions/B/renditions/THUMB"},
                "/rels/rendition_type/1280": {"href": "assets/A/revisions/B/renditions/BIG"},
            },
            "payload": {
                "captureDate": "2026-07-18T10:49:38.92+01:00",
                "importSource": {
                    "originalWidth": 6240, "originalHeight": 4160,
                    "fileName": "DSCF0592.jpg", "sha256": "deadbeef",
                    "importedBy": "f1d86fc934af10861871262c098a2574",
                },
                "develop": {"device": "Jin's MacBook Pro {abc123}"},
                "xmp": {
                    "tiff": {"Make": "FUJIFILM", "Model": "X-M5"},
                    "aux": {"SerialNumber": "5C024309", "Lens": "XF23mmF2.8 R WR"},
                    "xmp": {"CreatorTool": "Adobe Lightroom 9.4.1 (Macintosh)"},
                    "exif": {
                        "FNumber": [56, 10], "ExposureTime": [1, 80],
                        "ISOSpeedRatings": 3200, "FocalLength": [2300, 100],
                        "FocalLengthIn35mmFilm": 35,
                    },
                },
            },
        }

    def test_extracts_expected_fields(self):
        p = bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM')
        self.assertEqual(p['camera'], 'Fujifilm X-M5')
        self.assertEqual(p['lens'], 'XF23mm f/2.8 R WR')
        self.assertEqual(p['aperture'], 'f/5.6')
        self.assertEqual(p['shutter'], '1/80')
        self.assertEqual(p['iso'], 3200)
        self.assertEqual(p['focal'], '23mm (35mm eq)')
        self.assertEqual(p['date'], '2026-07-18')
        self.assertEqual(p['album'], 'SPACE')
        self.assertEqual(p['w'], 6240)
        self.assertEqual(p['h'], 4160)

    def test_builds_absolute_rendition_urls(self):
        p = bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM')
        self.assertTrue(p['thumb'].startswith('https://lightroom.adobe.com/v2c/spaces/SPACE/'))
        self.assertTrue(p['thumb'].endswith('THUMB'))
        self.assertTrue(p['src'].endswith('BIG'))

    def test_drops_every_private_field(self):
        blob = repr(bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM'))
        for leaked in ['5C024309', 'MacBook', 'DSCF0592', 'deadbeef',
                       'f1d86fc934af10861871262c098a2574', 'CreatorTool']:
            self.assertNotIn(leaked, blob)

    def test_survives_missing_exif_when_metadata_disabled(self):
        del self.asset['payload']['xmp']['exif']
        del self.asset['payload']['xmp']['aux']
        p = bg.photo_from_asset(self.asset, 'SPACE', 'ALBUM')
        self.assertIsNone(p['aperture'])
        self.assertIsNone(p['lens'])
        self.assertEqual(p['camera'], 'Fujifilm X-M5')
        self.assertTrue(p['thumb'])


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools && python3 test_build_gallery.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'build_gallery'`

- [ ] **Step 3: Write the implementation**

Create `tools/build_gallery.py` — underscore, not hyphen. Hyphenated module
names cannot be imported, and `tools/test_build_gallery.py` imports this as
`build_gallery`. Invoke it as `python3 tools/build_gallery.py`.

```python
#!/usr/bin/env python3
"""Generate gallery.js from public Adobe Lightroom shared albums.

Run:  python3 tools/build_gallery.py

Photos are hotlinked, never downloaded. Only the fields named in
photo_from_asset() are copied — this is an allowlist, so anything Adobe adds
later cannot leak into the published site by oversight.
"""

import json
import re
import sys
import urllib.error
import urllib.request

# ── Album declarations — the source of truth. Edit this list, then re-run. ──
ALBUMS = [
    {"space": "4679d64af9bd4c5f834bb13ca74aef75", "label": "Kat × Art"},
]

API = "https://lightroom.adobe.com/v2c/spaces/{space}/"
OUT = "gallery.js"
TIMEOUT = 30


def strip_xssi(text):
    """Adobe prefixes JSON responses with `while (1) {}` against XSSI."""
    return re.sub(r'^while\s*\(1\)\s*\{\}', '', text, count=1)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "build-gallery/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(strip_xssi(r.read().decode("utf-8")))


def rational(v):
    """Lightroom stores EXIF numbers as [numerator, denominator] pairs."""
    if isinstance(v, list) and len(v) == 2 and v[1]:
        return v[0] / v[1]
    return float(v) if isinstance(v, (int, float)) else None


def fmt_shutter(v):
    t = rational(v)
    if t is None:
        return None
    if t < 1:
        return "1/{}".format(round(1 / t))
    return "{:g}s".format(t)


def fmt_aperture(v):
    f = rational(v)
    return None if f is None else "f/{:g}".format(round(f, 1))


def tidy_lens(name):
    """'XF23mmF2.8 R WR' -> 'XF23mm f/2.8 R WR'."""
    if not name:
        return None
    return re.sub(r'(\d)F(\d)', r'\1 f/\2', name)


def photo_from_asset(asset, space_id, album_id):
    """Copy ONLY the allowlisted fields. Everything else is dropped."""
    payload = asset.get("payload", {})
    xmp = payload.get("xmp", {})
    exif = xmp.get("exif", {})
    aux = xmp.get("aux", {})
    tiff = xmp.get("tiff", {})
    imp = payload.get("importSource", {})
    links = asset.get("links", {})
    base = API.format(space=space_id)

    def rendition(key):
        href = links.get("/rels/rendition_type/" + key)
        return base + href["href"] if href else None

    make = (tiff.get("Make") or "").strip().title()
    model = (tiff.get("Model") or "").strip()
    camera = " ".join(p for p in [make, model] if p) or None
    if camera and model.upper().startswith(make.upper()):
        camera = model

    focal = rational(exif.get("FocalLength"))
    eq = exif.get("FocalLengthIn35mmFilm")
    focal_str = None
    if focal:
        focal_str = "{:g}mm".format(round(focal))
        if eq:
            focal_str += " ({}mm eq)".format(eq)

    capture = payload.get("captureDate") or ""

    return {
        "album": space_id,
        "thumb": rendition("thumbnail2x"),
        "src": rendition("1280"),
        "w": imp.get("originalWidth"),
        "h": imp.get("originalHeight"),
        "date": capture[:10] or None,
        "camera": camera,
        "lens": tidy_lens(aux.get("Lens")),
        "aperture": fmt_aperture(exif.get("FNumber")),
        "shutter": fmt_shutter(exif.get("ExposureTime")),
        "iso": exif.get("ISOSpeedRatings"),
        "focal": focal_str,
    }


def load_album(space_id, label):
    """Return (album_dict, [photo, ...]). Raises on any failure."""
    base = API.format(space=space_id)
    space = fetch(base)
    share = space.get("payload", {})
    if share.get("private"):
        raise RuntimeError("album {} is private".format(space_id))

    resources = fetch(base + "resources").get("resources", [])
    albums = [r for r in resources if r.get("type") == "album"]
    if not albums:
        raise RuntimeError("no album found in space {}".format(space_id))

    photos = []
    for alb in albums:
        alb_id = alb["id"]
        url = (base + "albums/{}/assets?embed=asset&subtype=image%3Bvideo"
               .format(alb_id))
        for res in fetch(url).get("resources", []):
            asset = res.get("asset")
            if not asset:
                continue
            p = photo_from_asset(asset, space_id, alb_id)
            if p["thumb"] and p["src"]:
                photos.append(p)

    return (
        {"id": space_id, "label": label, "count": len(photos),
         "metadata": bool(share.get("metadata"))},
        photos,
    )


def main():
    albums, photos = [], []
    for entry in ALBUMS:
        label = entry["label"]
        print("Fetching {} ...".format(label))
        try:
            alb, pics = load_album(entry["space"], label)
        except (urllib.error.URLError, urllib.error.HTTPError,
                RuntimeError, KeyError, ValueError) as exc:
            # Abort without writing. A partial manifest would silently delete
            # photos from the live site.
            print("\nERROR: {} failed: {}".format(label, exc), file=sys.stderr)
            print("Aborted. {} was NOT modified.".format(OUT), file=sys.stderr)
            return 1
        if not alb["metadata"]:
            print("  WARNING: metadata disabled on this share — "
                  "captions will be empty.")
        print("  {} photos".format(alb["count"]))
        albums.append(alb)
        photos.extend(pics)

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("// GENERATED by tools/build_gallery.py — DO NOT EDIT BY HAND.\n")
        fh.write("// Re-run the script or use the /gallery skill to update.\n")
        fh.write("var GALLERY_ALBUMS = ")
        json.dump(albums, fh, ensure_ascii=False, indent=1)
        fh.write(";\n\nvar GALLERY_PHOTOS = ")
        json.dump(photos, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")

    print("\nWrote {} — {} albums, {} photos".format(OUT, len(albums), len(photos)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools && python3 test_build_gallery.py -v`
Expected: PASS — 15 tests OK

- [ ] **Step 5: Commit**

```bash
git add tools/build_gallery.py tools/test_build_gallery.py
git commit -m "feat: add Lightroom gallery build script

Fetches public Lightroom album JSON server-side (the browser cannot —
Adobe returns 403 cross-origin) and allowlists fields into gallery.js.
Serial numbers, device names, and filenames are dropped by construction."
```

---

## Task 2: Generate the real manifest

**Files:**
- Create: `gallery.js` (generated output, committed)

**Interfaces:**
- Consumes: `tools/build_gallery.py` from Task 1
- Produces: `GALLERY_ALBUMS`, `GALLERY_PHOTOS` globals consumed by Task 3

This task has a network dependency. If the album has been made private since
planning, it will fail loudly — that is the designed behaviour, not a bug.

- [ ] **Step 1: Run the script against the real album**

Run: `python3 tools/build_gallery.py`
Expected output:
```
Fetching Kat × Art ...
  100 photos

Wrote gallery.js — 1 albums, 100 photos
```

- [ ] **Step 2: Verify no private data leaked**

Run:
```bash
grep -cE 'SerialNumber|5C024309|MacBook|DSCF|sha256|importedBy|CreatorTool' gallery.js
```
Expected: `0`

If this returns anything other than 0, STOP. Do not commit. The allowlist in
`photo_from_asset()` has a bug.

- [ ] **Step 3: Spot-check the generated content**

Run: `head -30 gallery.js`
Expected: a `GALLERY_ALBUMS` array with one entry (`label: "Kat × Art"`,
`count: 100`, `metadata: true`), followed by `GALLERY_PHOTOS` whose first entry
has `camera: "X-M5"`, `lens: "XF23mm f/2.8 R WR"`, `aperture: "f/5.6"`,
`shutter: "1/80"`, `iso: 3200`.

- [ ] **Step 4: Verify a hotlink still resolves**

Run:
```bash
python3 -c "
import json,re,urllib.request
src=open('gallery.js').read()
url=json.loads(re.search(r'var GALLERY_PHOTOS = (\[.*\]);', src, re.S).group(1))[0]['src']
r=urllib.request.urlopen(url, timeout=30)
print(r.status, r.headers['content-type'])
"
```
Expected: `200 image/jpeg`

- [ ] **Step 5: Commit**

```bash
git add gallery.js
git commit -m "feat: generate gallery.js from Kat x Art album

100 photos, hotlinked. Verified clean of serial numbers and device names."
```

---

## Task 3: Gallery tab UI

**Files:**
- Modify: `index.html` — script tag (after line 879), tab bar (line ~687), pane (after `#pane-compare`, line ~864), sidebar (after `#sb-sec-era`, line ~662), CSS (near `.empty`, line ~203), JS (near `renderGear`, line ~2405), `switchTab()` (line ~1768), `initChips()` (line ~1055)

**Interfaces:**
- Consumes: `GALLERY_ALBUMS`, `GALLERY_PHOTOS` from Task 2
- Produces:
  - `renderGallery()` — guarded by `galleryBuilt`
  - `openPhotoModal(photo)` — reuses `#recipe-modal`
  - `galleryAlbumFilter` — `Set` of active album ids

**Critical:** `openRecipeModal()` at `index.html:1117` looks up recipes via
`activeRecipes().find()` and calls `makeCard()`. It cannot display a photo. Add
a **separate** `openPhotoModal()` that reuses the same modal element. Do not
modify `openRecipeModal()`.

There is no JS test framework. Verification is by browser, specified in Step 6.

- [ ] **Step 1: Add the script tag**

In `index.html`, after line 879 (`<script src="gear.js"></script>`):

```html
<script src="gallery.js"></script>
```

- [ ] **Step 2: Add the tab and pane**

In `.tabs` (line ~687), after the Compare tab:

```html
      <div class="tab" data-tab="gallery">Gallery</div>
```

After `#pane-compare`'s closing `</div>` (line ~864), before `</div><!-- .content-scroll -->`:

```html
  <!-- GALLERY -->
  <div class="pane pane-no-subtabs" id="pane-gallery">
    <div id="gallery-body"></div>
  </div>
```

- [ ] **Step 3: Add the sidebar album section**

After the `#sb-sec-era` section (line ~662):

```html
    <div class="sb-section" id="sb-sec-album" style="display:none">
      <div class="sb-label">Album</div>
      <div class="chips" id="f-album"></div>
    </div>
```

- [ ] **Step 4: Add CSS**

Near `.empty` (line ~203):

```css
.gal-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));padding:4px 0}
.gal-item{position:relative;border-radius:var(--r2);overflow:hidden;background:var(--surf2);cursor:zoom-in;border:1px solid var(--border)}
.gal-item img{display:block;width:100%;height:100%;object-fit:cover;transition:opacity .25s;opacity:0}
.gal-item img.loaded{opacity:1}
.gal-item.dead{display:flex;align-items:center;justify-content:center;min-height:140px;color:var(--text3);font-size:11px;cursor:default}
.gal-item.dead img{display:none}
.gal-credit{text-align:center;color:var(--text3);font-size:11px;padding:18px 0 8px}
.gal-count{color:var(--text3);font-size:12px;padding:0 0 10px}
#rmodal-body .gal-photo{display:block;width:100%;height:auto;background:var(--surf2)}
#rmodal-body .gal-meta{padding:10px 14px;color:var(--text2);font-size:12px;text-align:center;line-height:1.7}
@media(max-width:680px){.gal-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}}
```

- [ ] **Step 5: Add the render functions**

In `index.html`, immediately before `function renderGear()` (line ~2406):

```js
// ══════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════
let galleryBuilt = false
let galleryAlbumFilter = new Set()

function galleryPhotos() {
  const all = (typeof GALLERY_PHOTOS !== 'undefined') ? GALLERY_PHOTOS : []
  if (!galleryAlbumFilter.size) return all
  return all.filter(p => galleryAlbumFilter.has(p.album))
}

function photoCaption(p) {
  return [p.camera, p.lens, p.aperture, p.shutter, p.iso && ('ISO ' + p.iso)]
    .filter(Boolean).join(' · ')
}

// Photos cannot go through openRecipeModal() — that looks up a recipe by name
// and builds a recipe card. This reuses the same modal shell only.
function openPhotoModal(p) {
  const modal = $('recipe-modal')
  const body  = $('rmodal-body')
  body.innerHTML = ''
  const img = document.createElement('img')
  img.className = 'gal-photo'
  img.src = p.src
  img.alt = photoCaption(p) || 'Photograph'
  if (p.w && p.h) img.style.aspectRatio = p.w + ' / ' + p.h
  const meta = document.createElement('div')
  meta.className = 'gal-meta'
  meta.textContent = photoCaption(p) || ''
  body.appendChild(img)
  body.appendChild(meta)
  modal.classList.add('open')
  modal.scrollTop = 0
}

function renderGalleryGrid() {
  const grid = $('gal-grid')
  if (!grid) return
  grid.innerHTML = ''
  const photos = galleryPhotos()
  const countEl = $('gal-count')
  if (countEl) countEl.textContent = photos.length + ' photo' + (photos.length === 1 ? '' : 's')

  photos.forEach(p => {
    const cell = document.createElement('div')
    cell.className = 'gal-item'
    if (p.w && p.h) cell.style.aspectRatio = p.w + ' / ' + p.h
    const img = document.createElement('img')
    img.loading = 'lazy'
    img.alt = photoCaption(p) || 'Photograph'
    img.src = p.thumb
    img.addEventListener('load', () => img.classList.add('loaded'))
    img.addEventListener('error', () => {
      cell.classList.add('dead')
      cell.textContent = 'unavailable'
      cell.style.aspectRatio = ''
    })
    cell.appendChild(img)
    cell.addEventListener('click', () => {
      if (!cell.classList.contains('dead')) openPhotoModal(p)
    })
    grid.appendChild(cell)
  })
}

function renderGallery() {
  if (galleryBuilt) return
  galleryBuilt = true
  const container = $('gallery-body')
  container.innerHTML = ''

  const photos = (typeof GALLERY_PHOTOS !== 'undefined') ? GALLERY_PHOTOS : []
  if (!photos.length) {
    container.innerHTML = '<div class="empty"><div class="big">🖼️</div>' +
      '<p>No gallery data yet. Run <strong>python3 tools/build_gallery.py</strong> ' +
      'or use the <strong>/gallery</strong> skill to add a Lightroom album.</p></div>'
    return
  }

  const wrap = document.createElement('div')
  wrap.innerHTML = '<div class="gal-count" id="gal-count"></div>' +
                   '<div class="gal-grid" id="gal-grid"></div>' +
                   '<div class="gal-credit">© Jin Qian</div>'
  container.appendChild(wrap)
  renderGalleryGrid()
}
```

- [ ] **Step 6: Wire the tab, sidebar, and album chips**

In `switchTab()` (line ~1768), after the `if(id==='insights')` line:

```js
  if(id==='gallery') renderGallery()
```

In the same function, the sidebar recipe facets must hide on the Gallery tab.
After the `toggleEl` lines near the top of `switchTab()`:

```js
  // Recipe facets are meaningless for photos; the album facet is Gallery-only.
  const isGal = id === 'gallery'
  ;['sb-sec-sim','sb-sec-era','sb-sec-type','sb-sec-hue'].forEach(sid => {
    const el = document.getElementById(sid); if (el && isGal) el.style.display = 'none'
  })
  document.querySelectorAll('.sidebar .sb-section').forEach(sec => {
    if (sec.id === 'sb-sec-album') return
    sec.style.display = isGal ? 'none' : ''
  })
  const albSec = document.getElementById('sb-sec-album')
  if (albSec) albSec.style.display = isGal ? '' : 'none'
  if (!isGal) initChips()
```

Then add album chip building. Immediately after `renderGallery()`'s definition:

```js
function buildAlbumChips() {
  const el = $('f-album')
  if (!el) return
  el.innerHTML = ''
  const albums = (typeof GALLERY_ALBUMS !== 'undefined') ? GALLERY_ALBUMS : []
  albums.forEach(a => {
    const c = document.createElement('div')
    c.className = 'chip'
    c.textContent = a.label + ' (' + a.count + ')'
    c.addEventListener('click', () => {
      galleryAlbumFilter.has(a.id) ? galleryAlbumFilter.delete(a.id)
                                   : galleryAlbumFilter.add(a.id)
      c.classList.toggle('on')
      renderGalleryGrid()
    })
    el.appendChild(c)
  })
}
```

Call `buildAlbumChips()` at the end of `renderGallery()`, just before its
closing brace, after `renderGalleryGrid()`.

- [ ] **Step 7: Verify in the browser**

Run: `python3 -m http.server 8000 --bind 127.0.0.1`

Then check each of these at `http://127.0.0.1:8000/`:

1. Gallery tab appears sixth in the bar and opens
2. 100 photos render; images fade in as they load
3. Sidebar shows only "Album" on this tab; recipe facets are hidden
4. Clicking the album chip filters; count updates; clicking again restores
5. Clicking a photo opens the modal with the larger image and a caption reading
   `X-M5 · XF23mm f/2.8 R WR · f/5.6 · 1/80 · ISO 3200`
6. Modal closes via ✕, backdrop click, and Escape
7. Switch to Recipes → sidebar facets return; Explore, Compare, Insights, My all
   still work
8. Switch recipe family V → OM → V; no console errors; Gallery unaffected
9. Resize to ≤680px: grid goes narrow-column, tab bar scrolls

- [ ] **Step 8: Verify the broken-image path**

Temporarily corrupt one URL:
```bash
python3 - <<'PY'
import re
s = open('gallery.js').read()
i = s.index('"thumb": "')
open('gallery.js','w').write(s[:i+10] + 'https://lightroom.adobe.com/BROKEN' + s[s.index('"', i+10):])
PY
```
Reload the Gallery tab. Expected: exactly one cell reads "unavailable"; the
other 99 render normally; no console errors.

Then restore: `python3 tools/build_gallery.py`

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: add Gallery tab backed by Lightroom albums

Sixth top-level tab. Lazy-loaded thumbnail grid, album filter chips,
per-photo EXIF caption in the existing recipe modal shell, and a
placeholder for photos whose hotlink has gone dead."
```

---

## Task 4: `/gallery` skill

**Files:**
- Create: `.claude/skills/gallery/SKILL.md`
- Create: `docs/skills/gallery.md`

**Interfaces:**
- Consumes: `tools/build_gallery.py` (Task 1), `gallery.js` (Task 2)
- Produces: nothing consumed by later tasks

Follow the existing `.claude/skills/sync-recipes/SKILL.md` layout exactly:
frontmatter with `name` / `description` / `trigger`, numbered steps, closing
Rules section.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/gallery/SKILL.md`:

```markdown
---
name: gallery
description: Review the photo gallery and add or remove Lightroom albums through conversation. Regenerates gallery.js via tools/build_gallery.py.
trigger: /gallery
---

# /gallery

Review the current photo gallery and manage which Adobe Lightroom shared albums
appear on the site. All changes go through `tools/build_gallery.py` — never
hand-edit `gallery.js`.

## Background

Photos are **hotlinked** from public Lightroom shares, not stored in the repo.
Adobe blocks browser JS from reading album contents (HTTP 403 cross-origin), so
the photo list is generated at author time and committed.

The album list lives in the `ALBUMS` constant at the top of
`tools/build_gallery.py`. That list is the source of truth.

## What you must do when invoked

### Step 1 — Report current state

Read `gallery.js` and the `ALBUMS` list in `tools/build_gallery.py`. For each
album, check it is still reachable:

```bash
curl -sS -o /dev/null -w "%{http_code}" \
  "https://lightroom.adobe.com/v2c/spaces/<SPACE_ID>"
```

200 means reachable; 403 or 404 means the share is private or deleted.

Print:

```
Gallery: N albums, M photos

  1. <label>    <count> photos   <earliest date>   ✓ reachable
  2. <label>    <count> photos   <earliest date>   ✗ UNREACHABLE

What would you like to do — add an album, remove one, or refresh?
```

If any album is unreachable, say so plainly and note that those photos are
currently broken on the live site.

If an album has `"metadata": false`, warn that its captions will be empty and
that the fix is to enable "Show Metadata" in Lightroom's share settings.

### Step 2 — Handle the request

**Add an album.** Ask for the Lightroom share link. Extract the 32-character
space ID from a URL of the form
`https://lightroom.adobe.com/shares/<SPACE_ID>`.

Verify it is public **before** changing any file:

```bash
curl -sS "https://lightroom.adobe.com/v2c/spaces/<SPACE_ID>" | tail -c +12
```

Check the JSON has `"private": false`. If it is private or the request fails,
refuse and tell the user to make the share public first. Do not edit anything.

Report what was found (photo count, date range, whether metadata is on), then
ask for a display label. Add the entry to `ALBUMS` in
`tools/build_gallery.py`, then go to Step 3.

**Remove an album.** Ask which number. Confirm the photo count being dropped:

> Remove "<label>" (<count> photos)? The photos stay in Lightroom — only the
> site stops showing them.

On confirmation, delete that entry from `ALBUMS`, then go to Step 3.

**Refresh.** Skip straight to Step 3.

### Step 3 — Regenerate

Run:

```bash
python3 tools/build_gallery.py
```

If it exits non-zero it aborted without writing — report the error and stop. Do
not attempt to hand-write `gallery.js`.

Verify no private fields leaked:

```bash
grep -cE 'SerialNumber|MacBook|DSCF|sha256|importedBy|CreatorTool' gallery.js
```

Must print `0`. If not, stop and report a bug in `photo_from_asset()`.

### Step 4 — Report the diff

Compare against the counts from Step 1 and print:

```
  <label>: <old> → <new> photos (+N)
```

Then tell the user to review the Gallery tab locally before committing:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

### Step 5 — Offer to commit

Ask whether to commit `gallery.js` (and `tools/build_gallery.py` if the album
list changed). Do not push. Do not use the `gh` CLI — it is authenticated to a
different GitHub account on this machine.

## Rules

- Never hand-edit `gallery.js` — it is generated and edits are overwritten
- Never add an album that is not publicly reachable
- Never enable `location` on a Lightroom share (that is GPS)
- Warn when an album has metadata disabled — captions will be empty
- Never write a partial manifest — if the script aborts, stop
- Never download or commit image files; photos are hotlinked
- Do not modify `index.html` — this skill only touches the album list and the
  generated manifest
- Do not use the `gh` CLI in this repo
```

- [ ] **Step 2: Mirror to docs/**

Copy the same content to `docs/skills/gallery.md`, matching how
`docs/skills/sync-recipes.md` mirrors its skill.

```bash
cp .claude/skills/gallery/SKILL.md docs/skills/gallery.md
```

- [ ] **Step 3: Verify the skill is discoverable**

Run: `ls .claude/skills/gallery/SKILL.md docs/skills/gallery.md`
Expected: both listed.

Confirm the frontmatter parses — the first line must be exactly `---` and the
block must contain `name`, `description`, and `trigger` keys.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/gallery/SKILL.md docs/skills/gallery.md
git commit -m "feat: add /gallery skill for managing Lightroom albums

Conversational add/remove/refresh/health-check over the album list.
Drives tools/build_gallery.py rather than reimplementing it."
```

---

## Task 5: Documentation

**Files:**
- Modify: `CLAUDE.md` — Overview, tab table, Key functions, Skills, What NOT to commit

**Interfaces:**
- Consumes: everything above
- Produces: nothing

- [ ] **Step 1: Update the tab table**

In the Tabs section, add a row after Compare:

```markdown
| Gallery | `gallery` | — (`pane-no-subtabs`) | `renderGallery()` |
```

- [ ] **Step 2: Add a Gallery section**

After the `om-analysis.js` section:

```markdown
## Gallery

The Gallery tab shows Jin's own photographs, **hotlinked from public Adobe
Lightroom shared albums** — no image files are committed for the gallery.

- `tools/build_gallery.py` — author-time script. Reads Lightroom's public album
  API server-side and writes `gallery.js`. Python 3 stdlib only.
- `gallery.js` — **generated; never hand-edit.** Defines `GALLERY_ALBUMS` and
  `GALLERY_PHOTOS` as plain globals, like `gear.js`.
- `/gallery` skill — conversational add/remove/refresh of albums.

**Why a build step exists here** despite the "no build" rule: Adobe blocks
browser JS from reading album contents (HTTP 403 cross-origin) while allowing
`<img>` hotlinks. The photo list therefore cannot be fetched at runtime. The
**site** remains buildless — `gallery.js` is a plain `<script src>` global and
GitHub Pages serves everything as-is.

**Privacy:** `photo_from_asset()` uses an allowlist. Lightroom's public API
exposes the camera body `SerialNumber`, the editing machine name, and original
filenames; none are copied into `gallery.js`. Do not convert this to a
blocklist.

**Dependency:** the gallery breaks if the Adobe subscription lapses or a share
is made private. The `/gallery` health check surfaces this. The manifest shape
is hosting-agnostic, so switching to repo-hosted files would change
`build_gallery.py` and the `thumb`/`src` values, not the renderer.

Key functions in `index.html`: `renderGallery()` (guarded by `galleryBuilt`),
`renderGalleryGrid()`, `buildAlbumChips()`, `photoCaption(p)`, and
`openPhotoModal(p)` — which reuses the `#recipe-modal` shell but is **separate
from** `openRecipeModal()`, since that one looks up recipes by name and builds a
recipe card.
```

- [ ] **Step 3: Register the skill**

In the Skills section, after `/update-harness`:

```markdown
- **`/gallery`** — Review the photo gallery and add or remove Lightroom albums through conversation. Regenerates `gallery.js`.
```

- [ ] **Step 4: Note the generated file**

In "What NOT to commit", extend the closing note:

```markdown
Note: `recipes-v.js`, `recipes-iv.js`, `recipes-iii.js`, `recipes-ii.js`, `recipes-i.js`, `recipes-om.js`, `om-analysis.js`, and `gallery.js` are **committed** to the repo — they are not gitignored. Do not add them to `.gitignore`. `gallery.js` is generated by `tools/build_gallery.py`; commit it, but never hand-edit it.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document Gallery tab, build script, and /gallery skill"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Build script, allowlist, rational conversion | 1 |
| Abort-without-writing on unreachable album | 1 (`main()`) |
| Generated manifest shape | 1–2 |
| Only 2 of 4 renditions stored | 1 (`photo_from_asset`) |
| Gallery tab, grid, lazy loading, aspect ratio | 3 |
| Detail modal reusing `#recipe-modal` | 3 |
| Per-photo caption | 3 |
| Album filter chips | 3 |
| `© Jin Qian` credit | 3 |
| Empty state when `gallery.js` missing | 3 |
| Dead-image placeholder | 3 (Steps 5, 8) |
| Recipe facets hidden on Gallery tab | 3 (Step 6) |
| `/gallery` add/remove/refresh/review | 4 |
| Skill rules incl. refuse-private, metadata warning | 4 |
| Manual test plan (8 items) | 3 (Steps 7–8), 2 (Steps 2–4) |
| Serial number never republished | 1 (test), 2 (Step 2), 4 (Step 3) |

No spec requirement is unassigned.

**Placeholder scan:** No TBD/TODO. Every code step carries real code. The one
judgement call left to the implementer — where exactly to insert each block in
`index.html` — is given as line numbers plus an anchor string.

**Type consistency:** `photo_from_asset()` emits `album, thumb, src, w, h, date,
camera, lens, aperture, shutter, iso, focal`; Task 3 reads exactly those keys.
`GALLERY_ALBUMS` entries emit `id, label, count, metadata`; `buildAlbumChips()`
reads `id`, `label`, `count`, and the skill reads `metadata`. Module name is
`build_gallery.py` (underscore) consistently in the test import, all run
commands, the skill, and the docs.

**Naming note:** the script is `tools/build_gallery.py` (underscore) throughout,
because hyphenated module names cannot be imported by the test. The spec was
updated to match, so the two documents agree.
